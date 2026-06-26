# 03 — Data Tables & Dense-Data UX (Research Spec)

> Scope: the data table is the heart of the Wedding Wala / EMS finance & operations dashboard
> (bookings, payouts, payroll, vendor lists, transactions). Goal of this doc: enumerate
> **everything** a best-in-class table needs so nothing is missed, and give the concrete
> recommended approach for our **TanStack-Table-based React** dashboard. Headless TanStack
> Table v8 = our engine; we own markup, styling, a11y, and the virtualization strategy.

---

## 0. Engine decision & why

- **TanStack Table v8 (headless)** is the engine for rows/columns/sorting/filtering/grouping/
  pagination/selection/sizing/pinning/visibility/ordering/expansion/faceting/aggregation —
  all opt-in row models. It ships **no markup, no styles, no virtualization, no a11y** — we
  own all of that, which is exactly what we want for a custom finance design language.
  ([overview](https://tanstack.com/table/v8/docs/overview), [GitHub](https://github.com/TanStack/table))
- Client-side models comfortably handle a few thousand rows (examples go to ~100k); beyond
  that, move sort/filter/paginate to the server. ([column-filtering guide](https://tanstack.com/table/latest/docs/guide/column-filtering))
- For huge or interactive grids consider **AG Grid Enterprise** instead (SSRM, pivot,
  master/detail, built-in row+column virtualization) — but it brings its own design language
  and license cost. We stay on TanStack unless we hit AG Grid-only needs.
  ([AG Grid community vs enterprise](https://www.ag-grid.com/react-data-grid/community-vs-enterprise/),
  [TanStack on AG Grid](https://tanstack.com/table/v8/docs/enterprise/ag-grid))

---

## 1. Core table mechanics

| Feature | Recommended approach (TanStack) | Source |
|---|---|---|
| **Column sort + multi-sort** | `getSortedRowModel`; `sortingState` is an array → multi-sort is shift-click on headers. Sort chevron must not break header alignment; pick a sensible default sort (most recent / action-required first). | [sorting](https://tanstack.com/table/v8/docs/api/features/sorting), [P&P](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables) |
| **Filter — per column** | `getFilteredRowModel` + `getFacetedRowModel`/`getFacetedUniqueValues` to drive faceted (chip) filters; match filter labels to column headers. | [faceted](https://tanstack.com/table/latest/docs/framework/react/examples/filters-faceted), [Stripe filter controls](https://docs.stripe.com/stripe-apps/patterns/filter-controls) |
| **Filter — global search** | `globalFilter` state; debounced text box; highlight matches in results to ease mental matching. Support boolean/condition groups like Airtable for power users. | [Airtable views](https://support.airtable.com/docs/getting-started-with-airtable-views) |
| **Filter chips / clear-all** | Active filters render as removable chips; show a "Clear filters" link only when ≥1 filter active. | [Stripe filter controls](https://docs.stripe.com/stripe-apps/patterns/filter-controls) |
| **Grouping + aggregation** | `getGroupedRowModel` + `aggregationFns`; collapsible group sections with aggregate stats (sum/count) per group; **sticky group header** while scrolling. Allow multi-level grouping (Airtable-style). | [AG Grid grouping](https://www.ag-grid.com/javascript-data-grid/grouping/), [Linear display](https://linear.app/docs/display-options) |
| **Row selection (single / range / all-pages)** | `getRowSelectionModel`; checkbox column; shift-click = range; header checkbox = select page; offer explicit "select all N across pages" affordance distinct from "select this page". | [TanStack row selection](https://tanstack.com/table/v8/docs/api/features/row-selection), [Linear multi-select](https://keycombiner.com/collections/linear/) |
| **Bulk action bar** | Contextual toolbar appears **only on selection** (above table or sticky footer); show selected count; guard destructive actions (confirm). | [P&P](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables), [Stripe patterns](https://docs.stripe.com/stripe-apps/patterns) |
| **Column resize** | `columnSizing` + drag handle on the column separator; persist widths per user; respect min/max. | [column sizing](https://tanstack.com/table/v8/docs/guide/column-sizing) |
| **Column reorder** | `columnOrder` state + drag-and-drop headers. | [overview](https://tanstack.com/table/v8/docs/overview) |
| **Column pin / freeze** | `columnPinning`; pin checkbox+first column left and actions right via sticky CSS (single-table approach, not split tables). | [column pinning](https://tanstack.com/table/v8/docs/guide/column-pinning) |
| **Column show / hide** | `columnVisibility` + a "Columns" menu; thoughtful **defaults** for first load; provide reset-to-default. | [P&P](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables) |
| **Density toggle** | Row-height presets: condensed 40px / regular 48px / relaxed 56px; persist choice. | [P&P](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables), [Airtable row heights](https://support.airtable.com/docs/airtable-grid-view) |
| **Sticky header + sticky first column** | `position: sticky` header row; sticky checkbox/first data column for horizontal scroll context. | [P&P](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables) |
| **Horizontal-scroll affordance** | Visible scrollbar + shadow/gradient on the pinned column edge so users know more columns exist; simplify before resorting to h-scroll. | [Atlassian table](https://atlassian.design/components/table) |

---

## 2. Data presentation & states

- **Pagination vs infinite scroll vs virtualization — when each:**
  - *Pagination* (client `getPaginationRowModel`, or server LIMIT/OFFSET): default for finance
    records where total count, page jumps, and stable position matter (payouts, invoices).
  - *Infinite scroll*: feed-like browsing where exact position is unimportant.
  - *Virtualization*: long un-paginated lists (>100 rows rendered at once). Don't virtualize
    a paginated or <50-row table — it adds overhead.
    ([Retool server pagination](https://docs.retool.com/apps/guides/data/table),
    [MRT virtualization](https://www.material-react-table.com/docs/guides/virtualization))
- **Server vs client:** client models fine up to a few thousand rows; past that push
  sort/filter/paginate to the API (controlled state, URL-driven). ([column-filtering](https://tanstack.com/table/latest/docs/guide/column-filtering))
- **Empty / loading / error states:**
  - *Loading:* **skeleton rows** matching column layout (not a spinner) to avoid layout shift.
  - *Empty:* helpful empty state (illustration + primary action), and a distinct "no results
    for filters" state with a clear-filters CTA.
  - *Error:* inline error row/banner with retry; never blank the whole grid.
- **Cell types:** text (left-align), number/money (**right-align, tabular/monospace**), status
  pill, date (relative + absolute on hover), avatar/identity, actions (kebab/inline buttons),
  boolean/checkbox, tag/label, progress. Omit words already implied by the column header.
  ([P&P](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables))
- **Truncation + tooltip:** truncate with ellipsis; full value in tooltip / on expand; top-align
  multi-line cells (>3–4 lines), center-align short ones.
- **Inline edit:** editable columns with validation (email/number-range); confirm via Enter /
  checkmark / Save; use higher-friction modal/side-panel edit for high-stakes finance fields.
  ([Retool edit table](https://retoolers.io/blog-posts/retool-edit-table-effortless-inline-editing))
- **Expandable rows / subrows:** `getExpandedRowModel`; inline detail expansion or
  master/detail; side panel is the most scalable for rich detail (booking → line items).

---

## 3. Power features

- **Saved views / segments:** named views capturing filters + sort + grouping + visible columns
  + density (Linear/Airtable model); per-team or per-user. ([Linear filters](https://linear.app/docs/filters))
- **Per-user column prefs persistence:** persist `columnOrder`, `columnVisibility`,
  `columnSizing`, `columnPinning`, `density`, and last sort/filter to localStorage + server;
  reset-to-default always available. ([P&P](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables))
- **Keyboard nav:** arrow keys / j-k to move row focus, `space` to toggle select,
  `shift+↑/↓` to range-select, `enter` to open row, `x` to select (Linear-style), `f` to focus
  filter, `/` or Cmd-K command menu. ([Linear shortcuts](https://keycombiner.com/collections/linear/))
- **Copy cell / row:** Cmd/Ctrl-C copies focused cell or selected rows as TSV (paste into Sheets).
- **Export:** CSV (always) + XLSX (finance); export respects current filters/sort/visible columns;
  for large sets export server-side.
- **Quick filters / segments:** chip row of common saved filters above the table.
- **Search highlighting:** highlight matched substrings in cells. ([P&P](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables))

---

## 4. Mobile / responsive

- **Table → card collapse:** below a breakpoint, render each row as a stacked card (label:value)
  instead of a cramped grid.
- **Priority columns:** mark columns by priority; on narrow screens hide low-priority columns
  (kept reachable via row expand) and keep identity + key money column.
- **Horizontal scroll vs stacked:** prefer stacked cards for primary mobile flows; if h-scroll is
  used, keep first column pinned + add a scroll affordance. Simplify before scrolling.
  ([Atlassian table](https://atlassian.design/components/table))

---

## 5. Accessibility

- **Role choice:** static, read-mostly tabular data → semantic `<table>` (`role="table"`).
  Cell-level interactivity / inline editing / spreadsheet behavior → ARIA **grid** pattern
  (`role="grid"`, `row`, `gridcell`, `columnheader`, `rowheader`). Grid = one tab stop with
  roving focus; table = each control in normal tab order.
  ([W3C grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/),
  [MDN grid role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/grid_role))
- **Header associations:** real `<th>` with `scope`; `columnheader`/`rowheader` roles when using grid.
- **Sort announcement:** `aria-sort="ascending|descending|none"` on the active header.
- **Selection announcement:** `aria-selected` on selected rows/cells.
- **Grid keyboard (when role=grid):** Arrow keys between cells; Home/End = row ends;
  Ctrl+Home/End = grid corners; PageUp/Down = page rows; Enter/F2 = enter edit, Esc = exit edit;
  Shift+Space = select row, Ctrl+Space = select column, Ctrl+A = select all; manage roving
  `tabindex` (single tab stop). Mark non-editable cells `aria-readonly`.
  ([W3C grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/))
- **Caution:** ARIA grid is heavy and easy to break — only adopt it where interactivity truly
  requires it; otherwise prefer a plain accessible table.
  ([Roselli: ARIA grid anti-pattern](https://adrianroselli.com/2020/07/aria-grid-as-an-anti-pattern.html))
- Provide a caption/description for complex tables; visible focus rings throughout.
  ([Atlassian](https://atlassian.design/components/table))

---

## 6. Performance

- **Virtualization threshold:** virtualize only when rendering >100 rows at once; skip it for
  paginated tables or <50 rows (overhead outweighs benefit). Use **TanStack Virtual**
  (`@tanstack/react-virtual`) — TanStack Table ships no virtualization itself.
  ([virtualized rows example](https://tanstack.com/table/v8/docs/framework/react/examples/virtualized-rows),
  [MRT](https://www.material-react-table.com/docs/guides/virtualization))
- **Row height:** prefer fixed/estimated row heights for cheap virtualization; if dynamic, cache
  measured heights — don't measure the DOM on every scroll (avoids layout thrash).
  Virtualized layouts typically switch to CSS grid/flex instead of native table layout.
- **Column virtualization:** add it when many columns (wide finance grids); otherwise unnecessary.
- **Memoization:** memoize `columns` and `data` (stable refs / `useMemo`) so the table doesn't
  re-derive row models every render; memoize cell renderers; pass stable callbacks.
- **Avoid layout thrash:** batch reads/writes, avoid per-cell measurement in scroll handlers,
  debounce filter/search input.
  ([Virtualization in React](https://hoangtrungdigital.com/en/blog/virtualization-in-react-technique-for-handling-100000-rows-without-lag))

---

## 7. Implementation notes for EMS finance dashboard

- Build one reusable `<DataTable>` wrapper over TanStack v8 exposing: columns, data,
  server/client mode, selection, bulk-action slot, toolbar (search + filter chips + columns
  menu + density + export), pagination/virtualization mode, saved-views hook, and a prefs
  persistence hook (localStorage + server).
- Money columns: right-aligned, tabular-nums, currency-formatted (PKR), with status pills for
  paid/partial/overdue (mirrors the existing `partial` payment state machine).
- Default to **server-side** pagination+sort+filter for transaction/payout tables; client-side
  for small reference lists (vendor types, staff).
- Persist filters/sort in the URL so views are shareable and back-button works.
- Start with semantic `<table>` + full keyboard row nav; reserve ARIA grid for the inline-edit
  payroll/booking grids only.

---

## Sources

- TanStack Table v8: [overview](https://tanstack.com/table/v8/docs/overview) ·
  [column pinning](https://tanstack.com/table/v8/docs/guide/column-pinning) ·
  [column sizing](https://tanstack.com/table/v8/docs/guide/column-sizing) ·
  [virtualization rows example](https://tanstack.com/table/v8/docs/framework/react/examples/virtualized-rows) ·
  [sorting API](https://tanstack.com/table/v8/docs/api/features/sorting) ·
  [faceted filters example](https://tanstack.com/table/latest/docs/framework/react/examples/filters-faceted) ·
  [GitHub](https://github.com/TanStack/table)
- AG Grid: [community vs enterprise](https://www.ag-grid.com/react-data-grid/community-vs-enterprise/) ·
  [row grouping](https://www.ag-grid.com/javascript-data-grid/grouping/) ·
  [server-side row model](https://www.ag-grid.com/javascript-data-grid/server-side-model/)
- Linear: [display options](https://linear.app/docs/display-options) ·
  [filters](https://linear.app/docs/filters) ·
  [keyboard shortcuts](https://keycombiner.com/collections/linear/)
- Stripe: [app design patterns](https://docs.stripe.com/stripe-apps/patterns) ·
  [filter controls](https://docs.stripe.com/stripe-apps/patterns/filter-controls) ·
  [table component](https://docs.stripe.com/stripe-apps/components/table)
- Airtable: [getting started with views](https://support.airtable.com/docs/getting-started-with-airtable-views) ·
  [grid view / row heights](https://support.airtable.com/docs/airtable-grid-view)
- Retool: [table component](https://docs.retool.com/apps/guides/data/table) ·
  [inline editing](https://retoolers.io/blog-posts/retool-edit-table-effortless-inline-editing)
- Atlassian: [table](https://atlassian.design/components/table) ·
  [dynamic table](https://atlassian.design/components/dynamic-table)
- Material React Table: [virtualization guide](https://www.material-react-table.com/docs/guides/virtualization)
- Accessibility: [W3C ARIA grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) ·
  [MDN grid role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/grid_role) ·
  [Roselli: ARIA grid anti-pattern](https://adrianroselli.com/2020/07/aria-grid-as-an-anti-pattern.html)
- Enterprise UX: [Pencil & Paper data tables](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables) ·
  [Stéphanie Walter — complex data tables](https://stephaniewalter.design/blog/essential-resources-design-complex-data-tables/) ·
  [Virtualization in React](https://hoangtrungdigital.com/en/blog/virtualization-in-react-technique-for-handling-100000-rows-without-lag)
