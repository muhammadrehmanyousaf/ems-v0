"use client"

/**
 * Leads — pixel-faithful to the design sample (docs/design-samples/leads.html):
 * List view with source dots + stage pills + status-filter tabs, clickable rows.
 * Wired to the REAL LeadAPI through the shared artifact shell.
 */

import { dateOnlyOf, fmtYmd } from "@/lib/utils/ymd"
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { LeadAPI, type Lead, type LeadStatus, type LeadSource, type LeadEventType, type CreateLeadInput, type UpdateLeadInput } from "@/lib/api/leads"
import { LEAD_STAGE, nextStageOf, LEAD_CLOSED } from "@/lib/lead-stage"
import { callNumber, waNumber, followUpInputValue, followUpPayload, changedLeadFields, LOST_REASONS } from "@/lib/lead-tail"
import { leadBudgetError, leadGuestsError, leadNumberMessageUr } from "@/lib/lead-numbers"
import { venueSpacesApi, type SubVenueNode } from "@/lib/api/venueSpaces"
import { openBookingForm, bookingIdFromSaved } from "@/components/dashboard/mainScreens/artifact/booking-form"
import { StaffAPI } from "@/lib/api/staff"
import { AssignToBusinessModal } from "@/components/dashboard/admin/assignment/AssignToBusinessModal"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useBusiness } from "@/context/BusinessContext"
import { useUser } from "@/context/UserContext"
import { safeDateValue, assignableReps } from "@/lib/lead-form-safety"
import { useArtifactShell, pkNum, escHtml, initialsOf, openDrawer, closeDrawer, openConfirm, initTablePager, setPagerFilter, restoreTab, savePref, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
function shortDate(s?: string | null) {
  if (!s) return "—"
  if (dateOnlyOf(s)) return fmtYmd(s, "short")
  const d = new Date(s); if (isNaN(d.getTime())) return String(s)
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
}

function slaBadgeHtml(l: Lead): string {
  if (l.status !== "new" && l.status !== "contacted") return ""
  const created = l.createdAt ? new Date(l.createdAt).getTime() : 0
  if (!created || isNaN(created)) return ""
  const diffMinutes = Math.floor((Date.now() - created) / 60000)
  if (diffMinutes < 30) {
    return `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:600;color:#16a34a;background:#dcfce7;padding:1px 6px;border-radius:9999px;margin-left:6px" title="Nayi inquiry (<30m)">⏱️ ${diffMinutes}m</span>`
  } else if (diffMinutes < 120) {
    const h = Math.floor(diffMinutes / 60), m = diffMinutes % 60
    return `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:600;color:#d97706;background:#fef3c7;padding:1px 6px;border-radius:9999px;margin-left:6px" title="Jaldi raabta karein (>30m)">⚠️ ${h}h ${m}m</span>`
  } else {
    const h = Math.floor(diffMinutes / 60)
    return `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:600;color:#dc2626;background:#fee2e2;padding:1px 6px;border-radius:9999px;margin-left:6px" title="SLA Breached (>2h)">🚨 ${h}h</span>`
  }
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

const LEAD_FIELD_ID: Record<string, string> = {
  source: "ld-source", status: "ld-status", eventType: "ld-event", contactName: "ld-name", contactPhone: "ld-phone",
  contactWhatsapp: "ld-wa", contactEmail: "ld-email", eventDate: "ld-date", estimatedBudget: "ld-budget",
  estimatedGuests: "ld-guests", nextFollowUpAt: "ld-followup", subVenueId: "ld-subvenue", assignedToUserId: "ld-rep",
}
const LEAD_FIELD_TEXT: Record<string, string> = {
  source: "Ye zariya abhi qabool nahi ho raha — koi aur zariya chunein (ya \"Other\")",
  status: "Ye status sahi nahi — dobara chunein",
  eventType: "Event ki qism dobara chunein",
  contactName: "Naam likhein",
  contactPhone: "Phone number sahi likhein (e.g. 0300 1234567)",
  contactWhatsapp: "WhatsApp number sahi likhein",
  contactEmail: "Email sahi likhein",
  eventDate: "Taareekh sahi chunein",
}
function markLeadField(root: ShadowRoot, field: string, text: string): boolean {
  const el = (LEAD_FIELD_ID[field] && root.getElementById(LEAD_FIELD_ID[field])) as HTMLElement | null
  root.querySelectorAll(".ferr").forEach((n) => n.remove())
  root.querySelectorAll("[aria-invalid=true]").forEach((n) => n.removeAttribute("aria-invalid"))
  if (!el) return false
  el.setAttribute("aria-invalid", "true")
  const note = document.createElement("div")
  note.className = "ferr"; note.setAttribute("role", "alert")
  note.textContent = text
  el.insertAdjacentElement("afterend", note)
  el.scrollIntoView({ block: "center", behavior: "smooth" }); (el as HTMLInputElement).focus?.()
  return true
}
function showLeadFieldError(root: ShadowRoot, err: unknown): boolean {
  const d = (err as { response?: { data?: { message?: string; data?: { field?: string } } } })?.response?.data
  const field = d?.data?.field || ""
  return markLeadField(root, field, LEAD_FIELD_TEXT[field] || d?.message || "Ye field sahi nahi")
}
function leadNumberProblem(root: ShadowRoot, raw: { budget: string; guests: string }, orig?: Lead): boolean {
  const same = (typed: string, stored: unknown) => stored != null && stored !== "" && Number(typed) === Number(stored)
  const be = leadBudgetError(raw.budget)
  if (be && !(orig && same(raw.budget, orig.estimatedBudget))) return markLeadField(root, "estimatedBudget", leadNumberMessageUr("budget", be))
  const ge = leadGuestsError(raw.guests)
  if (ge && !(orig && same(raw.guests, orig.estimatedGuests))) return markLeadField(root, "estimatedGuests", leadNumberMessageUr("guests", ge))
  return false
}
const STAGE: Record<LeadStatus, { label: string; tone: string; tab: string }> = LEAD_STAGE
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

export function lostReasonFormHtml(leadId: number): string {
  const opts = LOST_REASONS.map((r) => `<option value="${escHtml(r)}">${escHtml(r)}</option>`).join("")
  return `<div class="dfield"><label class="dlabel">Lead kyun khoyi?</label><select id="lost-reason">${opts}</select></div>
    <div class="dfield"><label class="dlabel">Mazeed baat (optional)</label><textarea id="lost-note" placeholder="Kuch likhna ho to…"></textarea></div>
    <div class="qv-note">Khoya lead baad mein \"Dobara kholein\" se wapas khul sakti hai.</div>
    <div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close>Rehne dein</button><button class="btn btn-danger" data-lead-lost-go="${leadId}">Haan, khoya mark karein</button></div>`
}
export function lostReasonText(reason: string, note: string): string {
  const n = (note || "").trim()
  return n ? `${reason} — ${n}` : reason
}

const EXTRA_CSS = String.raw`
.ferr{ color:var(--bad); font-size:11.5px; line-height:1.4; margin-top:4px; } [aria-invalid=true]{ border-color:var(--bad) !important; }
.srcdot{ width:8px; height:8px; border-radius:50%; display:inline-block; flex:none; }
.lead-acts{ display:flex; gap:5px; justify-content:flex-end; align-items:center; }
.iconbtn{ width:30px; height:30px; flex:none; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; transition:background .12s,color .12s,border-color .12s; }
.iconbtn:hover{ background:var(--surface-3); color:var(--ink); } .iconbtn.wa:hover{ color:var(--ok); border-color:var(--ok); } .iconbtn.del:hover{ color:var(--bad); border-color:var(--bad); } .iconbtn:disabled{ opacity:.4; cursor:default; }
.iconbtn svg{ width:14px; height:14px; }
.qv-top{ display:flex; align-items:center; gap:10px; margin-bottom:14px; flex-wrap:wrap; } .qv-src{ font-size:12px; color:var(--ink-3); display:inline-flex; align-items:center; gap:5px; }
.qv-contact{ display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; } .qv-contact .btn svg{ width:14px; height:14px; }
.qv-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px 16px; margin-bottom:16px; }
.qv-item .k{ font-size:10.5px; color:var(--ink-3); font-weight:600; text-transform:uppercase; letter-spacing:.04em; } .qv-item .v{ font-size:13px; color:var(--ink); font-weight:500; margin-top:2px; }
.qv-note{ background:var(--surface-2); border:1px solid var(--border); border-radius:9px; padding:10px 12px; font-size:12.5px; color:var(--ink-2); line-height:1.5; margin-bottom:16px; }
.qv-acts{ display:flex; gap:8px; flex-wrap:wrap; }
.f-select{ appearance:none; background:var(--surface); border:1px solid var(--border-2); border-radius:8px; padding:6px 28px 6px 10px; font-size:12px; color:var(--ink); cursor:pointer; height:34px; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 8px center; }
.f-select:focus{ outline:none; border-color:var(--gold, #d97706); }
`
const waSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20l1.2-5.6A8.4 8.4 0 1 1 21 11.5z"/></svg>`
const callSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>`

export async function logContact(leadId: string | number | undefined, channel: "whatsapp" | "call") {
  const id = Number(leadId)
  if (!Number.isFinite(id) || id <= 0) return
  try { await LeadAPI.markContacted(id, channel) } catch { /* best effort */ }
}

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
  const phone = callNumber(l)
  const waPhone = waNumber(l)
  const editBtn = `<button class="iconbtn" data-lead-edit="${l.id}" title="Edit" aria-label="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>`
  const canBook = !["booked", "lost", "archived"].includes(l.status || "")
  const bookBtn = canBook ? `<button class="iconbtn book" data-lead-book="${l.id}" title="Booking banayein" aria-label="Booking banayein"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M12 13v4M10 15h4"/></svg></button>` : ""
  const telWa = `${phone ? `<button class="iconbtn" data-tel="${escHtml(phone)}" data-lead-id="${l.id}" title="Call" aria-label="Call">${callSvg}</button>` : ""}${waPhone ? `<button class="iconbtn wa" data-wa="${escHtml(waPhone)}" data-lead-id="${l.id}" title="WhatsApp" aria-label="WhatsApp">${waSvg}</button>` : ""}`
  const assignBtn = `<button class="iconbtn" data-lead-assign="${l.id}" title="Venue badlein / Assign" aria-label="Venue badlein / Assign"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg></button>`
  const delBtn = `<button class="iconbtn del" data-lead-del="${l.id}" title="Delete lead" aria-label="Delete lead" style="color:var(--bad, #ef4444)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg></button>`
  const acts = `<div class="lead-acts">${telWa}${assignBtn}${bookBtn}${editBtn}${delBtn}</div>`
  const bz = (l as unknown as { business?: { id?: number; name?: string; city?: string } })?.business
  const venueBadge = bz?.name ? `<div style="font-size:11px;color:var(--ink-3);margin-top:2px;font-weight:500">🏢 ${escHtml(bz.name)}${bz.city ? ` · ${escHtml(bz.city)}` : ""}</div>` : ""
  const lx = l as unknown as LeadExtra
  const bizId = lx.businessId ?? bz?.id ?? ""
  return `<tr data-status="${st.tab}" data-biz-id="${bizId}" data-event="${escHtml(l.eventType || "")}" data-src="${escHtml(l.source || "")}" data-lead-id="${l.id}">
    <td style="width:36px;text-align:center"><input type="checkbox" class="lead-row-check" data-id="${l.id}" style="cursor:pointer;width:15px;height:15px;accent-color:var(--gold, #d97706)"/></td>
    <td><div class="c-couple" data-lead-view="${l.id}" style="cursor:pointer"><span class="ava">${escHtml(initialsOf(name))}</span><div><div class="cc-nm">${escHtml(name)}${slaBadgeHtml(l)}</div><div class="cc-ev">${escHtml(phone || "—")}</div>${venueBadge}</div></div></td>
    <td class="td-mut">${escHtml(cap(l.eventType))}</td>
    <td class="td-date">${escHtml(shortDate(l.eventDate))}</td>
    <td><span class="mth"><span class="srcdot" style="background:${src.color}"></span> ${escHtml(src.label)}</span></td>
    <td><span class="st ${st.tone}"><i></i> ${escHtml(st.label)}</span></td>
    <td class="td-mut">${escHtml(relTime(l.updatedAt || l.createdAt))}</td>
    <td>${acts}</td>
  </tr>`
}

function leadQuickViewHtml(l: Lead, businesses?: BizLite[]): string {
  const lx = l as unknown as LeadExtra
  const st = stageOf(l.status), src = sourceOf(l.source)
  const phone = callNumber(l)
  const waPhone = waNumber(l)
  const venue = businesses?.find((b) => b.id === lx.businessId)?.name
  const fu = lx.nextFollowUpAt ? new Date(lx.nextFollowUpAt) : null
  const fuTxt = fu && !isNaN(fu.getTime()) ? fu.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—"
  const item = (k: string, v: string) => `<div class="qv-item"><div class="k">${k}</div><div class="v">${escHtml(v || "—")}</div></div>`
  const telWa = phone || waPhone
    ? `${phone ? `<button class="btn btn-ghost sm" data-tel="${escHtml(phone)}" data-lead-id="${l.id}">${callSvg} Call</button>` : ""}${waPhone ? `<button class="btn btn-ghost sm" data-wa="${escHtml(waPhone)}" data-lead-id="${l.id}">${waSvg} WhatsApp</button>` : ""}`
    : `<span style="font-size:12px;color:var(--ink-3)">Koi phone nahi</span>`
  const canBook = !["booked", "lost", "archived"].includes(l.status || "")
  const nx = nextStageOf(l.status)
  const isTerminal = LEAD_CLOSED.includes((l.status || "new") as LeadStatus)
  const canReopen = l.status === "lost" || l.status === "archived"
  const advBtns = `${nx ? `<button class="btn btn-primary sm" data-lead-adv="${nx}" data-adv-id="${l.id}">✓ ${escHtml(STAGE[nx].label)} mark karein</button>` : ""}${!isTerminal ? `<button class="btn btn-ghost sm" data-lead-adv="lost" data-adv-id="${l.id}" style="color:var(--bad)">Khoya</button>` : ""}${canReopen ? `<button class="btn btn-primary sm" data-lead-adv="new" data-adv-id="${l.id}">Dobara kholein</button>` : ""}`
  const bookingId = l.booking?.id ?? l.bookingId ?? null
  const bookingLink = bookingId ? `<button class="btn btn-ghost sm" data-nav-btn="/dashboard/bookings/${bookingId}">Booking dekhein ›</button>` : ""
  return `<div class="qv-top"><span class="st ${st.tone}"><i></i> ${escHtml(st.label)}</span><span class="qv-src"><span class="srcdot" style="background:${src.color}"></span> ${escHtml(src.label)}</span><span style="margin-left:auto;font-size:11.5px;color:var(--ink-3)">${escHtml(relTime(l.updatedAt || l.createdAt))}</span></div>
    <div class="qv-contact">${telWa}</div>
    <div class="qv-grid">
      ${item("Event", cap(l.eventType))}
      ${item("Shaadi kab", shortDate(l.eventDate))}
      ${item("Budget", l.estimatedBudget != null ? `Rs ${pkNum(Number(l.estimatedBudget))}` : "—")}
      ${item("Mehmaan", l.estimatedGuests != null ? String(l.estimatedGuests) : "—")}
      ${item("Venue", ((l as unknown as { business?: { name?: string; city?: string } })?.business?.name || venue || "—") + (((l as unknown as { business?: { city?: string } })?.business?.city) ? ` (${(l as unknown as { business?: { city?: string } })?.business?.city})` : ""))}
      ${item("Agli follow-up", fuTxt)}
      ${item("Email", l.contactEmail || "—")}
      ${item("WhatsApp", l.contactWhatsapp || "—")}
    </div>
    ${(l.inquiry || l.notes) ? `<div class="qv-note">${escHtml(l.inquiry || l.notes || "")}</div>` : ""}
    <div class="qv-acts">
      ${advBtns}
      ${bookingLink}
      ${canBook ? `<button class="btn btn-ghost sm" data-lead-book="${l.id}">→ Booking banayein</button>` : ""}
      <button class="btn btn-ghost sm" data-lead-assign="${l.id}">⇄ Venue badlein</button>
      <button class="btn btn-ghost sm" data-lead-edit="${l.id}">Edit</button>
      <button class="btn btn-danger sm" data-lead-del="${l.id}">Delete</button>
      <button class="btn btn-ghost sm" data-nav-btn="/dashboard/leads/${l.id}">Poori profile ›</button>
    </div>`
}

const EVENT_TYPES: LeadEventType[] = ["mehndi", "nikah", "baraat", "walima", "engagement", "dholki", "other"]

type LeadExtra = { businessId?: number; subVenueId?: number | null; assignedToUserId?: number | null; nextFollowUpAt?: string | null }
type BizLite = { id: number; name?: string | null }

async function populateLeadDeps(s: ShadowRoot, businessId: number, selSub?: number | null, selRep?: number | null, me?: { id: number; name?: string | null } | null) {
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
    const st = await StaffAPI.listMembers({ businessId }) as unknown as { members?: { id: number; userId?: number | null; fullName?: string; name?: string }[] } | { id: number; userId?: number | null; fullName?: string; name?: string }[]
    const members = (Array.isArray(st) ? st : st?.members) || []
    const reps = assignableReps(members, me ?? null)
    if (repSel) repSel.innerHTML = `<option value="">— koi nahi —</option>` +
      reps.map((r) => `<option value="${r.userId}"${r.userId === selRep ? " selected" : ""}>${escHtml(r.label)}</option>`).join("")
  } catch { /* no staff module for this venue */ }
}

