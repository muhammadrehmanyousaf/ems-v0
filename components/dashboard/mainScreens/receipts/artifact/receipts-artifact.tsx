"use client"

/**
 * Receipts — premium rebuild on the shared champagne shell.
 * The operational counterpart to Khata's analytical ledger: record a payment
 * received (create), see them by method, and delete a mistake. Real data via
 * ReceiptsAPI.list / create / remove.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ReceiptsAPI, type PaymentReceipt, type ReceiptMethod, type CreateReceiptInput } from "@/lib/api/paymentReceipts"
import { PaymentsAPI } from "@/lib/api/dashboard"
import { useArtifactShell, pkNum, escHtml, errorBannerHtml, initTablePager, loadPref, savePref, openDrawer, closeDrawer, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

type BkOpt = { bookingId: number; customerName?: string; due?: number }

const METHOD_LABEL: Record<ReceiptMethod, string> = {
  cash: "Cash", jazzcash: "JazzCash", easypaisa: "Easypaisa", raast: "Raast", ibft: "IBFT", bank_transfer: "Bank transfer", other: "Deegar",
}
const METHOD_COLOR: Record<ReceiptMethod, string> = {
  cash: "var(--ok)", jazzcash: "#b03a6e", easypaisa: "#3f9a5a", raast: "var(--info)", ibft: "var(--accent)", bank_transfer: "#6a8caf", other: "var(--ink-4)",
}
const METHODS = Object.keys(METHOD_LABEL) as ReceiptMethod[]
const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) }
const todayIso = () => new Date().toISOString().slice(0, 10)
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  in: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', cal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>', receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
}

const EXTRA_CSS = String.raw`
.rc-tiles{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:14px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:14px 15px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:20px; font-weight:680; letter-spacing:-.02em; margin-top:8px; } .t-val .rs{ font-size:12px; color:var(--ink-3); font-weight:600; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.mbreak{ display:flex; flex-direction:column; gap:8px; padding:2px 0; }
.mbrow{ display:grid; grid-template-columns:110px 1fr auto; gap:12px; align-items:center; }
.mb-nm{ font-size:12px; color:var(--ink-2); display:flex; align-items:center; gap:7px; } .mb-nm .dot{ width:8px; height:8px; border-radius:50%; flex:none; }
.mb-track{ height:7px; border-radius:4px; background:var(--surface-3); overflow:hidden; } .mb-track span{ display:block; height:100%; border-radius:4px; } .mb-amt{ font-size:12px; font-weight:600; font-variant-numeric:tabular-nums; }
.ww-dbody .suffix{ position:relative; } .ww-dbody .suffix input{ padding-left:32px; } .ww-dbody .suffix .rs{ position:absolute; left:11px; top:50%; transform:translateY(-50%); font-size:11.5px; color:var(--ink-3); font-weight:600; pointer-events:none; }
.mchip{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:2px 8px; border-radius:6px; background:var(--surface-2); border:1px solid var(--border); } .mchip .dot{ width:7px; height:7px; border-radius:50%; }
.rowacts{ display:flex; gap:4px; justify-content:flex-end; align-items:center; }
.del{ width:30px; height:30px; border-radius:7px; border:0; background:transparent; color:var(--ink-3); display:grid; place-items:center; } .del:hover{ background:var(--bad-wash); color:var(--bad); } .del svg{ width:15px; height:15px; }
.ed{ width:30px; height:30px; border-radius:7px; border:0; background:transparent; color:var(--ink-3); display:grid; place-items:center; } .ed:hover{ background:var(--surface-3); color:var(--ink); } .ed svg{ width:15px; height:15px; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:820px){ .rc-tiles{ grid-template-columns:1fr; } }
`

/** Drawer body for create (r=null) or edit — same field ids the save handler reads. */
function receiptForm(bookings: BkOpt[], r?: PaymentReceipt | null): string {
  const methodOpts = METHODS.map((m) => `<option value="${m}"${r?.method === m ? " selected" : ""}>${escHtml(METHOD_LABEL[m])}</option>`).join("")
  // Receipt's booking may not be in the revenue-derived options — inject it so the select round-trips.
  const inOpts = r?.bookingId ? bookings.some((bk) => bk.bookingId === r.bookingId) : true
  const bkOpts = `<option value="">— booking chunein —</option>`
    + bookings.map((bk) => `<option value="${bk.bookingId}"${r?.bookingId === bk.bookingId ? " selected" : ""}>${escHtml(bk.customerName || "Customer")} · #${bk.bookingId}${bk.due && bk.due > 0 ? ` · baqaya Rs ${pkNum(bk.due)}` : ""}</option>`).join("")
    + (r?.bookingId && !inOpts ? `<option value="${r.bookingId}" selected>${escHtml(r.customer?.fullName || r.booking?.customerName || "Customer")} · #${r.bookingId}</option>` : "")
  return `
  <input type="hidden" id="r-id" value="${r ? escHtml(r.id) : ""}"/>
  <div class="dfield row2">
    <div><label class="dlabel">Amount <span class="req">*</span></label><div class="suffix"><span class="rs">Rs</span><input type="number" id="r-amount" min="0" placeholder="0" value="${r ? escHtml(money(r.amount)) : ""}"/></div></div>
    <div><label class="dlabel">Tareeqa <span class="req">*</span></label><select id="r-method">${methodOpts}</select></div>
  </div>
  <div class="dfield"><label class="dlabel">Kis booking ke liye <span class="req">*</span></label><select id="r-booking">${bkOpts}</select></div>
  <div class="dfield row2">
    <div><label class="dlabel">Taareekh <span class="req">*</span></label><input type="date" id="r-date" value="${r?.receivedDate ? escHtml(String(r.receivedDate).slice(0, 10)) : todayIso()}"/></div>
    <div><label class="dlabel">Reference #</label><input type="text" id="r-ref" placeholder="transaction ref" value="${r?.transactionRef ? escHtml(r.transactionRef) : ""}"/></div>
  </div>
  <div class="dfield"><label class="dlabel">Note</label><input type="text" id="r-notes" placeholder="optional" value="${r?.notes ? escHtml(r.notes) : ""}"/></div>
  <div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close>Cancel</button><button class="btn btn-primary" data-r-save>${r ? "Receipt update karein" : "Receipt save karein"}</button></div>`
}

