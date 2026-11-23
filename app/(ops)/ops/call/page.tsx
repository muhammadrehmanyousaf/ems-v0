import type { Metadata } from "next"

import { Gate } from "@/components/ops/ops-shell"
import { CallStartView } from "@/components/ops/call-start"

export const metadata: Metadata = { title: "Call queue" }

export default function OpsCallPage() {
  return <Gate permission={"ops_prospect_call"}><CallStartView /></Gate>
}
