"use client"

/**
 * Customer-360 detail — premium rebuild on the shared champagne shell.
 * Real via CustomersAPI.getProfile + getTimeline (resolved from the list's _id:
 * an email, `offline_<id>`, or `phone_<digits>`). Header + lifetime stats,
 * bookings list, activity timeline, and a contact/stats rail.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CustomersAPI, CustomerRatingsAPI, CommunityTrustAPI, type CustomerProfileResponse, type CustomerProfileBooking, type CustomerRating, type CustomerRatingFlag, type CustomerRatingsResponse, type CommunityTrustData } from "@/lib/api/dashboard"
import { waDigits } from "@/components/dashboard/mainScreens/leads/artifact/leads-artifact"
import { openBookingForm } from "@/components/dashboard/mainScreens/artifact/booking-form"
import { useBusiness } from "@/context/BusinessContext"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useArtifactShell, pkNum, escHtml, initialsOf, openDrawer, closeDrawer, errorBannerHtml, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

function parseId(raw: string): { email?: string; phone?: string; offlineId?: number } {
  const t = decodeURIComponent(raw || "").trim()
  const off = t.match(/^offline[_-](\d+)$/i); if (off) return { offlineId: Number(off[1]) }
  const ph = t.match(/^phone[_-]([\d+\-\s]+)$/i); if (ph) return { phone: ph[1].trim() }
  if (t.includes("@")) return { email: t }
  // a bare numeric id is an offline customer (real phones arrive as phone_<digits>)
  if (/^\d+$/.test(t)) return { offlineId: Number(t) }
  return { phone: t }
}
const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) }
const rs = (n: number) => `<span class="rs">Rs</span> ${pkNum(n)}`
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const bkTone = (s?: string) => { const v = (s || "").toLowerCase(); if (v.includes("confirm")) return "ok"; if (v.includes("complete")) return "info"; if (v.includes("cancel")) return "bad"; return "warn" }
const IC = {
  back: '<path d="M15 6l-6 6 6 6"/>', wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>', book: '<path d="M4 4h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 2v4M16 2v4M4 10h16"/>', ticket: '<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>', wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', pin: '<path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>', chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', check: '<path d="M20 6 9 17l-5-5"/>',
}

const EXTRA_CSS = String.raw`
.content{ max-width:1240px; }
.back{ display:inline-flex; align-items:center; gap:5px; font-size:12.5px; color:var(--ink-3); font-weight:500; margin-bottom:14px; background:none; border:0; } .back:hover{ color:var(--ink); } .back svg{ width:15px; height:15px; }
.dhead{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:18px; flex-wrap:wrap; }
.dh-left{ display:flex; align-items:center; gap:14px; }
.dh-ava{ width:56px; height:56px; border-radius:15px; background:linear-gradient(150deg,var(--accent),var(--accent-ink)); color:var(--on-accent); display:grid; place-items:center; font-weight:600; font-size:19px; flex:none; }
.dh-title{ display:flex; align-items:center; gap:10px; font-size:22px; font-weight:600; letter-spacing:-.025em; flex-wrap:wrap; }
.dh-sub{ font-size:12.5px; color:var(--ink-3); margin-top:4px; display:flex; gap:8px; flex-wrap:wrap; } .dh-sub .sep{ color:var(--border-2); }
.dhead-actions{ display:flex; gap:8px; } .btn.icon{ width:36px; padding:0; }
.repeat-badge{ display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:700; color:var(--accent-ink); background:var(--accent-wash); padding:2px 8px; border-radius:20px; }
.stats{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:14px; }
.stat{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:14px 15px; box-shadow:var(--shadow-xs); }
.stat.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .stat.hl .s-cap,.stat.hl .s-val{ color:var(--accent-ink); }
.s-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .s-cap svg{ width:13px; height:13px; }
.s-val{ font-size:19px; font-weight:660; letter-spacing:-.02em; margin-top:9px; } .s-val .rs{ font-size:12px; color:var(--ink-3); font-weight:600; } .s-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.two{ display:grid; grid-template-columns:1.7fr 1fr; gap:14px; align-items:start; } .col-stack{ display:flex; flex-direction:column; gap:14px; min-width:0; }
.card-h{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px 12px; border-bottom:1px solid var(--border); } .card-h h2{ font-size:13.5px; font-weight:600; }
.bk-row{ display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid var(--border); cursor:pointer; transition:background .1s; } .bk-row:last-child{ border-bottom:0; } .bk-row:hover{ background:var(--surface-3); }
.bk-main{ flex:1; min-width:0; } .bk-t{ font-weight:600; font-size:13px; } .bk-m{ font-size:11.5px; color:var(--ink-3); margin-top:1px; }
.bk-amt{ font-weight:660; font-variant-numeric:tabular-nums; text-align:right; } .bk-amt .rs{ font-size:10px; color:var(--ink-3); font-weight:600; }
.tl-item{ display:flex; gap:13px; position:relative; padding:0 16px 16px; } .tl-item::before{ content:""; position:absolute; left:27px; top:26px; bottom:-2px; width:2px; background:var(--border); } .tl-item:last-child::before{ display:none; }
.tl-dot{ width:26px; height:26px; border-radius:50%; flex:none; display:grid; place-items:center; background:var(--surface-3); border:1px solid var(--border-2); color:var(--ink-4); z-index:1; } .tl-dot svg{ width:13px; height:13px; }
.tl-body{ flex:1; padding-top:2px; } .tl-t{ font-weight:500; font-size:12.5px; } .tl-m{ font-size:11px; color:var(--ink-3); margin-top:2px; } .tl-amt{ float:right; font-weight:660; font-size:12.5px; font-variant-numeric:tabular-nums; }
.dl{ padding:2px 16px 12px; } .dl-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:9px 0; border-bottom:1px solid var(--border); font-size:12.5px; } .dl-row:last-child{ border-bottom:0; } .dl-row .k{ color:var(--ink-3); display:inline-flex; align-items:center; gap:7px; } .dl-row .k svg{ width:14px; height:14px; color:var(--ink-4); } .dl-row .v{ font-weight:600; color:var(--ink); text-align:right; word-break:break-word; }
.mini-grid{ display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--border); border-radius:10px; overflow:hidden; margin:2px 16px 16px; }
.mini-cell{ background:var(--surface); padding:11px 13px; } .mini-cell .mc-v{ font-size:16px; font-weight:660; } .mini-cell .mc-c{ font-size:11px; color:var(--ink-3); margin-top:1px; }
.mc-v.ok{ color:var(--ok); } .mc-v.bad{ color:var(--bad); }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
.link-btn{ font-size:12px; font-weight:600; color:var(--accent-ink); display:inline-flex; align-items:center; gap:4px; border:0; background:none; padding:4px 6px; border-radius:7px; } .link-btn:hover{ background:var(--accent-wash); } .link-btn svg{ width:13px; height:13px; }
.rep-empty{ padding:14px 16px 16px; color:var(--ink-3); font-size:12px; line-height:1.5; }
.rep-body{ padding:14px 16px 16px; }
.rep-top{ display:flex; align-items:center; gap:14px; margin-bottom:12px; }
.rep-score{ display:flex; flex-direction:column; align-items:center; gap:3px; } .rep-avg{ font-size:26px; font-weight:680; letter-spacing:-.02em; line-height:1; }
.rep-meta{ font-size:12px; color:var(--ink-2); display:flex; flex-direction:column; gap:3px; } .rep-meta .ok{ color:var(--ok); font-weight:600; } .rep-meta .bad{ color:var(--bad); font-weight:600; }
.stars{ display:inline-flex; gap:1px; } .stars .star{ width:var(--sz); height:var(--sz); color:var(--border-2); display:grid; place-items:center; } .stars .star svg{ width:100%; height:100%; fill:currentColor; stroke:currentColor; } .stars .star.on{ color:#E0A73C; }
.rep-flags{ display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
.flag{ font-size:10.5px; font-weight:600; padding:3px 8px; border-radius:20px; } .flag.good{ color:var(--ok); background:var(--ok-wash); } .flag.bad{ color:var(--bad); background:var(--bad-wash); }
.rep-list{ display:flex; flex-direction:column; gap:9px; }
.rep-row{ border:1px solid var(--border); border-radius:9px; padding:9px 11px; background:var(--surface-2); } .rep-r-top{ display:flex; align-items:center; justify-content:space-between; }
.rep-del{ width:24px; height:24px; border-radius:6px; border:0; background:transparent; color:var(--ink-4); display:grid; place-items:center; } .rep-del:hover{ color:var(--bad); background:var(--bad-wash); } .rep-del svg{ width:13px; height:13px; }
.rep-note{ font-size:12px; color:var(--ink-2); margin-top:5px; line-height:1.45; } .rep-date{ font-size:10.5px; color:var(--ink-3); margin-top:5px; }
.star-pick{ display:inline-flex; gap:4px; } .star-pick .sp{ width:34px; height:34px; border:1px solid var(--border); border-radius:8px; background:var(--surface); color:var(--border-2); display:grid; place-items:center; } .star-pick .sp svg{ width:19px; height:19px; fill:currentColor; stroke:currentColor; } .star-pick .sp.on{ color:#E0A73C; border-color:var(--accent-line); background:var(--accent-wash); }
.flag-pick{ display:flex; flex-wrap:wrap; gap:7px; } .flag-pick .fp{ font-size:11.5px; font-weight:600; padding:6px 11px; border-radius:20px; border:1px solid var(--border); background:var(--surface); color:var(--ink-2); } .flag-pick .fp:hover{ background:var(--surface-3); }
.flag-pick .fp.on.good{ color:var(--ok); background:var(--ok-wash); border-color:transparent; } .flag-pick .fp.on.bad{ color:var(--bad); background:var(--bad-wash); border-color:transparent; }
@media (max-width:1080px){ .stats{ grid-template-columns:repeat(2,1fr); } .two{ grid-template-columns:1fr; } }
`

/* ── CRM reputation (§26.4 two-way rating) ─────────────────────── */
const FLAG_META: Record<CustomerRatingFlag, { label: string; good: boolean }> = {
  great_to_work_with: { label: "Kaam mein zabardast", good: true },
  paid_on_time: { label: "Waqt par payment", good: true },
  premium_customer: { label: "Premium customer", good: true },
  advance_disputed: { label: "Advance jhagra", good: false },
  last_minute_cancel: { label: "Aakhri waqt cancel", good: false },
  rude_to_staff: { label: "Staff se bad-tameezi", good: false },
  harassed_staff: { label: "Staff ko tang kiya", good: false },
  cheque_bounced: { label: "Cheque bounce", good: false },
  no_show: { label: "No-show", good: false },
  negotiated_at_event: { label: "Event par mol-bhaav", good: false },
  scope_creep: { label: "Scope creep", good: false },
  ghosted: { label: "Ghost ho gaya", good: false },
}
const flagLabel = (f: string) => FLAG_META[f as CustomerRatingFlag]?.label || f.replace(/_/g, " ")
const flagGood = (f: string) => FLAG_META[f as CustomerRatingFlag]?.good ?? false
function starsHtml(n: number, size = 13): string {
  const full = Math.round(n)
  return `<span class="stars" style="--sz:${size}px">${[1, 2, 3, 4, 5].map((i) => `<span class="star ${i <= full ? "on" : ""}">${svg('<path d="M12 2l3 6.5 7 .9-5 4.8 1.3 7L12 18l-6.6 3.2L6.7 14 1.7 9.4l7-.9z"/>', 1.4)}</span>`).join("")}</span>`
}

