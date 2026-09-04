"use client"

/**
 * Customers — premium rebuild on the shared champagne shell.
 * Real customer book via CustomersAPI.getAll: searchable list with booking
 * counts, first/last booking, repeat-customer flag, and WhatsApp/Call. Rows
 * open the Customer-360 detail.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CustomersAPI, type ApiCustomer } from "@/lib/api/dashboard"
import { waDigits } from "@/components/dashboard/mainScreens/leads/artifact/leads-artifact"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useBusiness } from "@/context/BusinessContext"
import { useArtifactShell, escHtml, initialsOf, initTablePager, setPagerFilter, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import { openBookingForm } from "@/components/dashboard/mainScreens/artifact/booking-form"

function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20l1.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>',
  call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  users: '<path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>', repeat: '<path d="M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>', star: '<path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"/>',
}

const EXTRA_CSS = String.raw`
.cust-tiles{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:10px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:10px 13px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:17px; font-weight:680; letter-spacing:-.02em; margin-top:4px; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.repeat-badge{ display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:700; color:var(--accent-ink); background:var(--accent-wash); padding:1px 7px; border-radius:20px; } .repeat-badge svg{ width:11px; height:11px; }
.cust-acts{ display:flex; gap:6px; justify-content:flex-end; }
.iconbtn{ width:32px; height:32px; flex:none; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; } .iconbtn:hover{ background:var(--surface-3); color:var(--ink); } .iconbtn.wa:hover{ color:var(--ok); border-color:var(--ok); } .iconbtn svg{ width:15px; height:15px; } .iconbtn:disabled{ opacity:.4; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:820px){ .cust-tiles{ grid-template-columns:1fr; } }
`

function rowHtml(c: ApiCustomer): string {
  const name = c.name || "Customer"
  const phone = c.phone || ""
  const repeat = Number(c.total_booking) > 1
  const bookBtn = `<button class="iconbtn" data-cust-book data-cb-name="${escHtml(name)}" data-cb-phone="${escHtml(phone)}" data-cb-email="${escHtml(c.email || "")}" title="Nayi booking" aria-label="Nayi booking">${svg('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M12 13v4M10 15h4"/>', 1.9)}</button>`
  const telWa = phone
    ? `<button class="iconbtn" data-tel="${escHtml(phone)}" title="Call">${svg(IC.call)}</button><button class="iconbtn wa" data-wa="${escHtml(phone)}" title="WhatsApp">${svg(IC.wa)}</button>`
    : `<button class="iconbtn" disabled>${svg(IC.call)}</button>`
  const acts = `<div class="cust-acts">${telWa}${bookBtn}</div>`
  const key = `${(name).toLowerCase()} ${phone} ${(c.email || "").toLowerCase()}`
  // getProfile resolves by phone (not the email that _id carries), so prefer a
  // phone-based route when a number exists; fall back to _id (email/offline).
  const navId = phone ? `phone_${phone.replace(/[^\d]/g, "")}` : encodeURIComponent(c._id)
  return `<tr data-key="${escHtml(key)}">
    <td><div class="c-couple" data-nav-btn="/dashboard/customers/${navId}" style="cursor:pointer"><span class="ava">${escHtml(initialsOf(name))}</span><div><div class="cc-nm">${escHtml(name)}${repeat ? ` <span class="repeat-badge">${svg(IC.repeat, 2.4)} Repeat</span>` : ""}</div><div class="cc-ev">${escHtml(c.email || "—")}${(c as { address?: string }).address ? ` · ${escHtml((c as { address?: string }).address as string)}` : ""}</div></div></div></td>
    <td class="td-mut tnum">${escHtml(phone || "—")}</td>
    <td class="td-guests tnum">${Number(c.total_booking) || 0}</td>
    <td class="td-date">${fmtDate(c.first_booking)}</td>
    <td class="td-date">${fmtDate(c.last_booking)}</td>
    <td>${acts}</td>
  </tr>`
}

/** Booking-create form prefilled from a known customer (name/phone/email). */
function buildContent(list: ApiCustomer[]): string {
  const repeatCount = list.filter((c) => Number(c.total_booking) > 1).length
  const now = new Date(); const mo = now.getMonth(); const yr = now.getFullYear()
  const newThisMonth = list.filter((c) => { const d = c.first_booking ? new Date(c.first_booking) : null; return d && !isNaN(d.getTime()) && d.getMonth() === mo && d.getFullYear() === yr }).length
  const tiles = `<div class="cust-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.users, 1.9)} Kul customers</div><div class="t-val tnum">${list.length}</div><div class="t-sub">aapke customer book mein</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.repeat, 1.9)} Repeat customers</div><div class="t-val tnum">${repeatCount}</div><div class="t-sub">${list.length ? Math.round((repeatCount / list.length) * 100) : 0}% dobara aaye</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.star, 1.9)} Naye is mahine</div><div class="t-val tnum">${newThisMonth}</div><div class="t-sub">${now.toLocaleDateString("en-PK", { month: "long" })}</div></div>
  </div>`
  const toolbar = `<div class="toolbar"><div class="filters" style="margin-left:0;width:100%"><label class="f-search" style="width:100%;max-width:340px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><input id="csearch" placeholder="Naam, number ya email dhoondein…"/></label></div></div>`
  const body = list.map(rowHtml).join("")
  return `
  <div class="head"><div><h1>Customers</h1><div class="sub">Aapka customer book — <b>${list.length}</b> log, <b>${repeatCount}</b> repeat.</div></div><div class="head-actions"><button class="btn btn-primary" data-cust-book>+ Nayi booking</button></div></div>
  ${tiles}${toolbar}
  <div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Customer</th><th>Phone</th><th>Bookings</th><th>Pehli</th><th>Aakhri</th><th></th></tr></thead>
    <tbody id="ctbody">${body}</tbody></table></div>
    ${list.length ? `<div class="tbl-foot"><span id="crc">${list.length} customers</span></div>` : `<div class="empty">Abhi koi customer nahi.<div style="margin-top:12px"><button class="btn btn-primary" data-cust-book>+ Pehli booking banayein</button></div></div>`}</div>
  <div class="foot">WeddingWala vendor console · Customers</div>`
}

