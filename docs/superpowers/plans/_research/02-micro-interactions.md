# Micro-Interactions & Component States — Exhaustive Checklist

> Research artifact for the EMS / Wedding Wala UI quality bar. Goal: **zero missed micro-things**.
> Every common SaaS component is enumerated below with **every state it must define**, plus the
> cross-cutting micro-UX every product needs. Use as a per-component QA gate: if a component ships
> without an explicit decision for each applicable row, it is not done.

**How to read this:** ✅ = state almost always applies and is commonly forgotten; — = N/A for that component.
Treat "not applicable" as a deliberate decision, not an omission.

---

## 0. The canonical state vocabulary (Material Design 3 + WAI-ARIA)

Material Design 3 defines interaction states as **state layers** — a fixed-opacity overlay in the
content color, only one applied at a time, **additive** to selected/activated states.

| State | Trigger | MD3 state-layer opacity | Notes |
|---|---|---|---|
| **Enabled / default / resting** | none | 0% | The baseline. |
| **Hover** | pointer paused over element | **+8%** | Pointer only — never the sole affordance (no hover on touch). |
| **Focus (focus-visible)** | keyboard / voice / programmatic | **+10%** | Must be a *visible* ring. Use `:focus-visible`, not `:focus`, to avoid ring on mouse click. |
| **Pressed / active** | pointer-down / Enter / Space | **+10%** (+ ripple) | Fire on pointer-down for perceived speed; commit on pointer-up. |
| **Dragged** | press + move | **+16%** | Elevation/shadow increase; show drop targets + insertion line. |
| **Selected** | user choice persists | additive layer | Distinct from focus & from "active route". |
| **Activated / current** | current page/tab/nav route | additive | aria-current. |
| **Disabled** | not interactive | content **38%**, container ~12% | Not focusable, no hover/press; still needs *why* (tooltip/helper). |
| **Loading / pending** | async in flight | — | Spinner/skeleton + disable double-submit; keep label width stable. |
| **Error / invalid** | validation fail | — | aria-invalid, message via aria-describedby, not color-only. |
| **Success / valid** | validation pass / commit | — | Checkmark/confirmation; auto-dismiss. |
| **Indeterminate** | partial/unknown | — | Checkbox tri-state, indeterminate progress. |
| **Read-only** | viewable not editable | — | Distinct from disabled: focusable, copyable, in tab order. |
| **Empty** | no data yet | — | First-run / zero-state copy + primary action. |
| **Placeholder / skeleton** | structure known, data pending | — | Not a substitute for a label. |

