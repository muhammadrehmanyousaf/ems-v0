import type { Metadata } from "next"
import { DashboardShell } from "@/components/user-dashboard/dashboard-shell"

// The account pages are client components, so none can export their own
// `metadata` — they were all inheriting the homepage marketing <title>
// ("Wedding Wala — Pakistan's Wedding & Event Marketplace"). Give the whole
// /user segment a sensible default so a browser tab / bookmark reads "My
// Account …" instead, and a template so any page that CAN set a title
// (e.g. the server-rendered quotes page) gets the brand suffix consistently.
export const metadata: Metadata = {
  title: {
    default: "My Account | Wedding Wala",
    template: "%s | Wedding Wala",
  },
}

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardShell>{children}</DashboardShell>
}
