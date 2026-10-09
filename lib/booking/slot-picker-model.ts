/**
 * SLOT-PICKER — what a "Waqt" picker shows, as pure data.
 *
 * Three surfaces ask "which times can this venue take on this date, in this
 * hall?": the public booking page, the vendor's "Nayi booking" form and the
 * vendor's reschedule dialog. They all read ONE server answer
 * (`/businesses/:id/slots/availability/bulk`, see slotService.computeAvailability
 * in the backend) and this file is the only place the answer is turned into
 * what is offered:
 *
 *   - which options exist, in what order, and which are enabled
 *   - the reason a disabled one is disabled (shown, never hidden)
 *   - what stays selected when the date, venue or hall changes underneath it
 *   - what the form must send for the selection
 *
 * No DOM, no network, no React: the artifact picker renders it and
 * `scripts/slot-picker-check.mts` pins it.
 */

import type { SlotAvailabilityRow, SlotDayMeta } from "@/lib/api/businessAvailability"
import { formatSlotRange } from "@/lib/booking/slot-vocabulary"

export type SlotStatus = "open" | "full" | "blocked" | "closed"

/** The booking time a whole-day venue is recorded under: the platform's "Whole day" period (10:00 to 22:00). */
export const WHOLE_DAY_TIME = "10:00"

/**
 * The one openness rule on the client. The server sends `status`; when it does
 * not (an older server), the same rule is computed from the other fields, exactly
 * as slotService/utils/slotRules.js `classifySlot` does:
 *
 *   open  <=>  runs this weekday AND not blocked AND capacity > 0 AND used < capacity
 */
export function slotStatus(row: Pick<SlotAvailabilityRow, "status" | "reason" | "blocked" | "runsThisWeekday" | "capacity" | "used" | "free">): { status: SlotStatus; reason: string | null } {
  if (row.status) return { status: row.status, reason: row.reason ?? null }
  if (row.blocked) return { status: "blocked", reason: "blocked" }
  if (row.runsThisWeekday === false) return { status: "closed", reason: "closed_weekday" }
  if ((Number(row.capacity) || 0) <= 0) return { status: "closed", reason: "capacity_zero" }
  const free = row.free != null ? Number(row.free) : Math.max(0, (Number(row.capacity) || 0) - (Number(row.used) || 0))
  if (free <= 0) return { status: "full", reason: "capacity_full" }
  return { status: "open", reason: null }
}

/** True only for a slot that may be offered. The public page uses this same function. */
export function isSlotOpen(row: SlotAvailabilityRow | null | undefined): boolean {
  return !!row && slotStatus(row).status === "open"
}

const hhmm = (t: string | null | undefined): string => String(t ?? "").slice(0, 5)

/** Minutes since midnight, or null. */
function mins(t: string | null | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t ?? "").trim())
  if (!m) return null
  const h = Number(m[1]), min = Number(m[2])
  return h > 23 || min > 59 ? null : h * 60 + min
}

/** Half-open [start, end); an end not after the start wraps past midnight. Same as slotRules.windowContains. */
export function slotContainsTime(row: Pick<SlotAvailabilityRow, "startTime" | "endTime">, time: string | null | undefined): boolean {
  const t = mins(time), s = mins(row.startTime), e = mins(row.endTime)
  if (t == null || s == null || e == null) return false
  return e > s ? t >= s && t < e : t >= s || t < e
}

// The block reasons the server writes itself; anything else is the vendor's own note.
const SYSTEM_BLOCK_REASONS = new Set(["whole_day", "slot_blocked", "recurring_whole_day", "recurring_slot", "blocked"])

export type PickerOption = {
  id: number
  name: string
  /** "7:00 PM to 11:00 PM" */
  range: string
  start: string
  end: string
  status: SlotStatus
  reason: string | null
  /** Roman Urdu, one short phrase: what the vendor needs to know about this slot. */
  note: string
  /** The vendor's own words behind a block, when they wrote any. */
  detail: string | null
  tone: "ok" | "warn" | "bad" | "mut"
  enabled: boolean
  selected: boolean
  /** Reschedule: the slot the booking already sits in on this very date. */
  isCurrent: boolean
}

export type PickerModel =
  | { mode: "slots"; options: PickerOption[]; anyOpen: boolean; banner: string | null }
  | { mode: "whole_day"; closingTime: string | null; banner: string }
  | { mode: "needs_space"; banner: string }

