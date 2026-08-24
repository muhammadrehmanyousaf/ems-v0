"use client"

import { AdminGuard } from "@/components/admin/AdminGuard"
import { DocumentQueueTable } from "@/components/admin/DocumentQueueTable"
import { IdentityGateQueue } from "@/components/admin/IdentityGateQueue"
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
        {/*
          The table above is organised around uploaded FILES, so a business only
          appears there if it has a document pending. A vendor who typed their
          NTN and uploaded nothing is waiting on a human and was visible on no
          admin screen at all — two real Lahore venues were in exactly that
          state when the queue was first driven against production.
        */}
        <IdentityGateQueue />
      </PageContainer>
    </AdminGuard>
  )
}
