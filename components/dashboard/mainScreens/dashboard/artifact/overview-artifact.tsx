"use client"

/**
 * OverviewArtifact — the vendor dashboard, pixel-faithful to the approved
 * design sample (docs/design-samples/vendor-dashboard.html) AND wired to the
 * real backend.
 *
 * The sample's CSS + shell live in a Shadow DOM so its generic class names
 * cannot collide with the app's global styles. The content is rebuilt from live
 * data whenever a query resolves. Nav uses client routing; theme follows the
 * active dashboard theme; the sidebar shows the real business/user.
 *
 * ── One source for every figure ───────────────────────────────────────────
 *
 * Everything the KPI tiles, the two event cards, the unanswered-enquiries strip
 * and the Revenue chart show comes from ONE response — `overview` in
 * /analytics/dashboard?sections=overview,… — built by one set of rules on the
 * server (backend: services/vendorOverviewService.js). This file draws what it
 * is given and decides nothing about which record belongs where:
 *
 *   Aane wale events   open bookings dated today or later, soonest first
 *   Tawajjo chahiye    open bookings whose date has passed, completed bookings
 *                      that still owe money, and enquiries nobody has answered
 *   Revenue            Khata receipts by the month they were received, the 12
 *                      months ending this month, nothing from a month not begun
 *
 * A booking is in exactly one of those, so the cards cannot contradict each
 * other, and the tile counts are counts of the same lists. The Baqaya tile is
 * the Khata receivables total itself. Rows are worded by lib/utils/overview-model
 * (the same status text/colour functions the Bookings list uses, the Leads
 * screen's stage table), and the chart's arithmetic is lib/utils/overview-chart —
 * both are checked by scripts/overview-check.mts.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useUser } from "@/context/UserContext"
import { useBusiness } from "@/context/BusinessContext"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useArtifactShell, pkNum, escHtml, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import { AnalyticsAPI, type DashboardOverview, type OverviewMonth } from "@/lib/api/analytics"
import { ReviewsAPI } from "@/lib/api/dashboard"
import { CompletenessAPI, type BusinessCompleteness } from "@/lib/api/completeness"
import { listRefundObligations } from "@/lib/api/bookingOrder"
import { lastMonths, summariseRange, periodLabel, layoutChart, monthShort, monthLong, type MonthPoint } from "@/lib/utils/overview-chart"
import { bookingRowVm, leadRowVm, enquiryBanner, attentionIsClear, kpiCards, moreCount, initialsOf, type RowVm, type LeadRowVm, type KpiVm } from "@/lib/utils/overview-model"

/* ── helpers ─────────────────────────────────────────────────── */
const n = (v: unknown) => (v == null ? 0 : Number(v) || 0)

/** How many rows each card draws. The server sends up to five. */
const SHOW_EVENTS = 4
const SHOW_CLOSING = 4
const SHOW_UNPAID = 3
const SHOW_LEADS = 3

/* ── data model the content builder consumes ─────────────────── */
interface ArtData {
  /** The Overview request itself failed, or came back without the overview section. */
  failed: boolean
  loading: boolean
  o: DashboardOverview | null
  baqaya: { total: number; customers: number } | null
  occ: { pct: number; bookedDays: number; emptyDays: number } | null
  profile: { score: number; title: string; body: string; items: { label: string; pts: number }[]; remaining: number } | null
  rating: { avg: number; count: number; newThisMonth: number; quote: string; by: string; avatars: string[] } | null
  wapsi: { total: number; rows: { id: number; booking: number; amount: number; disputed: boolean; days: number }[]; oldestDays: number; oldestBooking: number } | null
}

