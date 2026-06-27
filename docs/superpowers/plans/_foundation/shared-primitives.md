# Shared Dashboard Primitives — Foundation Spec

> **Scope.** The reusable UI building blocks every redesigned dashboard screen
> (admin + vendor) composes from. This is the contract layer: build these once,
> correctly, and every screen plan downstream consumes them instead of
> re-inventing tables, headers, drawers, and states.
>
> **Stack.** Next.js 14 (App Router) · React 18 · Tailwind v3 · shadcn/ui
> (Radix) · `@tanstack/react-table` v8 · `react-hook-form` + `zod` +
> `@hookform/resolvers` · `nuqs` v1.20 (already a dep — URL state) · `lucide-react`.
>
> **Aesthetic.** Calm ClickUp/Slack-grade neutrals. The active theme accent via
> shadcn tokens only — **never hardcode a hex/rgb/named color.** Use
> `bg-primary`, `text-muted-foreground`, `border-border`, `bg-card`,
> `bg-destructive`, `ring-ring`, etc. Soft borders (`border-border`, `rounded-lg`/
> `rounded-xl`), an 8px spacing rhythm (`gap-2`/`p-4`/`gap-6`/`p-6`), generous but
> dense. Dark mode is handled by the existing `next-themes` `class` strategy
> driven by the shadcn HSL CSS variables; **all classes below resolve correctly
> in both themes because they reference tokens, not literals.**

---

## 0. Ground rules (read before building any primitive)

### 0.1 Extend, do not duplicate

The codebase already ships building blocks. The map below is binding — each new
primitive **wraps/generalizes** the existing file, it does not fork it.

| New primitive | Builds on (existing) | Relationship |
| --- | --- | --- |
| `AppShell` | `app/(dashboard)/dashboard/layout.tsx`, `components/dashboard/layout/app-sidebar.tsx`, `components/dashboard/layout/header.tsx`, `components/ui/sidebar.tsx` | Extracts the `ThemeProvider → SidebarProvider → AppSidebar → SidebarInset → Header` frame into a single component. **Re-renders `<AppSidebar/>` verbatim** — the role/craft gating stays inside `app-sidebar.tsx`. |
| `DataTable<T>` | `globalComponents/globalTable/global-table.tsx` + `components/data-table*.tsx` + `components/use-data-table.tsx` | Generalizes `GlobalTable`: adds states (loading/empty/error), a toolbar slot, and the **mobile card collapse**. Keeps `useDataTable` (nuqs pagination) as its engine. |
| `PageHeader` | `components/dashboard/layout/page-header.tsx` | Adds `breadcrumb` + `actions` are already there; we only **add the breadcrumb slot** and keep `eyebrow/title/description/actions`. |
| `StatCard` | `components/ui/card.tsx` | New, composed from `Card`. |
| `FilterBar` | `globalComponents/globalTable/components/data-table-search.tsx` | Generalizes the nuqs search pattern + adds segmented chips. |
| `FormDrawer` / `FormDialog` | `components/ui/drawer.tsx`, `components/ui/dialog.tsx`, `components/ui/form.tsx` | RHF+zod shells. |
| `EmptyState` | `components/user-dashboard/empty-state.tsx` | **Re-homed + de-hardcoded.** The existing one uses `bridal-*` literals — the new one uses tokens and lives in `globalComponents`. |
| `Skeleton*` | `components/ui/skeleton.tsx` | Composed sets. |
| `ErrorBoundary` | — (gap) | New class component; fixes the "toast-only, no recovery UI" gap. |

### 0.2 Conventions every primitive obeys

- **`"use client"`** at the top of every primitive that uses state, refs, hooks,
  Radix, or RHF. `PageHeader`, `StatCard`, `EmptyState`, and the `*Skeleton`
  components are pure/presentational and **omit** the directive (server-safe).
- **`cn()`** from `@/lib/utils` for all class merging; every component takes a
  `className?: string` escape hatch merged **last**.
- **8px rhythm:** spacing is `gap-2 / gap-3 / gap-4 / gap-6`, padding
  `p-3 / p-4 / px-4 / md:p-6`. Avoid odd values.
- **Tokens only.** Grep gate before merge: a primitive PR must return **zero**
  matches for `#[0-9a-fA-F]{3,6}`, `rgb(`, `hsl(` (literal), and bare Tailwind
  color families (`bg-(red|blue|green|amber|slate|gray|zinc)-`). Use semantic
  tokens; for trend/delta semantics use `text-primary` (accent) /
  `text-muted-foreground` and reserve `text-destructive` for true negatives.
- **Files** live under `components/dashboard/primitives/` (new folder) unless a
  better existing home is noted. Barrel export from
  `components/dashboard/primitives/index.ts`.
- **Generics:** table/list primitives are generic `<T extends object>` to match
  `useDataTable`'s existing constraint.
