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
import { useArtifactShell, escHtml, errorBannerHtml, openDrawer, closeDrawer, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import { PARTIAL_PERCENT_MAX, PARTIAL_PERCENT_MIN, shapeOfSlabs, slabRangeLabel, validatePartialRefund } from "@/lib/cancellation-policy"

const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', check: '<path d="M20 6 9 17l-5-5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
}
const fmRuleLabel = (r?: string) => { const v = (r || "").toLowerCase(); if (v.includes("full")) return "Force majeure: poora refund"; if (v.includes("carry") || v.includes("resched")) return "Force majeure: date badal sakti hai"; if (v.includes("none") || v.includes("no")) return "Force majeure: koi riayat nahi"; return r ? `Force majeure: ${r.replace(/_/g, " ")}` : "" }

function slabLadder(slabs: PolicySlab[]): string {
  const sorted = [...(slabs || [])].sort((a, b) => b.daysToEvent - a.daysToEvent)
  if (!sorted.length) return `<div style="padding:12px 16px;color:var(--ink-3);font-size:12px">Koi slab nahi.</div>`
  return `<div class="ladder">${sorted.map((s, i) => {
    // one band from day 0 (a flat cut, e.g. a venue's "Partially Refundable") applies on every day
    // WP29: the engine's own bands. A slab {daysToEvent: 15} applies from 15 days out until the previous (higher) slab starts, and the
    // LAST slab also covers everything closer to the event; the rows used to read the slab as an UPPER bound (8 to 15 days for the 15-day slab),
    // which contradicted both the engine and the plain-words line above them.
    const range = slabRangeLabel(sorted, i)
    const pct = Number(s.pctForfeit) || 0
    // WP20: a flat amount the venue keeps ("PKR 20,000 kata") has no percentage to draw, so no bar and the amount in words
    const fixed = Number(s.venueKeepsFixed) || 0
    return `<div class="slab"><span class="sl-range">${escHtml(range)}</span><span class="sl-bar">${fixed > 0 ? "" : `<span style="width:${Math.min(100, pct)}%"></span>`}</span><span class="sl-pct">${fixed > 0 ? `PKR ${Math.round(fixed).toLocaleString("en-US")} kata` : `${pct}% kata`}</span></div>`
  }).join("")}</div>`
}

