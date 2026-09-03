# 06 — Accessibility, Touch & Motion

Run this file's checklist on **every** screen. Accessibility isn't a feature; it
determines whether the interface works for real hands, eyes, and devices.

---

## A. Touch targets (mobile is the majority for WeddingWala)

1. **Minimum tappable size 44×44px** (Apple / WCAG 2.5.5); **48×48px preferred**
   (Material). A 30px button roughly doubles error rates vs 44px.
2. **≥ 8px clear space between adjacent tap targets.** Crowded targets = rage taps.
3. **Hit area > visual size via invisible padding.** A control can *look* 36px but
   have a 44px tappable area (padding / a larger `::before`). The visual and the
   target are allowed to differ — the target wins.
4. **Thumb zone:** put primary actions in the **bottom third** on mobile
   (one-handed reach). Top-left is the hardest reach — don't put a primary action
   there. Sticky bottom bars for the key action on long screens.
5. **Increase targets for coarse pointers:** `@media (pointer: coarse)` — bump
   sizes for all touch devices, not just by breakpoint.

---

## B. Keyboard & focus

6. **Everything interactive is reachable and operable by keyboard** (Tab / Shift+
   Tab / Enter / Space / arrows for composite widgets). Radix components give this
   for free — don't break it with custom `div` handlers.
7. **Visible focus indicator, always.** Never `outline: none` without a
   replacement. Use `focus-visible` with a ≥ 3:1 contrast ring (file 04 rule 11).
8. **Logical focus order** follows visual order. Modals **trap focus** and return
   it to the trigger on close (Radix Dialog does this — keep it).
9. **No keyboard traps.** Every open thing (menu, dialog, drawer) closes on `Esc`.

---

## C. Screen readers & semantics

10. **Use real semantic elements:** `button` for actions, `a` for navigation,
    headings in order (`h1→h2→h3`, no skipping levels), lists for lists.
11. **Every input has an associated `<label>`** (not just a placeholder). Icon-only
    controls get `aria-label`.
12. **Images:** meaningful ones get `alt`; decorative ones get `alt=""`.
13. **Announce dynamic changes:** toasts / live validation use `aria-live` so a
    screen reader hears them (sonner handles this — verify it's not suppressed).
14. **Don't convey meaning by color, shape, or position alone** (file 04 rule 14).

---

## D. Motion & animation (framer-motion is installed — use it with discipline)

15. **Durations:**
    | Kind | Duration |
    |---|---|
    | Micro-interaction (hover, toggle, tap feedback) | ~100ms |
    | Standard transition (enter/exit, expand) | 200–300ms |
    | Inter-screen / large transition | ~300ms |
    | Never exceed | 500ms (feels sluggish); < 80ms feels broken |

16. **Easing:** `ease-out` for entrances (fast in, gentle rest), `ease-in` for
    exits, `ease-in-out` for on-screen moves. Avoid linear for UI.
17. **Animate only `transform` and `opacity`** — they're GPU-cheap. Animating
    layout/`width`/`top` causes jank.
18. **`prefers-reduced-motion` is mandatory.** When set, replace slides/zooms with
    a plain fade or an instant state change. ~35% of users benefit. In Tailwind:
    `motion-reduce:transition-none` / gate framer-motion with the
    `useReducedMotion()` hook.
19. **Motion serves meaning, not decoration.** Animate to show *where something
    came from / went to* or *what changed* — orient the user. Gratuitous motion
    reads as "AI-generated" and annoys. When unsure, less is more.
20. **Respond under 400ms (Doherty).** If real work takes longer, show a skeleton
    or optimistic state immediately — the *perceived* response is what counts.

---

## E. Responsive

21. **Design mobile-first;** the small screen forces priority. Enhance up, don't
    cram down.
22. **Content reflows to a single column on mobile;** no horizontal page scroll.
    Wide things (tables, code, charts) scroll inside their own `overflow-x-auto`
    container, never the page body.
23. **Relative sizing doesn't scale** — re-tune type/spacing per breakpoint
    (file 02 rule 14, file 03).

---

## Checklist (every screen)

- [ ] Tap targets ≥ 44px, ≥ 8px apart; primary action in thumb reach on mobile?
- [ ] Fully keyboard-operable; visible focus ring (≥ 3:1); Esc closes overlays?
- [ ] Real semantics (button/a/headings/labels); icon-only has aria-label?
- [ ] Dynamic messages announced (aria-live)?
- [ ] Animations 100–300ms, ease-out, transform/opacity only?
- [ ] `prefers-reduced-motion` respected everywhere?
- [ ] Mobile: single column, no horizontal page scroll, wide content scrolls itself?
- [ ] Contrast AA in both themes (cross-ref file 04)?