- **a11y:** interactive icon-only buttons carry `sr-only` labels (matches the
  pagination component); async error regions use `role="alert"` +
  `aria-live="assertive"`; status/loading regions use `aria-live="polite"` and
  `aria-busy`.

### 0.3 Folder layout produced by this spec

```
components/dashboard/primitives/
  index.ts                  # barrel
  app-shell.tsx             # AppShell
  page-header.tsx           # PageHeader (re-export shim → see §3)
  stat-card.tsx             # StatCard
  filter-bar.tsx            # FilterBar
  empty-state.tsx           # EmptyState (token-based)
  error-boundary.tsx        # ErrorBoundary (class)
  skeletons.tsx             # TableSkeleton, CardSkeleton, DetailSkeleton
  form-shell/
    form-drawer.tsx         # FormDrawer
    form-dialog.tsx         # FormDialog
    form-shell-parts.tsx    # shared header/body/footer/error-summary
  data-table/
    data-table.tsx          # DataTable<T> (orchestrator)
    data-table-toolbar.tsx  # toolbar slot wrapper
    data-table-cards.tsx    # mobile card collapse renderer
    (re-uses globalTable/components/* for header, pagination, column-view)
```

---

## 1. AppShell

**File:** `components/dashboard/primitives/app-shell.tsx`

**Why.** Today the frame is inlined in `app/(dashboard)/dashboard/layout.tsx`.
Redesigned route groups need the same chrome without copy-pasting the provider
stack. `AppShell` is that frame as one component. **It does not touch sidebar
content** — it renders `<AppSidebar/>`, whose `buildVendorSections` /
`buildAdminSections` role + craft gating (see `app-sidebar.tsx` lines 52–198)
stays exactly as is.

**Key insight — mobile is already solved.** `components/ui/sidebar.tsx` already
implements full → icon-rail → off-canvas behavior: `<Sidebar collapsible="icon">`
renders a Radix `Sheet` when `useIsMobile()` is true (sidebar.tsx lines 178–211)
and an icon rail when collapsed on desktop. **Do not re-implement responsive
sidebar logic.** `AppShell` only owns the providers, the `SidebarInset`, the
sticky `Header`, and the `min-w-0 / overflow-x-hidden` clipping fix.

```tsx
"use client"

import * as React from "react"
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import Header from "@/components/dashboard/layout/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export interface AppShellProps {
  children: React.ReactNode
  /** Optional banner row rendered between Header and content (e.g. VerificationBanner). */
  banner?: React.ReactNode
  /** Force sidebar default open/closed; defaults to shadcn cookie/persisted state. */
  defaultSidebarOpen?: boolean
  /** Escape hatch for the inset scroll region. */
  className?: string
}

/**
 * Canonical authenticated dashboard frame:
 *   SidebarProvider → AppSidebar (role/craft-gated, untouched)
 *                   → SidebarInset → sticky Header → banner? → content
 *
 * `data-theme` / dark mode come from the ThemeProvider that wraps the route
 * group layout — AppShell is rendered INSIDE it, so it inherits the theme
 * class. Keep ThemeProvider in the layout so SSR theme is correct.
 *
 * `min-w-0 overflow-x-hidden` on the inset is load-bearing: without it a wide
 * table/currency string pushes the flex child past the available width and
 * clips the right edge (documented in the original layout).
 */
export function AppShell({
  children,
  banner,
  defaultSidebarOpen,
  className,
}: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <AppSidebar />
      <SidebarInset className={cn("min-w-0 overflow-x-hidden", className)}>
        <Header />
        {banner ? <div className="px-4 pt-4 md:px-6">{banner}</div> : null}
        <div className="flex flex-1 min-w-0 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

**Responsive behavior** (all delegated to shadcn `Sidebar`/`useIsMobile`,
breakpoint `md` = 768px):

| Width | Sidebar | Trigger |
| --- | --- | --- |
| `≥ md`, expanded | Full rail (`--sidebar-width`) | `SidebarTrigger` in Header collapses to icon rail |
| `≥ md`, collapsed | Icon-only rail (`--sidebar-width-icon`) | persisted via shadcn cookie |
| `< md` | **Off-canvas Sheet** (`SIDEBAR_WIDTH_MOBILE = 18rem`) | `SidebarTrigger` opens `openMobile` Sheet; auto-closes on route change |

**Migration note.** `app/(dashboard)/dashboard/layout.tsx` becomes:
`ThemeProvider → NextTopLoader → ProtectedRoutes → LocaleProvider →
ReviewProfileGate → <AppShell banner={<VerificationBanner/>}>{children}</AppShell>`.
`ThemeProvider`, `ProtectedRoutes`, `ReviewProfileGate`, and `LocaleProvider`
**stay in the layout** (they gate access / provide context above the shell);
`AppShell` only absorbs the provider→inset→header chrome. This keeps
`ReviewProfileGate` outside `SidebarProvider`, preserving the
"under-review = no chrome" guarantee.

---

## 2. DataTable&lt;T&gt;

**Files:**
`components/dashboard/primitives/data-table/data-table.tsx` (orchestrator),
`data-table-toolbar.tsx`, `data-table-cards.tsx`.
**Reuses:** `globalTable/components/data-table.tsx` (desktop `<table>`),
`data-table-pagination.tsx`, `data-table-column-view.tsx`, and the
`useDataTable` hook (nuqs `page`/`limit`).

**Why.** `GlobalTable` is desktop-only, has no loading/empty/error states baked
in, and no toolbar or mobile card view. `DataTable<T>` is the superset every
list screen renders. **It keeps `useDataTable` as the engine** — the caller still
constructs the table via the hook and passes it down, so server-side pagination,
sorting, visibility, and row selection are unchanged.

### 2.1 Props

```tsx
"use client"