function leadFormHtml(l?: Lead, prefillDate?: string, businesses?: BizLite[], curBiz?: number | null): string {
  const v = (x: unknown) => (x != null && x !== "" ? escHtml(String(x)) : "")
  const lx = (l || {}) as LeadExtra
  const evOpts = EVENT_TYPES.map((e) => `<option value="${e}"${l?.eventType === e ? " selected" : ""}>${cap(e)}</option>`).join("")
  const srcOpts = (Object.keys(SOURCE) as LeadSource[]).map((k) => `<option value="${k}"${l?.source === k ? " selected" : ""}>${SOURCE[k].label}</option>`).join("")
  const stOpts = (Object.keys(STAGE) as LeadStatus[]).map((k) => `<option value="${k}"${(l?.status || "new") === k ? " selected" : ""}>${STAGE[k].label}</option>`).join("")
  const dateVal = escHtml(l?.eventDate ? String(l.eventDate).slice(0, 10) : safeDateValue(prefillDate))
  const selBiz = lx.businessId ?? curBiz ?? (businesses && businesses[0]?.id) ?? ""
  const bizOpts = (businesses || []).map((b) => `<option value="${b.id}"${Number(b.id) === Number(selBiz) ? " selected" : ""}>${escHtml(b.name || "Venue")}</option>`).join("")
  const fuVal = followUpInputValue(lx.nextFollowUpAt)
  return `<input type="hidden" id="ld-id" value="${l?.id ? escHtml(String(l.id)) : ""}"/>
    <input type="hidden" id="ld-upd" value="${l?.updatedAt ? escHtml(String(l.updatedAt)) : ""}"/>
    <div class="dfield"><label class="dlabel">Naam <span class="req">*</span></label><input id="ld-name" value="${v(l?.contactName)}" placeholder="Customer ka naam"/></div>
    <div class="dfield row2"><div><label class="dlabel">Phone</label><input id="ld-phone" value="${v(l?.contactPhone)}" placeholder="0300…"/></div><div><label class="dlabel">WhatsApp</label><input id="ld-wa" value="${v(l?.contactWhatsapp)}" placeholder="agar alag ho"/></div></div>
    <div class="dfield"><label class="dlabel">Email</label><input id="ld-email" value="${v(l?.contactEmail)}" placeholder="optional"/></div>
    <div class="dfield row2"><div><label class="dlabel">Venue <span class="req">*</span></label><select id="ld-biz">${bizOpts || `<option value="">—</option>`}</select></div><div><label class="dlabel">Hall / space</label><select id="ld-subvenue"><option value="">— poora venue —</option></select></div></div>
    <div class="dfield row2"><div><label class="dlabel">Event</label><select id="ld-event">${evOpts}</select></div><div><label class="dlabel">Shaadi kab</label><input type="date" id="ld-date" value="${dateVal}"/></div></div>
    <div class="dfield row2"><div><label class="dlabel">Budget (Rs)</label><input type="number" min="1" id="ld-budget" value="${l?.estimatedBudget != null ? l.estimatedBudget : ""}" placeholder="optional"/></div><div><label class="dlabel">Mehmaan</label><input type="number" min="1" step="1" id="ld-guests" value="${l?.estimatedGuests != null ? l.estimatedGuests : ""}" placeholder="optional"/></div></div>
    <div class="dfield row2"><div><label class="dlabel">Zariya</label><select id="ld-source">${srcOpts}</select></div><div><label class="dlabel">Status</label><select id="ld-status">${stOpts}</select></div></div>
    <div class="dfield row2"><div><label class="dlabel">Assign to</label><select id="ld-rep"><option value="">— koi nahi —</option></select></div><div><label class="dlabel">Agli follow-up</label><input type="datetime-local" id="ld-followup" value="${fuVal}"/></div></div>
    <div class="dfield"><label class="dlabel">Puchh-gichh / note</label><textarea id="ld-inquiry" placeholder="Kya poocha…">${v(l?.inquiry || l?.notes)}</textarea></div>
    <div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close>Cancel</button><button class="btn btn-primary" data-lead-save>${l ? "Update karein" : "Lead add karein"}</button></div>`
}

