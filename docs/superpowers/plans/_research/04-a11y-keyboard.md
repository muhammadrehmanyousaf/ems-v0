# 04 — Accessibility, Keyboard Productivity & Command-Palette UX (Research Spec)

> Scope: how the Wedding Wala / EMS dashboard becomes a **keyboard-first, screen-reader-clean,
> WCAG 2.2 AA** product. Goal of this doc: enumerate **everything** a best-in-class
> keyboard + a11y + command-palette experience needs so nothing is missed, then give the
> concrete recommended approach for our **React** dashboard. We build on headless primitives
> (Radix / React Aria style), `cmdk` for the palette, and own all focus + ARIA wiring.
>
> The 5 product zones referenced throughout: **Today / Operate / Money / Grow / Compliance.**

---

## 0. Principles & engine decisions

- **Two focus models, used deliberately.** Use **roving `tabindex`** for composite widgets where
  a real DOM element should hold focus (tabs, menus, toolbars, simple grids). Use
  **`aria-activedescendant`** when DOM focus must stay on a text input while a virtual cursor
  moves through a popup (combobox, command palette). Only **one** tab stop per composite widget —
  `Tab`/`Shift+Tab` move *between* widgets; arrow keys move *within*.
  ([APG Developing a Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/),
  [APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/))
- **Don't hand-roll dialogs/menus/combobox.** Use accessible headless libs (Radix UI, React Aria)
  for focus trap, return focus, type-ahead, roving tabindex; they encode the APG behaviors below.
