/**
 * Idempotency key + "did that go through?" for the console's money submits
 * (PAY-UI_VENDOR-002 / -003).
 *
 * Why this exists. A payment whose RESPONSE is lost (flaky mobile data, a proxy
 * timeout) was shown as "Record nahi hui" with the save button live again, and
 * the vendor's second tap booked the money twice. Two things close that:
 *
 *   1. Every money submit carries an `Idempotency-Key` that is minted when the
 *      drawer opens and reused for a retry of the SAME submit, so a server that
 *      honours it (WP02 `moneyOp`) replays the first answer instead of writing
 *      again. A server that does not know the header ignores it.
 *   2. After an ambiguous failure (no answer, 5xx) the drawer re-reads the
 *      booking before it says anything, so it can tell "recorded, answer lost"
 *      from "not recorded".
 *
 * The key is bound to the BODY it was minted for. The server refuses the same
 * key with a different body (422), so an edited amount gets a new key; and so
 * does the retry after a definite refusal (a 4xx will never become a 2xx by
 * itself). Only an identical re-send after an ambiguous failure reuses the key.
 */

import type { BookingSchedule, SchedulePayment } from "@/lib/api/bookings"

export const IDEMPOTENCY_HEADER = "Idempotency-Key"

/** RFC 4122 v4. `crypto.randomUUID` needs a secure context; fall back for http:// dev and old browsers. */
export function newIdempotencyKey(): string {
  try {
    const c = (globalThis as { crypto?: Crypto }).crypto
    if (c && typeof c.randomUUID === "function") return c.randomUUID()
    if (c && typeof c.getRandomValues === "function") {
      const b = c.getRandomValues(new Uint8Array(16))
      b[6] = (b[6] & 0x0f) | 0x40
      b[8] = (b[8] & 0x3f) | 0x80
      const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("")
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
    }
  } catch { /* fall through */ }
  const r = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1)
  return `${r()}${r()}-${r()}-4${r().slice(1)}-a${r().slice(1)}-${r()}${r()}${r()}`
}

/** Axios request config that carries the key (undefined when there is none). */
export function idempotencyConfig(key?: string | null): { headers: Record<string, string> } | undefined {
  return key ? { headers: { [IDEMPOTENCY_HEADER]: key } } : undefined
}

export interface IdempotencyOptions {
  /** Sent as the `Idempotency-Key` header. Harmless to a server that does not read it. */
  idempotencyKey?: string
}

/** Per-drawer key holder: one instance per opened drawer. */
export class SubmitKey {
  private key = newIdempotencyKey()
  private body: string | null = null

  /** The key for a submit of `fingerprint`: the same key for an identical re-send, a new one when the body changed. */
  forBody(fingerprint: string): string {
    if (this.body !== null && this.body !== fingerprint) this.key = newIdempotencyKey()
    this.body = fingerprint
    return this.key
  }

  /** After a success or a definite refusal: the next submit is a new intent. */
  rotate(): void {
    this.key = newIdempotencyKey()
    this.body = null
  }
}

/**
 * Could the server have committed this write although we saw a failure?
 * True when no answer came (network error, timeout, abort) or the answer was a
 * server error / gateway timeout. A 4xx refusal and a 2xx `status:false`
 * refusal were answered by the server: nothing was written.
 */
export function isAmbiguousFailure(err: unknown): boolean {
  const e = err as { response?: { status?: number } } | null | undefined
  if (!e || !e.response) return true
  const status = Number(e.response.status)
  return !Number.isFinite(status) || status >= 500 || status === 408
}

export interface PaymentCheck {
  /** `landed`: a new receipt with the submitted amount is on the booking. `absent`: nothing new. `unknown`: could not tell. */
  verdict: "landed" | "absent" | "unknown"
  received?: number
  outstanding?: number
}

const sameAmount = (a: number, b: number) => Math.abs(a - b) < 0.005

/**
 * Re-read the booking's schedule after an ambiguous failure and compare it with
 * the one the drawer was opened with. `before` is the schedule the vendor saw;
 * without it nothing can be concluded and the answer is `unknown`.
 */
export function checkPaymentLanded(
  before: BookingSchedule | null | undefined,
  after: BookingSchedule | null | undefined,
  submitted: { amount: number; method?: string; transactionRef?: string },
): PaymentCheck {
  if (!after) return { verdict: "unknown" }
  const received = Number(after.money?.received)
  const outstanding = Number(after.money?.outstanding)
  const out: PaymentCheck = {
    verdict: "unknown",
    received: Number.isFinite(received) ? received : undefined,
    outstanding: Number.isFinite(outstanding) ? outstanding : undefined,
  }
  const hadPayments = !!before && Array.isArray(before.payments)
  const knownIds = new Set<number>((before?.payments ?? []).map((p: SchedulePayment) => p.id))
  const afterPayments: SchedulePayment[] = Array.isArray(after.payments) ? after.payments : []
  const fresh = afterPayments.filter((p) => p.kind !== "refund" && !knownIds.has(p.id))
  // The new row must also look like THIS submit: same amount, same method, and the
  // same reference when one was typed (a cash receipt never stores a reference).
  const looksLikeIt = (p: SchedulePayment) =>
    sameAmount(Math.abs(Number(p.amount)), submitted.amount) &&
    (!submitted.method || !p.method || String(p.method).toLowerCase() === submitted.method.toLowerCase()) &&
    (!submitted.transactionRef || submitted.method === "cash" || !p.transactionRef || String(p.transactionRef).trim() === submitted.transactionRef.trim())
  if (hadPayments && fresh.some(looksLikeIt)) {
    out.verdict = "landed"
    return out
  }
  // Same list, nothing new, and the total did not move: it did not land.
  const beforeReceived = Number(before?.money?.received)
  if (hadPayments && fresh.length === 0 && Number.isFinite(beforeReceived) && Number.isFinite(received) && sameAmount(beforeReceived, received)) {
    out.verdict = "absent"
    return out
  }
  // The ledger rows are not comparable (no list on either side) but the total grew by the submitted amount.
  if (!hadPayments && Number.isFinite(beforeReceived) && Number.isFinite(received) && received - beforeReceived >= submitted.amount - 0.005) {
    out.verdict = "landed"
  }
  return out
}
