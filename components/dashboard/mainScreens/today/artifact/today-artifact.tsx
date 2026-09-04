"use client"

/**
 * Today — premium rebuild on the shared champagne shell.
 * Real run-of-day via BookingTimelineAPI.today(businessId): today's events with
 * their run-sheet tasks, each task tickable via setStatus. WhatsApp/Call the
 * customer; open the booking.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { BookingTimelineAPI, type TodayResponse, type TodayEvent, type TimelineTask } from "@/lib/api/bookingTimeline"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { waDigits } from "@/components/dashboard/mainScreens/leads/artifact/leads-artifact"
import { receivedOn, isCancelledBooking } from "@/lib/utils/booking-money"
import { openRecordPaymentDrawer } from "@/components/dashboard/mainScreens/artifact/record-payment"
import { bookingStatusLabel } from "@/lib/booking-status-label"
import { useArtifactShell, pkNum, escHtml, initialsOf, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
function fmtTime(t?: string | null) { if (!t) return ""; const [h, m] = String(t).split(":").map(Number); if (Number.isNaN(h)) return String(t); const ap = h >= 12 ? "PM" : "AM"; return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${ap}` }
const bkTone = (s?: string) => { const v = (s || "").toLowerCase(); if (v.includes("confirm")) return "ok"; if (v.includes("complete")) return "info"; if (v.includes("cancel")) return "bad"; return "warn" }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  cal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>', check: '<path d="M20 6 9 17l-5-5"/>', wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20l1.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>', call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>', open: '<path d="M7 7h10v10M7 17 17 7"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
}

const EXTRA_CSS = String.raw`
.tday-tiles{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:16px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:10px 13px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:17px; font-weight:680; letter-spacing:-.02em; margin-top:4px; } .t-val .rs{ font-size:12px; color:var(--ink-3); font-weight:600; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.evgrid{ display:flex; flex-direction:column; gap:14px; }
.evcard{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); overflow:hidden; }
.ev-h{ display:flex; align-items:center; gap:12px; padding:14px 16px; border-bottom:1px solid var(--border); }
.ev-time{ text-align:center; flex:none; } .ev-time .t{ font-size:16px; font-weight:700; letter-spacing:-.02em; } .ev-time .a{ font-size:10px; color:var(--ink-3); text-transform:uppercase; }
.ev-main{ flex:1; min-width:0; } .ev-nm{ font-weight:600; font-size:14px; } .ev-sub{ font-size:11.5px; color:var(--ink-3); margin-top:1px; }
.ev-acts{ display:flex; gap:6px; align-items:center; }
.iconbtn{ width:32px; height:32px; flex:none; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; } .iconbtn:hover{ background:var(--surface-3); color:var(--ink); } .iconbtn.wa:hover{ color:var(--ok); border-color:var(--ok); } .iconbtn svg{ width:15px; height:15px; }
.ev-money{ display:flex; gap:20px; padding:10px 16px; border-bottom:1px solid var(--border); background:var(--surface-2); } .em-cap{ font-size:11px; color:var(--ink-3); } .em-val{ font-weight:660; font-size:14px; font-variant-numeric:tabular-nums; margin-top:1px; } .em-val.due{ color:var(--warn); }
.tasks{ padding:6px 8px 8px; }
.task{ display:flex; align-items:center; gap:11px; padding:8px 8px; border-radius:8px; } .task:hover{ background:var(--surface-3); }
.tk-box{ width:20px; height:20px; border-radius:6px; flex:none; display:grid; place-items:center; border:1.5px solid var(--border-2); color:transparent; cursor:pointer; } .tk-box svg{ width:12px; height:12px; } .task.done .tk-box{ background:var(--ok); border-color:transparent; color:#fff; }
.tk-time{ font-size:11.5px; font-weight:600; color:var(--ink-2); width:64px; flex:none; font-variant-numeric:tabular-nums; }
.tk-main{ flex:1; min-width:0; } .tk-lbl{ font-size:12.5px; font-weight:500; } .task.done .tk-lbl{ color:var(--ink-3); text-decoration:line-through; text-decoration-color:var(--border-2); } .tk-sub{ font-size:11px; color:var(--ink-3); }
.notasks{ padding:14px 16px; color:var(--ink-3); font-size:12px; }
.big-empty{ display:grid; place-items:center; padding:64px 16px; text-align:center; color:var(--ink-3); } .big-empty svg{ width:40px; height:40px; margin-bottom:12px; opacity:.5; } .big-empty .bt{ font-size:15px; font-weight:600; color:var(--ink-2); } .big-empty .bs{ font-size:12.5px; margin-top:4px; }
.big-empty .btn{ margin-top:16px; } .big-empty .btn svg{ width:16px; height:16px; margin:0; opacity:1; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:820px){ .tday-tiles{ grid-template-columns:1fr; } }
`

function taskHtml(t: TimelineTask): string {
  const done = t.status === "done"
  return `<div class="task${done ? " done" : ""}"><span class="tk-box" data-task="${t.id}" data-status="${t.status}">${svg(IC.check, 3)}</span>
    <span class="tk-time">${t.scheduledTime ? fmtTime(t.scheduledTime) : "—"}</span>
    <div class="tk-main"><div class="tk-lbl">${escHtml(t.label)}</div>${t.assignedTo ? `<div class="tk-sub">${escHtml(t.assignedTo)}</div>` : ""}</div></div>`
}

function eventCard(ev: TodayEvent): string {
  const b = ev.booking
  const name = b.customerName || "Customer"
  const phone = b.customerPhone || ""
  const done = ev.tasks.filter((t) => t.status === "done").length
  // Money-QA C7/C9/C8: the order snapshot (orderBalance) is FROZEN at order time
  // and never reflects a payment recorded AFTER it — so the door-side vendor was
  // shown a stale baqaya and could re-collect money already received. Derive live
  // baqaya from the reconciled receipts column (downPayment), matching every other
  // money surface: grand (renegotiated, if any) − received; cancelled owes nothing.
  const total = money(b.orderGrand ?? b.totalAmount)
  const balance = isCancelledBooking(b) ? 0 : Math.max(0, total - receivedOn(b))
  // Today is the single highest-value moment to collect baqaya — the customer is
  // AT the venue. Record it in place instead of forcing a trip to the detail.
  const recBtn = balance > 0 ? `<button class="iconbtn rec" data-rec="${b.id}" data-rec-name="${escHtml(name)}" data-rec-due="${Math.round(balance)}" title="Baqaya record karein">${svg(IC.wallet, 1.9)}</button>` : ""
  const acts = `<div class="ev-acts">${phone ? `<button class="iconbtn" data-tel="${escHtml(phone)}" title="Call">${svg(IC.call)}</button><button class="iconbtn wa" data-wa="${escHtml(phone)}" title="WhatsApp">${svg(IC.wa)}</button>` : ""}${recBtn}<button class="iconbtn" data-nav-btn="/dashboard/bookings/${b.id}" title="Kholein">${svg(IC.open)}</button></div>`
  const moneyRow = (b.orderGrand != null || b.totalAmount != null) ? `<div class="ev-money"><div><div class="em-cap">Kul</div><div class="em-val tnum"><span class="rs">Rs</span> ${pkNum(money(b.orderGrand ?? b.totalAmount))}</div></div>${balance > 0 ? `<div><div class="em-cap">Baqaya</div><div class="em-val due tnum"><span class="rs">Rs</span> ${pkNum(balance)}</div></div>` : ""}</div>` : ""
  const tasks = ev.tasks.length ? `<div class="tasks">${[...ev.tasks].sort((a, c) => (a.sortOrder - c.sortOrder) || (a.scheduledTime || "").localeCompare(c.scheduledTime || "")).map(taskHtml).join("")}</div>` : `<div class="notasks">Is event ke liye koi run-sheet task nahi.</div>`
  return `<div class="evcard">
    <div class="ev-h"><div class="ev-time"><div class="t">${b.bookingTime ? fmtTime(b.bookingTime).split(" ")[0] : "—"}</div><div class="a">${b.bookingTime ? fmtTime(b.bookingTime).split(" ")[1] || "" : ""}</div></div>
      <div class="ev-main"><div class="ev-nm">${escHtml(name)}</div><div class="ev-sub">#${b.id}${b.primaryBusiness?.name ? ` · ${escHtml(b.primaryBusiness.name)}` : ""}${ev.tasks.length ? ` · ${done}/${ev.tasks.length} tasks` : ""}</div></div>
      <span class="st ${bkTone(b.status)}"><i></i> ${escHtml(bookingStatusLabel(b))}</span>${acts}</div>
    ${moneyRow}${tasks}</div>`
}

function buildContent(d: TodayResponse): string {
  const events = d.events || []
  const totalVal = events.reduce((a, e) => a + money(e.booking.orderGrand ?? e.booking.totalAmount), 0)
  const pendingTasks = events.reduce((a, e) => a + e.tasks.filter((t) => t.status !== "done").length, 0)
  const dLabel = d.date ? new Date(d.date).toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" }) : new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })

  const tiles = `<div class="tday-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.cal, 1.8)} Aaj ke events</div><div class="t-val tnum">${events.length}</div><div class="t-sub">${escHtml(dLabel)}</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.wallet, 1.8)} Aaj ki value</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(totalVal)}</div><div class="t-sub">in events ki</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.list, 1.8)} Tasks baaki</div><div class="t-val tnum">${pendingTasks}</div><div class="t-sub">run-sheet mein</div></div>
  </div>`

  const body = events.length ? `<div class="evgrid">${events.map(eventCard).join("")}</div>` : `<div class="card"><div class="big-empty">${svg(IC.cal, 1.5)}<div class="bt">Aaj koi event nahi</div><div class="bs">Aaram ka din — ya aane wali bookings Calendar par dekhein.</div><button class="btn btn-primary" data-nav-btn="/dashboard/calendar">${svg(IC.cal, 1.9)} Calendar kholein</button></div></div>`

  return `
  <div class="head"><div><h1>Aaj</h1><div class="sub">${escHtml(dLabel)} — <b>${events.length}</b> events, <b>${pendingTasks}</b> tasks baaki.</div></div></div>
  ${tiles}${body}
  <div class="foot">WeddingWala vendor console · Aaj</div>`
}

export function TodayArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/today", crumbBold: "Ops", crumbSub: "Aaj ka din", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const activeBusinessId = useActiveBusinessId()
  const { data, isError } = useQuery({ queryKey: ["today-art", activeBusinessId], queryFn: () => BookingTimelineAPI.today(activeBusinessId) })

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Aaj</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Aaj ke events load ho rahe hain…</div>`; return }
    wwc.innerHTML = buildContent(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["today-art", activeBusinessId] }); return }
      const wa = t.closest("[data-wa]") as HTMLElement | null
      if (wa) { const p = waDigits(wa.dataset.wa); if (p) window.open(`https://wa.me/${p}`, "_blank", "noopener"); return }
      const tel = t.closest("[data-tel]") as HTMLElement | null
      if (tel?.dataset.tel) { window.location.href = `tel:${tel.dataset.tel.replace(/\s/g, "")}`; return }
      // record baqaya in place — the customer is at the venue today
      const rec = t.closest("[data-rec]") as HTMLElement | null
      if (rec?.dataset.rec) {
        openRecordPaymentDrawer(s, { bookingId: Number(rec.dataset.rec), customerName: rec.dataset.recName || undefined, due: Number(rec.dataset.recDue) || 0, onSaved: () => qc.invalidateQueries({ queryKey: ["today-art", activeBusinessId] }) })
        return
      }
      const tk = t.closest("[data-task]") as HTMLElement | null
      if (tk?.dataset.task) {
        const id = Number(tk.dataset.task); const cur = tk.dataset.status
        try { await BookingTimelineAPI.setStatus(id, cur === "done" ? "pending" : "done"); qc.invalidateQueries({ queryKey: ["today-art", activeBusinessId] }) } catch { toast.error("Nahi hua") }
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default TodayArtifact
