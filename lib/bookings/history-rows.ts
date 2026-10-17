/**
 * `GET /bookings/:id/history` answers `data: { rows: [...] }`; older screens expected a bare array (or
 * `{history}` / `{entries}`). BOOKINGS-089: the vendor Activity card only accepted an array, so every booking
 * looked like it had no history. One normaliser, tolerant of every shape the server has ever sent.
 */
export function historyRows<T = any>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>
    for (const k of ["rows", "history", "entries"]) if (Array.isArray(o[k])) return o[k] as T[]
  }
  return []
}
