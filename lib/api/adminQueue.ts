// 01-VR-ENHANCE-V1-FE — admin queue + audit-log surfaces.

import axiosInstance from "../axiosConfig"
import type { VendorDocument, VendorDocumentStatus } from "./vendorDocuments"

/**
 * WW-ADDBIZ — the canonical business lifecycle. `pending_review` is a business a
 * vendor self-served from the portal: hidden from the public catalog AND
 * unbookable until an admin approves it (see businessStatusGate.js). The legacy
 * OSM catalog sits in `submitted`, which IS publicly visible — the two are not
 * interchangeable.
 *
 * This is the ONE definition. lib/api/dashboard.ts re-exports it; do not declare
 * a second, or a Record<BusinessStatus, …> somewhere will silently lose a case.
 */
export type BusinessStatus =
  | "draft" | "pending_review" | "submitted" | "approved" | "rejected" | "suspended"
  // WP33 / PUBLIC-009: what "Changes" sets - hidden from the catalog like pending_review (it used to set `draft`, which is public)
  | "changes_requested"

export interface QueueBusiness {
  id: number
  name: string
  city: string | null
  status: BusinessStatus
  completenessScore: number
  verificationTier: number
  slug: string | null
  createdAt: string
  vendor?: {
    id: number
    fullName: string
    email: string
    phoneE164: string | null
    vendorType: string | null
  }
  documents?: VendorDocument[]
  /** new_vendor: their first business, just registered. additional: an existing vendor added another venue. import: an OSM-imported listing. */
  origin?: "new_vendor" | "additional" | "import"
  /** How many businesses this vendor has in total (this one included), and how many of them are live. */
  vendorBusinessCount?: number
  vendorApprovedCount?: number
  /** Their other venues (up to 6), so the admin can judge a 2nd or 5th venue. */
  vendorOtherBusinesses?: { id: number; name: string; status: BusinessStatus; city: string | null }[]
}

export interface AuditLog {
  id: number
  actorUserId: number | null
  targetType: string
  targetId: number
  action: string
  before: any
  after: any
  ipHash: string | null
  userAgent: string | null
  at: string
}

function unwrap<T>(res: any): T {
  return (res?.data?.data ?? null) as T
}

// ---------- Vendor queue ----------

export async function listVendorQueue(
  status: BusinessStatus = "submitted",
  limit = 50,
  offset = 0,
  q = "",
  origin?: "self"
): Promise<{ count: number; businesses: QueueBusiness[] }> {
  // F-H — pass the search term to the backend so it searches the WHOLE status
  // bucket (name/city), not just the 50 rows already loaded in the browser.
  const params: Record<string, string | number> = { status, limit, offset }
  if (q && q.trim()) params.q = q.trim()
  // origin=self: only what a real vendor sent in (registration / add-a-business), not the OSM import shells
  if (origin) params.origin = origin
  const res = await axiosInstance.get(`/api/v1/admin/vendor-queue`, { params })
  return unwrap<{ count: number; businesses: QueueBusiness[] }>(res) ?? { count: 0, businesses: [] }
}

export async function approveBusiness(id: number, notes?: string): Promise<QueueBusiness> {
  const res = await axiosInstance.post(`/api/v1/admin/vendor-queue/${id}/approve`, { notes })
  return unwrap<{ business: QueueBusiness }>(res)?.business as QueueBusiness
}

/**
 * Approve many submitted businesses at once. Pass `dryRun: true` to preview the
 * count before applying (only businesses currently in `submitted` are touched).
 */
export async function bulkApproveBusinesses(
  ids: number[],
  opts?: { dryRun?: boolean },
): Promise<{ approved?: number; count?: number; dryRun?: boolean; sample?: { id: number; name: string }[] }> {
  const res = await axiosInstance.post(`/api/v1/admin/vendor-queue/bulk-approve`, {
    ids,
    dryRun: opts?.dryRun === true,
  })
  return (unwrap<{ approved?: number; count?: number; dryRun?: boolean; sample?: { id: number; name: string }[] }>(res) ?? {})
}

export async function rejectBusiness(id: number, notes?: string): Promise<QueueBusiness> {
  const res = await axiosInstance.post(`/api/v1/admin/vendor-queue/${id}/reject`, { notes })
  return unwrap<{ business: QueueBusiness }>(res)?.business as QueueBusiness
}

