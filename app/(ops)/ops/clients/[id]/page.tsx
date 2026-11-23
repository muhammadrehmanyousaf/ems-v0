import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"

import { Gate } from "@/components/ops/ops-shell"
import { ClientDetailView } from "@/components/ops/client-detail"

export const metadata: Metadata = { title: "Client" }

export default function OpsClientPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  return <Suspense fallback={null}><Gate permission="ops_client_manage"><ClientDetailView id={id} /></Gate></Suspense>
}
