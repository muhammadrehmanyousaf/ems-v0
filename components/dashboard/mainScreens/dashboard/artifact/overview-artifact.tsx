"use client"

/**
 * OverviewArtifact — the vendor dashboard, pixel-faithful to the approved
 * design sample (docs/design-samples/vendor-dashboard.html) AND wired to the
 * real backend.
 *
 * The sample's CSS + shell live in a Shadow DOM so its generic class names
 * cannot collide with the app's global styles. The content is rebuilt from live
 * data (KPIs, revenue trend, occupancy, upcoming events, leads, profile
 * completeness) whenever a query resolves. Nav uses client routing; theme
 * follows the active dashboard theme; the sidebar shows the real business/user.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useUser } from "@/context/UserContext"
import { useBusiness } from "@/context/BusinessContext"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useArtifactShell } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import { AnalyticsAPI } from "@/lib/api/analytics"
import { BusinessesAPI, ReviewsAPI } from "@/lib/api/dashboard"
import { LeadAPI, type Lead } from "@/lib/api/leads"
import { CompletenessAPI, type BusinessCompleteness } from "@/lib/api/completeness"
import { listRefundObligations } from "@/lib/api/bookingOrder"

/* ── helpers ─────────────────────────────────────────────────── */
const n = (v: unknown) => (v == null ? 0 : Number(v) || 0)
// Pakistani digit grouping: 18,45,000 (2,2,3).
function pkNum(v: number): string {
  const s = Math.round(Math.abs(v)).toString()
  if (s.length <= 3) return (v < 0 ? "-" : "") + s
  const last3 = s.slice(-3)
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")
  return (v < 0 ? "-" : "") + rest + "," + last3
}
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string))
const initials = (s?: string | null) =>
  (s || "?").trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?"
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
function shortDate(s?: string | null): string {
  if (!s) return "—"
  const d = new Date(s)
  if (isNaN(d.getTime())) return String(s)
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" })
}
function relDays(s?: string | null): string {
  if (!s) return ""
  const d = new Date(s).getTime()
  if (isNaN(d)) return ""
  const days = Math.floor((Date.now() - d) / 86400000)
  if (days <= 0) return "aaj"
  if (days === 1) return "1 din"
  return `${days} din`
}
const bookingTone = (s?: string) => {
  const v = (s || "").toLowerCase()
  if (v.includes("confirm")) return "ok"
  if (v.includes("complete")) return "info"
  if (v.includes("cancel")) return "bad"
  return "warn"
}
/**
 * Payment progress from the AMOUNT columns, never the paymentStatus flag. The
 * flag is unreliable (a Pending booking can hold a real advance — see
 * booking-money.ts), so the old flag-based bar fabricated a hard-coded 55% for
 * "Partial" and showed 0% "Advance ka intezar" on bookings that were part-paid.
 * When the endpoint hasn't sent `downPayment` yet, we show NO bar rather than
 * guess — honesty over a fabricated number.
 */
const payMeta = (b: { totalAmount?: number | string | null; downPayment?: number | string | null; status?: string }): { show: boolean; pct: number; zero: boolean; cap: string } => {
  const total = n(b.totalAmount)
  if (b.downPayment == null || total <= 0) return { show: false, pct: 0, zero: true, cap: "" }
  const cancelled = /cancel|refund/.test((b.status || "").toLowerCase())
  const paid = Math.max(0, n(b.downPayment))
  if (cancelled) return { show: true, pct: 0, zero: true, cap: paid > 0 ? "Cancel · refund dena hai" : "Cancel" }
  const pct = Math.min(100, Math.round((paid / total) * 100))
  const cap = paid >= total - 1 ? "Poora mila" : paid > 0 ? `Rs ${pkNum(paid)} aaya` : "Advance baaqi"
  return { show: true, pct, zero: paid <= 0, cap }
}

/* ── data model the content builder consumes ─────────────────── */
interface EventRow { id: number; ini: string; title: string; tone: string; toneLabel: string; date: string; amount: number; payShow: boolean; payPct: number; payZero: boolean; payCap: string }
interface LeadRow { id: number; ini: string; name: string; ageLabel: string; ageTone: string; meta: string }
interface ArtData {
  loading: boolean
  moneyErr: boolean
  kpis: { bookings: number; bookingsDelta: number; revenue: number; revenueDelta: number; due: number; upcoming: number }
  series: { m: string; v: number }[] // revenue in lakh
  bookingSeries: number[]
  foot: { total: number; avg: number; best: string }
  occ: { pct: number; bookedDays: number; emptyDays: number }
  events: EventRow[]
  leads: LeadRow[]
  profile: { score: number; title: string; body: string; items: { label: string; pts: number }[]; remaining: number } | null
  rating: { avg: number; count: number; newThisMonth: number; quote: string; by: string; avatars: string[] } | null
  wapsi: { total: number; rows: { id: number; booking: number; amount: number; disputed: boolean; days: number }[]; oldestDays: number; oldestBooking: number } | null
}

