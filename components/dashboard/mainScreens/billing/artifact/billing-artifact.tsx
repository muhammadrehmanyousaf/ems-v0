"use client"

/**
 * Billing / plan — premium rebuild on the shared champagne shell.
 *
 * The plan is BOUGHT here, through Safepay's hosted checkout, and renews
 * monthly. The screen shows where the vendor stands with Safepay (from
 * /subscriptions/status — a state only Safepay's webhooks move), the plan
 * catalogue as cards with a Subscribe action, the comparison table and the
 * pricing note. Coming back from checkout (`?checkout=return`) is not proof
 * of payment: the banner polls until the server has heard from Safepay.
 *
 * If online payment is not switched on yet (no Safepay config), the
 * Subscribe action falls back to the old "request an upgrade" queue and
 * says so — nothing is ever charged by this screen itself.
 */

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  SubscriptionAPI,
  type MyPlanData,
  type SubscriptionTier,
  type PlanCatalogEntry,
  type BillingStatus,
  type SubscriptionPaymentRow,
} from "@/lib/api/subscription"
import { useArtifactShell, pkNum, escHtml, errorBannerHtml, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const RANK: Record<string, number> = { free: 0, pro: 1, premium: 2, elite: 3 }
function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }) }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  check: '<path d="M20 6 9 17l-5-5"/>', dash: '<path d="M5 12h14"/>', star: '<path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"/>',
  crown: '<path d="M3 7l4 5 5-7 5 7 4-5v11H3z"/>', bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>', lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  spin: '<path d="M21 12a9 9 0 1 1-6.2-8.6"/>', alert: '<path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
}
const TIER_ICON: Record<string, string> = { free: IC.bolt, pro: IC.star, premium: IC.crown, elite: IC.crown }

const EXTRA_CSS = String.raw`
.cur-plan{ display:flex; align-items:center; gap:14px; padding:16px 18px; margin-bottom:16px; }
.cur-ic{ width:44px; height:44px; border-radius:12px; background:var(--accent-wash); border:1px solid var(--accent-line); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .cur-ic svg{ width:22px; height:22px; }
.cur-main{ flex:1; min-width:0; } .cur-t{ font-size:15px; font-weight:600; } .cur-s{ font-size:12px; color:var(--ink-3); margin-top:2px; }
.pending{ display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:600; color:var(--warn); background:var(--warn-wash); padding:4px 10px; border-radius:8px; } .pending svg{ width:13px; height:13px; }
.plans{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:16px; }
.plan{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); display:flex; flex-direction:column; overflow:hidden; }
.plan.cur{ border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-wash); }
.plan-h{ padding:16px 16px 14px; border-bottom:1px solid var(--border); }
.plan-top{ display:flex; align-items:center; gap:9px; }
.plan-ic{ width:32px; height:32px; border-radius:9px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .plan-ic svg{ width:16px; height:16px; }
.plan-nm{ font-size:15px; font-weight:660; } .plan-tag{ font-size:11.5px; color:var(--ink-3); margin-top:2px; }
.plan-price{ margin-top:12px; font-size:22px; font-weight:700; letter-spacing:-.02em; } .plan-price .rs{ font-size:13px; color:var(--ink-3); font-weight:600; } .plan-price .per{ font-size:12px; color:var(--ink-3); font-weight:500; }
.plan-price.free{ color:var(--ok); }
.plan-body{ padding:14px 16px; flex:1; }
.feat{ display:flex; align-items:flex-start; gap:8px; font-size:12.5px; color:var(--ink-2); padding:5px 0; } .feat svg{ width:15px; height:15px; color:var(--ok); flex:none; margin-top:1px; }
.cap{ display:flex; align-items:flex-start; gap:8px; font-size:11.5px; color:var(--ink-3); padding:3px 0; } .cap svg{ width:13px; height:13px; color:var(--ink-4); flex:none; margin-top:1px; }
.plan-foot{ padding:14px 16px; border-top:1px solid var(--border); }
.plan-foot .btn{ width:100%; }
.badge-cur{ display:inline-flex; align-items:center; justify-content:center; gap:6px; width:100%; height:36px; border-radius:9px; font-weight:600; font-size:12.5px; background:var(--accent-wash); color:var(--accent-ink); border:1px solid var(--accent-line); } .badge-cur svg{ width:14px; height:14px; }
.badge-inc{ text-align:center; font-size:12px; color:var(--ink-3); font-weight:500; padding:9px 0; }
/* Safepay status + return banner */
.sp{ display:flex; align-items:flex-start; gap:12px; padding:14px 16px; margin-bottom:16px; border-radius:var(--r); border:1px solid var(--border); background:var(--surface); box-shadow:var(--shadow-xs); }
.sp svg{ width:18px; height:18px; flex:none; margin-top:1px; }
.sp.ok{ background:var(--ok-wash); border-color:transparent; } .sp.ok svg{ color:var(--ok); }
.sp.warn{ background:var(--warn-wash); border-color:transparent; } .sp.warn svg{ color:var(--warn); }
.sp.bad{ background:var(--bad-wash); border-color:transparent; } .sp.bad svg{ color:var(--bad); }
.sp.info svg{ color:var(--accent-ink); animation:spspin 1s linear infinite; }
@keyframes spspin{ to{ transform:rotate(360deg); } }
.sp-t{ font-size:13.5px; font-weight:600; } .sp-s{ font-size:12px; color:var(--ink-3); margin-top:3px; line-height:1.55; }
.sp-grid{ display:grid; grid-template-columns:repeat(3,auto); gap:4px 22px; margin-top:8px; font-size:12px; } .sp-grid dt{ color:var(--ink-3); font-size:11px; } .sp-grid dd{ font-weight:600; font-variant-numeric:tabular-nums; }
.sp .btn{ margin-top:10px; }
/* comparison */
.cmp thead th{ text-align:center; } .cmp thead th:first-child{ text-align:left; } .cmp td{ text-align:center; } .cmp td:first-child{ text-align:left; font-weight:500; color:var(--ink-2); }
.cmp .yes{ color:var(--ok); } .cmp .no{ color:var(--ink-4); } .cmp svg{ width:16px; height:16px; display:inline-block; }
.note{ padding:14px 16px; font-size:11.5px; color:var(--ink-3); line-height:1.6; } .note b{ color:var(--ink-2); font-weight:600; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:900px){ .plans{ grid-template-columns:1fr; } .sp-grid{ grid-template-columns:1fr 1fr; } }
`

