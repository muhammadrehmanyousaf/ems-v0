"use client"

/**
 * Calendar — pixel-faithful to the design sample (docs/design-samples/calendar.html):
 * Month / Week / Agenda views (toggle) · status filter tabs · per-day ＋ (add) and
 * block icons with a real block/unblock (BlockedDatesAPI) and blocked-date visual ·
 * right-rail day panel with per-event actions · month summary · legend.
 * Wired to the REAL /api/v1/bookings + blocked dates through the shared shell.
 */

import * as React from "react"
import { useFetchData } from "@/hooks/use-fetch-data"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { spaceNameOf } from "@/lib/utils/booking-space"
import { bookingStatusLabel } from "@/lib/booking-status-label"
import { toast } from "sonner"
import { BlockedDatesAPI, type BlockedDate } from "@/lib/api/dashboard"
import { BusinessAvailabilityAPI, SlotBlocksAPI, type SlotAvailabilityRow, type SlotBlock } from "@/lib/api/businessAvailability"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useBusiness } from "@/context/BusinessContext"
import { waDigits } from "@/components/dashboard/mainScreens/leads/artifact/leads-artifact"
import type { BookingData } from "@/lib/dashboard-types"
import { useArtifactShell, escHtml, openDrawer } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const WD = ["Itwar", "Peer", "Mangal", "Budh", "Jumeraat", "Juma", "Hafta"]
const MO = ["Janwari", "Farwari", "March", "April", "Mai", "Joon", "Julai", "Agast", "Sitambar", "Aktoobar", "Navambar", "Disambar"]
const pad = (n: number) => String(n).padStart(2, "0")
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseKey = (s: string) => { const [y, m, dd] = s.split("-").map(Number); return new Date(y, m - 1, dd) }
const evtTone = (s?: string) => { const v = (s || "").toLowerCase(); if (v.includes("confirm")) return { cls: "t-confirmed", tab: "confirmed" }; if (v.includes("complete")) return { cls: "t-done", tab: "done" }; if (v.includes("cancel")) return { cls: "t-cancel", tab: "cancel" }; return { cls: "t-pending", tab: "pending" } }
const bdate = (b: BlockedDate) => ((b as unknown as { date?: string; blockedDate?: string }).date || (b as unknown as { blockedDate?: string }).blockedDate || "")