const EXTRA_CSS = String.raw`
.content{ max-width:900px; }
.active-card{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 80%,var(--accent-wash))); border:1px solid var(--accent-line); border-radius:var(--r); box-shadow:var(--shadow-xs); margin-bottom:18px; overflow:hidden; }
.ac-h{ display:flex; align-items:center; gap:12px; padding:16px 18px 14px; border-bottom:1px solid var(--accent-line); }
.ac-ic{ width:40px; height:40px; border-radius:11px; background:var(--surface); border:1px solid var(--accent-line); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .ac-ic svg{ width:20px; height:20px; }
.ac-nm{ font-size:15px; font-weight:600; color:var(--accent-ink); } .ac-sub{ font-size:12px; color:var(--ink-2); margin-top:2px; }
.ladder{ padding:14px 18px; display:flex; flex-direction:column; gap:10px; }
.slab{ display:grid; grid-template-columns:150px 1fr 130px; gap:12px; align-items:center; }
@media (max-width:480px){ .slab{ grid-template-columns:1fr auto; } .slab .sl-bar{ grid-column:1 / -1; order:3; } }
.sl-range{ font-size:12.5px; font-weight:600; color:var(--ink-2); } .sl-bar{ height:8px; border-radius:4px; background:var(--surface-3); overflow:hidden; } .sl-bar span{ display:block; height:100%; border-radius:4px; background:var(--accent); } .sl-pct{ font-size:12px; font-weight:600; text-align:right; font-variant-numeric:tabular-nums; }
.ac-says{ padding:12px 18px; border-bottom:1px solid var(--accent-line); display:flex; flex-direction:column; gap:3px; font-size:12.5px; line-height:1.55; color:var(--ink-2); } .ac-says b{ font-size:11px; letter-spacing:.04em; text-transform:uppercase; color:var(--accent-ink); }
.ac-foot .ac-edit{ margin-left:auto; }
.dhint{ font-size:11.5px; color:var(--ink-3); line-height:1.5; } .derr{ font-size:11.5px; color:var(--bad); line-height:1.5; }
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

/** Partially Refundable (WP20): one flat band the venue chose at registration - its keep value can be changed here. */
const keepShape = (d: CancellationPolicyState) => (d.active && d.effectiveSource === "business" ? shapeOfSlabs(d.active.slabs) : null)

function buildContent(d: CancellationPolicyState): string {
  const active: ActivePolicy | null = d.active || d.effective || null
  const keep = keepShape(d)
  const canEditKeep = !!keep && (keep.kind === "partial_percent" || keep.kind === "partial_fixed")
  const sourceNote = d.effectiveSource === "platform_default" ? " (platform default)" : d.effectiveSource === "business_label" ? " (aap ka Non-Refundable jawab)" : active?.isDefault ? " (default)" : ""
  const activeCard = active ? `<div class="active-card">
    <div class="ac-h"><span class="ac-ic">${svg(IC.shield, 1.8)}</span><div><div class="ac-nm">${escHtml(active.name)}</div><div class="ac-sub">Abhi ye policy laagu hai${sourceNote}</div></div></div>
    ${d.summary ? `<div class="ac-says" data-policy-says><b>Customers ko yeh dikhta hai</b><span><strong>${escHtml(d.summary.headline)}.</strong> ${escHtml(d.summary.detail)}</span></div>` : ""}
    ${slabLadder(active.slabs)}
    <div class="ac-foot"><span>${escHtml(fmRuleLabel(active.forceMajeureRule))}</span>${active.minNoticeHours != null ? `<span>Min notice: <b>${active.minNoticeHours} ghante</b></span>` : ""}${canEditKeep ? `<button class="btn sm ac-edit" type="button" data-keep-edit>${keep!.kind === "partial_fixed" ? "Rakhi hui raqam badlein" : "Rakhi hui share badlein"}</button>` : ""}</div></div>`
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

/** The drawer form: same fields, labels and rules as registration step 4 (Venue Keeps: Fixed Amount | Percentage). */
function keepFormHtml(type: "fixed" | "percent", value: number | undefined): string {
  return `
  <div class="dfield"><label class="dlabel" for="kp-type">Venue Keeps</label>
    <select id="kp-type"><option value="fixed"${type === "fixed" ? " selected" : ""}>Fixed Amount</option><option value="percent"${type === "percent" ? " selected" : ""}>Percentage</option></select></div>
  <div class="dfield"><label class="dlabel" for="kp-value" id="kp-label">${type === "percent" ? "Venue Keeps (%)" : "Venue Keeps (PKR)"}</label>
    <input id="kp-value" type="number" inputmode="decimal" min="${type === "percent" ? PARTIAL_PERCENT_MIN : 1}" ${type === "percent" ? `max="${PARTIAL_PERCENT_MAX}" step="0.01"` : 'step="1"'} value="${value ?? ""}" placeholder="${type === "percent" ? "Enter a percentage, 1 to 99" : "Enter the amount the venue keeps"}"/>
    <div class="dhint" id="kp-hint">${type === "percent" ? "If a couple cancels, the venue keeps this share of what they paid and they get the rest back." : "If a couple cancels, the venue keeps this amount of what they paid and they get the rest back (nothing, if they paid no more than this)."}</div>
    <div class="derr" id="kp-err" role="alert"></div></div>
  <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Waapas</button><button class="btn btn-primary" type="button" data-keep-save>Save karein</button></div>`
}

export function CancellationPolicyArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/cancellation-policy", crumbBold: "Ops", crumbSub: "Cancellation policy", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const activeBusinessId = useActiveBusinessId()
  const bizRef = React.useRef(activeBusinessId); bizRef.current = activeBusinessId
  const { data, isError, refetch } = useQuery({ queryKey: ["cancelpolicy-art", activeBusinessId], queryFn: () => getCancellationPolicy(activeBusinessId) })
  const templatesRef = React.useRef<PolicyTemplate[]>([]); templatesRef.current = data?.templates ?? []
  const dataRef = React.useRef<CancellationPolicyState | null>(null); dataRef.current = data ?? null

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    // A failed request rendered as an empty screen, which reads as
    // "you have no data" rather than "we could not load it".
    if (isError) { wwc.innerHTML = errorBannerHtml("Cancellation policy load nahi hui."); return }
    // SETUP-011 - a 404 (the engine is off for this account) resolves to null; that is a
    // state to explain, not a loading line to wait on forever. Only `undefined` is "loading".
    if (data === null) { wwc.innerHTML = `<div class="head"><div><h1>Cancellation policy</h1></div></div><div class="card"><div class="empty" data-policy-disabled>Cancellation policy abhi aap ke account ke liye enable nahi hai. Jab enable hogi, yahan ready-made policies nazar aayengi.</div></div>`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Policy load ho rahi hai…</div>`; return }
    wwc.innerHTML = buildContent(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", async (e) => {
      // the error banner ships a retry button; honour it
      if ((e.target as HTMLElement).closest("[data-retry]")) { void refetch(); return }
      // WP29: change what a Partially Refundable venue keeps (same rules as registration, same server door)
      if ((e.target as HTMLElement).closest("[data-keep-edit]")) {
        const cur = dataRef.current
        const shape = cur ? keepShape(cur) : null
        if (!cur || !shape || shape.kind === "ladder" || shape.kind === "non_refundable") return
        openDrawer(s as unknown as ShadowRoot, "Venue kitna rakhta hai", keepFormHtml(shape.kind === "partial_fixed" ? "fixed" : "percent", shape.value))
        return
      }
      const save = (e.target as HTMLElement).closest("[data-keep-save]") as HTMLButtonElement | null
      if (save) {
        const sh = s as unknown as ShadowRoot
        const type = (sh.getElementById("kp-type") as HTMLSelectElement | null)?.value
        const value = (sh.getElementById("kp-value") as HTMLInputElement | null)?.value ?? ""
        const err = sh.getElementById("kp-err")
        const v = validatePartialRefund(type, value, null)
        if (!v.ok) { if (err) err.textContent = v.message; return }
        if (err) err.textContent = ""
        save.disabled = true; save.textContent = "…"
        try {
          await saveCancellationPolicy({ businessId: bizRef.current, partialRefund: { type: v.type, value: v.value }, slabs: [] })
          toast.success("Rakhi hui raqam badal gayi")
          closeDrawer(sh)
          qc.invalidateQueries({ queryKey: ["cancelpolicy-art", bizRef.current] })
        } catch (e2: unknown) {
          const m = (e2 as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua — dobara koshish karein"
          if (err) err.textContent = m
          save.disabled = false; save.textContent = "Save karein"
        }
        return
      }
      const ap = (e.target as HTMLElement).closest("[data-apply]") as HTMLElement | null
      if (!ap?.dataset.apply) return
      const tpl = templatesRef.current.find((t) => t.key === ap.dataset.apply)
      if (!tpl) return
      const btn = ap as HTMLButtonElement
      // FLAGGED-070 - this changes the live policy for every NEW booking, so it asks first and says what it does
      // to the bookings that already exist.
      openConfirm(s as unknown as ShadowRoot, {
        title: `"${tpl.labelEn || tpl.name}" policy lagayein?`,
        message: `Naye bookings is policy par chalengi${tpl.minNoticeHours ? ` (online cancel ke liye kam az kam ${tpl.minNoticeHours} ghante ka notice)` : ""}. Jo bookings pehle ho chuki hain wo wahi policy rakhengi jo customer ne qabool ki thi.`,
        onConfirm: async () => {
          btn.disabled = true; btn.textContent = "Lag rahi…"
          try {
            // The template's notice window travels with it (it used to be dropped, so the preset's cutoff never applied).
            await saveCancellationPolicy({ name: tpl.name, slabs: tpl.slabs, forceMajeureRule: tpl.forceMajeureRule, businessId: bizRef.current, ...(tpl.minNoticeHours != null ? { minNoticeHours: tpl.minNoticeHours } : {}) })
            toast.success("Policy laagu ho gayi")
            qc.invalidateQueries({ queryKey: ["cancelpolicy-art", bizRef.current] })
          } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Nahi lagi — dobara koshish karein")
            btn.disabled = false; btn.textContent = "Ye policy lagayein"
          }
        },
      })
    })
    // the drawer's type select re-labels the value field (Venue Keeps (%) / (PKR)), as on registration step 4
    s.addEventListener("change", (e) => {
      const sel = (e.target as HTMLElement).closest("#kp-type") as HTMLSelectElement | null
      if (!sel) return
      const sh = s as unknown as ShadowRoot
      const pct = sel.value === "percent"
      const input = sh.getElementById("kp-value") as HTMLInputElement | null
      const label = sh.getElementById("kp-label"); const hint = sh.getElementById("kp-hint"); const err = sh.getElementById("kp-err")
      if (label) label.textContent = pct ? "Venue Keeps (%)" : "Venue Keeps (PKR)"
      if (hint) hint.textContent = pct ? "If a couple cancels, the venue keeps this share of what they paid and they get the rest back." : "If a couple cancels, the venue keeps this amount of what they paid and they get the rest back (nothing, if they paid no more than this)."
      if (err) err.textContent = ""
      if (input) { input.value = ""; input.min = pct ? String(PARTIAL_PERCENT_MIN) : "1"; if (pct) { input.max = String(PARTIAL_PERCENT_MAX); input.step = "0.01" } else { input.removeAttribute("max"); input.step = "1" }; input.placeholder = pct ? "Enter a percentage, 1 to 99" : "Enter the amount the venue keeps" }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default CancellationPolicyArtifact
