# Micro & Macro Completeness Specification — "Nothing Missed"

> The zero-miss contract for QUALITY (the file-manifest is the zero-miss contract
> for COVERAGE). Every component, every state, every interaction, every edge case
> is enumerated here with exact values. Grounded in researched best-practice from
> Linear, Stripe, Vercel/Geist, Radix, shadcn, Material 3, Atlassian, NN/g, W3C
> WAI-ARIA APG, and WCAG 2.2 — see `_research/01..05`. A screen is not "done"
> until every applicable row here is satisfied.

Companion to: the redesign plan (system/migration) + the Design-OS spec (experience).
Research sources: `_research/01-design-systems.md` · `02-micro-interactions.md` · `03-data-tables.md` · `04-a11y-keyboard.md` · `05-states-forms-responsive.md`.

---

## A. FOUNDATIONS — exact values (from research synthesis)

### A1. Spacing — 4px base (Geist/Tailwind/Radix/Linear consensus)
`4 8 12 16 24 32 48 64 96`. Control heights: **28 compact · 32 default · 36 comfortable · 44 touch-min** (24px is the WCAG 2.2 absolute floor for dense icon buttons; 44 for primary touch). Page pad 24/16 · card pad 16/24 · section gap 24/32 · grid gutter 16/24. **No off-scale values** (grep gate: no `p-[13px]`, no `gap-[18px]`).

### A2. Typography — body 14/20 (Atlassian + M3 default), ≤6 sizes, negative tracking grows with size
| Role | px/line | weight | tracking | notes |
|---|---|---|---|---|
| Display | 30/36 | 600 | -0.02em | KPI numbers, Today greeting |
| H1 | 24/32 | 600 | -0.02em | page titles |
| H2 | 20/28 | 600 | -0.01em | section |
| H3 | 16/24 | 600 | -0.01em | card/drawer titles |
| Body | 14/20 | 400 | 0 | default, cells |
| Small | 13/18 | 400 | 0 | secondary/help |
| Label | 12/16 | 500 | +0.02em, UPPER | field labels, table headers |
| Caption | 11/16 | 400 | 0 | timestamps/meta |
**Tabular numerals (`font-variant-numeric: tabular-nums`) on ALL money, counts, dates, table data** (Stripe `tnum`). Max reading line ≤75ch.

### A3. Color — Radix-12-step model + Stripe AA methodology, one restrained accent
- Neutral ramp: 12 steps, near-zero chroma tinted toward theme hue. Steps carry fixed roles (1–2 app bg, 3–5 component bg/hover/active, 6–8 borders, 9–10 solid accents, 11 secondary text, 12 high-contrast text) — Radix scale.
- Accent = theme `--primary` (one only; ~90% of UI is neutral). 6 themes, light+dark, **AA-verified** (redesign C-1).
- Semantic FIXED across themes (trust): success/warning/error/info (redesign Design-OS §5.3). Status = **color+icon+text always** (never color alone).
- Elevation: light = ink-tinted shadow ≤0.07 alpha, multi-layer (Geist/Tailwind recipe); dark = lighter surface, not shadow. Borders are hairline `--border`, do the structural work.

### A4. Radius & focus
Controls 6–8 · cards 8–12 · modals 12–16 · pills full. **Focus ring = element radius + 2px**, ≥2px width, ≥3:1 contrast (WCAG 2.2 Focus Appearance). `:focus-visible` only (never on mouse click).

### A5. Motion — 150–300ms sweet spot; transform/opacity only; reduced-motion honored
Durations: fast 120 · base 200 · slow 300ms. Easing: enter ease-out-expo `cubic-bezier(0.16,1,0.3,1)` · exit ease-in · interactive spring. Per-interaction table in Design-OS §9. **Response-time law (NN/g):** <100ms = instant, <1s = keep flow (no spinner), >1s = show progress; INP target ≤200ms (web.dev).

