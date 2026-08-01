"use client"

import { AdminGuard } from "@/components/admin/AdminGuard"
import { ComplaintsQueueView } from "@/components/dashboard/mainScreens/admin/complaints-queue-view"

export default function AdminComplaintsPage() {
  return (
    <AdminGuard>
      <ComplaintsQueueView />
    </AdminGuard>
  )
}