export function buildPickerModel(args: {
  rows: SlotAvailabilityRow[]
  meta: SlotDayMeta
  selectedId: number | null
  /** Reschedule only: the booking's current slot and whether the date has moved. */
  currentId?: number | null
  dateMoved?: boolean
}): PickerModel {
  const { rows, meta, selectedId, currentId = null, dateMoved = true } = args
  if (meta.mode === "whole_day") {
    if (meta.needsSpace) return { mode: "needs_space", banner: "Is venue ke slots hall ke hisaab se hain — pehle upar \"Hall / space\" chunein." }
    return {
      mode: "whole_day",
      closingTime: meta.closingTime,
      banner: "Ye venue poore din ke hisaab se book hota hai — waqt chunne ki zaroorat nahi. Booking \"Poora din\" ke taur par darj hogi.",
    }
  }
  const options: PickerOption[] = rows.map((r) => {
    const { status, reason } = slotStatus(r)
    const isCurrent = !dateMoved && currentId != null && Number(r.slotTemplateId) === Number(currentId)
    // The booking's own slot looks "full" because of the booking itself.
    const enabled = status === "open" || isCurrent
    const cap = Number(r.capacity) || 0
    const free = Number(r.free) || 0
    let note: string
    let tone: PickerOption["tone"]
    let detail: string | null = null
    if (isCurrent) { note = "Abhi isi slot mein hai"; tone = "ok" }
    else if (status === "open") { note = cap > 1 ? `${free} khaali · ${cap} mein se` : "Khaali"; tone = "ok" }
    else if (status === "full") { note = "Bhar gaya"; tone = "bad" }
    else if (status === "blocked") {
      note = "Aap ne band kiya"; tone = "warn"
      const why = String(r.blockReason ?? "").trim()
      if (why && !SYSTEM_BLOCK_REASONS.has(why)) detail = why
    } else if (reason === "closed_weekday") { note = "Is din ye slot nahi chalta"; tone = "mut" }
    else { note = "Band hai"; tone = "mut" }
    return {
      id: Number(r.slotTemplateId),
      name: r.label,
      range: formatSlotRange(r.startTime, r.endTime),
      start: hhmm(r.startTime),
      end: hhmm(r.endTime),
      status, reason, note, detail, tone, enabled,
      selected: enabled && selectedId != null && Number(r.slotTemplateId) === Number(selectedId),
      isCurrent,
    }
  })
  const anyOpen = options.some((o) => o.enabled)
  return {
    mode: "slots",
    options,
    anyOpen,
    banner: anyOpen ? null : "Is din koi slot khula nahi — doosri taareekh ya doosra hall chunein.",
  }
}

/**
 * What stays selected after the list is (re)loaded because the date, venue or
 * hall changed. Never a slot that is no longer offered: that is how a form ends
 * up submitting something that disappeared while it was open.
 *
 *   1. the previous choice, if it is still offered
 *   2. a slot containing the time a lead/hold arrived with, if that is offered
 *   3. the booking's own slot (reschedule), if it is offered
 *   4. nothing — the vendor chooses
 */
export function chooseSelection(args: {
  options: PickerOption[]
  previousId: number | null
  preferTime?: string | null
  currentId?: number | null
}): number | null {
  const offered = args.options.filter((o) => o.enabled)
  const byId = (id: number | null | undefined) => (id == null ? undefined : offered.find((o) => o.id === Number(id)))
  const prev = byId(args.previousId)
  if (prev) return prev.id
  if (args.preferTime) {
    const hit = offered.find((o) => slotContainsTime({ startTime: o.start, endTime: o.end }, args.preferTime))
    if (hit) return hit.id
  }
  const cur = byId(args.currentId)
  return cur ? cur.id : null
}

export type SubmitChoice =
  | { ok: true; bookingTime: string; slotTemplateId: number | null }
  | { ok: false; message: string }

/** What the form sends for the current picker state, or why it must not submit. */
export function submitChoice(args: { model: PickerModel | null; selectedId: number | null; loadFailed?: boolean; loading?: boolean }): SubmitChoice {
  if (args.loading) return { ok: false, message: "Slots abhi load ho rahe hain — ek lamha rukein." }
  if (args.loadFailed || !args.model) return { ok: false, message: "Slots load nahi hue — dobara koshish karein." }
  if (args.model.mode === "needs_space") return { ok: false, message: "Pehle hall / space chunein — is venue ke slots hall ke hisaab se hain." }
  if (args.model.mode === "whole_day") return { ok: true, bookingTime: WHOLE_DAY_TIME, slotTemplateId: null }
  const opt = args.model.options.find((o) => o.id === args.selectedId && o.enabled)
  if (!opt) {
    return { ok: false, message: args.model.anyOpen ? "Waqt (slot) chunein." : "Is din koi slot khula nahi — doosri taareekh ya hall chunein." }
  }
  return { ok: true, bookingTime: opt.start, slotTemplateId: opt.id }
}