/* ── content HTML built from live data ───────────────────────── */
function chip(delta: number | null, tag: string): string {
  if (delta == null || !isFinite(delta) || delta === 0) return `<span class="chip">${escHtml(tag || "—")}</span>`
  const up = delta > 0
  return `<span class="chip ${up ? "up" : "down"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="${up ? "M7 17 17 7M17 7H8M17 7v9" : "M7 7 17 17M17 17H8M17 17V8"}"/></svg> ${Math.abs(Math.round(delta))}%</span>`
}
function kpiCard(k: KpiVm, idx: number): string {
  const val = k.value == null ? "—" : k.kind === "money" ? `<span class="rs">Rs</span>${pkNum(k.value)}` : String(k.value)
  const spark = k.spark ? `<svg class="k-spark" data-k="${idx}" aria-hidden="true"></svg>` : `<div class="k-spark-gap" aria-hidden="true"></div>`
  return `<div class="kpi"${k.href ? ` data-nav-btn="${k.href}"` : ""}><div class="k-row"><span class="k-label">${escHtml(k.label)}</span>${chip(k.delta, k.tag)}</div><div class="k-val tnum">${val}</div><div class="k-note">${escHtml(k.note)}</div>${spark}</div>`
}
const calSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg>`
const chevSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 6l6 6-6 6"/></svg>`
const clockSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`

/**
 * THE booking row. Both event cards draw through this one function — the right
 * hand card used to build its rows by hand with a class the shell styles as
 * `text-align:right`, which is why its name, pill, date and amount stacked into a
 * right-aligned column instead of sitting in the left card's two-column row.
 */
function bookingRowHtml(v: RowVm): string {
  const bar = !v.bar.show ? "" : v.bar.zero ? `<div class="paybar"><span class="zero"></span></div>` : `<div class="paybar"><span style="width:${v.bar.pct}%"></span></div>`
  const cap = v.bar.show && v.bar.pct < 100 ? `<div class="pay-cap">${escHtml(v.bar.caption)}</div>` : ""
  const amt = `${v.amount ? `<div class="a-val tnum">Rs ${pkNum(v.amount)}</div>` : ""}${v.amountCap.text ? `<div class="a-cap ${v.amountCap.tone}">${escHtml(v.amountCap.text)}</div>` : ""}`
  return `<div class="row${v.isToday ? " hl today" : ""}" data-nav-btn="${v.href}"><span class="ava" aria-hidden="true">${escHtml(v.ini)}</span><div class="r-main"><div class="r-title">${escHtml(v.title)} <span class="st ${v.pill.tone}"><i></i> ${escHtml(v.pill.label)}</span></div><div class="r-meta"><span class="mi kindref">${escHtml(v.ref)}</span>${v.what ? `<span class="mi">${escHtml(v.what)}</span>` : ""}<span class="mi">${calSvg} ${escHtml(v.when)}</span></div>${bar}${cap}</div><div class="r-amt">${amt}</div></div>`
}
function leadRowHtml(l: LeadRowVm): string {
  return `<div class="row" data-nav-btn="${l.href}"><span class="ava" aria-hidden="true">${escHtml(l.ini)}</span><div class="r-main"><div class="r-title">${escHtml(l.title)} <span class="st ${l.pill.tone}"><i></i> ${escHtml(l.pill.label)}</span></div><div class="r-meta"><span class="mi kindref">${escHtml(l.ref)}</span>${l.what ? `<span class="mi">${escHtml(l.what)}</span>` : ""}<span class="mi">${escHtml(l.waiting)}</span></div></div><button class="btn btn-ghost sm" data-nav-btn="${l.href}">Jawab dein</button></div>`
}
const emptyRow = (msg: string, action = "") => `<div class="row"><div class="r-main"><div class="r-meta">${escHtml(msg)}</div></div>${action}</div>`
const moreLine = (more: number, noun: string, href: string) => (more > 0 ? `<div class="list-more">+${more} aur ${escHtml(noun)} — <a data-nav href="${href}">sab dekhein</a></div>` : "")

function ratingCard(r: ArtData["rating"]): string {
  if (!r || !r.count) {
    return `<div class="card" style="flex:1"><div class="card-h"><div><h2>Aapki rating</h2></div></div><div class="rev-body"><div style="color:var(--ink-3);font-size:12.5px">Abhi koi review nahi — pehli booking complete hone par customers rate karenge.</div></div></div>`
  }
  const full = Math.max(0, Math.min(5, Math.round(r.avg)))
  const stars = "★".repeat(full) + "☆".repeat(5 - full)
  const avatars = r.avatars.length
    ? `<div class="rev-avatars" aria-hidden="true">${r.avatars.map((a) => `<span>${escHtml(a)}</span>`).join("")}</div>`
    : ""
  const quote = r.quote
    ? `<div class="rev-quote">${avatars}<p>&ldquo;${escHtml(r.quote)}&rdquo;</p>${r.by ? `<div class="rev-by">— ${escHtml(r.by)}</div>` : ""}</div>`
    : ""
  return `<div class="card" style="flex:1"><div class="card-h"><div><h2>Aapki rating</h2></div><span class="st ok"><i></i> Verified</span></div>
    <div class="rev-body"><div class="rev-score"><div class="rev-num tnum">${r.avg.toFixed(1)}</div>
      <div><div class="stars" aria-label="${r.avg.toFixed(1)} out of 5">${stars}</div><div class="rev-cap">${r.count} reviews${r.newThisMonth ? ` · iss mahine <b>${r.newThisMonth} naye</b>` : ""}</div></div></div>
      ${quote}</div></div>`
}
function wapsiCard(w: ArtData["wapsi"]): string {
  const head = `<div class="card-h"><div><h2>Wapsi — jo dena hai</h2><div class="sub">Cancel hui bookings ke refund</div></div><a class="link" data-nav href="/dashboard/receivables">Khata ${chevSvg}</a></div>`
  if (!w || !w.rows.length) {
    return `<div class="card">${head}<div class="list"><div class="row"><div class="r-main"><div class="r-meta">Koi wapsi baaki nahi — sab settle.</div></div></div></div></div>`
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

/**
 * "Tawajjo chahiye" — the three things that are costing the vendor now:
 * enquiries nobody has answered, bookings whose date has passed without being
 * closed, and money owed on bookings that are done.
 *
 * Nothing in this platform closes a booking when its date passes — no cron, no
 * prompt — so the review request and the final-balance chase (both triggered by
 * completion) never fire. This is the prompt. It is deliberately NOT automation:
 * completing a booking also settles money, and this codebase never closes money
 * without a human saying so.
 *
 * Always drawn, with an honest "all clear" line, so the card does not vanish and
 * pull the one beside it across the grid.
 */
function attentionCard(o: DashboardOverview): string {
  const head = `<div class="card-h"><div><h2>Tawajjo chahiye</h2><div class="sub">Jawab, guzri tareekhon ki bookings aur baqaya raqam</div></div><a class="link" data-nav href="/dashboard/bookings">Sab bookings ${chevSvg}</a></div>`
  if (attentionIsClear(o)) {
    return `<div class="card">${head}<div class="list">${emptyRow("Sab theek hai — koi unanswered puchh-gichh, guzri hui khuli booking ya baqaya nahi.")}</div></div>`
  }
  const today = o.today
  const banner = enquiryBanner(o.enquiries)
  const leadBlock = banner
    ? `<div class="owe urgent"><span class="o-cap">${escHtml(banner.headline)}${banner.oldest ? ` — ${escHtml(banner.oldest)}` : ""}</span><a class="link" data-nav href="/dashboard/leads">Leads kholein ${chevSvg}</a></div>${banner.stale ? `<div class="o-note">${escHtml(banner.stale)}</div>` : ""}`
    : ""

  const closing = o.needsClosing.items.slice(0, SHOW_CLOSING)
  const closingBlock = o.needsClosing.count
    ? `<div class="owe"><span class="o-cap">${o.needsClosing.count} booking ki tareekh guzar gayi, abhi band nahi hui</span></div><div class="list">${closing.map((r) => bookingRowHtml(bookingRowVm(r, today))).join("")}</div>${moreLine(moreCount(o.needsClosing.count, closing.length), "bookings", "/dashboard/bookings")}`
    : ""

  const unpaid = o.deliveredUnpaid.items.slice(0, SHOW_UNPAID)
  const unpaidBlock = o.deliveredUnpaid.count
    ? `<div class="owe"><span class="o-cap">Mukammal events ka baqaya · ${o.deliveredUnpaid.count} booking${o.deliveredUnpaid.count === 1 ? "" : "s"}</span><span class="o-val tnum">Rs ${pkNum(o.deliveredUnpaid.total)}</span></div><div class="list">${unpaid.map((r) => bookingRowHtml(bookingRowVm(r, today))).join("")}</div>${moreLine(moreCount(o.deliveredUnpaid.count, unpaid.length), "bookings", "/dashboard/receivables")}`
    : ""

  return `<div class="card">${head}${leadBlock}${closingBlock}${unpaidBlock}</div>`
}

/* ── the revenue chart ───────────────────────────────────────── */
function chartFootHtml(s: ReturnType<typeof summariseRange>): string {
  const rs = `<span class="rs">Rs</span>`
  const best = s.best ? `${escHtml(monthShort(s.best.key))} · ${(s.best.value / 100000).toFixed(1)} L` : "—"
  return `<div><span class="cf-cap">Kul · ${escHtml(periodLabel(s))}</span><span class="cf-val tnum">${s.hasData ? `${rs} ${pkNum(s.total)}` : "—"}</span></div><div><span class="cf-cap">Ausat / mahina · ${s.months} mahine par</span><span class="cf-val tnum">${s.average == null ? "—" : `${rs} ${pkNum(s.average)}`}</span></div><div><span class="cf-cap">Sab se acha mahina</span><span class="cf-val tnum">${best}</span></div>`
}

const RANGE_NOTE: Record<number, string> = { 3: "pichle 3 mahine", 6: "pichle 6 mahine", 12: "pichle 12 mahine" }

function buildContent(d: ArtData, greeting: string, todayStr: string): string {
  const head = headHtml(greeting, todayStr)
  const o = d.o
  if (!o) return head
  const kpiRow = `<section class="kpis" aria-label="Key figures">${kpiCards(o, d.baqaya).map(kpiCard).join("")}</section>`

  const occ = d.occ
  const off = (263.9 * (1 - Math.max(0, Math.min(100, occ ? occ.pct : 0)) / 100)).toFixed(1)
  const occCard = `<div class="card"><div class="card-h"><div><h2>Saal ki occupancy</h2></div><a class="link" data-nav href="/dashboard/calendar">Calendar ${chevSvg}</a></div><div class="occ-in"><div class="ring"><svg width="104" height="104" viewBox="0 0 104 104"><circle cx="52" cy="52" r="42" fill="none" stroke="var(--surface-3)" stroke-width="10"/><circle cx="52" cy="52" r="42" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round" stroke-dasharray="263.9" stroke-dashoffset="${off}" transform="rotate(-90 52 52)"/></svg><div class="r-mid"><div><div class="r-pct tnum">${occ ? `${Math.round(occ.pct)}%` : "—"}</div><div class="r-cap">booked</div></div></div></div><div class="occ-legend"><div class="occ-row"><span class="ol"><i style="background:var(--accent)"></i> Booked</span><b class="tnum">${occ ? `${occ.bookedDays} din` : "—"}</b></div><div class="occ-row"><span class="ol"><i style="background:var(--border-2)"></i> Khaali</span><b class="tnum">${occ ? `${occ.emptyDays} din` : "—"}</b></div></div></div></div>`

  // Profile completion (replaces the sample's marketing "plan" card).
  let profileCard = ""
  if (d.profile) {
    const p = d.profile
    const pOff = (263.9 * (1 - Math.max(0, Math.min(100, p.score)) / 100)).toFixed(1)
    const feats = p.items.map((it) => `<div class="f"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg> ${escHtml(it.label)}${it.pts ? ` <span style="color:var(--ink-3);font-weight:500">+${it.pts}</span>` : ""}</div>`).join("")
    profileCard = `<div class="card"><div class="card-h"><div><h2>Profile mukammal karein</h2><div class="sub">Jitna poora, utni zyada bookings</div></div><span class="st ${p.score >= 70 ? "ok" : "warn"}"><i></i> ${p.score}/100</span></div><div class="occ-in"><div class="ring" style="width:88px;height:88px"><svg width="88" height="88" viewBox="0 0 104 104"><circle cx="52" cy="52" r="42" fill="none" stroke="var(--surface-3)" stroke-width="10"/><circle cx="52" cy="52" r="42" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round" stroke-dasharray="263.9" stroke-dashoffset="${pOff}" transform="rotate(-90 52 52)"/></svg><div class="r-mid"><div><div class="r-pct tnum" style="font-size:19px">${p.score}</div><div class="r-cap">of 100</div></div></div></div><div class="occ-legend"><div style="font-weight:600;font-size:13px;margin-bottom:2px">${escHtml(p.title)}</div><div style="font-size:12px;color:var(--ink-3);line-height:1.5">${escHtml(p.body)}</div></div></div><div class="plan-in" style="padding-top:0"><div class="plan-feats">${feats}</div><button class="btn btn-primary" style="width:100%" data-nav-btn="/dashboard/settings">${p.remaining > 0 ? `${p.remaining} aur cheezein poori karein` : "Settings kholein"}</button></div></div>`
  }

  const today = o.today
  const events = o.upcoming.items.slice(0, SHOW_EVENTS)
  const eventsList = events.length
    ? events.map((r) => bookingRowHtml(bookingRowVm(r, today))).join("") + moreLine(moreCount(o.upcoming.count, events.length), "bookings", "/dashboard/bookings")
    : emptyRow("Abhi koi aane wali booking nahi. Nayi booking aate hi yahan sab se qareeb tareekh pehle dikhegi.", `<button class="btn btn-ghost sm" data-nav-btn="/dashboard/bookings">Nayi booking</button>`)
  const eventsSub = o.upcoming.count
    ? `Bookings, qareeb tareekh pehle · ${o.upcoming.count} aane wali, agle 7 din mein ${o.upcoming.next7Days}`
    : "Bookings, qareeb tareekh pehle"

  const leads = o.enquiries.items.slice(0, SHOW_LEADS)
  const leadsList = leads.length
    ? leads.map((l) => leadRowHtml(leadRowVm(l, today))).join("") + moreLine(moreCount(o.enquiries.unanswered, leads.length), "puchh-gichh", "/dashboard/leads")
    : emptyRow("Abhi koi nayi puchh-gichh nahi. Jab koi poochhega to yahan aayegi.")

  return `
  ${head}
  ${o.truncated ? `<div class="o-warn">Aap ke bahut zyada records hain — figures sirf sab se naye 5,000 bookings se bane hain.</div>` : ""}
  ${d.baqaya ? "" : `<div class="o-warn">Baqaya raqam load nahi ho saki — wo dash hai, zero nahi.</div>`}
  ${kpiRow}
  <section class="grid-main">
    <div class="card">
      <div class="card-h"><div><h2>Revenue</h2><div class="sub">Khata mein aya paisa · Rs lakh · jis mahine mila</div></div><div class="seg" role="group" aria-label="Time range"><button data-range="3" aria-label="${RANGE_NOTE[3]}">3M</button><button data-range="6" aria-label="${RANGE_NOTE[6]}">6M</button><button data-range="12" aria-label="${RANGE_NOTE[12]}">1Y</button></div></div>
      <div class="chart-wrap" id="areaWrap"></div>
      <div class="chart-foot" id="chartFoot"></div>
    </div>
    <div class="rail-col">
      ${occCard}
      ${ratingCard(d.rating)}
    </div>
  </section>
  <section class="grid-half">
    <div class="card">
      <div class="card-h"><div><h2>Aane wale events</h2><div class="sub">${escHtml(eventsSub)}</div></div><a class="link" data-nav href="/dashboard/bookings">Sab dekhein ${chevSvg}</a></div>
      <div class="list">${eventsList}</div>
    </div>
    ${attentionCard(o)}
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

function headHtml(greeting: string, todayStr: string): string {
  return `<div class="head"><div><h1>${escHtml(greeting)}</h1><div class="sub">${escHtml(todayStr)} — aaj ki suraat-e-haal</div></div><div class="head-actions"><button class="btn btn-ghost" data-nav-btn="/dashboard/calendar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg> Calendar</button><button class="btn btn-primary" data-nav-btn="/dashboard/bookings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg> Nayi booking</button></div></div>`
}

/* ── charts (real series) ────────────────────────────────────── */

/**
 * Draw the revenue chart for the last `rangeN` months of `months`, and its
 * footer. All arithmetic is lib/utils/overview-chart; this only turns the
 * layout into SVG and wires the hover.
 */
function renderChart(root: ShadowRoot, months: OverviewMonth[], rangeN: number) {
  const wrap = root.getElementById("areaWrap")
  if (!wrap) return
  const shown = lastMonths(months, rangeN)
  const pts: MonthPoint[] = shown.map((m) => ({ key: m.key, value: m.received }))
  const sum = summariseRange(pts)
  const foot = root.getElementById("chartFoot")
  if (foot) foot.innerHTML = chartFootHtml(sum)

  if (!sum.hasData) {
    wrap.innerHTML = `<div class="chart-empty"><b>Abhi koi payment record nahi hui</b>${escHtml(periodLabel(sum))} mein Khata mein koi paisa darj nahi. Jab kisi booking par payment record hogi to wo yahan us mahine ke saamne dikhegi.<div style="margin-top:12px"><a class="link" data-nav href="/dashboard/receipts" style="display:inline-flex">Payment record karein ${chevSvg}</a></div></div>`
    return
  }

  const L = layoutChart(pts, (wrap.clientWidth || 708) - 28)
  const W = L.width, H = L.height
  const last = pts.length - 1
  let grid = ""
  L.ticks.forEach((t) => { grid += `<line class="grid-line" x1="${L.padL}" y1="${t.y}" x2="${W - L.padR}" y2="${t.y}"/><text class="axis-lbl" x="${L.padL - 8}" y="${t.y + 3}" text-anchor="end">${t.label}</text>` })
  let xl = ""
  L.labelAt.forEach((i) => { xl += `<text class="axis-lbl" x="${L.xs[i]}" y="${H - 8}" text-anchor="middle">${escHtml(monthShort(pts[i].key))}</text>` })
  const dots = L.xs.map((x, i) => (i === last ? "" : `<circle cx="${x}" cy="${L.ys[i]}" r="2.6" fill="var(--surface)" stroke="var(--chart)" stroke-width="1.6"/>`)).join("")
  // The current month is still in progress, so its segment is dashed and its dot is the emphasised one.
  const tail = last > 0 ? `<path d="M ${L.xs[last - 1]} ${L.ys[last - 1]} L ${L.xs[last]} ${L.ys[last]}" fill="none" stroke="var(--chart)" stroke-width="2.25" stroke-dasharray="4 4" stroke-linecap="round"/>` : ""
  const solid = L.linePath.split(" L").slice(0, last).join(" L")
  const todayMark = `<line x1="${L.xs[last]}" y1="${L.padT}" x2="${L.xs[last]}" y2="${L.baseY}" stroke="var(--border-2)" stroke-width="1" stroke-dasharray="3 3"/><text class="axis-lbl today-lbl" x="${L.xs[last] - 6}" y="${L.padT - 6}" text-anchor="end">Aaj</text>`
  const end = `<circle cx="${L.xs[last]}" cy="${L.ys[last]}" r="4.5" fill="var(--chart)"/><circle cx="${L.xs[last]}" cy="${L.ys[last]}" r="4.5" fill="none" stroke="var(--surface)" stroke-width="2"/>`
  const label = `Revenue, ${periodLabel(sum)}: kul Rs ${pkNum(sum.total)}`
  wrap.innerHTML = `<svg width="100%" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escHtml(label)}" style="overflow:visible"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--chart)" stop-opacity=".22"/><stop offset="1" stop-color="var(--chart)" stop-opacity="0"/></linearGradient></defs>${grid}${xl}<path d="${L.areaPath}" fill="url(#ag)"/>${todayMark}<path d="${last > 0 ? solid : L.linePath}" fill="none" stroke="var(--chart)" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>${tail}${dots}<line id="cross" x1="0" y1="${L.padT}" x2="0" y2="${L.baseY}" stroke="var(--chart)" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>${end}<rect id="hit" x="0" y="0" width="${W}" height="${H}" fill="transparent"/></svg>`

  const tip = root.getElementById("tip") as HTMLElement | null
  const cross = wrap.querySelector("#cross") as SVGLineElement | null
  const hit = wrap.querySelector("#hit") as SVGRectElement | null
  const svgEl = wrap.querySelector("svg") as SVGSVGElement | null
  if (!hit || !svgEl || !cross || !tip) return
  hit.addEventListener("mousemove", (e: MouseEvent) => {
    const r = svgEl.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W
    let i = 0, best = 1e9
    L.xs.forEach((x, k) => { const dd = Math.abs(x - px); if (dd < best) { best = dd; i = k } })
    const m = shown[i]
    const sx = r.left + (L.xs[i] / W) * r.width, sy = r.top + (L.ys[i] / H) * r.height
    cross.setAttribute("x1", String(L.xs[i])); cross.setAttribute("x2", String(L.xs[i])); cross.setAttribute("opacity", "1")
    tip.style.left = sx + "px"; tip.style.top = sy - 10 + "px"; tip.style.opacity = "1"
    tip.innerHTML = `Rs ${(m.received / 100000).toFixed(2)} lakh<br><span class="t-sub">Rs ${pkNum(m.received)} · ${escHtml(monthLong(m.key))}${i === last ? " (aaj tak)" : ""}${m.refunded > 0 ? ` · wapsi Rs ${pkNum(m.refunded)}` : ""}</span>`
  })
  hit.addEventListener("mouseleave", () => { cross.setAttribute("opacity", "0"); tip.style.opacity = "0" })
}

/** KPI mini-bars. A tile with no honest series draws none (the gap keeps the cards level). */
function renderSparks(root: ShadowRoot, series: (number[] | null)[]) {
  root.querySelectorAll(".k-spark").forEach((el) => {
    const dd = series[Number((el as HTMLElement).dataset.k)]
    if (!dd || !dd.length) return
    const sw = 240, sh = 34, nn = dd.length, gap = 5
    const bw = (sw - (nn - 1) * gap) / nn, mn = Math.min(...dd), mx = Math.max(...dd)
    let bars = ""
    dd.forEach((v, i) => { const t = (v - mn) / ((mx - mn) || 1), h = 9 + t * 23, xx = i * (bw + gap), yy = sh - h, lastBar = i === nn - 1; bars += `<rect x="${xx.toFixed(1)}" y="${yy.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="2.5" fill="var(--accent)" fill-opacity="${lastBar ? 1 : 0.28}"/>` })
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
.kpi .k-spark-gap{ height:34px; margin-top:11px; }
.grid-main{ display:grid; grid-template-columns:1.7fr 1fr; gap:12px; margin-bottom:12px; }
.grid-half{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
.rail-col{ display:flex; flex-direction:column; gap:12px; min-width:0; }
.seg{ display:inline-flex; background:var(--surface-3); border:1px solid var(--border); border-radius:8px; padding:2px; gap:1px; }
.seg button{ font-size:11.5px; font-weight:600; color:var(--ink-3); padding:4px 10px; border-radius:6px; border:0; background:transparent; height:26px; }
.seg button.on{ background:var(--surface); color:var(--ink); box-shadow:var(--shadow-xs); }
.chart-wrap{ padding:6px 14px 2px; position:relative; flex:1; display:flex; flex-direction:column; justify-content:center; min-height:206px; }
.chart-empty{ text-align:center; color:var(--ink-3); font-size:12.5px; line-height:1.6; padding:30px 24px; max-width:430px; margin:0 auto; }
.chart-empty b{ display:block; color:var(--ink-2); font-size:13.5px; font-weight:600; margin-bottom:4px; }
.chart-foot{ display:flex; flex-wrap:wrap; padding:12px 18px 15px; border-top:1px solid var(--border); margin-top:4px; gap:10px 22px; }
.cf-cap{ display:block; font-size:11.5px; color:var(--ink-3); }
.cf-val{ display:block; font-size:15px; font-weight:660; margin-top:3px; letter-spacing:-.02em; }
.cf-val .rs{ font-size:11px; color:var(--ink-3); font-weight:600; }
svg .grid-line{ stroke:var(--border); stroke-width:1; }
svg .axis-lbl{ fill:var(--ink-3); font-size:10.5px; }
svg .today-lbl{ fill:var(--accent-ink); font-size:10px; font-weight:600; }
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
/* Unanswered enquiries are the one strip here that is still losing business,
   so it reads as a warning rather than a statement of fact. */
.owe.urgent{ background:var(--bad-wash); border-color:var(--bad); }
.owe.urgent .o-cap{ color:var(--bad); font-weight:600; }
.owe.urgent .link{ color:var(--bad); white-space:nowrap; }
.o-note{ margin:0 16px 8px; padding:0 2px; font-size:11.5px; color:var(--ink-3); line-height:1.5; }
.o-warn{ margin-bottom:12px; padding:10px 13px; border-radius:9px; border:1px solid var(--warn); background:var(--warn-wash); color:var(--ink-2); font-size:12.5px; }
.list-more{ padding:0 18px 12px; font-size:12px; color:var(--ink-3); }
.list-more a{ color:var(--ink-2); font-weight:600; text-decoration:underline; text-underline-offset:2px; }
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
.row .r-meta .mi.kindref{ font-weight:600; color:var(--ink-2); }
.row .r-meta svg{ width:12px; height:12px; }
.row .r-amt{ text-align:right; flex:none; }
.row .r-amt .a-val{ font-weight:660; font-size:13.5px; letter-spacing:-.01em; }
.row .r-amt .a-cap{ font-size:11px; color:var(--ink-3); margin-top:1px; }
.row .r-amt .a-cap.due{ color:var(--warn); font-weight:500; }
.row .r-amt .a-cap.ok{ color:var(--ok); font-weight:500; }
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
  const { business, loading: businessLoading } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const qc = useQueryClient()
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard", crumbBold: "Overview", crumbSub: "Aaj ka din", extraCss: EXTRA_CSS,
  })
  const rangeRef = React.useRef(6) // revenue chart window (months): 3M / 6M / 1Y
  const monthsRef = React.useRef<OverviewMonth[]>([])

  /**
   * ONE request: the Overview's own figures (`overview`), the Khata Baqaya total
   * (`receivables`) and occupancy (`revenueBreakdowns`), resolved concurrently
   * server-side (WW-PERF). It THROWS when it fails, so a broken request shows
   * the console's error banner instead of a screen of zeros that reads as "no
   * money". A response that has no `overview` section (an older server) is
   * treated the same way.
   */
  const dashQ = useQuery({
    queryKey: ["art-overview", activeBusinessId],
    queryFn: ({ signal }) => AnalyticsAPI.getOverviewBundle(activeBusinessId, signal),
  })
  const compQ = useQuery({ queryKey: ["art-completeness"], queryFn: () => CompletenessAPI.listMine() })
  const bizId = activeBusinessId ?? (business as { id?: number } | null)?.id ?? null
  const reviewsQ = useQuery({ queryKey: ["art-reviews", bizId], enabled: !!bizId, queryFn: () => ReviewsAPI.getBusinessReviews(Number(bizId)).catch(() => null) })
  // `bizId` is null until the business list resolves, so this fired once under
  // ["art-refunds", null] and again under ["art-refunds", 3358] — a different
  // key, so TanStack could not dedupe it. `reviewsQ` above dodges this with
  // `enabled: !!bizId`, but null is a legitimate value here (it means "all
  // venues"), so the gate is on the list having settled instead.
  const refundQ = useQuery({ queryKey: ["art-refunds", bizId], enabled: !businessLoading, queryFn: () => listRefundObligations(bizId ?? undefined).catch(() => null) })

  const data: ArtData = React.useMemo(() => {
    const bundle = dashQ.data
    const o = bundle?.overview ?? null

    const rec = bundle?.receivables?.totals
    const baqaya = rec ? { total: n(rec.grandOutstanding), customers: n(rec.customerCount) } : null

    // Occupancy comes from a different section; if it failed it is unknown, not 0%.
    const byBiz = bundle?.revenueBreakdowns?.byBusiness
    let occ: ArtData["occ"] = null
    if (byBiz) {
      const bookedDays = byBiz.reduce((s, b) => s + n((b as { bookedDays?: number }).bookedDays), 0)
      const periodDays = byBiz.reduce((s, b) => s + n((b as { periodDays?: number }).periodDays), 0) || 365
      occ = { pct: Math.round((bookedDays / periodDays) * 100), bookedDays, emptyDays: Math.max(0, periodDays - bookedDays) }
    }

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
      const avatars = list.map((x) => initialsOf(x.reviewerName || x.user?.fullName)).filter((a) => a && a !== "?").slice(0, 3)
      if (n(rv.totalReviews) > avatars.length) avatars.push(`+${n(rv.totalReviews) - avatars.length}`)
      rating = { avg: n(rv.averageRating), count: n(rv.totalReviews), newThisMonth, quote: q, by: by ? `${by}` : "", avatars }
    }

    let wapsi: ArtData["wapsi"] = null
    const ob = refundQ.data
    if (ob && Array.isArray(ob.obligations)) {
      const rows = ob.obligations.map((x) => {
        const amount = n((x as { outstanding?: number }).outstanding) || n((x as { settlementDue?: number }).settlementDue) || n(x.computed?.refund)
        const since = (x as { appliedAt?: string | null }).appliedAt || x.decidedAt || x.createdAt || null
        const days = since ? Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 86400000)) : 0
        return { id: n(x.id), booking: n(x.bookingId), amount, disputed: !!(x as { disputedAt?: string | null }).disputedAt, days }
      }).filter((r) => r.amount > 0)
      if (rows.length) {
        const oldest = rows.reduce((m, r) => (r.days > m.days ? r : m), rows[0])
        wapsi = { total: n(ob.totalOutstanding) || rows.reduce((s, r) => s + r.amount, 0), rows: rows.slice(0, 3), oldestDays: oldest.days, oldestBooking: oldest.booking }
      }
    }

    return {
      loading: dashQ.isLoading,
      failed: dashQ.isError || (!dashQ.isLoading && !o),
      o, baqaya, occ, profile, rating, wapsi,
    }
  }, [dashQ.data, dashQ.isLoading, dashQ.isError, compQ.data, reviewsQ.data, refundQ.data])

  const greeting = React.useMemo(() => {
    const full = (user as { fullName?: string } | null)?.fullName
    const first = full ? full.split(/\s+/)[0] : ""
    return first ? `Assalam-o-Alaikum, ${first}` : "Assalam-o-Alaikum"
  }, [user])
  // The date in the header is the SERVER's Karachi today when we have it, so the
  // header and the lists below it can never be on different days.
  const todayStr = React.useMemo(() => {
    const t = data.o?.today
    const d = t ? new Date(`${t}T12:00:00`) : new Date()
    return d.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })
  }, [data.o?.today])

  // Rebuild content + charts on data change.
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc")
    if (!wwc) return
    if (data.failed) {
      wwc.innerHTML = `${headHtml(greeting, todayStr)}${errorBannerHtml()}`
      return
    }
    if (data.loading || !data.o) {
      wwc.innerHTML = `${headHtml(greeting, todayStr)}<div class="loadwrap">Overview load ho raha hai…</div>`
      return
    }
    wwc.innerHTML = buildContent(data, greeting, todayStr)
    monthsRef.current = data.o.revenue.months
    renderChart(s, monthsRef.current, rangeRef.current)
    renderSparks(s, kpiCards(data.o, data.baqaya).map((k) => k.spark))
    const segWrap = wwc.querySelector(".seg")
    if (segWrap) segWrap.querySelectorAll("button").forEach((x) => { const b = x as HTMLElement; const on = Number(b.dataset.range) === rangeRef.current; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, greeting, todayStr])

  // Revenue range 3M/6M/1Y and the retry button. (Nav is handled by the shell.)
  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["art-overview"] }); return }
      const seg = t.closest(".seg button") as HTMLElement | null
      if (seg && seg.dataset.range) {
        e.preventDefault()
        rangeRef.current = Number(seg.dataset.range)
        seg.parentElement?.querySelectorAll("button").forEach((x) => { x.classList.remove("on"); x.setAttribute("aria-pressed", "false") }); seg.classList.add("on"); seg.setAttribute("aria-pressed", "true")
        renderChart(s, monthsRef.current, rangeRef.current)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // Month labels are thinned in real pixels, so a resize must redraw the chart.
  React.useEffect(() => {
    const s = shadowRef.current
    const host = hostRef.current
    if (!s || !ready || !host || typeof ResizeObserver === "undefined") return
    let raf = 0, lastW = host.clientWidth
    const ro = new ResizeObserver(() => {
      if (Math.abs(host.clientWidth - lastW) < 8) return
      lastW = host.clientWidth
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => { if (monthsRef.current.length) renderChart(s, monthsRef.current, rangeRef.current) })
    })
    ro.observe(host)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default OverviewArtifact
