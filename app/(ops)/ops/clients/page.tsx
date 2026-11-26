import type { Metadata } from "next"
import { Suspense } from "react"

import { Gate } from "@/components/ops/ops-shell"
import { ClientsViewP7 } from "@/components/ops/clients-view-p7"

export const metadata: Metadata = { title: "Clients" }

export default function OpsClientsPage() {
  return (
    <Suspense fallback={null}>
      <Gate permission="ops_client_manage">
        <ClientsViewP7 />
      </Gate>
    </Suspense>
  )
}
