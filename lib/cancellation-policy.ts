/**
 * Cancellation policy wording + the "Partially Refundable" detail (fixed amount / percentage).
 *
 * Vendor registration stores the venue's answer to "Cancellation Policy" as a KEY
 * (`partially_refundable`) in some forms and as a label ("Partially Refundable") in others; the
 * review step, the venue page and the settings screens printed whatever was stored, so the key leaked
 * ("Why '_' is showing"). Every surface goes through `cancellationLabel` / `cancellationText` now.
 *
 * The value is what the VENUE KEEPS (owner decision 2026-10-16), never what the customer gets back.
 * The rules (percentage 1-99, fixed amount > 0 and not above the highest known price) and the
 * generated sentence mirror the server's src/utils/partialRefundPolicy.js. The parity is guarded by
 * scripts/cancellation-policy-check.mts, which runs the backend's shared cases
 * (tests/fixtures/partialRefundCases.json, copied to scripts/fixtures) against this file.
 */

export type CancellationKey = "refundable" | "non_refundable" | "partially_refundable"
export type PartialRefundType = "percent" | "fixed"

export const CANCELLATION_LABELS: Record<CancellationKey, string> = {
  refundable: "Refundable",
  non_refundable: "Non-Refundable",
  partially_refundable: "Partially Refundable",
}

export const PARTIAL_PERCENT_MIN = 1
export const PARTIAL_PERCENT_MAX = 99
/** Ceiling on a fixed refund when no price is known to bound it (Rs 10 crore). */
export const FIXED_REFUND_MAX = 100_000_000

/** "partially_refundable" | "Partially Refundable" | "partially-refundable" -> the key; free text -> null. */
export function cancellationKey(raw: unknown): CancellationKey | null {
  if (typeof raw !== "string") return null
  const s = raw.trim().toLowerCase().replace(/[\s_-]+/g, "_")
  return s === "refundable" || s === "non_refundable" || s === "partially_refundable" ? s : null
}

/** The readable label for a stored/selected policy; free text is returned unchanged. */
export function cancellationLabel(raw: unknown): string {
  const k = cancellationKey(raw)
  if (k) return CANCELLATION_LABELS[k]
  return typeof raw === "string" ? raw : ""
}

const group = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",")

/** "50%" / "PKR 20,000" - plain and locale-free, the same string the server writes. */
export function formatRefundValue(type: PartialRefundType, value: number | string): string {
  const n = Number(value)
  if (type === "percent") return `${Number.isInteger(n) ? n : String(Number(n.toFixed(2)))}%`
  return `PKR ${group(Number.isInteger(n) ? n : Number(n.toFixed(2)))}`
}

/** "venue keeps 50%" / "venue keeps PKR 20,000" */
export const describePartialRefund = (type: PartialRefundType, value: number | string) =>
  `venue keeps ${formatRefundValue(type, value)}`

/** The text stored in `cancelationPolicy` for a partial refund: "Partially Refundable: venue keeps 50%". */
export const partialPolicyText = (type: PartialRefundType, value: number | string) =>
  `${CANCELLATION_LABELS.partially_refundable}: ${describePartialRefund(type, value)}`

export type PartialRefundCheck =
  | { ok: true; type: PartialRefundType; value: number }
  | { ok: false; field: "partialRefundType" | "partialRefundValue"; message: string }

/** Plain decimal, at most two places (the server refuses "12,000", "5e1", "abc"). */
function parsePlain(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) && Math.abs(Math.round(v * 100) / 100 - v) < 1e-9 ? Math.round(v * 100) / 100 : null
  if (typeof v !== "string") return null
  const s = v.trim()
  if (!/^\d+(?:\.\d{1,2})?$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/**
 * Validate the detail of a Partially Refundable policy.
 * `ceiling`: the highest price known (minimum price / dearest package); a fixed refund above it is a
 * typo, since a customer can never have paid more than the price.
 */
export function validatePartialRefund(type: unknown, value: unknown, ceiling: number | null = null): PartialRefundCheck {
  if (type !== "percent" && type !== "fixed") {
    return { ok: false, field: "partialRefundType", message: "Choose whether the venue keeps a fixed amount or a percentage" }
  }
  const n = parsePlain(value)
  if (type === "percent") {
    if (n === null || n < PARTIAL_PERCENT_MIN || n > PARTIAL_PERCENT_MAX) {
      return { ok: false, field: "partialRefundValue", message: `The percentage the venue keeps must be a number between ${PARTIAL_PERCENT_MIN} and ${PARTIAL_PERCENT_MAX}` }
    }
    return { ok: true, type, value: n }
  }
  const cap = ceiling && ceiling > 0 ? Math.min(ceiling, FIXED_REFUND_MAX) : FIXED_REFUND_MAX
  if (n === null || n <= 0 || n > cap) {
    const bounded = !!ceiling && ceiling > 0 && ceiling < FIXED_REFUND_MAX
    return {
      ok: false,
      field: "partialRefundValue",
      message: bounded
        ? `The amount the venue keeps must be more than 0 and not above your highest listed price (PKR ${group(Math.round(ceiling as number))})`
        : "The amount the venue keeps must be more than 0",
    }
  }
  return { ok: true, type, value: n }
}

/** The highest price the registration knows: the minimum price when given, else the dearest package. */
export function fixedRefundCeiling(o: { minimumPrice?: unknown; packages?: Array<{ price?: unknown; totalPrice?: unknown }> | null } = {}): number | null {
  const min = Number(o.minimumPrice)
  if (Number.isFinite(min) && min > 0) return min
  const prices = (Array.isArray(o.packages) ? o.packages : [])
    .map((p) => Number(p && (p.price ?? p.totalPrice)))
    .filter((n) => Number.isFinite(n) && n > 0)
  return prices.length ? Math.max(...prices) : null
}

/** The sentence the server generates for a partial refund (so a couple's page and the stored text agree). */
const GENERATED_RE = /^Partially Refundable: venue keeps (?:\d+(?:\.\d{1,2})?%|PKR [\d,]+(?:\.\d{1,2})?)$/
export const isGeneratedPartialText = (s: unknown) => typeof s === "string" && GENERATED_RE.test(s.trim())

/**
 * What a registration form shows for the chosen policy: the label, plus the refund detail when it is
 * a partial refund whose detail has been entered ("Partially Refundable: venue keeps 50%").
 * Free text is shown as typed.
 */
export function cancellationText(raw: unknown, detail?: { type?: unknown; value?: unknown } | null): string {
  const k = cancellationKey(raw)
  if (k === "partially_refundable" && detail) {
    const v = validatePartialRefund(detail.type, detail.value, null)
    if (v.ok) return partialPolicyText(v.type, v.value)
  }
  return cancellationLabel(raw)
}

/**
 * Form-level errors for registration validators ({} when fine): only when the policy is Partially
 * Refundable. Keyed by the field the message belongs under.
 */
export function partialRefundErrors(
  form: { cancelationPolicy?: unknown; partialRefundType?: unknown; partialRefundValue?: unknown; minimumPrice?: unknown; packages?: Array<{ price?: unknown }> | null },
): Record<string, string> {
  if (cancellationKey(form.cancelationPolicy) !== "partially_refundable") return {}
  const v = validatePartialRefund(form.partialRefundType, form.partialRefundValue, fixedRefundCeiling({ minimumPrice: form.minimumPrice, packages: form.packages }))
  return v.ok ? {} : { [v.field]: v.message }
}
