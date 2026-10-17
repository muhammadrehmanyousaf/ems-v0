/**
 * Access: the ONE shape the portal uses to know whether the vendor may use the console, and why not.
 * PURE: no React, no imports, so scripts/plans-wall-check.mts can load it straight into Node.
 *
 * Where it comes from (and nowhere else)
 * ---------------------------------------
 *   1. GET /subscriptions/status -> `accessState` (the server's accessContext: PLANS-SPEC.md contract 1; PL-A serves it under
 *      `accessState` because `access` is, and stays, the old one-word string old clients compare).
 *   2. Any vendor-route response of HTTP 402 { data: { code: "SUBSCRIPTION_REQUIRED", ... } } (contract 2).
 *
 * The portal never decides a lock on its own: no date maths, no tier rules. It only READS the server's `state`.
 * The one piece of arithmetic here is the whole-day countdown for a banner, and it is only used when the server did not
 * send `daysLeft`.
 *
 * Compatibility: until the backend sends the new object, `access` on /status is the old string
 * ("active" | "past_due" | "pending" | "none") and `enforced` says whether billing is on. accessFromStatus() adapts that
 * once, in this file, with the exact rule the old BillingGate used. It is marked `legacy` and goes away with PL-A.
 */

export type AccessStateKey =
  | "trialing" | "active" | "past_due" | "cancelling"
  | "locked" | "dormant" | "closed" | "suspended_admin" | "comp"
  /** PL-A extension: nothing to lock yet (no business submitted, or an admin-created vendor before first login). Open. */
  | "unstarted"

export const ACCESS_STATES: readonly AccessStateKey[] = [
  "trialing", "active", "past_due", "cancelling", "locked", "dormant", "closed", "suspended_admin", "comp", "unstarted",
]

/** The states in which the vendor sees the Wall instead of the console. The server decides; this only names them. */
export const LOCKED_STATES: readonly AccessStateKey[] = ["locked", "dormant", "closed", "suspended_admin"]

export function isLockedState(s: AccessStateKey | null | undefined): boolean {
  return !!s && LOCKED_STATES.includes(s)
}

/**
 * Is the Wall to be SHOWN for this access? A locked state is shown only when the server says it is real. In shadow mode
 * (BILLING_ENFORCE=shadow) the state is computed so it can be logged, and nothing changes for the vendor.
 */
export function isWalled(a: Access | null | undefined): boolean {
  return !!a && isLockedState(a.state) && a.enforced !== false
}

export interface Access {
  state: AccessStateKey
  /** Internal tier key of the plan in force or the last plan (pro | premium | elite), or null. */
  plan: string | null
  /** Public plan name ("Basic" | "Pro" | "Premium"), from the server. */
  planName: string | null
  trialEndsAt: string | null
  graceEndsAt: string | null
  /** When the access in force ends (period end of a cancelling plan, end of a comp). Falls back to the status' subscriptionEndsAt. */
  endsAt: string | null
  lockedAt: string | null
  /** Date until which the server keeps the data (printed on every lock message). */
  retainUntil: string | null
  /** trial_ended | cancelled | payment_failed | plan_ended | admin_suspended | no_plan ... (free text from the server). */
  lockReason: string | null
  /** The viewer may pay (false for staff and for a suspended account). */
  canPay: boolean
  /** The server says an automatic trial can still be started by hand (fallback only). */
  canStartTrial: boolean
  renewUrl: string | null
  /** Whole days left in the trial / grace / cancelled period, as the server counts them. */
  daysLeft: number | null
  /**
   * The server says the Wall is real for this account (BILLING_ENFORCE=on, and past BILLING_ENFORCE_NEW_FROM). false = shadow
   * or off: the state is only computed and logged, nothing is locked. null = the server did not say (an older build): a 402
   * from a request still locks; a status of "locked" is then taken at its word.
   */
  enforced: boolean | null
  /** The viewer is a staff member of the vendor, not the owner. */
  staff: boolean
  /** The owner's phone, already masked by the server, shown to staff. */
  ownerMasked: string | null
  /** Where this came from. */
  source: "status" | "402" | "legacy"
}

