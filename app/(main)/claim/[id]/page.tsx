"use client"

// Vendor "claim & complete your listing" wizard route.
// Linked from the public vendor detail page CTA: `/claim/{vendor.id}`.
//
// Always available: the backend CLAIM_WORKFLOW_ON gate is globally enabled in
// production, so the build-time flag that hid this page was removed.

import { useParams } from "next/navigation"

import { ClaimWizard } from "@/components/claim/ClaimWizard"

export default function ClaimListingPage() {
  const params = useParams()
  const id = (params?.id as string) || ""

  return <ClaimWizard listingId={id} />
}
