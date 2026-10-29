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
import { usePlan, type PlanApi } from "@/context/plan-context"
import { LIMIT_NOUNS, type LimitKey } from "@/lib/plan-gate"
import { useAccess } from "@/hooks/use-access"
import { accessFromStatus, isFreeTier, isLockedState, type Access } from "@/lib/plans/access"
import { useBusiness } from "@/context/BusinessContext"
import { addManualPaymentProof, getLiveVenues, getManualPayment, isNotThere, saveLiveVenues, submitManualPayment, withdrawManualPayment, type LiveVenues, type ManualMethodKey, type ManualPaymentInfo } from "@/lib/api/billing"
import { say } from "@/lib/plans/copy"
import {
  STATE_CARDS_CSS, bi, liveVenuesDrawerHtml, lockedCardHtml, freeTierCardHtml, submissionsCardHtml, manualCardHtml, manualDrawerHtml, manualUnavailableHtml, overLimitCardHtml, trialCardHtml,
  type OverLimitRow,
} from "./plan-state-cards"
import { useArtifactShell, pkNum, escHtml, errorBannerHtml, openConfirm, openDrawer, closeDrawer, planMeterHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

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
.us-grid{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px 28px; padding:8px 16px 16px; } .us-row{ display:flex; flex-direction:column; gap:6px; min-width:0; } .us-l{ font-size:12px; font-weight:600; color:var(--ink); } .us-l span{ font-weight:400; color:var(--ink-3); } .us-row .plan-meter{ max-width:none; }
@media (max-width:700px){ .us-grid{ grid-template-columns:1fr; } }
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
${STATE_CARDS_CSS}`

type ReturnMode = "return" | "cancel" | null

/**
 * The one state every card answers to. It comes from the subscription row
 * that governs access (what Safepay last told us), never from the access
 * flag alone: a cancelled plan still has access but is not live, a checkout
 * in flight has no access but must block a second checkout.
 */
type PlanView =
  | { kind: "none"; staleCheckout: boolean }
  | { kind: "pending"; tier: string; minutes: number; liveTier: string | null }
  | { kind: "live"; tier: string; trialEndsAt: string | null }
  | { kind: "cancelled_days"; tier: string; until: string | null }
const LIVE_STATUSES = ["active", "payment_failed", "paused", "trialing"]
/** A checkout Safepay has not confirmed within this long is treated as walked away from. */
const PENDING_LOCK_MINUTES = 15
function planViewOf(status: BillingStatus | null): PlanView {
  if (!status) return { kind: "none", staleCheckout: false }
  const pendingMinutes = status.pending ? Math.max(0, Math.round((Date.now() - new Date(status.pending.createdAt).getTime()) / 60000)) : null
  const s = status.subscription
  const hasAccess = status.access === "active" || status.access === "past_due"
  if (status.pending && pendingMinutes !== null && pendingMinutes < PENDING_LOCK_MINUTES)
    return { kind: "pending", tier: status.pending.tier, minutes: pendingMinutes, liveTier: s && LIVE_STATUSES.includes(s.status) && hasAccess ? s.tier : null }
  if (s && LIVE_STATUSES.includes(s.status) && hasAccess) return { kind: "live", tier: s.tier, trialEndsAt: s.status === "trialing" ? s.trialEndsAt || s.currentPeriodEndsAt : null }
  if (s && s.status === "cancelled" && hasAccess) return { kind: "cancelled_days", tier: s.tier, until: s.currentPeriodEndsAt || status.subscriptionEndsAt }
  return { kind: "none", staleCheckout: !!status.pending }
}
function isLive(status: BillingStatus | null): boolean {
  return planViewOf(status).kind === "live"
}

const priceBtn = (p: PlanCatalogEntry, cls: string, attr: string, label: string, aria: string, disabled = false) =>
  `<button class="btn ${cls}" ${attr} aria-label="${escHtml(aria)}"${disabled ? " disabled" : ""}>${disabled ? "" : svg(IC.card)} ${label} · <span class="rs">Rs</span> ${pkNum(p.pricePkrMonthly)} / mahina</button>`

/** What the server's access object says the cards may offer: the automatic trial means no trial button except as a fallback. */
interface CardCtx { canStartTrial: boolean; trialDays: number; renewTier: string | null }

function planCard(p: PlanCatalogEntry, d: MyPlanData, view: PlanView, ctx: CardCtx): string {
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
      : view.liveTier === p.tier
        ? `<div class="badge-cur">${svg(IC.check, 2.4)} Aapka plan · active</div><div class="badge-inc" style="margin-top:8px">Naye plan ki confirmation ka intezaar</div>`
        : priceBtn(p, "btn-ghost", "", "Intezaar karein", `${p.name}: a checkout is already in progress`, true)
  } else if (view.kind === "live") {
    const cur = view.tier
    isCur = p.tier === cur
    const knownRanks = RANK[p.tier] != null && RANK[cur] != null
    const lower = knownRanks && RANK[p.tier] < RANK[cur]
    if (isCur && view.trialEndsAt)
      // A running free trial: the plan is theirs until the trial ends; paying now carries the rest over.
      foot = `<div class="badge-cur">${svg(IC.check, 2.4)} Free trial · ${escHtml(fmtDate(view.trialEndsAt))} tak</div><div style="margin-top:8px">${priceBtn(p, "btn-primary", tierAttr, "Abhi subscribe karein", `Subscribe to ${p.name} now for Rs ${pkNum(p.pricePkrMonthly)} a month with Safepay; unused trial days carry over`)}</div>`
    else if (isCur)
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
    const renewing = ctx.renewTier === p.tier
    const subscribeBtn = priceBtn(p, "btn-primary", `data-subscribe="${escHtml(p.tier)}"`, renewing ? "Renew" : "Subscribe", `${renewing ? "Renew" : "Subscribe to"} ${p.name} for Rs ${pkNum(p.pricePkrMonthly)} a month with Safepay`)
    const days = ctx.trialDays || d.trialDays || 0
    // The trial starts by itself when the first business is submitted. This button is only a fallback, and only when the
    // server's access object says a trial can still be started by hand (canStartTrial); never from a local rule.
    foot = ctx.canStartTrial
      ? `<button class="btn btn-primary" data-trial="${escHtml(p.tier)}" data-trial-days="${days > 0 ? days : ""}" data-plan-name="${escHtml(p.name)}" aria-label="Start a free trial of ${escHtml(p.name)}${days > 0 ? ` for ${days} days` : ""}">${svg(IC.check, 2.4)} ${days > 0 ? `${days} din muft azmaayein` : "Muft trial shuru karein"}</button><div style="margin-top:8px">${priceBtn(p, "btn-ghost", `data-subscribe="${escHtml(p.tier)}"`, "Ya abhi subscribe karein", `Subscribe to ${p.name} for Rs ${pkNum(p.pricePkrMonthly)} a month with Safepay`)}</div>`
      : subscribeBtn
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
    return `<div class="sp warn" role="status">${svg(IC.alert)}<div><div class="sp-t">Safepay ne abhi tak payment report nahi ki</div><div class="sp-s">Agar aapne Safepay par "Agree &amp; Subscribe" dabaya aur payment poori hui hai, to confirmation aate hi plan khud active ho jayega — dobara payment na karein. Agar card sirf save hua, Safepay par error aaya, ya aap beech mein chhor aaye, to kuch charge nahi hua: neeche se checkout cancel karke dobara koshish karein. Masla rahe to hamein info@weddingwala.pk par likhein.</div><div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-ghost sm" data-cancel-checkout>Checkout cancel karein</button><button class="btn btn-ghost sm" data-dismiss-return>Theek hai</button></div></div></div>`
  return `<div class="sp info" role="status" aria-live="polite">${svg(IC.spin)}<div><div class="sp-t">Safepay se payment confirm ho rahi hai…</div><div class="sp-s">Chand second lagte hain. Dobara payment na karein — confirm hote hi yeh khud update hoga.</div></div></div>`
}