### A6. Token architecture — primitive → semantic → component (M3/Atlassian/shadcn)
Layer 1 primitives (raw HSL ramps) → Layer 2 semantic (`--background`, `--primary`, `--success`…) → Layer 3 component (consumed via Tailwind utilities). Themes only rewrite Layer 2. Build the redesign exclusively on Layer 2/3 tokens (grep gate: zero hardcoded hex in dashboard).

---

## B. COMPONENT STATE MATRIX — every component, every state (the micro contract)

> 35 components. For each, EVERY applicable state must be implemented. ✓ = required, — = N/A.
> States: **Def**ault · **Hov**er · **Foc**us-visible · **Act**ive/pressed · **Sel**ected · **Dis**abled · **Loa**ding · **Err**or · **Suc**cess · **Empty** · **Indeterminate** · **Drag** · **ReadOnly**

| Component | Def | Hov | Foc | Act | Sel | Dis | Loa | Err | Suc | Empty | Ind | Drag | RO |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Button (primary/secondary/ghost/destructive) | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓(spinner, keep width, double-submit guard) | — | ✓(inline ✓) | — | — | — | — |
| IconButton | ✓ | ✓ | ✓ | ✓ | ✓(toggle) | ✓ | ✓ | — | — | — | — | — | — |
| Link (nav/inline) | ✓ | ✓ | ✓ | ✓ | ✓(aria-current) | ✓ | — | — | — | — | — | — | — | (visited for inline)
| Input | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | ✓(placeholder) | — | — | ✓(focusable, copyable) |
| Textarea | ✓ | ✓ | ✓ | — | — | ✓ | — | ✓ | ✓ | ✓ | — | — | ✓ |
| Select | ✓ | ✓ | ✓ | ✓(open) | ✓(option) | ✓ | ✓(async opts) | ✓ | — | ✓ | — | — | ✓ |
| Combobox/Autocomplete | ✓ | ✓ | ✓ | ✓ | ✓(activedescendant) | ✓ | ✓ | ✓(no results) | — | ✓ | — | — | — |
| Checkbox | ✓ | ✓ | ✓ | ✓ | ✓(checked) | ✓ | — | ✓ | — | — | ✓(`aria-checked=mixed`) | — | ✓ |
| Radio | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | — | — | — | — | ✓ |
| Switch | ✓ | ✓ | ✓ | ✓ | ✓(on) | ✓ | ✓(async toggle) | — | — | — | — | — | — |
| Slider | ✓ | ✓ | ✓ | ✓(thumb) | — | ✓ | — | — | — | — | — | ✓ | — |
| DatePicker | ✓ | ✓ | ✓ | ✓ | ✓(day) | ✓ | — | ✓ | — | — | — | — | ✓ |
| FileUpload | ✓ | ✓(drag-over valid) | ✓ | — | — | ✓ | ✓(per-file %+cancel) | ✓(invalid/oversize/retry) | ✓ | ✓ | — | ✓(over invalid distinct) | — |
| Tabs | ✓ | ✓ | ✓ | ✓ | ✓(selected≠focus) | ✓ | ✓(panel) | — | — | ✓ | — | — | — |
| TableRow | ✓ | ✓ | ✓ | ✓ | ✓(selected≠hover≠focus≠current) | — | ✓(skeleton) | ✓(row error) | ✓(saved flash) | — | — | ✓(reorder) | — |
| TableHeader cell | ✓ | ✓ | ✓ | ✓(sort) | ✓(`aria-sort`) | — | — | — | — | — | ✓(bulk checkbox mixed) | ✓(resize/reorder) | — |
| Card | ✓ | ✓(if interactive) | ✓ | ✓ | ✓ | — | ✓(skeleton) | ✓ | — | ✓ | — | ✓ | — |
| MenuItem | ✓ | ✓(=keyboard focus, in sync) | ✓ | ✓ | ✓(checked) | ✓ | — | — | — | — | — | — | — |
| Dropdown/Popover | ✓(open/closed) | — | ✓(trap-light) | — | — | ✓ | ✓ | — | — | ✓ | — | — | — |
| Tooltip | ✓ | ✓(hover+focus) | ✓ | — | — | — | — | — | — | — | — | — | — | (Esc dismiss, delay)
| Toast | ✓ | ✓(pause timer) | ✓ | — | — | — | — | ✓(`role=alert`, no auto-dismiss) | ✓(`role=status`) | — | — | — | — |
| Dialog/Modal | ✓ | — | ✓(focus trap+return) | — | — | — | ✓ | ✓ | ✓ | — | — | — | — |
| Drawer | ✓ | — | ✓(trap+return) | — | — | — | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Badge/StatusPill | ✓ | — | — | — | — | — | — | — | — | — | — | — | — | (color+icon+text)
| Avatar | ✓ | ✓ | ✓ | — | — | — | ✓(skeleton) | ✓(fallback initials) | — | ✓(broken-img fallback) | — | — | — |
| Chip/Tag | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | (remove × is SEPARATE focusable target)
| Breadcrumb | ✓ | ✓ | ✓ | — | ✓(`aria-current=page`) | — | — | — | — | — | — | — | — |
| Pagination | ✓ | ✓ | ✓ | ✓ | ✓(`aria-current`) | ✓(first/last edges) | ✓ | — | — | ✓(single page) | — | — | — |
| NavItem | ✓ | ✓ | ✓ | ✓ | ✓(active≠hover) | ✓(no permission) | — | — | — | — | — | — | — |
| Accordion/Disclosure | ✓ | ✓ | ✓ | ✓(expanded) | — | ✓ | ✓ | — | — | ✓ | — | — | — |
| CommandPaletteItem | ✓ | ✓(=keyboard, single highlight) | ✓ | ✓ | ✓ | — | ✓(async results) | ✓(no match) | — | ✓(recent/empty query) | — | — | — |
| Progress (bar/ring) | ✓ | — | — | — | — | — | ✓ | ✓ | ✓(complete) | — | ✓(indeterminate) | — | — |
| Skeleton | ✓(shimmer) | — | — | — | — | — | ✓ | — | — | — | — | — | — |
| Stepper/Wizard | ✓ | ✓ | ✓ | ✓(current) | ✓(done) | ✓(future) | ✓ | ✓(step error) | ✓ | — | — | — | — |
| EmptyState | ✓ | — | — | — | — | — | — | — | — | ✓ | — | — | — |

