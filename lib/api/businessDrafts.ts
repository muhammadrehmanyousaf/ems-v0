// 01-VR-ENHANCE-V1-FE — server-side draft persistence for the multi-step
// vendor registration form.
//
// No auth required: drafts exist before there's an account. The backend
// rate-limits per email + IP. Image binaries are NOT serialised — only
// uploaded URLs and filenames go into the payload.

import axiosInstance from "../axiosConfig"

export interface DraftPayload {
  // Free-form snapshot of the form-context state. We don't impose a strict
  // shape here because vendorType drives which fields apply; the backend
  // accepts any JSON object (with a 256 KB cap).
  [key: string]: any
}

export interface DraftRecord {
  id: number | string
  ownerEmail: string
  payload: DraftPayload
  currentStep: number
  vendorType: string | null
  expiresAt: string
  updatedAt?: string
  /** True when the backend withheld the payload because no valid resume
   * token was presented (WW-005). The draft exists but can only be resumed
   * on the device/browser where it was started. */
  payloadProtected?: boolean
}

function unwrap<T>(res: any): T {
  return (res?.data?.data ?? null) as T
}

// WW-005 — the draft payload (CNIC, phone, address) is released by the
// backend only to the client holding the `resumeToken` minted at save time.
// We stash that token locally, keyed by normalised email, and present it on
// resume. Knowing the email alone never unlocks the payload, which closes the
// unauthenticated PII-enumeration hole.
const TOKEN_KEY_PREFIX = "ww_draft_rt_"

function tokenKey(email: string): string {
  return TOKEN_KEY_PREFIX + email.trim().toLowerCase()
}

function storeResumeToken(email: string, token?: string | null) {
  if (typeof window === "undefined" || !email || !token) return
  try {
    window.localStorage.setItem(tokenKey(email), token)
  } catch {
    /* storage disabled / full — resume simply degrades to start-over */
  }
}

function readResumeToken(email: string): string | null {
  if (typeof window === "undefined" || !email) return null
  try {
    return window.localStorage.getItem(tokenKey(email))
  } catch {
    return null
  }
}

function clearResumeToken(email: string) {
  if (typeof window === "undefined" || !email) return
  try {
    window.localStorage.removeItem(tokenKey(email))
  } catch {
    /* no-op */
  }
}

export async function saveDraft(args: {
  ownerEmail: string
  payload: DraftPayload
  currentStep?: number
  vendorType?: string | null
  /** Merge into the existing payload server-side (default false → full replace). */
  merge?: boolean
}): Promise<{ id: string | number; currentStep: number; expiresAt: string; vendorType: string | null; resumeToken?: string }> {
  const res = await axiosInstance.post("/api/v1/businesses/draft", {
    ownerEmail: args.ownerEmail,
    payload: args.payload,
    currentStep: typeof args.currentStep === "number" ? args.currentStep : 0,
    vendorType: args.vendorType ?? null,
    merge: !!args.merge,
  })
  const data = unwrap<{ resumeToken?: string }>(res) as any
  // Persist the capability secret so a later resume can unlock the payload.
  storeResumeToken(args.ownerEmail, data?.resumeToken)
  return data
}

export async function loadDraft(email: string): Promise<DraftRecord | null> {
  if (!email) return null
  try {
    // POST /lookup (not GET ?email=) so neither the email nor the resume token
    // lands in a URL/query log; present the stored token to unlock the payload.
    const res = await axiosInstance.post(`/api/v1/businesses/draft/lookup`, {
      ownerEmail: email,
      resumeToken: readResumeToken(email) ?? undefined,
    })
    return unwrap<DraftRecord>(res)
  } catch (e: any) {
    if (e?.response?.status === 404) return null
    throw e
  }
}

export async function discardDraft(email: string): Promise<boolean> {
  try {
    await axiosInstance.delete(`/api/v1/businesses/draft`, { data: { ownerEmail: email } })
    clearResumeToken(email)
    return true
  } catch (e: any) {
    if (e?.response?.status === 404) {
      clearResumeToken(email)
      return false
    }
    throw e
  }
}