/* ── content HTML built from live data ───────────────────────── */
function chip(delta: number): string {
  if (!isFinite(delta) || delta === 0) return `<span class="chip">—</span>`
  const up = delta > 0
  return `<span class="chip ${up ? "up" : "down"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="${up ? "M7 17 17 7M17 7H8M17 7v9" : "M7 7 17 17M17 17H8M17 17V8"}"/></svg> ${Math.abs(Math.round(delta))}%</span>`
}
function kpiCard(label: string, valHtml: string, note: string, k: number, chipHtml: string, href?: string): string {
  return `<div class="kpi"${href ? ` data-nav-btn="${href}"` : ""}><div class="k-row"><span class="k-label">${esc(label)}</span>${chipHtml}</div><div class="k-val tnum">${valHtml}</div><div class="k-note">${esc(note)}</div><svg class="k-spark" data-k="${k}" aria-hidden="true"></svg></div>`
}
const guestSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/></svg>`
const calSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg>`
const chevSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 6l6 6-6 6"/></svg>`
const clockSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`

function eventRowHtml(e: EventRow, i: number): string {
  const bar = !e.payShow ? "" : e.payZero ? `<div class="paybar"><span class="zero"></span></div>` : `<div class="paybar"><span style="width:${e.payPct}%"></span></div>`
  const capHtml = e.payShow ? `<div class="pay-cap">${esc(e.payCap)}</div>` : ""
  return `<div class="row${i === 0 ? " hl today" : ""}"${e.id ? ` data-nav-btn="/dashboard/bookings/${e.id}"` : ""}><span class="ava" aria-hidden="true">${esc(e.ini)}</span><div class="r-main"><div class="r-title">${esc(e.title)} <span class="st ${e.tone}"><i></i> ${esc(e.toneLabel)}</span></div><div class="r-meta"><span class="mi">${calSvg} ${esc(e.date)}</span></div>${bar}${capHtml}</div><div class="r-amt"><div class="a-val tnum">Rs ${pkNum(e.amount)}</div></div></div>`
}
function leadRowHtml(l: LeadRow): string {
  return `<div class="row"><span class="ava" aria-hidden="true">${esc(l.ini)}</span><div class="r-main"><div class="r-title">${esc(l.name)} <span class="st ${l.ageTone}"><i></i> ${esc(l.ageLabel)}</span></div><div class="r-meta"><span class="mi">${esc(l.meta)}</span></div></div><button class="btn btn-ghost sm" data-nav-btn="${l.id ? `/dashboard/leads/${l.id}` : "/dashboard/leads"}">Jawab dein</button></div>`
}
function ratingCard(r: ArtData["rating"]): string {
  if (!r || !r.count) {
    return `<div class="card" style="flex:1"><div class="card-h"><div><h2>Aapki rating</h2></div></div><div class="rev-body"><div style="color:var(--ink-3);font-size:12.5px">Abhi koi review nahi — pehli booking complete hone par customers rate karenge.</div></div></div>`
  }
  const full = Math.max(0, Math.min(5, Math.round(r.avg)))
  const stars = "★".repeat(full) + "☆".repeat(5 - full)
  const avatars = r.avatars.length
    ? `<div class="rev-avatars" aria-hidden="true">${r.avatars.map((a) => `<span>${esc(a)}</span>`).join("")}</div>`
    : ""
  const quote = r.quote
    ? `<div class="rev-quote">${avatars}<p>&ldquo;${esc(r.quote)}&rdquo;</p>${r.by ? `<div class="rev-by">— ${esc(r.by)}</div>` : ""}</div>`
    : ""
  return `<div class="card" style="flex:1"><div class="card-h"><div><h2>Aapki rating</h2></div><span class="st ok"><i></i> Verified</span></div>
    <div class="rev-body"><div class="rev-score"><div class="rev-num tnum">${r.avg.toFixed(1)}</div>
      <div><div class="stars" aria-label="${r.avg.toFixed(1)} out of 5">${stars}</div><div class="rev-cap">${r.count} reviews${r.newThisMonth ? ` · iss mahine <b>${r.newThisMonth} naye</b>` : ""}</div></div></div>
      ${quote}</div></div>`
}
function wapsiCard(w: ArtData["wapsi"]): string {
  const head = `<div class="card-h"><div><h2>Wapsi — jo dena hai</h2><div class="sub">Cancel hui bookings ke refund</div></div><a class="link" data-nav href="/dashboard/receivables">Khata ${chevSvg}</a></div>`
  if (!w || !w.rows.length) {
    return `<div class="card">${head}<div class="list"><div class="row"><div class="r-main"><div class="r-meta">Koi wapsi baaki nahi — sab settle. 🎉</div></div></div></div></div>`
  }
  const rows = w.rows.map((o) => {
    const badge = o.disputed ? `<span class="st bad"><i></i> Nahi mila</span>` : `<span class="st warn"><i></i> Dena hai</span>`
    const meta = o.disputed
      ? `<span class="mi">Customer kehta hai paisa nahi aya</span><span class="mi">· ${o.days} din se atka</span>`
      : `<span class="mi">Refund tay hua — abhi diya nahi</span><span class="mi">· ${o.days} din</span>`
    const cap = o.disputed ? "proof bhejein" : "aaj settle karein"
    return `<div class="row${o.disputed ? " hl urgent" : ""}" data-nav-btn="/dashboard/bookings/${o.booking}"><span class="ava" aria-hidden="true">${o.booking}</span>
      <div class="r-main"><div class="r-title">Booking #${o.booking} ${badge}</div><div class="r-meta">${meta}</div></div>
      <div class="r-amt"><div class="a-val tnum">Rs ${pkNum(o.amount)}</div><div class="a-cap due">${cap}</div></div></div>`
  }).join("")
  const foot = `<div style="margin-top:auto;padding:11px 16px;border-top:1px solid var(--border);display:flex;align-items:center;gap:7px;font-size:12px;color:var(--ink-3)">${clockSvg} Sabse purani <b style="color:var(--bad);font-weight:600">${w.oldestDays} din</b> se pending${w.oldestBooking ? ` · pehle <b style="color:var(--ink);font-weight:600">#${w.oldestBooking}</b> suljhayein` : ""}</div>`
  return `<div class="card">${head}<div class="owe"><span class="o-cap">Kul baqaya wapsi</span><span class="o-val tnum">Rs ${pkNum(w.total)}</span></div><div class="list">${rows}</div>${foot}</div>`
}

function buildContent(d: ArtData, greeting: string, todayStr: string): string {
  const k = d.kpis
  const dash = (x: string) => (d.moneyErr ? "—" : x)
  const kpiRow = `<section class="kpis" aria-label="Key figures">
    ${kpiCard("Is mahine bookings", dash(String(k.bookings)), "is saal", 0, chip(k.bookingsDelta))}
    ${kpiCard("Khata — aya paisa", dash(`<span class="rs">Rs</span>${pkNum(k.revenue)}`), "is saal received", 1, chip(k.revenueDelta))}
    ${kpiCard("Baqaya — vasool karna", dash(`<span class="rs">Rs</span>${pkNum(k.due)}`), "abhi tak pending", 2, `<span class="chip">chase</span>`, "/dashboard/receivables")}
    ${kpiCard("Aane wale (7 din)", dash(String(k.upcoming)), "agle hafte ki bookings", 3, `<span class="chip">7d</span>`, "/dashboard/calendar")}
  </section>`

  const chartFoot = `<div class="chart-foot"><div><span class="cf-cap">Kul is saal</span><span class="cf-val tnum"><span class="rs">Rs</span> ${pkNum(d.foot.total)}</span></div><div><span class="cf-cap">Ausat / mahina</span><span class="cf-val tnum"><span class="rs">Rs</span> ${pkNum(d.foot.avg)}</span></div><div><span class="cf-cap">Sab se acha</span><span class="cf-val tnum">${esc(d.foot.best)}</span></div></div>`

  const off = (263.9 * (1 - Math.max(0, Math.min(100, d.occ.pct)) / 100)).toFixed(1)
  const occCard = `<div class="card"><div class="card-h"><div><h2>Saal ki occupancy</h2></div><a class="link" data-nav href="/dashboard/calendar">Calendar ${chevSvg}</a></div><div class="occ-in"><div class="ring"><svg width="104" height="104" viewBox="0 0 104 104"><circle cx="52" cy="52" r="42" fill="none" stroke="var(--surface-3)" stroke-width="10"/><circle cx="52" cy="52" r="42" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round" stroke-dasharray="263.9" stroke-dashoffset="${off}" transform="rotate(-90 52 52)"/></svg><div class="r-mid"><div><div class="r-pct tnum">${Math.round(d.occ.pct)}%</div><div class="r-cap">booked</div></div></div></div><div class="occ-legend"><div class="occ-row"><span class="ol"><i style="background:var(--accent)"></i> Booked</span><b class="tnum">${d.occ.bookedDays} din</b></div><div class="occ-row"><span class="ol"><i style="background:var(--border-2)"></i> Khaali</span><b class="tnum">${d.occ.emptyDays} din</b></div></div></div></div>`

  // Profile completion (replaces the sample's marketing "plan" card).
  let profileCard = ""
  if (d.profile) {
    const p = d.profile
    const pOff = (263.9 * (1 - Math.max(0, Math.min(100, p.score)) / 100)).toFixed(1)
    const feats = p.items.map((it) => `<div class="f"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg> ${esc(it.label)}${it.pts ? ` <span style="color:var(--ink-3);font-weight:500">+${it.pts}</span>` : ""}</div>`).join("")
    profileCard = `<div class="card"><div class="card-h"><div><h2>Profile mukammal karein</h2><div class="sub">Jitna poora, utni zyada bookings</div></div><span class="st ${p.score >= 70 ? "ok" : "warn"}"><i></i> ${p.score}/100</span></div><div class="occ-in"><div class="ring" style="width:88px;height:88px"><svg width="88" height="88" viewBox="0 0 104 104"><circle cx="52" cy="52" r="42" fill="none" stroke="var(--surface-3)" stroke-width="10"/><circle cx="52" cy="52" r="42" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round" stroke-dasharray="263.9" stroke-dashoffset="${pOff}" transform="rotate(-90 52 52)"/></svg><div class="r-mid"><div><div class="r-pct tnum" style="font-size:19px">${p.score}</div><div class="r-cap">of 100</div></div></div></div><div class="occ-legend"><div style="font-weight:600;font-size:13px;margin-bottom:2px">${esc(p.title)}</div><div style="font-size:12px;color:var(--ink-3);line-height:1.5">${esc(p.body)}</div></div></div><div class="plan-in" style="padding-top:0"><div class="plan-feats">${feats}</div><button class="btn btn-primary" style="width:100%" data-nav-btn="/dashboard/settings">${p.remaining > 0 ? `${p.remaining} aur cheezein poori karein` : "Settings kholein"}</button></div></div>`
  }

  const eventsList = d.events.length
    ? d.events.map((e, i) => eventRowHtml(e, i)).join("")
    : `<div class="row"><div class="r-main"><div class="r-meta">Abhi koi aane wali booking nahi.</div></div></div>`
  const leadsList = d.leads.length
    ? d.leads.map(leadRowHtml).join("")
    : `<div class="row"><div class="r-main"><div class="r-meta">Abhi koi nayi puchh-gichh nahi.</div></div></div>`

  return `
  <div class="head"><div><h1>${esc(greeting)}</h1><div class="sub">${esc(todayStr)} — aaj ki suraat-e-haal</div></div><div class="head-actions"><button class="btn btn-ghost" data-nav-btn="/dashboard/calendar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg> Calendar</button><button class="btn btn-primary" data-nav-btn="/dashboard/bookings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg> Nayi booking</button></div></div>
  ${d.moneyErr ? `<div style="margin-bottom:12px;padding:11px 13px;border-radius:9px;border:1px solid var(--bad);background:var(--bad-wash);color:var(--bad);font-size:12.5px;font-weight:600">Figures load nahi ho sake — neeche ke number missing hain, zero nahi. Account mein kuch nahi badla.</div>` : ""}
  ${kpiRow}
  <section class="grid-main">
    <div class="card">
      <div class="card-h"><div><h2>Revenue</h2><div class="sub">Khata mein aya paisa · Rs lakh</div></div><div class="seg" role="group" aria-label="Time range"><button data-range="3">3M</button><button data-range="6">6M</button><button data-range="12">1Y</button></div></div>
      <div class="chart-wrap" id="areaWrap"></div>
      ${chartFoot}
    </div>
    <div class="rail-col">
      ${occCard}
      ${ratingCard(d.rating)}
    </div>
  </section>
  <section class="grid-half">
    <div class="card">
      <div class="card-h"><div><h2>Aane wale events</h2><div class="sub">Aapki bookings</div></div><a class="link" data-nav href="/dashboard/bookings">Sab dekhein ${chevSvg}</a></div>
      <div class="list">${eventsList}</div>
    </div>
    ${wapsiCard(d.wapsi)}
  </section>
  <section class="grid-half">
    <div class="card">
      <div class="card-h"><div><h2>Nayi puchh-gichh</h2><div class="sub">Leads jinka jawab dena hai</div></div><a class="link" data-nav href="/dashboard/leads">Sab leads ${chevSvg}</a></div>
      <div class="list">${leadsList}</div>
    </div>
    ${profileCard || `<div class="card" style="flex:1"><div class="rev-body"><div style="color:var(--ink-3);font-size:12.5px">Profile score load ho raha hai…</div></div></div>`}
  </section>
  <div class="foot">WeddingWala vendor console · Overview</div>
  <div class="tip" id="tip"></div>`
}

