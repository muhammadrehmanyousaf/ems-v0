"use client"

/**
 * Promote — premium rebuild on the shared champagne shell.
 * Real listing-boost flow via PromotionsAPI.listMine (pricing placements + the
 * vendor's own requests) and create (request a boost). Read + request; approval
 * is the platform's job.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PromotionsAPI, type PromotionRequestRow, type PromotionPlacement, type PromotionStatus, type PricingPlacement } from "@/lib/api/promotions"
import { useBusiness } from "@/context/BusinessContext"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useArtifactShell, pkNum, escHtml, initTablePager, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const PLACEMENT_LABEL: Record<PromotionPlacement, string> = { homepage: "Homepage", category: "Category page", city: "Sheher page", search: "Search results" }
const STATUS_UI: Record<PromotionStatus, { label: string; tone: string }> = {
  pending: { label: "Review mein", tone: "warn" }, approved: { label: "Chal raha", tone: "ok" }, rejected: { label: "Mana", tone: "bad" }, expired: { label: "Khatam", tone: "mut" }, cancelled: { label: "Cancel", tone: "mut" },
}
const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  home: '<path d="M3 11l9-7 9 7M5 10v10h14V10"/>', grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  pin: '<path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>', rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2 0-2.8a2 2 0 0 0-3-.2zM12 15l-3-3a22 22 0 0 1 8-11 13 13 0 0 1 3 3 22 22 0 0 1-11 8zM9 12H4l3-3h3M12 15v5l3-3v-3"/>', trend: '<path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/>',
}
const PL_ICON: Record<PromotionPlacement, string> = { homepage: IC.home, category: IC.grid, city: IC.pin, search: IC.search }

const EXTRA_CSS = String.raw`
.promo-hero{ display:flex; gap:14px; align-items:center; padding:16px 18px; margin-bottom:16px; background:linear-gradient(150deg,var(--accent-wash),color-mix(in srgb,var(--surface) 78%,var(--accent-wash))); border-color:var(--accent-line); }
.ph-ic{ width:46px; height:46px; border-radius:13px; background:var(--surface); border:1px solid var(--accent-line); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .ph-ic svg{ width:24px; height:24px; }
.ph-t{ font-size:16px; font-weight:600; color:var(--accent-ink); } .ph-s{ font-size:12.5px; color:var(--ink-2); margin-top:2px; }
.sec-h{ font-size:14px; font-weight:600; margin:6px 0 12px; }
.pl-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; margin-bottom:22px; }
.plcard{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); overflow:hidden; }
.pl-h{ display:flex; align-items:center; gap:11px; padding:15px 16px 13px; border-bottom:1px solid var(--border); }
.pl-ic{ width:36px; height:36px; border-radius:10px; background:var(--accent-wash); border:1px solid var(--accent-line); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .pl-ic svg{ width:18px; height:18px; }
.pl-nm{ font-weight:660; font-size:14px; } .pl-sub{ font-size:11.5px; color:var(--ink-3); margin-top:1px; }
.pl-body{ padding:10px 12px 14px; display:flex; flex-direction:column; gap:8px; }
.pl-opt{ display:flex; align-items:center; gap:12px; padding:10px 12px; border:1px solid var(--border); border-radius:10px; background:var(--surface-2); text-align:left; transition:border-color .12s,background .12s; }
.pl-opt:hover{ border-color:var(--accent); background:var(--surface); }
.pl-days{ font-weight:600; font-size:13px; } .pl-days .u{ font-size:11px; color:var(--ink-3); font-weight:500; }
.pl-price{ margin-left:auto; font-weight:700; font-size:14px; letter-spacing:-.02em; } .pl-price .rs{ font-size:11px; color:var(--ink-3); font-weight:600; }
.pl-go{ width:30px; height:30px; border-radius:8px; background:var(--accent); color:var(--on-accent); display:grid; place-items:center; flex:none; } .pl-go svg{ width:15px; height:15px; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
`

function placementCard(p: PricingPlacement): string {
  const opts = (p.prices || []).sort((a, b) => a.windowDays - b.windowDays).map((pr) => `<button class="pl-opt" data-boost="${p.placement}" data-days="${pr.windowDays}"><div><div class="pl-days">${pr.windowDays} din <span class="u">boost</span></div></div><span class="pl-price tnum"><span class="rs">Rs</span> ${pkNum(money(pr.priceQuoted))}</span><span class="pl-go">${svg(IC.bolt)}</span></button>`).join("")
  return `<div class="plcard"><div class="pl-h"><span class="pl-ic">${svg(PL_ICON[p.placement] || IC.trend, 1.8)}</span><div><div class="pl-nm">${escHtml(p.label || PLACEMENT_LABEL[p.placement])}</div><div class="pl-sub">Yahan aapki listing upar dikhegi</div></div></div>
    <div class="pl-body">${opts || `<div style="padding:10px;color:var(--ink-3);font-size:12px">Abhi pricing available nahi.</div>`}</div></div>`
}

function requestRow(r: PromotionRequestRow): string {
  const s = STATUS_UI[r.status] || STATUS_UI.pending
  const label = r.business?.name || PLACEMENT_LABEL[r.placement]
  return `<tr>
    <td><div class="cc-nm">${escHtml(PLACEMENT_LABEL[r.placement])}</div><div class="cc-ev">${escHtml(label)}</div></td>
    <td class="td-mut">${r.windowDays} din</td>
    <td class="td-date">${r.startsAt ? `${fmtDate(r.startsAt)} → ${fmtDate(r.endsAt)}` : fmtDate(r.createdAt)}</td>
    <td><span class="st ${s.tone}"><i></i> ${escHtml(s.label)}</span>${r.rejectionReason ? `<div class="cc-ev" style="color:var(--bad)">${escHtml(r.rejectionReason)}</div>` : ""}</td>
    <td class="r td-amt tnum">${r.priceQuoted != null ? `<span class="rs">Rs</span> ${pkNum(money(r.priceQuoted))}` : "—"}</td>
  </tr>`
}

function buildContent(requests: PromotionRequestRow[], pricing: PricingPlacement[]): string {
  const hero = `<div class="card promo-hero"><span class="ph-ic">${svg(IC.rocket, 1.8)}</span><div><div class="ph-t">Apni listing ko boost karein</div><div class="ph-s">Homepage, search aur category pages par upar aayein — is mahine 3× zyada log dekhte hain. Koi chhupi fees nahi.</div></div></div>`
  const active = requests.filter((r) => r.status === "approved").length
  const plCards = pricing.length ? `<div class="sec-h">Placement chunein</div><div class="pl-grid">${pricing.map(placementCard).join("")}</div>` : ""
  const reqTable = requests.length ? `<div class="sec-h">Aapki boost requests${active ? ` · <b style="color:var(--ok)">${active} chal rahi</b>` : ""}</div>
    <div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Placement</th><th>Muddat</th><th>Kab</th><th>Status</th><th class="r">Qeemat</th></tr></thead>
    <tbody>${requests.map(requestRow).join("")}</tbody></table></div><div class="tbl-foot"><span>${requests.length} requests</span></div></div>`
    : `<div class="card"><div class="empty">Abhi koi boost request nahi. Upar se placement chunein.</div></div>`
  return `
  <div class="head"><div><h1>Promote</h1><div class="sub">Apni listing ko upar laayein — zyada log, zyada bookings.</div></div></div>
  ${hero}${plCards}${reqTable}
  <div class="foot">WeddingWala vendor console · Promote</div>`
}

export function PromoteArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/promote", crumbBold: "Grow", crumbSub: "Promote", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const { business } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizId = activeBusinessId ?? (business as { id?: number } | null)?.id ?? null
  const bizRef = React.useRef(bizId); bizRef.current = bizId
  const { data, isError } = useQuery({ queryKey: ["promote-art"], queryFn: () => PromotionsAPI.listMine() })
  const requests = React.useMemo(() => (data?.requests ?? []) as PromotionRequestRow[], [data])
  const pricing = React.useMemo(() => (data?.pricing ?? []) as PricingPlacement[], [data])

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Promote</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Promote load ho raha hai…</div>`; return }
    wwc.innerHTML = buildContent(requests, pricing)
    initTablePager(s, { pageSize: 25 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["promote-art"] }); return }
      const b = t.closest("[data-boost]") as HTMLElement | null
      if (!b?.dataset.boost) return
      const bId = Number(bizRef.current); if (!bId) { toast.error("Pehle business select karein"); return }
      const placement = b.dataset.boost as PromotionPlacement
      const windowDays = Number(b.dataset.days)
      b.setAttribute("disabled", "true")
      try {
        await PromotionsAPI.create({ businessId: bId, placement, windowDays })
        toast.success("Boost request bhej di — team review karegi")
        qc.invalidateQueries({ queryKey: ["promote-art"] })
      } catch (err: unknown) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Request nahi gayi — dobara koshish karein")
        b.removeAttribute("disabled")
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default PromoteArtifact
