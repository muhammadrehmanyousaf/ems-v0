/**
 * Color helpers for the theme engine's custom-accent path.
 * Bare-channel HSL ("h s% l%") is the format our CSS vars expect
 * (Tailwind wraps them as `hsl(var(--primary))`).
 */

/** Parse "#RRGGBB" | "#RGB" | "RRGGBB" → {h,s,l} with h∈[0,360), s,l∈[0,100]. */
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  let v = hex.trim().replace(/^#/, "")
  if (v.length === 3) v = v.split("").map((c) => c + c).join("")
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return null

  const r = parseInt(v.slice(0, 2), 16) / 255
  const g = parseInt(v.slice(2, 4), 16) / 255
  const b = parseInt(v.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d) % 6; break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

/** Emit the bare-channel string our CSS vars expect, e.g. "243 75% 58%". */
export function hslTriplet({ h, s, l }: { h: number; s: number; l: number }): string {
  return `${h} ${s}% ${l}%`
}

/** Relative luminance of an HSL color, for AA foreground choice. */
export function hslLuminance({ h, s, l }: { h: number; s: number; l: number }): number {
  const c = (1 - Math.abs(2 * (l / 100) - 1)) * (s / 100)
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l / 100 - c / 2
  const [r1, g1, b1] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] :
    h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  const lin = (u: number) => {
    const s0 = u + m
    return s0 <= 0.03928 ? s0 / 12.92 : Math.pow((s0 + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r1) + 0.7152 * lin(g1) + 0.0722 * lin(b1)
}
