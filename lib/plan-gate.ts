/**
 * Plans, as the portal sees them. PURE: no React, no imports, so scripts/plan-entitlements-check.mts can load it
 * straight into Node.
 *
 * What lives here and what does not
 * ---------------------------------
 * The RULES (which plan includes which feature, how many businesses / staff / halls / photos each plan allows) live in
 * ONE place, on the server (src/utils/planEntitlements.js). The portal never keeps a copy: it reads the resolved
 * entitlements from GET /subscriptions/status (the same object is on /me and /entitlements) and reflects them. This file
 * only holds
 *   - the types of that object,
 *   - the ONE function that names a plan (planNameOf), for the few places that only have an internal tier,
 *   - reading the server's two refusals (403 FEATURE_NOT_IN_PLAN and 403 LIMIT_REACHED) into one friendly shape,
 *   - which sidebar screen belongs to which feature (a map of SCREENS, not of plan rules), and
 *   - a tiny event bus so the axios layer can tell the UI "a request just hit a plan gate" without importing React.
 *
 * Internal tier keys are shifted from the public names: pro = Basic, premium = Pro, elite = Premium.
 */

export type PlanTier = "free" | "pro" | "premium" | "elite"

/** The one tier -> public name mapping in the portal. Anything unknown is "No plan", never a guess. */
const PLAN_NAME: Record<PlanTier, string> = { free: "No plan", pro: "Basic", premium: "Pro", elite: "Premium" }
export function planNameOf(tier: string | null | undefined): string {
  return (tier && (PLAN_NAME as Record<string, string>)[tier]) || PLAN_NAME.free
}

/** Names only (the rules are on the server). An unknown feature is treated as not gated. */
export type FeatureKey =
  | "analytics" | "cheque_ledger" | "contracts_esign" | "wa_templates" | "staff" | "remove_branding"
  | "multi_business" | "client_portal" | "fbr_invoicing" | "automations" | "forecasting"
  | "men_women_portions" | "chat_attachments" | "data_export" | "role_permissions"
  // the owner's plan sheet: one feature per module above Free, `mod_<module>` (backend utils/moduleTiers.js)
  | `mod_${string}`
export type LimitKey =
  | "businesses" | "staff" | "halls" | "spaces" | "images" | "bookings" | "leads" | "quoteRequests" | "slots" | "packages"

export interface FeatureEntitlement {
  /** The plan includes it. */
  allowed: boolean
  /** Enforcement applies to this vendor AND the plan lacks it: the server will refuse. THIS is what a screen locks on. */
  locked: boolean
  label: string
  requiredPlan: string
  requiredTier: PlanTier
}
export interface LimitEntitlement {
  /** null = unlimited */
  max: number | null
  used: number | null
  label: string
  /** "account": counted across the login; "business": counted inside each business. */
  scope: "account" | "business"
  /** Enforcement applies AND used >= max: the next create will be refused. */
  reached: boolean
  /** 80% or more of the limit is used (sheet rule 4): warn before the wall. */
  nearing: boolean
  /** "month" / "day" for a limit that resets; null for a standing count. */
  period: "month" | "day" | null
  /** The plan that raises this limit, or null on the top plan (then it is a custom plan). */
  nextPlan: string | null
  /** For per-business limits: { [businessId]: used }. */
  perBusiness?: Record<string, number>
}
export interface Entitlements {
  tier: PlanTier
  planName: string
  /** PLAN_LIMITS_ENFORCE applies to this account. When false, nothing is locked and nothing is reached. */
  enforced: boolean
  /** When the plan in force ends (null = open-ended or no plan). */
  endsAt: string | null
  features: Partial<Record<FeatureKey, FeatureEntitlement>>
  limits: Partial<Record<LimitKey, LimitEntitlement>>
}

type Rec = Record<string, unknown>
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v)
const num = (v: unknown): number | null => {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : null
}
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null)

/**
 * Validate what the server sent. Anything that is not the expected shape is `null` (= "unknown": the portal then
 * shows everything unlocked and relies on the server's refusal), never a half-guess.
 */