**The four states routinely conflated — keep visually distinct on rows/tabs/nav:** `hover` ≠ `focus-visible` ≠ `selected` ≠ `active-route(aria-current)`. (NN/g + research 02.)

---

## C. PER-SCREEN STATE MATRIX (the macro contract — every screen ships all 6+)

| State | Requirement |
|---|---|
| **First-run** (empty, never used) | Encouraging copy + 1 primary CTA + optional "import" shortcut. Not a sad illustration. |
| **Filtered-empty / no-results** | Echo active filters + "Clear filters"; suggest fixes for search. Distinct from first-run. |
| **Cleared / all-done** | Affirming ("Inbox zero — nice."). |
| **Loading** | Skeleton (content >300ms, known layout) · in-button spinner (<2s actions) · progress bar (measurable/>10s: payroll, upload, import). **300ms floor** before showing. Never show "no records" while loading. |
| **Error — field** | Inline, below field, icon+text, announced. |
| **Error — form** | Summary banner **+** inline (never summary alone); focus first error. |
| **Error — page/boundary** | ErrorBoundary with retry + support path. |
| **Error — network/offline** | Preserve user input; "retry"; offline banner. |
| **Error — 403 vs 404** | Distinct copy (permission vs not-found). |
| **Success** | Toast (reversible, with undo) · inline ("Saved") · full-page (booking/payment confirmation + receipt). |
| **Partial/stale** | Render what loaded; flag stale region; timestamp money balances. |
| **Power-user** | Saved views, density toggle, keyboard shortcuts, bulk actions visible. |

**Copy law (NN/g):** specific, actionable, no blame. "Couldn't reach the server — your changes are saved, retrying…" not "Error".

---

## D. DATA TABLE — full feature checklist (the heart; research 03)

