// Ops Portal P2 — FE API client for the call sheet, onboarding, a staff-made listing's lifecycle, media and the vendor's own upload page.
// Every /ops call needs an ops role server-side; what a screen shows is a convenience, never the boundary.
import api from "@/lib/axiosConfig"

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p
  return res.data.data
}
const BASE = "/api/v1/ops"

/** { code, ...extra } the server puts in `data` on a failed call (e.g. VALIDATION -> errors[], INCOMPLETE -> missing[]). */
export function opsErrorData<T extends Record<string, unknown> = Record<string, unknown>>(err: unknown): (T & { code?: string }) | null {
  const e = err as { response?: { data?: { data?: T & { code?: string } } } }
  return e?.response?.data?.data ?? null
}

/* ----------------------------------- the call sheet ----------------------------------- */

export type SheetInput = "text" | "textarea" | "url" | "phone" | "email" | "number" | "money" | "percent" | "boolean" | "select" | "multiselect" | "tags" | "time" | "list"
export interface SheetField {
  key: string; label: string; input: SheetInput; destination: string
  required?: boolean; help?: string; max?: number; min?: number; placeholder?: string
  options?: { value: string; label: string }[]
  derivedFrom?: string; alsoTsd?: string
}
export interface SheetStep { id: string; title: string; titleUr?: string; script?: string; fields: SheetField[] }
export interface Sheet { type: string; version: number; steps: SheetStep[] }

export type SheetData = Record<string, unknown>
export interface FieldError { field: string; reason: string }
export interface OnboardingDraft {
  prospectId: number; vendorType: string; sheetVersion: number; rev: number; hasDraft: boolean
  data: SheetData; errors: FieldError[]; missing: string[]; businessId: number | null; status: string
  sheet?: Sheet; unknown?: string[]
}
export interface OnboardResult {
  businessId: number; userId: number; status: string; hidden: boolean; emailIsPlaceholder: boolean; completenessScore: number | null
  packages: number; menus: number; halls: number
}
export interface TakeoverResult {
  businessId: number; userId: number; status: string; mode: "takeover"; alreadyPublic: boolean; inheritedLeads: number
  completenessScore: number | null; packages: number; menus: number
}

export const onboardingApi = {
  get: (prospectId: number) => unwrap<OnboardingDraft>(api.get(`${BASE}/prospects/${prospectId}/onboarding`)),
  save: (prospectId: number, data: SheetData, rev?: number) => unwrap<OnboardingDraft>(api.put(`${BASE}/prospects/${prospectId}/onboarding`, { data, rev })),
  onboard: (prospectId: number) => unwrap<OnboardResult>(api.post(`${BASE}/prospects/${prospectId}/onboard`)),
  takeover: (prospectId: number) => unwrap<TakeoverResult>(api.post(`${BASE}/prospects/${prospectId}/takeover`)),
}

/* ----------------------------------- a staff-made listing ----------------------------------- */

export type GoLiveGap = "name" | "vendorType" | "city" | "area" | "phone" | "ownerName" | "subBusinessType" | "image" | "capacity" | "priceOrMenu" | "email" | "consent"
export type ConsentKind = "verbal_call" | "confirmed_written" | "withdrawn"
export interface ConsentRow { id: number; kind: ConsentKind; note: string | null; evidenceUrl: string | null; at: string; recordedByName: string | null }
export interface ListingView {
  business: { id: number; name: string; status: string; city: string | null; subArea: string | null; slug: string | null; completenessScore: number | null; images: number; videos: number; brandLogo: string | null }
  owner: { id: number; fullName: string | null; email: string | null; emailIsPlaceholder: boolean; claimedAt: string | null; phoneNumber: string | null }
  meta: { onboardMode: "new" | "takeover"; onboardedAt: string; qaStatus: string; needsMoreData: boolean; prospectId: number | null }
  readiness: { ready: boolean; gaps: GoLiveGap[]; counts: { menus: number; packages: number } }
  consents: ConsentRow[]
}
export interface PasswordLink { url: string; expiresAt: string; hours: number }
export interface GoLiveResult { businessId: number; status: string; slug: string | null; completenessScore: number | null; needsMoreData: boolean; qaQueued: boolean }

