/**
 * The customer's side of a locked venue (PLANS-SPEC contracts 5 and 6). PURE: no React, so
 * scripts/plans-wall-check.mts can run it.
 *
 *  - The public venue payload carries `availabilityNotice: null | { code: "NOT_TAKING_ENQUIRIES", text }`. When it is set
 *    the page shows a calm notice and disables the enquiry / booking / quote doors.
 *  - A new enquiry, booking, quote request, chat or payment against a locked venue is refused 409 `VENUE_UNAVAILABLE`.
 *    That answer is not a fault: the customer is told kindly, and customers with existing bookings are never affected
 *    (the server does not refuse anything on an existing booking).
 *
 * The server's own sentence is shown when it sends one; otherwise the spec's copy (lib/plans/copy.ts, cust.*).
 */

type Rec = Record<string, unknown>
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v)
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null)

export interface AvailabilityNotice {
  code: "NOT_TAKING_ENQUIRIES"
  /** The server's sentence, when it sent one. */
  text: string | null
}

/** Read `availabilityNotice` from a venue payload (raw API object). null = the venue is taking enquiries. */
export function readAvailabilityNotice(raw: unknown): AvailabilityNotice | null {
  if (!isRec(raw)) return null
  const n = raw.availabilityNotice
  if (!isRec(n)) return null
  // Any notice object means "not taking enquiries" for now; the only code the contract defines is NOT_TAKING_ENQUIRIES.
  return { code: "NOT_TAKING_ENQUIRIES", text: str(n.text) }
}

export interface VenueUnavailable { message: string | null }

/** Is this error the 409 VENUE_UNAVAILABLE refusal? */
export function venueUnavailableFromError(error: unknown): VenueUnavailable | null {
  const res = (error as { response?: { status?: number; data?: unknown } } | null)?.response
  if (!res || res.status !== 409 || !isRec(res.data)) return null
  const d = isRec(res.data.data) ? res.data.data : null
  if (!d || str(d.code) !== "VENUE_UNAVAILABLE") return null
  return { message: str(res.data.message) }
}

/* ───────────── a tiny event bus (the axios layer talks to the dialog host through this) ───────────── */

type Listener = (v: VenueUnavailable) => void
const listeners = new Set<Listener>()

export function onVenueUnavailable(l: Listener): () => void {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

/**
 * Called by the axios layer the moment a request is refused with VENUE_UNAVAILABLE. One macrotask later (after the caller's
 * own catch block ran) the dialog host is told, unless the screen claimed the refusal and shows it inline.
 */
export function handleVenueUnavailable(error: unknown, v: VenueUnavailable): void {
  setTimeout(() => {
    if (isVenueUnavailableClaimed(error)) return
    listeners.forEach((l) => { try { l(v) } catch { /* a listener must never break a request */ } })
  }, 0)
}

/** A screen that already knows the venue is paused (availabilityNotice) asks the host to say so, instead of calling the server. */
export function announceVenueUnavailable(v: VenueUnavailable): void {
  listeners.forEach((l) => { try { l(v) } catch { /* a listener must never break the page */ } })
}

/* ───────────── the "venue is offline" notice on an ACCEPTED request (PL-B section 8) ───────────── */

export interface VenueOfflineNotice { text: string | null; textUr: string | null }

/**
 * A customer's message, payment report, proof, cancellation or refund request on a booking at a locked venue is STORED and
 * answered 2xx with `data.venueNotice: { code: "VENUE_OFFLINE", text, textUr }`: the venue is not told live. The customer must
 * not be left believing the venue saw it, so the screen says so. null = the venue is open (no key) or this is not a notice.
 */
export function readVenueNotice(data: unknown): VenueOfflineNotice | null {
  if (!isRec(data)) return null
  const n = data.venueNotice
  if (!isRec(n) || str(n.code) !== "VENUE_OFFLINE") return null
  return { text: str(n.text), textUr: str(n.textUr) }
}

type OfflineListener = (n: VenueOfflineNotice) => void
const offlineListeners = new Set<OfflineListener>()
export function onVenueOffline(l: OfflineListener): () => void {
  offlineListeners.add(l)
  return () => { offlineListeners.delete(l) }
}
export function announceVenueOffline(n: VenueOfflineNotice): void {
  offlineListeners.forEach((l) => { try { l(n) } catch { /* a listener must never break a request */ } })
}

export function claimVenueUnavailable(error: unknown): void {
  if (error && typeof error === "object") (error as { __venueUnavailableClaimed?: boolean }).__venueUnavailableClaimed = true
}
export const isVenueUnavailableClaimed = (error: unknown): boolean => !!(error as { __venueUnavailableClaimed?: boolean } | null)?.__venueUnavailableClaimed
