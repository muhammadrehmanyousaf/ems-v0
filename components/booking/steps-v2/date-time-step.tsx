"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import type { BookingFormData, EventVenue } from "@/lib/types"
import { ChevronLeft, ChevronRight, Sun, Sunset, Moon, Minus, Plus, AlertTriangle, Timer, XCircle } from "lucide-react"
import { VendorAPI } from "@/lib/api/vendors"

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

const PERIODS = [
  { value: "09:00", label: "Morning",   hint: "9 AM – 12 PM",  icon: Sun },
  { value: "14:00", label: "Afternoon", hint: "2 PM – 6 PM",   icon: Sunset },
  { value: "18:00", label: "Evening",   hint: "6 PM – 11 PM",  icon: Moon },
] as const

const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"]
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

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

  // Anchor for the visible day strip — first of 14 visible days.
  const initialAnchor = (() => {
    if (formData.bookingDate) {
      const d = new Date(formData.bookingDate)
      if (!isNaN(d.getTime())) {
        const an = startOfDay(d)
        return an < today ? today : addDays(an, -3)
      }
    }
    return today
  })()
  const [anchor, setAnchor] = useState<Date>(initialAnchor)

  const selectedDate: Date | undefined = useMemo(() => {
    if (!formData.bookingDate) return undefined
    const d = new Date(formData.bookingDate)
    return isNaN(d.getTime()) ? undefined : d
  }, [formData.bookingDate])

  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({})
  const fetchMonth = useCallback(async (d: Date) => {
    if (!venue?.id) return
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    try {
      const data = await VendorAPI.getMonthAvailability([venue.id], m)
      setAvailability((prev) => ({ ...prev, ...(data[venue.id] || {}) }))
    } catch { /* silent */ }
  }, [venue?.id])

  // Fetch the months covered by the visible strip
  useEffect(() => {
    fetchMonth(anchor)
    fetchMonth(addDays(anchor, 13))
  }, [anchor, fetchMonth])

  const days = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => addDays(anchor, i))
  }, [anchor])

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
    const a = availability[key]
    if (a && (a.isBlocked || a.availableSlots.length === 0)) return
    updateFormData((prev) => ({
      ...prev,
      bookingDate: prev.timeSlot ? formatBookingDate(d, prev.timeSlot) : (d.toISOString() as any),
      // keep timeSlot if compatible; clear if booked
    }))
  }

  const selectedKey = selectedDate ? toKey(selectedDate) : null
  const selectedAvail = selectedKey ? availability[selectedKey] : undefined

  const handlePickPeriod = (period: string) => {
    if (!selectedDate) return
    const a = selectedAvail
    if (a?.bookedSlots?.includes(period)) return
    if (a?.heldSlots?.includes(period)) return
    updateFormData((prev) => ({
      ...prev,
      timeSlot: period,
      bookingDate: formatBookingDate(selectedDate, period),
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

  // Guests
  const isCarRental = venue?.vendor?.vendorType === "Car rental"
  const isBridalWear = venue?.vendor?.vendorType === "Bridal wearing"
  const isWeddingStationery = venue?.vendor?.vendorType === "Wedding Invitations and Stationery"
  const enforceCapacity = !!venue?.maxCapacity || !!venue?.minCapacity
  const adjust = (delta: number) =>
    updateFormData((prev) => {
      let n = Math.max(0, (prev.guestCount || 0) + delta)
      if (venue?.maxCapacity && n > venue.maxCapacity) n = venue.maxCapacity
      return { ...prev, guestCount: n }
    })

  const renderDayRow = (slice: Date[]) => (
    <div className="grid grid-cols-10 gap-1.5">
      {slice.map((d) => {
        const key = toKey(d)
        const a = availability[key]
        const isPast = d < today
        const isBlocked = !!a?.isBlocked || (a && a.availableSlots.length === 0)
        const isPartial = !!a && a.bookedSlots.length > 0 && !isBlocked
        const isSelected = sameDay(d, selectedDate)
        const disabled = isPast || isBlocked
        return (
          <button
            key={key}
            type="button"
            onClick={() => handlePickDay(d)}
            disabled={disabled}
            className={`relative h-12 flex items-center justify-center gap-1.5 rounded-md text-center transition-all border
              ${disabled
                ? "border-transparent text-bridal-text-soft/40 cursor-not-allowed"
                : isSelected
                  ? "border-bridal-gold-dark bg-bridal-cream shadow-[0_6px_18px_-12px_rgba(176,125,84,0.5)]"
                  : "border-bridal-beige bg-bridal-ivory hover:border-bridal-gold/55 hover:bg-bridal-cream text-bridal-charcoal"
              }`}
          >
            <span className={`font-bridal text-[9px] uppercase tracking-[0.14em] font-medium ${isSelected ? "text-bridal-gold-dark" : disabled ? "" : "text-bridal-text-soft"}`}>
              {WEEKDAY_SHORT[d.getDay()]}
            </span>
            <span className={`font-display italic text-[15px] tabular-nums leading-none ${isSelected ? "text-bridal-charcoal" : ""}`}>
              {d.getDate()}
            </span>
            {isPartial && !isSelected && (
              <span aria-hidden className="absolute bottom-1 w-1 h-1 rounded-full bg-bridal-gold" />
            )}
          </button>
        )
      })}
    </div>
  )

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

      {/* Date strip */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">
            {selectedDate ? formatLong(selectedDate) : "Choose a day"}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setAnchor((a) => addDays(a, -30) < today ? today : addDays(a, -30))}
              className="w-7 h-7 inline-flex items-center justify-center rounded-md text-bridal-charcoal hover:bg-bridal-blush/55 disabled:opacity-30"
              disabled={anchor <= today}
              aria-label="Earlier dates"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setAnchor((a) => addDays(a, 30))}
              className="w-7 h-7 inline-flex items-center justify-center rounded-md text-bridal-charcoal hover:bg-bridal-blush/55"
              aria-label="Later dates"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {renderDayRow(days.slice(0, 10))}
        {renderDayRow(days.slice(10, 20))}
        {renderDayRow(days.slice(20, 30))}

        <div className="flex items-center gap-3 font-bridal text-[10.5px] text-bridal-text-soft">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-bridal-gold" />
            Limited availability
          </span>
        </div>
      </section>

      {/* Time period — segmented */}
      <section className="space-y-2.5">
        <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">Time of day</p>
        <div className="grid grid-cols-3 gap-2">
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
                className={`relative flex flex-col items-start gap-1.5 p-3 rounded-md border text-left transition-all
                  ${disabled
                    ? "border-bridal-beige bg-bridal-ivory text-bridal-text-soft/50 cursor-not-allowed"
                    : isSelected
                      ? "border-bridal-gold-dark bg-bridal-cream shadow-[0_8px_22px_-14px_rgba(176,125,84,0.45)] text-bridal-charcoal"
                      : "border-bridal-beige bg-bridal-ivory hover:border-bridal-gold/55 hover:bg-bridal-cream text-bridal-charcoal"
                  }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-bridal-gold-dark" : disabled ? "" : "text-bridal-mauve"}`} />
                <div>
                  <p className="font-display italic text-[15px] leading-tight">{p.label}</p>
                  <p className="font-bridal text-[10.5px] text-bridal-text-soft mt-0.5">{p.hint}</p>
                </div>
                {isBooked && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded font-bridal text-[8.5px] uppercase tracking-[0.1em] font-medium bg-bridal-coral/15 text-bridal-coral border border-bridal-coral/40">
                    Booked
                  </span>
                )}
                {isHeld && !isBooked && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded font-bridal text-[8.5px] uppercase tracking-[0.1em] font-medium bg-bridal-gold/15 text-bridal-gold-dark border border-bridal-gold/45">
                    On hold
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

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

      {/* Guest count — inline stepper, only when relevant */}
      {!isCarRental && !isBridalWear && !isWeddingStationery && enforceCapacity && (
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
    </div>
  )
}
