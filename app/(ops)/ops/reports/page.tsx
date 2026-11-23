import type { Metadata } from "next"
import { Suspense } from "react"

import { Gate } from "@/components/ops/ops-shell"
import { ReportsView } from "@/components/ops/reports-view"

export const metadata: Metadata = { title: "Reports" }

export default function OpsReportsPage() {
  return <Suspense fallback={null}><Gate permission={["ops_reports_team", "ops_reports_all"]}><ReportsView /></Gate></Suspense>
}
