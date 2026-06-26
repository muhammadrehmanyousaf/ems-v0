"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/dashboard/shared/icon"
import { Spinner } from "@/components/dashboard/shared/icon"
import { EmptyState, type EmptyStateProps } from "./empty-state"
import { TableSkeleton } from "./skeletons"

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
  className?: string
}

const alignCls = (a?: Column<any>["align"]) =>
  a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left"

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
  className,
}: DataTableProps<T>) {
  const sel = selectedIds ?? new Set<string>()
  const allIds = React.useMemo(() => data.map(getRowId), [data, getRowId])
  const allSelected = data.length > 0 && allIds.every((id) => sel.has(id))
  const someSelected = allIds.some((id) => sel.has(id)) && !allSelected

  const toggleAll = () =>
    onSelectionChange?.(allSelected ? new Set() : new Set(allIds))
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
    if (data.length === 0)
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

    return (
      <>
        {/* Desktop / tablet table */}
        <div className={cn("w-full overflow-x-auto", renderCard && "hidden md:block")}>
          <table className="w-full text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr className="border-b border-border">
                {selectable && (
                  <th className="w-10 px-4 py-2.5">
                    <input
                      type="checkbox"
                      aria-label="Select all"
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
                  <th
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
              {data.map((row, i) => {
                const id = getRowId(row)
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-border/60 last:border-0 transition-colors",
                      onRowClick && "cursor-pointer",
                      sel.has(id) ? "bg-primary/5" : "hover:bg-muted/40",
                    )}
                  >
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label="Select row"
                          checked={sel.has(id)}
                          onChange={() => toggleOne(id)}
                          className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn("px-4 py-3 text-foreground", alignCls(c.align), c.cellClassName)}
                      >
                        {c.render ? c.render(row, i) : (row as any)[c.key]}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        {renderCard && (
          <div className="space-y-2 p-3 md:hidden">
            {data.map((row, i) => (
              <div
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "rounded-lg border border-border bg-card p-3",
                  onRowClick && "cursor-pointer active:bg-muted/50",
                )}
              >
                {renderCard(row, i)}
              </div>
            ))}
          </div>
        )}
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
      {loading && (
        <div className="flex items-center justify-center gap-2 border-t border-border py-2 text-xs text-muted-foreground">
          <Spinner size={12} /> Loading…
        </div>
      )}
    </div>
  )
}

export default DataTable
