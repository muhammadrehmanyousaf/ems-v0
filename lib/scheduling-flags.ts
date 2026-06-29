// Sub-venue scheduling + offline core-loop — feature flags (all OFF by default).
//
// Part of the venue-OS foundations (P0 · WS-0E) + scheduling depth (P1 · WS-1),
// decisions SCH-1/SCH-2/SCH-3/SCH-4 and PLT-3/PLT-4/PLT-5. These gate the new
// SubVenue / BookingSpace parallel-slot engine, mardana/zenana segregation
// bundling, hold-vs-cash bumping, intentional overbook, and peak-day turnaround
// shrink. While every flag is unset the existing single-resource slot engine
// (BusinessSlotTemplate / slotService) behaves exactly as today — legacy
// bookings with a NULL subVenueId are never touched.
//
//   NEXT_PUBLIC_SCHEDULING_MULTI_RESOURCE_ON=true   → parallel sub-venue slots
//   NEXT_PUBLIC_SCHEDULING_SEGREGATION_ON=true      → mardana/zenana bundling
//   NEXT_PUBLIC_SCHEDULING_HOLD_BUMP_ON=true        → paid advance pre-empts hold
//   NEXT_PUBLIC_SCHEDULING_OVERBOOK_ON=true         → audited intentional overbook
//   NEXT_PUBLIC_SCHEDULING_TURNAROUND_SHRINK_ON=true → manager+PIN turnaround shrink
//   (unset / anything else)                          → OFF (default)
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time. Each optional businessId
// arg is accepted for call-site compatibility; the per-business gate is the
// server-side FeatureFlagOverride table.)

const MULTI_RESOURCE_ON =
  process.env.NEXT_PUBLIC_SCHEDULING_MULTI_RESOURCE_ON === "true"
const SEGREGATION_ON =
  process.env.NEXT_PUBLIC_SCHEDULING_SEGREGATION_ON === "true"
const HOLD_BUMP_ON =
  process.env.NEXT_PUBLIC_SCHEDULING_HOLD_BUMP_ON === "true"
const OVERBOOK_ON =
  process.env.NEXT_PUBLIC_SCHEDULING_OVERBOOK_ON === "true"
const TURNAROUND_SHRINK_ON =
  process.env.NEXT_PUBLIC_SCHEDULING_TURNAROUND_SHRINK_ON === "true"

/** Parallel sub-venue slots (multiple bookable spaces per compound). */
export function isSchedulingMultiResourceOn(
  _businessId?: number | string | null,
): boolean {
  return MULTI_RESOURCE_ON
}

/** Mardana/zenana segregation as one bundled booking across two spaces. */
export function isSchedulingSegregationOn(
  _businessId?: number | string | null,
): boolean {
  return SEGREGATION_ON
}

/** Paid advance pre-empts an unexpired tentative hold (audited bump + grace). */
export function isSchedulingHoldBumpOn(
  _businessId?: number | string | null,
): boolean {
  return HOLD_BUMP_ON
}

/** Manager+PIN intentional overbook (never silent; always audited + badged). */
export function isSchedulingOverbookOn(
  _businessId?: number | string | null,
): boolean {
  return OVERBOOK_ON
}

/** Manager+PIN shrink of the default turnaround gap on peak days. */
export function isSchedulingTurnaroundShrinkOn(
  _businessId?: number | string | null,
): boolean {
  return TURNAROUND_SHRINK_ON
}

/** Convenience snapshot for non-conditional consumers. */
export const SCHEDULING_FLAGS = {
  multiResource: isSchedulingMultiResourceOn(),
  segregation: isSchedulingSegregationOn(),
  holdBump: isSchedulingHoldBumpOn(),
  overbook: isSchedulingOverbookOn(),
  turnaroundShrink: isSchedulingTurnaroundShrinkOn(),
}
