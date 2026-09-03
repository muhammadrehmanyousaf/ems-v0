"use client"

/**
 * Set up your listing — the vendor onboarding / completeness checklist, built on
 * the shared champagne artifact shell and wired to the REAL scorecard
 * (CompletenessAPI.listMine → GET /businesses/my-completeness).
 *
 * There is no design sample for this screen, so it is composed in the same
 * locked design language as the nine ported screens: hairline cards, one gold
 * accent, a completion ring, a category checklist with real deep-links, the
 * activation signals, and the data-migration nudge.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  CompletenessAPI, nextBestOf, remainingOf,
  type BusinessCompleteness, type CompletenessCategory,
} from "@/lib/api/completeness"
import { useArtifactShell, escHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

/* ── status from score ───────────────────────────────────────── */
function statusOf(score: number): { label: string; tone: string; title: string; body: string } {
  if (score >= 90) return { label: "Mukammal", tone: "ok", title: "Zabardast — profile qareeb qareeb poori", body: "Bas aakhri chand cheezein reh gayi hain." }
  if (score >= 70) return { label: "Well-rounded", tone: "ok", title: "Achi profile — thoda aur behtar karein", body: "Kuch aur cheezein poori karein to top listings mein aayein." }
  if (score >= 35) return { label: "Achi shuruaat", tone: "warn", title: "Achi shuruaat — abhi thoda aur", body: "Kuch aur cheezein poori karein to aap search mein behtar dikhein." }
  return { label: "Tayar nahi", tone: "bad", title: "Listing abhi customers ke liye tayar nahi", body: "Zaroori cheezein missing hain — log aap ko judge karne ke liye kuch nahi dekh paate." }
}

/* ── icons ───────────────────────────────────────────────────── */
const IC = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>',
  users: '<path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>',
  book: '<path d="M4 4h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 2v4M16 2v4M4 10h16"/>',
  money: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
  sheet: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>',
  upload: '<path d="M12 3v12M7 8l5-5 5 5M5 21h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
}
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const CAT_ICON: Record<string, string> = {
  core: IC.users, identity: IC.users, photos: IC.book, images: IC.book,
  pricing: IC.money, terms: IC.money, specialty: IC.bolt, trust: IC.shield, verification: IC.shield,
}
const catIcon = (key: string) => {
  const k = (key || "").toLowerCase()
  const hit = Object.keys(CAT_ICON).find((x) => k.includes(x))
  return hit ? CAT_ICON[hit] : IC.check
}

