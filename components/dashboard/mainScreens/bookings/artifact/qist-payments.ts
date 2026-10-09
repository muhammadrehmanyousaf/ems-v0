"use client"

/**
 * The booking's PAYMENTS card - one card, one vocabulary, one source of truth.
 *
 * It replaces two cards that said the same thing in different words (a "Payment"
 * card with a progress bar and a history, and a read-only "Qist schedule" card
 * below it). The owner could not tell which number to collect: "Baqaya" meant the
 * outstanding total, the second instalment and a history step; "Baaqi lena" was a
 * fourth spelling; and the schedule quietly swapped in a different number
 * ("receipts se") because the instalment rows lagged the receipts.
 *
 * Now:
 *   - everything on the card comes from ONE server object (BookingSchedule): the
 *     booking's money, its qists, the payments that explain them. Nothing is
 *     recomputed in the browser, so the card cannot disagree with itself.
 *   - Qist = a scheduled instalment. Mil chuka = received. Baqaya = the OUTSTANDING
 *     TOTAL only. A single qist's remainder is "lena hai".
 *   - every qist says its true state with a colour and the exact remainder:
 *     Aane wali / Aaj due / N din late / Kuch mila / Mil gaya / Maaf.
 *   - every row has its own actions (payment, edit, split, waive, remind, remove),
 *     and "Plan badlein" opens the plan editor with presets.
 *
 * `paymentsCardHtml` renders; `handleQistClick` is the one delegated click handler
 * the booking screen calls first. All server writes answer with the refreshed
 * schedule, which goes straight back into the card.
 */

import { toast } from "sonner"
import { BookingAPI, type BookingSchedule, type BookingInstallment, type PlanRowInput, type ScheduleConfirm, type SchedulePayment } from "@/lib/api/bookings"
import { openDrawer, closeDrawer, openConfirm, escHtml, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import { openRecordPaymentDrawer } from "@/components/dashboard/mainScreens/artifact/record-payment"
import { dayText, groupPk, moneyOf, qistHeading, qistStateVendor, rsText } from "@/lib/utils/qist"

const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  minus: '<path d="M5 12h14"/>',
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  split: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevr: '<path d="M9 6l6 6-6 6"/>',
  chevd: '<path d="M6 9l6 6 6-6"/>',
  money: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
}

const rs = (n: unknown) => `<span class="rs">Rs</span> ${groupPk(n)}`

