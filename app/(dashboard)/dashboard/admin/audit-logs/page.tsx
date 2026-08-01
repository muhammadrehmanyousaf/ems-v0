"use client"

import { AdminGuard } from "@/components/admin/AdminGuard"
import { AuditLogsRedesignedView } from "@/components/dashboard/mainScreens/audit-logs/redesigned/audit-logs-redesigned-view"

// The admin layout already gates this to admin-like roles; forensics is
// super-admin only, so this tightens it a tier further.
export default function AdminAuditLogsPage() {
  return (
    <AdminGuard requireSuperAdmin>
      <AuditLogsRedesignedView />
    </AdminGuard>
  )
}
