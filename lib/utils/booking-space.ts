/**
 * Which space a booking occupies — one answer, read the same way everywhere.
 *
 * The product grew two space tables. `BusinessResource` counts capacity for
 * vendor types whose "resource" is a crew, a chair or a vehicle, and picked up
 * a 'hall' kind along the way. `SubVenue` is the venue tree — Hall → Floor →
 * Partition, with capacity, slots, per-space expenses and P&L, the public space
 * selector and the booking engine hanging off it.
 *
 * Vendors build their halls in the SubVenue tree. The Bookings table read
 * `resource.label`, so it rendered "—" on every row and exported an empty
 * column in every CSV (WWL-050). A booking now records its SubVenue; `resource`
 * remains the fallback for the venues that did use the older screen.
 *
 * The client mirror of `event-planner-api/src/utils/spaceOccupancy.js`.
 */

interface SpaceBearingLine {
  subVenue?: { name?: string | null } | null
  resource?: { label?: string | null } | null
}

interface SpaceBearingBooking {
  bookingDetails?: SpaceBearingLine[] | null
}

/** The space name recorded against a booking, or "" when none is. */
export function spaceNameOf(booking: SpaceBearingBooking | null | undefined): string {
  const lines = booking?.bookingDetails
  if (!Array.isArray(lines)) return ""
  for (const line of lines) {
    const name = line?.subVenue?.name || line?.resource?.label
    if (name) return String(name)
  }
  return ""
}

/** True when a booking carries no space at all — the "Assign hall" prompt. */
export function isSpaceUnassigned(booking: SpaceBearingBooking | null | undefined): boolean {
  return spaceNameOf(booking) === ""
}

export default spaceNameOf
