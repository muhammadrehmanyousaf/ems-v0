import type { ThemeName } from "@/lib/store/theme-prefs"

/**
 * Theme token values, applied as inline CSS custom properties on <html> by
 * useApplyTheme. We set them inline (not via CSS [data-theme] rules) because
 * the dashboard's CSS pipeline strips arbitrary :root[data-theme] blocks during
 * compilation — inline styles are bulletproof and outrank every stylesheet rule
 * (including dashboard-styles.css :root/.dark). AA-verified; C-1 fixes baked in.
 *
 * Each value is a bare HSL triplet ("h s% l%") consumed as hsl(var(--token)).
 */
export type TokenMap = Record<string, string>

function tokens(
  bg: string, fg: string, card: string, cardFg: string,
  primary: string, primaryFg: string, secondary: string, secondaryFg: string,
  muted: string, mutedFg: string, accent: string, accentFg: string,
  destructive: string, destructiveFg: string, border: string, ring: string,
  sbBg: string, sbFg: string, sbPrimary: string, sbPrimaryFg: string,
  sbAccent: string, sbAccentFg: string, sbBorder: string,
): TokenMap {
  return {
    "--background": bg, "--foreground": fg,
    "--card": card, "--card-foreground": cardFg,
    "--popover": card, "--popover-foreground": cardFg,
    "--primary": primary, "--primary-foreground": primaryFg,
    "--secondary": secondary, "--secondary-foreground": secondaryFg,
    "--muted": muted, "--muted-foreground": mutedFg,
    "--accent": accent, "--accent-foreground": accentFg,
    "--destructive": destructive, "--destructive-foreground": destructiveFg,
    "--border": border, "--input": border, "--ring": ring,
    "--sidebar-background": sbBg, "--sidebar-foreground": sbFg,
    "--sidebar-primary": sbPrimary, "--sidebar-primary-foreground": sbPrimaryFg,
    "--sidebar-accent": sbAccent, "--sidebar-accent-foreground": sbAccentFg,
    "--sidebar-border": sbBorder, "--sidebar-ring": ring,
  }
}

