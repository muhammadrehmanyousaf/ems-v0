"use client"

import { useRef } from "react"
import { useApplyTheme } from "@/lib/hooks/use-apply-theme"
import { useThemePrefs } from "@/lib/store/theme-prefs"

/**
 * The dashboard theme root. Carries `data-theme` (the active palette) so every
 * shadcn component beneath it resolves the theme's token values. `useApplyTheme`
 * keeps the attribute, the light/dark mode, and any custom accent in sync with
 * the persisted store. SSR renders the attribute too, so there's no palette flash.
 *
 * Additive + behavior-frozen: this is a pure wrapper <div> around the existing
 * dashboard tree — no layout/state/behavior of the wrapped UI changes.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const shellRef = useRef<HTMLDivElement>(null)
  const theme = useThemePrefs((s) => s.theme)
  useApplyTheme(shellRef)
  return (
    <div ref={shellRef} data-theme={theme} className="contents">
      {children}
    </div>
  )
}
