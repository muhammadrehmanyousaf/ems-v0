"use client"

/**
 * Cancellation policy — premium rebuild on the shared champagne shell.
 * Real via getCancellationPolicy (active + templates) and saveCancellationPolicy
 * to apply a template. Shows the active slab ladder and lets the vendor switch
 * to a ready-made policy.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getCancellationPolicy, saveCancellationPolicy, type CancellationPolicyState, type ActivePolicy, type PolicyTemplate, type PolicySlab } from "@/lib/api/bookingOrder"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useArtifactShell, escHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', check: '<path d="M20 6 9 17l-5-5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
}
const fmRuleLabel = (r?: string) => { const v = (r || "").toLowerCase(); if (v.includes("full")) return "Force majeure: poora refund"; if (v.includes("carry") || v.includes("resched")) return "Force majeure: date badal sakti hai"; if (v.includes("none") || v.includes("no")) return "Force majeure: koi riayat nahi"; return r ? `Force majeure: ${r.replace(/_/g, " ")}` : "" }

function slabLadder(slabs: PolicySlab[]): string {
  const sorted = [...(slabs || [])].sort((a, b) => b.daysToEvent - a.daysToEvent)
  if (!sorted.length) return `<div style="padding:12px 16px;color:var(--ink-3);font-size:12px">Koi slab nahi.</div>`
  return `<div class="ladder">${sorted.map((s, i) => {
    const next = sorted[i + 1]
    const range = i === 0 ? `${s.daysToEvent}+ din pehle` : next ? `${next.daysToEvent + 1}–${s.daysToEvent} din pehle` : `${s.daysToEvent} din tak`
    const pct = Number(s.pctForfeit) || 0
    return `<div class="slab"><span class="sl-range">${escHtml(range)}</span><span class="sl-bar"><span style="width:${Math.min(100, pct)}%"></span></span><span class="sl-pct">${pct}% kata</span></div>`
  }).join("")}</div>`
}

const EXTRA_CSS = String.raw`
.content{ max-width:900px; }
.active-card{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 80%,var(--accent-wash))); border:1px solid var(--accent-line); border-radius:var(--r); box-shadow:var(--shadow-xs); margin-bottom:18px; overflow:hidden; }
.ac-h{ display:flex; align-items:center; gap:12px; padding:16px 18px 14px; border-bottom:1px solid var(--accent-line); }
.ac-ic{ width:40px; height:40px; border-radius:11px; background:var(--surface); border:1px solid var(--accent-line); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .ac-ic svg{ width:20px; height:20px; }
.ac-nm{ font-size:15px; font-weight:600; color:var(--accent-ink); } .ac-sub{ font-size:12px; color:var(--ink-2); margin-top:2px; }
.ladder{ padding:14px 18px; display:flex; flex-direction:column; gap:10px; }
.slab{ display:grid; grid-template-columns:150px 1fr 90px; gap:12px; align-items:center; }
@media (max-width:480px){ .slab{ grid-template-columns:1fr auto; } .slab .sl-bar{ grid-column:1 / -1; order:3; } }
.sl-range{ font-size:12.5px; font-weight:600; color:var(--ink-2); } .sl-bar{ height:8px; border-radius:4px; background:var(--surface-3); overflow:hidden; } .sl-bar span{ display:block; height:100%; border-radius:4px; background:var(--accent); } .sl-pct{ font-size:12px; font-weight:600; text-align:right; font-variant-numeric:tabular-nums; }
.ac-foot{ padding:11px 18px; border-top:1px solid var(--accent-line); display:flex; gap:16px; font-size:11.5px; color:var(--ink-2); } .ac-foot b{ color:var(--accent-ink); }
.sec-h{ font-size:14px; font-weight:600; margin:8px 0 12px; }
.tpl-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
.tplcard{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); display:flex; flex-direction:column; overflow:hidden; }
.tplcard.on{ border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-wash); }
.tpl-h{ padding:14px 16px 12px; border-bottom:1px solid var(--border); } .tpl-nm{ font-weight:660; font-size:14px; } .tpl-fm{ font-size:11px; color:var(--ink-3); margin-top:2px; }
.tpl-slabs{ padding:8px 16px; flex:1; } .tpl-slab{ display:flex; justify-content:space-between; font-size:12px; padding:4px 0; color:var(--ink-2); } .tpl-slab b{ color:var(--ink); font-variant-numeric:tabular-nums; }
.tpl-foot{ padding:12px 16px; border-top:1px solid var(--border); } .tpl-foot .btn{ width:100%; }
.badge-cur{ display:inline-flex; align-items:center; justify-content:center; gap:6px; width:100%; height:36px; border-radius:9px; font-weight:600; font-size:12.5px; background:var(--accent-wash); color:var(--accent-ink); border:1px solid var(--accent-line); } .badge-cur svg{ width:14px; height:14px; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
`

function buildContent(d: CancellationPolicyState): string {
  const active: ActivePolicy | null = d.active || d.effective || null
  const activeCard = active ? `<div class="active-card">
    <div class="ac-h"><span class="ac-ic">${svg(IC.shield, 1.8)}</span><div><div class="ac-nm">${escHtml(active.name)}</div><div class="ac-sub">Abhi ye policy laagu hai${d.effectiveSource === "platform_default" ? " (platform default)" : active.isDefault ? " (default)" : ""}</div></div></div>
    ${slabLadder(active.slabs)}
    <div class="ac-foot"><span>${escHtml(fmRuleLabel(active.forceMajeureRule))}</span>${active.minNoticeHours != null ? `<span>Min notice: <b>${active.minNoticeHours} ghante</b></span>` : ""}</div></div>`
    : `<div class="card" style="margin-bottom:18px"><div class="empty">Abhi koi cancellation policy set nahi. Neeche se ek template chunein.</div></div>`

  const tpls = (d.templates || []).map((t: PolicyTemplate) => {
    const isActive = active && (active.name === t.name)
    const preview = [...(t.slabs || [])].sort((a, b) => b.daysToEvent - a.daysToEvent).slice(0, 4).map((s) => `<div class="tpl-slab"><span>${s.daysToEvent}+ din pehle</span><b>${Number(s.pctForfeit) || 0}%</b></div>`).join("")
    return `<div class="tplcard${isActive ? " on" : ""}">
      <div class="tpl-h"><div class="tpl-nm">${escHtml(t.labelEn || t.name)}</div><div class="tpl-fm">${escHtml(fmRuleLabel(t.forceMajeureRule))}</div></div>
      <div class="tpl-slabs">${preview || `<div class="tpl-slab" style="color:var(--ink-3)">Koi slab nahi</div>`}</div>
      <div class="tpl-foot">${isActive ? `<div class="badge-cur">${svg(IC.check, 2.4)} Laagu hai</div>` : `<button class="btn btn-primary" data-apply="${escHtml(t.key)}">Ye policy lagayein</button>`}</div></div>`
  }).join("")

  return `
  <div class="head"><div><h1>Cancellation policy</h1><div class="sub">Cancel hone par kitna paisa kata jaayega — customers ko booking par yehi dikhta hai.</div></div></div>
  ${activeCard}
  <div class="sec-h">Ready-made policies</div>
  <div class="tpl-grid">${tpls || `<div class="card"><div class="empty">Koi template available nahi.</div></div>`}</div>
  <div class="foot">WeddingWala vendor console · Cancellation policy</div>`
}

export function CancellationPolicyArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/cancellation-policy", crumbBold: "Ops", crumbSub: "Cancellation policy", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const activeBusinessId = useActiveBusinessId()
  const bizRef = React.useRef(activeBusinessId); bizRef.current = activeBusinessId
  const { data } = useQuery({ queryKey: ["cancelpolicy-art", activeBusinessId], queryFn: () => getCancellationPolicy(activeBusinessId) })
  const templatesRef = React.useRef<PolicyTemplate[]>([]); templatesRef.current = data?.templates ?? []

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Policy load ho rahi hai…</div>`; return }
    wwc.innerHTML = buildContent(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", async (e) => {
      const ap = (e.target as HTMLElement).closest("[data-apply]") as HTMLElement | null
      if (!ap?.dataset.apply) return
      const tpl = templatesRef.current.find((t) => t.key === ap.dataset.apply)
      if (!tpl) return
      const btn = ap as HTMLButtonElement; btn.disabled = true; btn.textContent = "Lag rahi…"
      try {
        await saveCancellationPolicy({ name: tpl.name, slabs: tpl.slabs, forceMajeureRule: tpl.forceMajeureRule, businessId: bizRef.current })
        toast.success("Policy laagu ho gayi")
        qc.invalidateQueries({ queryKey: ["cancelpolicy-art", bizRef.current] })
      } catch (err: unknown) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Nahi lagi — dobara koshish karein")
        btn.disabled = false; btn.textContent = "Ye policy lagayein"
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default CancellationPolicyArtifact
