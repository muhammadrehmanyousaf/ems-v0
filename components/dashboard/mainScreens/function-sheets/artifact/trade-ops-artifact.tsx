"use client"

/**
 * Trade operations hub — premium rebuild on the shared champagne shell.
 * Faithful config-driven editor: TRADE_OPS registry → per-trade sections of
 * editable rows, stored in a function-sheet JSON column and saved verbatim via
 * FunctionSheetAPI.update (the same proven path). Trade switcher, add/remove
 * rows, per-cell editing, dirty tracking + save.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { FunctionSheetAPI, type FunctionSheet } from "@/lib/api/functionSheets"
import { TRADE_OPS, type TradeOpsTrade, type TradeOpsSection, type TradeOpsColumn } from "@/lib/dashboard/trade-ops-config"
import { useArtifactShell, escHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

type Row = Record<string, unknown> & { _rid: string }
let ridSeq = 0
const newRid = () => `r${Date.now()}_${ridSeq++}`
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = { plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', check: '<path d="M20 6 9 17l-5-5"/>' }

const EXTRA_CSS = String.raw`
.content{ max-width:1240px; padding-bottom:90px; }
.tradetabs{ display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; }
.tradetab{ height:34px; padding:0 14px; border-radius:9px; border:1px solid var(--border); background:var(--surface); color:var(--ink-2); font-size:12.5px; font-weight:600; } .tradetab:hover{ background:var(--surface-3); color:var(--ink); } .tradetab.on{ background:var(--accent); color:var(--on-accent); border-color:transparent; box-shadow:var(--shadow-xs); }
.tsec{ margin-bottom:16px; } .tsec-h{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px 12px; } .tsec-h h2{ font-size:14px; font-weight:600; } .tsec-h .sub{ font-size:11.5px; color:var(--ink-3); margin-top:2px; }
.tw{ overflow-x:auto; } table.te{ width:100%; border-collapse:collapse; }
.te thead th{ text-align:left; font-size:11px; font-weight:600; color:var(--ink-3); text-transform:uppercase; letter-spacing:.03em; padding:9px 10px; border-bottom:1px solid var(--border); background:var(--surface-2); white-space:nowrap; }
.te tbody td{ padding:5px 8px; border-bottom:1px solid var(--border); vertical-align:middle; } .te tbody tr:last-child td{ border-bottom:0; }
.te input,.te select{ width:100%; min-width:110px; border:1px solid transparent; border-radius:7px; background:transparent; color:var(--ink); padding:6px 8px; font:inherit; font-size:12.5px; outline:none; } .te input:hover,.te select:hover{ background:var(--surface-2); } .te input:focus,.te select:focus{ border-color:var(--accent); background:var(--surface); box-shadow:0 0 0 3px var(--accent-wash); }
.te .rowdel{ width:28px; height:28px; border-radius:7px; border:0; background:transparent; color:var(--ink-4); display:grid; place-items:center; } .te .rowdel:hover{ background:var(--bad-wash); color:var(--bad); } .te .rowdel svg{ width:14px; height:14px; }
.addrow{ display:inline-flex; align-items:center; gap:6px; height:30px; padding:0 12px; margin:10px 12px; border-radius:8px; border:1px dashed var(--border-2); background:var(--surface); color:var(--ink-2); font-size:12px; font-weight:600; } .addrow:hover{ border-color:var(--accent); color:var(--accent-ink); } .addrow svg{ width:13px; height:13px; }
.te .empty-rows td{ color:var(--ink-3); font-size:12px; padding:14px 10px; }
.savebar{ position:fixed; left:236px; right:0; bottom:0; z-index:30; display:flex; align-items:center; gap:12px; padding:12px 26px; background:color-mix(in srgb,var(--surface) 90%,transparent); backdrop-filter:blur(10px); border-top:1px solid var(--border); }
.savebar .sb-txt{ font-size:12.5px; color:var(--ink-2); font-weight:500; } .savebar .sb-sp{ flex:1; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:820px){ .savebar{ left:0; } }
`

function cellInput(col: TradeOpsColumn, sec: string, rid: string, value: unknown): string {
  const v = escHtml(value == null ? "" : String(value))
  if (col.type === "select") {
    const opts = (col.options || []).map((o) => `<option value="${escHtml(o)}"${String(value) === o ? " selected" : ""}>${escHtml(o)}</option>`).join("")
    return `<select data-cell data-sec="${escHtml(sec)}" data-rid="${escHtml(rid)}" data-col="${escHtml(col.key)}"><option value="">—</option>${opts}</select>`
  }
  const type = col.type === "number" ? "number" : col.type === "date" ? "date" : "text"
  return `<input type="${type}" data-cell data-sec="${escHtml(sec)}" data-rid="${escHtml(rid)}" data-col="${escHtml(col.key)}" value="${v}" placeholder="${escHtml(col.label)}"/>`
}

function sectionTableBody(section: TradeOpsSection, rows: Row[]): string {
  if (!rows.length) return `<tr class="empty-rows"><td colspan="${section.columns.length + 1}">Koi row nahi — "Row add karein" se shuru karein.</td></tr>`
  return rows.map((r) => `<tr data-rid="${escHtml(r._rid)}">${section.columns.map((c) => `<td>${cellInput(c, section.key, r._rid, r[c.key])}</td>`).join("")}<td><button class="rowdel" data-delrow data-sec="${escHtml(section.key)}" data-rid="${escHtml(r._rid)}" title="Delete">${svg(IC.trash)}</button></td></tr>`).join("")
}

function sectionHtml(section: TradeOpsSection, rows: Row[]): string {
  return `<div class="card tsec"><div class="tsec-h"><div><h2>${escHtml(section.label)}</h2>${(section as { hint?: string }).hint ? `<div class="sub">${escHtml((section as { hint?: string }).hint!)}</div>` : ""}</div></div>
    <div class="tw"><table class="te"><thead><tr>${section.columns.map((c) => `<th>${escHtml(c.label)}</th>`).join("")}<th></th></tr></thead>
    <tbody id="tb-${escHtml(section.key)}">${sectionTableBody(section, rows)}</tbody></table></div>
    <button class="addrow" data-addrow="${escHtml(section.key)}">${svg(IC.plus)} Row add karein</button></div>`
}

export function TradeOpsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/trade-ops", crumbBold: "Ops", crumbSub: "Trade operations", extraCss: EXTRA_CSS })
  const qc = useQueryClient()
  const { data: sheet } = useQuery({
    queryKey: ["tradeops-sheet"],
    queryFn: async () => { const list = await FunctionSheetAPI.list(); const first = list?.functionSheets?.[0]; return first ? FunctionSheetAPI.get(first.id) : null },
  })
  const trades = TRADE_OPS
  const [activeTrade, setActiveTrade] = React.useState(trades[0]?.trade ?? "")
  // rowsRef: { [trade]: { [sectionKey]: Row[] } }
  const rowsRef = React.useRef<Record<string, Record<string, Row[]>>>({})
  const seeded = React.useRef(false)
  const dirty = React.useRef<Set<string>>(new Set()) // trade keys with unsaved edits
  const sheetRef = React.useRef<FunctionSheet | null>(null); sheetRef.current = (sheet ?? null) as FunctionSheet | null

  // Seed rows from the sheet once.
  React.useEffect(() => {
    if (!sheet || seeded.current) return
    seeded.current = true
    const s = sheet as unknown as Record<string, unknown>
    for (const t of trades) {
      const stored = (s[t.jsonField] as Record<string, unknown[]>) || {}
      rowsRef.current[t.trade] = {}
      for (const sec of t.sections) {
        const arr = Array.isArray(stored[sec.key]) ? stored[sec.key] : []
        rowsRef.current[t.trade][sec.key] = arr.map((r) => ({ ...(r as Record<string, unknown>), _rid: newRid() }))
      }
    }
  }, [sheet, trades])

  const renderContent = React.useCallback(() => {
    const s = shadowRef.current; if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (sheet === undefined) { wwc.innerHTML = `<div class="loadwrap">Trade operations load ho rahi hain…</div>`; return }
    if (!sheet) { wwc.innerHTML = `<div class="loadwrap">Koi function sheet nahi mili — pehle ek booking ka function sheet banayein.</div>`; return }
    const t = trades.find((x) => x.trade === activeTrade) || trades[0]
    if (!t) { wwc.innerHTML = `<div class="loadwrap">Koi trade config nahi.</div>`; return }
    const tabs = `<div class="tradetabs">${trades.map((x) => `<button class="tradetab${x.trade === activeTrade ? " on" : ""}" data-trade="${escHtml(x.trade)}">${escHtml(x.label)}</button>`).join("")}</div>`
    const secs = t.sections.map((sec) => sectionHtml(sec, rowsRef.current[t.trade]?.[sec.key] ?? [])).join("")
    wwc.innerHTML = `
    <div class="head"><div><h1>Trade operations</h1><div class="sub">${escHtml((sheet as FunctionSheet).title || "Function sheet")} · operational plan.</div></div></div>
    ${tabs}${secs}
    <div class="savebar" id="savebar"><span class="sb-txt" id="sbtxt">${dirty.current.size ? "Badla hua hai — save karein" : "Sab mehfooz"}</span><span class="sb-sp"></span><button class="btn btn-primary" id="sbsave">${svg(IC.check)} Save changes</button></div>
    <div class="foot">WeddingWala vendor console · Trade operations</div>`
  }, [shadowRef, ready, sheet, trades, activeTrade])

  React.useEffect(() => { renderContent() }, [renderContent])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current; if (!s || !ready || bound.current) return
    bound.current = true
    const markDirty = () => { dirty.current.add(activeTradeRef.current); const tx = s.getElementById("sbtxt"); if (tx) tx.textContent = "Badla hua hai — save karein" }
    const setCell = (sec: string, rid: string, col: string, v: unknown) => {
      const t = rowsRef.current[activeTradeRef.current]; if (!t?.[sec]) return
      const row = t[sec].find((r) => r._rid === rid); if (row) { row[col] = v; markDirty() }
    }
    const rerenderSection = (sec: string) => {
      const t = trades.find((x) => x.trade === activeTradeRef.current); const section = t?.sections.find((x) => x.key === sec); if (!section) return
      const tb = s.getElementById(`tb-${sec}`); if (tb) tb.innerHTML = sectionTableBody(section, rowsRef.current[activeTradeRef.current]?.[sec] ?? [])
    }
    s.addEventListener("input", (e) => { const el = e.target as HTMLElement; if (el.hasAttribute?.("data-cell")) setCell(el.dataset.sec!, el.dataset.rid!, el.dataset.col!, (el as HTMLInputElement).value) })
    s.addEventListener("change", (e) => { const el = e.target as HTMLElement; if (el.hasAttribute?.("data-cell")) setCell(el.dataset.sec!, el.dataset.rid!, el.dataset.col!, (el as HTMLInputElement).value) })
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      const tab = t.closest("[data-trade]") as HTMLElement | null
      if (tab?.dataset.trade) { setActiveTrade(tab.dataset.trade); return }
      const add = t.closest("[data-addrow]") as HTMLElement | null
      if (add?.dataset.addrow) {
        const sec = add.dataset.addrow; const trade = trades.find((x) => x.trade === activeTradeRef.current); const section = trade?.sections.find((x) => x.key === sec)
        if (!section) return
        const blank: Row = { ...Object.fromEntries(section.columns.map((c) => [c.key, c.type === "select" ? (c.options?.[0] ?? "") : ""])), _rid: newRid() }
        rowsRef.current[activeTradeRef.current] ??= {}; rowsRef.current[activeTradeRef.current][sec] ??= []
        rowsRef.current[activeTradeRef.current][sec].push(blank); markDirty(); rerenderSection(sec)
        return
      }
      const del = t.closest("[data-delrow]") as HTMLElement | null
      if (del?.dataset.delrow) { const sec = del.dataset.sec!, rid = del.dataset.rid!; const arr = rowsRef.current[activeTradeRef.current]?.[sec]; if (arr) { rowsRef.current[activeTradeRef.current][sec] = arr.filter((r) => r._rid !== rid); markDirty(); rerenderSection(sec) } return }
      if (t.closest("#sbsave")) {
        const sh = sheetRef.current; if (!sh) return
        // Save EVERY trade with unsaved edits (not just the active one) in one atomic patch.
        const dirtyTrades = [...dirty.current]
        if (!dirtyTrades.length) return
        const patch: Record<string, unknown> = {}
        for (const tk of dirtyTrades) {
          const trade = trades.find((x) => x.trade === tk); if (!trade) continue
          const obj: Record<string, unknown[]> = {}
          for (const sec of trade.sections) obj[sec.key] = (rowsRef.current[tk]?.[sec.key] ?? []).map((r) => { const { _rid, ...rest } = r; void _rid; return rest })
          patch[trade.jsonField] = obj
        }
        const btn = s.getElementById("sbsave") as HTMLButtonElement | null; if (btn) { btn.disabled = true; btn.textContent = "Save ho raha…" }
        try {
          await FunctionSheetAPI.update(sh.id, patch as Record<string, unknown>)
          dirty.current.clear(); const tx = s.getElementById("sbtxt"); if (tx) tx.textContent = "Sab mehfooz"
          toast.success(dirtyTrades.length > 1 ? `${dirtyTrades.length} trades save ho gaye` : "Save ho gaya"); qc.invalidateQueries({ queryKey: ["tradeops-sheet"] })
        } catch { toast.error("Save nahi hua") }
        finally { if (btn) { btn.disabled = false; btn.innerHTML = `${svg(IC.check)} Save changes` } }
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const activeTradeRef = React.useRef(activeTrade); activeTradeRef.current = activeTrade

  return <div ref={hostRef} />
}

export default TradeOpsArtifact
