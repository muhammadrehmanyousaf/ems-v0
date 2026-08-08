"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/dashboard/shared/icon"

/**
 * Paging, extracted so it is not a table-only privilege.
 *
 * It first went into `DataTable`, which covers 32 screens. But four screens
 * render their rows as CARDS rather than a table and so inherited nothing —
 * `holds-view` and `quotes-view` both do `const list = data ?? []` followed by
 * `list.map(...)`, with no cap of any kind. Date holds and quote requests both
 * grow for the life of the business, so those two lists have no ceiling at all.
 *
 * Same rules as the table's bar, because a vendor should not have to learn
 * paging twice in one product:
 *
 *   - the RANGE and the TOTAL, never a bare page number
 *   - nothing rendered at all on a single page
 *   - the page lives in the URL, so it survives a reload and can be sent on
 *   - changing the filter returns to page 1, because searching from page 5 is
 *     otherwise a guaranteed empty screen
 */

export const PAGE_SIZES = [25, 50, 100]

export interface PagedResult<T> {
  pageRows: T[]
  page: number
  pageCount: number
  total: number
  firstShown: number
  lastShown: number
  size: number
  setSize: (n: number) => void
  setPage: (n: number) => void
  /** True when paging is active AND there is more than one page to show. */
  showBar: boolean
}

export function usePagedRows<T>(
  rows: T[],
  opts: { pageSize?: number | false; pageParam?: string; filterKey?: unknown } = {},
): PagedResult<T> {
  const { pageSize = 25, pageParam = "page", filterKey } = opts
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [size, setSize] = React.useState<number>(typeof pageSize === "number" ? pageSize : 0)
  const paging = pageSize !== false && size > 0
  const total = rows.length
  const pageCount = paging ? Math.max(1, Math.ceil(total / size)) : 1

  const urlPage = Number(searchParams?.get(pageParam) ?? 1)
  // Out of range is not worth shouting about — clamp to the nearest real page.
  // It happens whenever a filter shrinks the list under someone standing on 5.
  const page = Math.min(Math.max(Number.isFinite(urlPage) ? urlPage : 1, 1), pageCount)

  const setPage = React.useCallback(
    (next: number) => {
      const qs = new URLSearchParams(searchParams?.toString() ?? "")
      if (next <= 1) qs.delete(pageParam)
      else qs.set(pageParam, String(next))
      const q = qs.toString()
      router.replace(q ? `${pathname ?? ""}?${q}` : (pathname ?? ""), { scroll: false })
    },
    [router, pathname, searchParams, pageParam],
  )

  const lastFilter = React.useRef(filterKey)
  React.useEffect(() => {
    if (lastFilter.current === filterKey) return
    lastFilter.current = filterKey
    if (page !== 1) setPage(1)
  }, [filterKey, page, setPage])

  const pageRows = React.useMemo(
    () => (paging ? rows.slice((page - 1) * size, page * size) : rows),
    [rows, paging, page, size],
  )

  return {
    pageRows,
    page,
    pageCount,
    total,
    firstShown: total === 0 ? 0 : (page - 1) * size + 1,
    lastShown: paging ? Math.min(page * size, total) : total,
    size,
    setSize,
    setPage,
    showBar: paging && total > 0 && pageCount > 1,
  }
}

export function PaginationBar<T>({ p, className }: { p: PagedResult<T>; className?: string }) {
  if (!p.showBar) return null
  return (
    <div
      className={
        "flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-sm " +
        (className ?? "")
      }
    >
      <p className="text-muted-foreground tabular-nums">
        Showing {p.firstShown.toLocaleString("en-PK")}–{p.lastShown.toLocaleString("en-PK")} of{" "}
        <span className="font-medium text-foreground">{p.total.toLocaleString("en-PK")}</span>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-muted-foreground">
          <span className="sr-only sm:not-sr-only">Rows</span>
          <select
            value={p.size}
            onChange={(e) => { p.setSize(Number(e.target.value)); p.setPage(1) }}
            className="h-8 rounded-md border border-input bg-background px-1.5 text-sm outline-none ring-ring focus-visible:ring-2"
            aria-label="Rows per page"
          >
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-8 px-2"
            disabled={p.page <= 1} onClick={() => p.setPage(p.page - 1)} aria-label="Previous page">
            <Icon name="ChevronLeft" size={15} />
          </Button>
          <span className="px-1 text-muted-foreground tabular-nums" aria-live="polite">
            Page {p.page} of {p.pageCount}
          </span>
          <Button size="sm" variant="outline" className="h-8 px-2"
            disabled={p.page >= p.pageCount} onClick={() => p.setPage(p.page + 1)} aria-label="Next page">
            <Icon name="ChevronRight" size={15} />
          </Button>
        </div>
      </div>
    </div>
  )
}
