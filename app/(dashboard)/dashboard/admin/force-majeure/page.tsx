"use client"

import { AdminGuard } from "@/components/admin/AdminGuard"
import { ForceMajeureForm } from "@/components/admin/ForceMajeureForm"
import PageContainer from "@/components/dashboard/layout/page-container"
import { PageHeader } from "@/components/dashboard/layout/page-header"

export default function AdminForceMajeurePage() {
  return (
    <AdminGuard requireSuperAdmin>
      <PageContainer width="narrow">
        <PageHeader
          eyebrow="Super admin · Emergency"
          title="Force majeure"
          description="Batch-cancel every active booking inside a date range during a wedding ban, natural disaster, or government emergency. 100% refund, payouts clawed back, every action audit-logged."
        />
        <ForceMajeureForm />
      </PageContainer>
    </AdminGuard>
  )
}
