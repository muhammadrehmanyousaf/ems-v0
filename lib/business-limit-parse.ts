/**
 * Reading the plan's business limit, and the server's refusal when it is reached.
 *
 * Pure functions with no imports on purpose: scripts/add-business-check.mjs loads
 * this file straight into Node (`--experimental-strip-types`), which cannot resolve
 * the `@/` alias or React. The hook that uses them is in lib/business-limits.ts.
 *
 * The plan limit itself is enforced by the SERVER (a 403 with code LIMIT_REACHED
 * on POST /businesses/mine); nothing here enforces anything. It lets the screens
 * be honest: show "3 of 4 businesses", and turn the refusal into the upgrade
 * message instead of a toast that vanishes.
 *
 * The limit has no fixed home in the API yet (the plan-entitlements work is built
 * separately), so `parseBusinessLimit` accepts the shapes that work is likely to
 * use and returns `null` for anything else. `null` means "unknown": screens show
 * no count and rely on the server's refusal. Once the contract is final, narrow
 * it to that one shape.
 */

export interface BusinessLimit {
  /** Most businesses the plan allows. */
  max: number
  /** Businesses the vendor owns now. */
  used: number
  /** The plan's public name when the API sends one, for the upgrade message. */
  planName: string | null
}

type Rec = Record<string, unknown>
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v)

/** A finite, non-negative number, else null. (Strings like "4" are accepted: JSON from a DB layer.) */
function count(v: unknown): number | null {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : null
}

function pick(node: unknown, keys: string[]): number | null {
  if (!isRec(node)) return null
  for (const k of keys) {
    const n = count(node[k])
    if (n !== null) return n
  }
  return null
}

function text(node: unknown, keys: string[]): string | null {
  if (!isRec(node)) return null
  for (const k of keys) {
    const v = node[k]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return null
}

const MAX_KEYS = ["max", "limit", "allowed", "cap", "total"]
const USED_KEYS = ["used", "current", "count", "usage", "inUse"]

/**
 * `status` is the body of GET /subscriptions/status. `owned` is how many
 * businesses the vendor actually has (the list the portal already loaded), used
 * when the API gives a limit but not the usage.
 */
export function parseBusinessLimit(status: unknown, owned: number): BusinessLimit | null {
  if (!isRec(status)) return null
  const ent = isRec(status.entitlements) ? status.entitlements : null
  const candidates: unknown[] = [
    ent && isRec(ent.limits) ? ent.limits.businesses : undefined,
    ent?.businesses,
    isRec(status.limits) ? status.limits.businesses : undefined,
    status.businessLimit,
    status.maxBusinesses,
  ]
  const usage = [
    ent && isRec(ent.usage) ? ent.usage.businesses : undefined,
    isRec(status.usage) ? status.usage.businesses : undefined,
  ]

  for (const node of candidates) {
    // Either a bare number (the max) or an object carrying the max and maybe the usage.
    const max = count(node) ?? pick(node, MAX_KEYS)
    if (max === null) continue
    const used = pick(node, USED_KEYS) ?? usage.map((u) => count(u) ?? pick(u, USED_KEYS)).find((n) => n !== null) ?? owned
    const planName = text(status, ["planName"]) ?? text(ent, ["planName"]) ?? text(status.subscription, ["planName"])
    return { max, used, planName }
  }
  return null
}

// ── The server's refusal ───────────────────────────────────────────────────

export interface LimitReached {
  message: string
  max: number | null
  used: number | null
  /** The plan the server says is needed, when it names one. */
  upgradeTo: string | null
}

/**
 * Is this the plan-limit refusal (403, code LIMIT_REACHED)? Returns its details,
 * or `null` for any other error. The code can sit at the top of the body or
 * inside `data`, depending on how the middleware answers.
 */
export function limitReachedFrom(error: unknown): LimitReached | null {
  const res = (error as { response?: { status?: number; data?: unknown } } | null)?.response
  if (!res || !isRec(res.data)) return null
  // Only a refusal counts (the plan work answers 403): a 2xx or a 5xx is not one.
  if (typeof res.status !== "number" || res.status < 400 || res.status >= 500) return null
  const body = res.data
  const inner = isRec(body.data) ? body.data : isRec(body.details) ? body.details : null
  const code = text(body, ["code"]) ?? text(inner, ["code"]) ?? text(isRec(body.error) ? body.error : null, ["code"])
  if (code !== "LIMIT_REACHED") return null
  const src = inner ?? body
  return {
    message: text(body, ["message"]) ?? "",
    max: pick(src, MAX_KEYS) ?? pick(body, MAX_KEYS),
    used: pick(src, USED_KEYS) ?? pick(body, USED_KEYS),
    upgradeTo: text(src, ["planNeeded", "requiredPlan", "upgradeTo", "plan"]) ?? text(body, ["planNeeded", "requiredPlan", "upgradeTo"]),
  }
}
