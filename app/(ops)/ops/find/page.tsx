import type { Metadata } from "next"
import { Suspense } from "react"

import { Gate } from "@/components/ops/ops-shell"
import { VendorFinderView } from "@/components/ops/vendor-finder"

export const metadata: Metadata = { title: "Vendors" }

export default function OpsVendorFinderPage() {
  return <Suspense fallback={null}><Gate permission="ops_listing_edit_on_behalf"><VendorFinderView /></Gate></Suspense>
}
