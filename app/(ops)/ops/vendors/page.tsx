import type { Metadata } from "next"
import { Suspense } from "react"

import { Gate } from "@/components/ops/ops-shell"
import { VendorSearchView } from "@/components/ops/vendor-search"

export const metadata: Metadata = { title: "Find venues" }

export default function OpsVendorsPage() {
  return <Suspense fallback={null}><Gate permission="ops_vendor_search"><VendorSearchView /></Gate></Suspense>
}
