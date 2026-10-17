"use client"

/**
 * Shared "Record payment" drawer — the single inline action that kills the
 * console's most-repeated round-trip (booking-detail → Receipts → re-pick the
 * booking). Any screen that has a bookingId in hand can call this to record a
 * receipt against it WITHOUT leaving the screen.
 *
 * WW-QIST-SCHEDULE — the drawer now asks the server for the booking's schedule
 * (one call) and offers the qist the money is for:
 *
 *   - the default is "the oldest qist that is still owed" (the server's rule),
 *     and the amount is prefilled with what the server says is due now - NOT
 *     with a number the calling screen worked out for itself, so every surface
 *     that opens this drawer quotes the same figure;
 *   - or the vendor picks a specific qist, and the receipt is pinned to it.
 *
 * If the schedule cannot be loaded the drawer still works exactly as before
 * (amount from the caller, no qist choice).
 *
 * Uses the shell's right-side drawer (openDrawer/closeDrawer). The save button is
 * wired directly on the freshly-rendered node, so there's no listener leak.
 *
 * PAY-UI_VENDOR-001/-002/-003 — this drawer is the one door every screen records a
 * payment through (booking page, Payments, Khata, Receivables, Today, Bookings
 * kebab, chat), so the three money rules live HERE and not at each entry point:
 *
 *   - after a save it reports the change to `invalidateMoney`, so every other
 *     screen's number moves with it (not only the caller's own key);
 *   - it sends an Idempotency-Key minted when the drawer opened, so a retry of the
 *     same submit cannot book the money twice on a server that honours it, and
 *     `expectedOutstanding` (what the vendor was shown), so a second device with
 *     a stale drawer is refused instead of overpaying the booking;
 *   - when the answer is lost (no response / 5xx) it reads the booking back
 *     before it says anything: "Record nahi hui" is only said when it is true.
 */

import { toast } from "sonner"
import { ReceiptsAPI, type ReceiptMethod } from "@/lib/api/paymentReceipts"
import { BookingAPI, type BookingSchedule } from "@/lib/api/bookings"
import { openDrawer, closeDrawer, escHtml, pkNum } from "./artifact-shell"
import { dayText, qistHeading, rsText } from "@/lib/utils/qist"
import { invalidateMoney } from "@/lib/query/money-keys"
import { SubmitKey, isAmbiguousFailure, isRetrySameKey, checkPaymentLanded } from "@/lib/utils/idempotency"
import { unledgered409 } from "@/lib/utils/phantom-advance"
import { phantomPanelHtml, wirePhantomButtons } from "./phantom-advance"

const METHODS: { v: ReceiptMethod; l: string }[] = [
  { v: "cash", l: "Cash" }, { v: "bank_transfer", l: "Bank transfer" }, { v: "jazzcash", l: "JazzCash" },
  { v: "easypaisa", l: "EasyPaisa" }, { v: "raast", l: "Raast" }, { v: "ibft", l: "IBFT" }, { v: "other", l: "Other" },
]
const todayStr = () => new Date().toISOString().slice(0, 10)

export interface RecordPaymentOpts {
  bookingId: number
  customerName?: string
  /** Remaining/baqaya amount — prefilled into the amount field when the schedule cannot be loaded. */
  due?: number
  /** Called after a successful create (invalidate queries / refetch). */
  onSaved?: () => void
  /** Pay this qist (the vendor tapped "Payment" on its row). */
  installmentId?: number
  /** A schedule the caller already holds, so the drawer need not fetch it. */
  schedule?: BookingSchedule | null
  /** Prefill the amount (e.g. the unledgered gap) and say why. */
  amount?: number
  note?: string
  hint?: string
}

