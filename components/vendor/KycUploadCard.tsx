"use client"

// 01-VR-ENHANCE-V1-FE — vendor KYC upload + status card.

import { useEffect, useRef, useState } from "react"
import { Upload, FileText, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KycStatusPill } from "@/components/ui/verification-badge"
import { toast } from "@/components/ui/use-toast"
import {
  listDocuments,
  submitDocument,
  recomputeCompleteness,
  DOCUMENT_TYPE_LABELS,
  type VendorDocument,
  type VendorDocumentType,
} from "@/lib/api/vendorDocuments"

const REQUIRED_DOC_TYPES: VendorDocumentType[] = [
  "cnic_front",
  "cnic_back",
  "ntn",
  "utility_bill",
  "bank_attestation",
]

const OPTIONAL_DOC_TYPES: VendorDocumentType[] = [
  "shop_lease",
  "insurance",
  "vehicle_registration",
  "halal_cert",
]

interface KycUploadCardProps {
  businessId: number
}

export function KycUploadCard({ businessId }: KycUploadCardProps) {
  const [docs, setDocs] = useState<VendorDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingType, setUploadingType] = useState<VendorDocumentType | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const refresh = async () => {
    try {
      setLoading(true)
      const list = await listDocuments(businessId)
      setDocs(list)
    } catch (e: any) {
      toast({ title: "Failed to load documents", description: e?.response?.data?.message || "Try again." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [businessId])

  const upload = async (type: VendorDocumentType, file: File) => {
    setUploadingType(type)
    try {
      await submitDocument(businessId, type, file)
      toast({ title: "Document uploaded", description: "Our team will review it shortly." })
      await refresh()
    } catch (e: any) {
      const code = e?.response?.data?.data?.code
      const msg = code === "duplicate"
        ? "You've already submitted this exact file for this type."
        : (e?.response?.data?.message || "Upload failed.")
      toast({ title: "Upload failed", description: msg })
    } finally {
      setUploadingType(null)
    }
  }

  const recompute = async () => {
    try {
      const r = await recomputeCompleteness(businessId)
      toast({
        title: "Status refreshed",
        description: `Completeness ${r.score}% • verification tier ${r.tier}/4.`,
      })
    } catch (e: any) {
      toast({ title: "Could not recompute", description: e?.response?.data?.message || "Try again." })
    }
  }

  const docByType = (type: VendorDocumentType) => docs.find((d) => d.type === type)

  const renderRow = (type: VendorDocumentType, required: boolean) => {
    const doc = docByType(type)
    const inputId = `kyc-${type}`
    return (
      <li
        key={type}
        className="flex items-center justify-between gap-3 rounded-lg border border-bridal-beige bg-white p-3"
      >
        <div className="flex items-start gap-3 min-w-0">
          <FileText className="w-4 h-4 mt-1 text-bridal-charcoal" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-bridal-charcoal truncate">
              {DOCUMENT_TYPE_LABELS[type]}
              {required && <span className="ml-1 text-bridal-coral text-xs">*</span>}
            </p>
            {doc ? (
              <p className="text-xs text-bridal-text-soft truncate">
                Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                {doc.reviewerNotes && ` · ${doc.reviewerNotes}`}
              </p>
            ) : (
              <p className="text-xs text-bridal-text-soft">{required ? "Required" : "Optional"}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {doc && <KycStatusPill status={doc.status} />}
          <input
            id={inputId}
            ref={(el) => { inputRefs.current[inputId] = el }}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) upload(type, f)
              e.currentTarget.value = ""
            }}
          />
          <Button
            size="sm"
            variant={doc ? "outline" : "default"}
            disabled={uploadingType === type}
            onClick={() => inputRefs.current[inputId]?.click()}
          >
            {uploadingType === type ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Uploading…</>
            ) : (
              <><Upload className="w-3.5 h-3.5 mr-1.5" />{doc ? "Replace" : "Upload"}</>
            )}
          </Button>
        </div>
      </li>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-bridal-text-soft text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading documents…
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>KYC documents</CardTitle>
            <CardDescription>
              Upload these to unlock payouts and the verified-vendor badge.
              Accepted formats: JPG, PNG, WebP, PDF (max 8 MB).
            </CardDescription>
          </div>
          <Button size="sm" variant="ghost" onClick={recompute}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh status
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-xs uppercase tracking-wider text-bridal-text-soft font-medium mb-2">Required</h4>
            <ul className="space-y-2">
              {REQUIRED_DOC_TYPES.map((t) => renderRow(t, true))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider text-bridal-text-soft font-medium mb-2">Optional</h4>
            <ul className="space-y-2">
              {OPTIONAL_DOC_TYPES.map((t) => renderRow(t, false))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