export const QIST_CSS = String.raw`
.pay-card .card-h .acts{ display:flex; align-items:center; gap:14px; flex-wrap:wrap; justify-content:flex-end; }
.q-note{ margin:10px 16px 0; padding:9px 12px; border-radius:9px; font-size:12px; line-height:1.5; border:1px solid var(--border); background:var(--surface-2); color:var(--ink-2); display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.q-note.warn{ background:var(--warn-wash); border-color:transparent; color:var(--warn); } .q-note.bad{ background:var(--bad-wash); border-color:transparent; color:var(--bad); } .q-note.info{ background:var(--info-wash); border-color:transparent; color:var(--info); }
.q-note .btn{ height:28px; padding:0 10px; font-size:11.5px; }
.q-sec{ display:flex; align-items:baseline; justify-content:space-between; gap:10px; padding:14px 16px 6px; margin-top:8px; border-top:1px solid var(--border); }
.q-sec .t{ font-size:11px; font-weight:600; letter-spacing:.03em; text-transform:uppercase; color:var(--ink-3); } .q-sec .s{ font-size:11.5px; color:var(--ink-3); }
.q-list{ padding:0 8px 4px; }
.q-row{ display:grid; grid-template-columns:26px minmax(0,1fr) auto; gap:12px; padding:12px 8px; border-bottom:1px solid var(--border); align-items:start; }
.q-row:last-child{ border-bottom:0; }
.q-dot{ width:26px; height:26px; border-radius:50%; flex:none; display:grid; place-items:center; background:var(--surface-3); border:1px solid var(--border-2); color:var(--ink-4); margin-top:1px; } .q-dot svg{ width:14px; height:14px; }
.q-row.paid .q-dot{ background:var(--ok-wash); border-color:transparent; color:var(--ok); }
.q-row.overdue .q-dot{ background:var(--bad-wash); border-color:transparent; color:var(--bad); }
.q-row.due_today .q-dot{ background:var(--warn-wash); border-color:transparent; color:var(--warn); }
.q-row.part_paid .q-dot{ background:var(--info-wash); border-color:transparent; color:var(--info); }
.q-row.upcoming .q-dot{ background:var(--accent-wash); border-color:var(--accent-line); color:var(--accent-ink); }
.q-row.waived,.q-row.cancelled{ opacity:.78; }
.q-main{ flex:1; min-width:0; }
.q-top{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.q-nm{ font-weight:600; font-size:13px; }
.q-meta{ font-size:11.5px; color:var(--ink-3); margin-top:3px; line-height:1.5; }
.q-meta.bad{ color:var(--bad); font-weight:560; }
.q-flag{ font-size:11px; color:var(--warn); margin-top:3px; display:flex; align-items:center; gap:5px; } .q-flag svg,.pe-sum svg{ width:12px; height:12px; flex:none; }
.q-reminded{ font-size:11px; color:var(--ink-4); margin-top:2px; }
.q-amt{ font-weight:660; font-size:14px; font-variant-numeric:tabular-nums; white-space:nowrap; text-align:right; } .q-amt .rs{ font-size:10.5px; color:var(--ink-3); font-weight:600; }
.q-amt .sub{ display:block; font-size:10.5px; font-weight:500; color:var(--ok); margin-top:2px; }
.q-amt.struck{ text-decoration:line-through; color:var(--ink-4); }
.q-acts{ display:flex; gap:6px; flex-wrap:wrap; margin-top:9px; }
.q-acts .btn{ height:28px; padding:0 10px; font-size:11.5px; gap:5px; } .q-acts .btn svg{ width:13px; height:13px; }
.q-acts .btn.q-danger,.q-more-menu .btn.q-danger{ color:var(--bad); }
.q-more{ display:inline-block; } .q-more[open]{ flex-basis:100%; display:block; }
.q-more summary{ list-style:none; cursor:pointer; display:inline-flex; align-items:center; } .q-more summary::-webkit-details-marker{ display:none; } .q-more summary svg{ width:12px; height:12px; transition:transform .12s; } .q-more[open] summary svg{ transform:rotate(180deg); }
.q-more-menu{ display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; } .q-more-menu .btn{ height:28px; padding:0 10px; font-size:11.5px; gap:5px; } .q-more-menu .btn svg{ width:13px; height:13px; }
.q-empty{ padding:14px 16px 18px; color:var(--ink-3); font-size:12px; }
.q-pay{ display:flex; gap:12px; align-items:flex-start; padding:9px 0; }
.q-pay .q-dot{ width:22px; height:22px; } .q-pay .q-dot svg{ width:12px; height:12px; }
.q-pay.refund .q-dot{ background:var(--bad-wash); border-color:transparent; color:var(--bad); }
.q-pay .pt{ display:flex; justify-content:space-between; align-items:baseline; gap:10px; font-weight:600; font-size:13px; }
.q-pay .pt .a{ font-variant-numeric:tabular-nums; white-space:nowrap; } .q-pay.refund .pt .a{ color:var(--bad); }
.q-pay .pm{ font-size:11.5px; color:var(--ink-3); margin-top:2px; } .q-pay .pl{ font-size:11.5px; color:var(--ink-2); margin-top:3px; }
.q-hist{ padding:4px 16px 8px; }
.q-foot{ display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-top:1px solid var(--border); }
.q-foot .c{ font-weight:600; font-size:12.5px; } .q-foot .v{ font-weight:700; font-size:16px; letter-spacing:-.02em; font-variant-numeric:tabular-nums; } .q-foot .v .rs{ font-size:11px; color:var(--ink-3); font-weight:600; }
.pe-presets{ display:flex; gap:6px; flex-wrap:wrap; margin:0 0 14px; }
.pe-chip{ height:30px; padding:0 12px; border-radius:999px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); font-size:12px; font-weight:600; }
.pe-chip:hover{ background:var(--surface-3); } .pe-chip.on{ background:var(--accent-wash); border-color:var(--accent-line); color:var(--accent-ink); } .pe-chip:disabled{ opacity:.45; cursor:default; }
.pe-fixed{ border:1px dashed var(--border-2); border-radius:9px; padding:8px 10px; margin-bottom:12px; font-size:12px; color:var(--ink-3); display:flex; flex-direction:column; gap:4px; }
.pe-fixed div{ display:flex; justify-content:space-between; gap:10px; } .pe-fixed b{ color:var(--ink-2); font-weight:600; }
.pe-row{ display:grid; grid-template-columns:1fr 112px 138px 30px; gap:8px; align-items:center; margin-bottom:8px; }
.pe-row input{ min-width:0; }
.pe-del{ width:30px; height:30px; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-3); display:grid; place-items:center; } .pe-del:hover{ color:var(--bad); border-color:var(--bad); } .pe-del svg{ width:14px; height:14px; }
.pe-cap{ display:grid; grid-template-columns:1fr 112px 138px 30px; gap:8px; font-size:10.5px; font-weight:600; color:var(--ink-3); text-transform:uppercase; letter-spacing:.03em; margin-bottom:5px; }
.pe-sum{ font-size:12.5px; font-weight:600; padding:9px 12px; border-radius:9px; background:var(--surface-2); border:1px solid var(--border); margin:6px 0 12px; display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.pe-sum.ok{ background:var(--ok-wash); border-color:transparent; color:var(--ok); } .pe-sum.bad{ background:var(--bad-wash); border-color:transparent; color:var(--bad); }
.pe-warn{ font-size:11.5px; color:var(--warn); margin:-4px 0 12px; line-height:1.5; }
@media (max-width:560px){
  .pe-row{ grid-template-columns:minmax(0,1fr) minmax(0,1fr) 30px; padding-bottom:10px; margin-bottom:10px; border-bottom:1px solid var(--border); }
  .pe-row .pe-label{ grid-column:1 / 3; } .pe-row .pe-del{ grid-column:3; grid-row:1; } .pe-row .pe-amount{ grid-column:1; } .pe-row .pe-date{ grid-column:2 / 4; } .pe-cap{ display:none; }
  .q-row{ grid-template-columns:26px minmax(0,1fr) auto; gap:10px; padding:12px 4px; } .q-amt{ font-size:13px; }
  .q-acts .btn.btn-primary{ flex:1 1 auto; justify-content:center; }
  .pay-card .card-h{ flex-wrap:wrap; } .pay-card .card-h .acts{ justify-content:flex-start; gap:12px; }
  .pay-sum{ gap:16px; } .q-sec{ padding:12px 12px 6px; } .q-hist{ padding:4px 12px 8px; } .q-note{ margin:10px 12px 0; }
}
`

/* ── the card ────────────────────────────────────────────────────────────── */

function statusDotIcon(q: BookingInstallment): string {
  switch (q.state) {
    case "paid": return svg(IC.check, 2.6)
    case "overdue": return svg(IC.alert, 2.2)
    case "waived": case "cancelled": return svg(IC.minus, 2.4)
    default: return svg(IC.clock)
  }
}

