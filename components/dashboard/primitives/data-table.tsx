"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { usePagedRows, PaginationBar } from "./pagination"
import { Icon } from "@/components/dashboard/shared/icon"
import { Spinner } from "@/components/dashboard/shared/icon"
import { EmptyState, type EmptyStateProps } from "./empty-state"
import { TableSkeleton } from "./skeletons"
import { useUiStore } from "@/lib/store/ui-store"
import { Button } from "@/components/ui/button"

/**
 * DataTable<T> — the shared list surface. Column-config driven, token-only, with
 * built-in loading / empty / error states, a sticky header, an optional toolbar
 * (where Export/Import live), row selection + a bulk-action bar, and — critically
 * — collapse-to-cards below `md` via `renderCard` (no horizontal page scroll on
 * phones). The full TanStack feature set (multi-sort, pin, virtualize) can be
 * layered per-screen; this covers the common case cleanly.
 */
export interface Column<T> {
  key: string
  header: React.ReactNode
  align?: "left" | "right" | "center"
  /** Fixed width (e.g. "120px" or "10rem"). */
  width?: string
  render?: (row: T, index: number) => React.ReactNode
  headerClassName?: string
  cellClassName?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  getRowId: (row: T) => string
  loading?: boolean
  error?: Error | string | null
  onRetry?: () => void
  /** Rendered above the table (search, filters, export/import). */
  toolbar?: React.ReactNode
  /** Empty-state config when data is empty and not loading. */
  empty?: EmptyStateProps
  /** Mobile card renderer (below md). Falls back to a horizontal-scroll table if omitted. */
  renderCard?: (row: T, index: number) => React.ReactNode
  /** Row selection. */
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  /** Rendered in the bulk bar when rows are selected. */
  bulkActions?: (ids: Set<string>) => React.ReactNode
  onRowClick?: (row: T) => void
  /**
   * Where this row's record lives. Return null for a row with no detail page.
   *
   * Measured on production 2026-08-11: 38 screens use this table and TWO of them
   * pass `onRowClick`. On the other 36 — Bookings among them — clicking a row
   * does nothing at all. On Bookings that means the only route into a booking is
   * the two icon buttons at the far right of an eleven-column row, and the
   * "balance due" panel further down the page; a booking that is fully PAID has
   * no link to its own detail page anywhere on the screen, even though
   * /dashboard/bookings/173 exists and renders in full.
   *
   * This is a link, not another click handler, because a click handler is only
   * half a row:
   *   • a keyboard user can reach it and activate it
   *   • middle-click and ⌘-click open it in a new tab, which is how anyone
   *     works through a list of fourteen people who owe them money
   *   • a screen reader announces "link, Ahmed Raza & Sanam Ahmed"
   *
   * The anchor wraps the first non-action column's content and the row keeps a
   * whole-row click for the mouse. No stretched-overlay trick: an overlay would
   * sit on top of the action buttons, and `position: relative` on `<tr>` is not
   * something to rely on.
   */
  rowHref?: (row: T) => string | null | undefined
  className?: string
  /**
   * WWL-120/137/153/170/187 — table a11y, unchanged across five modules.
   *
   * `caption` names the table for a screen reader ("Payments, 25 rows"), which
   * is otherwise a grid of numbers with no announced purpose. It is visually
   * hidden — sighted users already have the page heading.
   */
  caption?: string
  /**
   * WWL-116/135/… — a no-match search asserted a financial falsehood.
   *
   * A vendor with 25 payments and Rs 23.9m on the books who searched `zzzqqq`
   * was told "No payments yet — payments against your bookings will appear here
   * as they come in". Same on Customers, Receipts and the rest: the screen said
   * the business is empty when the FILTER is empty. One is a fact about the
   * account; the other is a fact about a text box.
   *
   * Pass the active query and the table says "No matches for …" with a way back
   * instead. Omit it and nothing changes.
   */
  filterQuery?: string
  onClearFilter?: () => void
  /**
   * A per-row name for the selection checkbox. Every row previously carried the
   * identical accessible name "Select row", so a screen-reader user heard it
   * ten times with nothing to tell the rows apart — they could not know WHICH
   * booking they were about to bulk-delete. Falls back to the first column's
   * text content, then to the row id.
   */
  getRowLabel?: (row: T) => string
  /**
   * Rows per page. `false` renders everything — only correct for a list with a
   * hard, small ceiling (a vendor's own venues, the 8 growth-checklist steps).
   *
   * Every screen used to render every row it was handed, because this primitive
   * had no page state at all: 31 screens, one of them the admin directory at
   * 3,331 businesses. NN/g is explicit that endless lists fail exactly the task
   * this product is for — finding a specific record and RE-finding it later,
   * which needs page landmarks to be possible at all.
   */
  pageSize?: number | false
  /**
   * URL parameter carrying the page number, so a page survives a reload and can
   * be sent to an accountant. Give two tables on one screen different names.
   */
  pageParam?: string
}