export function parseEntitlements(raw: unknown): Entitlements | null {
  if (!isRec(raw) || !isRec(raw.features) || !isRec(raw.limits) || typeof raw.enforced !== "boolean") return null
  const features: Entitlements["features"] = {}
  for (const [k, v] of Object.entries(raw.features)) {
    if (!isRec(v)) continue
    features[k as FeatureKey] = {
      allowed: v.allowed !== false,
      locked: v.locked === true,
      label: str(v.label) ?? k,
      requiredPlan: str(v.requiredPlan) ?? "a higher plan",
      requiredTier: (str(v.requiredTier) as PlanTier) ?? "pro",
    }
  }
  const limits: Entitlements["limits"] = {}
  for (const [k, v] of Object.entries(raw.limits)) {
    if (!isRec(v)) continue
    const per: Record<string, number> = {}
    if (isRec(v.perBusiness)) for (const [id, n] of Object.entries(v.perBusiness)) { const c = num(n); if (c !== null) per[id] = c }
    limits[k as LimitKey] = {
      max: v.max === null ? null : num(v.max),
      used: num(v.used),
      label: str(v.label) ?? k,
      scope: v.scope === "business" ? "business" : "account",
      reached: v.reached === true,
      nearing: v.nearing === true,
      period: v.period === "month" || v.period === "day" ? v.period : null,
      nextPlan: str(v.nextPlan),
      ...(Object.keys(per).length ? { perBusiness: per } : {}),
    }
  }
  const tier = (str(raw.tier) as PlanTier) ?? "free"
  return { tier, planName: str(raw.planName) ?? planNameOf(tier), enforced: raw.enforced, endsAt: str(raw.endsAt), features, limits }
}

/** "1 of 1 business", "3 of 4 businesses"; over the limit (a downgrade) it says what is true instead of "6 of 1". */
export function describeUsage(l: LimitEntitlement, nouns?: [string, string]): string {
  const [one, many] = nouns ?? ["", ""]
  const used = l.used ?? 0
  const noun = (n: number) => (nouns ? (n === 1 ? one : many) : l.label)
  if (l.max === null) return `${used} ${noun(used)}`
  return used > l.max ? `${used} ${noun(used)} (your plan allows ${l.max})` : `${used} of ${l.max} ${noun(l.max)}`
}

/** What each limit's things are called, singular and plural, for the meters ("1 of 3 halls and spaces"). */
export const LIMIT_NOUNS: Record<LimitKey, [string, string]> = {
  businesses: ["business", "businesses"],
  staff: ["staff account", "staff accounts"],
  halls: ["hall", "halls"],
  spaces: ["space per hall", "spaces per hall"],
  images: ["photo", "photos"],
  bookings: ["booking this month", "bookings this month"],
  leads: ["lead this month", "leads this month"],
  quoteRequests: ["quote request this month", "quote requests this month"],
  slots: ["slot per day", "slots per day"],
  packages: ["package", "packages"],
}

/* ───────────── the server's two refusals ───────────── */

export interface PlanGate {
  code: "FEATURE_NOT_IN_PLAN" | "LIMIT_REACHED"
  feature: string | null
  featureLabel: string | null
  limit: string | null
  limitLabel: string | null
  max: number | null
  used: number | null
  adding: number | null
  scope: "account" | "business" | null
  currentPlan: string | null
  requiredPlan: string | null
  /** The server's own sentence: plain language, already names the plan. */
  message: string
}

/**
 * Is this error one of the plan refusals? Returns its details, or null for any other error.
 * The server answers 403 with { status:false, message, data:{ code, ... } }.
 */
export function gateFromError(error: unknown): PlanGate | null {
  const res = (error as { response?: { status?: number; data?: unknown } } | null)?.response
  if (!res || res.status !== 403 || !isRec(res.data)) return null
  const body = res.data
  const d = isRec(body.data) ? body.data : isRec(body) ? body : null
  const code = d ? str(d.code) : null
  if (code !== "FEATURE_NOT_IN_PLAN" && code !== "LIMIT_REACHED") return null
  return {
    code,
    feature: str(d?.feature),
    featureLabel: str(d?.featureLabel),
    limit: str(d?.limit),
    limitLabel: str(d?.limitLabel),
    max: d && d.max === null ? null : num(d?.max),
    used: num(d?.used),
    adding: num(d?.adding),
    scope: d?.scope === "business" ? "business" : d?.scope === "account" ? "account" : null,
    currentPlan: str(d?.currentPlan),
    requiredPlan: str(d?.requiredPlan),
    message: str(body.message) ?? "",
  }
}

