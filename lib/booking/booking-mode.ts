/**
 * WW-BOOKING-MODE — how a booking with this venue reaches Confirmed.
 *
 * Mirrors `Business.effectiveBookingMode` on the server. Centralised for the
 * same reason it is centralised there: a venue that silently reads as `request`
 * in one place and `instant` in another strands its customers on a screen
 * waiting for an acceptance nobody was ever asked for.
 */

export type BookingMode = "instant" | "request" | "inquiry_only";

export const BOOKING_MODES: BookingMode[] = ["instant", "request", "inquiry_only"];

/**
 * NULL / absent / unrecognised reads as `instant` — which is what every venue
 * on the platform does today. That polarity is load-bearing: defaulting the
 * other way would put every existing venue behind an approval step their staff
 * have never been asked to perform, and every booking would stall.
 */
export function effectiveBookingMode(
  biz: { bookingMode?: string | null } | null | undefined,
): BookingMode {
  const m = String(biz?.bookingMode || "").toLowerCase();
  return (BOOKING_MODES as string[]).includes(m) ? (m as BookingMode) : "instant";
}

/** True when the vendor must accept before the customer is asked to pay. */
export function requiresVendorApproval(
  biz: { bookingMode?: string | null } | null | undefined,
): boolean {
  const m = effectiveBookingMode(biz);
  return m === "request" || m === "inquiry_only";
}

/** The label for the primary call-to-action on a listing. */
export function bookingCtaLabel(
  biz: { bookingMode?: string | null } | null | undefined,
): string {
  switch (effectiveBookingMode(biz)) {
    case "request": return "Request this date";
    case "inquiry_only": return "Check availability";
    default: return "Book now";
  }
}

export const BOOKING_MODE_LABELS: Record<BookingMode, string> = {
  instant: "Book instantly",
  request: "I accept bookings first",
  inquiry_only: "Enquiries only",
};

export const BOOKING_MODE_HINTS: Record<BookingMode, string> = {
  instant:
    "Customers are asked for the advance straight away. Fastest, but you find out about a booking after it's made.",
  request:
    "You see the request first and accept or decline it. We only ask for the advance once you've accepted.",
  inquiry_only:
    "No online booking. Customers send an enquiry and you contact them.",
};