const EXTRA_CSS = String.raw`
.calbar{ display:flex; align-items:center; gap:12px; margin-bottom:14px; flex-wrap:wrap; }
.monthnav{ display:flex; align-items:center; gap:6px; } .navb{ width:34px; height:34px; border-radius:9px; border:1px solid var(--border); background:var(--surface); display:grid; place-items:center; color:var(--ink-2); } .navb:hover{ background:var(--surface-3); color:var(--ink); } .navb svg{ width:16px; height:16px; }
.mtitle{ font-size:16px; font-weight:600; letter-spacing:-.02em; min-width:150px; text-align:center; } .today-btn{ height:34px; padding:0 13px; border-radius:9px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink); font-size:12.5px; font-weight:600; } .today-btn:hover{ background:var(--surface-3); }
.seg{ display:inline-flex; background:var(--surface-3); border:1px solid var(--border); border-radius:9px; padding:2px; gap:1px; margin-left:auto; } .seg button{ display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:var(--ink-3); padding:0 11px; border-radius:7px; border:0; background:transparent; height:30px; } .seg button.on{ background:var(--surface); color:var(--ink); box-shadow:var(--shadow-xs); }
.callayout{ display:grid; grid-template-columns:minmax(0,1fr) 322px; gap:14px; align-items:start; } @media (max-width:1140px){ .callayout{ grid-template-columns:1fr; } }
.cal{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); overflow:hidden; }
.cal-dow{ display:grid; grid-template-columns:repeat(7,1fr); background:var(--surface-2); border-bottom:1px solid var(--border); } .cal-dow span{ padding:9px 10px; font-size:11px; font-weight:600; letter-spacing:.02em; text-transform:uppercase; color:var(--ink-3); }
.cal-grid{ display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:1px; background:var(--border); }
.cell{ position:relative; background:var(--surface); min-width:0; min-height:112px; padding:6px 7px 8px; display:flex; flex-direction:column; cursor:pointer; transition:background .1s; } .cell:hover{ background:var(--surface-2); }
.cell.out{ background:var(--surface-2); } .cell.today{ background:var(--accent-wash); } .cell.sel{ box-shadow:inset 0 0 0 2px var(--accent-line); }
.cell.blocked{ background-image:repeating-linear-gradient(45deg,transparent 0 7px,var(--surface-3) 7px 8px); }
.cell-hd{ display:flex; align-items:center; justify-content:space-between; gap:4px; }
.dnum{ font-size:12px; font-weight:600; color:var(--ink-2); width:23px; height:23px; display:grid; place-items:center; border-radius:7px; font-variant-numeric:tabular-nums; } .cell.out .dnum{ color:var(--ink-4); font-weight:500; } .cell.today .dnum{ background:var(--accent); color:var(--on-accent); }
.cell-tools{ display:flex; gap:3px; opacity:0; pointer-events:none; transition:opacity .12s; } .cell:hover .cell-tools{ opacity:1; pointer-events:auto; }
.ct-btn{ width:23px; height:23px; border-radius:6px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-3); display:grid; place-items:center; } .ct-btn:hover{ background:var(--surface-3); color:var(--ink); } .ct-btn svg{ width:13px; height:13px; } .ct-blk:hover{ color:var(--bad); border-color:var(--bad); } .ct-blk.on{ color:var(--bad); border-color:var(--bad); background:var(--bad-wash); opacity:1; }
.evs{ display:flex; flex-direction:column; gap:3px; margin-top:5px; min-width:0; overflow:hidden; }
.ev{ display:block; background:var(--evt-bg); border-left:2px solid var(--evt); color:var(--evt-ink); border-radius:5px; padding:2px 6px; font-size:11px; font-weight:500; line-height:1.5; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.t-confirmed{ --evt:var(--accent); --evt-ink:var(--accent-ink); --evt-bg:var(--accent-wash); } .t-pending{ --evt:var(--info); --evt-ink:var(--info); --evt-bg:var(--info-wash); } .t-done{ --evt:var(--ok); --evt-ink:var(--ok); --evt-bg:var(--ok-wash); } .t-cancel{ --evt:var(--bad); --evt-ink:var(--bad); --evt-bg:var(--bad-wash); }
.ev-more{ font-size:10.5px; font-weight:600; color:var(--ink-3); padding:1px 5px; align-self:flex-start; }
.blk-note{ display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:600; color:var(--bad); background:var(--bad-wash); border-radius:5px; padding:2px 6px; align-self:flex-start; margin-top:auto; } .blk-note svg{ width:11px; height:11px; }
.cellmenu{ position:fixed; z-index:60; min-width:196px; background:var(--surface); border:1px solid var(--border-2); border-radius:11px; box-shadow:var(--shadow-md); padding:5px; }
.cm-date{ font-size:11px; color:var(--ink-3); font-weight:600; padding:6px 9px; border-bottom:1px solid var(--border); margin-bottom:4px; }
.cm-item{ display:flex; align-items:center; gap:10px; width:100%; padding:9px; border-radius:8px; border:0; background:transparent; color:var(--ink); font-size:12.5px; font-weight:500; text-align:left; } .cm-item:hover{ background:var(--surface-3); } .cm-item svg{ width:15px; height:15px; color:var(--ink-3); flex:none; } .cm-item.danger{ color:var(--bad); } .cm-item.danger svg{ color:var(--bad); } .cm-sep{ height:1px; background:var(--border); margin:4px 6px; }
.rail{ display:flex; flex-direction:column; gap:14px; position:sticky; top:74px; }
.rcard{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); padding:16px; } .rcard h3{ font-size:11px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; color:var(--ink-3); margin-bottom:12px; }
.rday{ display:flex; align-items:flex-end; gap:11px; } .rday .rd-num{ font-size:32px; font-weight:660; letter-spacing:-.03em; line-height:.9; } .rday .rd-mo{ font-size:12.5px; color:var(--ink-2); font-weight:600; } .rday .rd-wd{ font-size:12px; color:var(--ink-3); } .rday .rd-cnt{ margin-left:auto; font-size:11px; font-weight:600; color:var(--ink-2); background:var(--surface-3); border:1px solid var(--border); border-radius:20px; padding:2px 9px; }
.blk-banner{ display:flex; align-items:center; gap:8px; font-size:11.5px; font-weight:600; color:var(--bad); background:var(--bad-wash); border-radius:9px; padding:9px 11px; margin-top:12px; } .blk-banner svg{ width:15px; height:15px; flex:none; } .blk-un{ margin-left:auto; font-size:11.5px; font-weight:700; color:var(--bad); background:transparent; border:0; text-decoration:underline; }
.dalist{ margin-top:14px; display:flex; flex-direction:column; gap:9px; }
.da{ display:flex; flex-direction:column; padding:11px 12px; border-radius:10px; border:1px solid var(--border); background:var(--surface-2); border-left:3px solid var(--evt,var(--accent)); } .da-top{ display:flex; gap:11px; } .da .daname{ font-weight:600; font-size:12.5px; } .da .dameta{ font-size:11px; color:var(--ink-3); margin-top:2px; }
.da-actions{ display:flex; gap:6px; margin-top:10px; } .da-btn{ display:inline-flex; align-items:center; justify-content:center; gap:5px; flex:1; height:32px; padding:0 11px; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink); font-size:12px; font-weight:600; } .da-btn:hover{ background:var(--surface-3); } .da-btn svg{ width:14px; height:14px; color:var(--ink-3); }
.da-ic{ width:32px; height:32px; flex:none; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; } .da-ic:hover{ background:var(--surface-3); color:var(--ink); } .da-ic svg{ width:15px; height:15px; }
.da-empty{ margin-top:14px; padding:22px 12px; text-align:center; color:var(--ink-3); font-size:12px; border:1px dashed var(--border-2); border-radius:10px; }
.msum{ display:grid; grid-template-columns:1fr 1fr; gap:9px; } .ms{ border:1px solid var(--border); border-radius:10px; padding:11px 12px; background:var(--surface-2); } .ms .v{ font-size:19px; font-weight:660; letter-spacing:-.02em; } .ms .l{ font-size:11px; color:var(--ink-3); margin-top:2px; } .ms.acc .v{ color:var(--accent-ink); }
.rlegend{ display:flex; flex-direction:column; gap:9px; } .lg{ display:flex; align-items:center; gap:9px; font-size:12px; color:var(--ink-2); } .lg i{ width:9px; height:9px; border-radius:3px; flex:none; }
.wkcard{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); overflow:hidden; } .wkwrap{ overflow-x:auto; }
.wk{ display:grid; grid-template-columns:56px repeat(7,minmax(118px,1fr)); grid-template-rows:52px repeat(10,56px); min-width:900px; }
.wk-corner{ border-right:1px solid var(--border); border-bottom:1px solid var(--border); background:var(--surface-2); }
.wk-dh{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; border-right:1px solid var(--border); border-bottom:1px solid var(--border); background:var(--surface-2); } .wk-dh .dw{ font-size:10.5px; text-transform:uppercase; letter-spacing:.03em; color:var(--ink-3); font-weight:600; } .wk-dh .dd{ font-size:14px; font-weight:600; width:26px; height:26px; display:grid; place-items:center; border-radius:8px; font-variant-numeric:tabular-nums; } .wk-dh.today .dd{ background:var(--accent); color:var(--on-accent); }
.wk-hour{ grid-column:1; font-size:10.5px; color:var(--ink-3); font-weight:500; text-align:right; padding-right:8px; border-right:1px solid var(--border); position:relative; } .wk-hour span{ position:absolute; right:8px; top:-7px; background:var(--surface); padding:0 2px; }
.wk-slot{ border-right:1px solid var(--border); border-bottom:1px solid var(--border); }
.wkev{ margin:2px 3px; border-radius:8px; padding:5px 8px; background:var(--evt-bg); border-left:3px solid var(--evt); color:var(--evt-ink); font-size:11px; overflow:hidden; z-index:2; box-shadow:var(--shadow-xs); cursor:pointer; } .wkev b{ display:block; font-weight:700; font-size:11.5px; } .wkev .wsub{ opacity:.85; font-weight:500; margin-top:1px; }
.agenda{ display:flex; flex-direction:column; gap:20px; max-width:820px; } .ag-gh{ display:flex; align-items:baseline; gap:10px; margin-bottom:10px; } .ag-gh .agd{ font-size:15px; font-weight:660; letter-spacing:-.02em; } .ag-gh .agw{ font-size:12.5px; color:var(--ink-3); } .ag-gh.today .agd{ color:var(--accent-ink); } .ag-gh.today .tdchip{ font-size:10px; font-weight:700; color:var(--on-accent); background:var(--accent); border-radius:5px; padding:1px 6px; } .ag-gh .agc{ margin-left:auto; font-size:11.5px; color:var(--ink-3); font-weight:600; }
.ag-card{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); overflow:hidden; } .ag-row{ display:flex; align-items:center; gap:15px; padding:13px 16px; border-bottom:1px solid var(--border); border-left:3px solid var(--evt); cursor:pointer; } .ag-row:last-child{ border-bottom:0; } .ag-row:hover{ background:var(--surface-3); }
.ag-icon{ width:34px; height:34px; border-radius:9px; display:grid; place-items:center; background:var(--evt-bg); color:var(--evt-ink); flex:none; font-weight:700; font-size:12px; } .ag-main{ flex:1; min-width:0; } .ag-name{ font-weight:600; font-size:13.5px; } .ag-sub{ font-size:11.5px; color:var(--ink-3); margin-top:2px; }
.sd-venue{ margin-bottom:14px; } .sd-venue .sd-vlbl{ display:block; font-size:11px; font-weight:600; letter-spacing:.03em; text-transform:uppercase; color:var(--ink-3); margin-bottom:6px; }
.sd-venue .sd-vsel{ width:100%; height:40px; border:1px solid var(--border-2); border-radius:9px; background:var(--surface-2); color:var(--ink); padding:0 11px; font:inherit; font-size:13px; font-weight:600; outline:none; } .sd-venue .sd-vsel:focus{ border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-wash); }
.sd-day{ display:flex; align-items:center; gap:11px; padding:12px 13px; border:1px solid var(--border); border-radius:11px; background:var(--surface-2); margin-bottom:14px; } .sd-day.on{ background:var(--bad-wash); border-color:transparent; } .sd-day .sd-dico{ width:34px; height:34px; border-radius:9px; background:var(--surface); border:1px solid var(--border); display:grid; place-items:center; color:var(--bad); flex:none; } .sd-day .sd-dico svg{ width:16px; height:16px; } .sd-day .sd-dmain{ flex:1; min-width:0; } .sd-day .sd-dt{ font-weight:600; font-size:13px; } .sd-day .sd-dm{ font-size:11.5px; color:var(--ink-3); margin-top:1px; }
.sd-note{ font-size:11px; font-weight:600; letter-spacing:.03em; text-transform:uppercase; color:var(--ink-3); margin:4px 0 9px; }
.sd-slot{ display:flex; align-items:center; gap:11px; padding:11px 12px; border:1px solid var(--border); border-radius:11px; margin-bottom:9px; } .sd-slot.blk{ background:var(--bad-wash); border-color:transparent; } .sd-slot.booked{ background:var(--accent-wash); border-color:var(--accent-line); } .sd-slot.dim{ opacity:.5; }
.sd-sico{ width:32px; height:32px; border-radius:8px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--ink-2); flex:none; font-size:11px; font-weight:700; }
.sd-smain{ flex:1; min-width:0; } .sd-snm{ font-weight:600; font-size:13px; display:flex; align-items:center; gap:7px; } .sd-ssub{ font-size:11.5px; color:var(--ink-3); margin-top:2px; }
.sd-badge{ font-size:10px; font-weight:700; padding:2px 7px; border-radius:20px; } .sd-badge.free{ color:var(--ok); background:var(--ok-wash); } .sd-badge.full{ color:var(--warn); background:var(--warn-wash); } .sd-badge.booked{ color:var(--accent-ink); background:var(--accent-wash); } .sd-badge.blkd{ color:var(--bad); background:var(--bad-wash); }
.sd-act{ height:32px; padding:0 12px; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink); font-size:12px; font-weight:600; flex:none; } .sd-act:hover{ background:var(--surface-3); } .sd-act.danger{ color:var(--bad); border-color:var(--bad); } .sd-act.danger:hover{ background:var(--bad-wash); } .sd-act:disabled{ opacity:.5; }
.sd-empty{ padding:26px 14px; text-align:center; color:var(--ink-3); font-size:12.5px; border:1px dashed var(--border-2); border-radius:11px; }
.sd-hint{ font-size:11.5px; color:var(--ink-3); line-height:1.5; margin-top:6px; }
`

