import "../../globals.css"
import type { Metadata } from "next"

import { OpsShell } from "@/components/ops/ops-shell"

// Internal staff tool: never indexed, never linked from the public site (also disallowed in app/robots.ts).
export const metadata: Metadata = {
  title: "Ops Portal",
  robots: { index: false, follow: false },
}

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return <OpsShell>{children}</OpsShell>
}
