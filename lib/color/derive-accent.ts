import { hexToHsl, hslTriplet, hslLuminance } from "./hex-to-hsl"

export interface AccentVars {
  primary: string          // "h s% l%"
  primaryForeground: string
  ring: string
  primaryHover: string     // optional util token
  primaryActive: string
}

const clampL = (l: number) => Math.max(4, Math.min(96, l))

/**
 * Map a user-picked hex to a coherent, AA-safe accent set.
 * `mode` picks light/dark tuning. Only the brand tokens are overridden —
 * surfaces/neutrals stay on the selected theme so the rest of the UI keeps
 * its verified contrast regardless of how extreme the custom pick is.
 */
export function deriveAccent(hex: string, mode: "light" | "dark"): AccentVars | null {
  const base = hexToHsl(hex)
  if (!base) return null

  // Normalize lightness into a usable band so neon / near-black picks still work.
  const targetL = mode === "light"
    ? clampL(Math.min(base.l, 60))   // keep light-mode primary from being too pale
    : clampL(Math.max(base.l, 55))   // keep dark-mode primary bright enough
  const primary = { h: base.h, s: Math.max(40, base.s), l: targetL }

  // AA foreground: white if primary is dark enough, else near-black ink in the same hue.
  const lum = hslLuminance(primary)
  const primaryForeground = lum < 0.4
    ? "0 0% 100%"
    : hslTriplet({ h: base.h, s: 30, l: 12 })

  // Hover = 6% darker (light) / 6% lighter (dark); Active = 12%.
  const hover = { ...primary, l: clampL(primary.l + (mode === "light" ? -6 : 6)) }
  const active = { ...primary, l: clampL(primary.l + (mode === "light" ? -12 : 12)) }

  return {
    primary: hslTriplet(primary),
    primaryForeground,
    ring: hslTriplet(primary),
    primaryHover: hslTriplet(hover),
    primaryActive: hslTriplet(active),
  }
}