type ReturnMode = "return" | "cancel" | null

/**
 * The one state every card answers to. It comes from the subscription row
 * that governs access (what Safepay last told us), never from the access
 * flag alone: a cancelled plan still has access but is not live, a checkout
 * in flight has no access but must block a second checkout.
 */
type PlanView =
  | { kind: "none"; staleCheckout: boolean }
  | { kind: "pending"; tier: string; minutes: number }
  | { kind: "live"; tier: string }
  | { kind: "cancelled_days"; tier: string; until: string | null }
const LIVE_STATUSES = ["active", "payment_failed", "paused"]
/** A checkout Safepay has not confirmed within this long is treated as walked away from. */
const PENDING_LOCK_MINUTES = 15
function planViewOf(status: BillingStatus | null): PlanView {
  if (!status) return { kind: "none", staleCheckout: false }
  const pendingMinutes = status.pending ? Math.max(0, Math.round((Date.now() - new Date(status.pending.createdAt).getTime()) / 60000)) : null
  if (status.pending && pendingMinutes !== null && pendingMinutes < PENDING_LOCK_MINUTES) return { kind: "pending", tier: status.pending.tier, minutes: pendingMinutes }
  const s = status.subscription
  const hasAccess = status.access === "active" || status.access === "past_due"
  if (s && LIVE_STATUSES.includes(s.status) && hasAccess) return { kind: "live", tier: s.tier }
  if (s && s.status === "cancelled" && hasAccess) return { kind: "cancelled_days", tier: s.tier, until: s.currentPeriodEndsAt || status.subscriptionEndsAt }
  return { kind: "none", staleCheckout: !!status.pending }
}
function isLive(status: BillingStatus | null): boolean {
  return planViewOf(status).kind === "live"
}

const priceBtn = (p: PlanCatalogEntry, cls: string, attr: string, label: string, aria: string, disabled = false) =>
  `<button class="btn ${cls}" ${attr} aria-label="${escHtml(aria)}"${disabled ? " disabled" : ""}>${disabled ? "" : svg(IC.card)} ${label} · <span class="rs">Rs</span> ${pkNum(p.pricePkrMonthly)} / mahina</button>`

