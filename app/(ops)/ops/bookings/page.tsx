import type { Metadata } from "next"
import { Suspense } from "react"

import { Gate } from "@/components/ops/ops-shell"
import { BookingsView } from "@/components/ops/bookings-view"

export const metadata: Metadata = { title: "Bookings" }

export default function OpsBookingsPage() {
  return (
    <Suspense fallback={null}>
      <Gate permission={["ops_client_manage", "ops_prospect_call", "ops_listing_edit_on_behalf", "ops_reports_team", "ops_reports_all"]}>
        <BookingsView />
      </Gate>
    </Suspense>
  )
}