type Rec = Record<string, unknown>
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v)
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null)
const int = (v: unknown): number | null => {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v
  return typeof n === "number" && Number.isFinite(n) ? Math.trunc(n) : null
}
const isState = (v: unknown): v is AccessStateKey => typeof v === "string" && (ACCESS_STATES as readonly string[]).includes(v)

function build(raw: Rec, source: Access["source"], staffDefault = false): Access | null {
  if (!isState(raw.state)) return null // an unknown state is "unknown" (everything stays open), never a guessed lock
  const staff = raw.staff === true || staffDefault
  const state = raw.state
  return {
    state,
    plan: str(raw.plan) ?? str(raw.tier),
    planName: str(raw.planName),
    trialEndsAt: str(raw.trialEndsAt),
    graceEndsAt: str(raw.graceEndsAt),
    endsAt: str(raw.endsAt) ?? str(raw.accessEndsAt) ?? str(raw.periodEndsAt),
    lockedAt: str(raw.lockedAt) ?? str(raw.lockedSince),
    retainUntil: str(raw.retainUntil),
    lockReason: str(raw.lockReason),
    // The server's word wins; absent, a staff member and a suspended account cannot pay, everyone else can.
    canPay: typeof raw.canPay === "boolean" ? raw.canPay && !staff : !staff && state !== "suspended_admin",
    canStartTrial: raw.canStartTrial === true,
    enforced: typeof raw.enforced === "boolean" ? raw.enforced : null,
    renewUrl: str(raw.renewUrl),
    daysLeft: int(raw.daysLeft),
    staff,
    ownerMasked: str(raw.ownerMasked),
    source,
  }
}

/** Validate the `access` object of GET /subscriptions/status. Anything else is null = unknown. */
export function parseAccess(raw: unknown): Access | null {
  return isRec(raw) ? build(raw, "status") : null
}

/**
 * Read a 402 SUBSCRIPTION_REQUIRED answer ({ status:false, message, data:{ code, state, lockReason, lockedSince,
 * retainUntil, renewUrl, staff?, ownerMasked? } }). Returns null for every other error (a 402 that is not ours too).
 */
export function lockFromError(error: unknown): Access | null {
  const res = (error as { response?: { status?: number; data?: unknown } } | null)?.response
  if (!res || res.status !== 402 || !isRec(res.data)) return null
  const body = res.data
  const d = isRec(body.data) ? body.data : null
  if (!d || str(d.code) !== "SUBSCRIPTION_REQUIRED") return null
  // The contract always names a state; if it ever does not, the 402 itself means "locked".
  const a = build({ ...d, state: isState(d.state) ? d.state : "locked", enforced: true }, "402")
  return a
}

/** What the old string `access` + `enforced` meant, as an Access. Used only until the backend sends the object. */
export function accessFromLegacy(raw: unknown): Access | null {
  if (!isRec(raw)) return null
  const access = str(raw.access)
  if (!access) return null
  const enforced = raw.enforced === true
  const sub = isRec(raw.subscription) ? raw.subscription : null
  const subStatus = sub ? str(sub.status) : null
  const tier = str(raw.tier)
  const ends = str(raw.subscriptionEndsAt)
  let state: AccessStateKey
  if (access === "past_due") state = "past_due"
  else if (access === "active") state = subStatus === "trialing" ? "trialing" : subStatus === "cancelled" ? "cancelling" : "active"
  else state = enforced ? "locked" : "active" // "none" / "pending": the old gate walled these only when enforced
  return {
    state,
    plan: tier && tier !== "free" ? tier : null,
    planName: null,
    trialEndsAt: subStatus === "trialing" ? (sub ? str(sub.trialEndsAt) ?? str(sub.currentPeriodEndsAt) : null) : null,
    graceEndsAt: state === "past_due" ? ends : null,
    endsAt: ends,
    lockedAt: state === "locked" ? ends : null,
    retainUntil: null,
    lockReason: state === "locked" ? (sub ? "plan_ended" : "no_plan") : null,
    canPay: true,
    canStartTrial: false,
    enforced,
    renewUrl: null,
    daysLeft: null,
    staff: false,
    ownerMasked: null,
    source: "legacy",
  }
}

/**
 * The path (and query) of a link the server sent, when it is one of our own console pages. PL-A sends renewUrl as an absolute
 * URL on the front-end host; the router wants the path. Anything else (another host, another section, junk) is null.
 */
