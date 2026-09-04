"use client"

/**
 * Halal certificates — premium rebuild on the shared champagne shell.
 * Real cert register via HalalCertAPI.list + create / remove. Status tabs,
 * validity, expiring flags.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { HalalCertAPI, type HalalCert, type CertStatus, type CreateCertInput, type IssuingAuthority, ISSUING_AUTHORITY_LABELS } from "@/lib/api/halalCerts"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useArtifactShell, escHtml, initTablePager, loadPref, savePref, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const ST_LABEL: Record<CertStatus, string> = { active: "Active", expiring_soon: "Jald khatam", expired: "Khatam", revoked: "Radd", pending_renewal: "Renewal baaki" }
const ST_TONE: Record<CertStatus, string> = { active: "ok", expiring_soon: "warn", expired: "bad", revoked: "bad", pending_renewal: "warn" }
const STATUSES: CertStatus[] = ["active", "expiring_soon", "pending_renewal", "expired", "revoked"]
function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) }
const todayIso = () => new Date().toISOString().slice(0, 10)
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = { plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', cert: '<path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/><path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5"/>', check: '<path d="M20 6 9 17l-5-5"/>', warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>' }

const EXTRA_CSS = String.raw`
.h-tiles{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:10px; }
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
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:820px){ .h-tiles{ grid-template-columns:1fr; } .frow{ grid-template-columns:1fr; } }
`

function buildContent(list: HalalCert[], filter: string): string {
  const cnt = (s: CertStatus) => list.filter((c) => c.status === s).length
  const active = cnt("active"), expiring = cnt("expiring_soon") + cnt("expired") + cnt("pending_renewal")
  const tiles = `<div class="h-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.cert, 1.7)} Kul certificates</div><div class="t-val tnum">${list.length}</div><div class="t-sub">halal certs</div></div>
    <div class="tile ok"><div class="t-cap">${svg(IC.check, 1.9)} Active</div><div class="t-val tnum">${active}</div><div class="t-sub">valid</div></div>
    <div class="tile ${expiring > 0 ? "warn" : ""}"><div class="t-cap">${svg(IC.warn, 1.9)} Renew karne hain</div><div class="t-val tnum">${expiring}</div><div class="t-sub">jald/khatam</div></div>
  </div>`
  const tab = (f: string, label: string, c: number) => `<button class="tab${f === filter ? " on" : ""}" data-f="${f}">${label} <span class="cnt">${c}</span></button>`
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">${tab("all", "Sab", list.length)}${STATUSES.filter((s) => cnt(s) > 0).map((s) => tab(s, ST_LABEL[s], cnt(s))).join("")}</div><div class="filters"><button class="btn btn-primary" id="addbtn">${svg(IC.plus, 2.2)} Naya certificate</button></div></div>`
  const addForm = `<div class="addform" id="addform">
    <div class="frow">
      <div class="field"><label class="flabel">Cert number <span class="req">*</span></label><input type="text" id="c-num" placeholder="HAL-2026-..."/></div>
      <div class="field"><label class="flabel">Kis cheez ka <span class="req">*</span></label><input type="text" id="c-item" placeholder="Jaise: Chicken supply"/></div>
      <div class="field"><label class="flabel">Supplier</label><input type="text" id="c-supp" placeholder="optional"/></div>
    </div>
    <div class="frow">
      <div class="field"><label class="flabel">Issue date <span class="req">*</span></label><input type="date" id="c-issued" value="${todayIso()}"/></div>
      <div class="field"><label class="flabel">Expiry <span class="req">*</span></label><input type="date" id="c-expiry"/></div>
      <div class="field"><label class="flabel">Authority</label><select id="c-auth">${(Object.keys(ISSUING_AUTHORITY_LABELS) as IssuingAuthority[]).map((k) => `<option value="${k}">${escHtml(ISSUING_AUTHORITY_LABELS[k])}</option>`).join("")}</select></div>
    </div>
    <div class="af-foot"><button class="btn btn-ghost" id="af-cancel">Cancel</button><button class="btn btn-primary" id="af-save">Certificate save karein</button></div></div>`
  const rows = list.filter((c) => filter === "all" || c.status === filter)
  const body = rows.map((c) => `<tr>
    <td><div class="cc-nm">${escHtml(c.certNumber)}</div><div class="cc-ev">${escHtml((c as { itemDescription?: string }).itemDescription || "—")}</div></td>
    <td class="td-mut">${escHtml((c as { supplierNameSnapshot?: string }).supplierNameSnapshot || "—")}</td>
    <td class="td-mut">${escHtml(c.issuingAuthority ? (ISSUING_AUTHORITY_LABELS[c.issuingAuthority] || c.issuingAuthority) : "—")}</td>
    <td class="td-date">${fmtDate((c as { issuedDate?: string }).issuedDate)} → ${fmtDate(c.expiryDate)}</td>
    <td><span class="st ${ST_TONE[c.status]}"><i></i> ${escHtml(ST_LABEL[c.status])}</span></td>
    <td class="r"><button class="del" data-del="${c.id}" title="Delete">${svg(IC.trash)}</button></td>
  </tr>`).join("")
  return `
  <div class="head"><div><h1>Halal certificates</h1><div class="sub">Halal certs ka register — <b>${list.length}</b> certificates.</div></div></div>
  ${tiles}${toolbar}
  <div class="card">${addForm}<div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Certificate</th><th>Supplier</th><th>Authority</th><th>Validity</th><th>Status</th><th></th></tr></thead>
    <tbody>${body}</tbody></table></div>
    ${rows.length ? `<div class="tbl-foot"><span>${rows.length} certs</span></div>` : `<div class="empty">Koi certificate nahi. "Naya certificate" se add karein.</div>`}</div>
  <div class="foot">WeddingWala vendor console · Halal certs</div>`
}

export function HalalCertsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/halal-certs", crumbBold: "Compliance", crumbSub: "Halal certs", extraCss: EXTRA_CSS })
  const qc = useQueryClient()
  const activeBusinessId = useActiveBusinessId()
  const bizRef = React.useRef(activeBusinessId); bizRef.current = activeBusinessId
  const { data } = useQuery({ queryKey: ["halal-art", activeBusinessId], queryFn: () => HalalCertAPI.list(activeBusinessId != null ? { businessId: activeBusinessId } : {}) })
  const list = React.useMemo(() => (data?.certs ?? []) as HalalCert[], [data])
  const [filter, setFilter] = React.useState(() => loadPref("tab:halal-certs", "all"))

  React.useEffect(() => {
    const s = shadowRef.current; if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Certificates load ho rahe hain…</div>`; return }
    wwc.innerHTML = buildContent(list, filter)
    initTablePager(s, { pageSize: 25 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, filter])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current; if (!s || !ready || bound.current) return
    bound.current = true
    const refetch = () => qc.invalidateQueries({ queryKey: ["halal-art", bizRef.current] })
    const val = (id: string) => (s.getElementById(id) as HTMLInputElement | null)?.value?.trim() ?? ""
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      const tab = t.closest(".tab") as HTMLElement | null
      if (tab?.dataset.f) { savePref("tab:halal-certs", tab.dataset.f); setFilter(tab.dataset.f); return }
      if (t.closest("#addbtn")) { s.getElementById("addform")?.classList.toggle("on"); return }
      if (t.closest("#af-cancel")) { s.getElementById("addform")?.classList.remove("on"); return }
      const del = t.closest("[data-del]") as HTMLElement | null
      if (del?.dataset.del) { const id = Number(del.dataset.del); openConfirm(s, { title: "Certificate delete karein?", message: "Ye record hat jayega — wapas nahi aayega.", danger: true, onConfirm: async () => { try { await HalalCertAPI.remove(id); toast.success("Certificate hata diya"); refetch() } catch { toast.error("Delete nahi hua") } } }); return }
      if (t.closest("#af-save")) {
        if (!val("c-num") || !val("c-item")) { toast.error("Cert number aur item likhein"); return }
        if (!val("c-issued") || !val("c-expiry")) { toast.error("Dates chunein"); return }
        const body: CreateCertInput = { businessId: Number(bizRef.current), certNumber: val("c-num"), itemDescription: val("c-item"), issuedDate: val("c-issued"), expiryDate: val("c-expiry") }
        if (val("c-supp")) body.supplierNameSnapshot = val("c-supp")
        if (val("c-auth")) body.issuingAuthority = val("c-auth") as IssuingAuthority
        const btn = s.getElementById("af-save") as HTMLButtonElement | null; if (btn) { btn.disabled = true; btn.textContent = "Save ho raha…" }
        try { await HalalCertAPI.create(body); toast.success("Certificate add ho gaya"); refetch() } catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua"); if (btn) { btn.disabled = false; btn.textContent = "Certificate save karein" } }
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default HalalCertsArtifact