Sources: [MD3 Applying states](https://m3.material.io/foundations/interaction/states/applying-states),
[MD3 State layers](https://m3.material.io/foundations/interaction/states/state-layers),
[WAI-ARIA states/properties](https://www.w3.org/WAI/ARIA/apg/).

---

## 1. Per-component state matrices

> **35 components enumerated.** Columns are the canonical states above (abbreviated).
> def=default, hov=hover, foc=focus-visible, act=active/pressed, sel=selected, dis=disabled,
> load=loading, err=error, ok=success, empty=empty, ind=indeterminate, drag=dragging, ro=read-only.

### Form / input controls

**1. Button**
- States: def ✅ · hov ✅ · **foc-visible** ✅ · **active/pressed** ✅ · **disabled** ✅ · **loading** ✅ · success ✅ · (sel for toggle buttons)
- Often forgotten: **loading state that preserves width** (no layout shift); **disabled needs a reason**; **double-click / double-submit guard**; **`:focus-visible` not `:focus`**; **`aria-disabled` vs `disabled`** (aria-disabled stays focusable so screen readers can explain why); minimum hit target **44×44 px (Apple) / 48×48 dp (MD3)**; danger/destructive variant gets its own pressed color.

**2. IconButton (icon-only)**
- States: def · hov · foc-visible · active · disabled · **toggled/selected** (e.g., favorite, mute) · loading
- Often forgotten: **`aria-label` is mandatory** (no visible text); **tooltip on hover + focus**; toggled state needs `aria-pressed`; larger invisible hit area than the glyph.

**3. Link**
- States: def · hov (underline) · foc-visible · **active/pressed** · **visited** · **current (aria-current)** · external-link affordance
- Often forgotten: **visited** is routinely dropped; **focus ring** on inline links; **hover-prefetch** opportunity; external links get icon + `rel="noopener"`; don't remove underline without another affordance.

**4. Text Input / Text field**
- States: def · hov · **foc/focused (label float)** · filled · **disabled** · **read-only** · **error** · **success** · **loading (async validate)** · with-prefix/suffix · password-reveal
- Often forgotten: **read-only ≠ disabled**; **error message wired via `aria-describedby` + `aria-invalid`**; **caret/selection color**; autofill background override; **clear (×) button** state; character counter near limit; **placeholder is not a label**; right-to-left/Urdu mirroring.

**5. Textarea**
- All Text Input states **plus**: **resize handle** affordance · **auto-grow** behavior · scroll state at max-height · character/word counter
- Often forgotten: counter color shift approaching limit; min/max rows; preserve scroll position on re-render.

**6. Select (native/styled)**
- States: def · hov · foc · **open/expanded** · **option hover** · **option selected (checkmark)** · **option focused (roving)** · disabled · error · **loading options** · empty (no options)
- Often forgotten: **typeahead** (type to jump); **selected vs focused option are different**; keyboard (↑↓ Home End Esc); scroll selected into view on open; placeholder/unselected state.

**7. Combobox / Autocomplete**
- States: all Select **plus**: **typing/filtering** · **debounced searching (spinner)** · **no-results empty** · **min-chars hint** · highlighted match substring · **async error** · multi-select chips · recent/suggested
- Often forgotten: **debounce 300–500 ms**; **"no results" copy**; loading vs empty are different; aria-live announce result count; preserve typed text on blur-without-select; clear button.

**8. Checkbox**
- States: unchecked · **hover** · **foc-visible** · checked · **indeterminate (tri-state)** · disabled(+checked) · error (required) · read-only
- Often forgotten: **indeterminate** (parent of partially-checked group) needs `aria-checked="mixed"`; click target includes label; focus ring on the box.

**9. Radio (group)**
- States: unselected · hover · **foc-visible** · selected · disabled · error · **roving tabindex** within group
- Often forgotten: **arrow keys move + select** within group, Tab enters/exits group; only one tab stop per group; required-group error placement; selected ≠ focused.

**10. Switch / Toggle**
- States: off · on · hover · **foc-visible** · **pressing (thumb travel)** · disabled(on/off) · **loading (async commit, optimistic)** · read-only
- Often forgotten: **takes effect immediately — no Save button**; **optimistic + revert on failure**; thumb animation 150–200 ms; `role="switch"` + `aria-checked`; on/off must differ by more than color (icon/position).

**11. Slider / Range**
- States: def · hover (track + thumb) · **foc-visible (thumb)** · **dragging (active thumb, value bubble)** · disabled · **range/dual-thumb** · stepped vs continuous · error
- Often forgotten: **value tooltip while dragging**; keyboard (←→ step, PageUp/Dn, Home/End); `aria-valuenow/min/max/text`; large enough thumb hit area; ticks/marks.

**12. Date / time picker**
- States: closed · open(calendar) · **day hover** · **day focus (roving grid)** · today · selected · **in-range / range-endpoints** · disabled/out-of-range days · month-transition animation · invalid typed date · loading (server availability) · empty
- Often forgotten: **keyboard grid nav** (arrows across weeks, PageUp/Dn months); min/max bounds disabled; range hover-preview; manual typed-entry parsing + error; locale/first-day-of-week (PK = relevant); today marker distinct from selected.

**13. File upload / Dropzone**
- States: idle · **hover** · **focus** · **drag-over (valid)** · **drag-over (invalid type/size)** · **uploading (per-file progress %)** · success (thumbnail) · **error (too big / wrong type / network)** · paused/retry · empty/queued · disabled
- Often forgotten: **drag-over valid vs invalid** are distinct; **per-file progress + cancel**; reject reason copy; **retry** affordance; paste-to-upload; total-size limit; keyboard-accessible trigger (not drag-only).

### Navigation & disclosure

**14. Tabs**
- States: tab def · hov · **foc-visible** · **active/selected (indicator)** · disabled tab · **with badge/count** · **overflow (scroll/more)** · loading panel · empty panel
- Often forgotten: **animated active indicator**; roving tabindex (arrows switch, Tab leaves to panel); `aria-selected` + `aria-controls`; lazy-loaded panel loading state; overflow handling on narrow screens; keep panel scroll on tab switch (or reset deliberately).

**15. Table row**
- States: def · **hover (row highlight)** · **focus (keyboard row nav)** · **selected (checkbox + row tint)** · **active/expanded (detail)** · **dragging (reorder)** · disabled · **loading (skeleton row)** · error row · **inline-edit** · zebra striping
- Often forgotten: **hover ≠ selected ≠ focused** all coexist; **row-level actions appear on hover but must be keyboard-reachable**; sticky selected state across pagination; skeleton rows matching column layout; bulk-select header checkbox **indeterminate**.

**16. Table header (column header)**
- States: def · hover · **focus** · **sortable hover (sort icon)** · **sorted asc/desc (active)** · **resizing** · **sticky/pinned** · filtered-active · disabled-sort
- Often forgotten: **sort direction indicator + `aria-sort`**; sticky header shadow on scroll; resize handle; "sorted by" announced; filter-active badge on column.

**17. Card**
- States: def · **hover (lift/shadow)** · **focus-visible (if interactive)** · **pressed** · **selected** · disabled · **loading (skeleton)** · **draggable** · error · empty
- Often forgotten: **entire card clickable but nested actions must not double-trigger**; focus ring on the card, not just inner link; hover elevation 150–200 ms; skeleton variant; selected state for card-as-choice.

**18. Menu item (within menu/dropdown)**
- States: def · **hover** · **focus (roving)** · active/pressed · **selected/checked** · disabled · **destructive variant** · with-submenu (caret) · with-shortcut-hint · loading (async action) · section header (non-interactive)
- Often forgotten: **hover and keyboard-focus must be visually identical**; **shortcut hint** right-aligned; submenu open delay/close delay; disabled item explains why; destructive red on hover; checkmark for toggle items.

**19. Dropdown / Menu (container)**
- States: closed · **opening (animation + transform-origin)** · open · **closing** · **positioned (flip/shift to stay in viewport)** · empty · loading · scrollable (max-height + fade)
- Often forgotten: **collision-aware placement** (flip when near edge); **focus moves into menu on open, returns to trigger on close**; **Esc closes**; click-outside closes; scroll-lock vs allow; `aria-expanded` on trigger.

**20. Tooltip**
- States: hidden · **show (delay ~500 ms in, ~0–150 ms out)** · visible · positioned/flipped · **touch (long-press or suppressed)** · keyboard-focus-triggered
- Often forgotten: **appears on focus, not just hover**; **delay before show, quick hide**; never put essential/only info in a tooltip; not on disabled elements that strip events (wrap them); dismissible with Esc; doesn't obscure the target.

**21. Toast / Snackbar**
- States: **entering (slide/fade)** · visible · **auto-dismiss timer (with pause-on-hover/focus)** · **exiting** · **stacked (multiple)** · variants (info/success/warning/error) · **with action (Undo)** · persistent (error) · loading→resolved transition
- Often forgotten: **pause timer on hover/focus**; **`role="status"` (polite) vs `role="alert"` (assertive)**; errors should persist (no auto-dismiss); stacking/queue limit; Undo action lives here; swipe-to-dismiss on touch; default ~4–6 s, longer if it has an action.

**22. Dialog / Modal**
- States: closed · **opening (backdrop fade + content scale)** · open · **closing** · **loading (async content)** · **submitting (confirm button spinner, disabled)** · error-within · scrollable body (sticky header/footer) · nested/stacked
- Often forgotten: **focus trap + return focus to trigger on close**; **Esc + backdrop-click close** (but confirm if unsaved changes); **`aria-modal`, labelledby, describedby**; **scroll-lock the background**; prevent double-submit; mobile = full-screen sheet; initial focus on first field or primary (not the destructive) action.

**23. Drawer / Side sheet**
- States: closed · **opening (slide from edge)** · open · closing · **swipe-to-close (touch, with drag follow)** · resizable · with-backdrop (modal) vs inline (non-modal) · loading content
- Often forgotten: same focus-trap/return-focus rules as modal when modal; **swipe gesture follows finger then snaps**; backdrop scrim; remember width if resizable; body scroll lock when modal.

**24. Popover**
- States: closed · opening · open · closing · **positioned/flipped** · **arrow pointing to anchor** · dismiss-on-outside-click · dismiss-on-Esc · loading content
- Often forgotten: collision repositioning + arrow follows; focus management (move in if interactive, return on close); not the same as tooltip (popover can hold interactive content + is dismissible).

### Display / status

**25. Badge / Pill / Tag**
- States: def · (hover/foc/removable × if interactive) · **with-count** · **dot (no number)** · **99+ overflow** · semantic colors (success/warn/error/info/neutral) · **pulse/new** · zero-state (hidden when 0)
- Often forgotten: **hide at count 0** (or show dot); cap at "99+"; color must pair with icon/text (not color-only); animate on increment.

**26. Avatar**
- States: image · **loading (skeleton/blur-up)** · **fallback (initials)** · **broken-image fallback** · **status dot (online/away/offline)** · **group/stacked (+N overflow)** · selected/active · size variants
- Often forgotten: **initials fallback when no image / image 404**; presence indicator; "+3" overflow in stacks; alt text; consistent color-from-name hashing.

**27. Chip (input/filter/choice/action)**
- States: def · hover · **foc-visible** · **selected (filter/choice)** · **pressed** · **removable (× button + its own hover/focus)** · disabled · **loading (async filter)** · error · with-avatar/icon
- Often forgotten: **the remove × is a separate focusable target**; selected vs unselected filter; Backspace removes last chip in input context; overflow wrapping.

**28. Breadcrumb**
- States: link items (def/hov/foc) · **current page (non-link, aria-current)** · separator · **overflow/collapse (…) menu** · truncation
- Often forgotten: **last item is current, not a link**; collapse middle items on narrow screens; `aria-current="page"`; separators are decorative (aria-hidden).

**29. Pagination**
- States: page-number (def/hov/foc) · **current page (active)** · **disabled prev/next at bounds** · ellipsis (truncated ranges) · **loading (page change)** · jump-to-input · per-page select
- Often forgotten: **disable prev on page 1 / next on last**; loading state on the page being fetched; keep scroll position or scroll-to-top deliberately; `aria-current` on active page; ellipsis is non-interactive (or a jump).

**30. Nav item (sidebar / top nav)**
- States: def · hover · **foc-visible** · **active/current route (aria-current)** · **with badge/count** · **collapsed (icon-only + tooltip)** · expanded-group · disabled · **loading (route transition)**
- Often forgotten: **active-route ≠ hover**; collapsed rail shows tooltip on hover/focus; nested group expand/collapse memory; skeleton on first load; keep scroll position of nav.

**31. Accordion / Disclosure**
- States: collapsed · **hover** · **foc-visible** · **expanded (open)** · **transitioning (height animate)** · disabled · **single vs multi-open** · loading content · empty
- Often forgotten: **chevron rotation tied to state**; `aria-expanded` + `aria-controls`; animate height (measure, don't jump); single-open accordion collapses siblings; keyboard Enter/Space toggles.

**32. Command palette item**
- States: def · **highlighted (active result, follows ↑↓)** · hover (syncs highlight) · **selected/executing** · **matched-substring highlight** · disabled · with-shortcut-hint · with-icon · **section/group header** · **recent vs results**
- Often forgotten: **mouse hover and keyboard highlight must stay in sync** (one highlighted item); fuzzy-match highlighting; Enter executes highlighted; empty/no-match state; loading async results; scroll highlighted into view.

### Feedback / progress (bonus essentials)

**33. Progress bar / indicator**
- States: **determinate (%)** · **indeterminate (looping)** · **buffering** · success(100%→fade) · **error/stalled** · paused
- Often forgotten: switch to **determinate once total is known**; indeterminate for unknown duration; show % text for >10 s; error/stall is its own state. (Apple HIG: avoid indeterminate spinners where status text is possible; not on watchOS.)

**34. Skeleton loader**
- States: shimmer/pulse · **matches final layout (count, shape, line-widths)** · **→ content crossfade** · **fallback to spinner if structure unknown** · **error state (skeleton→error, not infinite)**
- Often forgotten: skeletons must **mirror real content dimensions** (else layout shift / CLS); cap how long before showing an error; don't skeleton tiny/instant loads (flash).

**35. Empty / zero state**
- Variants: **first-run (no data ever)** · **cleared (user emptied)** · **no-results (search/filter)** · **error (load failed)** · **offline** · **permission-denied / restricted**
- Often forgotten: these are **5+ distinct states**, not one; each needs tailored copy + the right action (first-run → "create"; no-results → "clear filters"; error → "retry"; offline → "reconnect"). Empty ≠ loading ≠ error.

---

## 2. Cross-cutting micro-UX (every product needs these)

### Optimistic updates
- Reflect the change **immediately**, run the request in background; on failure **roll back + toast with retry**.
- MD3/GitLab pattern: show pending data at **~50% opacity + spinner**, snap to 100% on success, revert on fail.
- **Use for:** likes, toggles, reorders, renames, simple edits, low-risk deletes (with Undo).
- **Do NOT use for:** payments, irreversible destructive actions, server-validated data — wait for confirmation.
- Sources: [Optimistic UI patterns (Simon Hearne)](https://simonhearne.com/2021/optimistic-ui-patterns/),
  [GitLab Pajamas saving & feedback](https://design.gitlab.com/patterns/saving-and-feedback/).

### Undo vs Confirmation (decision rule)
- **Undo** (preferred) for reversible / low-stakes / accidental-but-recoverable actions (archive, delete a row, send) → act immediately + offer Undo in a toast (~5–10 s window).
- **Confirmation dialog** only for **irreversible / high-consequence** actions (permanent delete, account closure, payments, data leakage, bulk destructive). Require type-to-confirm for the most destructive.
- Rule of thumb: **"Undo, don't confirm" unless the action can't be undone.**
- Source: [Design to save people from themselves (Brian Lovin)](https://brianlovin.com/writing/design-to-save-people-from-themselves).

### Autosave indicators
- Show lifecycle: **Editing → "Saving…" → "Saved ✓ (timestamp)" → "Error, retry"**.
- Never silently autosave with no signal; on unsaved-changes navigation, prompt (Save / Discard).
- Source: [GitLab Pajamas saving & feedback](https://design.gitlab.com/patterns/saving-and-feedback/).

### Skeleton vs Spinner (decision rule)
- **Skeleton** when layout is **known & content-heavy** (page, list, feed, dashboard, table) — lowers perceived wait.
- **Spinner** for **short, single, layout-less actions** (button submit, save settings, auth, payment); good for 1–~10 s.
- **Progress bar** for **>10 s** or known-total operations (uploads, exports).
- Avoid spinner flash for sub-300 ms loads (delay showing it ~200–300 ms, or don't show at all).
- Sources: [NN/g Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/),
  [NN/g Skeleton vs Progress vs Spinner](https://www.nngroup.com/videos/skeleton-screens-vs-progress-bars-vs-spinners/).

### Debounced search states
- **Debounce 300–500 ms** after typing stops before querying; show spinner only after debounce fires.
- States to cover: idle · typing · debouncing · **searching** · results · **no-results** · error · min-chars hint.
- Announce result count via `aria-live="polite"`; cancel/ignore stale in-flight responses (race conditions).

### Validation timing — "reward early, punish late"
- **First interaction: validate on blur** (don't yell mid-typing). Premature on-change validation drops conversion **9–16%**.
- **Once a field is in error: switch to on-change** so the user sees it go valid in real time ("reward early").
- **On submit:** validate everything, focus + scroll to first error, summarize errors.
- **Async (uniqueness/availability):** debounce **400–600 ms**, only after first blur.
- Accessibility: only validate after meaningful interaction; errors via `aria-invalid` + `aria-describedby`, announced politely.
- Sources: [Smashing — Live Validation UX](https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/),
  [a11yblog — real-time validation a11y](https://a11yblog.com/2026/02/05/why-real-time-form-validation-can-become-an-accessibility-issue/).

### Copy-to-clipboard feedback
- On click: **icon swaps to checkmark + label → "Copied!"** (or tooltip), revert after **~1.5 s**.
- Provide non-color signal; announce via `aria-live`; handle copy failure (show "Press Ctrl+C").
- Source: [Shoelace Copy Button](https://shoelace.style/components/copy-button).

### Hover-prefetch & instant nav
- Prefetch route/data on **link hover or pointer-down (touchstart)** so the click feels instant (Linear: view transitions <100 ms).
- Combine with optimistic nav + cached views. Cancel prefetch if pointer leaves quickly.
- Source: [Linear design breakdown](https://www.925studios.co/blog/linear-design-breakdown-saas-ui-2026).

### Keyboard & focus management
- **`:focus-visible`** rings everywhere (visible for keyboard, suppressed for mouse).
- **Modals/menus/popovers:** move focus in on open, **trap** (Tab/Shift+Tab loop), **Esc** closes, **return focus to trigger** on close; background `inert`/`aria-hidden`.
- **Composite widgets** (menus, tabs, radios, grids, listboxes): **roving tabindex** — one tab stop, arrow keys move within.
- Logical tab order; skip-links; never trap focus outside an intentional modal.
- Sources: [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/),
  [WCAG 2.1.2 No Keyboard Trap](https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap.html).

### Scroll restoration & position
- Restore scroll position on **back/forward**; reset to top on **new** navigation.
- Preserve scroll in lists after inline actions / pagination unless intentionally jumping.
- Sticky scroll for infinite lists; anchor scroll on content insertion (no jump).

### Sticky headers
- Add **shadow/elevation only after scroll** (not at rest); keep table headers & dialog headers/footers pinned; respect `prefers-reduced-motion` for any collapse animation.

### First-run / error / offline states (don't collapse into one)
- **First-run/empty**, **no-results**, **error+retry**, **offline/reconnecting**, **permission-denied** are all distinct — each with tailored copy and the correct action.

### Reduced motion
- Honor **`prefers-reduced-motion`**: replace slides/scales/parallax with instant or cross-fade; never remove essential feedback, just the decorative motion.

---

## 3. Response-time thresholds (instrument against these)

| Limit | Meaning | UI rule |
|---|---|---|
| **≤ 0.1 s (100 ms)** | feels instantaneous / direct manipulation | hover, press, toggle, optimistic updates must respond here. INP "good" target. |
| **≤ 1 s** | flow of thought uninterrupted; user notices delay | no special feedback needed, but loses "direct" feel; show pressed/disabled instantly. |
| **≤ 10 s** | limit of focused attention | **must** show a determinate progress indicator / status. |
| **> 10 s** | user will multitask | progress bar + estimate + allow background; notify on completion. |

- **INP (Core Web Vital):** **≤ 200 ms = good**, 200–500 ms = needs improvement, **> 500 ms = poor** (75th percentile, field).
  Components: input delay + processing duration + presentation delay.
- Sources: [NN/g Response Time Limits](https://www.nngroup.com/articles/response-times-3-important-limits/),
  [web.dev INP](https://web.dev/articles/inp), [web.dev Optimize INP](https://web.dev/articles/optimize-inp).

---

## 4. Animation duration & easing guidance

**Durations**
- **Sweet spot 200–500 ms** (NN/g). Under ~100 ms is imperceptible; over ~500 ms feels sluggish.
- **Small UI transitions:** 150–250 ms (hover, toggle, tooltip, small fades).
- **Medium (most component transitions):** 200–350 ms.
- **Large / full-screen / complex:** 350–500 ms.
- Smaller area → shorter; larger area traversed → longer.
- Sources: [NN/g Animation Duration](https://www.nngroup.com/articles/animation-duration/),
  [MD3 Easing & duration](https://m3.material.io/styles/motion/easing-and-duration).

**MD3 duration tokens (ms)**

| Short | Medium | Long | Extra-long |
|---|---|---|---|
| short1 50 | medium1 250 | long1 450 | xlong1 700 |
| short2 100 | medium2 300 | long2 500 | xlong2 800 |
| short3 150 | medium3 350 | long3 550 | xlong3 900 |
| short4 200 | medium4 400 | long4 600 | xlong4 1000 |

**MD3 easing tokens (cubic-bezier)**
- **Emphasized** — most transitions (path; web fallback ≈ `0.2, 0, 0, 1`)
- **Emphasized decelerate** (enter): `cubic-bezier(0.05, 0.7, 0.1, 1)`
- **Emphasized accelerate** (exit): `cubic-bezier(0.3, 0, 0.8, 0.15)`
- **Standard** — small utility transitions: `cubic-bezier(0.2, 0, 0, 1)`
- **Standard decelerate** (enter): `cubic-bezier(0, 0, 0, 1)`
- **Standard accelerate** (exit): `cubic-bezier(0.3, 0, 1, 1)`
- **Linear** — fades / opacity only: `cubic-bezier(0, 0, 1, 1)`

Pattern: enter = decelerate easing (eases out), exit = accelerate easing (eases in). Elements entering should be quick to start, gentle to rest.
Source: [MD3 motion tokens & specs](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs),
[material-components-android Motion.md](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md).

---

## 5. Per-component QA gate (use on every PR)

For each component shipped, confirm an **explicit decision** exists for:
1. default · hover · **focus-visible** · active/pressed (all 4 always)
2. selected / current / activated (if it can be chosen or is a route)
3. disabled (+ *why*) and read-only (if viewable-not-editable)
4. loading / pending (+ no layout shift, + double-submit guard)
5. error + success / validation (with `aria-invalid` + `aria-describedby`)
6. empty / no-results / first-run (the right one of the 5 empty variants)
7. indeterminate (checkbox/progress) and dragging (if reorderable)
8. keyboard operability + visible focus + ARIA role/state
9. touch parity (no hover-only affordance; 44/48 px targets)
10. motion within 150–500 ms, `prefers-reduced-motion` honored, responds ≤100 ms

---

## Sources (consolidated)
- MD3 — [Applying states](https://m3.material.io/foundations/interaction/states/applying-states) · [State layers](https://m3.material.io/foundations/interaction/states/state-layers) · [Easing & duration](https://m3.material.io/styles/motion/easing-and-duration) · [Motion tokens/specs](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs) · [Android Motion.md](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)
- Apple HIG — [Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback) · [Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)
- NN/g — [Response Time Limits](https://www.nngroup.com/articles/response-times-3-important-limits/) · [Powers of 10 time scales](https://www.nngroup.com/articles/powers-of-10-time-scales-in-ux/) · [Animation Duration](https://www.nngroup.com/articles/animation-duration/) · [Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/) · [Skeleton vs Progress vs Spinner](https://www.nngroup.com/videos/skeleton-screens-vs-progress-bars-vs-spinners/)
- web.dev — [INP](https://web.dev/articles/inp) · [Optimize INP](https://web.dev/articles/optimize-inp) · [CWV thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds)
- Validation — [Smashing live validation](https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/) · [a11yblog real-time validation](https://a11yblog.com/2026/02/05/why-real-time-form-validation-can-become-an-accessibility-issue/)
- Optimistic / saving — [Simon Hearne](https://simonhearne.com/2021/optimistic-ui-patterns/) · [GitLab Pajamas](https://design.gitlab.com/patterns/saving-and-feedback/) · [Brian Lovin — design to save people](https://brianlovin.com/writing/design-to-save-people-from-themselves)
- Stripe/Linear craft — [Linear design breakdown](https://www.925studios.co/blog/linear-design-breakdown-saas-ui-2026) · [Knock — keyboard shortcuts](https://knock.app/blog/how-to-design-great-keyboard-shortcuts)
- Accessibility / focus — [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) · [WCAG 2.1.2 No Keyboard Trap](https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap.html)
- Copy feedback — [Shoelace Copy Button](https://shoelace.style/components/copy-button)
