# 02 — Layout, Spacing & Depth

How anything gets arranged on screen. Every number here maps to a Tailwind token.

---

## A. Visual hierarchy (the most important skill)

1. **Nothing is equal by default — decide.** For every element, choose: primary,
   secondary, or tertiary. Most "flat/boring" screens lack hierarchy, not color.
2. **Weight + color before size.** Vary font weight and text color first; reach
   for size last. Three text tiers:
   - Primary: near-black / high contrast, semibold.
   - Secondary: medium gray, normal.
   - Tertiary: light gray, normal.
3. **Two weights, two colors > five sizes.** A screen usually needs only
   normal + semibold and a dark + a gray to read clearly.
4. **Emphasize by de-emphasizing.** To make one thing pop, mute its neighbors
   rather than shouting it louder.
5. **One dominant action per view.** Primary = solid high-contrast button;
   secondary = outline/ghost; tertiary/destructive = link-style until it matters.
   Never three equal-weight actions.
6. **Labels are a last resort.** If format or position implies meaning, drop the
   label ("@user", not "Twitter: @user"). When you must show label + value,
   emphasize whichever the user scans for (usually the value).
7. **Semantics ≠ size.** An `<h1>` need not be the biggest thing; the content can
   be the star.

---

## B. Spacing — the 4/8-point system (hard rule)

8. **Only legal spacing values** (Tailwind scale = the 4/8 system):
   `4, 8, 12, 16, 24, 32, 48, 64, 96` px → `1, 2, 3, 4, 6, 8, 12, 16, 24`.
   No arbitrary values. `p-[13px]` is a bug.

   | Level | Values (px) | For |
   |---|---|---|
   | Small | 4 / 8 / 12 | inner padding, tiny/related elements |
   | Medium | 16 / 24 / 32 / 48 | components, related groups |
   | Large | 64 / 96 | section breaks |

9. **No ambiguous spacing (Law of Proximity).** Space *within* a group must be
   clearly smaller than space *between* groups. A label hugs its own field
   (`gap-2`), the next field group sits further away (`gap-6`+). Ambiguous
   spacing is the #1 cause of "something feels off."
10. **Start with too much whitespace, then remove.** Cramped is the default sin.
    Whitespace is a feature, not waste. *(Refactoring UI, ch. 3.)*
10b. **Dense UIs are a deliberate exception, not a default.** Dashboards and the
    Khata/ledger legitimately pack more in — but density is a *chosen* decision
    for a data-heavy surface, never the accidental result of cramming. Everywhere
    else, breathe.
10c. **The scale is non-linear on purpose:** small values sit close together
    (4/8/12/16) and spread out as they grow (…48/64/96). Built from a ~16px base.
    A linear scale (4/8/12/16/20/24…) gives too few useful large gaps.
11. **Give content a `max-width`.** Don't stretch a form or article to 1600px.
    Reading content caps around `max-w-2xl`/`max-w-3xl`; forms narrower.

---

## C. Layout & grids

12. **Grids align; they don't have to stretch everything.** Some elements have an
    ideal fixed size — set it. Use fluid/percentage widths only where fluidity
    genuinely helps.
13. **Align to a grid, vertically and horizontally.** Misalignment reads as
    sloppy even when nothing else is wrong. Use consistent column/gutter widths.
14. **Relative sizing doesn't scale across breakpoints.** A heading 2× the body
    on desktop should not stay 2× on mobile — shrink large text faster than small
    text (see file 03; use `clamp()` / responsive classes).
15. **Overlap to create depth and tie sections** (an avatar straddling a card
    edge, an image crossing a section boundary) — used sparingly.

---

## D. Depth & elevation

16. **Light comes from above.** Top edges catch light; bottoms cast shadow. Every
    shadow obeys this mental model. *(Refactoring UI, ch. 6.)*
    - **Raised** (button, card): lighter top edge + a darker shadow *beneath*.
    - **Inset** (input, well): darker top edge + a shadow *above* (recessed).
17. **Elevation is a system, not random blurs.** Define tiers and use only these:

    | Tier | Use | Tailwind-ish |
    |---|---|---|
    | flat | page, base cards | none / `shadow-none` |
    | raised | interactive card, button | `shadow-sm` |
    | overlay | dropdown, popover | `shadow-md` |
    | modal | dialog, sheet | `shadow-lg` |
    | toast | transient top layer | `shadow-xl` |

18. **Two shadows per elevation read as real:** a tight dark contact shadow + a
    larger soft ambient one. (shadcn's shadows already approximate this — keep it
    consistent, don't invent one-off blurs.)
19. **Small shadow = "slightly raised / interactive"; large shadow = "floating,
    temporary."** Match the shadow to the intent.
20. **Flat can still have depth** via color layers — a lighter card on a slightly
    darker page — instead of shadows.

---

## E. Prefer spacing over borders

21. **Use fewer borders.** To separate things, in order of preference:
    (a) more spacing, (b) a subtle background-color difference, (c) a soft
    shadow — *then* a hard line only if still needed. Too many borders = noise.

---

## Checklist (run before "done")

- [ ] Every element assigned a hierarchy tier (primary/secondary/tertiary)?
- [ ] Exactly one dominant action; others de-emphasized?
- [ ] Every margin/padding/gap is a scale value (no arbitrary px)?
- [ ] Space *within* groups < space *between* groups?
- [ ] Content has a sensible `max-width`; generous whitespace?
- [ ] Elements aligned to a grid?
- [ ] Shadows come from the elevation tiers, not one-offs?
- [ ] Reads clearly in grayscale before any color?
