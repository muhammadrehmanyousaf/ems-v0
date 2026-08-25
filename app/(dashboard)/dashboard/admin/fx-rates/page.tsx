"use client"

import { AdminGuard } from "@/components/admin/AdminGuard"
import { FxRatesForm } from "@/components/admin/FxRatesForm"
import PageContainer from "@/components/dashboard/layout/page-container"
import { PageHeader } from "@/components/dashboard/layout/page-header"

export default function AdminFxRatesPage() {
  return (
    <AdminGuard requireSuperAdmin>
      <PageContainer width="narrow">
        <PageHeader
          eyebrow="Super admin · Pricing"
          title="Indicative currency rates"
          description="Set the rate used to show an approximate price beside the rupee price, for families booking from abroad. The venue is always paid in rupees. A rate stops being shown seven days after its date, so forgetting to refresh one costs a courtesy, never a wrong number."
        />
        <FxRatesForm />
      </PageContainer>
    </AdminGuard>
  )
}
