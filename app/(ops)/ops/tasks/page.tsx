import type { Metadata } from "next"

import { Gate } from "@/components/ops/ops-shell"
import { TasksView } from "@/components/ops/tasks-view"

export const metadata: Metadata = { title: "Callbacks" }

export default function OpsTasksPage() {
  return <Gate permission={["ops_prospect_call", "ops_prospect_view_team", "ops_prospect_view_all"]}><TasksView /></Gate>
}