function methodText(m?: string | null) { return m ? String(m).replace(/_/g, " ") : "—" }

function qistRowHtml(q: BookingInstallment, pay: Map<number, SchedulePayment>, cancelledBooking: boolean): string {
  const st = qistStateVendor(q)
  const waived = q.state === "waived"
  const paidPart = moneyOf(q.amountPaid)
  const remaining = moneyOf(q.remaining)
  const idAttr = q.id != null ? `data-qid="${q.id}"` : ""
  const heading = waived ? `${escHtml(q.title || q.label)} (maaf)` : escHtml(qistHeading(q))
  // meta line: the exact state, then what has come in
  let meta = ""
  if (q.state === "paid") {
    const last = (q.allocations || []).map((a) => pay.get(a.receiptId)).filter(Boolean).pop()
    meta = `Mil gaya${last ? ` · ${dayText(last.receivedDate)} · ${escHtml(methodText(last.method))}` : q.paidAt ? ` · ${dayText(String(q.paidAt).slice(0, 10))}` : ""}`
  } else if (waived) {
    meta = `${dayText(q.dueDate)} ki qist maaf kar di gayi${q.waivedReason ? ` — ${escHtml(q.waivedReason)}` : ""}`
  } else if (q.state === "cancelled") {
    meta = "Booking cancel ho chuki — ye qist collect nahi hogi"
  } else {
    meta = escHtml(st.detail)
    if (paidPart > 0) meta += ` · Mil chuka ${rsText(paidPart)}`
  }
  const flags: string[] = []
  if ((q.warnings || []).includes("due_after_event")) flags.push("Ye taareekh event ke baad ki hai.")
  if ((q.warnings || []).includes("due_before_booking")) flags.push("Ye taareekh booking banne se pehle ki hai.")
  const reminded = q.lastRemindedAt ? `Aakhri yaad-dehani ${dayText(String(q.lastRemindedAt).slice(0, 10))}${moneyOf(q.reminderCount) > 1 ? ` · ${moneyOf(q.reminderCount)} baar` : ""}` : ""
  const a = q.actions
  // Calm by default: the one thing a vendor does most (take the payment) and, when it is
  // late or due, the nudge. Everything else is one tap away under "Aur".
  const late = q.state === "overdue" || q.state === "due_today"
  const remindBtn = a && a.remind ? `<button class="btn btn-ghost" data-q-remind="${q.id}">${svg(IC.wa)} Yaad dilayein</button>` : ""
  const more = a && q.id != null
    ? [
        late ? "" : remindBtn,
        a.edit ? `<button class="btn btn-ghost" data-q-edit="${q.id}">${svg(IC.edit)} Badlein</button>` : "",
        a.split ? `<button class="btn btn-ghost" data-q-split="${q.id}">${svg(IC.split)} Baantein</button>` : "",
        a.waive ? `<button class="btn btn-ghost" data-q-waive="${q.id}">Maaf karein</button>` : "",
        a.remove ? `<button class="btn btn-ghost q-danger" data-q-remove="${q.id}">Hatayein</button>` : "",
      ].join("")
    : ""
  const acts = a && q.id != null && !cancelledBooking
    ? [
        a.record ? `<button class="btn btn-primary" data-q-pay="${q.id}">${svg(IC.money, 2.2)} Payment</button>` : "",
        late ? remindBtn : "",
        more ? `<details class="q-more"><summary class="btn btn-ghost">Aur ${svg(IC.chevd, 2.2)}</summary><div class="q-more-menu">${more}</div></details>` : "",
      ].join("")
    : ""
  const amtSub = !waived && paidPart > 0 && remaining > 0 ? `<span class="sub">${rsText(paidPart)} mil chuka</span>` : ""
  return `<div class="q-row ${q.state || ""}" ${idAttr}>
    <span class="q-dot" aria-hidden="true">${statusDotIcon(q)}</span>
    <div class="q-main">
      <div class="q-top"><span class="q-nm">${heading}</span><span class="st ${st.tone}"><i></i> ${escHtml(st.label)}</span></div>
      <div class="q-meta ${q.state === "overdue" ? "bad" : ""}">${meta}</div>
      ${flags.map((f) => `<div class="q-flag">${svg(IC.alert, 2)} ${escHtml(f)}</div>`).join("")}
      ${reminded && q.state !== "paid" && !waived ? `<div class="q-reminded">${escHtml(reminded)}</div>` : ""}
      ${acts ? `<div class="q-acts">${acts}</div>` : ""}
    </div>
    <div class="q-amt tnum ${waived ? "struck" : ""}">${rs(q.amount)}${amtSub}</div>
  </div>`
}

function paymentRowHtml(p: SchedulePayment): string {
  const refund = p.kind === "refund"
  const amt = Math.abs(moneyOf(p.amount))
  const title = refund ? "Wapsi (refund)" : "Payment mili"
  const lines = (p.allocations || [])
    .map((a) => (a.overpayment ? `→ Zyada raqam ${rsText(a.amount)} (kisi qist par nahi)` : `→ ${escHtml(a.title || "Qist")} ${rsText(a.amount)}`))
    .join(" · ")
  const meta = `${dayText(p.receivedDate)} · ${escHtml(methodText(p.method))}${p.transactionRef ? ` · ${escHtml(p.transactionRef)}` : ""}`
  return `<div class="q-pay ${refund ? "refund" : ""}"><span class="q-dot">${svg(refund ? IC.minus : IC.check, 2.4)}</span>
    <div style="flex:1;min-width:0"><div class="pt"><span>${title}</span><span class="a">${refund ? "−" : ""}${rs(amt)}</span></div><div class="pm">${meta}</div>${lines && !refund ? `<div class="pl">${lines}</div>` : ""}</div></div>`
}

