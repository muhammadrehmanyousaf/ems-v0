/**
 * The shapes of the billing endpoints the Wall and the billing page use, and the readers that validate them. PURE (no axios,
 * no React) so scripts/plans-wall-check.mts can run them. lib/api/billing.ts re-exports all of this.
 *
 * Every reader is TOLERANT of the exact envelope but never invents a value: a missing number is `null` (rendered as "not
 * available"), never 0, so a failed or partial answer can not read as "you owe nothing" (the missing-not-zero rule).
 */

type Rec = Record<string, unknown>
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v)
const num = (v: unknown): number | null => {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v
  return typeof n === "number" && Number.isFinite(n) ? n : null
}
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null)


/** True when an error is "this endpoint does not exist on this server yet". */
export function isNotThere(e: unknown): boolean {
  const s = (e as { response?: { status?: number } } | null)?.response?.status
  return s === 404 || s === 501
}


export interface Obligations {
  confirmedEventsNext60: number | null
  nextEvent: { date: string | null; slotLabel: string | null; hall: string | null } | null
  /** One money total, in rupees. */
  totalToCollect: number | null
  chequesDue14d: number | null
  enquiriesWhileLocked: number | null
}

export function parseObligations(raw: unknown): Obligations | null {
  const d = isRec(raw) && isRec(raw.obligations) ? raw.obligations : raw
  if (!isRec(d)) return null
  const ne = isRec(d.nextEvent) ? { date: str(d.nextEvent.date), slotLabel: str(d.nextEvent.slotLabel), hall: str(d.nextEvent.hall) } : null
  const out: Obligations = {
    confirmedEventsNext60: num(d.confirmedEventsNext60),
    nextEvent: ne && (ne.date || ne.hall) ? ne : null,
    totalToCollect: num(d.totalToCollect),
    chequesDue14d: num(d.chequesDue14d),
    enquiriesWhileLocked: num(d.enquiriesWhileLocked),
  }
  // An answer with none of the five fields is not an answer.
  const any = out.confirmedEventsNext60 !== null || out.totalToCollect !== null || out.chequesDue14d !== null || out.enquiriesWhileLocked !== null || ne !== null
  return any ? out : null
}


export type ManualMethodKey = "bank" | "jazzcash" | "easypaisa"
export interface ManualMethod {
  key: ManualMethodKey
  label: string
  accountTitle: string | null
  accountNumber: string | null
  bankName: string | null
  note: string | null
}
export type ManualStatus = "pending" | "approved" | "rejected"
export interface ManualPaymentCurrent {
  id: number | null
  status: ManualStatus
  tier: string | null
  method: string | null
  amountPkr: number | null
  reference: string | null
  submittedAt: string | null
  decidedAt: string | null
  rejectionReason: string | null
}
export interface ManualPaymentInfo {
  enabled: boolean
  methods: ManualMethod[]
  current: ManualPaymentCurrent | null
}

const METHOD_KEYS: ManualMethodKey[] = ["bank", "jazzcash", "easypaisa"]

export function parseManualPayment(raw: unknown): ManualPaymentInfo | null {
  const d = isRec(raw) && isRec(raw.manualPayment) ? raw.manualPayment : raw
  if (!isRec(d)) return null
  const methods: ManualMethod[] = []
  if (Array.isArray(d.methods)) {
    for (const m of d.methods) {
      if (!isRec(m)) continue
      const key = str(m.key)
      if (!key || !METHOD_KEYS.includes(key as ManualMethodKey)) continue
      methods.push({
        key: key as ManualMethodKey,
        label: str(m.label) ?? (key === "bank" ? "Bank transfer" : key === "jazzcash" ? "JazzCash" : "Easypaisa"),
        accountTitle: str(m.accountTitle), accountNumber: str(m.accountNumber), bankName: str(m.bankName), note: str(m.note),
      })
    }
  }
  const c = isRec(d.current) ? d.current : null
  const status = c ? str(c.status) : null
  const current: ManualPaymentCurrent | null = c && (status === "pending" || status === "approved" || status === "rejected")
    ? {
        id: num(c.id), status, tier: str(c.tier), method: str(c.method), amountPkr: num(c.amountPkr), reference: str(c.reference),
        submittedAt: str(c.submittedAt), decidedAt: str(c.decidedAt), rejectionReason: str(c.rejectionReason),
      }
    : null
  return { enabled: d.enabled === true && methods.length > 0, methods, current }
}


export interface LiveVenue { id: number; name: string; city: string | null; live: boolean }
export interface LiveVenues {
  /** How many venues the plan allows live (null = unlimited). */
  limit: number | null
  planName: string | null
  venues: LiveVenue[]
}

export function parseLiveVenues(raw: unknown): LiveVenues | null {
  const d = isRec(raw) && isRec(raw.liveVenues) ? raw.liveVenues : raw
  if (!isRec(d) || !Array.isArray(d.venues)) return null
  const venues: LiveVenue[] = []
  for (const v of d.venues) {
    if (!isRec(v)) continue
    const id = num(v.id)
    if (id === null) continue
    venues.push({ id, name: str(v.name) ?? `Venue ${id}`, city: str(v.city), live: v.live !== false })
  }
  return { limit: d.limit === null ? null : num(d.limit), planName: str(d.planName), venues }
}


