"use client"

/**
 * Field capture — the on-the-floor hub, rebuilt as a LIVE surface.
 *
 * The whole point of a field screen is to capture FAST without leaving it, and
 * to see what you've grabbed today. The old version just linked to four other
 * screens (losing the floor context on every tap). This one:
 *  - shows a live "aaj field par" tally (leads / receipts / kharcha / holds),
 *  - captures a Lead and a Date-hold IN-PLACE (the two fastest floor grabs),
 *  - lists today's captures, and
 *  - shows a real online/offline indicator.
 * Payment + expense still deep-link (they need a booking / category), prefilled
 * where possible.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { LeadAPI, type Lead, type LeadEventType, type LeadSource, type LeadStatus, type CreateLeadInput } from "@/lib/api/leads"
import { VendorHoldsAPI, type VendorHold } from "@/lib/api/vendorHolds"
import { ReceiptsAPI } from "@/lib/api/paymentReceipts"
import { ExpensesAPI } from "@/lib/api/vendorExpenses"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useBusiness } from "@/context/BusinessContext"
import { useArtifactShell, pkNum, escHtml, errorBannerHtml, openDrawer, closeDrawer } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  users: '<path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>',
  money: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  wifi: '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0M12 20h.01"/>',
  wifiOff: '<path d="M2 9a15 15 0 0 1 5-3.3M22 9a15 15 0 0 0-4-2.7M8.5 16a5 5 0 0 1 5.6-.9M12 20h.01M2 2l20 20"/>',
  cal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
}
const todayIso = () => new Date().toISOString().slice(0, 10)
const isToday = (s?: string | null) => !!s && String(s).slice(0, 10) === todayIso()
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
function fmtTime(t?: string | null) { if (!t) return ""; const [h, m] = String(t).split(":").map(Number); if (Number.isNaN(h)) return String(t); const ap = h >= 12 ? "PM" : "AM"; return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${ap}` }
function relTime(s?: string | null) {
  if (!s) return ""
  const d = new Date(s).getTime(); if (isNaN(d)) return ""
  const min = Math.floor((Date.now() - d) / 60000)
  if (min < 1) return "abhi"; if (min < 60) return `${min} min pehle`
  const h = Math.floor(min / 60); return `${h} ghante pehle`
}

const EVENT_TYPES: LeadEventType[] = ["mehndi", "nikah", "baraat", "walima", "engagement", "dholki", "other"]
const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : s

const EXTRA_CSS = String.raw`
.content{ max-width:980px; }
.field-hero{ display:flex; gap:13px; align-items:center; padding:15px 18px; margin-bottom:14px; background:linear-gradient(150deg,var(--accent-wash),color-mix(in srgb,var(--surface) 78%,var(--accent-wash))); border-color:var(--accent-line); }
.fh-ic{ width:44px; height:44px; border-radius:12px; background:var(--surface); border:1px solid var(--accent-line); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .fh-ic svg{ width:22px; height:22px; }
.fh-t{ font-weight:600; font-size:15px; color:var(--accent-ink); } .fh-s{ font-size:12.5px; color:var(--ink-2); margin-top:2px; }
.net{ margin-left:auto; display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:600; padding:5px 11px; border-radius:20px; flex:none; }
.net svg{ width:14px; height:14px; } .net.on{ color:var(--ok); background:color-mix(in srgb,var(--ok) 12%,var(--surface)); border:1px solid color-mix(in srgb,var(--ok) 35%,var(--border)); } .net.off{ color:var(--warn); background:var(--warn-wash); border:1px solid var(--accent-line); }
.tally{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:16px; }
.tcard{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:13px 15px; box-shadow:var(--shadow-xs); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:22px; font-weight:680; letter-spacing:-.02em; margin-top:7px; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:3px; }
.sec-h{ font-size:12px; font-weight:600; color:var(--ink-3); text-transform:uppercase; letter-spacing:.05em; margin:2px 2px 10px; }
.act-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:14px; margin-bottom:16px; }
.actcard{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); padding:17px; cursor:pointer; transition:border-color .12s,box-shadow .12s; }
.actcard:hover{ border-color:var(--accent-line); box-shadow:var(--shadow-md); }
.ac-top{ display:flex; align-items:center; gap:11px; } .ac-ic{ width:44px; height:44px; border-radius:13px; display:grid; place-items:center; flex:none; } .ac-ic svg{ width:22px; height:22px; }
.ac-t{ font-size:15px; font-weight:660; } .ac-badge{ margin-left:auto; font-size:11px; font-weight:600; color:var(--accent-ink); background:var(--accent-wash); border:1px solid var(--accent-line); border-radius:20px; padding:2px 9px; }
.ac-s{ font-size:12.5px; color:var(--ink-3); margin-top:10px; line-height:1.5; }
.ac-cta{ display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:var(--accent-ink); margin-top:12px; } .ac-cta svg{ width:14px; height:14px; }
.feed{ display:flex; flex-direction:column; }
.frow{ display:flex; gap:12px; align-items:center; padding:11px 16px; border-bottom:1px solid var(--border); } .frow:last-child{ border-bottom:0; }
.f-ic{ width:34px; height:34px; border-radius:9px; display:grid; place-items:center; flex:none; } .f-ic svg{ width:16px; height:16px; }
.f-main{ flex:1; min-width:0; } .f-t{ font-weight:600; font-size:13px; } .f-s{ font-size:11.5px; color:var(--ink-3); margin-top:1px; }
.f-time{ font-size:11px; color:var(--ink-4); flex:none; }
.f-empty{ padding:18px 16px; color:var(--ink-3); font-size:12.5px; text-align:center; }
.dfield{ display:flex; flex-direction:column; gap:5px; margin-bottom:12px; } .dfield.row2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.dlabel{ font-size:11.5px; font-weight:600; color:var(--ink-2); }
.dfield input,.dfield select{ border:1px solid var(--border-2); border-radius:9px; background:var(--surface-2); color:var(--ink); padding:9px 10px; font:inherit; font-size:12.5px; outline:none; } .dfield input:focus,.dfield select:focus{ border-color:var(--accent); background:var(--surface); box-shadow:0 0 0 3px var(--accent-wash); }
.ww-dfoot{ display:flex; gap:8px; justify-content:flex-end; margin-top:4px; }
.loadwrap{ display:grid; place-items:center; padding:70px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:820px){ .tally{ grid-template-columns:repeat(2,1fr); } .act-grid{ grid-template-columns:1fr; } }
`

type Counts = { leads: number; receiptsN: number; receiptsRs: number; expensesN: number; expensesRs: number; holds: number }

function buildContent(counts: Counts, feed: { icon: string; color: string; t: string; s: string; time: string }[]): string {
  const tcard = (icon: string, color: string, cap: string, val: string, sub: string) =>
    `<div class="tcard"><div class="t-cap" style="color:${color}">${svg(icon, 1.9)} ${cap}</div><div class="t-val tnum">${val}</div><div class="t-sub">${sub}</div></div>`
  const tally = `<div class="tally">
    ${tcard(IC.users, "var(--info)", "Leads aaj", String(counts.leads), "floor par mili")}
    ${tcard(IC.money, "var(--ok)", "Receipts aaj", `<span style="font-size:13px;color:var(--ink-3);font-weight:600">Rs</span> ${pkNum(counts.receiptsRs)}`, `${counts.receiptsN} payment`)}
    ${tcard(IC.wallet, "var(--warn)", "Kharcha aaj", `<span style="font-size:13px;color:var(--ink-3);font-weight:600">Rs</span> ${pkNum(counts.expensesRs)}`, `${counts.expensesN} entry`)}
    ${tcard(IC.lock, "var(--accent-ink)", "Active holds", String(counts.holds), "roki hui dates")}
  </div>`

  const actLead = `<div class="actcard" data-cap="lead"><div class="ac-top"><span class="ac-ic" style="background:color-mix(in srgb,var(--info) 14%,transparent);color:var(--info)">${svg(IC.users, 1.8)}</span><div class="ac-t">Naya lead</div><span class="ac-badge">in-place</span></div><div class="ac-s">Floor par mili puchh-gichh — naam aur number yahin darj karein, screen chhoray baghair.</div><span class="ac-cta">${svg(IC.plus)} Lead darj karein</span></div>`
  const actHold = `<div class="actcard" data-cap="hold"><div class="ac-top"><span class="ac-ic" style="background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent-ink)">${svg(IC.lock, 1.8)}</span><div class="ac-t">Date hold</div><span class="ac-badge">in-place</span></div><div class="ac-s">Pakki booking se pehle slot rok lein — date aur waqt yahin se.</div><span class="ac-cta">${svg(IC.plus)} Hold lagayein</span></div>`
  const actPay = `<div class="actcard" data-nav-btn="/dashboard/receipts"><div class="ac-top"><span class="ac-ic" style="background:color-mix(in srgb,var(--ok) 14%,transparent);color:var(--ok)">${svg(IC.money, 1.8)}</span><div class="ac-t">Payment darj</div></div><div class="ac-s">Cash/transfer receipt — booking chun kar record karein.</div><span class="ac-cta">Receipts kholein ${svg(IC.arrow)}</span></div>`
  const actExp = `<div class="actcard" data-nav-btn="/dashboard/expenses"><div class="ac-top"><span class="ac-ic" style="background:color-mix(in srgb,var(--warn) 14%,transparent);color:var(--warn)">${svg(IC.wallet, 1.8)}</span><div class="ac-t">Kharcha darj</div></div><div class="ac-s">Mauqe par hua expense — category ke saath note karein.</div><span class="ac-cta">Kharcha kholein ${svg(IC.arrow)}</span></div>`

  const feedHtml = feed.length
    ? `<div class="card"><div class="feed">${feed.map((f) => `<div class="frow"><span class="f-ic" style="background:color-mix(in srgb,${f.color} 13%,transparent);color:${f.color}">${svg(f.icon, 1.8)}</span><div class="f-main"><div class="f-t">${escHtml(f.t)}</div><div class="f-s">${escHtml(f.s)}</div></div><span class="f-time">${escHtml(f.time)}</span></div>`).join("")}</div></div>`
    : `<div class="card"><div class="f-empty">Aaj abhi tak field par kuch darj nahi — upar se shuru karein.</div></div>`

  return `
  <div class="head"><div><h1>Field capture</h1><div class="sub">Floor par kaam karte waqt — lead aur hold yahin darj, aaj ka hisaab saamne.</div></div></div>
  <div class="card field-hero"><span class="fh-ic">${svg(IC.bolt, 1.8)}</span><div><div class="fh-t">Jaldi darj karein</div><div class="fh-s">Expo, exhibition ya venue visit — mauqe par hi record karein, baad mein bhoolein nahi.</div></div><span class="net on" id="netpill">${svg(IC.wifi, 1.9)} Online</span></div>
  ${tally}
  <div class="sec-h">Quick capture</div>
  <div class="act-grid">${actLead}${actHold}${actPay}${actExp}</div>
  <div class="sec-h">Aaj field par</div>
  ${feedHtml}
  <div class="foot">WeddingWala vendor console · Field capture</div>`
}

/* ── inline capture drawers ─────────────────────────────────────── */
function leadDrawerBody(): string {
  const evOpts = EVENT_TYPES.map((e) => `<option value="${e}">${cap(e)}</option>`).join("")
  return `
  <div class="dfield"><label class="dlabel">Naam <span style="color:var(--bad)">*</span></label><input id="fl-name" placeholder="Customer ka naam"/></div>
  <div class="dfield row2"><div><label class="dlabel">Phone</label><input id="fl-phone" placeholder="03xx…"/></div><div><label class="dlabel">Event</label><select id="fl-event">${evOpts}</select></div></div>
  <div class="dfield"><label class="dlabel">Shaadi kab (agar pata ho)</label><input id="fl-date" type="date"/></div>
  <div class="dfield"><label class="dlabel">Note</label><input id="fl-note" placeholder="Kya poocha, budget, etc."/></div>
  <div class="ww-dfoot"><button class="btn btn-primary" type="button" data-fl-save>Lead darj karein</button></div>`
}
function holdDrawerBody(): string {
  return `
  <div class="dfield row2"><div><label class="dlabel">Kaunsi date</label><input id="fh-date" type="date" value="${todayIso()}"/></div><div><label class="dlabel">Waqt</label><input id="fh-time" type="time" value="20:00"/></div></div>
  <div class="ww-dfoot"><button class="btn btn-primary" type="button" data-fh-save>Hold lagayein</button></div>`
}