/* ── charts (real series) ────────────────────────────────────── */
function renderCharts(root: ShadowRoot, series: { m: string; v: number }[], bookingSeries: number[]) {
  const data = series.length >= 2 ? series : [{ m: "—", v: 0 }, { m: "—", v: 0 }]
  const W = 680, H = 210, padL = 34, padR = 14, padT = 14, padB = 26
  const iw = W - padL - padR, ih = H - padT - padB
  const vals = data.map((d) => d.v)
  const rawMax = Math.max(...vals, 1), rawMin = Math.min(...vals, 0)
  const max = rawMax * 1.1, min = Math.max(0, rawMin - (rawMax - rawMin) * 0.15)
  const x = (i: number) => padL + (i / (data.length - 1)) * iw
  const y = (v: number) => padT + (1 - (v - min) / ((max - min) || 1)) * ih
  let area = `M ${x(0)} ${y(data[0].v)}`, line = area
  data.forEach((d, i) => { if (i) { const cx = (x(i - 1) + x(i)) / 2; const seg = ` C ${cx} ${y(data[i - 1].v)}, ${cx} ${y(d.v)}, ${x(i)} ${y(d.v)}`; line += seg; area += seg } })
  area += ` L ${x(data.length - 1)} ${padT + ih} L ${x(0)} ${padT + ih} Z`
  const ticks = [0, 0.33, 0.66, 1].map((t) => Math.round((min + t * (max - min)) * 10) / 10)
  let grid = ""; ticks.forEach((g) => { const yy = y(g); grid += `<line class="grid-line" x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}"/><text class="axis-lbl" x="${padL - 8}" y="${yy + 3}" text-anchor="end">${g}</text>` })
  let xl = ""; data.forEach((d, i) => { xl += `<text class="axis-lbl" x="${x(i)}" y="${H - 8}" text-anchor="middle">${d.m}</text>` })
  const li = data.length - 1
  const end = `<circle cx="${x(li)}" cy="${y(data[li].v)}" r="4.5" fill="var(--chart)"/><circle cx="${x(li)}" cy="${y(data[li].v)}" r="4.5" fill="none" stroke="var(--surface)" stroke-width="2"/>`
  const svg = `<svg width="100%" viewBox="0 0 ${W} ${H}" role="img" aria-label="Revenue trend" style="overflow:visible"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--chart)" stop-opacity=".22"/><stop offset="1" stop-color="var(--chart)" stop-opacity="0"/></linearGradient></defs>${grid}${xl}<path d="${area}" fill="url(#ag)"/><path d="${line}" fill="none" stroke="var(--chart)" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/><line id="cross" x1="0" y1="${padT}" x2="0" y2="${padT + ih}" stroke="var(--chart)" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>${end}<rect id="hit" x="0" y="0" width="${W}" height="${H}" fill="transparent"/></svg>`
  const wrap = root.getElementById("areaWrap"); if (wrap) {
    wrap.innerHTML = svg
    const tip = root.getElementById("tip") as HTMLElement | null
    const cross = wrap.querySelector("#cross") as SVGLineElement | null
    const hit = wrap.querySelector("#hit") as SVGRectElement | null
    const svgEl = wrap.querySelector("svg") as SVGSVGElement | null
    if (hit && svgEl && cross && tip) {
      hit.addEventListener("mousemove", (e: MouseEvent) => {
        const r = svgEl.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W
        let i = 0, best = 1e9; data.forEach((d, kk) => { const dd = Math.abs(x(kk) - px); if (dd < best) { best = dd; i = kk } })
        const sx = r.left + (x(i) / W) * r.width, sy = r.top + (y(data[i].v) / H) * r.height
        cross.setAttribute("x1", String(x(i))); cross.setAttribute("x2", String(x(i))); cross.setAttribute("opacity", "1")
        tip.style.left = sx + "px"; tip.style.top = sy - 10 + "px"; tip.style.opacity = "1"
        tip.innerHTML = `Rs ${data[i].v.toFixed(2)} lakh<br><span class="t-sub">${esc(data[i].m)}</span>`
      })
      hit.addEventListener("mouseleave", () => { cross.setAttribute("opacity", "0"); tip.style.opacity = "0" })
    }
  }
  // KPI mini-bars — booking/revenue series + a flat for the others.
  const bs = bookingSeries.length >= 2 ? bookingSeries : [1, 1]
  const rs = series.length >= 2 ? series.map((s) => s.v) : [1, 1]
  const cfg = [
    { d: bs, c: "var(--accent)" },
    { d: rs, c: "var(--accent)" },
    { d: rs, c: "var(--accent)" },
    { d: bs, c: "var(--accent)" },
  ]
  root.querySelectorAll(".k-spark").forEach((el) => {
    const o = cfg[Number((el as HTMLElement).dataset.k)] || cfg[0], dd = o.d, c = o.c, sw = 240, sh = 34, nn = dd.length, gap = 5
    const bw = (sw - (nn - 1) * gap) / nn, mn = Math.min(...dd), mx = Math.max(...dd)
    let bars = ""
    dd.forEach((v, i) => { const t = (v - mn) / ((mx - mn) || 1), h = 9 + t * 23, xx = i * (bw + gap), yy = sh - h, last = i === nn - 1; bars += `<rect x="${xx.toFixed(1)}" y="${yy.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="2.5" fill="${c}" fill-opacity="${last ? 1 : 0.28}"/>` })
    el.setAttribute("viewBox", `0 0 ${sw} ${sh}`); el.setAttribute("preserveAspectRatio", "none"); el.innerHTML = bars
  })
}

