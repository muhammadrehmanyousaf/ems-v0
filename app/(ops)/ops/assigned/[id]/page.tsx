import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"

import { Gate } from "@/components/ops/ops-shell"
import { AssignedDetailView } from "@/components/ops/assigned-view"

export const metadata: Metadata = { title: "Assignment" }

export default function OpsAssignmentPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  return <Suspense fallback={null}><Gate permission="ops_prospect_call"><AssignedDetailView id={id} /></Gate></Suspense>
}
