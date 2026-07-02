"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import type { BookingFormData, EventVenue } from "@/lib/types"
import { ChevronLeft, ChevronRight, Sun, Sunset, Moon, Minus, Plus, AlertTriangle, Timer, XCircle } from "lucide-react"
import { VendorAPI } from "@/lib/api/vendors"
import api from "@/lib/axiosConfig"
// Capacity-aware slot-template availability (BK-008/015/019). Flag-gated:
// when the vendor has configured slot templates we drive the picker from
// them (their own slots + per-slot capacity) instead of the fixed
// Morning/Afternoon/Evening periods. Falls back when none configured.
import { BusinessAvailabilityAPI, type SlotAvailabilityRow } from "@/lib/api/businessAvailability"
// BK-100.53 — service-location mode picker (optional; lets the
// customer specify mehndi-at-home / marquee-at-plot / Nikah-at-masjid).
import { ServiceLocationPicker } from "@/components/booking/service-location-picker"

interface Props {
  formData: BookingFormData
  updateFormData: React.Dispatch<React.SetStateAction<BookingFormData>>
  venue?: EventVenue | null
  timeRemaining: number
  isHolding: boolean
  holdFailed: boolean
  holdFailedUntil: Date | null
  createHold: (businessId: number, date: string, time: string) => Promise<void>
  releaseHold: () => Promise<void>
}

type DayAvailability = {
  bookedSlots: string[]
  availableSlots: string[]
  heldSlots?: string[]
  isBlocked?: boolean
  blockReason?: string
}

// Issue #46 — shift hints use a plain "X to Y" format (per user
// preference) instead of the en-dash version, which Pakistani vendors
// were reading as a different symbol on some screens.
const PERIODS = [
  { value: "09:00", label: "Morning",   hint: "9 AM to 12 PM",  icon: Sun },
  { value: "14:00", label: "Afternoon", hint: "2 PM to 6 PM",   icon: Sunset },
  { value: "18:00", label: "Evening",   hint: "6 PM to 11 PM",  icon: Moon },
] as const

// Flag-gated rollout of the vendor-configured slot engine. Default OFF =
// the fixed Morning/Afternoon/Evening behaviour below, byte-for-byte unchanged.
const SLOT_TEMPLATES_ENABLED = process.env.NEXT_PUBLIC_SLOT_TEMPLATES === "1"
// Venue compliance soft-warnings (one-dish / guest-cap / closing-time). Default OFF.
const VENUE_COMPLIANCE_ENABLED = process.env.NEXT_PUBLIC_VENUE_COMPLIANCE === "1"

const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"]
const WEEKDAY_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const MONTHS_FULL = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
/**
 * Build the grid of dates for a given month, 6 rows × 7 columns. Includes
 * trailing days from the previous month and leading days from the next so
 * the grid is always rectangular (Airbnb / Booking.com pattern).
 */
