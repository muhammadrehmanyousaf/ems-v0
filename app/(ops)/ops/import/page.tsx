import type { Metadata } from "next"

import { Gate } from "@/components/ops/ops-shell"
import { ImportWizard } from "@/components/ops/import-wizard"

export const metadata: Metadata = { title: "Import vendors" }

export default function OpsImportPage() {
  return <Gate permission={"ops_prospect_import"}><ImportWizard /></Gate>
}
