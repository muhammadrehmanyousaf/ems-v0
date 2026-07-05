// 01-VR-ENHANCE-V1-FE — admin queue + audit-log surfaces.

import axiosInstance from "../axiosConfig"
import type { VendorDocument, VendorDocumentStatus } from "./vendorDocuments"

export type BusinessStatus = "draft" | "submitted" | "approved" | "rejected" | "suspended"

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
  q = ""
): Promise<{ count: number; businesses: QueueBusiness[] }> {
  // F-H — pass the search term to the backend so it searches the WHOLE status
  // bucket (name/city), not just the 50 rows already loaded in the browser.
  const params: Record<string, string | number> = { status, limit, offset }
  if (q && q.trim()) params.q = q.trim()
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
} = {}): Promise<{ count: number; logs: AuditLog[] }> {
  const res = await axiosInstance.get(`/api/v1/admin/audit-logs`, { params: filters })
  return unwrap<{ count: number; logs: AuditLog[] }>(res) ?? { count: 0, logs: [] }
}