function buildContent(leads: Lead[], businesses: BizLite[]): string {
  const counts: Record<string, number> = { all: leads.length }
  leads.forEach((l) => { const t = stageOf(l.status).tab; counts[t] = (counts[t] || 0) + 1 })
  const tab = (f: string, label: string, dot: string, cnt: number, on = false) =>
    `<button class="tab${on ? " on" : ""}" data-f="${f}">${dot ? `<span class="dot" style="background:${dot}"></span> ` : ""}${label} <span class="cnt">${cnt || 0}</span></button>`

  // Collect unique venues
  const venueMap = new Map<number, string>()
  businesses.forEach((b) => { if (b.id && b.name) venueMap.set(b.id, b.name) })
  leads.forEach((l) => {
    const lx = l as unknown as LeadExtra
    const bz = (l as unknown as { business?: { id?: number; name?: string } })?.business
    const bid = lx.businessId ?? bz?.id
    const bname = bz?.name
    if (bid && bname && !venueMap.has(bid)) venueMap.set(bid, bname)
  })
  const venueOpts = Array.from(venueMap.entries())
    .map(([id, name]) => `<option value="${id}">${escHtml(name)}</option>`)
    .join("")

  const toolbar = `
  <div class="toolbar" style="display:flex;flex-direction:column;gap:12px;align-items:stretch">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div class="tabs" id="tabs" role="tablist">
        <button class="tab on" data-f="all">Sab <span class="cnt">${counts.all}</span></button>
        ${tab("new", "Naya", "var(--info)", counts.new)}
        ${tab("contacted", "Raabta", "var(--warn)", counts.contacted)}
        ${tab("quoted", "Quote", "var(--warn)", counts.quoted)}
        ${tab("qualified", "Visit", "var(--info)", counts.qualified)}
        ${tab("booked", "Jeeta", "var(--ok)", counts.booked)}
        ${tab("lost", "Khoya", "var(--bad)", counts.lost)}
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <select id="filter-venue" class="f-select" title="Filter by Venue">
          <option value="all">🏢 Saare venues (All listings)</option>
          ${venueOpts}
        </select>
        <select id="filter-event" class="f-select" title="Filter by Event">
          <option value="all">🎭 Saare events</option>
          <option value="baraat">Baraat</option>
          <option value="walima">Walima</option>
          <option value="mehndi">Mehndi</option>
          <option value="nikah">Nikah</option>
          <option value="engagement">Engagement</option>
          <option value="dholki">Dholki</option>
          <option value="other">Other</option>
        </select>
        <select id="filter-source" class="f-select" title="Filter by Source">
          <option value="all">📱 Saare zariye (All sources)</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="form_inquiry">Website</option>
          <option value="manual_phone">Phone</option>
          <option value="manual_walkin">Walk-in</option>
          <option value="instagram">Instagram</option>
          <option value="referral">Referral</option>
          <option value="in_app_chat">Chat</option>
          <option value="other">Other</option>
        </select>
        <label class="f-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><input id="lead-search-input" placeholder="Naam ya number dhoondein…" aria-label="Filter"/></label>
      </div>
    </div>
  </div>`

  const body = leads.map(rowHtml).join("")
  return `${toolbar}
  <div class="card">
    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th style="width:36px;text-align:center"><input type="checkbox" id="lead-select-all" title="Select all" style="cursor:pointer;width:15px;height:15px;accent-color:var(--gold, #d97706)"/></th>
            <th>Lead</th>
            <th>Event</th>
            <th>Shaadi kab</th>
            <th>Zariya</th>
            <th>Status</th>
            <th>Aakhri raabta</th>
            <th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody id="tbody">${body}</tbody>
      </table>
    </div>
    ${leads.length ? `<div class="tbl-foot"><span id="rowcount">${leads.length} leads</span></div>` : `<div class="empty">Abhi koi lead nahi. Nayi puchh-gichh yahan aayegi.<div style="margin-top:12px"><button class="btn btn-primary" data-lead-new>+ Naya lead</button></div></div>`}
  </div>
  <div id="lead-bulk-bar" style="display:none;position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--surface, #18181b);color:var(--ink, #fff);padding:8px 18px;border-radius:9999px;border:1px solid var(--border-2, #3f3f46);box-shadow:0 12px 30px rgba(0,0,0,0.4);z-index:9999;align-items:center;gap:12px;font-size:13px;font-family:inherit">
    <span id="lead-bulk-count" style="font-weight:600;color:var(--gold, #d97706)">0 selected</span>
    <span style="opacity:0.3">|</span>
    <button class="btn btn-primary sm" data-bulk-assign-btn style="background:var(--gold, #d97706);color:#000;font-weight:600;padding:5px 12px;border-radius:6px;border:none;cursor:pointer;font-size:12px;display:inline-flex;align-items:center;gap:5px">🏢 Assign Venue</button>
    <select id="lead-bulk-status-select" style="background:var(--surface-2, #27272a);color:var(--ink, #fff);border:1px solid var(--border-2, #3f3f46);border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer">
      <option value="">Status badlein...</option>
      <option value="new">Naya (New)</option>
      <option value="contacted">Raabta (Contacted)</option>
      <option value="quoted">Quote</option>
      <option value="qualified">Visit / Qualified</option>
      <option value="booked">Jeeta (Booked)</option>
      <option value="lost">Khoya (Lost)</option>
    </select>
    <button class="btn btn-danger sm" data-bulk-delete-btn style="background:#ef4444;color:#fff;font-weight:600;padding:5px 12px;border-radius:6px;border:none;cursor:pointer;font-size:12px;display:inline-flex;align-items:center;gap:5px">🗑️ Delete</button>
    <button class="btn btn-ghost sm" data-bulk-export-btn style="background:transparent;color:var(--ink-2, #d4d4d8);padding:4px 8px;border:none;cursor:pointer;font-size:12px">📥 Export</button>
    <button class="btn btn-ghost sm" data-bulk-clear-btn style="background:transparent;color:var(--bad, #f87171);padding:4px 8px;border:none;cursor:pointer;font-size:12px">✕ Clear</button>
  </div>`
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
  const { data, isError } = useQuery({ queryKey: ["leads-artifact"], queryFn: () => LeadAPI.listAll({}) })
  const leads = data?.leads ?? []
  const leadsRef = React.useRef(leads); leadsRef.current = leads
  const [assignLead, setAssignLead] = React.useState<Lead | null>(null)
  const [bulkAssignLeadIds, setBulkAssignLeadIds] = React.useState<number[]>([])
  const selectedLeadIds = React.useRef<Set<number>>(new Set())
  const searchParams = useSearchParams()
  const { user: me } = useUser()
  const meRef = React.useRef<{ id: number; name?: string | null } | null>(null)
  meRef.current = me ? { id: Number(me.id), name: (me as { fullName?: string | null }).fullName } : null

  const autoOpened = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || autoOpened.current) return
    const nd = searchParams?.get("new")
    if (nd) { autoOpened.current = true; openDrawer(s, "Naya lead", leadFormHtml(undefined, nd, bizListRef.current, bizRef.current)); populateLeadDeps(s, Number(bizRef.current), undefined, undefined, meRef.current) }
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
        wwc.innerHTML = head + buildContent(leads, bizListRef.current)
        initTablePager(s, { pageSize: 25, noun: "leads" })
        restoreTab(s, "tab:leads", (f) => setPagerFilter(s, (tr) => f === "all" || tr.dataset.status === f))
      }
    }

    const updateBulkBar = () => {
      const bar = s.getElementById("lead-bulk-bar")
      const countEl = s.getElementById("lead-bulk-count")
      const selectAll = s.getElementById("lead-select-all") as HTMLInputElement | null
      const count = selectedLeadIds.current.size
      if (bar) bar.style.display = count > 0 ? "flex" : "none"
      if (countEl) countEl.textContent = `${count} selected`
      const checks = s.querySelectorAll<HTMLInputElement>(".lead-row-check")
      let allChecked = checks.length > 0
      checks.forEach((chk) => {
        const id = Number(chk.dataset.id)
        chk.checked = selectedLeadIds.current.has(id)
        if (!chk.checked) allChecked = false
      })
      if (selectAll) selectAll.checked = allChecked && checks.length > 0
    }

    const runFilters = () => {
      const activeTab = (s.querySelector("#tabs .tab.on") as HTMLElement)?.dataset.f || "all"
      const venueVal = (s.getElementById("filter-venue") as HTMLSelectElement | null)?.value || "all"
      const eventVal = (s.getElementById("filter-event") as HTMLSelectElement | null)?.value || "all"
      const sourceVal = (s.getElementById("filter-source") as HTMLSelectElement | null)?.value || "all"

      setPagerFilter(s, (tr) => {
        if (activeTab !== "all" && tr.dataset.status !== activeTab) return false
        if (venueVal !== "all" && tr.dataset.bizId !== venueVal) return false
        if (eventVal !== "all" && tr.dataset.event !== eventVal) return false
        if (sourceVal !== "all" && tr.dataset.src !== sourceVal) return false
        return true
      })
      updateBulkBar()
    }

    if (!bound.current) {
      bound.current = true
      const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.value?.trim() ?? ""

      s.addEventListener("change", async (e) => {
        const t = e.target as HTMLElement
        if (t.id === "filter-venue" || t.id === "filter-event" || t.id === "filter-source") {
          runFilters()
          return
        }
        if (t.id === "ld-biz") {
          populateLeadDeps(s, Number((t as HTMLSelectElement).value), undefined, undefined, meRef.current)
          return
        }
        if (t.id === "lead-select-all") {
          const checked = (t as HTMLInputElement).checked
          const checks = s.querySelectorAll<HTMLInputElement>(".lead-row-check")
          checks.forEach((chk) => {
            const tr = chk.closest("tr")
            if (tr && !tr.hidden) {
              const id = Number(chk.dataset.id)
              if (checked) selectedLeadIds.current.add(id)
              else selectedLeadIds.current.delete(id)
              chk.checked = checked
            }
          })
          updateBulkBar()
          return
        }
        if (t.classList.contains("lead-row-check")) {
          const chk = t as HTMLInputElement
          const id = Number(chk.dataset.id)
          if (chk.checked) selectedLeadIds.current.add(id)
          else selectedLeadIds.current.delete(id)
          updateBulkBar()
          return
        }
        if (t.id === "lead-bulk-status-select") {
          const sel = t as HTMLSelectElement
          const newStatus = sel.value as LeadStatus
          if (!newStatus || selectedLeadIds.current.size === 0) return
          const ids = Array.from(selectedLeadIds.current)
          try {
            await LeadAPI.bulkTransition({ ids, to: newStatus })
            toast.success(`${ids.length} leads status badal diya gaya: ${STAGE[newStatus]?.label || newStatus}`)
            selectedLeadIds.current.clear()
            sel.value = ""
            updateBulkBar()
            qc.invalidateQueries({ queryKey: ["leads-artifact"] })
          } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Status nahi badla")
            sel.value = ""
          }
          return
        }
      })

      s.addEventListener("click", async (e) => {
        const t = e.target as HTMLElement
        if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["leads-artifact"] }); return }

        // Bulk clear
        if (t.closest("[data-bulk-clear-btn]")) {
          selectedLeadIds.current.clear()
          updateBulkBar()
          return
        }

        // Bulk delete
        if (t.closest("[data-bulk-delete-btn]")) {
          const count = selectedLeadIds.current.size
          if (count === 0) return
          openConfirm(s, {
            title: "Selected leads delete karein?",
            message: `${count} leads platform se mukammal delete ho jayengi. Kya aap waqai delete karna chahte hain?`,
            danger: true,
            confirmLabel: `Haan, ${count} leads delete karein`,
            onConfirm: async () => {
              try {
                const ids = Array.from(selectedLeadIds.current)
                await LeadAPI.bulkDelete(ids)
                toast.success(`${count} leads kamiyabi se delete ho gayin`)
                selectedLeadIds.current.clear()
                updateBulkBar()
                qc.invalidateQueries({ queryKey: ["leads-artifact"] })
              } catch (err: unknown) {
                toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Delete fail ho gaya")
              }
            },
          })
          return
        }

        // Bulk assign
        if (t.closest("[data-bulk-assign-btn]")) {
          const ids = Array.from(selectedLeadIds.current)
          if (ids.length === 0) return
          setBulkAssignLeadIds(ids)
          return
        }

        // Bulk export
        if (t.closest("[data-bulk-export-btn]")) {
          const selLeads = leadsRef.current.filter((l) => selectedLeadIds.current.has(l.id))
          if (selLeads.length === 0) { toast.info("Pehle leads select karein"); return }
          const rows = selLeads.map((l) => [
            l.id,
            l.contactName || "",
            l.contactPhone || "",
            l.contactEmail || "",
            l.eventType || "",
            l.eventDate ? String(l.eventDate).slice(0, 10) : "",
            l.estimatedBudget ?? "",
            l.estimatedGuests ?? "",
            l.source || "",
            l.status || "",
            (l as unknown as { business?: { name?: string } })?.business?.name || "",
          ])
          const head = ["ID", "Name", "Phone", "Email", "Event", "Event Date", "Budget", "Guests", "Source", "Status", "Venue"]
          const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`
          a.click()
          URL.revokeObjectURL(url)
          toast.success(`${selLeads.length} leads export ho gayin`)
          return
        }

        // Single lead delete
        const delBtn = t.closest("[data-lead-del]") as HTMLElement | null
        if (delBtn?.dataset.leadDel) {
          const id = Number(delBtn.dataset.leadDel)
          const l = leadsRef.current.find((x) => x.id === id)
          openConfirm(s, {
            title: "Lead delete karein?",
            message: `Lead #${id} (${l?.contactName || "Client"}) delete ho jayegi. Kya aap waqai delete karna chahte hain?`,
            danger: true,
            confirmLabel: "Haan, delete karein",
            onConfirm: async () => {
              try {
                await LeadAPI.delete(id)
                toast.success("Lead delete ho gayi")
                selectedLeadIds.current.delete(id)
                updateBulkBar()
                closeDrawer(s)
                qc.invalidateQueries({ queryKey: ["leads-artifact"] })
              } catch (err: unknown) {
                toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Delete nahi hui")
              }
            },
          })
          return
        }

        const wa = t.closest("[data-wa]") as HTMLElement | null
        if (wa) { const p = waDigits(wa.dataset.wa); if (p) window.open(`https://wa.me/${p}?text=${encodeURIComponent("Assalam-o-Alaikum! Aap ki puchh-gichh ka shukriya.")}`, "_blank", "noopener"); void logContact(wa.dataset.leadId, "whatsapp"); return }
        const tel = t.closest("[data-tel]") as HTMLElement | null
        if (tel) { if (tel.dataset.tel) { window.location.href = `tel:${tel.dataset.tel.replace(/\s/g, "")}`; void logContact(tel.dataset.leadId, "call") } return }

        // quick-view drawer (row click)
        const lv = t.closest("[data-lead-view]") as HTMLElement | null
        if (lv?.dataset.leadView) { const l = leadsRef.current.find((x) => x.id === Number(lv.dataset.leadView)); if (l) openDrawer(s, l.contactName || "Lead", leadQuickViewHtml(l, bizListRef.current)); return }

        // assign venue modal
        const assign = t.closest("[data-lead-assign]") as HTMLElement | null
        if (assign?.dataset.leadAssign) {
          const l = leadsRef.current.find((x) => x.id === Number(assign.dataset.leadAssign))
          if (l) setAssignLead(l)
          return
        }
        if (t.closest("[data-lead-new]")) { openDrawer(s, "Naya lead", leadFormHtml(undefined, undefined, bizListRef.current, bizRef.current)); populateLeadDeps(s, Number(bizRef.current), undefined, undefined, meRef.current); return }

        // one-tap pipeline stage-advance
        const adv = t.closest("[data-lead-adv]") as HTMLElement | null
        if (adv?.dataset.leadAdv) {
          const id = Number(adv.dataset.advId); const to = adv.dataset.leadAdv as LeadStatus
          if (to === "lost") { openDrawer(s, "Lead khoya mark karein", lostReasonFormHtml(id)); return }
          adv.setAttribute("disabled", "true")
          try { await LeadAPI.transition(id, { to }); toast.success(`Status: ${STAGE[to]?.label || to}`); closeDrawer(s); qc.invalidateQueries({ queryKey: ["leads-artifact"] }) }
          catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Status nahi badla"); adv.removeAttribute("disabled") }
          return
        }
        const lostGo = t.closest("[data-lead-lost-go]") as HTMLButtonElement | null
        if (lostGo?.dataset.leadLostGo) {
          const id = Number(lostGo.dataset.leadLostGo)
          lostGo.disabled = true
          try { await LeadAPI.transition(id, { to: "lost", statusReason: lostReasonText(val("lost-reason"), val("lost-note")) }); toast.success("Status: Khoya"); closeDrawer(s); qc.invalidateQueries({ queryKey: ["leads-artifact"] }) }
          catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Status nahi badla"); lostGo.disabled = false }
          return
        }
        const led = t.closest("[data-lead-edit]") as HTMLElement | null
        if (led?.dataset.leadEdit) { const l = leadsRef.current.find((x) => x.id === Number(led.dataset.leadEdit)); if (l) { const lx = l as unknown as LeadExtra; openDrawer(s, "Lead edit karein", leadFormHtml(l, undefined, bizListRef.current, bizRef.current)); populateLeadDeps(s, Number(lx.businessId ?? bizRef.current), lx.subVenueId, lx.assignedToUserId, meRef.current) } return }

        // lead → booking
        const lbk = t.closest("[data-lead-book]") as HTMLElement | null
        if (lbk?.dataset.leadBook) {
          const l = leadsRef.current.find((x) => x.id === Number(lbk.dataset.leadBook)); if (!l) return
          const lx = l as unknown as LeadExtra
          openBookingForm(s, {
            prefill: { customerName: l.contactName || undefined, customerPhone: callNumber(l) || undefined, customerEmail: l.contactEmail || undefined, bookingDate: l.eventDate ? String(l.eventDate).slice(0, 10) : undefined, guestCount: l.estimatedGuests ?? undefined, businessId: lx.businessId ?? Number(bizRef.current), subVenueId: lx.subVenueId ?? undefined, leadId: l.id },
            businesses: bizListRef.current, activeBiz: bizRef.current,
            onSaved: async (res) => {
              const newBookingId = bookingIdFromSaved(res)
              try {
                if (newBookingId) await LeadAPI.linkBooking(l.id, newBookingId)
                else await LeadAPI.update(l.id, { status: "booked" } as UpdateLeadInput)
              } catch {
                toast.error("Booking ban gayi, lekin lead 'jeeta' mark nahi hui — lead khol kar status badal dein")
              }
              qc.invalidateQueries({ queryKey: ["leads-artifact"] })
            },
          })
          return
        }

        if (t.closest("[data-lead-save]")) {
          const name = val("ld-name"); if (!name) { toast.error("Naam likhein"); return }
          const editId = Number(val("ld-id"))
          if (leadNumberProblem(s, { budget: val("ld-budget"), guests: val("ld-guests") }, editId ? leadsRef.current.find((x) => x.id === editId) : undefined)) return
          const bizPick = Number(val("ld-biz")) || Number(bizRef.current) || 0
          const common = {
            contactName: name, contactPhone: val("ld-phone") || undefined, contactWhatsapp: val("ld-wa") || undefined, contactEmail: val("ld-email") || undefined,
            eventType: val("ld-event") as LeadEventType, eventDate: val("ld-date") || null,
            estimatedBudget: val("ld-budget") ? Number(val("ld-budget")) : null, estimatedGuests: val("ld-guests") ? Number(val("ld-guests")) : null,
            source: val("ld-source") as LeadSource, status: val("ld-status") as LeadStatus, inquiry: val("ld-inquiry") || undefined,
            subVenueId: val("ld-subvenue") ? Number(val("ld-subvenue")) : null,
            assignedToUserId: val("ld-rep") ? Number(val("ld-rep")) : null,
            nextFollowUpAt: followUpPayload(val("ld-followup")),
          }
          const btn = t.closest("[data-lead-save]") as HTMLButtonElement; btn.disabled = true; btn.textContent = "Save ho raha…"
          let dupWarn = ""
          try {
            if (editId) {
              const orig = leadsRef.current.find((x) => x.id === editId)
              const diff = orig ? changedLeadFields(common as unknown as Record<string, unknown>, orig as unknown as Record<string, unknown>) : common
              const lxo = orig as unknown as LeadExtra | undefined
              const bizChanged = !!(bizPick && lxo?.businessId && bizPick !== lxo.businessId)
              if (orig && !Object.keys(diff).length && !bizChanged) { toast.info("Kuch badla nahi"); closeDrawer(s); return }
              for (const k of Object.keys(diff)) if ((diff as Record<string, unknown>)[k] === undefined) (diff as Record<string, unknown>)[k] = null
              await LeadAPI.update(editId, { ...diff, ...(bizChanged ? { businessId: bizPick } : {}), ...(val("ld-upd") ? { expectedUpdatedAt: val("ld-upd") } : {}) } as UpdateLeadInput)
            } else {
              if (!bizPick) { toast.error("Venue select karein"); btn.disabled = false; return }
              const made = await LeadAPI.createWithMeta({ businessId: bizPick, ...common } as CreateLeadInput)
              if (made.possibleDuplicates.length) dupWarn = made.possibleDuplicates.map((d) => `${d.contactName || "Lead"} #${d.id}`).join(", ")
            }
            const elsewhere = bizPick && bizRef.current != null && Number(bizRef.current) !== bizPick
            if (dupWarn) toast.warning(`Is number ki lead pehle se khuli hai: ${dupWarn}. Dobara to nahi?`)
            toast.success(editId ? "Lead update ho gaya" : elsewhere ? `Naya lead ban gaya — ${bizListRef.current.find((b) => b.id === bizPick)?.name || "doosre venue"} mein (sidebar se wo venue chunein)` : "Naya lead ban gaya"); closeDrawer(s); qc.invalidateQueries({ queryKey: ["leads-artifact"] })
          } catch (err: unknown) { if (!showLeadFieldError(s, err)) toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua"); if ((err as { response?: { status?: number } })?.response?.status === 409) qc.invalidateQueries({ queryKey: ["leads-artifact"] }); btn.disabled = false; btn.textContent = editId ? "Update karein" : "Lead add karein" }
          return
        }

        const btn = t.closest(".tab") as HTMLElement | null
        if (!btn) return
        const tabsEl = s.getElementById("tabs"); if (!tabsEl) return
        tabsEl.querySelectorAll(".tab").forEach((x) => x.classList.remove("on"))
        btn.classList.add("on")
        const f = btn.dataset.f || "all"
        savePref("tab:leads", f)
        runFilters()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, isError])

  return (
    <>
      <div ref={hostRef} />
      {assignLead && (
        <AssignToBusinessModal
          open={!!assignLead}
          onOpenChange={(v) => !v && setAssignLead(null)}
          lead={{
            id: assignLead.id,
            contactName: assignLead.contactName,
            contactPhone: assignLead.contactPhone,
            businessName: (assignLead as unknown as { business?: { name?: string } })?.business?.name || "Unassigned",
            eventType: assignLead.eventType,
          }}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["leads-artifact"] })
            setAssignLead(null)
          }}
        />
      )}
      {bulkAssignLeadIds.length > 0 && (
        <AssignToBusinessModal
          open={bulkAssignLeadIds.length > 0}
          onOpenChange={(v) => !v && setBulkAssignLeadIds([])}
          bulkLeadIds={bulkAssignLeadIds}
          onSuccess={() => {
            selectedLeadIds.current.clear()
            qc.invalidateQueries({ queryKey: ["leads-artifact"] })
            setBulkAssignLeadIds([])
          }}
        />
      )}
    </>
  )
}

export default LeadsArtifact