const alignCls = (a?: Column<any>["align"]) =>
  a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left"

/**
 * F4 / WWL-053, 086, 093, 146, 160, 244, 265, 280, 296, 377, 391, 459 — "on a
 * phone, nothing on a row can be done at all".
 *
 * The mobile card view only existed when a screen passed `renderCard`. Screens
 * that didn't fell back to a horizontally scrolling table, and the actions
 * column sits at the far right of that scroll — so on a 360px phone the vendor
 * could read the row and do nothing with it. The sweep found whole modules inert
 * this way: Bookings (three times over), Function sheets, Customers, Receipts,
 * the entire cheque lifecycle, Inventory stock changes, every staff row, every
 * supplier and broker row.
 *
 * A table now always has a mobile form. `renderCard` is still honoured where a
 * screen wants a bespoke card; where it doesn't, this builds one from the same
 * column config — label/value pairs, with the actions column pulled out and
 * given the full width at the bottom so it is reachable by thumb.
 */
const ACTION_KEYS = new Set(["actions", "action", "row-actions", "rowActions", "menu"])

function defaultCard<T>(columns: Column<T>[], row: T, index: number): React.ReactNode {
  const actions = columns.filter((c) => ACTION_KEYS.has(c.key))
  const fields = columns.filter((c) => !ACTION_KEYS.has(c.key) && c.key !== "select")

  return (
    <div className="space-y-2">
      <dl className="space-y-1.5">
        {fields.map((c) => {
          const value = c.render ? c.render(row, index) : (row as Record<string, unknown>)[c.key] as React.ReactNode
          if (value == null || value === "") return null
          return (
            <div key={c.key} className="flex items-start justify-between gap-3">
              <dt className="shrink-0 text-xs text-muted-foreground">{c.header}</dt>
              <dd className="min-w-0 text-right text-sm">{value}</dd>
            </div>
          )
        })}
      </dl>
      {actions.length > 0 && (
        <div
          className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-2"
          // The row itself may be clickable; an action must not also navigate.
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map((c) => (
            <React.Fragment key={c.key}>{c.render ? c.render(row, index) : null}</React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  loading,
  error,
  onRetry,
  toolbar,
  empty,
  renderCard,
  selectable,
  selectedIds,
  onSelectionChange,
  bulkActions,
  onRowClick,
  rowHref,
  className,
  caption,
  getRowLabel,
  filterQuery,
  onClearFilter,
  pageSize = 25,
  pageParam = "page",
}: DataTableProps<T>) {
  const density = useUiStore((s) => s.density)
  const rowPad = density === "compact" ? "py-2" : "py-3"
  const sel = selectedIds ?? new Set<string>()
  const router = useRouter()

  /**
   * The column the row's link goes on: the first one that is not the checkbox
   * and not an actions menu — the booking, the customer, the receipt number.
   * That is the cell a person reads to identify the row, so it is the one that
   * should say where it leads.
   */
  const primaryKey = React.useMemo(
    () => columns.find((c) => c.key !== "select" && !ACTION_KEYS.has(c.key))?.key ?? null,
    [columns],
  )

  // ── Paging ──────────────────────────────────────────────────────────
  // Shared with the card lists (holds, quotes) via the same hook, so a vendor
  // does not have to learn paging twice in one product.
  const paged = usePagedRows(data, { pageSize, pageParam, filterKey: filterQuery })
  const { pageRows, total, page, pageCount } = paged

  // Select-all covers the rows a person can actually SEE. Selecting 3,331
  // invisible rows from a checkbox above 25 of them is a trap, not a shortcut —
  // so the header box takes the page, and the bulk bar offers the whole set
  // explicitly when there is more than one page.
  const pageIds = React.useMemo(() => pageRows.map(getRowId), [pageRows, getRowId])
  const allIds = React.useMemo(() => data.map(getRowId), [data, getRowId])
  const allSelected = pageRows.length > 0 && pageIds.every((id) => sel.has(id))
  const someSelected = pageIds.some((id) => sel.has(id)) && !allSelected

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(sel)
      pageIds.forEach((id) => next.delete(id))
      onSelectionChange?.(next)
    } else {
      onSelectionChange?.(new Set([...Array.from(sel), ...pageIds]))
    }
  }
  /**
   * Best-effort human name for a row, for the checkbox's accessible name.
   * Prefers an explicit `getRowLabel`, then the first column that renders a
   * plain string (the name/customer column in every table here), then the id.
   */
  const rowLabel = React.useCallback((row: T, id: string): string => {
    if (getRowLabel) {
      const v = getRowLabel(row)
      if (v) return v
    }
    for (const c of columns) {
      if (c.key === "select" || c.key === "actions") continue
      const raw = (row as any)?.[c.key]
      if (typeof raw === "string" && raw.trim()) return raw.trim()
      if (typeof raw === "number") return String(raw)
    }
    return `row ${id}`
  }, [columns, getRowLabel])

  const toggleOne = (id: string) => {
    const next = new Set(sel)
    next.has(id) ? next.delete(id) : next.add(id)
    onSelectionChange?.(next)
  }

  const body = (() => {
    if (error) {
      return (
        <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400">
            <Icon name="AlertTriangle" size={22} />
          </span>
          <p className="text-sm text-muted-foreground">
            {typeof error === "string" ? error : "Couldn't load this list."}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent"
            >
              <Icon name="RefreshCw" size={14} /> Retry
            </button>
          )}
        </div>
      )
    }
    if (loading) return <TableSkeleton rows={6} cols={columns.length + (selectable ? 1 : 0)} className="border-0" />
    if (data.length === 0) {
      // Filtered-empty is a different fact from account-empty, and saying the
      // wrong one on a money screen is a falsehood about the business.
      const q = (filterQuery ?? "").trim()
      if (q) {
        return (
          <EmptyState
            className="border-0 bg-transparent"
            icon="Search"
            title={`No matches for “${q}”`}
            description="Nothing on this screen matches that search. Your records are unchanged — try a different term, or clear the search."
            action={
              onClearFilter ? (
                <Button size="sm" variant="outline" onClick={onClearFilter}>
                  Clear search
                </Button>
              ) : undefined
            }
          />
        )
      }
      return (
        <EmptyState
          className="border-0 bg-transparent"
          icon={empty?.icon ?? "Inbox"}
          title={empty?.title ?? "Nothing here yet"}
          description={empty?.description}
          action={empty?.action}
          secondaryAction={empty?.secondaryAction}
        />
      )
    }

    return (
      <>
        {/* Desktop / tablet table. Always hidden below md now — every table has a
            card form, so a phone never gets a sideways-scrolling grid whose
            actions column is off the right edge. */}
        <div className="hidden w-full overflow-x-auto md:block">
          <table className="w-full text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
            {/* WWL-196 and its five siblings — module after module shipped a
                table with 0 of N `<th>` carrying `scope` and no `<caption>`.
                Fixed once, here, so no screen can regress it individually. */}
            {caption && <caption className="sr-only">{caption}</caption>}
            {/* Sticky column headers.
                
                Measured on production: /dashboard/leads is 4,514px of table on a
                674px window, and `thead` computed to `position: static` — so a
                vendor six screens down a ledger is reading a grid of numbers
                with no idea which column is which, and has to scroll back up to
                find out.

                This is only possible now that the shell owns the scrolling: the
                content region is the scroll container, so `sticky top-0` parks
                the header row at the top of that region, just under the fixed
                top bar. While the PAGE was the scroller there was nothing to
                stick to.

                `bg-card` is required, not decorative — a transparent sticky row
                lets the data scroll visibly through the header text. */}
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border">
                {selectable && (
                  <th scope="col" className="w-10 px-4 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={caption ? `Select the ${pageRows.length} rows shown of ${caption}` : "Select the rows shown"}
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected
                      }}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
                    />
                  </th>
                )}
                {columns.map((c) => (
                  <th scope="col"
                    key={c.key}
                    style={c.width ? { width: c.width } : undefined}
                    className={cn(
                      "px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
                      alignCls(c.align),
                      c.headerClassName,
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => {
                const id = getRowId(row)
                const href = rowHref?.(row) || null
                const activate = href
                  ? () => router.push(href)
                  : onRowClick
                    ? () => onRowClick(row)
                    : undefined
                return (
                  <tr
                    key={id}
                    onClick={activate}
                    /**
                     * A row that responds to a mouse and not to a keyboard is
                     * not an interactive row, it is a trap. `onRowClick` shipped
                     * without this for as long as it has existed, so the two
                     * screens using it (Receipts, Receivables) cannot be
                     * operated from the keyboard at all. When `rowHref` is given
                     * the anchor below carries the semantics properly and the
                     * row needs no tabstop of its own — a second one would just
                     * make every list twice as long to tab through.
                     */
                    {...(activate && !href
                      ? {
                          tabIndex: 0,
                          role: "button" as const,
                          onKeyDown: (e: React.KeyboardEvent) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              activate()
                            }
                          },
                        }
                      : {})}
                    className={cn(
                      "border-b border-border/60 last:border-0 transition-colors",
                      activate && "cursor-pointer",
                      activate && !href && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      sel.has(id) ? "bg-primary/5" : "hover:bg-muted/40",
                    )}
                  >
                    {selectable && (
                      <td className={cn("px-4", rowPad)} onClick={(e) => e.stopPropagation()}>
                        {/* WWL-120 — a 16x16 target is under the WCAG 2.2
                            24x24 minimum, so the box is padded out to a 24px
                            hit area without changing how it looks. */}
                        <input
                          type="checkbox"
                          aria-label={`Select ${rowLabel(row, id)}`}
                          checked={sel.has(id)}
                          onChange={() => toggleOne(id)}
                          className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))] p-[4px] -m-[4px] box-content cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((c) => {
                      const content = c.render ? c.render(row, i) : (row as any)[c.key]
                      return (
                        <td
                          key={c.key}
                          // An action button inside a clickable row must do its
                          // own job and nothing else — without this, "Edit
                          // booking" also navigated to the booking underneath it.
                          onClick={activate && ACTION_KEYS.has(c.key) ? (e) => e.stopPropagation() : undefined}
                          className={cn("px-4 text-foreground", rowPad, alignCls(c.align), c.cellClassName)}
                        >
                          {href && c.key === primaryKey ? (
                            <Link
                              href={href}
                              aria-label={rowLabel(row, id)}
                              className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {content}
                            </Link>
                          ) : (
                            content
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards — bespoke when the screen supplies one, otherwise built
            from the column config so the row's actions are reachable.

            WWL-471 — the density toggle read as "missing on mobile". It was in
            the toolbar the whole time; it simply had no effect, because density
            only ever changed table row padding and the table is hidden below
            md. A visible control that does nothing is the worse half of that
            bug, so density now applies to the card list too — the setting means
            the same thing on a phone as on a desktop. */}
        <div className={cn("p-3 md:hidden", density === "compact" ? "space-y-1.5" : "space-y-2")}>
          {pageRows.map((row, i) => {
            const href = rowHref?.(row) || null
            const inner = renderCard ? renderCard(row, i) : defaultCard(columns, row, i)
            const shell = cn(
              "block rounded-lg border border-border bg-card",
              density === "compact" ? "p-2.5" : "p-3",
            )
            // The whole card is the link on a phone. There is no hover to hint
            // with and no room for a separate "open" affordance, so the card has
            // to be the target — and as an anchor it is reachable by keyboard
            // and by a screen reader's link list, not just by thumb.
            if (href) {
              return (
                <Link
                  key={getRowId(row)}
                  href={href}
                  aria-label={rowLabel(row, getRowId(row))}
                  className={cn(shell, "active:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
                >
                  {inner}
                </Link>
              )
            }
            return (
              <div
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(shell, onRowClick && "cursor-pointer active:bg-muted/50")}
                {...(onRowClick
                  ? {
                      tabIndex: 0,
                      role: "button" as const,
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          onRowClick(row)
                        }
                      },
                    }
                  : {})}
              >
                {inner}
              </div>
            )
          })}
        </div>
      </>
    )
  })()

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>
      {toolbar && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">{toolbar}</div>
      )}
      {/* Bulk action bar */}
      {selectable && sel.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-4 py-2 text-sm">
          <span className="font-medium text-foreground">{sel.size} selected</span>
          {/* The header checkbox takes the page. When there is more beyond it,
              say so and offer the whole set explicitly — never silently. */}
          {paged.showBar && allSelected && sel.size < total && (
            <button
              type="button"
              onClick={() => onSelectionChange?.(new Set(allIds))}
              className="font-medium text-primary hover:underline"
            >
              Select all {total.toLocaleString("en-PK")}
            </button>
          )}
          <button
            type="button"
            onClick={() => onSelectionChange?.(new Set())}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
          <div className="ml-auto flex items-center gap-2">{bulkActions?.(sel)}</div>
        </div>
      )}
      {body}
      {/* Hidden entirely on a single page — "1–5 of 5" beside a pair of dead
          arrows is furniture, not information. */}
      <PaginationBar p={paged} />
      {loading && data.length > 0 && (
        <div className="flex items-center justify-center gap-2 border-t border-border py-2 text-xs text-muted-foreground">
          <Spinner size={12} /> Loading…
        </div>
      )}
    </div>
  )
}

export default DataTable
