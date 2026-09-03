"use client"

/**
 * Lead detail — pixel-faithful to the design sample
 * (docs/design-samples/lead-detail.html): back-link + header (stage badge + hot
 * flag), 4-stat strip, and a two-column layout — Pipeline stepper + "next step"
 * nudge + requirement + conversation timeline on the left; Customer + Lead info
 * + Quick actions + Notes on the right.
 *
 * Wired to the REAL backend via the shared shell: LeadAPI.get(id). There is no
 * per-lead activity feed on the backend, so the conversation timeline is built
 * honestly from what the lead itself records (created, source, current stage,
 * last update) rather than inventing events.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  LeadAPI, type Lead, type LeadStatus, type LeadSource, type LeadEventType,
} from "@/lib/api/leads"
import { waDigits } from "@/components/dashboard/mainScreens/leads/artifact/leads-artifact"
import { openBookingForm } from "@/components/dashboard/mainScreens/artifact/booking-form"
import { useBusiness } from "@/context/BusinessContext"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useArtifactShell, pkNum, escHtml, initialsOf, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

/* ── label maps (Urdu, matching the leads list) ──────────────── */
const STAGE_UI: Record<LeadStatus, { label: string; tone: string }> = {
  new: { label: "Naya", tone: "info" },
  contacted: { label: "Raabta hua", tone: "warn" },
  qualified: { label: "Visit tay", tone: "info" },
  quoted: { label: "Quote bheja", tone: "warn" },
  booked: { label: "Jeeta", tone: "ok" },
  lost: { label: "Khoya", tone: "bad" },
  archived: { label: "Archive", tone: "mut" },
}
const SOURCE_UI: Record<LeadSource, string> = {
  whatsapp: "WhatsApp", instagram: "Instagram", referral: "Referral", form_inquiry: "Website",
  in_app_chat: "Chat", manual_phone: "Phone", manual_walkin: "Walk-in", other: "Other",
}
const EVENT_UI: Record<LeadEventType, string> = {
  mehndi: "Mehndi", nikah: "Nikah", baraat: "Barat", walima: "Walima", engagement: "Mangni", dholki: "Dholki", other: "Event",
}
const stageUi = (s?: LeadStatus) => STAGE_UI[s || "new"] || STAGE_UI.new
const sourceUi = (s?: LeadSource) => SOURCE_UI[s || "other"] || "Other"
const eventUi = (t?: LeadEventType | null) => (t ? EVENT_UI[t] || "Event" : "—")

/* pipeline order (display), + rank of each real status onto it */
const PIPE: Array<{ key: LeadStatus; label: string }> = [
  { key: "new", label: "Naya" }, { key: "contacted", label: "Raabta hua" },
  { key: "quoted", label: "Quote" }, { key: "qualified", label: "Visit" }, { key: "booked", label: "Jeeta" },
]
const RANK: Partial<Record<LeadStatus, number>> = { new: 0, contacted: 1, quoted: 2, qualified: 3, booked: 4 }

/* ── formatting ──────────────────────────────────────────────── */
function fmtDate(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso); if (isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
}
function fmtMonth(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso); if (isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString("en-PK", { month: "short", year: "numeric" })
}
function monthsAway(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso).getTime(); if (isNaN(d)) return ""
  const days = Math.round((d - Date.now()) / 86400000)
  if (days < 0) return "guzar gayi"
  if (days < 31) return `~${days} din`
  return `~${Math.round(days / 30)} mahine`
}
const numOr = (v: number | string | null | undefined) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0 }