export interface PaymentsCardOpts {
  loading?: boolean
  failed?: boolean
}

export function paymentsCardHtml(view: BookingSchedule | null, opts: PaymentsCardOpts = {}): string {
  const head = (sub: string, acts = "") => `<div class="card-h"><div><h2>Payments</h2><div class="sub">${escHtml(sub)}</div></div><div class="acts">${acts}<button class="link" data-nav-btn="/dashboard/money">Khata mein ${svg(IC.chevr, 2.2)}</button></div></div>`
  if (!view || !view.money) {
    if (opts.failed) return `<div class="card pay-card">${head("Load nahi hua")}${errorBannerHtml("Payments load nahi hue — ye missing hain, sifar nahi. Dobara koshish karein.")}</div>`
    return `<div class="card pay-card">${head("Load ho raha hai…")}<div class="q-empty">Payments load ho rahe hain…</div></div>`
  }
  const m = view.money
  const cancelled = m.cancelled
  const live = view.installments.filter((q) => !q.waived)
  const open = live.filter((q) => moneyOf(q.remaining) > 0)
  const next = view.nextDue
  const sub = cancelled
    ? "Booking cancel — koi qist collect nahi hoti"
    : m.outstanding <= 0
      ? `${live.length} qist · sab mil gayin`
      : next
        ? `${live.length} qist · agli: ${next.title} · ${next.state === "overdue" ? `${next.daysOverdue} din late` : dayText(next.dueDate)}`
        : `${live.length} qist`
  const planBtn = view.plan?.editable ? `<button class="link" data-q-plan>${svg(IC.edit, 1.9)} Plan badlein</button>` : ""
  const pay = new Map<number, SchedulePayment>((view.payments || []).map((p) => [p.id, p]))
  const notes: string[] = []
  if (moneyOf(m.unledgered) > 0) {
    notes.push(`<div class="q-note warn"><span>${rsText(m.unledgered)} booking par likha hai magar iski receipt nahi hai. Receipt bana dein taake hisaab mukammal ho.</span><button class="btn btn-ghost" data-q-adopt="${Math.round(m.unledgered)}">Receipt darj karein</button></div>`)
  }
  if (moneyOf(m.overpaid) > 0) {
    notes.push(`<div class="q-note info"><span>${rsText(m.overpaid)} zyada mil gaya hai. Wapas karna ho to "Refund" se likhein.</span></div>`)
  }
  if (moneyOf(m.waived) > 0) {
    notes.push(`<div class="q-note"><span>${rsText(m.waived)} maaf kiya ja chuka hai — Kul raqam usi hisaab se kam hai.</span></div>`)
  }
  if (cancelled) {
    notes.push(`<div class="q-note bad"><span>Ye booking cancel ho chuki hai. Mil chuka paisa refund/policy ke mutabiq dekhein.</span></div>`)
  }
  const rows = view.installments.length
    ? view.installments.map((q) => qistRowHtml(q, pay, cancelled)).join("")
    : `<div class="q-empty">${cancelled ? "Is booking par koi qist nahi." : "Abhi koi qist nahi — Plan badlein se banayein."}</div>`
  const history = (view.payments || []).length
    ? [...view.payments!].sort((a, b) => (a.receivedDate === b.receivedDate ? b.id - a.id : a.receivedDate < b.receivedDate ? 1 : -1)).map(paymentRowHtml).join("")
    : `<div class="q-empty" style="padding:6px 0">Abhi koi payment nahi mili.</div>`
  const bar = `<div class="pay-bar-wrap"><div class="pay-bar-lbl"><b>${m.percentPaid}% mila</b><span>${rsText(m.received)} / ${rsText(m.total)}</span></div><div class="paybar"><span style="width:${m.percentPaid}%"></span></div></div>`
  return `<div class="card pay-card" data-pay-card>
    ${head(sub, planBtn)}
    <div class="pay-sum">
      <div><div class="ps-cap">Kul</div><div class="ps-val tnum">${rs(m.total)}</div></div>
      <div><div class="ps-cap">Mil chuka</div><div class="ps-val ok tnum">${rs(m.received)}</div></div>
      <div><div class="ps-cap">Baqaya</div><div class="ps-val due tnum">${cancelled ? "—" : rs(m.outstanding)}</div></div>
    </div>
    ${bar}
    ${notes.join("")}
    <div class="q-sec"><span class="t">Qistein</span><span class="s">${cancelled ? "" : open.length ? `${open.length} baaqi` : live.length ? "sab mil gayin" : ""}</span></div>
    <div class="q-list">${rows}</div>
    <div class="q-sec"><span class="t">Payment history</span><span class="s">${(view.payments || []).length} entry</span></div>
    <div class="q-hist">${history}</div>
  </div>`
}

/* ── drawers ─────────────────────────────────────────────────────────────── */

export interface QistCtx {
  bookingId: number
  customerName?: string | null
  /** Latest schedule the screen holds. */
  getSchedule: () => BookingSchedule | null
  /** A mutation answered with a fresh schedule: show it now. */
  apply: (v: BookingSchedule) => void
  /** Refetch everything else on the booking screen (totals changed, etc.). */
  refresh: () => void
}

type ApiErr = { response?: { data?: { message?: string; data?: { code?: string; needsConfirm?: "pastDue" | "afterEvent"; differenceCents?: number } } } }
const errData = (e: unknown) => (e as ApiErr)?.response?.data
const errMsg = (e: unknown, fallback: string) => errData(e)?.message || fallback

const find = (view: BookingSchedule | null, id: number) => view?.installments.find((q) => q.id === id) || null

