"use client"

/**
 * Kitchen prep sheet — premium rebuild on the shared champagne shell.
 * Faithful: pick dishes (from recipe BOMs) + guest counts, compute via
 * venueOsApi.kitchenPrep → deghs per dish + a consolidated ingredient shopping
 * list + unmatched-dish warnings. Add/remove builder rows, then build the sheet.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { venueOsApi, type RecipeBom, type KitchenPrepSheet } from "@/lib/api/venueOs"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useBusiness } from "@/context/BusinessContext"
import { useArtifactShell, pkNum, escHtml, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = { plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', pot: '<path d="M4 8h16l-1 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M2 8h20M8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>', cook: '<path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6z"/><path d="M6 17h12"/>', print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>', wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20l1.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>' }

/** Plain-text shopping list + degh plan for a WhatsApp share to the cook/bazaar. */
function sheetToText(sheet: KitchenPrepSheet): string {
  const lines: string[] = ["🍲 Kitchen Prep Sheet", ""]
  lines.push("— Deghs —")
  sheet.dishes.forEach((d) => lines.push(`• ${d.dishName}${d.dishNameUr ? ` (${d.dishNameUr})` : ""}: ${d.deghs} degh · ${num(d.guests)} mehmaan`))
  if (sheet.ingredients.length) {
    lines.push("", "— Shopping list —")
    sheet.ingredients.forEach((g) => lines.push(`• ${g.name}${g.nameUr ? ` (${g.nameUr})` : ""}: ${num(g.totalQty)} ${g.unit || ""}`.trim()))
  }
  if (sheet.unmatchedDishes?.length) lines.push("", `⚠️ Recipe nahi mili: ${sheet.unmatchedDishes.join(", ")}`)
  return lines.join("\n")
}

