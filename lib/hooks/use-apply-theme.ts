"use client"

import { useEffect, useRef } from "react"
import { useTheme as useNextTheme } from "next-themes"
import { useThemePrefs } from "@/lib/store/theme-prefs"
import { deriveAccent } from "@/lib/color/derive-accent"

const ACCENT_PROPS = [
  "--primary",
  "--primary-foreground",
  "--ring",
  "--primary-hover",
  "--primary-active",
] as const

/**
 * Attach to a ref on the dashboard shell root (the element carrying data-theme).
 *   const shellRef = useRef<HTMLDivElement>(null)
 *   useApplyTheme(shellRef)
 *   return <div ref={shellRef} data-theme={theme}>…</div>
 */
export function useApplyTheme(ref: React.RefObject<HTMLElement>) {
  const { theme, mode, customAccent } = useThemePrefs()
  const { setTheme: setNextMode, resolvedTheme } = useNextTheme()
  const hydrated = useRef(false)

  // 1) data-theme attribute (palette)
  useEffect(() => {
    const el = ref.current
    if (el) el.setAttribute("data-theme", theme)
  }, [ref, theme])

  // 2) mode → next-themes (owns the .dark class on <html>)
  useEffect(() => {
    setNextMode(mode)
  }, [mode, setNextMode])

  // 3) custom accent → inline vars (or clear). Recompute when the *resolved*
  //    light/dark changes, because hover/foreground tuning is mode-aware.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!customAccent) {
      ACCENT_PROPS.forEach((p) => el.style.removeProperty(p))
      return
    }
    const m = resolvedTheme === "dark" ? "dark" : "light"
    const a = deriveAccent(customAccent, m)
    if (!a) {
      ACCENT_PROPS.forEach((p) => el.style.removeProperty(p))
      return
    }
    el.style.setProperty("--primary", a.primary)
    el.style.setProperty("--primary-foreground", a.primaryForeground)
    el.style.setProperty("--ring", a.ring)
    el.style.setProperty("--primary-hover", a.primaryHover)
    el.style.setProperty("--primary-active", a.primaryActive)
  }, [ref, customAccent, resolvedTheme])

  hydrated.current = true
}
