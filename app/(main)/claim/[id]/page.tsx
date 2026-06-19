"use client"

// Vendor "claim & complete your listing" wizard route.
// Linked from the public vendor detail page CTA: `/claim/{vendor.id}`.
//
// Flag-gated by NEXT_PUBLIC_CLAIM_ENABLED — when off, a friendly
// "not available yet" notice renders instead of the wizard.

import { useParams } from "next/navigation"

import { CLAIM_ENABLED } from "@/lib/claim-flag"
import { ClaimWizard } from "@/components/claim/ClaimWizard"
import { ClaimDisabledNotice } from "@/components/claim/ClaimDisabledNotice"

export default function ClaimListingPage() {
  const params = useParams()
  const id = (params?.id as string) || ""

  if (!CLAIM_ENABLED) {
    return <ClaimDisabledNotice />
  }

  return <ClaimWizard listingId={id} />
}
