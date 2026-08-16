import type { Metadata } from "next"
import { DashboardShell } from "@/components/user-dashboard/dashboard-shell"

// The account pages are client components, so none can export their own
// `metadata` — they were all inheriting the homepage marketing <title>. Give the
// /user segment a bare default ("My Account"); the ROOT layout's title template
// ("%s | Wedding Wala") adds the brand suffix once. A previous version set the
// suffix here too AND kept its own template, which double-applied it and
// rendered "My Account | Wedding Wala | Wedding Wala" (L3 regression).
export const metadata: Metadata = {
  // `absolute` renders exactly this and ignores the root title template, so the
  // brand suffix appears once. A prior version used `{ default: "… | Wedding
  // Wala", template }` which let the root template append a SECOND suffix →
  // "My Account | Wedding Wala | Wedding Wala" (L3 regression).
  title: { absolute: "My Account | Wedding Wala" },
}

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardShell>{children}</DashboardShell>
}
