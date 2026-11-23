import type { Metadata } from "next"
import { Suspense } from "react"

import { Gate } from "@/components/ops/ops-shell"
import { ClientsView } from "@/components/ops/clients-view"

export const metadata: Metadata = { title: "Clients" }

export default function OpsClientsPage() {
  return <Suspense fallback={null}><Gate permission="ops_client_manage"><ClientsView /></Gate></Suspense>
}
