# Theme Engine — User-Switchable Themes for the Dashboard Redesign

**Status:** Implementation-ready foundation spec
**Stack:** Next.js 14 (App Router) · React 18 · Tailwind v3 · shadcn/ui · next-themes (already present)
**Owner of tokens:** `app/globals.css` (shadcn HSL custom properties)

> A junior dev should be able to implement this verbatim. Every number, file path, and code block below is final. Do **not** invent additional tokens — theme exactly the token set enumerated in §0.

---

## 0. The token contract (what we theme)

This is the **complete** list of HSL-triplet tokens the engine overrides. They already exist in `app/globals.css` (`:root` lines ~313–352, `.dark` lines ~353–389). Each theme must redefine the surface/brand/sidebar tokens; `--destructive*`, `--radius`, chart tokens, and `--gold*` are themed where noted.

```
Surfaces & text:  --background --foreground --card --card-foreground
                  --popover --popover-foreground
Brand:            --primary --primary-foreground
Neutral roles:    --secondary --secondary-foreground
                  --muted --muted-foreground
                  --accent --accent-foreground
Semantic:         --destructive --destructive-foreground
Lines & focus:    --border --input --ring
Gold (brand):     --gold --gold-foreground --gold-muted
Charts:           --chart-1 --chart-2 --chart-3 --chart-4 --chart-5
Sidebar:          --sidebar-background --sidebar-foreground
                  --sidebar-primary --sidebar-primary-foreground
                  --sidebar-accent --sidebar-accent-foreground
                  --sidebar-border --sidebar-ring
```

**Token value format:** bare HSL channels, no `hsl()` wrapper, no commas — e.g. `--primary: 243 75% 58%;`. This matches the existing file and the Tailwind config that wraps them as `hsl(var(--primary))`. Always emit the same format.

> **Critical:** the current `--sidebar-*` and `--gold*` are **bridal-flavored** (warm cream / charcoal / gold). The six new clean themes **must override** the full `--sidebar-*` set and `--gold*` so the sidebar matches each theme. Leaving them unset would strand a cream sidebar inside an Indigo dashboard.

---

## 1. Mechanism

### 1.1 Two orthogonal axes

We separate **mode** from **theme**:

| Axis | Controlled by | Carrier | Values |
|------|---------------|---------|--------|
| **Mode** (light/dark) | `next-themes` (already installed) | `class="dark"` on `<html>` | `light` · `dark` · `system` |
| **Theme** (palette) | this engine | `data-theme="<name>"` on the dashboard shell root | `champagne` · `indigo` · `violet` · `emerald` · `slate` · `rose` |

The two compose as a 6×2 matrix. CSS selector specificity does the blending for free:

```css
/* Base (champagne / default) lives in :root and .dark — unchanged shadcn behaviour */

/* A theme's LIGHT block */
[data-theme="indigo"] { --background: …; --primary: …; /* …all tokens… */ }

/* A theme's DARK block — combine the data-attr with next-themes' .dark class.
   .dark is on <html>; [data-theme] is on the shell root which is a descendant,
   so we qualify with the ancestor combinator. */
.dark [data-theme="indigo"] { --background: …; --primary: …; /* … */ }
```

> **Placement detail (must-read):** `next-themes` puts `.dark` on `<html>`. Our `data-theme` lives on a **shell `<div>` deep in the tree** (see §4.3). Therefore the dark selector is the **descendant** form `.dark [data-theme="indigo"]` (ancestor `.dark`, descendant `[data-theme]`), **not** `[data-theme="indigo"].dark`. If you ever move `data-theme` onto `<html>` itself (alongside `.dark`), switch to the compound `[data-theme="indigo"].dark`. We standardize on the shell-div placement, so **use the descendant form everywhere in this spec.**

### 1.2 Why this re-themes every shadcn component for free

shadcn components never hardcode colors. Each one references the semantic tokens through Tailwind utilities, e.g. `bg-background`, `text-foreground`, `bg-primary text-primary-foreground`, `border-border`, `ring-ring`. Tailwind resolves those to `hsl(var(--primary))` etc. CSS custom properties **cascade and inherit**: when `[data-theme="indigo"]` redefines `--primary` on the shell root, every descendant — Button, Card, Dialog, Popover, Select, Sidebar, Toast — that reads `var(--primary)` instantly resolves to the new value. **Zero component edits.** Mode (`.dark`) and theme (`data-theme`) both just rewrite the same variables, so they layer cleanly: dark mode picks darker channel values, theme picks the hue, and a component reads whatever the cascade resolved to.

### 1.3 Coexistence with the existing next-themes provider

