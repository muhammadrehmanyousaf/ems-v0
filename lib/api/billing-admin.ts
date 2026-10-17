/**
 * Super-admin side of the plans programme (PL-A billing tools, PL-B manual payments, shadow report).
 *
 *   /subscriptions/admin/manual-payments            list ?status=pending|approved|rejected|all, /:id/approve, /:id/reject
 *   /subscriptions/admin/billing/vendor/:userId     one vendor: state, sources, grants, audit
 *   /subscriptions/admin/billing/:userId/{grant-trial,extend-trial,comp,force-unlock,suspend,unsuspend}   all need a reason
 *   /subscriptions/admin/billing/{expiring,locked-with-future-events,metrics,audit,shadow-report}
 *
 * Shapes are the ones the controllers answer (regression/pl-a-core.md section 6, pl-b-enforce.md section 7). Every reader
 * tolerates a missing field and never invents a number: an unknown amount is null and the screen prints a dash.
 */

import axiosInstance from "@/lib/axiosConfig"

const BASE = "/api/v1/subscriptions/admin"

/* ───────────── manual payments ───────────── */

export type ManualStatus = "pending" | "approved" | "rejected"

export interface ManualPaymentRow {
  id: number
  status: ManualStatus
  tier: string
  method: string
  amountPkr: number | null
  reference: string
  submittedAt: string | null
  decidedAt: string | null
  rejectionReason: string | null
  receiptNo: string | null
  hasProof: boolean
  userId: number
  proofUrl: string | null
  decidedBy: number | null
  vendor: { id: number; fullName: string | null; email: string | null; phoneNumber: string | null } | null
}

export async function listManualPayments(status: ManualStatus | "all"): Promise<ManualPaymentRow[]> {
  const res = await axiosInstance.get(`${BASE}/manual-payments`, { params: { status, limit: 200 } })
  const items = res.data?.data?.items
  return Array.isArray(items) ? (items as ManualPaymentRow[]) : []
}

export async function approveManualPayment(id: number, note?: string): Promise<{ message: string; alreadyApproved: boolean }> {
  const res = await axiosInstance.post(`${BASE}/manual-payments/${id}/approve`, note ? { note } : {})
  return { message: String(res.data?.message ?? "Approved"), alreadyApproved: !!res.data?.data?.alreadyApproved }
}

export async function rejectManualPayment(id: number, reason: string): Promise<void> {
  await axiosInstance.post(`${BASE}/manual-payments/${id}/reject`, { reason })
}

/* ───────────── vendor lookup + actions ───────────── */

export interface VendorHit { id: number; fullName: string | null; email: string | null; phoneNumber: string | null; isVendor: boolean }

/** Find a vendor by name / e-mail / phone (the existing super-admin user search), or by id. */
export async function findVendors(q: string): Promise<VendorHit[]> {
  const term = q.trim()
  if (!term) return []
  const res = await axiosInstance.get("/api/v1/users", { params: { search: term, limit: 8 } })
  const rows = res.data?.data?.results
  return (Array.isArray(rows) ? rows : []).filter((u: VendorHit) => u && u.isVendor)
}

export interface AccessView {
  state: string | null
  plan: string | null
  planName: string | null
  trialEndsAt: string | null
  graceEndsAt: string | null
  lockedAt: string | null
  retainUntil: string | null
  lockReason: string | null
  canPay: boolean
  canStartTrial: boolean
  isLocked?: boolean
  daysLeft: number | null
  applies: boolean
  enforced: boolean
  periodEndsAt?: string | null
  accessEndsAt?: string | null
}

export interface AuditRow {
  id: number
  at: string
  userId: number
  actorUserId: number | null
  actorType: string | null
  cause: string | null
  fromState: string | null
  toState: string | null
  reason: string | null
  meta?: unknown
}

export interface VendorBilling {
  user: { id: number; fullName: string | null; email: string | null; phoneNumber: string | null; isVendor: boolean; createdAt?: string }
  access: AccessView
  subscriptions: Array<{ id: number; tier: string; status: string; trialEndsAt: string | null; currentPeriodEndsAt: string | null; amountPaisas: number | null; planToken: string | null; reference: string; createdAt: string }>
  grants: Array<{ id: number; tier: string; source: string; endsAt: string | null; note: string | null; revokedAt: string | null; supersededAt: string | null }>
  trialBlocks: Array<{ id: number; keyType: string }>
  flags: { suspendedAt: string | null; suspendReason: string | null; lastState: string | null } | null
  audit: AuditRow[]
}

