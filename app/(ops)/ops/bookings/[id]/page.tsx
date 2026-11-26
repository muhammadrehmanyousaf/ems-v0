import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"

import { Gate } from "@/components/ops/ops-shell"
import { BookingDetailView } from "@/components/ops/booking-detail"

export const metadata: Metadata = { title: "Booking" }

export default function OpsBookingDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  return (
    <Suspense fallback={null}>
      <Gate permission={["ops_client_manage", "ops_prospect_call", "ops_listing_edit_on_behalf", "ops_reports_team", "ops_reports_all"]}>
        <BookingDetailView id={id} />
      </Gate>
    </Suspense>
  )
}
