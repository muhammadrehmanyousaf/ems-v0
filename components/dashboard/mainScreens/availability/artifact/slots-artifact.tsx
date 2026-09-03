"use client"

/**
 * Bookable slots (availability engine) — the venue defines its bookable
 * time-slots here: label, start–end, how many concurrent bookings (capacity),
 * per-booking guest cap, and which weekdays. These BusinessSlotTemplate rows are
 * what the booking form offers, what capacity is enforced against, and what the
 * calendar's per-day blocking (M5) blocks. Before this there was no way to
 * create or edit them — the legacy Availability screen just pointed venues to
 * the calendar. Wired to SlotTemplatesAPI, scoped to the active business.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { SlotTemplatesAPI, type SlotTemplate, type UpsertSlotTemplateInput } from "@/lib/api/businessAvailability"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useBusiness } from "@/context/BusinessContext"
import { useArtifactShell, escHtml, openDrawer, closeDrawer, venuePickerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

/* Mon=1, Tue=2, … Sun=64 (mirrors BusinessSlotTemplate.weekdayMask). */
const DAYS: [string, number][] = [["Pir", 1], ["Man", 2], ["Bud", 4], ["Jum", 8], ["Jum'a", 16], ["Haf", 32], ["Itw", 64]]
const ALL_MASK = 127
const maskDays = (m: number) => DAYS.filter(([, b]) => (m & b) !== 0)
const hhmm = (t?: string | null) => { if (!t) return "—"; const [h, mm] = String(t).split(":").map(Number); if (Number.isNaN(h)) return String(t); const ap = h >= 12 ? "PM" : "AM"; return `${(h % 12) || 12}:${String(mm || 0).padStart(2, "0")} ${ap}` }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', users: '<path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>',
  cal: '<path d="M4 4h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 2v4M16 2v4M4 10h16"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', power: '<path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0"/>', bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7z"/>',
}

const EXTRA_CSS = String.raw`
.content{ max-width:1080px; }
.sl-intro{ font-size:12.5px; color:var(--ink-3); line-height:1.55; margin:-2px 0 16px; max-width:640px; }
.sl-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
.sl-card{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); padding:15px 16px; display:flex; flex-direction:column; gap:10px; }
.sl-card.off{ opacity:.62; }
.sl-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.sl-nm{ font-size:14.5px; font-weight:660; letter-spacing:-.01em; } .sl-time{ font-size:12px; color:var(--ink-3); margin-top:2px; display:flex; align-items:center; gap:5px; } .sl-time svg{ width:12px; height:12px; }
.sl-meta{ display:flex; gap:16px; }
.sl-m{ } .sl-m .v{ font-size:16px; font-weight:660; font-variant-numeric:tabular-nums; } .sl-m .c{ font-size:10.5px; color:var(--ink-3); margin-top:1px; }
.sl-days{ display:flex; gap:4px; flex-wrap:wrap; }
.dchip{ font-size:10px; font-weight:600; padding:2px 7px; border-radius:6px; background:var(--surface-3); color:var(--ink-3); } .dchip.on{ background:var(--accent-wash); color:var(--accent-ink); }
.sl-foot{ display:flex; gap:7px; margin-top:2px; padding-top:10px; border-top:1px solid var(--border); }
.sl-btn{ height:32px; padding:0 12px; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:6px; } .sl-btn:hover{ background:var(--surface-3); color:var(--ink); } .sl-btn svg{ width:13px; height:13px; }
.sl-btn.danger:hover{ color:var(--bad); border-color:var(--bad); } .sl-btn.ok{ color:var(--ok); }
.sl-pill{ font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; } .sl-pill.on{ color:var(--ok); background:var(--ok-wash); } .sl-pill.off{ color:var(--ink-3); background:var(--surface-3); }
.sl-empty{ text-align:center; padding:44px 20px; border:1px dashed var(--border-2); border-radius:var(--r); color:var(--ink-3); }
.sl-empty h3{ font-size:15px; font-weight:600; color:var(--ink); margin-bottom:6px; } .sl-empty p{ font-size:12.5px; margin-bottom:16px; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
.wd-pick{ display:flex; gap:6px; flex-wrap:wrap; } .wd-pick .wd{ height:34px; min-width:44px; padding:0 10px; border:1px solid var(--border); border-radius:8px; background:var(--surface); color:var(--ink-2); font-size:12px; font-weight:600; } .wd-pick .wd.on{ background:var(--accent-wash); color:var(--accent-ink); border-color:var(--accent-line); }
.wd-quick{ display:flex; gap:8px; margin-top:8px; } .wd-quick button{ font-size:11.5px; font-weight:600; color:var(--accent-ink); background:none; border:0; padding:2px 4px; } .wd-quick button:hover{ text-decoration:underline; }
.dhint{ font-size:11px; color:var(--ink-3); margin-top:4px; line-height:1.5; }
`

