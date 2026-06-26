# Design Systems Research — How the Best SaaS Products Build Theirs

> Purpose: a concrete, **sourced** reference for building a premium clean-SaaS dashboard design system.
> Every claim carries a source URL. Where a value comes from a third-party teardown rather than an
> official spec, it is marked `[TEARDOWN]`. Official/first-party sources are unmarked or `[OFFICIAL]`.
>
> Studied: Linear, Stripe (Dashboard + accessible color), Vercel Geist, shadcn/ui, Radix UI,
> Tailwind CSS, Notion, Height, Retool, Atlassian Design System, Material Design 3.
>
> Bottom line up front: the premium SaaS look is **4px base spacing, a single restrained accent,
> a perceptually-even neutral ramp, 1px hairline borders + near-invisible layered shadows,
> 6–8px control radius, tabular numerals on all data, and a primitive→semantic→component token layering.**
> The exact recommended values are in [§7](#7-recommended-system-exact-values).

---

## 1. SPACING

### What the best products do

| System | Base unit | Scale (px) | Notes | Source |
|---|---|---|---|---|
| **Vercel Geist** | **4px** | 4·8·12·16·24·32·40·64·96 | rhythm: 8 within groups, 16 between groups, 32–40 between sections | [design.md](https://vercel.com/design.md), [geist/spacing](https://vercel.com/geist/spacing) |
| **Tailwind** | **4px** (`--spacing:0.25rem`) | `calc(var(--spacing) * n)` → 2·4·6·8·12·16·20·24·32·40·48·64·96·128 | every utility derived from one variable | [docs/theme](https://tailwindcss.com/docs/theme), [docs/padding](https://tailwindcss.com/docs/padding) |
| **Radix Themes** | **4px** | `--space-1..9` = 4·8·12·16·24·32·40·48·64 | fixed 9-step px scale | [themes/spacing](https://www.radix-ui.com/themes/docs/theme/spacing) |
| **Atlassian** | **8px** (w/ quarter steps) | `space.025..1000` = 2·4·6·8·12·16·20·24·32·40·48·64·80 | quarter/half steps (2/4/6px) for fine control; negative tokens exist | [foundations/spacing](https://atlassian.design/foundations/spacing) |
| **Material 3** | **4dp** (8dp grid) | components in 8dp, padding in 4/8dp; **48dp min touch target**, ≥8dp between targets | [m3 spacing](https://m3.material.io/foundations/layout/understanding-layout/spacing) |
| **Linear** | **4px** `[TEARDOWN]` | 4·8·12·16·24·32·48·96 | card pad 24px; testimonial 32px; CTA banner 48px; nav 56px | [Linear DESIGN.md teardown](https://github.com/voltagent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md) |

**Consensus: 4px base unit.** Atlassian is the outlier at 8px but adds 2/4/6px quarter-steps so it
effectively reaches the same fine grain. The usable scale everyone converges on:
`4, 8, 12, 16, 24, 32, 40, 48, 64`.

### Control heights & padding
- **Geist control heights:** small **32px**, medium (default) **40px**, large **48px** — inputs match. ([design.md](https://vercel.com/design.md))
- **Linear** `[TEARDOWN]`: buttons pad 8×14 (v×h), inputs 8×12, min touch target 40–44px. ([teardown](https://github.com/voltagent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md))
- **M3:** button visually 40dp but state-layer/touch target padded to **48dp**. ([m3 structure](https://m3.material.io/foundations/designing/structure))
- **Card/page padding:** Geist & Linear cards = **24px**; Atlassian large band = **24–32px**; section gaps **32–40px**.

### Density vs breathing room
- **Dense tools** (Height, Retool, Linear in-app) lean on **switchable view densities** and **dynamic row height** rather than shrinking everything. Retool ships "dynamic row height for better data density." ([Retool](https://retool.com/blog/redesigned-ui-component-library))
- **Marketing/dashboard chrome** breathes: Geist 32–40px between sections. The premium move is **tight inside data, generous between regions**.

---

## 2. TYPOGRAPHY

### Type scales (size / line-height)

**Tailwind** — the de-facto baseline scale, with paired line-heights ([docs/font-size](https://tailwindcss.com/docs/font-size)):

| Class | Size | Line-height |
|---|---|---|
| xs | 12px | ~1.33 (16px) |
| sm | 14px | ~1.43 (20px) |
| base | 16px | 1.5 (24px) |
| lg | 18px | ~1.56 (28px) |
| xl | 20px | 1.4 (28px) |
| 2xl | 24px | ~1.33 (32px) |
| 3xl | 30px | 1.2 (36px) |
| 4xl | 36px | ~1.11 (40px) |
| 5xl+ | 48/60/72/96/128px | 1.0 |

**Radix Themes** — 9-step scale with **optical letter-spacing that tightens as size grows** ([themes/typography](https://www.radix-ui.com/themes/docs/theme/typography)):

| Step | Size | Line-height | Tracking |
|---|---|---|---|
| 1 | 12px | 16px | +0.0025em |
| 2 | 14px | 20px | 0 |
| 3 | 16px | 24px | 0 |
| 4 | 18px | 26px | −0.0025em |
| 5 | 20px | 28px | −0.005em |
| 6 | 24px | 30px | −0.00625em |
| 7 | 28px | 36px | −0.0075em |
| 8 | 35px | 40px | −0.01em |
| 9 | 60px | 60px | −0.025em |

**Material 3** — exact size/line-height/weight/tracking per role ([m3 type-scale-tokens](https://m3.material.io/styles/typography/type-scale-tokens), verified vs [TypeScaleTokens.kt](https://cs.android.com/androidx/platform/frameworks/support/+/androidx-main:/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/TypeScaleTokens.kt)):
display 57/64·45/52·36/44 (400) · headline 32/40·28/36·24/32 (400) · title 22/28 (400), 16/24·14/20 (500) · body 16/24·14/20·12/16 (400) · label 14/20·12/16·11/16 (500). Ratio ≈ **1.2× display/headline/title, 1.5× body/label.**

**Atlassian** — default UI body is **14/20**; headings 12→32px all Bold; dedicated **metric tokens** for KPIs (`font.metric.large` 28/32, medium 24/28, small 16/20, Bold). ([typography](https://atlassian.design/foundations/typography))

**Geist** — bundled tokens `heading-*`/`copy-*`/`label-*`/`button-*`. `copy-16`=16/24, `copy-14`=14/20, `heading-24`=24/32 with **negative tracking ~−0.06em** on headings (−0.96px on 24, −4.32px on 72). ([geist/typography](https://vercel.com/geist/typography))

### Weights
- **400 / 500 / 600 / 700** is the working set everywhere. Geist: headings 600, copy 400, labels 400, buttons 500. M3 uses only 400/500 in baseline. Linear in-app uses Inter Variable at **custom weights ~510/590**. ([Linear teardown](https://github.com/voltagent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md))

### Fonts
- **Stripe:** **Söhne** (Klim Type Foundry) across marketing, Dashboard, docs — incl. **Söhne Mono** for code/numerics. ([Klim](https://klim.co.nz/fonts/soehne/), [Typewolf](https://www.typewolf.com/sohne))
- **Vercel:** custom **Geist Sans + Geist Mono** (not Inter). ([geist/typography](https://vercel.com/geist/typography))
- **Linear:** **Inter** body + **Inter Display** headings. ([Linear redesign](https://linear.app/now/how-we-redesigned-the-linear-ui))
- **Atlassian:** Atlassian Sans (UI) + Atlassian Mono. ([typography](https://atlassian.design/foundations/typography))
- **M3:** Roboto. **Notion:** Inter/system stack. ([fontgeneratorr](https://fontgeneratorr.com/blog/what-font-does-notion-use/))

### Tabular numbers (critical for dashboards)
- **Stripe:** money/counts use `font-feature-settings:"tnum"` + tightened tracking so digits column-align — "financial DNA." ([Typewolf](https://www.typewolf.com/sohne), craft analysis [Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui))
- **Geist:** flags tabular numbers for data/label styles; Geist Mono for the `*-mono` variants. ([geist/typography](https://vercel.com/geist/typography))
- **Retool/Height:** dense grids rely on tabular/mono numerals for column alignment (standard dense-grid practice). ([Retool](https://retool.com/blog/redesigned-ui-component-library))

### Max line length / scale discipline
- Premium products keep to **4–6 type sizes max**. ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)) None of the studied systems publish a numeric measure; the convention for prose is **~60–75ch**.

---

## 3. COLOR

### Neutral ramp design
- **Tailwind v4** ships 5 neutral ramps (slate/gray/zinc/neutral/stone) of **11 steps** (50→950), all in **OKLCH** for wide gamut and perceptually-even lightness. `neutral` is pure chroma-0: 50 `oklch(98.5% 0 0)` → 950 `oklch(14.5% 0 0)`. ([docs/colors](https://tailwindcss.com/docs/colors))
- **Geist:** 10-step opaque gray (`gray-100` `#f2f2f2` → `gray-1000` `#171717`) **plus a parallel alpha gray** (`#0000000d`→`#000000e8`) for overlays. Only **2 backgrounds**: `background-100` `#fff`, `background-200` `#fafafa`. ([design.md](https://vercel.com/design.md))
- **Radix:** the canonical **12-step accessible scale** (see below) across 30 hues, each in light/light-alpha/dark/dark-alpha. ([scales](https://www.radix-ui.com/colors/docs/palette-composition/scales))
- **Atlassian:** light & dark neutral ramps (`Neutral0..1200`, 13 steps) + alpha variants; dark maps by symmetry (`Neutral100`↔`DarkNeutral100`). ([color-palette](https://atlassian.design/foundations/color/color-palette))
- **Notion** `[TEARDOWN]`: **warm grays, not pure black**, to reduce eye strain; hierarchy from subtle tonal shifts. ([getdesign.md](https://getdesign.md/notion/design-md))

### The Radix 12-step scale — the accessibility-by-construction model (steal this)
Each step has a **fixed job**, identical in light and dark, so components built on step numbers stay WCAG-compliant automatically ([understanding-the-scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)):

| Step | Role |
|---|---|
| 1 | App background |
| 2 | Subtle background (striped rows, cards, sidebars) |
| 3 | UI element background (default) |
| 4 | Hovered UI element background |
| 5 | Active / selected UI element background |
| 6 | Subtle borders & separators (non-interactive) |
| 7 | UI element border & **focus rings** |
| 8 | Hovered UI element border (strongest border) |
| 9 | **Solid** background (buttons/badges, best chroma) |
| 10 | Hovered solid |
| 11 | Low-contrast text (secondary, ~4.5:1 on 1–5) |
| 12 | High-contrast text (primary/headings) |

Geist encodes the **same idea positionally**: steps **1–3 backgrounds, 4–6 borders, 7–8 solid fills, 9–10 text**. ([geist/colors](https://vercel.com/geist/colors))

### Accent usage discipline
- **Linear:** a **single** lavender-blue accent `#5e6ad2` `[TEARDOWN]`, used "scarcely on brand mark, focus, and the primary CTA"; system deliberately **de-saturated** ("less blue chrome… warmer gray… more neutral and timeless"). ([Linear redesign](https://linear.app/now/how-we-redesigned-the-linear-ui), [refresh](https://linear.app/now/behind-the-latest-design-refresh))
- **Stripe:** mostly neutrals + measured indigo (`#635bff`); color carries meaning (red=danger, green=success, indigo=primary) — "this restraint reads as confidence." ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui))
- **Geist:** stark `#171717` ink + white; 7 accent scales but blue reserved for focus/links, red for error, amber for warn. ([geist/colors](https://vercel.com/geist/colors))
- **shadcn default:** primary is a **near-black neutral** (`oklch(0.205 0 0)`), not a hue — maximum restraint. ([theming](https://ui.shadcn.com/docs/theming))

### Stripe's accessible color science (the methodology to cite)
From ["Designing accessible color systems"](https://stripe.com/blog/accessible-color-systems):
- Built on **CIELAB (perceptual lightness)**, rejecting HSL ("flawed lightness") and darken/lighten tinting ("dull, muted").
- Colors arranged into discrete **lightness levels**; **any two colors ≥5 levels apart are guaranteed AA for small text, ≥4 for icons/large text** — accessibility is structural, not per-screen QA.
- Goals: predictable accessibility, vibrant hues, **consistent visual weight across hues** (no hue dominates at a given level).

### Semantic colors
Everyone names the same roles: **success/green, warning/amber, danger/red, info/blue**, plus brand/primary. Atlassian's set: neutral, brand, information, success, warning, danger, discovery, accent, inverse, input. ([color](https://atlassian.design/foundations/color)) M3: primary/secondary/tertiary/error families each with container + `on-*` pairs. ([m3 roles](https://m3.material.io/styles/color/roles))

### Elevation: shadow vs border vs contrast
- **Linear:** "Structure should be felt not seen" — depth from a **surface ladder + 1px hairlines, essentially no shadows on dark**. ([refresh](https://linear.app/now/behind-the-latest-design-refresh)) Dark surface ladder `[TEARDOWN]`: `#010102→#0f1011→#141516→#18191a`.
- **M3:** **tonal elevation** — overlay a primary-derived tint at rising opacity (`surface-container-low→…→highest`) instead of/alongside shadows. ([m3 elevation](https://m3.material.io/styles/elevation/tokens))
- **Atlassian (dark):** higher elevation = **lighter surface**, not stronger shadow. ([elevation](https://atlassian.design/foundations/elevation))
- **Geist:** background-contrast + 1px borders, with **whisper-soft layered shadows** (max alpha 0.06) for popovers/modals. ([design.md](https://vercel.com/design.md))

**Pattern: in light mode use faint layered shadows + hairline borders; in dark mode drop shadows and express depth with a lighter surface / tonal step.**

### Dark mode token strategy
- **Semantic tokens stay theme-agnostic; only their resolved values swap.** Radix steps keep the same role across themes ([Radix](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)); Atlassian remaps every token per theme ([color-palette](https://atlassian.design/foundations/color/color-palette)); Geist's `--ds-*` tokens are one API across themes ([geist/colors](https://vercel.com/geist/colors)).
- **Linear generates the entire theme in LCH from 3 inputs** — base color, accent, contrast — collapsing "98 variables per theme." ([Linear redesign](https://linear.app/now/how-we-redesigned-the-linear-ui))
- **shadcn dark borders** use **white at low alpha**: `--border: oklch(1 0 0 / 10%)`, `--input: ...15%`. ([theming](https://ui.shadcn.com/docs/theming))

---

## 4. RADIUS / BORDERS / ELEVATION

### Radius (exact values)

| System | Controls | Cards / menus | Modals / large | Source |
|---|---|---|---|---|
| **Geist** | sm **6px** | md **12px** | lg **16px**, full 9999 | [design.md](https://vercel.com/design.md) |
| **Atlassian** | `radius.medium` **6px** (buttons/inputs) | large **8px** (cards/menus) | xlarge **12px** (modals/tables) | [radius](https://atlassian.design/foundations/radius) |
| **Tailwind** | sm 4 / md 6 | lg 8 / xl 12 | 2xl 16 / 3xl 24 | [border-radius](https://tailwindcss.com/docs/border-radius) |
| **shadcn** | base `--radius` **10px** (0.625rem); sm/md/lg/xl via `calc()` | one token drives all | [theming](https://ui.shadcn.com/docs/theming) |
| **Linear** `[TEARDOWN]` | 4/6/8px | **cards 12px** | 16/24px | [teardown](https://github.com/voltagent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md) |
| **M3** | xs 4 / sm 8 | md 12 / lg 16 | xl 28, full pill | [m3 shape](https://m3.material.io/styles/shape/corner-radius-scale) |

**Consensus: controls 6–8px, cards 8–12px, modals 12–16px.** Atlassian adds **focus radius = element radius +2px** so the ring nests cleanly. ([radius](https://atlassian.design/foundations/radius))

### Borders
- **1px hairline is the default** everywhere; **2px** reserved for selected/focused. ([Atlassian border](https://atlassian.design/foundations/border))
- Borders drawn from **neutral steps 6–8** of the ramp (Radix/Geist convention). Dark mode = **white at ~8–15% alpha** (shadcn). The **hairline border is the single most-cited "premium" tell** (Linear, Stripe, Geist).

### Elevation / shadow recipes (exact)

**Tailwind** (two-layer, low-alpha — the realistic-elevation recipe) ([box-shadow](https://tailwindcss.com/docs/box-shadow)):
```
xs   0 1px 2px 0 rgb(0 0 0 / 0.05)
sm   0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
md   0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
lg   0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
xl   0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
2xl  0 25px 50px -12px rgb(0 0 0 / 0.25)
```

**Geist** (even softer — note max alpha 0.06) ([design.md](https://vercel.com/design.md)):
```
card     0 2px 2px rgba(0,0,0,0.04)
popover  0 1px 1px rgba(0,0,0,0.02), 0 4px 8px -4px rgba(0,0,0,0.04), 0 16px 24px -8px rgba(0,0,0,0.06)
modal    0 1px 1px rgba(0,0,0,0.02), 0 8px 16px -4px rgba(0,0,0,0.04), 0 24px 32px -8px rgba(0,0,0,0.06)
focus    0 0 0 2px #fff, 0 0 0 4px #006bff   (2px white gap + 2px blue stroke)
```

**Atlassian raised** (two-layer, ambient+key over near-black `#091E42`, not pure black) ([forum](https://community.developer.atlassian.com/t/bug-in-elevation-token-raised-box-shadow/73641)):
```
raised   0 1px 1px #091E4240, 0 0 1px #091E424F
```

**M3** levels 0–5 = 0/1/3/6/8/12dp, but prefers **tonal overlay** over drop shadow. ([m3 elevation](https://m3.material.io/styles/elevation/tokens))

**Takeaway:** elevation shadows are **multi-layer, very low alpha (0.02–0.10), tinted toward the
neutral ink (not pure black), with negative spread** on outer layers. A focus ring = a 2px offset
outline (often a white gap + accent stroke).

---

## 5. WHAT MAKES THEM FEEL PREMIUM (the concrete craft)

1. **Hairline borders over fills/heavy shadows.** Linear's "structure felt not seen" ([refresh](https://linear.app/now/behind-the-latest-design-refresh)); Geist's 1px borders + ≤0.06-alpha shadows ([design.md](https://vercel.com/design.md)); Stripe-class UIs favor "0.5–1px borders at low alpha." ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui))
2. **Restrained, single accent.** Linear's lone `#5e6ad2` on brand/focus/primary only; system de-saturated for a "neutral, timeless" feel ([Linear](https://linear.app/now/how-we-redesigned-the-linear-ui)). Stripe: "restraint reads as confidence." shadcn default primary is literally a neutral.
3. **Accessible color as structure, not QA.** Stripe's CIELAB "5 levels apart = AA" guarantee ([Stripe](https://stripe.com/blog/accessible-color-systems)); Radix's 12-step contract ([Radix](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)).
4. **Tabular figures on every number.** Stripe `tnum` for money column-alignment ([Typewolf](https://www.typewolf.com/sohne)); dense grids in Retool/Height.
5. **Optical alignment & tightened tracking.** Linear "aligning labels, icons, buttons vertically and horizontally — felt after a few minutes" ([Linear](https://linear.app/now/how-we-redesigned-the-linear-ui)); Radix/Geist apply **negative letter-spacing that grows with size**.
6. **Instant / optimistic interactions.** Linear: "no spinners because there is nothing to wait for"; local mutation first (IndexedDB), sync async; per-cell re-renders; animation durations "well below industry norm." ([performance.dev](https://performance.dev/how-is-linear-so-fast-a-technical-breakdown)) Geist motion: 0ms default, ~150ms state, 200ms popover, 300ms modal, easing `cubic-bezier(0.175,0.885,0.32,1.1)`, honors `prefers-reduced-motion`. ([design.md](https://vercel.com/design.md))
7. **Keyboard-first density.** Linear & Height: command palette one keystroke away, ~100 shortcuts, bulk multi-select. ([Height review](https://freshvanroot.com/blog/height-app-review/))
8. **Consistent density + calm neutrals.** Notion's "warm minimalism": warm grays, medium-weight type, generous full-row hit targets, 8px soft surfaces. ([getdesign.md](https://getdesign.md/notion/design-md))
9. **Custom/precise typography.** Stripe's Söhne and Vercel's Geist Sans give an "engineered voice" generic Inter doesn't.

---

## 6. TOKEN ARCHITECTURE (primitive → semantic → component)

The universal pattern is **three layers**. The two best-documented exemplars:

### Material 3 — explicit 3-tier ([m3 design-tokens](https://m3.material.io/foundations/design-tokens))
- **Reference `md.ref.*`** — raw primitives (hex, px, font). e.g. `md.ref.palette.primary40`.
- **System `md.sys.*`** — semantic decisions referencing ref. e.g. `md.sys.color.primary`, `md.sys.color.surface-container-high`, `md.sys.typescale.body-large`, `md.sys.elevation.level2`, `md.sys.shape.corner.medium`.
- **Component `md.comp.*`** — per-component, mapping to a system token. e.g. `md.comp.filled-button.container-color → md.sys.color.primary`.
- Chain: **component → system → reference**. Color roles use the **`on-*` convention** (`primary`/`on-primary`) where the `on-` token is guaranteed legible on its pair.

### Atlassian — `[foundation].[property].[modifier]` ([design-tokens](https://atlassian.design/foundations/tokens/design-tokens))
- **foundation** (color/space/elevation…) · **property** (background/border/text/icon/surface/shadow) · **modifier** (role + emphasis + state).
- Worked example: `color.background.danger.bold.hovered` = property `background`, role `danger`, emphasis `bold`, state `hovered`.
- Emphasis ladder: **bold / default / subtle / subtlest.** Guidance is **semantic-first**: "choose tokens by meaning, not because the color matches" (matching by value breaks other themes).

### shadcn / Tailwind — the practical web implementation ([theming](https://ui.shadcn.com/docs/theming))
- **Primitive layer = Tailwind** scale-keyword vars: `--color-*`, `--spacing`, `--text-*`, `--radius-*`, `--shadow-*` (all OKLCH/`calc()` derived from one base). ([Tailwind theme](https://tailwindcss.com/docs/theme))
- **Semantic layer = shadcn** surface/`-foreground` **pairs**: `--background/--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, plus `--chart-1..5` and `--sidebar*`.
- shadcn's stated rule (verbatim): *"the base token controls the surface color and the `-foreground` token controls the text/icon color on that surface."* One `--radius` (0.625rem) drives sm/md/lg/xl via `calc()`.

### Geist — `--ds-[scale]-[step]` ([geist/colors](https://vercel.com/geist/colors))
Primitive scales (`--ds-gray-100..1000`, `--ds-blue-700`…) where **meaning is positional** (step number = role), plus component tokens (`button-primary`, `input-small`) bundling padding+height+type+color.

### Linear — generative ([Linear redesign](https://linear.app/now/how-we-redesigned-the-linear-ui))
Inverts the others: instead of enumerating tokens, **compute the whole theme in LCH from {base, accent, contrast}** via hue/chroma/lightness controls.

---

## 7. RECOMMENDED SYSTEM — EXACT VALUES

Opinionated synthesis for a **premium clean-SaaS dashboard**. Implement as CSS custom properties in
a **primitive → semantic → component** layering (shadcn/Tailwind mechanics, Atlassian/M3 naming
discipline, Radix step semantics).

### 7.1 Spacing — 4px base
`0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`
*(4px base is the cross-industry consensus — Geist/Tailwind/Radix/Linear; 2/6px quarter-steps from Atlassian for fine control.)*
- **Control heights:** sm **32**, md **40** (default), lg **48px** (Geist; M3 48dp touch target).
- **Card padding 20–24px; section gap 32–40px; input padding 8×12.**
- **Data tables:** row height 36–40px, cell pad 8–12px (dense-tool practice: Retool/Linear).

### 7.2 Type scale — size / line-height / weight / tracking
Base body **14px/20** (Atlassian + M3 default UI body), prose **16px/24**. Inter or Geist Sans; tabular numerals on all data.

| Token | Size/LH | Weight | Tracking |
|---|---|---|---|
| display | 36/40 | 600 | −0.02em |
| h1 | 28/36 | 600 | −0.015em |
| h2 | 24/32 | 600 | −0.01em |
| h3 | 20/28 | 600 | −0.005em |
| h4 | 16/24 | 600 | 0 |
| body-lg | 16/24 | 400 | 0 |
| **body (default)** | **14/20** | 400 | 0 |
| body-sm | 13/18 | 400 | 0 |
| caption | 12/16 | 400/500 | +0.005em |
| **metric (KPI)** | **28/32** | 600 | 0, **tabular** |
*(Negative tracking growing with size = Radix/Geist optical correction. Dedicated metric token = Atlassian. Keep to ≤6 sizes — Mantlr. Prose measure ~65ch.)*
- **Weights:** 400 / 500 / 600 (add 700 only for emphasis). **Always `font-variant-numeric: tabular-nums`** on tables, metrics, currency (Stripe).

### 7.3 Neutral ramp — perceptually-even, slightly warm, OKLCH
Use a **single 12-step neutral** with Radix step semantics, defined in OKLCH (Tailwind v4 / shadcn). Steps: `1 app-bg · 2 subtle-bg · 3 control-bg · 4 hover · 5 active · 6 subtle-border · 7 border/focus-ring · 8 strong-border · 9 solid · 10 solid-hover · 11 secondary-text · 12 primary-text`.
Lightness anchors (chroma ~0.004, hue ~250 for a faintly cool-neutral, or hue ~60 + chroma 0.006 for Notion-warm):
`98.5% · 97% · 95% · 93% · 90% · 88% · 82% · 70% · 44% · 40% · 55% · 18%` (light mode L values).
- **Backgrounds:** only 2 page surfaces — base `#fff` + subtle `#fafafa` (Geist discipline).
- **Borders:** 1px from step 6 (subtle) / step 7 (interactive). Dark mode: white at **8–12% alpha** (shadcn).

### 7.4 Accent & semantics — one accent, used scarcely
- **One brand accent** (e.g. indigo `oklch(0.55 0.18 265)` ≈ Stripe/Linear family), used only on **primary action, links, focus ring, active nav** (Linear discipline). Everything else neutral.
- **Semantic:** success (green), warning (amber), danger (red), info (blue) — each a Radix-style 12-step scale; use step 9 for solids, 11–12 for text. Guarantee **≥4.5:1 text / 3:1 large** by construction (Stripe levels / Radix steps).

### 7.5 Radius
`control 6px · card 8px · panel/modal 12px · pill 9999`. One base `--radius: 8px`; derive others via `calc()` (shadcn). **Focus ring radius = element radius + 2px** (Atlassian).

### 7.6 Borders & elevation
- **Border:** 1px default, 2px selected/focus. Color = neutral step 6/7.
- **Light-mode shadows (very low alpha, multi-layer, tinted to ink not pure black):**
  ```
  card     0 1px 2px 0 rgb(16 18 27 / 0.04)
  raised   0 1px 3px 0 rgb(16 18 27 / 0.06), 0 1px 2px -1px rgb(16 18 27 / 0.06)
  popover  0 4px 8px -4px rgb(16 18 27 / 0.05), 0 16px 24px -8px rgb(16 18 27 / 0.06)
  modal    0 8px 16px -4px rgb(16 18 27 / 0.05), 0 24px 32px -8px rgb(16 18 27 / 0.07)
  ```
  *(Pattern from Geist + Atlassian + Tailwind: layered, ≤0.07 alpha, negative spread, ink-tinted.)*
- **Dark mode:** **no shadows** — express depth with a **lighter surface step** (Atlassian/Linear/M3 tonal). Surface ladder e.g. `#0e0e10 → #16161a → #1c1c21 → #232329`.
- **Focus ring:** `0 0 0 2px var(--bg), 0 0 0 4px var(--accent)` (Geist white-gap + accent stroke).

### 7.7 Motion
Instant default; state ~120–150ms, popovers ~200ms, modals ~250–300ms; easing `cubic-bezier(0.175,0.885,0.32,1.1)`; honor `prefers-reduced-motion`; prefer compositor-only props (transform/opacity). (Geist + Linear.)

### 7.8 Token layering (implement exactly this)
1. **Primitive** — `--neutral-1..12`, `--accent-1..12`, `--green/amber/red-1..12`, `--space-*`, `--text-*`, `--radius-*`, `--shadow-*` (OKLCH + `calc()`, one base each).
2. **Semantic** — surface/`-foreground` pairs + roles: `--background/--foreground`, `--surface/--surface-2`, `--card`, `--popover`, `--primary/--primary-foreground`, `--muted/--muted-foreground`, `--border`, `--input`, `--ring`, `--success/--warning/--danger/--info` (each w/ `-foreground`). Use the **`on-*`/`-foreground` convention** so every surface ships its legible text color (M3/shadcn).
3. **Component** — `--button-*`, `--input-*`, `--card-*` bundling padding+height+radius+color, mapping to semantic tokens (Geist/M3 `comp` layer).
**Dark mode = re-resolve semantic tokens only;** primitives & components never change references (Radix/Atlassian/Geist).

---

## 8. SOURCE INDEX
- Vercel Geist: [design.md](https://vercel.com/design.md) · [colors](https://vercel.com/geist/colors) · [typography](https://vercel.com/geist/typography) · [spacing](https://vercel.com/geist/spacing)
- Linear: [how-we-redesigned-the-linear-ui](https://linear.app/now/how-we-redesigned-the-linear-ui) · [behind-the-latest-design-refresh](https://linear.app/now/behind-the-latest-design-refresh) · [performance.dev teardown](https://performance.dev/how-is-linear-so-fast-a-technical-breakdown) · [DESIGN.md teardown](https://github.com/voltagent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md) `[TEARDOWN]`
- Stripe: [accessible-color-systems](https://stripe.com/blog/accessible-color-systems) · [Söhne / Klim](https://klim.co.nz/fonts/soehne/) · [Typewolf](https://www.typewolf.com/sohne) · [Mantlr premium-UI analysis](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)
- Tailwind: [theme](https://tailwindcss.com/docs/theme) · [colors](https://tailwindcss.com/docs/colors) · [font-size](https://tailwindcss.com/docs/font-size) · [box-shadow](https://tailwindcss.com/docs/box-shadow) · [border-radius](https://tailwindcss.com/docs/border-radius)
- Radix: [understanding-the-scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) · [scales](https://www.radix-ui.com/colors/docs/palette-composition/scales) · [themes/typography](https://www.radix-ui.com/themes/docs/theme/typography) · [themes/spacing](https://www.radix-ui.com/themes/docs/theme/spacing) · [themes/radius](https://www.radix-ui.com/themes/docs/theme/radius)
- shadcn/ui: [theming](https://ui.shadcn.com/docs/theming)
- Atlassian: [spacing](https://atlassian.design/foundations/spacing) · [typography](https://atlassian.design/foundations/typography) · [color](https://atlassian.design/foundations/color) · [color-palette](https://atlassian.design/foundations/color/color-palette) · [radius](https://atlassian.design/foundations/radius) · [border](https://atlassian.design/foundations/border) · [elevation](https://atlassian.design/foundations/elevation) · [design-tokens](https://atlassian.design/foundations/tokens/design-tokens) · [raised shadow value](https://community.developer.atlassian.com/t/bug-in-elevation-token-raised-box-shadow/73641)
- Material 3: [design-tokens](https://m3.material.io/foundations/design-tokens) · [color roles](https://m3.material.io/styles/color/roles) · [type-scale-tokens](https://m3.material.io/styles/typography/type-scale-tokens) · [TypeScaleTokens.kt](https://cs.android.com/androidx/platform/frameworks/support/+/androidx-main:/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/TypeScaleTokens.kt) · [elevation](https://m3.material.io/styles/elevation/tokens) · [shape](https://m3.material.io/styles/shape/corner-radius-scale) · [spacing](https://m3.material.io/foundations/layout/understanding-layout/spacing)
- Notion `[TEARDOWN]`: [getdesign.md](https://getdesign.md/notion/design-md) · [sidebar breakdown](https://medium.com/@quickmasum/ui-breakdown-of-notions-sidebar-2121364ec78d) · [font](https://fontgeneratorr.com/blog/what-font-does-notion-use/)
- Height `[TEARDOWN]`: [review](https://freshvanroot.com/blog/height-app-review/) · [overview](https://help.height.app/en/articles/3606831-height-overview)
- Retool: [redesigned-ui-component-library](https://retool.com/blog/redesigned-ui-component-library) · [design guidance](https://docs.retool.com/center-of-excellence/well-architected/design)

> **Sourcing caveats:** Linear publishes no token spec — all numeric Linear values are `[TEARDOWN]`
> (directionally correct, not official); its *principles, fonts, LCH/3-variable strategy, and speed
> claims are official. Stripe publishes no global spacing/radius/shadow tokens — only the color
> methodology and Söhne are first-party; spacing/radius are inferred. Notion/Height have no public
> spec. Geist (design.md), Tailwind, Radix, shadcn, Atlassian, and M3 values are official/exact.
