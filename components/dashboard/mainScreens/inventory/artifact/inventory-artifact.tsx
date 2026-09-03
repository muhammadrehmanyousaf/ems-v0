"use client"

/**
 * Inventory — premium rebuild on the shared champagne shell.
 * Real stock management via InventoryAPI: items list + summary, create / edit /
 * delete, and stock movements (restock / consume) that adjust currentStock.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  InventoryAPI, type InventoryItem, type InventoryCategory, type InventoryUnit, type CreateItemInput,
} from "@/lib/api/inventory"
import { useBusiness } from "@/context/BusinessContext"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useArtifactShell, pkNum, escHtml, initTablePager, loadPref, savePref, errorBannerHtml, openDrawer, closeDrawer, openConfirm, venuePickerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const CAT_LABEL: Record<InventoryCategory, string> = {
  ingredient: "Saman / raashan", rental: "Kiraya ka", equipment: "Saazo-saman", consumable: "Kharch honay wala", linen: "Chadrein / linen", stationery: "Stationery", other: "Deegar",
}
const CAT_COLOR: Record<InventoryCategory, string> = {
  ingredient: "var(--accent)", rental: "var(--info)", equipment: "#B5657A", consumable: "var(--warn)", linen: "#3f9fa6", stationery: "#6a8caf", other: "var(--ink-4)",
}
const CATS = Object.keys(CAT_LABEL) as InventoryCategory[]
const UNITS: InventoryUnit[] = ["piece", "dozen", "pair", "set", "kg", "gram", "litre", "ml", "metre", "bottle", "packet", "tray", "thaal", "tola", "box", "roll", "other"]
const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  box: '<path d="M16 3l5 3v12l-9 3-9-3V6l5-3M3 6l9 3 9-3M12 9v12"/>', value: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>', warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>', arrows: '<path d="M7 7h10v10M7 17 17 7"/>',
}

const EXTRA_CSS = String.raw`
.inv-tiles{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:14px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:14px 15px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); } .tile.warn .t-val{ color:var(--warn); }
.tile[data-f]{ cursor:pointer; transition:border-color .12s,box-shadow .12s; } .tile[data-f]:hover{ border-color:var(--warn); box-shadow:var(--shadow-sm); } .tile[data-f].on{ border-color:var(--warn); box-shadow:0 0 0 3px color-mix(in srgb,var(--warn) 18%,transparent); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:20px; font-weight:680; letter-spacing:-.02em; margin-top:8px; } .t-val .rs{ font-size:12px; color:var(--ink-3); font-weight:600; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.catchip{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:2px 8px; border-radius:6px; background:var(--surface-2); border:1px solid var(--border); } .catchip .dot{ width:7px; height:7px; border-radius:50%; }
.stock{ font-weight:660; font-variant-numeric:tabular-nums; } .stock .u{ font-size:11px; color:var(--ink-3); font-weight:500; }
.low{ display:inline-flex; align-items:center; gap:4px; font-size:10.5px; font-weight:700; color:var(--bad); margin-top:2px; } .low svg{ width:11px; height:11px; }
.rowacts{ display:flex; gap:5px; justify-content:flex-end; align-items:center; }
.mini{ width:30px; height:30px; border-radius:7px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; } .mini:hover{ background:var(--surface-3); color:var(--ink); } .mini svg{ width:14px; height:14px; } .mini.ok:hover{ color:var(--ok); border-color:var(--ok); } .mini.warn:hover{ color:var(--warn); border-color:var(--warn); } .mini.bad:hover{ color:var(--bad); border-color:var(--bad); }
.mv-row td{ background:var(--surface-2); } .mv-in{ display:flex; gap:8px; align-items:center; padding:4px 0; } .mv-in input{ width:120px; border:1px solid var(--border-2); border-radius:8px; padding:7px 10px; font:inherit; font-size:12.5px; outline:none; background:var(--surface); }
.mv-in .lbl{ font-size:12px; color:var(--ink-2); font-weight:500; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:900px){ .inv-tiles{ grid-template-columns:1fr; } }
`

function itemFormBody(it?: InventoryItem | null): string {
  const catOpts = CATS.map((c) => `<option value="${c}"${(it?.category || "ingredient") === c ? " selected" : ""}>${escHtml(CAT_LABEL[c])}</option>`).join("")
  const unitOpts = UNITS.map((u) => `<option value="${u}"${(it?.unit || "piece") === u ? " selected" : ""}>${u}</option>`).join("")
  // Stock only moves via +/− movements; editing it here would be ignored — so lock it in edit mode.
  return `
  <input type="hidden" id="i-id" value="${it ? String(it.id) : ""}"/>
  <div class="dfield row2">
    <div><label class="dlabel">Item ka naam <span class="req">*</span></label><input type="text" id="i-name" value="${it ? escHtml(it.name) : ""}" placeholder="Jaise: Chairs"/></div>
    <div><label class="dlabel">Category</label><select id="i-cat">${catOpts}</select></div>
  </div>
  <div class="dfield row2">
    <div><label class="dlabel">Unit</label><select id="i-unit">${unitOpts}</select></div>
    <div><label class="dlabel" id="i-stock-lbl">${it ? "Abhi stock (movement se badlein)" : "Shuruaati stock"}</label><input type="number" id="i-stock" min="0" value="${it ? escHtml(money(it.currentStock)) : ""}" placeholder="0"${it ? " disabled" : ""}/></div>
  </div>
  <div class="dfield row2">
    <div><label class="dlabel">Kam stock alert (threshold)</label><input type="number" id="i-low" min="0" value="${it ? escHtml(money(it.lowStockThreshold)) : ""}" placeholder="10"/></div>
    <div><label class="dlabel">Aakhri qeemat / unit</label><input type="number" id="i-cost" min="0" value="${it?.lastRestockCostPerUnit != null ? escHtml(money(it.lastRestockCostPerUnit)) : ""}" placeholder="0"/></div>
  </div>
  <div class="dfield row2">
    <div><label class="dlabel">Supplier</label><input type="text" id="i-supp" value="${it ? escHtml(it.defaultSupplierName || "") : ""}" placeholder="optional"/></div>
    <div><label class="dlabel">SKU</label><input type="text" id="i-sku" value="${it ? escHtml(it.sku || "") : ""}" placeholder="optional"/></div>
  </div>
  <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Cancel</button><button class="btn btn-primary" type="button" id="af-save">${it ? "Update karein" : "Item save karein"}</button></div>`
}

function buildContent(list: InventoryItem[], summary: { byCategory: Partial<Record<InventoryCategory, number>>; totalStockValue: number; lowStockCount: number }, filter: string): string {
  const cnt = (c: InventoryCategory) => list.filter((i) => i.category === c).length
  const isLow = (i: InventoryItem) => money(i.currentStock) <= money(i.lowStockThreshold)
  const lowCnt = list.filter(isLow).length
  const tiles = `<div class="inv-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.value, 1.9)} Kul stock value</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(money(summary.totalStockValue))}</div><div class="t-sub">last cost ke hisaab se</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.box, 1.9)} Total items</div><div class="t-val tnum">${list.length}</div><div class="t-sub">${CATS.filter((c) => cnt(c) > 0).length} categories</div></div>
    <div class="tile${lowCnt > 0 ? " warn" : ""}${filter === "low" ? " on" : ""}"${lowCnt > 0 ? ` data-f="low"` : ""}><div class="t-cap">${svg(IC.warn, 1.9)} Kam stock</div><div class="t-val tnum">${lowCnt}</div><div class="t-sub">${lowCnt > 0 ? (filter === "low" ? "filter on hai" : "click karke dekhein") : "sab theek"}</div></div>
  </div>`

  const tabC = CATS.filter((c) => cnt(c) > 0)
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">
    <button class="tab${filter === "all" ? " on" : ""}" data-f="all">Sab <span class="cnt">${list.length}</span></button>
    ${tabC.map((c) => `<button class="tab${filter === c ? " on" : ""}" data-f="${c}"><span class="dot" style="background:${CAT_COLOR[c]}"></span> ${escHtml(CAT_LABEL[c])} <span class="cnt">${cnt(c)}</span></button>`).join("")}
    ${lowCnt > 0 ? `<button class="tab${filter === "low" ? " on" : ""}" data-f="low"><span class="dot" style="background:var(--warn)"></span> Kam stock <span class="cnt">${lowCnt}</span></button>` : ""}
    </div><div class="filters"><button class="btn btn-primary" id="addbtn">${svg(IC.plus, 2.2)} Naya item</button></div></div>`

  const rows = list.filter((i) => filter === "all" ? true : filter === "low" ? isLow(i) : i.category === filter)
  const body = rows.map((i) => {
    const stock = money(i.currentStock), low = stock <= money(i.lowStockThreshold)
    return `<tr>
      <td><div class="cc-nm">${escHtml(i.name)}</div>${i.sku ? `<div class="cc-ev">${escHtml(i.sku)}</div>` : ""}</td>
      <td><span class="catchip"><span class="dot" style="background:${CAT_COLOR[i.category]}"></span> ${escHtml(CAT_LABEL[i.category])}</span></td>
      <td><span class="stock">${pkNum(stock)} <span class="u">${escHtml(i.unit)}</span></span>${low ? `<div class="low">${svg(IC.warn, 2)} Kam stock</div>` : ""}</td>
      <td class="td-mut">${i.lastRestockCostPerUnit != null ? `Rs ${pkNum(money(i.lastRestockCostPerUnit))}` : "—"}</td>
      <td class="td-mut">${escHtml(i.defaultSupplierName || "—")}</td>
      <td><div class="rowacts"><button class="mini ok" data-mv="${i.id}" title="Stock adjust">${svg(IC.arrows)}</button><button class="mini" data-edit="${i.id}" title="Edit">${svg(IC.edit)}</button><button class="mini bad" data-del="${i.id}" title="Delete">${svg(IC.trash)}</button></div></td>
    </tr>
    <tr class="mv-row" id="mv-${i.id}" hidden><td colspan="6"><div class="mv-in"><span class="lbl">Stock badlein:</span><input type="number" id="mvq-${i.id}" min="0" placeholder="tadaad"/><button class="mini ok" data-mvin="${i.id}" title="Aaya (restock)">${svg(IC.plus)}</button><button class="mini warn" data-mvout="${i.id}" title="Kharch/nikala">${svg(IC.minus)}</button><span class="lbl">＋ aaya · − kharch</span></div></td></tr>`
  }).join("")

  return `
  <div class="head"><div><h1>Inventory</h1><div class="sub">Aapka stock — <b>${list.length}</b> items${lowCnt > 0 ? `, <b style="color:var(--warn)">${lowCnt} kam stock</b>` : ""}.</div></div></div>
  ${tiles}${toolbar}
  <div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Aakhri qeemat</th><th>Supplier</th><th></th></tr></thead>
    <tbody>${body}</tbody></table></div>
    ${rows.length ? `<div class="tbl-foot"><span>${rows.length} items</span></div>` : `<div class="empty">${filter === "low" ? "Koi kam-stock item nahi — sab theek." : `Is category mein koi item nahi. "Naya item" se add karein.`}</div>`}</div>
  <div class="foot">WeddingWala vendor console · Inventory</div>`
}

export function InventoryArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/inventory", crumbBold: "Catalog", crumbSub: "Inventory", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const { business, businesses } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizId = activeBusinessId ?? (business as { id?: number } | null)?.id ?? null
  const { data, isError } = useQuery({ queryKey: ["inventory-art", bizId], enabled: !!bizId, queryFn: () => InventoryAPI.listItems({ businessId: Number(bizId) }) })
  const list = React.useMemo(() => (data?.items ?? []) as InventoryItem[], [data])
  const summary = data?.summary ?? { byCategory: {}, totalStockValue: 0, lowStockCount: 0 }
  const [filter, setFilter] = React.useState(() => loadPref("tab:inventory", "all"))
  const listRef = React.useRef(list); listRef.current = list
  const bizRef = React.useRef(bizId); bizRef.current = bizId

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!bizId) { wwc.innerHTML = venuePickerHtml((businesses || []) as { id: number; name?: string }[], { title: "Kaunsi venue ka stock?", sub: "Inventory ek venue ke liye hai — neeche se chunein." }); return }
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Inventory</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Inventory load ho rahi hai…</div>`; return }
    wwc.innerHTML = buildContent(list, summary, filter)
    initTablePager(s, { pageSize: 25 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, filter, bizId, isError, businesses])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const refetch = () => qc.invalidateQueries({ queryKey: ["inventory-art", bizRef.current] })
    const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? ""
    const movement = async (id: number, type: "restock" | "consumed") => {
      const q = Number(val(`mvq-${id}`)); if (!q || q <= 0) { toast.error("Tadaad likhein"); return }
      try { await InventoryAPI.createMovement({ inventoryItemId: id, type, quantity: q }); toast.success(type === "restock" ? "Stock aaya" : "Stock kharch"); refetch() }
      catch { toast.error("Nahi hua") }
    }
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { refetch(); return }
      const tab = t.closest(".tab,.tile[data-f]") as HTMLElement | null
      if (tab?.dataset.f) { savePref("tab:inventory", tab.dataset.f); setFilter(tab.dataset.f); return }
      if (t.closest("#addbtn")) { openDrawer(s, "Naya item", itemFormBody(null)); return }
      const edit = t.closest("[data-edit]") as HTMLElement | null
      if (edit?.dataset.edit) { const it = listRef.current.find((i) => i.id === Number(edit.dataset.edit)); if (it) openDrawer(s, "Item edit karein", itemFormBody(it)); return }
      const mv = t.closest("[data-mv]") as HTMLElement | null
      if (mv?.dataset.mv) { const row = s.getElementById(`mv-${mv.dataset.mv}`); if (row) (row as HTMLElement).hidden = !(row as HTMLElement).hidden; return }
      const mvin = t.closest("[data-mvin]") as HTMLElement | null
      if (mvin?.dataset.mvin) { movement(Number(mvin.dataset.mvin), "restock"); return }
      const mvout = t.closest("[data-mvout]") as HTMLElement | null
      if (mvout?.dataset.mvout) { movement(Number(mvout.dataset.mvout), "consumed"); return }
      const del = t.closest("[data-del]") as HTMLElement | null
      if (del?.dataset.del) { const id = Number(del.dataset.del); openConfirm(s, { title: "Item delete karein?", message: "Ye record hat jayega — wapas nahi aayega.", danger: true, onConfirm: async () => { try { await InventoryAPI.removeItem(id); toast.success("Item hata diya"); refetch() } catch { toast.error("Delete nahi hua") } } }); return }
      if (t.closest("#af-save")) {
        const name = val("i-name"); if (!name) { toast.error("Item ka naam likhein"); return }
        const bId = Number(bizRef.current); if (!bId) { toast.error("Business select karein"); return }
        const editId = Number(val("i-id"))
        const body: CreateItemInput = { businessId: bId, name, category: val("i-cat") as InventoryCategory, unit: val("i-unit") as InventoryUnit }
        if (!editId && val("i-stock")) body.currentStock = Number(val("i-stock")) // stock only settable at create; later via movements
        if (val("i-low")) body.lowStockThreshold = Number(val("i-low"))
        if (val("i-cost")) body.lastRestockCostPerUnit = Number(val("i-cost"))
        if (val("i-supp")) body.defaultSupplierName = val("i-supp")
        if (val("i-sku")) body.sku = val("i-sku")
        const btn = s.getElementById("af-save") as HTMLButtonElement | null
        if (btn) { btn.disabled = true; btn.textContent = "Save ho raha…" }
        try {
          if (editId) await InventoryAPI.updateItem(editId, body)
          else await InventoryAPI.createItem(body)
          toast.success(editId ? "Item update ho gaya" : "Item ban gaya"); closeDrawer(s); refetch()
        } catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua"); if (btn) { btn.disabled = false; btn.textContent = editId ? "Update karein" : "Item save karein" } }
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default InventoryArtifact
