"use client"

/**
 * Reliability — premium rebuild on the shared champagne shell.
 * Real trust scorecard via ReliabilityAPI.getMyScores: score ring + tier, the
 * points breakdown, key inputs, and the "raise your score" suggestions.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ReliabilityAPI, type BusinessReliability, TIER_LABELS } from "@/lib/api/reliability"
import { useArtifactShell, escHtml, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const tierTone = (t: string) => ({ newcomer: "mut", rising: "info", trusted: "ok", premium: "acc", elite: "ok" } as Record<string, string>)[t] || "mut"
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = { bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>' }

const BREAKDOWN: { key: keyof BusinessReliability["breakdown"]; label: string }[] = [
  { key: "ratingPts", label: "Rating" }, { key: "volumePts", label: "Volume (bookings)" }, { key: "verificationPts", label: "Verification" },
  { key: "completionPts", label: "Complete kiye" }, { key: "disputePts", label: "Disputes (kam = behtar)" }, { key: "completenessPts", label: "Profile complete" },
]

const EXTRA_CSS = String.raw`
.content{ max-width:1080px; }
.bizswitch{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
.biztab{ display:flex; flex-direction:column; gap:2px; min-width:150px; padding:9px 13px; border-radius:10px; border:1px solid var(--border); background:var(--surface); text-align:left; }
.biztab:hover{ background:var(--surface-3); } .biztab.on{ border-color:var(--accent); background:var(--accent-wash); box-shadow:var(--shadow-xs); }
.biztab .bt-nm{ font-weight:600; font-size:12.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:190px; } .biztab .bt-sc{ font-size:11px; color:var(--ink-3); } .biztab.on .bt-sc{ color:var(--accent-ink); font-weight:600; }
.stack{ display:flex; flex-direction:column; gap:14px; }
.hero{ display:flex; align-items:center; gap:24px; background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 78%,var(--accent-wash))); border:1px solid var(--accent-line); border-radius:var(--r); padding:20px 24px; }
.ring{ position:relative; width:120px; height:120px; flex:none; } .r-mid{ position:absolute; inset:0; display:grid; place-items:center; } .r-pct{ font-size:34px; font-weight:700; letter-spacing:-.03em; color:var(--accent-ink); } .r-cap{ font-size:10px; color:var(--ink-3); text-transform:uppercase; letter-spacing:.05em; }
.hero-body{ flex:1; min-width:0; } .hero-t{ font-size:11px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; color:var(--ink-3); } .hero-tier{ margin-top:6px; display:flex; align-items:center; gap:10px; }
.hero-tier .st{ font-size:13px; padding:4px 12px; } .hero-desc{ font-size:12.5px; color:var(--ink-2); margin-top:10px; line-height:1.55; max-width:520px; }
.hero-badges{ display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; } .hb{ font-size:10.5px; font-weight:600; padding:3px 9px; border-radius:20px; background:var(--surface); border:1px solid var(--accent-line); color:var(--accent-ink); }
.card-h{ padding:14px 16px 12px; border-bottom:1px solid var(--border); } .card-h h2{ font-size:13.5px; font-weight:600; }
.bd{ padding:14px 16px; display:flex; flex-direction:column; gap:11px; } .bd-row{ display:grid; grid-template-columns:150px 1fr 44px; gap:12px; align-items:center; } .bd-lbl{ font-size:12px; color:var(--ink-2); } .bd-track{ height:8px; border-radius:4px; background:var(--surface-3); overflow:hidden; } .bd-track span{ display:block; height:100%; border-radius:4px; background:var(--accent); } .bd-pts{ font-size:12px; font-weight:660; text-align:right; font-variant-numeric:tabular-nums; }
.inputs{ display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--border); border-radius:10px; overflow:hidden; margin:2px 16px 16px; }
.in-cell{ background:var(--surface); padding:11px 13px; } .in-v{ font-size:16px; font-weight:660; } .in-c{ font-size:11px; color:var(--ink-3); margin-top:1px; }
.sug{ display:flex; gap:12px; padding:13px 16px; border-bottom:1px solid var(--border); } .sug:last-child{ border-bottom:0; }
.sug-ic{ width:34px; height:34px; border-radius:9px; background:var(--accent-wash); border:1px solid var(--accent-line); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .sug-ic svg{ width:16px; height:16px; }
.sug-main{ flex:1; } .sug-t{ font-weight:600; font-size:12.5px; } .sug-d{ font-size:11.5px; color:var(--ink-3); margin-top:2px; line-height:1.5; } .sug-g{ font-size:11px; font-weight:700; color:var(--ok); white-space:nowrap; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:900px){ .inputs{ grid-template-columns:1fr 1fr; } }
`

function ring(score: number): string {
  const r = 52, circ = 2 * Math.PI * r, off = (circ * (1 - Math.max(0, Math.min(100, score)) / 100)).toFixed(1)
  return `<div class="ring"><svg width="130" height="130" viewBox="0 0 130 130"><circle cx="65" cy="65" r="${r}" fill="none" stroke="var(--surface)" stroke-width="11"/><circle cx="65" cy="65" r="${r}" fill="none" stroke="var(--accent)" stroke-width="11" stroke-linecap="round" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${off}" transform="rotate(-90 65 65)"/></svg><div class="r-mid"><div><div class="r-pct">${Math.round(score)}</div><div class="r-cap">of 100</div></div></div></div>`
}

function buildContent(b: BusinessReliability, all: BusinessReliability[]): string {
  const switcher = all.length > 1 ? `<div class="bizswitch">${all.map((x) => `<button class="biztab${x.businessId === b.businessId ? " on" : ""}" data-biz="${x.businessId}"><span class="bt-nm">${escHtml(x.name)}</span><span class="bt-sc">${Math.round(x.score)} · ${escHtml(TIER_LABELS[x.tier])}</span></button>`).join("")}</div>` : ""
  const bd = b.breakdown
  const maxPts = Math.max(1, ...BREAKDOWN.map((r) => Math.abs(num(bd[r.key]))))
  const tierDesc: Record<string, string> = {
    newcomer: "Abhi shuruaat — pehli reviews aur bookings score tezi se barhaate hain.",
    rising: "Score barh raha hai — aur reviews aur complete bookings se Trusted tak pohchein.",
    trusted: "Customers aap par bharosa karte hain — behtar rank aur zyada enquiries.",
    premium: "Top vendors mein — reviews aur reliability shandaar.",
    elite: "Sab se upar — Wedding Wala ke behtareen vendors mein shumaar.",
  }
  const hero = `<div class="hero">${ring(b.score)}<div class="hero-body"><div class="hero-t">Trust score</div><div class="hero-tier"><span class="st ${tierTone(b.tier)}"><i></i> ${escHtml(TIER_LABELS[b.tier])}</span>${b.badges?.length ? `<div class="hero-badges" style="margin-top:0">${b.badges.map((x) => `<span class="hb">${escHtml(x)}</span>`).join("")}</div>` : ""}</div><div class="hero-desc">${escHtml(tierDesc[b.tier] || "")}</div></div></div>`
  const breakdown = `<div class="card"><div class="card-h"><h2>Score kaise bana</h2></div><div class="bd">${BREAKDOWN.map((r) => { const v = num(bd[r.key]); return `<div class="bd-row"><span class="bd-lbl">${escHtml(r.label)}</span><span class="bd-track"><span style="width:${Math.round((Math.abs(v) / maxPts) * 100)}%;${v < 0 ? "background:var(--bad)" : ""}"></span></span><span class="bd-pts"${v < 0 ? ' style="color:var(--bad)"' : ""}>${v > 0 ? "+" : ""}${v}</span></div>` }).join("")}</div>
    <div class="inputs">
      <div class="in-cell"><div class="in-v">${num(b.inputs.avgRating).toFixed(1)}★</div><div class="in-c">${b.inputs.reviewCount} reviews</div></div>
      <div class="in-cell"><div class="in-v">${b.inputs.completionCount}</div><div class="in-c">Complete kiye</div></div>
      <div class="in-cell"><div class="in-v">${b.inputs.disputeCount}</div><div class="in-c">Disputes</div></div>
      <div class="in-cell"><div class="in-v">${b.inputs.cancellationCount}</div><div class="in-c">Cancel kiye</div></div>
      <div class="in-cell"><div class="in-v">${b.inputs.medianResponseHours != null ? `${num(b.inputs.medianResponseHours).toFixed(1)}h` : "—"}</div><div class="in-c">Median jawab</div></div>
      <div class="in-cell"><div class="in-v">Tier ${b.inputs.verificationTier}</div><div class="in-c">Verification</div></div>
      <div class="in-cell"><div class="in-v">${num(b.inputs.completenessScore)}%</div><div class="in-c">Profile complete</div></div>
      <div class="in-cell"><div class="in-v">${b.inputs.weddingsCompleted}</div><div class="in-c">Shaadiyan</div></div>
    </div></div>`
  const sugCard = b.suggestions?.length ? `<div class="card"><div class="card-h"><h2>Score kaise barhayein</h2></div>${b.suggestions.map((s) => `<div class="sug"><span class="sug-ic">${svg(IC.bolt, 1.8)}</span><div class="sug-main"><div class="sug-t">${escHtml(s.title)}</div><div class="sug-d">${escHtml(s.detail)}</div></div>${s.estimatedGain ? `<span class="sug-g">+${s.estimatedGain}</span>` : ""}</div>`).join("")}</div>` : ""
  return `
  <div class="head"><div><h1>Reliability</h1><div class="sub">Aapka trust score — customers isse aap par bharosa karte hain.</div></div></div>
  ${switcher}
  <div class="stack">${hero}${breakdown}${sugCard}</div>
  <div class="foot">WeddingWala vendor console · Reliability</div>`
}

export function ReliabilityArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/reliability", crumbBold: "Ops", crumbSub: "Reliability", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const { data, isError } = useQuery({ queryKey: ["reliability-art"], queryFn: () => ReliabilityAPI.getMyScores() })
  const all = React.useMemo(() => (data?.businesses ?? []) as BusinessReliability[], [data])
  const [sel, setSel] = React.useState<number | null>(null)
  const active = all.find((b) => b.businessId === sel) || all[0] || null

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Reliability</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Reliability load ho raha hai…</div>`; return }
    if (!active) { wwc.innerHTML = `<div class="loadwrap">Abhi koi score nahi.</div>`; return }
    wwc.innerHTML = buildContent(active, all)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, isError, sel])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", (e) => { const t = e.target as HTMLElement; if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["reliability-art"] }); return } const b = t.closest("[data-biz]") as HTMLElement | null; if (b?.dataset.biz) setSel(Number(b.dataset.biz)) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default ReliabilityArtifact