export function openRecordPaymentDrawer(shadow: ShadowRoot, opts: RecordPaymentOpts) {
  const { bookingId, customerName, due } = opts
  const hasDue = typeof due === "number" && due > 0
  const startAmount = typeof opts.amount === "number" && opts.amount > 0 ? opts.amount : hasDue ? due! : 0
  const body = `
    <div style="display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px;margin-bottom:4px">${escHtml(customerName || "Booking")} <span style="font-size:12px;color:var(--ink-3);font-weight:600">#${bookingId}</span></div>
    <div id="rp-phantom"></div>
    <div id="rp-due">${hasDue ? `<div style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--warn);background:var(--warn-wash);border-radius:7px;padding:4px 10px;margin-bottom:14px">Baqaya: Rs ${pkNum(due!)}</div>` : ""}</div>
    ${opts.hint ? `<div class="bf-hint">${escHtml(opts.hint)}</div>` : ""}
    <div class="dfield" id="rp-qist-wrap" hidden><label class="dlabel" for="rp-qist">Kis qist ke liye</label><select id="rp-qist"></select><div class="bf-hint" id="rp-qhint" style="margin:6px 0 0"></div></div>
    <div class="dfield"><label class="dlabel">Raqam (Rs) <span class="req">*</span></label><input id="rp-amount" type="number" inputmode="numeric" min="1" placeholder="0"${startAmount > 0 ? ` value="${Math.round(startAmount)}"` : ""}/><div id="rp-over" style="font-size:11.5px;color:var(--warn);margin-top:5px"></div></div>
    <div class="dfield row2">
      <div class="dfield"><label class="dlabel">Tareeqa</label><select id="rp-method">${METHODS.map((m) => `<option value="${m.v}">${m.l}</option>`).join("")}</select></div>
      <div class="dfield"><label class="dlabel">Tareekh</label><input id="rp-date" type="date" value="${todayStr()}"/></div>
    </div>
    <div class="dfield"><label class="dlabel">Reference / note</label><input id="rp-ref" placeholder="Transaction ID ya note (optional)" value="${escHtml(opts.note || "")}"/></div>
    <div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close type="button">Cancel</button><button class="btn btn-primary" data-rp-save type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg> Payment record karein</button></div>
  `
  openDrawer(shadow, "Payment record karein", body)
  const btn = shadow.querySelector("[data-rp-save]") as HTMLButtonElement | null
  const getv = (id: string) => (shadow.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? ""
  const amountEl = shadow.getElementById("rp-amount") as HTMLInputElement | null
  const qistEl = shadow.getElementById("rp-qist") as HTMLSelectElement | null
  const overEl = shadow.getElementById("rp-over")
  let schedule: BookingSchedule | null = opts.schedule ?? null
  // One key per drawer open; `forBody` hands out the same key only for an identical re-send.
  const submitKey = new SubmitKey()
  // The Baqaya the vendor was shown (the server's own figure, never the caller's rounded one).
  let shownOutstanding: number | null = null
  let onQistChange: (() => void) | null = null

  const checkOver = () => {
    if (!overEl) return
    const out = schedule?.money?.outstanding
    const v = Number(amountEl?.value || 0)
    overEl.textContent = out != null && v > out + 0.5
      ? `Ye baqaya (${rsText(out)}) se ${rsText(v - out)} zyada hai — wo "zyada raqam" ke taur par likhi jayegi.`
      : ""
  }
  amountEl?.addEventListener("input", checkOver)

  /** Fill the qist chooser from the server's schedule and prefill the amount from IT. */
  const applySchedule = (sch: BookingSchedule) => {
    schedule = sch
    shownOutstanding = typeof sch.money?.outstanding === "number" && Number.isFinite(sch.money.outstanding) ? sch.money.outstanding : null
    const wrap = shadow.getElementById("rp-qist-wrap") as HTMLElement | null
    const owing = (sch.installments || []).filter((q) => q.id != null && (q.actions ? q.actions.record : (q.remaining ?? 0) > 0))
    if (!wrap || !qistEl || !owing.length) return
    const optionsHtml = [
      `<option value="">Sab se purani baaqi qist (default)</option>`,
      ...owing.map((q) => `<option value="${q.id}">${escHtml(qistHeading(q))} — ${rsText(q.remaining)} lena hai · ${dayText(q.dueDate)}</option>`),
    ].join("")
    qistEl.innerHTML = optionsHtml
    wrap.hidden = false
    const dueEl = shadow.getElementById("rp-due")
    const out = sch.money?.outstanding ?? 0
    if (dueEl) dueEl.innerHTML = out > 0 ? `<div style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--warn);background:var(--warn-wash);border-radius:7px;padding:4px 10px;margin-bottom:14px">Baqaya: ${rsText(out)}</div>` : ""
    const pick = (id: string) => {
      const q = owing.find((x) => String(x.id) === id)
      const hint = shadow.getElementById("rp-qhint")
      if (q) {
        if (amountEl && !opts.amount) amountEl.value = String(Math.round(q.remaining ?? 0))
        if (hint) hint.textContent = "Paisa pehle isi qist par lagega; zyada ho to agli sab se purani baaqi qist par."
      } else {
        if (amountEl && !opts.amount) amountEl.value = sch.amountDue && sch.amountDue.amount > 0 ? String(Math.round(sch.amountDue.amount)) : amountEl.value
        if (hint) hint.textContent = sch.amountDue && sch.amountDue.amount > 0 ? `Abhi ${rsText(sch.amountDue.amount)} due hai${sch.amountDue.overdueAmount > 0 ? ` (isme ${rsText(sch.amountDue.overdueAmount)} late)` : ""}.` : ""
      }
      checkOver()
    }
    // applySchedule can run again (a 409 re-reads the schedule): one listener, the newest.
    if (onQistChange) qistEl.removeEventListener("change", onQistChange)
    onQistChange = () => pick(qistEl.value)
    qistEl.addEventListener("change", onQistChange)
    if (opts.installmentId && owing.some((q) => q.id === opts.installmentId)) {
      qistEl.value = String(opts.installmentId)
    }
    pick(qistEl.value)
  }
  if (schedule) applySchedule(schedule)
  else BookingAPI.getSchedule(bookingId).then(applySchedule).catch(() => { /* the drawer works without it */ })

  if (btn) {
    btn.onclick = async () => {
      const amount = Number(getv("rp-amount"))
      if (!amount || amount <= 0) { toast.error("Sahi raqam likhein"); return }
      btn.disabled = true
      const orig = btn.innerHTML; btn.textContent = "Record ho raha…"
      // What the vendor was looking at when they pressed save: the baseline for "did it land?".
      const seen = schedule
      const pin = Number(getv("rp-qist"))
      const body = {
        bookingId, amount,
        method: (getv("rp-method") as ReceiptMethod) || "cash",
        receivedDate: getv("rp-date") || todayStr(),
        transactionRef: getv("rp-ref") || undefined,
        ...(pin > 0 ? { installmentId: pin } : {}),
        ...(shownOutstanding !== null ? { expectedOutstanding: shownOutstanding } : {}),
      }
      try {
        await ReceiptsAPI.create(body, { idempotencyKey: submitKey.forBody(JSON.stringify(body)) })
        submitKey.rotate()
        toast.success("Payment record ho gayi")
        closeDrawer(shadow)
        void invalidateMoney({ bookingId })
        opts.onSaved?.()
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (isRetrySameKey(err)) {
          // 409 IN_PROGRESS / RETRY, 503 BUSY (WP00a): the server is still on the same submit (or
          // asked for a moment). Nothing is known to be lost; the key is KEPT, so pressing save again
          // replays the first answer instead of writing the money a second time.
          const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          toast.warning(m || "Pichli koshish abhi chal rahi hai — thori der baad dobara dabayein, payment dobara record nahi hogi.", { duration: 9000 })
          void invalidateMoney({ bookingId })
          btn.disabled = false; btn.innerHTML = orig
          return
        }
        if (isAmbiguousFailure(err)) {
          // The server may have committed although we never saw the answer. Read the
          // booking back before saying anything (PAY-UI_VENDOR-002).
          btn.textContent = "Check ho raha…"
          let fresh: BookingSchedule | null = null
          try { fresh = await BookingAPI.getSchedule(bookingId) } catch { /* still offline: unknown */ }
          const check = checkPaymentLanded(seen, fresh, { amount, method: body.method, transactionRef: body.transactionRef })
          if (fresh) { schedule = fresh }
          void invalidateMoney({ bookingId })
          if (check.verdict === "landed") {
            toast.warning("Payment record ho chuki hai — jawab raaste mein kho gaya tha. Dobara na dabayein, booking par dekh lein.", { duration: 9000 })
            closeDrawer(shadow)
            opts.onSaved?.()
            return
          }
          if (check.verdict === "absent") {
            toast.error("Network ka masla — payment record nahi hui. Dobara koshish karein.")
          } else {
            const msg = "Payment shayad record ho chuki hai — jawab nahi aaya. Dobara dabane se pehle booking ki payment history check karein."
            toast.error(msg, { duration: 9000 })
            if (overEl) overEl.textContent = msg
          }
        } else {
          // A refusal the server answered: nothing was written. A 409 usually means the
          // booking moved under this drawer (another device) - show its fresh numbers.
          submitKey.rotate()
          const resp = (err as { response?: { data?: { message?: string; data?: { code?: string; outstanding?: number } } } })?.response?.data
          if (status === 409) { BookingAPI.getSchedule(bookingId).then(applySchedule).catch(() => {}); void invalidateMoney({ bookingId }) }
          const ph = unledgered409(err)
          if (ph) {
            // WP31: the booking says money was received that no receipt backs. Nothing was written. Show why, and the two
            // explicit taps (Adopt / Zero); when one lands this drawer opens again, fresh, so the vendor carries on.
            const host = shadow.getElementById("rp-phantom")
            const again = () => { opts.onSaved?.(); openRecordPaymentDrawer(shadow, { ...opts, schedule: null, installmentId: opts.installmentId }) }
            if (host) {
              host.innerHTML = phantomPanelHtml({ unledgered: ph.unledgered, cancelled: !!schedule?.money?.cancelled })
              wirePhantomButtons(shadow, host, {
                bookingId, customerName, unledgered: ph.unledgered, received: ph.received, ledger: ph.ledger,
                total: schedule?.money?.total ?? null, cancelled: !!schedule?.money?.cancelled, createdDate: schedule?.money?.createdDate ?? null,
                onSettled: again, onStale: again,
              })
              host.scrollIntoView?.({ block: "nearest" })
            } else toast.error(resp?.message || "Pehle bina-receipt advance theek karein")
          } else if (status === 409 && resp?.data?.code === "OUTSTANDING_CHANGED") {
            // another device / screen moved this booking's baqaya since the drawer opened (WP02)
            toast.error(`Is booking ka baqaya badal chuka hai${typeof resp.data.outstanding === "number" ? ` (ab ${rsText(resp.data.outstanding)})` : ""}. Naye hisaab ke saath amount dobara check karke save karein.`, { duration: 9000 })
          } else {
            toast.error(resp?.message || (err as { message?: string })?.message || "Record nahi hui")
          }
        }
        btn.disabled = false; btn.innerHTML = orig
      }
    }
  }
}
