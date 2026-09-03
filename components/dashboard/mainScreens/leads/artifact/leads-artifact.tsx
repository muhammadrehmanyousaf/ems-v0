"use client"

/**
 * Leads — pixel-faithful to the design sample (docs/design-samples/leads.html):
 * List view with source dots + stage pills + status-filter tabs, clickable rows.
 * Wired to the REAL LeadAPI through the shared artifact shell.
 */

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { LeadAPI, type Lead, type LeadStatus, type LeadSource, type LeadEventType, type CreateLeadInput, type UpdateLeadInput } from "@/lib/api/leads"
import { venueSpacesApi, type SubVenueNode } from "@/lib/api/venueSpaces"
import { openBookingForm } from "@/components/dashboard/mainScreens/artifact/booking-form"
import { StaffAPI } from "@/lib/api/staff"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useBusiness } from "@/context/BusinessContext"
import { useArtifactShell, pkNum, escHtml, initialsOf, openDrawer, closeDrawer, initTablePager, setPagerFilter, restoreTab, savePref, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
function shortDate(s?: string | null) {
  if (!s) return "—"
  const d = new Date(s); if (isNaN(d.getTime())) return String(s)
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
}
function relTime(s?: string | null) {
  if (!s) return "—"
  const d = new Date(s).getTime(); if (isNaN(d)) return "—"
  const days = Math.floor((Date.now() - d) / 86400000)
  if (days <= 0) return "aaj"
  if (days === 1) return "kal"
  if (days < 30) return `${days} din pehle`
  const mo = Math.floor(days / 30); return `${mo} mahine pehle`
}

const STAGE: Record<LeadStatus, { label: string; tone: string; tab: string }> = {
  new: { label: "Naya", tone: "info", tab: "new" },
  contacted: { label: "Raabta hua", tone: "warn", tab: "contacted" },
  qualified: { label: "Visit tay", tone: "info", tab: "qualified" },
  quoted: { label: "Quote bheja", tone: "warn", tab: "quoted" },
  booked: { label: "Jeeta", tone: "ok", tab: "booked" },
  lost: { label: "Khoya", tone: "bad", tab: "lost" },
  archived: { label: "Archive", tone: "mut", tab: "archived" },
}
const SOURCE: Record<LeadSource, { label: string; color: string }> = {
  whatsapp: { label: "WhatsApp", color: "var(--ok)" },
  instagram: { label: "Instagram", color: "#C4708A" },
  referral: { label: "Referral", color: "var(--accent)" },
  form_inquiry: { label: "Website", color: "var(--info)" },
  in_app_chat: { label: "Chat", color: "var(--info)" },
  manual_phone: { label: "Phone", color: "var(--ink-4)" },
  manual_walkin: { label: "Walk-in", color: "var(--ink-4)" },
  other: { label: "Other", color: "var(--ink-4)" },
}
const stageOf = (s?: LeadStatus) => STAGE[s || "new"] || STAGE.new
const sourceOf = (s?: LeadSource) => SOURCE[s || "other"] || SOURCE.other
/** Linear pipeline; the plain one-tap advance covers the mid stages (booked
 * goes through the convert-to-booking flow, not a bare transition). */
const FLOW: LeadStatus[] = ["new", "contacted", "qualified", "quoted", "booked"]
function nextStageOf(s?: LeadStatus): LeadStatus | null {
  const i = FLOW.indexOf(s || "new"); if (i < 0 || i >= FLOW.length - 1) return null
  const nx = FLOW[i + 1]; return nx === "booked" ? null : nx
}

const EXTRA_CSS = String.raw`
.srcdot{ width:8px; height:8px; border-radius:50%; display:inline-block; flex:none; }
.lead-acts{ display:flex; gap:6px; justify-content:flex-end; }
.iconbtn{ width:32px; height:32px; flex:none; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; transition:background .12s,color .12s,border-color .12s; }
.iconbtn:hover{ background:var(--surface-3); color:var(--ink); } .iconbtn.wa:hover{ color:var(--ok); border-color:var(--ok); } .iconbtn:disabled{ opacity:.4; cursor:default; }
.iconbtn svg{ width:15px; height:15px; }
.qv-top{ display:flex; align-items:center; gap:10px; margin-bottom:14px; flex-wrap:wrap; } .qv-src{ font-size:12px; color:var(--ink-3); display:inline-flex; align-items:center; gap:5px; }
.qv-contact{ display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; } .qv-contact .btn svg{ width:14px; height:14px; }
.qv-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px 16px; margin-bottom:16px; }
.qv-item .k{ font-size:10.5px; color:var(--ink-3); font-weight:600; text-transform:uppercase; letter-spacing:.04em; } .qv-item .v{ font-size:13px; color:var(--ink); font-weight:500; margin-top:2px; }
.qv-note{ background:var(--surface-2); border:1px solid var(--border); border-radius:9px; padding:10px 12px; font-size:12.5px; color:var(--ink-2); line-height:1.5; margin-bottom:16px; }
.qv-acts{ display:flex; gap:8px; flex-wrap:wrap; }
`
const waSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20l1.2-5.6A8.4 8.4 0 1 1 21 11.5z"/></svg>`
const callSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>`

/** PK number → wa.me digits: strip non-digits, drop a leading 0, ensure 92. */
export function waDigits(phone?: string | null): string {
  let d = (phone || "").replace(/\D/g, "")
  if (!d) return ""
  if (d.startsWith("0")) d = "92" + d.slice(1)
  else if (!d.startsWith("92") && d.length === 10) d = "92" + d
  return d
}

function rowHtml(l: Lead): string {
  const st = stageOf(l.status), src = sourceOf(l.source)
  const name = l.contactName || "Lead"
  const phone = l.contactPhone || ""
  const editBtn = `<button class="iconbtn" data-lead-edit="${l.id}" title="Edit" aria-label="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>`
  const canBook = !["booked", "lost", "archived"].includes(l.status || "")
  const bookBtn = canBook ? `<button class="iconbtn book" data-lead-book="${l.id}" title="Booking banayein" aria-label="Booking banayein"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M12 13v4M10 15h4"/></svg></button>` : ""
  const telWa = phone ? `<button class="iconbtn" data-tel="${escHtml(phone)}" title="Call" aria-label="Call">${callSvg}</button><button class="iconbtn wa" data-wa="${escHtml(phone)}" title="WhatsApp" aria-label="WhatsApp">${waSvg}</button>` : ""
  const acts = `<div class="lead-acts">${telWa}${bookBtn}${editBtn}</div>`
  return `<tr data-status="${st.tab}">
    <td><div class="c-couple" data-lead-view="${l.id}" style="cursor:pointer"><span class="ava">${escHtml(initialsOf(name))}</span><div><div class="cc-nm">${escHtml(name)}</div><div class="cc-ev">${escHtml(phone || "—")}</div></div></div></td>
    <td class="td-mut">${escHtml(cap(l.eventType))}</td>
    <td class="td-date">${escHtml(shortDate(l.eventDate))}</td>
    <td><span class="mth"><span class="srcdot" style="background:${src.color}"></span> ${escHtml(src.label)}</span></td>
    <td><span class="st ${st.tone}"><i></i> ${escHtml(st.label)}</span></td>
    <td class="td-mut">${escHtml(relTime(l.updatedAt || l.createdAt))}</td>
    <td>${acts}</td>
  </tr>`
}

