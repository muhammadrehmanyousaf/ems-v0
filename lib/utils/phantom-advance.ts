/**
 * WP31 - phantom advances: the pure part (no DOM) shared by every vendor screen that can meet one.
 *
 * A phantom advance is a booking that says "Rs X received" while no receipt backs it. The server refuses
 * money writes on such a booking (409 ADVANCE_UNLEDGERED) until the vendor settles it with one of two
 * explicit taps: ADOPT ("haan, ye mila tha": one receipt of exactly the gap) or ZERO ("yeh advance mila
 * hi nahi": the received figure comes down to the receipts). The wording below is the ONE wording every
 * screen uses (booking page notice, record-payment drawer, receipts, cheques).
 */
import { groupPk, moneyOf } from "@/lib/utils/qist"

export interface UnledgeredInfo {
  bookingId: number | null
  /** The gap: received figure minus the receipts. */
  unledgered: number
  /** The received figure the booking shows (the cache). */
  received: number | null
  /** What the receipts add up to. */
  ledger: number | null
}

type ErrLike = { response?: { status?: number; data?: { message?: string; data?: { code?: string; bookingId?: number; unledgered?: number; received?: number; ledger?: number } } } }

/** Is this axios error the server's 409 ADVANCE_UNLEDGERED? Returns the figures it carries, else null. */
export function unledgered409(err: unknown): UnledgeredInfo | null {
  const r = (err as ErrLike | null | undefined)?.response
  const d = r?.data?.data
  if (!r || r.status !== 409 || !d || d.code !== "ADVANCE_UNLEDGERED") return null
  const gap = moneyOf(d.unledgered)
  if (!(gap > 0)) return null
  return {
    bookingId: d.bookingId == null ? null : Number(d.bookingId),
    unledgered: gap,
    received: d.received == null ? null : moneyOf(d.received),
    ledger: d.ledger == null ? null : moneyOf(d.ledger),
  }
}

/** The codes the two doors answer with that mean "this is no longer the situation you were shown". */
export const PHANTOM_STALE_CODES = ["UNLEDGERED_CHANGED", "NO_UNLEDGERED_ADVANCE"] as const

export const rsOf = (n: unknown): string => `Rs ${groupPk(n)}`

/** The notice (booking page, drawers). */
export function phantomNoticeText(unledgered: number, cancelled = false): string {
  return `Is booking par ${rsOf(unledgered)} ka advance ledger mein darj nahi hai: ${cancelled ? "Zero karein (cancel booking par receipt nahi ban sakti)." : "Adopt ya Zero karein."}`
}

/** What each choice means, in the words the vendor decides by. */
export const PHANTOM_EXPLAIN = {
  intro: "Booking par ye raqam 'mil chuki' likhi hui hai, magar iski koi receipt nahi. Ya to ye paisa waqai mila tha (Adopt), ya kabhi mila hi nahi (Zero).",
  adopt: "Adopt: ek asli receipt ban jati hai. Mil chuka aur Baqaya wohi rahenge.",
  zero: "Zero: ye raqam booking se hat jati hai. Koi receipt nahi badalti; Baqaya barh jata hai.",
  cancelled: "Booking cancel hai, isliye receipt nahi ban sakti; sirf Zero ho sakta hai. Agar paisa waqai mila tha to refund ke flow se dekhein.",
} as const

export const ADOPT_BUTTON = "Adopt: haan, mila tha"
export const ZERO_BUTTON = "Yeh advance mila hi nahi"