**Engine:** TanStack Table v8 headless; client up to ~few-thousand rows, server + TanStack-Virtual beyond. Semantic `<table>`; `role="grid"` ONLY when cells become inline-editable.

- [ ] Sort: single + **multi-sort (shift-click)**, `aria-sort` announced, 3-state (asc/desc/none).
- [ ] Filter: per-column faceted chips + **global debounced search** + "Clear all".
- [ ] Group: multi-level + aggregation + sticky group headers (where useful).
- [ ] Select: single · **shift-range** · select-page · **select-all-N-across-pages**; header checkbox **indeterminate**.
- [ ] Bulk action bar: appears on selection; destructive actions guarded (confirm/undo); count shown.
- [ ] Columns: resize · reorder · **pin/freeze** (first col) · show/hide · sensible defaults · **reset**.
- [ ] Density toggle: 40/48/56px rows; persisted per user.
- [ ] Sticky header + sticky first column; horizontal-scroll affordance (edge shadow + visible scrollbar).
- [ ] Cell types: text(left) · **money(right, tabular-nums, tone pill: paid/partial/overdue)** · status pill · date(relative+absolute tooltip) · avatar · actions · tag · progress.
- [ ] Truncation: ellipsis + tooltip on overflow.
- [ ] Inline edit: optimistic, validation, Esc-cancel (higher friction for high-stakes money).
- [ ] Expandable subrows / side panel.
- [ ] Pagination (default for finance) — page size selector, `aria-current` page.
- [ ] Empty / no-results / loading(skeleton rows) / inline-error+retry — distinct.
- [ ] Saved views/segments; per-user prefs (order/visibility/size/pin/density/sort) → localStorage + server.
- [ ] Keyboard: arrows / j-k · space select · shift-range · enter open · f filter · ⌘K · copy cell/row as TSV.
- [ ] Export: CSV + XLSX respecting active filters (shared ExportMenu).
- [ ] Search highlighting in results.
- [ ] Mobile: → card collapse, priority columns, stacked over h-scroll.
- [ ] A11y: header `scope`, `aria-sort`, `aria-selected`, roving tabindex, caption, focus rings, full grid keymap when editable.
- [ ] Perf: virtualize >100 rows, fixed/cached row heights, memoized columns/data/cell renderers, debounced inputs, no scroll-time DOM measurement.

---

## E. FORMS — full checklist (research 05)

- [ ] **Validation timing ("reward early, punish late"):** validate on **blur**; after a field errors, re-validate on every keystroke so it clears instantly (≈500ms debounce for async); required-empty flagged **only on submit**; format-fatal may error immediately.
- [ ] Labels **top-aligned**; help text below; mark **both** required (`*`) and "(optional)" in money forms (Baymard).
- [ ] Error messages: specific + how to fix; never color-only; focus first error on submit.
- [ ] **Never disable submit** to indicate invalid — allow submit, then show errors (anti-pattern).
- [ ] Autosave + draft recovery via existing `useFormDraft` + `DraftResumeBanner` + `AutoSaveIndicator` (CREATE-mode default; bank-details opts OUT — PII).
- [ ] Masked inputs: phone (+92), money (Rs grouping), CNIC.
- [ ] **No optimistic UI for payments/payroll** — explicit "Processing…" → server-confirmed; preview totals before commit; trust microcopy at money moments.
- [ ] Keyboard/tab order logical; Enter submits single-field; ⌘Enter submits forms.
- [ ] Multi-step wizard: progress indicator, per-step validation, back preserves data, review step.
- [ ] Field types covered: input, select, combobox, textarea, upload, date, checkbox, radio, switch — all from B-matrix.

---

## F. NAVIGATION & GLOBAL KEYMAP (research 04; Linear/Superhuman/Raycast/GitHub model)