/** Open a clean, print-ready window with the degh table + shopping list. */
function printSheet(sheet: KitchenPrepSheet) {
  const rowsD = sheet.dishes.map((d) => `<tr><td>${escHtml(d.dishName)}${d.dishNameUr ? ` — ${escHtml(d.dishNameUr)}` : ""}</td><td>${num(d.guests)}</td><td><b>${d.deghs}</b></td><td>${escHtml(d.batchLabel || "—")}</td></tr>`).join("")
  const rowsI = sheet.ingredients.map((g) => `<tr><td>${escHtml(g.name)}${g.nameUr ? ` — ${escHtml(g.nameUr)}` : ""}</td><td>${escHtml(g.category || "—")}</td><td>${num(g.totalQty)} ${escHtml(g.unit || "")}</td></tr>`).join("")
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Kitchen Prep Sheet</title>
    <style>body{font:13px/1.5 system-ui,Arial,sans-serif;color:#111;padding:28px;max-width:760px;margin:0 auto}h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;margin:22px 0 8px;border-bottom:2px solid #333;padding-bottom:4px}table{width:100%;border-collapse:collapse;margin-bottom:8px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #ddd;font-size:12.5px}th{background:#f4f4f4}.warn{background:#fff3cd;border:1px solid #e0c060;padding:8px 12px;border-radius:6px;margin:10px 0}@media print{button{display:none}}</style></head>
    <body><h1>Kitchen Prep Sheet</h1><div style="color:#666;font-size:12px">${new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
    ${sheet.unmatchedDishes?.length ? `<div class="warn"><b>${sheet.unmatchedDishes.length} dish</b> ki recipe nahi mili: ${escHtml(sheet.unmatchedDishes.join(", "))}. Inke ingredients list mein nahi.</div>` : ""}
    <h2>Deghs (dish ke hisaab se)</h2><table><thead><tr><th>Dish</th><th>Mehmaan</th><th>Deghs</th><th>Batch</th></tr></thead><tbody>${rowsD}</tbody></table>
    ${sheet.ingredients.length ? `<h2>Ingredient shopping list</h2><table><thead><tr><th>Ingredient</th><th>Category</th><th>Tadaad</th></tr></thead><tbody>${rowsI}</tbody></table>` : ""}
    <button onclick="window.print()" style="margin-top:16px;padding:10px 18px;font-size:14px;cursor:pointer">Print / PDF</button>
    <script>window.onload=function(){setTimeout(function(){window.print()},350)}</script></body></html>`
  const w = window.open("", "_blank", "noopener,width=820,height=900")
  if (!w) { toast.error("Popup block hua — browser mein popups allow karein"); return }
  w.document.write(html); w.document.close()
}

const EXTRA_CSS = String.raw`
.kp-intro{ display:flex; gap:12px; align-items:center; padding:14px 16px; margin-bottom:14px; }
.kp-ic{ width:40px; height:40px; border-radius:11px; background:var(--accent-wash); border:1px solid var(--accent-line); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .kp-ic svg{ width:20px; height:20px; }
.kp-t{ font-weight:600; font-size:14px; } .kp-s{ font-size:12px; color:var(--ink-3); margin-top:2px; }
.card-h{ display:flex; align-items:center; justify-content:space-between; padding:14px 16px 12px; border-bottom:1px solid var(--border); } .card-h h2{ font-size:13.5px; font-weight:600; }
.brow{ display:flex; gap:10px; align-items:center; padding:9px 16px; border-bottom:1px solid var(--border); } .brow:last-of-type{ border-bottom:0; }
.brow select{ flex:1; } .brow input{ width:120px; }
.brow select,.brow input{ border:1px solid var(--border-2); border-radius:8px; background:var(--surface-2); color:var(--ink); padding:8px 10px; font:inherit; font-size:12.5px; outline:none; } .brow select:focus,.brow input:focus{ border-color:var(--accent); background:var(--surface); box-shadow:0 0 0 3px var(--accent-wash); }
.rowdel{ width:30px; height:30px; border-radius:7px; border:0; background:transparent; color:var(--ink-4); display:grid; place-items:center; } .rowdel:hover{ background:var(--bad-wash); color:var(--bad); } .rowdel svg{ width:14px; height:14px; }
.addrow{ display:inline-flex; align-items:center; gap:6px; height:30px; padding:0 12px; margin:10px 16px; border-radius:8px; border:1px dashed var(--border-2); background:var(--surface); color:var(--ink-2); font-size:12px; font-weight:600; } .addrow:hover{ border-color:var(--accent); color:var(--accent-ink); } .addrow svg{ width:13px; height:13px; }
.kp-foot{ padding:12px 16px; border-top:1px solid var(--border); display:flex; gap:16px; align-items:center; } .kp-foot .btn{ height:38px; }
.res-tiles{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin:14px 0; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:10px 13px; box-shadow:var(--shadow-xs); } .tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; } .t-val{ font-size:20px; font-weight:680; margin-top:8px; }
.warnbar{ display:flex; gap:10px; align-items:center; padding:11px 14px; border-radius:10px; background:var(--warn-wash); border:1px solid var(--accent-line); color:var(--warn); font-size:12.5px; margin-bottom:14px; } .warnbar svg{ width:16px; height:16px; flex:none; } .warnbar b{ color:var(--ink); }
.deghpill{ display:inline-flex; align-items:center; gap:5px; font-weight:660; color:var(--accent-ink); } .deghpill svg{ width:13px; height:13px; }
.res-acts{ display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:12px 15px; margin:14px 0; background:var(--surface); border:1px solid var(--accent-line); border-radius:var(--r); box-shadow:var(--shadow-xs); } .res-acts-t{ font-size:12.5px; font-weight:600; color:var(--ink-2); } .res-acts-b{ display:flex; gap:8px; } .res-acts .btn svg{ width:15px; height:15px; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:820px){ .res-tiles{ grid-template-columns:1fr; } }
`

function builderRow(dishOpts: string, rid: string, dish = "", guests = ""): string {
  return `<div class="brow" data-rid="${rid}"><select data-b-dish><option value="">— dish chunein —</option>${dishOpts.replace(`value="${escHtml(dish)}"`, `value="${escHtml(dish)}" selected`)}</select><input type="number" data-b-guests min="0" placeholder="mehmaan" value="${escHtml(guests)}"/><button class="rowdel" data-delrow="${rid}">${svg(IC.trash)}</button></div>`
}

function resultHtml(sheet: KitchenPrepSheet): string {
  const totalDeghs = sheet.dishes.reduce((a, d) => a + num(d.deghs), 0)
  const totalGuests = sheet.dishes.reduce((a, d) => a + num(d.guests), 0)
  const warn = sheet.unmatchedDishes?.length ? `<div class="warnbar">${svg(IC.warn, 2)} <span><b>${sheet.unmatchedDishes.length} dish</b> ki recipe nahi mili — ${escHtml(sheet.unmatchedDishes.join(", "))}. Inke ingredients list mein nahi.</span></div>` : ""
  const tiles = `<div class="res-tiles">
    <div class="tile hl"><div class="t-cap">Kul deghs</div><div class="t-val tnum">${totalDeghs}</div></div>
    <div class="tile"><div class="t-cap">Kul mehmaan (dishes)</div><div class="t-val tnum">${pkNum(totalGuests)}</div></div>
    <div class="tile"><div class="t-cap">Ingredients</div><div class="t-val tnum">${sheet.ingredients.length}</div></div>
  </div>`
  const dishes = `<div class="card" style="margin-bottom:14px"><div class="card-h"><h2>Dish ke hisaab se deghs</h2></div><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Dish</th><th>Mehmaan</th><th>Deghs</th><th>Batch</th><th class="r">Plates</th></tr></thead>
    <tbody>${sheet.dishes.map((d) => `<tr><td class="cc-nm" style="font-weight:600">${escHtml(d.dishName)}${d.dishNameUr ? ` <span style="color:var(--ink-3);font-weight:400">${escHtml(d.dishNameUr)}</span>` : ""}</td><td class="td-mut tnum">${pkNum(num(d.guests))}</td><td><span class="deghpill">${svg(IC.pot)} ${d.deghs}</span></td><td class="td-mut">${escHtml(d.batchLabel || "—")}</td><td class="r tnum">${pkNum(num(d.standardYieldPlates))}</td></tr>`).join("")}</tbody></table></div></div>`
  const ings = sheet.ingredients.length ? `<div class="card"><div class="card-h"><h2>Ingredient shopping list</h2><span class="st acc"><i></i> ${sheet.ingredients.length} cheezein</span></div><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Ingredient</th><th>Category</th><th class="r">Tadaad</th></tr></thead>
    <tbody>${sheet.ingredients.map((g) => `<tr><td class="cc-nm" style="font-weight:600">${escHtml(g.name)}${g.nameUr ? ` <span style="color:var(--ink-3);font-weight:400">${escHtml(g.nameUr)}</span>` : ""}</td><td class="td-mut">${escHtml(g.category || "—")}</td><td class="r td-amt tnum">${pkNum(num(g.totalQty))} <span style="font-size:11px;color:var(--ink-3)">${escHtml(g.unit || "")}</span></td></tr>`).join("")}</tbody></table></div></div>` : ""
  const acts = `<div class="res-acts"><div class="res-acts-t">Sheet tayyar — kitchen/bazaar ko bhejein</div><div class="res-acts-b"><button class="btn btn-ghost" id="kp-print">${svg(IC.print, 1.9)} Print / PDF</button><button class="btn btn-primary" id="kp-wa">${svg(IC.wa, 1.9)} WhatsApp bhejein</button></div></div>`
  return `<div id="results">${acts}${warn}${tiles}${dishes}${ings}</div>`
}

export function KitchenPrepArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/kitchen-prep", crumbBold: "Ops", crumbSub: "Kitchen prep", extraCss: EXTRA_CSS })
  const qc = useQueryClient()
  const { business } = useBusiness()
  const activeBusinessId = useActiveBusinessId() ?? (business as { id?: number } | null)?.id ?? null
  const bizRef = React.useRef(activeBusinessId); bizRef.current = activeBusinessId
  const bomsQ = useQuery({ queryKey: ["kp-boms", activeBusinessId], enabled: !!activeBusinessId, queryFn: () => venueOsApi.listRecipeBoms(activeBusinessId as number) })
  const isError = bomsQ.isError
  const boms = React.useMemo(() => (bomsQ.data ?? []) as RecipeBom[], [bomsQ.data])
  const resultRef = React.useRef<KitchenPrepSheet | null>(null)
  const dishOptsRef = React.useRef("")
  dishOptsRef.current = boms.map((b) => `<option value="${escHtml(b.dishName)}">${escHtml(b.dishName)}</option>`).join("")

  const prep = useMutation({
    mutationFn: (dishes: { dishName: string; guests: number }[]) => venueOsApi.kitchenPrep(bizRef.current as number, dishes),
    onSuccess: (sheet) => { resultRef.current = sheet as KitchenPrepSheet; const s = shadowRef.current; const wrap = s?.getElementById("resultwrap"); if (wrap) wrap.innerHTML = resultHtml(sheet as KitchenPrepSheet) },
    onError: () => toast.error("Prep sheet nahi bani — dishes/recipes check karein"),
  })

  const render = React.useCallback(() => {
    const s = shadowRef.current; if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!activeBusinessId) { wwc.innerHTML = `<div class="loadwrap">Pehle ek business select karein.</div>`; return }
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Kitchen prep sheet</h1></div></div>${errorBannerHtml()}`; return }
    if (bomsQ.isLoading) { wwc.innerHTML = `<div class="loadwrap">Recipes load ho rahi hain…</div>`; return }
    const rid = `r${Date.now()}`
    wwc.innerHTML = `
    <div class="head"><div><h1>Kitchen prep sheet</h1><div class="sub">Dishes aur mehmaan daalein — deghs aur ingredient shopping list milegi.</div></div></div>
    <div class="card kp-intro"><span class="kp-ic">${svg(IC.cook, 1.8)}</span><div><div class="kp-t">Event-day cook plan</div><div class="kp-s">Recipe BOMs se: kitni deghs pakani hain + poori shopping list — kitchen ke liye print-ready.</div></div></div>
    <div class="card"><div class="card-h"><h2>Dishes & mehmaan</h2><span style="font-size:11.5px;color:var(--ink-3)">${boms.length} recipes available</span></div>
      <div id="brows">${builderRow(dishOptsRef.current, rid)}</div>
      <button class="addrow" id="addrow">${svg(IC.plus)} Dish add karein</button>
      <div class="kp-foot"><button class="btn btn-primary" id="build">${svg(IC.pot)} Prep sheet banayein</button><span style="font-size:12px;color:var(--ink-3)">${boms.length === 0 ? "Pehle recipes/BOMs banayein (Advanced settings)." : "Har dish ke mehmaan alag ho sakte hain."}</span></div></div>
    <div id="resultwrap">${resultRef.current ? resultHtml(resultRef.current) : ""}</div>
    <div class="foot">WeddingWala vendor console · Kitchen prep</div>`
  }, [shadowRef, ready, activeBusinessId, bomsQ.isLoading, boms, isError])

  React.useEffect(() => { render() }, [render])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current; if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["kp-boms"] }); return }
      if (t.closest("#addrow")) { const brows = s.getElementById("brows"); if (brows) brows.insertAdjacentHTML("beforeend", builderRow(dishOptsRef.current, `r${Date.now()}`)); return }
      if (t.closest("#kp-print")) { if (resultRef.current) printSheet(resultRef.current); return }
      if (t.closest("#kp-wa")) { if (resultRef.current) window.open(`https://wa.me/?text=${encodeURIComponent(sheetToText(resultRef.current))}`, "_blank", "noopener"); return }
      const del = t.closest("[data-delrow]") as HTMLElement | null
      if (del) { const row = del.closest(".brow"); const brows = s.getElementById("brows"); if (row && brows && brows.querySelectorAll(".brow").length > 1) row.remove(); return }
      if (t.closest("#build")) {
        const dishes: { dishName: string; guests: number }[] = []
        s.querySelectorAll("#brows .brow").forEach((r) => { const dish = (r.querySelector("[data-b-dish]") as HTMLSelectElement | null)?.value?.trim(); const guests = Number((r.querySelector("[data-b-guests]") as HTMLInputElement | null)?.value); if (dish && guests > 0) dishes.push({ dishName: dish, guests }) })
        if (!dishes.length) { toast.error("Kam se kam ek dish aur mehmaan daalein"); return }
        const btn = s.getElementById("build") as HTMLButtonElement | null; if (btn) { btn.disabled = true; btn.textContent = "Ban rahi…" }
        prep.mutate(dishes, { onSettled: () => { if (btn) { btn.disabled = false; btn.innerHTML = `${svg(IC.pot)} Prep sheet banayein` } } })
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default KitchenPrepArtifact
