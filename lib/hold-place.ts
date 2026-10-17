/**
 * WP39 / FLAGGED-074: placing a date hold from the Holds and Field screens.
 *
 * Both screens called `VendorHoldsAPI.place` directly and answered EVERY non-HTTP failure with "Ye slot pehle se booked/held hai", so a
 * vendor at an expo with no signal was told the date was taken. The redesigned dialog (hold-date-dialog.tsx) already queued the hold in
 * the offline outbox (`hold_date`, synced on reconnect with the existing Re-enter flow for conflicts); the two artifact screens now go
 * through the same decision, and a failed request says what actually failed.
 */
import { VendorHoldsAPI } from "@/lib/api/vendorHolds"
import { enqueue as outboxEnqueue, isOutboxEnabled, isOffline } from "@/lib/outbox"

export interface PlaceHoldArgs { holdDate: string; holdTime: string; businessId?: number }
export type PlaceHoldResult = { queuedOffline: true; alreadyHeld?: undefined } | { queuedOffline?: false; alreadyHeld: boolean }

/** Offline with the outbox on: queue the op (it syncs later); otherwise place it now. */
export async function placeHold(args: PlaceHoldArgs): Promise<PlaceHoldResult> {
  if (isOutboxEnabled() && isOffline()) {
    await outboxEnqueue("hold_date", { businessId: args.businessId, holdDate: args.holdDate, holdTime: args.holdTime }, `${args.holdDate} · ${args.holdTime}`)
    return { queuedOffline: true }
  }
  const r = await VendorHoldsAPI.place({ holdDate: args.holdDate, holdTime: args.holdTime, businessId: args.businessId })
  return { alreadyHeld: !!r?.alreadyHeld }
}

/**
 * The sentence for a failed place: the server's own message when it answered (409 "taken while you were offline", validation...),
 * "network nahi hai" when there was no answer at all, the caller's fallback only when the server answered with no message.
 */
export function holdErrorText(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } }; code?: string; message?: string } | null
  if (e?.response) return e.response.data?.message || fallback
  return "Network nahi hai — connection check karke dobara koshish karein"
}
