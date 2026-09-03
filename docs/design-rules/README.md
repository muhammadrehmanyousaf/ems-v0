# Design Rules — WeddingWala Revamp

A working ruleset for the UI/UX revamp. **These are rules, not suggestions.**
Each file is numbered and checkable; during the revamp, open the relevant file
and verify the screen against it before calling it done.

## The files

| File | Covers | Use when |
|---|---|---|
| [01-foundations.md](01-foundations.md) | Nielsen's 10 heuristics + Laws of UX | Deciding *what* a screen should do |
| [02-layout-and-spacing.md](02-layout-and-spacing.md) | Hierarchy, spacing scale, grids, whitespace, depth | Laying out any screen |
| [03-typography.md](03-typography.md) | Type scale, line-height, measure, weight | Any text |
| [04-color-and-contrast.md](04-color-and-contrast.md) | Palette system, HSL, semantic color, WCAG AA | Any color decision |
| [05-components-and-states.md](05-components-and-states.md) | Buttons, cards, forms, inputs, empty/loading/error | Building components |
| [06-accessibility-and-motion.md](06-accessibility-and-motion.md) | WCAG, keyboard, focus, touch targets, animation | Interaction + a11y |
| [07-content-nav-booking.md](07-content-nav-booking.md) | UX writing, navigation/IA, booking conversion | Copy, menus, the booking flow |
| [08-psychology-persuasion.md](08-psychology-persuasion.md) | Social proof, scarcity, biases, the dark-pattern ban | Trust, motivation, pricing, reviews |

## The one rule above all rules

> **Reduce the effort a real person spends to get what they came for.**
> When two options tie, pick the one that makes the user's next action more
> obvious and less work. Beauty serves this — it never overrides it.

## Our stack (design against it, not around it)

- **Next.js 14 (App Router) · React 18 · Tailwind CSS 3.4**
- **shadcn/ui** on **Radix primitives** (63 components already in `components/ui/`)
- **framer-motion** (motion) · **lucide-react** (icons) · **sonner** (toasts) ·
  **cmdk** (command) · **vaul** (drawer) · **react-hook-form** (forms)
- Themeable via `next-themes` (light/dark) and CSS tokens.

**Consequence:** every rule below maps to a Tailwind token or a shadcn component.
We add values to the theme, we don't hand-write magic numbers in JSX.

## The spacing token map (memorize this)

The 4/8-point system, expressed as Tailwind's default scale. **Only these values
are legal** for margin/padding/gap.

| Tailwind | px | Use for |
|---|---|---|
| `1` | 4 | icon gaps, tiny inner padding |
| `2` | 8 | inner padding, related tiny elements |
| `3` | 12 | small gaps |
| `4` | 16 | default component padding, related items |
| `6` | 24 | card padding, grouped components |
| `8` | 32 | between components |
| `12` | 48 | large component separation |
| `16` | 64 | between sections |
| `24` | 96 | major section breaks |

Never `p-[13px]`, never `mt-[27px]`. If a value isn't on the scale, the layout
is wrong, not the scale.

## How to use these during the revamp

1. **Before pixels:** read [01-foundations.md](01-foundations.md) — settle the
   flow and the one primary action.
2. **While building:** keep [02](02-layout-and-spacing.md)–[05](05-components-and-states.md)
   open; every number comes from a scale, never from instinct.
3. **Before "done":** run the checklist at the bottom of each relevant file, plus
   [06-accessibility-and-motion.md](06-accessibility-and-motion.md) always.

## Sources & grounding

**These rules were validated against the actual source documents**, not just
their summaries. On 2026-08-30 the five documents the team shared (paywalled to
`WebFetch`) were opened in a headed browser and their rendered text extracted and
**read in full**:

1. *The Design Process in UI/UX* (UCD course) — confirmed Part 2 / file 01.
2. *Introduction to UI/UX* — fundamentals / file 01.
3. **Refactoring UI** (Wathan & Schoger, Bookey summary ch. 1–6, read fully) —
   every tactic in files 02–05 traced to its chapter; added *avoid `em`*,
   *dense-UIs-are-intentional*, *raised-vs-inset light*, *HSL≠HSB*.
4. **Psychology of UX Design** (Alok Kumar, BPB 2024, read in full) — the 7 Laws
   + 6 Effects (file 01) and the Gamification + Biases (**file 08**) come
   verbatim from its structure.
5. *UI/UX Design Guide* (J. P. Henderson) — terminology cross-check.

Also distilled from a live web sweep across authoritative sources:
Nielsen Norman Group ([heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/),
[visual design](https://www.nngroup.com/articles/principles-visual-design/),
[animation](https://www.nngroup.com/articles/animation-duration/)),
[Laws of UX](https://lawsofux.com/), Refactoring UI (Wathan & Schoger),
[WCAG 2.2](https://www.w3.org/TR/WCAG22/) / [WebAIM contrast](https://webaim.org/articles/contrast/),
[Baymard Institute](https://baymard.com/learn/checkout-flow-ux-optimization) (checkout),
[Smashing Magazine](https://www.smashingmagazine.com/) (typography, tap targets),
[web.dev](https://web.dev/articles/accessible-tap-targets), and the three team
infographics. Also see the narrative companion:
[../ui-ux-design-research.md](../ui-ux-design-research.md).