function planCard(p: PlanCatalogEntry, d: MyPlanData, view: PlanView): string {
  const highlights = (p.highlights || []).map((h) => `<div class="feat">${svg(IC.check, 2.4)} ${escHtml(h)}</div>`).join("")
  const caps = (p.caps || []).map((c) => `<div class="cap">${svg(IC.dash, 2)} ${escHtml(c)}</div>`).join("")
  const paid = p.pricePkrMonthly > 0
  const tierAttr = `data-change-plan="${escHtml(p.tier)}"`
  let foot = ""
  let isCur = false
  if (!paid) {
    foot = `<div class="badge-inc">Muft</div>`
  } else if (view.kind === "pending") {
    // One checkout at a time. Nothing here may start another until Safepay
    // has answered or the vendor has clearly walked away.
    isCur = view.tier === p.tier
    foot = isCur
      ? `<div class="badge-cur">${svg(IC.spin)} Safepay se confirmation ka intezaar</div>`
      : priceBtn(p, "btn-ghost", "", "Intezaar karein", `${p.name}: a checkout is already in progress`, true)
  } else if (view.kind === "live") {
    const cur = view.tier
    isCur = p.tier === cur
    const knownRanks = RANK[p.tier] != null && RANK[cur] != null
    const lower = knownRanks && RANK[p.tier] < RANK[cur]
    if (isCur)
      foot = `<div class="badge-cur">${svg(IC.check, 2.4)} Aapka plan · active</div><button class="btn btn-ghost sm" style="margin-top:8px;width:100%" ${tierAttr} title="Naya card save karne ke liye dobara subscribe karein — bache hue din poore carry hote hain">Card badlein</button>`
    else if (lower) foot = priceBtn(p, "btn-ghost", tierAttr, `${escHtml(p.name)} par aayein`, `Switch down to ${p.name} for Rs ${pkNum(p.pricePkrMonthly)} a month`)
    else foot = priceBtn(p, "btn-primary", tierAttr, `${escHtml(p.name)} par switch`, `Switch to ${p.name} for Rs ${pkNum(p.pricePkrMonthly)} a month with Safepay`)
  } else if (view.kind === "cancelled_days") {
    // The vendor still owns this plan until the paid period ends. Starting it
    // again (or another plan) carries the unused days over as credit.
    isCur = p.tier === view.tier
    const until = view.until ? fmtDate(view.until) : ""
    if (isCur)
      foot = `<div class="badge-inc">Aapka plan · cancel ho chuka${until ? ` · ${escHtml(until)} tak chalega` : ""}</div><div style="margin-top:8px">${priceBtn(p, "btn-primary", tierAttr, "Dobara chalu karein", `Resume ${p.name} for Rs ${pkNum(p.pricePkrMonthly)} a month with Safepay`)}</div>`
    else foot = priceBtn(p, "btn-ghost", tierAttr, `${escHtml(p.name)} lein`, `Take ${p.name} for Rs ${pkNum(p.pricePkrMonthly)} a month with Safepay`)
  } else {
    foot = priceBtn(p, "btn-primary", `data-subscribe="${escHtml(p.tier)}"`, "Subscribe", `Subscribe to ${p.name} for Rs ${pkNum(p.pricePkrMonthly)} a month with Safepay`)
  }
  return `<div class="plan${isCur ? " cur" : ""}">
    <div class="plan-h"><div class="plan-top"><span class="plan-ic">${svg(TIER_ICON[p.tier] || IC.star, 1.8)}</span><div><div class="plan-nm">${escHtml(p.name)}</div><div class="plan-tag">${escHtml(p.tagline || "")}</div></div></div>
      <div class="plan-price${p.pricePkrMonthly <= 0 ? " free" : ""}">${p.pricePkrMonthly <= 0 ? "Muft" : `<span class="rs">Rs</span> ${pkNum(p.pricePkrMonthly)} <span class="per">/ mahina</span>`}</div></div>
    <div class="plan-body">${highlights}${caps}</div>
    <div class="plan-foot">${foot}</div></div>`
}