function fieldVal(s: ShadowRoot, id: string): string {
  return (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.value?.trim() ?? ""
}

/** Run a mutation; when the server asks "are you sure about this date?", ask and retry. */
async function withConfirm(
  s: ShadowRoot,
  run: (confirm: ScheduleConfirm) => Promise<BookingSchedule>,
  onDone: (v: BookingSchedule) => void,
  onFail: () => void,
  confirm: ScheduleConfirm = {},
): Promise<void> {
  try {
    onDone(await run(confirm))
  } catch (e) {
    const d = errData(e)
    const nc = d?.data?.needsConfirm
    if (nc) {
      onFail()
      openConfirm(s, {
        title: nc === "pastDue" ? "Guzri hui taareekh?" : "Event ke baad ki taareekh?",
        message: d?.message || "Is taareekh par ek baar phir ghaur karein.",
        confirmLabel: "Haan, yehi lagayein",
        danger: false,
        onConfirm: () => { void withConfirm(s, run, onDone, onFail, { ...confirm, [nc]: true }) },
      })
      return
    }
    toast.error(errMsg(e, "Nahi hua"))
    onFail()
  }
}

/* plan editor ----------------------------------------------------------- */

/** `label` is what is stored (a code such as down_payment, or a custom name); `title` is how it reads on screen. */
interface EditorRow { id: number | null; label: string; title?: string; amount: number; dueDate: string }
interface EditorState { free: number; keep: EditorRow[]; fixed: BookingInstallment[]; max: number; active: string }
const EDITORS = new WeakMap<ShadowRoot, EditorState>()
const PRESET_TEXT: Record<string, string> = { full: "Poori raqam ek qist mein", advance_balance: "Advance + aakhri qist", three_qists: "Teen qistein", custom: "Apni marzi" }

function editorRowHtml(r: EditorRow, i: number): string {
  return `<div class="pe-row" data-pe-row ${r.id != null ? `data-id="${r.id}"` : ""}>
    <input class="pe-label" maxlength="40" value="${escHtml(r.title || r.label)}" data-code="${escHtml(r.label)}" data-title="${escHtml(r.title || r.label)}" aria-label="Qist ${i + 1} ka naam" placeholder="Naam"/>
    <input class="pe-amount" type="number" inputmode="numeric" min="1" step="1" value="${r.amount > 0 ? Math.round(r.amount) : ""}" aria-label="Qist ${i + 1} ki raqam" placeholder="Raqam"/>
    <input class="pe-date" type="date" value="${escHtml(r.dueDate)}" aria-label="Qist ${i + 1} ki taareekh"/>
    <button class="pe-del" type="button" data-pe-del aria-label="Qist hatayein">${svg(IC.minus, 2.4)}</button>
  </div>`
}

/** Untouched, a title goes back to its code so the customer sees their own wording; edited, the typed name is kept. */
function labelFrom(inp: HTMLInputElement | null): string {
  if (!inp) return ""
  const typed = (inp.value || "").trim()
  return inp.dataset.title && typed === inp.dataset.title ? (inp.dataset.code || typed) : typed
}

function readEditorRows(s: ShadowRoot): EditorRow[] {
  return [...s.querySelectorAll("#pe-rows [data-pe-row]")].map((el) => ({
    id: (el as HTMLElement).dataset.id ? Number((el as HTMLElement).dataset.id) : null,
    label: labelFrom(el.querySelector(".pe-label") as HTMLInputElement | null),
    title: ((el.querySelector(".pe-label") as HTMLInputElement | null)?.value || "").trim(),
    amount: Math.round(Number((el.querySelector(".pe-amount") as HTMLInputElement)?.value || 0)),
    dueDate: (el.querySelector(".pe-date") as HTMLInputElement)?.value || "",
  }))
}

function refreshEditorSum(s: ShadowRoot) {
  const st = EDITORS.get(s)
  const box = s.getElementById("pe-sum")
  const save = s.querySelector("[data-pe-save]") as HTMLButtonElement | null
  if (!st || !box || !save) return
  const rows = readEditorRows(s)
  const sum = rows.reduce((t, r) => t + r.amount, 0)
  const diff = st.free - sum
  const bad = rows.some((r) => !(r.amount > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(r.dueDate)) || rows.length === 0 || rows.length + st.keep.length + st.fixed.length > st.max
  box.className = `pe-sum ${diff === 0 && !bad ? "ok" : "bad"}`
  box.innerHTML = diff === 0
    ? `<span>Qiston ka jod ${rsText(sum)} — barabar</span><span>${svg(IC.check, 2.6)}</span>`
    : `<span>Qiston ka jod ${rsText(sum)} / ${rsText(st.free)}</span><span>${diff > 0 ? `${rsText(diff)} baaqi hai` : `${rsText(-diff)} zyada hai`}</span>`
  save.disabled = diff !== 0 || bad
}

function setEditorRows(s: ShadowRoot, rows: EditorRow[]) {
  const host = s.getElementById("pe-rows")
  if (host) host.innerHTML = rows.map(editorRowHtml).join("")
  refreshEditorSum(s)
}

function openPlanEditor(s: ShadowRoot, view: BookingSchedule) {
  const plan = view.plan
  if (!plan) return
  const open = view.installments.filter((q) => q.actions && q.actions.edit && q.id != null)
  const keep: EditorRow[] = open.filter((q) => moneyOf(q.amountPaid) > 0).map((q) => ({ id: q.id, label: q.label, amount: moneyOf(q.amount), dueDate: q.dueDate || "" }))
  const free = open.filter((q) => moneyOf(q.amountPaid) <= 0)
  const fixed = view.installments.filter((q) => !q.waived && moneyOf(q.remaining) <= 0)
  EDITORS.set(s, { free: moneyOf(plan.remainingToSchedule), keep, fixed, max: plan.maxQists, active: "custom" })
  const initial: EditorRow[] = free.map((q) => ({ id: q.id, label: q.label, title: q.title || q.label, amount: moneyOf(q.amount), dueDate: q.dueDate || "" }))
  const chips = plan.presets.map((p) => `<button class="pe-chip ${p.key === "custom" ? "on" : ""}" type="button" data-pe-preset="${p.key}" ${p.available ? "" : "disabled"} title="${p.available ? "" : escHtml(p.reason === "event_too_close" ? "Event bohat qareeb hai" : "Kuch baaqi nahi")}">${escHtml(PRESET_TEXT[p.key] || p.key)}</button>`).join("")
  const locked = [...fixed.map((q) => `<div><span>${escHtml(qistHeading(q))} · ${dayText(q.dueDate)}</span><b>Mil gaya ${rsText(q.amount)}</b></div>`),
    ...keep.map((k) => { const q = find(view, k.id as number); return `<div><span>${escHtml(q ? qistHeading(q) : "Qist")} · ${dayText(k.dueDate)}</span><b>${rsText(k.amount)} (kuch mila)</b></div>` })].join("")
  const body = `
    <div class="bf-hint">Baaqi ${rsText(plan.remainingToSchedule)} ko qiston mein baantein. Jo qist mil chuki hai wo yahan nahi badalti. Zyada se zyada ${plan.maxQists} qistein.</div>
    <div class="pe-presets" id="pe-presets">${chips}</div>
    ${locked ? `<div class="pe-fixed">${locked}</div>` : ""}
    <div class="pe-cap"><span>Naam</span><span>Raqam (Rs)</span><span>Taareekh</span><span></span></div>
    <div id="pe-rows"></div>
    <button class="btn btn-ghost sm" type="button" data-pe-add>${svg(IC.plus, 2.4)} Qist add karein</button>
    <div class="pe-sum" id="pe-sum"></div>
    <div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close type="button">Waapas</button><button class="btn btn-primary" data-pe-save type="button" disabled>Plan save karein</button></div>`
  openDrawer(s, "Qist plan badlein", body)
  setEditorRows(s, initial)
  bindEditorInputs(s)
}

const BOUND_INPUT = new WeakSet<ShadowRoot>()
function bindEditorInputs(s: ShadowRoot) {
  if (BOUND_INPUT.has(s)) return
  BOUND_INPUT.add(s)
  s.addEventListener("input", (e) => {
    const t = e.target as HTMLElement
    if (t.closest("#pe-rows")) refreshEditorSum(s)
  })
}

function applyPreset(s: ShadowRoot, view: BookingSchedule, key: string) {
  const st = EDITORS.get(s)
  const preset = view.plan?.presets.find((p) => p.key === key)
  if (!st || !preset || !preset.available) return
  s.querySelectorAll("[data-pe-preset]").forEach((b) => b.classList.toggle("on", (b as HTMLElement).dataset.pePreset === key))
  const existing = view.installments.filter((q) => q.actions && q.actions.edit && q.id != null && moneyOf(q.amountPaid) <= 0)
  // Reuse the ids of existing unpaid qists in order, so their history (reminders, source) survives a re-shape.
  const rows: EditorRow[] = preset.rows.map((r, i) => ({ id: existing[i]?.id ?? null, label: r.label, title: r.title || r.label, amount: moneyOf(r.amount), dueDate: r.dueDate }))
  st.active = key
  setEditorRows(s, rows)
}

async function savePlan(s: ShadowRoot, ctx: QistCtx, btn: HTMLButtonElement) {
  const st = EDITORS.get(s)
  if (!st) return
  const rows = readEditorRows(s)
  const payload: PlanRowInput[] = [
    ...st.keep.map((k) => ({ id: k.id, label: k.label, amount: k.amount, dueDate: k.dueDate })),
    ...rows.map((r, i) => ({ id: r.id, label: r.label || `Qist ${i + 1}`, amount: r.amount, dueDate: r.dueDate })),
  ]
  btn.disabled = true
  const o = btn.textContent; btn.textContent = "Save ho raha…"
  await withConfirm(
    s,
    (confirm) => BookingAPI.putPlan(ctx.bookingId, payload, confirm),
    (v) => { toast.success("Plan update ho gaya"); closeDrawer(s); ctx.apply(v); ctx.refresh() },
    () => { btn.disabled = false; if (o) btn.textContent = o; refreshEditorSum(s) },
  )
}

/* single-qist drawers ---------------------------------------------------- */

function editDrawerBody(view: BookingSchedule, q: BookingInstallment): string {
  const others = view.installments.filter((x) => x.id !== q.id && x.actions && x.actions.edit && x.id != null)
  const paid = moneyOf(q.amountPaid)
  return `
    <div class="bf-hint">${escHtml(qistHeading(q))} — abhi ${rsText(q.amount)}${paid > 0 ? `, mil chuka ${rsText(paid)}` : ""}. Raqam badlein to farq doosri qist mein jayega taake jod barabar rahe.</div>
    <div class="dfield"><label class="dlabel" for="qe-label">Naam</label><input id="qe-label" maxlength="40" value="${escHtml(q.title || q.label)}" data-code="${escHtml(q.label)}" data-title="${escHtml(q.title || q.label)}"/></div>
    <div class="dfield row2">
      <div><label class="dlabel" for="qe-amount">Raqam (Rs)</label><input id="qe-amount" type="number" inputmode="numeric" min="${Math.max(1, Math.ceil(paid))}" step="1" value="${Math.round(moneyOf(q.amount))}" data-orig="${Math.round(moneyOf(q.amount))}"/></div>
      <div><label class="dlabel" for="qe-date">Taareekh</label><input id="qe-date" type="date" value="${escHtml(q.dueDate || "")}"/></div>
    </div>
    <div class="dfield" id="qe-into-wrap" hidden><label class="dlabel" for="qe-into">Farq kis qist mein jaye</label><select id="qe-into">${others.map((o) => `<option value="${o.id}">${escHtml(qistHeading(o))} — ${rsText(o.amount)}</option>`).join("")}</select></div>
    <div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close type="button">Waapas</button><button class="btn btn-primary" data-qe-save="${q.id}" type="button">Save karein</button></div>`
}

/* the one click handler -------------------------------------------------- */

/**
 * Handles every click that belongs to the Payments card and its drawers.
 * Returns true when it handled the click (the caller then stops), false otherwise.
 */
export async function handleQistClick(t: HTMLElement, s: ShadowRoot, ctx: QistCtx): Promise<boolean> {
  const view = ctx.getSchedule()
  const id = (attr: string) => {
    const el = t.closest(`[${attr}]`) as HTMLElement | null
    if (!el) return null
    const n = Number(el.getAttribute(attr))
    return Number.isFinite(n) && n > 0 ? n : null
  }

  // ── plan editor ──
  if (t.closest("[data-q-plan]")) {
    if (!view?.plan?.editable) { toast.error("Is booking ka plan abhi nahi badal sakta"); return true }
    openPlanEditor(s, view)
    return true
  }
  const preset = (t.closest("[data-pe-preset]") as HTMLElement | null)?.dataset.pePreset
  if (preset) { if (view) applyPreset(s, view, preset); return true }
  if (t.closest("[data-pe-add]")) {
    const st = EDITORS.get(s)
    const rows = readEditorRows(s)
    const sum = rows.reduce((a, r) => a + r.amount, 0)
    const last = rows[rows.length - 1]
    const nm = `Qist ${rows.length + 1 + (st?.keep.length || 0) + (st?.fixed.length || 0)}`
    rows.push({ id: null, label: nm, title: nm, amount: Math.max(0, (st?.free || 0) - sum), dueDate: last?.dueDate || view?.today || "" })
    setEditorRows(s, rows)
    return true
  }
  if (t.closest("[data-pe-del]")) {
    const row = t.closest("[data-pe-row]")
    row?.remove()
    refreshEditorSum(s)
    return true
  }
  const save = t.closest("[data-pe-save]") as HTMLButtonElement | null
  if (save) { await savePlan(s, ctx, save); return true }

  // ── record a payment against a chosen qist ──
  const payId = id("data-q-pay")
  if (payId) {
    openRecordPaymentDrawer(s, { bookingId: ctx.bookingId, customerName: ctx.customerName || undefined, installmentId: payId, schedule: view, onSaved: () => ctx.refresh() })
    return true
  }
  const adopt = t.closest("[data-q-adopt]") as HTMLElement | null
  if (adopt) {
    const gap = Number(adopt.dataset.qAdopt) || 0
    openRecordPaymentDrawer(s, {
      bookingId: ctx.bookingId, customerName: ctx.customerName || undefined, schedule: view, amount: gap,
      note: "[Adopted] pehle se likhi hui advance", hint: "Ye raqam booking par pehle se likhi hui hai. Iski asli receipt yahan darj karein taake khata aur booking ek jaisay rahein.",
      onSaved: () => ctx.refresh(),
    })
    return true
  }

  // ── edit / split ──
  const editId = id("data-q-edit")
  if (editId) {
    const q = find(view, editId)
    if (!view || !q) return true
    openDrawer(s, "Qist badlein", editDrawerBody(view, q))
    const amt = s.getElementById("qe-amount") as HTMLInputElement | null
    const wrap = s.getElementById("qe-into-wrap") as HTMLElement | null
    amt?.addEventListener("input", () => { if (wrap) wrap.hidden = Number(amt.value) === Number(amt.dataset.orig) || !s.getElementById("qe-into")?.children.length })
    return true
  }
  const eSave = t.closest("[data-qe-save]") as HTMLButtonElement | null
  if (eSave) {
    const qid = Number(eSave.dataset.qeSave)
    const amount = Number(fieldVal(s, "qe-amount"))
    const orig = Number((s.getElementById("qe-amount") as HTMLInputElement | null)?.dataset.orig)
    const into = Number(fieldVal(s, "qe-into"))
    if (!(amount > 0)) { toast.error("Sahi raqam likhein"); return true }
    eSave.disabled = true; const o = eSave.textContent; eSave.textContent = "Save ho raha…"
    await withConfirm(
      s,
      (confirm) => BookingAPI.editQist(ctx.bookingId, qid, {
        label: labelFrom(s.getElementById("qe-label") as HTMLInputElement | null) || undefined,
        dueDate: fieldVal(s, "qe-date") || undefined,
        ...(amount !== orig ? { amount, balanceInto: into > 0 ? into : undefined } : {}),
        confirm,
      }),
      (v) => { toast.success("Qist update ho gayi"); closeDrawer(s); ctx.apply(v); ctx.refresh() },
      () => { eSave.disabled = false; if (o) eSave.textContent = o },
    )
    return true
  }
  const splitId = id("data-q-split")
  if (splitId) {
    const q = find(view, splitId)
    if (!q) return true
    const left = Math.round(moneyOf(q.remaining))
    openDrawer(s, "Qist baantein", `
      <div class="bf-hint">${escHtml(qistHeading(q))} mein ${rsText(left)} baaqi hai. Iska ek hissa nayi qist ban jayega, kisi aur taareekh par.</div>
      <div class="dfield row2">
        <div><label class="dlabel" for="qs-amount">Nayi qist ki raqam (Rs)</label><input id="qs-amount" type="number" inputmode="numeric" min="1" max="${Math.max(1, left - 1)}" step="1" value="${Math.floor(left / 2)}"/></div>
        <div><label class="dlabel" for="qs-date">Taareekh</label><input id="qs-date" type="date" value="${escHtml(q.dueDate || "")}"/></div>
      </div>
      <div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close type="button">Waapas</button><button class="btn btn-primary" data-qs-save="${q.id}" type="button">Baant dein</button></div>`)
    return true
  }
  const sSave = t.closest("[data-qs-save]") as HTMLButtonElement | null
  if (sSave) {
    const qid = Number(sSave.dataset.qsSave)
    const amount = Number(fieldVal(s, "qs-amount"))
    if (!(amount > 0)) { toast.error("Sahi raqam likhein"); return true }
    sSave.disabled = true; const o = sSave.textContent; sSave.textContent = "Ho raha…"
    await withConfirm(
      s,
      (confirm) => BookingAPI.splitQist(ctx.bookingId, qid, { amount, dueDate: fieldVal(s, "qs-date"), confirm }),
      (v) => { toast.success("Qist baant di gayi"); closeDrawer(s); ctx.apply(v); ctx.refresh() },
      () => { sSave.disabled = false; if (o) sSave.textContent = o },
    )
    return true
  }

  // ── waive ──
  const waiveId = id("data-q-waive")
  if (waiveId) {
    const q = find(view, waiveId)
    if (!q || !view?.money) return true
    const left = moneyOf(q.remaining)
    openDrawer(s, "Qist maaf karein", `
      <div class="bf-hint"><b>${escHtml(qistHeading(q))}</b> ki baaqi ${rsText(left)} maaf ho jayegi. Booking ka Kul ${rsText(view.money.total)} se ghat kar <b>${rsText(view.money.total - left)}</b> ho jayega. Ye wapas nahi hota.</div>
      <div class="dfield"><label class="dlabel" for="qw-reason">Maaf karne ki wajah <span class="req">*</span></label><textarea id="qw-reason" placeholder="e.g. family friend — discount agreed"></textarea></div>
      <div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close type="button">Waapas</button><button class="btn btn-primary" data-qw-save="${q.id}" type="button" style="background:var(--bad);border-color:transparent">Haan, maaf karein</button></div>`)
    return true
  }
  const wSave = t.closest("[data-qw-save]") as HTMLButtonElement | null
  if (wSave) {
    const reason = fieldVal(s, "qw-reason")
    if (reason.length < 3) { toast.error("Wajah likhein (kam az kam 3 harf)"); return true }
    wSave.disabled = true; const o = wSave.textContent; wSave.textContent = "Ho raha…"
    try {
      const v = await BookingAPI.waiveQist(ctx.bookingId, Number(wSave.dataset.qwSave), reason)
      toast.success("Qist maaf kar di gayi"); closeDrawer(s); ctx.apply(v); ctx.refresh()
    } catch (e) {
      toast.error(errMsg(e, "Maaf nahi hui")); wSave.disabled = false; if (o) wSave.textContent = o
    }
    return true
  }

  // ── remove ──
  const removeId = id("data-q-remove")
  if (removeId) {
    const q = find(view, removeId)
    if (!q) return true
    openConfirm(s, {
      title: `${qistHeading(q)} hatayein?`,
      message: `Iski ${rsText(q.amount)} agli baaqi qist mein shamil ho jayegi. Kul raqam wahi rahegi.`,
      confirmLabel: "Haan, hatayein",
      onConfirm: async () => {
        try {
          const v = await BookingAPI.removeQist(ctx.bookingId, removeId)
          toast.success("Qist hata di gayi"); ctx.apply(v); ctx.refresh()
        } catch (e) { toast.error(errMsg(e, "Hata nahi saki")) }
      },
    })
    return true
  }

  // ── remind ──
  const remindId = id("data-q-remind")
  if (remindId) {
    const q = find(view, remindId)
    if (!q) return true
    openDrawer(s, "Yaad dilayein", `
      <div class="bf-hint"><b>${escHtml(qistHeading(q))}</b> — ${escHtml(qistStateVendor(q).detail)}${q.lastRemindedAt ? `<br/>Aakhri yaad-dehani: ${dayText(String(q.lastRemindedAt).slice(0, 10))}.` : ""}</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-primary" data-qr-send="whatsapp" data-qr-id="${q.id}" type="button">${svg(IC.wa)} WhatsApp par bhejein</button>
        <button class="btn btn-ghost" data-qr-send="in_app" data-qr-id="${q.id}" type="button">App mein notification bhejein</button>
        <div class="bf-hint" style="margin:0">WhatsApp: message tayyar hoga, aap khud bhejte hain. App: customer ko Wedding Wala mein notification jati hai (agar unka account ho).</div>
      </div>`)
    return true
  }
  const send = t.closest("[data-qr-send]") as HTMLButtonElement | null
  if (send) {
    const channel = send.dataset.qrSend === "in_app" ? "in_app" : "whatsapp"
    send.disabled = true
    try {
      const r = await BookingAPI.remindQist(ctx.bookingId, Number(send.dataset.qrId), channel)
      if (channel === "whatsapp") {
        if (!r.whatsapp) { toast.error("Customer ka WhatsApp number nahi hai") }
        else { window.open(r.whatsapp.url, "_blank", "noopener"); toast.success("WhatsApp khul gaya") }
      } else toast.success("Customer ko notification bhej di")
      closeDrawer(s); ctx.refresh()
    } catch (e) {
      toast.error(errMsg(e, "Yaad-dehani nahi gayi")); send.disabled = false
    }
    return true
  }
  return false
}

export { IC as QIST_ICONS }
