"use client"

/**
 * Suppliers — premium rebuild on the shared champagne shell.
 * Real vendor supplier book via SupplierAPI.list + create / update / remove.
 * Category filter, contact + payment terms, WhatsApp/Call, inline add/edit.
 * Invoices & payments stay in the dedicated supplier-invoice flow.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { SupplierAPI, type Supplier, type SupplierCategory, type CreateSupplierInput } from "@/lib/api/suppliers"
import { useBusiness } from "@/context/BusinessContext"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { waDigits } from "@/components/dashboard/mainScreens/leads/artifact/leads-artifact"
import { useArtifactShell, escHtml, initialsOf, initTablePager, errorBannerHtml, loadPref, savePref, openDrawer, closeDrawer, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const CAT_LABEL: Record<string, string> = {
  meat: "Gosht", produce: "Sabzi / phal", atta_grains: "Atta / anaj", dairy: "Dairy", oil_ghee: "Tel / ghee", spices: "Masalay", frozen_seafood: "Frozen / seafood", bakery_sweets: "Bakery / mithai", flowers: "Phool", decor_materials: "Decor material", linen_uniforms: "Linen / uniform", equipment_rental: "Equipment kiraya", generator_rental: "Generator", vehicle_rental: "Gaari kiraya", brokerage: "Brokerage", utilities: "Utilities", transport_fuel: "Transport / fuel", stationery: "Stationery", professional_services: "Services", other: "Deegar",
}
const CATS = Object.keys(CAT_LABEL) as SupplierCategory[]
const COLORS = ["var(--accent)", "var(--info)", "var(--ok)", "var(--warn)", "#B5657A", "#3f9fa6", "#C4708A", "#6a8caf", "#a6743f", "#c9a227"]
const catColor = (c: string) => COLORS[Math.abs(c.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0)) % COLORS.length]
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20l1.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>', call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  truck: '<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
}

const EXTRA_CSS = String.raw`
.sup-tiles{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:14px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:14px 15px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:20px; font-weight:680; letter-spacing:-.02em; margin-top:8px; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.catchip{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:2px 8px; border-radius:6px; background:var(--surface-2); border:1px solid var(--border); } .catchip .dot{ width:7px; height:7px; border-radius:50%; }
.rowacts{ display:flex; gap:5px; justify-content:flex-end; align-items:center; }
.iconbtn{ width:30px; height:30px; flex:none; border-radius:7px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; } .iconbtn:hover{ background:var(--surface-3); color:var(--ink); } .iconbtn.wa:hover{ color:var(--ok); border-color:var(--ok); } .iconbtn.bad:hover{ color:var(--bad); border-color:var(--bad); } .iconbtn svg{ width:14px; height:14px; } .iconbtn:disabled{ opacity:.4; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:820px){ .sup-tiles{ grid-template-columns:1fr; } }
`

function formBody(x?: Supplier | null): string {
  const catOpts = CATS.map((c) => `<option value="${c}"${x?.category === c ? " selected" : ""}>${escHtml(CAT_LABEL[c])}</option>`).join("")
  const terms = (x as { defaultPaymentTermsDays?: number } | null | undefined)?.defaultPaymentTermsDays
  return `
  <div class="dfield"><label class="dlabel">Naam <span class="req">*</span></label><input type="text" id="s-name" value="${x ? escHtml(x.name) : ""}" placeholder="Jaise: Al-Madina Fruit"/></div>
  <div class="dfield row2">
    <div><label class="dlabel">Category</label><select id="s-cat">${catOpts}</select></div>
    <div><label class="dlabel">Contact person</label><input type="text" id="s-contact" value="${x?.contactPerson ? escHtml(x.contactPerson) : ""}" placeholder="naam"/></div>
  </div>
  <div class="dfield row2">
    <div><label class="dlabel">Phone</label><input type="text" id="s-phone" value="${x?.phoneNumber ? escHtml(x.phoneNumber) : ""}" placeholder="0300…"/></div>
    <div><label class="dlabel">Payment terms (din)</label><input type="number" id="s-terms" min="0" value="${terms != null ? terms : ""}" placeholder="0"/></div>
  </div>
  <div class="dfield"><label class="dlabel">Bank</label><input type="text" id="s-bank" value="${x?.bankName ? escHtml(x.bankName) : ""}" placeholder="optional"/></div>
  <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Cancel</button><button class="btn btn-primary" type="button" data-save="${x?.id ?? "new"}">${x ? "Supplier update karein" : "Supplier save karein"}</button></div>`
}

function buildContent(list: Supplier[], summary: { byCategory: Partial<Record<string, number>>; activeCount: number; inactiveCount: number }, filter: string): string {
  const cnt = (c: SupplierCategory) => list.filter((x) => x.category === c).length
  const cats = CATS.filter((c) => cnt(c) > 0).sort((a, b) => cnt(b) - cnt(a))
  const topCat = cats[0]
  const tiles = `<div class="sup-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.truck, 1.7)} Kul suppliers</div><div class="t-val tnum">${list.length}</div><div class="t-sub">${summary.activeCount || list.filter((x) => x.isActive).length} active</div></div>
    <div class="tile"><div class="t-cap">Categories</div><div class="t-val tnum">${cats.length}</div><div class="t-sub">alag alag qism</div></div>
    <div class="tile"><div class="t-cap">Sab se zyada</div><div class="t-val" style="font-size:16px">${topCat ? escHtml(CAT_LABEL[topCat]) : "—"}</div><div class="t-sub">${topCat ? cnt(topCat) + " suppliers" : "koi nahi"}</div></div>
  </div>`

  const tab = (f: string, label: string, c: number) => `<button class="tab${f === filter ? " on" : ""}" data-f="${f}">${f !== "all" ? `<span class="dot" style="background:${catColor(f)}"></span> ` : ""}${label} <span class="cnt">${c}</span></button>`
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">${tab("all", "Sab", list.length)}${cats.slice(0, 6).map((c) => tab(c, CAT_LABEL[c], cnt(c))).join("")}</div><div class="filters"><button class="btn btn-primary" id="addbtn">${svg(IC.plus, 2.2)} Naya supplier</button></div></div>`

  const rows = list.filter((x) => filter === "all" || x.category === filter)
  const body = rows.map((x) => {
    const phone = x.phoneNumber || ""
    const acts = `<div class="rowacts">${phone ? `<button class="iconbtn" data-tel="${escHtml(phone)}" title="Call">${svg(IC.call)}</button><button class="iconbtn wa" data-wa="${escHtml(phone)}" title="WhatsApp">${svg(IC.wa)}</button>` : ""}<button class="iconbtn" data-edit="${x.id}" title="Edit">${svg(IC.edit)}</button><button class="iconbtn bad" data-del="${x.id}" title="Delete">${svg(IC.trash)}</button></div>`
    return `<tr>
      <td><div class="c-couple" data-nav-btn="/dashboard/suppliers/${x.id}" style="cursor:pointer"><span class="ava">${escHtml(initialsOf(x.name))}</span><div><div class="cc-nm">${escHtml(x.name)}${!x.isActive ? ` <span class="st mut"><i></i> Inactive</span>` : ""}</div><div class="cc-ev">${escHtml(x.contactPerson || "—")}</div></div></div></td>
      <td><span class="catchip"><span class="dot" style="background:${catColor(x.category)}"></span> ${escHtml(CAT_LABEL[x.category] || x.category)}</span></td>
      <td class="td-mut tnum">${escHtml(phone || "—")}</td>
      <td class="td-mut">${(x as { defaultPaymentTermsDays?: number }).defaultPaymentTermsDays ? `${(x as { defaultPaymentTermsDays?: number }).defaultPaymentTermsDays} din` : "—"}</td>
      <td>${acts}</td>
    </tr>`
  }).join("")

  return `
  <div class="head"><div><h1>Suppliers</h1><div class="sub">Jinse aap maal lete hain — <b>${list.length}</b> suppliers.</div></div></div>
  ${tiles}${toolbar}
  <div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Supplier</th><th>Category</th><th>Phone</th><th>Terms</th><th></th></tr></thead>
    <tbody>${body}</tbody></table></div>
    ${rows.length ? `<div class="tbl-foot"><span>${rows.length} suppliers</span></div>` : `<div class="empty">Is category mein koi supplier nahi. "Naya supplier" se add karein.</div>`}</div>
  <div class="foot">WeddingWala vendor console · Suppliers</div>`
}

export function SuppliersArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/suppliers", crumbBold: "Log", crumbSub: "Suppliers", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const { business } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizId = activeBusinessId ?? (business as { id?: number } | null)?.id ?? null
  const bizRef = React.useRef(bizId); bizRef.current = bizId
  const { data, isError } = useQuery({ queryKey: ["suppliers-art", bizId], enabled: !!bizId, queryFn: () => SupplierAPI.list({ businessId: Number(bizId) }) })
  const list = React.useMemo(() => (data?.suppliers ?? []) as Supplier[], [data])
  const summary = data?.summary ?? { byCategory: {}, activeCount: 0, inactiveCount: 0 }
  const listRef = React.useRef(list); listRef.current = list
  const [filter, setFilter] = React.useState(() => loadPref("tab:suppliers", "all"))

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!bizId) { wwc.innerHTML = `<div class="loadwrap">Pehle ek business select karein.</div>`; return }
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Suppliers</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Suppliers load ho rahe hain…</div>`; return }
    wwc.innerHTML = buildContent(list, summary, filter)
    initTablePager(s, { pageSize: 25 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, filter, bizId, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const refetch = () => qc.invalidateQueries({ queryKey: ["suppliers-art", bizRef.current] })
    const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? ""
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if ((e.target as HTMLElement).closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["suppliers-art", bizRef.current] }); return }
      const wa = t.closest("[data-wa]") as HTMLElement | null
      if (wa) { const p = waDigits(wa.dataset.wa); if (p) window.open(`https://wa.me/${p}`, "_blank", "noopener"); return }
      const tel = t.closest("[data-tel]") as HTMLElement | null
      if (tel?.dataset.tel) { window.location.href = `tel:${tel.dataset.tel.replace(/\s/g, "")}`; return }
      const tab = t.closest(".tab") as HTMLElement | null
      if (tab?.dataset.f) { savePref("tab:suppliers", tab.dataset.f); setFilter(tab.dataset.f); return }
      if (t.closest("#addbtn")) { openDrawer(s, "Naya supplier", formBody(null)); return }
      const edit = t.closest("[data-edit]") as HTMLElement | null
      if (edit?.dataset.edit) { const x = listRef.current.find((y) => y.id === Number(edit.dataset.edit)); if (x) openDrawer(s, "Supplier edit karein", formBody(x)); return }
      const del = t.closest("[data-del]") as HTMLElement | null
      if (del?.dataset.del) {
        const id = Number(del.dataset.del)
        const x = listRef.current.find((y) => y.id === id)
        openConfirm(s, { title: `${x ? x.name : "Supplier"} delete karein?`, message: "Ye record hat jayega — wapas nahi aayega.", danger: true, onConfirm: async () => {
          try { await SupplierAPI.remove(id); toast.success("Supplier hata diya"); refetch() } catch { toast.error("Delete nahi hua") }
        } })
        return
      }
      const save = t.closest("[data-save]") as HTMLButtonElement | null
      if (save?.dataset.save) {
        const name = val("s-name"); if (!name) { toast.error("Naam likhein"); return }
        const bId = Number(bizRef.current); if (!bId) { toast.error("Business select karein"); return }
        const editId = save.dataset.save === "new" ? 0 : Number(save.dataset.save)
        const body: CreateSupplierInput = { businessId: bId, name, category: val("s-cat") as SupplierCategory }
        if (val("s-contact")) body.contactPerson = val("s-contact")
        if (val("s-phone")) body.phoneNumber = val("s-phone")
        if (val("s-terms")) body.defaultPaymentTermsDays = Number(val("s-terms"))
        if (val("s-bank")) body.bankName = val("s-bank")
        save.disabled = true; const orig = save.textContent; save.textContent = "Save ho raha…"
        try {
          if (editId) await SupplierAPI.update(editId, body)
          else await SupplierAPI.create(body)
          toast.success(editId ? "Supplier update ho gaya" : "Supplier add ho gaya"); closeDrawer(s); refetch()
        } catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua"); save.disabled = false; if (orig) save.textContent = orig }
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default SuppliersArtifact
