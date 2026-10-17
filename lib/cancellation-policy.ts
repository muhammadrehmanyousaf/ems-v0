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

// ── WP29: Refundable / Non-Refundable are real policies ─────────────────────────────────────────────────────
// Mirrors the server's src/utils/cancellationLabelPolicy.js (same rules, same words). Parity is pinned by
// scripts/cancellation-policy-check.mts against scripts/fixtures/cancellationLabelCases.json (a copy of the
// backend's tests/fixtures/cancellationLabelCases.json; change them together).
//
//   Non-Refundable  the venue keeps everything paid toward the booking (overpayment, the refundable security
//                   deposit, and the venue-cancel / force-majeure outcomes still go back)
//   Refundable      Wedding Wala's standard schedule (live platform schedule, not a copy)
//   Partially Refundable  the venue keeps a share / a fixed amount (WP20)

export interface PolicySlabLike { daysToEvent?: number | string | null; pctForfeit?: number | string | null; venueKeepsFixed?: number | string | null }
export type PolicySummaryKind = "non_refundable" | "partial_percent" | "partial_fixed" | "ladder" | "standard"
export interface PolicySummary { kind: PolicySummaryKind; headline: string; detail: string }

/** The label a venue's answer becomes when a schedule saved later makes the registration answer untrue. */
export const CUSTOM_SCHEDULE_LABEL = "Custom refund schedule"

/** Registration step 4: what each answer means for the couple (shown under the Cancellation Policy control). */
export const CANCELLATION_HELP: Record<"refundable" | "non_refundable", string> = {
  non_refundable:
    "If a couple cancels, the venue keeps everything they have paid toward the booking. Money that is not the venue's to keep still goes back to them: an overpayment, a refundable security deposit, and everything if you cancel on them.",
  refundable:
    "If a couple cancels, they are refunded by Wedding Wala's standard schedule: the earlier they cancel, the more they get back. Your venue page shows the schedule.",
}

const trimNum = (n: number) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2))))
const dayWord = (n: number) => `${n} ${n === 1 ? "day" : "days"}`

function refundPhrase(refundPct: number): string {
  const r = Math.max(0, Math.min(100, Number(refundPct) || 0))
  if (r >= 100) return "full refund"
  if (r <= 0) return "nothing back"
  return `${trimNum(r)}% back`
}

function usableSlabs(slabs: unknown): { d: number; keep: number }[] {
  return (Array.isArray(slabs) ? (slabs as PolicySlabLike[]) : [])
    .filter((s) => s && s.daysToEvent != null && s.pctForfeit != null)
    .map((s) => ({ d: Math.max(0, Math.floor(Number(s.daysToEvent) || 0)), keep: Math.max(0, Math.min(100, Number(s.pctForfeit) || 0)) }))
    .sort((a, b) => b.d - a.d)
}

/**
 * The refund ladder in words, earliest cancel first (the engine's own bands: a cancel `d` days out lands in the
 * first slab, highest first, with daysToEvent <= d; anything below the smallest slab stays in the last one).
 */
export function ladderText(slabs: unknown): string {
  const s = usableSlabs(slabs)
  if (s.length === 0) return ""
  const back = (x: { keep: number }) => refundPhrase(100 - x.keep)
  if (s.length === 1) return `${back(s[0])} whenever you cancel`
  return s
    .map((x, i) => {
      if (i === 0) return `${back(x)} ${x.d} or more days before the event`
      const upper = s[i - 1].d - 1
      if (i === s.length - 1) return `${back(x)} ${dayWord(upper)} or fewer before the event`
      return x.d === upper ? `${back(x)} ${dayWord(x.d)} before the event` : `${back(x)} ${x.d} to ${dayWord(upper)} before the event`
    })
    .join("; ")
}

/**
 * The day range one ladder row covers, for slabs sorted highest `daysToEvent` first (LOGIC-013 / SETUP-048).
 * `daysToEvent` is a MINIMUM (the engine's resolveTier: first slab, highest first, with d >= minDaysBefore;
 * anything closer than the smallest slab stays in the last one), so row i runs from its own `daysToEvent` up to
 * one day short of the previous row. Returns the words as the vendor screen prints them.
 */
export function slabRangeLabel(sortedDesc: { daysToEvent: number }[], i: number): string {
  const s = sortedDesc[i]
  const next = sortedDesc[i + 1]
  const upper = i > 0 ? sortedDesc[i - 1].daysToEvent - 1 : 0
  if (sortedDesc.length === 1 && s.daysToEvent === 0) return "Kisi bhi din"
  if (i === 0) return `${s.daysToEvent}+ din pehle`
  if (!next) return `${upper} din ya kam pehle`
  return s.daysToEvent === upper ? `${s.daysToEvent} din pehle` : `${s.daysToEvent}–${upper} din pehle`
}

