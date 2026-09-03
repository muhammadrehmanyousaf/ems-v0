"use client"

/**
 * Billing / plan — premium rebuild on the shared champagne shell.
 * Real subscription data via SubscriptionAPI.getMyPlan + requestUpgrade.
 * Current-plan status, the plan catalogue as cards, an upgrade action (with the
 * pending-request state), a feature comparison table, and the pricing note.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { SubscriptionAPI, type MyPlanData, type SubscriptionTier, type PlanCatalogEntry } from "@/lib/api/subscription"
import { useArtifactShell, pkNum, escHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const RANK: Record<SubscriptionTier, number> = { free: 0, pro: 1, premium: 2 }
function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }) }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  check: '<path d="M20 6 9 17l-5-5"/>', dash: '<path d="M5 12h14"/>', star: '<path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"/>',
  crown: '<path d="M3 7l4 5 5-7 5 7 4-5v11H3z"/>', bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
}
const TIER_ICON: Record<SubscriptionTier, string> = { free: IC.bolt, pro: IC.star, premium: IC.crown }

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
/* comparison */
.cmp thead th{ text-align:center; } .cmp thead th:first-child{ text-align:left; } .cmp td{ text-align:center; } .cmp td:first-child{ text-align:left; font-weight:500; color:var(--ink-2); }
.cmp .yes{ color:var(--ok); } .cmp .no{ color:var(--ink-4); } .cmp svg{ width:16px; height:16px; display:inline-block; }
.note{ padding:14px 16px; font-size:11.5px; color:var(--ink-3); line-height:1.6; } .note b{ color:var(--ink-2); font-weight:600; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:900px){ .plans{ grid-template-columns:1fr; } }
`

function planCard(p: PlanCatalogEntry, cur: SubscriptionTier, pending: SubscriptionTier | null): string {
  const isCur = p.tier === cur
  const isPending = pending === p.tier
  const knownRanks = RANK[p.tier] != null && RANK[cur] != null
  const definitelyLower = knownRanks && RANK[p.tier] < RANK[cur]
  const highlights = (p.highlights || []).map((h) => `<div class="feat">${svg(IC.check, 2.4)} ${escHtml(h)}</div>`).join("")
  const caps = (p.caps || []).map((c) => `<div class="cap">${svg(IC.dash, 2)} ${escHtml(c)}</div>`).join("")
  let foot = ""
  if (isCur) foot = `<div class="badge-cur">${svg(IC.check, 2.4)} Aapka plan</div>`
  else if (isPending) foot = `<div class="badge-cur" style="background:var(--warn-wash);color:var(--warn);border-color:transparent">${svg(IC.clock)} Request bheji gayi</div>`
  else if (definitelyLower) foot = `<div class="badge-inc">Aapke plan mein shamil</div>`
  else foot = `<button class="btn btn-primary" data-upgrade="${p.tier}">${svg(IC.bolt)} ${escHtml(p.name)} lein</button>`
  return `<div class="plan${isCur ? " cur" : ""}">
    <div class="plan-h"><div class="plan-top"><span class="plan-ic">${svg(TIER_ICON[p.tier], 1.8)}</span><div><div class="plan-nm">${escHtml(p.name)}</div><div class="plan-tag">${escHtml(p.tagline || "")}</div></div></div>
      <div class="plan-price${p.pricePkrMonthly <= 0 ? " free" : ""}">${p.pricePkrMonthly <= 0 ? "Muft" : `<span class="rs">Rs</span> ${pkNum(p.pricePkrMonthly)} <span class="per">/ mahina</span>`}</div></div>
    <div class="plan-body">${highlights}${caps}</div>
    <div class="plan-foot">${foot}</div></div>`
}

function buildContent(d: MyPlanData): string {
  const curPlan = d.plans.find((p) => p.tier === d.currentTier)
  const tierName = (t: SubscriptionTier) => d.tierNames?.[t] || d.plans.find((p) => p.tier === t)?.name || t
  const pendingLine = d.pendingUpgradeTier ? `<span class="pending">${svg(IC.clock)} Upgrade request: ${escHtml(tierName(d.pendingUpgradeTier))} (review mein)</span>` : ""
  const endsLine = d.subscriptionEndsAt ? `${d.subscriptionExpired ? "Khatam hua" : "Chalta hai"} ${fmtDate(d.subscriptionEndsAt)}` : "Koi expiry nahi"

  const cur = `<div class="card cur-plan"><span class="cur-ic">${svg(TIER_ICON[d.currentTier], 1.8)}</span>
    <div class="cur-main"><div class="cur-t">Aapka plan: ${escHtml(curPlan?.name || tierName(d.currentTier))}</div><div class="cur-s">${escHtml(endsLine)}${curPlan?.tagline ? ` · ${escHtml(curPlan.tagline)}` : ""}</div></div>${pendingLine}</div>`

  const plans = `<div class="plans">${d.plans.map((p) => planCard(p, d.currentTier, d.pendingUpgradeTier)).join("")}</div>`

  const comparison = (d.comparison || []).length ? `<div class="card" style="margin-bottom:16px"><div class="card-h" style="padding:14px 16px 6px"><div><h2 style="font-size:13.5px;font-weight:600">Features ki tafseel</h2></div></div>
    <div class="tbl-wrap"><table class="tbl cmp"><thead><tr><th>Feature</th><th>Free</th><th>Pro</th><th>Premium</th></tr></thead>
    <tbody>${d.comparison!.map((r) => `<tr><td>${escHtml(r.label)}</td>
      <td>${r.free ? `<span class="yes">${svg(IC.check, 2.4)}</span>` : `<span class="no">${svg(IC.dash, 2)}</span>`}</td>
      <td>${r.pro ? `<span class="yes">${svg(IC.check, 2.4)}</span>` : `<span class="no">${svg(IC.dash, 2)}</span>`}</td>
      <td>${r.premium ? `<span class="yes">${svg(IC.check, 2.4)}</span>` : `<span class="no">${svg(IC.dash, 2)}</span>`}</td></tr>`).join("")}</tbody></table></div></div>` : ""

  const note = d.pricing ? `<div class="card"><div class="note">${d.pricing.indicative ? "<b>Qeematein indicative hain</b> — abhi online payment nahi, upgrade request review hoti hai. " : ""}${escHtml(d.pricing.taxNote || "")} ${escHtml(d.pricing.disclosure || "")}</div></div>` : ""

  const declineLine = d.lastDecline && !d.pendingUpgradeTier
    ? `<div class="card" style="margin-bottom:16px;padding:12px 16px;display:flex;gap:10px;align-items:flex-start;background:var(--bad-wash);border-color:transparent"><span style="color:var(--bad);flex:none">${svg(IC.clock)}</span><div style="font-size:12.5px;color:var(--ink-2)"><b style="color:var(--bad)">Pichli upgrade request (${escHtml(d.lastDecline.tierName || tierName(d.lastDecline.tier))}) manzoor nahi hui${d.lastDecline.declinedAt ? ` · ${fmtDate(d.lastDecline.declinedAt)}` : ""}.</b>${d.lastDecline.reason ? `<div style="margin-top:3px">Wajah: ${escHtml(d.lastDecline.reason)}</div>` : ""}</div></div>`
    : ""

  return `
  <div class="head"><div><h1>Plan & billing</h1><div class="sub">Apna plan dekhein aur behtar features ke liye upgrade karein.</div></div></div>
  ${cur}${declineLine}${plans}${comparison}${note}
  <div class="foot">WeddingWala vendor console · Billing</div>`
}

export function BillingArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/billing", crumbBold: "Paisa", crumbSub: "Plan & billing", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const { data, isError } = useQuery({ queryKey: ["billing-art"], queryFn: () => SubscriptionAPI.getMyPlan() })
  const pendingRef = React.useRef<SubscriptionTier | null>(null)
  pendingRef.current = data?.pendingUpgradeTier ?? null

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="loadwrap">Plan load nahi hua — dobara koshish karein.</div>`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Plan load ho raha hai…</div>`; return }
    wwc.innerHTML = buildContent(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", async (e) => {
      const up = (e.target as HTMLElement).closest("[data-upgrade]") as HTMLElement | null
      if (!up?.dataset.upgrade) return
      const tier = up.dataset.upgrade as SubscriptionTier
      const btn = up as HTMLButtonElement; btn.disabled = true
      try {
        await SubscriptionAPI.requestUpgrade(tier, !!pendingRef.current)
        toast.success("Upgrade request bhej di — team review karegi")
        qc.invalidateQueries({ queryKey: ["billing-art"] })
      } catch (err: unknown) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Request nahi gayi — dobara koshish karein")
        btn.disabled = false
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default BillingArtifact
