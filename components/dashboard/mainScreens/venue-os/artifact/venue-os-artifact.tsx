"use client"

/**
 * Venue OS — premium, SIMPLE rebuild on the shared champagne shell.
 * The founder found the org-consolidation pilot confusing, so this is a plain
 * business-health view: money in − money out = profit, a per-venue revenue
 * split, and links to the detailed screens. Real data (revenue breakdowns +
 * expenses), no accounting jargon.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AnalyticsAPI } from "@/lib/api/analytics"
import { ExpensesAPI } from "@/lib/api/vendorExpenses"
import { useArtifactShell, pkNum, escHtml, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  in: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', out: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>', scale: '<path d="M12 3v18M5 8l7-5 7 5M4 21h16"/>',
  building: '<path d="M3 21h18M6 21V7l6-4 6 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', chart: '<path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>', trophy: '<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0zM7 4H4v2a3 3 0 0 0 3 3M17 4h3v2a3 3 0 0 0-3 3"/>',
  thumb: '<path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zM7 10l4-7a2 2 0 0 1 2 2v3h5.5a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.1 21H7"/>', pulse: '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
}

const EXTRA_CSS = String.raw`
.content{ max-width:1040px; }
.verdict{ display:flex; gap:16px; align-items:center; padding:20px 22px; margin-bottom:16px; border-radius:var(--r); border:1px solid; }
.verdict.ok{ background:linear-gradient(150deg,var(--ok-wash),color-mix(in srgb,var(--surface) 80%,var(--ok-wash))); border-color:color-mix(in srgb,var(--ok) 30%,transparent); }
.verdict.warn{ background:linear-gradient(150deg,var(--warn-wash),color-mix(in srgb,var(--surface) 80%,var(--warn-wash))); border-color:var(--accent-line); }
.verdict.bad{ background:linear-gradient(150deg,var(--bad-wash),color-mix(in srgb,var(--surface) 80%,var(--bad-wash))); border-color:color-mix(in srgb,var(--bad) 30%,transparent); }
.vd-emoji{ width:52px; height:52px; border-radius:14px; flex:none; display:grid; place-items:center; background:var(--surface); border:1px solid var(--border); } .vd-emoji svg{ width:27px; height:27px; }
.verdict.ok .vd-emoji{ color:var(--ok); } .verdict.warn .vd-emoji{ color:var(--warn); } .verdict.bad .vd-emoji{ color:var(--bad); }
.vd-body{ flex:1; min-width:0; }
.vd-t{ font-size:17px; font-weight:700; letter-spacing:-.02em; } .verdict.ok .vd-t{ color:var(--ok); } .verdict.warn .vd-t{ color:var(--warn); } .verdict.bad .vd-t{ color:var(--bad); }
.vd-s{ font-size:13px; color:var(--ink-2); margin-top:5px; line-height:1.55; max-width:640px; } .vd-s b{ color:var(--ink); font-weight:660; }
.top-insight{ font-size:11.5px; color:var(--ink-3); font-weight:500; } .top-insight b{ color:var(--accent-ink); }
.vo-hero{ display:flex; gap:13px; align-items:center; padding:15px 18px; margin-bottom:16px; }
.vh-ic{ width:44px; height:44px; border-radius:12px; background:var(--accent-wash); border:1px solid var(--accent-line); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .vh-ic svg{ width:22px; height:22px; }
.vh-t{ font-weight:600; font-size:15px; } .vh-s{ font-size:12.5px; color:var(--ink-3); margin-top:2px; }
.pnl{ display:grid; grid-template-columns:1fr auto 1fr auto 1fr; gap:0; align-items:center; margin-bottom:16px; }
.pnl-cell{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); padding:20px 22px; text-align:center; }
.pnl-cell.profit{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 74%,var(--accent-wash))); border-color:var(--accent-line); }
.pnl-cap{ font-size:12px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; justify-content:center; gap:6px; } .pnl-cap svg{ width:14px; height:14px; }
.pnl-cap.in{ color:var(--ok); } .pnl-cap.out{ color:var(--warn); } .pnl-cap.pr{ color:var(--accent-ink); }
.pnl-val{ font-size:27px; font-weight:700; letter-spacing:-.03em; margin-top:9px; } .pnl-val .rs{ font-size:14px; color:var(--ink-3); font-weight:600; } .pnl-val.pos{ color:var(--ok); } .pnl-val.neg{ color:var(--bad); }
.pnl-sub{ font-size:11px; color:var(--ink-3); margin-top:5px; }
.pnl-op{ font-size:26px; color:var(--ink-4); font-weight:300; padding:0 14px; }
.card-h{ padding:14px 16px 12px; border-bottom:1px solid var(--border); } .card-h h2{ font-size:13.5px; font-weight:600; }
.margin-bar{ height:10px; border-radius:5px; background:var(--surface-3); overflow:hidden; margin:14px 16px; } .margin-bar span{ display:block; height:100%; background:linear-gradient(90deg,var(--accent),var(--accent-ink)); }
.margin-lbl{ display:flex; justify-content:space-between; font-size:11.5px; color:var(--ink-3); padding:0 16px 12px; } .margin-lbl b{ color:var(--accent-ink); }
.vrow{ display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid var(--border); } .vrow:last-child{ border-bottom:0; }
.v-ic{ width:34px; height:34px; border-radius:9px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--ink-2); flex:none; } .v-ic svg{ width:16px; height:16px; }
.v-main{ flex:1; min-width:0; } .v-nm{ font-weight:600; font-size:13px; } .v-bar{ height:6px; border-radius:3px; background:var(--surface-3); overflow:hidden; margin-top:5px; max-width:340px; } .v-bar span{ display:block; height:100%; border-radius:3px; background:var(--accent); }
.v-amt{ font-weight:660; font-variant-numeric:tabular-nums; text-align:right; } .v-amt .rs{ font-size:11px; color:var(--ink-3); font-weight:600; } .v-sub{ font-size:11px; color:var(--ink-3); }
.links{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
.linkcard{ display:flex; align-items:center; gap:11px; padding:14px 15px; background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); cursor:pointer; } .linkcard:hover{ border-color:var(--accent-line); background:var(--surface-3); }
.lc-ic{ width:34px; height:34px; border-radius:9px; background:var(--accent-wash); border:1px solid var(--accent-line); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .lc-ic svg{ width:16px; height:16px; }
.lc-t{ font-weight:600; font-size:12.5px; } .lc-s{ font-size:11px; color:var(--ink-3); margin-top:1px; }
.sec-h{ font-size:14px; font-weight:600; margin:16px 0 12px; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:900px){ .pnl{ grid-template-columns:1fr; gap:10px; } .pnl-op{ display:none; } .links{ grid-template-columns:1fr; } }
`

function buildContent(revenue: number, expenses: number, byVenue: { name: string; revenue: number }[]): string {
  const profit = revenue - expenses
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0
  const maxV = Math.max(1, ...byVenue.map((v) => v.revenue))
  const top = byVenue[0]
  const topLine = top ? `<div class="top-insight">Sab se zyada kamai <b>${escHtml(top.name)}</b> se — Rs ${pkNum(top.revenue)} (${revenue > 0 ? Math.round((top.revenue / revenue) * 100) : 0}% total)${byVenue.length > 1 ? `. ${byVenue.length} venues chal rahi hain.` : "."}</div>` : ""
  const vd = profit < 0
    ? { cls: "bad", ic: IC.alert, t: "Business ghata mein ja raha hai", s: `Kharcha (Rs ${pkNum(expenses)}) revenue (Rs ${pkNum(revenue)}) se <b>zyada</b> hai. Foran <b>Kharcha</b> review karein aur rates/booking barhayein.` }
    : margin >= 45
      ? { cls: "ok", ic: IC.trophy, t: "Business zabardast chal raha hai!", s: `Har Rs 100 revenue mein <b>Rs ${margin} bach</b> raha — ye bohat sehatmand munafa hai. Kharcha isi tarah control mein rakhein aur zyada bookings pe focus karein.` }
      : margin >= 25
        ? { cls: "ok", ic: IC.thumb, t: "Achi sehat — thoda aur behtar ho sakta hai", s: `<b>${margin}% margin</b> theek hai. Sab se bara kharcha kaat kar ya rate thoda barha kar munafa aur upar le jaa sakte hain.` }
        : { cls: "warn", ic: IC.pulse, t: "Munafa patla hai — dhyan dein", s: `Revenue ka bara hissa kharcha kha raha (sirf <b>${margin}%</b> bach raha). <b>Kharcha</b> mein sab se bari category dekh kar cut karein.` }
  const hero = `<div class="verdict ${vd.cls}"><span class="vd-emoji">${svg(vd.ic, 1.8)}</span><div class="vd-body"><div class="vd-t">${vd.t}</div><div class="vd-s">${vd.s}</div>${topLine ? `<div style="margin-top:8px">${topLine}</div>` : ""}</div></div>`
  const pnl = `<div class="pnl">
    <div class="pnl-cell"><div class="pnl-cap in">${svg(IC.in)} Aaya (revenue)</div><div class="pnl-val pos tnum"><span class="rs">Rs</span> ${pkNum(revenue)}</div><div class="pnl-sub">is saal</div></div>
    <div class="pnl-op">−</div>
    <div class="pnl-cell"><div class="pnl-cap out">${svg(IC.out)} Kharcha</div><div class="pnl-val neg tnum"><span class="rs">Rs</span> ${pkNum(expenses)}</div><div class="pnl-sub">saara expense</div></div>
    <div class="pnl-op">=</div>
    <div class="pnl-cell profit"><div class="pnl-cap pr">${svg(IC.scale)} Munafa</div><div class="pnl-val tnum" style="color:${profit >= 0 ? "var(--ok)" : "var(--bad)"}"><span class="rs">Rs</span> ${pkNum(profit)}</div><div class="pnl-sub">${margin}% margin</div></div>
  </div>`
  const marginCard = `<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Munafa ka margin</h2></div><div class="margin-bar"><span style="width:${Math.max(0, Math.min(100, margin))}%"></span></div><div class="margin-lbl"><span>Har Rs 100 revenue par</span><b>Rs ${margin} bacha</b></div></div>`
  const venues = byVenue.length ? `<div class="card"><div class="card-h"><h2>Venue ke hisaab se revenue</h2></div>${byVenue.map((v) => `<div class="vrow"><span class="v-ic">${svg(IC.building, 1.8)}</span><div class="v-main"><div class="v-nm">${escHtml(v.name)}</div><div class="v-bar"><span style="width:${Math.round((v.revenue / maxV) * 100)}%"></span></div></div><div class="v-amt tnum"><span class="rs">Rs</span> ${pkNum(v.revenue)}<div class="v-sub">${revenue > 0 ? Math.round((v.revenue / revenue) * 100) : 0}% total ka</div></div></div>`).join("")}</div>` : ""
  const links = `<div class="sec-h">Tafseel ke liye</div><div class="links">
    <div class="linkcard" data-nav-btn="/dashboard/insights"><span class="lc-ic">${svg(IC.chart, 1.8)}</span><div><div class="lc-t">Reports</div><div class="lc-s">Revenue trends aur charts</div></div></div>
    <div class="linkcard" data-nav-btn="/dashboard/expenses"><span class="lc-ic">${svg(IC.out, 1.8)}</span><div><div class="lc-t">Kharcha</div><div class="lc-s">Category-wise expenses</div></div></div>
    <div class="linkcard" data-nav-btn="/dashboard/money"><span class="lc-ic">${svg(IC.in, 1.8)}</span><div><div class="lc-t">Khata</div><div class="lc-s">Aya-baqaya ledger</div></div></div>
  </div>`
  return `
  <div class="head"><div><h1>Venue OS</h1><div class="sub">Aapke poore business ka munafa ek jagah — simple.</div></div></div>
  ${hero}${pnl}${marginCard}${venues}${links}
  <div class="foot">WeddingWala vendor console · Venue OS</div>`
}

export function VenueOsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/venue-os", crumbBold: "Ops", crumbSub: "Venue OS", extraCss: EXTRA_CSS })
  const qc = useQueryClient()
  const revQ = useQuery({ queryKey: ["vos-rev"], queryFn: () => AnalyticsAPI.getRevenueBreakdowns("this_year") })
  const expQ = useQuery({ queryKey: ["vos-exp"], queryFn: () => ExpensesAPI.list({}) })
  const isError = revQ.isError || expQ.isError

  React.useEffect(() => {
    const s = shadowRef.current; if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Venue OS</h1></div></div>${errorBannerHtml()}`; return }
    if (revQ.isLoading || expQ.isLoading) { wwc.innerHTML = `<div class="loadwrap">Business health load ho rahi hai…</div>`; return }
    const byBiz = (revQ.data?.byBusiness ?? []) as Array<{ businessName?: string; totalRevenue?: number }>
    const revenue = byBiz.reduce((a, b) => a + num(b.totalRevenue), 0)
    const expenses = num(expQ.data?.summary?.total)
    const byVenue = byBiz.map((b) => ({ name: b.businessName || "Venue", revenue: num(b.totalRevenue) })).filter((v) => v.revenue > 0).sort((a, b) => b.revenue - a.revenue)
    wwc.innerHTML = buildContent(revenue, expenses, byVenue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, revQ.data, expQ.data, revQ.isLoading, expQ.isLoading, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) {
        qc.invalidateQueries({ queryKey: ["vos-rev"] })
        qc.invalidateQueries({ queryKey: ["vos-exp"] })
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default VenueOsArtifact
