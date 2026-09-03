"use client"

/**
 * Expenses (Kharcha) — premium rebuild on the shared champagne shell.
 * Real vendor cost-tracking via ExpensesAPI: summary tiles + category
 * breakdown + a filterable list, with an inline "add expense" form (create)
 * and per-row delete. No money-path guessing — the same endpoints the classic
 * screen used.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ExpensesAPI, type VendorExpense, type ExpenseCategory, type ExpensePaymentMethod, type CreateExpenseInput,
} from "@/lib/api/vendorExpenses"
import { useArtifactShell, pkNum, escHtml, initTablePager, errorBannerHtml, loadPref, savePref, openDrawer, closeDrawer, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const CAT_LABEL: Record<ExpenseCategory, string> = {
  ingredients: "Saman / raashan", fuel: "Fuel", labour: "Mazdoori", salary: "Tankhwah", electricity: "Bijli",
  rentals: "Kiraya", repairs: "Marammat", marketing: "Marketing", brokerage: "Brokerage", tax: "Tax",
  supplies: "Supplies", transport: "Transport", other: "Deegar",
}
const CAT_COLOR: Record<ExpenseCategory, string> = {
  ingredients: "var(--accent)", fuel: "var(--warn)", labour: "var(--info)", salary: "#B5657A", electricity: "#c9a227",
  rentals: "var(--ok)", repairs: "var(--bad)", marketing: "#3f9fa6", brokerage: "#C4708A", tax: "var(--ink-4)",
  supplies: "#6a8caf", transport: "#a6743f", other: "var(--ink-4)",
}
const METHOD_LABEL: Record<ExpensePaymentMethod, string> = {
  cash: "Cash", bank_transfer: "Bank transfer", cheque: "Cheque", jazzcash: "JazzCash", easypaisa: "Easypaisa",
  raast: "Raast", ibft: "IBFT", card: "Card", other: "Deegar",
}
const CATS = Object.keys(CAT_LABEL) as ExpenseCategory[]
const METHODS = Object.keys(METHOD_LABEL) as ExpensePaymentMethod[]
const money = (v: number | string | null | undefined) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) }
const todayIso = () => new Date().toISOString().slice(0, 10)
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  cal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>', tag: '<path d="M20.6 13.4 12 22l-9-9V3h10z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
}

const EXTRA_CSS = String.raw`
.exp-tiles{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:14px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:14px 15px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:20px; font-weight:680; letter-spacing:-.02em; margin-top:8px; } .t-val .rs{ font-size:12px; color:var(--ink-3); font-weight:600; }
.t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.catbars{ display:flex; flex-direction:column; gap:9px; padding:2px 0; }
.catbar{ display:grid; grid-template-columns:120px 1fr auto; gap:12px; align-items:center; }
.cb-nm{ font-size:12px; color:var(--ink-2); display:flex; align-items:center; gap:7px; } .cb-nm .dot{ width:8px; height:8px; border-radius:50%; flex:none; }
.cb-track{ height:7px; border-radius:4px; background:var(--surface-3); overflow:hidden; } .cb-track span{ display:block; height:100%; border-radius:4px; }
.cb-amt{ font-size:12px; font-weight:600; font-variant-numeric:tabular-nums; }
.catchip{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:2px 8px; border-radius:6px; background:var(--surface-2); border:1px solid var(--border); } .catchip .dot{ width:7px; height:7px; border-radius:50%; }
.del{ width:30px; height:30px; border-radius:7px; border:0; background:transparent; color:var(--ink-3); display:grid; place-items:center; } .del:hover{ background:var(--bad-wash); color:var(--bad); } .del svg{ width:15px; height:15px; }
.rowacts{ display:flex; gap:4px; justify-content:flex-end; align-items:center; }
.editbtn{ width:30px; height:30px; border-radius:7px; border:0; background:transparent; color:var(--ink-3); display:grid; place-items:center; } .editbtn:hover{ background:var(--surface-3); color:var(--ink); } .editbtn svg{ width:15px; height:15px; }
.cc-ev[data-nav-btn]{ cursor:pointer; } .cc-ev[data-nav-btn]:hover{ color:var(--accent-ink); text-decoration:underline; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:820px){ .exp-tiles{ grid-template-columns:1fr; } }
`

function expenseFormBody(ex?: VendorExpense | null): string {
  const catOpts = CATS.map((c) => `<option value="${c}"${ex?.category === c ? " selected" : ""}>${escHtml(CAT_LABEL[c])}</option>`).join("")
  const methodOpts = ["", ...METHODS].map((m) => `<option value="${m}"${(ex?.paymentMethod || "") === m ? " selected" : ""}>${m ? escHtml(METHOD_LABEL[m as ExpensePaymentMethod]) : "— tareeqa —"}</option>`).join("")
  return `
  <input type="hidden" id="e-id" value="${ex ? String(ex.id) : ""}"/>
  <div class="dfield row2">
    <div><label class="dlabel">Amount (Rs) <span class="req">*</span></label><input type="number" id="e-amount" min="0" value="${ex ? escHtml(money(ex.amount)) : ""}" placeholder="0"/></div>
    <div><label class="dlabel">Category <span class="req">*</span></label><select id="e-category">${catOpts}</select></div>
  </div>
  <div class="dfield row2">
    <div><label class="dlabel">Tareekh <span class="req">*</span></label><input type="date" id="e-date" value="${ex?.spentDate ? ex.spentDate.slice(0, 10) : todayIso()}"/></div>
    <div><label class="dlabel">Tareeqa</label><select id="e-method">${methodOpts}</select></div>
  </div>
  <div class="dfield"><label class="dlabel">Kisko diya</label><input type="text" id="e-vendor" value="${ex ? escHtml(ex.vendorName || "") : ""}" placeholder="Supplier / naam"/></div>
  <div class="dfield"><label class="dlabel">Tafseel</label><input type="text" id="e-desc" value="${ex ? escHtml(ex.description || "") : ""}" placeholder="Jaise: 50 kg chawal"/></div>
  <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Cancel</button><button class="btn btn-primary" type="button" id="addsave">${ex ? "Update karein" : "Kharcha save karein"}</button></div>`
}

function buildContent(list: VendorExpense[], summary: { total: number; byCategory: Partial<Record<ExpenseCategory, number>> }, filter: string): string {
  const total = money(summary.total)
  const now = new Date(); const mo = now.getMonth(); const yr = now.getFullYear()
  const monthTotal = list.filter((e) => { const d = new Date(e.spentDate); return !isNaN(d.getTime()) && d.getMonth() === mo && d.getFullYear() === yr }).reduce((s, e) => s + money(e.amount), 0)
  const byCat = summary.byCategory || {}
  const catEntries = (Object.entries(byCat) as [ExpenseCategory, number][]).filter(([, v]) => money(v) > 0).sort((a, b) => money(b[1]) - money(a[1]))
  const maxCat = catEntries.length ? money(catEntries[0][1]) : 1
  const topCat = catEntries[0]

  const tiles = `<div class="exp-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.wallet, 1.9)} Kul kharcha</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(total)}</div><div class="t-sub">${list.length} entries</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.cal, 1.9)} Is mahine</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(monthTotal)}</div><div class="t-sub">${now.toLocaleDateString("en-PK", { month: "long" })}</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.tag, 1.9)} Sab se bara category</div><div class="t-val" style="font-size:16px">${topCat ? escHtml(CAT_LABEL[topCat[0]]) : "—"}</div><div class="t-sub">${topCat ? "Rs " + pkNum(money(topCat[1])) : "koi kharcha nahi"}</div></div>
  </div>`

  const catBars = catEntries.length ? `<div class="card" style="margin-bottom:14px"><div class="card-h" style="padding:14px 16px 6px"><div><h2 style="font-size:13.5px;font-weight:600">Category ke hisaab se</h2></div></div><div style="padding:8px 16px 16px"><div class="catbars">${catEntries.slice(0, 8).map(([c, v]) => `<div class="catbar"><span class="cb-nm"><span class="dot" style="background:${CAT_COLOR[c]}"></span>${escHtml(CAT_LABEL[c])}</span><span class="cb-track"><span style="width:${Math.round((money(v) / maxCat) * 100)}%;background:${CAT_COLOR[c]}"></span></span><span class="cb-amt tnum">Rs ${pkNum(money(v))}</span></div>`).join("")}</div></div></div>` : ""

  const tabCats = catEntries.slice(0, 6).map(([c]) => c)
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">
    <button class="tab${filter === "all" ? " on" : ""}" data-f="all">Sab <span class="cnt">${list.length}</span></button>
    ${tabCats.map((c) => `<button class="tab${filter === c ? " on" : ""}" data-f="${c}"><span class="dot" style="background:${CAT_COLOR[c]}"></span> ${escHtml(CAT_LABEL[c])}</button>`).join("")}
    </div><div class="filters"><button class="btn btn-primary" id="addbtn">${svg(IC.plus, 2.2)} Naya kharcha</button></div></div>`

  const rows = list.filter((e) => filter === "all" || e.category === filter)
  const body = rows.map((e) => `<tr>
    <td class="td-date">${fmtDate(e.spentDate)}</td>
    <td><span class="catchip"><span class="dot" style="background:${CAT_COLOR[e.category]}"></span> ${escHtml(CAT_LABEL[e.category])}</span></td>
    <td class="td-mut">${escHtml(e.vendorName || e.description || "—")}${e.booking?.customerName ? `<div class="cc-ev" data-nav-btn="/dashboard/bookings/${e.booking.id}" title="Booking kholein">${escHtml(e.booking.customerName)}</div>` : ""}</td>
    <td class="td-mut">${e.paymentMethod ? escHtml(METHOD_LABEL[e.paymentMethod]) : "—"}</td>
    <td class="r td-amt tnum"><span class="rs">Rs</span> ${pkNum(money(e.amount))}</td>
    <td class="r"><div class="rowacts"><button class="editbtn" data-edit="${e.id}" title="Edit">${svg(IC.edit)}</button><button class="del" data-del="${e.id}" title="Delete">${svg(IC.trash)}</button></div></td>
  </tr>`).join("")

  return `
  <div class="head"><div><h1>Kharcha</h1><div class="sub">Aapke saare expenses — <b>Rs ${pkNum(total)}</b> kul.</div></div></div>
  ${tiles}${catBars}${toolbar}
  <div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Tareekh</th><th>Category</th><th>Kis liye</th><th>Tareeqa</th><th class="r">Amount</th><th></th></tr></thead>
    <tbody>${body}</tbody></table></div>
    ${rows.length ? `<div class="tbl-foot"><span>${rows.length} entries</span></div>` : `<div class="empty">Koi kharcha darj nahi. "Naya kharcha" se shuru karein.</div>`}</div>
  <div class="foot">WeddingWala vendor console · Kharcha</div>`
}

export function ExpensesArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/expenses", crumbBold: "Paisa", crumbSub: "Kharcha", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const { data, isError } = useQuery({ queryKey: ["expenses-art"], queryFn: () => ExpensesAPI.list({}) })
  const list = React.useMemo(() => (data?.expenses ?? []) as VendorExpense[], [data])
  const listRef = React.useRef(list); listRef.current = list
  const summary = data?.summary ?? { total: 0, byCategory: {} }
  const [filter, setFilter] = React.useState(() => loadPref("tab:expenses", "all"))

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Kharcha</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Kharcha load ho raha hai…</div>`; return }
    wwc.innerHTML = buildContent(list, summary, filter)
    initTablePager(s, { pageSize: 25 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, filter, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const refetch = () => qc.invalidateQueries({ queryKey: ["expenses-art"] })
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if ((e.target as HTMLElement).closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["expenses-art"] }); return }
      const tab = t.closest(".tab") as HTMLElement | null
      if (tab?.dataset.f) { savePref("tab:expenses", tab.dataset.f); setFilter(tab.dataset.f); return }
      if (t.closest("#addbtn")) { openDrawer(s, "Naya kharcha", expenseFormBody(null)); return }
      const edit = t.closest("[data-edit]") as HTMLElement | null
      if (edit?.dataset.edit) { const ex = listRef.current.find((y) => y.id === Number(edit.dataset.edit)); if (ex) openDrawer(s, "Kharcha edit karein", expenseFormBody(ex)); return }
      if (t.closest("#addsave")) {
        const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? ""
        const amount = Number(val("e-amount"))
        if (!amount || amount <= 0) { toast.error("Sahi amount likhein"); return }
        if (!val("e-date")) { toast.error("Tareekh chunein"); return }
        const editId = Number(val("e-id"))
        const body: CreateExpenseInput = { amount, category: val("e-category") as ExpenseCategory, spentDate: val("e-date") }
        if (val("e-vendor")) body.vendorName = val("e-vendor")
        if (val("e-desc")) body.description = val("e-desc")
        if (val("e-method")) body.paymentMethod = val("e-method") as ExpensePaymentMethod
        const btn = s.getElementById("addsave") as HTMLButtonElement | null
        if (btn) { btn.disabled = true; btn.textContent = "Save ho raha…" }
        try { if (editId) await ExpensesAPI.update(editId, body); else await ExpensesAPI.create(body); toast.success(editId ? "Kharcha update ho gaya" : "Kharcha darj ho gaya"); closeDrawer(s); refetch() }
        catch { toast.error("Save nahi hua"); if (btn) { btn.disabled = false; btn.textContent = editId ? "Update karein" : "Kharcha save karein" } }
        return
      }
      const del = t.closest("[data-del]") as HTMLElement | null
      if (del?.dataset.del) {
        const id = Number(del.dataset.del)
        openConfirm(s, { title: "Kharcha delete karein?", message: "Ye record hat jayega — wapas nahi aayega.", danger: true, onConfirm: async () => {
          try { await ExpensesAPI.remove(id); toast.success("Kharcha hata diya"); refetch() }
          catch { toast.error("Delete nahi hua") }
        } })
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default ExpensesArtifact
