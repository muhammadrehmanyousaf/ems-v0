import type { Metadata } from "next"
import { Suspense } from "react"

import { Gate } from "@/components/ops/ops-shell"
import { AuditView } from "@/components/ops/audit-view"

export const metadata: Metadata = { title: "Audit trail" }

export default function OpsAuditPage() {
  return <Suspense fallback={null}><Gate permission="ops_reports_all"><AuditView /></Gate></Suspense>
}
