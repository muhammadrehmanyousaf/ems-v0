import type { Query, QueryClient } from "@tanstack/react-query"

/**
 * One fan-out for "money changed" (PAY-UI_VENDOR-001, the owner's rule:
 * "auto refresh on update or creation, same number everywhere").
 *
 * Every money screen of the console owns its own private query key
 * (`khata-receipts`, `payments-art`, `receipts-art`, `receivables-art`,
 * `art-overview`, `bk-detail*`, ...) and each mutation used to invalidate only
 * the keys of the screen it was fired from. Measured before this file
 * (WW-PAYMENT-TEST/coverage/ui_vendor.md, staleness table): after a payment
 * recorded on the booking page, six of seven other screens kept the old number
 * for the whole 10 minute staleTime; after one recorded on the Payments row the
 * BOOKING PAGE itself was stale; Receipts invalidated a key (`khata-art`) that
 * no screen reads.
 *
 * Now every money mutation calls `invalidateMoney({ bookingId?, businessId? })`
 * and every screen that shows a money figure is on one of the two lists below.
 * A screen added tomorrow that shows money is covered by adding its key HERE
 * once, not by remembering it at each of the call sites.
 *
 * The same list is what the notification socket invalidates when a payment /
 * booking / refund event arrives for a write made on ANOTHER device or by the
 * customer (see NotificationContext), and what `MONEY_STALE_MS` backs with a
 * short staleTime so a number can never be older than half a minute even when
 * nobody told this tab (QueryProvider).
 */

/** Upper bound for the age of any money figure on screen (the global default is 10 min). */
export const MONEY_STALE_MS = 30_000

/**
 * Keys of the form `[name, bookingId, ...]`: one booking's detail, schedule,
 * settlement, deposit, refunds, change requests (vendor console) and the cards
 * the customer's booking page shares with it.
 */
export const MONEY_BOOKING_KEYS = [
  // vendor console, booking page
  "bk-detail", "bk-detail-pay", "bk-detail-schedule", "bk-detail-hist",
  "bk-detail-settle", "bk-detail-deposit", "bk-detail-refunds", "bk-detail-cr", "bk-detail-claims",
  // cards mounted on the customer's booking page (the same app serves both)
  "refund-requests", "policy-acceptance", "payment-claims", "settlement",
  "refund-preview", "dispute-evidence", "booking-order", "paisa-reconcile", "beo",
] as const

/**
 * Keys that aggregate money across bookings (lists, ledgers, tiles, reports).
 * A change to ANY booking can move them, so they are invalidated whole.
 */
export const MONEY_LIST_KEYS = [
  // Bookings list, calendar and the report/picker lists all ride on
  // `useFetchData("/api/v1/bookings")`, whose key starts with the endpoint.
  "/api/v1/bookings", "vendor-bookings-lite", "bookings",
  "today-art", "customers-art", "cust-profile", "cust-timeline",
  // the money screens
  "khata-receipts", "khata-receivables", "payments-art", "receipts-art", "receipts-bookings",
  "receivables-art", "pdcs-art", "pdcs-bookings", "expenses-art", "tax-art",
  // Overview + its cards (wapsi / refunds owed)
  "art-overview", "art-refunds",
  // Reports / Insights
  "rep-kpi", "rep-rev", "rep-bk", "rep-bkd", "rep-cash", "rep-conv", "rep-season", "report-cards",
  // Venue OS profit view and the field-capture day totals
  "vos-rev", "vos-exp", "vos-kpi", "field-receipts", "field-expenses", "reminders-due",
] as const

const BOOKING_KEY_SET: ReadonlySet<string> = new Set(MONEY_BOOKING_KEYS)
const LIST_KEY_SET: ReadonlySet<string> = new Set(MONEY_LIST_KEYS)

/** Every key head that holds a money figure (used for the staleTime backstop). */
export const MONEY_KEY_HEADS: readonly string[] = [...MONEY_BOOKING_KEYS, ...MONEY_LIST_KEYS]

export interface MoneyChange {
  /** The booking whose money moved. Omit when unknown (or when many moved): every booking's cards are refreshed. */
  bookingId?: number | string | null
  /**
   * The venue the change belongs to, for changes that have no booking (an
   * expense, a cheque). Caches keyed by ANOTHER concrete venue are left alone;
   * all-venues caches (key element null) and caches without a venue always
   * refresh. Ignored when `bookingId` is given: a booking can span venues, so a
   * booking change refreshes every venue's aggregates.
   */
  businessId?: number | null
}

// A QueryClient for the code that is not a React component (the shared drawers
// in components/dashboard/mainScreens/artifact/*.ts render into a shadow root and
// have no hook). QueryProvider registers its client once.
let registered: QueryClient | null = null
export function registerMoneyQueryClient(qc: QueryClient): void { registered = qc }

interface Burst {
  qc: QueryClient
  /** something was reported without a booking and without a venue: refresh everything */
  all: boolean
  bookings: Set<string>
  businesses: Set<number>
  done: Array<() => void>
}