export function CustomersArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/customers", crumbBold: "Log", crumbSub: "Customers", extraCss: EXTRA_CSS,
  })
  const { data, isError } = useQuery({ queryKey: ["customers-art"], queryFn: () => CustomersAPI.getAll(1, 200) })
  const list = React.useMemo(() => (data?.customers ?? []) as ApiCustomer[], [data])
  const qc = useQueryClient()
  const { business, businesses } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizRef = React.useRef<number | null>(null)
  bizRef.current = activeBusinessId ?? (business as { id?: number } | null)?.id ?? null
  const bizList = React.useMemo(() => ((businesses ?? []) as { id: number; name?: string | null }[]).map((b) => ({ id: b.id, name: b.name })), [businesses])
  const bizListRef = React.useRef(bizList); bizListRef.current = bizList

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Customers</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Customers load ho rahe hain…</div>`; return }
    wwc.innerHTML = buildContent(list)
    initTablePager(s, { pageSize: 25, noun: "customers" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const val = (id: string) => (s.getElementById(id) as HTMLInputElement | null)?.value?.trim() ?? ""
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["customers-art"] }); return }
      const wa = t.closest("[data-wa]") as HTMLElement | null
      if (wa) { e.stopPropagation(); const p = waDigits(wa.dataset.wa); if (p) window.open(`https://wa.me/${p}`, "_blank", "noopener"); return }
      const tel = t.closest("[data-tel]") as HTMLElement | null
      if (tel?.dataset.tel) { e.stopPropagation(); window.location.href = `tel:${tel.dataset.tel.replace(/\s/g, "")}`; return }
      // customer → new booking — shared BookingForm, prefilled
      const cbk = t.closest("[data-cust-book]") as HTMLElement | null
      if (cbk) { e.stopPropagation(); openBookingForm(s, { prefill: { customerName: cbk.dataset.cbName || undefined, customerPhone: cbk.dataset.cbPhone || undefined, customerEmail: cbk.dataset.cbEmail || undefined }, businesses: bizListRef.current, activeBiz: bizRef.current, onSaved: () => qc.invalidateQueries({ queryKey: ["customers-art"] }) }); return }
    })
    s.addEventListener("input", (e) => {
      const t = e.target as HTMLElement
      if (t.id !== "csearch") return
      const q = (t as HTMLInputElement).value.trim().toLowerCase()
      // route the custom name/phone/email search through the shared paginator
      setPagerFilter(s, (tr) => !q || (tr.dataset.key || "").includes(q))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default CustomersArtifact