/** The short line for a title: "Available on Pro" / "Your Basic plan includes 1 business". */
export function gateHeadline(g: PlanGate): string {
  if (g.code === "FEATURE_NOT_IN_PLAN") return g.requiredPlan ? `Available on ${g.requiredPlan}` : "Not in your plan"
  const noun = g.limitLabel || "items"
  const plan = g.currentPlan && g.currentPlan !== "No plan" ? `Your ${g.currentPlan} plan` : "Without a plan you"
  return g.max != null ? `${plan} ${plan.endsWith("you") ? "can have" : "includes"} ${g.max} ${noun}` : "You have reached a plan limit"
}

/** One sentence the vendor can act on, built from the data (so it never depends on the server's exact wording). */
export function gateAdvice(g: PlanGate): string {
  if (g.code === "FEATURE_NOT_IN_PLAN") {
    const what = g.featureLabel || "This"
    return g.requiredPlan ? `${what} is part of the ${g.requiredPlan} plan. Everything you already have stays exactly as it is.` : `${what} is not part of your plan.`
  }
  return g.requiredPlan
    ? `Upgrade to ${g.requiredPlan} to add more. Everything you already have stays exactly as it is.`
    : "Ask us about a custom plan to add more. Everything you already have stays exactly as it is."
}

/* ───────────── a tiny event bus (the axios layer talks to the UI through this) ───────────── */

export interface GateMeta {
  /** HTTP method of the refused request, lower-case. */
  method: string
  /** The caller asked not to be interrupted (a background log). */
  silent: boolean
  /** Show the upgrade dialog: user-initiated writes always do; a refused read only when the caller opted in. */
  prompt: boolean
}
type Listener = (gate: PlanGate, meta: GateMeta) => void
const listeners = new Set<Listener>()
let lastMessage: { text: string; at: number } | null = null

export function onPlanGate(l: Listener): () => void {
  listeners.add(l)
  return () => { listeners.delete(l) }
}
export function publishPlanGate(gate: PlanGate, meta: GateMeta): void {
  listeners.forEach((l) => { try { l(gate, meta) } catch { /* a listener must never break a request */ } })
}

/**
 * Called by the axios layer, synchronously, the moment a request is refused by a plan gate.
 *
 *  1. If the upgrade dialog is going to show, remember the server's sentence so a raw toast of that same sentence
 *     (every call site toasts error.response.data.message) is dropped instead of appearing beside the dialog.
 *  2. One macrotask later, which is after the caller's own catch block has run, tell the UI. A screen that shows the
 *     refusal itself (inline panel) has claimed it by then, so nothing else is shown.
 */
export function handlePlanRefusal(error: unknown, gate: PlanGate, meta: GateMeta): void {
  const willPrompt = meta.prompt && !meta.silent
  if (willPrompt && gate.message) lastMessage = { text: gate.message, at: Date.now() }
  setTimeout(() => {
    if (isGateClaimed(error)) { lastMessage = null; publishPlanGate(gate, { ...meta, prompt: false }); return }
    publishPlanGate(gate, meta)
  }, 0)
}

/**
 * Was this toast text just shown (or about to be shown) by the plan dialog? Toast helpers ask this before showing a
 * raw refusal, so the same sentence is not on screen twice. Compares whole sentences, never fragments.
 */
export function isPlanGateEcho(text: unknown): boolean {
  if (typeof text !== "string" || !lastMessage) return false
  if (Date.now() - lastMessage.at > 8000) return false
  return text.trim() === lastMessage.text.trim()
}

/**
 * A screen that shows the refusal ITSELF (inline, in its own panel) claims it, so the global dialog stays quiet.
 * The axios layer defers its dialog by one macrotask, which runs after the caller's catch block.
 */
export function claimGate(error: unknown): void {
  if (error && typeof error === "object") (error as { __planGateClaimed?: boolean }).__planGateClaimed = true
}
export const isGateClaimed = (error: unknown): boolean => !!(error as { __planGateClaimed?: boolean } | null)?.__planGateClaimed