const EXTRA_CSS = String.raw`
.setup-head{ margin-bottom:16px; }
.bizswitch{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
.biztab{ display:flex; flex-direction:column; gap:2px; min-width:150px; padding:9px 13px; border-radius:10px; border:1px solid var(--border); background:var(--surface); text-align:left; transition:border-color .12s,background .12s; }
.biztab:hover{ background:var(--surface-3); } .biztab.on{ border-color:var(--accent); background:var(--accent-wash); box-shadow:var(--shadow-xs); }
.biztab .bt-nm{ font-weight:600; font-size:12.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:190px; }
.biztab .bt-sc{ font-size:11px; color:var(--ink-3); font-variant-numeric:tabular-nums; } .biztab.on .bt-sc{ color:var(--accent-ink); font-weight:600; }
.setup-grid{ display:grid; grid-template-columns:1.7fr 1fr; gap:14px; align-items:start; }
.col-stack{ display:flex; flex-direction:column; gap:14px; min-width:0; }
.card-h{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px 12px; }
.card-h h2{ font-size:13.5px; font-weight:600; letter-spacing:-.01em; } .card-h .sub{ font-size:11.5px; color:var(--ink-3); margin-top:2px; font-weight:400; }
/* category */
.cat{ }
.cat + .cat{ border-top:1px solid var(--border); }
.cat-h{ display:flex; align-items:center; gap:12px; padding:13px 16px 11px; }
.cat-ico{ width:32px; height:32px; border-radius:9px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--ink-2); flex:none; } .cat-ico svg{ width:16px; height:16px; }
.cat-ico.done{ background:var(--ok-wash); border-color:transparent; color:var(--ok); }
.cat-main{ flex:1; min-width:0; } .cat-nm{ font-weight:600; font-size:13px; } .cat-bl{ font-size:11.5px; color:var(--ink-3); margin-top:1px; }
.cat-pts{ font-size:12px; font-weight:600; color:var(--ink-2); font-variant-numeric:tabular-nums; white-space:nowrap; } .cat-pts.full{ color:var(--ok); }
.cat-bar{ height:5px; border-radius:3px; background:var(--surface-3); overflow:hidden; margin:0 16px 10px; } .cat-bar span{ display:block; height:100%; border-radius:3px; background:linear-gradient(90deg,var(--accent),var(--accent-ink)); }
.citems{ padding:0 8px 8px; }
.citem{ display:flex; align-items:center; gap:11px; padding:9px 8px; border-radius:8px; transition:background .1s; }
.citem.todo{ cursor:pointer; } .citem.todo:hover{ background:var(--surface-3); }
.ci-box{ width:20px; height:20px; border-radius:6px; flex:none; display:grid; place-items:center; border:1.5px solid var(--border-2); color:transparent; } .ci-box svg{ width:12px; height:12px; }
.citem.done .ci-box{ background:var(--ok); border-color:transparent; color:#fff; }
.ci-main{ flex:1; min-width:0; } .ci-lbl{ font-weight:500; font-size:12.5px; } .citem.done .ci-lbl{ color:var(--ink-3); text-decoration:line-through; text-decoration-color:var(--border-2); }
.ci-why{ font-size:11px; color:var(--ink-3); margin-top:1px; }
.ci-right{ display:flex; align-items:center; gap:10px; flex:none; } .ci-pts{ font-size:11px; font-weight:600; color:var(--ink-3); font-variant-numeric:tabular-nums; }
.ci-go{ display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; color:var(--accent-ink); } .ci-go svg{ width:13px; height:13px; }
/* hero ring */
.hero-in{ display:flex; gap:16px; align-items:center; padding:6px 16px 14px; }
.ring{ position:relative; width:96px; height:96px; flex:none; } .ring svg{ transform:none; } .r-mid{ position:absolute; inset:0; display:grid; place-items:center; text-align:center; }
.r-pct{ font-size:24px; font-weight:680; letter-spacing:-.03em; line-height:1; } .r-cap{ font-size:10px; color:var(--ink-3); text-transform:uppercase; letter-spacing:.04em; margin-top:2px; }
.hero-t{ font-weight:600; font-size:13.5px; margin-bottom:3px; } .hero-b{ font-size:12px; color:var(--ink-3); line-height:1.5; }
.donext{ margin:0 16px 16px; padding:12px 14px; border-radius:var(--r-sm); background:var(--accent-wash); border:1px solid var(--accent-line); }
.dn-cap{ display:flex; align-items:center; gap:5px; font-size:10px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--accent-ink); } .dn-cap svg{ width:13px; height:13px; }
.dn-t{ font-weight:600; font-size:13px; margin-top:7px; } .dn-s{ font-size:11.5px; color:var(--ink-2); margin-top:2px; line-height:1.5; }
.dn-btn{ display:inline-flex; align-items:center; gap:7px; height:34px; padding:0 14px; border-radius:9px; font-weight:600; font-size:12.5px; background:var(--accent); color:var(--on-accent); box-shadow:var(--shadow-xs); margin-top:11px; border:0; } .dn-btn:hover{ filter:brightness(1.05); } .dn-btn svg{ width:14px; height:14px; }
/* activation signals */
.sigs{ padding:4px 16px 14px; display:flex; flex-direction:column; gap:2px; }
.sig{ display:flex; align-items:center; gap:11px; padding:9px 4px; border-bottom:1px solid var(--border); } .sig:last-child{ border-bottom:0; }
.sig-ico{ width:30px; height:30px; border-radius:8px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--ink-2); flex:none; } .sig-ico svg{ width:15px; height:15px; }
.sig-ico.warn{ background:var(--warn-wash); border-color:transparent; color:var(--warn); } .sig-ico.ok{ background:var(--ok-wash); border-color:transparent; color:var(--ok); }
.sig-main{ flex:1; min-width:0; } .sig-lbl{ font-weight:500; font-size:12.5px; } .sig-sub{ font-size:11px; color:var(--ink-3); margin-top:1px; }
.sig-val{ font-weight:660; font-size:14px; font-variant-numeric:tabular-nums; flex:none; } .sig-val.warn{ color:var(--warn); } .sig-val.ok{ color:var(--ok); }
/* migration */
.mig{ padding:4px 16px 16px; display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.mig-opt{ text-align:left; border:1px solid var(--border); border-radius:10px; padding:13px; background:var(--surface-2); transition:background .12s,border-color .12s; } .mig-opt:hover{ background:var(--surface-3); border-color:var(--border-2); }
.mig-ic{ width:32px; height:32px; border-radius:9px; background:var(--surface); border:1px solid var(--border); display:grid; place-items:center; color:var(--accent-ink); margin-bottom:9px; } .mig-ic svg{ width:16px; height:16px; }
.mig-t{ font-weight:600; font-size:12.5px; } .mig-s{ font-size:11px; color:var(--ink-3); margin-top:3px; line-height:1.5; }
.mig-go{ display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; color:var(--accent-ink); margin-top:9px; } .mig-go svg{ width:13px; height:13px; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:1080px){ .setup-grid{ grid-template-columns:1fr; } .mig{ grid-template-columns:1fr; } }
`

