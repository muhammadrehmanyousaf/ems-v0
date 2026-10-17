'use client';

import instance from '@/lib/axiosConfig';
import { useQuery, type QueryKey } from '@tanstack/react-query';

/**
 * Read EVERY page of a paged list endpoint (BOOKINGS-008 / 010 / 011 / 012, CONCURRENCY-015).
 *
 * The bookings list endpoint caps `limit` at 100 and the console screens asked for page 1 only, so with more
 * than 100 bookings the Calendar silently lost every booking after the 100th by date, the Bookings tabs and
 * search covered 100 rows, and Export wrote one page. The server already answers `filters.total` /
 * `totalPages` / `hasMore`; this walks them. Additive: the endpoint, its parameters and the response shape are
 * unchanged (the mobile apps that page by hand are unaffected), and the result keeps the SAME shape
 * `useFetchData` returned (`data.data.data` = rows, `data.data.filters`), so the screens read it unchanged.
 *
 * `truncated` is true only if `maxPages` was reached with rows still unread, so a screen can say so instead of
 * quietly showing a partial set.
 */
export interface AllPagesResult<T = unknown> {
  data: { data: T[]; filters: { total: number; totalPages: number; hasMore: boolean; page: number; limit: number } }
  truncated: boolean
}

export async function fetchAllPages<T = unknown>(
  endpoint: string,
  params: Record<string, unknown>,
  opts: { limit?: number; maxPages?: number; concurrency?: number } = {},
): Promise<AllPagesResult<T>> {
  const limit = Math.min(100, opts.limit ?? 100)
  const maxPages = opts.maxPages ?? 60
  const concurrency = Math.max(1, opts.concurrency ?? 4)
  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '')) clean[k] = v
  }
  // The HTTP body is { status, message, data: { data: rows[], filters: {...} } }.
  const getPage = async (page: number) => {
    const { data: body } = await instance.get(endpoint, { params: { ...clean, page, limit } })
    const inner = (body?.data ?? {}) as { data?: T[]; filters?: { total?: number; totalPages?: number } }
    return { rows: (inner.data ?? []) as T[], filters: inner.filters ?? {} }
  }
  const first = await getPage(1)
  const total = Number(first.filters.total ?? first.rows.length) || first.rows.length
  const totalPages = Math.max(1, Number(first.filters.totalPages) || Math.ceil(total / limit) || 1)
  const lastPage = Math.min(totalPages, maxPages)
  const pages: T[][] = [first.rows]
  for (let start = 2; start <= lastPage; start += concurrency) {
    const batch: Promise<{ rows: T[] }>[] = []
    for (let p = start; p < start + concurrency && p <= lastPage; p++) batch.push(getPage(p))
    const got = await Promise.all(batch)
    for (const g of got) pages.push(g.rows)
  }
  const rows = pages.flat()
  return {
    data: { data: rows, filters: { total: Math.max(total, rows.length), totalPages, hasMore: totalPages > lastPage, page: 1, limit } },
    truncated: totalPages > lastPage,
  }
}

export const useFetchAllPages = <T = unknown>({
  endpoint,
  queryKey,
  Params,
  enabled = true,
}: {
  endpoint: string
  queryKey: string | string[]
  Params?: Record<string, unknown>
  enabled?: boolean
}) => {
  const params = Params ?? {}
  const key: QueryKey = Array.isArray(queryKey) ? [endpoint, ...queryKey, params] : [endpoint, queryKey, params]
  return useQuery({
    queryKey: key,
    queryFn: () => fetchAllPages<T>(endpoint, params),
    enabled,
    retry: 1,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}
