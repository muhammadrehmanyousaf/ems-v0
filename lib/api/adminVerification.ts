/**
 * WW-VERIFY-GATES — the admin client for a vendor's identity gates.
 *
 * `/admin/verification-queue` has existed on the server with four approvals, a
 * reject, and a list — and no client, so no screen could reach it. Meanwhile
 * `DocumentQueueTable` already renders `ntnVerifiedAt`, `cnicVerifiedAt` and
 * `addressVerifiedAt` as pills, and eight backend files read them. The readers
 * were built and the writer was unreachable, so every vendor on the platform
 * read as unverified on all three, permanently.
 *
 * These are separate from `/admin/vendor-queue`, which approves the LISTING.
 * This approves the identity behind it: the NTN certificate, the CNIC, the
 * address proof, and whether anyone has actually stood in the venue.
 */
import axiosInstance from "../axiosConfig"

/** The four gates the server accepts. Anything else is a 400. */
export type VerificationGate = "ntn" | "cnic" | "address" | "visited"

export const VERIFICATION_GATES: VerificationGate[] = ["ntn", "cnic", "address", "visited"]

export const GATE_LABELS: Record<VerificationGate, string> = {
  ntn: "NTN",
  cnic: "CNIC",
  address: "Address",
  visited: "Site visit",
}

export interface VerificationRow {
  id: number
  name: string | null
  city: string | null
  subArea: string | null
  vendor?: { id: number; email: string | null; fullName: string | null; phoneNumber: string | null } | null
  ntnNumber: string | null
  ntnVerifiedAt: string | null
  /** The encrypted CNIC is never sent — only whether one was submitted. */
  cnicSubmitted: boolean
  cnicVerifiedAt: string | null
  addressProofUrl: string | null
  addressVerifiedAt: string | null
  visitedAt: string | null
  visitedByUserId: number | null
  completenessScore: number | null
  createdAt: string
}

function unwrap<T>(res: { data?: { data?: T } }): T | undefined {
  return res?.data?.data
}

/**
 * Businesses with a gate submitted and not yet verified.
 * Omit `gate` for every pending gate at once.
 */
export async function listVerificationQueue(opts?: {
  gate?: VerificationGate
  page?: number
  limit?: number
}): Promise<{ count: number; page: number; limit: number; rows: VerificationRow[] }> {
  const params: Record<string, string | number> = {
    page: opts?.page ?? 1,
    limit: opts?.limit ?? 25,
  }
  if (opts?.gate) params.gate = opts.gate
  const res = await axiosInstance.get(`/api/v1/admin/verification-queue`, { params })
  return unwrap<{ count: number; page: number; limit: number; rows: VerificationRow[] }>(res)
    ?? { count: 0, page: 1, limit: 25, rows: [] }
}

/** The path segment differs for the site visit — it is a record, not an approval. */
const APPROVE_PATH: Record<VerificationGate, string> = {
  ntn: "approve-ntn",
  cnic: "approve-cnic",
  address: "approve-address",
  visited: "mark-visited",
}

/**
 * Stamp a gate verified.
 *
 * The server refuses with 400 when nothing was submitted and 409 when it is
 * already verified — both are meaningful to show, so callers should surface
 * `response.data.message` rather than a generic failure.
 */
export async function approveGate(businessId: number, gate: VerificationGate): Promise<void> {
  await axiosInstance.post(`/api/v1/admin/verification-queue/${businessId}/${APPROVE_PATH[gate]}`, {})
}

/**
 * Turn a gate down. This CLEARS the submitted value, so the vendor has to send
 * it again — which is why the reason is not optional here.
 */
export async function rejectGate(businessId: number, gate: VerificationGate, reason: string): Promise<void> {
  await axiosInstance.post(`/api/v1/admin/verification-queue/${businessId}/reject`, { gate, reason })
}