/** Back from Safepay: say what we know, never what the redirect implies. */
function returnBanner(mode: ReturnMode, status: BillingStatus | null, waitedSeconds: number): string {
  if (!mode) return ""
  if (mode === "cancel")
    return `<div class="sp" role="status">${svg(IC.card)}<div><div class="sp-t">Checkout cancel hua</div><div class="sp-s">Kuch charge nahi hua. Jab chahein plan chun lein.</div><button class="btn btn-ghost sm" data-dismiss-return>Theek hai</button></div></div>`
  // "Payment received" only when the NEWEST subscription is the active one.
  // Access alone is not proof: a cancelled plan with days left keeps access
  // "active" while the new payment is still pending.
  if (status?.subscription?.status === "active" && !status.pending)
    return `<div class="sp ok" role="status">${svg(IC.check, 2.4)}<div><div class="sp-t">Payment mil gayi — aapka plan active hai</div><div class="sp-s">Safepay ne payment confirm kar di. Portal ${status.subscriptionEndsAt ? `${escHtml(fmtDate(status.subscriptionEndsAt))} tak` : ""} khula hai aur har mahina khud renew hoga.</div><a class="btn btn-primary sm" href="/dashboard">Portal kholein</a></div></div>`
  if (waitedSeconds >= 120)
    return `<div class="sp warn" role="status">${svg(IC.alert)}<div><div class="sp-t">Safepay se abhi tak confirmation nahi aayi</div><div class="sp-s">Agar aapne payment poori ki hai to Safepay ki confirmation aate hi yahan dikhegi — dobara payment na karein. Agar decline hui thi to neeche se dobara koshish karein.</div><button class="btn btn-ghost sm" data-dismiss-return>Theek hai</button></div></div>`
  return `<div class="sp info" role="status" aria-live="polite">${svg(IC.spin)}<div><div class="sp-t">Safepay se payment confirm ho rahi hai…</div><div class="sp-s">Chand second lagte hain. Dobara payment na karein — confirm hote hi yeh khud update hoga.</div></div></div>`
}

function statusCard(status: BillingStatus | null): string {
  if (!status || !status.subscription) return ""
  const s = status.subscription
  const pill: Record<string, [string, string]> = {
    active: ["ok", "Active"], past_due: ["warn", "Payment fail — retry ho rahi hai"], pending: ["info", "Payment ka intezaar"], none: ["bad", "Koi active plan nahi"],
  }
  // The pill describes the newest subscription row, not the access flag: a
  // cancelled plan with days left keeps access open while a new one is pending.
  let [tone, label] = pill[status.access] || ["mut", status.access]
  if (s.status === "cancelled") [tone, label] = ["mut", "Cancelled"]
  else if (s.status === "paused") [tone, label] = ["info", "Paused"]
  else if (s.status === "pending") [tone, label] = ["info", "Payment ka intezaar"]
  else if (s.status === "payment_failed") [tone, label] = ["warn", "Payment fail — retry ho rahi hai"]
  else if (s.status === "active") [tone, label] = ["ok", "Active"]
  const extra =
    status.access === "past_due"
      ? `<div class="sp-s" style="color:var(--warn)">Is mahine ki payment nahi hui. Safepay dobara koshish karega; portal ${escHtml(fmtDate(status.subscriptionEndsAt))} tak khula rahega. Apna card ya account check karein, ya "Card badlein" se naya card lagayein.</div>`
      : s.status === "cancelled"
        ? `<div class="sp-s">Subscription cancel ho chuki hai. ${escHtml(fmtDate(status.subscriptionEndsAt))} tak access rahegi; jab chahein neeche se dobara subscribe karein.</div>`
        : s.status === "paused"
          ? `<div class="sp-s">Subscription rok di gayi hai — koi charge nahi ho raha. ${escHtml(fmtDate(status.subscriptionEndsAt))} tak access rahegi. Dobara chalu karwane ke liye hum se rabta karein.</div>`
          : ""
  const canCancel = LIVE_STATUSES.includes(s.status)
  const cancelBtn = canCancel
    ? `<div style="margin-top:10px"><button class="btn btn-ghost sm" data-cancel-plan data-until="${escHtml(fmtDate(status.subscriptionEndsAt))}">Plan cancel karein</button></div>`
    : ""
  return `<div class="sp" role="status">${svg(IC.lock)}<div style="flex:1;min-width:0">
    <div class="sp-t">Subscription <span class="st ${tone}" style="margin-left:8px">${escHtml(label)}</span>${status.environment === "sandbox" ? ` <span class="st mut" style="margin-left:6px">Sandbox</span>` : ""}</div>
    <dl class="sp-grid"><div><dt>Paid until</dt><dd>${escHtml(fmtDate(s.currentPeriodEndsAt))}</dd></div><div><dt>Portal open until</dt><dd>${escHtml(fmtDate(status.subscriptionEndsAt))}</dd></div><div><dt>Billing</dt><dd>${s.status === "cancelled" ? "Band — koi charge nahi" : "Monthly · Safepay"}</dd></div></dl>
    ${extra}${cancelBtn}</div></div>`
}