/* ── icons ───────────────────────────────────────────────────── */
const I = {
  back: '<path d="M15 6l-6 6 6 6"/>',
  quote: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  users: '<path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>',
  cal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  stage: '<path d="M4 22V4h13l-2 4 2 4H4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M15 11a3 3 0 1 0 0-6M3 20c0-3 2.7-5 6-5s6 2 6 5"/>',
  flame: '<path d="M12 2c1 3-1 4-1 6a3 3 0 0 0 6 0c0-1 0-2-1-3 3 2 5 5 5 9a9 9 0 1 1-18 0c0-4 3-7 5-9 0 2 1 3 2 3 1-1 1-3-1-6z"/>',
}
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`

const EXTRA_CSS = String.raw`
.content{ max-width:1240px; }
.back{ display:inline-flex; align-items:center; gap:5px; font-size:12.5px; color:var(--ink-3); font-weight:500; margin-bottom:14px; background:none; border:0; } .back:hover{ color:var(--ink); } .back svg{ width:15px; height:15px; }
.dhead{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:18px; flex-wrap:wrap; }
.dh-left{ display:flex; align-items:center; gap:14px; }
.dh-mono{ width:52px; height:52px; border-radius:13px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; font-weight:600; font-size:14px; color:var(--ink-2); flex:none; }
.dh-title{ display:flex; align-items:center; gap:10px; font-size:23px; font-weight:600; letter-spacing:-.025em; flex-wrap:wrap; }
.dh-sub{ font-size:12.5px; color:var(--ink-3); margin-top:4px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; } .dh-sub .sep{ color:var(--border-2); }
.dhead-actions{ display:flex; gap:8px; align-items:center; } .btn.icon{ width:36px; padding:0; }
.hot{ display:inline-flex; align-items:center; gap:3px; font-size:10.5px; font-weight:700; color:var(--bad); text-transform:uppercase; letter-spacing:.03em; } .hot svg{ width:13px; height:13px; }
.stats{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:14px; }
.stat{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:14px 15px; box-shadow:var(--shadow-xs); }
.stat .s-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .stat .s-cap svg{ width:13px; height:13px; }
.stat .s-val{ font-size:19px; font-weight:660; letter-spacing:-.02em; margin-top:9px; line-height:1.1; } .stat .s-val .rs{ font-size:12px; color:var(--ink-3); font-weight:600; } .stat .s-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.stat.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .stat.hl .s-cap,.stat.hl .s-val{ color:var(--accent-ink); } .stat.hl .s-sub{ color:var(--accent-ink); opacity:.85; }
.two{ display:grid; grid-template-columns:1.7fr 1fr; gap:14px; align-items:start; } .col-stack{ display:flex; flex-direction:column; gap:14px; min-width:0; }
.card-h{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px 12px; } .card-h h2{ font-size:13.5px; font-weight:600; letter-spacing:-.01em; } .card-h .sub{ font-size:11.5px; color:var(--ink-3); margin-top:2px; font-weight:400; }
.link{ font-size:12.5px; font-weight:500; color:var(--ink-2); display:inline-flex; align-items:center; gap:3px; padding:5px 7px; border-radius:7px; margin:-5px -7px; border:0; background:none; } .link:hover{ background:var(--surface-3); color:var(--ink); }
/* stepper */
.stepper{ display:flex; padding:12px 18px 4px; }
.stp{ flex:1; display:flex; flex-direction:column; align-items:center; position:relative; text-align:center; }
.stp::before{ content:""; position:absolute; top:13px; right:50%; width:100%; height:2px; background:var(--border); } .stp:first-child::before{ display:none; } .stp.done::before,.stp.active::before{ background:var(--accent); }
.stp .sdot{ width:30px; height:30px; border-radius:50%; background:var(--surface); border:2px solid var(--border-2); display:grid; place-items:center; position:relative; z-index:1; color:var(--ink-4); font-size:12px; font-weight:600; } .stp .sdot svg{ width:15px; height:15px; }
.stp.done .sdot{ background:var(--accent); border-color:transparent; color:var(--on-accent); }
.stp.active .sdot{ background:var(--surface); border-color:var(--accent); color:var(--accent-ink); box-shadow:0 0 0 4px var(--accent-wash); }
.stp.active .sdot::after{ content:""; position:absolute; inset:-5px; border-radius:50%; border:2px solid var(--accent); opacity:.5; animation:stppulse 2.2s ease-out infinite; }
@keyframes stppulse{ 0%{transform:scale(.65);opacity:.55} 100%{transform:scale(1.55);opacity:0} }
.stp.active .sdot i{ width:8px; height:8px; border-radius:50%; background:var(--accent); }
.stp .slbl{ font-size:11.5px; font-weight:600; margin-top:10px; color:var(--ink-3); } .stp.done .slbl{ color:var(--ink-2); } .stp.active .slbl{ color:var(--accent-ink); }
.stp .ssub{ font-size:10px; color:var(--ink-4); margin-top:3px; } .stp.done .ssub{ color:var(--ink-3); } .stp.active .ssub{ color:var(--accent-ink); font-weight:600; }
.next-step{ margin:16px; padding:12px 14px; border-radius:var(--r-sm); background:var(--accent-wash); border:1px solid var(--accent-line); display:flex; gap:11px; align-items:flex-start; } .next-step svg{ width:17px; height:17px; color:var(--accent-ink); flex:none; margin-top:1px; }
.next-step .ns-t{ font-weight:600; font-size:12.5px; color:var(--accent-ink); } .next-step .ns-s{ font-size:11.5px; color:var(--ink-2); margin-top:2px; line-height:1.5; }
.ns-acts{ display:flex; gap:8px; flex-wrap:wrap; padding:0 16px 16px; } .ns-acts .btn{ height:36px; } .ns-acts .btn.danger{ color:var(--bad); } .ns-acts .btn.danger:hover{ background:var(--bad-wash); border-color:transparent; }
/* timeline */
.tl-item{ display:flex; gap:13px; position:relative; padding-bottom:16px; } .tl-item:last-child{ padding-bottom:2px; }
.tl-item::before{ content:""; position:absolute; left:11px; top:25px; bottom:-1px; width:2px; background:var(--border); } .tl-item:last-child::before{ display:none; } .tl-item.done::before{ background:var(--ok); opacity:.35; }
.tl-dot{ width:24px; height:24px; border-radius:50%; flex:none; display:grid; place-items:center; background:var(--surface-3); border:1px solid var(--border-2); color:var(--ink-4); z-index:1; } .tl-dot svg{ width:13px; height:13px; }
.tl-item.done .tl-dot{ background:var(--ok-wash); border-color:transparent; color:var(--ok); } .tl-item.acc .tl-dot{ background:var(--accent-wash); border-color:var(--accent-line); color:var(--accent-ink); }
.tl-body{ flex:1; min-width:0; padding-top:2px; } .tl-title{ font-weight:600; font-size:13px; } .tl-meta{ font-size:11.5px; color:var(--ink-3); margin-top:2px; }
/* dl / customer / notes / qa */
.dl{ padding:2px 16px 12px; } .dl-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:9px 0; border-bottom:1px solid var(--border); font-size:12.5px; } .dl-row:last-child{ border-bottom:0; }
.dl-row .k{ color:var(--ink-3); display:inline-flex; align-items:center; gap:7px; } .dl-row .k svg{ width:14px; height:14px; color:var(--ink-4); } .dl-row .v{ font-weight:600; color:var(--ink); text-align:right; word-break:break-word; }
.cust{ padding:2px 16px 16px; } .cust-top{ display:flex; align-items:center; gap:12px; }
.cust-ava{ width:44px; height:44px; border-radius:12px; background:linear-gradient(150deg,#3f6fa6,#6f9fd0); color:#fff; display:grid; place-items:center; font-weight:600; font-size:15px; flex:none; }
.cust-nm{ font-weight:600; font-size:14px; } .cust-role{ font-size:11.5px; color:var(--ink-3); margin-top:1px; }
.cust-actions{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:14px; }
.cact{ display:flex; flex-direction:column; align-items:center; gap:5px; padding:10px 4px; border-radius:9px; border:1px solid var(--border); background:var(--surface); color:var(--ink-2); font-size:11px; font-weight:600; transition:background .12s,border-color .12s,color .12s; } .cact:hover{ background:var(--surface-3); color:var(--ink); border-color:var(--border-2); } .cact svg{ width:17px; height:17px; } .cact.wa:hover{ color:var(--ok); } .cact:disabled{ opacity:.45; cursor:default; }
.qa{ padding:6px 12px 14px; display:flex; flex-direction:column; gap:8px; } .qa .btn{ width:100%; justify-content:flex-start; height:38px; } .qa .btn.danger{ color:var(--bad); } .qa .btn.danger:hover{ background:var(--bad-wash); border-color:transparent; }
.note{ padding:2px 16px 16px; } .note textarea{ width:100%; min-height:76px; resize:vertical; border:1px solid var(--border); border-radius:9px; background:var(--surface-2); color:var(--ink); padding:10px 11px; font:inherit; font-size:12.5px; outline:none; } .note textarea:focus{ border-color:var(--border-2); background:var(--surface); } .note textarea::placeholder{ color:var(--ink-3); }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:1080px){ .stats{ grid-template-columns:repeat(2,1fr); } .two{ grid-template-columns:1fr; } }
`

function buildDetail(lead: Lead): string {
  const name = lead.contactName || "Lead"
  const su = stageUi(lead.status)
  const cur = RANK[lead.status] ?? (lead.status === "lost" || lead.status === "archived" ? -1 : 0)
  const budget = numOr(lead.estimatedBudget)
  const guests = lead.estimatedGuests ?? null
  const hot = budget >= 1000000
  const phone = lead.contactPhone || ""
  const waP = waDigits(phone)
  const nextStage = cur >= 0 && cur < PIPE.length - 1 ? PIPE[cur + 1] : null
  const terminal = lead.status === "booked" || lead.status === "lost" || lead.status === "archived"

  /* stepper */
  const steps = PIPE.map((p, i) => {
    const cls = i < cur ? "done" : i === cur ? "active" : ""
    const dot = i < cur ? `<span class="sdot">${svg(I.check, 2.6)}</span>`
      : i === cur ? `<span class="sdot"><i></i></span>`
        : `<span class="sdot">${i + 1}</span>`
    const ssub = i === 0 && i <= cur ? fmtDate(lead.createdAt)
      : i === cur ? "abhi yahan"
        : i === cur + 1 ? "agla kadam"
          : i < cur ? "" : "baaki"
    return `<div class="stp ${cls}">${dot}<span class="slbl">${escHtml(p.label)}</span><span class="ssub">${escHtml(ssub)}</span></div>`
  }).join("")

  const nextText = lead.status === "booked" ? "Ye lead jeet li gayi 🎉 — booking ban chuki."
    : lead.status === "lost" ? "Ye lead khoyi hui hai. Dobara koshish karni ho to raabta karein."
      : nextStage?.key === "quoted" ? `${sourceUi(lead.source)} se aaya${budget ? `, ~${pkNum(budget)} budget` : ""}. ${eventUi(lead.eventType)} ka package quote taiyar karke bhej dein.`
        : nextStage?.key === "qualified" ? "Venue visit tay karein — customer ko hall dikhayein."
          : nextStage?.key === "booked" ? "Deal final karein aur booking bana dein."
            : "Customer se raabta karke requirement confirm karein."
  const nextTitle = lead.status === "booked" ? "Jeeta" : lead.status === "lost" ? "Khoya" : `Agla kadam — ${nextStage?.label || "Follow up"}`

  /* honest conversation timeline (no per-lead activity API) */
  const tl: string[] = []
  tl.push(`<div class="tl-item acc"><span class="tl-dot">${svg(I.clock)}</span><div class="tl-body"><div class="tl-title">${escHtml(nextTitle)}</div><div class="tl-meta">Abhi · stage: ${escHtml(su.label)}</div></div></div>`)
  if (lead.statusReason) tl.push(`<div class="tl-item done"><span class="tl-dot">${svg(I.check)}</span><div class="tl-body"><div class="tl-title" style="font-weight:500">${escHtml(lead.statusReason)}</div><div class="tl-meta">${fmtDate(lead.updatedAt)}</div></div></div>`)
  if (lead.updatedAt && lead.updatedAt !== lead.createdAt) tl.push(`<div class="tl-item done"><span class="tl-dot">${svg(I.check)}</span><div class="tl-body"><div class="tl-title" style="font-weight:500">Stage update: ${escHtml(su.label)}</div><div class="tl-meta">${fmtDate(lead.updatedAt)}</div></div></div>`)
  tl.push(`<div class="tl-item"><span class="tl-dot">${svg(I.people)}</span><div class="tl-body"><div class="tl-title" style="font-weight:500">Lead aaya — ${escHtml(sourceUi(lead.source))}${lead.sourceRef ? ` (${escHtml(lead.sourceRef)})` : ""}</div><div class="tl-meta">${fmtDate(lead.createdAt)}</div></div></div>`)

  const custActions = `<div class="cust-actions">
    <button class="cact" ${phone ? `data-tel="${escHtml(phone)}"` : "disabled"}>${svg(I.phone)} Call</button>
    <button class="cact wa" ${waP ? `data-wa="${escHtml(phone)}"` : "disabled"}>${svg(I.wa)} WhatsApp</button>
    <button class="cact" data-nav-btn="/dashboard/chat">${svg(I.chat)} Message</button></div>`

  return `
  <button class="back" data-nav-btn="/dashboard/leads">${svg(I.back, 2.2)} Sab leads</button>

  <div class="dhead">
    <div class="dh-left">
      <span class="dh-mono" aria-hidden="true">${escHtml(initialsOf(name))}</span>
      <div>
        <div class="dh-title">${escHtml(name)} <span class="st ${su.tone}"><i></i> ${escHtml(su.label)}</span>${hot ? `<span class="hot"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none">${I.flame}</svg> Hot lead</span>` : ""}</div>
        <div class="dh-sub"><span>${escHtml(eventUi(lead.eventType))}</span>${guests != null ? `<span class="sep">·</span><span>~${guests} mehmaan</span>` : ""}<span class="sep">·</span><span>${escHtml(sourceUi(lead.source))} se</span></div>
      </div>
    </div>
    <div class="dhead-actions">
      <button class="btn btn-ghost icon" ${phone ? `data-tel="${escHtml(phone)}"` : "disabled"} aria-label="Call">${svg(I.phone)}</button>
      <button class="btn btn-ghost icon" ${waP ? `data-wa="${escHtml(phone)}"` : "disabled"} aria-label="WhatsApp">${svg(I.wa)}</button>
      <button class="btn btn-primary" data-nav-btn="/dashboard/quotes?leadId=${lead.id}">${svg(I.quote)} Quote bhejein</button>
    </div>
  </div>

  <div class="stats">
    <div class="stat hl"><div class="s-cap">${svg(I.stage)} Stage</div><div class="s-val">${escHtml(su.label)}</div><div class="s-sub">${cur >= 0 ? `${cur + 1}-wa stage` : "band"}${nextStage ? ` · agla: ${escHtml(nextStage.label)}` : ""}</div></div>
    <div class="stat"><div class="s-cap">${svg(I.users)} Event</div><div class="s-val">${escHtml(eventUi(lead.eventType))}</div><div class="s-sub">${guests != null ? `~${guests} mehmaan` : "mehmaan —"}</div></div>
    <div class="stat"><div class="s-cap">${svg(I.cal)} Shaadi kab</div><div class="s-val">${escHtml(fmtMonth(lead.eventDate))}</div><div class="s-sub">${escHtml(monthsAway(lead.eventDate) || "date —")}</div></div>
    <div class="stat"><div class="s-cap">${svg(I.card)} Budget</div><div class="s-val tnum">${budget ? `~<span class="rs">Rs</span> ${pkNum(budget)}` : "—"}</div><div class="s-sub">${hot ? "high value lead" : "estimate"}</div></div>
  </div>

  <div class="two">
    <div class="col-stack">
      <div class="card">
        <div class="card-h"><div><h2>Pipeline</h2><div class="sub">Lead kahan tak pohcha</div></div></div>
        <div class="stepper">${steps}</div>
        <div class="next-step">${svg(I.bolt)}<div><div class="ns-t">${escHtml(nextTitle)}</div><div class="ns-s">${escHtml(nextText)}</div></div></div>
        ${nextStage ? `<div class="ns-acts"><button class="btn btn-primary" data-adv-status="${nextStage.key}">${svg(I.check, 2.4)} ${escHtml(nextStage.label)} mark karein</button><button class="btn btn-ghost danger" data-adv-status="lost">${svg(I.x)} Khoya</button></div>` : ""}
      </div>

      <div class="card">
        <div class="card-h"><div><h2>Kya chahiye</h2><div class="sub">Customer ki requirement</div></div></div>
        <div class="dl">
          <div class="dl-row"><span class="k">Event</span><span class="v">${escHtml(eventUi(lead.eventType))}</span></div>
          <div class="dl-row"><span class="k">Mehmaan</span><span class="v tnum">${guests != null ? `~${guests}` : "—"}</span></div>
          <div class="dl-row"><span class="k">Taareekh</span><span class="v">${escHtml(fmtMonth(lead.eventDate))}${lead.eventDate ? ` · ${escHtml(monthsAway(lead.eventDate))}` : ""}</span></div>
          <div class="dl-row"><span class="k">Budget</span><span class="v tnum">${budget ? `~Rs ${pkNum(budget)}` : "—"}</span></div>
          <div class="dl-row"><span class="k">Zariya</span><span class="v">${escHtml(sourceUi(lead.source))}</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-h"><div><h2>Baat-cheet</h2><div class="sub">Lead ke saath activity</div></div></div>
        <div style="padding:2px 16px 14px">${tl.join("")}</div>
      </div>
    </div>

    <div class="col-stack">
      <div class="card">
        <div class="card-h"><div><h2>Customer</h2></div></div>
        <div class="cust">
          <div class="cust-top"><span class="cust-ava" aria-hidden="true">${escHtml(initialsOf(name))}</span>
            <div><div class="cust-nm">${escHtml(name)}</div><div class="cust-role">${escHtml(sourceUi(lead.source))}${lead.sourceRef ? ` · ${escHtml(lead.sourceRef)}` : ""}</div></div></div>
          ${custActions}
        </div>
        <div class="dl">
          <div class="dl-row"><span class="k">${svg(I.phone)} Phone</span><span class="v tnum">${escHtml(phone || "—")}</span></div>
          <div class="dl-row"><span class="k">${svg(I.mail)} Email</span><span class="v">${escHtml(lead.contactEmail || "—")}</span></div>
          <div class="dl-row"><span class="k">${svg(I.card)} Source</span><span class="v">${escHtml(sourceUi(lead.source))}</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-h"><div><h2>Lead info</h2></div></div>
        <div class="dl">
          <div class="dl-row"><span class="k">Stage</span><span class="v">${escHtml(su.label)}</span></div>
          <div class="dl-row"><span class="k">Aaya</span><span class="v">${escHtml(fmtDate(lead.createdAt))}</span></div>
          <div class="dl-row"><span class="k">Assigned</span><span class="v">${escHtml(lead.assignedTo?.fullName || "—")}</span></div>
          <div class="dl-row"><span class="k">Value</span><span class="v tnum">${budget ? `~Rs ${pkNum(budget)}` : "—"}</span></div>
          <div class="dl-row"><span class="k">Priority</span><span class="v" style="color:${hot ? "var(--bad)" : "var(--ink)"}">${hot ? "Hot" : "Normal"}</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-h"><div><h2>Quick actions</h2></div></div>
        <div class="qa">
          <button class="btn btn-primary" data-nav-btn="/dashboard/quotes?leadId=${lead.id}">${svg(I.quote)} Quote bhejein</button>
          <button class="btn btn-ghost" data-nav-btn="/dashboard/calendar">${svg(I.cal)} Visit schedule karein</button>
          ${lead.bookingId ? `<button class="btn btn-ghost" data-nav-btn="/dashboard/bookings/${lead.bookingId}">${svg(I.check)} Booking dekhein</button>` : `<button class="btn btn-ghost" data-lead-book data-lb-name="${escHtml(name)}" data-lb-phone="${escHtml(phone)}" data-lb-email="${escHtml(lead.contactEmail || "")}" data-lb-date="${escHtml(lead.eventDate || "")}" data-lb-guests="${guests ?? ""}" data-lb-biz="${lead.businessId ?? ""}" data-lb-sub="${(lead as { subVenueId?: number }).subVenueId ?? ""}">${svg(I.check)} Booking mein badlein</button>`}
          ${terminal ? "" : `<button class="btn btn-ghost danger" data-adv-status="lost">${svg(I.x)} Khoya mark karein</button>`}
        </div>
      </div>

      <div class="card">
        <div class="card-h"><div><h2>Notes</h2><div class="sub">Sirf aap dekh sakte hain</div></div></div>
        <div class="note"><textarea id="lead-note" data-orig="${escHtml(lead.notes || "")}" placeholder="Internal note likhein… (bahar click karne par save ho jaata hai)">${escHtml(lead.notes || "")}</textarea></div>
      </div>
    </div>
  </div>`
}

export function LeadDetailArtifact({ leadId }: { leadId: number }) {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/leads", crumbBold: "Leads", crumbSub: "Lead detail", extraCss: EXTRA_CSS,
  })
  const valid = Number.isFinite(leadId)
  const qc = useQueryClient()
  const leadQ = useQuery({ queryKey: ["lead-detail", leadId], queryFn: () => LeadAPI.get(leadId), enabled: valid })
  const { businesses } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizList = React.useMemo(() => ((businesses ?? []) as { id: number; name?: string | null }[]).map((b) => ({ id: b.id, name: b.name })), [businesses])
  const bizRef = React.useRef(bizList); bizRef.current = bizList
  const activeBizRef = React.useRef(activeBusinessId); activeBizRef.current = activeBusinessId

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (leadQ.isLoading) { wwc.innerHTML = `<div class="loadwrap">Lead load ho raha hai…</div>`; return }
    if (leadQ.isError) { wwc.innerHTML = `<button class="back" data-nav-btn="/dashboard/leads">${svg(I.back, 2.2)} Sab leads</button>${errorBannerHtml()}`; return }
    const lead = leadQ.data
    if (!lead) { wwc.innerHTML = `<button class="back" data-nav-btn="/dashboard/leads">${svg(I.back, 2.2)} Sab leads</button><div class="loadwrap">Ye lead nahi mila.</div>`; return }
    wwc.innerHTML = buildDetail(lead)
    const crumb = s.querySelector(".crumb b"); if (crumb) crumb.textContent = lead.contactName || "Lead"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, leadQ.data, leadQ.isLoading, leadQ.isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["lead-detail", leadId] }); return }
      const wa = t.closest("[data-wa]") as HTMLElement | null
      if (wa) { const p = waDigits(wa.dataset.wa); if (p) window.open(`https://wa.me/${p}?text=${encodeURIComponent("Assalam-o-Alaikum! Aap ki puchh-gichh ka shukriya.")}`, "_blank", "noopener"); return }
      const tel = t.closest("[data-tel]") as HTMLElement | null
      if (tel?.dataset.tel) { window.location.href = `tel:${tel.dataset.tel.replace(/\s/g, "")}`; return }
      // advance the lead's stage in place
      const adv = t.closest("[data-adv-status]") as HTMLButtonElement | null
      if (adv?.dataset.advStatus) {
        adv.disabled = true; const o = adv.innerHTML; adv.textContent = "Ho raha…"
        try { await LeadAPI.transition(leadId, { to: adv.dataset.advStatus as LeadStatus }); toast.success("Stage aage barh gaya"); qc.invalidateQueries({ queryKey: ["lead-detail", leadId] }) }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Nahi hua"); adv.disabled = false; adv.innerHTML = o }
        return
      }
      // convert to a booking in place (shared prefilled form), mark won on save
      const lb = t.closest("[data-lead-book]") as HTMLElement | null
      if (lb) {
        openBookingForm(s, {
          prefill: { customerName: lb.dataset.lbName || undefined, customerPhone: lb.dataset.lbPhone || undefined, customerEmail: lb.dataset.lbEmail || undefined, bookingDate: lb.dataset.lbDate || undefined, guestCount: lb.dataset.lbGuests ? Number(lb.dataset.lbGuests) : null, businessId: lb.dataset.lbBiz ? Number(lb.dataset.lbBiz) : null, subVenueId: lb.dataset.lbSub ? Number(lb.dataset.lbSub) : undefined, leadId },
          businesses: bizRef.current, activeBiz: activeBizRef.current,
          onSaved: () => { LeadAPI.transition(leadId, { to: "booked" as LeadStatus }).catch(() => {}); qc.invalidateQueries({ queryKey: ["lead-detail", leadId] }) },
        })
        return
      }
    })
    // save the internal note when the textarea loses focus (only if changed)
    s.addEventListener("focusout", async (e) => {
      const ta = (e.target as HTMLElement)?.closest("#lead-note") as HTMLTextAreaElement | null
      if (!ta) return
      const next = ta.value
      if (next === (ta.dataset.orig ?? "")) return
      try { await LeadAPI.update(leadId, { notes: next }); ta.dataset.orig = next; toast.success("Note save ho gaya"); qc.invalidateQueries({ queryKey: ["lead-detail", leadId] }) }
      catch { toast.error("Note save nahi hua") }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default LeadDetailArtifact
