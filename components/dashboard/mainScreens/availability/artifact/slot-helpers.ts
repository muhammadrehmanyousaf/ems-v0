/**
 * Pure helpers for the Bookable slots screen (kept out of the .tsx so a guard can run them without React).
 *
 * BOOKINGS-062 (S1): the API sends bigint ids as STRINGS ('2', '3'). The Edit button's lookup compared
 * `x.id === Number(dataset.slotEdit)`, which never matched, so Edit did nothing and a slot's time, capacity,
 * guests and weekdays could not be changed from the screen. Compare as strings.
 */

export function findSlotById<T extends { id: number | string }>(list: readonly T[], id: string | number | null | undefined): T | undefined {
  if (id == null || id === "") return undefined
  const want = String(id)
  return list.find((x) => String(x.id) === want)
}

/** What a failed slot request says: the server's own sentence and machine code (data.code), else a fallback. */
export function slotErrorInfo(err: unknown, fallback: string): { message: string; code: string | null } {
  const data = (err as { response?: { data?: { message?: unknown; data?: { code?: unknown; reason?: unknown } } } })?.response?.data
  const message = typeof data?.message === "string" && data.message.trim() ? data.message : fallback
  const code = typeof data?.data?.code === "string" ? data.data.code : null
  return { message, code }
}