function historyCard(payments: SubscriptionPaymentRow[] | undefined): string {
  if (!payments || payments.length === 0) return ""
  const rows = payments.map((r) => `<tr>
    <td>${escHtml(fmtDate(r.paidAt))}</td>
    <td><span class="rs">Rs</span> ${pkNum(Math.round(r.amountPaisas / 100))}</td>
    <td>${escHtml(r.tier)}</td>
    <td>${escHtml(fmtDate(r.periodStart))} – ${escHtml(fmtDate(r.periodEnd))}</td>
    <td style="font-variant-numeric:tabular-nums">${escHtml(r.receiptNo)}${r.refundedPaisas && r.refundedPaisas > 0 ? ` <span class="st warn" style="margin-left:6px">Refund <span class="rs">Rs</span> ${pkNum(Math.round(r.refundedPaisas / 100))}</span>` : ""}</td>
    <td style="text-align:right"><a class="btn btn-ghost sm" href="/dashboard/billing/receipt/${encodeURIComponent(r.receiptNo)}">Receipt</a></td>
  </tr>`).join("")
  return `<div class="card" style="margin-bottom:16px"><div class="card-h" style="padding:14px 16px 6px"><div><h2 style="font-size:13.5px;font-weight:600">Billing history</h2><div class="sub">Har mahine ki payment aur uski receipt.</div></div></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Taareekh</th><th>Raqam</th><th>Plan</th><th>Period</th><th>Receipt no.</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`
}