function buildContent(list: PaymentReceipt[], summary: { total: number; byMethod: Partial<Record<ReceiptMethod, number>> }, filter: string): string {
  const total = money(summary.total)
  const now = new Date(); const mo = now.getMonth(); const yr = now.getFullYear()
  const monthTotal = list.filter((r) => { const d = new Date(r.receivedDate); return !isNaN(d.getTime()) && d.getMonth() === mo && d.getFullYear() === yr }).reduce((s, r) => s + money(r.amount), 0)
  const bm = summary.byMethod || {}
  const methodEntries = (Object.entries(bm) as [ReceiptMethod, number][]).filter(([, v]) => money(v) > 0).sort((a, b) => money(b[1]) - money(a[1]))
  const maxM = methodEntries.length ? money(methodEntries[0][1]) : 1
  const cnt = (m: ReceiptMethod) => list.filter((r) => r.method === m).length

  const tiles = `<div class="rc-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.in, 1.9)} Kul aya</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(total)}</div><div class="t-sub">${list.length} receipts</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.cal, 1.9)} Is mahine</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(monthTotal)}</div><div class="t-sub">${now.toLocaleDateString("en-PK", { month: "long" })}</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.receipt, 1.9)} Sab se zyada tareeqa</div><div class="t-val" style="font-size:16px">${methodEntries[0] ? escHtml(METHOD_LABEL[methodEntries[0][0]]) : "—"}</div><div class="t-sub">${methodEntries[0] ? "Rs " + pkNum(money(methodEntries[0][1])) : "koi receipt nahi"}</div></div>
  </div>`

  const breakdown = methodEntries.length ? `<div class="card" style="margin-bottom:14px"><div class="card-h" style="padding:14px 16px 6px"><div><h2 style="font-size:13.5px;font-weight:600">Tareeqe ke hisaab se</h2></div></div><div style="padding:8px 16px 16px"><div class="mbreak">${methodEntries.map(([m, v]) => `<div class="mbrow"><span class="mb-nm"><span class="dot" style="background:${METHOD_COLOR[m]}"></span>${escHtml(METHOD_LABEL[m])}</span><span class="mb-track"><span style="width:${Math.round((money(v) / maxM) * 100)}%;background:${METHOD_COLOR[m]}"></span></span><span class="mb-amt tnum">Rs ${pkNum(money(v))}</span></div>`).join("")}</div></div></div>` : ""

  const tabM = methodEntries.slice(0, 6).map(([m]) => m)
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">
    <button class="tab${filter === "all" ? " on" : ""}" data-f="all">Sab <span class="cnt">${list.length}</span></button>
    ${tabM.map((m) => `<button class="tab${filter === m ? " on" : ""}" data-f="${m}"><span class="dot" style="background:${METHOD_COLOR[m]}"></span> ${escHtml(METHOD_LABEL[m])} <span class="cnt">${cnt(m)}</span></button>`).join("")}
    </div></div>`

  const rows = list.filter((r) => filter === "all" || r.method === filter)
  const body = rows.map((r) => `<tr>
    <td class="td-date">${fmtDate(r.receivedDate)}</td>
    <td class="td-mut">${escHtml(r.customer?.fullName || r.booking?.customerName || "—")}${r.bookingId ? `<div class="cc-ev" data-nav-btn="/dashboard/bookings/${r.bookingId}" style="cursor:pointer">Booking #${r.bookingId}</div>` : ""}</td>
    <td><span class="mchip"><span class="dot" style="background:${METHOD_COLOR[r.method]}"></span> ${escHtml(METHOD_LABEL[r.method])}</span></td>
    <td class="td-mut">${escHtml(r.transactionRef || r.notes || "—")}</td>
    <td class="r td-amt tnum"><span class="rs">Rs</span> ${pkNum(money(r.amount))}</td>
    <td class="r"><div class="rowacts"><button class="ed" data-edit="${r.id}" title="Edit">${svg(IC.edit)}</button><button class="del" data-del="${r.id}" title="Delete">${svg(IC.trash)}</button></div></td>
  </tr>`).join("")

  return `
  <div class="head"><div><h1>Receipts</h1><div class="sub">Paisa jo aaya — <b>Rs ${pkNum(total)}</b> kul. Naya receipt darj karein ya galti hataayein.</div></div>
    <div class="head-actions"><button class="btn btn-primary" data-r-new>${svg(IC.plus, 2.2)} Naya receipt</button></div></div>
  ${tiles}${breakdown}${toolbar}
  <div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Taareekh</th><th>Kis ka</th><th>Tareeqa</th><th>Reference</th><th class="r">Amount</th><th></th></tr></thead>
    <tbody>${body}</tbody></table></div>
    ${rows.length ? `<div class="tbl-foot"><span>${rows.length} receipts</span></div>` : `<div class="empty">Koi receipt nahi. "Naya receipt" se darj karein.</div>`}</div>
  <div class="foot">WeddingWala vendor console · Receipts</div>`
}

export function ReceiptsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/receipts", crumbBold: "Paisa", crumbSub: "Receipts", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const { data, isError } = useQuery({ queryKey: ["receipts-art"], queryFn: () => ReceiptsAPI.list({}) })
  const bkQ = useQuery({ queryKey: ["receipts-bookings"], queryFn: () => PaymentsAPI.getVendorRevenue().catch(() => null) })
  const bookings = React.useMemo(() => ((bkQ.data as { payments?: BkOpt[] } | null)?.payments ?? []) as BkOpt[], [bkQ.data])
  const bookingsRef = React.useRef(bookings); bookingsRef.current = bookings
  const list = React.useMemo(() => (data?.receipts ?? []) as PaymentReceipt[], [data])
  const listRef = React.useRef(list); listRef.current = list
  const summary = data?.summary ?? { total: 0, byMethod: {} }
  const [filter, setFilter] = React.useState(() => loadPref("tab:receipts", "all"))

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Receipts</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Receipts load ho rahe hain…</div>`; return }
    wwc.innerHTML = buildContent(list, summary, filter)
    initTablePager(s, { pageSize: 25 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, filter, bkQ.data, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const refetch = () => { qc.invalidateQueries({ queryKey: ["receipts-art"] }); qc.invalidateQueries({ queryKey: ["khata-art"] }) }
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if ((e.target as HTMLElement).closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["receipts-art"] }); return }
      const tab = t.closest(".tab") as HTMLElement | null
      if (tab?.dataset.f) { savePref("tab:receipts", tab.dataset.f); setFilter(tab.dataset.f); return }
      if (t.closest("[data-r-new]")) { openDrawer(s, "Naya receipt", receiptForm(bookingsRef.current, null)); return }
      const edit = t.closest("[data-edit]") as HTMLElement | null
      if (edit?.dataset.edit) { const r = listRef.current.find((y) => y.id === Number(edit.dataset.edit)); if (r) openDrawer(s, "Receipt edit", receiptForm(bookingsRef.current, r)); return }
      const save = t.closest("[data-r-save]") as HTMLButtonElement | null
      if (save) {
        const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? ""
        const amount = Number(val("r-amount"))
        if (!amount || amount <= 0) { toast.error("Sahi amount likhein"); return }
        if (!val("r-date")) { toast.error("Tareekh chunein"); return }
        const bk = Number(val("r-booking")); if (!bk) { toast.error("Booking chunein — receipt kis ke liye hai"); return }
        const editId = Number(val("r-id"))
        const body: CreateReceiptInput = { method: val("r-method") as ReceiptMethod, amount, receivedDate: val("r-date"), bookingId: bk }
        if (val("r-ref")) body.transactionRef = val("r-ref")
        if (val("r-notes")) body.notes = val("r-notes")
        save.disabled = true; const orig = save.textContent; save.textContent = "Save ho raha…"
        try {
          if (editId) await ReceiptsAPI.update(editId, body)
          else await ReceiptsAPI.create(body)
          toast.success(editId ? "Receipt update ho gaya" : "Receipt darj ho gaya"); closeDrawer(s); refetch()
        }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua — booking # sahi hai?"); save.disabled = false; if (orig) save.textContent = orig }
        return
      }
      const del = t.closest("[data-del]") as HTMLElement | null
      if (del?.dataset.del) {
        const id = Number(del.dataset.del)
        const btn = del as HTMLButtonElement
        openConfirm(s, { title: "Receipt delete karein?", message: "Ye record hat jayega — wapas nahi aayega.", danger: true, onConfirm: async () => {
          btn.disabled = true; btn.innerHTML = "…"
          try { await ReceiptsAPI.remove(id); toast.success("Receipt hata diya"); refetch() }
          catch { toast.error("Delete nahi hua"); btn.disabled = false; btn.innerHTML = svg(IC.trash) }
        } })
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default ReceiptsArtifact