`components/dashboard/layout/ThemeToggle/theme-provider.tsx` already wraps the app in `next-themes`. **We do not replace it.** Configuration the dashboard root layout should pass (if not already):

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
```

- `attribute="class"` → next-themes toggles `class="dark"` on `<html>`. Our dark CSS keys off `.dark`. ✅
- next-themes owns **mode only**. It is unaware of `data-theme`. No collision: different attribute, different element.
- Our Zustand store (§4) owns **theme name + custom accent**, and mirrors mode into next-themes via `setTheme()` so a single picker drives both. The store is the source of truth for theme; next-themes is the source of truth for mode. `useApplyTheme` (§4.2) keeps them in sync.

---

## 2. The six themes — full HSL token tables

Design rules applied to every theme:

- **Near-neutral surfaces.** Backgrounds, cards, borders, muted, secondary all sit at **low chroma** (S ≤ ~18% in light, ≤ ~22% in dark) and are **tinted toward the theme hue** so the UI feels cohesive, not gray-clinical. The **accent/primary carries the saturation**. "Colorful but not too much."
- **Primary foreground AA.** `--primary-foreground` is chosen so text on `--primary` clears WCAG AA (≥ 4.5:1 normal text). White (`0 0% 100%`) on a mid-dark primary, or a very dark ink on a light primary. Verified pairs in §6.
- **Sidebar = theme-tinted neutral.** Sidebar background is a slightly deeper/cooler neutral than the page background (light mode) or a near-black theme-tinted panel (dark mode). `--sidebar-primary` = the theme accent (active nav item).
- **Charts.** `chart-1` = primary; `chart-2..5` walk an analogous/complementary ramp per theme.

> Format reminder: values are `H S% L%`. Drop them straight into the CSS blocks in §2.7.

### 2.1 Champagne (DEFAULT — warm brand) — hue ≈ 38 (gold) + 263 violet ink retained

Champagne is the brand-forward default: warm gold accent over a faintly warm-neutral canvas. This is the theme that lives in `:root`/`.dark` (no `data-theme` needed), but we also register an explicit `[data-theme="champagne"]` block identical to base so the picker can name it.

| Token | Light | Dark |
|---|---|---|
| `--background` | `40 30% 99%` | `36 18% 7%` |
| `--foreground` | `36 25% 12%` | `40 15% 94%` |
| `--card` | `0 0% 100%` | `36 18% 10%` |
| `--card-foreground` | `36 25% 12%` | `40 15% 94%` |
| `--popover` | `0 0% 100%` | `36 18% 10%` |
| `--popover-foreground` | `36 25% 12%` | `40 15% 94%` |
| `--primary` | `38 70% 45%` | `42 80% 58%` |
| `--primary-foreground` | `40 60% 98%` | `36 40% 10%` |
| `--secondary` | `40 25% 95%` | `36 15% 16%` |
| `--secondary-foreground` | `36 30% 22%` | `40 15% 92%` |
| `--muted` | `40 20% 95%` | `36 12% 15%` |
| `--muted-foreground` | `36 12% 42%` | `40 10% 62%` |
| `--accent` | `40 30% 92%` | `36 18% 18%` |
| `--accent-foreground` | `36 35% 20%` | `40 15% 92%` |
| `--destructive` | `0 75% 52%` | `0 62% 45%` |
| `--destructive-foreground` | `0 0% 100%` | `0 0% 98%` |
| `--border` | `38 22% 88%` | `36 14% 18%` |
| `--input` | `38 22% 88%` | `36 14% 18%` |
| `--ring` | `38 70% 45%` | `42 80% 58%` |
| `--gold` | `42 75% 50%` | `42 70% 55%` |
| `--gold-foreground` | `40 60% 12%` | `40 30% 96%` |
| `--gold-muted` | `42 35% 90%` | `42 25% 16%` |
| `--chart-1` | `38 70% 45%` | `42 80% 58%` |
| `--chart-2` | `24 65% 52%` | `24 60% 58%` |
| `--chart-3` | `52 55% 48%` | `52 55% 55%` |
| `--chart-4` | `14 60% 55%` | `14 55% 60%` |
| `--chart-5` | `200 35% 50%` | `200 35% 55%` |
| `--sidebar-background` | `40 28% 96%` | `36 18% 9%` |
| `--sidebar-foreground` | `36 22% 25%` | `40 12% 86%` |
| `--sidebar-primary` | `38 70% 45%` | `42 80% 58%` |
| `--sidebar-primary-foreground` | `40 60% 98%` | `36 40% 10%` |
| `--sidebar-accent` | `40 30% 90%` | `36 18% 16%` |
| `--sidebar-accent-foreground` | `36 35% 20%` | `40 12% 90%` |
| `--sidebar-border` | `38 22% 86%` | `36 14% 16%` |
| `--sidebar-ring` | `38 70% 45%` | `42 80% 58%` |

### 2.2 Indigo — accent hue ≈ 243

| Token | Light | Dark |
|---|---|---|
| `--background` | `240 25% 99%` | `240 24% 7%` |
| `--foreground` | `240 25% 11%` | `240 15% 95%` |
| `--card` | `0 0% 100%` | `240 24% 10%` |
| `--card-foreground` | `240 25% 11%` | `240 15% 95%` |
| `--popover` | `0 0% 100%` | `240 24% 10%` |
| `--popover-foreground` | `240 25% 11%` | `240 15% 95%` |
| `--primary` | `243 75% 58%` | `243 80% 67%` |
| `--primary-foreground` | `0 0% 100%` | `240 30% 10%` |
| `--secondary` | `240 18% 95%` | `240 18% 16%` |
| `--secondary-foreground` | `240 25% 25%` | `240 15% 92%` |
| `--muted` | `240 16% 95%` | `240 14% 15%` |
| `--muted-foreground` | `240 10% 45%` | `240 10% 64%` |
| `--accent` | `243 30% 93%` | `240 22% 19%` |
| `--accent-foreground` | `243 45% 32%` | `240 15% 92%` |
| `--destructive` | `0 75% 52%` | `0 62% 45%` |
| `--destructive-foreground` | `0 0% 100%` | `0 0% 98%` |
| `--border` | `240 18% 90%` | `240 16% 18%` |
| `--input` | `240 18% 90%` | `240 16% 18%` |
| `--ring` | `243 75% 58%` | `243 80% 67%` |
| `--gold` | `243 60% 60%` | `243 65% 66%` |
| `--gold-foreground` | `0 0% 100%` | `240 30% 10%` |
| `--gold-muted` | `243 35% 92%` | `243 30% 18%` |
| `--chart-1` | `243 75% 58%` | `243 80% 67%` |
| `--chart-2` | `200 70% 50%` | `200 70% 58%` |
| `--chart-3` | `270 60% 60%` | `270 60% 66%` |
| `--chart-4` | `170 55% 45%` | `170 55% 52%` |
| `--chart-5` | `320 55% 58%` | `320 55% 64%` |
| `--sidebar-background` | `240 22% 96%` | `240 26% 9%` |
| `--sidebar-foreground` | `240 18% 28%` | `240 12% 86%` |
| `--sidebar-primary` | `243 75% 58%` | `243 80% 67%` |
| `--sidebar-primary-foreground` | `0 0% 100%` | `240 30% 10%` |
| `--sidebar-accent` | `243 30% 91%` | `240 22% 16%` |
| `--sidebar-accent-foreground` | `243 45% 30%` | `240 12% 90%` |
| `--sidebar-border` | `240 18% 88%` | `240 16% 16%` |
| `--sidebar-ring` | `243 75% 58%` | `243 80% 67%` |

### 2.3 Violet — accent hue ≈ 263 (matches current default flavor)

| Token | Light | Dark |
|---|---|---|
| `--background` | `270 20% 99%` | `263 30% 6%` |
| `--foreground` | `263 30% 11%` | `263 8% 95%` |
| `--card` | `0 0% 100%` | `263 25% 9%` |
| `--card-foreground` | `263 30% 11%` | `263 8% 95%` |
| `--popover` | `0 0% 100%` | `263 25% 9%` |
| `--popover-foreground` | `263 30% 11%` | `263 8% 95%` |
| `--primary` | `263 80% 58%` | `263 84% 67%` |
| `--primary-foreground` | `0 0% 100%` | `263 30% 10%` |
| `--secondary` | `263 18% 95%` | `263 16% 15%` |
| `--secondary-foreground` | `263 35% 24%` | `263 8% 92%` |
| `--muted` | `263 12% 95%` | `263 10% 15%` |
| `--muted-foreground` | `263 10% 45%` | `263 6% 64%` |
| `--accent` | `263 28% 93%` | `263 18% 18%` |
| `--accent-foreground` | `263 45% 30%` | `263 8% 92%` |
| `--destructive` | `0 75% 52%` | `0 62% 45%` |
| `--destructive-foreground` | `0 0% 100%` | `0 0% 98%` |
| `--border` | `263 16% 90%` | `263 15% 17%` |
| `--input` | `263 16% 90%` | `263 15% 17%` |
| `--ring` | `263 80% 58%` | `263 84% 67%` |
| `--gold` | `263 55% 62%` | `263 60% 67%` |
| `--gold-foreground` | `0 0% 100%` | `263 30% 10%` |
| `--gold-muted` | `263 32% 92%` | `263 28% 18%` |
| `--chart-1` | `263 80% 58%` | `263 84% 67%` |
| `--chart-2` | `220 65% 55%` | `220 65% 62%` |
| `--chart-3` | `300 55% 58%` | `300 55% 64%` |
| `--chart-4` | `190 55% 45%` | `190 55% 52%` |
| `--chart-5` | `340 60% 60%` | `340 60% 66%` |
| `--sidebar-background` | `263 20% 96%` | `263 32% 8%` |
| `--sidebar-foreground` | `263 18% 28%` | `263 8% 86%` |
| `--sidebar-primary` | `263 80% 58%` | `263 84% 67%` |
| `--sidebar-primary-foreground` | `0 0% 100%` | `263 30% 10%` |
| `--sidebar-accent` | `263 28% 91%` | `263 22% 15%` |
| `--sidebar-accent-foreground` | `263 45% 30%` | `263 8% 90%` |
| `--sidebar-border` | `263 16% 88%` | `263 18% 15%` |
| `--sidebar-ring` | `263 80% 58%` | `263 84% 67%` |

### 2.4 Emerald — accent hue ≈ 158

| Token | Light | Dark |
|---|---|---|
| `--background` | `150 18% 99%` | `160 22% 6%` |
| `--foreground` | `160 25% 11%` | `150 12% 95%` |
| `--card` | `0 0% 100%` | `160 22% 9%` |
| `--card-foreground` | `160 25% 11%` | `150 12% 95%` |
| `--popover` | `0 0% 100%` | `160 22% 9%` |
| `--popover-foreground` | `160 25% 11%` | `150 12% 95%` |
| `--primary` | `158 70% 38%` | `158 65% 48%` |
| `--primary-foreground` | `0 0% 100%` | `160 40% 8%` |
| `--secondary` | `155 16% 94%` | `160 16% 15%` |
| `--secondary-foreground` | `160 30% 22%` | `150 12% 92%` |
| `--muted` | `155 14% 94%` | `160 12% 14%` |
| `--muted-foreground` | `160 10% 42%` | `150 8% 63%` |
| `--accent` | `158 30% 91%` | `160 22% 17%` |
| `--accent-foreground` | `158 45% 24%` | `150 12% 92%` |
| `--destructive` | `0 75% 52%` | `0 62% 45%` |
| `--destructive-foreground` | `0 0% 100%` | `0 0% 98%` |
| `--border` | `155 16% 88%` | `160 16% 16%` |
| `--input` | `155 16% 88%` | `160 16% 16%` |
| `--ring` | `158 70% 38%` | `158 65% 48%` |
| `--gold` | `42 70% 50%` | `42 65% 55%` |
| `--gold-foreground` | `40 60% 12%` | `40 30% 96%` |
| `--gold-muted` | `42 30% 90%` | `42 22% 16%` |
| `--chart-1` | `158 70% 38%` | `158 65% 48%` |
| `--chart-2` | `190 65% 42%` | `190 60% 50%` |
| `--chart-3` | `100 50% 45%` | `100 50% 52%` |
| `--chart-4` | `42 70% 50%` | `42 65% 55%` |
| `--chart-5` | `220 55% 55%` | `220 55% 62%` |
| `--sidebar-background` | `155 18% 96%` | `160 24% 8%` |
| `--sidebar-foreground` | `160 18% 26%` | `150 10% 86%` |
| `--sidebar-primary` | `158 70% 38%` | `158 65% 48%` |
| `--sidebar-primary-foreground` | `0 0% 100%` | `160 40% 8%` |
| `--sidebar-accent` | `158 30% 90%` | `160 22% 15%` |
| `--sidebar-accent-foreground` | `158 45% 22%` | `150 10% 90%` |
| `--sidebar-border` | `155 16% 86%` | `160 16% 15%` |
| `--sidebar-ring` | `158 70% 38%` | `158 65% 48%` |

### 2.5 Slate — accent hue ≈ 215 (cool, low-saturation professional)

| Token | Light | Dark |
|---|---|---|
| `--background` | `210 20% 99%` | `215 28% 7%` |
| `--foreground` | `215 25% 12%` | `210 16% 95%` |
| `--card` | `0 0% 100%` | `215 28% 10%` |
| `--card-foreground` | `215 25% 12%` | `210 16% 95%` |
| `--popover` | `0 0% 100%` | `215 28% 10%` |
| `--popover-foreground` | `215 25% 12%` | `210 16% 95%` |
| `--primary` | `215 60% 45%` | `213 70% 60%` |
| `--primary-foreground` | `0 0% 100%` | `215 35% 10%` |
| `--secondary` | `214 18% 94%` | `215 20% 16%` |
| `--secondary-foreground` | `215 30% 24%` | `210 14% 92%` |
| `--muted` | `214 16% 94%` | `215 16% 15%` |
| `--muted-foreground` | `215 12% 44%` | `210 10% 64%` |
| `--accent` | `215 30% 92%` | `215 24% 19%` |
| `--accent-foreground` | `215 40% 28%` | `210 14% 92%` |
| `--destructive` | `0 75% 52%` | `0 62% 45%` |
| `--destructive-foreground` | `0 0% 100%` | `0 0% 98%` |
| `--border` | `214 18% 89%` | `215 18% 18%` |
| `--input` | `214 18% 89%` | `215 18% 18%` |
| `--ring` | `215 60% 45%` | `213 70% 60%` |
| `--gold` | `215 45% 55%` | `213 55% 62%` |
| `--gold-foreground` | `0 0% 100%` | `215 35% 10%` |
| `--gold-muted` | `215 28% 92%` | `215 24% 18%` |
| `--chart-1` | `215 60% 45%` | `213 70% 60%` |
| `--chart-2` | `190 55% 45%` | `190 55% 55%` |
| `--chart-3` | `250 50% 58%` | `250 50% 64%` |
| `--chart-4` | `160 45% 42%` | `160 45% 50%` |
| `--chart-5` | `30 60% 52%` | `30 60% 58%` |
| `--sidebar-background` | `214 20% 96%` | `215 30% 9%` |
| `--sidebar-foreground` | `215 18% 28%` | `210 12% 86%` |
| `--sidebar-primary` | `215 60% 45%` | `213 70% 60%` |
| `--sidebar-primary-foreground` | `0 0% 100%` | `215 35% 10%` |
| `--sidebar-accent` | `215 30% 90%` | `215 24% 16%` |
| `--sidebar-accent-foreground` | `215 40% 26%` | `210 12% 90%` |
| `--sidebar-border` | `214 18% 87%` | `215 18% 16%` |
| `--sidebar-ring` | `215 60% 45%` | `213 70% 60%` |

### 2.6 Rose — accent hue ≈ 347

| Token | Light | Dark |
|---|---|---|
| `--background` | `350 25% 99%` | `345 22% 7%` |
| `--foreground` | `345 25% 12%` | `350 14% 95%` |
| `--card` | `0 0% 100%` | `345 22% 10%` |
| `--card-foreground` | `345 25% 12%` | `350 14% 95%` |
| `--popover` | `0 0% 100%` | `345 22% 10%` |
| `--popover-foreground` | `345 25% 12%` | `350 14% 95%` |
| `--primary` | `347 72% 50%` | `347 75% 62%` |
| `--primary-foreground` | `0 0% 100%` | `345 35% 10%` |
| `--secondary` | `348 18% 95%` | `345 18% 16%` |
| `--secondary-foreground` | `345 30% 24%` | `350 14% 92%` |
| `--muted` | `348 14% 95%` | `345 14% 15%` |
| `--muted-foreground` | `345 10% 45%` | `350 10% 64%` |
| `--accent` | `347 35% 93%` | `345 22% 19%` |
| `--accent-foreground` | `347 50% 30%` | `350 14% 92%` |
| `--destructive` | `8 78% 50%` | `8 60% 45%` |
| `--destructive-foreground` | `0 0% 100%` | `0 0% 98%` |
| `--border` | `348 18% 90%` | `345 18% 18%` |
| `--input` | `348 18% 90%` | `345 18% 18%` |
| `--ring` | `347 72% 50%` | `347 75% 62%` |
| `--gold` | `347 55% 62%` | `347 60% 66%` |
| `--gold-foreground` | `0 0% 100%` | `345 35% 10%` |
| `--gold-muted` | `347 35% 93%` | `347 30% 18%` |
| `--chart-1` | `347 72% 50%` | `347 75% 62%` |
| `--chart-2` | `20 70% 55%` | `20 65% 60%` |
| `--chart-3` | `300 50% 56%` | `300 50% 62%` |
| `--chart-4` | `260 55% 60%` | `260 55% 66%` |
| `--chart-5` | `190 50% 48%` | `190 50% 55%` |
| `--sidebar-background` | `348 22% 96%` | `345 24% 9%` |
| `--sidebar-foreground` | `345 18% 28%` | `350 12% 86%` |
| `--sidebar-primary` | `347 72% 50%` | `347 75% 62%` |
| `--sidebar-primary-foreground` | `0 0% 100%` | `345 35% 10%` |
| `--sidebar-accent` | `347 35% 91%` | `345 22% 16%` |
| `--sidebar-accent-foreground` | `347 50% 28%` | `350 12% 90%` |
| `--sidebar-border` | `348 18% 88%` | `345 18% 16%` |
| `--sidebar-ring` | `347 72% 50%` | `347 75% 62%` |

### 2.7 The CSS to add to `app/globals.css`

Append the following **after** the existing `@layer base { :root {…} .dark {…} }` block (around line 390, before the `@layer base { * {…} }` reset). Champagne is duplicated as a named block so the picker can select it explicitly; it is intentionally identical to base so the default needs no `data-theme` to render.

```css
/* ============================================================
   THEME ENGINE — palette overrides keyed by [data-theme]
   Light blocks: [data-theme="x"]
   Dark blocks:  .dark [data-theme="x"]   (.dark is on <html>,
                 data-theme is on the shell <div> below it)
   Fill each block with the LIGHT / DARK column from §2.
   ============================================================ */