export interface EditableDetails { vendorType: string; fields: SheetField[]; values: SheetData }

export const listingApi = {
  details: (id: number) => unwrap<EditableDetails>(api.get(`${BASE}/listings/${id}/details`)),
  get: (id: number) => unwrap<ListingView>(api.get(`${BASE}/listings/${id}`)),
  consent: (id: number, body: { kind: ConsentKind; note?: string; evidenceUrl?: string }) => unwrap<{ id: number; kind: ConsentKind; tookDown: boolean }>(api.post(`${BASE}/listings/${id}/consent`, body)),
  ownerEmail: (id: number, email: string) => unwrap<{ ok: boolean }>(api.post(`${BASE}/listings/${id}/owner-email`, { email })),
  passwordLink: (id: number) => unwrap<PasswordLink>(api.post(`${BASE}/listings/${id}/password-link`)),
  goLive: (id: number) => unwrap<GoLiveResult>(api.post(`${BASE}/listings/${id}/go-live`)),
  edit: (id: number, changes: SheetData) => unwrap<{ changed: string[]; completenessScore: number | null }>(api.patch(`${BASE}/listings/${id}`, changes)),
}

/* ----------------------------------------- media ----------------------------------------- */

export type MediaKind = "image" | "video" | "logo"
export interface MediaLinkRow { id: number; expiresAt: string; revokedAt: string | null; uploadsCount: number; maxUploads: number; lastUsedAt: string | null; createdAt: string }
export interface MediaList { images: string[]; videos: string[]; brandLogo: string | null; limits: { images: number; videos: number }; links: MediaLinkRow[] }
export interface UploadOutcome { added: { url: string; kind: MediaKind }[]; failed: { name: string | null; reason: string }[] }
export interface MediaLinkCreated { id: number; url: string; expiresAt: string; hours: number }

export const mediaApi = {
  list: (id: number) => unwrap<MediaList>(api.get(`${BASE}/listings/${id}/media`)),
  upload: (id: number, files: File[], kind: MediaKind, rightsConfirmed: boolean) => {
    const fd = new FormData()
    fd.append("kind", kind)
    fd.append("rightsConfirmed", rightsConfirmed ? "true" : "false")
    files.forEach((f) => fd.append("files", f, f.name))
    return unwrap<UploadOutcome>(api.post(`${BASE}/listings/${id}/media`, fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 }))
  },
  remove: (id: number, url: string) => unwrap<{ removed: boolean }>(api.delete(`${BASE}/listings/${id}/media`, { data: { url } })),
  createLink: (id: number) => unwrap<MediaLinkCreated>(api.post(`${BASE}/listings/${id}/media-link`)),
  revokeLink: (id: number, linkId: number) => unwrap<{ revoked: boolean }>(api.delete(`${BASE}/listings/${id}/media-link/${linkId}`)),
}

/** Plain-language reasons for a file the server refused (the API returns a short code per file). */
export const UPLOAD_REASON: Record<string, string> = {
  bad_mime: "Not a JPG, PNG or WebP photo", too_small: "Too small (needs at least 400 px on each side)", too_large: "File is too large",
  not_a_video: "Not an MP4, MOV or WebM video", rejected_by_scan: "Blocked by the safety scan", gallery_full: "The gallery is full (20 photos)",
  video_limit_reached: "Already has 5 videos", store_failed: "Could not be saved, try again", unreadable: "Could not be read", empty: "The file is empty",
}

/* ------------------------------ the vendor's own upload page (no login) ------------------------------ */

export interface VendorUploadInfo { businessName: string; expiresAt: string; remainingUploads: number; images: number; videos: number; limits: { images: number; videos: number } }

export const vendorUploadApi = {
  info: (token: string) => unwrap<VendorUploadInfo>(api.get(`/api/v1/public/ops-media/${encodeURIComponent(token)}`)),
  upload: (token: string, files: File[], kind: "image" | "video") => {
    const fd = new FormData()
    fd.append("kind", kind)
    files.forEach((f) => fd.append("files", f, f.name))
    return unwrap<UploadOutcome>(api.post(`/api/v1/public/ops-media/${encodeURIComponent(token)}`, fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 180000 }))
  },
}