function statusCard(status: BillingStatus | null): string {
  if (!status || !status.subscription) return ""
  const s = status.subscription
  // PAY-UI_VENDOR-007 — a lapsed plan said "<date> tak access rahegi" with a date in the
  // PAST. The sentence is chosen by whether that date has gone by.
  // PL-E: once a trial or plan has lapsed the server's subscriptionEndsAt is null; the row's own end date is the day the portal closed.
  const endIso = status.subscriptionEndsAt || (s.status === "lapsed" ? s.currentPeriodEndsAt : null)
  const endsMs = endIso ? new Date(endIso).getTime() : NaN
  const accessEnded = Number.isFinite(endsMs) && endsMs < Date.now()
  const pill: Record<string, [string, string]> = {
    active: ["ok", "Active"], past_due: ["warn", "Payment fail — retry ho rahi hai"], pending: ["info", "Payment ka intezaar"], none: ["bad", "Koi active plan nahi"],
  }
  // The pill describes the newest subscription row, not the access flag: a
  // cancelled plan with days left keeps access open while a new one is pending.
  let [tone, label] = pill[status.access] || ["mut", status.access]
  if (s.status === "cancelled") [tone, label] = ["mut", "Cancelled"]
  else if (s.status === "paused") [tone, label] = ["info", "Paused"]
  else if (s.status === "trialing") [tone, label] = ["ok", "Free trial"]
  else if (s.status === "pending") [tone, label] = planViewOf(status).kind === "pending" ? ["info", "Payment ka intezaar"] : ["mut", "Checkout poora nahi hua"]
  else if (s.status === "payment_failed") [tone, label] = ["warn", "Payment fail — retry ho rahi hai"]
  else if (s.status === "active") [tone, label] = ["ok", "Active"]
  const extra =
    status.access === "past_due"
      ? `<div class="sp-s" style="color:var(--warn)">Is mahine ki payment nahi hui. Safepay dobara koshish karega; portal ${escHtml(fmtDate(status.subscriptionEndsAt))} tak khula rahega. Apna card ya account check karein, ya "Card badlein" se naya card lagayein.</div><div style="margin-top:10px"><button class="btn btn-primary sm" data-change-plan="${escHtml(s.tier)}">Abhi pay karein</button></div>`
      : s.status === "cancelled"
        ? `<div class="sp-s">Subscription cancel ho chuki hai. ${accessEnded ? `${escHtml(fmtDate(status.subscriptionEndsAt))} ko access khatam ho gaya;` : `${escHtml(fmtDate(status.subscriptionEndsAt))} tak access rahegi;`} jab chahein neeche se dobara subscribe karein.</div>`
        : s.status === "paused"
          ? `<div class="sp-s">Subscription rok di gayi hai — koi charge nahi ho raha. ${accessEnded ? `${escHtml(fmtDate(status.subscriptionEndsAt))} ko access khatam ho gaya.` : `${escHtml(fmtDate(status.subscriptionEndsAt))} tak access rahegi.`} Dobara chalu karwane ke liye hum se rabta karein.</div>`
          : s.status === "trialing"
            ? `<div class="sp-s">Free trial ${escHtml(fmtDate(s.trialEndsAt || s.currentPeriodEndsAt))} tak chalega — koi card nahi, koi charge nahi. Us se pehle subscribe karein to portal bina rukay chalta rahega aur bache din paid plan mein shamil ho jate hain.</div>`
            : ""
  const canCancel = LIVE_STATUSES.includes(s.status)
  const cancelBtn = canCancel
    ? `<div style="margin-top:10px"><button class="btn btn-ghost sm" data-cancel-plan data-until="${escHtml(fmtDate(status.subscriptionEndsAt))}">Plan cancel karein</button></div>`
    : ""
  return `<div class="sp" role="status">${svg(IC.lock)}<div style="flex:1;min-width:0">
    <div class="sp-t">Subscription <span class="st ${tone}" style="margin-left:8px">${escHtml(label)}</span>${status.environment === "sandbox" ? ` <span class="st mut" style="margin-left:6px">Sandbox</span>` : ""}</div>
    <dl class="sp-grid"><div><dt>${s.status === "trialing" ? "Trial until" : s.trialEndsAt && s.status === "lapsed" ? "Trial ended" : "Paid until"}</dt><dd>${escHtml(fmtDate(s.status === "trialing" || s.status === "lapsed" ? s.trialEndsAt || s.currentPeriodEndsAt : s.currentPeriodEndsAt))}</dd></div><div><dt>${accessEnded ? "Portal closed on" : "Portal open until"}</dt><dd>${escHtml(fmtDate(endIso))}</dd></div><div><dt>Billing</dt><dd>${s.status === "cancelled" ? "Band — koi charge nahi" : s.status === "trialing" ? "Free trial · koi charge nahi" : "Monthly · Safepay"}</dd></div></dl>
    ${extra}${cancelBtn}</div></div>`
}