import type { Table as RTTable } from "@tanstack/react-table"
import type { PaginationStateTypes } from "@/components/dashboard/globalComponents/globalTable/components/use-data-table"
import type { ReactNode } from "react"

type NuqsSetter = (
  v: number | ((old: number) => number | null) | null,
) => Promise<URLSearchParams>

export interface DataTableProps<TData extends object> {
  /** The instance from useDataTable(). DataTable never builds its own table. */
  table: RTTable<TData>
  paginationState: PaginationStateTypes
  totalItems: number
  setCurrentPage?: NuqsSetter
  setPageSizeValue?: NuqsSetter

  /** ── States (mutually resolved in priority: error > loading > empty > data) ── */
  isLoading?: boolean
  isError?: boolean
  error?: unknown
  onRetry?: () => void
  /** Rows to show in the skeleton while loading. Default 8. */
  skeletonRows?: number

  /** ── Empty state (only when !isLoading && !isError && rows === 0) ── */
  empty?: ReactNode // full override; else built from emptyConfig
  emptyConfig?: {
    icon?: ReactNode
    title: string
    description?: string
    action?: ReactNode
  }

  /** ── Toolbar slot (Export / Import / bulk actions live here, left side) ── */
  toolbar?: ReactNode
  /** Built-in nuqs search wired into the toolbar's left. Omit to hide. */
  search?: {
    searchKey: string
    searchQuery: string
    setSearchQuery: (v: string | null) => Promise<URLSearchParams>
    setPage: NuqsSetter
    placeholder?: string
  }
  /** Show the column-visibility "View" dropdown in the toolbar (default true). */
  showColumnView?: boolean

  /** ── CRITICAL: mobile card collapse (< md) ── */
  /**
   * When provided, below `md` the table is replaced by a stacked list where
   * each row is rendered by this function. When omitted, DataTable falls back
   * to the horizontally-scrollable table (existing behavior) on mobile too.
   */
  renderCard?: (row: TData, ctx: { rowIndex: number }) => ReactNode
  /** Stable key for card list items. Default uses the row index. */
  cardKey?: (row: TData, rowIndex: number) => string

