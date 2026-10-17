/**
 * WP37 (BOOKINGS-001): the figure the vendor typed in "Tay raqam" is ALWAYS the booking's price, so it is always
 * sent as `negotiatedAmount` (the field the server honours for the listing owner: it REPLACES the catalogue
 * price, minimum included, with or without a package). It used to go as `agreedAmount` when no package was picked,
 * which the server only honours for a venue with no price at all: on a priced venue the booking was made at the
 * venue minimum while the screen had promised the typed total.
 */
export function agreedPriceField(agreed: number): { negotiatedAmount?: number } {
  return Number.isFinite(agreed) && agreed > 0 ? { negotiatedAmount: agreed } : {}
}

/** The total the server actually booked, from whatever envelope `BookingsAPI.create` returned (null when unknown). */
export function bookedTotalFromSaved(res: unknown): number | null {
  const env = res as { data?: { booking?: { totalAmount?: unknown } }; booking?: { totalAmount?: unknown } } | null
  const raw = env?.data?.booking?.totalAmount ?? env?.booking?.totalAmount
  const n = Number(raw)
  return raw !== undefined && raw !== null && raw !== "" && Number.isFinite(n) ? n : null
}
