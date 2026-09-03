"use client"

/**
 * Generator fuel — premium rebuild on the shared champagne shell.
 * Real fuel log via GeneratorFuelAPI.list + create / remove. Delivery /
 * consumption / tank-reading entries, litres + cost, type filter.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { GeneratorFuelAPI, type FuelEntry, type EntryType, type FuelType, type CreateEntryInput, type TankStatusRow } from "@/lib/api/generatorFuel"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useArtifactShell, pkNum, escHtml, initTablePager, loadPref, savePref, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const TYPE_LABEL: Record<EntryType, string> = { delivery: "Fuel aaya", consumption: "Istemaal", tank_reading: "Tank reading", maintenance: "Maintenance" }
const TYPE_TONE: Record<EntryType, string> = { delivery: "ok", consumption: "warn", tank_reading: "info", maintenance: "mut" }
const FUEL_LABEL: Record<FuelType, string> = { diesel: "Diesel", petrol: "Petrol", lpg: "LPG", other: "Deegar" }
const TYPES: EntryType[] = ["delivery", "consumption", "tank_reading", "maintenance"]
const FUELS: FuelType[] = ["diesel", "petrol", "lpg", "other"]
const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) }
const nowLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = { plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', fuel: '<path d="M3 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18M3 12h10M16 6l3 3v9a2 2 0 0 1-4 0V9"/>', in: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', out: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>' }

const EXTRA_CSS = String.raw`
.f-tiles{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:14px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:14px 15px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:20px; font-weight:680; margin-top:8px; } .t-val .rs,.t-val .u{ font-size:12px; color:var(--ink-3); font-weight:600; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.addform{ display:none; padding:16px; border-bottom:1px solid var(--border); background:var(--surface-2); } .addform.on{ display:block; }
.frow{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:12px; }
.field{ display:flex; flex-direction:column; gap:5px; } .flabel{ font-size:11.5px; font-weight:600; color:var(--ink-2); } .flabel .req{ color:var(--bad); }
.field input,.field select{ width:100%; border:1px solid var(--border-2); border-radius:9px; background:var(--surface); color:var(--ink); padding:8px 10px; font:inherit; font-size:12.5px; outline:none; } .field input:focus,.field select:focus{ border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-wash); }
.af-foot{ display:flex; gap:8px; justify-content:flex-end; }
.del{ width:30px; height:30px; border-radius:7px; border:0; background:transparent; color:var(--ink-3); display:grid; place-items:center; } .del:hover{ background:var(--bad-wash); color:var(--bad); } .del svg{ width:15px; height:15px; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:900px){ .f-tiles{ grid-template-columns:1fr; } .frow{ grid-template-columns:1fr 1fr; } }
`

function buildContent(list: FuelEntry[], summary: { totalDeliveredLitres?: number; totalDeliveryCost?: number; totalConsumedLitres?: number }, tanks: TankStatusRow[], filter: string): string {
  const cnt = (t: EntryType) => list.filter((e) => e.type === t).length
  const tiles = `<div class="f-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.in, 1.9)} Kul fuel aaya</div><div class="t-val tnum">${pkNum(money(summary.totalDeliveredLitres))} <span class="u">L</span></div><div class="t-sub">delivered</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.fuel, 1.8)} Fuel ka kharcha</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(money(summary.totalDeliveryCost))}</div><div class="t-sub">total cost</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.out, 1.9)} Istemaal hua</div><div class="t-val tnum">${pkNum(money(summary.totalConsumedLitres))} <span class="u">L</span></div><div class="t-sub">consumed</div></div>
  </div>`
  const tanksHtml = tanks.length ? `<div class="card" style="margin-bottom:14px;padding:14px 16px"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-3);margin-bottom:11px;display:flex;align-items:center;gap:6px">${svg(IC.fuel, 1.8)} Abhi tank mein</div><div style="display:flex;gap:26px;flex-wrap:wrap">${tanks.map((t) => `<div><div style="font-size:19px;font-weight:680;letter-spacing:-.02em">${pkNum(money(t.currentTankLitres))} <span style="font-size:11px;color:var(--ink-3);font-weight:600">L</span></div><div style="font-size:11.5px;color:var(--ink-3);margin-top:2px">${escHtml(t.identifier)} · ${escHtml(FUEL_LABEL[t.fuelType] || t.fuelType)}</div></div>`).join("")}</div></div>` : ""
  const tab = (f: string, label: string, c: number) => `<button class="tab${f === filter ? " on" : ""}" data-f="${f}">${label} <span class="cnt">${c}</span></button>`
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">${tab("all", "Sab", list.length)}${TYPES.filter((t) => cnt(t) > 0).map((t) => tab(t, TYPE_LABEL[t], cnt(t))).join("")}</div><div class="filters"><button class="btn btn-primary" id="addbtn">${svg(IC.plus, 2.2)} Naya entry</button></div></div>`
  const typeOpts = TYPES.map((t) => `<option value="${t}">${escHtml(TYPE_LABEL[t])}</option>`).join("")
  const fuelOpts = FUELS.map((f) => `<option value="${f}">${escHtml(FUEL_LABEL[f])}</option>`).join("")
  const addForm = `<div class="addform" id="addform">
    <div class="frow">
      <div class="field"><label class="flabel">Kism</label><select id="f-type">${typeOpts}</select></div>
      <div class="field"><label class="flabel">Fuel</label><select id="f-fuel">${fuelOpts}</select></div>
      <div class="field"><label class="flabel">Litres <span class="req">*</span></label><input type="number" id="f-litres" min="0" step="0.1" placeholder="0"/></div>
      <div class="field"><label class="flabel">Rate/litre</label><input type="number" id="f-rate" min="0" placeholder="0"/></div>
    </div>
    <div class="frow">
      <div class="field"><label class="flabel">Generator</label><input type="text" id="f-gen" placeholder="Gen-1"/></div>
      <div class="field" style="grid-column:span 2"><label class="flabel">Kab</label><input type="datetime-local" id="f-when" value="${nowLocal()}"/></div>
      <div class="field"><label class="flabel">Run hours (istemaal)</label><input type="number" id="f-hours" min="0" step="0.1" placeholder="optional"/></div>
    </div>
    <div class="frow">
      <div class="field"><label class="flabel">Supplier (delivery)</label><input type="text" id="f-supp" placeholder="optional"/></div>
      <div class="field"><label class="flabel">Delivery ref</label><input type="text" id="f-ref" placeholder="optional"/></div>
      <div class="field" style="grid-column:span 2"><label class="flabel">Note</label><input type="text" id="f-note" placeholder="optional"/></div>
    </div>
    <div class="af-foot"><button class="btn btn-ghost" id="af-cancel">Cancel</button><button class="btn btn-primary" id="af-save">Save</button></div></div>`
  const rows = list.filter((e) => filter === "all" || e.type === filter)
  const body = rows.map((e) => `<tr>
    <td class="td-date">${fmtDate((e as { occurredAt?: string }).occurredAt || (e as { createdAt?: string }).createdAt)}</td>
    <td><span class="st ${TYPE_TONE[e.type]}"><i></i> ${escHtml(TYPE_LABEL[e.type])}</span></td>
    <td class="td-mut">${escHtml(e.generatorIdentifier || "—")}${e.fuelType ? ` · ${escHtml(FUEL_LABEL[e.fuelType])}` : ""}</td>
    <td class="td-amt tnum">${pkNum(money(e.litres))} <span style="font-size:11px;color:var(--ink-3)">L</span></td>
    <td class="r td-amt tnum">${(e as { totalCost?: number }).totalCost != null ? `<span class="rs">Rs</span> ${pkNum(money((e as { totalCost?: number }).totalCost))}` : "—"}</td>
    <td class="r"><button class="del" data-del="${e.id}" title="Delete">${svg(IC.trash)}</button></td>
  </tr>`).join("")
  return `
  <div class="head"><div><h1>Generator fuel</h1><div class="sub">Fuel ka hisaab — delivery, istemaal, tank readings.</div></div></div>
  ${tiles}${tanksHtml}${toolbar}
  <div class="card">${addForm}<div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Tareekh</th><th>Kism</th><th>Generator</th><th>Litres</th><th class="r">Cost</th><th></th></tr></thead>
    <tbody>${body}</tbody></table></div>
    ${rows.length ? `<div class="tbl-foot"><span>${rows.length} entries</span></div>` : `<div class="empty">Koi fuel entry nahi. "Naya entry" se add karein.</div>`}</div>
  <div class="foot">WeddingWala vendor console · Generator fuel</div>`
}

export function GeneratorFuelArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/generator-fuel", crumbBold: "Ops", crumbSub: "Generator fuel", extraCss: EXTRA_CSS })
  const qc = useQueryClient()
  const activeBusinessId = useActiveBusinessId()
  const bizRef = React.useRef(activeBusinessId); bizRef.current = activeBusinessId
  const { data } = useQuery({ queryKey: ["fuel-art", activeBusinessId], queryFn: () => GeneratorFuelAPI.list(activeBusinessId != null ? { businessId: activeBusinessId } : {}) })
  const tanksQ = useQuery({ queryKey: ["fuel-tanks", activeBusinessId], queryFn: () => GeneratorFuelAPI.tanks(activeBusinessId != null ? { businessId: activeBusinessId } : {}).catch(() => ({ tanks: [] })) })
  const list = React.useMemo(() => (data?.entries ?? []) as FuelEntry[], [data])
  const tanks = React.useMemo(() => (tanksQ.data?.tanks ?? []) as TankStatusRow[], [tanksQ.data])
  const summary = data?.summary ?? {}
  const [filter, setFilter] = React.useState(() => loadPref("tab:generator-fuel", "all"))

  React.useEffect(() => {
    const s = shadowRef.current; if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Fuel log load ho raha hai…</div>`; return }
    wwc.innerHTML = buildContent(list, summary, tanks, filter)
    initTablePager(s, { pageSize: 25 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, tanksQ.data, filter])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current; if (!s || !ready || bound.current) return
    bound.current = true
    const refetch = () => { qc.invalidateQueries({ queryKey: ["fuel-art", bizRef.current] }); qc.invalidateQueries({ queryKey: ["fuel-tanks", bizRef.current] }) }
    const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? ""
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      const tab = t.closest(".tab") as HTMLElement | null
      if (tab?.dataset.f) { savePref("tab:generator-fuel", tab.dataset.f); setFilter(tab.dataset.f); return }
      if (t.closest("#addbtn")) { s.getElementById("addform")?.classList.toggle("on"); return }
      if (t.closest("#af-cancel")) { s.getElementById("addform")?.classList.remove("on"); return }
      const del = t.closest("[data-del]") as HTMLElement | null
      if (del?.dataset.del) { const id = Number(del.dataset.del); openConfirm(s, { title: "Entry delete karein?", message: "Ye record hat jayega — wapas nahi aayega.", danger: true, onConfirm: async () => { try { await GeneratorFuelAPI.remove(id); toast.success("Entry hata di"); refetch() } catch { toast.error("Delete nahi hua") } } }); return }
      if (t.closest("#af-save")) {
        const type = val("f-type") as EntryType
        const litres = Number(val("f-litres")) || 0
        if (type !== "maintenance" && litres <= 0) { toast.error(type === "tank_reading" ? "Tank ka reading (litres) likhein" : "Litres likhein"); return }
        const body: CreateEntryInput = { businessId: Number(bizRef.current), type, fuelType: val("f-fuel") as FuelType, litres }
        if (val("f-rate")) { body.costPerLitre = Number(val("f-rate")); body.totalCost = Number(val("f-rate")) * litres }
        if (val("f-gen")) body.generatorIdentifier = val("f-gen")
        if (val("f-when")) body.occurredAt = new Date(val("f-when")).toISOString()
        if (val("f-hours")) body.runHours = Number(val("f-hours"))
        if (val("f-supp")) body.supplierName = val("f-supp")
        if (val("f-ref")) body.deliveryRef = val("f-ref")
        if (val("f-note")) body.notes = val("f-note")
        const btn = s.getElementById("af-save") as HTMLButtonElement | null; if (btn) { btn.disabled = true; btn.textContent = "…" }
        try { await GeneratorFuelAPI.create(body); toast.success("Entry add ho gayi"); refetch() } catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua"); if (btn) { btn.disabled = false; btn.textContent = "Save" } }
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default GeneratorFuelArtifact
