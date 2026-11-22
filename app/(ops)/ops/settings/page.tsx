import type { Metadata } from "next"

import { SettingsView } from "@/components/ops/settings-view"

export const metadata: Metadata = { title: "Ops settings" }

export default function OpsSettingsPage() {
  return <SettingsView />
}
