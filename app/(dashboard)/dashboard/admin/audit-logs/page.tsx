"use client"

import { AdminGuard } from "@/components/admin/AdminGuard"
import { AuditLogTable } from "@/components/admin/AuditLogTable"
import PageContainer from "@/components/dashboard/layout/page-container"
import { PageHeader } from "@/components/dashboard/layout/page-header"

export default function AdminAuditLogsPage() {
  return (
    <AdminGuard requireSuperAdmin>
      <PageContainer>
        <PageHeader
          eyebrow="Super admin · Forensics"
          title="Audit log"
          description="Every sensitive change recorded — approvals, verifications, sessions, 2FA, bank updates. Filter by target type or action to investigate incidents."
        />
        <AuditLogTable />
      </PageContainer>
    </AdminGuard>
  )
}