export function FieldArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/field", crumbBold: "Ops", crumbSub: "Field capture", extraCss: EXTRA_CSS })
  const qc = useQueryClient()
  const { business } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizId = activeBusinessId ?? (business as { id?: number } | null)?.id ?? null
  const bizRef = React.useRef(bizId); bizRef.current = bizId
  const today = todayIso()

  const leadsQ = useQuery({ queryKey: ["field-leads"], queryFn: () => LeadAPI.list({}) })
  const holdsQ = useQuery({ queryKey: ["field-holds", bizId], queryFn: () => VendorHoldsAPI.list(bizId ?? undefined) })
  const receiptsQ = useQuery({ queryKey: ["field-receipts", bizId, today], queryFn: () => ReceiptsAPI.list({ from: today, to: today, ...(bizId ? { businessId: bizId } : {}) }).catch(() => ({ receipts: [], summary: { total: 0, byMethod: {} } })) })
  const expensesQ = useQuery({ queryKey: ["field-expenses", today], queryFn: () => ExpensesAPI.list({ from: today, to: today }).catch(() => ({ expenses: [], summary: null } as unknown as Awaited<ReturnType<typeof ExpensesAPI.list>>)) })
  const isError = leadsQ.isError || holdsQ.isError

  const model = React.useMemo(() => {
    const leads = (leadsQ.data?.leads ?? []) as Lead[]
    const holds = (holdsQ.data ?? []) as VendorHold[]
    const receipts = receiptsQ.data?.receipts ?? []
    const expenses = expensesQ.data?.expenses ?? []
    const todayLeads = leads.filter((l) => isToday(l.createdAt))
    const activeHolds = holds.filter((h) => new Date(h.expiresAt).getTime() > Date.now())
    const todayHolds = holds.filter((h) => isToday(h.createdAt))
    const counts: Counts = {
      leads: todayLeads.length,
      receiptsN: receipts.length,
      receiptsRs: receipts.reduce((s, r) => s + num(r.amount), 0),
      expensesN: expenses.length,
      expensesRs: expenses.reduce((s, e) => s + num(e.amount), 0),
      holds: activeHolds.length,
    }
    const feed = [
      ...todayLeads.map((l) => ({ icon: IC.users, color: "var(--info)", t: l.contactName || "Lead", s: `Lead${l.contactPhone ? " · " + l.contactPhone : ""}`, time: relTime(l.createdAt), _at: l.createdAt || "" })),
      ...todayHolds.map((h) => ({ icon: IC.lock, color: "var(--accent-ink)", t: `Hold · ${String(h.holdDate || "").slice(0, 10)}`, s: `Slot roka${h.holdTime ? " · " + fmtTime(h.holdTime) : ""}`, time: relTime(h.createdAt), _at: h.createdAt || "" })),
    ].sort((a, b) => (b._at || "").localeCompare(a._at || "")).slice(0, 8)
    return { counts, feed, loading: leadsQ.isLoading || holdsQ.isLoading }
  }, [leadsQ.data, holdsQ.data, receiptsQ.data, expensesQ.data, leadsQ.isLoading, holdsQ.isLoading])

  React.useEffect(() => {
    const s = shadowRef.current; if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Field capture</h1></div></div>${errorBannerHtml()}`; return }
    if (model.loading && !leadsQ.data) { wwc.innerHTML = `<div class="loadwrap">Field hub load ho raha hai…</div>`; return }
    wwc.innerHTML = buildContent(model.counts, model.feed)
    // reflect current connectivity immediately
    const pill = s.getElementById("netpill")
    if (pill && typeof navigator !== "undefined" && !navigator.onLine) { pill.className = "net off"; pill.innerHTML = `${svg(IC.wifiOff, 1.9)} Offline` }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, model, isError])

  // live online/offline indicator
  React.useEffect(() => {
    if (typeof window === "undefined") return
    const setPill = () => {
      const s = shadowRef.current; const pill = s?.getElementById("netpill"); if (!pill) return
      const on = navigator.onLine
      pill.className = on ? "net on" : "net off"
      pill.innerHTML = on ? `${svg(IC.wifi, 1.9)} Online` : `${svg(IC.wifiOff, 1.9)} Offline`
    }
    window.addEventListener("online", setPill); window.addEventListener("offline", setPill)
    return () => { window.removeEventListener("online", setPill); window.removeEventListener("offline", setPill) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current; if (!s || !ready || bound.current) return
    bound.current = true
    const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? ""

    const saveLead = async () => {
      const name = val("fl-name"); if (!name) { toast.error("Naam likhein"); return }
      const biz = Number(bizRef.current); if (!biz) { toast.error("Pehle upar se venue chunein"); return }
      const btn = s.querySelector("[data-fl-save]") as HTMLButtonElement | null; if (btn) { btn.disabled = true; btn.textContent = "Darj ho raha…" }
      try {
        await LeadAPI.create({
          businessId: biz, contactName: name, contactPhone: val("fl-phone") || undefined,
          eventType: (val("fl-event") || undefined) as LeadEventType | undefined, eventDate: val("fl-date") || null,
          inquiry: val("fl-note") || undefined, source: "manual_walkin" as LeadSource, status: "new" as LeadStatus,
        } as CreateLeadInput)
        toast.success("Lead darj ho gaya"); closeDrawer(s)
        qc.invalidateQueries({ queryKey: ["field-leads"] }); qc.invalidateQueries({ queryKey: ["leads-artifact"] })
      } catch (err: unknown) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Darj nahi hua")
        if (btn) { btn.disabled = false; btn.textContent = "Lead darj karein" }
      }
    }
    const saveHold = async () => {
      const date = val("fh-date"); const time = val("fh-time")
      if (!date || !time) { toast.error("Date aur waqt chunein"); return }
      const btn = s.querySelector("[data-fh-save]") as HTMLButtonElement | null; if (btn) { btn.disabled = true; btn.textContent = "Darj ho raha…" }
      try {
        const r = await VendorHoldsAPI.place({ holdDate: date, holdTime: time.length === 5 ? time + ":00" : time, businessId: bizRef.current ?? undefined })
        toast.success(r.alreadyHeld ? "Ye slot pehle se roka hua tha" : "Hold lag gaya"); closeDrawer(s)
        qc.invalidateQueries({ queryKey: ["field-holds", bizRef.current] })
      } catch (err: unknown) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Ye slot pehle se booked/held hai")
        if (btn) { btn.disabled = false; btn.textContent = "Hold lagayein" }
      }
    }

    s.addEventListener("click", (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["field-leads"] }); qc.invalidateQueries({ queryKey: ["field-holds", bizRef.current] }); return }
      const cap = t.closest("[data-cap]") as HTMLElement | null
      if (cap?.dataset.cap === "lead") { openDrawer(s, "Naya lead — field", leadDrawerBody()); return }
      if (cap?.dataset.cap === "hold") { openDrawer(s, "Date hold — field", holdDrawerBody()); return }
      if (t.closest("[data-fl-save]")) { void saveLead(); return }
      if (t.closest("[data-fh-save]")) { void saveHold(); return }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default FieldArtifact
