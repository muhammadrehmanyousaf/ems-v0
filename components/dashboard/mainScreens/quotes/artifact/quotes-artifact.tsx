"use client"

/**
 * Quote requests — premium rebuild on the shared champagne shell.
 *
 * Real customer↔vendor negotiation via QuotesAPI.listForBusiness + respond /
 * counter / accept (creates the booking) / decline. Status-filtered cards with
 * an inline responder so a vendor can send a price without leaving the row.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { QuotesAPI, SITE_VISIT_LABELS, type Quote, type QuoteStatus } from "@/lib/api/quotes"
import { useBusiness } from "@/context/BusinessContext"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useRouter } from "next/navigation"
import { waDigits } from "@/components/dashboard/mainScreens/leads/artifact/leads-artifact"
import { useArtifactShell, pkNum, escHtml, initialsOf, initTablePager, loadPref, savePref, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const STATUS_UI: Record<QuoteStatus, { label: string; tone: string }> = {
  inquiry: { label: "Naya", tone: "info" },
  quoted: { label: "Rate bheja", tone: "warn" },
  countered: { label: "Counter aaya", tone: "warn" },
  accepted: { label: "Jeeta", tone: "ok" },
  declined: { label: "Mana", tone: "bad" },
}
const su = (s: QuoteStatus) => STATUS_UI[s] || STATUS_UI.inquiry
const money = (v: string | number | null | undefined) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0 }
function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) }
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")

const IC = {
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20l1.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>',
  call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  users: '<path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>',
  cal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
}
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`

const EXTRA_CSS = String.raw`
.qgrid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:14px; }
.qcard{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); display:flex; flex-direction:column; }
.qc-h{ display:flex; align-items:center; gap:11px; padding:14px 15px 12px; }
.qc-id{ display:flex; align-items:center; gap:11px; flex:1; min-width:0; border-radius:9px; } .qc-id[data-nav-btn]:hover .qc-nm{ color:var(--accent); }
.qc-nm{ font-weight:600; font-size:13.5px; } .qc-ph{ font-size:11.5px; color:var(--ink-3); margin-top:1px; }
.qc-meta{ display:flex; gap:14px; padding:0 15px 12px; flex-wrap:wrap; }
.qm{ display:flex; align-items:center; gap:6px; font-size:12px; color:var(--ink-2); } .qm svg{ width:13px; height:13px; color:var(--ink-4); }
.qc-price{ display:flex; align-items:flex-end; justify-content:space-between; gap:10px; padding:12px 15px; margin:0 15px; border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
.qp-cap{ font-size:11px; color:var(--ink-3); } .qp-val{ font-size:19px; font-weight:680; letter-spacing:-.02em; margin-top:2px; } .qp-val .rs{ font-size:12px; color:var(--ink-3); font-weight:600; }
.qp-valid{ font-size:11px; color:var(--ink-3); text-align:right; } .qp-valid.exp{ color:var(--bad); }
.qc-acts{ display:flex; align-items:center; flex-wrap:wrap; gap:7px; row-gap:8px; padding:12px 15px; }
.iconbtn{ width:34px; height:34px; flex:none; border-radius:9px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; } .iconbtn:hover{ background:var(--surface-3); color:var(--ink); } .iconbtn.wa:hover{ color:var(--ok); border-color:var(--ok); } .iconbtn svg{ width:15px; height:15px; }
.qc-acts .sp{ flex:1; }
.qc-resp{ display:none; padding:0 15px 14px; } .qc-resp.on{ display:block; }
.qc-resp .rr{ display:flex; gap:8px; align-items:center; }
.qc-resp .suffix{ position:relative; flex:1; } .qc-resp .suffix input{ width:100%; border:1px solid var(--border-2); border-radius:9px; background:var(--surface-2); color:var(--ink); padding:9px 11px 9px 34px; font:inherit; font-size:13px; outline:none; } .qc-resp .suffix input:focus{ border-color:var(--accent); background:var(--surface); box-shadow:0 0 0 3px var(--accent-wash); }
.qc-resp .suffix .rs{ position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:12px; color:var(--ink-3); font-weight:600; }
.qc-resp .rhint{ font-size:11px; color:var(--ink-3); margin-top:7px; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
`

function quoteCard(q: Quote): string {
  const s = su(q.status)
  const name = q.customer?.fullName || "Customer"
  const phone = q.customer?.phoneNumber || ""
  const custDigits = phone.replace(/[^\d]/g, "")
  const custNav = custDigits ? ` data-nav-btn="/dashboard/customers/phone_${custDigits}" style="cursor:pointer"` : ""
  const price = money(q.quotedPrice)
  const expired = q.validUntil ? new Date(q.validUntil).getTime() < Date.now() : false
  const priceBlock = price > 0
    ? `<div><div class="qp-cap">${q.status === "countered" ? "Customer ka counter" : "Aapka rate"}${q.version ? ` · v${q.version}` : ""}</div><div class="qp-val tnum"><span class="rs">Rs</span> ${pkNum(price)}</div></div>`
    : `<div><div class="qp-cap">Rate maanga gaya</div><div class="qp-val" style="font-size:14px;color:var(--ink-3)">Abhi rate nahi bheja</div></div>`
  const validBlock = q.validUntil ? `<div class="qp-valid ${expired ? "exp" : ""}">${expired ? "Guzar gaya" : "Valid: " + fmtDate(q.validUntil)}</div>` : ""

  const acts = phone
    ? `<button class="iconbtn" data-tel="${escHtml(phone)}" title="Call">${svg(IC.call)}</button><button class="iconbtn wa" data-wa="${escHtml(phone)}" title="WhatsApp">${svg(IC.wa)}</button>`
    : ""
  let primary = ""
  if (q.status === "inquiry") primary = `<button class="btn btn-primary sm" data-resp="${q.id}">${svg(IC.send)} Rate bhejein</button>`
  else if (q.status === "quoted" || q.status === "countered") primary = `<button class="btn btn-ghost sm" data-resp="${q.id}">Naya rate</button><button class="btn btn-primary sm" data-accept="${q.id}">${svg(IC.check)} Accept</button>`
  else if (q.status === "accepted" && q.bookingId) primary = `<button class="btn btn-primary sm" data-nav-btn="/dashboard/bookings/${q.bookingId}">Booking dekhein</button>`

  const responder = (q.status !== "accepted" && q.status !== "declined")
    ? `<div class="qc-resp" id="resp-${q.id}"><div class="rr"><div class="suffix"><span class="rs">Rs</span><input type="number" id="price-${q.id}" placeholder="rate likhein"/></div>
        <button class="btn btn-primary sm" data-send="${q.id}">${svg(IC.send)} Bhejein</button>
        ${q.status !== "inquiry" ? `<button class="iconbtn" data-decline="${q.id}" title="Decline">${svg(IC.x)}</button>` : ""}</div>
        <div class="rhint">Customer ko rate bheja jaayega — wo accept ya counter kar sakta hai.</div></div>`
    : ""

  // Site visit (family walk-through) — status chip + one-click advance
  // (propose → confirm → complete). Sits alongside the price negotiation.
  const sv = q.siteVisitStatus
  const svSettled = q.status === "accepted" || q.status === "declined"
  const svLabel = sv ? `<span class="qm" title="Site visit">${svg(IC.clock)} ${escHtml(SITE_VISIT_LABELS[sv])}</span>` : ""
  let svBtn = ""
  if (!svSettled && sv !== "completed") {
    const nextAct = (!sv || sv === "declined") ? "propose" : sv === "proposed" ? "confirm" : "complete"
    const svTxt = nextAct === "propose" ? "Visit rakhein" : nextAct === "confirm" ? "Visit pakki karein" : "Visit ho gayi"
    const svIcon = nextAct === "propose" ? IC.clock : IC.check
    svBtn = `<button class="btn btn-ghost sm" data-visit="${q.id}" data-visit-act="${nextAct}">${svg(svIcon)} ${svTxt}</button>`
  }

  return `<div class="qcard">
    <div class="qc-h"><div class="qc-id"${custNav}><span class="ava">${escHtml(initialsOf(name))}</span><div style="flex:1;min-width:0"><div class="qc-nm">${escHtml(name)}</div><div class="qc-ph">${escHtml(phone || "—")}</div></div></div><span class="st ${s.tone}"><i></i> ${escHtml(s.label)}</span></div>
    <div class="qc-meta"><span class="qm">${svg(IC.cal)} ${escHtml(cap(q.eventType))}${q.deliveryDate ? " · " + fmtDate(q.deliveryDate) : ""}</span>${q.guestCount ? `<span class="qm">${svg(IC.users)} ~${q.guestCount} mehmaan</span>` : ""}</div>
    ${q.note ? `<div style="font-size:12px;color:var(--ink-2);background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin-bottom:2px;line-height:1.5">“${escHtml(q.note)}”</div>` : ""}
    <div class="qc-price">${priceBlock}${validBlock}</div>
    <div class="qc-acts">${acts}${svLabel}<span class="sp"></span>${svBtn}${primary}</div>
    ${responder}</div>`
}

function buildContent(quotes: Quote[], filter: string): string {
  const counts: Record<string, number> = { all: quotes.length }
  quotes.forEach((q) => { counts[q.status] = (counts[q.status] || 0) + 1 })
  const tab = (f: string, label: string, dot: string) => `<button class="tab${f === filter ? " on" : ""}" data-f="${f}">${dot ? `<span class="dot" style="background:${dot}"></span> ` : ""}${label} <span class="cnt">${counts[f] || 0}</span></button>`
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">
    <button class="tab${filter === "all" ? " on" : ""}" data-f="all">Sab <span class="cnt">${counts.all}</span></button>
    ${tab("inquiry", "Naye", "var(--info)")}${tab("quoted", "Rate bheja", "var(--warn)")}${tab("countered", "Counter", "var(--warn)")}${tab("accepted", "Jeete", "var(--ok)")}${tab("declined", "Mana", "var(--bad)")}
  </div></div>`
  const rows = quotes.filter((q) => filter === "all" || q.status === filter)
  const grid = rows.length ? `<div class="qgrid" data-ww-list>${rows.map(quoteCard).join("")}</div>` : `<div class="empty">Is category mein koi quote nahi.</div>`
  return `
  <div class="head"><div><h1>Quote requests</h1><div class="sub">Customers jinhone rate maanga — <b>${quotes.length}</b> total. Jaldi rate = zyada bookings.</div></div></div>
  ${toolbar}${grid}
  <div class="foot">WeddingWala vendor console · Quotes</div>`
}

export function QuotesArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/quotes", crumbBold: "Bechna", crumbSub: "Quote requests", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const router = useRouter()
  const { business } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizId = activeBusinessId ?? (business as { id?: number } | null)?.id ?? null
  const { data, isError } = useQuery({ queryKey: ["quotes-art", bizId], enabled: !!bizId, queryFn: () => QuotesAPI.listForBusiness(Number(bizId)) })
  const quotes = React.useMemo(() => (data ?? []) as Quote[], [data])
  const [filter, setFilter] = React.useState(() => loadPref("tab:quotes", "all"))

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!bizId) { wwc.innerHTML = `<div class="loadwrap">Pehle ek business select karein.</div>`; return }
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Quote requests</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Quotes load ho rahe hain…</div>`; return }
    wwc.innerHTML = buildContent(quotes, filter)
    initTablePager(s, { rows: ".qcard", pageSize: 12, noun: "quotes" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, filter, bizId, isError])

  const refetch = () => qc.invalidateQueries({ queryKey: ["quotes-art", bizId] })
  const api = React.useRef({ refetch })
  api.current = { refetch }
  const quotesRef = React.useRef(quotes); quotesRef.current = quotes

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { api.current.refetch(); return }
      const wa = t.closest("[data-wa]") as HTMLElement | null
      if (wa) { const p = waDigits(wa.dataset.wa); if (p) window.open(`https://wa.me/${p}`, "_blank", "noopener"); return }
      const tel = t.closest("[data-tel]") as HTMLElement | null
      if (tel?.dataset.tel) { window.location.href = `tel:${tel.dataset.tel.replace(/\s/g, "")}`; return }
      const tab = t.closest(".tab") as HTMLElement | null
      if (tab?.dataset.f) { savePref("tab:quotes", tab.dataset.f); setFilter(tab.dataset.f); return }
      const resp = t.closest("[data-resp]") as HTMLElement | null
      if (resp?.dataset.resp) { s.getElementById(`resp-${resp.dataset.resp}`)?.classList.toggle("on"); return }
      const send = t.closest("[data-send]") as HTMLElement | null
      if (send?.dataset.send) {
        const id = Number(send.dataset.send)
        const inp = s.getElementById(`price-${id}`) as HTMLInputElement | null
        const price = Number(inp?.value)
        if (!price || price <= 0) { toast.error("Sahi rate likhein"); return }
        const q = quotesRef.current.find((x) => x.id === id)
        const btn = send as HTMLButtonElement; const o = btn.innerHTML; btn.disabled = true; btn.textContent = "…"
        try {
          if (q?.status === "inquiry") await QuotesAPI.respond(id, price)
          else await QuotesAPI.counter(id, price)
          toast.success("Rate customer ko bhej diya"); api.current.refetch()
        } catch { toast.error("Nahi bheja — dobara koshish karein"); btn.disabled = false; btn.innerHTML = o }
        return
      }
      const acc = t.closest("[data-accept]") as HTMLElement | null
      if (acc?.dataset.accept) {
        const id = Number(acc.dataset.accept)
        const btn = acc as HTMLButtonElement; const o = btn.innerHTML; btn.disabled = true; btn.textContent = "…"
        try { const r = await QuotesAPI.accept(id); toast.success("Accept ho gaya — booking ban gayi"); api.current.refetch(); if (r?.bookingId) router.push(`/dashboard/bookings/${r.bookingId}`) }
        catch { toast.error("Accept nahi hua"); btn.disabled = false; btn.innerHTML = o }
        return
      }
      const dec = t.closest("[data-decline]") as HTMLElement | null
      if (dec?.dataset.decline) {
        const id = Number(dec.dataset.decline)
        const btn = dec as HTMLButtonElement; const o = btn.innerHTML; btn.disabled = true; btn.textContent = "…"
        try { await QuotesAPI.decline(id); toast.success("Quote decline kar diya"); api.current.refetch() }
        catch { toast.error("Nahi hua"); btn.disabled = false; btn.innerHTML = o }
        return
      }
      const visit = t.closest("[data-visit]") as HTMLElement | null
      if (visit?.dataset.visit) {
        const id = Number(visit.dataset.visit)
        const act = (visit.dataset.visitAct || "propose") as "propose" | "confirm" | "complete"
        let at: string | undefined
        if (act === "propose") { const d = new Date(); d.setDate(d.getDate() + 3); d.setHours(16, 0, 0, 0); at = d.toISOString() }
        const btn = visit as HTMLButtonElement; const o = btn.innerHTML; btn.disabled = true; btn.textContent = "…"
        try {
          await QuotesAPI.siteVisit(id, act, at)
          toast.success(act === "propose" ? "Visit propose kar diya — waqt WhatsApp par tay karein" : act === "confirm" ? "Visit pakki ho gayi" : "Visit mukammal")
          api.current.refetch()
        } catch { toast.error("Visit update nahi hua"); btn.disabled = false; btn.innerHTML = o }
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, quotes])

  return <div ref={hostRef} />
}

export default QuotesArtifact
