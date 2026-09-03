"use client"

/**
 * Khata — 4 summary tiles + Sab/Aya/Baqaya/Wapsi/Settled filter tabs + a
 * FULL-WIDTH ledger (transactions table). Wired to REAL data — recorded receipts
 * (money in) and the A/R receivables (baqaya) — through the shared artifact shell.
 *
 * The old right rail (Is-mahine breakdown · Baqaya top · Wapsi queue) was removed
 * at the founder's direction so the listing gets full width; the same figures
 * live in the summary tiles and on the Payments / Wapsi / Receivables screens.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AnalyticsAPI, type ReceivablesData } from "@/lib/api/analytics"
import { ReceiptsAPI, type PaymentReceipt } from "@/lib/api/paymentReceipts"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useArtifactShell, pkNum, escHtml, initialsOf, initTablePager, setPagerFilter, errorBannerHtml, restoreTab, savePref } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import { openRecordPaymentDrawer } from "@/components/dashboard/mainScreens/artifact/record-payment"

const num = (v: unknown) => (v == null ? 0 : Number(v) || 0)
const METHOD: Record<string, string> = { cash: "Cash", bank_transfer: "Bank", jazzcash: "JazzCash", easypaisa: "EasyPaisa", raast: "Raast", ibft: "Bank", cheque: "Cheque", card: "Card", other: "Other" }
const methodLabel = (m?: string) => METHOD[m || ""] || "Payment"
function shortDate(s?: string) {
  if (!s) return "—"
  const d = new Date(s); if (isNaN(d.getTime())) return String(s)
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" })
}
const timeOf = (s?: string) => { if (!s) return ""; const d = new Date(s); return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }) }
const isThisMonth = (s?: string) => { if (!s) return false; const d = new Date(s); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear() }

const EXTRA_CSS = String.raw`
.sumrow{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
.sumtile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); padding:15px 16px 16px; position:relative; overflow:hidden; }
.sumtile::before{ content:""; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--tile,transparent); }
.sumtile.in{ --tile:var(--ok); } .sumtile.due{ --tile:var(--warn); } .sumtile.out{ --tile:var(--bad); } .sumtile.mon{ --tile:var(--accent); }
.sumtile .l{ font-size:12px; color:var(--ink-3); font-weight:600; display:flex; align-items:center; gap:7px; } .sumtile .l i{ width:8px; height:8px; border-radius:3px; background:var(--tile); flex:none; }
.sumtile .v{ font-size:23px; font-weight:680; letter-spacing:-.02em; margin-top:10px; } .sumtile .v .rs{ font-size:12.5px; color:var(--ink-3); font-weight:600; letter-spacing:0; }
.sumtile .d{ font-size:11.5px; margin-top:6px; color:var(--ink-3); } .sumtile .d b{ color:var(--ink-2); font-weight:600; }
.pp{ display:inline-flex; align-items:center; font-size:11px; font-weight:600; padding:2px 9px; border-radius:6px; background:var(--surface-3); border:1px solid var(--border); color:var(--ink-2); white-space:nowrap; }
.pp.settle{ color:var(--accent-ink); background:var(--accent-wash); border-color:transparent; } .pp.wapsi{ color:var(--bad); background:var(--bad-wash); border-color:transparent; } .pp.due{ color:var(--warn); background:var(--warn-wash); border-color:transparent; }
.mth{ display:inline-flex; align-items:center; gap:6px; color:var(--ink-2); font-size:12px; font-weight:500; }
.amt{ font-weight:660; letter-spacing:-.01em; font-variant-numeric:tabular-nums; white-space:nowrap; } .amt .rs{ font-size:11px; color:var(--ink-3); font-weight:600; }
.amt.in{ color:var(--ok); } .amt.out{ color:var(--bad); } .amt.due{ color:var(--warn); } .amt .sub{ display:block; font-size:10.5px; font-weight:500; color:var(--ink-3); margin-top:1px; }
.rec-btn{ display:inline-flex; align-items:center; gap:5px; height:28px; padding:0 10px; border-radius:7px; border:1px solid var(--accent-line); background:var(--accent-wash); color:var(--accent-ink); font-size:11.5px; font-weight:600; } .rec-btn svg{ width:13px; height:13px; }
.ledlayout{ display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:14px; align-items:start; }
.rail{ display:flex; flex-direction:column; gap:14px; }
.rcard{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); padding:16px; }
.rcard h3{ font-size:11px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; color:var(--ink-3); margin-bottom:0; display:flex; align-items:center; justify-content:space-between; }
.mon-big{ font-size:26px; font-weight:680; letter-spacing:-.02em; margin:12px 0 2px; } .mon-big .rs{ font-size:13px; color:var(--ink-3); font-weight:600; }
.mon-cap{ font-size:11.5px; color:var(--ink-3); } .mon-cap .up{ color:var(--ok); font-weight:600; }
.mbar{ display:flex; height:8px; border-radius:5px; overflow:hidden; margin:14px 0 12px; background:var(--surface-3); } .mbar span{ display:block; height:100%; }
.dl-row{ display:flex; align-items:center; gap:9px; padding:8px 0; border-top:1px solid var(--border); font-size:12.5px; } .dl-row:first-child{ border-top:0; } .dl-row .k{ display:flex; align-items:center; gap:8px; color:var(--ink-2); } .dl-row .k i{ width:8px; height:8px; border-radius:3px; flex:none; } .dl-row .val{ margin-left:auto; font-weight:660; font-variant-numeric:tabular-nums; }
.dl-row.net{ border-top:1.5px solid var(--border-2); margin-top:2px; } .dl-row.net .k{ color:var(--ink); font-weight:600; } .dl-row.net .val{ color:var(--accent-ink); }
.qitem{ display:flex; align-items:center; gap:11px; padding:11px 0; border-top:1px solid var(--border); } .qitem:first-child{ border-top:0; } .qitem .ava{ width:32px; height:32px; }
.q-main{ flex:1; min-width:0; } .q-nm{ font-weight:600; font-size:12.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .q-sub{ font-size:11px; color:var(--ink-3); margin-top:1px; display:flex; align-items:center; gap:6px; }
.q-amt .a{ font-weight:660; font-size:12.5px; font-variant-numeric:tabular-nums; } .q-amt.due .a{ color:var(--warn); } .q-amt.out .a{ color:var(--bad); }
.q-act{ margin-top:11px; } .q-btn{ width:100%; height:34px; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink); font-size:12.5px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:7px; } .q-btn svg{ width:14px; height:14px; }
.urg{ font-size:10px; font-weight:700; padding:1px 6px; border-radius:5px; white-space:nowrap; } .urg.hi{ color:var(--bad); background:var(--bad-wash); } .urg.mid{ color:var(--warn); background:var(--warn-wash); }
.q-empty{ font-size:12px; color:var(--ink-3); padding:14px 0 4px; }
@media (max-width:1160px){ .ledlayout{ grid-template-columns:minmax(0,1fr); } }
@media (max-width:820px){ .sumrow{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:520px){ .sumrow{ grid-template-columns:1fr; } }
`

interface Row { date: string; sub: string; who: string; ini: string; ref: string; ppLabel: string; ppCls: string; mth: string; amtCls: string; amtVal: string; amtSub: string; stCls: string; stLabel: string; status: string; action: string; nav: string }

function classify(r: PaymentReceipt): "aya" | "wapsi" | "settled" {
  const amt = num(r.amount), notes = (r.notes || "").toLowerCase()
  if (amt < 0 || /refund|wapsi/.test(notes)) return "wapsi"
  if (/settle/.test(notes)) return "settled"
  return "aya"
}
const rdate = (r: PaymentReceipt) => r.receivedDate || r.createdAt

function buildContent(receipts: PaymentReceipt[], rec: ReceivablesData | null | undefined, kulAya: number): string {
  // Ledger rows from real receipts. Refunds are logged as negative amounts (or
  // notes marked "refund") → Wapsi; "settle" notes → Settled; everything else
  // is money in → Aya. Then top A/R outstanding as Baqaya-due rows.
  const sorted = [...receipts].sort((a, b) => String(rdate(b)).localeCompare(String(rdate(a))))
  const txRows: Row[] = sorted.map((r) => {
    const status = classify(r)
    const amt = num(r.amount), out = amt < 0
    const who = r.booking?.customerName || "Customer"
    const st = status === "wapsi" ? { cls: "bad", label: "Wapsi" } : status === "settled" ? { cls: "mut", label: "Settled" } : { cls: "ok", label: "Aya" }
    const pp = status === "wapsi" ? "wapsi" : status === "settled" ? "settle" : ""
    const amtCls = out || status === "wapsi" ? "out" : "in"
    const sign = out || status === "wapsi" ? "− " : "+ "
    return { date: shortDate(rdate(r)), sub: timeOf(rdate(r)), who, ini: initialsOf(who), ref: r.bookingId ? `#${r.bookingId}` : "", ppLabel: r.notes ? escHtml(String(r.notes).slice(0, 24)) : st.label, ppCls: pp, mth: methodLabel(r.method), amtCls, amtVal: `${sign}<span class="rs">Rs</span> ${pkNum(Math.abs(amt))}`, amtSub: "", stCls: st.cls, stLabel: st.label, status, action: "", nav: r.bookingId ? `/dashboard/bookings/${r.bookingId}` : "" }
  })
  const dueRows: Row[] = (rec?.customers ?? []).filter((c) => num(c.totalOutstanding) > 0).slice(0, 6).map((c) => {
    // The Record button is scoped to ONE booking, so its prefill must be THAT
    // booking's own baqaya — not the customer's total across all bookings, which
    // would overpay the first booking and leave the others uncollected.
    const firstBk = c.bookings?.find((b) => num(b.totalOutstanding) > 0) || c.bookings?.[0]
    const bId = firstBk?.bookingId
    const bkDue = num(firstBk?.totalOutstanding) || num(c.totalOutstanding)
    return { date: `${num(c.oldestDaysOverdue)} din`, sub: "overdue", who: c.customerName || "Customer", ini: initialsOf(c.customerName), ref: `${c.bookingCount} booking${c.bookingCount === 1 ? "" : "s"}`, ppLabel: "Baqaya", ppCls: "due", mth: "—", amtCls: "due", amtVal: `<span class="rs">Rs</span> ${pkNum(num(c.totalOutstanding))}`, amtSub: `<span class="sub">vasool karna</span>`, stCls: "warn", stLabel: "Baqaya due", status: "due", action: bId ? `<button class="rec-btn" data-rec="${bId}" data-rec-name="${escHtml(c.customerName || "")}" data-rec-due="${Math.round(bkDue)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg> Record</button>` : "", nav: bId ? `/dashboard/bookings/${bId}` : "" }
  })
  const rows = [...txRows, ...dueRows]
  const counts = { all: rows.length, aya: txRows.filter((r) => r.status === "aya").length, due: dueRows.length, wapsi: txRows.filter((r) => r.status === "wapsi").length, settled: txRows.filter((r) => r.status === "settled").length }
  const wapsiRx = sorted.filter((r) => classify(r) === "wapsi")
  const wapsiTotal = wapsiRx.reduce((s, r) => s + Math.abs(num(r.amount)), 0)

  const rowHtml = (r: Row) => `<tr data-status="${r.status}"${r.nav ? ` data-nav-btn="${r.nav}"` : ""}>
    <td class="td-date">${escHtml(r.date)}${r.sub ? `<div class="sub">${escHtml(r.sub)}</div>` : ""}</td>
    <td><div class="c-couple"><span class="ava">${escHtml(r.ini)}</span><div><div class="cc-nm">${escHtml(r.who)}</div><div class="cc-ev">${escHtml(r.ref)}</div></div></div></td>
    <td><span class="pp ${r.ppCls}">${r.ppLabel}</span></td>
    <td><span class="mth">${escHtml(r.mth)}</span></td>
    <td class="r"><span class="amt ${r.amtCls}">${r.amtVal}${r.amtSub}</span></td>
    <td><span class="st ${r.stCls}"><i></i> ${r.stLabel}</span></td>
    <td>${r.action}</td>
  </tr>`

  const tab = (f: string, label: string, dot: string, cnt: number, on = false) => `<button class="tab${on ? " on" : ""}" data-f="${f}">${dot ? `<span class="dot ${dot}"></span> ` : ""}${label} <span class="cnt">${cnt}</span></button>`
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs" role="tablist">
    <button class="tab on" data-f="all">Sab <span class="cnt">${counts.all}</span></button>
    ${tab("aya", "Aya", "d-ok", counts.aya)}${tab("due", "Baqaya", "d-warn", counts.due)}${tab("wapsi", "Wapsi", "d-bad", counts.wapsi)}${tab("settled", "Settled", "d-mut", counts.settled)}
    </div><div class="filters"><label class="f-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><input placeholder="Customer ya booking #…" aria-label="Filter"/></label></div></div>`

  // Is-mahine total (shown in the summary tile below). The detailed right-rail
  // widgets (by-method breakdown, top baqaya, wapsi list) were removed so the
  // ledger table gets full width — the same numbers live in the tiles and on
  // the Payments / Wapsi / Receivables screens.
  const monthReceipts = receipts.filter((r) => isThisMonth(rdate(r)))
  // Net money IN this month: a refund (classified "wapsi", whether stored as a
  // negative amount OR a positive amount with a refund/wapsi note) must SUBTRACT,
  // not add — otherwise the tile contradicts its own "− Rs" ledger row + Wapsi tile.
  const monthTotal = monthReceipts.reduce((s, r) => s + (classify(r) === "wapsi" ? -Math.abs(num(r.amount)) : num(r.amount)), 0)

  const table = `<div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Taareekh</th><th>Kis ka</th><th>Kis liye</th><th>Tareeqa</th><th class="r">Raqam</th><th>Status</th><th></th></tr></thead>
    <tbody id="tbody">${rows.map(rowHtml).join("")}</tbody></table></div>
    ${rows.length ? `<div class="tbl-foot"><span id="rowcount">${rows.length} entries</span></div>` : `<div class="empty">Abhi koi entry nahi.</div>`}</div>`

  const tiles = `<div class="sumrow">
    <div class="sumtile in"><div class="l"><i></i> Kul aya (is saal)</div><div class="v tnum"><span class="rs">Rs</span> ${pkNum(kulAya)}</div><div class="d">received</div></div>
    <div class="sumtile due"><div class="l"><i></i> Baqaya</div><div class="v tnum"><span class="rs">Rs</span> ${pkNum(num(rec?.totals?.grandOutstanding))}</div><div class="d"><b>${num(rec?.totals?.customerCount)}</b> customers par</div></div>
    <div class="sumtile out"><div class="l"><i></i> Wapsi (di gayi)</div><div class="v tnum"><span class="rs">Rs</span> ${pkNum(wapsiTotal)}</div><div class="d">${wapsiRx.length} refund${wapsiRx.length === 1 ? "" : "s"}</div></div>
    <div class="sumtile mon"><div class="l"><i></i> Is mahine</div><div class="v tnum"><span class="rs">Rs</span> ${pkNum(monthTotal)}</div><div class="d">${monthReceipts.length} payments</div></div>
  </div>`

  return `${tiles}${toolbar}${table}`
}

export function KhataArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/money", crumbBold: "Khata", crumbSub: "Paisa ka hisaab", extraCss: EXTRA_CSS })
  const activeBusinessId = useActiveBusinessId()
  // Money-QA C20: the Wapsi / "Is mahine" tiles + ledger are per-venue, so the
  // receipts must be scoped to the active business too (the other two queries
  // already are) — otherwise a multi-venue vendor sees every venue's receipts
  // mixed in, contradicting the per-venue Baqaya / Kul-aya tiles.
  const receiptsQ = useQuery({ queryKey: ["khata-receipts", activeBusinessId], queryFn: () => ReceiptsAPI.list(activeBusinessId ? { businessId: activeBusinessId } : {}) })
  const recQ = useQuery({ queryKey: ["khata-receivables", activeBusinessId], queryFn: () => AnalyticsAPI.getReceivables(activeBusinessId) })
  const kpiQ = useQuery({ queryKey: ["khata-kpis", activeBusinessId], queryFn: () => AnalyticsAPI.getDashboardKpis("this_year", undefined, undefined, activeBusinessId) })
  const qc = useQueryClient()

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const head = `<div class="head"><div><h1>Khata</h1><div class="sub">Har booking ka paisa — kya aya, kya baqaya, kya wapsi.</div></div><div class="head-actions"><button class="btn btn-ghost" data-act="export-table"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg> Export</button><button class="btn btn-primary" data-nav-btn="/dashboard/receipts"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg> Payment record</button></div></div>`
    const wwc = s.getElementById("wwc"); if (!wwc) return
    const anyError = receiptsQ.isError || recQ.isError || kpiQ.isError
    // Show a load state until the queries resolve — otherwise the tiles render
    // zero values + an empty ledger during the fetch, reading as "no money".
    if (!anyError && (receiptsQ.isLoading || recQ.isLoading || kpiQ.isLoading)) {
      wwc.innerHTML = head + `<div class="loadwrap">Khata load ho raha hai…</div>`
      return
    }
    const receipts = receiptsQ.data?.receipts ?? []
    const kulAya = num(kpiQ.data?.totalRevenue?.value)
    const banner = anyError ? errorBannerHtml() : ""
    wwc.innerHTML = head + banner + buildContent(receipts, recQ.data, kulAya)
    // Shared paginator owns row visibility — tabs + search + paging stay in sync.
    initTablePager(s, { pageSize: 25 })
    restoreTab(s, "tab:khata", (f) => setPagerFilter(s, (tr) => f === "all" || tr.dataset.status === f))
    if (!bound.current) {
      bound.current = true
      s.addEventListener("click", (e) => {
        const t = e.target as HTMLElement
        if (t.closest("[data-retry]")) { ["khata-receipts", "khata-receivables", "khata-kpis"].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); return }
        // Inline record-payment on a Baqaya-due row — no round-trip to Receipts.
        const rec = t.closest("[data-rec]") as HTMLElement | null
        if (rec?.dataset.rec) {
          openRecordPaymentDrawer(s, {
            bookingId: Number(rec.dataset.rec), customerName: rec.dataset.recName || undefined,
            due: Number(rec.dataset.recDue) || 0,
            onSaved: () => qc.invalidateQueries({ queryKey: ["khata-receipts"] }).then(() => qc.invalidateQueries({ queryKey: ["khata-receivables"] })),
          })
          return
        }
        const btn = t.closest(".tab") as HTMLElement | null
        if (!btn) return
        const tabsEl = s.getElementById("tabs"); if (!tabsEl) return
        tabsEl.querySelectorAll(".tab").forEach((x) => x.classList.remove("on"))
        btn.classList.add("on")
        const f = btn.dataset.f || "all"
        savePref("tab:khata", f)
        setPagerFilter(s, (tr) => f === "all" || tr.dataset.status === f)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, receiptsQ.data, recQ.data, kpiQ.data, receiptsQ.isError, recQ.isError, kpiQ.isError, receiptsQ.isLoading, recQ.isLoading, kpiQ.isLoading])

  return <div ref={hostRef} />
}

export default KhataArtifact