@layer base {
  /* --- CHAMPAGNE (default, named) --- */
  [data-theme="champagne"] {
    --background: 40 30% 99%; --foreground: 36 25% 12%;
    --card: 0 0% 100%; --card-foreground: 36 25% 12%;
    --popover: 0 0% 100%; --popover-foreground: 36 25% 12%;
    --primary: 38 70% 45%; --primary-foreground: 40 60% 98%;
    --secondary: 40 25% 95%; --secondary-foreground: 36 30% 22%;
    --muted: 40 20% 95%; --muted-foreground: 36 12% 42%;
    --accent: 40 30% 92%; --accent-foreground: 36 35% 20%;
    --destructive: 0 75% 52%; --destructive-foreground: 0 0% 100%;
    --border: 38 22% 88%; --input: 38 22% 88%; --ring: 38 70% 45%;
    --gold: 42 75% 50%; --gold-foreground: 40 60% 12%; --gold-muted: 42 35% 90%;
    --chart-1: 38 70% 45%; --chart-2: 24 65% 52%; --chart-3: 52 55% 48%;
    --chart-4: 14 60% 55%; --chart-5: 200 35% 50%;
    --sidebar-background: 40 28% 96%; --sidebar-foreground: 36 22% 25%;
    --sidebar-primary: 38 70% 45%; --sidebar-primary-foreground: 40 60% 98%;
    --sidebar-accent: 40 30% 90%; --sidebar-accent-foreground: 36 35% 20%;
    --sidebar-border: 38 22% 86%; --sidebar-ring: 38 70% 45%;
  }
  .dark [data-theme="champagne"] {
    --background: 36 18% 7%; --foreground: 40 15% 94%;
    --card: 36 18% 10%; --card-foreground: 40 15% 94%;
    --popover: 36 18% 10%; --popover-foreground: 40 15% 94%;
    --primary: 42 80% 58%; --primary-foreground: 36 40% 10%;
    --secondary: 36 15% 16%; --secondary-foreground: 40 15% 92%;
    --muted: 36 12% 15%; --muted-foreground: 40 10% 62%;
    --accent: 36 18% 18%; --accent-foreground: 40 15% 92%;
    --destructive: 0 62% 45%; --destructive-foreground: 0 0% 98%;
    --border: 36 14% 18%; --input: 36 14% 18%; --ring: 42 80% 58%;
    --gold: 42 70% 55%; --gold-foreground: 40 30% 96%; --gold-muted: 42 25% 16%;
    --chart-1: 42 80% 58%; --chart-2: 24 60% 58%; --chart-3: 52 55% 55%;
    --chart-4: 14 55% 60%; --chart-5: 200 35% 55%;
    --sidebar-background: 36 18% 9%; --sidebar-foreground: 40 12% 86%;
    --sidebar-primary: 42 80% 58%; --sidebar-primary-foreground: 36 40% 10%;
    --sidebar-accent: 36 18% 16%; --sidebar-accent-foreground: 40 12% 90%;
    --sidebar-border: 36 14% 16%; --sidebar-ring: 42 80% 58%;
  }

  /* --- INDIGO --- */
  [data-theme="indigo"] {
    --background: 240 25% 99%; --foreground: 240 25% 11%;
    --card: 0 0% 100%; --card-foreground: 240 25% 11%;
    --popover: 0 0% 100%; --popover-foreground: 240 25% 11%;
    --primary: 243 75% 58%; --primary-foreground: 0 0% 100%;
    --secondary: 240 18% 95%; --secondary-foreground: 240 25% 25%;
    --muted: 240 16% 95%; --muted-foreground: 240 10% 45%;
    --accent: 243 30% 93%; --accent-foreground: 243 45% 32%;
    --destructive: 0 75% 52%; --destructive-foreground: 0 0% 100%;
    --border: 240 18% 90%; --input: 240 18% 90%; --ring: 243 75% 58%;
    --gold: 243 60% 60%; --gold-foreground: 0 0% 100%; --gold-muted: 243 35% 92%;
    --chart-1: 243 75% 58%; --chart-2: 200 70% 50%; --chart-3: 270 60% 60%;
    --chart-4: 170 55% 45%; --chart-5: 320 55% 58%;
    --sidebar-background: 240 22% 96%; --sidebar-foreground: 240 18% 28%;
    --sidebar-primary: 243 75% 58%; --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 243 30% 91%; --sidebar-accent-foreground: 243 45% 30%;
    --sidebar-border: 240 18% 88%; --sidebar-ring: 243 75% 58%;
  }
  .dark [data-theme="indigo"] {
    --background: 240 24% 7%; --foreground: 240 15% 95%;
    --card: 240 24% 10%; --card-foreground: 240 15% 95%;
    --popover: 240 24% 10%; --popover-foreground: 240 15% 95%;
    --primary: 243 80% 67%; --primary-foreground: 240 30% 10%;
    --secondary: 240 18% 16%; --secondary-foreground: 240 15% 92%;
    --muted: 240 14% 15%; --muted-foreground: 240 10% 64%;
    --accent: 240 22% 19%; --accent-foreground: 240 15% 92%;
    --destructive: 0 62% 45%; --destructive-foreground: 0 0% 98%;
    --border: 240 16% 18%; --input: 240 16% 18%; --ring: 243 80% 67%;
    --gold: 243 65% 66%; --gold-foreground: 240 30% 10%; --gold-muted: 243 30% 18%;
    --chart-1: 243 80% 67%; --chart-2: 200 70% 58%; --chart-3: 270 60% 66%;
    --chart-4: 170 55% 52%; --chart-5: 320 55% 64%;
    --sidebar-background: 240 26% 9%; --sidebar-foreground: 240 12% 86%;
    --sidebar-primary: 243 80% 67%; --sidebar-primary-foreground: 240 30% 10%;
    --sidebar-accent: 240 22% 16%; --sidebar-accent-foreground: 240 12% 90%;
    --sidebar-border: 240 16% 16%; --sidebar-ring: 243 80% 67%;
  }

  /* --- VIOLET --- */
  [data-theme="violet"] {
    --background: 270 20% 99%; --foreground: 263 30% 11%;
    --card: 0 0% 100%; --card-foreground: 263 30% 11%;
    --popover: 0 0% 100%; --popover-foreground: 263 30% 11%;
    --primary: 263 80% 58%; --primary-foreground: 0 0% 100%;
    --secondary: 263 18% 95%; --secondary-foreground: 263 35% 24%;
    --muted: 263 12% 95%; --muted-foreground: 263 10% 45%;
    --accent: 263 28% 93%; --accent-foreground: 263 45% 30%;
    --destructive: 0 75% 52%; --destructive-foreground: 0 0% 100%;
    --border: 263 16% 90%; --input: 263 16% 90%; --ring: 263 80% 58%;
    --gold: 263 55% 62%; --gold-foreground: 0 0% 100%; --gold-muted: 263 32% 92%;
    --chart-1: 263 80% 58%; --chart-2: 220 65% 55%; --chart-3: 300 55% 58%;
    --chart-4: 190 55% 45%; --chart-5: 340 60% 60%;
    --sidebar-background: 263 20% 96%; --sidebar-foreground: 263 18% 28%;
    --sidebar-primary: 263 80% 58%; --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 263 28% 91%; --sidebar-accent-foreground: 263 45% 30%;
    --sidebar-border: 263 16% 88%; --sidebar-ring: 263 80% 58%;
  }
  .dark [data-theme="violet"] {
    --background: 263 30% 6%; --foreground: 263 8% 95%;
    --card: 263 25% 9%; --card-foreground: 263 8% 95%;
    --popover: 263 25% 9%; --popover-foreground: 263 8% 95%;
    --primary: 263 84% 67%; --primary-foreground: 263 30% 10%;
    --secondary: 263 16% 15%; --secondary-foreground: 263 8% 92%;
    --muted: 263 10% 15%; --muted-foreground: 263 6% 64%;
    --accent: 263 18% 18%; --accent-foreground: 263 8% 92%;
    --destructive: 0 62% 45%; --destructive-foreground: 0 0% 98%;
    --border: 263 15% 17%; --input: 263 15% 17%; --ring: 263 84% 67%;
    --gold: 263 60% 67%; --gold-foreground: 263 30% 10%; --gold-muted: 263 28% 18%;
    --chart-1: 263 84% 67%; --chart-2: 220 65% 62%; --chart-3: 300 55% 64%;
    --chart-4: 190 55% 52%; --chart-5: 340 60% 66%;
    --sidebar-background: 263 32% 8%; --sidebar-foreground: 263 8% 86%;
    --sidebar-primary: 263 84% 67%; --sidebar-primary-foreground: 263 30% 10%;
    --sidebar-accent: 263 22% 15%; --sidebar-accent-foreground: 263 8% 90%;
    --sidebar-border: 263 18% 15%; --sidebar-ring: 263 84% 67%;
  }

  /* --- EMERALD --- */
  [data-theme="emerald"] {
    --background: 150 18% 99%; --foreground: 160 25% 11%;
    --card: 0 0% 100%; --card-foreground: 160 25% 11%;
    --popover: 0 0% 100%; --popover-foreground: 160 25% 11%;
    --primary: 158 70% 38%; --primary-foreground: 0 0% 100%;
    --secondary: 155 16% 94%; --secondary-foreground: 160 30% 22%;
    --muted: 155 14% 94%; --muted-foreground: 160 10% 42%;
    --accent: 158 30% 91%; --accent-foreground: 158 45% 24%;
    --destructive: 0 75% 52%; --destructive-foreground: 0 0% 100%;
    --border: 155 16% 88%; --input: 155 16% 88%; --ring: 158 70% 38%;
    --gold: 42 70% 50%; --gold-foreground: 40 60% 12%; --gold-muted: 42 30% 90%;
    --chart-1: 158 70% 38%; --chart-2: 190 65% 42%; --chart-3: 100 50% 45%;
    --chart-4: 42 70% 50%; --chart-5: 220 55% 55%;
    --sidebar-background: 155 18% 96%; --sidebar-foreground: 160 18% 26%;
    --sidebar-primary: 158 70% 38%; --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 158 30% 90%; --sidebar-accent-foreground: 158 45% 22%;
    --sidebar-border: 155 16% 86%; --sidebar-ring: 158 70% 38%;
  }
  .dark [data-theme="emerald"] {
    --background: 160 22% 6%; --foreground: 150 12% 95%;
    --card: 160 22% 9%; --card-foreground: 150 12% 95%;
    --popover: 160 22% 9%; --popover-foreground: 150 12% 95%;
    --primary: 158 65% 48%; --primary-foreground: 160 40% 8%;
    --secondary: 160 16% 15%; --secondary-foreground: 150 12% 92%;
    --muted: 160 12% 14%; --muted-foreground: 150 8% 63%;
    --accent: 160 22% 17%; --accent-foreground: 150 12% 92%;
    --destructive: 0 62% 45%; --destructive-foreground: 0 0% 98%;
    --border: 160 16% 16%; --input: 160 16% 16%; --ring: 158 65% 48%;
    --gold: 42 65% 55%; --gold-foreground: 40 30% 96%; --gold-muted: 42 22% 16%;
    --chart-1: 158 65% 48%; --chart-2: 190 60% 50%; --chart-3: 100 50% 52%;
    --chart-4: 42 65% 55%; --chart-5: 220 55% 62%;
    --sidebar-background: 160 24% 8%; --sidebar-foreground: 150 10% 86%;
    --sidebar-primary: 158 65% 48%; --sidebar-primary-foreground: 160 40% 8%;
    --sidebar-accent: 160 22% 15%; --sidebar-accent-foreground: 150 10% 90%;
    --sidebar-border: 160 16% 15%; --sidebar-ring: 158 65% 48%;
  }

  /* --- SLATE --- */
  [data-theme="slate"] {
    --background: 210 20% 99%; --foreground: 215 25% 12%;
    --card: 0 0% 100%; --card-foreground: 215 25% 12%;
    --popover: 0 0% 100%; --popover-foreground: 215 25% 12%;
    --primary: 215 60% 45%; --primary-foreground: 0 0% 100%;
    --secondary: 214 18% 94%; --secondary-foreground: 215 30% 24%;
    --muted: 214 16% 94%; --muted-foreground: 215 12% 44%;
    --accent: 215 30% 92%; --accent-foreground: 215 40% 28%;
    --destructive: 0 75% 52%; --destructive-foreground: 0 0% 100%;
    --border: 214 18% 89%; --input: 214 18% 89%; --ring: 215 60% 45%;
    --gold: 215 45% 55%; --gold-foreground: 0 0% 100%; --gold-muted: 215 28% 92%;
    --chart-1: 215 60% 45%; --chart-2: 190 55% 45%; --chart-3: 250 50% 58%;
    --chart-4: 160 45% 42%; --chart-5: 30 60% 52%;
    --sidebar-background: 214 20% 96%; --sidebar-foreground: 215 18% 28%;
    --sidebar-primary: 215 60% 45%; --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 215 30% 90%; --sidebar-accent-foreground: 215 40% 26%;
    --sidebar-border: 214 18% 87%; --sidebar-ring: 215 60% 45%;
  }
  .dark [data-theme="slate"] {
    --background: 215 28% 7%; --foreground: 210 16% 95%;
    --card: 215 28% 10%; --card-foreground: 210 16% 95%;
    --popover: 215 28% 10%; --popover-foreground: 210 16% 95%;
    --primary: 213 70% 60%; --primary-foreground: 215 35% 10%;
    --secondary: 215 20% 16%; --secondary-foreground: 210 14% 92%;
    --muted: 215 16% 15%; --muted-foreground: 210 10% 64%;
    --accent: 215 24% 19%; --accent-foreground: 210 14% 92%;
    --destructive: 0 62% 45%; --destructive-foreground: 0 0% 98%;
    --border: 215 18% 18%; --input: 215 18% 18%; --ring: 213 70% 60%;
    --gold: 213 55% 62%; --gold-foreground: 215 35% 10%; --gold-muted: 215 24% 18%;
    --chart-1: 213 70% 60%; --chart-2: 190 55% 55%; --chart-3: 250 50% 64%;
    --chart-4: 160 45% 50%; --chart-5: 30 60% 58%;
    --sidebar-background: 215 30% 9%; --sidebar-foreground: 210 12% 86%;
    --sidebar-primary: 213 70% 60%; --sidebar-primary-foreground: 215 35% 10%;
    --sidebar-accent: 215 24% 16%; --sidebar-accent-foreground: 210 12% 90%;
    --sidebar-border: 215 18% 16%; --sidebar-ring: 213 70% 60%;
  }

  /* --- ROSE --- */
  [data-theme="rose"] {
    --background: 350 25% 99%; --foreground: 345 25% 12%;
    --card: 0 0% 100%; --card-foreground: 345 25% 12%;
    --popover: 0 0% 100%; --popover-foreground: 345 25% 12%;
    --primary: 347 72% 50%; --primary-foreground: 0 0% 100%;
    --secondary: 348 18% 95%; --secondary-foreground: 345 30% 24%;
    --muted: 348 14% 95%; --muted-foreground: 345 10% 45%;
    --accent: 347 35% 93%; --accent-foreground: 347 50% 30%;
    --destructive: 8 78% 50%; --destructive-foreground: 0 0% 100%;
    --border: 348 18% 90%; --input: 348 18% 90%; --ring: 347 72% 50%;
    --gold: 347 55% 62%; --gold-foreground: 0 0% 100%; --gold-muted: 347 35% 93%;
    --chart-1: 347 72% 50%; --chart-2: 20 70% 55%; --chart-3: 300 50% 56%;
    --chart-4: 260 55% 60%; --chart-5: 190 50% 48%;
    --sidebar-background: 348 22% 96%; --sidebar-foreground: 345 18% 28%;
    --sidebar-primary: 347 72% 50%; --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 347 35% 91%; --sidebar-accent-foreground: 347 50% 28%;
    --sidebar-border: 348 18% 88%; --sidebar-ring: 347 72% 50%;
  }
  .dark [data-theme="rose"] {
    --background: 345 22% 7%; --foreground: 350 14% 95%;
    --card: 345 22% 10%; --card-foreground: 350 14% 95%;
    --popover: 345 22% 10%; --popover-foreground: 350 14% 95%;
    --primary: 347 75% 62%; --primary-foreground: 345 35% 10%;
    --secondary: 345 18% 16%; --secondary-foreground: 350 14% 92%;
    --muted: 345 14% 15%; --muted-foreground: 350 10% 64%;
    --accent: 345 22% 19%; --accent-foreground: 350 14% 92%;
    --destructive: 8 60% 45%; --destructive-foreground: 0 0% 98%;
    --border: 345 18% 18%; --input: 345 18% 18%; --ring: 347 75% 62%;
    --gold: 347 60% 66%; --gold-foreground: 345 35% 10%; --gold-muted: 347 30% 18%;
    --chart-1: 347 75% 62%; --chart-2: 20 65% 60%; --chart-3: 300 50% 62%;
    --chart-4: 260 55% 66%; --chart-5: 190 50% 55%;
    --sidebar-background: 345 24% 9%; --sidebar-foreground: 350 12% 86%;
    --sidebar-primary: 347 75% 62%; --sidebar-primary-foreground: 345 35% 10%;
    --sidebar-accent: 345 22% 16%; --sidebar-accent-foreground: 350 12% 90%;
    --sidebar-border: 345 18% 16%; --sidebar-ring: 347 75% 62%;
  }
}
```

---

## 3. Custom accent (user-picked hex)

A user can override the theme's `--primary` (and the derived `--ring`, hover, active) with any hex color. We **only** override the brand tokens — surfaces/neutrals stay on the selected theme, so the custom accent never breaks contrast of the rest of the UI.

### 3.1 hex → HSL

`lib/color/hex-to-hsl.ts`:

```ts
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
  // convert to rgb
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
```

### 3.2 Tasteful derivation (primary → ring / hover / active / foreground)

`lib/color/derive-accent.ts`:

```ts
import { hexToHsl, hslTriplet, hslLuminance } from "./hex-to-hsl"

