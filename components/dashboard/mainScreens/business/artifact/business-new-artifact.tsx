"use client"

/**
 * Register a new venue — premium rebuild on the shared champagne shell.
 * A single, focused form (no 8-step wizard) wired to BusinessesAPI.addMyBusiness
 * with live validation. On success it routes to Settings to finish the listing.
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { BusinessesAPI, type NewBusinessInput } from "@/lib/api/dashboard"
import { CITIES } from "@/lib/seo/constants"
import { useArtifactShell, escHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  building: '<path d="M3 21h18M6 21V7l6-4 6 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
}

const EXTRA_CSS = String.raw`
.content{ max-width:760px; }
.back{ display:inline-flex; align-items:center; gap:5px; font-size:12.5px; color:var(--ink-3); font-weight:500; margin-bottom:14px; background:none; border:0; } .back:hover{ color:var(--ink); } .back svg{ width:15px; height:15px; }
.reg-note{ display:flex; gap:11px; align-items:flex-start; padding:12px 14px; border-radius:10px; background:var(--accent-wash); border:1px solid var(--accent-line); margin-bottom:16px; }
.reg-note svg{ width:17px; height:17px; color:var(--accent-ink); flex:none; margin-top:1px; }
.reg-note .rn-t{ font-weight:600; font-size:12.5px; color:var(--accent-ink); } .reg-note .rn-s{ font-size:11.5px; color:var(--ink-2); margin-top:2px; line-height:1.5; }
.panel-h{ display:flex; align-items:center; gap:12px; padding:16px 18px 14px; border-bottom:1px solid var(--border); }
.panel-ic{ width:38px; height:38px; border-radius:10px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .panel-ic svg{ width:19px; height:19px; }
.panel-h h2{ font-size:15px; font-weight:600; } .panel-h .sub{ font-size:12px; color:var(--ink-3); margin-top:2px; }
.panel-body{ padding:18px; }
.field{ display:flex; flex-direction:column; gap:6px; margin-bottom:16px; } .field:last-child{ margin-bottom:0; }
.frow{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
@media (max-width:560px){ .frow{ grid-template-columns:1fr; } }
.flabel{ font-size:12px; font-weight:600; color:var(--ink-2); } .flabel .req{ color:var(--bad); }
.fhint{ font-size:11px; color:var(--ink-3); } .ferr{ font-size:11px; color:var(--bad); font-weight:500; }
.field input,.field select,.field textarea{ width:100%; border:1px solid var(--border-2); border-radius:9px; background:var(--surface-2); color:var(--ink); padding:9px 11px; font:inherit; font-size:13px; outline:none; transition:border-color .12s,background .12s; }
.field input:focus,.field select:focus,.field textarea:focus{ border-color:var(--accent); background:var(--surface); box-shadow:0 0 0 3px var(--accent-wash); }
.field textarea{ min-height:82px; resize:vertical; line-height:1.55; }
.field .suffix{ position:relative; } .field .suffix input{ padding-left:34px; } .field .suffix .rs{ position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:12px; color:var(--ink-3); font-weight:600; }
.field.bad input{ border-color:var(--bad); }
.reg-foot{ display:flex; align-items:center; gap:10px; padding:14px 18px; border-top:1px solid var(--border); }
.reg-foot .sp{ flex:1; } .reg-foot .why{ font-size:11.5px; color:var(--ink-3); }
.btn[disabled]{ opacity:.55; cursor:default; }
`

function buildContent(): string {
  const cityOpts = ["", ...CITIES.map((c) => c.name)].map((c) => `<option value="${escHtml(c)}">${escHtml(c || "— sheher chunein —")}</option>`).join("")
  return `
  <button class="back" data-nav-btn="/dashboard/settings">${svg(IC.back, 2.2)} Settings</button>
  <div class="head"><div><h1>Naya venue register karein</h1><div class="sub">Ek aur venue ya service apne account mein jodein.</div></div></div>
  <div class="reg-note">${svg(IC.clock)}<div><div class="rn-t">Review ke baad live hota hai</div><div class="rn-s">Naam aur sheher se register karein — baaki tafseel (photos, packages, pricing) Settings mein mukammal karein. Team review karke approve karti hai.</div></div></div>
  <div class="card">
    <div class="panel-h"><span class="panel-ic">${svg(IC.building, 1.8)}</span><div><h2>Venue ki maloomat</h2><div class="sub">Sirf naam aur sheher zaroori hain</div></div></div>
    <div class="panel-body">
      <div class="field" id="f-name"><label class="flabel">Business ka naam <span class="req">*</span></label><input type="text" id="b-name" placeholder="Jaise: Rehman Grand Marquee"/><span class="fhint">Wedding Wala par unique hona chahiye.</span></div>
      <div class="frow">
        <div class="field" id="f-city"><label class="flabel">Sheher <span class="req">*</span></label><select id="b-city">${cityOpts}</select></div>
        <div class="field"><label class="flabel">Ilaqa / locality</label><input type="text" id="b-subArea" placeholder="Johar Town"/></div>
      </div>
      <div class="field"><label class="flabel">Tafseel (description)</label><textarea id="b-description" placeholder="Do line — venue kaisa hai, kya khaas hai."></textarea></div>
      <div class="field"><label class="flabel">Shuru ki qeemat (minimum)</label><div class="suffix"><span class="rs">Rs</span><input type="number" id="b-minimumPrice" min="0" placeholder="500000"/></div><span class="fhint">Baad mein Settings se badal sakte hain.</span></div>
      <div class="frow">
        <div class="field" id="f-cap"><label class="flabel">Kam se kam mehmaan</label><input type="number" id="b-minCapacity" min="0" placeholder="100"/></div>
        <div class="field"><label class="flabel">Zyada se zyada mehmaan</label><input type="number" id="b-maxCapacity" min="0" placeholder="1000"/><span class="ferr" id="cap-err" hidden>Max, min se bara hona chahiye.</span></div>
      </div>
    </div>
    <div class="reg-foot"><span class="why" id="reg-why">Naam aur sheher likhein.</span><span class="sp"></span>
      <button class="btn btn-ghost" data-nav-btn="/dashboard/settings">Cancel</button>
      <button class="btn btn-primary" id="reg-save" disabled>${svg(IC.check)} Review ke liye bhejein</button></div>
  </div>`
}

export function BusinessNewArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/business/new", crumbBold: "Set up", crumbSub: "Naya business", extraCss: EXTRA_CSS,
  })
  const router = useRouter()
  const qc = useQueryClient()

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    wwc.innerHTML = buildContent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.value?.trim() ?? ""

    const validate = () => {
      const name = val("b-name"), city = val("b-city")
      const lo = val("b-minCapacity"), hi = val("b-maxCapacity")
      const capInverted = lo !== "" && hi !== "" && Number(lo) > Number(hi)
      const capErr = s.getElementById("cap-err"); if (capErr) (capErr as HTMLElement).hidden = !capInverted
      s.getElementById("f-cap")?.classList.toggle("bad", capInverted)
      const ok = name.length > 1 && city.length > 0 && !capInverted
      const btn = s.getElementById("reg-save") as HTMLButtonElement | null; if (btn) btn.disabled = !ok
      const why = s.getElementById("reg-why")
      if (why) why.textContent = capInverted ? "Capacity theek karein." : !name || name.length <= 1 ? "Business ka naam likhein." : !city ? "Sheher chunein." : "Register karne ke liye tayar."
      return ok
    }

    const submit = async () => {
      if (!validate()) return
      const num = (v: string) => { const n = Number(v); return v !== "" && Number.isFinite(n) && n >= 0 ? n : undefined }
      const payload: NewBusinessInput = { name: val("b-name"), city: val("b-city") }
      if (val("b-subArea")) payload.subArea = val("b-subArea")
      if (val("b-description")) payload.description = val("b-description")
      const mp = num(val("b-minimumPrice")); if (mp !== undefined) payload.minimumPrice = mp
      const lo = num(val("b-minCapacity")); if (lo !== undefined) payload.minCapacity = lo
      const hi = num(val("b-maxCapacity")); if (hi !== undefined) payload.maxCapacity = hi
      const btn = s.getElementById("reg-save") as HTMLButtonElement | null
      if (btn) { btn.disabled = true; btn.textContent = "Bhej rahe…" }
      try {
        await BusinessesAPI.addMyBusiness(payload)
        toast.success("Venue register ho gaya — review ke baad live hoga")
        qc.invalidateQueries({ queryKey: ["settings-businesses"] })
        qc.invalidateQueries({ queryKey: ["onboarding-completeness"] })
        router.push("/dashboard/settings")
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Register nahi hua — dobara koshish karein"
        toast.error(msg)
        if (btn) { btn.disabled = false; btn.innerHTML = `${svg(IC.check)} Review ke liye bhejein` }
      }
    }

    s.addEventListener("input", validate)
    s.addEventListener("change", validate)
    s.addEventListener("click", (e) => { if ((e.target as HTMLElement).closest("#reg-save")) submit() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default BusinessNewArtifact