| Key | Action |
|---|---|
| `⌘/Ctrl+K` | Command palette (navigate/create/act/search) |
| `/` | Focus global search |
| `?` | Shortcuts overlay |
| `Esc` | Close top layer / back |
| `⌘/Ctrl+Enter` | Submit form |
| `g h` | Today · `g o` Operate · `g b` Bookings · `g l` Leads · `g m` Money · `g p` Payments · `g i` Invoices/receipts · `g s` Staff · `g v` Vendors · `g c` Compliance · `g t` Settings |
| `j`/`k` | List up/down · `x` select (`Shift+x` range) · `Enter` open · `o` peek · `c` create · `e` edit · `s` set status · `⌘/Ctrl+⌫` delete |

**Command palette:** open <50ms; recent + grouped + fuzzy match + nested/parameterized actions + inline search results streamed async; combobox+listbox roles, `aria-activedescendant`, announced result count.

---

## G. ACCESSIBILITY — WCAG 2.2 AA checklist, incl. the deltas teams miss (research 04)

**New in 2.2 (commonly forgotten):**
- [ ] **2.4.11 Focus Not Obscured** — sticky header/command bar must not hide the focused row (scroll-into-view with offset).
- [ ] **2.4.13 Focus Appearance** — ring ≥2px, ≥3:1 contrast.
- [ ] **2.5.8 Target Size (min 24×24px)** — dense icon/row-action buttons; 44px on touch.
- [ ] **2.5.7 Dragging Movements** — non-drag alternative for column reorder & any kanban (menu "move to").
- [ ] **3.2.6 Consistent Help** — help/support in same place every screen.
- [ ] **3.3.7 Redundant Entry** — reuse customer/venue data across booking→invoice (don't re-ask).
- [ ] **3.3.8 Accessible Authentication** — allow paste + OTP autofill; no cognitive puzzles.

**Staples:** contrast 4.5:1 text / 3:1 non-text (themes verified) · focus visible · keyboard no-trap · error identification + suggestion · `aria-live` status (autosave/toast/validation) · labels/instructions · landmarks (`<nav><main>`) · heading order · dialog focus trap+return · `prefers-reduced-motion`.

**APG keyboard models** to implement verbatim per pattern (dialog, menu, combobox, listbox, tabs roving-tabindex, disclosure, tooltip, grid) — table in `_research/04`.

---

## H. RESPONSIVE — every breakpoint (research 05 + Design-OS §8)

| 1920 | 1440 | 1280 | 1024 | 768 | 430 | 390 | 375 |
|---|---|---|---|---|---|---|---|
| rail 240, content max 1280–1440 centered | rail 240 | rail 240 | rail→icon 64 (label on hover) | rail→off-canvas Sheet | bottom-nav/Sheet | same | same |
| full table | full | full | priority cols | priority + row-expand | **cards** | cards | cards |

Hard gates at EVERY width: **no horizontal page scroll**, no broken grid, no clipped money, ≥44px touch, dialogs→full-screen sheets on mobile, FilterBar→filter sheet, fluid type via `clamp()` (rem-based for WCAG zoom). QA at 375 specifically.

---

## I. THE "DONE" CHECKLIST (run per screen before flipping the manifest row to ✓)

1. [ ] All applicable **B-matrix** component states implemented.
2. [ ] All 6+ **C** screen states present (empty/loading/error×5/success/partial/power).
3. [ ] If table: all **D** features (or explicitly N/A noted).
4. [ ] If forms: all **E** rules (validation timing, autosave, no-disabled-submit, money = no optimistic).
5. [ ] **F** keyboard works on this screen (j/k, enter, c, e where applicable).
6. [ ] **G** WCAG 2.2 AA — incl. the 7 deltas; axe/Lighthouse a11y ≥95.
7. [ ] **H** responsive verified at 1280/768/375 minimum; no h-scroll.
8. [ ] **A** foundations: tokens only (grep: zero hex/lucide/bridal), 4px spacing, tabular money, motion 150–300ms reduced-motion-safe.
9. [ ] Behavior frozen (recon inventory of buttons/dialogs/state-machines intact).
10. [ ] Smoke-checked in 2 themes + dark.

> This checklist IS the trillion-dollar bar, made concrete. If every screen passes
> I–9 and every manifest row is ✓, nothing — micro or macro — has been missed.