function ratingCard(rr: CustomerRatingsResponse | null | undefined, offlineId: number | null): string {
  const ratings = rr?.ratings || []
  const avg = ratings.length ? ratings.reduce((a, r) => a + (r.overallStars || 0), 0) / ratings.length : 0
  const wba = ratings.length ? Math.round((ratings.filter((r) => r.wouldBookAgain).length / ratings.length) * 100) : null
  // most recent flags, de-duped, worst first
  const flagSet = new Set<string>(); ratings.forEach((r) => (r.flags || []).forEach((f) => flagSet.add(f)))
  const flags = [...flagSet].sort((a, b) => Number(flagGood(a)) - Number(flagGood(b)))
  const head = `<div class="card-h"><div><h2>Aap ki rating</h2><div class="sub" style="font-size:11.5px;color:var(--ink-3)">Sirf aap ke liye — private</div></div>${offlineId ? `<button class="link-btn" data-rate-add>${svg('<path d="M12 5v14M5 12h14"/>', 2.2)} Rate</button>` : ""}</div>`
  if (!offlineId) return `<div class="card">${head}<div class="rep-empty">Is customer ki apni offline record nahi — rating tab available hogi jab wo aap ke client-book mein ho.</div></div>`
  if (!ratings.length) return `<div class="card">${head}<div class="rep-empty">Abhi aap ne is customer ko rate nahi kiya. <b>Rate</b> daba kar apna experience record karein — agli booking par yaad rahe ga.</div></div>`
  const body = `<div class="rep-top"><div class="rep-score"><div class="rep-avg tnum">${avg.toFixed(1)}</div>${starsHtml(avg, 14)}</div>
    <div class="rep-meta"><div>${ratings.length} rating${ratings.length === 1 ? "" : "en"}</div>${wba != null ? `<div class="${wba >= 60 ? "ok" : "bad"}">${wba}% phir book karenge</div>` : ""}</div></div>
    ${flags.length ? `<div class="rep-flags">${flags.slice(0, 8).map((f) => `<span class="flag ${flagGood(f) ? "good" : "bad"}">${escHtml(flagLabel(f))}</span>`).join("")}</div>` : ""}
    <div class="rep-list">${ratings.slice(0, 4).map((r) => `<div class="rep-row"><div class="rep-r-top">${starsHtml(r.overallStars, 12)}<button class="rep-del" data-rate-del="${escHtml(r.id)}" title="Hataayein">${svg('<path d="M18 6 6 18M6 6l12 12"/>', 2.2)}</button></div>${r.notes ? `<div class="rep-note">${escHtml(r.notes)}</div>` : ""}<div class="rep-date">${fmtDate(r.ratedAt)}${r.bookingId ? ` · <span data-nav-btn="/dashboard/bookings/${r.bookingId}" style="cursor:pointer;color:var(--accent-ink)">Booking #${r.bookingId}</span>` : ""}</div></div>`).join("")}</div>`
  return `<div class="card">${head}<div class="rep-body">${body}</div></div>`
}

