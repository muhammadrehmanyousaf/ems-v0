"use client"

import { useApplyTheme } from "@/lib/hooks/use-apply-theme"
import { CommandPalette } from "@/components/dashboard/shared/command-palette"

/**
 * Mounts the theme engine + the ⌘K command palette for the dashboard subtree.
 * Theming applies via inline tokens on <html> (useApplyTheme); the palette is
 * always-present and opens from anywhere. Additive + behavior-frozen.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  useApplyTheme()
  return (
    <>
      {children}
      <CommandPalette />
    </>
  )
}
