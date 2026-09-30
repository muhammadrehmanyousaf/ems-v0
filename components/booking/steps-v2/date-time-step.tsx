"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import type { BookingFormData, EventVenue } from "@/lib/types"
import { ChevronLeft, ChevronRight, Sun, Sunset, Moon, Minus, Plus, Check, MapPin } from "lucide-react"
import { VendorAPI } from "@/lib/api/vendors"
import api from "@/lib/axiosConfig"
// Capacity-aware slot-template availability (BK-008/015/019). Flag-gated:
// when the vendor has configured slot templates we drive the picker from
// them (their own slots + per-slot capacity) instead of the fixed
// Morning/Afternoon/Evening periods. Falls back when none configured.
import { BusinessAvailabilityAPI, type SlotAvailabilityRow } from "@/lib/api/businessAvailability"
// BK-100.53 — service-location mode picker (optional; lets the
// customer specify mehndi-at-home / marquee-at-plot / Nikah-at-masjid).
import {
  ServiceLocationPicker,
  SERVICE_LOCATION_SHORT_LABELS,
  serviceLocationNeedsAddress,
  type ServiceLocationMode,
} from "@/components/booking/service-location-picker"
// The shell contract: scroll-into-view, tier and live announcements come from
// the shell; the notice rail bounds advisories; the desk sheet hosts the
// service-location picker.
import { useBookingShell } from "@/components/booking/shell/booking-shell-context"
import NoticeRail, { type NoticeLine } from "@/components/booking/shell/notice-rail"
import DeskSheet from "@/components/booking/shell/desk-sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// F-2 — canonical sub-venue (venue-hierarchy) picker for the customer flow.
import { venueSpacesApi, type SubVenueNode } from "@/lib/api/venueSpaces"
// SLOTS step 10 — the single slot vocabulary.
import { LEGACY_PERIODS, formatSlotRange } from "@/lib/booking/slot-vocabulary"
// 10.13 / 10.16 — the arrangement a family needs, and rain on an open lawn.
// A mirror of src/utils/spaceRequirements.js, held to it by
// scripts/space-fit-parity.mts. The server re-runs the same check at booking
// time and its answer is authoritative; this only says the same thing earlier,
// while the customer can still pick a different hall.
import {
  ARRANGEMENT_CHOICES,
  checkGenderFit,
  describeBackupPlan,
} from "@/lib/booking/space-fit"

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

// SLOTS step 10 — the names and hours come from the one shared definition
// (lib/booking/slot-vocabulary). Only the icon is local, because an icon is
// presentation and does not belong in a module the success screens import.
//
// Issue #46 — hints use a plain "X to Y" format rather than an en-dash, which
// Pakistani vendors were reading as a different symbol. That rule now lives in
// formatSlotRange and applies everywhere, not just here.
const PERIOD_ICON: Record<string, typeof Sun> = {
  "09:00": Sun,
  "14:00": Sunset,
  "18:00": Moon,
}
const PERIODS = LEGACY_PERIODS.map((p) => ({
  value: p.value,
  label: p.label,
  hint: formatSlotRange(p.startTime, p.endTime),
  icon: PERIOD_ICON[p.value] ?? Sun,
}))

// Flag-gated rollout of the vendor-configured slot engine. Default OFF =
// the fixed Morning/Afternoon/Evening behaviour below, byte-for-byte unchanged.
const SLOT_TEMPLATES_ENABLED = true
// Venue compliance soft-warnings (one-dish / guest-cap / closing-time). Default OFF.
const VENUE_COMPLIANCE_ENABLED = true

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

/**
 * A list of choices, the way the vendors step lists vendors: one row each,
 * the name, a hint, and a tick on the one that is chosen. Used inside a
 * sheet for the hall and the arrangement, so the step itself never shows a
 * dropdown.
 */
