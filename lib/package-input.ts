/**
 * WP33 / VENDORTYPES-035 - package price and fleet-detail sanity for the registration wizard (mirrors backend src/utils/packageInput.js).
 * A negative price, a model year of 1800, -5 seats and 0 units used to pass the wizard and the server, then the approved listing could
 * never be booked ('Total amount must be a non-negative number').
 */
export const PACKAGE_PRICE_MAX = 100000000

/** null when fine. `value` is what the form holds (number or text). */
export function packagePriceIssue(value: unknown): string | null {
  const n = typeof value === "number" ? value : Number(String(value ?? "").trim())
  if (!Number.isFinite(n)) return "Price must be a number"
  if (n <= 0) return "Price must be more than zero"
  if (n > PACKAGE_PRICE_MAX) return "Price is too large"
  return null
}

const first = (v: unknown): unknown => (Array.isArray(v) ? v[0] : v)
const intOf = (v: unknown): number => {
  const m = /-?\d+/.exec(String(first(v) ?? ""))
  return m ? Number(m[0]) : NaN
}

/** Car-rental fleet entry: year 1990..next year, seats 1..60, units 1..999 (judged only when the field is filled). */
export function fleetIssues(features: Record<string, unknown> | undefined, now: Date = new Date()): Record<string, string> {
  const out: Record<string, string> = {}
  const rule = (key: string, label: string, min: number, max: number) => {
    const raw = features?.[key]
    if (raw === undefined || first(raw) === undefined || first(raw) === "") return
    const n = intOf(raw)
    if (!Number.isInteger(n) || n < min || n > max) out[key] = `${label} must be between ${min} and ${max}`
  }
  rule("year", "Model year", 1990, now.getUTCFullYear() + 1)
  rule("seatingCapacity", "Seats", 1, 60)
  rule("unitsAvailable", "Units available", 1, 999)
  return out
}
