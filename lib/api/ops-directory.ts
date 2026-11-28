// Ops Portal P7 — FE API client helpers for upgraded Vendor Directory workspace, Media upload on any vendor, and Client Desk bulk owner actions.
import api from "@/lib/axiosConfig"
import type { MediaKind, MediaLinkCreated, MediaList, UploadOutcome } from "@/lib/api/ops-onboarding"

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return (await p).data.data
}
const BASE = "/api/v1/ops"

export interface DirectoryVendorRow {
  id: number
  name: string
  vendorType: string | null
  city: string | null
  subArea: string | null
  status: string
  live: boolean
  completenessScore: number | null
  phone: string | null
  phoneIsPlaceholder?: boolean
  ownerName: string | null
  source: string | null
  packages: number
  menus: number
  imagesCount: number
  bookingsCount: number
  leadsCount: number
  prospectId: number | null
  minimumPrice: number | null
  maxCapacity: number | null
}

export interface DirectorySearchParams {
  q?: string
  type?: string
  city?: string
  source?: string
  needs?: string
  live?: "true" | "false" | "live" | "notlive"
  sort?: "completeness_asc" | "completeness_desc" | "newest" | "bookings" | "leads"
  page?: number
  pageSize?: number
  limit?: number
}

export interface VendorBookingRef {
  id: number
  bookingDate: string | null
  bookingTime: string | null
  status: string
  paymentStatus: string
  totalAmount: number | string | null
  customerName: string | null
  customerPhone: string | null
  eventCity: string | null
  eventType: string | null
  opsStage: string | null
  priority: string | null
  createdAt: string
}

export interface VendorInquiryRef {
  id: number
  clientName: string | null
  clientPhone: string | null
  clientEmail: string | null
  eventType: string | null
  eventDate: string | null
  inquiry: string | null
  status: string
  source: string | null
  createdAt: string
}

export interface VendorLogRef {
  id: number
  channel: "call" | "whatsapp" | "note"
  outcome: string | null
  note: string | null
  nextFollowUpAt: string | null
  at: string
  userId: number | null
  agentName: string | null
}

export const directoryOpsApi = {
  search: (params: DirectorySearchParams): Promise<{ q: string; total: number; page: number; pageSize: number; rows: DirectoryVendorRow[] }> =>
    unwrap(api.get(`${BASE}/directory`, { params })),
  logCall: (businessId: number, body: { channel: "call" | "whatsapp" | "note"; outcome?: string | null; note?: string | null; nextFollowUpAt?: string | null }):
    Promise<VendorLogRef> => unwrap(api.post(`${BASE}/directory/${businessId}/log`, body)),
  queueProspect: (businessId: number): Promise<{ id: number; existed: boolean }> =>
    unwrap(api.post(`${BASE}/directory/${businessId}/queue`, {})),
  mediaList: (businessId: number): Promise<MediaList> =>
    unwrap(api.get(`${BASE}/directory/${businessId}/media`)),
  mediaUpload: (businessId: number, files: File[], kind: MediaKind, rightsConfirmed: boolean): Promise<UploadOutcome> => {
    const fd = new FormData()
    fd.append("kind", kind)
    fd.append("rightsConfirmed", rightsConfirmed ? "true" : "false")
    files.forEach((f) => fd.append("files", f, f.name))
    return unwrap(api.post(`${BASE}/directory/${businessId}/media`, fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 }))
  },
  mediaRemove: (businessId: number, url: string): Promise<{ removed: boolean }> =>
    unwrap(api.delete(`${BASE}/directory/${businessId}/media`, { data: { url } })),
  createMediaLink: (businessId: number): Promise<MediaLinkCreated> =>
    unwrap(api.post(`${BASE}/directory/${businessId}/media-link`, {})),
  revokeMediaLink: (businessId: number, linkId: number): Promise<{ revoked: boolean }> =>
    unwrap(api.delete(`${BASE}/directory/${businessId}/media-link/${linkId}`)),
  setOwnerEmail: (businessId: number, email: string): Promise<{ ok: boolean; email: string }> =>
    unwrap(api.post(`${BASE}/directory/${businessId}/owner-email`, { email })),
}

export const clientBulkApi = {
  bulkOwner: (ids: number[], toUserId: "me" | "pool" | number | null, reason?: string): Promise<{ moved: number; requested: number }> =>
    unwrap(api.post(`${BASE}/clients/bulk-owner`, { ids, toUserId, reason })),
}
