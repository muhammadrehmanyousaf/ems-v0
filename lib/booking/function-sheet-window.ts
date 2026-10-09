/**
 * SLOT-PICKER — a function sheet's timings, read against the booking's slot.
 *
 * The run-sheet (BEO) has free clocks: setup, teardown and one time per row of
 * the timeline. Nothing connected them to the booking they belong to, so a row
 * could say "Khaana khulega 3:30 AM" for a dinner sold as 7 PM to 11 PM.
 *
 * This is an ADVISORY check, deliberately not a refusal: a run-sheet legitimately
 * starts before the slot (decor and setup) and ends after it (teardown), and the
 * hours the venue SELLS are enforced where the booking is made. So the rules are
 * the ones a person would apply by eye:
 *
 *   - a timeline row should sit inside the slot
 *   - setup may be before the slot starts, but not after it ends
 *   - teardown may be after the slot ends, but not before it starts
 *
 * Pure, so `scripts/slot-picker-check.mts` can pin it.
 */

import type { BookingData } from "@/lib/dashboard-types"
import { legacyPeriodWindow, to12h, formatSlotRange } from "@/lib/booking/slot-vocabulary"
import { slotContainsTime } from "@/lib/booking/slot-picker-model"

export type BookingWindow = { label: string; start: string; end: string; source: "slot" | "period" }

const hhmm = (t: unknown): string => String(t ?? "").slice(0, 5)
const mins = (t: unknown): number | null => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t ?? "").trim())
  if (!m) return null
  const h = Number(m[1]), min = Number(m[2])
  return h > 23 || min > 59 ? null : h * 60 + min
}

/**
 * The window a booking was sold for: its frozen slot (hours as sold), else the
 * platform's fixed period for its time, else nothing — a booking with a free-text
 * time ("Baraat") claims no hours, so nothing is checked against it.
 */
export function bookingWindowOf(
  b: Pick<BookingData, "bookingTime" | "slotTemplateSnapshotJson"> | null | undefined,
): BookingWindow | null {
  const snap = b?.slotTemplateSnapshotJson
  if (snap?.startTime && snap?.endTime) {
    return { label: String(snap.label || "Slot"), start: hhmm(snap.startTime), end: hhmm(snap.endTime), source: "slot" }
  }
  const p = legacyPeriodWindow(hhmm(b?.bookingTime))
  return p ? { label: p.label, start: p.startTime, end: p.endTime, source: "period" } : null
}

export type TimingInput = {
  window: BookingWindow | null
  timeline: { time?: string | null; activity?: string | null }[]
  setup?: string | null
  teardown?: string | null
}

/** Roman Urdu sentences, at most four, none of them blocking. Empty when nothing is off. */
export function timingNotes({ window: w, timeline, setup, teardown }: TimingInput): string[] {
  if (!w) return []
  const notes: string[] = []
  const span = formatSlotRange(w.start, w.end)
  const where = `${w.label}${span ? ` (${span})` : ""}`
  const wrapsMidnight = (mins(w.end) ?? 0) <= (mins(w.start) ?? 0)

  for (const r of timeline) {
    const t = hhmm(r.time)
    if (!t || mins(t) == null) continue
    if (!slotContainsTime({ startTime: w.start, endTime: w.end }, t)) {
      const what = String(r.activity || "").trim()
      notes.push(`${to12h(t)}${what ? ` (${what})` : ""} booking ke slot, ${where}, se bahar hai.`)
    }
  }
  const s = hhmm(setup), e = hhmm(teardown)
  const ws = mins(w.start), we = mins(w.end)
  if (!wrapsMidnight && ws != null && we != null) {
    if (mins(s) != null && (mins(s) as number) >= we) notes.push(`Setup ${to12h(s)} par hai — slot ${where} khatam hone ke baad.`)
    if (mins(e) != null && (mins(e) as number) < ws) notes.push(`Teardown ${to12h(e)} par hai — slot ${where} shuru hone se pehle.`)
  }
  return notes.slice(0, 4)
}
