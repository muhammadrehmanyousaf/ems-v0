"use client"

/**
 * Holds — premium rebuild on the shared champagne shell.
 * Real provisional date-holds via VendorHoldsAPI.list / place / release. Hold a
 * slot before a booking is firm; each hold expires. Convert-linked holds show
 * their booking.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { VendorHoldsAPI, type VendorHold } from "@/lib/api/vendorHolds"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useArtifactShell, escHtml, initTablePager, errorBannerHtml, openDrawer, closeDrawer } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import { openBookingForm } from "@/components/dashboard/mainScreens/artifact/booking-form"

function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) }
function fmtTime(t?: string | null) { if (!t) return ""; const [h, m] = String(t).split(":").map(Number); if (Number.isNaN(h)) return String(t); const ap = h >= 12 ? "PM" : "AM"; return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${ap}` }
function expiresIn(s?: string | null) {
  if (!s) return { txt: "—", soon: false, gone: false }
  const ms = new Date(s).getTime() - Date.now(); if (isNaN(ms)) return { txt: "—", soon: false, gone: false }
  if (ms <= 0) return { txt: "khatam", soon: false, gone: true }
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000)
  return { txt: h >= 24 ? `${Math.floor(h / 24)} din mein` : h >= 1 ? `${h} ghante mein` : `${m} min mein`, soon: h < 6, gone: false }
}
const todayIso = () => new Date().toISOString().slice(0, 10)
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', cal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>', lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', open: '<path d="M7 7h10v10M7 17 17 7"/>', book: '<path d="M4 4h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 2v4M16 2v4M4 10h16"/><path d="M9 15l2 2 4-4"/>', renew: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
}

const EXTRA_CSS = String.raw`
.content{ max-width:860px; }
.hold-tiles{ display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:10px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:10px 13px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); } .tile.warn .t-val{ color:var(--warn); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:17px; font-weight:680; letter-spacing:-.02em; margin-top:4px; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.hold{ display:flex; align-items:center; gap:14px; padding:14px 16px; border-bottom:1px solid var(--border); } .hold:last-child{ border-bottom:0; } .hold.gone{ opacity:.55; }
.h-ic{ width:42px; height:42px; border-radius:11px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .h-ic svg{ width:20px; height:20px; }
.h-main{ flex:1; min-width:0; } .h-d{ font-weight:600; font-size:13.5px; } .h-t{ font-size:12px; color:var(--ink-3); margin-top:2px; }
.h-exp{ display:inline-flex; align-items:center; gap:5px; font-size:11.5px; font-weight:600; padding:3px 9px; border-radius:20px; background:var(--surface-3); color:var(--ink-2); } .h-exp svg{ width:12px; height:12px; } .h-exp.soon{ color:var(--warn); background:var(--warn-wash); } .h-exp.gone{ color:var(--ink-4); }
.iconbtn{ width:32px; height:32px; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-3); display:grid; place-items:center; } .iconbtn:hover{ background:var(--surface-3); color:var(--ink); } .iconbtn.bad:hover{ color:var(--bad); border-color:var(--bad); } .iconbtn.extend:hover{ color:var(--accent-ink); border-color:var(--accent-line); } .iconbtn svg{ width:15px; height:15px; }
.iconbtn.book{ width:auto; padding:0 11px; gap:6px; color:var(--accent-ink); border-color:var(--accent-line); background:var(--accent-wash); font-size:12px; font-weight:600; } .iconbtn.book:hover{ filter:brightness(.97); color:var(--accent-ink); }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
`

function holdFormBody(): string {
  return `
  <div class="dfield row2">
    <div><label class="dlabel">Kaunsi date <span class="req">*</span></label><input type="date" id="h-date" value="${todayIso()}"/></div>
    <div><label class="dlabel">Waqt <span class="req">*</span></label><input type="time" id="h-time" value="20:00"/></div>
  </div>
  <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Cancel</button><button class="btn btn-primary" type="button" id="h-save">Hold lagayein</button></div>`
}

function buildContent(list: VendorHold[]): string {
  const active = list.filter((h) => new Date(h.expiresAt).getTime() > Date.now())
  const soon = active.filter((h) => expiresIn(h.expiresAt).soon).length
  const tiles = `<div class="hold-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.lock, 1.8)} Active holds</div><div class="t-val tnum">${active.length}</div><div class="t-sub">roki hui dates</div></div>
    <div class="tile ${soon > 0 ? "warn" : ""}"><div class="t-cap">${svg(IC.clock, 1.8)} Jald khatam</div><div class="t-val tnum">${soon}</div><div class="t-sub">6 ghante ke andar</div></div>
  </div>`
  const rows = list.length ? `<div class="card" data-ww-list>${[...list].sort((a, b) => (a.holdDate || "").localeCompare(b.holdDate || "")).map((h) => {
    const ex = expiresIn(h.expiresAt)
    return `<div class="hold${ex.gone ? " gone" : ""}"><span class="h-ic">${svg(IC.cal, 1.8)}</span>
      <div class="h-main"><div class="h-d">${fmtDate(h.holdDate)}</div><div class="h-t">${fmtTime(h.holdTime)}${h.bookingId ? ` · Booking ban gayi #${h.bookingId}` : ""}</div></div>
      <span class="h-exp ${ex.soon ? "soon" : ""}${ex.gone ? " gone" : ""}">${svg(IC.clock)} ${escHtml(ex.txt)}</span>
      ${h.bookingId ? `<button class="iconbtn" data-nav-btn="/dashboard/bookings/${h.bookingId}" title="Booking">${svg(IC.open)}</button>` : `${ex.gone ? "" : `<button class="iconbtn book" data-hold-book data-hb-date="${escHtml(h.holdDate || "")}" data-hb-time="${escHtml(h.holdTime || "")}" data-hb-biz="${h.businessId}" title="Is date par pakki booking banayein">${svg(IC.book, 1.8)} Book karein</button>`}${ex.soon || ex.gone ? `<button class="iconbtn extend" data-hold-extend data-he-date="${escHtml(h.holdDate || "")}" data-he-time="${escHtml(h.holdTime || "")}" data-he-biz="${h.businessId}" title="Aur waqt rok lein — hold barha dein">${svg(IC.renew, 1.8)}</button>` : ""}<button class="iconbtn bad" data-release="${h.id}" title="Release">${svg(IC.x)}</button>`}</div>`
  }).join("")}</div>` : `<div class="card"><div class="empty">Abhi koi hold nahi. "Naya hold" se date rok lein.</div></div>`
  return `
  <div class="head"><div><h1>Holds</h1><div class="sub">Pakki booking se pehle date rok lein — thodi der ke liye slot mehfooz.</div></div><div class="head-actions"><button class="btn btn-primary" id="addbtn">${svg(IC.plus, 2.2)} Naya hold</button></div></div>
  ${tiles}${rows}
  <div class="foot">WeddingWala vendor console · Holds</div>`
}

export function HoldsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/holds", crumbBold: "Ops", crumbSub: "Holds", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const activeBusinessId = useActiveBusinessId()
  const bizRef = React.useRef(activeBusinessId); bizRef.current = activeBusinessId
  const { data, isError } = useQuery({ queryKey: ["holds-art", activeBusinessId], queryFn: () => VendorHoldsAPI.list(activeBusinessId ?? undefined) })
  const list = React.useMemo(() => (data ?? []) as VendorHold[], [data])

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Holds</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Holds load ho rahe hain…</div>`; return }
    wwc.innerHTML = buildContent(list)
    initTablePager(s, { rows: ".hold", pageSize: 15, noun: "holds" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const refetch = () => qc.invalidateQueries({ queryKey: ["holds-art", bizRef.current] })
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { refetch(); return }
      if (t.closest("#addbtn")) { openDrawer(s, "Naya hold", holdFormBody()); return }
      const bk = t.closest("[data-hold-book]") as HTMLElement | null
      if (bk) {
        const time = (bk.dataset.hbTime || "").slice(0, 5)
        openBookingForm(s, {
          prefill: { bookingDate: bk.dataset.hbDate || undefined, bookingTime: time || undefined, businessId: Number(bk.dataset.hbBiz) || bizRef.current || undefined },
          activeBiz: Number(bk.dataset.hbBiz) || bizRef.current || undefined,
          onSaved: () => { toast.success("Booking ban gayi — hold pakki ho gayi"); refetch() },
        })
        return
      }
      const ext = t.closest("[data-hold-extend]") as HTMLElement | null
      if (ext) {
        const date = ext.dataset.heDate
        const rawTime = ext.dataset.heTime || ""
        const time = rawTime.length === 5 ? rawTime + ":00" : rawTime
        if (!date || !time) { toast.error("Date aur waqt chunein"); return }
        const btn = ext as HTMLButtonElement; const o = btn.innerHTML; btn.disabled = true; btn.textContent = "…"
        try { await VendorHoldsAPI.place({ holdDate: date, holdTime: time, businessId: Number(ext.dataset.heBiz) || bizRef.current || undefined }); toast.success("Waqt barha diya — hold aur der ke liye mehfooz"); refetch() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Extend nahi hua"); btn.disabled = false; btn.innerHTML = o }
        return
      }
      const rel = t.closest("[data-release]") as HTMLElement | null
      if (rel?.dataset.release) { try { await VendorHoldsAPI.release(Number(rel.dataset.release)); toast.success("Hold hata diya"); refetch() } catch { toast.error("Nahi hua") } return }
      if (t.closest("#h-save")) {
        const date = (s.getElementById("h-date") as HTMLInputElement | null)?.value
        const time = (s.getElementById("h-time") as HTMLInputElement | null)?.value
        if (!date || !time) { toast.error("Date aur waqt chunein"); return }
        const btn = s.getElementById("h-save") as HTMLButtonElement | null; const o = btn?.innerHTML; if (btn) { btn.disabled = true; btn.textContent = "…" }
        try { const r = await VendorHoldsAPI.place({ holdDate: date, holdTime: time.length === 5 ? time + ":00" : time, businessId: bizRef.current ?? undefined }); toast.success(r.alreadyHeld ? "Ye slot pehle se roka hua tha" : "Hold lag gaya"); closeDrawer(s); refetch() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Ye slot pehle se booked/held hai"); if (btn) { btn.disabled = false; if (o != null) btn.innerHTML = o } }
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default HoldsArtifact