export function internalPath(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url, "https://app.invalid")
    if (u.host !== "app.invalid" && !/(^|\.)weddingwala\.pk$|^localhost(:\d+)?$/.test(u.host)) return null
    return u.pathname.startsWith("/dashboard/") ? u.pathname + u.search + u.hash : null
  } catch { return null }
}

/** The one reader of a /status payload: the server's access object when it sends one, else the legacy adapter. */
export function accessFromStatus(raw: unknown): Access | null {
  if (!isRec(raw)) return null
  // PL-A serves the object as `accessState` (PLANS-SPEC contract 1 says `access`, which stays the old string); the other two
  // keys are accepted so a build that follows the spec to the letter works too. A vendor outside the plans system (an admin, an
  // unclaimed listing shell) has state null: unknown, so open.
  const a = parseAccess(raw.accessState) ?? parseAccess(raw.accessContext) ?? parseAccess(raw.access)
  if (a) return a.endsAt ? a : { ...a, endsAt: str(raw.subscriptionEndsAt) } // the status' own "portal open until" fills a missing end
  return accessFromLegacy(raw)
}

/* ───────────── dates: always Pakistan time, always exact ───────────── */

const PK_TZ = "Asia/Karachi"

function parts(iso: string | Date, tz = PK_TZ) {
  const d = typeof iso === "string" ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return null
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hourCycle: "h23" })
  const o: Record<string, string> = {}
  for (const p of f.formatToParts(d)) o[p.type] = p.value
  return { day: o.day, month: o.month, year: o.year, hour: Number(o.hour), minute: o.minute }
}

/** "12 November 2026" (Pakistan calendar date). "" when the input is not a date. */
export function fmtPkDate(iso: string | null | undefined): string {
  if (!iso) return ""
  const p = parts(iso)
  return p ? `${p.day} ${p.month} ${p.year}` : ""
}

/** "12 November 2026, 11:59 PM". */
export function fmtPkDateTime(iso: string | null | undefined): string {
  if (!iso) return ""
  const p = parts(iso)
  if (!p) return ""
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12
  return `${p.day} ${p.month} ${p.year}, ${h12}:${p.minute} ${p.hour >= 12 ? "PM" : "AM"}`
}

/** "12 November 2026, raat 11:59 baje" - the same instant, spoken the Roman Urdu way. */
export function fmtPkDateTimeRu(iso: string | null | undefined): string {
  if (!iso) return ""
  const p = parts(iso)
  if (!p) return ""
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12
  const part = p.hour < 5 ? "raat" : p.hour < 12 ? "subah" : p.hour < 16 ? "dopahar" : p.hour < 19 ? "shaam" : "raat"
  return `${p.day} ${p.month} ${p.year}, ${part} ${h12}:${p.minute} baje`
}

/** Pakistan calendar day number of an instant (days since 1970-01-01 on the PKT calendar). */
function pkDayNumber(d: Date): number {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: PK_TZ, year: "numeric", month: "2-digit", day: "2-digit" })
  const [y, m, dd] = f.format(d).split("-").map(Number)
  return Math.floor(Date.UTC(y, m - 1, dd) / 86_400_000)
}

/**
 * Whole Pakistan calendar days from `now` to `iso`: 0 = it ends today, 1 = tomorrow. Negative = already past.
 * Only a fallback for a banner; the server's `daysLeft` wins when it sends one.
 */
export function daysUntilPk(iso: string | null | undefined, now: Date = new Date()): number | null {
  if (!iso) return null
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return null
  return pkDayNumber(t) - pkDayNumber(now)
}

/** Days left for a banner: the server's number, else the Pakistan-calendar countdown to `fallbackEnd`. */
export function daysLeftOf(a: Access, fallbackEnd: string | null, now: Date = new Date()): number | null {
  if (a.daysLeft !== null) return a.daysLeft
  return daysUntilPk(fallbackEnd, now)
}

/**
 * The old one-word `access` ("active" | "past_due" | "none") that today's screens still compare with, derived from the
 * new state. Used to keep those screens working when the backend sends the `access` OBJECT in the same key.
 */
export function legacyAccessWord(state: AccessStateKey): "active" | "past_due" | "none" {
  if (state === "past_due") return "past_due"
  return isLockedState(state) ? "none" : "active"
}