function slotCard(t: SlotTemplate): string {
  const days = maskDays(t.weekdayMask)
  const allDays = t.weekdayMask === ALL_MASK
  return `<div class="sl-card ${t.isActive ? "" : "off"}">
    <div class="sl-top">
      <div><div class="sl-nm">${escHtml(t.label)}</div><div class="sl-time">${svg(IC.clock)} ${hhmm(t.startTime)} – ${hhmm(t.endTime)}</div></div>
      <span class="sl-pill ${t.isActive ? "on" : "off"}">${t.isActive ? "Chalu" : "Band"}</span>
    </div>
    <div class="sl-meta">
      <div class="sl-m"><div class="v">${t.capacity}</div><div class="c">Aik waqt booking</div></div>
      <div class="sl-m"><div class="v">${t.unitGuestCapacity != null ? t.unitGuestCapacity : "—"}</div><div class="c">Max mehmaan / booking</div></div>
      ${t.bufferAfterMinutes ? `<div class="sl-m"><div class="v">${t.bufferAfterMinutes}m</div><div class="c">Buffer</div></div>` : ""}
    </div>
    <div class="sl-days">${allDays ? `<span class="dchip on">Har din</span>` : DAYS.map(([lbl, bit]) => `<span class="dchip ${(t.weekdayMask & bit) ? "on" : ""}">${lbl}</span>`).join("")}</div>
    <div class="sl-foot">
      <button class="sl-btn" data-slot-edit="${t.id}">${svg(IC.edit)} Edit</button>
      <button class="sl-btn ${t.isActive ? "danger" : "ok"}" data-slot-toggle="${t.id}" data-slot-active="${t.isActive ? "1" : "0"}">${svg(IC.power)} ${t.isActive ? "Band karein" : "Chalu karein"}</button>
    </div>
  </div>${!allDays && days.length === 0 ? "" : ""}`
}

function slotFormBody(t?: SlotTemplate | null): string {
  const mask = t?.weekdayMask ?? ALL_MASK
  return `
  <div class="dfield"><label class="dlabel">Slot ka naam <span class="req">*</span></label><input id="sl-label" value="${t ? escHtml(t.label) : ""}" placeholder="e.g. Shaam ka function, Dopeher"/></div>
  <div class="dfield row2">
    <div><label class="dlabel">Shuru <span class="req">*</span></label><input id="sl-start" type="time" value="${t?.startTime ? String(t.startTime).slice(0, 5) : "19:00"}"/></div>
    <div><label class="dlabel">Khatam <span class="req">*</span></label><input id="sl-end" type="time" value="${t?.endTime ? String(t.endTime).slice(0, 5) : "23:00"}"/></div>
  </div>
  <div class="dfield row2">
    <div><label class="dlabel">Aik waqt kitni booking</label><input id="sl-cap" type="number" min="1" value="${t?.capacity ?? 1}"/><div class="dhint">Aksar 1 — ek slot par ek shaadi.</div></div>
    <div><label class="dlabel">Max mehmaan / booking</label><input id="sl-guests" type="number" min="0" value="${t?.unitGuestCapacity ?? ""}" placeholder="e.g. 500"/><div class="dhint">Khaali = koi hadd nahi.</div></div>
  </div>
  <div class="dfield"><label class="dlabel">Kaunse din chalta hai</label>
    <div class="wd-pick" id="sl-days" data-mask="${mask}">${DAYS.map(([lbl, bit]) => `<button type="button" class="wd ${(mask & bit) ? "on" : ""}" data-bit="${bit}">${lbl}</button>`).join("")}</div>
    <div class="wd-quick"><button type="button" data-wd-all>Sab din</button><button type="button" data-wd-wknd>Sirf weekend</button></div>
  </div>
  <div class="dfield"><label class="dlabel">Buffer (minute, optional)</label><input id="sl-buffer" type="number" min="0" value="${t?.bufferAfterMinutes ?? 0}"/><div class="dhint">Ek booking ke baad safai/setup ka waqt.</div></div>
  <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Waapas</button><button class="btn btn-primary" type="button" data-slot-save="${t?.id ?? "new"}">${t ? "Update karein" : "Slot banayein"}</button></div>`
}

