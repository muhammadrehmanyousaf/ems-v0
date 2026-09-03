import * as React from "react"
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export const THEME_NAMES = [
  "champagne",
  "indigo",
  "violet",
  "emerald",
  "slate",
  "rose",
] as const

export type ThemeName = (typeof THEME_NAMES)[number]
export type ThemeMode = "light" | "dark" | "system"

/** Keep this key in sync with the FOUC bootstrap script in the dashboard layout. */
export const THEME_STORAGE_KEY = "ww-theme-prefs"
export const DEFAULT_THEME: ThemeName = "champagne"

export interface ThemePrefsState {
  theme: ThemeName
  mode: ThemeMode
  /** "#RRGGBB" or null when no custom override. */
  customAccent: string | null
  setTheme: (theme: ThemeName) => void
  setMode: (mode: ThemeMode) => void
  setCustomAccent: (hex: string | null) => void
  reset: () => void
}

export const useThemePrefs = create<ThemePrefsState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      mode: "system",
      customAccent: null,
      setTheme: (theme) => set({ theme }),
      setMode: (mode) => set({ mode }),
      setCustomAccent: (customAccent) => set({ customAccent }),
      reset: () => set({ theme: DEFAULT_THEME, mode: "system", customAccent: null }),
    }),
    {
      name: THEME_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Persist exactly the three fields (not the action fns).
      partialize: (s) => ({ theme: s.theme, mode: s.mode, customAccent: s.customAccent }),
    }
  )
)

/**
 * Resolve the light/dark mode to a concrete "light" | "dark", following the OS
 * when mode is "system". Used to stamp `data-theme` on the champagne shell +
 * artifact hosts so the manual light/dark toggle actually applies (the champagne
 * CSS keys dark on `[data-theme="dark"]`). SSR-safe: defaults to "light".
 */
export function useResolvedThemeMode(): "light" | "dark" {
  const mode = useThemePrefs((s) => s.mode)
  const [sys, setSys] = React.useState<"light" | "dark">("light")
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const upd = () => setSys(mq.matches ? "dark" : "light")
    upd()
    mq.addEventListener("change", upd)
    return () => mq.removeEventListener("change", upd)
  }, [])
  return mode === "system" ? sys : mode
}
