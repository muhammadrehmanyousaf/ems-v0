/**
 * SLOTS step 10 — one way to name a booking's time slot.
 *
 * Before this there were seven, and they disagreed:
 *
 *   date-time-step        PERIODS            09:00 "Morning · 9 AM to 12 PM"
 *   date-selection-step   timeSlots          09:00 "Morning · 9 AM to 12 PM"
 *   review-step           PERIOD_LABEL       09:00 "Morning · 9 AM to 12 PM"
 *   preview-step          getTimeSlotDisplay 09:00 "Morning (9 AM - 12 PM)"
 *   payment-modal         getTimeSlotText    09:00 "Morning (9 AM - 12 PM)"
 *   vendor-success-step   getTimeSlotText    09:00 "Morning (9AM - 12PM)"
 *   success-step          inline
 *
 * Three punctuations of the same sentence, and worse: vendor-success-step had
 * no case for 14:00 or 18:00 at all, so two of the three canonical slots fell
 * through to `default` and the vendor's own confirmation screen showed a bare
 * "14:00".
 *
 * ── The part that is not duplication ──────────────────────────────────────
 *
 * None of the seven could name a VENDOR's slot. The picker shows
 * "Dinner event · 19:00 – 23:00" from a slot template, then stores only
 * `timeSlot: "19:00"` and `slotTemplateId`. The label and the real hours were
 * dropped at the point of selection, so review, preview, payment and both
 * success screens had nothing to render but the raw start time — and, for a
 * label like "Baraat", nothing at all.
 *
 * That is why the four screens disagreed with the picker the customer had just
 * used. Adding an eighth map would not have fixed it. The slot has to travel
 * with the booking, which is what `SlotDescriptor` is for.
 *
 * ── Punctuation ───────────────────────────────────────────────────────────
 *
 * "9 AM to 12 PM", not "9 AM - 12 PM". Issue #46: Pakistani vendors were
 * reading the en-dash as a different symbol, so the plain word won. That
 * decision already existed in two of the seven; it is now simply the rule.
 */

export interface SlotDescriptor {
  /** The legacy free-string time on the booking: "09:00", or a name like "Baraat". */
  bookingTime?: string | null;
  /** The vendor's own slot, when the booking was made against one. */
  slotLabel?: string | null;
  slotStartTime?: string | null;
  slotEndTime?: string | null;
}

export interface SlotDescription {
  /** The short name: "Morning", "Dinner event", "Baraat". */
  label: string;
  /** The hours, or "" when they are genuinely unknown. */
  hint: string;
  /** Label and hours together, for one-line display. */
  full: string;
  /** Where the answer came from — useful in tests and for deciding emphasis. */
  source: "vendor" | "legacy" | "clock" | "raw" | "none";
}

const HHMM = /^(\d{1,2}):(\d{2})/;

/** "19:00" → "7 PM"; "19:30" → "7:30 PM". Minutes are shown only when non-zero. */
export function to12h(value: string | null | undefined): string {
  const m = HHMM.exec(String(value ?? "").trim());
  if (!m) return "";
  const h24 = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h24) || h24 > 23 || !Number.isFinite(min) || min > 59) return "";
  const suffix = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return min === 0 ? `${h12} ${suffix}` : `${h12}:${String(min).padStart(2, "0")} ${suffix}`;
}

/** "19:00", "23:00" → "7 PM to 11 PM". Empty when either end is unreadable. */
export function formatSlotRange(start: string | null | undefined, end: string | null | undefined): string {
  const a = to12h(start);
  const b = to12h(end);
  return a && b ? `${a} to ${b}` : "";
}

/**
 * The three canonical legacy periods — `ALLOWED_BOOKING_SLOTS` on the backend
 * (src/utils/constants.js). This is the ONLY definition of them on the client.
 *
 * The hours here are the display copy customers have always been shown. They
 * are deliberately NOT presented as the claim window: the backend's legacy
 * bucketing runs a 09:00 booking to 14:00, not to 12:00. Naming a slot and
 * computing what it blocks are different jobs, and this module only does the
 * first one.
 */
/**
 * The four slots a customer picks from when they have not chosen a specific
 * space. Whole day / Day / Midday / Evening — three blocks plus the buyout.
 *
 * ── Why these exact values, and not tidier ones ───────────────────────────
 *
 * `value` is the booking's stored `bookingTime`. It is the IDENTITY of the
 * slot, so two slots cannot share a start time — which is why "Whole day" and
 * "Day" cannot both be 10:00, the obvious first choice.
 *
 * Checked against production before choosing (133 live bookings):
 *
 *   09:00   10 bookings   Morning    9-12
 *   12:00    6 bookings   Midday    12-16
 *   14:00   11 bookings   Afternoon 14-18
 *   18:00   51 bookings   Evening   18-22
 *   10:00    0 bookings   free
 *
 * So the hours below are the hours already stored. Nothing is re-timed and no
 * existing booking is misrepresented: 10:00 is genuinely unused and takes the
 * buyout, and the only change to a live row is that the 10 bookings at 09:00
 * are now called "Day" instead of "Morning" — same hours, better name for a
 * slot that a Pakistani venue sells as the daytime function.
 *
 * Making Whole day 09:00 instead would have redisplayed those 10 real bookings
 * as running 9 AM to 10 PM, which is a lie about someone's calendar.
 *
 * 14:00 "Afternoon" is deliberately NOT offered as a new choice — four slots is
 * the point — but stays in LEGACY_ALIASES so its 11 bookings still render with
 * their real name and hours.
 *
 * Backend counterpart: CANONICAL_SLOTS in venueSlotService and
 * ALLOWED_BOOKING_SLOTS in utils/constants. All three must agree.
 */
