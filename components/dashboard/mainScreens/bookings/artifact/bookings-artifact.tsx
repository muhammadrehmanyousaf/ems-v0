"use client"

/**
 * Bookings — pixel-faithful to the design sample (docs/design-samples/bookings.html)
 * and wired to the REAL /api/v1/bookings endpoint through the shared artifact shell.
 * List view with live status-filter tabs; every row opens the booking.
 */

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useFetchData } from "@/hooks/use-fetch-data"
import { bookedOn, receivedOn, outstandingOn, isCancelledBooking } from "@/lib/utils/booking-money"
import { spaceNameOf } from "@/lib/utils/booking-space"
import { bookingStatusLabel } from "@/lib/booking-status-label"
import type { BookingData } from "@/lib/dashboard-types"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useBusiness } from "@/context/BusinessContext"
import { useArtifactShell, pkNum, escHtml, initialsOf, openDrawer, closeDrawer, initTablePager, setPagerFilter, restoreTab, savePref, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import { openRecordPaymentDrawer } from "@/components/dashboard/mainScreens/artifact/record-payment"
import { openBookingForm } from "@/components/dashboard/mainScreens/artifact/booking-form"

const serviceLabel = (b: BookingData) =>
  b.bookingDetails?.[0]?.package?.name || b.bookingDetails?.[0]?.business?.name || "Booking"
function fmtDate(s?: string): { main: string; sub: string } {
  if (!s) return { main: "—", sub: "" }
  const d = new Date(s)
  if (isNaN(d.getTime())) return { main: String(s), sub: "" }
  return { main: d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }), sub: d.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }) }
}
function tone(status?: string): string {
  const v = (status || "").toLowerCase()
  if (v.includes("confirm")) return "ok"
  if (v.includes("complete")) return "mut"
  if (v.includes("cancel")) return "bad"
  if (v.includes("await") || v.includes("pending") || v.includes("request")) return "info"
  return "warn"
}
function bucket(status?: string): "confirmed" | "pending" | "done" {
  const v = (status || "").toLowerCase()
  if (v.includes("complete") || v.includes("cancel")) return "done"
  if (v.includes("confirm")) return "confirmed"
  return "pending"
}
const menuSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>`

function rowHtml(b: BookingData): string {
  const total = bookedOn(b), paid = receivedOn(b), out = outstandingOn(b)
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0
  const d = fmtDate(b.bookingDate)
  const hall = spaceNameOf(b) || "—"
  const guests = b.guestCount != null ? String(b.guestCount) : "—"
  const bkt = bucket(b.status)
  // outstandingOn already returns 0 for cancelled, so a positive `out` means real
  // money is owed — including on a COMPLETED booking. Don't hide those from the
  // Baqaya tab via the "done" bucket (which lumps completed + cancelled).
  const due = out > 0 ? "1" : "0"
  const phone = (b as { customerPhone?: string }).customerPhone || ""
  const kebabAttrs = `data-bk="${b.id}" data-bk-name="${escHtml(b.customerName || "")}" data-bk-due="${Math.round(out)}" data-bk-phone="${escHtml(phone)}"`
  // Cancelled → no money sub-label: the status chip already says "Cancelled", and
  // whether a refund is still owed (vs already given) isn't in the list payload —
  // that truth lives on the booking detail (cashRefundOwedTotal). Don't guess here.
  const amtSub = out > 0
    ? `<span class="sub due">${pkNum(out)} baqaya</span>`
    : isCancelledBooking(b)
      ? ""
      : (paid >= total && total > 0 ? `<span class="sub ok">poora mila</span>` : "")
  const bar = total > 0 ? `<div class="paybar"><span style="width:${Math.min(100, pct)}%"></span></div>` : `<div class="paybar"><span class="zero"></span></div>`
  return `<tr data-nav-btn="/dashboard/bookings/${b.id}" data-status="${bkt}" data-due="${due}">
    <td><div class="c-couple"><span class="ava">${escHtml(initialsOf(b.customerName))}</span><div><div class="cc-nm">${escHtml(b.customerName || "—")}</div><div class="cc-ev">${escHtml(serviceLabel(b) || "Booking")} · #${b.id}</div></div></div></td>
    <td class="td-date">${escHtml(d.main)}${d.sub ? `<div class="sub">${escHtml(d.sub)}</div>` : ""}</td>
    <td class="td-mut">${escHtml(hall)}</td>
    <td class="r td-guests tnum">${escHtml(guests)}</td>
    <td class="r td-amt tnum"><span class="rs">Rs</span> ${pkNum(total)}${amtSub}</td>
    <td><div class="pay-mini"><div class="paybar">${total > 0 ? `<span style="width:${Math.min(100, pct)}%"></span>` : `<span class="zero"></span>`}</div><span class="pct">${total > 0 ? pct + "%" : "—"}</span></div></td>
    <td><span class="st ${tone(b.status)}"><i></i> ${escHtml(bookingStatusLabel(b) || b.status || "—")}</span></td>
    <td><button class="rowmenu" aria-label="Actions" ${kebabAttrs}>${menuSvg}</button></td>
  </tr>`
}

function buildContent(rows: BookingData[], total: number, truncated: boolean): string {
  const counts = { all: rows.length, confirmed: 0, pending: 0, due: 0, done: 0 }
  rows.forEach((b) => {
    const bkt = bucket(b.status); counts[bkt]++
    if (outstandingOn(b) > 0) counts.due++
  })
  const tab = (f: string, label: string, dot: string, cnt: number, on = false) =>
    `<button class="tab${on ? " on" : ""}" data-f="${f}">${dot ? `<span class="dot ${dot}"></span> ` : ""}${label} <span class="cnt">${cnt}</span></button>`
  const body = rows.length ? rows.map(rowHtml).join("") : ""
  return `
  <div class="head">
    <div><h1>Bookings</h1><div class="sub">Saari shaadiyan aur events — <b>${total}</b> total${truncated ? " (pehle 50 dikhaye)" : ""}.</div></div>
    <div class="head-actions">
      <button class="btn btn-ghost" data-act="export-table"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg> Export</button>
      <button class="btn btn-primary" data-booking-new><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg> Nayi booking</button>
    </div>
  </div>
  <div class="toolbar">
    <div class="tabs" id="tabs" role="tablist" aria-label="Status filter">
      ${tab("all", "Sab", "", counts.all, true)}
      ${tab("confirmed", "Confirmed", "d-ok", counts.confirmed)}
      ${tab("pending", "Pending", "d-info", counts.pending)}
      ${tab("due", "Baqaya due", "d-warn", counts.due)}
      ${tab("done", "Ho gaya", "d-mut", counts.done)}
    </div>
    <div class="filters">
      <label class="f-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><input placeholder="Couple ya booking # dhoondein…" aria-label="Filter"/></label>
    </div>
  </div>
  <div class="card">
    <div class="tbl-wrap">
      <table class="tbl"><thead><tr><th>Couple &amp; event</th><th>Taareekh</th><th>Hall</th><th class="r">Mehmaan</th><th class="r">Amount</th><th>Payment</th><th>Status</th><th></th></tr></thead>
      <tbody id="tbody">${body}</tbody></table>
    </div>
    ${rows.length ? `<div class="tbl-foot"><span id="rowcount">${rows.length} bookings dikhaye ja rahe hain</span></div>` : `<div class="empty">Abhi koi booking nahi. Nayi booking add karein.</div>`}
  </div>`
}

export function BookingsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/bookings", crumbBold: "Bookings", crumbSub: "Saari shaadiyan" })
  const qc = useQueryClient()
  const searchParams = useSearchParams()
  const { business, businesses } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizId = activeBusinessId ?? (business as { id?: number } | null)?.id ?? null
  const bizRef = React.useRef(bizId); bizRef.current = bizId
  const bizList = React.useMemo(() => ((businesses ?? []) as { id: number; name?: string | null }[]).map((b) => ({ id: b.id, name: b.name })), [businesses])
  const bizListRef = React.useRef(bizList); bizListRef.current = bizList
  const { data, isError, isLoading } = useFetchData({
    endpoint: "/api/v1/bookings",
    queryKey: ["bookings-artifact"],
    Params: { page: 1, limit: 100, sortBy: "bookingDate", sortOrder: "desc" },
  })
  const rows: BookingData[] = data?.data?.data ?? []
  const total: number = data?.data?.filters?.total ?? rows.length
  const truncated = total > rows.length

  // calendar "+" deep-link: /dashboard/bookings?new=YYYY-MM-DD opens the create
  // drawer prefilled with that date (so the clicked date isn't discarded).
  const autoOpened = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || autoOpened.current) return
    const nd = searchParams?.get("new")
    if (nd) { autoOpened.current = true; openBookingForm(s, { prefill: { bookingDate: nd }, businesses: bizListRef.current, activeBiz: bizRef.current, onSaved: () => qc.invalidateQueries({ queryKey: ["/api/v1/bookings"] }) }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, searchParams])

  const tabsBound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc")
    if (wwc) {
      if (isError) {
        wwc.innerHTML = `<div class="head"><div><h1>Bookings</h1></div></div>${errorBannerHtml()}`
      } else if (isLoading || !data) {
        wwc.innerHTML = `<div class="loadwrap">Bookings load ho rahi hain…</div>`
      } else {
        wwc.innerHTML = buildContent(rows, total, truncated)
        initTablePager(s, { pageSize: 25, noun: "bookings" })
        restoreTab(s, "tab:bookings", (f) => setPagerFilter(s, (tr) => f === "all" || (f === "due" ? tr.dataset.due === "1" : tr.dataset.status === f)))
      }
    }
    // bind status tabs once (delegated on shadow)
    if (!tabsBound.current) {
      tabsBound.current = true
      const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? ""
      const closePop = () => s.querySelector(".rowpop")?.remove()
      s.addEventListener("click", async (e) => {
        const t = e.target as HTMLElement
        if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["/api/v1/bookings"] }); return }
        // ── row kebab: quick actions popover ──
        const km = t.closest(".rowmenu") as HTMLElement | null
        if (km) {
          const wasOpen = !!s.querySelector(".rowpop"); closePop()
          if (wasOpen) return
          const id = km.dataset.bk, nm = km.dataset.bkName || "", dueAmt = Number(km.dataset.bkDue) || 0, ph = km.dataset.bkPhone || ""
          const r = km.getBoundingClientRect()
          const pop = document.createElement("div"); pop.className = "rowpop"
          pop.style.cssText = `position:fixed;top:${r.bottom + 5}px;left:${Math.max(8, r.right - 194)}px;z-index:90;min-width:186px;background:var(--surface);border:1px solid var(--border-2);border-radius:11px;box-shadow:var(--shadow-md);padding:5px;display:flex;flex-direction:column;gap:1px`
          const bstyle = "display:flex;align-items:center;gap:9px;width:100%;text-align:left;border:0;background:transparent;color:var(--ink);padding:8px 9px;border-radius:7px;font-size:12.5px;font-weight:500"
          const isvg = (p: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;color:var(--ink-3);flex:none">${p}</svg>`
          pop.innerHTML =
            (dueAmt > 0 ? `<button data-pop-rec data-stop style="${bstyle}">${isvg('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.4a2 2 0 0 1 2-1.4h1.2a1.8 1.8 0 0 1 0 3.6h-1.4a1.8 1.8 0 0 0 0 3.6H13a2 2 0 0 0 2-1.4"/>')} Payment record</button>` : "")
            + (ph ? `<button data-pop-call data-stop style="${bstyle}">${isvg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>')} Call</button>` : "")
            + (ph ? `<button data-pop-wa data-stop style="${bstyle}">${isvg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')} WhatsApp</button>` : "")
            + `<button data-nav-btn="/dashboard/bookings/${id}" data-stop style="${bstyle}">${isvg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>')} Booking kholein</button>`
          s.appendChild(pop)
          pop.querySelector("[data-pop-rec]")?.addEventListener("click", () => { closePop(); openRecordPaymentDrawer(s, { bookingId: Number(id), customerName: nm, due: dueAmt, onSaved: () => qc.invalidateQueries({ queryKey: ["/api/v1/bookings"] }) }) })
          pop.querySelector("[data-pop-call]")?.addEventListener("click", () => { closePop(); window.location.href = "tel:" + ph.replace(/\s/g, "") })
          pop.querySelector("[data-pop-wa]")?.addEventListener("click", () => { closePop(); const digits = ph.replace(/[^0-9]/g, "").replace(/^0/, "92"); const text = dueAmt > 0 ? `?text=${encodeURIComponent(`Assalam o Alaikum ${nm || "ji"}, aap ki baqaya Rs ${pkNum(dueAmt)} hai. Bara-e-meherbani event se pehle ada kar dein. Shukriya.`)}` : ""; window.open(`https://wa.me/${digits}${text}`, "_blank", "noopener") })
          return
        }
        if (s.querySelector(".rowpop") && !t.closest(".rowpop")) closePop()
        // ── offline booking drawer ──
        if (t.closest("[data-booking-new]")) { openBookingForm(s, { businesses: bizListRef.current, activeBiz: bizRef.current, onSaved: () => qc.invalidateQueries({ queryKey: ["/api/v1/bookings"] }) }); return }
        const btn = t.closest(".tab") as HTMLElement | null
        if (!btn) return
        const tabsEl = s.getElementById("tabs"); if (!tabsEl) return
        tabsEl.querySelectorAll(".tab").forEach((x) => x.classList.remove("on"))
        btn.classList.add("on")
        const f = btn.dataset.f || "all"
        savePref("tab:bookings", f)
        setPagerFilter(s, (tr) => f === "all" || (f === "due" ? tr.dataset.due === "1" : tr.dataset.status === f))
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, isError, isLoading])

  return <div ref={hostRef} />
}

export default BookingsArtifact