- **Palette engine = `cmdk`** (unstyled). It sets `role="combobox"` on the input, `role="listbox"`
  on the list, `role="option"` per item, and manages `aria-expanded`, `aria-activedescendant`,
  `aria-selected` automatically; built-in fuzzy scoring (`command-score`), overridable filter,
  good to ~2–3k items. ([cmdk GitHub](https://github.com/dip/cmdk),
  [cmdk guide](https://www.lmctogetherwebuild.com/cmdk-in-react-build-a-fast-command-palette-setup-examples/))
- **Target WCAG 2.2 Level AA** (supersedes 2.1; six new SC beyond 2.1 AA).
  ([What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/),
  [WCAG 2.2 spec](https://www.w3.org/TR/WCAG22/))

---

## 1. APG keyboard interaction model per pattern

Required keys + focus behavior for every interactive pattern we use. Source: the individual
[W3C APG pattern pages](https://www.w3.org/WAI/ARIA/apg/patterns/).

| Pattern | Required keys | Focus / ARIA behavior |
|---|---|---|
| **Dialog (modal)** | `Tab`/`Shift+Tab` cycle **within** dialog (wraps, never leaves); `Esc` closes | **Focus trap**: focus moves into dialog on open (a sensible element — first field, or a `tabindex="-1"` heading for large/semantic content, or the safest button for risky actions); on close **return focus to the invoking trigger**. `role="dialog"` + `aria-modal="true"` + `aria-labelledby`. ([dialog-modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)) |
| **Menu button → menu** | Open with `Enter`/`Space`/`Down` (→ first item) or `Up` (→ last item). In menu: `Down`/`Up` move (optional wrap), `Home`/`End` → first/last, **type-ahead** (printable char → next item whose label starts with it), `Esc` closes + returns focus to button, `Right`/`Left` open/close submenus, `Tab` exits and closes all menus | Roving tabindex; `role="menu"`/`menuitem`; activating an item closes the menu and runs the action. ([menu-button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/), [menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)) |
| **Combobox** (editable + listbox popup) | `Down` → into popup / first option; `Up` → last option; `Alt+Down` opens popup without moving focus; `Enter` accepts focused option + closes; `Esc` closes popup (2nd `Esc` may clear); printable chars type + filter; `Home`/`End` are normal text-cursor moves | **`aria-activedescendant`**: DOM focus stays on the input, virtual focus moves in the listbox. `role="combobox"` + `aria-expanded` + `aria-controls`; `aria-autocomplete="list"|"both"`. ([combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)) |
| **Listbox** (single) | `Down`/`Up` move (selection may follow focus); `Home`/`End` first/last; **type-ahead** | Roving tabindex **or** activedescendant; `role="listbox"`/`option`, `aria-selected`. On entry, focus the selected option or first option. ([listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)) |
| **Listbox** (multi) | `Space` toggles focused option; `Shift+Down`/`Shift+Up` extend selection; `Shift+Space` selects contiguous range from last selection; `Ctrl+A` select/deselect all; `Ctrl+Shift+Home`/`End` select to start/end | Selection **does not** follow focus in multi-select; `aria-multiselectable="true"`. ([listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)) |
| **Tabs** | `Tab` enters tablist → active tab; `Left`/`Right` (horizontal) or `Up`/`Down` (vertical) move between tabs (wrap); `Home`/`End` first/last; from tablist, `Tab` moves **out** to the tabpanel | **Roving tabindex** (only active tab is tabbable). Prefer **automatic activation** (panel shows on focus) when panels are cheap; use **manual** (`Enter`/`Space`) when loading a panel is expensive. `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`. ([tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)) |
| **Disclosure / Accordion** | `Enter` **or** `Space` toggles the section | Trigger is `role="button"` with `aria-expanded` true/false + `aria-controls`. Accordion = a set of disclosures; optionally add `Up`/`Down`/`Home`/`End` to roam between headers. ([disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)) |
| **Tooltip** | Shows on **hover AND keyboard focus**; `Esc` dismisses; stays open while pointer is over trigger **or** tooltip (don't let it vanish on the path between) | Tooltip itself is **not focusable** and holds no focusable content; `role="tooltip"` referenced via `aria-describedby`. If it must contain links/buttons, use a non-modal popover instead. ([tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)) |
| **Alert / status** | None (not focusable) | `role="alert"` (assertive) for errors; `role="status"`/`aria-live="polite"` for non-urgent. Inject text into an element already in the DOM so SRs announce the change. ([APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)) |
| **Switch** | `Space` (and `Enter`) toggles | `role="switch"` + `aria-checked`; visible label. ([APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)) |
| **Grid** (interactive table) | `Arrows` move cell↔cell; `Home`/`End` first/last cell **in row**; `Ctrl+Home`/`Ctrl+End` first/last cell of grid; `PageUp`/`PageDown` jump N rows; `Enter` **or** `F2` → edit mode (focus the cell's widget); `Esc` / 2nd `F2` → back to navigation mode; `Shift+Space` selects row; `Ctrl+Space` selects column; `Ctrl+A` selects all; `Shift+Arrow` extends selection; `Tab` moves through interactive content of the current row | Only **one** cell/element is in the page tab sequence (roving). Distinguish **navigation mode** (arrows roam cells) from **edit mode** (arrows belong to the in-cell widget). `role="grid"`/`row`/`gridcell`, `aria-rowcount`/`aria-colindex` for virtualized grids. ([grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)) |

> **Tie-in to 03-data-tables:** our TanStack table becomes a `role="grid"` only when it gains in-cell
> editing / cell selection. A read-only sortable table stays a plain `<table>` with sortable
> `<th>` buttons — don't add grid keyboard semantics you won't honor.

---

## 2. WCAG 2.2 AA checklist for the dashboard

### 2a. The NEW 2.2 criteria teams most often miss

| SC | Name (Level) | What it means for us |
|---|---|---|
| **2.4.11** | Focus Not Obscured (Minimum) **AA** | A focused control must **not be entirely hidden** by sticky headers/footers, the command bar, or non-modal dialogs. Audit every sticky element + add `scroll-margin` so focused rows aren't tucked under the sticky header. ([new-in-22](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)) |
| **2.4.13** | Focus Appearance **AA** | Focus indicator must be **≥2px thick** on the perimeter and have **≥3:1 contrast** against the unfocused state. No relying on a faint default ring. ([Deque WCAG 2.2](https://dequeuniversity.com/resources/wcag-2.2/)) |
| **2.5.8** | Target Size (Minimum) **AA** | Pointer targets **≥24×24 CSS px** (or 24px spacing between smaller ones). Tighten our dense icon buttons, table row actions, chips, and pagination. ([new-in-22](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)) |
| **2.5.7** | Dragging Movements **AA** | Any drag interaction (column reorder, kanban, slider) needs a **non-drag alternative** — a menu "Move to…", buttons, or keyboard reorder. ([new-in-22](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)) |
| **3.2.6** | Consistent Help **A** | Help/contact (chat, support link, docs) sits in the **same relative location** on every page. ([new-in-22](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)) |
| **3.3.7** | Redundant Entry **A** | Don't make users re-key info already given **in the same flow** — auto-populate or let them pick it (e.g. booking → invoice reuses customer/venue data). ([new-in-22](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)) |
| **3.3.8** | Accessible Authentication (Minimum) **AA** | No **cognitive-function test** required to log in (no "solve this puzzle", no transcribe-from-memory). Allow password managers/paste; OTP autofill; the WW phone-OTP login is fine since the code is provided, not memorized. ([new-in-22](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)) |

### 2b. The staples (carried from 2.1, still mandatory)

- **1.4.3 Contrast (Minimum) AA** — text **4.5:1** (large text 3:1). ([quickref](https://www.w3.org/WAI/WCAG22/quickref/?levels=aa))
- **1.4.11 Non-text Contrast AA** — UI components, icons, focus rings, chart strokes **3:1** vs adjacent colors.
- **2.4.7 Focus Visible AA** — every keyboard-operable control shows a visible focus indicator.
- **2.1.1 Keyboard A / 2.1.2 No Keyboard Trap A** — all functionality keyboard-operable; focus can always leave a component.
- **3.3.1 Error Identification A / 3.3.3 Error Suggestion AA** — errors named in text **and** a correction suggested.
- **3.3.2 Labels or Instructions A** — every input has a programmatic label + needed instructions.
- **4.1.3 Status Messages AA** — autosave/toast/validation surfaced via `aria-live`/role **without** moving focus.

---

## 3. Recommended GLOBAL KEYMAP (keyboard-first SaaS)

Distilled from what Linear, Superhuman, Raycast, and GitHub actually ship: a `Cmd/Ctrl+K`
palette, `/` to search, `?` to show shortcuts, **`g` then a letter** for navigation, `j`/`k`
list nav, `x` select, `e` edit, `c` create, `Enter` open, `Esc` close/back.
([Linear shortcuts](https://keycombiner.com/collections/linear/),
[GitHub keyboard shortcuts](https://docs.github.com/en/get-started/accessibility/keyboard-shortcuts),
[github/hotkey](https://github.com/github/hotkey),
[Raycast manual](https://manual.raycast.com/keyboard-shortcuts),
[Superhuman command palette](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/))

### 3a. Global / app-wide

| Key | Action |
|---|---|
| `Cmd/Ctrl + K` | Open command palette (single entry point — never fragment across Cmd+K/Cmd+P) |
| `/` | Focus search / filter on the current view |
| `?` | Open keyboard-shortcuts overlay (modal dialog) |
| `Esc` | Close palette/dialog/menu, clear selection, or go back |
| `Cmd/Ctrl + Enter` | Submit the current form / confirm primary action |
| `[` / `]` | Back / forward in navigation history |

### 3b. `g`-then-letter navigation → THIS app's 5 zones

Press **`g`** then the letter (GitHub/Linear chord style). Letters chosen to be mnemonic and
collision-free across the five zones.

| Chord | Destination | Zone |
|---|---|---|
| `g` `h` | **Today** — home / daily overview | Today |
| `g` `o` | **Operate** hub (events, bookings, schedule) | Operate |
| `g` `b` | **Bookings** list | Operate |
| `g` `s` | **Staff & shifts / schedule** | Operate |
| `g` `m` | **Money** hub (payments, payouts, invoices) | Money |
| `g` `p` | **Payouts** | Money |
| `g` `i` | **Invoices** | Money |
| `g` `r` | **Grow** hub (vendors, leads, marketing) | Grow |
| `g` `v` | **Vendors** | Grow |
| `g` `l` | **Leads / inbox** | Grow |
| `g` `c` | **Compliance** hub (contracts, docs, audit) | Compliance |
| `g` `t` | **Settings** (the lone non-zone; "se**t**tings") | — |

### 3c. List / record actions (active inside a list or record)

| Key | Action |
|---|---|
| `j` / `k` | Move down / up the list (or `↓`/`↑`) |
| `x` | Toggle-select the focused row |
| `Shift + x` | Range-select to the focused row |
| `Enter` | Open the focused record |
| `o` | Open in a side-peek / preview panel |
| `c` | Create new (booking/invoice/vendor — contextual to zone) |
| `e` | Edit the focused record |
| `a` | Assign (staff/owner) |
| `s` | Change status |
| `Cmd/Ctrl + Backspace` | Delete (with confirm) |

> **Discoverability:** every actionable button also shows its shortcut in a tooltip and in the
> `?` overlay; the palette lists the same actions with their hotkeys so users learn by browsing.
> **Implementation:** scope chords to a focus/route context so `c` in a text field types "c";
> use a hotkey lib (e.g. `github/hotkey` style) that respects input focus.

---

## 4. Command-palette UX

### 4a. Structure

- **Default (empty) view:** show the most relevant subset — **Recent / pinned commands** +
  top navigation — never a blank box and never a dump of all 50 actions.
  ([Superhuman](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/),
  [uxpatterns.dev](https://uxpatterns.dev/patterns/advanced/command-palette))
- **Grouped results:** bucket by **Navigation / Actions / Settings / Search results** (and our
  zones); render group headings, not one flat list. ([Mobbin glossary](https://mobbin.com/glossary/command-palette))
- **Fuzzy + forgiving matching:** case-insensitive, typo-tolerant ("lnik"→"link"), synonym/alias
  aware; show *why* an aliased item matched. `cmdk`'s `command-score` covers the baseline; swap a
  fuzzy engine for larger sets. ([Superhuman](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/),
  [cmdk](https://github.com/dip/cmdk))
- **Nested / parameterized actions:** an item can open a **sub-page** (e.g. "Change status →"
  then pick a value; "Assign to →" then pick a person) instead of needing its own global shortcut.
  ([uxpatterns.dev](https://uxpatterns.dev/patterns/advanced/command-palette))
- **Inline search results:** mix entity results (a specific booking, vendor, invoice) with
  commands so the palette doubles as universal search.
- **Contextual ranking:** boost commands by recency + frequency + current route/selection; keep a
  per-user "last used" memory. ([Superhuman](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/))

### 4b. What makes it feel instant

- **Open in <~50ms**, type immediately, filter with no perceptible lag.
- Keep render cheap: **memoize** item renderers, **debounce** the search input, **lazy-load**
  icon sets, and **virtualize** long lists; never do expensive synchronous work in the keydown
  handler. ([uxpatterns.dev](https://uxpatterns.dev/patterns/advanced/command-palette),
  [LMC cmdk guide](https://www.lmctogetherwebuild.com/cmdk-in-react-build-a-fast-command-palette-setup-examples/))
- **Async result streaming:** render local/cached results instantly, then stream remote
  (search) results in; show a loading state in the empty slot, and **announce** when results
  arrive. ([UX Patterns command palette](https://uxpatterns.dev/patterns/advanced/command-palette))

### 4c. Accessibility of the palette

- It IS the **combobox + listbox** pattern: `role="combobox"` input + `role="listbox"` +
  `role="option"`; DOM focus stays in the input, **`aria-activedescendant`** tracks the
  highlighted option (this is exactly `cmdk`'s model). ([combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/),
  [cmdk](https://github.com/dip/cmdk))
- Keys: `↑`/`↓` move options, `Enter` runs, `Esc` closes (returning focus to the prior element),
  `Home`/`End` jump first/last; disabled items skipped.
- Wrap the palette in a **modal dialog** shell (focus trap + return focus) and **announce the
  result count** via `aria-live` ("12 results") as the query changes.

---

## 5. Screen-reader specifics

- **Landmark regions:** one `<header>` (`banner`), `<nav>` (`navigation`, labelled per nav if
  multiple), `<main>` (one per page), `<aside>` (`complementary`), `<footer>` (`contentinfo`).
  Each zone's content lives in `<main>`; the side-peek is a labelled `complementary` or a dialog.
- **Heading order:** exactly one `<h1>` per view (the page/zone title); no skipped levels;
  section cards use `<h2>`/`<h3>` consistently so SR users can jump by heading.
- **Live regions:**
  - **Autosave** → `role="status"` / `aria-live="polite"` ("Saved", "Saving…") — never steal focus.
  - **Toasts** → polite live region; urgent failures `role="alert"` (assertive). (SC 4.1.3.)
  - **Inline validation** → error text tied to the field via `aria-describedby` + `aria-invalid="true"`;
    on submit, move focus to the first error or to an `role="alert"` summary. (SC 3.3.1/3.3.3.)
- **Table semantics:** real `<table>`/`<thead>`/`<th scope>`; `<caption>` or `aria-label` names the
  table; sortable headers are `<button>`s exposing `aria-sort`; virtualized grids set
  `aria-rowcount`/`aria-colindex`. (See 03-data-tables.)
- **Dialog labelling:** every dialog has `aria-labelledby` (its visible title) and, where helpful,
  `aria-describedby`; `aria-modal="true"`; focus trapped; focus returned to trigger on close.

---

## 6. Sources

- W3C ARIA APG — [patterns index](https://www.w3.org/WAI/ARIA/apg/patterns/),
  [keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/),
  [dialog-modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/),
  [menu-button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/),
  [menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/),
  [combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/),
  [listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/),
  [tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/),
  [disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/),
  [tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/),
  [grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
- WCAG 2.2 — [What's New](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/),
  [spec](https://www.w3.org/TR/WCAG22/),
  [quickref AA](https://www.w3.org/WAI/WCAG22/quickref/?levels=aa),
  [Deque WCAG 2.2 resources](https://dequeuniversity.com/resources/wcag-2.2/)
- Keyboard / palette UX — [Linear shortcuts](https://keycombiner.com/collections/linear/),
  [GitHub keyboard shortcuts](https://docs.github.com/en/get-started/accessibility/keyboard-shortcuts),
  [github/hotkey](https://github.com/github/hotkey),
  [Raycast manual](https://manual.raycast.com/keyboard-shortcuts),
  [Superhuman: building a remarkable command palette](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/),
  [UX Patterns — Command Palette](https://uxpatterns.dev/patterns/advanced/command-palette),
  [Mobbin — Command Palette glossary](https://mobbin.com/glossary/command-palette),
  [cmdk](https://github.com/dip/cmdk),
  [cmdk setup guide](https://www.lmctogetherwebuild.com/cmdk-in-react-build-a-fast-command-palette-setup-examples/)