const EXTRA_CSS = String.raw`
.content{ max-width:1280px; }
.card{ display:flex; flex-direction:column; }
.card-h{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px 11px; }
.card-h h2{ font-size:13.5px; font-weight:600; letter-spacing:-.01em; }
.card-h .sub{ font-size:12px; color:var(--ink-3); margin-top:2px; font-weight:400; }
.link{ font-size:12.5px; font-weight:500; color:var(--ink-2); display:inline-flex; align-items:center; gap:3px; padding:5px 7px; border-radius:7px; margin:-5px -7px; }
.link:hover{ background:var(--surface-3); color:var(--ink); } .link svg{ width:13px; height:13px; }
.kpis{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:12px; }
.kpi{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); padding:15px 15px 13px; display:flex; flex-direction:column; transition:border-color .14s,box-shadow .14s; }
.kpi:hover{ border-color:var(--border-2); box-shadow:var(--shadow-sm); }
.kpi .k-row{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
.kpi .k-label{ font-size:12.5px; color:var(--ink-3); font-weight:500; }
.chip{ display:inline-flex; align-items:center; gap:3px; font-size:11px; font-weight:600; padding:2px 7px 2px 5px; border-radius:20px; border:1px solid var(--border); background:var(--surface-2); color:var(--ink-2); }
.chip svg{ width:12px; height:12px; }
.chip.up{ color:var(--ok); border-color:transparent; background:var(--ok-wash); }
.chip.down{ color:var(--bad); border-color:transparent; background:var(--bad-wash); }
.chip.attn{ color:var(--bad); border-color:transparent; background:var(--bad-wash); }
.kpi .k-val{ font-size:27px; font-weight:660; letter-spacing:-.03em; margin-top:12px; line-height:1; }
.kpi .k-val .rs{ font-size:14px; color:var(--ink-3); font-weight:600; margin-right:2px; }
.kpi .k-note{ font-size:11.5px; color:var(--ink-3); margin-top:7px; }
.kpi .k-spark{ display:block; width:100%; height:34px; margin-top:11px; }
.grid-main{ display:grid; grid-template-columns:1.7fr 1fr; gap:12px; margin-bottom:12px; }
.grid-half{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
.rail-col{ display:flex; flex-direction:column; gap:12px; min-width:0; }
.seg{ display:inline-flex; background:var(--surface-3); border:1px solid var(--border); border-radius:8px; padding:2px; gap:1px; }
.seg button{ font-size:11.5px; font-weight:600; color:var(--ink-3); padding:4px 10px; border-radius:6px; border:0; background:transparent; height:26px; }
.seg button.on{ background:var(--surface); color:var(--ink); box-shadow:var(--shadow-xs); }
.chart-wrap{ padding:6px 14px 2px; position:relative; flex:1; display:flex; flex-direction:column; justify-content:center; min-height:206px; }
.chart-foot{ display:flex; padding:12px 18px 15px; border-top:1px solid var(--border); margin-top:4px; gap:22px; }
.cf-cap{ display:block; font-size:11.5px; color:var(--ink-3); }
.cf-val{ display:block; font-size:15px; font-weight:660; margin-top:3px; letter-spacing:-.02em; }
.cf-val .rs{ font-size:11px; color:var(--ink-3); font-weight:600; }
svg .grid-line{ stroke:var(--border); stroke-width:1; }
svg .axis-lbl{ fill:var(--ink-3); font-size:10.5px; }
.tip{ position:fixed; pointer-events:none; opacity:0; transform:translate(-50%,-100%); background:var(--ink); color:var(--bg); padding:6px 10px; border-radius:8px; font-size:12px; box-shadow:var(--shadow-md); white-space:nowrap; transition:opacity .12s; z-index:60; font-weight:600; }
.tip .t-sub{ color:var(--ink-3); font-weight:500; font-size:10.5px; }
.rev-body{ padding:2px 16px 16px; display:flex; flex-direction:column; gap:13px; height:100%; }
.rev-score{ display:flex; align-items:center; gap:14px; }
.rev-num{ font-size:34px; font-weight:680; letter-spacing:-.04em; line-height:.9; }
.stars{ color:var(--accent); font-size:13px; letter-spacing:1.5px; }
.rev-cap{ font-size:11.5px; color:var(--ink-3); margin-top:5px; } .rev-cap b{ color:var(--ink-2); font-weight:600; }
.rev-quote{ margin-top:auto; border-top:1px solid var(--border); padding-top:12px; }
.rev-avatars{ display:flex; margin-bottom:9px; }
.rev-avatars span{ width:25px; height:25px; border-radius:7px; border:2px solid var(--surface); margin-left:-6px; display:grid; place-items:center; font-size:9.5px; font-weight:600; background:var(--surface-3); color:var(--ink-2); }
.rev-avatars span:first-child{ margin-left:0; }
.rev-quote p{ margin:0; font-size:12.5px; color:var(--ink-2); line-height:1.55; }
.rev-by{ font-size:11.5px; color:var(--ink-3); margin-top:7px; }
.owe{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin:0 16px 6px; padding:11px 13px; border-radius:var(--r-sm); background:var(--surface-3); border:1px solid var(--border); }
.owe .o-cap{ font-size:12px; color:var(--ink-2); font-weight:500; }
.owe .o-val{ font-size:18px; font-weight:680; color:var(--ink); letter-spacing:-.02em; }
.occ-in{ display:flex; align-items:center; gap:18px; padding:4px 16px 16px; }
.ring{ position:relative; width:104px; height:104px; flex:none; }
.ring .r-mid{ position:absolute; inset:0; display:grid; place-items:center; text-align:center; }
.ring .r-pct{ font-size:23px; font-weight:680; letter-spacing:-.03em; line-height:1; }
.ring .r-cap{ font-size:10px; color:var(--ink-3); margin-top:2px; }
.occ-legend{ flex:1; min-width:0; display:flex; flex-direction:column; gap:9px; }
.occ-row{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
.occ-row .ol{ display:flex; align-items:center; gap:8px; color:var(--ink-2); font-size:12.5px; }
.occ-row .ol i{ width:8px; height:8px; border-radius:2px; flex:none; }
.occ-row b{ font-size:13.5px; font-weight:660; }
.list{ padding:4px 8px 8px; display:flex; flex-direction:column; }
.row{ display:flex; align-items:center; gap:11px; padding:10px 10px; border-radius:9px; transition:background .1s; position:relative; }
.row:hover{ background:var(--surface-3); }
.ava{ width:36px; height:36px; border-radius:9px; flex:none; display:grid; place-items:center; font-weight:600; font-size:11.5px; background:var(--surface-3); border:1px solid var(--border); color:var(--ink-2); }
.row .r-main{ flex:1; min-width:0; }
.row .r-title{ font-weight:600; font-size:13px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.row .r-meta{ font-size:11.5px; color:var(--ink-3); margin-top:3px; display:flex; gap:9px; flex-wrap:wrap; }
.row .r-meta .mi{ display:inline-flex; align-items:center; gap:4px; }
.row .r-meta svg{ width:12px; height:12px; }
.row .r-amt{ text-align:right; flex:none; }
.row .r-amt .a-val{ font-weight:660; font-size:13.5px; letter-spacing:-.01em; }
.row .r-amt .a-cap{ font-size:11px; color:var(--ink-3); margin-top:1px; }
.row .r-amt .a-cap.due{ color:var(--warn); font-weight:500; }
.paybar{ height:4px; border-radius:3px; background:var(--surface-3); margin-top:9px; overflow:hidden; max-width:250px; }
.paybar span{ display:block; height:100%; border-radius:3px; background:var(--accent); }
.paybar span.zero{ background:repeating-linear-gradient(90deg,var(--border-2) 0 4px,transparent 4px 8px); width:100% !important; opacity:.7; }
.pay-cap{ font-size:10.5px; color:var(--ink-3); margin-top:5px; } .pay-cap b{ color:var(--accent-ink); font-weight:600; }
.row.hl::before{ content:""; position:absolute; left:1px; top:9px; bottom:9px; width:2.5px; border-radius:3px; }
.row.today::before{ background:var(--accent); }
.row.today{ background:linear-gradient(90deg,var(--accent-wash),transparent 42%); }
.row.urgent::before{ background:var(--bad); }
.r-meta .mi.acc{ color:var(--accent-ink); font-weight:600; }
.plan-in{ padding:2px 16px 14px; }
.plan-in p{ margin:0 0 12px; font-size:12.5px; color:var(--ink-2); line-height:1.55; }
.plan-feats{ display:flex; flex-direction:column; gap:8px; margin-bottom:14px; }
.plan-feats .f{ display:flex; align-items:center; gap:8px; font-size:12.5px; color:var(--ink-2); }
.plan-feats .f svg{ width:15px; height:15px; color:var(--accent-ink); flex:none; }
@media (max-width:1080px){ .kpis{ grid-template-columns:repeat(2,1fr); } .grid-main,.grid-half{ grid-template-columns:1fr; } }
@media (max-width:820px){ .kpis{ grid-template-columns:1fr 1fr; } }
@media (max-width:560px){ .kpis{ grid-template-columns:1fr; } }
`

