"use client"

import { AdminGuard } from "@/components/admin/AdminGuard"
import { ClaimsQueueTable } from "@/components/admin/ClaimsQueueTable"
import PageContainer from "@/components/dashboard/layout/page-container"
import { PageHeader } from "@/components/dashboard/layout/page-header"

// Super-admin "claim requests" screen. Reviews evidence-path VendorClaim
// records that landed in pending_review and approves/rejects them. Phone-match
// claims auto-approve and never reach this queue.
export default function AdminClaimsPage() {
  return (
    <AdminGuard requireSuperAdmin>
      <PageContainer width="narrow">
        <PageHeader
          eyebrow="Admin · Operations"
          title="Claim requests"
          description="Vendors proving ownership of imported listings. Approve to hand over the account (a one-time set-password link is emailed), or reject with a reason."
        />
        <ClaimsQueueTable />
      </PageContainer>
    </AdminGuard>
  )
}