function buildContent(templates: SlotTemplate[]): string {
  const head = `<div class="head"><div><h1>Bookable slots</h1><div class="sub">Aap ki venue kab-kab bookable hai — waqt, capacity aur din.</div></div>
    <div class="head-actions"><button class="btn btn-primary" data-slot-new>${svg(IC.plus)} Naya slot</button></div></div>`
  const intro = `<div class="sl-intro">Yeh slots woh hain jo customer booking ke waqt chunta hai, aur inhi par capacity + double-booking rukti hai. Calendar par kisi khaas din inhe band bhi kar saktay hain.</div>`
  if (!templates.length) {
    return `${head}<div class="sl-empty"><h3>Abhi koi slot nahi</h3><p>Shuru karne ke liye standard slots (Subah / Dopeher / Shaam) daal dein — baad mein edit kar saktay hain.</p>
      <button class="btn btn-primary" data-slot-seed>${svg(IC.bolt)} Standard slots daalein</button> <button class="btn btn-ghost" data-slot-new>${svg(IC.plus)} Khud banayein</button></div>`
  }
  const active = templates.filter((t) => t.isActive)
  return `${head}${intro}
    <div class="sl-grid">${templates.map((t) => slotCard(t)).join("")}</div>
    <div class="foot">${active.length} chalu slot${active.length === 1 ? "" : "s"} · ${templates.length} total · WeddingWala vendor console</div>`
}

