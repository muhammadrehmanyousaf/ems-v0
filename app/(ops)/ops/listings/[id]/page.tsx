import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"

import { Gate } from "@/components/ops/ops-shell"
import { ListingView } from "@/components/ops/listing-view"

export const metadata: Metadata = { title: "Listing" }

export default function OpsListingPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  return <Suspense fallback={null}><Gate permission={["ops_prospect_call", "ops_prospect_view_team", "ops_prospect_view_all"]}><ListingView id={id} /></Gate></Suspense>
}
