import { DashboardShell } from "@/components/user-dashboard/dashboard-shell"

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardShell>{children}</DashboardShell>
}