/** Booking-create form prefilled from a lead (name/phone/date/guests/amount). */
/** Quick-view drawer for a lead — details + inline actions, with a link to the
 * full profile page. Actions reuse the existing data-* handlers. */
function leadQuickViewHtml(l: Lead, businesses?: BizLite[]): string {
  const lx = l as unknown as LeadExtra
  const st = stageOf(l.status), src = sourceOf(l.source)
  const phone = l.contactPhone || ""
  const venue = businesses?.find((b) => b.id === lx.businessId)?.name
  const fu = lx.nextFollowUpAt ? new Date(lx.nextFollowUpAt) : null
  const fuTxt = fu && !isNaN(fu.getTime()) ? fu.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—"
  const item = (k: string, v: string) => `<div class="qv-item"><div class="k">${k}</div><div class="v">${escHtml(v || "—")}</div></div>`
  const telWa = phone
    ? `<button class="btn btn-ghost sm" data-tel="${escHtml(phone)}">${callSvg} Call</button><button class="btn btn-ghost sm" data-wa="${escHtml(phone)}">${waSvg} WhatsApp</button>`
    : `<span style="font-size:12px;color:var(--ink-3)">Koi phone nahi</span>`
  const canBook = !["booked", "lost", "archived"].includes(l.status || "")
  const nx = nextStageOf(l.status)
  const isTerminal = ["booked", "lost", "archived"].includes(l.status || "")
  const advBtns = `${nx ? `<button class="btn btn-primary sm" data-lead-adv="${nx}" data-adv-id="${l.id}">✓ ${escHtml(STAGE[nx].label)} mark karein</button>` : ""}${!isTerminal ? `<button class="btn btn-ghost sm" data-lead-adv="lost" data-adv-id="${l.id}" style="color:var(--bad)">Khoya</button>` : ""}`
  const bookingId = l.booking?.id ?? l.bookingId ?? null
  const bookingLink = bookingId ? `<button class="btn btn-ghost sm" data-nav-btn="/dashboard/bookings/${bookingId}">Booking dekhein ›</button>` : ""
  return `<div class="qv-top"><span class="st ${st.tone}"><i></i> ${escHtml(st.label)}</span><span class="qv-src"><span class="srcdot" style="background:${src.color}"></span> ${escHtml(src.label)}</span><span style="margin-left:auto;font-size:11.5px;color:var(--ink-3)">${escHtml(relTime(l.updatedAt || l.createdAt))}</span></div>
    <div class="qv-contact">${telWa}</div>
    <div class="qv-grid">
      ${item("Event", cap(l.eventType))}
      ${item("Shaadi kab", shortDate(l.eventDate))}
      ${item("Budget", l.estimatedBudget != null ? `Rs ${pkNum(Number(l.estimatedBudget))}` : "—")}
      ${item("Mehmaan", l.estimatedGuests != null ? String(l.estimatedGuests) : "—")}
      ${item("Venue", venue || "—")}
      ${item("Agli follow-up", fuTxt)}
      ${item("Email", l.contactEmail || "—")}
      ${item("WhatsApp", l.contactWhatsapp || "—")}
    </div>
    ${(l.inquiry || l.notes) ? `<div class="qv-note">${escHtml(l.inquiry || l.notes || "")}</div>` : ""}
    <div class="qv-acts">
      ${advBtns}
      ${bookingLink}
      ${canBook ? `<button class="btn btn-ghost sm" data-lead-book="${l.id}">→ Booking banayein</button>` : ""}
      <button class="btn btn-ghost sm" data-lead-edit="${l.id}">Edit</button>
      <button class="btn btn-ghost sm" data-nav-btn="/dashboard/leads/${l.id}">Poori profile ›</button>
    </div>`
}