function historyCard(payments: SubscriptionPaymentRow[] | undefined, planName: (tier: string) => string): string {
  const head = `<div class="card-h" style="padding:14px 16px 6px"><div><h2 style="font-size:13.5px;font-weight:600">Receipts</h2><div class="sub">Every payment you made and its receipt. Open one to print it or save it as PDF.</div></div></div>`
  if (!payments || payments.length === 0) {
    return `<div class="card" id="history" data-testid="receipts-card" style="margin-bottom:16px">${head}<div style="padding:6px 16px 18px;color:var(--ink-3);font-size:13px">No receipts yet. When a payment is approved, its receipt appears here with a number you can quote to us.</div></div>`
  }
  const rows = payments.map((r) => `<tr>
    <td>${escHtml(fmtDate(r.paidAt))}</td>
    <td><span class="rs">Rs</span> ${pkNum(Math.round(r.amountPaisas / 100))}</td>
    <td>${escHtml(planName(r.tier))}</td>
    <td>${escHtml(fmtDate(r.periodStart))} – ${escHtml(fmtDate(r.periodEnd))}</td>
    <td style="font-variant-numeric:tabular-nums">${escHtml(r.receiptNo)}${r.refundedPaisas && r.refundedPaisas > 0 ? ` <span class="st warn" style="margin-left:6px">Refund <span class="rs">Rs</span> ${pkNum(Math.round(r.refundedPaisas / 100))}</span>` : ""}</td>
    <td style="text-align:right"><a class="btn btn-ghost sm" href="/dashboard/billing/receipt/${encodeURIComponent(r.receiptNo)}">Open receipt</a></td>
  </tr>`).join("")
  return `<div class="card" id="history" data-testid="receipts-card" style="margin-bottom:16px">${head}
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Amount</th><th>Plan</th><th>Period</th><th>Receipt no.</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`
}

/** The quick-jump bar: the four things a vendor comes to this page for, one tap each. */
function billingNavHtml(hasPaid: boolean, hasSent: boolean): string {
  const j = (id: string, label: string) => `<button type="button" class="btn btn-ghost sm" data-jump="${id}">${label}</button>`
  return `<div class="bill-nav" data-testid="billing-nav" style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px">${j("plans", hasPaid ? "Plans" : "Choose a plan")}${j("manual", "Pay by bank / JazzCash")}${j("history", "Receipts")}${hasSent ? j("submissions", "Payments sent") : ""}</div>`
}

/**
 * "What you have used": the four things a plan limits, as the server counts them (the same numbers the gates enforce).
 * While limits are not being enforced for this vendor it is only a plain count, with no limit and no upgrade prompt.
 */
const LIMIT_TITLES: Record<LimitKey, string> = {
  businesses: "Businesses", halls: "Halls", spaces: "Spaces (har hall mein)", staff: "Staff accounts", images: "Photos",
  bookings: "Bookings (is mahine)", leads: "Leads (is mahine)", quoteRequests: "Quote requests (is mahine)", slots: "Bookable slots (har din)", packages: "Packages",
}
const USAGE_KEYS: LimitKey[] = ["bookings", "leads", "quoteRequests", "businesses", "halls", "spaces", "slots", "packages", "staff", "images"]

function usageCardHtml(plan: PlanApi): string {
  const rows = USAGE_KEYS.map((k) => {
    const l = plan.limit(k)
    if (!l || l.used === null) return ""
    const label = LIMIT_TITLES[k]
    const note = l.scope === "business" ? " (har business mein)" : ""
    return `<div class="us-row"><div class="us-l">${escHtml(label)}<span>${escHtml(note)}</span></div>${planMeterHtml(l, LIMIT_NOUNS[k])}</div>`
  }).join("")
  if (!rows) return ""
  const sub = plan.enforced ? "Aapke plan ki hadd ke muqable mein — bhar jaye to naya add nahi hota, jo hai woh kabhi delete nahi hota." : "Abhi aapke paas kitna hai."
  return `<div class="card usage-card" data-testid="usage-card" style="margin-bottom:16px"><div class="card-h" style="padding:14px 16px 6px"><div><h2 style="font-size:13.5px;font-weight:600">Aapka istemal</h2><div class="sub">${escHtml(sub)}</div></div></div><div class="us-grid">${rows}</div></div>`
}

interface PlanStateInput {
  access: Access | null
  manual: ManualPaymentInfo | null | "absent"
  askedManual: boolean
  overRows: OverLimitRow[]
  venues: { id: number; name: string; city: string | null; live: boolean | null }[]
  canChooseVenues: boolean
  venueLimit: number | null
}