/* ───────────── which screen belongs to which feature (screens, not plan rules) ───────────── */

/**
 * Sidebar route -> the feature that screen needs. The server decides whether the vendor has it (entitlements.features
 * [..].locked); this only says which screen to ask about. A route that is not listed is never locked.
 *
 * Deliberately NOT here: the operations tools (Venue-OS hub, Trade ops, Kitchen prep, Brokers, Inventory, Generator
 * fuel, Halal certs, Drone NOC, Field capture). They stay in every paid plan (decision recorded in the backend's
 * planEntitlements.js); a tool added to this map without that decision being revisited is a bug.
 */
export const SCREEN_FEATURE: Record<string, FeatureKey> = {
  // Rozana
  "/dashboard/function-sheets": "mod_function_sheets",
  "/dashboard/function-sheet-composer": "mod_function_sheets",
  "/dashboard/function-sheet-operations": "mod_function_sheets",
  // Khata
  "/dashboard/payments": "mod_payments",
  "/dashboard/receipts": "mod_receipts",
  "/dashboard/receivables": "mod_refunds",
  "/dashboard/expenses": "mod_expenses",
  "/dashboard/staff": "mod_staff_payroll",
  "/dashboard/suppliers": "mod_suppliers",
  "/dashboard/pdcs": "mod_cheque_ledger",
  "/dashboard/tax": "mod_tax_report",
  // Set up
  "/dashboard/automation": "mod_automation",
  "/dashboard/packages": "mod_packages_menus",
  "/dashboard/venue-os": "mod_venue_os",
  "/dashboard/inventory": "mod_inventory",
  "/dashboard/generator-fuel": "mod_generator_fuel",
  "/dashboard/halal-certs": "mod_halal_certs",
  "/dashboard/drone-noc": "mod_drone_noc",
  "/dashboard/collaborations": "mod_collaborations",
  // Zyada
  "/dashboard/holds": "mod_date_holds",
  "/dashboard/field": "mod_field_capture",
  "/dashboard/trade-ops": "mod_trade_ops",
  "/dashboard/kitchen-prep": "mod_kitchen_prep",
  "/dashboard/brokers": "mod_brokers",
  "/dashboard/insights": "mod_reports",
  "/dashboard/reports": "mod_reports",
}

/** The feature a portal path needs (longest matching screen), or null when the path is not a gated module. */
export function featureForPath(pathname: string | null | undefined): FeatureKey | null {
  const p = (pathname || "").replace(/\/+$/, "")
  for (const [route, feature] of Object.entries(SCREEN_FEATURE)) {
    if (p === route || p.startsWith(route + "/")) return feature
  }
  return null
}
// The Automation screen is NOT listed: its built-in reminder toggles stay open to every plan; only the custom rule
// builder inside it is Premium, and that part of the screen shows its own lock.

/* ───────────── non-React code (the shadow-DOM screens, the table exporter) asks the same question ───────────── */

let lockedNow: { features: Entitlements["features"]; planName: string } = { features: {}, planName: "No plan" }
/** The plan provider keeps this current, so imperative handlers can guard an action without a hook. */
export function setLockedFeatures(features: Entitlements["features"], planName: string): void { lockedNow = { features, planName } }

/**
 * Guard a user action behind a plan feature from plain event handlers. Returns true when the action may go ahead; when the
 * plan lacks the feature it opens the portal's upgrade dialog and returns false. Open while enforcement is off or unknown.
 */
export function guardFeature(feature: FeatureKey): boolean {
  const f = lockedNow.features[feature]
  if (!f || !f.locked) return true
  const label = f.label
  publishPlanGate(
    {
      code: "FEATURE_NOT_IN_PLAN", feature, featureLabel: label, limit: null, limitLabel: null, max: null, used: null, adding: null,
      scope: null, currentPlan: lockedNow.planName, requiredPlan: f.requiredPlan,
      message: `${label} is part of the ${f.requiredPlan} plan. You are on ${lockedNow.planName}.`,
    },
    { method: "post", silent: false, prompt: true },
  )
  return false
}
