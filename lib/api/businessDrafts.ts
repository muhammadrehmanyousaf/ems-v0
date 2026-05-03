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
}

function unwrap<T>(res: any): T {
  return (res?.data?.data ?? null) as T
}

export async function saveDraft(args: {
  ownerEmail: string
  payload: DraftPayload
  currentStep?: number
  vendorType?: string | null
  /** Merge into the existing payload server-side (default false → full replace). */
  merge?: boolean
}): Promise<{ id: string | number; currentStep: number; expiresAt: string; vendorType: string | null }> {
  const res = await axiosInstance.post("/api/v1/businesses/draft", {
    ownerEmail: args.ownerEmail,
    payload: args.payload,
    currentStep: typeof args.currentStep === "number" ? args.currentStep : 0,
    vendorType: args.vendorType ?? null,
    merge: !!args.merge,
  })
  return unwrap(res) as any
}

export async function loadDraft(email: string): Promise<DraftRecord | null> {
  if (!email) return null
  try {
    const res = await axiosInstance.get(`/api/v1/businesses/draft`, { params: { email } })
    return unwrap<DraftRecord>(res)
  } catch (e: any) {
    if (e?.response?.status === 404) return null
    throw e
  }
}

export async function discardDraft(email: string): Promise<boolean> {
  try {
    await axiosInstance.delete(`/api/v1/businesses/draft`, { data: { ownerEmail: email } })
    return true
  } catch (e: any) {
    if (e?.response?.status === 404) return false
    throw e
  }
}
