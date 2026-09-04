"use client"

/**
 * Receivables (Wapsi) — ported onto the shared champagne shell so the money
 * cluster is visually + behaviourally consistent. A/R aging board: who owes,
 * how much, how overdue — with an INLINE record-payment drawer (no round-trip),
 * one-tap WhatsApp reminders, aging tabs, search, pagination and CSV export.
 * Real data via AnalyticsAPI.getReceivables.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AnalyticsAPI, type ReceivablesData, type ReceivablesCustomer } from "@/lib/api/analytics"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { waDigits } from "@/components/dashboard/mainScreens/leads/artifact/leads-artifact"
import { useArtifactShell, pkNum, escHtml, initialsOf, initTablePager, setPagerFilter, errorBannerHtml, restoreTab, savePref } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import { openRecordPaymentDrawer } from "@/components/dashboard/mainScreens/artifact/record-payment"

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  due: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', users: '<path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>',
  old: '<path d="M12 8v5l3 2"/><path d="M3.05 11a9 9 0 1 1 .5 4M3 4v5h5"/>', open: '<path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/>',
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20l1.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>', plus: '<path d="M12 5v14M5 12h14"/>', dl: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
}
function agingKey(days: number): "a30" | "a60" | "a90" {
  if (days <= 30) return "a30"; if (days <= 60) return "a60"; return "a90"
}
const AGING: Record<string, { label: string; tone: string }> = {
  a30: { label: "0–30 din", tone: "warn" }, a60: { label: "31–60 din", tone: "warn" }, a90: { label: "60+ din", tone: "bad" },
}

const EXTRA_CSS = String.raw`
.rc-tiles{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:10px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:10px 13px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); }
.tile.warn .t-val{ color:var(--warn); } .tile.bad .t-val{ color:var(--bad); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:17px; font-weight:680; letter-spacing:-.02em; margin-top:4px; } .t-val .rs{ font-size:12px; color:var(--ink-3); font-weight:600; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.rc-acts{ display:flex; gap:6px; justify-content:flex-end; }
.rc-rec{ display:inline-flex; align-items:center; gap:5px; height:30px; padding:0 11px; border-radius:8px; border:1px solid var(--accent-line); background:var(--accent-wash); color:var(--accent-ink); font-size:12px; font-weight:600; } .rc-rec:hover{ filter:brightness(.98); } .rc-rec svg{ width:13px; height:13px; }
.iconbtn{ width:30px; height:30px; flex:none; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; } .iconbtn:hover{ background:var(--surface-3); color:var(--ink); } .iconbtn.wa:hover{ color:var(--ok); border-color:var(--ok); } .iconbtn svg{ width:15px; height:15px; } .iconbtn:disabled{ opacity:.4; }
.od{ font-weight:600; } .od.bad{ color:var(--bad); } .od.warn{ color:var(--warn); }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:980px){ .rc-tiles{ grid-template-columns:repeat(2,1fr); } }
`

function rowHtml(c: ReceivablesCustomer): string {
  const name = c.customerName || "Customer"
  const phone = c.customerPhone || ""
  const due = num(c.totalOutstanding)
  const days = num(c.oldestDaysOverdue)
  const ak = agingKey(days)
  const firstBk = c.bookings?.find((b) => num(b.totalOutstanding) > 0) || c.bookings?.[0]
  const bkId = firstBk?.bookingId
  const bkDue = firstBk ? num(firstBk.totalOutstanding) || due : due
  const nav = bkId ? `/dashboard/bookings/${bkId}` : ""
  const recBtn = bkId ? `<button class="rc-rec" data-rec="${bkId}" data-rec-name="${escHtml(name)}" data-rec-due="${Math.round(bkDue)}" title="Payment record karein">${svg(IC.plus, 2.4)} Record</button>` : ""
  const waBtn = phone ? `<button class="iconbtn wa" data-remind="${escHtml(phone)}" data-rn="${escHtml(name)}" data-rd="${Math.round(due)}" title="WhatsApp yaad-dahani">${svg(IC.wa, 1.9)}</button>` : ""
  const odCls = days > 60 ? "bad" : days > 30 ? "warn" : ""
  return `<tr data-aging="${ak}"${nav ? ` data-nav-btn="${nav}"` : ""}>
    <td><div class="c-couple"><span class="ava">${escHtml(initialsOf(name))}</span><div><div class="cc-nm">${escHtml(name)}</div><div class="cc-ev">${escHtml(phone || c.customerEmail || "—")}</div></div></div></td>
    <td class="td-guests tnum">${num(c.bookingCount)}</td>
    <td><span class="od ${odCls}">${days > 0 ? `${days} din` : "—"}</span></td>
    <td class="r td-amt tnum"><span style="color:var(--warn)"><span class="rs">Rs</span> ${pkNum(due)}</span></td>
    <td><div class="rc-acts">${recBtn}${waBtn}</div></td>
  </tr>`
}

function buildContent(data: ReceivablesData): string {
  const t = data.totals
  const custs = [...(data.customers || [])].sort((a, b) => num(b.totalOutstanding) - num(a.totalOutstanding))
  const counts = { all: custs.length, a30: 0, a60: 0, a90: 0 }
  custs.forEach((c) => { counts[agingKey(num(c.oldestDaysOverdue))]++ })

  const tiles = `<div class="rc-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.due, 1.9)} Kul baqaya</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(num(t.grandOutstanding))}</div><div class="t-sub">vasool karna hai</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.users, 1.9)} Customers</div><div class="t-val tnum">${num(t.customerCount)}</div><div class="t-sub">jinke zimme paisa</div></div>
    <div class="tile ${num(t.oldestDaysOverdue) > 60 ? "bad" : "warn"}"><div class="t-cap">${svg(IC.old, 1.9)} Sab se purana</div><div class="t-val tnum">${num(t.oldestDaysOverdue)}<span class="rs"> din</span></div><div class="t-sub">overdue</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.open, 1.9)} Open installments</div><div class="t-val tnum">${num(t.installmentsOpen)}</div><div class="t-sub">baqaya qisten</div></div>
  </div>`

  const tab = (f: string, label: string, dot: string, cnt: number, on = false) => `<button class="tab${on ? " on" : ""}" data-f="${f}">${dot ? `<span class="dot ${dot}"></span> ` : ""}${label} <span class="cnt">${cnt}</span></button>`
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs" role="tablist">
    <button class="tab on" data-f="all">Sab <span class="cnt">${counts.all}</span></button>
    ${tab("a30", "0–30 din", "d-warn", counts.a30)}${tab("a60", "31–60 din", "d-warn", counts.a60)}${tab("a90", "60+ din", "d-bad", counts.a90)}
    </div><div class="filters"><label class="f-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><input placeholder="Customer ya number dhoondein…" aria-label="Filter"/></label></div></div>`

  const body = custs.map(rowHtml).join("")
  return `
  <div class="head"><div><h1>Wapsi — jo lena hai</h1><div class="sub">A/R aging — kisne kitna dena hai, kitna purana. <b>Rs ${pkNum(num(t.grandOutstanding))}</b> baqaya.</div></div>
    <div class="head-actions"><button class="btn btn-ghost" data-act="export-table">${svg(IC.dl, 2)} Export</button></div></div>
  ${tiles}${toolbar}
  <div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Customer</th><th class="r">Bookings</th><th>Purana</th><th class="r">Baqaya</th><th></th></tr></thead>
    <tbody id="tbody">${body}</tbody></table></div>
    ${custs.length ? `<div class="tbl-foot"><span id="rowcount">${custs.length} customers</span></div>` : `<div class="empty">Koi baqaya nahi — sab clear! 🎉</div>`}</div>
  <div class="foot">WeddingWala vendor console · Wapsi</div>`
}

export function ReceivablesArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/receivables", crumbBold: "Paisa", crumbSub: "Wapsi", extraCss: EXTRA_CSS })
  const bizId = useActiveBusinessId()
  const qc = useQueryClient()
  const { data, isError } = useQuery({ queryKey: ["receivables-art", bizId], queryFn: () => AnalyticsAPI.getReceivables(bizId ?? undefined) })

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Wapsi — jo lena hai</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Baqaya load ho raha hai…</div>`; return }
    wwc.innerHTML = buildContent(data)
    initTablePager(s, { pageSize: 25, noun: "customers" })
    restoreTab(s, "tab:wapsi", (f) => setPagerFilter(s, (tr) => f === "all" || tr.dataset.aging === f))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["receivables-art"] }); return }
      const rec = t.closest("[data-rec]") as HTMLElement | null
      if (rec?.dataset.rec) {
        openRecordPaymentDrawer(s, { bookingId: Number(rec.dataset.rec), customerName: rec.dataset.recName || undefined, due: Number(rec.dataset.recDue) || 0, onSaved: () => qc.invalidateQueries({ queryKey: ["receivables-art"] }) })
        return
      }
      const rm = t.closest("[data-remind]") as HTMLElement | null
      if (rm?.dataset.remind) {
        const p = waDigits(rm.dataset.remind); if (!p) return
        const msg = `Assalam-o-Alaikum ${rm.dataset.rn || ""}! Aap ki booking ka baqaya Rs ${pkNum(Number(rm.dataset.rd) || 0)} hai. Meherbani farma kar ada kar dein. Shukriya.`
        window.open(`https://wa.me/${p}?text=${encodeURIComponent(msg)}`, "_blank", "noopener")
        toast.success("WhatsApp khul gaya")
        return
      }
      const tab = t.closest(".tab") as HTMLElement | null
      if (tab?.dataset.f) {
        const tabsEl = s.getElementById("tabs"); tabsEl?.querySelectorAll(".tab").forEach((x) => x.classList.remove("on")); tab.classList.add("on")
        const f = tab.dataset.f || "all"
        savePref("tab:wapsi", f)
        setPagerFilter(s, (tr) => f === "all" || tr.dataset.aging === f)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default ReceivablesArtifact
