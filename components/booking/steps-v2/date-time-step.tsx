"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
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

  /** A single day cell in the monthly grid. Airbnb-style: square, large
   *  numeral, dot indicator for partial availability. */
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

    return (
      <button
        key={key}
        type="button"
        onClick={() => handlePickDay(d)}
        disabled={disabled}
        aria-label={`${WEEKDAY_FULL[d.getDay()]}, ${MONTHS_FULL[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}${
          isPast ? " (in the past)" : isBlocked ? " (not available)" : isPending ? " (checking availability)" : ""
        }`}
        aria-pressed={isSelected}
        className={`
          relative h-11 sm:h-12 w-full flex flex-col items-center justify-center
          rounded-full text-center transition-all
          font-display text-[14px] sm:text-[15px] tabular-nums leading-none
          ${!inMonth ? "opacity-30" : ""}
          ${
            /* Pending is greyed but NOT struck through: a day we have not
               heard about yet is not a day the venue has refused, and
               striking it out would state something untrue for a second. */
            isPending && !isPast
              ? "text-bridal-text-soft/40 cursor-wait"
              : disabled
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
        {/* Promised a hold until 2026-08-29, when holds were removed from the
            booking flow. The date is not reserved by choosing it here, and the
            customer is better served knowing that than being told otherwise. */}
        <p className="mt-1 font-bridal text-[12.5px] text-bridal-text-soft">
          Pick a date and a time of day. The date isn&apos;t reserved until the venue
          accepts your request, so send it as soon as you&apos;re ready.
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
        {/* WW-SPACE-FIRST — the space is chosen BEFORE the date and the
           guest count, because it decides both.
           It used to sit at the BOTTOM of this column, under the time picker,
           the service-location card and the arrangement question. So a family
           set 800 guests against the whole venue's ceiling, picked a slot, and
           only then met the hall selector — at which point the guest count had
           to be clamped down and the slots they had already been offered were
           re-fetched and could disappear. Every one of those corrections is
           the form taking something back that it had just given.
           Asking first means the ceiling, the slots, the packages and the
           menus are all the chosen hall's from the outset. */}
        {/* F-2 — canonical sub-venue picker (venue-hierarchy). Shown when the
           venue built ANY space(s); sends subVenueId (the per-hall path). Was
           gated `> 1`, which silently hid a venue's only hall (QA #19) — now
           `>= 1` so a single configured space is selectable. */}
        {subVenueSpaces.length >= 1 && (
          <section className="space-y-2">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">
              Which hall?
            </p>
            <select
              value={(formData as any).selectedSubVenueId || ""}
              onChange={(e) => {
                const id = e.target.value
                // Carry the hall's NAME forward too. Later steps only ever had
                // the id, so the Packages step could not say "Terrace Lawn
                // package" and the Review step could not name the room the
                // customer is actually booking.
                const picked = subVenueSpaces.find((sp) => String(sp.id) === String(id))
                updateFormData((prev) => ({
                  ...(prev as any),
                  selectedSubVenueId: id,
                  selectedSubVenueName: picked?.name || null,
                }))
              }}
              className="w-full rounded-md border border-bridal-beige bg-bridal-ivory px-3 py-2.5 font-bridal text-[13px] text-bridal-charcoal outline-none focus:border-bridal-gold-dark"
            >
              <option value="">Whole venue / any hall</option>
              {/* The capacity is on the OPTION, not only in the warning that
                  fires once a guest count is already too high. A family
                  picking between halls chooses by how many people it seats;
                  making them pick first and be corrected second is the wrong
                  order. */}
              {subVenueSpaces.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {" ".repeat(sp.depth * 2)}{sp.name}{sp.kind ? ` — ${sp.kind}` : ""}
                  {sp.fireRatedCapacity ? ` (up to ${sp.fireRatedCapacity} guests)` : ""}
                </option>
              ))}
            </select>
            <p className="font-bridal text-[10.5px] text-bridal-text-soft">
              Pick a specific hall, floor or partition, or leave as the whole venue.
            </p>

            {/* 10.13 — the answer, while it can still change the decision.

               Reported, never refused. A MIXED hall is not an error, it is a
               fact the family needs BEFORE the night, while there is still
               time to pick another hall or ask for a partition. Blocking here
               would refuse a booking the venue may well be able to
               accommodate, over a question only the venue can answer. */}
            {genderFit.status === "mismatch" && genderFit.reason && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-300 px-3 py-2 font-bridal text-[12px] text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p>{genderFit.reason}</p>
              </div>
            )}
            {genderFit.status === "fits" && (
              <p className="font-bridal text-[11px] text-[#3F6B43]">
                This hall can be arranged the way you&apos;ve asked.
              </p>
            )}
            {/* The venue has not recorded what it can do — said as a question
               for the venue, not a defect of it. */}
            {genderFit.status === "unknown" && genderFit.reason && (
              <p className="font-bridal text-[11px] text-bridal-text-soft">{genderFit.reason}</p>
            )}

            {/* 10.16 (UC-22) — rain on an open lawn. A December wedding on an
               open lawn in Lahore is a normal thing to book and an abnormal
               thing to have no plan for. */}
            {backupPlan?.exposed && backupPlan.message && (
              <div
                className={
                  backupPlan.hasPlan
                    ? "flex items-start gap-2 rounded-md bg-bridal-sage/15 border border-bridal-sage/40 px-3 py-2 font-bridal text-[12px] text-[#3F6B43]"
                    : "flex items-start gap-2 rounded-md bg-amber-50 border border-amber-300 px-3 py-2 font-bridal text-[12px] text-amber-800"
                }
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p>{backupPlan.message}</p>
              </div>
            )}
          </section>
        )}
        {/* Which hall / lawn / partition? (BusinessResource model.) Only shown
           when the venue configured bookable resources AND is NOT using the
           canonical sub-venue tree (below). Optional — "whole venue" unpins. */}
        {spaces.length > 0 && subVenueSpaces.length === 0 && (
          <section className="space-y-2">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">
              Which space?
            </p>
            <select
              value={(formData as any).selectedResourceId || ""}
              onChange={(e) => {
                const id = e.target.value
                const picked = spaces.find((sp) => String(sp.id) === String(id))
                updateFormData((prev) => ({
                  ...(prev as any),
                  selectedResourceId: id,
                  selectedResourceName: picked?.label || null,
                }))
              }}
              className="w-full rounded-md border border-bridal-beige bg-bridal-ivory px-3 py-2.5 font-bridal text-[13px] text-bridal-charcoal outline-none focus:border-bridal-gold-dark"
            >
              <option value="">Whole venue / any space</option>
              {spaces.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.label}{sp.kind ? ` — ${sp.kind}` : ""}
                  {sp.capacityUnit ? ` (up to ${sp.capacityUnit} guests)` : ""}
                </option>
              ))}
            </select>
            <p className="font-bridal text-[10.5px] text-bridal-text-soft">
              Pick a specific hall, lawn or partition, or leave as the whole venue.
            </p>
          </section>
        )}

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
            /**
             * WW-CAL-CLOSED — a period the venue does not run is not the same
             * as one that is already taken, and only the second was disabled.
             * A venue that opens for dinner only had its Morning and Afternoon
             * cards fully selectable — not booked, not held, just never on
             * offer — and the customer found out at submit.
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
                {/* Says WHY it cannot be picked. "Not available" reads as a
                    bug on a card that looks identical to the bookable ones. */}
                {notOffered && !isBooked && !isHeld && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded font-bridal text-[8.5px] uppercase tracking-[0.1em] font-medium bg-bridal-beige/60 text-bridal-text-soft border border-bridal-beige">
                    Not offered
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

        {/* 10.13 (UC-15) — how the function is arranged.

           `SubVenue.genderMode` has been on every space on the platform since
           the venue-hierarchy work, and nothing ever compared it to what the
           customer wanted, because no screen ever asked. A family booking a
           zenana function into a MIXED hall found out when the guests arrived
           — and for a lot of Pakistani households that decides whether the
           women of the family attend at all.

           Optional, and never blocking. A family that states nothing is not
           refused and is told nothing, which is the honest answer: they have
           not been checked. */}
        {(vendorTypeName === "Wedding venue" || subVenueSpaces.length >= 1) && (
          <section className="space-y-2">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">
              How is the function arranged?
            </p>
            <select
              value={formData.requestedGenderMode || ""}
              onChange={(e) =>
                updateFormData((prev) => ({
                  ...prev,
                  requestedGenderMode: (e.target.value || null) as BookingFormData["requestedGenderMode"],
                }))
              }
              className="w-full rounded-md border border-bridal-beige bg-bridal-ivory px-3 py-2.5 font-bridal text-[13px] text-bridal-charcoal outline-none focus:border-bridal-gold-dark"
            >
              <option value="">No preference / decide later</option>
              {ARRANGEMENT_CHOICES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} — {c.hint}
                </option>
              ))}
            </select>
            <p className="font-bridal text-[10.5px] text-bridal-text-soft">
              We&apos;ll check the hall you pick can be arranged that way, and tell the venue.
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
              {/* Names the limit that is actually in force and where it comes
                  from. "Max 1200" on a page where the chosen hall holds 300 is
                  worse than no number at all. */}
              {(venue?.minCapacity || activeLimit) && (
                <p className="font-bridal text-[10.5px] text-bridal-text-soft mt-0.5">
                  {venue?.minCapacity ? `From ${venue.minCapacity}` : ""}
                  {venue?.minCapacity && activeLimit ? " · " : ""}
                  {activeLimit ? `${activeLimit.source} ${activeLimit.max}` : ""}
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
                max={activeLimit?.max}
                onChange={(e) => {
                  const val = e.target.value
                  let n = val === "" ? 0 : parseInt(val, 10)
                  if (Number.isNaN(n)) n = 0
                  if (activeLimit && n > activeLimit.max) n = activeLimit.max
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

          {/* Advisory only — both are the vendor's preferences, not physical or
              legal limits, so they inform rather than block. */}
          {(comfortWarning || belowMinimum) && (
            <div className="mt-2 space-y-1">
              {comfortWarning && (
                <p className="font-bridal text-[10.5px] leading-snug text-bridal-mauve">{comfortWarning}</p>
              )}
              {belowMinimum && (
                <p className="font-bridal text-[10.5px] leading-snug text-bridal-mauve">{belowMinimum}</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* (Service-location picker moved up into the right column beside the
          calendar — see the "right column" block above.) */}
    </div>
  )
}
