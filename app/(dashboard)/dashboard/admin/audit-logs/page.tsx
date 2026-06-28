"use client"

import { AdminGuard } from "@/components/admin/AdminGuard"
import { AuditLogTable } from "@/components/admin/AuditLogTable"
import PageContainer from "@/components/dashboard/layout/page-container"
import { PageHeader } from "@/components/dashboard/layout/page-header"
import { isRedesignOn } from "@/lib/dashboard-redesign-flag"
import { AuditLogsRedesignedView } from "@/components/dashboard/mainScreens/audit-logs/redesigned/audit-logs-redesigned-view"

export default function AdminAuditLogsPage() {
  if (isRedesignOn()) return <AuditLogsRedesignedView />
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