function buildContent(d: MyPlanData, status: BillingStatus | null, mode: ReturnMode, waited: number, payments?: SubscriptionPaymentRow[], usageHtml = "", st?: PlanStateInput): string {
  const paidActive = status?.access === "active" || status?.access === "past_due"
  // When Safepay says the plan is paid, the tier it reports is the truth.
  const effectiveTier = (paidActive && status?.tier ? status.tier : d.currentTier) as SubscriptionTier
  const curPlan = d.plans.find((p) => p.tier === effectiveTier)
  const tierName = (t: SubscriptionTier) => d.tierNames?.[t] || d.plans.find((p) => p.tier === t)?.name || t
  const view = planViewOf(status)
  const pendingLine = view.kind === "pending"
    ? `<span class="pending">${svg(IC.spin)} ${escHtml(tierName(view.tier as SubscriptionTier))} ka checkout chal raha hai (${view.minutes} min) — Safepay confirm karte hi update hoga</span> <button class="btn btn-ghost sm" data-cancel-checkout>Checkout cancel karein</button>`
    : view.kind === "none" && view.staleCheckout
      ? `<span class="pending">${svg(IC.clock)} Pichla checkout poora nahi hua tha — jab chahein dobara koshish karein</span>`
      : d.pendingUpgradeTier ? `<span class="pending">${svg(IC.clock)} Upgrade request: ${escHtml(tierName(d.pendingUpgradeTier))} (review mein)</span>` : ""
  // The line under "Aapka plan" answers to the same state as the cards; the
  // catalogue payload's dates are never shown when Safepay says there is no plan.
  const endsLine =
    view.kind === "cancelled_days"
      ? `Cancel ho chuka · ${view.until ? fmtDate(view.until) : fmtDate(d.subscriptionEndsAt)} tak chalega`
      : view.kind === "live" && view.trialEndsAt
        ? `Free trial · ${fmtDate(view.trialEndsAt)} tak`
        : !paidActive
        ? "Abhi koi paid plan nahi"
        : status?.subscriptionEndsAt
          ? `Chalta hai ${fmtDate(status.subscriptionEndsAt)}`
          : d.subscriptionEndsAt ? `${d.subscriptionExpired ? "Khatam hua" : "Chalta hai"} ${fmtDate(d.subscriptionEndsAt)}` : "Monthly"

  const cur = `<div class="card cur-plan"><span class="cur-ic">${svg(TIER_ICON[effectiveTier] || IC.bolt, 1.8)}</span>
    <div class="cur-main"><div class="cur-t">Aapka plan: ${escHtml(paidActive ? curPlan?.name || tierName(effectiveTier) : "Koi plan nahi")}</div><div class="cur-s">${escHtml(endsLine)}${paidActive && curPlan?.tagline ? ` · ${escHtml(curPlan.tagline)}` : ""}</div></div>${pendingLine}</div>`

  const access = st?.access ?? null
  const ctx: CardCtx = {
    canStartTrial: !!access?.canStartTrial,
    trialDays: d.trialDays || 0,
    renewTier: access && isLockedState(access.state) && access.plan ? access.plan : null,
  }
  // There is no free vendor plan: a zero-price catalogue entry is never drawn.
  const plans = `<div class="plans" id="plans">${d.plans.filter((p) => p.pricePkrMonthly > 0).map((p) => planCard(p, d, view, ctx)).join("")}</div>`

  // The numbers each plan allows, from the server's limits table (the same one the gates enforce).
  const limitCell = (n: number | null | undefined) => `<td class="tnum">${n === null ? "Unlimited" : n === undefined ? "—" : n}</td>`
  const limitRows = (d.limitComparison || []).map((r) => `<tr><td>${escHtml(r.label.charAt(0).toUpperCase() + r.label.slice(1))}</td>${limitCell(r.pro)}${limitCell(r.premium)}${limitCell(r.elite)}</tr>`).join("")
  const comparison = (d.comparison || []).length ? `<div class="card" style="margin-bottom:16px"><div class="card-h" style="padding:14px 16px 6px"><div><h2 style="font-size:13.5px;font-weight:600">Features ki tafseel</h2></div></div>
    <div class="tbl-wrap"><table class="tbl cmp"><thead><tr><th>Feature</th><th>${escHtml(tierName("pro"))}</th><th>${escHtml(tierName("premium"))}</th><th>${escHtml(tierName("elite" as SubscriptionTier))}</th></tr></thead>
    <tbody>${d.comparison!.map((r) => `<tr><td>${escHtml(r.label)}</td>
      <td>${r.pro ? `<span class="yes">${svg(IC.check, 2.4)}</span>` : `<span class="no">${svg(IC.dash, 2)}</span>`}</td>
      <td>${r.premium ? `<span class="yes">${svg(IC.check, 2.4)}</span>` : `<span class="no">${svg(IC.dash, 2)}</span>`}</td>
      <td>${r.elite ? `<span class="yes">${svg(IC.check, 2.4)}</span>` : `<span class="no">${svg(IC.dash, 2)}</span>`}</td></tr>`).join("")}${limitRows}</tbody></table></div></div>` : ""

  const honest = `<div class="card" style="margin-bottom:16px"><div class="note" data-testid="plans-honest"><b>${escHtml(say("bill.honest.title", "en"))}</b> ${bi("bill.honest.note")}</div></div>`
  const note = `<div class="card"><div class="note"><b>Payment Safepay ke zariye hoti hai</b> — card ki tafseel hum kabhi nahi dekhte na rakhte hain. Subscription har mahina khud renew hoti hai; jab chahein cancel kar sakte hain. ${escHtml(d.pricing?.taxNote || "")} <a href="/vendor-subscription-policy" target="_blank" rel="noopener" style="color:var(--accent-ink);text-decoration:underline">Subscription policy</a></div></div>`

  const declineLine = d.lastDecline && !d.pendingUpgradeTier
    ? `<div class="card" style="margin-bottom:16px;padding:12px 16px;display:flex;gap:10px;align-items:flex-start;background:var(--bad-wash);border-color:transparent"><span style="color:var(--bad);flex:none">${svg(IC.clock)}</span><div style="font-size:12.5px;color:var(--ink-2)"><b style="color:var(--bad)">Pichli upgrade request (${escHtml(d.lastDecline.tierName || tierName(d.lastDecline.tier))}) manzoor nahi hui${d.lastDecline.declinedAt ? ` · ${fmtDate(d.lastDecline.declinedAt)}` : ""}.</b>${d.lastDecline.reason ? `<div style="margin-top:3px">Wajah: ${escHtml(d.lastDecline.reason)}</div>` : ""}</div></div>`
    : ""

  // One card says where the vendor stands: the trial countdown, "your plan is paused", or the Safepay status.
  const stateCard = access?.state === "trialing" ? trialCardHtml(access) : statusCard(status)
  const lockedCard = access && isLockedState(access.state) ? (isFreeTier(access) ? freeTierCardHtml() : lockedCardHtml(access)) : ""
  const planNameOfTier = (t: string) => tierName(t as SubscriptionTier)
  const manualCard = st?.manual && st.manual !== "absent" ? manualCardHtml(st.manual, planNameOfTier, access?.canPay !== false, !!access && !isLockedState(access.state) && access.state !== "past_due") : st?.askedManual ? manualUnavailableHtml() : ""
  const overCard = st && st.overRows.length ? overLimitCardHtml({ planName: access?.planName || curPlan?.name || "your", rows: st.overRows, venues: st.venues, canChoose: st.canChooseVenues, venueLimit: st.venueLimit }) : ""
  return `
  <div class="head"><div><h1>Plan & billing</h1><div class="sub">Apna plan chunein — payment Safepay par hoti hai aur har mahina khud renew hoti hai.</div></div></div>
  ${returnBanner(mode, status, waited)}${billingNavHtml(!!(payments && payments.length), !!(st?.manual && st.manual !== "absent" && st.manual.history.length))}${lockedCard}${stateCard}${cur}${isFreeTier(access) || !(access && isLockedState(access.state)) ? overCard : ""}${access && isLockedState(access.state) ? "" : usageHtml}${declineLine}${manualCard}${historyCard(payments, (t) => tierName(t as SubscriptionTier))}${submissionsCardHtml(st?.manual && st.manual !== "absent" ? st.manual : null, planNameOfTier)}${plans}${comparison}${honest}${note}
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
  // Safepay's "Cancel and return" brings the vendor here with ?checkout=cancel: they are not paying, so free the
  // checkout now instead of showing "checkout chal raha hai" for 15 minutes. A late payment would still activate the plan.
  React.useEffect(() => {
    if (mode !== "cancel") return
    SubscriptionAPI.cancelCheckout().catch(() => {}).finally(() => { qc.invalidateQueries({ queryKey: ["billing-status"] }); qc.invalidateQueries({ queryKey: ["billing-art"] }) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])
  const [waited, setWaited] = React.useState(0)

  const { data, isError } = useQuery({ queryKey: ["billing-art"], queryFn: () => SubscriptionAPI.getMyPlan() })
  const plan = usePlan()
  const usageHtml = React.useMemo(() => usageCardHtml(plan), [plan])
  // The server's access object, from the one access store (never derived here).
  const { access } = useAccess()
  const { businesses } = useBusiness()
  const askedManual = params?.get("pay") === "manual"
  const canPay = access ? access.canPay : true

  // The manual proof route (bank / JazzCash / Easypaisa). A server that does not have it yet answers 404: no card.
  const manualQ = useQuery({
    queryKey: ["billing-manual"],
    queryFn: async (): Promise<ManualPaymentInfo | "absent" | null> => {
      try { return await getManualPayment() } catch (e) { if (isNotThere(e)) return "absent"; throw e }
    },
    enabled: canPay && !access?.staff,
    retry: 0,
    staleTime: 30_000,
    refetchInterval: (q) => (q.state.data && q.state.data !== "absent" && q.state.data.current?.status === "pending" ? 30_000 : false),
  })

  // Over the plan's limit: which limits are exceeded (the server's numbers) and, for venues, which stay live.
  const overRows: OverLimitRow[] = React.useMemo(() => {
    const out: OverLimitRow[] = []
    for (const k of USAGE_KEYS) {
      const l = plan.limit(k)
      if (l && l.enforced && l.max !== null && l.used !== null && l.used > l.max) {
        out.push({ label: LIMIT_TITLES[k], used: l.used, max: l.max, nouns: LIMIT_NOUNS[k] })
      }
    }
    return out
  }, [plan])
  const venuesOver = overRows.some((x) => x.label === "Businesses")
  const liveQ = useQuery({
    queryKey: ["billing-live-venues"],
    queryFn: async (): Promise<LiveVenues | "absent" | null> => {
      try { return await getLiveVenues() } catch (e) { if (isNotThere(e)) return "absent"; throw e }
    },
    enabled: venuesOver,
    retry: 0,
    staleTime: 30_000,
  })
  const liveData = liveQ.data && liveQ.data !== "absent" ? liveQ.data : null
  const venueList = React.useMemo(() => {
    if (liveData) return liveData.venues.map((v) => ({ id: v.id, name: v.name, city: v.city, live: v.live as boolean | null }))
    return ((businesses || []) as { id: number; name?: string; city?: string }[]).map((b) => ({ id: b.id, name: b.name || "Venue", city: b.city || null, live: null as boolean | null }))
  }, [liveData, businesses])
  const stateInput: PlanStateInput = React.useMemo(() => ({
    access,
    manual: manualQ.data ?? null,
    askedManual,
    overRows,
    venues: venuesOver ? venueList : [],
    canChooseVenues: !!liveData,
    venueLimit: liveData?.limit ?? plan.limit("businesses")?.max ?? null,
  }), [access, manualQ.data, askedManual, overRows, venuesOver, venueList, liveData, plan])
  const planRef = React.useRef({ data: undefined as MyPlanData | undefined, state: stateInput, billing: undefined as BillingStatus | undefined })
  const billing = useQuery({
    queryKey: ["billing-status"],
    queryFn: () => SubscriptionAPI.getBillingStatus(),
    // Back from checkout: ask until Safepay's webhook has landed. A vendor who is already
    // active (upgrading, or re-subscribing on a cancelled plan with days left) still has a
    // checkout in flight, so "access is active" must NOT stop the polling: wait for `pending`
    // to clear. Every 3s for the first 2 min, then every 10s up to 15 min (Safepay retries an
    // undelivered event about every 5 min).
    refetchInterval: (q) => {
      if (mode !== "return") return false
      const inFlight = !!q.state.data?.pending || q.state.data?.access !== "active"
      if (!inFlight) return false
      return waited < 120 ? 3000 : waited < 900 ? 10_000 : false
    },
    staleTime: 10_000,
  })
  React.useEffect(() => {
    if (mode !== "return") return
    const t = setInterval(() => setWaited((s) => s + 3), 3000)
    return () => clearInterval(t)
  }, [mode])
  // Refresh the plan and the receipts whenever the governing subscription changes (new row,
  // new status, checkout cleared), not only when access flips: an upgrade keeps access active.
  const billingSig = `${billing.data?.access}|${billing.data?.subscription?.reference}|${billing.data?.subscription?.status}|${billing.data?.pending ? "p" : "-"}`
  const prevBillingSig = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!billing.data) return
    if (prevBillingSig.current !== null && prevBillingSig.current !== billingSig) {
      qc.invalidateQueries({ queryKey: ["billing-art"] }); qc.invalidateQueries({ queryKey: ["billing-payments"] })
    }
    prevBillingSig.current = billingSig
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingSig, qc])
  const payments = useQuery({ queryKey: ["billing-payments"], queryFn: () => SubscriptionAPI.listPayments(), staleTime: 30_000 })

  const pendingRef = React.useRef<SubscriptionTier | null>(null)
  pendingRef.current = data?.pendingUpgradeTier ?? null
  planRef.current = { data, state: stateInput, billing: billing.data }

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Plan & billing</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Plan load ho raha hai…</div>`; return }
    wwc.innerHTML = buildContent(data, billing.data ?? null, mode, waited, payments.data, usageHtml, stateInput)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, isError, billing.data, mode, waited >= 120, payments.data, usageHtml, stateInput])

  // Deep links: #history / #plans / #over / #manual scroll into the shadow content, and a renewal link
  // (?renew=1&plan=premium, the one in every reminder) opens that plan's confirmation once. ?pay=manual opens the manual form.
  const deepDone = React.useRef({ hash: "", renew: false, manual: false })
  // A link to a section while this page is already open (the Wall's sidebar "Receipts") changes the hash: scroll to it again.
  React.useEffect(() => {
    const onHash = () => {
      const sh = shadowRef.current
      const id = window.location.hash.replace("#", "")
      const el = sh && id ? sh.getElementById(id) : null
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])
  React.useEffect(() => {
    const sh = shadowRef.current
    if (!sh || !ready || !data) return
    const wwc = sh.getElementById("wwc"); if (!wwc || !wwc.querySelector(".plans")) return
    const hash = typeof window !== "undefined" ? window.location.hash.replace("#", "") : ""
    if (hash && deepDone.current.hash !== hash) {
      const el = sh.getElementById(hash)
      if (el) { deepDone.current.hash = hash; el.scrollIntoView({ block: "start" }) }
    }
    const wantPlan = params?.get("plan")
    if (params?.get("renew") === "1" && wantPlan && !deepDone.current.renew) {
      const btn = wwc.querySelector(`[data-subscribe="${CSS.escape(wantPlan)}"], [data-change-plan="${CSS.escape(wantPlan)}"]`) as HTMLButtonElement | null
      if (btn && !btn.disabled) { deepDone.current.renew = true; btn.click() }
    }
    if (askedManual && !deepDone.current.manual && manualQ.data && manualQ.data !== "absent" && manualQ.data.enabled) {
      deepDone.current.manual = true
      ;(wwc.querySelector("[data-manual-open]") as HTMLElement | null)?.click()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, billing.data, manualQ.data, askedManual])

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

    // Manual proof route: pick a plan, see where to send the money, upload the proof; a super-admin approves it.
    s.addEventListener("change", async (e) => {
      const t = e.target as HTMLElement
      if (t.id === "mp-addproof-file") {
        const input = t as HTMLInputElement
        const file = input.files?.[0]
        const id = Number(input.dataset.payment)
        if (file && id) {
          if (file.size > 8 * 1024 * 1024) { toast.error("The file is too big (max 8 MB)."); return }
          try { await addManualPaymentProof(id, file); toast.success("Screenshot added. We will check your payment.") } catch (err4: unknown) { toast.error(msgOf(err4) || "Could not upload it. Please try again.") }
          input.value = ""
          qc.invalidateQueries({ queryKey: ["billing-manual"] })
        }
        return
      }
      if (t.id === "mp-tier") {
        const price = (t as HTMLSelectElement).selectedOptions[0]?.dataset.price
        const amt = s.getElementById("mp-amt") as HTMLInputElement | null
        if (price && amt) amt.value = price
      }
      if (t.closest("[data-live-form]") && (t as HTMLInputElement).type === "checkbox") {
        const form = t.closest("[data-live-form]") as HTMLElement
        const boxes = Array.from(form.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[]
        boxes.forEach((b) => b.closest(".ol-row")?.classList.toggle("on", b.checked))
        const max = planRef.current.state.venueLimit
        const n = boxes.filter((b) => b.checked).length
        const c = form.querySelector("[data-live-count]"); if (c) c.textContent = max !== null ? `${n} of ${max} selected` : `${n} selected`
      }
    })
    s.addEventListener("submit", async (e) => {
      const form = e.target as HTMLFormElement
      if (form.matches("[data-mp-form]")) {
        e.preventDefault()
        const err = s.getElementById("mp-err") as HTMLElement | null
        const setErr = (m: string) => { if (err) err.textContent = m }
        const tier = (s.getElementById("mp-tier") as HTMLSelectElement | null)?.value || ""
        const ref = ((s.getElementById("mp-ref") as HTMLInputElement | null)?.value || "").trim()
        const amount = Number(((s.getElementById("mp-amt") as HTMLInputElement | null)?.value || "").replace(/[,\s]/g, ""))
        const method = ((form.querySelector('input[name="mp-method"]:checked') as HTMLInputElement | null)?.value || "") as ManualMethodKey
        const file = (s.getElementById("mp-proof") as HTMLInputElement | null)?.files?.[0]
        if (!tier || !method) return setErr("Choose a plan and how you paid.")
        if (!ref) return setErr("Enter the transaction ID or reference.")
        if (!Number.isFinite(amount) || amount <= 0) return setErr("Enter the amount you sent.")
        if (!file) return setErr("Upload your receipt or screenshot.")
        if (file.size > 8 * 1024 * 1024) return setErr("The file is larger than 8 MB.")
        if (!/^(image\/|application\/pdf)/.test(file.type)) return setErr("Upload an image or a PDF.")
        setErr("")
        const btn = form.querySelector("[data-mp-submit]") as HTMLButtonElement | null
        if (btn) { btn.disabled = true; btn.textContent = say("manual.sending", "en") }
        try {
          await submitManualPayment({ tier, method, reference: ref, amountPkr: amount, proof: file })
          closeDrawer(s)
          toast.success("Proof bhej diya gaya — hum business hours mein check karenge")
          qc.invalidateQueries({ queryKey: ["billing-manual"] })
        } catch (e2: unknown) {
          setErr(msgOf(e2) || "The proof could not be sent. Nothing was charged. Try again.")
          if (btn) { btn.disabled = false; btn.textContent = say("manual.submit", "en") }
        }
        return
      }
      if (form.matches("[data-live-form]")) {
        e.preventDefault()
        const ids = (Array.from(form.querySelectorAll('input[type="checkbox"]:checked')) as HTMLInputElement[]).map((b) => Number(b.value))
        const max = planRef.current.state.venueLimit
        const err = s.getElementById("live-err") as HTMLElement | null
        if (ids.length === 0) { if (err) err.textContent = "Keep at least one venue live."; return }
        if (max !== null && ids.length > max) { if (err) err.textContent = `Your plan allows ${max} live. Untick ${ids.length - max}.`; return }
        const btn = form.querySelector("[data-live-save]") as HTMLButtonElement | null
        if (btn) { btn.disabled = true; btn.textContent = say("over.saving", "en") }
        try {
          await saveLiveVenues(ids)
          closeDrawer(s)
          toast.success(say("over.saved", "en"))
          qc.invalidateQueries({ queryKey: ["billing-live-venues"] }); qc.invalidateQueries({ queryKey: ["billing-status"] })
        } catch (e2: unknown) {
          if (err) err.textContent = msgOf(e2) || "Could not save. Nothing was paused. Try again."
          if (btn) { btn.disabled = false; btn.textContent = say("over.save", "en") }
        }
      }
    })

    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { refresh(); return }
      const jump = t.closest("[data-jump]") as HTMLElement | null
      if (jump) {
        const which = jump.dataset.jump || ""
        const target = which === "plans" ? s.querySelector(".plans") : which === "manual" ? (s.getElementById("manual") || s.querySelector('[data-testid^="manual-"]')) : s.getElementById(which)
        if (target) (target as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" })
        else toast.message("Nothing there yet")
        return
      }
      if (t.closest("[data-manual-open]")) {
        const st = planRef.current.state
        const info = st.manual && st.manual !== "absent" ? st.manual : null
        const cat = planRef.current.data?.plans ?? []
        if (info?.enabled) openDrawer(s, "Bank transfer / JazzCash / Easypaisa", manualDrawerHtml(info, cat.map((p) => ({ tier: p.tier, name: p.name, pricePkrMonthly: p.pricePkrMonthly })), st.access?.plan ?? null))
        return
      }
      // Withdraw a waiting payment (wrong amount / reference / plan): nothing was charged, the reference is free again.
      const wd = t.closest("[data-mp-withdraw]") as HTMLElement | null
      if (wd) {
        const id = Number(wd.dataset.mpWithdraw)
        openConfirm(s, {
          title: "Withdraw this payment?",
          message: "Nothing is charged by withdrawing. Your payment is not approved yet, so you can send it again with the right plan, amount or reference. If you already paid, keep this one and contact us instead.",
          confirmLabel: "Yes, withdraw",
          cancelLabel: "Keep it",
          onConfirm: async () => {
            try {
              await withdrawManualPayment(id)
              toast.success("Withdrawn. You can send the payment again with the right details.")
            } catch (err3: unknown) {
              toast.error(msgOf(err3) || "Could not withdraw it. Please try again.")
            }
            qc.invalidateQueries({ queryKey: ["billing-manual"] })
          },
        })
        return
      }
      // Add the screenshot to a waiting payment that has none.
      const ap = t.closest("[data-mp-addproof]") as HTMLElement | null
      if (ap) {
        const input = s.getElementById("mp-addproof-file") as HTMLInputElement | null
        if (input) { input.dataset.payment = ap.dataset.mpAddproof || ""; input.click() }
        return
      }
      if (t.closest("[data-live-open]")) {
        const st = planRef.current.state
        openDrawer(s, say("over.pick", "en"), liveVenuesDrawerHtml({ limit: st.venueLimit, venues: st.venues.map((v) => ({ id: v.id, name: v.name, city: v.city, live: v.live !== false })) }))
        return
      }
      if (t.closest("[data-dismiss-return]")) { window.history.replaceState(null, "", "/dashboard/billing"); setMode(null); return }
      const abandonBtn = t.closest("[data-cancel-checkout]") as HTMLButtonElement | null
      if (abandonBtn) {
        abandonBtn.disabled = true
        try {
          await SubscriptionAPI.cancelCheckout()
          toast.success("Checkout cancel ho gaya — kuch charge nahi hua. Ab aap koi bhi plan chun sakte hain")
        } catch (err: unknown) {
          toast.error(codeOf(err) === "PAYMENT_IN_FLIGHT" ? "Safepay abhi aapki payment confirm kar raha hai — thori dair intezaar karein" : msgOf(err) || "Checkout cancel nahi ho saka — dobara koshish karein")
          abandonBtn.disabled = false
        }
        refresh()
        return
      }

      // Cancel: at Safepay first, then here. Access runs to the paid period end.
      const cancelBtn = t.closest("[data-cancel-plan]") as HTMLButtonElement | null
      if (cancelBtn) {
        const until = cancelBtn.dataset.until || "paid period ke aakhir"
        openConfirm(s, {
          title: "Plan cancel karein?",
          message: `Aage koi charge nahi hoga. Paid modules ${until} tak khule rahenge, phir aap Free plan par chale jayenge — Overview, Leads, Bookings, Calendar aur Chat chalte rahenge; baqi paid modules sirf dekhne ke liye hongay. Aapki bookings, khata aur records mehfooz rehte hain aur listing couples ko dikhti rahegi. Jab chahein dobara subscribe kar sakte hain.`,
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

      // Free trial (ours, no card): confirm, then it starts at once.
      const trialBtn = t.closest("[data-trial]") as HTMLButtonElement | null
      if (trialBtn?.dataset.trial) {
        const tier = trialBtn.dataset.trial as SubscriptionTier
        const days = trialBtn.dataset.trialDays || ""
        const planName = trialBtn.dataset.planName || "plan"
        openConfirm(s, {
          title: days ? `${days} din muft trial shuru karein?` : "Muft trial shuru karein?",
          message: `Koi card nahi, koi charge nahi. ${planName} ke saare features${days ? ` ${days} din ke liye` : ""} khul jayenge. Trial ke baad aap Free plan par chale jate hain (free modules chalte hain, paid modules sirf dekhne ke liye) jab tak aap subscribe na karein — aur jo din bach jayen, woh paid plan mein shamil ho jate hain. Trial ek hi baar milta hai.`,
          confirmLabel: "Trial shuru karein",
          cancelLabel: "Rehne dein",
          danger: false,
          onConfirm: async () => {
            trialBtn.disabled = true
            try {
              const r = await SubscriptionAPI.startTrial(tier)
              toast.success(`Free trial shuru — ${fmtDate(r.trialEndsAt)} tak`)
              refresh()
            } catch (err: unknown) {
              toast.error(msgOf(err) || "Trial shuru nahi ho saka — dobara koshish karein")
              trialBtn.disabled = false
              refresh()
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
          const message = pv.fromTrial
            ? `Aapka free trial chal raha hai (${pv.unusedDays} din baki). Aaj ${rs(pv.chargeNowPaisas)} charge hoga (Safepay) aur trial ke bache din ${pv.sameTier ? "poore ke poore" : `${pv.newPlanName} par ${pv.creditDays} din ban kar`} paid plan mein shamil honge — plan ${fmtDate(pv.newPeriodEndsAt)} tak chalega, phir har mahina khud renew.`
            : pv.reactivation
            ? `Aapka ${pv.currentPlanName} plan cancel tha, lekin ${pv.unusedDays} din ab bhi aapke hain. Aaj ${rs(pv.chargeNowPaisas)} charge hoga (Safepay) aur woh din ${pv.sameTier ? "poore ke poore" : `${pv.newPlanName} par ${pv.creditDays} din ban kar`} naye plan mein shamil honge — plan ${fmtDate(pv.newPeriodEndsAt)} tak chalega, phir har mahina khud renew.`
            : pv.sameTier
              ? `Safepay par naya card save hoga aur aaj ${rs(pv.chargeNowPaisas)} charge hoga. Purane plan ke bache ${pv.unusedDays} din poore ke poore naye mein shamil hain — plan ${fmtDate(pv.newPeriodEndsAt)} tak chalega, phir har mahina khud renew. Purana card wala subscription khud cancel ho jayega; koi double charge nahi.`
              : `Aaj ${rs(pv.chargeNowPaisas)} charge hoga (Safepay). ${pv.currentPlanName} ke bache ${pv.unusedDays} din = ${pv.newPlanName} par ${pv.creditDays} din credit; naya plan ${fmtDate(pv.newPeriodEndsAt)} tak chalega, phir har mahina khud renew. Purana plan khud cancel ho jayega; koi double charge nahi.`
          openConfirm(s, {
            title: pv.fromTrial ? (pv.sameTier ? "Abhi subscribe karein?" : `${pv.newPlanName} lein?`) : pv.reactivation ? (pv.sameTier ? `${pv.newPlanName} dobara chalu karein?` : `${pv.newPlanName} lein?`) : pv.sameTier ? "Card badlein" : `${pv.newPlanName} par switch karein?`,
            message,
            confirmLabel: pv.fromTrial || pv.reactivation ? "Safepay par jaayein" : pv.sameTier ? "Safepay par jaayein" : `Haan, ${pv.newPlanName} lein`,
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
