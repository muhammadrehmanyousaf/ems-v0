"use client"

import { AdminGuard } from "@/components/admin/AdminGuard"
import { DisputesTable } from "@/components/admin/DisputesTable"
import PageContainer from "@/components/dashboard/layout/page-container"
import { PageHeader } from "@/components/dashboard/layout/page-header"
import { isRedesignOn } from "@/lib/dashboard-redesign-flag"
import { DisputesRedesignedView } from "@/components/dashboard/mainScreens/disputes/redesigned/disputes-redesigned-view"

export default function AdminDisputesPage() {
  if (isRedesignOn()) return <DisputesRedesignedView />
  return (
    <AdminGuard>
      <PageContainer>
        <PageHeader
          eyebrow="Admin · Operations"
          title="Dispute queue"
          description="Customer-opened disputes freeze pending vendor payouts. Resolve as refund, release / dismiss, or forfeit (BK-039 confirmed customer no-show)."
        />
        <DisputesTable />
      </PageContainer>
    </AdminGuard>
  )
}
