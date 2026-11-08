"use client"

/**
 * Bookings — pixel-faithful to the design sample (docs/design-samples/bookings.html)
 * and wired to the REAL /api/v1/bookings endpoint through the shared artifact shell.
 * List view with live status-filter tabs; every row opens the booking.
 */

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useFetchAllPages } from "@/hooks/use-fetch-all-pages"
import { bookedOn, receivedOn, outstandingOn, isCancelledBooking } from "@/lib/utils/booking-money"
import { spaceNameOf } from "@/lib/utils/booking-space"
import { fmtYmd, ymdOf } from "@/lib/utils/ymd"
import { bookingSlotText } from "@/lib/booking/slot-vocabulary"
import { bookingStatusLabel, bookingStatusTone as tone } from "@/lib/booking-status-label"
import type { BookingData } from "@/lib/dashboard-types"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useBusiness } from "@/context/BusinessContext"
import { toast } from "sonner"
import { BookingsAPI } from "@/lib/api/dashboard"
import { invalidateMoney } from "@/lib/query/money-keys"
import { canMarkCompleted, statusBucket } from "@/lib/utils/booking-completion"
import { useArtifactShell, pkNum, escHtml, initialsOf, openConfirm, initTablePager, setPagerFilter, restoreTab, savePref, errorBannerHtml, registerTableExport } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import { openRecordPaymentDrawer } from "@/components/dashboard/mainScreens/artifact/record-payment"
import { openBookingForm } from "@/components/dashboard/mainScreens/artifact/booking-form"

type BizLite = { id: number; name?: string | null }

const serviceLabel = (b: BookingData) =>
  b.bookingDetails?.[0]?.package?.name || b.bookingDetails?.[0]?.business?.name || "Booking"

function fmtDate(b: BookingData): { main: string; sub: string } {
  if (!b.bookingDate) return { main: "—", sub: "" }
  return { main: fmtYmd(b.bookingDate, "short", null), sub: bookingSlotText(b, "vendor") }
}

