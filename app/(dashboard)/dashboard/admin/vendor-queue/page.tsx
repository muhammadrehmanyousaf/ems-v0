"use client"

import { AdminGuard } from "@/components/admin/AdminGuard"
import { VendorQueueTable } from "@/components/admin/VendorQueueTable"
import PageContainer from "@/components/dashboard/layout/page-container"
import { PageHeader } from "@/components/dashboard/layout/page-header"

export default function AdminVendorQueuePage() {
  return (
    <AdminGuard>
      <PageContainer>
        <PageHeader
          eyebrow="Admin · Operations"
          title="Vendor approval queue"
          description="Review submitted businesses, approve, request changes, or suspend. Decisions are emailed to the vendor and recorded in the audit log."
        />
        <VendorQueueTable />
      </PageContainer>
    </AdminGuard>
  )
}