function ChoiceList({
  options,
  value,
  onPick,
}: {
  options: { value: string; label: string; hint?: string }[]
  value: string
  onPick: (value: string) => void
}) {
  return (
    <div className="space-y-2" role="listbox" aria-label="Choices">
      {options.map((o, i) => {
        const on = o.value === value
        return (
          <button
            key={o.value || "__none"}
            type="button"
            role="option"
            aria-selected={on}
            onClick={() => onPick(o.value)}
            style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
            className={`flex min-h-14 w-full items-center gap-3 rounded-[4px] border px-4 py-2 text-left transition-colors duration-150 motion-safe:animate-stagger-fade-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 ${
              on ? "border-bridal-gold-dark bg-bridal-cream" : "border-bridal-beige bg-white hover:bg-bridal-blush/45"
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="block whitespace-pre font-bridal text-[15px] leading-5 text-bridal-charcoal">{o.label}</span>
              {o.hint && <span className="block font-bridal text-[12px] leading-4 text-bridal-text-soft">{o.hint}</span>}
            </span>
            <span
              aria-hidden
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                on ? "border-bridal-gold-dark bg-bridal-gold-dark text-bridal-ivory" : "border-bridal-beige bg-white text-transparent"
              }`}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          </button>
        )
      })}
    </div>
  )
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
  const [spaces, setSpaces] = useState<Array<{ id: number; label: string; kind?: string; capacityUnit: number | null }>>([])
  useEffect(() => {
    if (!venue?.id) return
    let cancelled = false
    api.get(`/api/v1/businesses/${venue.id}/resources`)
      .then((r) => {
        if (cancelled) return
        setSpaces(
          (r?.data?.data || [])
            .filter((x: any) => x && x.isActive !== false)
            .map((x: any) => ({
              id: x.id,
              label: x.label,
              kind: x.kind,
              /**
               * 10.16 — how many guests this space holds.
               *
               * `BusinessResource.capacityUnit` was on the API all along and
               * this mapper dropped it, so on venues that model their halls as
               * RESOURCES rather than as a sub-venue tree the guest stepper had
               * nothing to clamp to and fell back to `business.maxCapacity` —
               * the whole venue. A customer could put 1,200 guests into the
               * 300-person side hall, which is the same defect the sub-venue
               * path fixed and this path never got.
               */
              capacityUnit: Number.isFinite(Number(x.capacityUnit)) && Number(x.capacityUnit) > 0
                ? Number(x.capacityUnit)
                : null,
            })),
        )
      })
      .catch(() => { if (!cancelled) setSpaces([]) })
    return () => { cancelled = true }
  }, [venue?.id])

  // F-2 — canonical sub-venue spaces (venue-hierarchy). When a venue models its
  // halls as SubVenues (flag-gated), the customer picks one and we send
  // subVenueId — the canonical per-hall path. Renders only when the venue has a
  // real multi-space tree; otherwise the BusinessResource picker above stands.
  type FlatSpace = {
    id: number; name: string; kind: string; depth: number
    fireRatedCapacity: number | null; comfortCapacity: number | null
    /* 10.13 / 10.16 — both of these were already on the wire and both were
       dropped by this flatten, so the two things a space knows about itself
       that a family most needs to hear could never be said. */
    genderMode: string | null
    backupSubVenueId: number | null
  }
  const [subVenueSpaces, setSubVenueSpaces] = useState<FlatSpace[]>([])
  useEffect(() => {
    if (!venue?.id) return
    let cancelled = false
    venueSpacesApi.publicTree(Number(venue.id))
      .then((t) => {
        if (cancelled) return
        const flat: FlatSpace[] = []
        /* The tree already carries `fireRatedCapacity` and `comfortCapacity`
           per space and this flatten dropped both on the floor — so the form
           capped guests at the WHOLE VENUE's maximum no matter which hall was
           picked. A marquee whose venue-wide max is 1,200 would happily take
           1,200 guests into a 300-person side hall, and nobody found out until
           the day. The numbers were already on the wire; they just were not
           being read. */
        const walk = (ns: SubVenueNode[], depth: number) => (ns || []).forEach((n) => {
          flat.push({
            id: n.id, name: n.name, kind: n.kind, depth,
            fireRatedCapacity: n.fireRatedCapacity ?? null,
            comfortCapacity: n.comfortCapacity ?? null,
            genderMode: (n as any).genderMode ?? null,
            backupSubVenueId: (n as any).backupSubVenueId ?? null,
          })
          if (n.children) walk(n.children, depth + 1)
        })
        walk(t?.tree || [], 0)
        setSubVenueSpaces(flat)
      })
      .catch(() => { if (!cancelled) setSubVenueSpaces([]) })
    return () => { cancelled = true }
  }, [venue?.id])

  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({})
  /**
   * WW-CAL-CLOSED — whether we have actually HEARD about a month yet.
   *
   * The calendar used to treat "no data for this day" as "bookable", so a day
   * the venue never opens, a day outside the fetched range, and a day whose
   * request had not come back yet were all offered as free. A customer could
   * pick a date the venue does not work, get through six steps and be refused
   * at submit.
   *
   * Flipping that polarity needs three states, not two, or a slow network
   * would render an entire month as closed. `loading` shows the day as
   * pending; `ready` means the answer is authoritative and an absent day is
   * genuinely unavailable; `error` falls back to the old permissive behaviour,
   * because refusing every date because a fetch failed would break booking
   * outright for a problem the customer cannot fix.
   */
  type MonthState = "loading" | "ready" | "error"
  const [monthState, setMonthState] = useState<Record<string, MonthState>>({})
  const ymOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  const fetchMonth = useCallback(async (d: Date) => {
    if (!venue?.id) return
    const m = ymOf(d)
    setMonthState((prev) => (prev[m] === "ready" ? prev : { ...prev, [m]: "loading" }))
    try {
      const data = await VendorAPI.getMonthAvailability([venue.id], m)
      setAvailability((prev) => ({ ...prev, ...(data[venue.id] || {}) }))
      setMonthState((prev) => ({ ...prev, [m]: "ready" }))
    } catch {
      setMonthState((prev) => ({ ...prev, [m]: "error" }))
    }
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
  /**
   * The chosen space, so the slots offered are the ones that exist WHERE the
   * customer is sitting.
   *
   * This used to ask for the whole business. Caught live on business 3358:
   * five spaces, and a slot belonging only to the space "afsana" was offered to
   * a customer who had picked a different hall — a bookable time that does not
   * exist in the room they chose. The backend now scopes on `subVenueId`, with
   * a space that defines no slots of its own inheriting the venue-wide set, so
   * single-hall vendors are untouched.
   */
  const selectedSubVenueId = Number((formData as any).selectedSubVenueId) || null

  const [templateMonthState, setTemplateMonthState] = useState<Record<string, "loading" | "ready" | "error">>({})
  const fetchTemplateMonth = useCallback(async (d: Date) => {
    if (!SLOT_TEMPLATES_ENABLED || !venue?.id) return
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    setTemplateMonthState((prev) => (prev[m] === "ready" ? prev : { ...prev, [m]: "loading" }))
    try {
      const res = await BusinessAvailabilityAPI.getBulkAvailability(
        venue.id as number, toKey(startOfMonth(d)), toKey(endOfMonth(d)), selectedSubVenueId,
      )
      const days = res?.days || {}
      setTemplateDays((prev) => ({ ...prev, ...days }))
      if (Object.values(days).some((rows) => rows && rows.length > 0)) setHasTemplates(true)
      setTemplateMonthState((prev) => ({ ...prev, [m]: "ready" }))
    } catch {
      // Falls back to the fixed periods, and to the permissive calendar — a
      // failed lookup must not present every date as closed.
      setTemplateMonthState((prev) => ({ ...prev, [m]: "error" }))
    }
  }, [venue?.id, selectedSubVenueId])
  useEffect(() => {
    if (!SLOT_TEMPLATES_ENABLED) return
    fetchTemplateMonth(viewMonth)
    fetchTemplateMonth(addMonths(viewMonth, 1))
  }, [viewMonth, fetchTemplateMonth])

  /**
   * Changing the space invalidates a slot already picked under the previous
   * one — the times on offer are different, and silently keeping the old
   * selection is how a customer ends up booked into a slot the new hall does
   * not have. The month cache is dropped for the same reason.
   */
  const lastSpace = useRef<number | null>(selectedSubVenueId)
  useEffect(() => {
    if (lastSpace.current === selectedSubVenueId) return
    lastSpace.current = selectedSubVenueId
    setTemplateDays({})
    setTemplateMonthState({})
    setHasTemplates(false)
    updateFormData((prev) => ({
      ...(prev as any),
      slotTemplateId: null,
      slotLabel: null,
      slotStartTime: null,
      slotEndTime: null,
      timeOfDay: "",
    }))
  }, [selectedSubVenueId, updateFormData])
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

  /**
   * WW-CAL-CLOSED — how much we actually know about a given day.
   *
   *   free        the venue has a bookable slot on it
   *   partial     bookable, but something on it is already taken
   *   unavailable the venue answered and there is nothing to book
   *   pending     we have not heard back yet
   *   unknown     the lookup failed; fall back to permissive rather than
   *               refusing every date over a network problem
   *
   * The whole point is that `unavailable` and `pending` used to be
   * indistinguishable from `free`, because both produced `undefined`.
   */
  type DayKnowledge = "free" | "partial" | "unavailable" | "pending" | "unknown"
  const dayKnowledge = useCallback((d: Date): DayKnowledge => {
    const key = toKey(d)
    const a = dayAvail(key)
    if (a) {
      if (a.isBlocked || a.availableSlots.length === 0) return "unavailable"
      return a.bookedSlots.length > 0 ? "partial" : "free"
    }
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const state = useTemplates ? templateMonthState[ym] : monthState[ym]
    if (state === "ready") return "unavailable"
    if (state === "error") return "unknown"
    return "pending"
  }, [dayAvail, useTemplates, templateMonthState, monthState])

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
    // WW-CAL-CLOSED — this used to be `if (a && ...)`, so a day with no data
    // fell straight through and was accepted. It now refuses anything the grid
    // itself would not offer, which is the same rule in one place.
    const k = dayKnowledge(d)
    if (k === "unavailable" || k === "pending") return
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
    // Same rule as the card's `notOffered`, so the two cannot disagree.
    if (Array.isArray(a?.availableSlots) && !a.availableSlots.includes(period)) return
    updateFormData((prev) => ({
      ...prev,
      timeSlot: period,
      slotTemplateId: null,
      // Cleared with the id, not merely left behind: a customer who picks
      // "Dinner event" and then switches to the plain Evening period would
      // otherwise carry the vendor's label onto a booking that is not it, and
      // every later screen would confidently show the wrong slot name.
      slotLabel: null,
      slotStartTime: null,
      slotEndTime: null,
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
      // SLOTS step 10 — carry the slot's own name and hours forward. Without
      // these, every screen after this one had only "19:00" to work from and
      // could not name the "Dinner event" the customer just clicked.
      slotLabel: row.label,
      slotStartTime: row.startTime,
      slotEndTime: row.endTime,
      bookingDate: formatBookingDate(selectedDate, t),
    }))
  }

  // Auto-create hold once a date+time are selected. We deliberately DO NOT
  // release the hold on unmount — that fired a bogus "Slot hold expired"
  // toast every time the user clicked Continue (component unmounts → release
  // → isHolding=false + timeRemaining=0 → booking-form's expiration watcher
  // misfired). Holds expire naturally on the server (15-min TTL) or when
  // the user picks a different date/time (the next createHold overwrites).
  /* Date holds removed from the booking flow (founder, 2026-08-29: "the date
     held thing should not be there, i dont want the date held for the booking
     thing").

     Only the CREATE call is gone. The DateHold feature itself is untouched —
     the vendor's own Calendar > Date holds screen still works, and any hold
     already on the server still expires on its own. Nothing was deleted, so
     restoring this is uncommenting one call.

     Consequence, recorded deliberately: two customers can now reach the end of
     the flow for the same date and slot, and the vendor will receive both
     requests and have to decline one. That is the trade the founder asked for
     — no date is taken out of circulation before the vendor has agreed to it. */
  // useEffect(() => {
  //   if (!venue?.id || !selectedDate || !formData.timeSlot) return
  //   createHold(venue.id as any, toKey(selectedDate), formData.timeSlot).catch(() => {})
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [venue?.id, selectedKey, formData.timeSlot])

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

  /* ── 10.13 / 10.16 — the space, and what it can and can't do ───────────── */

  const selectedSubVenue = useMemo(
    () => subVenueSpaces.find((s) => String(s.id) === String((formData as any).selectedSubVenueId)) || null,
    [subVenueSpaces, (formData as any).selectedSubVenueId],
  )

  /**
   * The verdict, computed only once a space is actually chosen.
   *
   * On "whole venue / any hall" there is no space to check, so the honest
   * answer is silence — not "fits". A family that has picked no hall has been
   * told nothing about any hall.
   */
  const genderFit = useMemo(
    () => checkGenderFit(formData.requestedGenderMode, selectedSubVenue),
    [formData.requestedGenderMode, selectedSubVenue],
  )

  const backupPlan = useMemo(() => {
    if (!selectedSubVenue) return null
    const backup = selectedSubVenue.backupSubVenueId
      ? subVenueSpaces.find((s) => s.id === selectedSubVenue.backupSubVenueId) || null
      : null
    return describeBackupPlan(selectedSubVenue, backup)
  }, [selectedSubVenue, subVenueSpaces])

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

  /**
   * The guest ceiling that actually applies, which is not always the venue's.
   *
   * Three limits exist and the form knew about one:
   *
   *   1. the SPACE's fire-rated capacity — the legal occupancy of the room the
   *      customer just picked. Sent by the API, discarded by the flatten above
   *      until now, and the one that gets a hall sealed when it is broken;
   *   2. the SLOT's `unitGuestCapacity` — "guests per booking" for this time
   *      band. The vendor-side confusion between this and `capacity` is what
   *      put "150 bookings at once" on a live listing; on this side the number
   *      was not published at all;
   *   3. `business.maxCapacity` — the whole venue, which is what the stepper
   *      clamped to regardless of which hall was chosen.
   *
   * The tightest one wins, and the form says WHICH, because "max 300" with no
   * explanation on a venue advertising 1,200 reads as a bug.
   */
  const chosenSpace = subVenueSpaces.find((sp) => sp.id === selectedSubVenueId) ?? null
  const chosenSlotRow = useMemo(() => {
    if (!selectedDate || !formData.slotTemplateId) return null
    const rows = templateDays[toKey(selectedDate)] ?? []
    return rows.find((r) => r.slotTemplateId === Number(formData.slotTemplateId)) ?? null
  }, [selectedDate, formData.slotTemplateId, templateDays])

  /**
   * 10.16 — the resource-model twin of `chosenSpace`.
   *
   * A venue models its halls EITHER as a sub-venue tree ("Which hall?") OR as
   * BusinessResources ("Which space?") — the two pickers are mutually
   * exclusive. Capacity was only ever read off the first, so every venue on
   * the second had no per-hall ceiling at all.
   */
  const selectedResourceId = Number((formData as any).selectedResourceId) || null
  const chosenResource = spaces.find((sp) => sp.id === selectedResourceId) ?? null

  const guestLimits: { max: number; source: string }[] = []
  if (chosenSpace?.fireRatedCapacity) guestLimits.push({ max: chosenSpace.fireRatedCapacity, source: `${chosenSpace.name} holds` })
  if (chosenResource?.capacityUnit) guestLimits.push({ max: chosenResource.capacityUnit, source: `${chosenResource.label} holds` })
  if (chosenSlotRow?.unitGuestCapacity) guestLimits.push({ max: chosenSlotRow.unitGuestCapacity, source: `${chosenSlotRow.label} takes` })
  if (venue?.maxCapacity) guestLimits.push({ max: venue.maxCapacity, source: "This venue holds" })
  const activeLimit = guestLimits.length
    ? guestLimits.reduce((a, b) => (b.max < a.max ? b : a))
    : null

  /* Comfort capacity is the vendor's own seated-comfort figure, not a legal
     limit. Shown as a caution, never enforced — a family that wants 320 people
     standing in a hall the vendor seats 280 is having a conversation, not
     making a mistake. */
  const comfortWarning =
    chosenSpace?.comfortCapacity &&
    (formData.guestCount || 0) > chosenSpace.comfortCapacity &&
    (!activeLimit || (formData.guestCount || 0) <= activeLimit.max)
      ? `${chosenSpace.name} seats ${chosenSpace.comfortCapacity} comfortably. ${formData.guestCount} will fit, but it will be tight.`
      : null

  /* The venue's minimum was displayed and never checked. A vendor who set
     "min 200" was quoting for 10-guest bookings. Advisory, for the same reason
     as comfort: it is a commercial preference, not a physical limit. */
  const belowMinimum =
    venue?.minCapacity && (formData.guestCount || 0) > 0 && (formData.guestCount || 0) < venue.minCapacity
      ? `This venue takes bookings from ${venue.minCapacity} guests. Yours is ${formData.guestCount} — check with them before paying.`
      : null

  const adjust = (delta: number) =>
    updateFormData((prev) => {
      let n = Math.max(0, (prev.guestCount || 0) + delta)
      if (activeLimit && n > activeLimit.max) n = activeLimit.max
      return { ...prev, guestCount: n }
    })

  /**
   * Changing the space can invalidate a guest count already entered: pick the
   * 900-person main hall, type 800, switch to the 300-person side hall, and the
   * form used to carry 800 straight through to a booking the server now
   * refuses. Clamped down to the new ceiling instead, since the customer's last
   * explicit act was choosing the smaller room.
   */
  const lastLimit = useRef<number | null>(null)
  useEffect(() => {
    const cap = activeLimit?.max ?? null
    if (cap === lastLimit.current) return
    lastLimit.current = cap
    if (cap != null) {
      updateFormData((prev) => (
        (prev.guestCount || 0) > cap ? { ...prev, guestCount: cap } : prev
      ))
    }
  }, [activeLimit?.max, updateFormData])

  /* ── Shell contract ────────────────────────────────────────────────────
     The shell renders the eyebrow, the title, the subtitle, Back/Continue and
     the receipt. This step renders only its controls, in one DOM that reads
     calendar → hall → times → guests → arrangement → location on a 544px
     column and as strip → notices → calendar ‖ times at ≥ 1280. */
  const { tier, scrollBodyTo, announce } = useBookingShell()
  const slotListRef = useRef<HTMLDivElement>(null)
  const [locationOpen, setLocationOpen] = useState(false)
  const [hallOpen, setHallOpen] = useState(false)
  const [arrangementOpen, setArrangementOpen] = useState(false)



  /* The sentence for a clamp the ceiling forced. The effect above lowers
     guestCount when a smaller hall or slot is chosen; this one runs in the same
     commit, so it still sees the count that was lowered and can say so. It
     stays while the count equals the ceiling it was set to, then goes. */
  const [clampNote, setClampNote] = useState<{ cap: number; text: string } | null>(null)
  useEffect(() => {
    if (!activeLimit) return
    if ((formData.guestCount || 0) > activeLimit.max) {
      setClampNote({
        cap: activeLimit.max,
        text: `Guests set to ${activeLimit.max} — ${activeLimit.source.toLowerCase()} ${activeLimit.max}`,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLimit?.max])
  const clampLine = clampNote && (formData.guestCount || 0) === clampNote.cap ? clampNote.text : null

  /* ── Presentation helpers (no data logic) ──────────────────────────── */
  const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const dayHeader = (d: Date) => {
    if (sameDay(d, today)) return "Today"
    if (sameDay(d, addDays(today, 1))) return "Tomorrow"
    return `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_FULL[d.getMonth()]}`
  }
  const shortDay = (d: Date) => `${WEEKDAY_FULL[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
  const viewYm = ymOf(viewMonth)
  const availError = (useTemplates ? templateMonthState[viewYm] : monthState[viewYm]) === "error"

  const showHall = subVenueSpaces.length >= 1
  const showSpace = spaces.length > 0 && subVenueSpaces.length === 0
  const showGuests = needsGuestCount && enforceCapacity
  const showArrangement = vendorTypeName === "Wedding venue" || subVenueSpaces.length >= 1
  const hasStrip = showHall || showSpace || showGuests || showArrangement

  // The rows for the chosen day (template engine), and the next three days
  // with a free slot from what is already loaded — no new request.
  const dayRows = selectedKey ? (templateDays[selectedKey] || []).filter((r) => r.runsThisWeekday) : []
  const nextFreeDays: Date[] = (() => {
    if (!useTemplates || !selectedKey) return []
    const todayKey = toKey(today)
    const from = selectedKey > todayKey ? selectedKey : todayKey
    return Object.keys(templateDays)
      .filter((k) => k > from && (templateDays[k] || []).some((r) => r.runsThisWeekday && !r.blocked && r.free > 0))
      .sort()
      .slice(0, 3)
      .map((k) => {
        const [y, m, dd] = k.split("-").map(Number)
        return new Date(y, m - 1, dd)
      })
  })()

  // Service location, summarised for the disclosure row.
  const locMode = formData.serviceLocationMode as ServiceLocationMode | undefined
  const locAddress = (formData.serviceLocationAddress || "").trim()
  const locAddressMissing = serviceLocationNeedsAddress(locMode) && locAddress.length < 5
  const locLabel = locMode && locMode !== "at_vendor" ? SERVICE_LOCATION_SHORT_LABELS[locMode] : "At the venue"

  /* ── Advisories, one line each, grouped by the control they concern ── */
  const calendarNotices: NoticeLine[] = []
  if (selectedAvail?.isBlocked)
    calendarNotices.push({
      id: "blocked",
      tone: "beige",
      text: `Vendor not available this day — ${selectedAvail.blockReason || "pick a different date"}`,
    })
  if (availError)
    calendarNotices.push({ id: "avail-error", tone: "soft", text: "Couldn't check availability — the venue will confirm" })

  const holdFailedLine: NoticeLine | null = holdFailed
    ? {
        id: "hold-failed",
        tone: "rose",
        assertive: true,
        text: `That slot was just reserved by another customer.${
          holdFailedUntil
            ? ` Held until ${holdFailedUntil.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
            : ""
        } Please pick another time.`,
      }
    : null
  const holdTimerLine: NoticeLine | null =
    isHolding && timeRemaining > 0 && timeRemaining < 9999
      ? {
          id: "hold-timer",
          tone: "sage",
          icon: "timer",
          text: `Slot reserved for ${String(Math.floor(timeRemaining / 60)).padStart(2, "0")}:${String(timeRemaining % 60).padStart(2, "0")}`,
        }
      : null

  /* 10.13 — reported, never refused. A MIXED hall is not an error, it is a
     fact the family needs BEFORE the night, while there is still time to pick
     another hall or ask for a partition. */
  const hallNotices: NoticeLine[] = []
  if (genderFit.status === "mismatch" && genderFit.reason)
    hallNotices.push({ id: "gender-mismatch", tone: "amber", text: genderFit.reason })
  if (genderFit.status === "fits")
    hallNotices.push({ id: "gender-fits", tone: "sage", text: "This hall can be arranged the way you've asked." })
  /* The venue has not recorded what it can do — said as a question for the
     venue, not a defect of it. */
  if (genderFit.status === "unknown" && genderFit.reason)
    hallNotices.push({ id: "gender-unknown", tone: "soft", text: genderFit.reason })
  /* 10.16 (UC-22) — rain on an open lawn. */
  if (backupPlan?.exposed && backupPlan.message)
    hallNotices.push({ id: "backup", tone: backupPlan.hasPlan ? "sage" : "amber", text: backupPlan.message })

  /* Compliance is advisory (never blocks); comfort and minimum are the
     vendor's preferences, not physical or legal limits. */
  const guestNotices: NoticeLine[] = []
  // A venue policy is context for a choice, not a warning on arrival: it
  // appears once the customer has a date, beside the guests row it concerns.
  if (selectedDate) complianceWarnings.forEach((w, i) => guestNotices.push({ id: `compliance-${i}`, tone: "amber", text: w }))
  if (clampLine) guestNotices.push({ id: "clamp", tone: "mauve", text: clampLine })
  if (comfortWarning) guestNotices.push({ id: "comfort", tone: "mauve", text: comfortWarning })
  if (belowMinimum) guestNotices.push({ id: "below-min", tone: "mauve", text: belowMinimum })

  // ≥ 1280: one rail above the calendar, in priority order. slotConflict is
  // the shell's line, not this step's.
  const railLines: NoticeLine[] = [
    ...(holdFailedLine ? [holdFailedLine] : []),
    ...calendarNotices,
    ...guestNotices,
    ...hallNotices,
    ...(holdTimerLine ? [holdTimerLine] : []),
  ]
  // Base layout: under the control each concerns. Guest notices sit under the
  // guests row when there is one, otherwise under the times.
  const slotNotices: NoticeLine[] = [
    ...(holdFailedLine ? [holdFailedLine] : []),
    ...(holdTimerLine ? [holdTimerLine] : []),
    ...(showGuests ? [] : guestNotices),
  ]

  const pickDay = (d: Date) => {
    handlePickDay(d)
    // The base layout stacks the times under the calendar; bring them up
    // once a day is chosen. A method call on the shell, never an observer.
    if (tier === "phone" || tier === "tablet") scrollBodyTo(slotListRef.current, { block: "nearest" })
    announce(`${dayHeader(d)} selected`)
  }

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2"

  const chip = (text: string, tone: "coral" | "gold" | "beige") => (
    <span
      className={`shrink-0 rounded-full border px-2 py-[3px] font-bridal text-[10px] font-medium uppercase leading-3 tracking-[0.12em] ${
        tone === "coral"
          ? "border-bridal-coral/40 bg-bridal-coral/15 text-bridal-coral"
          : tone === "gold"
            ? "border-bridal-gold/45 bg-bridal-gold/15 text-bridal-gold-dark"
            : "border-bridal-beige bg-bridal-beige/60 text-bridal-text-soft"
      }`}
    >
      {text}
    </span>
  )

  /** A single day cell: a 44px circle (40 under the shell's density tier),
   *  Playfair numeral, gold dot or "n left" for partial availability. */
  const renderDayCell = (d: Date) => {
    const key = toKey(d)
    const isPast = d < today
    /* WW-CAL-CLOSED — a day is offered only when the venue has SAID it is
       free. Previously `isBlocked` was false whenever we had no data, so
       closed days, unfetched days and in-flight days were all bookable. */
    const knowledge = dayKnowledge(d)
    const isBlocked = knowledge === "unavailable"
    const isPending = knowledge === "pending"
    const isPartial = knowledge === "partial"
    const isSelected = sameDay(d, selectedDate)
    const isToday = sameDay(d, today)
    const inMonth = isSameMonth(d)
    const disabled = isPast || isBlocked || isPending

    // Tooltip text: why a day is blocked, or what is already taken on it.
    const a = dayAvail(key)
    let tip: string | null = null
    if (isBlocked && !isPast) tip = a?.blockReason || "Not available"
    else if (isPartial) {
      const rows = templateDays[key] || []
      const names = (a?.bookedSlots || []).map((s) =>
        useTemplates
          ? rows.find((r) => r.startTime.slice(0, 5) === s)?.label ?? s
          : PERIODS.find((p) => p.value === s)?.label ?? s,
      )
      tip = names.length ? `${names.join(", ")} booked` : "Partly booked"
    }
    const partialLeft = isPartial && useTemplates
      ? (templateDays[key] || []).filter((r) => r.runsThisWeekday && !r.blocked).reduce((n, r) => n + Math.max(0, r.free), 0)
      : null

    const button = (
      <button
        type="button"
        onClick={() => pickDay(d)}
        disabled={disabled}
        aria-label={`${WEEKDAY_FULL[d.getDay()]}, ${MONTHS_FULL[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}${
          isPast ? " (in the past)" : isBlocked ? " (not available)" : isPending ? " (checking availability)" : ""
        }`}
        aria-pressed={isSelected}
        className={`relative flex h-11 w-11 flex-col items-center justify-center rounded-full font-display text-[15px] leading-none tabular-nums transition-all duration-150 motion-safe:active:scale-95 xl:h-[var(--bk-cal-cell,44px)] xl:w-[var(--bk-cal-cell,44px)] ${focusRing}
          ${!inMonth ? "opacity-30" : ""}
          ${isBlocked && !isPast ? "pointer-events-none" : ""}
          ${
            /* Pending is greyed but NOT struck through: a day we have not
               heard about yet is not a day the venue has refused, and
               striking it out would state something untrue for a second. */
            isPending && !isPast
              ? "cursor-wait text-bridal-text-soft/40"
              /* A PAST day is not a refusal either. Past days are simply
                 faint; the strike is kept for a date the venue has actually
                 blocked, where it means something. */
              : isPast
                ? "cursor-not-allowed text-bridal-text-soft/35"
                : disabled
                  ? "cursor-not-allowed text-bridal-text-soft/50 line-through decoration-1"
                  : isSelected
                    ? "bg-bridal-gold-dark text-white motion-safe:animate-pop-select"
                    : isToday
                      ? "ring-1 ring-inset ring-bridal-gold-dark text-bridal-charcoal hover:bg-bridal-blush/45"
                      : "text-bridal-charcoal hover:bg-bridal-cream"
          }`}
      >
        <span>{d.getDate()}</span>
        {isPartial && !isSelected && partialLeft != null && (
          <span aria-hidden className="mt-[2px] font-bridal text-[9px] leading-[10px] text-bridal-gold-dark">
            {partialLeft} left
          </span>
        )}
        {isPartial && !isSelected && partialLeft == null && (
          <span aria-hidden className="absolute bottom-1 h-1 w-1 rounded-full bg-bridal-gold" />
        )}
      </button>
    )

    return (
      <div key={key} className="flex justify-center">
        {tip ? (
          <Tooltip>
            {/* A disabled button fires no pointer events, so the wrapper span
                is the trigger for a blocked day; a partial day is enabled and
                the wrapper simply passes the events through. */}
            <TooltipTrigger asChild>
              <span className="inline-flex rounded-full">{button}</span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="rounded-[4px] border-bridal-beige bg-bridal-charcoal px-2.5 py-1.5 font-bridal text-[12px] leading-4 text-bridal-ivory shadow-none"
            >
              {tip}
            </TooltipContent>
          </Tooltip>
        ) : (
          button
        )}
      </div>
    )
  }

  /* ── Strip cells (one DOM; a full-width row on the base layout, a cell of
        the 64px strip at ≥ 1280) ────────────────────────────────────────── */
  const cellBox =
    "relative h-14 rounded-[4px] border border-bridal-beige bg-white xl:h-auto xl:rounded-none xl:border-0 xl:bg-transparent"
  const cellLabel =
    "pointer-events-none absolute left-4 top-2 z-[1] font-bridal text-[10.5px] font-medium uppercase leading-[14px] tracking-[0.18em] text-bridal-text-label xl:top-3"
  const cellSelect =
    `bridal-select h-full w-full rounded-[4px] border-0 bg-transparent pb-0 pl-4 pt-[18px] font-bridal text-[15px] leading-5 text-bridal-charcoal outline-none xl:rounded-none xl:pt-[22px] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bridal-gold-dark`

  const slotRowClass = (state: "disabled" | "selected" | "default") =>
    `group flex h-14 w-full items-center gap-3 rounded-[4px] border px-4 text-left transition-colors duration-150 motion-safe:animate-stagger-fade-up ${focusRing} ${
      state === "disabled"
        ? "cursor-not-allowed border-bridal-beige bg-bridal-ivory text-bridal-text-soft/60"
        : state === "selected"
          ? "border-bridal-gold bg-bridal-gold text-bridal-charcoal motion-safe:animate-pop-select"
          : "border-bridal-beige bg-white text-bridal-charcoal hover:bg-bridal-blush/45"
    }`

  const selectedMark = (
    <span className="inline-flex shrink-0 items-center gap-1.5 font-bridal text-[11px] font-medium uppercase leading-[14px] tracking-[0.18em] text-bridal-charcoal">
      <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      Selected
    </span>
  )

  /** One row shape for every detail: question, answer, chevron. */
  const detailRow = `flex h-14 w-full items-center gap-3 rounded-[4px] border border-bridal-beige bg-white px-4 text-left transition-colors duration-150 hover:bg-bridal-blush/45 ${focusRing}`

  // Hall / space — one row, whichever model the venue uses (mutually exclusive).
  const hallOptions: { value: string; label: string; hint?: string }[] = showHall
    ? [
        { value: "", label: "Whole venue / any hall", hint: "Let the venue decide" },
        ...subVenueSpaces.map((sp) => ({
          value: String(sp.id),
          label: `${"  ".repeat(sp.depth)}${sp.name}`,
          hint: [sp.kind, sp.fireRatedCapacity ? `up to ${sp.fireRatedCapacity} guests` : null].filter(Boolean).join(" · "),
        })),
      ]
    : [
        { value: "", label: "Whole venue / any space", hint: "Let the venue decide" },
        ...spaces.map((sp) => ({
          value: String(sp.id),
          label: sp.label,
          hint: [sp.kind, sp.capacityUnit ? `up to ${sp.capacityUnit} guests` : null].filter(Boolean).join(" · "),
        })),
      ]
  const hallValue = String((showHall ? (formData as any).selectedSubVenueId : (formData as any).selectedResourceId) || "")
  const hallValueLabel = hallOptions.find((o) => o.value === hallValue)?.label?.trim() || hallOptions[0].label
  const pickHall = (id: string) => {
    if (showHall) {
      // Carry the hall's NAME forward too: later steps only ever had the id,
      // so Packages could not say "Terrace Lawn package" and Review could not
      // name the room being booked.
      const picked = subVenueSpaces.find((sp) => String(sp.id) === String(id))
      updateFormData((prev) => ({ ...(prev as any), selectedSubVenueId: id, selectedSubVenueName: picked?.name || null }))
    } else {
      const picked = spaces.find((sp) => String(sp.id) === String(id))
      updateFormData((prev) => ({ ...(prev as any), selectedResourceId: id, selectedResourceName: picked?.label || null }))
    }
  }
  const arrangementValueLabel =
    ARRANGEMENT_CHOICES.find((c) => c.value === formData.requestedGenderMode)?.label || "No preference"

  return (
    <TooltipProvider delayDuration={240}>
      <div className="flex w-full flex-col gap-3 xl:grid xl:grid-cols-[332px_minmax(0,1fr)] xl:items-start xl:gap-x-10 xl:gap-y-3 xl:[@media(max-height:820px)]:gap-y-2">
        {/* Hall, guests and arrangement are rows in the details list below the
            times (same shape as the location row): one line, the current
            value, a chevron into a clean choice sheet. No selects, no strip. */}
        {/* ── Notice rail (≥ 1280): at most two inline, the rest fold ──── */}
        <NoticeRail lines={railLines} max={2} className="hidden xl:col-span-2 xl:block" />

        {/* ── Calendar ──────────────────────────────────────────────────── */}
        <section className="order-1 w-full xl:order-1 xl:w-[332px]" aria-label="Choose a date">
          <div className="flex h-11 items-center justify-between xl:h-10 xl:[@media(max-height:820px)]:h-9">
            <button
              type="button"
              onClick={() => setViewMonth((m) => (canGoPrevMonth ? addMonths(m, -1) : m))}
              disabled={!canGoPrevMonth}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-bridal-charcoal transition-colors duration-150 hover:bg-bridal-blush/45 disabled:cursor-not-allowed disabled:text-bridal-text-soft/40 disabled:hover:bg-transparent xl:h-9 xl:w-9 ${focusRing}`}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <p className="font-display text-[20px] italic leading-6 text-bridal-charcoal" aria-live="polite">
              {MONTHS_FULL[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-bridal-charcoal transition-colors duration-150 hover:bg-bridal-blush/45 xl:h-9 xl:w-9 ${focusRing}`}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {/* Weekday header */}
          <div className="grid h-6 grid-cols-7 gap-1.5 xl:gap-1 xl:[@media(max-height:820px)]:h-[22px]" aria-hidden>
            {WEEKDAY_SHORT.map((w, i) => (
              <div
                key={i}
                className="flex items-center justify-center font-bridal text-[10px] font-medium uppercase tracking-[0.18em] text-bridal-text-soft"
              >
                {w}
              </div>
            ))}
          </div>

          {/* 6×7 day grid — always 42 cells (buildMonthGrid pads), re-keyed
              per month so the arrows fade the grid in. */}
          <div key={viewYm} className="grid grid-cols-7 gap-1.5 motion-safe:animate-[fade-in_160ms_ease-out_forwards] xl:gap-1">
            {monthGrid.map((d) => renderDayCell(d))}
          </div>

          {/* Legend */}
          <div className="mt-1 flex h-6 items-center justify-between gap-3 font-bridal text-[11px] leading-4 text-bridal-text-soft xl:[@media(max-height:820px)]:h-5">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-bridal-gold" aria-hidden />
              Limited
            </span>
            {selectedDate && (
              <span className="truncate text-bridal-charcoal">
                <span className="text-bridal-gold-dark">Selected:</span> {shortDay(selectedDate)}
              </span>
            )}
          </div>
        </section>
        <NoticeRail lines={calendarNotices} max={3} className="order-1 xl:hidden" />

        {/* ── Slot column: times, then the location row ─────────────────
            `contents` on the base layout so the guests and arrangement rows
            can sit between the times and the location row; a block beside
            the calendar at ≥ 1280. */}
        <div className="contents xl:order-2 xl:block xl:min-w-0">
          <section className="order-3 min-w-0" aria-label="Choose a time">
            <p
              className={`h-6 truncate font-bridal text-[15px] leading-6 ${
                selectedDate ? "text-bridal-charcoal" : "text-bridal-text-soft"
              }`}
            >
              {selectedDate ? dayHeader(selectedDate) : "Pick a date to see times"}
            </p>

            <div ref={slotListRef} data-booking-slots className="mt-2 space-y-2 scroll-mt-4">
              {useTemplates &&
                selectedDate &&
                dayRows.length > 0 &&
                dayRows.map((row, i) => {
                  const isSelected = formData.slotTemplateId === row.slotTemplateId
                  const soldOut = row.blocked || row.free <= 0
                  const disabled = !selectedDate || soldOut
                  const hours =
                    formatSlotRange(row.startTime, row.endTime) ||
                    `${row.startTime.slice(0, 5)} to ${row.endTime.slice(0, 5)}`
                  return (
                    <button
                      key={`${selectedKey}-${row.slotTemplateId}`}
                      type="button"
                      onClick={() => handlePickTemplate(row)}
                      disabled={disabled}
                      aria-pressed={isSelected}
                      style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                      className={slotRowClass(disabled ? "disabled" : isSelected ? "selected" : "default")}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-[15px] italic leading-5">{row.label}</span>
                        <span
                          className={`block truncate font-bridal text-[12px] leading-4 ${
                            isSelected ? "text-bridal-charcoal/80" : disabled ? "" : "text-bridal-text-soft"
                          }`}
                        >
                          {hours}
                        </span>
                      </span>
                      {isSelected
                        ? selectedMark
                        : soldOut
                          ? chip(row.blocked ? "Blocked" : "Full", "coral")
                          : (
                            <span className="shrink-0 font-bridal text-[11px] font-medium leading-4 tabular-nums text-bridal-gold-dark">
                              {row.free} of {row.capacity} left
                            </span>
                          )}
                    </button>
                  )
                })}

              {!useTemplates &&
                PERIODS.map((p, i) => {
                  const isSelected = formData.timeSlot === p.value
                  const isBooked = selectedAvail?.bookedSlots?.includes(p.value) ?? false
                  const isHeld = selectedAvail?.heldSlots?.includes(p.value) ?? false
                  /**
                   * WW-CAL-CLOSED — a period the venue does not run is not the
                   * same as one that is already taken, and only the second was
                   * disabled. A venue that opens for dinner only had its Morning
                   * and Afternoon cards fully selectable — not booked, not held,
                   * just never on offer — and the customer found out at submit.
                   *
                   * `availableSlots` is the venue's own list of what it runs that
                   * day. When it is missing entirely we stay permissive, because
                   * that means the lookup failed rather than that nothing runs.
                   */
                  const offered = selectedAvail?.availableSlots
                  const notOffered = Array.isArray(offered) && !offered.includes(p.value)
                  const disabled = !selectedDate || isBooked || isHeld || notOffered
                  const Icon = p.icon
                  return (
                    <button
                      key={`${selectedKey}-${p.value}`}
                      type="button"
                      onClick={() => handlePickPeriod(p.value)}
                      disabled={disabled}
                      aria-pressed={isSelected}
                      style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                      className={slotRowClass(disabled ? "disabled" : isSelected ? "selected" : "default")}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isSelected ? "text-bridal-charcoal" : disabled ? "text-bridal-text-soft/50" : "text-bridal-mauve"
                        }`}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-[15px] italic leading-5">{p.label}</span>
                        <span
                          className={`block truncate font-bridal text-[12px] leading-4 ${
                            isSelected ? "text-bridal-charcoal/80" : disabled ? "" : "text-bridal-text-soft"
                          }`}
                        >
                          {p.hint}
                        </span>
                      </span>
                      {isSelected && selectedMark}
                      {!isSelected && isBooked && chip("Booked", "coral")}
                      {!isSelected && isHeld && !isBooked && chip("On hold", "gold")}
                      {/* Says WHY it cannot be picked. "Not available" reads as a
                          bug on a card that looks identical to the bookable ones. */}
                      {!isSelected && notOffered && !isBooked && !isHeld && chip("Not offered", "beige")}
                    </button>
                  )
                })}
            </div>

            {/* A day with nothing on it — say so, and offer the nearest days
                that do have something, from what is already loaded. */}
            {useTemplates && selectedDate && dayRows.length === 0 && (
              <div className="mt-2">
                <p className="rounded-[4px] border border-dashed border-bridal-beige px-4 py-4 font-bridal text-[13px] leading-[18px] text-bridal-text-soft">
                  No times offered on {shortDay(selectedDate)}
                </p>
                {nextFreeDays.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {nextFreeDays.map((d) => (
                      <button
                        key={toKey(d)}
                        type="button"
                        onClick={() => {
                          setViewMonth(startOfMonth(d))
                          pickDay(d)
                        }}
                        className={`inline-flex h-11 items-center rounded-full border border-bridal-beige bg-white px-4 font-bridal text-[12px] text-bridal-charcoal transition-colors duration-150 hover:bg-bridal-blush/45 xl:h-9 ${focusRing}`}
                      >
                        Next free: {d.getDate()} {MONTHS[d.getMonth()]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
          <NoticeRail lines={slotNotices} max={4} className="order-3 xl:hidden" />

          {/* ── Details list: hall · guests · arrangement · location ──────
              Every row is the same 56px shape — a question, the current
              answer, a chevron — and every choice opens as a list in a sheet
              (a bottom drawer on a phone). Nothing here looks like a form. */}
          {(showHall || showSpace) && (
            <button
              type="button"
              onClick={() => setHallOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={hallOpen}
              className={`order-2 ${detailRow} xl:mt-4`}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-bridal text-[13px] leading-[18px] text-bridal-text-soft">Which hall?</span>
                <span className="block truncate font-bridal text-[15px] leading-5 text-bridal-charcoal">{hallValueLabel}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-bridal-text-soft" aria-hidden />
            </button>
          )}
          <NoticeRail lines={hallNotices} max={4} className="order-2 xl:hidden" />
          {(showHall || showSpace) && (
            <DeskSheet open={hallOpen} onOpenChange={setHallOpen} title="Which hall?" description="Pick a specific hall, lawn or partition, or leave it to the venue." doneLabel="Done">
              <ChoiceList options={hallOptions} value={hallValue} onPick={(v) => { pickHall(v); setHallOpen(false) }} />
            </DeskSheet>
          )}

          {showGuests && (
            <div className={`order-4 ${detailRow} cursor-default hover:bg-white xl:mt-2`}>
              <label htmlFor="bk-guests" className="min-w-0 flex-1">
                <span className="block font-bridal text-[13px] leading-[18px] text-bridal-text-soft">How many guests?</span>
                <span
                  className="block truncate font-bridal text-[12px] leading-4 text-bridal-text-soft tabular-nums"
                  title={[venue?.minCapacity ? `From ${venue.minCapacity}` : "", activeLimit ? `${activeLimit.source} ${activeLimit.max}` : ""].filter(Boolean).join(" · ")}
                >
                  {venue?.minCapacity && activeLimit
                    ? `${venue.minCapacity}–${activeLimit.max} guests`
                    : venue?.minCapacity
                      ? `From ${venue.minCapacity} guests`
                      : activeLimit
                        ? `Up to ${activeLimit.max} guests`
                        : "Guests"}
                </span>
              </label>
              <div className="flex shrink-0 items-center rounded-full border border-bridal-beige bg-bridal-cream p-0.5">
                <button
                  type="button"
                  onClick={() => adjust(-10)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-bridal-charcoal transition-colors duration-150 hover:bg-white motion-safe:active:scale-95 ${focusRing}`}
                  aria-label="Decrease guests"
                >
                  <Minus className="h-4 w-4" aria-hidden />
                </button>
                <input
                  id="bk-guests"
                  type="number"
                  inputMode="numeric"
                  data-booking-field="guestCount"
                  min={0}
                  value={formData.guestCount || ""}
                  max={activeLimit?.max}
                  onChange={(e) => {
                    const val = e.target.value
                    let n = val === "" ? 0 : parseInt(val, 10)
                    if (Number.isNaN(n)) n = 0
                    if (activeLimit && n > activeLimit.max) n = activeLimit.max
                    updateFormData((prev) => ({ ...prev, guestCount: n }))
                  }}
                  placeholder="100"
                  className={`h-9 w-16 border-0 bg-transparent text-center font-bridal text-[15px] font-medium leading-5 tabular-nums text-bridal-charcoal outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${focusRing}`}
                />
                <button
                  type="button"
                  onClick={() => adjust(10)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-bridal-charcoal transition-colors duration-150 hover:bg-white motion-safe:active:scale-95 ${focusRing}`}
                  aria-label="Increase guests"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          )}
          {showGuests && <NoticeRail lines={guestNotices} max={4} className="order-4 xl:hidden" />}

          {showArrangement && (
            <button
              type="button"
              onClick={() => setArrangementOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={arrangementOpen}
              className={`order-5 ${detailRow} xl:mt-2`}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-bridal text-[13px] leading-[18px] text-bridal-text-soft">How is the function arranged?</span>
                <span className="block truncate font-bridal text-[15px] leading-5 text-bridal-charcoal">{arrangementValueLabel}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-bridal-text-soft" aria-hidden />
            </button>
          )}
          {showArrangement && (
            <DeskSheet open={arrangementOpen} onOpenChange={setArrangementOpen} title="How is the function arranged?" description="We check the hall you pick can be arranged that way, and tell the venue.">
              <ChoiceList
                options={[{ value: "", label: "No preference", hint: "Decide later with the venue" }, ...ARRANGEMENT_CHOICES.map((c) => ({ value: c.value, label: c.label, hint: c.hint }))]}
                value={formData.requestedGenderMode || ""}
                onPick={(v) => {
                  updateFormData((prev) => ({ ...prev, requestedGenderMode: (v || null) as BookingFormData["requestedGenderMode"] }))
                  setArrangementOpen(false)
                }}
              />
            </DeskSheet>
          )}

          {/* BK-100.53 — service location. A disclosure row; the four modes,
              the address and the notes live in the desk sheet (a bottom
              drawer on a phone) so they never sit between the customer and
              the calendar. */}
          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={locationOpen}
            className={`order-6 ${detailRow} xl:mt-2`}
          >
            <MapPin className="h-4 w-4 shrink-0 text-bridal-gold-dark" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-bridal text-[13px] leading-[18px] text-bridal-text-soft">Where will it happen?</span>
              <span className="block truncate font-bridal text-[13px] leading-[18px] text-bridal-charcoal">
                {locLabel}
                {locMode && locMode !== "at_vendor" && (
                  <>
                    {" · "}
                    {locAddressMissing ? <span className="text-bridal-coral">Address needed</span> : locAddress}
                  </>
                )}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-bridal-text-soft" aria-hidden />
          </button>
          <DeskSheet
            open={locationOpen}
            onOpenChange={setLocationOpen}
            title="Where will the service happen?"
            description="Optional — leave blank if it happens at the vendor's usual address."
          >
            {/* Optional; when the vendor type strongly suggests a mode it
                surfaces a "Suggested" chip without forcing the choice. */}
            <ServiceLocationPicker
              frame="sheet"
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
          </DeskSheet>
        </div>
      </div>
    </TooltipProvider>
  )
}
