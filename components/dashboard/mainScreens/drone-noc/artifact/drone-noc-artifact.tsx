"use client"

/**
 * Drone NOC — premium rebuild on the shared champagne shell.
 * Real drone-permit register via DroneNocAPI.list + create / remove. Status
 * tabs, validity, issuing authority; expiring permits are flagged.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { DroneNocAPI, type DroneNOC, type PermitStatus, type PermitType, type IssuingAuthority, type CreatePermitInput } from "@/lib/api/droneNoc"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useArtifactShell, escHtml, initTablePager, loadPref, savePref, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const ST_LABEL: Record<PermitStatus, string> = { pending: "Zeer-e-ghaur", approved: "Manzoor", rejected: "Radd", cancelled: "Cancel", expired: "Khatam", expiring_soon: "Jald khatam" }
const ST_TONE: Record<PermitStatus, string> = { pending: "warn", approved: "ok", rejected: "bad", cancelled: "mut", expired: "mut", expiring_soon: "warn" }
const AUTH_LABEL: Record<string, string> = { pcaa: "PCAA", home_dept_pb: "Home Dept (Punjab)", home_dept_sindh: "Home Dept (Sindh)", home_dept_kpk: "Home Dept (KPK)", home_dept_balochistan: "Home Dept (Balochistan)", police_station: "Police station" }
const TYPE_LABEL: Record<string, string> = { single_event: "Single event", blanket_annual: "Salana (blanket)", provincial_home_dept: "Provincial", police_intimation: "Police intimation" }
const AUTHS = Object.keys(AUTH_LABEL) as IssuingAuthority[]
const TYPES = Object.keys(TYPE_LABEL) as PermitType[]
const STATUSES: PermitStatus[] = ["pending", "approved", "expiring_soon", "expired", "rejected", "cancelled"]
function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) }
const todayIso = () => new Date().toISOString().slice(0, 10)
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = { plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', drone: '<path d="M4 4l4 4M20 4l-4 4M4 20l4-4M20 20l-4-4"/><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><rect x="9" y="9" width="6" height="6" rx="1"/>', check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>' }
function transBtns(status: string, id: number): string {
  if (status === "pending") return `<button class="tbtn ok" data-trans="${id}" data-to="approved" title="Approve">${svg(IC.check, 2.4)}</button><button class="tbtn bad" data-trans="${id}" data-to="rejected" title="Reject">${svg(IC.x, 2.2)}</button>`
  if (status === "approved" || status === "expiring_soon") return `<button class="tbtn" data-trans="${id}" data-to="cancelled" title="Cancel">${svg(IC.x, 2.2)}</button>`
  return ""
}

const EXTRA_CSS = String.raw`
.d-tiles{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:10px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:10px 13px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); } .tile.ok .t-val{ color:var(--ok); } .tile.warn .t-val{ color:var(--warn); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:20px; font-weight:680; margin-top:8px; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.addform{ display:none; padding:16px; border-bottom:1px solid var(--border); background:var(--surface-2); } .addform.on{ display:block; }
.frow{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:12px; }
.field{ display:flex; flex-direction:column; gap:5px; } .flabel{ font-size:11.5px; font-weight:600; color:var(--ink-2); } .flabel .req{ color:var(--bad); }
.field input,.field select{ width:100%; border:1px solid var(--border-2); border-radius:9px; background:var(--surface); color:var(--ink); padding:8px 10px; font:inherit; font-size:12.5px; outline:none; } .field input:focus,.field select:focus{ border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-wash); }
.af-foot{ display:flex; gap:8px; justify-content:flex-end; }
.del{ width:30px; height:30px; border-radius:7px; border:0; background:transparent; color:var(--ink-3); display:grid; place-items:center; } .del:hover{ background:var(--bad-wash); color:var(--bad); } .del svg{ width:15px; height:15px; }
.rowacts{ display:flex; gap:6px; justify-content:flex-end; align-items:center; }
.tbtn{ width:30px; height:30px; border-radius:7px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; } .tbtn svg{ width:15px; height:15px; } .tbtn:hover{ filter:brightness(.97); }
.tbtn.ok{ color:var(--ok); border-color:transparent; background:var(--ok-wash); } .tbtn.bad{ color:var(--bad); border-color:transparent; background:var(--bad-wash); }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:820px){ .d-tiles{ grid-template-columns:1fr; } .frow{ grid-template-columns:1fr; } }
`

function buildContent(list: DroneNOC[], filter: string): string {
  const cnt = (s: PermitStatus) => list.filter((p) => p.status === s).length
  const approved = cnt("approved"), expiring = cnt("expiring_soon") + cnt("expired")
  const tiles = `<div class="d-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.drone, 1.7)} Kul permits</div><div class="t-val tnum">${list.length}</div><div class="t-sub">drone NOCs</div></div>
    <div class="tile ok"><div class="t-cap">${svg(IC.check, 1.9)} Manzoor</div><div class="t-val tnum">${approved}</div><div class="t-sub">valid permits</div></div>
    <div class="tile ${expiring > 0 ? "warn" : ""}"><div class="t-cap">${svg(IC.warn, 1.9)} Khatam/jald</div><div class="t-val tnum">${expiring}</div><div class="t-sub">renew karne hain</div></div>
  </div>`
  const tab = (f: string, label: string, c: number) => `<button class="tab${f === filter ? " on" : ""}" data-f="${f}">${label} <span class="cnt">${c}</span></button>`
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">${tab("all", "Sab", list.length)}${STATUSES.filter((s) => cnt(s) > 0).map((s) => tab(s, ST_LABEL[s], cnt(s))).join("")}</div><div class="filters"><button class="btn btn-primary" id="addbtn">${svg(IC.plus, 2.2)} Naya permit</button></div></div>`
  const authOpts = AUTHS.map((a) => `<option value="${a}">${escHtml(AUTH_LABEL[a])}</option>`).join("")
  const typeOpts = TYPES.map((t) => `<option value="${t}">${escHtml(TYPE_LABEL[t])}</option>`).join("")
  const addForm = `<div class="addform" id="addform">
    <div class="frow">
      <div class="field"><label class="flabel">Reference # <span class="req">*</span></label><input type="text" id="p-ref" placeholder="NOC-2026-..."/></div>
      <div class="field"><label class="flabel">Kism</label><select id="p-type">${typeOpts}</select></div>
      <div class="field"><label class="flabel">Authority</label><select id="p-auth">${authOpts}</select></div>
    </div>
    <div class="frow">
      <div class="field"><label class="flabel">Drone model</label><input type="text" id="p-model" placeholder="DJI Mavic 3"/></div>
      <div class="field"><label class="flabel">Valid from <span class="req">*</span></label><input type="date" id="p-from" value="${todayIso()}"/></div>
      <div class="field"><label class="flabel">Valid until <span class="req">*</span></label><input type="date" id="p-until"/></div>
    </div>
    <div class="frow">
      <div class="field"><label class="flabel">Pilot ka naam</label><input type="text" id="p-pilot" placeholder="Pilot ka poora naam"/></div>
      <div class="field"><label class="flabel">Pilot licence #</label><input type="text" id="p-lic" placeholder="Licence number"/></div>
      <div class="field"><label class="flabel">Drone reg #</label><input type="text" id="p-reg" placeholder="optional"/></div>
    </div>
    <div class="af-foot"><button class="btn btn-ghost" id="af-cancel">Cancel</button><button class="btn btn-primary" id="af-save">Permit save karein</button></div></div>`
  const rows = list.filter((p) => filter === "all" || p.status === filter)
  const body = rows.map((p) => `<tr>
    <td><div class="cc-nm">${escHtml(p.referenceNumber)}</div><div class="cc-ev">${escHtml(TYPE_LABEL[p.permitType] || p.permitType)}</div></td>
    <td class="td-mut">${escHtml(AUTH_LABEL[p.issuingAuthority] || p.issuingAuthority)}</td>
    <td class="td-mut">${escHtml(p.droneModel || "—")}${p.pilotName ? `<div class="cc-ev">${escHtml(p.pilotName)}</div>` : ""}</td>
    <td class="td-date">${fmtDate(p.validFrom)} → ${fmtDate(p.validUntil)}</td>
    <td><span class="st ${ST_TONE[p.status]}"><i></i> ${escHtml(ST_LABEL[p.status])}</span>${p.statusReason ? `<div class="cc-ev" style="color:var(--ink-3)">${escHtml(p.statusReason)}</div>` : ""}</td>
    <td class="r"><div class="rowacts">${transBtns(p.status, p.id)}<button class="del" data-del="${p.id}" title="Delete">${svg(IC.trash)}</button></div></td>
  </tr>`).join("")
  return `
  <div class="head"><div><h1>Drone NOC</h1><div class="sub">Drone permits ka register — <b>${list.length}</b> permits.</div></div></div>
  ${tiles}${toolbar}
  <div class="card">${addForm}<div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Reference</th><th>Authority</th><th>Drone</th><th>Validity</th><th>Status</th><th></th></tr></thead>
    <tbody>${body}</tbody></table></div>
    ${rows.length ? `<div class="tbl-foot"><span>${rows.length} permits</span></div>` : `<div class="empty">Koi permit nahi. "Naya permit" se add karein.</div>`}</div>
  <div class="foot">WeddingWala vendor console · Drone NOC</div>`
}

export function DroneNocArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/drone-noc", crumbBold: "Compliance", crumbSub: "Drone NOC", extraCss: EXTRA_CSS })
  const qc = useQueryClient()
  const activeBusinessId = useActiveBusinessId()
  const bizRef = React.useRef(activeBusinessId); bizRef.current = activeBusinessId
  const { data } = useQuery({ queryKey: ["drone-art", activeBusinessId], queryFn: () => DroneNocAPI.list(activeBusinessId != null ? { businessId: activeBusinessId } : {}) })
  const list = React.useMemo(() => (data?.permits ?? []) as DroneNOC[], [data])
  const [filter, setFilter] = React.useState(() => loadPref("tab:drone-noc", "all"))

  React.useEffect(() => {
    const s = shadowRef.current; if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Permits load ho rahe hain…</div>`; return }
    wwc.innerHTML = buildContent(list, filter)
    initTablePager(s, { pageSize: 25 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, filter])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current; if (!s || !ready || bound.current) return
    bound.current = true
    const refetch = () => qc.invalidateQueries({ queryKey: ["drone-art", bizRef.current] })
    const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? ""
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      const tab = t.closest(".tab") as HTMLElement | null
      if (tab?.dataset.f) { savePref("tab:drone-noc", tab.dataset.f); setFilter(tab.dataset.f); return }
      if (t.closest("#addbtn")) { s.getElementById("addform")?.classList.toggle("on"); return }
      if (t.closest("#af-cancel")) { s.getElementById("addform")?.classList.remove("on"); return }
      const trans = t.closest("[data-trans]") as HTMLElement | null
      if (trans?.dataset.trans) {
        const id = Number(trans.dataset.trans), to = trans.dataset.to as "approved" | "rejected" | "cancelled"
        let reason: string | undefined
        if (to === "rejected" || to === "cancelled") { const r = window.prompt(to === "rejected" ? "Reject ki wajah? (optional)" : "Cancel ki wajah? (optional)"); if (r === null) return; reason = r.trim() || undefined }
        try { await DroneNocAPI.transition(id, { to, statusReason: reason }); toast.success(to === "approved" ? "Approve ho gaya" : to === "rejected" ? "Reject kar diya" : "Cancel kar diya"); refetch() }
        catch { toast.error("Nahi hua") }
        return
      }
      const del = t.closest("[data-del]") as HTMLElement | null
      if (del?.dataset.del) { const id = Number(del.dataset.del); openConfirm(s, { title: "Permit delete karein?", message: "Ye record hat jayega — wapas nahi aayega.", danger: true, onConfirm: async () => { try { await DroneNocAPI.remove(id); toast.success("Permit hata diya"); refetch() } catch { toast.error("Delete nahi hua") } } }); return }
      if (t.closest("#af-save")) {
        const bId = Number(bizRef.current); if (!bId) { toast.error("Pehle ek venue select karein"); return }
        const ref = val("p-ref"); if (!ref) { toast.error("Reference # likhein"); return }
        if (!val("p-from") || !val("p-until")) { toast.error("Validity dates chunein"); return }
        const body: CreatePermitInput = { businessId: bId, referenceNumber: ref, permitType: val("p-type") as PermitType, issuingAuthority: val("p-auth") as IssuingAuthority, validFrom: val("p-from"), validUntil: val("p-until") }
        if (val("p-model")) body.droneModel = val("p-model")
        if (val("p-pilot")) body.pilotName = val("p-pilot")
        if (val("p-lic")) body.pilotLicense = val("p-lic")
        if (val("p-reg")) body.droneRegNumber = val("p-reg")
        const btn = s.getElementById("af-save") as HTMLButtonElement | null; if (btn) { btn.disabled = true; btn.textContent = "Save ho raha…" }
        try { await DroneNocAPI.create(body); toast.success("Permit add ho gaya"); refetch() } catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua"); if (btn) { btn.disabled = false; btn.textContent = "Permit save karein" } }
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default DroneNocArtifact
