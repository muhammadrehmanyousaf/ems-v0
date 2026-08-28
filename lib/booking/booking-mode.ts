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
 * WW-DIRECT-PAY — NULL / absent / unrecognised reads as `request`.
 *
 * This was `instant`, and that polarity was load-bearing while the PLATFORM
 * took the advance: approval was the last gate, so confirming on the vendor's
 * click was correct and defaulting the other way would have stalled every
 * booking behind an approval step nobody had been asked to perform.
 *
 * The platform no longer takes any money — the customer pays the venue
 * directly and files the evidence afterwards. There is nothing for an
 * `instant` venue to confirm on, so acceptance becomes the FIRST gate for
 * everyone. Mirrors `Business.effectiveBookingMode` on the server, which
 * changed in the same commit; migration
 * 20260828120000-ww-direct-pay-request-mode moves the stored rows so the
 * column and this fallback agree.
 */
export function effectiveBookingMode(
  biz: { bookingMode?: string | null } | null | undefined,
): BookingMode {
  const m = String(biz?.bookingMode || "").toLowerCase();
  return (BOOKING_MODES as string[]).includes(m) ? (m as BookingMode) : "request";
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
    "Legacy. The platform no longer takes payments, so there is no advance to ask for up front — this behaves as \"I accept bookings first\".",
  request:
    "You see the request first and accept or decline it. Once you accept, the customer is shown your account details and pays you directly.",
  inquiry_only:
    "No online booking. Customers send an enquiry and you contact them.",
};