const EVENT_TYPES: LeadEventType[] = ["mehndi", "nikah", "baraat", "walima", "engagement", "dholki", "other"]

/** Fields the FE Lead type may not declare yet (backend-added). */
type LeadExtra = { businessId?: number; subVenueId?: number | null; assignedToUserId?: number | null; nextFollowUpAt?: string | null }
type BizLite = { id: number; name?: string | null }

/** Fill the dependent Hall/space + Assign-to selects for the chosen venue.
 * Backend-ready: venueSpacesApi.getTree + StaffAPI.listMembers. */
async function populateLeadDeps(s: ShadowRoot, businessId: number, selSub?: number | null, selRep?: number | null) {
  const subSel = s.getElementById("ld-subvenue") as HTMLSelectElement | null
  const repSel = s.getElementById("ld-rep") as HTMLSelectElement | null
  if (subSel) subSel.innerHTML = `<option value="">— poora venue —</option>`
  if (repSel) repSel.innerHTML = `<option value="">— koi nahi —</option>`
  if (!businessId) return
  try {
    const tree = await venueSpacesApi.getTree(businessId)
    const flat: SubVenueNode[] = []
    const walk = (ns: SubVenueNode[]) => ns.forEach((n) => { flat.push(n); if (n.children?.length) walk(n.children) })
    walk(tree.tree || [])
    if (subSel) subSel.innerHTML = `<option value="">— poora venue —</option>` +
      flat.map((n) => `<option value="${n.id}"${n.id === selSub ? " selected" : ""}>${"— ".repeat(Math.max(0, n.depth))}${escHtml(n.name)}</option>`).join("")
  } catch { /* venue may have no spaces yet */ }
  try {
    const st = await StaffAPI.listMembers({ businessId }) as unknown as { members?: { id: number; fullName?: string; name?: string }[] } | { id: number; fullName?: string; name?: string }[]
    const members = (Array.isArray(st) ? st : st?.members) || []
    if (repSel) repSel.innerHTML = `<option value="">— koi nahi —</option>` +
      members.map((m) => `<option value="${m.id}"${m.id === selRep ? " selected" : ""}>${escHtml(m.fullName || m.name || `Staff #${m.id}`)}</option>`).join("")
  } catch { /* no staff module for this venue */ }
}

function leadFormHtml(l?: Lead, prefillDate?: string, businesses?: BizLite[], curBiz?: number | null): string {
  const v = (x: unknown) => (x != null && x !== "" ? escHtml(String(x)) : "")
  const lx = (l || {}) as LeadExtra
  const evOpts = EVENT_TYPES.map((e) => `<option value="${e}"${l?.eventType === e ? " selected" : ""}>${cap(e)}</option>`).join("")
  const srcOpts = (Object.keys(SOURCE) as LeadSource[]).map((k) => `<option value="${k}"${l?.source === k ? " selected" : ""}>${SOURCE[k].label}</option>`).join("")
  const stOpts = (Object.keys(STAGE) as LeadStatus[]).map((k) => `<option value="${k}"${(l?.status || "new") === k ? " selected" : ""}>${STAGE[k].label}</option>`).join("")
  const dateVal = l?.eventDate ? String(l.eventDate).slice(0, 10) : (prefillDate || "")
  const selBiz = lx.businessId ?? curBiz ?? (businesses && businesses[0]?.id) ?? ""
  const bizOpts = (businesses || []).map((b) => `<option value="${b.id}"${b.id === selBiz ? " selected" : ""}>${escHtml(b.name || `Venue #${b.id}`)}</option>`).join("")
  const fuVal = lx.nextFollowUpAt ? String(lx.nextFollowUpAt).slice(0, 16) : ""
  return `<input type="hidden" id="ld-id" value="${l ? l.id : ""}"/>
    <div class="dfield"><label class="dlabel">Naam <span class="req">*</span></label><input id="ld-name" value="${v(l?.contactName)}" placeholder="Customer ka naam"/></div>
    <div class="dfield row2"><div><label class="dlabel">Phone</label><input id="ld-phone" value="${v(l?.contactPhone)}" placeholder="0300…"/></div><div><label class="dlabel">WhatsApp</label><input id="ld-wa" value="${v(l?.contactWhatsapp)}" placeholder="agar alag ho"/></div></div>
    <div class="dfield"><label class="dlabel">Email</label><input id="ld-email" value="${v(l?.contactEmail)}" placeholder="optional"/></div>
    <div class="dfield row2"><div><label class="dlabel">Venue <span class="req">*</span></label><select id="ld-biz">${bizOpts || `<option value="">—</option>`}</select></div><div><label class="dlabel">Hall / space</label><select id="ld-subvenue"><option value="">— poora venue —</option></select></div></div>
    <div class="dfield row2"><div><label class="dlabel">Event</label><select id="ld-event">${evOpts}</select></div><div><label class="dlabel">Shaadi kab</label><input type="date" id="ld-date" value="${dateVal}"/></div></div>
    <div class="dfield row2"><div><label class="dlabel">Budget (Rs)</label><input type="number" id="ld-budget" value="${l?.estimatedBudget != null ? l.estimatedBudget : ""}" placeholder="optional"/></div><div><label class="dlabel">Mehmaan</label><input type="number" id="ld-guests" value="${l?.estimatedGuests != null ? l.estimatedGuests : ""}" placeholder="optional"/></div></div>
    <div class="dfield row2"><div><label class="dlabel">Zariya</label><select id="ld-source">${srcOpts}</select></div><div><label class="dlabel">Stage</label><select id="ld-status">${stOpts}</select></div></div>
    <div class="dfield row2"><div><label class="dlabel">Assign to</label><select id="ld-rep"><option value="">— koi nahi —</option></select></div><div><label class="dlabel">Agli follow-up</label><input type="datetime-local" id="ld-followup" value="${fuVal}"/></div></div>
    <div class="dfield"><label class="dlabel">Puchh-gichh / note</label><textarea id="ld-inquiry" placeholder="Kya poocha…">${v(l?.inquiry || l?.notes)}</textarea></div>
    <div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close>Cancel</button><button class="btn btn-primary" data-lead-save>${l ? "Update karein" : "Lead add karein"}</button></div>`
}

function buildContent(leads: Lead[]): string {
  const counts: Record<string, number> = { all: leads.length }
  leads.forEach((l) => { const t = stageOf(l.status).tab; counts[t] = (counts[t] || 0) + 1 })
  const tab = (f: string, label: string, dot: string, cnt: number, on = false) => `<button class="tab${on ? " on" : ""}" data-f="${f}">${dot ? `<span class="dot" style="background:${dot}"></span> ` : ""}${label} <span class="cnt">${cnt || 0}</span></button>`
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs" role="tablist">
    <button class="tab on" data-f="all">Sab <span class="cnt">${counts.all}</span></button>
    ${tab("new", "Naya", "var(--info)", counts.new)}
    ${tab("contacted", "Raabta", "var(--warn)", counts.contacted)}
    ${tab("quoted", "Quote", "var(--warn)", counts.quoted)}
    ${tab("qualified", "Visit", "var(--info)", counts.qualified)}
    ${tab("booked", "Jeeta", "var(--ok)", counts.booked)}
    ${tab("lost", "Khoya", "var(--bad)", counts.lost)}
    </div><div class="filters"><label class="f-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><input placeholder="Naam ya number dhoondein…" aria-label="Filter"/></label></div></div>`
  const body = leads.map(rowHtml).join("")
  return `${toolbar}<div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Lead</th><th>Event</th><th>Shaadi kab</th><th>Zariya</th><th>Stage</th><th>Aakhri raabta</th><th></th></tr></thead>
    <tbody id="tbody">${body}</tbody></table></div>
    ${leads.length ? `<div class="tbl-foot"><span id="rowcount">${leads.length} leads</span></div>` : `<div class="empty">Abhi koi lead nahi. Nayi puchh-gichh yahan aayegi.<div style="margin-top:12px"><button class="btn btn-primary" data-lead-new>+ Naya lead</button></div></div>`}</div>`
}

export function LeadsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/leads", crumbBold: "Leads", crumbSub: "Puchh-gichh", extraCss: EXTRA_CSS })
  const qc = useQueryClient()
  const { business, businesses } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizId = activeBusinessId ?? (business as { id?: number } | null)?.id ?? null
  const bizRef = React.useRef(bizId); bizRef.current = bizId
  const bizList = React.useMemo(() => ((businesses ?? []) as { id: number; name?: string | null }[]).map((b) => ({ id: b.id, name: b.name })), [businesses])
  const bizListRef = React.useRef(bizList); bizListRef.current = bizList
  const { data, isError } = useQuery({ queryKey: ["leads-artifact"], queryFn: () => LeadAPI.list({}) })
  const leads = data?.leads ?? []
  const leadsRef = React.useRef(leads); leadsRef.current = leads
  const searchParams = useSearchParams()

  // calendar "+" deep-link: /dashboard/leads?new=YYYY-MM-DD opens the create
  // drawer prefilled with that date.
  const autoOpened = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || autoOpened.current) return
    const nd = searchParams?.get("new")
    if (nd) { autoOpened.current = true; openDrawer(s, "Naya lead", leadFormHtml(undefined, nd, bizListRef.current, bizRef.current)); populateLeadDeps(s, Number(bizRef.current)) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, searchParams])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const head = `<div class="head"><div><h1>Leads</h1><div class="sub">Nayi puchh-gichh — <b>${leads.length}</b> total. Jaldi jawab = zyada bookings.</div></div><div class="head-actions"><button class="btn btn-ghost" data-act="export-table"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg> Export</button><button class="btn btn-primary" data-lead-new><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg> Naya lead</button></div></div>`
    const wwc = s.getElementById("wwc")
    if (wwc) {
      if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Leads</h1></div></div>${errorBannerHtml()}` }
      else if (!data) { wwc.innerHTML = `<div class="loadwrap">Leads load ho rahe hain…</div>` }
      else {
        wwc.innerHTML = head + buildContent(leads)
        initTablePager(s, { pageSize: 25, noun: "leads" })
        restoreTab(s, "tab:leads", (f) => setPagerFilter(s, (tr) => f === "all" || tr.dataset.status === f))
      }
    }
    if (!bound.current) {
      bound.current = true
      const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.value?.trim() ?? ""
      s.addEventListener("click", async (e) => {
        const t = e.target as HTMLElement
        if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["leads-artifact"] }); return }
        const wa = t.closest("[data-wa]") as HTMLElement | null
        if (wa) { const p = waDigits(wa.dataset.wa); if (p) window.open(`https://wa.me/${p}?text=${encodeURIComponent("Assalam-o-Alaikum! Aap ki puchh-gichh ka shukriya.")}`, "_blank", "noopener"); return }
        const tel = t.closest("[data-tel]") as HTMLElement | null
        if (tel) { if (tel.dataset.tel) window.location.href = `tel:${tel.dataset.tel.replace(/\s/g, "")}`; return }
        // ── right-side drawer: create / edit ──
        // quick-view drawer (row click)
        const lv = t.closest("[data-lead-view]") as HTMLElement | null
        if (lv?.dataset.leadView) { const l = leadsRef.current.find((x) => x.id === Number(lv.dataset.leadView)); if (l) openDrawer(s, l.contactName || "Lead", leadQuickViewHtml(l, bizListRef.current)); return }
        if (t.closest("[data-lead-new]")) { openDrawer(s, "Naya lead", leadFormHtml(undefined, undefined, bizListRef.current, bizRef.current)); populateLeadDeps(s, Number(bizRef.current)); return }
        // one-tap pipeline stage-advance (contacted/qualified/quoted) or mark lost
        const adv = t.closest("[data-lead-adv]") as HTMLElement | null
        if (adv?.dataset.leadAdv) {
          const id = Number(adv.dataset.advId); const to = adv.dataset.leadAdv as LeadStatus
          adv.setAttribute("disabled", "true")
          try { await LeadAPI.transition(id, { to }); toast.success(`Stage: ${STAGE[to]?.label || to}`); closeDrawer(s); qc.invalidateQueries({ queryKey: ["leads-artifact"] }) }
          catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Stage nahi badla"); adv.removeAttribute("disabled") }
          return
        }
        const led = t.closest("[data-lead-edit]") as HTMLElement | null
        if (led?.dataset.leadEdit) { const l = leadsRef.current.find((x) => x.id === Number(led.dataset.leadEdit)); if (l) { const lx = l as unknown as LeadExtra; openDrawer(s, "Lead edit karein", leadFormHtml(l, undefined, bizListRef.current, bizRef.current)); populateLeadDeps(s, Number(lx.businessId ?? bizRef.current), lx.subVenueId, lx.assignedToUserId) } return }
        // lead → booking — shared BookingForm, prefilled; marks the lead won on save
        const lbk = t.closest("[data-lead-book]") as HTMLElement | null
        if (lbk?.dataset.leadBook) {
          const l = leadsRef.current.find((x) => x.id === Number(lbk.dataset.leadBook)); if (!l) return
          const lx = l as unknown as LeadExtra
          openBookingForm(s, {
            prefill: { customerName: l.contactName || undefined, customerPhone: l.contactPhone || undefined, customerEmail: l.contactEmail || undefined, bookingDate: l.eventDate ? String(l.eventDate).slice(0, 10) : undefined, guestCount: l.estimatedGuests ?? undefined, businessId: lx.businessId ?? Number(bizRef.current), subVenueId: lx.subVenueId ?? undefined, leadId: l.id },
            businesses: bizListRef.current, activeBiz: bizRef.current,
            onSaved: async () => { try { await LeadAPI.update(l.id, { status: "booked" } as UpdateLeadInput) } catch { /* non-fatal */ } qc.invalidateQueries({ queryKey: ["leads-artifact"] }) },
          })
          return
        }
        if (t.closest("[data-lead-save]")) {
          const name = val("ld-name"); if (!name) { toast.error("Naam likhein"); return }
          const editId = Number(val("ld-id"))
          const bizPick = Number(val("ld-biz")) || Number(bizRef.current) || 0
          const common = {
            contactName: name, contactPhone: val("ld-phone") || undefined, contactWhatsapp: val("ld-wa") || undefined, contactEmail: val("ld-email") || undefined,
            eventType: val("ld-event") as LeadEventType, eventDate: val("ld-date") || null,
            estimatedBudget: val("ld-budget") ? Number(val("ld-budget")) : null, estimatedGuests: val("ld-guests") ? Number(val("ld-guests")) : null,
            source: val("ld-source") as LeadSource, status: val("ld-status") as LeadStatus, inquiry: val("ld-inquiry") || undefined,
            subVenueId: val("ld-subvenue") ? Number(val("ld-subvenue")) : null,
            assignedToUserId: val("ld-rep") ? Number(val("ld-rep")) : null,
            nextFollowUpAt: val("ld-followup") || null,
          }
          const btn = t.closest("[data-lead-save]") as HTMLButtonElement; btn.disabled = true; btn.textContent = "Save ho raha…"
          try {
            if (editId) await LeadAPI.update(editId, { ...common, businessId: bizPick || undefined } as UpdateLeadInput)
            else { if (!bizPick) { toast.error("Venue select karein"); btn.disabled = false; return } await LeadAPI.create({ businessId: bizPick, ...common } as CreateLeadInput) }
            toast.success(editId ? "Lead update ho gaya" : "Naya lead ban gaya"); closeDrawer(s); qc.invalidateQueries({ queryKey: ["leads-artifact"] })
          } catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua"); btn.disabled = false; btn.textContent = editId ? "Update karein" : "Lead add karein" }
          return
        }
        const btn = t.closest(".tab") as HTMLElement | null
        if (!btn) return
        const tabsEl = s.getElementById("tabs"); if (!tabsEl) return
        tabsEl.querySelectorAll(".tab").forEach((x) => x.classList.remove("on"))
        btn.classList.add("on")
        const f = btn.dataset.f || "all"
        savePref("tab:leads", f)
        setPagerFilter(s, (tr) => f === "all" || tr.dataset.status === f)
      })
      // venue change → refill dependent Hall/space + Assign-to selects
      s.addEventListener("change", (e) => {
        const t = e.target as HTMLElement
        if (t.id === "ld-biz") populateLeadDeps(s, Number((t as HTMLSelectElement).value))
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, isError])

  return <div ref={hostRef} />
}

export default LeadsArtifact
