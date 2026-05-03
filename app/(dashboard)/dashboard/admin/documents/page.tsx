"use client"

import { AdminGuard } from "@/components/admin/AdminGuard"
import { DocumentQueueTable } from "@/components/admin/DocumentQueueTable"
import PageContainer from "@/components/dashboard/layout/page-container"
import { PageHeader } from "@/components/dashboard/layout/page-header"

export default function AdminDocumentsPage() {
  return (
    <AdminGuard>
      <PageContainer>
        <PageHeader
          eyebrow="Admin · Compliance"
          title="KYC document review"
          description="Approve, reject, or request changes on vendor compliance documents. Approving documents bumps the vendor's verification tier."
        />
        <DocumentQueueTable />
      </PageContainer>
    </AdminGuard>
  )
}
