"use client"

/**
 * Brokers — premium rebuild on the shared champagne shell.
 * Real referral-partner book via BrokerAPI.list + create / update / remove.
 * Type filter, default commission, WhatsApp/Call, inline add/edit. Commission
 * ledgers stay in the dedicated commission flow.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { BrokerAPI, type Broker, type BrokerType, type CreateBrokerInput, type BrokerCommission, type OutstandingBrokerRow, type CommissionPaymentMethod } from "@/lib/api/brokers"
import { useBusiness } from "@/context/BusinessContext"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { waDigits } from "@/components/dashboard/mainScreens/leads/artifact/leads-artifact"
import { useArtifactShell, pkNum, escHtml, initialsOf, initTablePager, errorBannerHtml, loadPref, savePref, openDrawer, closeDrawer, openConfirm, venuePickerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const TYPE_LABEL: Record<string, string> = {
  rishta: "Rishta wala", hall_broker: "Hall broker", wedding_planner: "Wedding planner", hotel_concierge: "Hotel concierge", decor_referral: "Decor referral", photographer_referral: "Photographer referral",
  caterer_referral: "Caterer referral", transport_referral: "Transport referral", social_influencer: "Social influencer", other: "Aur",
}
const TYPES = Object.keys(TYPE_LABEL) as BrokerType[]
const TYPE_COLOR: Record<string, string> = { rishta: "var(--accent)", hall_broker: "var(--info)", wedding_planner: "#B5657A", hotel_concierge: "#3f9fa6", decor_referral: "var(--warn)", photographer_referral: "#6a8caf", caterer_referral: "var(--ok)", transport_referral: "#8a6d3b", social_influencer: "#b0568c", other: "var(--ink-4)" }
const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20l1.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>', call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  handshake: '<path d="M11 17l2 2a2 2 0 0 0 3 0 2 2 0 0 0 3 0 2 2 0 0 0 .8-3.3L14 9l-3 3M8 8l-4 4 3 3M2 12l3-3 5 5"/>',
  wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>', ledger: '<path d="M4 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
}
const PAY_METHODS: { v: CommissionPaymentMethod; l: string }[] = [
  { v: "cash", l: "Cash" }, { v: "jazzcash", l: "JazzCash" }, { v: "easypaisa", l: "Easypaisa" }, { v: "raast", l: "Raast" }, { v: "ibft", l: "IBFT" }, { v: "bank_transfer", l: "Bank transfer" }, { v: "cheque", l: "Cheque" }, { v: "other", l: "Aur" },
]
const COMM_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Baqaya", tone: "warn" }, partially_paid: { label: "Kuch ada", tone: "info" }, paid: { label: "Ada ho gaya", tone: "ok" }, disputed: { label: "Ikhtelaf", tone: "bad" }, void: { label: "Void", tone: "mut" }, overdue: { label: "Overdue", tone: "bad" },
}
function fmtD(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) }

const EXTRA_CSS = String.raw`
.brk-tiles{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:10px; }
.tile.warn .t-val{ color:var(--warn); }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:10px 13px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:17px; font-weight:680; letter-spacing:-.02em; margin-top:4px; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.typechip{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:2px 8px; border-radius:6px; background:var(--surface-2); border:1px solid var(--border); } .typechip .dot{ width:7px; height:7px; border-radius:50%; }
.comm{ font-weight:660; font-variant-numeric:tabular-nums; } .comm .u{ font-size:11px; color:var(--ink-3); font-weight:500; }
.rowacts{ display:flex; gap:5px; justify-content:flex-end; align-items:center; }
.iconbtn{ width:30px; height:30px; flex:none; border-radius:7px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; } .iconbtn:hover{ background:var(--surface-3); color:var(--ink); } .iconbtn.wa:hover{ color:var(--ok); border-color:var(--ok); } .iconbtn.bad:hover{ color:var(--bad); border-color:var(--bad); } .iconbtn svg{ width:14px; height:14px; } .iconbtn:disabled{ opacity:.4; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
.baqaya-chip{ display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:var(--warn); margin-top:3px; }
.ledbtn{ height:30px; padding:0 10px; border-radius:7px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); font-size:11.5px; font-weight:600; display:inline-flex; align-items:center; gap:5px; } .ledbtn:hover{ background:var(--surface-3); color:var(--ink); } .ledbtn svg{ width:13px; height:13px; } .ledbtn.due{ color:var(--accent-ink); border-color:var(--accent-line); background:var(--accent-wash); }
.cl-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding-bottom:12px; margin-bottom:12px; border-bottom:1px solid var(--border); } .cl-name{ font-weight:660; font-size:14px; } .cl-agency{ font-size:12px; color:var(--ink-3); margin-top:2px; }
.cl-tot{ font-size:11px; color:var(--ink-3); text-align:right; } .cl-tot b{ display:block; font-size:15px; color:var(--warn); font-weight:680; } .cl-tot.ok{ color:var(--ok); font-weight:600; }
.cl-row{ padding:11px 0; border-bottom:1px solid var(--border); } .cl-row:last-child{ border-bottom:0; } .cl-row{ display:grid; grid-template-columns:1fr auto; gap:8px; align-items:start; }
.cl-t{ font-weight:600; font-size:13px; } .cl-sub{ font-size:11.5px; color:var(--ink-3); margin-top:3px; line-height:1.5; }
.cl-right{ text-align:right; display:flex; flex-direction:column; gap:5px; align-items:flex-end; } .cl-out{ font-size:12px; font-weight:660; color:var(--warn); } .cl-out.ok{ color:var(--ok); }
.cl-pay{ grid-column:1/3; display:flex; gap:7px; margin-top:9px; align-items:center; } .cl-pay input,.cl-pay select{ border:1px solid var(--border-2); border-radius:8px; background:var(--surface); color:var(--ink); padding:7px 9px; font:inherit; font-size:12.5px; outline:none; } .cl-pay input{ width:110px; }
.cl-btn{ height:32px; padding:0 12px; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); font-size:12px; font-weight:600; } .cl-btn.pri{ background:var(--accent); color:var(--on-accent); border-color:transparent; } .cl-btn:hover{ filter:brightness(.98); }
.cl-empty,.cl-load{ font-size:12.5px; color:var(--ink-3); padding:16px 0; text-align:center; }
@media (max-width:820px){ .brk-tiles{ grid-template-columns:repeat(2,1fr); } }
`

/* ── Commission ledger drawer (per broker) ─────────────────────── */
function commissionLedgerBody(broker: Broker, commissions: BrokerCommission[]): string {
  const outstandingOf = (c: BrokerCommission) => Math.max(0, money(c.commissionAmount) - money(c.amountPaid))
  const totalOut = commissions.reduce((a, c) => a + outstandingOf(c), 0)
  const rows = commissions.length ? commissions.map((c) => {
    const out = outstandingOf(c); const stt = COMM_STATUS[c.status] || COMM_STATUS.pending
    const payForm = out > 0 ? `<div class="cl-pay" id="clpay-${c.id}" hidden>
        <input type="number" id="clamt-${c.id}" min="0" value="${Math.round(out)}" placeholder="Rs"/>
        <select id="clm-${c.id}">${PAY_METHODS.map((m) => `<option value="${m.v}">${m.l}</option>`).join("")}</select>
        <button class="cl-btn pri" data-cl-paygo="${c.id}">Ada</button>
        <button class="cl-btn" data-cl-paycancel="${c.id}">✕</button>
      </div>` : ""
    return `<div class="cl-row">
      <div class="cl-main"><div class="cl-t">${escHtml(c.description || (c.bookingId ? `Booking #${c.bookingId}` : "Commission"))}</div>
        <div class="cl-sub">Accrue: ${fmtD(c.accruedDate)}${c.dueDate ? ` · Due: ${fmtD(c.dueDate)}` : ""} · Kul Rs ${pkNum(money(c.commissionAmount))} · Ada Rs ${pkNum(money(c.amountPaid))}</div></div>
      <div class="cl-right"><span class="st ${stt.tone}"><i></i> ${stt.label}</span>${out > 0 ? `<div class="cl-out">Baqaya Rs ${pkNum(out)}</div><button class="cl-btn pri" data-cl-pay="${c.id}">Ada karein</button>` : `<div class="cl-out ok">Poora</div>`}</div>
      ${payForm}</div>`
  }).join("") : `<div class="cl-empty">Is broker ki abhi koi commission darj nahi.</div>`
  return `<div class="cl-head"><div><div class="cl-name">${escHtml(broker.name)}</div><div class="cl-agency">${escHtml(broker.agencyName || TYPE_LABEL[broker.brokerType] || "")}</div></div>${totalOut > 0 ? `<div class="cl-tot">Kul baqaya<b>Rs ${pkNum(totalOut)}</b></div>` : `<div class="cl-tot ok">Sab clear</div>`}</div>${rows}`
}

function commLabel(b: Broker): string {
  const pct = money(b.defaultCommissionPct), flat = money(b.defaultCommissionFlat)
  if (pct > 0) return `${pct}<span class="u">%</span>`
  if (flat > 0) return `Rs ${pkNum(flat)}<span class="u">/booking</span>`
  return "—"
}

/* ── Broker add/edit drawer form ────────────────────────────────── */
function brokerFormBody(x?: Broker | null): string {
  const typeSel = x?.brokerType || "rishta"
  const typeOpts = TYPES.map((t) => `<option value="${t}"${typeSel === t ? " selected" : ""}>${escHtml(TYPE_LABEL[t])}</option>`).join("")
  return `
    <input type="hidden" id="b-id" value="${x ? String(x.id) : ""}"/>
    <div class="dfield"><label class="dlabel">Naam <span class="req">*</span></label><input type="text" id="b-name" value="${x ? escHtml(x.name) : ""}" placeholder="Naam"/></div>
    <div class="dfield row2">
      <div><label class="dlabel">Qism</label><select id="b-type">${typeOpts}</select></div>
      <div><label class="dlabel">Agency</label><input type="text" id="b-agency" value="${x?.agencyName ? escHtml(x.agencyName) : ""}" placeholder="optional"/></div>
    </div>
    <div class="dfield"><label class="dlabel">Phone</label><input type="text" id="b-phone" value="${x?.phoneNumber ? escHtml(x.phoneNumber) : ""}" placeholder="0300…"/></div>
    <div class="dfield row2">
      <div><label class="dlabel">Commission %</label><input type="number" id="b-pct" min="0" value="${x?.defaultCommissionPct != null ? money(x.defaultCommissionPct) : ""}" placeholder="0"/></div>
      <div><label class="dlabel">Ya flat (Rs/booking)</label><input type="number" id="b-flat" min="0" value="${x?.defaultCommissionFlat != null ? money(x.defaultCommissionFlat) : ""}" placeholder="0"/></div>
    </div>
    <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Cancel</button><button class="btn btn-primary" type="button" id="af-save">Broker save karein</button></div>`
}

function buildContent(list: Broker[], filter: string, outMap: Map<number, OutstandingBrokerRow>, grandTotal: number): string {
  const cnt = (t: BrokerType) => list.filter((x) => x.brokerType === t).length
  const active = list.filter((x) => x.isActive).length
  const types = TYPES.filter((t) => cnt(t) > 0).sort((a, b) => cnt(b) - cnt(a))
  const overdueTotal = [...outMap.values()].reduce((a, r) => a + (r.overdueCount || 0), 0)
  const tiles = `<div class="brk-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.handshake, 1.7)} Kul brokers</div><div class="t-val tnum">${list.length}</div><div class="t-sub">${active} active partners</div></div>
    <div class="tile warn"><div class="t-cap">${svg(IC.wallet, 1.7)} Baqaya commission</div><div class="t-val tnum"><span style="font-size:12px;color:var(--ink-3);font-weight:600">Rs</span> ${pkNum(grandTotal)}</div><div class="t-sub">${overdueTotal > 0 ? `${overdueTotal} overdue` : "dena baqi"}</div></div>
    <div class="tile"><div class="t-cap">Qism</div><div class="t-val tnum">${types.length}</div><div class="t-sub">referral partners</div></div>
    <div class="tile"><div class="t-cap">Sab se zyada</div><div class="t-val" style="font-size:16px">${types[0] ? escHtml(TYPE_LABEL[types[0]]) : "—"}</div><div class="t-sub">${types[0] ? cnt(types[0]) + " brokers" : "koi nahi"}</div></div>
  </div>`
  const tab = (f: string, label: string, c: number) => `<button class="tab${f === filter ? " on" : ""}" data-f="${f}">${f !== "all" ? `<span class="dot" style="background:${TYPE_COLOR[f]}"></span> ` : ""}${label} <span class="cnt">${c}</span></button>`
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">${tab("all", "Sab", list.length)}${types.map((t) => tab(t, TYPE_LABEL[t], cnt(t))).join("")}</div><div class="filters"><button class="btn btn-primary" id="addbtn">${svg(IC.plus, 2.2)} Naya broker</button></div></div>`
  const rows = list.filter((x) => filter === "all" || x.brokerType === filter)
  const body = rows.map((x) => {
    const phone = x.phoneNumber || ""
    const out = money(outMap.get(x.id)?.outstanding)
    const ledBtn = `<button class="ledbtn${out > 0 ? " due" : ""}" data-ledger="${x.id}" title="Commission ledger">${svg(IC.ledger, 1.8)} ${out > 0 ? `Rs ${pkNum(out)}` : "Ledger"}</button>`
    const acts = `<div class="rowacts">${ledBtn}${phone ? `<button class="iconbtn" data-tel="${escHtml(phone)}" title="Call">${svg(IC.call)}</button><button class="iconbtn wa" data-wa="${escHtml(phone)}" title="WhatsApp">${svg(IC.wa)}</button>` : ""}<button class="iconbtn" data-edit="${x.id}" title="Edit">${svg(IC.edit)}</button><button class="iconbtn bad" data-del="${x.id}" title="Delete">${svg(IC.trash)}</button></div>`
    return `<tr>
      <td><div class="c-couple" data-ledger="${x.id}" style="cursor:pointer" title="Commission ledger"><span class="ava">${escHtml(initialsOf(x.name))}</span><div><div class="cc-nm">${escHtml(x.name)}${!x.isActive ? ` <span class="st mut"><i></i> Inactive</span>` : ""}</div><div class="cc-ev">${escHtml(x.agencyName || "—")}</div></div></div></td>
      <td><span class="typechip"><span class="dot" style="background:${TYPE_COLOR[x.brokerType]}"></span> ${escHtml(TYPE_LABEL[x.brokerType] || x.brokerType)}</span></td>
      <td class="td-mut tnum">${escHtml(phone || "—")}</td>
      <td class="comm">${commLabel(x)}${out > 0 ? `<div class="baqaya-chip">${svg(IC.wallet, 1.8)} Baqaya Rs ${pkNum(out)}</div>` : ""}</td>
      <td>${acts}</td>
    </tr>`
  }).join("")
  return `
  <div class="head"><div><h1>Brokers</h1><div class="sub">Referral partners jo aapko bookings dilate hain — <b>${list.length}</b> brokers.</div></div></div>
  ${tiles}${toolbar}
  <div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Broker</th><th>Qism</th><th>Phone</th><th>Commission</th><th></th></tr></thead>
    <tbody>${body}</tbody></table></div>
    ${rows.length ? `<div class="tbl-foot"><span>${rows.length} brokers</span></div>` : `<div class="empty">Is category mein koi broker nahi. "Naya broker" se add karein.</div>`}</div>
  <div class="foot">WeddingWala vendor console · Brokers</div>`
}

export function BrokersArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/brokers", crumbBold: "Log", crumbSub: "Brokers", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const { business, businesses } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizId = activeBusinessId ?? (business as { id?: number } | null)?.id ?? null
  const bizRef = React.useRef(bizId); bizRef.current = bizId
  const { data, isError } = useQuery({ queryKey: ["brokers-art", bizId], enabled: !!bizId, queryFn: () => BrokerAPI.list({ businessId: Number(bizId) }) })
  const outQ = useQuery({ queryKey: ["brokers-out", bizId], enabled: !!bizId, queryFn: () => BrokerAPI.outstandingSummary({ businessId: Number(bizId) }).catch(() => ({ perBroker: [], grandTotal: 0 })) })
  const list = React.useMemo(() => (data?.brokers ?? []) as Broker[], [data])
  const listRef = React.useRef(list); listRef.current = list
  const outMap = React.useMemo(() => {
    const m = new Map<number, OutstandingBrokerRow>()
    for (const r of (outQ.data?.perBroker ?? [])) if (r.brokerId != null) m.set(r.brokerId, r)
    return m
  }, [outQ.data])
  const grandTotal = Number(outQ.data?.grandTotal ?? 0)
  const [filter, setFilter] = React.useState(() => loadPref("tab:brokers", "all"))

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!bizId) { wwc.innerHTML = venuePickerHtml((businesses || []) as { id: number; name?: string }[], { title: "Kaunsi venue ke brokers?", sub: "Brokers ek venue ke liye hain — neeche se chunein." }); return }
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Brokers</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Brokers load ho rahe hain…</div>`; return }
    wwc.innerHTML = buildContent(list, filter, outMap, grandTotal)
    initTablePager(s, { pageSize: 25 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, filter, bizId, outQ.data, isError, businesses])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const refetch = () => { qc.invalidateQueries({ queryKey: ["brokers-art", bizRef.current] }); qc.invalidateQueries({ queryKey: ["brokers-out", bizRef.current] }) }
    const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? ""

    const openLedger = (brokerId: number) => {
      const broker = listRef.current.find((y) => y.id === brokerId); if (!broker) return
      openDrawer(s, "Commission ledger", `<div class="cl-load">Ledger load ho raha hai…</div>`)
      BrokerAPI.listCommissions({ brokerId, businessId: Number(bizRef.current) }).then(({ commissions }) => {
        const b = s.getElementById("ww-drawer-body"); if (b) b.innerHTML = commissionLedgerBody(broker, commissions)
      }).catch(() => { const b = s.getElementById("ww-drawer-body"); if (b) b.innerHTML = `<div class="cl-empty">Ledger load nahi hui.</div>` })
    }
    const recordCommPayment = async (commId: number) => {
      const amt = Number((s.getElementById(`clamt-${commId}`) as HTMLInputElement | null)?.value)
      const method = (s.getElementById(`clm-${commId}`) as HTMLSelectElement | null)?.value as CommissionPaymentMethod
      if (!amt || amt <= 0) { toast.error("Sahi amount likhein"); return }
      const btn = s.querySelector(`[data-cl-paygo="${commId}"]`) as HTMLButtonElement | null
      if (btn) { btn.disabled = true; btn.textContent = "…" }
      try {
        const r = await BrokerAPI.recordPayment(commId, { amount: amt, method: method || "cash" })
        toast.success(`Ada darj: Rs ${pkNum(amt)}${r.result?.autoTransitioned ? " · poora ho gaya" : ""}`)
        refetch()
        // re-render the open ledger for this broker (find via the still-open drawer)
        const nameEl = s.querySelector(".cl-name")?.textContent || ""
        const broker = listRef.current.find((y) => y.name === nameEl)
        if (broker) { const { commissions } = await BrokerAPI.listCommissions({ brokerId: broker.id, businessId: Number(bizRef.current) }); const b = s.getElementById("ww-drawer-body"); if (b) b.innerHTML = commissionLedgerBody(broker, commissions) }
      } catch (err: unknown) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Ada darj nahi hui")
        if (btn) { btn.disabled = false; btn.textContent = "Ada" }
      }
    }
    const openForm = (x?: Broker) => {
      openDrawer(s, x ? "Broker edit karein" : "Naya broker", brokerFormBody(x ?? null))
    }
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["brokers-art", bizRef.current] }); qc.invalidateQueries({ queryKey: ["brokers-out", bizRef.current] }); return }
      const wa = t.closest("[data-wa]") as HTMLElement | null
      if (wa) { const p = waDigits(wa.dataset.wa); if (p) window.open(`https://wa.me/${p}`, "_blank", "noopener"); return }
      const tel = t.closest("[data-tel]") as HTMLElement | null
      if (tel?.dataset.tel) { window.location.href = `tel:${tel.dataset.tel.replace(/\s/g, "")}`; return }
      const ledger = t.closest("[data-ledger]") as HTMLElement | null
      if (ledger?.dataset.ledger) { openLedger(Number(ledger.dataset.ledger)); return }
      const clpay = t.closest("[data-cl-pay]") as HTMLElement | null
      if (clpay?.dataset.clPay) { const row = s.getElementById(`clpay-${clpay.dataset.clPay}`); if (row) (row as HTMLElement).hidden = false; return }
      const clcancel = t.closest("[data-cl-paycancel]") as HTMLElement | null
      if (clcancel?.dataset.clPaycancel) { const row = s.getElementById(`clpay-${clcancel.dataset.clPaycancel}`); if (row) (row as HTMLElement).hidden = true; return }
      const clgo = t.closest("[data-cl-paygo]") as HTMLElement | null
      if (clgo?.dataset.clPaygo) { void recordCommPayment(Number(clgo.dataset.clPaygo)); return }
      const tab = t.closest(".tab") as HTMLElement | null
      if (tab?.dataset.f) { savePref("tab:brokers", tab.dataset.f); setFilter(tab.dataset.f); return }
      if (t.closest("#addbtn")) { openForm(); return }
      const edit = t.closest("[data-edit]") as HTMLElement | null
      if (edit?.dataset.edit) { const x = listRef.current.find((y) => y.id === Number(edit.dataset.edit)); if (x) openForm(x); return }
      const del = t.closest("[data-del]") as HTMLElement | null
      if (del?.dataset.del) {
        const id = Number(del.dataset.del)
        const x = listRef.current.find((y) => y.id === id)
        openConfirm(s, { title: `${x ? x.name : "Broker"} delete karein?`, message: "Ye record hat jayega — wapas nahi aayega.", danger: true, onConfirm: async () => {
          try { await BrokerAPI.remove(id); toast.success("Broker hata diya"); refetch() } catch { toast.error("Delete nahi hua") }
        } })
        return
      }
      if (t.closest("#af-save")) {
        const name = val("b-name"); if (!name) { toast.error("Naam likhein"); return }
        const bId = Number(bizRef.current); if (!bId) { toast.error("Business select karein"); return }
        const editId = Number(val("b-id"))
        const body: CreateBrokerInput = { businessId: bId, name, brokerType: val("b-type") as BrokerType }
        if (val("b-agency")) body.agencyName = val("b-agency")
        if (val("b-phone")) body.phoneNumber = val("b-phone")
        if (val("b-pct")) body.defaultCommissionPct = Number(val("b-pct"))
        if (val("b-flat")) body.defaultCommissionFlat = Number(val("b-flat"))
        const btn = s.getElementById("af-save") as HTMLButtonElement | null
        if (btn) { btn.disabled = true; btn.textContent = "Save ho raha…" }
        try {
          if (editId) await BrokerAPI.update(editId, body)
          else await BrokerAPI.create(body)
          toast.success(editId ? "Broker update ho gaya" : "Broker add ho gaya"); closeDrawer(s); refetch()
        } catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua"); if (btn) { btn.disabled = false; btn.textContent = "Broker save karein" } }
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default BrokersArtifact
