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
