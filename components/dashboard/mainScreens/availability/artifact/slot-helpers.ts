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

const looksLikeCode = (s: string) => /^[A-Za-z0-9_]+$/.test(s.trim())

/**
 * What a failed slot request says (BOOKINGS-024): the server's sentence, else its machine code's sentence
 * (`data.details.reason`: "Wedding halls have to be closed by 10 PM..."; the top-level message of a slot-policy
 * refusal is the bare code 'SLOT_ENDS_AFTER_CLOSURE'), else a fallback; plus the machine code (data.code).
 */
export function slotErrorInfo(err: unknown, fallback: string): { message: string; code: string | null } {
  const data = (err as { response?: { data?: { message?: unknown; data?: { code?: unknown; details?: { reason?: unknown } } } } })?.response?.data
  const top = typeof data?.message === "string" ? data.message.trim() : ""
  const reason = typeof data?.data?.details?.reason === "string" ? data.data.details.reason.trim() : ""
  const message = reason && (!top || looksLikeCode(top)) ? reason : top || fallback
  const code = typeof data?.data?.code === "string" ? data.data.code : null
  return { message, code }
}
