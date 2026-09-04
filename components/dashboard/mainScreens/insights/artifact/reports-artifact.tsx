"use client"

/**
 * Reports — pixel-faithful to the design sample (docs/design-samples/reports.html):
 * KPI row (bar sparklines) · gold revenue area chart (hover crosshair) ·
 * bookings-by-status bars · lead-source donut · monthly-bookings bars · halls
 * performance table. Hand-built SVG/CSS, wired to REAL analytics + leads through
 * the shared artifact shell.
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AnalyticsAPI } from "@/lib/api/analytics"
import { LeadAPI, type Lead, type LeadSource } from "@/lib/api/leads"
import { useFetchData } from "@/hooks/use-fetch-data"
import { useActiveBusinessId, useActiveBusinessStore } from "@/lib/store/active-business-store"
import type { BookingData } from "@/lib/dashboard-types"
import { useArtifactShell, pkNum, escHtml, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const num = (v: unknown) => (v == null ? 0 : Number(v) || 0)
const lakh = (v: number) => (v / 100000)
const statusTone = (s?: string) => { const v = (s || "").toLowerCase(); if (v.includes("confirm")) return "confirmed"; if (v.includes("complete")) return "done"; if (v.includes("cancel")) return "cancel"; return "pending" }
const SRC: Record<string, { label: string; color: string }> = {
  whatsapp: { label: "WhatsApp", color: "#3F7A55" }, instagram: { label: "Instagram", color: "#C4708A" }, referral: { label: "Referral", color: "#B8863B" },
  form_inquiry: { label: "Website", color: "#3F6FA6" }, in_app_chat: { label: "Chat", color: "#3F6FA6" }, manual_phone: { label: "Phone", color: "#8C857B" }, manual_walkin: { label: "Walk-in", color: "#8C857B" }, other: { label: "Other", color: "#8C857B" },
}

const EXTRA_CSS = String.raw`
.kpis{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:10px; }
@media (max-width:820px){ .kpis{ grid-template-columns:1fr 1fr; } } @media (max-width:520px){ .kpis{ grid-template-columns:1fr; } }
.kpi{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); padding:15px 16px; }
.kpi .l{ font-size:12px; color:var(--ink-3); font-weight:600; } .kpi .vrow{ display:flex; align-items:flex-end; justify-content:space-between; gap:10px; margin-top:9px; }
.kpi .v{ font-size:23px; font-weight:680; letter-spacing:-.02em; } .kpi .v .rs{ font-size:12.5px; color:var(--ink-3); font-weight:600; }
.kpi .spark{ display:flex; align-items:flex-end; gap:2px; height:26px; } .kpi .spark span{ width:4px; background:var(--accent-line); border-radius:1.5px; } .kpi .spark span.on{ background:var(--accent); }
.kpi .d{ font-size:11.5px; margin-top:8px; color:var(--ink-3); } .kpi .d .up{ color:var(--ok); font-weight:660; } .kpi .d .dn{ color:var(--bad); font-weight:660; }
.chart-card{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); padding:17px 18px 16px; position:relative; margin-bottom:14px; }
.cc-head{ margin-bottom:6px; } .cc-title{ font-size:14px; font-weight:600; } .cc-sub{ font-size:12px; color:var(--ink-3); margin-top:3px; } .cc-sub b{ color:var(--ink-2); font-weight:600; }
.grid2{ display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; } @media (max-width:900px){ .grid2{ grid-template-columns:1fr; } }
.rev-svg{ width:100%; height:auto; display:block; overflow:visible; } .rev-grid line{ stroke:var(--border); stroke-width:1; } .rev-lbl{ fill:var(--ink-3); font-size:10px; font-weight:500; }
.rev-line{ fill:none; stroke:var(--accent); stroke-width:2.2; stroke-linejoin:round; stroke-linecap:round; } .rev-end{ fill:var(--accent); stroke:var(--surface); stroke-width:2; }
.rev-cross{ stroke:var(--accent); stroke-width:1; stroke-dasharray:3 3; opacity:0; } .rev-dot{ fill:var(--surface); stroke:var(--accent); stroke-width:2.5; opacity:0; }
.ttip{ position:fixed; transform:translate(-50%,-118%); background:var(--ink); color:var(--surface); font-size:11.5px; font-weight:600; padding:6px 9px; border-radius:8px; white-space:nowrap; pointer-events:none; opacity:0; z-index:60; box-shadow:var(--shadow-md); } .ttip .tt-m{ opacity:.7; font-weight:500; font-size:10.5px; }
.fbars{ display:flex; flex-direction:column; gap:15px; margin-top:14px; } .fb-top{ display:flex; align-items:baseline; justify-content:space-between; margin-bottom:7px; } .fb-name{ display:inline-flex; align-items:center; gap:8px; font-size:12.5px; font-weight:500; color:var(--ink-2); } .fb-name i{ width:9px; height:9px; border-radius:3px; flex:none; } .fb-val{ font-size:12.5px; font-weight:660; font-variant-numeric:tabular-nums; } .fb-val small{ color:var(--ink-3); font-weight:500; margin-left:4px; } .fb-track{ height:9px; border-radius:5px; background:var(--surface-3); overflow:hidden; } .fb-fill{ height:100%; border-radius:5px; }
.donut-wrap{ display:flex; align-items:center; gap:20px; margin-top:12px; } .donut{ position:relative; width:132px; height:132px; flex:none; } .donut svg{ transform:rotate(-90deg); } .donut .d-center{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; } .donut .d-num{ font-size:22px; font-weight:680; letter-spacing:-.02em; } .donut .d-cap{ font-size:10.5px; color:var(--ink-3); }
.legend{ display:flex; flex-direction:column; gap:11px; flex:1; } .lg{ display:flex; align-items:center; gap:9px; font-size:12.5px; color:var(--ink-2); } .lg i{ width:9px; height:9px; border-radius:3px; flex:none; } .lg .lv{ margin-left:auto; font-weight:660; font-variant-numeric:tabular-nums; color:var(--ink); } .lg .lp{ color:var(--ink-3); font-weight:500; width:38px; text-align:right; font-variant-numeric:tabular-nums; }
.occ{ display:flex; align-items:flex-end; gap:7px; height:132px; margin-top:14px; } .occ-col{ flex:1; display:flex; flex-direction:column; align-items:center; gap:7px; height:100%; } .occ-track{ flex:1; width:100%; display:flex; align-items:flex-end; } .occ-fill{ width:100%; background:var(--accent-line); border-radius:5px 5px 2px 2px; } .occ-fill.on{ background:var(--accent); } .occ-lbl{ font-size:9.5px; color:var(--ink-3); font-weight:500; }
.htbl{ width:100%; border-collapse:collapse; margin-top:8px; } .htbl th{ text-align:left; font-size:10.5px; font-weight:600; color:var(--ink-3); text-transform:uppercase; letter-spacing:.03em; padding:8px 4px; border-bottom:1px solid var(--border); } .htbl th.r{ text-align:right; } .htbl td{ padding:11px 4px; border-bottom:1px solid var(--border); font-size:12.5px; } .htbl tr:last-child td{ border-bottom:0; } .htbl .hn{ font-weight:600; display:flex; align-items:center; gap:9px; } .htbl .hn i{ width:8px; height:8px; border-radius:3px; background:var(--accent); flex:none; } .htbl .r{ text-align:right; font-variant-numeric:tabular-nums; } .htbl .occp{ display:inline-flex; align-items:center; gap:7px; justify-content:flex-end; } .htbl .occp .mini{ width:46px; height:6px; border-radius:4px; background:var(--surface-3); overflow:hidden; } .htbl .occp .mini span{ display:block; height:100%; background:var(--accent); border-radius:4px; } .htbl .occp b{ font-weight:660; width:34px; text-align:right; }
.fbars>div[data-nav-btn]{ cursor:pointer; border-radius:8px; margin:0 -8px; padding:2px 8px; transition:background .12s; } .fbars>div[data-nav-btn]:hover{ background:var(--surface-2); }
.legend .lg[data-nav-btn]{ cursor:pointer; border-radius:7px; margin:0 -6px; padding:2px 6px; transition:background .12s; } .legend .lg[data-nav-btn]:hover{ background:var(--surface-2); }
.htbl .hn.pick{ cursor:pointer; transition:color .12s; } .htbl .hn.pick:hover{ color:var(--accent-ink); }
`

interface RData { revenue: number; bookings: number; avg: number; occ: number; series: { m: string; v: number }[]; monthly: { m: string; n: number }[]; statusMix: { key: string; label: string; count: number; color: string }[]; sources: { label: string; count: number; color: string }[]; halls: { name: string; businessId: number; bookings: number; revenue: number; occ: number | null }[] }

function spark(vals: number[]): string {
  if (vals.length < 2) return ""
  const max = Math.max(...vals, 1)
  return `<span class="spark">${vals.map((v, i) => `<span class="${i === vals.length - 1 ? "on" : ""}" style="height:${Math.max(12, Math.round((v / max) * 100))}%"></span>`).join("")}</span>`
}

// Halls-table CSV export — same shape as the shell's table exporter (UTF-8 BOM,
// temp anchor, revoke) so "Export" behaves consistently across the console.
function exportHallsCsv(halls: RData["halls"], name: string) {
  if (!halls.length) return
  const q = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`
  const lines = [["Hall", "Bookings", "Kamaai", "Occupancy"].map(q).join(",")]
  halls.forEach((h) => { lines.push([q(h.name), q(h.bookings), q(h.revenue), q(h.occ != null ? `${h.occ}%` : "—")].join(",")) })
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function buildContent(d: RData): string {
  const bkSeries = d.monthly.map((x) => x.n)
  const revSeries = d.series.map((x) => x.v)
  const kpis = `<div class="kpis">
    <div class="kpi"><div class="l">Kul kamaai (saal)</div><div class="vrow"><span class="v tnum"><span class="rs">Rs</span> ${pkNum(d.revenue)}</span>${spark(revSeries)}</div><div class="d">is saal received</div></div>
    <div class="kpi"><div class="l">Kul bookings</div><div class="vrow"><span class="v tnum">${d.bookings}</span>${spark(bkSeries)}</div><div class="d">is saal</div></div>
    <div class="kpi"><div class="l">Auosat vasooli</div><div class="vrow"><span class="v tnum"><span class="rs">Rs</span> ${pkNum(d.avg)}</span>${spark(revSeries)}</div><div class="d">per booking (mila hua)</div></div>
    <div class="kpi"><div class="l">Occupancy</div><div class="vrow"><span class="v tnum">${d.occ}%</span>${spark(bkSeries)}</div><div class="d">saal ke din booked</div></div>
  </div>`

  const chart = `<div class="chart-card"><div class="cc-head"><div class="cc-title">Kamaai ka trend</div><div class="cc-sub">Har mahine ki aamdani · kul <b>Rs ${pkNum(d.revenue)}</b></div></div><div class="rev-wrap" id="revWrap"><div class="ttip" id="revTip"><span class="tt-m" id="ttM"></span><br><span id="ttV"></span></div></div></div>`

  const smTotal = d.statusMix.reduce((s, x) => s + x.count, 0) || 1
  const smMax = Math.max(...d.statusMix.map((x) => x.count), 1)
  const bars = `<div class="chart-card"><div class="cc-head"><div class="cc-title">Bookings — status</div><div class="cc-sub">Kaun se status mein kitni — <b>${smTotal} bookings</b></div></div><div class="fbars">${d.statusMix.map((x) => `<div data-nav-btn="/dashboard/bookings?status=${encodeURIComponent(x.key)}" title="${escHtml(x.label)} bookings dekhein"><div class="fb-top"><span class="fb-name"><i style="background:${x.color}"></i>${escHtml(x.label)}</span><span class="fb-val tnum">${x.count}<small>${Math.round((x.count / smTotal) * 100)}%</small></span></div><div class="fb-track"><div class="fb-fill" style="width:${Math.round((x.count / smMax) * 100)}%;background:${x.color}"></div></div></div>`).join("")}</div></div>`

  const srcTotal = d.sources.reduce((s, x) => s + x.count, 0) || 1
  const R = 44, C = 2 * Math.PI * R; let off = 0
  const arcs = d.sources.map((x) => { const len = (x.count / srcTotal) * C; const a = `<circle cx="60" cy="60" r="${R}" fill="none" stroke="${x.color}" stroke-width="15" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"/>`; off += len; return a }).join("")
  const donut = `<div class="chart-card"><div class="cc-head"><div class="cc-title">Log kahan se aaye</div><div class="cc-sub">Lead ka zariya</div></div><div class="donut-wrap"><div class="donut"><svg viewBox="0 0 120 120" width="132" height="132">${arcs}</svg><div class="d-center"><span class="d-num tnum">${srcTotal}</span><span class="d-cap">leads</span></div></div><div class="legend">${d.sources.map((x) => `<div class="lg" data-nav-btn="/dashboard/leads" title="${escHtml(x.label)} se aaye leads dekhein"><i style="background:${x.color}"></i>${escHtml(x.label)}<span class="lv tnum">${x.count}</span><span class="lp">${Math.round((x.count / srcTotal) * 100)}%</span></div>`).join("")}</div></div></div>`

  const occMax = Math.max(...d.monthly.map((x) => x.n), 1)
  const occ = `<div class="chart-card"><div class="cc-head"><div class="cc-title">Har mahine bookings</div><div class="cc-sub">Saal bhar ka trend</div></div><div class="occ">${d.monthly.map((x, i) => `<div class="occ-col"><div class="occ-track"><div class="occ-fill ${i === d.monthly.length - 1 ? "on" : ""}" style="height:${Math.max(6, Math.round((x.n / occMax) * 100))}%"></div></div><div class="occ-lbl">${escHtml(x.m)}</div></div>`).join("")}</div></div>`

  const hallMax = Math.max(...d.halls.map((h) => h.revenue), 1)
  const halls = `<div class="chart-card"><div class="cc-head"><div class="cc-title">Halls ki kaarkardagi</div><div class="cc-sub">Kaunsa hall zyada kamaya</div></div><table class="htbl"><thead><tr><th>Hall</th><th class="r">Bookings</th><th class="r">Kamaai</th><th class="r">Occupancy</th></tr></thead><tbody>${d.halls.map((h) => `<tr><td><span class="hn pick" data-hall-biz="${h.businessId}" role="button" tabindex="0" title="${escHtml(h.name)} ki bookings dekhein"><i></i> ${escHtml(h.name)}</span></td><td class="r tnum">${h.bookings}</td><td class="r"><span style="color:var(--ink-3);font-weight:600;font-size:11px">Rs</span> ${pkNum(h.revenue)}</td><td class="r"><span class="occp">${h.occ != null ? `<span class="mini"><span style="width:${Math.min(100, h.occ)}%"></span></span><b>${h.occ}%</b>` : "<b>—</b>"}</span></td></tr>`).join("") || `<tr><td colspan="4" style="color:var(--ink-3);padding:16px 4px">Abhi koi data nahi.</td></tr>`}</tbody></table></div>`

  return `${kpis}${chart}<div class="grid2">${bars}${donut}</div><div class="grid2">${occ}${halls}</div>`
}

function drawChart(root: ShadowRoot, series: { m: string; v: number }[]) {
  const wrap = root.getElementById("revWrap"); if (!wrap) return
  const data = series.length >= 2 ? series : [{ m: "—", v: 0 }, { m: "—", v: 0 }]
  const W = 760, H = 240, padL = 44, padR = 14, padT = 14, padB = 26
  const iw = W - padL - padR, ih = H - padT - padB
  const max = Math.max(...data.map((d) => d.v), 1) * 1.1
  const x = (i: number) => padL + (i / (data.length - 1)) * iw
  const y = (v: number) => padT + (1 - v / max) * ih
  let line = "M" + data.map((d, i) => `${x(i).toFixed(1)} ${y(d.v).toFixed(1)}`).join(" L")
  const area = line + ` L${x(data.length - 1).toFixed(1)} ${padT + ih} L${x(0).toFixed(1)} ${padT + ih} Z`
  let grid = ""; [0, 0.5, 1].forEach((t) => { const yy = y(max * t); grid += `<line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}"/><text class="rev-lbl" x="${padL - 8}" y="${yy + 3}" text-anchor="end">${(max * t / 100000).toFixed(1)}L</text>` })
  let xl = ""; data.forEach((d, i) => { xl += `<text class="rev-lbl" x="${x(i)}" y="${H - 8}" text-anchor="middle">${escHtml(d.m)}</text>` })
  const li = data.length - 1
  const svg = `<svg class="rev-svg" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs><g class="rev-grid">${grid}</g>${xl}<path d="${area}" fill="url(#rg)"/><path class="rev-line" d="${line}"/><line class="rev-cross" id="cross" y1="${padT}" y2="${padT + ih}"/><circle class="rev-dot" id="dot" r="4.5"/><circle class="rev-end" cx="${x(li).toFixed(1)}" cy="${y(data[li].v).toFixed(1)}" r="4"/><rect id="hit" x="${padL}" y="${padT}" width="${iw}" height="${ih}" fill="transparent"/></svg>`
  const tip = wrap.querySelector("#revTip") as HTMLElement | null
  wrap.insertAdjacentHTML("afterbegin", svg)
  const el = wrap.querySelector("svg") as SVGSVGElement, hit = wrap.querySelector("#hit") as SVGRectElement, cross = wrap.querySelector("#cross") as SVGLineElement, dot = wrap.querySelector("#dot") as SVGCircleElement
  if (el && hit && tip) hit.addEventListener("mousemove", (e: MouseEvent) => {
    const r = el.getBoundingClientRect(); const sx = (e.clientX - r.left) / r.width * W
    let i = Math.round((sx - padL) / iw * (data.length - 1)); i = Math.max(0, Math.min(data.length - 1, i))
    cross.setAttribute("x1", String(x(i))); cross.setAttribute("x2", String(x(i))); cross.style.opacity = "1"
    dot.setAttribute("cx", String(x(i))); dot.setAttribute("cy", String(y(data[i].v))); dot.style.opacity = "1"
    tip.style.left = (r.left + x(i) / W * r.width) + "px"; tip.style.top = (r.top + y(data[i].v) / H * r.height) + "px"; tip.style.opacity = "1"
    const m = tip.querySelector("#ttM"); if (m) m.textContent = data[i].m
    const v = tip.querySelector("#ttV"); if (v) v.textContent = `Rs ${pkNum(data[i].v)}`
  })
  if (hit && tip) hit.addEventListener("mouseleave", () => { cross.style.opacity = "0"; dot.style.opacity = "0"; tip.style.opacity = "0" })
}

export function ReportsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/insights", crumbBold: "Reports", crumbSub: "Kaarobaar ka jaiza", extraCss: EXTRA_CSS })
  const qc = useQueryClient()
  const activeBusinessId = useActiveBusinessId()
  const kpiQ = useQuery({ queryKey: ["rep-kpi", activeBusinessId], queryFn: () => AnalyticsAPI.getDashboardKpis("this_year", undefined, undefined, activeBusinessId) })
  const revQ = useQuery({ queryKey: ["rep-rev"], queryFn: () => AnalyticsAPI.getRevenueTrends("this_year") })
  const bkTrQ = useQuery({ queryKey: ["rep-bk"], queryFn: () => AnalyticsAPI.getBookingTrends("this_year") })
  const bkdQ = useQuery({ queryKey: ["rep-bkd"], queryFn: () => AnalyticsAPI.getRevenueBreakdowns("this_year") })
  const leadsQ = useQuery({ queryKey: ["rep-leads"], queryFn: () => LeadAPI.list({}) })
  const isError = kpiQ.isError || revQ.isError || bkTrQ.isError || bkdQ.isError
  const { data: bkData } = useFetchData({ endpoint: "/api/v1/bookings", queryKey: ["rep-bookings"], Params: { page: 1, limit: 100 } })

  const d: RData = React.useMemo(() => {
    const k = kpiQ.data
    const revenue = num(k?.totalRevenue?.value), bookings = num(k?.totalBookings?.value)
    const byBiz = bkdQ.data?.byBusiness ?? []
    const bookedDays = byBiz.reduce((s, b) => s + num(b.bookedDays), 0), periodDays = byBiz.reduce((s, b) => s + num(b.periodDays), 0) || 365
    const occ = periodDays ? Math.round((bookedDays / periodDays) * 100) : 0
    const series = (revQ.data?.data ?? []).map((r) => ({ m: r.month.slice(0, 3), v: num(r.revenue) }))
    const monthly = (bkTrQ.data?.data ?? []).map((r) => ({ m: r.month.slice(0, 3), n: num(r.bookings) }))
    const rows: BookingData[] = bkData?.data?.data ?? []
    const smMap: Record<string, { label: string; count: number; color: string }> = { confirmed: { label: "Confirmed", count: 0, color: "#B8863B" }, pending: { label: "Pending", count: 0, color: "#3F6FA6" }, done: { label: "Ho gaya", count: 0, color: "#3F7A55" }, cancel: { label: "Cancelled", count: 0, color: "#A24845" } }
    rows.forEach((b) => { const t = statusTone(b.status); if (smMap[t]) smMap[t].count++ })
    const statusMix = Object.entries(smMap).filter(([, x]) => x.count > 0).map(([key, x]) => ({ key, ...x }))
    const srcMap: Record<string, { label: string; count: number; color: string }> = {}
    ;((leadsQ.data?.leads ?? []) as Lead[]).forEach((l) => { const s = (l.source || "other") as LeadSource; const meta = SRC[s] || SRC.other; if (!srcMap[meta.label]) srcMap[meta.label] = { label: meta.label, count: 0, color: meta.color }; srcMap[meta.label].count++ })
    const sources = Object.values(srcMap).sort((a, b) => b.count - a.count).slice(0, 5)
    const halls = [...byBiz].sort((a, b) => num(b.totalRevenue) - num(a.totalRevenue)).slice(0, 5).map((h) => ({ name: h.businessName, businessId: num(h.businessId), bookings: num(h.bookingCount), revenue: num(h.totalRevenue), occ: typeof h.occupancyPct === "number" ? h.occupancyPct : null }))
    return { revenue, bookings, avg: bookings ? Math.round(revenue / bookings) : 0, occ, series, monthly, statusMix, sources, halls }
  }, [kpiQ.data, revQ.data, bkTrQ.data, bkdQ.data, leadsQ.data, bkData])

  // Latest snapshots for the once-bound click listener below.
  const dRef = React.useRef(d); dRef.current = d
  const routerRef = React.useRef(router); routerRef.current = router
  const boundRef = React.useRef(false)

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const dl = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>`
    const head = `<div class="head"><div><h1>Reports</h1><div class="sub">Pichle 12 mahine ka jaiza — kamaai, bookings, aur kahan se log aaye.</div></div><div class="head-actions"><button class="btn btn-ghost" data-act="reports-export" title="Halls ki kaarkardagi CSV mein utaarein">${dl} Export</button></div></div>`
    const wwc = s.getElementById("wwc")
    if (wwc) {
      if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Reports</h1></div></div>${errorBannerHtml()}` }
      else { wwc.innerHTML = head + buildContent(d); drawChart(s, d.series) }
    }
    // Screen-local actions, bound once (delegated on the shadow root). Export
    // pulls the halls table to CSV; a hall name sets that venue active + jumps
    // to us hall ki bookings. Both use custom hooks the shell ignores.
    if (!boundRef.current) {
      boundRef.current = true
      s.addEventListener("click", (e) => {
        const t = e.target as HTMLElement
        if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["rep-kpi"] }); qc.invalidateQueries({ queryKey: ["rep-rev"] }); qc.invalidateQueries({ queryKey: ["rep-bk"] }); qc.invalidateQueries({ queryKey: ["rep-bkd"] }); qc.invalidateQueries({ queryKey: ["rep-leads"] }); return }
        if (t.closest('[data-act="reports-export"]')) { e.preventDefault(); exportHallsCsv(dRef.current.halls, "reports-halls"); return }
        const hall = t.closest("[data-hall-biz]") as HTMLElement | null
        if (hall) {
          e.preventDefault()
          const id = Number(hall.getAttribute("data-hall-biz"))
          if (Number.isFinite(id) && id > 0) useActiveBusinessStore.getState().setActiveBusinessId(id)
          routerRef.current.push("/dashboard/bookings")
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, kpiQ.data, revQ.data, bkTrQ.data, bkdQ.data, leadsQ.data, bkData, isError])

  return <div ref={hostRef} />
}

export default ReportsArtifact
