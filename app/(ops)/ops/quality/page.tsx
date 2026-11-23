import type { Metadata } from "next"
import { Suspense } from "react"

import { Gate } from "@/components/ops/ops-shell"
import { QualityView } from "@/components/ops/quality-view"

export const metadata: Metadata = { title: "Quality" }

export default function OpsQualityPage() {
  return <Suspense fallback={null}><Gate permission={["ops_reports_team", "ops_reports_all"]}><QualityView /></Gate></Suspense>
}