export async function getVendorBilling(userId: number): Promise<VendorBilling> {
  const res = await axiosInstance.get(`${BASE}/billing/vendor/${userId}`)
  const d = res.data?.data
  if (!d) throw new Error("The vendor view came back empty.")
  return d as VendorBilling
}

export type BillingAction = "grant-trial" | "extend-trial" | "comp" | "force-unlock" | "suspend" | "unsuspend"

export async function billingAction(userId: number, action: BillingAction, body: Record<string, unknown>): Promise<string> {
  const res = await axiosInstance.post(`${BASE}/billing/${userId}/${action}`, body)
  return String(res.data?.message ?? "Done")
}

/* ───────────── lists + metrics ───────────── */

export interface ExpiringItem { userId: number; kind: string; tier: string | null; endsAt: string; vendor: { id: number; fullName: string | null; email: string | null; phoneNumber: string | null } | null }
export async function listExpiring(days: number): Promise<{ days: number; count: number; items: ExpiringItem[] }> {
  const res = await axiosInstance.get(`${BASE}/billing/expiring`, { params: { days } })
  const d = res.data?.data ?? {}
  return { days: Number(d.days ?? days), count: Number(d.count ?? 0), items: Array.isArray(d.items) ? d.items : [] }
}

export interface LockedWithEvents { userId: number; events: number; nextEvent: string | null; state: string; lockReason: string | null; lockedAt: string | null; vendor: { id: number; fullName: string | null; email: string | null; phoneNumber: string | null } | null }
export async function listLockedWithEvents(): Promise<{ count: number; checked: number; enforceMode: string | null; items: LockedWithEvents[] }> {
  const res = await axiosInstance.get(`${BASE}/billing/locked-with-future-events`)
  const d = res.data?.data ?? {}
  return { count: Number(d.count ?? 0), checked: Number(d.checked ?? 0), enforceMode: d.enforceMode ?? null, items: Array.isArray(d.items) ? d.items : [] }
}

export interface BillingMetrics {
  windowDays: number
  trials: { started: number; converted: number; conversionRate: number | null; byDay: Array<{ day: string; n: number }>; blocked: Array<{ keyType: string; n: number }> }
  mrr: { totalPaisas: number; byTier: Array<{ tier: string; subscribers: number; mrrPaisas: string | number }> }
  accountsByState: Array<{ state: string; n: number }>
  manualPayments: { byStatus: Array<{ status: string; n: number; amountPkr: number }>; pendingNow: number }
  note?: string
}
export async function getMetrics(days: number): Promise<BillingMetrics> {
  const res = await axiosInstance.get(`${BASE}/billing/metrics`, { params: { days } })
  const d = res.data?.data
  if (!d) throw new Error("The metrics came back empty.")
  return d as BillingMetrics
}

export async function listAudit(opts: { userId?: number; cause?: string; limit?: number }): Promise<AuditRow[]> {
  const res = await axiosInstance.get(`${BASE}/billing/audit`, { params: { limit: opts.limit ?? 100, ...(opts.userId ? { userId: opts.userId } : {}), ...(opts.cause ? { cause: opts.cause } : {}) } })
  const items = res.data?.data?.items
  return Array.isArray(items) ? items : []
}

export interface ShadowReport {
  windowDays: number
  mode: string | null
  vendorsThatWouldLock: number
  byRoute: Array<{ route: string; vendors: number; samples: number }>
  byVendor: Array<{ userId: number; routes: number; samples: number; last: string }>
  venueRefusals: number
  unclassifiedRoutes: Array<{ route: string; last: string }>
}
export async function getShadowReport(days: number): Promise<ShadowReport> {
  const res = await axiosInstance.get(`${BASE}/billing/shadow-report`, { params: { days } })
  const d = res.data?.data
  if (!d) throw new Error("The shadow report came back empty.")
  return d as ShadowReport
}

/** The server's own message for a refused action (reason missing, comp too long, not locked ...), else the fallback. */
export function adminErrorMessage(e: unknown, fallback: string): string {
  const m = (e as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  return typeof m === "string" && m ? m : fallback
}
