# 04 — Color & Contrast

Color is the **last** layer (grayscale-first, file 01). When it goes on, it goes
on as a system.

---

## A. Build a real palette (not 3 hex codes)

1. **Reason in HSL, not hex.** Hue/Saturation/Lightness lets you predict what a
   change does; hex doesn't. (Tailwind theme + CSS vars — define once.)
   *(Refactoring UI, ch. 5.)* Note **HSL ≠ HSB**: "lightness" (HSL) is not
   "brightness" (HSB) — design tools default to HSB, but the browser speaks HSL,
   so author in HSL. *(Pragmatic caveat: our tokens ship as hex/oklch via the
   shadcn theme — reason in HSL, store in whatever the theme uses; keep one
   source of truth.)*
2. **You need more shades than you think.** A complete palette:
   - **Neutrals/greys:** 8–10 steps (near-black text → faint borders/backgrounds).
   - **Primary/brand:** 5–10 steps.
   - **Semantic accents:** success (green), warning (amber), error (red),
     info (blue) — each 5–10 steps.
3. **Define shades up front:** pick a base, then a darkest and lightest, then fill
   the middle. Don't `lighten()/darken()` on the fly at call sites.

---

## B. Greys have a temperature — choose on purpose

4. **Cool greys** (blue tint) feel crisp/technical; **warm greys** (yellow/red
   tint) feel soft/human. Pick one deliberately across the whole app.
5. **WeddingWala:** warm/premium brand → **warm greys** paired with the gold/brand
   accent. Neutrals should lean warm, never a dead pure `#808080`.

---

## C. Making colors feel vivid

6. **Lightness drives perceived vividness more than saturation.** To make a color
   "pop," rotate the hue toward a brighter neighbor (toward yellow/cyan) and
   lighten — don't just crank saturation (which muddies).

---

## D. Semantic color rules

7. **Semantic ≠ brand accent.** Success/warning/error/info are their own set,
   separate from the brand gold. Don't reuse the accent to mean "success."
8. **State colors are consistent everywhere:** the same red means error in a
   toast, a field, and a badge.

---

## E. Contrast — WCAG 2.2 Level AA (non-negotiable minimums)

9. **Normal text: ≥ 4.5:1** against its background.
10. **Large text: ≥ 3:1.** "Large" = ≥ 24px regular, or ≥ 18.66px (`~19px`) bold.
11. **UI components & meaningful graphics: ≥ 3:1** (borders of inputs, icons that
    carry meaning, focus indicators, chart keys).
12. **Placeholder text and disabled states still need to be perceivable** — don't
    drop them below legibility to look "subtle."
13. **On saturated/colored backgrounds:** prefer light text on a slightly-darkened
    version of the color, or rotate hue to hold contrast while staying vivid.
    (This is why gray-on-color fails — see file 03 rule 10.)

**How to check:** run text/background pairs through a contrast checker
(WebAIM). AA is the floor, not the target.

---

## F. Never rely on color alone (WCAG 1.4.1)

14. **Meaning is never carried by color only.** Pair every color signal with an
    icon, label, shape, or text. A red dot alone is invisible to ~8% of men.
    - Error field: red border **+** an error icon **+** the message text.
    - Status pill: color **+** the word ("Confirmed", "Cancelled").
    - Chart series: color **+** direct labels or patterns.

---

## G. Dark mode (the app themes via `next-themes`)

15. **Design both themes as a token set**, not a naive invert. Define tokens on
    `:root`, redefine under the dark selector — never define a color *only* in a
    dark block (it'll be missing in light).
16. **Re-check contrast in dark mode separately** — a pairing that passes in light
    can fail in dark. Both must hit AA.
17. **Keep the accent working on both grounds;** if gold vibrates on the dark
    background, shift lightness rather than swapping the hue.

---

## Checklist

- [ ] Colors come from defined palette steps (neutrals + primary + semantic)?
- [ ] Neutrals are warm (WeddingWala), not dead grey?
- [ ] Text ≥ 4.5:1 (normal) / 3:1 (large); UI elements ≥ 3:1?
- [ ] No meaning conveyed by color alone (icon/label/shape added)?
- [ ] Both light and dark themes pass AA; no color defined only in one theme?
- [ ] Semantic colors distinct from the brand accent, consistent app-wide?
