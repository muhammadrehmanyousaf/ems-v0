import type { Metadata } from "next"

import { StaffTeamsView } from "@/components/ops/staff-teams-view"

export const metadata: Metadata = { title: "Staff & teams" }

export default function OpsStaffPage() {
  return <StaffTeamsView />
}