function trustCard(trust: CommunityTrustData | null | undefined): string {
  const head = `<div class="card-h"><div><h2>Community trust</h2><div class="sub" style="font-size:11.5px;color:var(--ink-3)">Doosray vendors ka gumnaam signal</div></div></div>`
  if (!trust || !trust.hasData) {
    return `<div class="card">${head}<div class="rep-empty">${trust?.reason === "insufficient" ? `Abhi kaafi vendors ne is customer ko rate nahi kiya (privacy ke liye kam-az-kam ${trust.threshold ?? 2} chahiye).` : "Is customer par doosray vendors ka koi signal nahi."}</div></div>`
  }
  const flags = (trust.flags || []).sort((a, b) => Number(flagGood(a.flag)) - Number(flagGood(b.flag)))
  return `<div class="card">${head}<div class="rep-body">
    <div class="rep-top"><div class="rep-score"><div class="rep-avg tnum">${trust.avgStars != null ? trust.avgStars.toFixed(1) : "—"}</div>${trust.avgStars != null ? starsHtml(trust.avgStars, 14) : ""}</div>
      <div class="rep-meta"><div>${trust.raterVendorCount} vendors · ${trust.totalRatings ?? 0} rating</div>${trust.wouldBookAgainPct != null ? `<div class="${trust.wouldBookAgainPct >= 60 ? "ok" : "bad"}">${trust.wouldBookAgainPct}% phir book karenge</div>` : ""}</div></div>
    ${flags.length ? `<div class="rep-flags">${flags.map((f) => `<span class="flag ${flagGood(f.flag) ? "good" : "bad"}">${escHtml(flagLabel(f.flag))} · ${f.count}</span>`).join("")}</div>` : ""}
  </div></div>`
}

