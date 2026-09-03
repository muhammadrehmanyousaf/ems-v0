"use client"

/**
 * Cheque ledger (PDCs) — premium rebuild on the shared champagne shell.
 * Real post-dated-cheque management via PdcAPI: list + summary, create, the
 * held→deposited→cleared/bounced lifecycle (transition), and delete.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PdcAPI, type PostDatedCheque, type PdcStatus, type CreatePdcInput } from "@/lib/api/postDatedCheques"
import { PaymentsAPI } from "@/lib/api/dashboard"

type BkOpt = { bookingId: number; customerName?: string; due?: number }
import { useArtifactShell, pkNum, escHtml, initTablePager, errorBannerHtml, loadPref, savePref, openDrawer, closeDrawer, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const STATUS_UI: Record<PdcStatus, { label: string; tone: string }> = {
  held: { label: "Rakha hai", tone: "warn" },
  deposited: { label: "Jama", tone: "info" },
  cleared: { label: "Clear", tone: "ok" },
  bounced: { label: "Bounce", tone: "bad" },
  cancelled: { label: "Cancel", tone: "mut" },
}
const su = (s: PdcStatus) => STATUS_UI[s] || STATUS_UI.held
const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) }
const todayIso = () => new Date().toISOString().slice(0, 10)
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  cheque: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h6"/>', check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', bank: '<path d="M3 21h18M4 10h16M5 10 12 4l7 6M6 10v11M18 10v11M10 10v11M14 10v11"/>',
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20l1.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>', phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.1 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
}
const waDigits = (ph?: string | null) => { let d = (ph || "").replace(/\D/g, ""); if (!d) return ""; if (d.startsWith("0")) d = "92" + d.slice(1); else if (d.length === 10) d = "92" + d; return d }
const STATUSES: PdcStatus[] = ["held", "deposited", "cleared", "bounced", "cancelled"]

const EXTRA_CSS = String.raw`
.pdc-tiles{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:14px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:13px 15px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:19px; font-weight:680; letter-spacing:-.02em; margin-top:7px; } .t-val .rs{ font-size:12px; color:var(--ink-3); font-weight:600; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:3px; }
.t-cnt{ display:flex; gap:5px; margin-top:8px; flex-wrap:wrap; } .t-pill{ font-size:10.5px; font-weight:600; padding:1px 7px; border-radius:20px; background:var(--surface-3); color:var(--ink-2); }
.ww-dbody .suffix{ position:relative; } .ww-dbody .suffix input{ padding-left:32px; } .ww-dbody .suffix .rs{ position:absolute; left:11px; top:50%; transform:translateY(-50%); font-size:11.5px; color:var(--ink-3); font-weight:600; pointer-events:none; }
.chq-nm{ font-weight:600; font-size:13px; } .chq-bank{ font-size:11.5px; color:var(--ink-3); margin-top:1px; display:flex; align-items:center; gap:5px; } .chq-bank svg{ width:12px; height:12px; }
.rowacts{ display:flex; gap:6px; justify-content:flex-end; align-items:center; }
.mini{ height:28px; padding:0 10px; border-radius:7px; font-size:11.5px; font-weight:600; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:inline-flex; align-items:center; gap:5px; text-decoration:none; } .mini:hover{ background:var(--surface-3); color:var(--ink); } .mini svg{ width:13px; height:13px; }
a.mini.ok{ color:var(--ok); border-color:color-mix(in srgb,var(--ok) 40%,var(--border-2)); } a.mini.ok:hover{ background:color-mix(in srgb,var(--ok) 10%,var(--surface)); color:var(--ok); }
.mini.ok:hover{ color:var(--ok); border-color:var(--ok); } .mini.bad:hover{ color:var(--bad); border-color:var(--bad); } .mini.pri{ background:var(--accent); color:var(--on-accent); border-color:transparent; } .mini.pri:hover{ filter:brightness(1.05); }
.del{ width:28px; height:28px; border-radius:7px; border:0; background:transparent; color:var(--ink-3); display:grid; place-items:center; } .del:hover{ background:var(--bad-wash); color:var(--bad); } .del svg{ width:14px; height:14px; }
.bounce-row td{ background:var(--bad-wash); } .bounce-in{ display:flex; gap:8px; align-items:center; padding:4px 0; } .bounce-in input{ flex:1; border:1px solid var(--border-2); border-radius:8px; padding:7px 10px; font:inherit; font-size:12.5px; outline:none; background:var(--surface); }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:900px){ .pdc-tiles{ grid-template-columns:repeat(2,1fr); } }
`

/** Drawer body for a new cheque — same field ids the save handler reads. */
function pdcForm(bookings: BkOpt[]): string {
  return `
  <div class="dfield row2">
    <div><label class="dlabel">Cheque number <span class="req">*</span></label><input type="text" id="c-num" placeholder="0001234"/></div>
    <div><label class="dlabel">Bank <span class="req">*</span></label><input type="text" id="c-bank" placeholder="HBL / Meezan…"/></div>
  </div>
  <div class="dfield row2">
    <div><label class="dlabel">Amount <span class="req">*</span></label><div class="suffix"><span class="rs">Rs</span><input type="number" id="c-amount" min="0" placeholder="0"/></div></div>
    <div><label class="dlabel">Cheque ki tareekh <span class="req">*</span></label><input type="date" id="c-date" value="${todayIso()}"/></div>
  </div>
  <div class="dfield"><label class="dlabel">Kis booking ka cheque <span class="req">*</span></label><select id="c-booking"><option value="">— booking chunein —</option>${bookings.map((bk) => `<option value="${bk.bookingId}">${escHtml(bk.customerName || "Customer")} · #${bk.bookingId}${bk.due && bk.due > 0 ? ` · baqaya Rs ${pkNum(bk.due)}` : ""}</option>`).join("")}</select></div>
  <div class="dfield"><label class="dlabel">Note</label><input type="text" id="c-notes" placeholder="optional"/></div>
  <div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close>Cancel</button><button class="btn btn-primary" data-c-save>Cheque add karein</button></div>`
}

function buildContent(list: PostDatedCheque[], summary: { total: number; byStatus: Partial<Record<PdcStatus, number>> }, filter: string): string {
  const total = money(summary.total)
  const cnt = (st: PdcStatus) => list.filter((c) => c.status === st).length
  const sumByStatusValue = (st: PdcStatus) => list.filter((c) => c.status === st).reduce((s, c) => s + money(c.amount), 0)
  const heldVal = sumByStatusValue("held"), depVal = sumByStatusValue("deposited"), clrVal = sumByStatusValue("cleared"), bncVal = sumByStatusValue("bounced")

  const tiles = `<div class="pdc-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.cheque, 1.8)} Kul cheques</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(total)}</div><div class="t-cnt">${STATUSES.filter((s) => cnt(s) > 0).map((s) => `<span class="t-pill">${escHtml(su(s).label)} ${cnt(s)}</span>`).join("") || `<span class="t-sub">koi cheque nahi</span>`}</div></div>
    <div class="tile"><div class="t-cap">Rakhe hue</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(heldVal)}</div><div class="t-sub">${cnt("held")} cheques · jama karne hain</div></div>
    <div class="tile"><div class="t-cap">Jama / clearance mein</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(depVal)}</div><div class="t-sub">${cnt("deposited")} cheques</div></div>
    <div class="tile"><div class="t-cap">Clear ho chuke</div><div class="t-val tnum" style="color:var(--ok)"><span class="rs">Rs</span> ${pkNum(clrVal)}</div><div class="t-sub">${cnt("bounced") ? `${cnt("bounced")} bounce (Rs ${pkNum(bncVal)})` : "koi bounce nahi"}</div></div>
  </div>`

  const tab = (f: string, label: string) => `<button class="tab${f === filter ? " on" : ""}" data-f="${f}">${label} <span class="cnt">${f === "all" ? list.length : cnt(f as PdcStatus)}</span></button>`
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">${tab("all", "Sab")}${STATUSES.map((s) => tab(s, su(s).label)).join("")}</div></div>`

  const rows = list.filter((c) => filter === "all" || c.status === filter)
  const body = rows.map((c) => {
    const s = su(c.status)
    const who = c.customer?.fullName || c.booking?.customerName || "—"
    let acts = ""
    if (c.status === "held") acts += `<button class="mini pri" data-dep="${c.id}">${svg(IC.check)} Jama karein</button>`
    else if (c.status === "deposited") acts += `<button class="mini ok" data-clr="${c.id}">${svg(IC.check)} Clear</button><button class="mini bad" data-bnc="${c.id}">Bounce</button>`
    else if (c.status === "bounced") {
      const ph = waDigits(c.customer?.phoneNumber)
      if (ph) {
        const waText = encodeURIComponent(`Assalam o alaikum${who !== "—" ? " " + who : ""}, aap ka cheque #${c.chequeNumber} (Rs ${pkNum(money(c.amount))}) bounce ho gaya hai. Meharbani farma kar dobara payment ka intezam karein. Shukriya.`)
        acts += `<a class="mini ok" href="https://wa.me/${ph}?text=${waText}" target="_blank" rel="noopener" data-stop title="Baqaya chase karein">${svg(IC.wa, 1.8)} WhatsApp</a><a class="mini" href="tel:${escHtml(c.customer?.phoneNumber || "")}" data-stop title="Call">${svg(IC.phone, 1.8)}</a>`
      }
    }
    acts += `<button class="del" data-del="${c.id}" title="Delete">${svg(IC.trash)}</button>`
    return `<tr>
      <td><div class="chq-nm">#${escHtml(c.chequeNumber)}</div><div class="chq-bank">${svg(IC.bank, 1.7)} ${escHtml(c.bankName)}${c.branchCode ? ` · ${escHtml(c.branchCode)}` : ""}</div></td>
      <td class="td-mut">${escHtml(who)}${c.bookingId ? `<div class="cc-ev" data-nav-btn="/dashboard/bookings/${c.bookingId}" style="cursor:pointer;color:var(--accent-ink)">Booking #${c.bookingId}</div>` : ""}${c.notes ? `<div class="cc-ev">${escHtml(c.notes)}</div>` : ""}</td>
      <td class="td-date">${fmtDate(c.chequeDate)}${c.depositDate ? `<div class="cc-ev">Jama: ${fmtDate(c.depositDate)}</div>` : ""}</td>
      <td><span class="st ${s.tone}"><i></i> ${escHtml(s.label)}</span>${c.bounceReason ? `<div class="cc-ev" style="color:var(--bad)">${escHtml(c.bounceReason)}</div>` : ""}</td>
      <td class="r td-amt tnum"><span class="rs">Rs</span> ${pkNum(money(c.amount))}</td>
      <td><div class="rowacts">${acts}</div></td>
    </tr>
    <tr class="bounce-row" id="bounce-${c.id}" hidden><td colspan="6"><div class="bounce-in"><input type="text" id="breason-${c.id}" placeholder="Bounce ki wajah (jaise: insufficient funds)"/><button class="mini bad" data-bncgo="${c.id}">Confirm bounce</button><button class="mini" data-bnccancel="${c.id}">Cancel</button></div></td></tr>`
  }).join("")

  return `
  <div class="head"><div><h1>Cheque ledger</h1><div class="sub">Post-dated cheques — <b>Rs ${pkNum(total)}</b> kul. Jama, clear, bounce sab track karein.</div></div>
    <div class="head-actions"><button class="btn btn-primary" data-c-new>${svg(IC.plus, 2.2)} Naya cheque</button></div></div>
  ${tiles}${toolbar}
  <div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Cheque</th><th>Kis ka</th><th>Taareekh</th><th>Status</th><th class="r">Amount</th><th></th></tr></thead>
    <tbody>${body}</tbody></table></div>
    ${rows.length ? `<div class="tbl-foot"><span>${rows.length} cheques</span></div>` : `<div class="empty">Is category mein koi cheque nahi.</div>`}</div>
  <div class="foot">WeddingWala vendor console · Cheque ledger</div>`
}

export function PdcsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/pdcs", crumbBold: "Paisa", crumbSub: "Cheque ledger", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const { data, isError } = useQuery({ queryKey: ["pdcs-art"], queryFn: () => PdcAPI.list({}) })
  const bkQ = useQuery({ queryKey: ["pdcs-bookings"], queryFn: () => PaymentsAPI.getVendorRevenue().catch(() => null) })
  const bookings = React.useMemo(() => ((bkQ.data as { payments?: BkOpt[] } | null)?.payments ?? []) as BkOpt[], [bkQ.data])
  const bookingsRef = React.useRef(bookings); bookingsRef.current = bookings
  const list = React.useMemo(() => (data?.pdcs ?? []) as PostDatedCheque[], [data])
  const summary = data?.summary ?? { total: 0, byStatus: {} }
  const [filter, setFilter] = React.useState(() => loadPref("tab:pdcs", "all"))

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Cheque ledger</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Cheque ledger load ho raha hai…</div>`; return }
    wwc.innerHTML = buildContent(list, summary, filter)
    initTablePager(s, { pageSize: 25 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, filter, bkQ.data, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const refetch = () => qc.invalidateQueries({ queryKey: ["pdcs-art"] })
    const transition = async (id: number, to: PdcStatus, btn: HTMLButtonElement | null, extra?: { depositDate?: string; bounceReason?: string }) => {
      const orig = btn ? btn.innerHTML : ""
      if (btn) { btn.disabled = true; btn.innerHTML = "…" }
      try { await PdcAPI.transition(id, { to, ...extra }); toast.success("Cheque update ho gaya"); refetch() }
      catch { toast.error("Update nahi hua"); if (btn) { btn.disabled = false; btn.innerHTML = orig } }
    }
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if ((e.target as HTMLElement).closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["pdcs-art"] }); return }
      const tab = t.closest(".tab") as HTMLElement | null
      if (tab?.dataset.f) { savePref("tab:pdcs", tab.dataset.f); setFilter(tab.dataset.f); return }
      if (t.closest("[data-c-new]")) { openDrawer(s, "Naya cheque", pdcForm(bookingsRef.current)); return }
      const save = t.closest("[data-c-save]") as HTMLButtonElement | null
      if (save) {
        const val = (id: string) => (s.getElementById(id) as HTMLInputElement | null)?.value?.trim() ?? ""
        if (!val("c-num") || !val("c-bank")) { toast.error("Cheque number aur bank likhein"); return }
        const amount = Number(val("c-amount")); if (!amount || amount <= 0) { toast.error("Sahi amount likhein"); return }
        if (!val("c-date")) { toast.error("Cheque ki tareekh chunein"); return }
        const bk = Number(val("c-booking")); if (!bk) { toast.error("Booking chunein — cheque kis ka hai"); return }
        const body: CreatePdcInput = { chequeNumber: val("c-num"), bankName: val("c-bank"), amount, chequeDate: val("c-date"), bookingId: bk }
        if (val("c-notes")) body.notes = val("c-notes")
        save.disabled = true; const orig = save.textContent; save.textContent = "Add ho raha…"
        try { await PdcAPI.create(body); toast.success("Cheque add ho gaya"); closeDrawer(s); refetch() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Add nahi hua — booking # sahi hai?"); save.disabled = false; if (orig) save.textContent = orig }
        return
      }
      const dep = t.closest("[data-dep]") as HTMLElement | null
      if (dep?.dataset.dep) { transition(Number(dep.dataset.dep), "deposited", dep as HTMLButtonElement, { depositDate: todayIso() }); return }
      const clr = t.closest("[data-clr]") as HTMLElement | null
      if (clr?.dataset.clr) { transition(Number(clr.dataset.clr), "cleared", clr as HTMLButtonElement); return }
      const bnc = t.closest("[data-bnc]") as HTMLElement | null
      if (bnc?.dataset.bnc) { const row = s.getElementById(`bounce-${bnc.dataset.bnc}`); if (row) (row as HTMLElement).hidden = false; return }
      const bnccancel = t.closest("[data-bnccancel]") as HTMLElement | null
      if (bnccancel?.dataset.bnccancel) { const row = s.getElementById(`bounce-${bnccancel.dataset.bnccancel}`); if (row) (row as HTMLElement).hidden = true; return }
      const bncgo = t.closest("[data-bncgo]") as HTMLElement | null
      if (bncgo?.dataset.bncgo) { const id = Number(bncgo.dataset.bncgo); const reason = (s.getElementById(`breason-${id}`) as HTMLInputElement | null)?.value?.trim() || "Cheque bounce"; transition(id, "bounced", bncgo as HTMLButtonElement, { bounceReason: reason }); return }
      const del = t.closest("[data-del]") as HTMLElement | null
      if (del?.dataset.del) {
        const id = Number(del.dataset.del)
        const btn = del as HTMLButtonElement
        openConfirm(s, { title: "Cheque delete karein?", message: "Ye record hat jayega — wapas nahi aayega.", danger: true, onConfirm: async () => {
          btn.disabled = true; btn.innerHTML = "…"
          try { await PdcAPI.remove(id); toast.success("Cheque hata diya"); refetch() }
          catch { toast.error("Delete nahi hua"); btn.disabled = false; btn.innerHTML = svg(IC.trash) }
        } })
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default PdcsArtifact