function ring(score: number, size = 96): string {
  const r = 42, circ = 2 * Math.PI * r
  const off = (circ * (1 - Math.max(0, Math.min(100, score)) / 100)).toFixed(1)
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 104 104"><circle cx="52" cy="52" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="10"/><circle cx="52" cy="52" r="${r}" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${off}" transform="rotate(-90 52 52)"/></svg><div class="r-mid"><div><div class="r-pct tnum">${Math.round(score)}</div><div class="r-cap">of 100</div></div></div></div>`
}

function categoryHtml(c: CompletenessCategory): string {
  const pct = c.max > 0 ? Math.round((c.earned / c.max) * 100) : 0
  const full = c.earned >= c.max && c.max > 0
  const items = (c.items || []).map((it) => {
    if (it.done) {
      return `<div class="citem done"><span class="ci-box">${svg(IC.check, 3)}</span><div class="ci-main"><div class="ci-lbl">${escHtml(it.label)}</div></div><div class="ci-right"><span class="ci-pts">+${it.weight}</span></div></div>`
    }
    const go = it.href ? `<span class="ci-go">Karein ${svg(IC.arrow)}</span>` : ""
    return `<div class="citem todo"${it.href ? ` data-nav-btn="${escHtml(it.href)}"` : ""}><span class="ci-box"></span>
      <div class="ci-main"><div class="ci-lbl">${escHtml(it.label)}</div>${it.why ? `<div class="ci-why">${escHtml(it.why)}</div>` : ""}</div>
      <div class="ci-right"><span class="ci-pts">+${it.weight}</span>${go}</div></div>`
  }).join("")
  return `<div class="cat">
    <div class="cat-h"><span class="cat-ico${full ? " done" : ""}">${svg(catIcon(c.key), 1.9)}</span>
      <div class="cat-main"><div class="cat-nm">${escHtml(c.label)}</div>${c.blurb ? `<div class="cat-bl">${escHtml(c.blurb)}</div>` : ""}</div>
      <span class="cat-pts${full ? " full" : ""}">${c.earned}/${c.max} pts</span></div>
    <div class="cat-bar"><span style="width:${pct}%"></span></div>
    <div class="citems">${items}</div></div>`
}

function activationHtml(b: BusinessCompleteness): string {
  const a = b.activation
  if (!a) return ""
  const awaiting = Number(a.leadsAwaitingReply ?? 0)
  const rows = [
    awaiting > 0 ? { ico: IC.inbox, tone: "warn", lbl: "Leads jawab ka intezar", sub: "jaldi jawab = zyada bookings", val: awaiting, vtone: "warn" } : null,
    { ico: IC.book, tone: "", lbl: "Confirmed bookings", sub: "aane wale events", val: Number(a.futureConfirmed ?? 0), vtone: "" },
    { ico: IC.money, tone: "", lbl: "Receipts darj", sub: "khata mein", val: Number(a.receipts ?? 0), vtone: "" },
    { ico: IC.sheet, tone: "", lbl: "Function sheets", sub: "event plans", val: Number(a.functionSheets ?? 0), vtone: "" },
    { ico: IC.shield, tone: a.shieldOn ? "ok" : "", lbl: "Booking shield", sub: a.shieldOn ? "on — protected" : "abhi off", val: a.shieldOn ? "On" : "Off", vtone: a.shieldOn ? "ok" : "" },
  ].filter(Boolean) as Array<{ ico: string; tone: string; lbl: string; sub: string; val: number | string; vtone: string }>
  return `<div class="card"><div class="card-h"><div><h2>Aapki activation</h2><div class="sub">Sirf form nahi — asal kaam</div></div></div>
    <div class="sigs">${rows.map((r) => `<div class="sig"><span class="sig-ico ${r.tone}">${svg(r.ico, 1.9)}</span><div class="sig-main"><div class="sig-lbl">${escHtml(r.lbl)}</div><div class="sig-sub">${escHtml(r.sub)}</div></div><span class="sig-val ${r.vtone}">${escHtml(String(r.val))}</span></div>`).join("")}</div></div>`
}

function buildContent(b: BusinessCompleteness, all: BusinessCompleteness[]): string {
  const st = statusOf(b.score)
  const rem = remainingOf(b)
  const nb = nextBestOf(b, 1)[0]
  const totalItems = (b.categories || []).reduce((s, c) => s + c.items.length, 0)
  const doneItems = (b.categories || []).reduce((s, c) => s + c.items.filter((i) => i.done).length, 0)

  const switcher = all.length > 1
    ? `<div class="bizswitch">${all.map((x) => `<button class="biztab${x.businessId === b.businessId ? " on" : ""}" data-biz="${x.businessId}"><span class="bt-nm">${escHtml(x.name)}</span><span class="bt-sc">${Math.round(x.score)} / 100</span></button>`).join("")}</div>`
    : ""

  const donext = nb
    ? `<div class="donext"><div class="dn-cap">${svg(IC.bolt)} Ab ye karein</div><div class="dn-t">${escHtml(nb.label)}</div><div class="dn-s">${escHtml(nb.why || nb.categoryLabel)} · +${nb.weight} points</div>${nb.href ? `<button class="dn-btn" data-nav-btn="${escHtml(nb.href)}">Abhi karein ${svg(IC.arrow)}</button>` : ""}</div>`
    : `<div class="donext"><div class="dn-cap">${svg(IC.check)} Ho gaya</div><div class="dn-t">Sab kuch mukammal 🎉</div><div class="dn-s">Aapki listing poori tarah tayar hai.</div></div>`

  const heroCard = `<div class="card">
    <div class="card-h"><div><h2>${escHtml(b.name)}</h2><div class="sub">${doneItems} / ${totalItems} cheezein · ${rem.count} baaki${rem.points ? ` · ${rem.points} points` : ""}</div></div><span class="st ${st.tone}"><i></i> ${escHtml(st.label)}</span></div>
    <div class="hero-in">${ring(b.score)}<div><div class="hero-t">${escHtml(st.title)}</div><div class="hero-b">${escHtml(st.body)}</div></div></div>
    ${donext}</div>`

  const migCard = `<div class="card"><div class="card-h"><div><h2>Apna business le aayein</h2><div class="sub">Register chhorein — ek dafa import, sab chalega</div></div></div>
    <div class="mig">
      <button class="mig-opt" data-nav-btn="/dashboard/customers"><span class="mig-ic">${svg(IC.users, 1.9)}</span><div class="mig-t">Customer list import</div><div class="mig-s">Excel/CSV paste ya upload — hum columns map karke phone se dedupe karte hain.</div><span class="mig-go">Customers → Import ${svg(IC.arrow)}</span></button>
      <button class="mig-opt" data-nav-btn="/dashboard/bookings"><span class="mig-ic">${svg(IC.book, 1.9)}</span><div class="mig-t">Purani bookings backfill</div><div class="mig-s">Past events load karein — revenue, repeat-customer aur A/R reports pehle din se poore.</div><span class="mig-go">Bookings → Import ${svg(IC.arrow)}</span></button>
    </div></div>`

  const cats = (b.categories || []).map(categoryHtml).join("")

  return `
  <div class="head setup-head"><div><h1>Listing set up karein</h1><div class="sub">Chand kadam — <b>jitna poora, utni zyada bookings</b>.</div></div></div>
  ${switcher}
  <div class="setup-grid">
    <div class="col-stack">
      <div class="card"><div class="card-h"><div><h2>Checklist</h2><div class="sub">Har category poori karein — points barhte jaayenge</div></div></div>${cats}</div>
      ${migCard}
    </div>
    <div class="col-stack">
      ${heroCard}
      ${activationHtml(b)}
    </div>
  </div>
  <div class="foot">WeddingWala vendor console · Set up</div>`
}

export function OnboardingArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/onboarding", crumbBold: "Set up", crumbSub: "Listing mukammal karein", extraCss: EXTRA_CSS,
  })
  const { data } = useQuery({ queryKey: ["onboarding-completeness"], queryFn: () => CompletenessAPI.listMine() })
  const all = React.useMemo(() => (data ?? []) as BusinessCompleteness[], [data])
  const [sel, setSel] = React.useState<number | null>(null)
  const active = all.find((b) => b.businessId === sel) || all[0] || null

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Aapki listing ka score load ho raha hai…</div>`; return }
    if (!active) { wwc.innerHTML = `<div class="loadwrap">Abhi koi business nahi. Pehle ek venue add karein.</div>`; return }
    wwc.innerHTML = buildContent(active, all)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, sel, active])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", (e) => {
      const t = e.target as HTMLElement
      const tab = t.closest("[data-biz]") as HTMLElement | null
      if (tab?.dataset.biz) setSel(Number(tab.dataset.biz))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default OnboardingArtifact
