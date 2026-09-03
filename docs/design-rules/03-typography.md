# 03 — Typography

Most of the interface is text. If it isn't legible, nothing else matters.

---

## A. Type scale (hard rule)

1. **Sizes only from a fixed scale.** Never "somewhere between 20 and 24." Use:
   `12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72` px →
   Tailwind `xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl`.
2. **16px is the body-text floor** on web. Smaller than `14px` only for genuine
   captions/labels, never for reading content.
2b. **Never size fonts in `em`** (they compound relative to the parent — a
   heading inside a scaled container drifts). Use `rem` or `px` only. *(Refactoring
   UI, ch. 4: "Avoid em units.")* A **hand-crafted scale beats a pure modular
   scale** — modular ratios (4:5, golden) produce fractional px that render
   inconsistently across browsers; pick clean values instead.

---

## B. Line-height (leading)

3. **Body text: 1.4–1.6** (unitless). `1.5` is the safe default → Tailwind
   `leading-relaxed`/`leading-normal`.
4. **Headings: 1.1–1.25** — large type needs less breathing room → `leading-tight`.
5. **Tiny text (captions): 1.4–1.7** — small text needs *more* leading.
6. **Rule of thumb:** line-height is *proportional to line length* and *inverse to
   font size*. Wide or small text → taller leading; large headings → tighter.
7. **Paragraph spacing** between blocks ≈ 0.3–0.7× the line-height (don't double-space).

---

## C. Measure (line length)

8. **45–75 characters per line; ~66 is the sweet spot.** Control with a
   `max-width` in `ch` (e.g. `max-w-[68ch]`) or `max-w-prose`. Too-wide lines are
   the most common readability failure on desktop.

---

## D. Weight & color for hierarchy (from file 02)

9. **Prefer weight and color over size** to signal importance. Two weights
   (normal + semibold) and two text colors (dark + gray) carry most hierarchy.
10. **Don't put gray text on colored backgrounds.** Pick a color of the *same hue*
    as the background with adjusted lightness/saturation instead (see file 04).

---

## E. Letter-spacing (tracking)

11. **Body: 0.** Text faces are already spaced by their designer; adding tracking
    hurts paragraphs.
12. **Large headings: tighten slightly** (−1% to −2%) → `tracking-tight`.
13. **All-caps labels/eyebrows: loosen** (+5–10%) → `tracking-wide`/`wider`. All-caps
    is *only* for short labels, never for reading text.

---

## F. Alignment & numbers

14. **Left-align continuous text.** It gives every line a consistent start. Avoid
    justified (rivers of whitespace) and centered (for anything longer than ~2
    lines).
15. **Align mixed-size text on the baseline,** not the middle.
16. **Numbers in columns: right-align + tabular figures** (`font-variant-numeric:
    tabular-nums` → `tabular-nums`). Money, quantities, dates in tables must line
    up digit-for-digit. (WeddingWala Khata/ledger tables: mandatory.)

---

## G. Fonts

17. **Use a good, well-hydrated typeface** with many weights. Neutral sans-serifs
    are the safe default for UI; a characterful display face can carry a hero if
    used sparingly (WeddingWala already pairs a bridal display face with a body
    sans — keep that pairing consistent, don't add a third family).
18. **Always declare a real fallback stack**; never let a face fail silently to
    Times.

---

## Checklist

- [ ] Every font-size is a scale token (no arbitrary px)?
- [ ] Body ≥ 16px, line-height 1.4–1.6; headings tighter?
- [ ] Line length 45–75ch (max-width set)?
- [ ] Body letter-spacing 0; only large headings tightened, only caps loosened?
- [ ] Continuous text left-aligned?
- [ ] Numeric columns use tabular figures + right-align?
- [ ] No more than two type families; real fallback stack declared?
