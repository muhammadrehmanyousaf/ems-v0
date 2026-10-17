/**
 * WP37 (CUSTOMER-006): the advance the SERVER will ask for, so the Review step does not print "Advance after
 * approval - Rs 0" and then the booking is made with a 10% advance the customer is later asked to transfer.
 *
 * A mirror of `computeDownPayment` (ems-v0-backend src/services/pricingService.js), the one function that decides
 * the advance for every booking. Keep them identical; scripts/wp37-money-check.mts pins the table of cases.
 *
 *   - a percentage venue: round(total x pct)
 *   - a venue that made ANY deposit choice (a flat type, "Fixed Amount" with a value, or a positive value with no
 *     type): that flat amount - an explicit "Fixed Amount 0" is "no advance"
 *   - a venue that never configured one: the platform default (10% of the total), so no date is held for free
 *   - never more than the total, never negative, and an advance too small to transfer (< Rs 150) is collected at
 *     the venue instead
 */
export const PLATFORM_DEFAULT_ADVANCE_PCT = 10
export const MIN_CHARGEABLE_PKR = 150

export type AdvanceTerms = { downPaymentType?: string | null; downPayment?: number | string | null } | null | undefined

export function effectiveAdvance(venue: AdvanceTerms, total: number): number {
  const amount = Number(total) || 0
  if (!(amount > 0)) return 0
  const type = String(venue?.downPaymentType || "").toLowerCase()
  const raw = venue?.downPayment
  const value = parseFloat(String(raw ?? "")) || 0
  const configured =
    type === "percentage" || type === "percent" || type === "fixed" || type === "flat" ||
    (type === "fixed amount" && raw !== null && raw !== undefined && raw !== "" && Number.isFinite(parseFloat(String(raw))) && parseFloat(String(raw)) >= 0) ||
    value > 0
  let advance: number
  if (type === "percentage" || type === "percent") advance = Math.round(amount * (value / 100))
  else if (configured) advance = value
  else advance = Math.round(amount * (PLATFORM_DEFAULT_ADVANCE_PCT / 100))
  if (advance > amount) advance = amount
  if (advance < 0) advance = 0
  if (advance > 0 && advance < MIN_CHARGEABLE_PKR) advance = 0
  return advance
}