export async function requestChangesBusiness(id: number, notes?: string): Promise<QueueBusiness> {
  const res = await axiosInstance.post(`/api/v1/admin/vendor-queue/${id}/request-changes`, { notes })
  return unwrap<{ business: QueueBusiness }>(res)?.business as QueueBusiness
}

export async function suspendBusiness(id: number, notes?: string): Promise<QueueBusiness> {
  const res = await axiosInstance.post(`/api/v1/admin/vendor-queue/${id}/suspend`, { notes })
  return unwrap<{ business: QueueBusiness }>(res)?.business as QueueBusiness
}

export async function restoreBusiness(id: number, notes?: string): Promise<QueueBusiness> {
  const res = await axiosInstance.post(`/api/v1/admin/vendor-queue/${id}/restore`, { notes })
  return unwrap<{ business: QueueBusiness }>(res)?.business as QueueBusiness
}

// ---------- Document queue ----------

export async function listDocumentQueue(
  status: VendorDocumentStatus = "pending",
  limit = 50,
  offset = 0
): Promise<{ count: number; documents: VendorDocument[] }> {
  const res = await axiosInstance.get(`/api/v1/admin/documents`, { params: { status, limit, offset } })
  return unwrap<{ count: number; documents: VendorDocument[] }>(res) ?? { count: 0, documents: [] }
}

export async function approveDocument(id: number, notes?: string): Promise<VendorDocument> {
  const res = await axiosInstance.post(`/api/v1/admin/documents/${id}/approve`, { notes })
  return unwrap<{ document: VendorDocument }>(res)?.document as VendorDocument
}

export async function rejectDocument(id: number, notes?: string): Promise<VendorDocument> {
  const res = await axiosInstance.post(`/api/v1/admin/documents/${id}/reject`, { notes })
  return unwrap<{ document: VendorDocument }>(res)?.document as VendorDocument
}

export async function requestChangesDocument(id: number, notes: string): Promise<VendorDocument> {
  const res = await axiosInstance.post(`/api/v1/admin/documents/${id}/request-changes`, { notes })
  return unwrap<{ document: VendorDocument }>(res)?.document as VendorDocument
}

// ---------- Bank ----------

export async function verifyBank(id: number, method = "document"): Promise<void> {
  await axiosInstance.post(`/api/v1/admin/bank-details/${id}/verify`, { method })
}

// ---------- Audit logs ----------

export async function listAuditLogs(filters: {
  targetType?: string
  targetId?: number
  actorUserId?: number
  action?: string
  limit?: number
  offset?: number
  /** PUBLIC-046 (additive): date window on `at` (YYYY-MM-DD in Pakistan time, or a timestamp), inclusive. */
  from?: string
  to?: string
  /** Hide the sign-in noise (session rows). */
  hideSessions?: boolean
} = {}): Promise<AuditLogList> {
  const res = await axiosInstance.get(`/api/v1/admin/audit-logs`, { params: filters })
  return unwrap<AuditLogList>(res) ?? { count: 0, logs: [] }
}

export interface AuditLogList {
  count: number
  logs: AuditLog[]
  /** user id -> display name for the actors on this page (older servers omit these). */
  actorNames?: Record<string, string>
  /** "business:12" / "user:7" -> name for the targets on this page. */
  targetNames?: Record<string, string>
  /** Counts over the WHOLE filtered set, not just the page. */
  summary?: { total: number; today: number; distinctActions: number; distinctActors: number }
}

/** Every page (500 a row batch, up to 20 batches) so search, export and the cards cover the full log. */
export async function listAllAuditLogs(filters: Parameters<typeof listAuditLogs>[0] = {}, pageSize = 500, maxPages = 20): Promise<AuditLogList> {
  const first = await listAuditLogs({ ...filters, limit: pageSize, offset: 0 })
  const logs = [...first.logs]
  const actorNames = { ...(first.actorNames ?? {}) }
  const targetNames = { ...(first.targetNames ?? {}) }
  for (let page = 1; logs.length < first.count && page < maxPages; page++) {
    const next = await listAuditLogs({ ...filters, limit: pageSize, offset: page * pageSize })
    if (!next.logs.length) break
    logs.push(...next.logs)
    Object.assign(actorNames, next.actorNames ?? {})
    Object.assign(targetNames, next.targetNames ?? {})
  }
  return { ...first, logs, actorNames, targetNames }
}