function buildMonthGrid(viewMonth: Date): Date[] {
  const first = startOfMonth(viewMonth)
  const startDayOfWeek = first.getDay() // 0 = Sun
  const gridStart = addDays(first, -startDayOfWeek)
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

function toKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

function startOfDay(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function addDays(d: Date, n: number) {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

function sameDay(a?: Date, b?: Date) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function DateTimeStep({
  formData,
  updateFormData,
  venue,
  timeRemaining,
  isHolding,
  holdFailed,
  holdFailedUntil,
  createHold,
  releaseHold,
}: Props) {
  const today = startOfDay(new Date())

  // The month currently shown in the calendar grid. Defaults to today's month
  // (or the selected booking month if the user already has one).
  const initialViewMonth = (() => {
    if (formData.bookingDate) {
      const d = new Date(formData.bookingDate)
      if (!isNaN(d.getTime())) return startOfMonth(d)
    }
    return startOfMonth(today)
  })()
  const [viewMonth, setViewMonth] = useState<Date>(initialViewMonth)

  const selectedDate: Date | undefined = useMemo(() => {
    if (!formData.bookingDate) return undefined
    const d = new Date(formData.bookingDate)
    return isNaN(d.getTime()) ? undefined : d
  }, [formData.bookingDate])

  // Bookable spaces (halls/lawns/partitions) the venue configured. Additive:
  // when a venue has >1 space, the customer picks WHICH one; the chosen
  // resourceId rides the booking payload → pins the booking to that space and
  // shows in the vendor's Bookings "Space" column. Venues with 0 spaces are
  // completely unaffected (the picker doesn't render).
  const [spaces, setSpaces] = useState<Array<{ id: number; label: string; kind?: string }>>([])
  useEffect(() => {
    if (!venue?.id) return
    let cancelled = false
    api.get(`/api/v1/businesses/${venue.id}/resources`)
      .then((r) => { if (!cancelled) setSpaces((r?.data?.data || []).filter((x: any) => x && x.isActive !== false).map((x: any) => ({ id: x.id, label: x.label, kind: x.kind }))) })
      .catch(() => { if (!cancelled) setSpaces([]) })
    return () => { cancelled = true }
  }, [venue?.id])

  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({})
  const fetchMonth = useCallback(async (d: Date) => {
    if (!venue?.id) return
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    try {
      const data = await VendorAPI.getMonthAvailability([venue.id], m)
      setAvailability((prev) => ({ ...prev, ...(data[venue.id] || {}) }))
    } catch { /* silent */ }
  }, [venue?.id])

  // Prefetch the visible month + the next month (so leading days from next
  // month already have availability when shown in the grid edges).
  useEffect(() => {
    fetchMonth(viewMonth)
    fetchMonth(addMonths(viewMonth, 1))
  }, [viewMonth, fetchMonth])

  // ── Slot-template availability (flag-gated capacity-aware engine) ──
  // Only fetched when the flag is on. If the vendor has configured slot
  // templates we drive the picker from them; otherwise we fall back to the
  // fixed periods so existing vendors are completely unaffected.
  const [templateDays, setTemplateDays] = useState<Record<string, SlotAvailabilityRow[]>>({})
  const [hasTemplates, setHasTemplates] = useState(false)
  const fetchTemplateMonth = useCallback(async (d: Date) => {
    if (!SLOT_TEMPLATES_ENABLED || !venue?.id) return
    try {
      const res = await BusinessAvailabilityAPI.getBulkAvailability(
        venue.id as number, toKey(startOfMonth(d)), toKey(endOfMonth(d)),
      )
      const days = res?.days || {}
      setTemplateDays((prev) => ({ ...prev, ...days }))
      if (Object.values(days).some((rows) => rows && rows.length > 0)) setHasTemplates(true)
    } catch { /* silent → fall back to fixed periods */ }
  }, [venue?.id])
  useEffect(() => {
    if (!SLOT_TEMPLATES_ENABLED) return
    fetchTemplateMonth(viewMonth)
    fetchTemplateMonth(addMonths(viewMonth, 1))
  }, [viewMonth, fetchTemplateMonth])
  // Drive the UI from templates only when the vendor actually has some.
  const useTemplates = SLOT_TEMPLATES_ENABLED && hasTemplates

  // Synthesise a DayAvailability from template rows so the existing calendar
  // logic (renderDayCell / handlePickDay) works unchanged for both paths.
  const templateDayAvail = useCallback((key: string): DayAvailability | undefined => {
    const rows = templateDays[key]
    if (!rows) return undefined
    const runnable = rows.filter((r) => r.runsThisWeekday)
    if (runnable.length === 0) return { bookedSlots: [], availableSlots: [], isBlocked: true, blockReason: "Closed this day" }
    const bookedSlots = runnable.filter((r) => r.blocked || r.free <= 0).map((r) => r.startTime.slice(0, 5))
    const availableSlots = runnable.filter((r) => !r.blocked && r.free > 0).map((r) => r.startTime.slice(0, 5))
    return { bookedSlots, availableSlots, isBlocked: availableSlots.length === 0 }
  }, [templateDays])
  const dayAvail = useCallback(
    (key: string): DayAvailability | undefined => (useTemplates ? templateDayAvail(key) : availability[key]),
    [useTemplates, templateDayAvail, availability],
  )

  // The 6×7 grid of dates for the visible month (Airbnb / Booking.com pattern).
  const monthGrid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth])
  const isSameMonth = useCallback(
    (d: Date) => d.getMonth() === viewMonth.getMonth() && d.getFullYear() === viewMonth.getFullYear(),
    [viewMonth]
  )
  const canGoPrevMonth = startOfMonth(today) < viewMonth

  const formatLong = (d: Date) =>
    `${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`

  const formatBookingDate = (d: Date, time: string) => {
    const [h, m] = time.split(":").map(Number)
    const c = new Date(d)
    c.setHours(h, m, 0, 0)
    return c.toISOString()
  }

  const handlePickDay = (d: Date) => {
    if (d < today) return
    const key = toKey(d)
    const a = dayAvail(key)
    if (a && (a.isBlocked || a.availableSlots.length === 0)) return
    updateFormData((prev) => ({
      ...prev,
      bookingDate: prev.timeSlot ? formatBookingDate(d, prev.timeSlot) : (d.toISOString() as any),
      // keep timeSlot if compatible; clear if booked
    }))
  }

  const selectedKey = selectedDate ? toKey(selectedDate) : null
  const selectedAvail = selectedKey ? dayAvail(selectedKey) : undefined

  const handlePickPeriod = (period: string) => {
    if (!selectedDate) return
    const a = selectedAvail
    if (a?.bookedSlots?.includes(period)) return
    if (a?.heldSlots?.includes(period)) return
    updateFormData((prev) => ({
      ...prev,
      timeSlot: period,
      slotTemplateId: null,
      bookingDate: formatBookingDate(selectedDate, period),
    }))
  }

  // Capacity-aware slot pick (template engine path). Sets slotTemplateId so the
  // backend runs the capacity-aware booking; timeSlot mirrors the start time so
  // the existing hold + validation keep working unchanged.
  const handlePickTemplate = (row: SlotAvailabilityRow) => {
    if (!selectedDate || row.blocked || row.free <= 0 || !row.runsThisWeekday) return
    const t = row.startTime.slice(0, 5)
    updateFormData((prev) => ({
      ...prev,
      timeSlot: t,
      slotTemplateId: row.slotTemplateId,
      bookingDate: formatBookingDate(selectedDate, t),
    }))
  }

  // Auto-create hold once a date+time are selected. We deliberately DO NOT
  // release the hold on unmount — that fired a bogus "Slot hold expired"
  // toast every time the user clicked Continue (component unmounts → release
  // → isHolding=false + timeRemaining=0 → booking-form's expiration watcher
  // misfired). Holds expire naturally on the server (15-min TTL) or when
  // the user picks a different date/time (the next createHold overwrites).
  useEffect(() => {
    if (!venue?.id || !selectedDate || !formData.timeSlot) return
    createHold(venue.id as any, toKey(selectedDate), formData.timeSlot).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue?.id, selectedKey, formData.timeSlot])

  // Clear time slot if hold failed
  useEffect(() => {
    if (holdFailed && formData.timeSlot) {
      updateFormData((prev) => ({ ...prev, timeSlot: "", bookingDate: undefined }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdFailed])

  // Guests. Issue #62 — switched from a denylist to an explicit
  // allowlist of vendor types that genuinely price per-guest. Asking
  // a photographer / makeup artist / florist "how many guests?" was
  // confusing — their pricing has nothing to do with guest count. The
  // allowlist is venue + headcount-pricing categories (catering, mithai,
  // wedding cakes, live cooking stalls). Default for new vendor types
  // is "don't show" so we err on the side of not asking.
  const GUEST_COUNT_VENDOR_TYPES = new Set<string>([
    "Wedding venue",
    "Catering",
    "Mithai and sweets",
    "Wedding cakes",
    "Live cooking stall",
  ]);
  const vendorTypeName = venue?.vendor?.vendorType || "";
  const isCarRental = vendorTypeName === "Car rental"
  const isBridalWear = vendorTypeName === "Bridal wearing"
  const isWeddingStationery = vendorTypeName === "Wedding Invitations and Stationery"
  const needsGuestCount = GUEST_COUNT_VENDOR_TYPES.has(vendorTypeName)
  const enforceCapacity = !!venue?.maxCapacity || !!venue?.minCapacity

  // Venue compliance soft-warnings (flag-gated, advisory only — never blocks).
  // Reads the optional limits the vendor set in Settings → Availability →
  // Compliance. Protects the owner from one-dish raids / guest-cap fines.
  const vc = venue as unknown as {
    legalGuestCap?: number | null
    eventClosingTime?: string | null
    oneDishPolicy?: boolean
  } | null
  const complianceWarnings: string[] = []
  if (VENUE_COMPLIANCE_ENABLED && vc) {
    if (vc.legalGuestCap != null && (formData.guestCount || 0) > vc.legalGuestCap)
      complianceWarnings.push(
        `Guest count (${formData.guestCount}) exceeds the legal cap of ${vc.legalGuestCap} for this venue's city — this can trigger fines or sealing.`,
      )
    if (vc.eventClosingTime && formData.timeSlot && formData.timeSlot >= vc.eventClosingTime)
      complianceWarnings.push(
        `Chosen start time (${formData.timeSlot}) is at/after the legal closing time (${vc.eventClosingTime}).`,
      )
    if (vc.oneDishPolicy)
      complianceWarnings.push(
        `One-dish policy applies here — only 1 main dish + 1 dessert may be served. Confirm the menu stays compliant.`,
      )
  }

  const adjust = (delta: number) =>
    updateFormData((prev) => {
      let n = Math.max(0, (prev.guestCount || 0) + delta)
      if (venue?.maxCapacity && n > venue.maxCapacity) n = venue.maxCapacity
      return { ...prev, guestCount: n }
    })

  /** A single day cell in the monthly grid. Airbnb-style: square, large
   *  numeral, dot indicator for partial availability. */
  const renderDayCell = (d: Date) => {
    const key = toKey(d)
    const a = dayAvail(key)
    const isPast = d < today
    const isBlocked = !!a?.isBlocked || (a && a.availableSlots.length === 0)
    const isPartial = !!a && a.bookedSlots.length > 0 && !isBlocked
    const isSelected = sameDay(d, selectedDate)
    const isToday = sameDay(d, today)
    const inMonth = isSameMonth(d)
    const disabled = isPast || isBlocked

    return (
      <button
        key={key}
        type="button"
        onClick={() => handlePickDay(d)}
        disabled={disabled}
        aria-label={`${WEEKDAY_FULL[d.getDay()]}, ${MONTHS_FULL[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}${disabled ? " (unavailable)" : ""}`}
        aria-pressed={isSelected}
        className={`
          relative h-11 sm:h-12 w-full flex flex-col items-center justify-center
          rounded-full text-center transition-all
          font-display text-[14px] sm:text-[15px] tabular-nums leading-none
          ${!inMonth ? "opacity-30" : ""}
          ${
            disabled
              ? "text-bridal-text-soft/50 cursor-not-allowed line-through decoration-1"
              : isSelected
                ? "bg-bridal-charcoal text-bridal-ivory shadow-[0_8px_22px_-10px_rgba(44,24,16,0.55)] hover:bg-bridal-charcoal"
                : isToday
                  ? "border border-bridal-gold-dark text-bridal-charcoal hover:bg-bridal-blush/45"
                  : "text-bridal-charcoal hover:bg-bridal-blush/45"
          }
        `}
      >
        <span>{d.getDate()}</span>
        {isPartial && !isSelected && (
          <span
            aria-hidden
            className="absolute bottom-1 w-1 h-1 rounded-full bg-bridal-gold"
          />
        )}
      </button>
    )
  }

  return (
    <div className="space-y-5 w-full">
      {/* Heading — homepage display italic typography */}
      <div>
        <h2 className="font-display italic text-[22px] sm:text-[24px] text-bridal-charcoal leading-tight">
          When is your event?
        </h2>
        <p className="mt-1 font-bridal text-[12.5px] text-bridal-text-soft">
          Pick a date and a time of day. We&apos;ll hold the slot for 15 minutes while you finish.
        </p>
      </div>

      {/* Calendar (left) + Time-of-day picker (right) side-by-side on
         desktop. On mobile they stack — calendar on top, slots below.
         This is the standard booking-flow layout (Airbnb, Booking.com,
         Calendly). */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

      {/* Monthly calendar — Airbnb / Booking.com pattern.
         Constrained to ~520px so the cells stay at industry-standard
         ~44-56px regardless of how wide the page container is. */}
      <section className="rounded-lg border border-bridal-beige bg-bridal-ivory p-4 sm:p-5 w-full lg:w-[520px] lg:flex-shrink-0 mx-auto sm:mx-0">
        {/* Header row: month label + prev/next */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setViewMonth((m) => (canGoPrevMonth ? addMonths(m, -1) : m))}
            disabled={!canGoPrevMonth}
            className="w-9 h-9 inline-flex items-center justify-center rounded-full text-bridal-charcoal hover:bg-bridal-blush/55 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-display italic text-[18px] sm:text-[20px] text-bridal-charcoal">
            {MONTHS_FULL[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </h3>
          <button
            type="button"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="w-9 h-9 inline-flex items-center justify-center rounded-full text-bridal-charcoal hover:bg-bridal-blush/55 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {WEEKDAY_SHORT.map((w, i) => (
            <div
              key={i}
              className="h-8 flex items-center justify-center font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-soft"
            >
              {w}
            </div>
          ))}
        </div>

        {/* 6×7 day grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {monthGrid.map((d) => renderDayCell(d))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-bridal-beige/70 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 font-bridal text-[10.5px] text-bridal-text-soft">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-bridal-gold" />
            Limited availability
          </span>
          {selectedDate && (
            <span className="font-bridal text-[12px] text-bridal-charcoal">
              <span className="font-medium text-bridal-gold-dark">Selected:</span>{" "}
              {formatLong(selectedDate)}
            </span>
          )}
        </div>
      </section>

      {/* Right column: time-of-day picker (single row) + the service-location
         picker stacked beneath it. The slots now sit on ONE line and the
         "Where will the service happen?" card fills the space beside the
         calendar instead of leaving a tall empty gap. On mobile this whole
         column drops below the calendar. */}
      <div className="w-full lg:flex-1 space-y-5">
        <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">
            Time of day
          </p>
          {!selectedDate && (
            <span className="font-bridal text-[10.5px] text-bridal-text-soft">
              Pick a date first
            </span>
          )}
        </div>
        {useTemplates && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(selectedKey ? (templateDays[selectedKey] || []).filter((r) => r.runsThisWeekday) : []).length === 0 ? (
              <p className="col-span-full font-bridal text-[12px] text-bridal-text-soft py-2">
                {selectedDate ? "No slots offered on this day." : "Pick a date to see available slots."}
              </p>
            ) : (
              (templateDays[selectedKey as string] || []).filter((r) => r.runsThisWeekday).map((row) => {
                const isSelected = formData.slotTemplateId === row.slotTemplateId
                const soldOut = row.blocked || row.free <= 0
                const disabled = !selectedDate || soldOut
                return (
                  <button
                    key={row.slotTemplateId}
                    type="button"
                    onClick={() => handlePickTemplate(row)}
                    disabled={disabled}
                    className={`relative flex flex-col items-start gap-1.5 p-3 lg:p-4 rounded-md border text-left transition-all
                      ${disabled
                        ? "border-bridal-beige bg-bridal-ivory text-bridal-text-soft/50 cursor-not-allowed"
                        : isSelected
                          ? "border-bridal-gold-dark bg-bridal-cream shadow-[0_8px_22px_-14px_rgba(176,125,84,0.45)] text-bridal-charcoal"
                          : "border-bridal-beige bg-bridal-ivory hover:border-bridal-gold/55 hover:bg-bridal-cream text-bridal-charcoal"
                      }`}
                  >
                    <div className="min-w-0 w-full">
                      <p className="font-display italic text-[15px] leading-tight">{row.label}</p>
                      <p className="font-bridal text-[10.5px] text-bridal-text-soft mt-0.5">
                        {row.startTime.slice(0, 5)} – {row.endTime.slice(0, 5)}
                      </p>
                    </div>
                    {soldOut ? (
                      <span className="shrink-0 px-1.5 py-0.5 rounded font-bridal text-[8.5px] uppercase tracking-[0.1em] font-medium bg-bridal-coral/15 text-bridal-coral border border-bridal-coral/40">
                        {row.blocked ? "Blocked" : "Full"}
                      </span>
                    ) : (
                      <span className="shrink-0 font-bridal text-[10px] font-medium text-bridal-gold-dark">
                        {row.free} of {row.capacity} left
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        )}
        {!useTemplates && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PERIODS.map((p) => {
            const isSelected = formData.timeSlot === p.value
            const isBooked = selectedAvail?.bookedSlots?.includes(p.value) ?? false
            const isHeld = selectedAvail?.heldSlots?.includes(p.value) ?? false
            const disabled = !selectedDate || isBooked || isHeld
            const Icon = p.icon
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePickPeriod(p.value)}
                disabled={disabled}
                className={`relative flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-1.5 p-3 lg:p-4 rounded-md border text-left transition-all
                  ${disabled
                    ? "border-bridal-beige bg-bridal-ivory text-bridal-text-soft/50 cursor-not-allowed"
                    : isSelected
                      ? "border-bridal-gold-dark bg-bridal-cream shadow-[0_8px_22px_-14px_rgba(176,125,84,0.45)] text-bridal-charcoal"
                      : "border-bridal-beige bg-bridal-ivory hover:border-bridal-gold/55 hover:bg-bridal-cream text-bridal-charcoal"
                  }`}
              >
                <span
                  className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full ${
                    isSelected
                      ? "bg-bridal-gold/20"
                      : disabled
                        ? "bg-bridal-beige/40"
                        : "bg-bridal-blush/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? "text-bridal-gold-dark" : disabled ? "" : "text-bridal-mauve"}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display italic text-[15px] leading-tight">{p.label}</p>
                  <p className="font-bridal text-[10.5px] text-bridal-text-soft mt-0.5">{p.hint}</p>
                </div>
                {isBooked && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded font-bridal text-[8.5px] uppercase tracking-[0.1em] font-medium bg-bridal-coral/15 text-bridal-coral border border-bridal-coral/40">
                    Booked
                  </span>
                )}
                {isHeld && !isBooked && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded font-bridal text-[8.5px] uppercase tracking-[0.1em] font-medium bg-bridal-gold/15 text-bridal-gold-dark border border-bridal-gold/45">
                    On hold
                  </span>
                )}
              </button>
            )
          })}
        </div>
        )}
        </section>

        {/* BK-100.53 — service-location picker, pulled up beside the calendar
           so the single-row time picker doesn't leave a tall empty gap.
           Optional; collapsed by default (empty mode). When the vendor type
           strongly suggests a mode it surfaces a "Suggested" chip without
           forcing the choice. */}
        <ServiceLocationPicker
          mode={formData.serviceLocationMode}
          address={formData.serviceLocationAddress}
          notes={formData.serviceLocationNotes}
          vendorType={venue?.vendor?.vendorType}
          onChange={(next) =>
            updateFormData((prev) => ({
              ...prev,
              serviceLocationMode: next.mode,
              serviceLocationAddress: next.address,
              serviceLocationNotes: next.notes,
            }))
          }
        />

        {/* Which hall / lawn / partition? Only shown when the venue configured
           bookable spaces. Optional — "whole venue" leaves it unpinned. */}
        {spaces.length > 0 && (
          <section className="space-y-2">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">
              Which space?
            </p>
            <select
              value={(formData as any).selectedResourceId || ""}
              onChange={(e) =>
                updateFormData((prev) => ({ ...(prev as any), selectedResourceId: e.target.value }))
              }
              className="w-full rounded-md border border-bridal-beige bg-bridal-ivory px-3 py-2.5 font-bridal text-[13px] text-bridal-charcoal outline-none focus:border-bridal-gold-dark"
            >
              <option value="">Whole venue / any space</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}{s.kind ? ` — ${s.kind}` : ""}
                </option>
              ))}
            </select>
            <p className="font-bridal text-[10.5px] text-bridal-text-soft">
              Pick a specific hall, lawn or partition, or leave as the whole venue.
            </p>
          </section>
        )}
      </div>{/* end right column */}

      </div>{/* end calendar+slots row */}

      {/* Venue compliance advisory (soft — never blocks the booking) */}
      {complianceWarnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-300 px-3 py-2 font-bridal text-[12px] text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">Compliance check</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {complianceWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Status messages */}
      {holdFailed && (
        <div className="flex items-start gap-2 rounded-md bg-bridal-coral/15 border border-bridal-coral/40 px-3 py-2 font-bridal text-[12px] text-bridal-coral">
          <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            That slot was just reserved by another customer.
            {holdFailedUntil && (
              <> Held until {holdFailedUntil.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.</>
            )} Please pick another time.
          </p>
        </div>
      )}
      {selectedAvail?.isBlocked && (
        <div className="flex items-start gap-2 rounded-md bg-bridal-beige/40 border border-bridal-beige px-3 py-2 font-bridal text-[12px] text-bridal-charcoal/80">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            <span className="font-display italic text-[14px] text-bridal-charcoal">Vendor not available this day.</span>{" "}
            {selectedAvail.blockReason || "Pick a different date."}
          </p>
        </div>
      )}
      {isHolding && timeRemaining > 0 && timeRemaining < 9999 && (
        <div className="flex items-center gap-2 rounded-md bg-bridal-sage/15 border border-bridal-sage/40 px-3 py-2 font-bridal text-[12px] text-[#3F6B43]">
          <Timer className="w-3.5 h-3.5 shrink-0" />
          <span>
            Slot reserved for{" "}
            <span className="font-display italic text-[14px] tabular-nums">
              {String(Math.floor(timeRemaining / 60)).padStart(2, "0")}:
              {String(timeRemaining % 60).padStart(2, "0")}
            </span>
          </span>
        </div>
      )}

      {/* Guest count — inline stepper. Issue #62: shown only for the
          vendor types that genuinely price per-guest (see allowlist
          above) AND when the venue has set min/max capacity. */}
      {needsGuestCount && enforceCapacity && (
        <section className="pt-3 border-t border-bridal-beige/70">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display italic text-[15px] text-bridal-charcoal leading-tight">How many guests?</p>
              {(venue?.minCapacity || venue?.maxCapacity) && (
                <p className="font-bridal text-[10.5px] text-bridal-text-soft mt-0.5">
                  {venue?.minCapacity ? `Min ${venue.minCapacity}` : ""}
                  {venue?.minCapacity && venue?.maxCapacity ? " · " : ""}
                  {venue?.maxCapacity ? `Max ${venue.maxCapacity}` : ""}
                </p>
              )}
            </div>
            <div className="inline-flex items-center gap-0.5 rounded-md border border-bridal-beige bg-bridal-cream p-0.5">
              <button
                type="button"
                onClick={() => adjust(-10)}
                className="w-8 h-8 inline-flex items-center justify-center rounded text-bridal-charcoal hover:bg-bridal-blush/55 active:scale-95 transition-all"
                aria-label="Decrease guests"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={0}
                value={formData.guestCount || ""}
                onChange={(e) => {
                  const val = e.target.value
                  let n = val === "" ? 0 : parseInt(val, 10)
                  if (venue?.maxCapacity && n > venue.maxCapacity) n = venue.maxCapacity
                  updateFormData((prev) => ({ ...prev, guestCount: n }))
                }}
                placeholder="10"
                className="w-12 text-center font-display italic text-[18px] tabular-nums text-bridal-charcoal bg-transparent border-0 outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => adjust(10)}
                className="w-8 h-8 inline-flex items-center justify-center rounded text-bridal-charcoal hover:bg-bridal-blush/55 active:scale-95 transition-all"
                aria-label="Increase guests"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* (Service-location picker moved up into the right column beside the
          calendar — see the "right column" block above.) */}
    </div>
  )
}
