import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"

import { Gate } from "@/components/ops/ops-shell"
import { VendorWorkspaceView } from "@/components/ops/vendor-workspace"

export const metadata: Metadata = { title: "Vendor" }

export default function OpsVendorPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  return <Suspense fallback={null}><Gate permission="ops_listing_edit_on_behalf"><VendorWorkspaceView id={id} /></Gate></Suspense>
}
