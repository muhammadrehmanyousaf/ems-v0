"use client"

import { useEffect } from "react"
import { useTheme as useNextTheme } from "next-themes"
import { useThemePrefs } from "@/lib/store/theme-prefs"
import { THEMES } from "@/lib/theme/theme-tokens"
import { deriveAccent } from "@/lib/color/derive-accent"

/**
 * Applies the active theme by writing its token values as inline CSS custom
 * properties on <html>. Inline styles outrank every stylesheet rule (including
 * the dashboard's stock :root/.dark tokens) and don't depend on the CSS build
 * pipeline, so theming is bulletproof. A custom accent overrides just the brand
 * tokens on top.
 */
export function useApplyTheme() {
  const { theme, mode, customAccent } = useThemePrefs()
  const { setTheme: setNextMode, resolvedTheme } = useNextTheme()

  // mode → next-themes (owns the .dark class on <html>, used by any
  // dark:* utilities and the rest of the app)
  useEffect(() => {
    setNextMode(mode)
  }, [mode, setNextMode])

  // theme + resolved light/dark → inline token vars on <html>
  useEffect(() => {
    const el = document.documentElement
    const m = resolvedTheme === "dark" ? "dark" : "light"
    const map = THEMES[theme]?.[m] ?? THEMES.champagne[m]
    el.setAttribute("data-theme", theme)
    for (const [k, v] of Object.entries(map)) el.style.setProperty(k, v)

    // custom accent overrides the brand tokens on top of the theme
    if (customAccent) {
      const a = deriveAccent(customAccent, m)
      if (a) {
        el.style.setProperty("--primary", a.primary)
        el.style.setProperty("--primary-foreground", a.primaryForeground)
        el.style.setProperty("--ring", a.ring)
        el.style.setProperty("--sidebar-primary", a.primary)
        el.style.setProperty("--sidebar-ring", a.ring)
      }
    }
  }, [theme, customAccent, resolvedTheme])
}
