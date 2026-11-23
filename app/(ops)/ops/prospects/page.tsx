import type { Metadata } from "next"
import { Suspense } from "react"

import { Gate } from "@/components/ops/ops-shell"
import { ProspectsView } from "@/components/ops/prospects-view"

export const metadata: Metadata = { title: "Prospects" }

// useSearchParams needs a Suspense boundary during the production build.
export default function OpsProspectsPage() {
  return <Suspense fallback={null}><Gate permission={["ops_prospect_call", "ops_prospect_view_team", "ops_prospect_view_all"]}><ProspectsView /></Gate></Suspense>
}
