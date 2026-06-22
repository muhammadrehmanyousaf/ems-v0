// Vendor "claim & complete listing" — typed wrappers for the claim API.
// Base = `${BACKEND_URL}api/v1/claims`. Every response is the standard
// apiResponse envelope `{ status, message, data }`, so we read `res.data.data`.
//
// Public endpoints are flag-gated on the backend by CLAIM_ENABLED; the FE
// mirrors this with NEXT_PUBLIC_CLAIM_ENABLED (see lib/claim-flag.ts).

import axiosInstance from "../axiosConfig"

function unwrap<T>(res: any): T {
  return (res?.data?.data ?? null) as T
}

// ---------- Public claim flow ----------

export interface StartClaimResult {
  claimId: number
  otpSentTo: string // masked
}

/** Step A — POST /start { listingId, name, email, phone? }. Email-only flow:
 *  email is required, phone is an optional confidence signal. otpSentTo is a
 *  masked email. */
export async function startClaim(payload: {
  listingId: string | number
  name: string
  email: string
  phone?: string
}): Promise<StartClaimResult> {
  const res = await axiosInstance.post(`/api/v1/claims/start`, payload)
  return unwrap<StartClaimResult>(res) as StartClaimResult
}

export type ClaimNext = "set_password" | "evidence"

/** Step B — POST /:id/verify { code }. Decides the proof path. */
export async function verifyClaim(
  claimId: string | number,
  code: string
): Promise<{ next: ClaimNext }> {
  const res = await axiosInstance.post(`/api/v1/claims/${claimId}/verify`, { code })
  return unwrap<{ next: ClaimNext }>(res) as { next: ClaimNext }
}

/** Step C (phone-match) — POST /:id/finalize { password } → login token. */
export async function finalizeClaim(
  claimId: string | number,
  password: string
): Promise<{ user: any; token: string; jti?: string }> {
  const res = await axiosInstance.post(`/api/v1/claims/${claimId}/finalize`, { password })
  return unwrap<{ user: any; token: string; jti?: string }>(res) as {
    user: any
    token: string
    jti?: string
  }
}

/** Step D (evidence) — POST /:id/evidence { evidenceNote } → review queue. */
export async function submitClaimEvidence(
  claimId: string | number,
  evidenceNote: string
): Promise<{ status: string }> {
  const res = await axiosInstance.post(`/api/v1/claims/${claimId}/evidence`, { evidenceNote })
  return unwrap<{ status: string }>(res) ?? { status: "pending_review" }
}

// ---------- Admin review queue (auth + super-admin) ----------

export type ClaimStatus =
  | "pending_otp"
  | "otp_verified"
  | "pending_review"
  | "approved"
  | "rejected"
  | "auto_approved"

export interface AdminClaim {
  id: number
  listingUserId: number
  businessId: number
  claimantName: string
  claimantEmail: string
  claimantPhoneE164: string
  method: "phone_match" | "evidence"
  status: ClaimStatus
  evidenceNote: string | null
  evidenceDocUrl: string | null
  rejectionReason: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  // Denormalized for the queue — backend may include these for display.
  business?: { id: number; name?: string; city?: string | null } | null
  listing?: { id: number; name?: string } | null
}

/** GET /admin/claims (optionally filtered by status). */
export async function listClaims(status?: ClaimStatus): Promise<AdminClaim[]> {
  const res = await axiosInstance.get(`/api/v1/claims/admin/claims`, {
    params: status ? { status } : undefined,
  })
  const data = unwrap<AdminClaim[] | { claims: AdminClaim[] }>(res)
  if (Array.isArray(data)) return data
  return (data as { claims?: AdminClaim[] })?.claims ?? []
}

/** POST /admin/claims/:id/approve — emails the claimant a set-password link. */
export async function approveClaim(id: number): Promise<void> {
  await axiosInstance.post(`/api/v1/claims/admin/claims/${id}/approve`, {})
}

/** POST /admin/claims/:id/reject { rejectionReason }. */
export async function rejectClaim(id: number, rejectionReason: string): Promise<void> {
  await axiosInstance.post(`/api/v1/claims/admin/claims/${id}/reject`, { rejectionReason })
}
