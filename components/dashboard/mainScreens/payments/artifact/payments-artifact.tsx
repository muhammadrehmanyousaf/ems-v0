"use client"

/**
 * Payments (revenue) — premium rebuild on the shared champagne shell.
 * Real per-booking billed / received / due with the online↔offline split via
 * PaymentsAPI.getVendorRevenue. Read-only; rows deep-link to the booking.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { PaymentsAPI } from "@/lib/api/dashboard"
import type { VendorRevenueResponse, VendorPayment } from "@/lib/dashboard-types"
import { useArtifactShell, pkNum, escHtml, initialsOf, initTablePager, errorBannerHtml, loadPref, savePref } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import { openRecordPaymentDrawer } from "@/components/dashboard/mainScreens/artifact/record-payment"

const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  billed: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>', in: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', split: '<path d="M3 12h18M12 3v18"/><circle cx="7" cy="7" r="1.5"/><circle cx="17" cy="17" r="1.5"/>',
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.5A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.5 8.6c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.5l.6 1.4c.1.2 0 .4-.1.5l-.4.5c-.1.1-.2.3-.1.5.3.6 1.1 1.5 2 1.9.2.1.4 0 .5-.1l.5-.5c.1-.1.3-.2.5-.1l1.3.7c.2.1.3.3.3.5 0 .6-.5 1.1-1 1.2-.5.1-1 .1-2.2-.4-1.9-.8-3.1-2.7-3.2-2.9-.1-.2-.8-1.1-.8-2 0-.9.5-1.4.6-1.6z"/>',
}
const waDigits = (ph?: string | null) => { let d = (ph || "").replace(/\D/g, ""); if (!d) return ""; if (d.startsWith("0")) d = "92" + d.slice(1); else if (d.length === 10) d = "92" + d; return d }
const payTone = (p: string) => { const v = (p || "").toLowerCase(); if (v.includes("paid") || v.includes("complete")) return "ok"; if (v.includes("partial")) return "info"; if (v.includes("cancel")) return "bad"; return "warn" }
const payLabel = (p: string) => { const v = (p || "").toLowerCase(); if (v.includes("paid") || v.includes("complete")) return "Poora"; if (v.includes("partial")) return "Kuch mila"; if (v.includes("cancel")) return "Cancel"; if (v.includes("refund")) return "Refund"; return "Baqaya" }

const EXTRA_CSS = String.raw`
.pay-tiles{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:14px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:14px 15px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); }
.tile.ok .t-val{ color:var(--ok); } .tile.warn .t-val{ color:var(--warn); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:19px; font-weight:680; letter-spacing:-.02em; margin-top:8px; } .t-val .rs{ font-size:12px; color:var(--ink-3); font-weight:600; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.t-split{ display:flex; gap:8px; margin-top:8px; } .t-split .sp{ flex:1; font-size:11px; } .t-split .sp b{ display:block; font-size:13px; font-weight:660; font-variant-numeric:tabular-nums; }
.srcchip{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:2px 8px; border-radius:6px; } .srcchip.on{ color:var(--info); background:var(--info-wash); } .srcchip.off{ color:var(--accent-ink); background:var(--accent-wash); }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
.duewrap{ display:inline-flex; align-items:center; gap:8px; justify-content:flex-end; }
.rec-mini{ display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:7px; border:1px solid var(--accent-line); background:var(--accent-wash); color:var(--accent-ink); flex:none; } .rec-mini svg{ width:14px; height:14px; } .rec-mini:hover{ filter:brightness(.97); }
.rec-mini.wa{ border-color:color-mix(in srgb,var(--ok) 45%,var(--border-2)); background:color-mix(in srgb,var(--ok) 12%,var(--surface)); color:var(--ok); }
@media (max-width:980px){ .pay-tiles{ grid-template-columns:repeat(2,1fr); } }
`

function buildContent(d: VendorRevenueResponse, filter: string): string {
  const all = d.stats?.all ?? { count: 0, total: 0, received: 0, due: 0 }
  const off = d.stats?.offline ?? { count: 0, total: 0, received: 0, due: 0 }
  const on = d.stats?.online ?? { count: 0, total: 0, received: 0, due: 0 }
  const pct = money(all.total) > 0 ? Math.round((money(all.received) / money(all.total)) * 100) : 0

  const tiles = `<div class="pay-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.billed, 1.9)} Kul billed</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(money(all.total))}</div><div class="t-sub">${all.count} bookings</div></div>
    <div class="tile ok"><div class="t-cap">${svg(IC.in, 1.9)} Received</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(money(all.received))}</div><div class="t-sub">${pct}% mil chuka</div></div>
    <div class="tile warn"><div class="t-cap">${svg(IC.clock, 1.9)} Baqaya</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(money(all.due))}</div><div class="t-sub">abhi tak pending</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.split, 1.9)} Online vs offline</div><div class="t-split"><span class="sp"><b class="tnum">${on.count}</b><span style="color:var(--info)">online</span></span><span class="sp"><b class="tnum">${off.count}</b><span style="color:var(--accent-ink)">offline</span></span></div></div>
  </div>`

  const dueCount = (d.payments || []).filter((p) => money(p.due) > 0).length
  const tab = (f: string, label: string, cnt: number) => `<button class="tab${f === filter ? " on" : ""}" data-f="${f}">${label} <span class="cnt">${cnt}</span></button>`
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">${tab("all", "Sab", all.count)}${tab("due", "Baqaya", dueCount)}${tab("online", "Online", on.count)}${tab("offline", "Offline", off.count)}</div></div>`

  const rows = (d.payments || []).filter((p) => filter === "all" ? true : filter === "due" ? money(p.due) > 0 : p.bookingSource === filter)
  const body = rows.map((p: VendorPayment) => {
    const total = money(p.totalAmount), rec = money(p.received), due = money(p.due)
    const pp = total > 0 ? Math.round((rec / total) * 100) : 0
    const waPh = waDigits(p.customerPhone)
    const waText = encodeURIComponent(`Assalam o alaikum${p.customerName ? " " + p.customerName : ""}, aap ki booking #${p.bookingId} ka baqaya Rs ${pkNum(due)} hai. Meharbani farma kar ada kar dein. Shukriya.`)
    const waBtn = due > 0 && waPh ? `<a class="rec-mini wa" href="https://wa.me/${waPh}?text=${waText}" target="_blank" rel="noopener" data-stop title="Baqaya yaad dilayein" aria-label="WhatsApp reminder">${svg(IC.wa, 1.9)}</a>` : ""
    return `<tr data-nav-btn="/dashboard/bookings/${p.bookingId}">
      <td><div class="c-couple"><span class="ava">${escHtml(initialsOf(p.customerName))}</span><div><div class="cc-nm">${escHtml(p.customerName || "—")}</div><div class="cc-ev">#${p.bookingId} · ${escHtml(p.businessName || "")}</div></div></div></td>
      <td class="td-date">${fmtDate(p.bookingDate)}</td>
      <td><span class="srcchip ${p.bookingSource === "online" ? "on" : "off"}">${p.bookingSource === "online" ? "Online" : "Offline"}</span></td>
      <td class="r td-amt tnum"><span class="rs">Rs</span> ${pkNum(total)}</td>
      <td><div class="pay-mini"><div class="paybar"><span style="width:${pp}%"></span></div><span class="pct">${pp}%</span></div></td>
      <td><span class="st ${payTone(p.paymentStatus)}"><i></i> ${escHtml(payLabel(p.paymentStatus))}</span></td>
      <td class="r td-amt tnum">${due > 0 ? `<span class="duewrap"><span style="color:var(--warn)"><span class="rs">Rs</span> ${pkNum(due)}</span>${waBtn}<button class="rec-mini" data-rec="${p.bookingId}" data-rec-name="${escHtml(p.customerName || "")}" data-rec-due="${Math.round(due)}" title="Payment record karein" aria-label="Payment record">${svg("M12 5v14M5 12h14", 2.4)}</button></span>` : (total > 0 && rec >= total ? `<span class="st ok"><i></i> Poora</span>` : `<span style="color:var(--ink-4)">—</span>`)}</td>
    </tr>`
  }).join("")

  return `
  <div class="head"><div><h1>Payments</h1><div class="sub">Billed vs received — <b>Rs ${pkNum(money(all.received))}</b> aaya, <b>Rs ${pkNum(money(all.due))}</b> baqaya.</div></div></div>
  ${tiles}${toolbar}
  <div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Customer</th><th>Taareekh</th><th>Zariya</th><th class="r">Billed</th><th>Mila</th><th>Status</th><th class="r">Baqaya</th></tr></thead>
    <tbody>${body}</tbody></table></div>
    ${rows.length
      ? `<div class="tbl-foot"><span>${rows.length} bookings</span></div>`
      : (filter === "all"
        ? `<div class="empty">Abhi koi payment nahi.<br><button class="btn btn-primary" data-nav-btn="/dashboard/bookings" style="margin-top:10px">Naya booking banayein</button></div>`
        : `<div class="empty">Is category mein koi payment nahi.<br><button class="btn btn-ghost" data-f="all" style="margin-top:10px">Sab dekhein</button></div>`)}</div>
  <div class="foot">WeddingWala vendor console · Payments</div>`
}

export function PaymentsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/payments", crumbBold: "Paisa", crumbSub: "Payments", extraCss: EXTRA_CSS,
  })
  const { data, isError } = useQuery({ queryKey: ["payments-art"], queryFn: () => PaymentsAPI.getVendorRevenue() })
  const qc = useQueryClient()
  const [filter, setFilter] = React.useState(() => loadPref("tab:payments", "all"))

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Payments</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Payments load ho rahe hain…</div>`; return }
    wwc.innerHTML = buildContent(data, filter)
    initTablePager(s, { pageSize: 25 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, filter, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["payments-art"] }); return }
      const rec = t.closest("[data-rec]") as HTMLElement | null
      if (rec?.dataset.rec) {
        openRecordPaymentDrawer(s, {
          bookingId: Number(rec.dataset.rec), customerName: rec.dataset.recName || undefined, due: Number(rec.dataset.recDue) || 0,
          onSaved: () => qc.invalidateQueries({ queryKey: ["payments-art"] }),
        })
        return
      }
      const tab = t.closest(".tab") as HTMLElement | null
      if (tab?.dataset.f) { savePref("tab:payments", tab.dataset.f); setFilter(tab.dataset.f); return }
      // empty-state "Sab dekhein" reset (a plain button, not a .tab)
      const reset = t.closest("[data-f]") as HTMLElement | null
      if (reset?.dataset.f) { savePref("tab:payments", reset.dataset.f); setFilter(reset.dataset.f) }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default PaymentsArtifact