export function OverviewArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { user } = useUser()
  const { business } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard", crumbBold: "Overview", crumbSub: "Aaj ka din", extraCss: EXTRA_CSS,
  })
  const rangeRef = React.useRef(6) // revenue chart window (months): 3M / 6M / 1Y
  const seriesRef = React.useRef<{ m: string; v: number }[]>([])
  const bookingSeriesRef = React.useRef<number[]>([])
  const sliceRange = (ser: { m: string; v: number }[], m: number) => (m >= ser.length ? ser : ser.slice(-m))

  const kpisQ = useQuery({ queryKey: ["art-kpis", activeBusinessId], queryFn: () => AnalyticsAPI.getDashboardKpis("this_year", undefined, undefined, activeBusinessId) })
  const revQ = useQuery({ queryKey: ["art-rev-trends", activeBusinessId], queryFn: () => AnalyticsAPI.getRevenueTrends("this_year", undefined, undefined, activeBusinessId) })
  const bkTrQ = useQuery({ queryKey: ["art-bk-trends", activeBusinessId], queryFn: () => AnalyticsAPI.getBookingTrends("this_year", undefined, undefined, activeBusinessId) })
  const recentQ = useQuery({ queryKey: ["art-recent", activeBusinessId], queryFn: () => AnalyticsAPI.getRecentBookings(4, undefined, undefined, undefined, activeBusinessId) })
  const leadsQ = useQuery({ queryKey: ["art-leads"], queryFn: () => LeadAPI.list({}) })
  const bkdQ = useQuery({ queryKey: ["art-breakdowns", activeBusinessId], queryFn: () => AnalyticsAPI.getRevenueBreakdowns("this_year", undefined, undefined, activeBusinessId) })
  const compQ = useQuery({ queryKey: ["art-completeness"], queryFn: () => CompletenessAPI.listMine() })
  const bizId = activeBusinessId ?? (business as { id?: number } | null)?.id ?? null
  const reviewsQ = useQuery({ queryKey: ["art-reviews", bizId], enabled: !!bizId, queryFn: () => ReviewsAPI.getBusinessReviews(Number(bizId)).catch(() => null) })
  const refundQ = useQuery({ queryKey: ["art-refunds", bizId], queryFn: () => listRefundObligations(bizId ?? undefined).catch(() => null) })

  const data: ArtData = React.useMemo(() => {
    const k = kpisQ.data
    const revSeries = (revQ.data?.data ?? []).map((r) => ({ m: r.month, v: n(r.revenue) / 100000 }))
    const bookingSeries = (bkTrQ.data?.data ?? []).map((r) => n(r.bookings))
    const totalRev = (revQ.data?.data ?? []).reduce((s, r) => s + n(r.revenue), 0)
    const nonZero = (revQ.data?.data ?? []).filter((r) => n(r.revenue) > 0)
    const avgRev = nonZero.length ? Math.round(totalRev / nonZero.length) : 0
    let best = "—"
    const maxRow = (revQ.data?.data ?? []).reduce<{ month: string; revenue: number } | null>((m, r) => (!m || n(r.revenue) > n(m.revenue) ? r : m), null)
    if (maxRow) best = `${maxRow.month} · ${(n(maxRow.revenue) / 100000).toFixed(1)} L`

    const byBiz = bkdQ.data?.byBusiness ?? []
    const bookedDays = byBiz.reduce((s, b) => s + n((b as { bookedDays?: number }).bookedDays), 0)
    const periodDays = byBiz.reduce((s, b) => s + n((b as { periodDays?: number }).periodDays), 0) || 365
    const occPct = periodDays ? Math.round((bookedDays / periodDays) * 100) : 0

    const events: EventRow[] = (recentQ.data?.bookings ?? []).slice(0, 4).map((b) => {
      const pm = payMeta(b)
      return { id: b.id, ini: initials(b.customerName), title: b.customerName || "—", tone: bookingTone(b.status), toneLabel: b.status || "—", date: `${cap(b.eventType)} · ${shortDate(b.bookingDate)}`, amount: n(b.totalAmount), payShow: pm.show, payPct: pm.pct, payZero: pm.zero, payCap: pm.cap }
    })

    const leadRows: LeadRow[] = ((leadsQ.data?.leads ?? []) as Lead[])
      .filter((l) => (l.status || "").toLowerCase() !== "lost" && (l.status || "").toLowerCase() !== "booked")
      .slice(0, 3)
      .map((l) => ({ id: n(l.id), ini: initials(l.contactName), name: l.contactName || "Lead", ageLabel: relDays(l.createdAt) || "Naya", ageTone: (l.status || "").toLowerCase() === "new" ? "info" : "mut", meta: [cap(l.eventType), l.status ? cap(l.status) : null].filter(Boolean).join(" · ") }))

    let profile: ArtData["profile"] = null
    const comps = (compQ.data ?? []) as BusinessCompleteness[]
    if (comps.length) {
      const target = [...comps].sort((a, b) => a.score - b.score)[0]
      const nb = (target.nextBest ?? []).slice(0, 3).map((x) => ({ label: (x as { label?: string }).label || "", pts: n((x as { points?: number }).points) }))
      const t = target.score < 35 ? { title: "Listing abhi customers ke liye tayar nahi", body: "Zaroori cheezein missing hain — log aap ko judge karne ke liye kuch nahi dekh paate." }
        : target.score < 70 ? { title: "Achi shuruaat — abhi thoda aur", body: "Kuch aur cheezein poori karein to aap search mein behtar dikhein." }
        : { title: "Zabardast — profile qareeb qareeb poori", body: "Bas aakhri chand cheezein reh gayi hain." }
      profile = { score: Math.round(target.score), title: t.title, body: t.body, items: nb, remaining: n(target.remainingCount) }
    }

    let rating: ArtData["rating"] = null
    const rv = reviewsQ.data as { averageRating?: number | null; totalReviews?: number; reviews?: unknown[] } | null | undefined
    if (rv && n(rv.totalReviews) > 0) {
      const list = (rv.reviews ?? []) as Array<{ reviewText?: string; comment?: string; rating?: number; createdAt?: string; reviewerName?: string; user?: { fullName?: string } }>
      const withText = list.find((x) => (x.reviewText || x.comment || "").trim().length > 4) || list[0]
      const q = (withText?.reviewText || withText?.comment || "").trim()
      const by = (withText?.reviewerName || withText?.user?.fullName || "").trim()
      const now = new Date(); const monthAgo = now.getMonth(); const yr = now.getFullYear()
      const newThisMonth = list.filter((x) => { const d = x.createdAt ? new Date(x.createdAt) : null; return d && !isNaN(d.getTime()) && d.getMonth() === monthAgo && d.getFullYear() === yr }).length
      const avatars = list.map((x) => initials(x.reviewerName || x.user?.fullName)).filter((a) => a && a !== "?").slice(0, 3)
      if (n(rv.totalReviews) > avatars.length) avatars.push(`+${n(rv.totalReviews) - avatars.length}`)
      rating = { avg: n(rv.averageRating), count: n(rv.totalReviews), newThisMonth, quote: q, by: by ? `${by}` : "", avatars }
    }

    let wapsi: ArtData["wapsi"] = null
    const ob = refundQ.data
    if (ob && Array.isArray(ob.obligations)) {
      const rows = ob.obligations.map((o) => {
        const amount = n((o as { outstanding?: number }).outstanding) || n((o as { settlementDue?: number }).settlementDue) || n(o.computed?.refund)
        const since = (o as { appliedAt?: string | null }).appliedAt || o.decidedAt || o.createdAt || null
        const days = since ? Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 86400000)) : 0
        return { id: n(o.id), booking: n(o.bookingId), amount, disputed: !!(o as { disputedAt?: string | null }).disputedAt, days }
      }).filter((r) => r.amount > 0)
      if (rows.length) {
        const oldest = rows.reduce((m, r) => (r.days > m.days ? r : m), rows[0])
        wapsi = { total: n(ob.totalOutstanding) || rows.reduce((s, r) => s + r.amount, 0), rows: rows.slice(0, 3), oldestDays: oldest.days, oldestBooking: oldest.booking }
      }
    }

    return {
      loading: kpisQ.isLoading,
      moneyErr: kpisQ.isError,
      kpis: { bookings: n(k?.totalBookings?.value), bookingsDelta: n(k?.totalBookings?.delta), revenue: n(k?.totalRevenue?.value), revenueDelta: n(k?.totalRevenue?.delta), due: n(k?.revenueDue?.value), upcoming: n(k?.upcomingBookings?.value) },
      series: revSeries, bookingSeries,
      foot: { total: totalRev, avg: avgRev, best },
      occ: { pct: occPct, bookedDays, emptyDays: Math.max(0, periodDays - bookedDays) },
      events, leads: leadRows, profile, rating, wapsi,
    }
  }, [kpisQ.data, kpisQ.isLoading, kpisQ.isError, revQ.data, bkTrQ.data, recentQ.data, leadsQ.data, bkdQ.data, compQ.data, reviewsQ.data, refundQ.data])

  const greeting = React.useMemo(() => {
    const full = (user as { fullName?: string } | null)?.fullName
    const first = full ? full.split(/\s+/)[0] : ""
    return first ? `Assalam-o-Alaikum, ${first}` : "Assalam-o-Alaikum"
  }, [user])
  const todayStr = new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })

  // Rebuild content + charts on data change.
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc")
    if (!wwc) return
    wwc.innerHTML = buildContent(data, greeting, todayStr)
    seriesRef.current = data.series; bookingSeriesRef.current = data.bookingSeries
    renderCharts(s, sliceRange(data.series, rangeRef.current), data.bookingSeries)
    const segWrap = wwc.querySelector(".seg")
    if (segWrap) segWrap.querySelectorAll("button").forEach((x) => { const b = x as HTMLElement; b.classList.toggle("on", Number(b.dataset.range) === rangeRef.current) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, greeting, todayStr])

  // Revenue range 3M/6M/1Y — slice client-side and re-draw. (Nav is handled by the shell.)
  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", (e) => {
      const seg = (e.target as HTMLElement).closest(".seg button") as HTMLElement | null
      if (seg && seg.dataset.range) {
        e.preventDefault()
        rangeRef.current = Number(seg.dataset.range)
        seg.parentElement?.querySelectorAll("button").forEach((x) => x.classList.remove("on")); seg.classList.add("on")
        renderCharts(s, sliceRange(seriesRef.current, rangeRef.current), bookingSeriesRef.current)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default OverviewArtifact
