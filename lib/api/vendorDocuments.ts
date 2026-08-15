// 01-VR-ENHANCE-V1-FE — vendor-side KYC document upload + status.

import axiosInstance from "../axiosConfig"

export type VendorDocumentType =
  | "cnic_front"
  | "cnic_back"
  | "ntn"
  | "utility_bill"
  | "shop_lease"
  | "insurance"
  | "vehicle_registration"
  | "halal_cert"
  | "bank_attestation"
  | "other"

export type VendorDocumentStatus = "pending" | "approved" | "rejected" | "request_changes"

// Business context joined into the admin KYC queue (see kycService.listQueue).
// Optional because vendor-side document lists don't include it.
export interface KycBusiness {
  id: number
  name: string | null
  slug: string | null
  city: string | null
  subArea: string | null
  venueType: string | null
  subBusinessType: string[] | null
  description: string | null
  status: string | null
  completenessScore: number | null
  verificationTier: number | null
  ntnNumber: string | null
  ntnVerifiedAt: string | null
  cnicVerifiedAt: string | null
  addressVerifiedAt: string | null
  ownerName: string | null
  whatsappNumber: string | null
  yearsInBusiness: number | null
  hasInsurance: boolean | null
  createdAt: string | null
  vendor?: {
    id: number
    fullName: string | null
    email: string | null
    phoneE164: string | null
    vendorType: string | null
  } | null
}

export interface VendorDocument {
  id: number
  businessId: number
  type: VendorDocumentType
  fileUrl: string
  fileHash: string
  status: VendorDocumentStatus
  reviewerUserId: number | null
  reviewerNotes: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  business?: KycBusiness | null
}

function unwrap<T>(res: any): T {
  return (res?.data?.data ?? null) as T
}

export async function submitDocument(
  businessId: number,
  type: VendorDocumentType,
  file: File
): Promise<VendorDocument> {
  const fd = new FormData()
  fd.append("type", type)
  fd.append("file", file)
  const res = await axiosInstance.post(
    `/api/v1/businesses/${businessId}/documents`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } }
  )
  return unwrap<{ document: VendorDocument }>(res)?.document as VendorDocument
}

export async function listDocuments(businessId: number): Promise<VendorDocument[]> {
  const res = await axiosInstance.get(`/api/v1/businesses/${businessId}/documents`)
  return unwrap<{ documents: VendorDocument[] }>(res)?.documents ?? []
}

export async function recomputeCompleteness(businessId: number): Promise<{ score: number; tier: number }> {
  const res = await axiosInstance.post(`/api/v1/businesses/${businessId}/documents/recompute`, {})
  return unwrap<{ score: number; tier: number }>(res) ?? { score: 0, tier: 0 }
}

export const DOCUMENT_TYPE_LABELS: Record<VendorDocumentType, string> = {
  cnic_front: "CNIC (front)",
  cnic_back: "CNIC (back)",
  ntn: "NTN / SECP cert",
  utility_bill: "Utility bill",
  shop_lease: "Shop lease",
  insurance: "Insurance",
  vehicle_registration: "Vehicle registration",
  halal_cert: "Halal certificate",
  bank_attestation: "Bank attestation",
  other: "Other",
}

export const DOCUMENT_STATUS_LABELS: Record<VendorDocumentStatus, string> = {
  pending: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  request_changes: "Changes requested",
}