const bucket = statusBucket
const menuSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>`

const EXTRA_CSS = String.raw`
.f-select{ appearance:none; background:var(--surface); border:1px solid var(--border-2); border-radius:8px; padding:6px 28px 6px 10px; font-size:12px; color:var(--ink); cursor:pointer; height:34px; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 8px center; }
.f-select:focus{ outline:none; border-color:var(--gold, #d97706); }
.f-date{ background:var(--surface); border:1px solid var(--border-2); border-radius:8px; padding:5px 10px; font-size:12px; color:var(--ink); height:34px; }
.f-date:focus{ outline:none; border-color:var(--gold, #d97706); }
.dot.d-bad{ background:var(--bad, #ef4444); }
`

function rowHtml(b: BookingData): string {
  const total = bookedOn(b), paid = receivedOn(b), out = outstandingOn(b)
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0
  const d = fmtDate(b)
  const hall = spaceNameOf(b) || "—"
  const bizName = b.bookingDetails?.[0]?.business?.name
  const venueDisplay = bizName ? `${escHtml(hall)} <div class="sub">🏢 ${escHtml(bizName)}</div>` : escHtml(hall)
  const guests = b.guestCount != null ? String(b.guestCount) : "—"
  const bkt = isCancelledBooking(b) ? "cancelled" : bucket(b.status)
  const due = out > 0 && !isCancelledBooking(b) ? "1" : "0"
  const phone = (b as { customerPhone?: string }).customerPhone || ""
  const email = (b as { customerEmail?: string }).customerEmail || ""
  const kebabAttrs = `data-bk="${b.id}" data-bk-name="${escHtml(b.customerName || "")}" data-bk-due="${Math.round(out)}" data-bk-phone="${escHtml(phone)}"${canMarkCompleted(b) ? " data-bk-done" : ""}`
  const amtSub = out > 0
    ? `<span class="sub due">${pkNum(out)} baqaya</span>`
    : isCancelledBooking(b)
      ? ""
      : (paid >= total && total > 0 ? `<span class="sub ok">poora mila</span>` : "")

  const bizId = b.bookingDetails?.[0]?.businessId ?? b.bookingDetails?.[0]?.business?.id ?? ""
  const payStat = (paid >= total && total > 0) ? "paid" : (out > 0 && paid > 0) ? "partial" : "unpaid"
  const dateStr = b.bookingDate ? String(b.bookingDate).slice(0, 10) : ""

  return `<tr data-nav-btn="/dashboard/bookings/${b.id}" data-bk-id="${b.id}" data-status="${bkt}" data-due="${due}" data-pay="${payStat}" data-biz-id="${bizId}" data-date="${dateStr}" data-search="${escHtml(phone + " " + email + " " + (b.customerName || "") + " " + serviceLabel(b) + " " + (bizName || "") + " #" + b.id)}">
    <td style="width:36px;text-align:center" data-stop><input type="checkbox" class="booking-row-check" data-id="${b.id}" style="cursor:pointer;width:15px;height:15px;accent-color:var(--gold, #d97706)" /></td>
    <td><div class="c-couple"><span class="ava">${escHtml(initialsOf(b.customerName))}</span><div><div class="cc-nm">${escHtml(b.customerName || "—")}</div><div class="cc-ev">${escHtml(serviceLabel(b) || "Booking")} · #${b.id}</div></div></div></td>
    <td class="td-date">${escHtml(d.main)}${d.sub ? ` <div class="sub">${escHtml(d.sub)}</div>` : ""}</td>
    <td class="td-mut">${venueDisplay}</td>
    <td class="r td-guests tnum">${escHtml(guests)}</td>
    <td class="r td-amt tnum"><span class="rs">Rs</span> ${pkNum(total)}${amtSub}</td>
    <td><div class="pay-mini"><div class="paybar">${total > 0 ? `<span style="width:${Math.min(100, pct)}%"></span>` : `<span class="zero"></span>`}</div><span class="pct">${total > 0 ? pct + "%" : "—"}</span></div></td>
    <td><span class="st ${tone(b.status)}"><i></i> ${escHtml(bookingStatusLabel(b) || b.status || "—")}</span></td>
    <td data-stop><button class="rowmenu" aria-label="Actions" ${kebabAttrs}>${menuSvg}</button></td>
  </tr>`
}

export function bookingExportRow(b: BookingData): (string | number)[] {
  const slot = bookingSlotText(b, "vendor")
  const bizName = b.bookingDetails?.[0]?.business?.name || ""
  return [
    b.id,
    b.customerName || "",
    (b as { customerPhone?: string }).customerPhone || "",
    serviceLabel(b),
    bizName,
    ymdOf(b.bookingDate) || "",
    slot || "",
    spaceNameOf(b) || "",
    b.guestCount ?? "",
    Math.round(bookedOn(b)),
    Math.round(receivedOn(b)),
    Math.round(outstandingOn(b)),
    bookingStatusLabel(b) || b.status || "",
  ]
}
export const BOOKING_EXPORT_HEAD = ["Booking #", "Customer", "Phone", "Event", "Venue", "Event date", "Slot", "Hall", "Guests", "Total", "Received", "Outstanding", "Status"]

function buildContent(rows: BookingData[], total: number, truncated: boolean, businesses: BizLite[]): string {
  const counts = { all: rows.length, confirmed: 0, pending: 0, due: 0, done: 0, cancelled: 0 }
  rows.forEach((b) => {
    if (isCancelledBooking(b)) {
      counts.cancelled++
    } else {
      const bkt = bucket(b.status)
      if (bkt in counts) counts[bkt as keyof typeof counts]++
      if (outstandingOn(b) > 0) counts.due++
    }
  })

  // Collect all unique venues
  const venueMap = new Map<number, string>()
  businesses.forEach((b) => { if (b.id && b.name) venueMap.set(b.id, b.name) })
  rows.forEach((b) => {
    const bid = b.bookingDetails?.[0]?.businessId ?? b.bookingDetails?.[0]?.business?.id
    const bname = b.bookingDetails?.[0]?.business?.name
    if (bid && bname && !venueMap.has(bid)) venueMap.set(bid, bname)
  })
  const venueOpts = Array.from(venueMap.entries())
    .map(([id, name]) => `<option value="${id}">${escHtml(name)}</option>`)
    .join("")

  const tab = (f: string, label: string, dot: string, cnt: number, on = false) =>
    `<button class="tab${on ? " on" : ""}" data-f="${f}">${dot ? `<span class="dot ${dot}"></span> ` : ""}${label} <span class="cnt">${cnt}</span></button>`
  const body = rows.length ? rows.map(rowHtml).join("") : ""

  return `
  <div class="head">
    <div><h1>Bookings</h1><div class="sub">Saari shaadiyan aur events — <b>${total}</b> total${truncated ? ` (pehle ${rows.length} dikhaye)` : ""}.</div></div>
    <div class="head-actions">
      <button class="btn btn-ghost" data-act="export-table"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg> Export</button>
      <button class="btn btn-primary" data-booking-new><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg> Nayi booking</button>
    </div>
  </div>
  <div class="toolbar" style="display:flex;flex-direction:column;gap:12px;align-items:stretch">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div class="tabs" id="tabs" role="tablist" aria-label="Status filter">
        ${tab("all", "Sab", "", counts.all, true)}
        ${tab("confirmed", "Confirmed", "d-ok", counts.confirmed)}
        ${tab("pending", "Pending", "d-info", counts.pending)}
        ${tab("due", "Baqaya due", "d-warn", counts.due)}
        ${tab("done", "Ho gaya", "d-mut", counts.done)}
        ${tab("cancelled", "Cancelled", "d-bad", counts.cancelled)}
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <select id="filter-venue" class="f-select" title="Filter by Venue">
          <option value="all">🏢 Saare venues (All listings)</option>
          ${venueOpts}
        </select>
        <select id="filter-payment" class="f-select" title="Filter by Payment">
          <option value="all">💳 Saari payments (All)</option>
          <option value="paid">Poora mila (Paid)</option>
          <option value="partial">Baqaya (Partial)</option>
          <option value="unpaid">Unpaid / Pending</option>
        </select>
        <input type="date" id="filter-date" class="f-date" title="Filter by Event Date" />
        <label class="f-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><input id="booking-search-input" placeholder="Couple, phone ya booking #…" aria-label="Filter"/></label>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th style="width:36px;text-align:center"><input type="checkbox" id="booking-select-all" title="Select all" style="cursor:pointer;width:15px;height:15px;accent-color:var(--gold, #d97706)"/></th>
            <th>Couple &amp; event</th>
            <th>Taareekh</th>
            <th>Hall / Venue</th>
            <th class="r">Mehmaan</th>
            <th class="r">Amount</th>
            <th>Payment</th>
            <th>Status</th>
            <th style="text-align:right"></th>
          </tr>
        </thead>
        <tbody id="tbody">${body}</tbody>
      </table>
    </div>
    ${rows.length ? `<div class="tbl-foot"><span id="rowcount">${rows.length} bookings dikhaye ja rahe hain</span></div>` : `<div class="empty">Abhi koi booking nahi. Nayi booking add karein.</div>`}
  </div>
  <div id="booking-bulk-bar" style="display:none;position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--surface, #18181b);color:var(--ink, #fff);padding:8px 18px;border-radius:9999px;border:1px solid var(--border-2, #3f3f46);box-shadow:0 12px 30px rgba(0,0,0,0.4);z-index:9999;align-items:center;gap:12px;font-size:13px;font-family:inherit">
    <span id="booking-bulk-count" style="font-weight:600;color:var(--gold, #d97706)">0 selected</span>
    <span style="opacity:0.3">|</span>
    <select id="booking-bulk-status-select" style="background:var(--surface-2, #27272a);color:var(--ink, #fff);border:1px solid var(--border-2, #3f3f46);border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer">
      <option value="">Status badlein...</option>
      <option value="Confirmed">Confirmed</option>
      <option value="Pending">Pending</option>
      <option value="Completed">Ho gaya (Completed)</option>
      <option value="Cancelled">Cancelled</option>
    </select>
    <button class="btn btn-danger sm" data-bulk-delete-btn style="background:#ef4444;color:#fff;font-weight:600;padding:5px 12px;border-radius:6px;border:none;cursor:pointer;font-size:12px;display:inline-flex;align-items:center;gap:5px">🗑️ Delete</button>
    <button class="btn btn-ghost sm" data-bulk-export-btn style="background:transparent;color:var(--ink-2, #d4d4d8);padding:4px 8px;border:none;cursor:pointer;font-size:12px">📥 Export</button>
    <button class="btn btn-ghost sm" data-bulk-clear-btn style="background:transparent;color:var(--bad, #f87171);padding:4px 8px;border:none;cursor:pointer;font-size:12px">✕ Clear</button>
  </div>`
}

export function BookingsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/bookings", crumbBold: "Bookings", crumbSub: "Saari shaadiyan", extraCss: EXTRA_CSS })
  const qc = useQueryClient()
  const searchParams = useSearchParams()
  const { business, businesses } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizId = activeBusinessId ?? (business as { id?: number } | null)?.id ?? null
  const bizRef = React.useRef(bizId); bizRef.current = bizId
  const bizList = React.useMemo(() => ((businesses ?? []) as { id: number; name?: string | null }[]).map((b) => ({ id: b.id, name: b.name })), [businesses])
  const bizListRef = React.useRef(bizList); bizListRef.current = bizList

  const { data, isError, isLoading } = useFetchAllPages<BookingData>({
    endpoint: "/api/v1/bookings",
    queryKey: ["bookings-artifact"],
    Params: { sortBy: "bookingDate", sortOrder: "desc" },
  })
  const rows: BookingData[] = React.useMemo(() => data?.data?.data ?? [], [data])
  const total: number = data?.data?.filters?.total ?? rows.length
  const truncated = total > rows.length
  const rowsByIdRef = React.useRef(new Map<number, BookingData>())
  rowsByIdRef.current = new Map(rows.map((b) => [Number(b.id), b]))
  const selectedBookingIds = React.useRef<Set<number>>(new Set())

  const autoOpened = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || autoOpened.current) return
    const nd = searchParams?.get("new")
    if (!nd) return
    if (!bizListRef.current.length) return
    autoOpened.current = true
    openBookingForm(s, { prefill: { bookingDate: nd }, businesses: bizListRef.current, activeBiz: bizRef.current, onSaved: () => qc.invalidateQueries({ queryKey: ["/api/v1/bookings"] }) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, searchParams, bizList.length])

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
        wwc.innerHTML = buildContent(rows, total, truncated, bizListRef.current)
        initTablePager(s, { pageSize: 25, noun: "bookings" })
        registerTableExport(s, (trs) => ({ head: BOOKING_EXPORT_HEAD, rows: trs.map((tr) => rowsByIdRef.current.get(Number(tr.dataset.bkId))).filter((b): b is BookingData => !!b).map(bookingExportRow) }))
        restoreTab(s, "tab:bookings", (f) => setPagerFilter(s, (tr) => f === "all" || (f === "due" ? tr.dataset.due === "1" : tr.dataset.status === f)))
      }
    }

    const updateBulkBar = () => {
      const bar = s.getElementById("booking-bulk-bar")
      const countEl = s.getElementById("booking-bulk-count")
      const selectAll = s.getElementById("booking-select-all") as HTMLInputElement | null
      const count = selectedBookingIds.current.size
      if (bar) bar.style.display = count > 0 ? "flex" : "none"
      if (countEl) countEl.textContent = `${count} selected`
      const checks = s.querySelectorAll<HTMLInputElement>(".booking-row-check")
      let allChecked = checks.length > 0
      checks.forEach((chk) => {
        const id = Number(chk.dataset.id)
        chk.checked = selectedBookingIds.current.has(id)
        if (!chk.checked) allChecked = false
      })
      if (selectAll) selectAll.checked = allChecked && checks.length > 0
    }

    const runFilters = () => {
      const activeTab = (s.querySelector("#tabs .tab.on") as HTMLElement)?.dataset.f || "all"
      const venueVal = (s.getElementById("filter-venue") as HTMLSelectElement | null)?.value || "all"
      const payVal = (s.getElementById("filter-payment") as HTMLSelectElement | null)?.value || "all"
      const dateVal = (s.getElementById("filter-date") as HTMLInputElement | null)?.value || ""

      setPagerFilter(s, (tr) => {
        if (activeTab !== "all") {
          if (activeTab === "due" && tr.dataset.due !== "1") return false
          if (activeTab !== "due" && tr.dataset.status !== activeTab) return false
        }
        if (venueVal !== "all" && tr.dataset.bizId !== venueVal) return false
        if (payVal !== "all" && tr.dataset.pay !== payVal) return false
        if (dateVal && tr.dataset.date !== dateVal) return false
        return true
      })
      updateBulkBar()
    }

    if (!tabsBound.current) {
      tabsBound.current = true
      const closePop = () => s.querySelector(".rowpop")?.remove()

      s.addEventListener("change", async (e) => {
        const t = e.target as HTMLElement
        if (t.id === "filter-venue" || t.id === "filter-payment" || t.id === "filter-date") {
          runFilters()
          return
        }
        if (t.id === "booking-select-all") {
          const checked = (t as HTMLInputElement).checked
          const checks = s.querySelectorAll<HTMLInputElement>(".booking-row-check")
          checks.forEach((chk) => {
            const tr = chk.closest("tr")
            if (tr && !tr.hidden) {
              const id = Number(chk.dataset.id)
              if (checked) selectedBookingIds.current.add(id)
              else selectedBookingIds.current.delete(id)
              chk.checked = checked
            }
          })
          updateBulkBar()
          return
        }
        if (t.classList.contains("booking-row-check")) {
          const chk = t as HTMLInputElement
          const id = Number(chk.dataset.id)
          if (chk.checked) selectedBookingIds.current.add(id)
          else selectedBookingIds.current.delete(id)
          updateBulkBar()
          return
        }
        if (t.id === "booking-bulk-status-select") {
          const sel = t as HTMLSelectElement
          const newStatus = sel.value
          if (!newStatus || selectedBookingIds.current.size === 0) return
          const ids = Array.from(selectedBookingIds.current)
          try {
            await BookingsAPI.bulkUpdateStatus(ids, newStatus)
            toast.success(`${ids.length} bookings status badal diya gaya: ${newStatus}`)
            selectedBookingIds.current.clear()
            sel.value = ""
            updateBulkBar()
            qc.invalidateQueries({ queryKey: ["bookings-artifact"] })
            qc.invalidateQueries({ queryKey: ["/api/v1/bookings"] })
          } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Status nahi badla")
            sel.value = ""
          }
          return
        }
      })

      s.addEventListener("click", async (e) => {
        const t = e.target as HTMLElement
        if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["/api/v1/bookings"] }); qc.invalidateQueries({ queryKey: ["bookings-artifact"] }); return }

        // Bulk clear
        if (t.closest("[data-bulk-clear-btn]")) {
          selectedBookingIds.current.clear()
          updateBulkBar()
          return
        }

        // Bulk delete
        if (t.closest("[data-bulk-delete-btn]")) {
          const count = selectedBookingIds.current.size
          if (count === 0) return
          openConfirm(s, {
            title: "Selected bookings delete karein?",
            message: `${count} bookings system se delete ho jayengi. Wapas nahi laya ja sakta. Kya aap waqai delete karna chahte hain?`,
            danger: true,
            confirmLabel: `Haan, ${count} bookings delete karein`,
            onConfirm: async () => {
              try {
                const ids = Array.from(selectedBookingIds.current)
                await BookingsAPI.bulkDelete(ids)
                toast.success(`${count} bookings kamiyabi se delete ho gayin`)
                selectedBookingIds.current.clear()
                updateBulkBar()
                qc.invalidateQueries({ queryKey: ["bookings-artifact"] })
                qc.invalidateQueries({ queryKey: ["/api/v1/bookings"] })
              } catch (err: unknown) {
                toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Delete fail ho gaya")
              }
            },
          })
          return
        }

        // Bulk export
        if (t.closest("[data-bulk-export-btn]")) {
          const selBookings = rows.filter((b) => selectedBookingIds.current.has(Number(b.id)))
          if (selBookings.length === 0) { toast.info("Pehle bookings select karein"); return }
          const exportRows = selBookings.map(bookingExportRow)
          const csv = [BOOKING_EXPORT_HEAD, ...exportRows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `bookings-selected-${new Date().toISOString().slice(0, 10)}.csv`
          a.click()
          URL.revokeObjectURL(url)
          toast.success(`${selBookings.length} bookings export ho gayin`)
          return
        }

        // ── row kebab: quick actions popover ──
        const km = t.closest(".rowmenu") as HTMLElement | null
        if (km) {
          const wasOpen = !!s.querySelector(".rowpop"); closePop()
          if (wasOpen) return
          const id = km.dataset.bk, nm = km.dataset.bkName || "", dueAmt = Number(km.dataset.bkDue) || 0, ph = km.dataset.bkPhone || "", canDone = km.dataset.bkDone !== undefined
          const r = km.getBoundingClientRect()
          const pop = document.createElement("div"); pop.className = "rowpop"
          pop.style.cssText = `position:fixed;top:${r.bottom + 5}px;left:${Math.max(8, r.right - 194)}px;z-index:90;min-width:186px;background:var(--surface);border:1px solid var(--border-2);border-radius:11px;box-shadow:var(--shadow-md);padding:5px;display:flex;flex-direction:column;gap:1px`
          const bstyle = "display:flex;align-items:center;gap:9px;width:100%;text-align:left;border:0;background:transparent;color:var(--ink);padding:8px 9px;border-radius:7px;font-size:12.5px;font-weight:500;cursor:pointer"
          const isvg = (p: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;color:var(--ink-3);flex:none">${p}</svg>`
          pop.innerHTML =
            (dueAmt > 0 ? `<button data-pop-rec data-stop style="${bstyle}">${isvg('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.4a2 2 0 0 1 2-1.4h1.2a1.8 1.8 0 0 1 0 3.6h-1.4a1.8 1.8 0 0 0 0 3.6H13a2 2 0 0 0 2-1.4"/>')} Payment record</button>` : "")
            + (ph ? `<button data-pop-call data-stop style="${bstyle}">${isvg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>')} Call</button>` : "")
            + (ph ? `<button data-pop-wa data-stop style="${bstyle}">${isvg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')} WhatsApp</button>` : "")
            + (canDone ? `<button data-pop-done data-stop style="${bstyle}">${isvg('<path d="M20 6 9 17l-5-5"/>')} Mark completed</button>` : "")
            + `<button data-nav-btn="/dashboard/bookings/${id}" data-stop style="${bstyle}">${isvg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>')} Booking kholein</button>`
            + `<button data-pop-del data-stop style="${bstyle};color:var(--bad, #ef4444)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;color:var(--bad, #ef4444);flex:none"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg> Booking delete karein</button>`
          s.appendChild(pop)
          pop.querySelector("[data-pop-rec]")?.addEventListener("click", () => { closePop(); openRecordPaymentDrawer(s, { bookingId: Number(id), customerName: nm, due: dueAmt, onSaved: () => { qc.invalidateQueries({ queryKey: ["/api/v1/bookings"] }); qc.invalidateQueries({ queryKey: ["bookings-artifact"] }) } }) })
          pop.querySelector("[data-pop-done]")?.addEventListener("click", () => {
            closePop()
            openConfirm(s, {
              title: "Event ho gaya?",
              message: "Booking mukammal ho jayegi. Baqaya raqam khuli rehti hai — ye sirf event ka record band karta hai. Wapas nahi badla ja sakta.",
              confirmLabel: "Haan, band karein",
              danger: false,
              onConfirm: async () => {
                try { await BookingsAPI.markCompleted(Number(id)); toast.success("Booking mukammal ho gayi"); void invalidateMoney({ bookingId: Number(id) }, qc); qc.invalidateQueries({ queryKey: ["/api/v1/bookings"] }); qc.invalidateQueries({ queryKey: ["bookings-artifact"] }) }
                catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Band nahi hui") }
              },
            })
          })
          pop.querySelector("[data-pop-del]")?.addEventListener("click", () => {
            closePop()
            openConfirm(s, {
              title: "Booking delete karein?",
              message: `Booking #${id} (${nm || "Customer"}) system se mukammal delete ho jayegi. Kya aap waqai delete karna chahte hain?`,
              danger: true,
              confirmLabel: "Haan, delete karein",
              onConfirm: async () => {
                try {
                  await BookingsAPI.delete(Number(id))
                  toast.success("Booking kamiyabi se delete ho gayi")
                  selectedBookingIds.current.delete(Number(id))
                  updateBulkBar()
                  void invalidateMoney({ bookingId: Number(id) }, qc)
                  qc.invalidateQueries({ queryKey: ["/api/v1/bookings"] })
                  qc.invalidateQueries({ queryKey: ["bookings-artifact"] })
                } catch (err: unknown) {
                  toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Booking delete nahi hui")
                }
              },
            })
          })
          pop.querySelector("[data-pop-call]")?.addEventListener("click", () => { closePop(); window.location.href = "tel:" + ph.replace(/\s/g, "") })
          pop.querySelector("[data-pop-wa]")?.addEventListener("click", () => { closePop(); const digits = ph.replace(/[^0-9]/g, "").replace(/^0/, "92"); const text = dueAmt > 0 ? `?text=${encodeURIComponent(`Assalam o Alaikum ${nm || "ji"}, aap ki baqaya Rs ${pkNum(dueAmt)} hai. Bara-e-meherbani event se pehle ada kar dein. Shukriya.`)}` : ""; window.open(`https://wa.me/${digits}${text}`, "_blank", "noopener") })
          return
        }
        if (s.querySelector(".rowpop") && !t.closest(".rowpop")) closePop()

        // ── offline booking drawer ──
        if (t.closest("[data-booking-new]")) { openBookingForm(s, { businesses: bizListRef.current, activeBiz: bizRef.current, onSaved: () => { qc.invalidateQueries({ queryKey: ["/api/v1/bookings"] }); qc.invalidateQueries({ queryKey: ["bookings-artifact"] }) } }); return }

        const btn = t.closest(".tab") as HTMLElement | null
        if (!btn) return
        const tabsEl = s.getElementById("tabs"); if (!tabsEl) return
        tabsEl.querySelectorAll(".tab").forEach((x) => x.classList.remove("on"))
        btn.classList.add("on")
        const f = btn.dataset.f || "all"
        savePref("tab:bookings", f)
        runFilters()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, isError, isLoading, rows])

  return <div ref={hostRef} />
}

export default BookingsArtifact