function isMoneyQuery(q: Query, job: Burst): boolean {
  const key = q.queryKey
  const head = key?.[0]
  if (typeof head !== "string") return false
  if (BOOKING_KEY_SET.has(head)) {
    if (job.all) return true
    return key[1] === undefined ? job.bookings.size > 0 : job.bookings.has(String(key[1]))
  }
  if (!LIST_KEY_SET.has(head)) return false
  // A booking changed (or we do not know what): every aggregate that could hold it.
  if (job.all || job.bookings.size > 0) return true
  // Only venue-scoped changes (an expense, a cheque): `["khata-receipts", 12]`
  // belongs to venue 12; `["khata-receipts", null]` is "all venues" and refreshes.
  const second = key[1]
  return !(typeof second === "number" && !job.businesses.has(second))
}

let pending: Burst | null = null

function flush() {
  const job = pending
  pending = null
  if (!job) return
  // One pass for the whole burst. `refetchType: "all"` (not the default "active"):
  // the screen the vendor opens NEXT is not mounted at this moment, and marking it
  // stale only would show the old number for the round trip after they arrive,
  // which is the bug seen from the vendor's side. Disabled queries are skipped by
  // TanStack; the cached set is bounded (screens visited within the gcTime).
  job.qc
    .invalidateQueries({ predicate: (q) => isMoneyQuery(q, job), refetchType: "all" })
    .catch(() => { /* a failed refetch surfaces on its own screen's error banner */ })
    .finally(() => job.done.forEach((d) => d()))
}

/**
 * Tell the cache that money moved. Call it from EVERY money mutation's success
 * path: record payment, receipt create/edit/delete, qist ops, price edit,
 * cancel, refund handover, cheque transitions, claim confirm/reject,
 * settlement / cash / deposit, expense, a new booking.
 *
 * Bursts are coalesced into one pass (the shared record-payment drawer and the
 * screen that opened it both report the same payment). Never throws; the
 * returned promise resolves when the refetches settle and is safe to ignore.
 */
export function invalidateMoney(change: MoneyChange = {}, qc?: QueryClient | null): Promise<void> {
  const client = qc ?? registered
  if (!client) return Promise.resolve()
  const id = change.bookingId
  const bookingId = id !== undefined && id !== null && id !== "" && Number.isFinite(Number(id)) ? String(Number(id)) : null
  const businessId = typeof change.businessId === "number" && Number.isFinite(change.businessId) ? change.businessId : null
  return new Promise<void>((resolve) => {
    if (pending && pending.qc !== client) flush()
    if (!pending) {
      pending = { qc: client, all: false, bookings: new Set(), businesses: new Set(), done: [] }
      setTimeout(flush, 0)
    }
    if (bookingId !== null) pending.bookings.add(bookingId)
    else if (businessId !== null) pending.businesses.add(businessId)
    else pending.all = true
    pending.done.push(resolve)
  })
}

/**
 * For events that arrive in bursts (the notification socket: a customer paying
 * three qists at once, a cancellation that raises a refund and a notice): collect
 * what moved for a moment and refresh once, instead of restarting every refetch
 * per event.
 */
let soon: { qc: QueryClient; ids: Set<number>; unknown: boolean; timer: ReturnType<typeof setTimeout> } | null = null
export function invalidateMoneySoon(change: MoneyChange, qc: QueryClient, delayMs = 800): void {
  const id = Number(change.bookingId)
  if (!soon || soon.qc !== qc) {
    if (soon) clearTimeout(soon.timer)
    soon = { qc, ids: new Set(), unknown: false, timer: setTimeout(() => {}, 0) }
  }
  if (Number.isFinite(id) && id > 0) soon.ids.add(id)
  else soon.unknown = true
  clearTimeout(soon.timer)
  soon.timer = setTimeout(() => {
    const job = soon
    soon = null
    if (!job) return
    if (job.unknown) void invalidateMoney({}, job.qc)
    else for (const b of job.ids) void invalidateMoney({ bookingId: b }, job.qc)
  }, delayMs)
}

/** Shorter staleTime + refetch-on-focus for every money key (QueryProvider calls this once). */
export function applyMoneyQueryDefaults(qc: QueryClient): void {
  for (const head of MONEY_KEY_HEADS) {
    qc.setQueryDefaults([head], { staleTime: MONEY_STALE_MS, refetchOnWindowFocus: true })
  }
}

/**
 * Does this notification mean a payment / booking / refund figure moved?
 * (The enum is wider than the money subset; `system` carries the intended type
 * when the database enum label has not shipped yet: see notificationService.)
 */
const MONEY_NOTIFICATION = /^(booking_|payment_|payout_|qist_|refund_|change_request_)/
export function isMoneyNotification(n: { type?: string | null; data?: Record<string, unknown> | null } | null | undefined): boolean {
  if (!n) return false
  if (typeof n.type === "string" && MONEY_NOTIFICATION.test(n.type)) return true
  const intended = n.data && typeof n.data.intendedType === "string" ? (n.data.intendedType as string) : ""
  if (intended && MONEY_NOTIFICATION.test(intended)) return true
  const kind = n.data && typeof n.data.kind === "string" ? (n.data.kind as string) : ""
  return !!kind && /payment|refund|receipt|qist|deposit|settle|price|cancel/i.test(kind)
}

/** The booking a notification is about, when its payload says so. */
export function notificationBookingId(n: { data?: Record<string, unknown> | null } | null | undefined): number | null {
  const raw = n?.data?.bookingId ?? n?.data?.booking_id
  const num = Number(raw)
  return raw !== undefined && raw !== null && Number.isFinite(num) && num > 0 ? num : null
}

export default invalidateMoney
