/**
 * Which function sheet a screen opens when the URL carries no `?id=` (OPS-019).
 *
 * The list is ordered by event date ASC (NULLS LAST), so `list[0]` was the sheet with the EARLIEST event: a vendor
 * who opened Sign / Operations / Trade ops without an id was signing or editing whichever customer's sheet happened
 * to be soonest, and Trade operations could not pick a sheet at all. The default is now the most recently CREATED
 * sheet, which is what the code comments always claimed.
 */
export function pickDefaultSheet<T extends { id: number; createdAt?: string | null }>(sheets: readonly T[] | null | undefined): T | null {
  const list = sheets ?? []
  if (!list.length) return null
  return list.reduce((best, s) => {
    const a = Date.parse(best.createdAt ?? "")
    const b = Date.parse(s.createdAt ?? "")
    if (Number.isFinite(a) && Number.isFinite(b)) return b > a || (b === a && s.id > best.id) ? s : best
    return s.id > best.id ? s : best
  })
}

/** The sheet id named by `?id=` on the current URL, or null. */
export function sheetIdFromUrl(): number | null {
  if (typeof window === "undefined") return null
  const raw = new URLSearchParams(window.location.search).get("id")
  const n = Number(raw)
  return raw && Number.isInteger(n) && n > 0 ? n : null
}