const RATE_FLAG_ORDER: CustomerRatingFlag[] = ["paid_on_time", "great_to_work_with", "premium_customer", "last_minute_cancel", "no_show", "advance_disputed", "cheque_bounced", "negotiated_at_event", "scope_creep", "rude_to_staff", "harassed_staff", "ghosted"]
function addRatingDrawerBody(allowed: CustomerRatingFlag[]): string {
  const flags = (allowed.length ? allowed : RATE_FLAG_ORDER)
  return `
  <div class="dfield"><label class="dlabel">Sitare</label>
    <div class="star-pick" id="rate-stars" data-val="5">${[1, 2, 3, 4, 5].map((i) => `<button type="button" class="sp ${i <= 5 ? "on" : ""}" data-star="${i}">${svg('<path d="M12 2l3 6.5 7 .9-5 4.8 1.3 7L12 18l-6.6 3.2L6.7 14 1.7 9.4l7-.9z"/>', 1.4)}</button>`).join("")}</div>
  </div>
  <div class="dfield"><label class="dlabel" style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="rate-wba" checked style="width:auto"/> Phir se book karenge</label></div>
  <div class="dfield"><label class="dlabel">Flags (jo laagu ho)</label>
    <div class="flag-pick" id="rate-flags">${flags.map((f) => `<button type="button" class="fp ${flagGood(f) ? "good" : "bad"}" data-flag="${f}">${escHtml(flagLabel(f))}</button>`).join("")}</div>
  </div>
  <div class="dfield"><label class="dlabel">Note (optional)</label><textarea id="rate-notes" placeholder="Sirf aap ke liye — e.g. advance time par diya, staff se acha bartaav"></textarea></div>
  <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Waapas</button><button class="btn btn-primary" type="button" data-rate-save>Rating save karein</button></div>`
}