interface Evt { key: string; id: number; name: string; status: string; hall: string; guests: string; hour: number; phone: string }
const chev = (d: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${d}"/></svg>`
const banIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>`
const hhmm = (t?: string) => { if (!t) return ""; const [h, m] = String(t).split(":").map(Number); if (Number.isNaN(h)) return String(t); const ap = h >= 12 ? "PM" : "AM"; return `${(h % 12) || 12}:${String(m || 0).padStart(2, "0")} ${ap}` }
const longDate = (k: string) => { const d = parseKey(k); return `${d.getDate()} ${MO[d.getMonth()]}, ${WD[d.getDay()]}` }

/**
 * The slot-block drawer body for one date.
 *
 * Two layers, deliberately kept distinct because they enforce differently:
 *   • Poora din band  → VendorBlockedDate (BlockedDatesAPI). Blocks EVERY
 *     booking on the date, slot-based or not. The proven whole-day leave.
 *   • Per-slot band   → BusinessSlotBlock (SlotBlocksAPI). Blocks just that
 *     slot's bookings; the day's other slots stay open. Enforced at
 *     booking-create via slotService.assertSlotAvailable.
 * When the whole day is blocked the per-slot rows are dimmed — they are moot.
 */
type BizLite = { id: number; name?: string | null }
function slotDrawerBody(k: string, slots: SlotAvailabilityRow[], blocks: SlotBlock[], wholeDayBlocked: boolean, venues: BizLite[], selectedVenue: number): string {
  const blockIdOf = (tid: number) => blocks.find((b) => Number(b.slotTemplateId) === Number(tid))?.id ?? null
  const runs = slots.filter((s) => s.runsThisWeekday !== false)
  // Slots + blocks are per-venue. When the vendor has more than one venue (or is
  // viewing "all venues"), let them pick WHICH venue's slots to manage here —
  // otherwise "block" has no venue to act on.
  const venuePick = venues.length > 1
    ? `<div class="sd-venue"><label class="sd-vlbl">Kaunsi venue</label><select class="sd-vsel" data-slot-venue>${venues.map((v) => `<option value="${v.id}"${v.id === selectedVenue ? " selected" : ""}>${escHtml(v.name || `Venue #${v.id}`)}</option>`).join("")}</select></div>`
    : ""
  // A slot with a live booking/hold cannot be blocked — the backend refuses it
  // (BK-007). Surface that up-front instead of offering a button that fails.
  const anyBooked = runs.some((s) => !(s.blocked || blockIdOf(s.slotTemplateId) != null) && s.used > 0)
  const freeCount = runs.filter((s) => !(s.blocked || blockIdOf(s.slotTemplateId) != null) && s.used <= 0).length
  const dayRow = `<div class="sd-day ${wholeDayBlocked ? "on" : ""}">
    <span class="sd-dico">${banIcon}</span>
    <div class="sd-dmain"><div class="sd-dt">${wholeDayBlocked ? "Poora din band hai" : "Poora din khula hai"}</div><div class="sd-dm">${wholeDayBlocked ? "Is din koi nayi booking nahi le sakti" : anyBooked ? "Purani bookings rahengi — sirf nayi rukengi" : "Neeche se ek ek slot band karein, ya poora din"}</div></div>
    <button class="sd-act ${wholeDayBlocked ? "" : "danger"}" data-dayblock="${k}" data-dayblocked="${wholeDayBlocked ? "1" : "0"}">${wholeDayBlocked ? "Kholein" : "Poora din band"}</button>
  </div>`
  const slotRows = runs.length
    ? runs.map((s) => {
        const bid = blockIdOf(s.slotTemplateId)
        const isBlk = s.blocked || bid != null
        const booked = !isBlk && s.used > 0 // has a live booking/hold → not blockable
        const badge = isBlk
          ? `<span class="sd-badge blkd">Band</span>`
          : booked ? `<span class="sd-badge booked">${s.used} booking</span>` : `<span class="sd-badge free">Khali</span>`
        let btn: string
        if (wholeDayBlocked) btn = `<button class="sd-act" disabled>—</button>`
        else if (isBlk) btn = bid != null ? `<button class="sd-act" data-slotunblock="${bid}">Kholein</button>` : `<button class="sd-act" disabled>Band</button>`
        else if (booked) btn = `<button class="sd-act" disabled title="Is slot par booking hai — pehle usse cancel ya move karein">Booking hai</button>`
        else btn = `<button class="sd-act danger" data-slotblock="${s.slotTemplateId}" data-slotlabel="${escHtml(s.label)}">Band karein</button>`
        const sub = `${hhmm(s.startTime)}–${hhmm(s.endTime)} · ${s.used}/${s.capacity} booked${isBlk && s.blockReason ? ` · ${escHtml(String(s.blockReason).replace(/_/g, " "))}` : ""}`
        return `<div class="sd-slot ${isBlk ? "blk" : ""} ${booked ? "booked" : ""} ${wholeDayBlocked ? "dim" : ""}">
          <span class="sd-sico">${escHtml((s.label || "?").slice(0, 2).toUpperCase())}</span>
          <div class="sd-smain"><div class="sd-snm">${escHtml(s.label)} ${badge}</div><div class="sd-ssub">${sub}</div></div>
          ${btn}
        </div>`
      }).join("")
    : `<div class="sd-empty">Is din koi slot nahi chalta.<div class="sd-hint">Setup → Slots mein is din ke liye slot template banayein.</div></div>`
  const hint = wholeDayBlocked
    ? `Poora din band hai — kholne ke baad ek-ek slot manage kar saktay hain.`
    : anyBooked
      ? `Jis slot par booking hai woh band nahi ho sakti — pehle us booking ko cancel ya move karein. ${freeCount > 0 ? "Baaqi khali slots band ho saktay hain." : ""} Poora din band karne se purani bookings rahengi, sirf nayi rukengi.`
      : `Sirf khali slot band ho saktay hain. Booking wali slot band nahi hoti.`
  return `${venuePick}${dayRow}<div class="sd-note">Slots — ${longDate(k)}</div>${slotRows}<div class="sd-hint">${hint}</div>`
}

export function CalendarArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/calendar", crumbBold: "Calendar", crumbSub: "Saare events", extraCss: EXTRA_CSS })
  const activeBusinessId = useActiveBusinessId()
  const { businesses } = useBusiness()
  const bizList = React.useMemo(() => ((businesses ?? []) as { id: number; name?: string | null }[]).map((b) => ({ id: b.id, name: b.name })), [businesses])
  const qc = useQueryClient()
  const { data } = useFetchData({ endpoint: "/api/v1/bookings", queryKey: ["cal-art-bookings"], Params: { page: 1, limit: 100, sortBy: "bookingDate", sortOrder: "ASC" } })
  const blockedQ = useQuery({ queryKey: ["cal-art-blocked", activeBusinessId], queryFn: () => BlockedDatesAPI.getAll(undefined, activeBusinessId) })
  const rows: BookingData[] = data?.data?.data ?? []

  const events: Evt[] = React.useMemo(() => rows.map((b) => {
    const d = new Date(b.bookingDate)
    const hour = isNaN(d.getTime()) ? 20 : (d.getHours() || 20)
    return { key: isNaN(d.getTime()) ? "" : keyOf(d), id: b.id, name: b.customerName || "Booking", status: b.status || "", hall: spaceNameOf(b) || "", guests: b.guestCount != null ? String(b.guestCount) : "—", hour, phone: (b as { customerPhone?: string }).customerPhone || "" }
  }).filter((e) => e.key), [rows])
  const blockedSet = React.useMemo(() => new Set((blockedQ.data ?? []).map(bdate).filter(Boolean)), [blockedQ.data])
  // Live refs — the click listener binds once, so it must read the latest blocked
  // set + active venue from refs (not the stale first-render closure).
  const blockedSetRef = React.useRef(blockedSet); blockedSetRef.current = blockedSet
  const activeBizRef = React.useRef(activeBusinessId); activeBizRef.current = activeBusinessId
  const bizListRef = React.useRef(bizList); bizListRef.current = bizList
  const slotDrawerDateRef = React.useRef<string>("")
  const slotDrawerVenueRef = React.useRef<number | null>(null)

  const today = new Date(); const todayKey = keyOf(today)
  const [offset, setOffset] = React.useState(0)
  const [selKey, setSelKey] = React.useState(todayKey)
  const [view, setView] = React.useState<"month" | "week" | "agenda">("month")
  const [filter, setFilter] = React.useState("all")
  const baseM = today.getMonth() + offset
  const year = today.getFullYear() + Math.floor(baseM / 12); const month = ((baseM % 12) + 12) % 12
  const stateRef = React.useRef({ offset, selKey, view, filter }); stateRef.current = { offset, selKey, view, filter }

  const pass = (e: Evt) => filter === "all" || evtTone(e.status).tab === filter

  function monthView(): string {
    const byDay = new Map<string, Evt[]>()
    events.filter(pass).forEach((e) => { const a = byDay.get(e.key) || []; a.push(e); byDay.set(e.key, a) })
    const first = new Date(year, month, 1); const start = new Date(year, month, 1 - first.getDay())
    let cells = "", monthCount = 0, confirmed = 0
    for (let i = 0; i < 42; i++) {
      const dt = new Date(start); dt.setDate(start.getDate() + i)
      const k = keyOf(dt), out = dt.getMonth() !== month, isToday = k === todayKey, isSel = k === selKey, blk = blockedSet.has(k)
      const evs = byDay.get(k) || []
      if (!out) { monthCount += evs.length; confirmed += evs.filter((e) => evtTone(e.status).tab === "confirmed").length }
      let chips = ""
      evs.slice(0, 3).forEach((e) => { chips += `<div class="ev ${evtTone(e.status).cls}" title="${escHtml(e.name)} — kholein" data-nav-btn="/dashboard/bookings/${e.id}">${escHtml(e.name)}</div>` })
      if (evs.length > 3) chips += `<div class="ev-more">+${evs.length - 3} aur</div>`
      if (blk) chips += `<div class="blk-note">${chev("")}Band</div>`.replace(chev(""), `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>`)
      cells += `<div class="cell ${out ? "out" : ""} ${isToday ? "today" : ""} ${isSel ? "sel" : ""} ${blk ? "blocked" : ""}" data-day="${k}">
        <div class="cell-hd"><span class="dnum">${dt.getDate()}</span><span class="cell-tools"><button class="ct-btn ct-add" data-add="${k}" title="Add" aria-label="Add">${chev("M12 5v14M5 12h14")}</button><button class="ct-btn ct-blk ${blk ? "on" : ""}" data-slots="${k}" title="Slots band/khula" aria-label="Slots">${banIcon}</button></span></div>
        <div class="evs">${chips}</div></div>`
    }
    const dow = WD.map((d) => `<span>${d}</span>`).join("")
    return `<div class="cal"><div class="cal-dow">${dow}</div><div class="cal-grid">${cells}</div></div><aside class="rail">${rail(byDay, monthCount, confirmed)}</aside>`
  }

  function rail(byDay: Map<string, Evt[]>, monthCount: number, confirmed: number): string {
    const selD = parseKey(selKey); const selEvs = byDay.get(selKey) || []; const blk = blockedSet.has(selKey)
    const banner = blk ? `<div class="blk-banner"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>Yeh din block hai — nayi booking band.<button class="blk-un" data-block="${selKey}">Unblock</button></div>` : ""
    const agenda = selEvs.length ? `<div class="dalist">${selEvs.map((e) => `<div class="da ${evtTone(e.status).cls}"><div class="da-top"><div class="da-info"><div class="daname">${escHtml(e.name)}</div><div class="dameta">${escHtml(e.hall || "—")}${e.guests !== "—" ? " · " + escHtml(e.guests) + " mehmaan" : ""} · ${escHtml(bookingStatusLabel({ status: e.status }) || "")}</div></div></div><div class="da-actions"><button class="da-btn" data-nav-btn="/dashboard/bookings/${e.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg> Kholein</button>${e.phone ? `<button class="da-ic" data-tel="${escHtml(e.phone)}" title="Call"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg></button><button class="da-ic" data-wa="${escHtml(e.phone)}" title="WhatsApp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.2-5.6A8.4 8.4 0 1 1 21 11.5z"/></svg></button>` : ""}</div></div>`).join("")}</div>` : `<div class="da-empty">Is din koi event nahi.</div>`
    const slotBtn = `<button class="da-btn" data-slots="${selKey}" style="margin-top:12px;width:100%">${banIcon} Is din ke slots band/khula karein</button>`
    const dayCard = `<div class="rcard"><div class="rday"><span class="rd-num tnum">${selD.getDate()}</span><span><span class="rd-mo">${MO[selD.getMonth()]}</span><br><span class="rd-wd">${WD[selD.getDay()]}${selKey === todayKey ? " · Aaj" : ""}</span></span><span class="rd-cnt tnum">${selEvs.length} event${selEvs.length === 1 ? "" : "s"}</span></div>${banner}${agenda}${slotBtn}</div>`
    const sumCard = `<div class="rcard"><h3>${MO[month]} — ek nazar</h3><div class="msum"><div class="ms acc"><div class="v tnum">${monthCount}</div><div class="l">Kul events</div></div><div class="ms"><div class="v tnum">${confirmed}</div><div class="l">Confirmed</div></div></div></div>`
    const legend = `<div class="rcard"><h3>Rang</h3><div class="rlegend"><div class="lg"><i style="background:var(--accent)"></i>Confirmed</div><div class="lg"><i style="background:var(--info)"></i>Pending</div><div class="lg"><i style="background:var(--ok)"></i>Ho gaya</div><div class="lg"><i style="background:var(--bad)"></i>Cancelled</div></div></div>`
    return `${dayCard}${sumCard}${legend}`
  }

  function weekView(): string {
    const sel = parseKey(selKey); const start = new Date(sel); start.setDate(sel.getDate() - sel.getDay())
    const HS = 14, HE = 24
    let html = `<div class="wk-corner"></div>`
    for (let i = 0; i < 7; i++) { const dt = new Date(start); dt.setDate(start.getDate() + i); const k = keyOf(dt); html += `<div class="wk-dh ${k === todayKey ? "today" : ""}" style="grid-column:${i + 2};grid-row:1"><span class="dw">${WD[dt.getDay()]}</span><span class="dd tnum">${dt.getDate()}</span></div>` }
    for (let h = HS; h < HE; h++) { const row = h - HS + 2; const h12 = ((h + 11) % 12) + 1; html += `<div class="wk-hour" style="grid-row:${row}"><span>${h12} ${h < 12 ? "AM" : "PM"}</span></div>`; for (let i = 0; i < 7; i++) html += `<div class="wk-slot" style="grid-column:${i + 2};grid-row:${row}"></div>` }
    for (let i = 0; i < 7; i++) { const dt = new Date(start); dt.setDate(start.getDate() + i); const k = keyOf(dt); events.filter((e) => e.key === k && pass(e)).forEach((e) => { const rs = Math.max(2, Math.min(HE - HS + 1, e.hour - HS + 2)); const re = Math.min(HE - HS + 2, rs + 3); const h12 = ((e.hour + 11) % 12) + 1; html += `<div class="wkev ${evtTone(e.status).cls}" data-nav-btn="/dashboard/bookings/${e.id}" style="grid-column:${i + 2};grid-row:${rs}/${re}"><b>${escHtml(e.name)}</b><div class="wsub">${h12}${e.hour < 12 ? "am" : "pm"} · ${escHtml(e.hall || "")}</div></div>` }) }
    return `<div class="wkcard"><div class="wkwrap"><div class="wk">${html}</div></div></div>`
  }

  function agendaView(): string {
    const up = events.filter((e) => e.key >= todayKey && pass(e)).sort((a, b) => a.key.localeCompare(b.key))
    const groups: Record<string, Evt[]> = {}; up.forEach((e) => { (groups[e.key] = groups[e.key] || []).push(e) })
    const keys = Object.keys(groups).sort()
    if (!keys.length) return `<div class="da-empty">Koi aane wala event nahi.</div>`
    return `<div class="agenda">${keys.map((k) => { const dt = parseKey(k); const isT = k === todayKey; return `<div class="ag-group"><div class="ag-gh ${isT ? "today" : ""}"><span class="agd">${isT ? "Aaj" : `${dt.getDate()} ${MO[dt.getMonth()]}`}</span>${isT ? '<span class="tdchip">AAJ</span>' : ""}<span class="agw">${WD[dt.getDay()]}</span><span class="agc">${groups[k].length} event${groups[k].length === 1 ? "" : "s"}</span></div><div class="ag-card">${groups[k].map((e) => { const h12 = ((e.hour + 11) % 12) + 1; return `<div class="ag-row ${evtTone(e.status).cls}" data-nav-btn="/dashboard/bookings/${e.id}"><div class="ag-icon">${escHtml(e.name.slice(0, 2).toUpperCase())}</div><div class="ag-main"><div class="ag-name">${escHtml(e.name)}</div><div class="ag-sub">${h12}${e.hour < 12 ? "am" : "pm"} · ${escHtml(e.hall || "—")} · ${escHtml(bookingStatusLabel({ status: e.status }) || "")}</div></div></div>` }).join("")}</div></div>` }).join("")}</div>`
  }

  function render(): string {
    const head = `<div class="head"><div><h1>Calendar</h1><div class="sub">Saare events ek nazar — real bookings.</div></div><div class="head-actions"><button class="btn btn-primary" data-nav-btn="/dashboard/bookings">${chev("M12 5v14M5 12h14")} Naya event</button></div></div>`
    const title = view === "week" ? `${MO[parseKey(selKey).getMonth()]} — hafta` : view === "agenda" ? "Aane wale" : `${MO[month]} ${year}`
    const bar = `<div class="calbar"><div class="monthnav"><button class="navb" data-cal="prev">${chev("m15 18-6-6 6-6")}</button><div class="mtitle">${title}</div><button class="navb" data-cal="next">${chev("m9 18 6-6-6-6")}</button><button class="today-btn" data-cal="today">Aaj</button></div>
      <div class="seg"><button class="${view === "month" ? "on" : ""}" data-view="month">Month</button><button class="${view === "week" ? "on" : ""}" data-view="week">Week</button><button class="${view === "agenda" ? "on" : ""}" data-view="agenda">Agenda</button></div></div>`
    const tabs = `<div class="toolbar"><div class="tabs" id="tabs">${[["all", "Sab"], ["confirmed", "Confirmed"], ["pending", "Pending"], ["done", "Ho gaya"], ["cancel", "Cancelled"]].map(([f, l]) => `<button class="tab ${filter === f ? "on" : ""}" data-f="${f}">${l}</button>`).join("")}</div></div>`
    const body = view === "week" ? weekView() : view === "agenda" ? agendaView() : `<div class="callayout">${monthView()}</div>`
    return head + bar + tabs + body
  }

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (wwc) wwc.innerHTML = render()
    // Open (and re-render) the slot-block drawer for one date. `wholeDay` can be
    // passed after a whole-day toggle so the redraw doesn't wait for the blocked
    // query to refetch (blockedSetRef would still be stale for one tick).
    // Slots are per-venue. Resolve which venue this drawer manages: an explicit
    // pick (venue dropdown) wins, else the globally-active venue, else — in
    // "all venues" mode where none is active — the vendor's first venue, so the
    // drawer always has something concrete to act on instead of erroring.
    const openSlotDrawer = async (k: string, venueId?: number) => {
      const venues = bizListRef.current
      const biz = venueId ?? slotDrawerVenueRef.current ?? activeBizRef.current ?? venues[0]?.id ?? null
      if (!biz) { toast.error("Aap ki koi venue nahi mili — pehle venue banayein"); return }
      slotDrawerVenueRef.current = biz
      slotDrawerDateRef.current = k
      openDrawer(s, `Slots — ${longDate(k)}`, `<div class="sd-empty">Load ho raha hai…</div>`)
      try {
        const [slots, blocks, dayBlocks] = await Promise.all([
          BusinessAvailabilityAPI.getDayAvailability(biz, k).catch(() => [] as SlotAvailabilityRow[]),
          SlotBlocksAPI.list(biz, { from: k, to: k }).catch(() => [] as SlotBlock[]),
          // whole-day (VendorBlockedDate) state for THIS venue + date
          BlockedDatesAPI.getAll(undefined, biz, { from: k, to: k }).catch(() => [] as BlockedDate[]),
        ])
        const wholeDay = (dayBlocks || []).some((b) => bdate(b) === k)
        const body = s.getElementById("ww-drawer-body")
        if (body && slotDrawerDateRef.current === k && slotDrawerVenueRef.current === biz) {
          body.innerHTML = slotDrawerBody(k, slots, blocks, wholeDay, venues, biz)
        }
      } catch {
        const body = s.getElementById("ww-drawer-body")
        if (body) body.innerHTML = `<div class="sd-empty">Slots load nahi hue.</div>`
      }
    }
    const conflictMsg = (err: unknown) => {
      const r = (err as { response?: { status?: number; data?: { message?: string } } })?.response
      if (r?.status === 409) return r.data?.message || "Is slot par pehle se booking/hold hai — band nahi kar sakte"
      return r?.data?.message || "Ye kaam nahi hua"
    }
    if (!bound.current) {
      bound.current = true
      const closeMenu = () => { const m = s.getElementById("cellMenu"); if (m) m.remove() }
      s.addEventListener("click", async (e) => {
        const t = e.target as HTMLElement
        // call / WhatsApp on a day-panel event row
        const tel = t.closest("[data-tel]") as HTMLElement | null
        if (tel?.dataset.tel) { e.stopPropagation(); window.location.href = `tel:${tel.dataset.tel.replace(/\s/g, "")}`; return }
        const waBtn = t.closest("[data-wa]") as HTMLElement | null
        if (waBtn?.dataset.wa) { e.stopPropagation(); const p = waDigits(waBtn.dataset.wa); if (p) window.open(`https://wa.me/${p}`, "_blank", "noopener"); return }
        // ── Slot-block drawer: open (fresh open resets to active/first venue) ──
        const slotsBtn = t.closest("[data-slots]") as HTMLElement | null
        if (slotsBtn) { e.stopPropagation(); closeMenu(); slotDrawerVenueRef.current = null; await openSlotDrawer(slotsBtn.dataset.slots!); return }
        // block one slot (BusinessSlotBlock) — on the drawer's selected venue
        const sb = t.closest("[data-slotblock]") as HTMLButtonElement | null
        if (sb) {
          const tid = Number(sb.dataset.slotblock); const k = slotDrawerDateRef.current; const biz = slotDrawerVenueRef.current
          if (!biz || !k) return
          sb.disabled = true; sb.textContent = "…"
          try { await SlotBlocksAPI.block(biz, { blockedDate: k, slotTemplateId: tid }); toast.success(`${sb.dataset.slotlabel || "Slot"} band ho gaya`); await openSlotDrawer(k, biz) }
          catch (err) { toast.error(conflictMsg(err)); sb.disabled = false; sb.textContent = "Band karein" }
          return
        }
        // unblock one slot
        const su = t.closest("[data-slotunblock]") as HTMLButtonElement | null
        if (su) {
          const bid = Number(su.dataset.slotunblock); const k = slotDrawerDateRef.current; const biz = slotDrawerVenueRef.current
          if (!biz || !bid) return
          su.disabled = true; su.textContent = "…"
          try { await SlotBlocksAPI.unblock(biz, bid); toast.success("Slot khul gaya"); await openSlotDrawer(k, biz) }
          catch (err) { toast.error(conflictMsg(err)); su.disabled = false; su.textContent = "Kholein" }
          return
        }
        // whole-day block toggle (VendorBlockedDate) — on the drawer's selected venue
        const db = t.closest("[data-dayblock]") as HTMLButtonElement | null
        if (db) {
          const k = db.dataset.dayblock!; const biz = slotDrawerVenueRef.current; const was = db.dataset.dayblocked === "1"
          if (!biz) return
          db.disabled = true; db.textContent = "…"
          try {
            if (was) await BlockedDatesAPI.unblock(k, biz); else await BlockedDatesAPI.block(k, undefined, biz)
            qc.invalidateQueries({ queryKey: ["cal-art-blocked"] })
            toast.success(was ? "Din khul gaya" : "Poora din band ho gaya")
            await openSlotDrawer(k, biz)
          } catch (err) { toast.error(conflictMsg(err)); db.disabled = false; db.textContent = was ? "Kholein" : "Poora din band" }
          return
        }
        const view2 = t.closest("[data-view]") as HTMLElement | null
        if (view2) { setView(view2.dataset.view as "month" | "week" | "agenda"); closeMenu(); return }
        const cal = t.closest("[data-cal]") as HTMLElement | null
        if (cal) { const a = cal.dataset.cal; if (a === "prev") setOffset((o) => o - 1); else if (a === "next") setOffset((o) => o + 1); else { setOffset(0); setSelKey(keyOf(new Date())) } return }
        const tab = t.closest(".tab") as HTMLElement | null
        if (tab) { setFilter(tab.dataset.f || "all"); return }
        const add = t.closest("[data-add]") as HTMLElement | null
        if (add) { e.stopPropagation(); closeMenu(); const k = add.dataset.add!; const d = parseKey(k); const menu = document.createElement("div"); menu.id = "cellMenu"; menu.className = "cellmenu"; menu.innerHTML = `<div class="cm-date">${d.getDate()} ${MO[d.getMonth()]}, ${WD[d.getDay()]}</div><button class="cm-item" data-nav-btn="/dashboard/bookings?new=${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg> Nayi booking</button><button class="cm-item" data-nav-btn="/dashboard/leads?new=${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.2 2.7-5 6-5s6 1.8 6 5"/></svg> Naya lead</button><div class="cm-sep"></div><button class="cm-item danger" data-slots="${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg> Slots band/khula karein</button>`; s.appendChild(menu); const r = add.getBoundingClientRect(); menu.style.left = Math.max(8, r.right - 196) + "px"; menu.style.top = r.bottom + 6 + "px"; return }
        const blk = t.closest("[data-block]") as HTMLElement | null
        if (blk) { e.stopPropagation(); closeMenu(); const k = blk.dataset.block!; const was = blockedSetRef.current.has(k); const p = was ? BlockedDatesAPI.unblock(k, activeBizRef.current) : BlockedDatesAPI.block(k, undefined, activeBizRef.current); Promise.resolve(p).then(() => qc.invalidateQueries({ queryKey: ["cal-art-blocked"] })).catch(() => {}); return }
        const cell = t.closest(".cell") as HTMLElement | null
        if (cell && !t.closest(".cell-tools") && cell.dataset.day) { setSelKey(cell.dataset.day); closeMenu(); return }
        closeMenu()
      })
      // venue switch inside the slot drawer (a <select> fires "change", not click)
      s.addEventListener("change", async (e) => {
        const vsel = (e.target as HTMLElement)?.closest("[data-slot-venue]") as HTMLSelectElement | null
        if (vsel) { const v = Number(vsel.value); if (v && slotDrawerDateRef.current) await openSlotDrawer(slotDrawerDateRef.current, v) }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, blockedQ.data, offset, selKey, view, filter])

  return <div ref={hostRef} />
}

export default CalendarArtifact