/** What a slab list is, in the three-label vocabulary. */
export function shapeOfSlabs(slabs: unknown): { kind: "non_refundable" | "partial_percent" | "partial_fixed" | "ladder"; value?: number } {
  const s = Array.isArray(slabs) ? (slabs as PolicySlabLike[]) : []
  if (s.length === 1 && Number(s[0].daysToEvent) === 0) {
    const keep = Number(s[0].pctForfeit)
    const fixed = Number(s[0].venueKeepsFixed)
    if (fixed > 0) return { kind: "partial_fixed", value: fixed }
    if (keep >= 100) return { kind: "non_refundable" }
    if (keep > 0) return { kind: "partial_percent", value: keep }
  }
  return { kind: "ladder" }
}

const STANDARD_LEAD = "Refunds follow Wedding Wala's standard schedule"
export const NON_REFUNDABLE_DETAIL =
  "If you cancel, the venue keeps everything you have paid toward the booking. Money that is not the venue's to keep " +
  "still comes back to you: any overpayment beyond the agreed price, your refundable security deposit, and everything " +
  "you paid if the venue cancels or force majeure applies."

/**
 * What a couple reads about the policy that REALLY governs a venue.
 * source: "business" (own stored policy) | "business_label" (Non-Refundable label, no row) | "platform_default" | "preset_fallback"
 */
export function summarisePolicy(p: { source: string; slabs?: unknown; labelKey?: CancellationKey | null }): PolicySummary {
  if (p.source === "platform_default" || p.source === "preset_fallback") {
    const ladder = ladderText(p.slabs)
    return {
      kind: "standard",
      headline: p.labelKey === "partially_refundable" ? CANCELLATION_LABELS.partially_refundable : p.labelKey === "refundable" ? CANCELLATION_LABELS.refundable : "Standard refund schedule",
      detail: ladder ? `${STANDARD_LEAD}: ${ladder}.` : `${STANDARD_LEAD}.`,
    }
  }
  const shape = shapeOfSlabs(p.slabs)
  if (shape.kind === "non_refundable") return { kind: shape.kind, headline: CANCELLATION_LABELS.non_refundable, detail: NON_REFUNDABLE_DETAIL }
  if (shape.kind === "partial_percent") {
    const v = formatRefundValue("percent", shape.value as number)
    return { kind: shape.kind, headline: `${CANCELLATION_LABELS.partially_refundable}: venue keeps ${v}`, detail: `If you cancel, the venue keeps ${v} of what you have paid toward the booking and you get the rest back.` }
  }
  if (shape.kind === "partial_fixed") {
    const v = formatRefundValue("fixed", shape.value as number)
    return { kind: shape.kind, headline: `${CANCELLATION_LABELS.partially_refundable}: venue keeps ${v}`, detail: `If you cancel, the venue keeps ${v} of what you have paid toward the booking and you get back anything above it.` }
  }
  return { kind: "ladder", headline: "Refund schedule", detail: `${ladderText(p.slabs).replace(/^./, (c) => c.toUpperCase())}.` }
}

/**
 * What a venue page / booking page prints for the cancellation policy: { headline, detail } or null when there is
 * nothing to say. The SERVER's `cancellationSummary` (the engine's own resolver) is the source of truth; without it
 * (an older API) the label alone is shown, as before. A venue's own typed words stay the headline (the engine's real
 * schedule follows as the detail, so the page never promises a refund the engine does not pay).
 */
export function cancellationDisplay(
  v: { cancelationPolicy?: unknown; cancellationPolicy?: unknown; cancellationSummary?: { kind?: string; headline?: string; detail?: string } | null } | null | undefined,
): { headline: string; detail: string } | null {
  if (!v) return null
  const raw = v.cancelationPolicy || v.cancellationPolicy
  const label = cancellationLabel(raw)
  const s = v.cancellationSummary && v.cancellationSummary.headline ? v.cancellationSummary : null
  const own = !cancellationKey(raw) && !isGeneratedPartialText(raw) && label.trim() !== ""
  if (own) return { headline: label, detail: s?.detail ?? "" }
  if (s) {
    // no label and nothing but the platform schedule: say nothing (as before)
    if (!label && s.kind === "standard") return null
    return { headline: s.headline as string, detail: s.detail ?? "" }
  }
  return label ? { headline: label, detail: "" } : null
}
