"use client"

// 01-VR-ENHANCE-V1-FE — vendor's per-business KYC document page.

import { useParams } from "next/navigation"
import { KycUploadCard } from "@/components/vendor/KycUploadCard"

export default function BusinessDocumentsPage() {
  const params = useParams<{ id: string }>()
  const businessId = parseInt(params?.id ?? "", 10)

  if (!businessId || Number.isNaN(businessId)) {
    return (
      <div className="px-4 py-6 lg:px-8 max-w-3xl mx-auto">
        <p className="text-sm text-bridal-text-soft">Invalid business id.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 lg:px-8 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="font-display italic text-3xl text-bridal-charcoal">Compliance documents</h1>
        <p className="text-sm text-bridal-text-soft mt-1">
          Upload your CNIC, NTN, utility bill, and bank attestation to verify your business.
          Approved documents unlock your verified-vendor badge and payouts.
        </p>
      </header>

      <KycUploadCard businessId={businessId} />
    </div>
  )
}
