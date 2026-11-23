import type { Metadata } from "next"
import { Suspense } from "react"

import { Gate } from "@/components/ops/ops-shell"
import { AssignedListView } from "@/components/ops/assigned-view"

export const metadata: Metadata = { title: "Clients for me" }

export default function OpsAssignedPage() {
  return <Suspense fallback={null}><Gate permission="ops_prospect_call"><AssignedListView /></Gate></Suspense>
}