export const LEGACY_PERIODS = [
  { value: "10:00", label: "Whole day", startTime: "10:00", endTime: "22:00" },
  // QA #5 — this 09:00 slot IS the morning function (09:00–12:00); it was the
  // original "Morning" and got relabeled "Day". Restoring "Morning" is accurate
  // (9 AM–12 PM), needs no key change, and misrepresents no stored booking (the
  // 10 live rows at "09:00" are genuinely morning functions). NOTE: a morning
  // slot was deliberately NOT added to the backend CANONICAL_SLOTS/seed — there
  // it would overlap the canonical "Day" (10:00–14:00), and the conflict check
  // is per-slot-template (not whole-date), so an overlapping morning+day pair
  // could double-book a venue 10–12. Template venues can add a non-overlapping
  // morning slot from the vendor editor if they want one.
  { value: "09:00", label: "Morning", startTime: "09:00", endTime: "12:00" },
  { value: "12:00", label: "Midday", startTime: "12:00", endTime: "16:00" },
  /**
   * 22:00, not 23:00. This one line is where the platform's worst live booking
   * bug came from: the canonical vocabulary shipped an "Evening" running to
   * 23:00, vendors copied the platform's own worked example into their slot
   * templates, and 40 of 115 active slots ended past the 10 PM closure. Nothing
   * caught it until a CUSTOMER pressed Pay & Confirm.
   */
  { value: "18:00", label: "Evening", startTime: "18:00", endTime: "22:00" },
] as const;

/**
 * Times that are not in ALLOWED_BOOKING_SLOTS but exist in stored bookings, and
 * that two of the seven screens already named. Kept so those screens do not
 * regress to a bare "12:00" — not extended, because inventing hours for a slot
 * nobody defined is how this mess started.
 */
const LEGACY_ALIASES: Record<string, { label: string; startTime: string; endTime: string }> = {
  // 11 live bookings. Dropped from the picker when the vocabulary became four
  // slots, but it must still render with its real name and hours — a stored
  // booking does not stop being an afternoon because we stopped offering one.
  "14:00": { label: "Afternoon", startTime: "14:00", endTime: "18:00" },
  "17:00": { label: "Evening", startTime: "17:00", endTime: "22:00" },
};

function periodFor(value: string): { label: string; startTime: string; endTime: string } | null {
  const hit = LEGACY_PERIODS.find((p) => p.value === value);
  if (hit) return { label: hit.label, startTime: hit.startTime, endTime: hit.endTime };
  return LEGACY_ALIASES[value] ?? null;
}

/**
 * Name a booking's slot, preferring what the vendor actually sold.
 *
 * Resolution order, most specific first:
 *   1. the vendor's own slot  — "Dinner event", "7 PM to 11 PM"
 *   2. a canonical period     — "Morning", "9 AM to 12 PM"
 *   3. a bare clock time      — "7 PM", no hours claimed
 *   4. whatever string it is  — "Baraat", no hours claimed
 */
export function describeSlot(d: SlotDescriptor | null | undefined): SlotDescription {
  const raw = String(d?.bookingTime ?? "").trim();
  const vendorLabel = String(d?.slotLabel ?? "").trim();
  const vendorHint = formatSlotRange(d?.slotStartTime, d?.slotEndTime);

  // 1 — the vendor's own slot. A label alone still wins: "Dinner event" is a
  // better answer than "7 PM" even when the hours did not travel with it.
  if (vendorLabel) {
    return {
      label: vendorLabel,
      hint: vendorHint,
      full: vendorHint ? `${vendorLabel} · ${vendorHint}` : vendorLabel,
      source: "vendor",
    };
  }
  // A slot with hours but no name — describe the hours rather than say nothing.
  if (vendorHint) {
    return { label: vendorHint, hint: "", full: vendorHint, source: "vendor" };
  }

  if (!raw) return { label: "", hint: "", full: "", source: "none" };

  // 2 — a canonical period.
  const period = periodFor(raw.slice(0, 5));
  if (period) {
    const hint = formatSlotRange(period.startTime, period.endTime);
    return { label: period.label, hint, full: `${period.label} · ${hint}`, source: "legacy" };
  }

  // 3 — a clock time nobody has named. Say the time, claim no hours.
  const clock = to12h(raw);
  if (clock) return { label: clock, hint: "", full: clock, source: "clock" };

  // 4 — a named function: "Baraat", "Mehndi". It is already the best label there is.
  return { label: raw, hint: "", full: raw, source: "raw" };
}

/** Convenience for the many screens that only want one line of text. */
export function slotText(d: SlotDescriptor | null | undefined): string {
  return describeSlot(d).full;
}

/**
 * A descriptor for a Booking row as the API returns it.
 *
 * `slotTemplateSnapshotJson` (BK-084) is the slot frozen at the moment of sale,
 * which is the right thing to name a sold booking by — a vendor who later edits
 * "Dinner 19:00–23:00" to end at 22:00 must not retroactively change what an
 * already-sold wedding says it bought.
 *
 * Read defensively: the customer-facing booking, payments and detail endpoints
 * do not currently return it, so today this resolves to the legacy period names
 * and a bare clock time for vendor slots. It upgrades on its own the moment the
 * field is included, rather than needing every screen revisited again.
 */
export function slotFromBooking(b: unknown): SlotDescriptor {
  const row = (b ?? {}) as Record<string, any>;
  const snap = row.slotTemplateSnapshotJson ?? row.slotTemplate ?? null;
  return {
    bookingTime: row.bookingTime ?? row.timeSlot ?? null,
    slotLabel: snap?.label ?? row.slotLabel ?? null,
    slotStartTime: snap?.startTime ?? row.slotStartTime ?? null,
    slotEndTime: snap?.endTime ?? row.slotEndTime ?? null,
  };
}
