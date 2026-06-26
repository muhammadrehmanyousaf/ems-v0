"use client"

import { useApplyTheme } from "@/lib/hooks/use-apply-theme"

/**
 * Mounts the theme engine for the dashboard subtree. The active palette lives as
 * `data-theme` on <html> (stamped pre-paint by the bootstrap script and kept in
 * sync by useApplyTheme), so this component renders nothing of its own — it just
 * runs the hook. Additive + behavior-frozen.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  useApplyTheme()
  return <>{children}</>
}
