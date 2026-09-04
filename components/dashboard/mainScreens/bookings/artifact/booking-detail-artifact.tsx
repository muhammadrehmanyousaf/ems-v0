"use client"

/**
 * Booking detail — pixel-faithful to the design sample
 * (docs/design-samples/booking-detail.html): back-link + header with status,
 * 4-stat strip, two-column layout (Payment timeline + Package + Activity on the
 * left; Customer + Event details + Documents + Notes on the right).
 *
 * Wired to the REAL backend through the shared artifact shell:
 *   BookingAPI.getWithAvailability  → booking + bookingDetails + business
 *   PaymentAPI.getBookingPaymentStatus → total / paid / remaining
 *   ReceiptsAPI.list({ bookingId }) → the payment history timeline
 *   BookingAPI.getHistory           → the activity timeline
 *   FunctionSheetAPI.list({ bookingId }) → linked documents
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { BookingAPI, type InstallmentsResponse, type SettlementPreview, type DepositPosition } from "@/lib/api/bookings"
import { BookingsAPI } from "@/lib/api/dashboard"
import { openRecordPaymentDrawer } from "@/components/dashboard/mainScreens/artifact/record-payment"
import { PaymentAPI } from "@/lib/api/payments"
import { ReceiptsAPI, type PaymentReceipt } from "@/lib/api/paymentReceipts"
import { FunctionSheetAPI, type FunctionSheet } from "@/lib/api/functionSheets"
import type { BookingData } from "@/lib/dashboard-types"
import { bookingStatusLabel } from "@/lib/booking-status-label"
import { spaceNameOf } from "@/lib/utils/booking-space"
import { bookedOn, receivedOn, outstandingOn } from "@/lib/utils/booking-money"
import { waDigits } from "@/components/dashboard/mainScreens/leads/artifact/leads-artifact"
import { useArtifactShell, pkNum, escHtml, initialsOf, openDrawer, closeDrawer } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

/* ── formatting ──────────────────────────────────────────────── */
const rs = (n: number) => `<span class="rs">Rs</span> ${pkNum(n)}`
function fmtDate(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso); if (isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
}
function fmtDateShort(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso); if (isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
}
function fmtTime(t?: string | null) {
  if (!t) return "—"
  const [h, m] = String(t).split(":").map(Number)
  if (Number.isNaN(h)) return String(t)
  const ampm = h >= 12 ? "PM" : "AM"; const hr = h % 12 || 12
  return `${hr}:${String(m || 0).padStart(2, "0")} ${ampm}`
}
function eventWhen(iso?: string | null) {
  if (!iso) return { big: "—", sub: "" }
  const d = new Date(iso); if (isNaN(d.getTime())) return { big: "—", sub: "" }
  const days = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
  const big = days === 0 ? "Aaj" : days === 1 ? "Kal" : days < 0 ? "Ho chuka" : days < 7 ? `${days} din baaki` : fmtDateShort(iso)
  return { big, sub: fmtDate(iso) }
}
const prettyMethod = (m?: string | null) => (m ? String(m).replace(/_/g, " ") : "—")

function toneOf(label: string): "ok" | "warn" | "bad" | "mut" {
  const s = label.toLowerCase()
  if (s.includes("confirm") || s.includes("complete") || s.includes("paid") || s.includes("ho gaya")) return "ok"
  if (s.includes("cancel") || s.includes("refund") || s.includes("no")) return "bad"
  if (s.includes("pending") || s.includes("await") || s.includes("partial") || s.includes("baqaya")) return "warn"
  return "mut"
}