export const THEMES: Record<ThemeName, { light: TokenMap; dark: TokenMap }> = {
  champagne: {
    // C-1: charcoal-on-gold for AA
    light: tokens("40 30% 99%", "36 25% 12%", "0 0% 100%", "36 25% 12%",
      "38 72% 42%", "36 40% 12%", "40 25% 95%", "36 30% 22%",
      "40 20% 95%", "36 12% 42%", "40 30% 92%", "36 35% 20%",
      "0 75% 52%", "0 0% 100%", "38 22% 88%", "38 72% 42%",
      "40 28% 96%", "36 22% 25%", "38 72% 42%", "36 40% 12%",
      "40 30% 90%", "36 35% 20%", "38 22% 86%"),
    dark: tokens("36 18% 7%", "40 15% 94%", "36 18% 10%", "40 15% 94%",
      "42 80% 58%", "36 40% 10%", "36 15% 16%", "40 15% 92%",
      "36 12% 15%", "40 10% 62%", "36 18% 18%", "40 15% 92%",
      "0 62% 45%", "0 0% 98%", "36 14% 18%", "42 80% 58%",
      "36 18% 9%", "40 12% 86%", "42 80% 58%", "36 40% 10%",
      "36 18% 16%", "40 12% 90%", "36 14% 16%"),
  },
  indigo: {
    light: tokens("240 25% 99%", "240 25% 11%", "0 0% 100%", "240 25% 11%",
      "243 75% 58%", "0 0% 100%", "240 18% 95%", "240 25% 25%",
      "240 16% 95%", "240 10% 45%", "243 30% 93%", "243 45% 32%",
      "0 75% 52%", "0 0% 100%", "240 18% 90%", "243 75% 58%",
      "240 22% 96%", "240 18% 28%", "243 75% 58%", "0 0% 100%",
      "243 30% 91%", "243 45% 30%", "240 18% 88%"),
    // C-1: brightened primary for AA
    dark: tokens("240 24% 7%", "240 15% 95%", "240 24% 10%", "240 15% 95%",
      "243 82% 70%", "240 30% 10%", "240 18% 16%", "240 15% 92%",
      "240 14% 15%", "240 10% 64%", "240 22% 19%", "240 15% 92%",
      "0 62% 45%", "0 0% 98%", "240 16% 18%", "243 82% 70%",
      "240 26% 9%", "240 12% 86%", "243 82% 70%", "240 30% 10%",
      "240 22% 16%", "240 12% 90%", "240 16% 16%"),
  },
  violet: {
    light: tokens("270 20% 99%", "263 30% 11%", "0 0% 100%", "263 30% 11%",
      "263 80% 58%", "0 0% 100%", "263 18% 95%", "263 35% 24%",
      "263 12% 95%", "263 10% 45%", "263 28% 93%", "263 45% 30%",
      "0 75% 52%", "0 0% 100%", "263 16% 90%", "263 80% 58%",
      "263 20% 96%", "263 18% 28%", "263 80% 58%", "0 0% 100%",
      "263 28% 91%", "263 45% 30%", "263 16% 88%"),
    dark: tokens("263 30% 6%", "263 8% 95%", "263 25% 9%", "263 8% 95%",
      "263 84% 67%", "263 30% 10%", "263 16% 15%", "263 8% 92%",
      "263 10% 15%", "263 6% 64%", "263 18% 18%", "263 8% 92%",
      "0 62% 45%", "0 0% 98%", "263 15% 17%", "263 84% 67%",
      "263 32% 8%", "263 8% 86%", "263 84% 67%", "263 30% 10%",
      "263 22% 15%", "263 8% 90%", "263 18% 15%"),
  },
  emerald: {
    // C-1: darkened primary to 30% L for AA
    light: tokens("150 18% 99%", "160 25% 11%", "0 0% 100%", "160 25% 11%",
      "158 74% 30%", "0 0% 100%", "155 16% 94%", "160 30% 22%",
      "155 14% 94%", "160 10% 42%", "158 30% 91%", "158 45% 24%",
      "0 75% 52%", "0 0% 100%", "155 16% 88%", "158 74% 30%",
      "155 18% 96%", "160 18% 26%", "158 74% 30%", "0 0% 100%",
      "158 30% 90%", "158 45% 22%", "155 16% 86%"),
    dark: tokens("160 22% 6%", "150 12% 95%", "160 22% 9%", "150 12% 95%",
      "158 65% 48%", "160 40% 8%", "160 16% 15%", "150 12% 92%",
      "160 12% 14%", "150 8% 63%", "160 22% 17%", "150 12% 92%",
      "0 62% 45%", "0 0% 98%", "160 16% 16%", "158 65% 48%",
      "160 24% 8%", "150 10% 86%", "158 65% 48%", "160 40% 8%",
      "160 22% 15%", "150 10% 90%", "160 16% 15%"),
  },
  slate: {
    light: tokens("210 20% 99%", "215 25% 12%", "0 0% 100%", "215 25% 12%",
      "215 60% 45%", "0 0% 100%", "214 18% 94%", "215 30% 24%",
      "214 16% 94%", "215 12% 44%", "215 30% 92%", "215 40% 28%",
      "0 75% 52%", "0 0% 100%", "214 18% 89%", "215 60% 45%",
      "214 20% 96%", "215 18% 28%", "215 60% 45%", "0 0% 100%",
      "215 30% 90%", "215 40% 26%", "214 18% 87%"),
    dark: tokens("215 28% 7%", "210 16% 95%", "215 28% 10%", "210 16% 95%",
      "213 70% 60%", "215 35% 10%", "215 20% 16%", "210 14% 92%",
      "215 16% 15%", "210 10% 64%", "215 24% 19%", "210 14% 92%",
      "0 62% 45%", "0 0% 98%", "215 18% 18%", "213 70% 60%",
      "215 30% 9%", "210 12% 86%", "213 70% 60%", "215 35% 10%",
      "215 24% 16%", "210 12% 90%", "215 18% 16%"),
  },
  rose: {
    light: tokens("350 25% 99%", "345 25% 12%", "0 0% 100%", "345 25% 12%",
      "347 72% 50%", "0 0% 100%", "348 18% 95%", "345 30% 24%",
      "348 14% 95%", "345 10% 45%", "347 35% 93%", "347 50% 30%",
      "8 78% 50%", "0 0% 100%", "348 18% 90%", "347 72% 50%",
      "348 22% 96%", "345 18% 28%", "347 72% 50%", "0 0% 100%",
      "347 35% 91%", "347 50% 28%", "348 18% 88%"),
    dark: tokens("345 22% 7%", "350 14% 95%", "345 22% 10%", "350 14% 95%",
      "347 75% 62%", "345 35% 10%", "345 18% 16%", "350 14% 92%",
      "345 14% 15%", "350 10% 64%", "345 22% 19%", "350 14% 92%",
      "8 60% 45%", "0 0% 98%", "345 18% 18%", "347 75% 62%",
      "345 24% 9%", "350 12% 86%", "347 75% 62%", "345 35% 10%",
      "345 22% 16%", "350 12% 90%", "345 18% 16%"),
  },
}