function buildContent(d: MyPlanData, status: BillingStatus | null, mode: ReturnMode, waited: number, payments?: SubscriptionPaymentRow[]): string {
  const paidActive = status?.access === "active" || status?.access === "past_due"
  // When Safepay says the plan is paid, the tier it reports is the truth.
  const effectiveTier = (paidActive && status?.tier ? status.tier : d.currentTier) as SubscriptionTier
  const curPlan = d.plans.find((p) => p.tier === effectiveTier)
  const tierName = (t: SubscriptionTier) => d.tierNames?.[t] || d.plans.find((p) => p.tier === t)?.name || t
  const view = planViewOf(status)
  const pendingLine = view.kind === "pending"
    ? `<span class="pending">${svg(IC.spin)} ${escHtml(tierName(view.tier as SubscriptionTier))} ka checkout chal raha hai (${view.minutes} min) — Safepay confirm karte hi update hoga</span>`
    : view.kind === "none" && view.staleCheckout
      ? `<span class="pending">${svg(IC.clock)} Pichla checkout poora nahi hua tha — jab chahein dobara koshish karein</span>`
      : d.pendingUpgradeTier ? `<span class="pending">${svg(IC.clock)} Upgrade request: ${escHtml(tierName(d.pendingUpgradeTier))} (review mein)</span>` : ""
  const endsLine =
    view.kind === "cancelled_days"
      ? `Cancel ho chuka · ${view.until ? fmtDate(view.until) : fmtDate(d.subscriptionEndsAt)} tak chalega`
      : d.subscriptionEndsAt ? `${d.subscriptionExpired ? "Khatam hua" : "Chalta hai"} ${fmtDate(d.subscriptionEndsAt)}` : paidActive ? "Monthly" : "Abhi koi paid plan nahi"

  const cur = `<div class="card cur-plan"><span class="cur-ic">${svg(TIER_ICON[effectiveTier] || IC.bolt, 1.8)}</span>
    <div class="cur-main"><div class="cur-t">Aapka plan: ${escHtml(paidActive ? curPlan?.name || tierName(effectiveTier) : "Koi plan nahi")}</div><div class="cur-s">${escHtml(endsLine)}${paidActive && curPlan?.tagline ? ` · ${escHtml(curPlan.tagline)}` : ""}</div></div>${pendingLine}</div>`

  const plans = `<div class="plans">${d.plans.map((p) => planCard(p, d, view)).join("")}</div>`

  const comparison = (d.comparison || []).length ? `<div class="card" style="margin-bottom:16px"><div class="card-h" style="padding:14px 16px 6px"><div><h2 style="font-size:13.5px;font-weight:600">Features ki tafseel</h2></div></div>
    <div class="tbl-wrap"><table class="tbl cmp"><thead><tr><th>Feature</th><th>Free</th><th>Pro</th><th>Premium</th></tr></thead>
    <tbody>${d.comparison!.map((r) => `<tr><td>${escHtml(r.label)}</td>
      <td>${r.free ? `<span class="yes">${svg(IC.check, 2.4)}</span>` : `<span class="no">${svg(IC.dash, 2)}</span>`}</td>
      <td>${r.pro ? `<span class="yes">${svg(IC.check, 2.4)}</span>` : `<span class="no">${svg(IC.dash, 2)}</span>`}</td>
      <td>${r.premium ? `<span class="yes">${svg(IC.check, 2.4)}</span>` : `<span class="no">${svg(IC.dash, 2)}</span>`}</td></tr>`).join("")}</tbody></table></div></div>` : ""

  const note = `<div class="card"><div class="note"><b>Payment Safepay ke zariye hoti hai</b> — card ki tafseel hum kabhi nahi dekhte na rakhte hain. Subscription har mahina khud renew hoti hai; jab chahein cancel kar sakte hain. ${escHtml(d.pricing?.taxNote || "")} <a href="/vendor-subscription-policy" target="_blank" rel="noopener" style="color:var(--accent-ink);text-decoration:underline">Subscription policy</a></div></div>`

  const declineLine = d.lastDecline && !d.pendingUpgradeTier
    ? `<div class="card" style="margin-bottom:16px;padding:12px 16px;display:flex;gap:10px;align-items:flex-start;background:var(--bad-wash);border-color:transparent"><span style="color:var(--bad);flex:none">${svg(IC.clock)}</span><div style="font-size:12.5px;color:var(--ink-2)"><b style="color:var(--bad)">Pichli upgrade request (${escHtml(d.lastDecline.tierName || tierName(d.lastDecline.tier))}) manzoor nahi hui${d.lastDecline.declinedAt ? ` · ${fmtDate(d.lastDecline.declinedAt)}` : ""}.</b>${d.lastDecline.reason ? `<div style="margin-top:3px">Wajah: ${escHtml(d.lastDecline.reason)}</div>` : ""}</div></div>`
    : ""

  return `
  <div class="head"><div><h1>Plan & billing</h1><div class="sub">Apna plan chunein — payment Safepay par hoti hai aur har mahina khud renew hoti hai.</div></div></div>
  ${returnBanner(mode, status, waited)}${statusCard(status)}${cur}${declineLine}${plans}${historyCard(payments)}${comparison}${note}
  <div class="foot">WeddingWala vendor console · Billing</div>`
}