/* ── icons ───────────────────────────────────────────────────── */
const I = {
  back: '<path d="M15 6l-6 6 6 6"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  money: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users: '<path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  chevr: '<path d="M9 6l6 6-6 6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  minus: '<path d="M5 12h14"/>',
  hall: '<path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/>',
  plate: '<path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M6 2v20M14 2c-1.5 1-2 3-2 5s.5 4 2 5v10"/>',
  spark: '<path d="M12 2v6M12 22v-6M5 12H2M22 12h-3M12 8a4 4 0 0 0 0 8 4 4 0 0 0 0-8z"/>',
  cal: '<path d="M4 4h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 2v4M16 2v4M4 10h16"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  dl: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
}
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`

const EXTRA_CSS = String.raw`
.content{ max-width:1240px; }
.back{ display:inline-flex; align-items:center; gap:5px; font-size:12.5px; color:var(--ink-3); font-weight:500; margin-bottom:14px; background:none; border:0; }
.back:hover{ color:var(--ink); } .back svg{ width:15px; height:15px; }
.dhead{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:18px; flex-wrap:wrap; }
.dh-left{ display:flex; align-items:center; gap:14px; }
.dh-mono{ width:52px; height:52px; border-radius:13px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; font-weight:600; font-size:14px; color:var(--ink-2); flex:none; }
.dh-title{ display:flex; align-items:center; gap:10px; font-size:23px; font-weight:600; letter-spacing:-.025em; flex-wrap:wrap; }
.dh-sub{ font-size:12.5px; color:var(--ink-3); margin-top:4px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; } .dh-sub .sep{ color:var(--border-2); }
.dhead-actions{ display:flex; gap:8px; align-items:center; } .btn.icon{ width:36px; padding:0; }
.stats{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:10px; }
.stat{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:10px 13px; box-shadow:var(--shadow-xs); }
.stat .s-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .stat .s-cap svg{ width:13px; height:13px; }
.stat .s-val{ font-size:19px; font-weight:660; letter-spacing:-.02em; margin-top:9px; line-height:1.1; } .stat .s-val .rs{ font-size:12px; color:var(--ink-3); font-weight:600; }
.stat .s-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.stat.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); }
.stat.hl .s-cap,.stat.hl .s-val{ color:var(--accent-ink); } .stat.hl .s-sub{ color:var(--accent-ink); opacity:.85; } .stat.warnv .s-val{ color:var(--warn); }
.two{ display:grid; grid-template-columns:1.7fr 1fr; gap:14px; align-items:start; }
.col-stack{ display:flex; flex-direction:column; gap:14px; min-width:0; }
.card-h{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px 12px; }
.card-h h2{ font-size:13.5px; font-weight:600; letter-spacing:-.01em; } .card-h .sub{ font-size:11.5px; color:var(--ink-3); margin-top:2px; font-weight:400; }
.link{ font-size:12.5px; font-weight:500; color:var(--ink-2); display:inline-flex; align-items:center; gap:3px; padding:5px 7px; border-radius:7px; margin:-5px -7px; border:0; background:none; }
.link:hover{ background:var(--surface-3); color:var(--ink); } .link svg{ width:13px; height:13px; }
.pay-sum{ display:flex; gap:24px; padding:2px 16px 12px; flex-wrap:wrap; }
.ps-cap{ font-size:11.5px; color:var(--ink-3); } .ps-val{ font-size:19px; font-weight:660; letter-spacing:-.02em; margin-top:3px; } .ps-val .rs{ font-size:12px; color:var(--ink-3); font-weight:600; }
.ps-val.ok{ color:var(--ok); } .ps-val.due{ color:var(--warn); }
.pay-bar-wrap{ padding:0 16px 4px; } .pay-bar-lbl{ display:flex; justify-content:space-between; font-size:11.5px; margin-bottom:7px; } .pay-bar-lbl b{ color:var(--accent-ink); font-weight:600; } .pay-bar-lbl span{ color:var(--ink-3); }
.paybar{ height:7px; border-radius:4px; background:var(--surface-3); overflow:hidden; } .paybar span{ display:block; height:100%; border-radius:4px; background:linear-gradient(90deg,var(--accent),var(--accent-ink)); }
.pay-tl{ padding:14px 16px 6px; margin-top:8px; border-top:1px solid var(--border); } .pay-tl .tl-h{ font-size:11px; font-weight:600; letter-spacing:.03em; text-transform:uppercase; color:var(--ink-3); margin-bottom:12px; }
.tl-item{ display:flex; gap:13px; position:relative; padding-bottom:16px; } .tl-item:last-child{ padding-bottom:2px; }
.tl-item::before{ content:""; position:absolute; left:11px; top:25px; bottom:-1px; width:2px; background:var(--border); } .tl-item:last-child::before{ display:none; } .tl-item.done::before{ background:var(--ok); opacity:.35; }
.tl-dot{ width:24px; height:24px; border-radius:50%; flex:none; display:grid; place-items:center; background:var(--surface-3); border:1px solid var(--border-2); color:var(--ink-4); z-index:1; } .tl-dot svg{ width:13px; height:13px; }
.tl-item.done .tl-dot{ background:var(--ok-wash); border-color:transparent; color:var(--ok); } .tl-item.due .tl-dot{ background:var(--warn-wash); border-color:transparent; color:var(--warn); } .tl-item.acc .tl-dot{ background:var(--accent-wash); border-color:var(--accent-line); color:var(--accent-ink); }
.tl-body{ flex:1; min-width:0; padding-top:2px; } .tl-title{ font-weight:600; font-size:13px; display:flex; justify-content:space-between; align-items:baseline; gap:10px; }
.tl-amt{ font-weight:660; font-variant-numeric:tabular-nums; white-space:nowrap; } .tl-amt .rs{ font-size:10px; color:var(--ink-3); font-weight:600; } .tl-amt.due{ color:var(--warn); }
.tl-meta{ font-size:11.5px; color:var(--ink-3); margin-top:2px; } .tl-cta{ margin:6px 0 0 37px; }
.pkg{ padding:4px 8px 4px; } .pkg-row{ display:flex; align-items:center; gap:12px; padding:11px 8px; }
.pkg-ico{ width:34px; height:34px; border-radius:9px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--ink-2); flex:none; } .pkg-ico svg{ width:16px; height:16px; }
.pkg-main{ flex:1; min-width:0; } .pkg-nm{ font-weight:600; font-size:13px; } .pkg-sub{ font-size:11.5px; color:var(--ink-3); margin-top:1px; }
.pkg-amt{ font-weight:660; font-size:13px; font-variant-numeric:tabular-nums; white-space:nowrap; } .pkg-amt .rs{ font-size:10px; color:var(--ink-3); font-weight:600; } .pkg-amt.inc{ font-size:11.5px; color:var(--ok); font-weight:600; }
.pkg-total{ display:flex; align-items:center; justify-content:space-between; padding:13px 16px; border-top:1px solid var(--border); } .pkg-total .t-cap{ font-weight:600; font-size:12.5px; } .pkg-total .t-val{ font-weight:700; font-size:16px; letter-spacing:-.02em; font-variant-numeric:tabular-nums; } .pkg-total .t-val .rs{ font-size:11px; color:var(--ink-3); font-weight:600; }
.cust{ padding:2px 16px 16px; } .cust-top{ display:flex; align-items:center; gap:12px; }
.cust-ava{ width:44px; height:44px; border-radius:12px; background:linear-gradient(150deg,var(--accent),var(--accent-ink)); color:var(--on-accent); display:grid; place-items:center; font-weight:600; font-size:15px; flex:none; }
.cust-nm{ font-weight:600; font-size:14px; } .cust-role{ font-size:11.5px; color:var(--ink-3); margin-top:1px; }
.cust-actions{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:14px; }
.cact{ display:flex; flex-direction:column; align-items:center; gap:5px; padding:10px 4px; border-radius:9px; border:1px solid var(--border); background:var(--surface); color:var(--ink-2); font-size:11px; font-weight:600; transition:background .12s,border-color .12s,color .12s; } .cact:hover{ background:var(--surface-3); color:var(--ink); border-color:var(--border-2); } .cact svg{ width:17px; height:17px; } .cact.wa:hover{ color:var(--ok); } .cact:disabled{ opacity:.45; cursor:default; }
.dl{ padding:2px 16px 12px; } .dl-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:9px 0; border-bottom:1px solid var(--border); font-size:12.5px; } .dl-row:last-child{ border-bottom:0; }
.dl-row .k{ color:var(--ink-3); display:inline-flex; align-items:center; gap:7px; } .dl-row .k svg{ width:14px; height:14px; color:var(--ink-4); } .dl-row .v{ font-weight:600; color:var(--ink); text-align:right; word-break:break-word; }
.docs{ padding:6px 8px 10px; } .doc-row{ display:flex; align-items:center; gap:11px; padding:9px 8px; border-radius:8px; transition:background .1s; } .doc-row:hover{ background:var(--surface-3); }
.doc-ico{ width:30px; height:34px; border-radius:6px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--ink-3); flex:none; } .doc-ico svg{ width:15px; height:15px; }
.doc-main{ flex:1; min-width:0; } .doc-nm{ font-weight:600; font-size:12.5px; } .doc-sub{ font-size:11px; color:var(--ink-3); margin-top:1px; }
.doc-dl{ width:30px; height:30px; border-radius:7px; border:0; background:transparent; color:var(--ink-3); display:grid; place-items:center; } .doc-dl:hover{ background:var(--surface); color:var(--ink); } .doc-dl svg{ width:16px; height:16px; }
.note{ padding:2px 16px 16px; } .note textarea{ width:100%; min-height:76px; resize:vertical; border:1px solid var(--border); border-radius:9px; background:var(--surface-2); color:var(--ink); padding:10px 11px; font:inherit; font-size:12.5px; outline:none; } .note textarea:focus{ border-color:var(--border-2); background:var(--surface); } .note textarea::placeholder{ color:var(--ink-3); }
.note-bar{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:10px; } .note-status{ font-size:11.5px; color:var(--ok); font-weight:600; } .note-hint{ font-size:11px; color:var(--ink-3); margin-top:7px; }
.inst-row{ display:flex; align-items:center; gap:12px; padding:11px 8px; border-bottom:1px solid var(--border); } .inst-row:last-child{ border-bottom:0; }
.inst-row .ir-l{ flex:1; } .inst-row .ir-nm{ font-weight:600; font-size:13px; } .inst-row .ir-d{ font-size:11.5px; color:var(--ink-3); margin-top:1px; }
.inst-row .ir-amt{ font-weight:660; font-size:13px; font-variant-numeric:tabular-nums; text-align:right; } .inst-row .ir-amt .sub{ display:block; font-size:10.5px; color:var(--ok); font-weight:500; }
.settle-why{ font-size:11.5px; color:var(--ink-3); line-height:1.5; background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:8px 10px; }
.settle-actions{ display:flex; gap:8px; flex-wrap:wrap; padding:12px 16px 16px; border-top:1px solid var(--border); }
.dep-cacts{ display:inline-flex; gap:6px; margin-left:8px; }
.sl-btn2{ height:28px; padding:0 10px; border-radius:7px; border:1px solid var(--bad); background:var(--bad-wash); color:var(--bad); font-size:11.5px; font-weight:600; } .sl-btn2:hover{ filter:brightness(.97); } .sl-btn2.ghost{ border-color:var(--border-2); background:var(--surface); color:var(--ink-2); } .sl-btn2.ghost:hover{ background:var(--surface-3); color:var(--ink); }
.dep-done{ display:inline-flex; align-items:center; gap:7px; font-size:12.5px; font-weight:600; color:var(--ok); } .dep-done svg{ width:15px; height:15px; }
.dep-wait{ font-size:11px; color:var(--ink-3); font-style:italic; }
.settle-note{ font-size:12px; color:var(--ink-2); background:var(--surface-2); border:1px solid var(--border); border-radius:9px; padding:10px 12px; line-height:1.5; margin-bottom:14px; }
.bf-hint{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.settle-preview{ margin-top:4px; border:1px solid var(--accent-line); background:var(--accent-wash); border-radius:10px; padding:10px 12px; }
.sp-line{ display:flex; align-items:center; justify-content:space-between; gap:12px; font-size:12.5px; color:var(--ink-2); padding:4px 0; } .sp-line b{ color:var(--ink); font-weight:660; } .sp-line.big{ border-top:1px solid var(--accent-line); margin-top:4px; padding-top:8px; font-size:14px; } .sp-line.big b{ color:var(--accent-ink); }
.tl-cta{ display:flex; gap:8px; flex-wrap:wrap; }
.emptylite{ padding:14px 16px 18px; color:var(--ink-3); font-size:12px; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:1080px){ .stats{ grid-template-columns:repeat(2,1fr); } .two{ grid-template-columns:1fr; } }
`

const INST_ST: Record<string, [string, string]> = { paid: ["ok", "Mil gaya"], pending: ["warn", "Baqaya"], partial: ["info", "Kuch mila"], overdue: ["bad", "Overdue"], waived: ["mut", "—"] }
function installmentsCard(inst: InstallmentsResponse | null, dueOutstanding: number): string {
  const rows = inst?.installments || []
  if (!rows.length) return ""
  const body = rows.map((q) => {
    const lbl = q.label === "down_payment" ? "Advance" : q.label === "remaining" ? "Baqaya" : escHtml(q.label)
    const [tone, txt] = INST_ST[q.status] || ["mut", q.status]
    const partial = q.amountPaid > 0 && q.amountPaid < q.amount
    return `<div class="inst-row"><div class="ir-l"><div class="ir-nm">${lbl}</div><div class="ir-d">${q.dueAt ? fmtDateShort(q.dueAt) : ""}</div></div><div class="ir-amt tnum">${rs(q.amount)}${partial ? `<span class="sub">${rs(q.amountPaid)} mila</span>` : ""}</div><span class="st ${tone}"><i></i> ${txt}</span></div>`
  }).join("")
  // Money-QA C17: the installment ledger's own outstanding can lag the page's
  // reconciled Baqaya (a Record-drawer receipt updates the money-truth column but
  // does not always pay down these installment rows). Show ONE number — the same
  // reconciled outstanding the page header uses — so "Baaqi lena" can never
  // contradict the "Baqaya" stat above it.
  const instOut = Number(inst?.totals?.outstanding || 0)
  const stale = Math.abs(instOut - dueOutstanding) > 1
  return `<div class="card">
      <div class="card-h"><div><h2>Qist schedule</h2><div class="sub">Advance → baqaya</div></div></div>
      <div style="padding:2px 16px 8px">${body}</div>
      <div class="pkg-total"><span class="t-cap">Baaqi lena</span><span class="t-val tnum">${rs(dueOutstanding)}${stale ? `<span class="sub" style="display:block;font-weight:400;color:var(--ink-3)">receipts se</span>` : ""}</span></div>
    </div>`
}
/**
 * WW-SETTLEMENT — the final-bill card (read-only preview).
 *
 * Only rendered for a booking that is actually settled on headcount — a flat
 * booking returns `settleable:false` and gets no card, to avoid noise. Before
 * the night the numbers are the guarantee-based estimate (the backend falls
 * back to the guarantee when no final count is recorded); after `settle` they
 * are the real bill. Both parties read the same arithmetic — that is the point.
 */
function settlementCard(s: SettlementPreview | null): string {
  if (!s || !s.settleable) return ""
  const b = s.bill
  const bal = s.balance
  const isSettled = !!s.settled
  const heading = isSettled ? "Hisaab-kitaab — final bill" : "Hisaab-kitaab — andaaza"
  const sub = isSettled
    ? `Settle ho chuka${s.settledAt ? ` · ${fmtDateShort(s.settledAt)}` : ""}`
    : s.locked ? "Guarantee lock ho chuki — event ke baad final count par settle karein" : "Guarantee par andaaza — event ke baad final count daalein"
  const actual = b?.actual ?? s.statedTotal ?? s.guaranteed ?? 0
  const rows = [
    `<div class="dl-row"><span class="k">${svg(I.users)} Guarantee</span><span class="v tnum">${s.guaranteed ?? 0} mehmaan</span></div>`,
    `<div class="dl-row"><span class="k">${svg(I.users)} ${isSettled ? "Aaye" : "Counted"}</span><span class="v tnum">${actual} mehmaan</span></div>`,
    s.rate ? `<div class="dl-row"><span class="k">${svg(I.plate)} Per-head rate</span><span class="v tnum">${rs(s.rate)}${s.rateLabel ? ` · ${escHtml(s.rateLabel)}` : ""}</span></div>` : "",
    s.staffMeals ? `<div class="dl-row"><span class="k">${svg(I.plate)} Staff khaana</span><span class="v tnum">${s.staffMeals.count} × ${rs(s.staffMeals.rate)}</span></div>` : "",
    s.crewMeals ? `<div class="dl-row"><span class="k">${svg(I.plate)} Crew khaana</span><span class="v tnum">${s.crewMeals.count} × ${rs(s.crewMeals.rate)}</span></div>` : "",
    `<div class="dl-row"><span class="k">${svg(I.plate)} Khaana total</span><span class="v tnum">${rs(Number(s.foodTotal || 0))}</span></div>`,
  ].filter(Boolean).join("")
  // the vendor-readable "why" on the excess-only / walk-in lines, if any
  const why = (b?.lines || []).map((l) => l.why ? `<div class="settle-why">${escHtml(l.why)}</div>` : "").filter(Boolean).join("")
  const settledTotal = Number(bal?.settledTotal ?? 0)
  const paidBal = Number(bal?.alreadyPaid ?? 0)
  const outBal = Number(bal?.outstanding ?? 0)
  const balBlock = bal && bal.source !== "unavailable"
    ? `<div class="pkg-total" style="border-bottom:1px solid var(--border)"><span class="t-cap">Settled total</span><span class="t-val tnum">${rs(settledTotal)}</span></div>
       <div class="dl" style="padding-top:8px"><div class="dl-row"><span class="k">Mil chuka</span><span class="v tnum" style="color:var(--ok)">${rs(paidBal)}</span></div>
       <div class="dl-row" style="border-bottom:0"><span class="k">Baaqi lena</span><span class="v tnum" style="color:${outBal > 0 ? "var(--warn)" : "var(--ok)"}">${rs(outBal)}</span></div></div>`
    : `<div class="pkg-total"><span class="t-cap">Settled total</span><span class="t-val tnum">${rs(settledTotal || Number(s.foodTotal || 0))}</span></div>`
  const canCash = isSettled && outBal > 0 && bal && bal.source !== "unavailable"
  const canLock = s.settleable && !s.locked && !isSettled
  const actions = `<div class="settle-actions">
    <button class="btn btn-primary" data-settle="${s.bookingId}" data-settle-total="${actual}" data-settle-guar="${s.guaranteed ?? 0}">${svg(I.users, 2.2)} ${isSettled ? "Count theek karein" : "Final count daal kar settle karein"}</button>
    ${canLock ? `<button class="btn btn-ghost" data-hc-lock="${s.bookingId}" data-hc-guar="${s.guaranteed ?? 0}">${svg(I.check, 2.2)} Guarantee lock karein</button>` : ""}
    ${canCash ? `<button class="btn btn-ghost" data-settle-cash="${s.bookingId}" data-cash-out="${Math.round(outBal)}">${svg(I.money)} Cash mila — ${rs(outBal)}</button>` : ""}
  </div>`
  return `<div class="card">
      <div class="card-h"><div><h2>${heading}</h2><div class="sub">${sub}</div></div>${s.amended ? `<span class="st warn"><i></i> Badla gaya</span>` : ""}</div>
      <div class="dl">${rows}</div>
      ${why ? `<div style="padding:0 16px 10px">${why}</div>` : ""}
      ${balBlock}
      ${actions}
    </div>`
}

/**
 * The settle drawer — the vendor records the count from the night to strike the
 * final bill. Crew (the vendor's own team) is ADDITIVE and outside the guest
 * total, matching the backend (crewMealsFor). A two-step flow: "Andaaza dekhein"
 * previews the bill (GET /settlement?total=…) without committing, then "Settle"
 * commits it (POST /settle). Re-settling is allowed and keeps an amendment trail.
 */
function settleDrawerBody(id: number, prefillTotal: number, guaranteed: number): string {
  const f = (lbl: string, fid: string, val: string, hint = "", ph = "") =>
    `<div class="dfield"><label class="dlabel">${lbl}</label><input id="${fid}" type="number" min="0" inputmode="numeric" value="${val}" placeholder="${ph}"/>${hint ? `<div class="bf-hint">${hint}</div>` : ""}</div>`
  return `
  <div class="settle-note">Us raat kitne mehmaan aaye? Final count par bill banega. Guarantee <b>${guaranteed}</b> thi — bill <b>max(guarantee, aaye huye)</b> par banta hai.</div>
  <div class="dfield"><label class="dlabel">Kul mehmaan (aaye) <span class="req">*</span></label><input id="st-total" type="number" min="0" inputmode="numeric" value="${prefillTotal || guaranteed || ""}" placeholder="e.g. 420"/></div>
  <div class="dfield row2">${f("Bachay (5 saal se kam)", "st-kids5", "", "Aksar free / aadha")}${f("Bachay (5–12)", "st-kids12", "")}</div>
  <div class="dfield row2">${f("Staff (mehmaan mein shamil)", "st-staff", "", "Total ke andar")}${f("Crew (aap ki team)", "st-crew", "", "Total ke UPAR — alag")}</div>
  <div class="dfield"><label class="dlabel">Note (optional)</label><textarea id="st-note" placeholder="e.g. 20 log baad mein aaye, family ne confirm kiya"></textarea></div>
  <div id="settle-preview" class="settle-preview" hidden></div>
  <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-settle-preview="${id}">Andaaza dekhein</button><button class="btn btn-primary" type="button" data-settle-save="${id}">Settle karein</button></div>`
}
function settlePreviewHtml(s: SettlementPreview): string {
  if (!s.settleable) return `<div class="settle-why">${escHtml(s.reason || "Ye booking headcount par settle nahi hoti.")}</div>`
  const bal = s.balance
  const out = Number(bal?.outstanding ?? 0)
  return `<div class="sp-line"><span>Aaye</span><b>${s.bill?.actual ?? s.statedTotal ?? 0} mehmaan</b></div>
    <div class="sp-line"><span>Khaana total</span><b class="tnum">${rs(Number(s.foodTotal || 0))}</b></div>
    <div class="sp-line big"><span>Settled total</span><b class="tnum">${rs(Number(bal?.settledTotal ?? 0))}</b></div>
    <div class="sp-line"><span>Baaqi lena</span><b class="tnum" style="color:${out > 0 ? "var(--warn)" : "var(--ok)"}">${rs(out)}</b></div>`
}

function lockDrawerBody(id: number, guaranteed: number): string {
  return `
  <div class="settle-note">Guarantee lock karne se ye number freeze ho jata hai — event ke baad bill <b>max(guarantee, aaye)</b> par banega. Guarantee venue ki hifazat hai: khana isi count par bnta hai.</div>
  <div class="dfield"><label class="dlabel">Guaranteed mehmaan <span class="req">*</span></label><input id="hc-guar" type="number" min="1" inputmode="numeric" value="${guaranteed || ""}" placeholder="e.g. 400"/></div>
  <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Waapas</button><button class="btn btn-primary" type="button" data-hc-lock-save="${id}">Lock karein</button></div>`
}

/* ── WW-DEPOSIT — security deposit + damage claims ─────────────── */
const DEP_ST: Record<string, [string, string]> = {
  pending: ["info", "Rakha hai"], held: ["info", "Rakha hai"], returned: ["ok", "Wapas ho gaya"],
  partially_returned: ["warn", "Kuch wapas"], forfeited: ["bad", "Zabt ho gaya"],
}
const CLAIM_ST: Record<string, [string, string]> = {
  open: ["warn", "Khula"], accepted: ["info", "Maan liya"], disputed: ["bad", "Ikhtelaf"], settled: ["ok", "Settle"], withdrawn: ["mut", "Wapas liya"],
}
function depositCard(pos: DepositPosition | null): string {
  if (!pos || pos.deposit <= 0) return ""
  const st = pos.status || "held"
  const [tone, label] = DEP_ST[st] || ["mut", st]
  const resolved = /returned|forfeited/.test(st)
  const hasLiveClaims = pos.openClaims > 0 || pos.disputedClaims > 0
  const rows = [
    `<div class="dl-row"><span class="k">${svg(I.money)} Deposit rakha</span><span class="v tnum">${rs(pos.deposit)}</span></div>`,
    pos.deducted > 0 ? `<div class="dl-row"><span class="k">${svg(I.minus)} Nuqsan kaat</span><span class="v tnum" style="color:var(--bad)">− ${rs(pos.deducted)}</span></div>` : "",
    `<div class="dl-row" style="border-bottom:0"><span class="k">Wapas karne layak</span><span class="v tnum" style="color:var(--ok)">${rs(pos.returnable)}</span></div>`,
    pos.shortfall > 0 ? `<div class="dl-row" style="border-bottom:0"><span class="k">Deposit se zyada (baaqi)</span><span class="v tnum" style="color:var(--bad)">${rs(pos.shortfall)}</span></div>` : "",
  ].filter(Boolean).join("")
  const claimRows = pos.lines.length ? `<div style="padding:2px 16px 8px">${pos.lines.map((c) => {
    const [ct, cl] = CLAIM_ST[c.status] || ["mut", c.status]
    // Only an ACCEPTED claim can be deducted (the backend refuses settling an
    // open one — the customer must agree or dispute first). Open → withdraw +
    // "waiting". Disputed → review only. Terminal → nothing.
    const acts = c.status === "accepted"
      ? `<span class="dep-cacts"><button class="sl-btn2" data-claim-settle="${c.id}" data-claim-amt="${Math.round(c.amountPkr)}">Kaatein</button><button class="sl-btn2 ghost" data-claim-withdraw="${c.id}">Chhorें</button></span>`
      : c.status === "open"
        ? `<span class="dep-cacts"><span class="dep-wait">Customer ke jawab ka intezar</span><button class="sl-btn2 ghost" data-claim-withdraw="${c.id}">Chhorें</button></span>`
        : ""
    return `<div class="inst-row"><div class="ir-l"><div class="ir-nm">${escHtml(c.description.slice(0, 60))}</div><div class="ir-d">${rs(c.amountPkr)}${c.deductedFromDepositPkr ? ` · kaata ${pkNum(c.deductedFromDepositPkr)}` : ""}${c.photos ? ` · ${c.photos} tasveer` : ""}</div></div><span class="st ${ct}"><i></i> ${cl}</span>${acts}</div>`
  }).join("")}</div>` : ""
  const actions = resolved
    ? `<div class="settle-actions"><span class="dep-done">${svg(I.check, 2.4)} Deposit ${st === "forfeited" ? "zabt ho gaya" : "handle ho chuka"}</span></div>`
    : `<div class="settle-actions">
        <button class="btn btn-primary" data-dep-return="${pos.bookingId}" ${hasLiveClaims ? "disabled title='Pehle claims settle/withdraw karein'" : ""}>${svg(I.money)} Deposit wapas karein</button>
        <button class="btn btn-ghost" data-dep-claim="${pos.bookingId}" data-dep-returnable="${Math.round(pos.returnable)}">${svg(I.minus)} Nuqsan claim karein</button>
      </div>${hasLiveClaims ? `<div class="bf-hint" style="padding:0 16px 12px">Deposit wapas karne se pehle khuli claims settle ya chhorें.</div>` : ""}`
  return `<div class="card">
      <div class="card-h"><div><h2>Security deposit</h2><div class="sub">Rakha → nuqsan kaat → wapas</div></div><span class="st ${tone}"><i></i> ${label}</span></div>
      <div class="dl">${rows}</div>
      ${claimRows}
      ${actions}
    </div>`
}
function damageClaimDrawerBody(id: number, returnable: number): string {
  return `
  <div class="settle-note">Kya nuqsan hua? Customer ye padhega, is liye saaf likhein. Deposit se max <b>${rs(returnable)}</b> tak kaata ja sakta hai; is se zyada alag invoice karein.</div>
  <div class="dfield"><label class="dlabel">Nuqsan ki tafseel <span class="req">*</span></label><textarea id="dc-desc" placeholder="e.g. 2 kursiyan tooti, stage ka cloth jala"></textarea></div>
  <div class="dfield"><label class="dlabel">Raqam (Rs) <span class="req">*</span></label><input id="dc-amt" type="number" min="1" inputmode="numeric" placeholder="e.g. 8000"/></div>
  <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Waapas</button><button class="btn btn-primary" type="button" data-dc-save="${id}">Claim raise karein</button></div>`
}

type CashRefundOwed = { id: number; amount: number; reason: string | null; owedSince: string }
function refundOwedCard(refunds: CashRefundOwed[]): string {
  if (!refunds.length) return ""
  const total = refunds.reduce((a, r) => a + Number(r.amount || 0), 0)
  const rows = refunds.map((r) => `<div class="inst-row"><div class="ir-l"><div class="ir-nm">${rs(Number(r.amount))}</div><div class="ir-d">${r.reason ? escHtml(r.reason.replace(/_/g, " ")) : "refund"}${r.owedSince ? ` · ${fmtDateShort(r.owedSince)}` : ""}</div></div><button class="btn btn-primary" data-refund-settle="${r.id}" style="height:30px;padding:0 12px;font-size:12px">Refund de diya</button></div>`).join("")
  return `<div class="card">
      <div class="card-h"><div><h2>Refund dena hai</h2><div class="sub">Cancel/kami par customer ko wapas karna hai</div></div><span class="st bad"><i></i> ${rs(total)}</span></div>
      <div style="padding:2px 16px 12px">${rows}</div>
    </div>`
}

function buildDetail(booking: BookingData, pay: { totalAmount?: number; paidAmount?: number; remainingAmount?: number; cashRefundOwedTotal?: number; cashRefundsOwed?: CashRefundOwed[] } | null, receipts: PaymentReceipt[], history: any[], sheets: FunctionSheet[], installments: InstallmentsResponse | null, settlement: SettlementPreview | null, deposit: DepositPosition | null): string {
  const statusLabel = bookingStatusLabel(booking) || "Booking"
  const tone = toneOf(statusLabel)
  const st = (booking.status || "").toLowerCase()
  const isPending = /await|pending|request/.test(st)
  const isClosed = /cancel|complete|done|reject/.test(st)
  // A dead booking — money can no longer be collected on it (the backend refuses
  // with BOOKING_CANCELLED), so every payment CTA is hidden here too.
  const isCancelled = /cancel|reject|refund/.test(st)
  const service = booking.bookingDetails?.[0]?.package?.name || booking.bookingDetails?.[0]?.business?.name || "Booking"
  const space = spaceNameOf(booking)
  const guests = booking.guestCount ?? null

  // WW money-truth: read the amount columns through the shared util, NOT the
  // legacy /payments/booking-status endpoint. That endpoint reports paid=0 /
  // remaining=full on Completed + Cancelled bookings (verified live on
  // #155/#158/#196) — the exact flag-vs-amount defect bookingMoney.js exists to
  // remove. `downPayment` carries receipts and reconciles to the rupee.
  const total = bookedOn(booking) || Number(booking.totalAmount ?? 0)
  const paid = receivedOn(booking)
  const due = outstandingOn(booking) // already 0 for cancelled
  const refundOwed = Number(pay?.cashRefundOwedTotal ?? 0)
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0
  const ev = eventWhen(booking.bookingDate)

  /* payment timeline from real receipts */
  const rc = [...receipts].filter((r) => Number(r.amount) !== 0)
    .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime())
  const rcItems = rc.map((r, i) => {
    const amt = Math.abs(Number(r.amount))
    const title = i === 0 ? "Advance" : `Qist ${i + 1}`
    const meta = `${fmtDateShort(r.receivedDate)} · ${escHtml(prettyMethod(r.method))}${r.transactionRef ? ` · ${escHtml(r.transactionRef)}` : ""}`
    return `<div class="tl-item done"><span class="tl-dot">${svg(I.check, 2.6)}</span>
      <div class="tl-body"><div class="tl-title">${title}<span class="tl-amt tnum">${rs(amt)}</span></div><div class="tl-meta">${meta}</div></div></div>`
  }).join("")
  const confirmItem = `<div class="tl-item done"><span class="tl-dot">${svg(I.check, 2.6)}</span>
    <div class="tl-body"><div class="tl-title">Booking confirm<span class="tl-amt">—</span></div><div class="tl-meta">${fmtDateShort(booking.createdAt)} · booking bani</div></div></div>`
  const recAttrs = `data-rec="${booking.id}" data-rec-name="${escHtml(booking.customerName || "")}" data-rec-due="${Math.round(due)}"`
  const statusActions = isPending
    ? `<button class="btn btn-primary" data-bk-approve="${booking.id}">${svg(I.check, 2.4)} Confirm karein</button><button class="btn btn-ghost" data-bk-cancel="${booking.id}">Reject</button>`
    : (!isClosed ? `<button class="btn btn-ghost" data-bk-cancel="${booking.id}">${svg(I.clock)} Cancel booking</button>` : "")
  const remindAttrs = `data-remind="${booking.id}" data-remind-phone="${escHtml(booking.customerPhone || "")}" data-remind-name="${escHtml(booking.customerName || "")}" data-remind-due="${Math.round(due)}" data-remind-date="${escHtml(booking.bookingDate || "")}"`
  const dueItem = (due > 0 && !isCancelled) ? `<div class="tl-item due"><span class="tl-dot">${svg(I.clock)}</span>
    <div class="tl-body"><div class="tl-title">Baqaya<span class="tl-amt due tnum">${rs(due)}</span></div><div class="tl-meta">Event se pehle lena hai</div>
      <div class="tl-cta"><button class="btn btn-primary" ${recAttrs} style="height:32px;padding:0 12px;font-size:12.5px">Baqaya record karein</button>${waDigits(booking.customerPhone || "") ? `<button class="btn btn-ghost" ${remindAttrs} style="height:32px;padding:0 12px;font-size:12.5px">${svg(I.wa)} WhatsApp par yaad dilayein</button>` : ""}</div></div></div>` : ""
  const cancelledItem = isCancelled ? `<div class="tl-item"><span class="tl-dot" style="background:var(--bad-wash);border-color:transparent;color:var(--bad)">${svg(I.minus, 2.4)}</span>
    <div class="tl-body"><div class="tl-title">Booking cancel<span class="tl-amt" style="color:var(--ink-4)">—</span></div><div class="tl-meta">Is par ab koi payment collect nahi hoti${paid > 0 ? " · pehle mila paisa refund/policy ke mutabiq" : ""}</div></div></div>` : ""
  const settleItem = `<div class="tl-item"><span class="tl-dot">${svg(I.minus)}</span>
    <div class="tl-body"><div class="tl-title" style="color:var(--ink-3)">Settle<span class="tl-amt" style="color:var(--ink-4)">${due > 0 ? "baad mein" : "done"}</span></div><div class="tl-meta">Event ke baad khata band</div></div></div>`

  /* package lines from real bookingDetails */
  const pkgRows = (booking.bookingDetails || []).map((d) => {
    const nm = d.package?.name || d.menu?.title || "Service"
    const sub = d.menu?.title && d.package?.name ? d.menu.title : (space || "Booking")
    const amt = Number(d.totalAmount ?? d.package?.price ?? 0)
    return `<div class="pkg-row"><span class="pkg-ico">${svg(I.hall, 1.8)}</span>
      <div class="pkg-main"><div class="pkg-nm">${escHtml(nm)}</div><div class="pkg-sub">${escHtml(sub)}</div></div>
      <span class="pkg-amt tnum">${amt > 0 ? rs(amt) : '<span class="pkg-amt inc">Shamil</span>'}</span></div>`
  }).join("") || `<div class="emptylite">Is booking mein koi package line nahi.</div>`

  /* activity from real history */
  const actItems = (history || []).slice(0, 8).map((h) => {
    const from = h.fromStatus, to = h.toStatus
    const title = to ? `Status: ${escHtml(from || "—")} → ${escHtml(to)}` : escHtml(h.reason || "Update")
    const when = fmtDateShort(h.changedAt || h.createdAt)
    return `<div class="tl-item done"><span class="tl-dot">${svg(I.check)}</span>
      <div class="tl-body"><div class="tl-title" style="font-weight:500">${title}</div><div class="tl-meta">${when}${h.changedByRole ? ` · ${escHtml(h.changedByRole)}` : ""}</div></div></div>`
  }).join("")
  const createdItem = `<div class="tl-item"><span class="tl-dot">${svg(I.cal)}</span>
    <div class="tl-body"><div class="tl-title" style="font-weight:500">Booking banai gayi</div><div class="tl-meta">${fmtDateShort(booking.createdAt)}</div></div></div>`

  /* customer */
  const phone = booking.customerPhone || ""
  const waP = waDigits(phone)
  const custActions = `<div class="cust-actions">
    <button class="cact" ${phone ? `data-tel="${escHtml(phone)}"` : "disabled"}>${svg(I.phone)} Call</button>
    <button class="cact wa" ${waP ? `data-wa="${escHtml(phone)}"` : "disabled"}>${svg(I.wa)} WhatsApp</button>
    <button class="cact" data-nav-btn="/dashboard/chat">${svg(I.chat)} Message</button></div>`

  /* documents from linked function sheets */
  const docs = (sheets || []).length
    ? sheets.map((s) => `<div class="doc-row" data-nav-btn="/dashboard/function-sheets/${s.id}"><span class="doc-ico">${svg(I.doc, 1.8)}</span>
        <div class="doc-main"><div class="doc-nm">${escHtml(s.title || `Function sheet #${s.id}`)}</div><div class="doc-sub">Function sheet · ${fmtDateShort((s as any).createdAt)}</div></div>
        <button class="doc-dl" aria-label="Kholein">${svg(I.chevr)}</button></div>`).join("")
    : `<div class="emptylite">Abhi koi document link nahi.</div>`

  const noteVal = escHtml(booking.specialRequests || booking.additionalRequests || booking.serviceLocationNotes || "")

  return `
  <button class="back" data-nav-btn="/dashboard/bookings">${svg(I.back, 2.2)} Sab bookings</button>

  <div class="dhead">
    <div class="dh-left">
      <span class="dh-mono" aria-hidden="true">${escHtml(initialsOf(booking.customerName))}</span>
      <div>
        <div class="dh-title">${escHtml(booking.customerName || "Customer")} <span class="st ${tone}"><i></i> ${escHtml(statusLabel)}</span></div>
        <div class="dh-sub"><span>${escHtml(service)}</span><span class="sep">·</span><span>Booking #${booking.id}</span>${space ? `<span class="sep">·</span><span>${escHtml(space)}</span>` : ""}</div>
      </div>
    </div>
    <div class="dhead-actions">${statusActions}
      <button class="btn btn-ghost icon" data-nav-btn="/dashboard/chat" aria-label="Message">${svg(I.chat)}</button>
      ${isCancelled ? "" : `<button class="btn ${isPending ? "btn-ghost" : "btn-primary"}" ${recAttrs}>${svg(I.money)} Payment record karein</button>`}
    </div>
  </div>

  <div class="stats">
    <div class="stat hl"><div class="s-cap">${svg(I.clock)} Event</div><div class="s-val">${escHtml(ev.big)}</div><div class="s-sub">${escHtml(ev.sub)}${booking.bookingTime ? ` · ${fmtTime(booking.bookingTime)}` : ""}</div></div>
    <div class="stat"><div class="s-cap">${svg(I.users)} Mehmaan</div><div class="s-val tnum">${guests != null ? guests : "—"}</div><div class="s-sub">${escHtml(space || "Venue")}</div></div>
    <div class="stat"><div class="s-cap">${svg(I.card)} Kul package</div><div class="s-val tnum">${rs(total)}</div><div class="s-sub">${pct}% mil chuka</div></div>
    ${refundOwed > 0
      ? `<div class="stat"><div class="s-cap" style="color:var(--bad)">${svg(I.money)} Refund dena hai</div><div class="s-val tnum" style="color:var(--bad)">${rs(refundOwed)}</div><div class="s-sub">customer ko wapas karna hai</div></div>`
      : `<div class="stat ${isCancelled ? "" : "warnv"}"><div class="s-cap">${svg(I.clock)} Baqaya</div><div class="s-val tnum">${isCancelled ? "—" : rs(due)}</div><div class="s-sub">${isCancelled ? "booking cancel ho chuki" : due > 0 ? "event se pehle lena hai" : "sab clear"}</div></div>`}
  </div>

  <div class="two">
    <div class="col-stack">
      <div class="card">
        <div class="card-h"><div><h2>Payment</h2><div class="sub">Advance → baqaya → settle</div></div><button class="link" data-nav-btn="/dashboard/money">Khata mein ${svg(I.chevr, 2.2)}</button></div>
        <div class="pay-sum">
          <div><div class="ps-cap">Kul</div><div class="ps-val tnum">${rs(total)}</div></div>
          <div><div class="ps-cap">Mil chuka</div><div class="ps-val ok tnum">${rs(paid)}</div></div>
          <div><div class="ps-cap">Baqaya</div><div class="ps-val due tnum">${rs(due)}</div></div>
        </div>
        <div class="pay-bar-wrap"><div class="pay-bar-lbl"><b>${pct}% mila</b><span>Rs ${pkNum(paid)} / ${pkNum(total)}</span></div><div class="paybar"><span style="width:${pct}%"></span></div></div>
        <div class="pay-tl"><div class="tl-h">Payment history</div>${confirmItem}${rcItems}${dueItem}${isCancelled ? cancelledItem : settleItem}</div>
      </div>

      ${refundOwedCard(pay?.cashRefundsOwed ?? [])}

      ${installmentsCard(installments, due)}

      ${settlementCard(settlement)}

      ${depositCard(deposit)}

      <div class="card">
        <div class="card-h"><div><h2>Package — kya shamil hai</h2><div class="sub">${escHtml(service)}${space ? ` · ${escHtml(space)}` : ""}</div></div></div>
        <div class="pkg">${pkgRows}</div>
        <div class="pkg-total"><span class="t-cap">Kul package</span><span class="t-val tnum">${rs(total)}</span></div>
      </div>

      <div class="card">
        <div class="card-h"><div><h2>Activity</h2></div></div>
        <div style="padding:2px 16px 14px">${actItems}${createdItem}</div>
      </div>
    </div>

    <div class="col-stack">
      <div class="card">
        <div class="card-h"><div><h2>Customer</h2></div></div>
        <div class="cust">
          <div class="cust-top"><span class="cust-ava" aria-hidden="true">${escHtml(initialsOf(booking.customerName))}</span>
            <div><div class="cust-nm">${escHtml(booking.customerName || "Customer")}</div><div class="cust-role">Booking owner</div></div></div>
          ${custActions}
        </div>
        <div class="dl">
          <div class="dl-row"><span class="k">${svg(I.phone)} Phone</span><span class="v tnum">${escHtml(phone || "—")}</span></div>
          <div class="dl-row"><span class="k">${svg(I.mail)} Email</span><span class="v">${escHtml(booking.customerEmail || "—")}</span></div>
          <div class="dl-row"><span class="k">${svg(I.card)} Zariya</span><span class="v">${booking.bookingSource === "offline" ? "Walk-in" : "Online"}</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-h"><div><h2>Event details</h2></div></div>
        <div class="dl">
          <div class="dl-row"><span class="k">Service</span><span class="v">${escHtml(service)}</span></div>
          <div class="dl-row"><span class="k">Taareekh</span><span class="v">${fmtDate(booking.bookingDate)}</span></div>
          <div class="dl-row"><span class="k">Waqt</span><span class="v">${fmtTime(booking.bookingTime)}</span></div>
          <div class="dl-row"><span class="k">Hall</span><span class="v">${escHtml(space || "—")}</span></div>
          <div class="dl-row"><span class="k">Mehmaan</span><span class="v tnum">${guests != null ? guests : "—"}</span></div>
          ${booking.serviceLocationAddress ? `<div class="dl-row"><span class="k">${svg(I.pin)} Jagah</span><span class="v">${escHtml(booking.serviceLocationAddress)}</span></div>` : ""}
        </div>
      </div>

      <div class="card">
        <div class="card-h"><div><h2>Documents</h2><div class="sub">Quote · contract · BEO · invoice — sab yahan</div></div><button class="link" data-fs-new="${booking.bookingDetails?.[0]?.businessId ?? ""}" data-fs-name="${escHtml(booking.customerName || "")}" data-fs-phone="${escHtml(booking.customerPhone || "")}" data-fs-email="${escHtml(booking.customerEmail || "")}" data-fs-date="${escHtml(booking.bookingDate || "")}">${svg(I.doc, 1.9)} Naya banayein</button></div>
        <div class="docs">${docs}</div>
      </div>

      <div class="card">
        <div class="card-h"><div><h2>Notes</h2><div class="sub">Customer ki request + aap ki private note</div></div></div>
        <div class="note">
          ${noteVal ? `<div style="font-size:12.5px;color:var(--ink-2);background:var(--surface-2);border:1px solid var(--border);border-radius:9px;padding:10px 11px;line-height:1.5;margin-bottom:12px"><div style="font-size:11px;font-weight:600;color:var(--ink-3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px">Customer ki request</div>${noteVal}</div>` : ""}
          <label for="vendor-note" style="display:block;font-size:11px;font-weight:600;color:var(--ink-3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">Aap ki private note</label>
          <textarea id="vendor-note" placeholder="Sirf aap ke liye — e.g. customer ne stage decoration extra maanga, advance cash mein…"></textarea>
          <div class="note-bar"><span class="note-status" data-note-status></span><button class="btn btn-primary" data-note-save style="height:32px;padding:0 14px;font-size:12.5px">Save karein</button></div>
          <div class="note-hint">Ye note is device par save hoti hai — sirf aap dekh saktay hain.</div>
        </div>
      </div>
    </div>
  </div>`
}

/** Cancel confirmation (money-sensitive): a refund warning + optional reason. */
function cancelBookingHtml(id: number): string {
  return `<div style="font-size:12px;color:var(--bad);background:var(--bad-wash);border-radius:8px;padding:10px 12px;margin-bottom:14px;line-height:1.5">⚠️ Cancel karne par cancellation policy ke mutabiq refund ban sakta hai. Ye amal wapas nahi hoga.</div>
    <div class="dfield"><label class="dlabel">Cancel ki wajah</label><textarea id="bc-reason" placeholder="Optional — record ke liye"></textarea></div>
    <div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close type="button">Waapas</button><button class="btn btn-primary" data-bk-cancel-save="${id}" type="button" style="background:var(--bad);border-color:transparent">Haan, cancel karein</button></div>`
}

export function BookingDetailArtifact({ bookingId }: { bookingId: number }) {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/bookings", crumbBold: "Bookings", crumbSub: "Booking detail", extraCss: EXTRA_CSS,
  })

  const qc = useQueryClient()
  const router = useRouter()
  const valid = Number.isFinite(bookingId)
  const bookingQ = useQuery({ queryKey: ["bk-detail", bookingId], queryFn: () => BookingAPI.getWithAvailability(bookingId), enabled: valid })
  const payQ = useQuery({ queryKey: ["bk-detail-pay", bookingId], queryFn: () => PaymentAPI.getBookingPaymentStatus(bookingId).catch(() => null), enabled: valid })
  const rcQ = useQuery({ queryKey: ["bk-detail-rc", bookingId], queryFn: () => ReceiptsAPI.list({ bookingId }).catch(() => ({ receipts: [] as PaymentReceipt[], summary: { total: 0, byMethod: {} } })), enabled: valid })
  const histQ = useQuery({ queryKey: ["bk-detail-hist", bookingId], queryFn: () => BookingAPI.getHistory(bookingId).catch(() => []), enabled: valid })
  const sheetsQ = useQuery({ queryKey: ["bk-detail-sheets", bookingId], queryFn: () => FunctionSheetAPI.list({ bookingId }).then((r) => r.functionSheets).catch(() => [] as FunctionSheet[]), enabled: valid })
  const instQ = useQuery({ queryKey: ["bk-detail-inst", bookingId], queryFn: () => BookingAPI.getInstallments(bookingId).catch(() => null), enabled: valid })
  const settleQ = useQuery({ queryKey: ["bk-detail-settle", bookingId], queryFn: () => BookingAPI.getSettlement(bookingId).catch(() => null), enabled: valid })
  const depQ = useQuery({ queryKey: ["bk-detail-deposit", bookingId], queryFn: () => BookingAPI.getDeposit(bookingId).catch(() => null), enabled: valid })

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    const booking = bookingQ.data?.booking
    if (bookingQ.isLoading) { wwc.innerHTML = `<div class="loadwrap">Booking load ho rahi hai…</div>`; return }
    if (!booking) { wwc.innerHTML = `<button class="back" data-nav-btn="/dashboard/bookings">${svg(I.back, 2.2)} Sab bookings</button><div class="loadwrap">Ye booking nahi mili.</div>`; return }
    wwc.innerHTML = buildDetail(
      booking,
      payQ.data ?? null,
      rcQ.data?.receipts ?? [],
      Array.isArray(histQ.data) ? histQ.data : [],
      sheetsQ.data ?? [],
      instQ.data ?? null,
      settleQ.data ?? null,
      depQ.data ?? null,
    )
    // restore the vendor's private per-booking note (persisted locally)
    const vn = s.getElementById("vendor-note") as HTMLTextAreaElement | null
    if (vn) { try { vn.value = localStorage.getItem(`ww-bknote-${bookingId}`) || "" } catch { /* storage blocked */ } }
    // update the crumb with the real customer name
    const crumb = s.querySelector(".crumb b"); if (crumb) crumb.textContent = booking.customerName || "Booking"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, bookingQ.data, bookingQ.isLoading, payQ.data, rcQ.data, histQ.data, sheetsQ.data, instQ.data, settleQ.data, depQ.data])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const invalidateAll = () => ["bk-detail", "bk-detail-pay", "bk-detail-rc", "bk-detail-hist", "bk-detail-inst", "bk-detail-settle", "bk-detail-deposit"].forEach((k) => qc.invalidateQueries({ queryKey: [k, bookingId] }))
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      // inline record payment (header button + timeline "Baqaya record karein")
      const rec = t.closest("[data-rec]") as HTMLElement | null
      if (rec?.dataset.rec) {
        openRecordPaymentDrawer(s, {
          bookingId: Number(rec.dataset.rec), customerName: rec.dataset.recName || undefined, due: Number(rec.dataset.recDue) || 0,
          onSaved: invalidateAll,
        })
        return
      }
      // create a document (function sheet) for this booking → open it
      const fsn = t.closest("[data-fs-new]") as HTMLButtonElement | null
      if (fsn) {
        const biz = Number(fsn.dataset.fsNew)
        if (!biz) { toast.error("Is booking ki venue nahi mili"); return }
        fsn.disabled = true; const o = fsn.innerHTML; fsn.textContent = "Ban raha…"
        try {
          const fs = await FunctionSheetAPI.create({
            businessId: biz, bookingId, title: `Booking #${bookingId} — ${fsn.dataset.fsName || "document"}`,
            customerName: fsn.dataset.fsName || undefined, customerPhone: fsn.dataset.fsPhone || undefined,
            customerEmail: fsn.dataset.fsEmail || undefined, eventDate: fsn.dataset.fsDate || undefined,
          })
          toast.success("Function sheet ban gayi")
          qc.invalidateQueries({ queryKey: ["bk-detail-sheets", bookingId] })
          if (fs?.id) router.push(`/dashboard/function-sheets/${fs.id}`)
        } catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Sheet nahi bani"); fsn.disabled = false; fsn.innerHTML = o }
        return
      }
      // explicit save of the vendor's private note (device-local)
      const ns = t.closest("[data-note-save]") as HTMLButtonElement | null
      if (ns) {
        const ta = s.getElementById("vendor-note") as HTMLTextAreaElement | null
        const status = s.querySelector("[data-note-status]") as HTMLElement | null
        try { localStorage.setItem(`ww-bknote-${bookingId}`, ta?.value || ""); if (status) { status.textContent = "Save ho gaya ✓"; setTimeout(() => { if (status) status.textContent = "" }, 2500) } }
        catch { toast.error("Note save nahi hua (storage band hai)") }
        return
      }
      // confirm a pending booking request (safe — no refund implication)
      const ap = t.closest("[data-bk-approve]") as HTMLButtonElement | null
      if (ap?.dataset.bkApprove) {
        ap.disabled = true; const o = ap.innerHTML; ap.textContent = "Confirm ho raha…"
        try { await BookingsAPI.approveBooking(Number(ap.dataset.bkApprove)); toast.success("Booking confirm ho gayi"); invalidateAll() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Confirm nahi hui"); ap.disabled = false; ap.innerHTML = o }
        return
      }
      // cancel / reject — open the reason drawer (money-sensitive, gated)
      const cx = t.closest("[data-bk-cancel]") as HTMLElement | null
      if (cx?.dataset.bkCancel) { openDrawer(s, "Booking cancel karein", cancelBookingHtml(Number(cx.dataset.bkCancel))); return }
      const cxs = t.closest("[data-bk-cancel-save]") as HTMLButtonElement | null
      if (cxs?.dataset.bkCancelSave) {
        const reason = (s.getElementById("bc-reason") as HTMLTextAreaElement | null)?.value?.trim() || undefined
        cxs.disabled = true; cxs.textContent = "Cancel ho raha…"
        try { await BookingsAPI.cancel(Number(cxs.dataset.bkCancelSave), reason); toast.success("Booking cancel ho gayi"); closeDrawer(s); invalidateAll() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Cancel nahi hui"); cxs.disabled = false; cxs.textContent = "Haan, cancel karein" }
        return
      }
      // WhatsApp baqaya reminder — open a prefilled wa.me nudge + best-effort log.
      // The log endpoint is flag-gated (WHATSAPP_TIER1_ENABLED); a 404 there is
      // the engine being off, not a failure — the reminder still went out.
      const rem = t.closest("[data-remind]") as HTMLElement | null
      if (rem?.dataset.remind) {
        const p = waDigits(rem.dataset.remindPhone)
        if (!p) { toast.error("Customer ka WhatsApp number nahi hai"); return }
        const nm = rem.dataset.remindName || "ji"
        const amt = pkNum(Number(rem.dataset.remindDue) || 0)
        const dt = rem.dataset.remindDate ? fmtDateShort(rem.dataset.remindDate) : ""
        const msg = `Assalam o Alaikum ${nm},\nAap ki booking${dt ? ` (${dt})` : ""} ki baqaya raqam Rs ${amt} hai. Bara-e-meherbani event se pehle ada kar dein. Shukriya.`
        window.open(`https://wa.me/${p}?text=${encodeURIComponent(msg)}`, "_blank", "noopener")
        BookingAPI.logReminder(Number(rem.dataset.remind), { trigger: "balance_due", channel: "whatsapp", body: msg })
          .then(() => toast.success("WhatsApp khul gaya · reminder log ho gaya"))
          .catch(() => toast.success("WhatsApp khul gaya"))
        return
      }
      // ── Settlement: lock the guarantee before the night ──────────────
      const hcLock = t.closest("[data-hc-lock]") as HTMLElement | null
      if (hcLock?.dataset.hcLock) { openDrawer(s, "Guarantee lock karein", lockDrawerBody(Number(hcLock.dataset.hcLock), Number(hcLock.dataset.hcGuar) || 0)); return }
      const hcSave = t.closest("[data-hc-lock-save]") as HTMLButtonElement | null
      if (hcSave?.dataset.hcLockSave) {
        const g = Number((s.getElementById("hc-guar") as HTMLInputElement | null)?.value || 0)
        if (!g || g <= 0) { toast.error("Guarantee likhein (kam az kam 1)"); return }
        hcSave.disabled = true; hcSave.textContent = "Lock ho raha…"
        try { await BookingAPI.lockHeadcount(Number(hcSave.dataset.hcLockSave), { guaranteed: g }); toast.success("Guarantee lock ho gayi"); closeDrawer(s); invalidateAll() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lock nahi hui"); hcSave.disabled = false; hcSave.textContent = "Lock karein" }
        return
      }
      // ── Settlement: strike the final bill ────────────────────────────
      const settle = t.closest("[data-settle]") as HTMLElement | null
      if (settle?.dataset.settle) {
        openDrawer(s, "Final bill — settle karein", settleDrawerBody(Number(settle.dataset.settle), Number(settle.dataset.settleTotal) || 0, Number(settle.dataset.settleGuar) || 0))
        return
      }
      const readCounts = () => {
        const v = (id: string) => Number((s.getElementById(id) as HTMLInputElement | null)?.value || 0)
        return { total: v("st-total"), kidsUnder5: v("st-kids5"), kids5to12: v("st-kids12"), staff: v("st-staff"), crew: v("st-crew"), note: (s.getElementById("st-note") as HTMLTextAreaElement | null)?.value?.trim() || undefined }
      }
      const spv = t.closest("[data-settle-preview]") as HTMLButtonElement | null
      if (spv?.dataset.settlePreview) {
        const c = readCounts()
        if (!c.total || c.total <= 0) { toast.error("Kul mehmaan likhein"); return }
        spv.disabled = true; const o = spv.textContent; spv.textContent = "Andaaza…"
        try {
          const prev = await BookingAPI.getSettlement(Number(spv.dataset.settlePreview), c)
          const box = s.getElementById("settle-preview"); if (box) { box.innerHTML = settlePreviewHtml(prev); box.hidden = false }
        } catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Andaaza nahi bana") }
        finally { spv.disabled = false; if (o) spv.textContent = o }
        return
      }
      const sss = t.closest("[data-settle-save]") as HTMLButtonElement | null
      if (sss?.dataset.settleSave) {
        const c = readCounts()
        if (!c.total || c.total <= 0) { toast.error("Kul mehmaan likhein") ; return }
        sss.disabled = true; const o = sss.innerHTML; sss.textContent = "Settle ho raha…"
        try { await BookingAPI.settle(Number(sss.dataset.settleSave), c); toast.success("Final bill ban gaya"); closeDrawer(s); invalidateAll() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Settle nahi hua"); sss.disabled = false; sss.innerHTML = o }
        return
      }
      // cash handed over on the night, against the struck bill (whole outstanding)
      const scash = t.closest("[data-settle-cash]") as HTMLButtonElement | null
      if (scash?.dataset.settleCash) {
        const out = Number(scash.dataset.cashOut) || 0
        openDrawer(s, "Cash mila — settle", `<div class="settle-note">Us raat customer se cash mila? Ye <b>Rs ${pkNum(out)}</b> ki baaqi raqam settle kar deta hai (ledger + receipt dono).</div>
          <div class="dfield"><label class="dlabel">Reference (optional)</label><input id="sc-ref" placeholder="Receipt book no. ya note"/></div>
          <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Waapas</button><button class="btn btn-primary" type="button" data-settle-cash-save="${scash.dataset.settleCash}">Haan, cash mila</button></div>`)
        return
      }
      const scs = t.closest("[data-settle-cash-save]") as HTMLButtonElement | null
      if (scs?.dataset.settleCashSave) {
        scs.disabled = true; scs.textContent = "Record ho raha…"
        try { await BookingAPI.confirmCashSettlement(Number(scs.dataset.settleCashSave), { reference: (s.getElementById("sc-ref") as HTMLInputElement | null)?.value?.trim() || undefined }); toast.success("Cash settle ho gaya"); closeDrawer(s); invalidateAll() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Nahi hua"); scs.disabled = false; scs.textContent = "Haan, cash mila" }
        return
      }
      // ── Refund owed: mark a cash refund handed over ──────────────────
      const rfs = t.closest("[data-refund-settle]") as HTMLButtonElement | null
      if (rfs?.dataset.refundSettle) {
        rfs.disabled = true; const o = rfs.textContent; rfs.textContent = "Ho raha…"
        try { await PaymentAPI.settleCashRefund(Number(rfs.dataset.refundSettle)); toast.success("Refund handed-over mark ho gaya"); invalidateAll() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Nahi hua"); rfs.disabled = false; if (o) rfs.textContent = o }
        return
      }
      // ── Security deposit ─────────────────────────────────────────────
      const depRet = t.closest("[data-dep-return]") as HTMLButtonElement | null
      if (depRet?.dataset.depReturn) {
        depRet.disabled = true; const o = depRet.innerHTML; depRet.textContent = "Wapas ho raha…"
        try { await BookingAPI.returnDeposit(Number(depRet.dataset.depReturn)); toast.success("Deposit wapas ho gaya"); invalidateAll() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Wapas nahi hua"); depRet.disabled = false; depRet.innerHTML = o }
        return
      }
      const depClaim = t.closest("[data-dep-claim]") as HTMLElement | null
      if (depClaim?.dataset.depClaim) {
        openDrawer(s, "Nuqsan claim karein", damageClaimDrawerBody(Number(depClaim.dataset.depClaim), Number(depClaim.dataset.depReturnable) || 0))
        return
      }
      const dcSave = t.closest("[data-dc-save]") as HTMLButtonElement | null
      if (dcSave?.dataset.dcSave) {
        const desc = (s.getElementById("dc-desc") as HTMLTextAreaElement | null)?.value?.trim() || ""
        const amt = Number((s.getElementById("dc-amt") as HTMLInputElement | null)?.value || 0)
        if (desc.length < 5) { toast.error("Nuqsan ki tafseel likhein (kam az kam 5 harf)"); return }
        if (!amt || amt <= 0) { toast.error("Raqam likhein"); return }
        dcSave.disabled = true; dcSave.textContent = "Raise ho raha…"
        try { await BookingAPI.raiseDamageClaim(Number(dcSave.dataset.dcSave), { description: desc, amountPkr: amt }); toast.success("Claim raise ho gayi"); closeDrawer(s); invalidateAll() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Claim raise nahi hui"); dcSave.disabled = false; dcSave.textContent = "Claim raise karein" }
        return
      }
      const clSettle = t.closest("[data-claim-settle]") as HTMLButtonElement | null
      if (clSettle?.dataset.claimSettle) {
        clSettle.disabled = true; clSettle.textContent = "…"
        try { await BookingAPI.settleDamageClaim(bookingId, Number(clSettle.dataset.claimSettle), {}); toast.success("Claim settle — deposit se kaat liya"); invalidateAll() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Settle nahi hua"); clSettle.disabled = false; clSettle.textContent = "Kaatein" }
        return
      }
      const clWd = t.closest("[data-claim-withdraw]") as HTMLButtonElement | null
      if (clWd?.dataset.claimWithdraw) {
        clWd.disabled = true; clWd.textContent = "…"
        try { await BookingAPI.withdrawDamageClaim(bookingId, Number(clWd.dataset.claimWithdraw)); toast.success("Claim chhor di"); invalidateAll() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Nahi hua"); clWd.disabled = false; clWd.textContent = "Chhorें" }
        return
      }
      const wa = t.closest("[data-wa]") as HTMLElement | null
      if (wa) { const p = waDigits(wa.dataset.wa); if (p) window.open(`https://wa.me/${p}`, "_blank", "noopener"); return }
      const tel = t.closest("[data-tel]") as HTMLElement | null
      if (tel?.dataset.tel) { window.location.href = `tel:${tel.dataset.tel.replace(/\s/g, "")}` }
    })
    // save the vendor's private note on blur (persisted locally, per booking)
    s.addEventListener("focusout", (e) => {
      const ta = (e.target as HTMLElement)?.closest("#vendor-note") as HTMLTextAreaElement | null
      if (!ta) return
      try {
        const key = `ww-bknote-${bookingId}`
        if (ta.value === (localStorage.getItem(key) || "")) return
        localStorage.setItem(key, ta.value); toast.success("Note save ho gaya")
      } catch { toast.error("Note save nahi hua (storage band hai)") }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default BookingDetailArtifact