  /** Height of the scroll viewport. Default matches GlobalTable. */
  maxHeightClassName?: string // e.g. "h-[calc(100dvh-260px)]"
  className?: string
}
```

### 2.2 Structure & render priority

```tsx
export function DataTable<TData extends object>(props: DataTableProps<TData>) {
  const rows = props.table.getRowModel().rows

  return (
    <div className={cn("space-y-4 w-full max-w-full", props.className)}>
      {/* Toolbar — search (left) + actions slot + column View (right) */}
      <DataTableToolbar
        search={props.search}
        showColumnView={props.showColumnView ?? true}
        table={props.table}
      >
        {props.toolbar}
      </DataTableToolbar>

      {/* Body: error > loading > empty > data */}
      {props.isError ? (
        <DataTableError error={props.error} onRetry={props.onRetry} />
      ) : props.isLoading ? (
        <>
          {/* desktop skeleton */}
          <div className="hidden md:block">
            <TableSkeleton rows={props.skeletonRows ?? 8} />
          </div>
          {/* mobile skeleton */}
          <div className="md:hidden space-y-3" aria-busy="true">
            {Array.from({ length: props.skeletonRows ?? 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : rows.length === 0 ? (
        props.empty ?? <EmptyState {...(props.emptyConfig ?? defaultEmpty)} />
      ) : (
        <>
          {/* ≥ md: existing scrollable table (sticky header) */}
          <div className={cn(props.renderCard && "hidden md:block")}>
            <ExistingDataTable table={props.table} maxHeightClassName={props.maxHeightClassName} />
          </div>
          {/* < md: stacked cards (only when renderCard provided) */}
          {props.renderCard && (
            <DataTableCards
              rows={rows.map((r) => r.original)}
              renderCard={props.renderCard}
              cardKey={props.cardKey}
            />
          )}
        </>
      )}

      {/* Pagination — hidden in error/empty/loading-with-no-data */}
      {!props.isError && !props.isLoading && rows.length > 0 && (
        <DataTablePagination
          table={props.table}
          paginationState={props.paginationState}
          totalItems={props.totalItems}
          setCurrentPage={props.setCurrentPage}
          setPageSizeValue={props.setPageSizeValue}
        />
      )}
    </div>
  )
}
```

### 2.3 Sticky header (enhancement to the reused desktop table)

The reused `globalTable/components/data-table.tsx` already wraps in a
`ScrollArea` with a fixed height. Add a sticky header class so headers pin while
the body scrolls — change its `<TableHeader>` to:

```tsx
<TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-b">
```

(`bg-card` keeps the header opaque over scrolling rows in both themes.) This is
the **only** edit to the existing desktop table; everything else is composed
around it so other call sites of `GlobalTable` are unaffected.

### 2.4 Toolbar — `data-table-toolbar.tsx`

```tsx
"use client"
export function DataTableToolbar<TData>({
  children, search, showColumnView, table,
}: {
  children?: ReactNode
  search?: DataTableProps<TData>["search"]
  showColumnView?: boolean
  table: RTTable<TData>
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2 min-w-0">
        {search && (
          <DataTableSearch
            searchKey={search.searchKey}
            searchQuery={search.searchQuery}
            setSearchQuery={search.setSearchQuery as any}
            setPage={search.setPage as any}
            placeholder={search.placeholder}
          />
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {children /* Export / Import / bulk actions */}
        {showColumnView && <DataTableColumnView table={table} />}
      </div>
    </div>
  )
}
```

### 2.5 Mobile cards — `data-table-cards.tsx`

```tsx
"use client"
export function DataTableCards<TData>({
  rows, renderCard, cardKey,
}: {
  rows: TData[]
  renderCard: (row: TData, ctx: { rowIndex: number }) => ReactNode
  cardKey?: (row: TData, i: number) => string
}) {
  return (
    <ul role="list" className="md:hidden space-y-3">
      {rows.map((row, i) => (
        <li
          key={cardKey?.(row, i) ?? i}
          className="rounded-lg border border-border bg-card p-4 shadow-sm transition-colors"
        >
          {renderCard(row, { rowIndex: i })}
        </li>
      ))}
    </ul>
  )
}
```

**Card-render API contract.** The screen owner supplies a `renderCard(row)` that
returns the card's inner JSX (the `<li>` + border/padding/shadow are owned by
`DataTableCards`). Recommended internal layout for consistency: a top row with
primary label (`text-sm font-medium text-foreground`) + a right-aligned status
`Badge`/menu; a `dl`/grid of secondary fields (`text-xs text-muted-foreground`
labels, `text-sm text-foreground` values); an optional action row. Keep it to
the same 8px rhythm (`space-y-2`, `gap-2`).

### 2.6 Error sub-view (used by §9 boundary too)

```tsx
function DataTableError({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center"
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <p className="text-sm font-medium text-foreground">Couldn’t load this data</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        {error instanceof Error ? error.message : "Something went wrong. Please try again."}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 size-3.5" /> Retry
        </Button>
      )}
    </div>
  )
}
```

**Responsive summary.** `≥ md`: sticky-header scroll table + full pagination.
`< md`: stacked cards (if `renderCard`) else horizontal-scroll table; pagination
row already collapses (rows-per-page hidden under `md` per the existing
component). Loading and empty states render their own responsive variants.

---

## 3. PageHeader

**File:** `components/dashboard/primitives/page-header.tsx`
(re-exports/extends `components/dashboard/layout/page-header.tsx`).

**Why.** The existing `PageHeader` already nails `eyebrow / title / description /
actions` and the responsive `lg:flex-row` split. We only **add a breadcrumb
slot** above the title. Keep the existing component as the visual base; the
primitive adds the slot so we don't fork the styling.

```tsx
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps {
  /** Optional breadcrumb element (use existing <Breadcrumbs/>). Renders above title. */
  breadcrumb?: ReactNode
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  breadcrumb, eyebrow, title, description, actions, className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {breadcrumb ? <div className="min-w-0">{breadcrumb}</div> : null}
      <header className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1 min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h1 className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-foreground leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-[13.5px] text-muted-foreground max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>
        )}
      </header>
    </div>
  )
}
```

**Responsive.** Single column under `lg`; title block + actions split to a row at
`lg`. Actions `flex-wrap` so multiple buttons stack gracefully on narrow widths.
Breadcrumb is `min-w-0` to truncate, not push width.

---

## 4. StatCard

**File:** `components/dashboard/primitives/stat-card.tsx`. Composed from
`components/ui/card.tsx`.

**Why.** Dashboards open with KPI rows. One token-safe card so deltas and trend
colors are consistent everywhere.

```tsx
import type { ReactNode } from "react"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface StatCardProps {
  label: string
  value: ReactNode
  /** Signed percentage, e.g. +12.4 or -3. Sign drives the trend color/icon. */
  delta?: number
  /** Overrides which direction counts as "good". Default: up = good. */
  invertTrend?: boolean
  /** Sub-label under the delta, e.g. "vs last 30 days". */
  deltaLabel?: string
  icon?: ReactNode
  isLoading?: boolean
  className?: string
}

export function StatCard({
  label, value, delta, deltaLabel, icon, invertTrend, isLoading, className,
}: StatCardProps) {
  const up = (delta ?? 0) > 0
  const down = (delta ?? 0) < 0
  const isGood = invertTrend ? down : up
  const isBad = invertTrend ? up : down

  // Tokens only: positive → accent, negative → destructive, flat → muted.
  const trendClass = delta == null || delta === 0
    ? "text-muted-foreground"
    : isGood ? "text-primary"
    : isBad ? "text-destructive"
    : "text-muted-foreground"

  const TrendIcon = delta == null || delta === 0 ? Minus : up ? ArrowUpRight : ArrowDownRight

  if (isLoading) {
    return (
      <Card className={cn("border-border", className)}>
        <CardContent className="p-4 md:p-5 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-border", className)}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {icon && (
            <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
              {icon}
            </span>
          )}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        {delta != null && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", trendClass)}>
              <TrendIcon className="size-3.5" />
              {Math.abs(delta)}%
            </span>
            {deltaLabel && <span className="text-xs text-muted-foreground">{deltaLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

**Responsive.** Designed to sit in a grid the page owns:
`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4`. `tabular-nums` keeps
KPI digits aligned. `value` accepts a node so currency/units can be styled.

---

## 5. FilterBar

**File:** `components/dashboard/primitives/filter-bar.tsx`.
**Reuses:** the nuqs pattern from `data-table-search.tsx`.

**Why.** Lists need search + quick segmented filters that survive refresh and are
shareable. The constraint: **no heavy deps** — use `nuqs` (already installed),
not a new query lib, and **not** ad-hoc `useState` (which the old search wrongly
mixed). Filter state lives in the URL so back/forward and deep links work.

### 5.1 URL-param approach (the "without heavy deps" answer)

Each segmented group is one `useQueryState` key via `nuqs`. Single-select uses
`parseAsString`; multi-select uses `parseAsArrayOf(parseAsString)`. Search uses
`parseAsString` with `useTransition` for the pending shimmer (mirrors the
existing search component). On any change, **reset `page` to 1** (same setter the
table already exposes) so filtering doesn't strand you on an empty page.

```tsx
"use client"

import * as React from "react"
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface FilterChip {
  /** Stable value written to the URL. */
  value: string
  label: string
  count?: number
  icon?: React.ReactNode
}

export interface FilterSegment {
  /** URL param key, e.g. "status". */
  paramKey: string
  label?: string
  options: FilterChip[]
  /** true → multi-select (array param); false → single-select. Default false. */
  multiple?: boolean
}

export interface FilterBarProps {
  /** Search param key. Omit to hide the search input. Default "q". */
  searchParamKey?: string
  searchPlaceholder?: string
  segments?: FilterSegment[]
  /** Called after ANY filter change so the table can reset pagination. */
  onChange?: () => void
  /** Reset page setter (nuqs) — preferred over onChange for the common case. */
  resetPage?: (v: number) => Promise<URLSearchParams>
  className?: string
}
```

### 5.2 Structure

```tsx
export function FilterBar({
  searchParamKey = "q", searchPlaceholder = "Search…",
  segments = [], resetPage, onChange, className,
}: FilterBarProps) {
  const [isPending, startTransition] = React.useTransition()
  const [q, setQ] = useQueryState(
    searchParamKey,
    parseAsString.withDefault("").withOptions({ shallow: false, history: "push" }),
  )

  const afterChange = () => { resetPage?.(1); onChange?.() }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {searchParamKey && (
        <Input
          placeholder={searchPlaceholder}
          value={q ?? ""}
          onChange={(e) => { setQ(e.target.value, { startTransition }); afterChange() }}
          className={cn("w-full md:max-w-sm text-sm", isPending && "animate-pulse")}
        />
      )}
      {segments.map((seg) => (
        <Segment key={seg.paramKey} segment={seg} onAfterChange={afterChange} />
      ))}
    </div>
  )
}
```

### 5.3 Segmented chip group (token-based "segmented control")

```tsx
function Segment({ segment, onAfterChange }: { segment: FilterSegment; onAfterChange: () => void }) {
  const { paramKey, options, multiple } = segment

  // Two hook calls but only one is "live" — gate by `multiple`.
  const single = useQueryState(paramKey, parseAsString.withOptions({ shallow: false }))
  const multi  = useQueryState(paramKey, parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: false }))

  const isActive = (v: string) =>
    multiple ? (multi[0] ?? []).includes(v) : single[0] === v

  const toggle = (v: string) => {
    if (multiple) {
      const cur = multi[0] ?? []
      multi[1](cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v])
    } else {
      single[1](single[0] === v ? null : v) // click active chip → clear
    }
    onAfterChange()
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={segment.label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={isActive(o.value)}
          onClick={() => toggle(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            isActive(o.value)
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {o.icon}
          {o.label}
          {typeof o.count === "number" && (
            <span className={cn(
              "rounded-full px-1.5 text-[10px] tabular-nums",
              isActive(o.value) ? "bg-primary-foreground/20" : "bg-muted",
            )}>
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
```

**Responsive.** Chips `flex-wrap` to multiple lines on mobile; search is
full-width under `md`, capped at `max-w-sm` above. State is URL-backed so a
filtered view is shareable and survives refresh — no extra dependency added.

---

## 6. FormDrawer &amp; FormDialog

**Files:** `components/dashboard/primitives/form-shell/form-drawer.tsx`,
`form-dialog.tsx`, `form-shell-parts.tsx`.
**Reuses:** `components/ui/drawer.tsx`, `components/ui/dialog.tsx`,
`components/ui/form.tsx`, `react-hook-form`, `zod`, `@hookform/resolvers/zod`.

**Why.** Every create/edit surface repeats the same skeleton: header, scrollable
body, sticky footer with Cancel + a submit button that shows a spinner, and an
error-summary region. Two shells share one parts file; pick `FormDrawer` for
long/complex forms (side sheet), `FormDialog` for short ones (centered modal).
Heuristic: **drawer** when fields > ~6 or there are sections; **dialog**
otherwise.

### 6.1 Shared generic props

```tsx
"use client"
import type { ReactNode } from "react"
import type { UseFormReturn, FieldValues, SubmitHandler } from "react-hook-form"

export interface FormShellProps<TValues extends FieldValues> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** The RHF form built by the caller with zodResolver. */
  form: UseFormReturn<TValues>
  onSubmit: SubmitHandler<TValues>
  children: ReactNode // the field controls (FormField rows)
  submitLabel?: string // default "Save"
  cancelLabel?: string // default "Cancel"
  /** Disable submit independent of validity (e.g. unchanged form). */
  submitDisabled?: boolean
  /** Top-level async error (e.g. server 500) surfaced in the error summary. */
  submitError?: string | null
  /** Drawer side; FormDrawer only. Default "right". */
  side?: "right" | "left" | "bottom"
}
```

### 6.2 Shared parts — `form-shell-parts.tsx`

```tsx
"use client"
import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { cn } from "@/lib/utils"

/** aria-live error summary: lists RHF field errors + an optional submitError. */
export function FormErrorSummary({
  errors, submitError,
}: { errors: Record<string, { message?: string }>; submitError?: string | null }) {
  const fieldMsgs = Object.values(errors).map((e) => e?.message).filter(Boolean) as string[]
  const all = [...(submitError ? [submitError] : []), ...fieldMsgs]
  if (all.length === 0) return null
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <p className="font-medium">Please fix the following:</p>
      <ul className="mt-1 list-disc pl-4 space-y-0.5">
        {all.map((m, i) => <li key={i}>{m}</li>)}
      </ul>
    </div>
  )
}

/** Sticky footer: Cancel (left/ghost) + Submit (right) with loading spinner. */
export function FormFooter({
  onCancel, submitLabel = "Save", cancelLabel = "Cancel",
  isSubmitting, submitDisabled,
}: {
  onCancel: () => void
  submitLabel?: string
  cancelLabel?: string
  isSubmitting: boolean
  submitDisabled?: boolean
}) {
  return (
    <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-border bg-background px-4 py-3 md:px-6">
      <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
        {cancelLabel}
      </Button>
      <Button type="submit" disabled={isSubmitting || submitDisabled}>
        {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  )
}

/** Wraps children in <Form> + <form> with the standard 3-zone grid. */
export function FormShellBody<TValues extends import("react-hook-form").FieldValues>({
  form, onSubmit, header, footer, children,
}: {
  form: import("react-hook-form").UseFormReturn<TValues>
  onSubmit: import("react-hook-form").SubmitHandler<TValues>
  header: React.ReactNode
  footer: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full max-h-[inherit] flex-col"
      >
        {header}
        {/* Scroll body — the only growing/scrolling zone. */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 space-y-4">
          {children}
        </div>
        {footer}
      </form>
    </Form>
  )
}
```

### 6.3 `FormDrawer`

```tsx
"use client"
import {
  Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer"
import { FormShellBody, FormFooter, FormErrorSummary } from "./form-shell-parts"
import type { FormShellProps } from "./types"
import type { FieldValues } from "react-hook-form"

export function FormDrawer<TValues extends FieldValues>({
  open, onOpenChange, title, description, form, onSubmit,
  children, submitLabel, cancelLabel, submitDisabled, submitError,
}: FormShellProps<TValues>) {
  const isSubmitting = form.formState.isSubmitting
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="ml-auto h-full w-full max-w-md sm:max-w-lg">
        <FormShellBody
          form={form}
          onSubmit={onSubmit}
          header={
            <DrawerHeader className="border-b border-border px-4 py-3 text-left md:px-6">
              <DrawerTitle className="text-base font-semibold">{title}</DrawerTitle>
              {description && (
                <DrawerDescription className="text-sm text-muted-foreground">
                  {description}
                </DrawerDescription>
              )}
              <FormErrorSummary errors={form.formState.errors as any} submitError={submitError} />
            </DrawerHeader>
          }
          footer={
            <FormFooter
              onCancel={() => onOpenChange(false)}
              submitLabel={submitLabel}
              cancelLabel={cancelLabel}
              isSubmitting={isSubmitting}
              submitDisabled={submitDisabled}
            />
          }
        >
          {children}
        </FormShellBody>
      </DrawerContent>
    </Drawer>
  )
}
```

### 6.4 `FormDialog`

Identical wiring, swapping `Drawer*` for `Dialog*`
(`components/ui/dialog.tsx`): `DialogContent className="max-w-lg p-0
gap-0 max-h-[85dvh]"`, `DialogHeader` (with `FormErrorSummary`) as the header,
same `FormShellBody` + `FormFooter`. The `p-0 gap-0` + `max-h-[85dvh]` makes the
body the sole scroll zone and the footer sticky.

**Responsive.** `FormDrawer` is a right side-sheet on desktop and **full-width**
under `sm` (`w-full max-w-md`). `FormDialog` is centered, `max-w-lg`, capped at
`85dvh` so the footer never leaves the viewport on short screens. Body scrolls;
header + footer pinned. Error summary is `aria-live="assertive"` and focus moves
to it on submit-failure (caller may `form.setFocus` the first errored field).

---

## 7. EmptyState

**File:** `components/dashboard/primitives/empty-state.tsx`. Token-based rewrite
of `components/user-dashboard/empty-state.tsx` (which hardcodes `bridal-*`
colors — those must not leak into the dashboard primitive set).

**Why + craft-awareness.** Empty copy should speak the vendor's craft ("No
shoots yet" for a photographer, "No bookings yet" for a venue). The primitive
keeps the **same prop shape** as the existing one (icon/title/description/action)
so it's a drop-in, but adds an optional `craftNoun` helper hook usage note so
screens can derive labels from `getVendorTypeConfig(...).displayName` /
nav-label overrides rather than hardcoding "items".

```tsx
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode // a <Button> (the CTA)
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-5 flex size-12 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
```

**Craft-aware usage (preserved).** The screen owner builds copy from the active
business's vendor config — e.g.
`const noun = getVendorTypeConfig(vendorType)?.navLabels?.bookings ?? "bookings"`
then `title={`No ${noun} yet`}`. The primitive stays generic; **craft
specialization happens at the call site**, exactly as the sidebar derives its
labels (`app-sidebar.tsx` §19.3), so we don't bake craft strings into the
primitive.

**Responsive.** Centered column at any width; `max-w-sm` description keeps line
length readable on wide screens.

---

## 8. Skeleton set

**File:** `components/dashboard/primitives/skeletons.tsx`. Composed from
`components/ui/skeleton.tsx` (`<Skeleton/>` = `animate-pulse rounded-md bg-muted`).

**Why.** Consistent loading shapes that match the real layouts (table rows, KPI
cards, detail pages) so there's no layout shift when data arrives. Consumed
directly by `DataTable` (§2) and `StatCard` (§4).

```tsx
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

/** Mirrors the desktop DataTable: bordered, sticky-ish header, N shimmer rows. */
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-md border border-border" aria-busy="true" aria-live="polite">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: cols }).map((_, i) => (
              <TableHead key={i}><Skeleton className="h-4 w-24" /></TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <TableCell key={c}>
                  <Skeleton className={c === 0 ? "h-4 w-32" : "h-4 w-20"} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/** One list/grid card placeholder (mobile DataTable rows, KPI grids). */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3" aria-busy="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

/** Detail/show page: header block + two-column field grid. */
export function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-40 max-w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Responsive.** `TableSkeleton` is the desktop loader (DataTable hides it under
`md` and shows `CardSkeleton`s instead). `DetailSkeleton` field grid is single
column under `sm`, two columns above. All shimmer widths use `max-w-full` to
avoid horizontal overflow on narrow screens.

---

## 9. ErrorBoundary

**File:** `components/dashboard/primitives/error-boundary.tsx`.

**Why (the gap it fixes).** Today failures surface as a toast and then leave a
blank/broken section with no way to recover. A **per-section** React error
boundary catches render-time throws, shows an inline retry card (reusing the §2.6
visual), and lets the user re-attempt without a full page reload. Class component
is required — React error boundaries cannot be hooks.

```tsx
"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ErrorBoundaryProps {
  children: React.ReactNode
  /** Custom fallback; receives the error + a reset() to retry. */
  fallback?: (args: { error: Error; reset: () => void }) => React.ReactNode
  /** Optional logger (Sentry, console, analytics). */
  onError?: (error: Error, info: React.ErrorInfo) => void
  /** Changing any value here auto-resets the boundary (e.g. [routeKey]). */
  resetKeys?: unknown[]
  /** Label for the section, shown in the default fallback. */
  title?: string
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info)
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", error, info)
    }
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    // Auto-reset when resetKeys change (e.g. navigation / new filter).
    if (this.state.error && prev.resetKeys && this.props.resetKeys) {
      const changed = this.props.resetKeys.some((k, i) => k !== prev.resetKeys![i])
      if (changed) this.reset()
    }
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    if (this.props.fallback) return this.props.fallback({ error, reset: this.reset })

    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-center"
      >
        <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          {this.props.title ?? "Something went wrong"}
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">{error.message}</p>
        <Button variant="outline" size="sm" onClick={this.reset}>
          <RefreshCw className="mr-2 size-3.5" /> Try again
        </Button>
      </div>
    )
  }
}
```

**Usage pattern.** Wrap each independent dashboard section (a table, a KPI row, a
detail panel) in its own `ErrorBoundary` so one failure doesn't blank the whole
page. Pair with `resetKeys={[pathname]}` so navigating away clears a stuck error.
For **data-fetch** errors (which don't throw during render), prefer the
`DataTable` `isError`/`onRetry` props (§2.6) — the boundary is the safety net for
unexpected render-time throws.

**Responsive.** Single centered card at any width; identical to the DataTable
error sub-view for visual consistency.

---

## 10. Composition example (how a screen consumes the set)

```tsx
"use client"
// app/(dashboard)/dashboard/bookings/page.tsx (illustrative)
export default function BookingsScreen() {
  const { table, paginationState, totalItems, setCurrentPage, setPageSizeValue } =
    useDataTable({ data, columns, totalItems: count })

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={<Breadcrumbs />}
        eyebrow="Operations"
        title="Bookings"
        description="Every confirmed and pending booking for your business."
        actions={<Button><Plus className="mr-2 size-4" /> New booking</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="This month" value="₨ 1.2M" delta={12.4} deltaLabel="vs last 30d" icon={<TrendingUp />} />
        {/* …more StatCards… */}
      </div>

      <FilterBar
        searchPlaceholder="Search bookings…"
        resetPage={setCurrentPage}
        segments={[{ paramKey: "status", options: [
          { value: "pending", label: "Pending", count: 4 },
          { value: "confirmed", label: "Confirmed", count: 21 },
        ]}]}
      />

      <ErrorBoundary title="Couldn’t render bookings" resetKeys={[/* pathname */]}>
        <DataTable
          table={table}
          paginationState={paginationState}
          totalItems={totalItems}
          setCurrentPage={setCurrentPage}
          setPageSizeValue={setPageSizeValue}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          emptyConfig={{ title: "No bookings yet", description: "New bookings will appear here.", action: <Button>Create one</Button> }}
          toolbar={<><ExportButton/><ImportButton/></>}
          search={{ searchKey: "name", searchQuery, setSearchQuery, setPage: setCurrentPage }}
          renderCard={(b) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{b.customerName}</span>
                <Badge>{b.status}</Badge>
              </div>
              <dl className="grid grid-cols-2 gap-1 text-xs">
                <dt className="text-muted-foreground">Date</dt><dd className="text-foreground">{b.date}</dd>
                <dt className="text-muted-foreground">Amount</dt><dd className="text-foreground tabular-nums">{b.amount}</dd>
              </dl>
            </div>
          )}
        />
      </ErrorBoundary>
    </PageContainer>
  )
}
```

`PageContainer` (existing) supplies the page frame; `AppShell` (§1) supplies the
chrome around all routes. Every other primitive slots in as above.

---

## 11. Build order & acceptance gates

1. **Skeletons** (§8) → no deps, unblocks DataTable/StatCard loading.
2. **EmptyState** (§7) + **ErrorBoundary** (§9) → state primitives.
3. **PageHeader** (§3) + **StatCard** (§4) → presentational.
4. **FilterBar** (§5) → nuqs pattern.
5. **DataTable** (§2) → composes 1–2, reuses globalTable internals.
6. **FormDrawer/FormDialog** (§6).
7. **AppShell** (§1) → migrate the dashboard layout last (highest blast radius).

**Acceptance gates (every primitive):**
- Token grep returns **zero** hardcoded colors (§0.2).
- Renders correctly in light **and** dark (token-only guarantees this).
- No horizontal overflow at 360px (mobile) — verify `min-w-0`/`max-w-full`.
- `tsc --noEmit` clean; generics preserved (`<T extends object>`).
- `AppShell` migration: sidebar still role/craft-gates (vendor sees craft
  labels; admin sees admin sections; super-only items hidden for plain admin) —
  i.e. `app-sidebar.tsx` is rendered **unmodified**.