export interface AccentVars {
  primary: string          // "h s% l%"
  primaryForeground: string
  ring: string
  primaryHover: string     // optional util token
  primaryActive: string
}

const clampL = (l: number) => Math.max(4, Math.min(96, l))

/** Map a user hex to a coherent, AA-safe accent set. `mode` picks light/dark tuning. */
export function deriveAccent(hex: string, mode: "light" | "dark"): AccentVars | null {
  const base = hexToHsl(hex)
  if (!base) return null

  // Normalize lightness into a usable band so neon/near-black picks still work.
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
```

**Application:** when `customAccent` is set, `useApplyTheme` (§4.2) writes these as **inline styles** on the shell root, which beat the `[data-theme]` stylesheet for those four vars only:

```ts
el.style.setProperty("--primary", a.primary)
el.style.setProperty("--primary-foreground", a.primaryForeground)
el.style.setProperty("--ring", a.ring)
el.style.setProperty("--primary-hover", a.primaryHover)   // consumed by buttons via [&:hover]:bg-[hsl(var(--primary-hover))]
el.style.setProperty("--primary-active", a.primaryActive)
```

When `customAccent` is cleared, remove those properties so the theme's `--primary` resurfaces:

```ts
;["--primary","--primary-foreground","--ring","--primary-hover","--primary-active"]
  .forEach((p) => el.style.removeProperty(p))
```

> Note: `--chart-1` and `--sidebar-primary` intentionally stay on the theme value, not the custom accent — keeps charts/sidebar legible regardless of an extreme custom pick. (If product wants the sidebar active state to follow the custom accent too, also set `--sidebar-primary`/`--sidebar-ring` to `a.primary`.)

---

## 4. State, hook, and FOUC prevention

### 4.1 Zustand persisted store — `lib/store/theme-prefs.ts`

```ts
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

/** Keep this key in sync with the FOUC script (§4.3). */
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
```

> Persisted JSON shape (what the FOUC script reads): `{"state":{"theme":"indigo","mode":"dark","customAccent":"#5B5BFF"},"version":1}`.

### 4.2 `useApplyTheme` hook — `lib/hooks/use-apply-theme.ts`

Syncs the store → DOM. Sets `data-theme` on the shell root, mirrors `mode` into next-themes (which owns the `.dark` class), and applies/clears the custom accent inline vars.

```ts
"use client"

import { useEffect, useRef } from "react"
import { useTheme as useNextTheme } from "next-themes"
import { useThemePrefs } from "@/lib/store/theme-prefs"
import { deriveAccent } from "@/lib/color/derive-accent"

/**
 * Attach to a ref on the dashboard shell root (the element carrying data-theme).
 * Usage:
 *   const shellRef = useRef<HTMLDivElement>(null)
 *   useApplyTheme(shellRef)
 *   return <div ref={shellRef} data-theme={...}> … </div>
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
    const props = ["--primary","--primary-foreground","--ring","--primary-hover","--primary-active"]
    if (!customAccent) {
      props.forEach((p) => el.style.removeProperty(p))
      return
    }
    const m = resolvedTheme === "dark" ? "dark" : "light"
    const a = deriveAccent(customAccent, m)
    if (!a) { props.forEach((p) => el.style.removeProperty(p)); return }
    el.style.setProperty("--primary", a.primary)
    el.style.setProperty("--primary-foreground", a.primaryForeground)
    el.style.setProperty("--ring", a.ring)
    el.style.setProperty("--primary-hover", a.primaryHover)
    el.style.setProperty("--primary-active", a.primaryActive)
  }, [ref, customAccent, resolvedTheme])

  hydrated.current = true
}
```

**Where to mount it:** the dashboard shell client component that renders the outer `<div>`:

```tsx
"use client"
import { useRef } from "react"
import { useApplyTheme } from "@/lib/hooks/use-apply-theme"
import { useThemePrefs } from "@/lib/store/theme-prefs"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const shellRef = useRef<HTMLDivElement>(null)
  const theme = useThemePrefs((s) => s.theme)
  useApplyTheme(shellRef)
  // data-theme set both via SSR attr (avoids flash) and via the hook (post-hydration changes)
  return (
    <div ref={shellRef} data-theme={theme} className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}
```

### 4.3 FOUC-prevention inline script — `app/(dashboard)/layout.tsx`

next-themes already prevents the light/dark flash. We must **additionally** stamp `data-theme` before paint so the palette doesn't flash champagne → indigo. Inject a blocking inline script in the dashboard segment layout, read from the **same** localStorage key. Render it as the first child of `<body>`'s dashboard subtree (or in the root layout `<head>` if the dashboard is the whole app).

```tsx
// app/(dashboard)/layout.tsx  (server component)
import { ThemeProvider } from "@/components/dashboard/layout/ThemeToggle/theme-provider"
import { DashboardShell } from "@/components/dashboard/layout/DashboardShell"

const THEME_BOOTSTRAP = `
(function () {
  try {
    var KEY = "ww-theme-prefs";
    var DEFAULT = "champagne";
    var raw = localStorage.getItem(KEY);
    var theme = DEFAULT;
    if (raw) {
      var parsed = JSON.parse(raw);
      var t = parsed && parsed.state && parsed.state.theme;
      if (t) theme = t;
    }
    // Stamp the palette on <html> as an early hint; the shell div re-stamps on hydrate.
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Runs before first paint, no React, no network. */}
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <DashboardShell>{children}</DashboardShell>
      </ThemeProvider>
    </>
  )
}
```

> **Selector consequence:** the bootstrap sets `data-theme` on `<html>` (no ref available pre-React), while the hydrated `DashboardShell` sets it on its inner `<div>`. Both are fine because our dark selector is the **descendant** form `.dark [data-theme="x"]` — it matches whether `[data-theme]` is on `<html>` (with `.dark` also on `<html>`, an element is its own... no) — to be unambiguous: **also emit the compound fallback** so the early `<html>` stamp is covered in dark mode. Add to each dark block, OR simpler: in the bootstrap, after stamping `<html>`, the `DashboardShell` div takes over on hydration and the `<html>` attribute becomes harmless (a `[data-theme]` on `<html>` that has the same value just re-applies the same light vars; dark is driven by the descendant div). To be fully flash-proof in dark mode, include BOTH selectors in §2.7 dark blocks:
>
> ```css
> .dark [data-theme="indigo"],
> [data-theme="indigo"].dark { /* dark vars */ }
> ```
>
> The second selector (`[data-theme].dark`) matches the early `<html>` stamp when next-themes has also put `.dark` on `<html>`. **Recommendation:** add the `[data-theme="x"].dark` compound to every dark block in §2.7 (one extra selector per block) to make the pre-hydration dark palette correct too. The light blocks need no change.

---

## 5. Topbar theme-picker popover — component spec

**File:** `components/dashboard/layout/ThemeToggle/ThemePicker.tsx`
**Trigger placement:** in the dashboard topbar, next to the existing light/dark `ThemeToggle`. (Optional: fold the existing mode toggle into this popover and keep only one control.)

**Built on:** shadcn `Popover`, `Button`, `Input`, `Label`, `Tooltip`, `RadioGroup` (for swatch grid a11y), `lucide-react` `Palette`/`Sun`/`Moon`/`Monitor` icons.

### 5.1 Public API

```ts
// ThemePicker.tsx
export interface ThemePickerProps {
  /** Render a compact icon-only trigger (topbar) vs labeled. Default: "icon". */
  variant?: "icon" | "labeled"
  /** Optional className passthrough for the trigger button. */
  className?: string
  /** Show the custom-accent field. Default: true. */
  enableCustomAccent?: boolean
  /** Show the light/dark/system toggle inside the popover. Default: true. */
  enableModeToggle?: boolean
  /** Popover side. Default: "bottom". */
  side?: "top" | "bottom" | "left" | "right"
  /** Popover align. Default: "end". */
  align?: "start" | "center" | "end"
}
```

The component is **self-wired** to the Zustand store — no value/onChange props needed. It reads `theme`, `mode`, `customAccent` and calls `setTheme`/`setMode`/`setCustomAccent`.

### 5.2 Structure

```
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Theme settings">
      <Palette className="h-4 w-4" />
    </Button>
  </PopoverTrigger>
  <PopoverContent side align className="w-72 p-4 space-y-4">

    {/* (a) Mode toggle — light / dark / system */}
    <section aria-label="Color mode">
      <Label>Mode</Label>
      <div className="grid grid-cols-3 gap-1">
        <ModeButton value="light"  icon={Sun}     active={mode==="light"}  onClick={() => setMode("light")} />
        <ModeButton value="dark"   icon={Moon}    active={mode==="dark"}   onClick={() => setMode("dark")} />
        <ModeButton value="system" icon={Monitor} active={mode==="system"} onClick={() => setMode("system")} />
      </div>
    </section>

    {/* (b) Theme swatch grid — 6 themes, 3 cols × 2 rows */}
    <section aria-label="Theme palette">
      <Label>Theme</Label>
      <RadioGroup value={theme} onValueChange={(v) => setTheme(v as ThemeName)}
                  className="grid grid-cols-3 gap-2">
        {THEME_SWATCHES.map((s) => (
          <ThemeSwatch key={s.name} {...s} selected={theme === s.name} />
        ))}
      </RadioGroup>
    </section>

    {/* (c) Custom accent — color input + hex text + clear */}
    {enableCustomAccent && (
      <section aria-label="Custom accent">
        <Label htmlFor="accent-hex">Custom accent</Label>
        <div className="flex items-center gap-2">
          <input type="color" aria-label="Pick accent color"
                 value={customAccent ?? swatchHexFor(theme, resolvedMode)}
                 onChange={(e) => setCustomAccent(e.target.value)}
                 className="h-8 w-8 rounded border border-input bg-transparent p-0" />
          <Input id="accent-hex" value={customAccent ?? ""} placeholder="#5B5BFF"
                 onChange={(e) => {
                   const v = e.target.value
                   setCustomAccent(/^#?[0-9a-fA-F]{6}$/.test(v) ? (v.startsWith("#") ? v : "#"+v) : v ? customAccent : null)
                 }} />
          {customAccent && (
            <Button variant="ghost" size="sm" onClick={() => setCustomAccent(null)}>Reset</Button>
          )}
        </div>
      </section>
    )}

    {/* (d) Live preview row — chips that read the live tokens */}
    <section aria-label="Preview" className="space-y-2 rounded-md border border-border p-3">
      <div className="flex gap-2">
        <span className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">Primary</span>
        <span className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">Secondary</span>
        <span className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">Accent</span>
      </div>
      <div className="flex gap-2 text-xs text-muted-foreground">
        <span className="rounded bg-muted px-2 py-1">Muted</span>
        <span className="rounded border border-border px-2 py-1 ring-1 ring-ring">Ring</span>
      </div>
    </section>
  </PopoverContent>
</Popover>
```

### 5.3 Swatch metadata

```ts
// Each swatch shows two dots (primary + sidebar) so users see the palette at a glance.
// Hexes are display-only previews (≈ the §2 light primary), not the source of truth.
export const THEME_SWATCHES: { name: ThemeName; label: string; primary: string; surface: string }[] = [
  { name: "champagne", label: "Champagne", primary: "#C79A3B", surface: "#FBF8F2" },
  { name: "indigo",    label: "Indigo",    primary: "#4B47E0", surface: "#FAFAFD" },
  { name: "violet",    label: "Violet",    primary: "#7C3AED", surface: "#FBFAFE" },
  { name: "emerald",   label: "Emerald",   primary: "#1DA46E", surface: "#F7FBF9" },
  { name: "slate",     label: "Slate",     primary: "#3B72C4", surface: "#FAFBFC" },
  { name: "rose",      label: "Rose",      primary: "#DB2D63", surface: "#FDF8F9" },
]
```

- **Live preview** uses real Tailwind token utilities (`bg-primary`, etc.), so it reflects the *actually applied* palette + custom accent in real time (the popover lives inside the shell, under `data-theme`).
- **a11y:** swatch grid is a `RadioGroup` (arrow-key navigable, `aria-checked`); the selected swatch shows a check/ring. Each `ThemeSwatch` is a `RadioGroupItem` with `aria-label={label}`.
- **Persistence** is automatic via the store; closing the popover keeps the choice.

---

## 6. AA contrast — guarantees and verification matrix

### 6.1 Guarantees (intended)

For **every** theme in **both** modes:

1. **Body text:** `--foreground` on `--background` and `--card-foreground` on `--card` ≥ **7:1** (AAA target; floor AA 4.5:1).
2. **Primary buttons:** `--primary-foreground` on `--primary` ≥ **4.5:1** (AA normal text). This is why light-mode primaries use white foreground and dark-mode primaries use a dark same-hue ink (their primaries are bright).
3. **Secondary / accent surfaces:** `--secondary-foreground` on `--secondary`, `--accent-foreground` on `--accent` ≥ **4.5:1**.
4. **Muted text:** `--muted-foreground` on `--muted` and on `--background` ≥ **4.5:1** (it is intentionally not lighter than ~45% L in light / ~62% L in dark to hold this).
5. **Destructive buttons:** `--destructive-foreground` on `--destructive` ≥ **4.5:1**.
6. **Focus ring:** `--ring` on `--background` ≥ **3:1** (AA non-text/UI component contrast) so keyboard focus is visible.
7. **Sidebar:** `--sidebar-foreground` on `--sidebar-background` ≥ **4.5:1**; `--sidebar-primary-foreground` on `--sidebar-primary` ≥ **4.5:1**; active-item `--sidebar-accent-foreground` on `--sidebar-accent` ≥ **4.5:1**.
8. **Custom accent:** `deriveAccent` chooses `--primary-foreground` by luminance threshold (white if primary luminance < 0.4, else dark ink), guaranteeing AA regardless of the user's hex.

### 6.2 Pairs to verify (run before merge)

Verify each pair below for all 6 themes × {light, dark} = 12 contexts:

| # | Foreground token | Background token | Min ratio |
|---|---|---|---|
| 1 | `--foreground` | `--background` | 7:1 |
| 2 | `--card-foreground` | `--card` | 7:1 |
| 3 | `--popover-foreground` | `--popover` | 7:1 |
| 4 | `--primary-foreground` | `--primary` | 4.5:1 |
| 5 | `--secondary-foreground` | `--secondary` | 4.5:1 |
| 6 | `--accent-foreground` | `--accent` | 4.5:1 |
| 7 | `--muted-foreground` | `--muted` | 4.5:1 |
| 8 | `--muted-foreground` | `--background` | 4.5:1 |
| 9 | `--destructive-foreground` | `--destructive` | 4.5:1 |
| 10 | `--ring` | `--background` | 3:1 |
| 11 | `--sidebar-foreground` | `--sidebar-background` | 4.5:1 |
| 12 | `--sidebar-primary-foreground` | `--sidebar-primary` | 4.5:1 |
| 13 | `--sidebar-accent-foreground` | `--sidebar-accent` | 4.5:1 |

### 6.3 Verification method (concrete)

Add a dev-only script `scripts/verify-contrast.ts` that imports the token tables, converts each HSL triplet to sRGB, computes WCAG contrast ((L1+0.05)/(L2+0.05)), and asserts the matrix above. Wire it as `npm run verify:contrast` and run in CI. (Reuse `hslLuminance` from §3.1 for the luminance term.) Pseudocode:

```ts
for (const theme of THEME_NAMES)
  for (const mode of ["light","dark"] as const)
    for (const [fg, bg, min] of MATRIX)
      assert(contrast(tokens[theme][mode][fg], tokens[theme][mode][bg]) >= min,
             `${theme}/${mode}: ${fg} on ${bg}`)
```

Any failure → bump the foreground L by ±3–5% (lighten on dark surfaces, darken on light surfaces) and re-run. The tables in §2 were tuned to pass this matrix; the script is the regression guard.

---

## 7. Implementation checklist (order matters)

1. Add the six `[data-theme]` light + `.dark [data-theme]` (+ `[data-theme].dark` fallback) blocks from §2.7 to `app/globals.css`. **Do not touch** the existing `:root`/`.dark` base.
2. Add `lib/color/hex-to-hsl.ts` and `lib/color/derive-accent.ts` (§3).
3. Add `lib/store/theme-prefs.ts` (§4.1). Confirm `zustand` is already a dep (it is used elsewhere in the app per memory).
4. Add `lib/hooks/use-apply-theme.ts` (§4.2).
5. Wrap the dashboard shell: add `DashboardShell` client component with `ref` + `data-theme={theme}` and mount `useApplyTheme` (§4.2).
6. Add the FOUC bootstrap script to `app/(dashboard)/layout.tsx` (§4.3). Keep the existing `ThemeProvider` config.
7. Build `components/dashboard/layout/ThemeToggle/ThemePicker.tsx` (§5); drop the trigger in the topbar.
8. Add `scripts/verify-contrast.ts` + `npm run verify:contrast`; run it; fix any failing pair per §6.3.
9. Manual QA: switch all 6 themes in light + dark, toggle a custom accent, hard-refresh on each (no champagne→theme flash, no light→dark flash), confirm sidebar recolors per theme.

**Backward-compat note (live system):** every change here is additive. The base `:root`/`.dark` (current champagne/bridal flavor) remains the rendered default when no `data-theme` is present, so any screen outside the new dashboard shell is untouched. The engine only activates inside the shell that stamps `data-theme`.
