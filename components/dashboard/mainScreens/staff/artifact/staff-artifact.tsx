"use client"

/**
 * Staff — premium rebuild on the shared champagne shell.
 * Real roster via StaffAPI.listMembers + createMember / updateMember /
 * removeMember. Payroll roll-up, employment-type filter, WhatsApp/Call, and an
 * inline add/edit form. Attendance / payroll runs stay in the dedicated module.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { StaffAPI, type StaffMember, type StaffRole, type EmploymentType, type CreateMemberInput } from "@/lib/api/staff"
import { useBusiness } from "@/context/BusinessContext"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { waDigits } from "@/components/dashboard/mainScreens/leads/artifact/leads-artifact"
import { useArtifactShell, pkNum, escHtml, initialsOf, initTablePager, errorBannerHtml, loadPref, savePref, openDrawer, closeDrawer, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const ROLE_LABEL: Record<string, string> = {
  waiter: "Waiter", cook_helper: "Cook helper", lead_cook: "Head cook", cleaner: "Safai", parking_valet: "Valet", dhol_player: "Dhol", qari: "Qari", imam: "Imam", decorator: "Decorator", florist: "Florist", lighting_tech: "Lighting", security: "Security", driver: "Driver", photographer: "Photographer", videographer: "Videographer", manager: "Manager", bagpiper: "Bagpiper", stage_host: "Stage host", dj: "DJ", sound_tech: "Sound", other: "Deegar",
}
const ROLES = Object.keys(ROLE_LABEL) as StaffRole[]
const EMP_LABEL: Record<EmploymentType, string> = { permanent_monthly: "Mahana", casual_dihari: "Dihari", contract: "Contract" }
const EMP_TONE: Record<EmploymentType, string> = { permanent_monthly: "ok", casual_dihari: "warn", contract: "info" }
const EMPS: EmploymentType[] = ["permanent_monthly", "casual_dihari", "contract"]
const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20l1.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>', call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  team: '<path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.8"/>', wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
}

const EXTRA_CSS = String.raw`
.st-tiles{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:10px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:10px 13px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:17px; font-weight:680; letter-spacing:-.02em; margin-top:4px; } .t-val .rs{ font-size:12px; color:var(--ink-3); font-weight:600; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.ww-dbody .suffix{ position:relative; } .ww-dbody .suffix input{ padding-left:32px; } .ww-dbody .suffix .rs{ position:absolute; left:11px; top:50%; transform:translateY(-50%); z-index:1; }
.rolechip{ font-size:11px; color:var(--ink-3); }
.rowacts{ display:flex; gap:5px; justify-content:flex-end; align-items:center; }
.iconbtn{ width:30px; height:30px; flex:none; border-radius:7px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; } .iconbtn:hover{ background:var(--surface-3); color:var(--ink); } .iconbtn.wa:hover{ color:var(--ok); border-color:var(--ok); } .iconbtn.bad:hover{ color:var(--bad); border-color:var(--bad); } .iconbtn svg{ width:14px; height:14px; } .iconbtn:disabled{ opacity:.4; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:900px){ .st-tiles{ grid-template-columns:repeat(2,1fr); } }
`

function formBody(m?: StaffMember | null): string {
  const roleOpts = ROLES.map((r) => `<option value="${r}"${m?.role === r ? " selected" : ""}>${escHtml(ROLE_LABEL[r])}</option>`).join("")
  const empOpts = EMPS.map((t) => `<option value="${t}"${m?.employmentType === t ? " selected" : ""}>${escHtml(EMP_LABEL[t])}</option>`).join("")
  const active = m ? String(m.isActive) : "true"
  const wa = (m as { whatsappNumber?: string } | null | undefined)?.whatsappNumber || ""
  return `
  <div class="dfield"><label class="dlabel">Poora naam <span class="req">*</span></label><input type="text" id="m-name" value="${m ? escHtml(m.fullName) : ""}" placeholder="Naam"/></div>
  <div class="dfield row2">
    <div><label class="dlabel">Kaam (role)</label><select id="m-role">${roleOpts}</select></div>
    <div><label class="dlabel">Kism</label><select id="m-emp">${empOpts}</select></div>
  </div>
  <div class="dfield"><label class="dlabel">Phone</label><input type="text" id="m-phone" value="${m?.phoneNumber ? escHtml(m.phoneNumber) : ""}" placeholder="0300…"/></div>
  <div class="dfield row2">
    <div><label class="dlabel">Mahana tankhwah</label><div class="suffix"><span class="rs">Rs</span><input type="number" id="m-salary" min="0" value="${m?.monthlySalary != null ? money(m.monthlySalary) : ""}" placeholder="0"/></div></div>
    <div><label class="dlabel">Dihari rate (per din)</label><div class="suffix"><span class="rs">Rs</span><input type="number" id="m-dihari" min="0" value="${m?.defaultDihariRate != null ? money(m.defaultDihariRate) : ""}" placeholder="0"/></div></div>
  </div>
  <div class="dfield"><label class="dlabel">WhatsApp (agar phone se alag)</label><input type="text" id="m-wa" value="${wa ? escHtml(wa) : ""}" placeholder="optional"/></div>
  <div class="dfield"><label class="dlabel">Status</label><select id="m-active"><option value="true"${active === "true" ? " selected" : ""}>Active</option><option value="false"${active === "false" ? " selected" : ""}>Inactive (chhutti/nikal gaya)</option></select></div>
  <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Cancel</button><button class="btn btn-primary" type="button" data-save="${m?.id ?? "new"}">${m ? "Staff update karein" : "Staff save karein"}</button></div>`
}

function buildContent(list: StaffMember[], filter: string): string {
  const active = list.filter((m) => m.isActive)
  const cntEmp = (t: EmploymentType) => list.filter((m) => m.employmentType === t).length
  const payroll = active.filter((m) => m.employmentType === "permanent_monthly").reduce((s, m) => s + money(m.monthlySalary), 0)
  const tiles = `<div class="st-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.team, 1.8)} Kul staff</div><div class="t-val tnum">${list.length}</div><div class="t-sub">${active.length} active</div></div>
    <div class="tile"><div class="t-cap">Mahana (permanent)</div><div class="t-val tnum">${cntEmp("permanent_monthly")}</div><div class="t-sub">fixed salary</div></div>
    <div class="tile"><div class="t-cap">Dihari (casual)</div><div class="t-val tnum">${cntEmp("casual_dihari")}</div><div class="t-sub">per-day</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.wallet, 1.8)} Mahana payroll</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(payroll)}</div><div class="t-sub">permanent salaries</div></div>
  </div>`

  const tab = (f: string, label: string, cnt: number) => `<button class="tab${f === filter ? " on" : ""}" data-f="${f}">${label} <span class="cnt">${cnt}</span></button>`
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">${tab("all", "Sab", list.length)}${EMPS.map((t) => tab(t, EMP_LABEL[t], cntEmp(t))).join("")}</div><div class="filters"><button class="btn btn-primary" id="addbtn">${svg(IC.plus, 2.2)} Naya staff</button></div></div>`

  const rows = list.filter((m) => filter === "all" || m.employmentType === filter)
  const body = rows.map((m) => {
    const phone = m.phoneNumber || ""
    const waNum = (m as { whatsappNumber?: string }).whatsappNumber || phone
    const pay = m.employmentType === "casual_dihari"
      ? (m.defaultDihariRate != null ? `Rs ${pkNum(money(m.defaultDihariRate))} <span class="rolechip">/din</span>` : "—")
      : (m.monthlySalary != null ? `Rs ${pkNum(money(m.monthlySalary))} <span class="rolechip">/mahina</span>` : "—")
    const acts = `<div class="rowacts">${phone ? `<button class="iconbtn" data-tel="${escHtml(phone)}" title="Call">${svg(IC.call)}</button>` : ""}${waNum ? `<button class="iconbtn wa" data-wa="${escHtml(waNum)}" title="WhatsApp">${svg(IC.wa)}</button>` : ""}<button class="iconbtn" data-edit="${m.id}" title="Edit">${svg(IC.edit)}</button><button class="iconbtn bad" data-del="${m.id}" title="Delete">${svg(IC.trash)}</button></div>`
    return `<tr>
      <td><div class="c-couple" data-nav-btn="/dashboard/staff/${m.id}" style="cursor:pointer"><span class="ava">${escHtml(initialsOf(m.fullName))}</span><div><div class="cc-nm">${escHtml(m.fullName)}${!m.isActive ? ` <span class="st mut"><i></i> Inactive</span>` : ""}</div><div class="cc-ev">${escHtml(ROLE_LABEL[m.role] || m.role)}</div></div></div></td>
      <td><span class="st ${EMP_TONE[m.employmentType]}"><i></i> ${escHtml(EMP_LABEL[m.employmentType])}</span></td>
      <td class="td-mut tnum">${escHtml(phone || "—")}</td>
      <td class="td-amt tnum">${pay}</td>
      <td>${acts}</td>
    </tr>`
  }).join("")

  return `
  <div class="head"><div><h1>Staff</h1><div class="sub">Aapki team — <b>${list.length}</b> log, <b>${active.length}</b> active.</div></div></div>
  ${tiles}${toolbar}
  <div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Staff</th><th>Kism</th><th>Phone</th><th>Tankhwah</th><th></th></tr></thead>
    <tbody>${body}</tbody></table></div>
    ${rows.length ? `<div class="tbl-foot"><span>${rows.length} log</span></div>` : `<div class="empty">Is category mein koi staff nahi. "Naya staff" se add karein.</div>`}</div>
  <div class="foot">WeddingWala vendor console · Staff</div>`
}

export function StaffArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/staff", crumbBold: "Log", crumbSub: "Staff", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const { business } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizId = activeBusinessId ?? (business as { id?: number } | null)?.id ?? null
  const bizRef = React.useRef(bizId); bizRef.current = bizId
  const { data, isError } = useQuery({ queryKey: ["staff-art", bizId], enabled: !!bizId, queryFn: () => StaffAPI.listMembers({ businessId: Number(bizId) }) })
  const list = React.useMemo(() => (Array.isArray(data) ? data : (data as { members?: StaffMember[] } | undefined)?.members ?? []) as StaffMember[], [data])
  const listRef = React.useRef(list); listRef.current = list
  const [filter, setFilter] = React.useState(() => loadPref("tab:staff", "all"))

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!bizId) { wwc.innerHTML = `<div class="loadwrap">Pehle ek business select karein.</div>`; return }
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Staff</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Staff load ho raha hai…</div>`; return }
    wwc.innerHTML = buildContent(list, filter)
    initTablePager(s, { pageSize: 25 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, filter, bizId, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const refetch = () => qc.invalidateQueries({ queryKey: ["staff-art", bizRef.current] })
    const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? ""
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if ((e.target as HTMLElement).closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["staff-art", bizRef.current] }); return }
      const wa = t.closest("[data-wa]") as HTMLElement | null
      if (wa) { const p = waDigits(wa.dataset.wa); if (p) window.open(`https://wa.me/${p}`, "_blank", "noopener"); return }
      const tel = t.closest("[data-tel]") as HTMLElement | null
      if (tel?.dataset.tel) { window.location.href = `tel:${tel.dataset.tel.replace(/\s/g, "")}`; return }
      const tab = t.closest(".tab") as HTMLElement | null
      if (tab?.dataset.f) { savePref("tab:staff", tab.dataset.f); setFilter(tab.dataset.f); return }
      if (t.closest("#addbtn")) { openDrawer(s, "Naya staff", formBody(null)); return }
      const edit = t.closest("[data-edit]") as HTMLElement | null
      if (edit?.dataset.edit) { const m = listRef.current.find((x) => x.id === Number(edit.dataset.edit)); if (m) openDrawer(s, "Staff edit karein", formBody(m)); return }
      const del = t.closest("[data-del]") as HTMLElement | null
      if (del?.dataset.del) {
        const id = Number(del.dataset.del)
        const m = listRef.current.find((x) => x.id === id)
        openConfirm(s, { title: `${m ? m.fullName : "Staff"} delete karein?`, message: "Ye record hat jayega — wapas nahi aayega.", danger: true, onConfirm: async () => {
          try { await StaffAPI.removeMember(id); toast.success("Staff hata diya"); refetch() } catch { toast.error("Delete nahi hua") }
        } })
        return
      }
      const save = t.closest("[data-save]") as HTMLButtonElement | null
      if (save?.dataset.save) {
        const name = val("m-name"); if (!name) { toast.error("Naam likhein"); return }
        const bId = Number(bizRef.current); if (!bId) { toast.error("Business select karein"); return }
        const editId = save.dataset.save === "new" ? 0 : Number(save.dataset.save)
        const body: CreateMemberInput = { businessId: bId, fullName: name, role: val("m-role") as StaffRole, employmentType: val("m-emp") as EmploymentType }
        if (val("m-phone")) body.phoneNumber = val("m-phone")
        if (val("m-wa")) body.whatsappNumber = val("m-wa")
        if (val("m-salary")) body.monthlySalary = Number(val("m-salary"))
        if (val("m-dihari")) body.defaultDihariRate = Number(val("m-dihari"))
        if (editId) body.isActive = val("m-active") === "true" // status editable on existing members
        save.disabled = true; const orig = save.textContent; save.textContent = "Save ho raha…"
        try {
          if (editId) await StaffAPI.updateMember(editId, body)
          else await StaffAPI.createMember(body)
          toast.success(editId ? "Staff update ho gaya" : "Staff add ho gaya"); closeDrawer(s); refetch()
        } catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua"); save.disabled = false; if (orig) save.textContent = orig }
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default StaffArtifact