export function SlotsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/slots", crumbBold: "Set up", crumbSub: "Bookable slots", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const activeBusinessId = useActiveBusinessId()
  const { businesses } = useBusiness()
  const bizRef = React.useRef(activeBusinessId); bizRef.current = activeBusinessId
  const tplQ = useQuery({
    queryKey: ["slots-setup", activeBusinessId],
    enabled: !!activeBusinessId,
    queryFn: () => SlotTemplatesAPI.list(activeBusinessId as number, { onlyActive: false }),
  })
  const templates = React.useMemo(() => (tplQ.data ?? []).slice().sort((a, b) => (a.sortOrder - b.sortOrder) || a.id - b.id), [tplQ.data])
  const tplRef = React.useRef(templates); tplRef.current = templates

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!activeBusinessId) { wwc.innerHTML = venuePickerHtml((businesses || []) as { id: number; name?: string }[], { title: "Kaunsi venue ke slots?", sub: "Bookable slots ek venue ke liye set hote hain — neeche se chunein." }); return }
    if (tplQ.isLoading) { wwc.innerHTML = `<div class="loadwrap">Slots load ho rahe hain…</div>`; return }
    wwc.innerHTML = buildContent(templates)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, tplQ.data, tplQ.isLoading, activeBusinessId, businesses])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const refresh = () => qc.invalidateQueries({ queryKey: ["slots-setup"] })
    const readForm = (): UpsertSlotTemplateInput | null => {
      const val = (id: string) => (s.getElementById(id) as HTMLInputElement | null)?.value?.trim() || ""
      const label = val("sl-label"); const start = val("sl-start"); const end = val("sl-end")
      if (!label) { toast.error("Slot ka naam likhein"); return null }
      if (!start || !end) { toast.error("Shuru aur khatam ka waqt daalein"); return null }
      const mask = Number((s.getElementById("sl-days") as HTMLElement | null)?.dataset.mask || ALL_MASK)
      if (!mask) { toast.error("Kam az kam ek din chunein"); return null }
      const guests = val("sl-guests")
      return {
        label, startTime: start, endTime: end,
        capacity: Math.max(1, Number(val("sl-cap")) || 1),
        unitGuestCapacity: guests ? Number(guests) : null,
        weekdayMask: mask,
        bufferAfterMinutes: Math.max(0, Number(val("sl-buffer")) || 0),
      }
    }

    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      const biz = bizRef.current; if (!biz) return

      if (t.closest("[data-slot-new]")) { openDrawer(s, "Naya slot", slotFormBody(null)); return }
      const ed = t.closest("[data-slot-edit]") as HTMLElement | null
      if (ed?.dataset.slotEdit) { const tpl = tplRef.current.find((x) => x.id === Number(ed.dataset.slotEdit)); if (tpl) openDrawer(s, "Slot edit", slotFormBody(tpl)); return }

      // weekday toggles inside the drawer
      const wd = t.closest("[data-bit]") as HTMLElement | null
      if (wd?.dataset.bit) {
        const wrap = s.getElementById("sl-days"); if (!wrap) return
        const bit = Number(wd.dataset.bit); let mask = Number(wrap.dataset.mask || 0)
        mask = (mask & bit) ? (mask & ~bit) : (mask | bit)
        wrap.dataset.mask = String(mask); wd.classList.toggle("on", (mask & bit) !== 0)
        return
      }
      if (t.closest("[data-wd-all]")) { const w = s.getElementById("sl-days"); if (w) { w.dataset.mask = String(ALL_MASK); w.querySelectorAll(".wd").forEach((b) => b.classList.add("on")) } return }
      if (t.closest("[data-wd-wknd]")) { const w = s.getElementById("sl-days"); if (w) { const wk = 16 | 32 | 64; w.dataset.mask = String(wk); w.querySelectorAll(".wd").forEach((b) => b.classList.toggle("on", (wk & Number((b as HTMLElement).dataset.bit)) !== 0)) } return }

      // seed defaults
      if (t.closest("[data-slot-seed]")) {
        const btn = t.closest("[data-slot-seed]") as HTMLButtonElement; btn.disabled = true; btn.textContent = "Ban rahe…"
        try { await SlotTemplatesAPI.seedDefaults(biz); toast.success("Standard slots daal diye"); refresh() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Seed nahi hua"); btn.disabled = false }
        return
      }

      // save (create or update)
      const save = t.closest("[data-slot-save]") as HTMLButtonElement | null
      if (save?.dataset.slotSave) {
        const body = readForm(); if (!body) return
        const id = save.dataset.slotSave
        save.disabled = true; const orig = save.textContent; save.textContent = "Save ho raha…"
        try {
          if (id === "new") await SlotTemplatesAPI.create(biz, body)
          else await SlotTemplatesAPI.update(biz, Number(id), body)
          toast.success(id === "new" ? "Slot ban gaya" : "Slot update ho gaya")
          closeDrawer(s); refresh()
        } catch (err: unknown) {
          toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua")
          save.disabled = false; if (orig) save.textContent = orig
        }
        return
      }

      // activate / deactivate
      const tg = t.closest("[data-slot-toggle]") as HTMLButtonElement | null
      if (tg?.dataset.slotToggle) {
        const id = Number(tg.dataset.slotToggle); const isActive = tg.dataset.slotActive === "1"
        tg.disabled = true
        try {
          if (isActive) await SlotTemplatesAPI.deactivate(biz, id)
          else await SlotTemplatesAPI.update(biz, id, { isActive: true })
          toast.success(isActive ? "Slot band ho gaya" : "Slot chalu ho gaya"); refresh()
        } catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Nahi hua"); tg.disabled = false }
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default SlotsArtifact