export function BillingArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/billing", crumbBold: "Paisa", crumbSub: "Plan & billing", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const params = useSearchParams()
  const [mode, setMode] = React.useState<ReturnMode>(null)
  React.useEffect(() => {
    const m = params?.get("checkout")
    setMode(m === "return" || m === "cancel" ? m : null)
    // Safepay appends its own query (plan_id, auth_token, …) after ours when
    // it sends the vendor back; keep only the part we use.
    if ((m === "return" || m === "cancel") && typeof window !== "undefined" && /auth_token=|plan_id=/.test(window.location.search)) {
      window.history.replaceState(null, "", `/dashboard/billing?checkout=${m}`)
    }
  }, [params])
  const [waited, setWaited] = React.useState(0)

  const { data, isError } = useQuery({ queryKey: ["billing-art"], queryFn: () => SubscriptionAPI.getMyPlan() })
  const billing = useQuery({
    queryKey: ["billing-status"],
    queryFn: () => SubscriptionAPI.getBillingStatus(),
    // Back from checkout: ask every 3s until Safepay's webhook has landed (or 2 min).
    refetchInterval: (q) => (mode === "return" && q.state.data?.access !== "active" && waited < 120 ? 3000 : false),
    staleTime: 10_000,
  })
  React.useEffect(() => {
    if (mode !== "return") return
    const t = setInterval(() => setWaited((s) => s + 3), 3000)
    return () => clearInterval(t)
  }, [mode])
  React.useEffect(() => {
    if (billing.data?.access === "active") { qc.invalidateQueries({ queryKey: ["billing-art"] }); qc.invalidateQueries({ queryKey: ["billing-payments"] }) }
  }, [billing.data?.access, qc])
  const payments = useQuery({ queryKey: ["billing-payments"], queryFn: () => SubscriptionAPI.listPayments(), staleTime: 30_000 })

  const pendingRef = React.useRef<SubscriptionTier | null>(null)
  pendingRef.current = data?.pendingUpgradeTier ?? null

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Plan & billing</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Plan load ho raha hai…</div>`; return }
    wwc.innerHTML = buildContent(data, billing.data ?? null, mode, waited, payments.data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, isError, billing.data, mode, waited >= 120, payments.data])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const msgOf = (err: unknown) => (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    const codeOf = (err: unknown) => (err as { response?: { data?: { data?: { code?: string } } } })?.response?.data?.data?.code
    const refresh = () => { qc.invalidateQueries({ queryKey: ["billing-status"] }); qc.invalidateQueries({ queryKey: ["billing-art"] }); qc.invalidateQueries({ queryKey: ["billing-payments"] }) }

    // Leave for Safepay's hosted page. Nothing is charged until the vendor
    // approves there; nothing activates until Safepay tells our server.
    const goToSafepay = async (btn: HTMLButtonElement, tier: SubscriptionTier, start: () => Promise<{ checkoutUrl: string }>) => {
      btn.disabled = true
      const label = btn.innerHTML; btn.innerHTML = "Safepay khul raha hai…"
      try {
        const r = await start()
        window.location.assign(r.checkoutUrl)
      } catch (err: unknown) {
        const code = codeOf(err)
        if (code === "PAYMENTS_NOT_CONFIGURED") {
          // Online payment not switched on yet: fall back to the request queue, and say so.
          try {
            await SubscriptionAPI.requestUpgrade(tier, !!pendingRef.current)
            toast.success("Online payment abhi on nahi hai — aapki request team ko bhej di, hum rabta karenge")
            qc.invalidateQueries({ queryKey: ["billing-art"] })
          } catch (err2: unknown) {
            toast.error(msgOf(err2) || "Request nahi gayi — dobara koshish karein")
          }
        } else if (code === "ACTIVE_SUBSCRIPTION" || code === "NO_ACTIVE_PLAN") {
          // The screen was stale. Nothing was charged; refresh so the cards match the server.
          toast.error(msgOf(err) || "Plan ki haalat badal gayi thi — kuch charge nahi hua")
          refresh()
        } else {
          toast.error(msgOf(err) || "Payment shuru nahi ho saki — kuch charge nahi hua, dobara koshish karein")
        }
        btn.disabled = false; btn.innerHTML = label
      }
    }

    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { refresh(); return }
      if (t.closest("[data-dismiss-return]")) { window.history.replaceState(null, "", "/dashboard/billing"); setMode(null); return }

      // Cancel: at Safepay first, then here. Access runs to the paid period end.
      const cancelBtn = t.closest("[data-cancel-plan]") as HTMLButtonElement | null
      if (cancelBtn) {
        const until = cancelBtn.dataset.until || "paid period ke aakhir"
        openConfirm(s, {
          title: "Plan cancel karein?",
          message: `Aage koi charge nahi hoga. Portal ${until} tak khula rahega, phir band ho jayega — aapki bookings, khata aur records mehfooz rehte hain aur listing couples ko dikhti rahegi. Jab chahein dobara subscribe kar sakte hain.`,
          confirmLabel: "Haan, cancel karein",
          cancelLabel: "Rehne dein",
          onConfirm: async () => {
            cancelBtn.disabled = true
            try {
              const r = await SubscriptionAPI.cancelSubscription()
              toast.success(`Plan cancel ho gaya — access ${fmtDate(r.subscriptionEndsAt)} tak rahegi`)
              refresh()
            } catch (err: unknown) {
              toast.error(msgOf(err) || "Cancel nahi ho saka — dobara koshish karein ya hum se rabta karein")
              cancelBtn.disabled = false
            }
          },
        })
        return
      }

      // Plan change (or a card change on the same tier): preview, confirm, then a new checkout.
      const change = t.closest("[data-change-plan]") as HTMLButtonElement | null
      if (change?.dataset.changePlan) {
        const tier = change.dataset.changePlan as SubscriptionTier
        change.disabled = true
        try {
          const pv = await SubscriptionAPI.changePlanPreview(tier)
          const rs = (paisas: number) => `Rs ${pkNum(Math.round(paisas / 100))}`
          const message = pv.reactivation
            ? `Aapka ${pv.currentPlanName} plan cancel tha, lekin ${pv.unusedDays} din ab bhi aapke hain. Aaj ${rs(pv.chargeNowPaisas)} charge hoga (Safepay) aur woh din ${pv.sameTier ? "poore ke poore" : `${pv.newPlanName} par ${pv.creditDays} din ban kar`} naye plan mein shamil honge — plan ${fmtDate(pv.newPeriodEndsAt)} tak chalega, phir har mahina khud renew.`
            : pv.sameTier
              ? `Safepay par naya card save hoga aur aaj ${rs(pv.chargeNowPaisas)} charge hoga. Purane plan ke bache ${pv.unusedDays} din poore ke poore naye mein shamil hain — plan ${fmtDate(pv.newPeriodEndsAt)} tak chalega, phir har mahina khud renew. Purana card wala subscription khud cancel ho jayega; koi double charge nahi.`
              : `Aaj ${rs(pv.chargeNowPaisas)} charge hoga (Safepay). ${pv.currentPlanName} ke bache ${pv.unusedDays} din = ${pv.newPlanName} par ${pv.creditDays} din credit; naya plan ${fmtDate(pv.newPeriodEndsAt)} tak chalega, phir har mahina khud renew. Purana plan khud cancel ho jayega; koi double charge nahi.`
          openConfirm(s, {
            title: pv.reactivation ? (pv.sameTier ? `${pv.newPlanName} dobara chalu karein?` : `${pv.newPlanName} lein?`) : pv.sameTier ? "Card badlein" : `${pv.newPlanName} par switch karein?`,
            message,
            confirmLabel: pv.reactivation ? "Safepay par jaayein" : pv.sameTier ? "Safepay par jaayein" : `Haan, ${pv.newPlanName} lein`,
            cancelLabel: "Rehne dein",
            danger: false,
            onConfirm: () => { void goToSafepay(change, tier, () => SubscriptionAPI.startPlanChange(tier)) },
          })
        } catch (err: unknown) {
          if (codeOf(err) === "NO_ACTIVE_PLAN") { toast.error("Koi active plan nahi — neeche se subscribe karein"); refresh() }
          else toast.error(msgOf(err) || "Preview nahi mila — dobara koshish karein")
        } finally {
          change.disabled = false
        }
        return
      }

      // First subscribe: say what Safepay will ask for, so nobody is surprised by its login page.
      const sub = t.closest("[data-subscribe]") as HTMLButtonElement | null
      if (!sub?.dataset.subscribe) return
      const tier = sub.dataset.subscribe as SubscriptionTier
      openConfirm(s, {
        title: "Safepay par payment",
        message: "Aap Safepay ke secure page par jayenge. Wahan ek Safepay account banta hai (email + password), card save hota hai, aur har mahina khud charge hota hai. Hum card ki tafseel kabhi nahi dekhte. Jab tak aap wahan approve na karein, kuch charge nahi hota.",
        confirmLabel: "Safepay par jaayein",
        cancelLabel: "Rehne dein",
        danger: false,
        onConfirm: () => { void goToSafepay(sub, tier, () => SubscriptionAPI.startCheckout(tier)) },
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default BillingArtifact
