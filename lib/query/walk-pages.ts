/**
 * Read every page of a paged list through its own API wrapper (CONCURRENCY-015).
 * The customers and reviews screens asked for one page with `limit` 200 / 100 while the server caps at 100, so a
 * vendor with 457 customers saw 100 and a search for the 101st answered "0 customers". Pure: the caller gives the
 * page fetcher; the walk stops at the server's own `totalPages` (or `maxPages`).
 */
export async function walkPages<T, P extends { totalPages?: number } | undefined>(
  fetchPage: (page: number) => Promise<{ items: T[]; pagination?: P }>,
  maxPages = 60,
): Promise<{ items: T[]; total: number; truncated: boolean }> {
  const first = await fetchPage(1)
  const totalPages = Math.max(1, Number(first.pagination?.totalPages) || 1)
  const last = Math.min(totalPages, maxPages)
  const items = [...first.items]
  for (let p = 2; p <= last; p++) {
    const next = await fetchPage(p)
    if (!next.items.length) break
    items.push(...next.items)
  }
  const reported = Number((first.pagination as { total?: number } | undefined)?.total) || 0
  return { items, total: Math.max(reported, items.length), truncated: totalPages > last }
}
