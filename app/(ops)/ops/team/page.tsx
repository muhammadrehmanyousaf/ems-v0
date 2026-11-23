import type { Metadata } from "next"

import { Gate } from "@/components/ops/ops-shell"
import { TeamView } from "@/components/ops/team-view"

export const metadata: Metadata = { title: "Team" }

export default function OpsTeamPage() {
  return <Gate permission={["ops_reports_team", "ops_reports_all"]}><TeamView /></Gate>
}