function buildDetail(prof: CustomerProfileResponse, timeline: { events?: Array<{ type: string; title: string; date?: string; bookingId?: number | null; amount?: number | null }> } | null, ratings: CustomerRatingsResponse | null, trust: CommunityTrustData | null): string {
  const p = prof.profile, st = prof.stats
  const name = p.name || "Customer"
  const phone = p.phone || ""
  const waP = waDigits(phone)
  const bookings = (prof.bookings || []) as CustomerProfileBooking[]

  const acts = `<div class="dhead-actions">${phone ? `<button class="btn btn-ghost icon" data-tel="${escHtml(phone)}" aria-label="Call">${svg(IC.phone)}</button><button class="btn btn-ghost icon" data-wa="${escHtml(phone)}" aria-label="WhatsApp">${svg(IC.wa)}</button>` : ""}<button class="btn btn-ghost icon" data-nav-btn="/dashboard/chat" aria-label="Message">${svg(IC.chat)}</button><button class="btn btn-primary" data-cust-book data-cb-name="${escHtml(name)}" data-cb-phone="${escHtml(phone)}" data-cb-email="${escHtml(p.email || "")}">${svg(IC.book, 1.9)} Nayi booking</button></div>`

  const statStrip = `<div class="stats">
    <div class="stat hl"><div class="s-cap">${svg(IC.wallet, 1.9)} Lifetime revenue</div><div class="s-val tnum">${rs(money(st.lifetimeRevenue))}</div><div class="s-sub">received</div></div>
    <div class="stat"><div class="s-cap">${svg(IC.book, 1.9)} Total bookings</div><div class="s-val tnum">${st.totalBookings}</div><div class="s-sub">${st.completedBookings} complete · ${st.upcomingBookings} aane wale</div></div>
    <div class="stat"><div class="s-cap">${svg(IC.ticket, 1.9)} Avg booking</div><div class="s-val tnum">${rs(money(st.avgTicketSize))}</div><div class="s-sub">${st.repeatCustomer ? "repeat customer" : "one-time"}</div></div>
    <div class="stat"><div class="s-cap">${svg(IC.clock, 1.9)} Aakhri booking</div><div class="s-val" style="font-size:15px">${st.daysSinceLastBooking != null ? `${st.daysSinceLastBooking} din pehle` : "—"}</div><div class="s-sub">${fmtDate(p.lastBookingAt)}</div></div>
  </div>`

  const bkList = bookings.length ? bookings.slice(0, 12).map((b) => `<div class="bk-row" data-nav-btn="/dashboard/bookings/${b.id}"><span class="st ${bkTone(b.status)}"><i></i> ${escHtml(b.status || "—")}</span>
    <div class="bk-main"><div class="bk-t">Booking #${b.id}</div><div class="bk-m">${fmtDate(b.bookingDate)}${b.guestCount ? ` · ${b.guestCount} mehmaan` : ""}</div></div>
    <div class="bk-amt tnum">${rs(money(b.totalAmount))}</div></div>`).join("")
    : `<div style="padding:24px 16px;text-align:center;color:var(--ink-3);font-size:12.5px">Koi booking nahi.<div style="margin-top:12px"><button class="btn btn-primary" data-cust-book data-cb-name="${escHtml(name)}" data-cb-phone="${escHtml(phone)}" data-cb-email="${escHtml(p.email || "")}">${svg(IC.book, 1.9)} Nayi booking</button></div></div>`

  const tlEvents = timeline?.events || []
  const tlHtml = tlEvents.length ? tlEvents.slice(0, 15).map((e) => `<div class="tl-item"${e.bookingId ? ` data-nav-btn="/dashboard/bookings/${e.bookingId}" style="cursor:pointer"` : ""}><span class="tl-dot">${svg(IC.book, 1.8)}</span><div class="tl-body">${e.amount ? `<span class="tl-amt">${rs(money(e.amount))}</span>` : ""}<div class="tl-t">${escHtml(e.title)}</div><div class="tl-m">${fmtDate(e.date)}${e.bookingId ? ` · Booking #${e.bookingId}` : ""}</div></div></div>`).join("")
    : `<div style="padding:24px 16px;text-align:center;color:var(--ink-3);font-size:12.5px">Koi activity nahi.</div>`

  const info = `<div class="card"><div class="card-h"><div><h2>Raabta</h2></div></div><div class="dl">
    <div class="dl-row"><span class="k">${svg(IC.phone)} Phone</span><span class="v tnum">${escHtml(phone || "—")}</span></div>
    <div class="dl-row"><span class="k">${svg(IC.mail)} Email</span><span class="v">${escHtml(p.email || "—")}</span></div>
    ${p.address ? `<div class="dl-row"><span class="k">${svg(IC.pin)} Pata</span><span class="v">${escHtml(p.address)}</span></div>` : ""}
    <div class="dl-row"><span class="k">Pehli booking</span><span class="v">${fmtDate(p.firstBookingAt)}</span></div>
  </div></div>`

  const statsCard = `<div class="card"><div class="card-h"><div><h2>Stats</h2></div></div>
    <div class="mini-grid">
      <div class="mini-cell"><div class="mc-v ok">${st.confirmedBookings}</div><div class="mc-c">Confirmed</div></div>
      <div class="mini-cell"><div class="mc-v">${st.completedBookings}</div><div class="mc-c">Complete</div></div>
      <div class="mini-cell"><div class="mc-v bad">${st.cancelledBookings}</div><div class="mc-c">Cancel</div></div>
      <div class="mini-cell"><div class="mc-v">${st.upcomingBookings}</div><div class="mc-c">Aane wale</div></div>
      <div class="mini-cell"><div class="mc-v">${st.totalLeads}</div><div class="mc-c">Leads</div></div>
      <div class="mini-cell"><div class="mc-v ok">${st.convertedLeads}</div><div class="mc-c">Jeete</div></div>
      <div class="mini-cell"><div class="mc-v">${st.totalFunctionSheets}</div><div class="mc-c">Function sheets</div></div>
      <div class="mini-cell"><div class="mc-v">${rs(money(st.sheetRevenue))}</div><div class="mc-c">Sheet revenue</div></div>
    </div></div>`

  return `
  <button class="back" data-nav-btn="/dashboard/customers">${svg(IC.back, 2.2)} Sab customers</button>
  <div class="dhead"><div class="dh-left"><span class="dh-ava">${escHtml(initialsOf(name))}</span>
    <div><div class="dh-title">${escHtml(name)}${st.repeatCustomer ? ` <span class="repeat-badge">${svg(IC.check, 2.6)} Repeat</span>` : ""}</div>
      <div class="dh-sub"><span>${escHtml(phone || p.email || "—")}</span><span class="sep">·</span><span>${st.totalBookings} bookings</span><span class="sep">·</span><span>${rs(money(st.lifetimeRevenue))} lifetime</span></div></div></div>
    ${acts}</div>
  ${statStrip}
  <div class="two">
    <div class="col-stack">
      <div class="card"><div class="card-h"><div><h2>Bookings</h2><div class="sub" style="font-size:11.5px;color:var(--ink-3)">${bookings.length} total</div></div></div>${bkList}</div>
      <div class="card"><div class="card-h"><div><h2>Activity</h2></div></div><div style="padding:14px 0 4px">${tlHtml}</div></div>
    </div>
    <div class="col-stack">${ratingCard(ratings, p.offlineCustomerId)}${trustCard(trust)}${info}${statsCard}</div>
  </div>
  <div class="foot">WeddingWala vendor console · Customer</div>`
}

export function CustomerDetailArtifact({ customerId }: { customerId: string }) {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/customers", crumbBold: "Log", crumbSub: "Customer", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const { businesses } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizList = React.useMemo(() => ((businesses ?? []) as { id: number; name?: string | null }[]).map((b) => ({ id: b.id, name: b.name })), [businesses])
  const bizRef = React.useRef(bizList); bizRef.current = bizList
  const activeBizRef = React.useRef(activeBusinessId); activeBizRef.current = activeBusinessId
  const q = React.useMemo(() => parseId(customerId), [customerId])
  const profQ = useQuery({ queryKey: ["cust-profile", customerId], queryFn: () => CustomersAPI.getProfile(q) })
  const tlQ = useQuery({ queryKey: ["cust-timeline", customerId], queryFn: () => CustomersAPI.getTimeline(q).catch(() => null) })
  const offlineId = profQ.data?.profile.offlineCustomerId ?? null
  const phone = profQ.data?.profile.phone ?? null
  const email = profQ.data?.profile.email ?? null
  const ratingsQ = useQuery({ queryKey: ["cust-ratings", offlineId], enabled: !!offlineId, queryFn: () => CustomerRatingsAPI.list(offlineId as number).catch(() => null) })
  const trustQ = useQuery({ queryKey: ["cust-trust", phone, email], enabled: !!(phone || email), queryFn: () => CommunityTrustAPI.get({ phone, email }).catch(() => null) })
  const offlineIdRef = React.useRef(offlineId); offlineIdRef.current = offlineId
  const allowedRef = React.useRef<CustomerRatingFlag[]>([]); allowedRef.current = ratingsQ.data?.allowedFlags ?? []

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (profQ.isLoading) { wwc.innerHTML = `<div class="loadwrap">Customer load ho raha hai…</div>`; return }
    if (profQ.isError) { wwc.innerHTML = `<button class="back" data-nav-btn="/dashboard/customers">${svg(IC.back, 2.2)} Sab customers</button>${errorBannerHtml()}`; return }
    const prof = profQ.data
    if (!prof) { wwc.innerHTML = `<button class="back" data-nav-btn="/dashboard/customers">${svg(IC.back, 2.2)} Sab customers</button><div class="loadwrap">Customer nahi mila.</div>`; return }
    wwc.innerHTML = buildDetail(prof, (tlQ.data ?? null) as { events?: Array<{ type: string; title: string; date?: string; bookingId?: number | null; amount?: number | null }> } | null, ratingsQ.data ?? null, trustQ.data ?? null)
    const crumb = s.querySelector(".crumb b"); if (crumb) crumb.textContent = prof.profile.name || "Customer"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, profQ.data, profQ.isLoading, profQ.isError, tlQ.data, ratingsQ.data, trustQ.data])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const refreshRatings = () => qc.invalidateQueries({ queryKey: ["cust-ratings"] })
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["cust-profile", customerId] }); return }
      const wa = t.closest("[data-wa]") as HTMLElement | null
      if (wa) { const p = waDigits(wa.dataset.wa); if (p) window.open(`https://wa.me/${p}`, "_blank", "noopener"); return }
      const tel = t.closest("[data-tel]") as HTMLElement | null
      if (tel?.dataset.tel) { window.location.href = `tel:${tel.dataset.tel.replace(/\s/g, "")}`; return }
      // book this customer in place — shared prefilled form
      const cbk = t.closest("[data-cust-book]") as HTMLElement | null
      if (cbk) {
        openBookingForm(s, { prefill: { customerName: cbk.dataset.cbName || undefined, customerPhone: cbk.dataset.cbPhone || undefined, customerEmail: cbk.dataset.cbEmail || undefined }, businesses: bizRef.current, activeBiz: activeBizRef.current, onSaved: () => qc.invalidateQueries({ queryKey: ["cust-profile", customerId] }) })
        return
      }
      // open the rate-customer drawer
      if (t.closest("[data-rate-add]")) { openDrawer(s, "Customer ko rate karein", addRatingDrawerBody(allowedRef.current)); return }
      // star picker inside the drawer
      const sp = t.closest("[data-star]") as HTMLElement | null
      if (sp?.dataset.star) {
        const val = Number(sp.dataset.star); const wrap = s.getElementById("rate-stars")
        if (wrap) { wrap.dataset.val = String(val); wrap.querySelectorAll(".sp").forEach((b) => b.classList.toggle("on", Number((b as HTMLElement).dataset.star) <= val)) }
        return
      }
      // flag toggle
      const fp = t.closest("[data-flag]") as HTMLElement | null
      if (fp) { fp.classList.toggle("on"); return }
      // save a rating
      if (t.closest("[data-rate-save]")) {
        const oid = offlineIdRef.current; if (!oid) { toast.error("Rating record nahi bani"); return }
        const stars = Number((s.getElementById("rate-stars") as HTMLElement | null)?.dataset.val || 5)
        const wba = (s.getElementById("rate-wba") as HTMLInputElement | null)?.checked ?? true
        const flags = [...s.querySelectorAll("#rate-flags .fp.on")].map((b) => (b as HTMLElement).dataset.flag as CustomerRatingFlag)
        const notes = (s.getElementById("rate-notes") as HTMLTextAreaElement | null)?.value?.trim() || null
        const btn = t.closest("[data-rate-save]") as HTMLButtonElement; btn.disabled = true; btn.textContent = "Save ho raha…"
        try { await CustomerRatingsAPI.add(oid, { overallStars: stars, wouldBookAgain: wba, flags, notes }); toast.success("Rating save ho gayi"); closeDrawer(s); refreshRatings() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Rating save nahi hui"); btn.disabled = false; btn.textContent = "Rating save karein" }
        return
      }
      // delete one of my ratings
      const del = t.closest("[data-rate-del]") as HTMLElement | null
      if (del?.dataset.rateDel) {
        const oid = offlineIdRef.current; if (!oid) return
        const rid = del.dataset.rateDel
        openConfirm(s, { title: "Rating delete karein?", message: "Ye rating hat jayegi — wapas nahi aayegi.", danger: true, onConfirm: async () => {
          try { await CustomerRatingsAPI.remove(oid, rid); toast.success("Rating hata di"); refreshRatings() }
          catch { toast.error("Hataayi nahi ja saki") }
        } })
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default CustomerDetailArtifact
