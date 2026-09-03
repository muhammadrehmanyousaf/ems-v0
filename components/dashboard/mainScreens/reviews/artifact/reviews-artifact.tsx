"use client"

/**
 * Reviews — premium rebuild on the shared champagne shell.
 * Real customer reviews via ReviewsAPI.getAll: rating summary + distribution,
 * a star-filter, review cards with the reviewer, text, business and date, and
 * delete. Pinning stays with the listing's showcase flow.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ReviewsAPI, type ApiReviewRow } from "@/lib/api/dashboard"
import { useArtifactShell, escHtml, initialsOf, initTablePager, errorBannerHtml, loadPref, savePref, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import { waDigits } from "@/components/dashboard/mainScreens/leads/artifact/leads-artifact"

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) }
const stars = (r: number) => { const f = Math.max(0, Math.min(5, Math.round(r))); return "★".repeat(f) + "☆".repeat(5 - f) }
const statusTone = (s?: string) => { const v = (s || "").toLowerCase(); if (v.includes("publish")) return "ok"; if (v.includes("reject")) return "bad"; return "warn" }
const statusLabel = (s?: string) => { const v = (s || "").toLowerCase(); if (v.includes("publish")) return "Shaya"; if (v.includes("reject")) return "Radd"; if (v.includes("pend")) return "Zer-e-ghaur"; return s || "—" }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20l1.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>',
  call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
}

const EXTRA_CSS = String.raw`
.rev-top{ display:grid; grid-template-columns:280px 1fr; gap:14px; margin-bottom:16px; align-items:stretch; }
.rev-score{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border:1px solid var(--accent-line); border-radius:var(--r); padding:20px 18px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
.rev-num{ font-size:44px; font-weight:700; letter-spacing:-.04em; line-height:.9; color:var(--accent-ink); }
.rev-stars{ color:var(--accent); font-size:18px; letter-spacing:2px; margin-top:8px; } .rev-cap{ font-size:12px; color:var(--ink-2); margin-top:8px; font-weight:500; }
.rev-dist{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:16px 18px; box-shadow:var(--shadow-xs); display:flex; flex-direction:column; justify-content:center; gap:9px; }
.dist-row{ display:grid; grid-template-columns:34px 1fr 34px; gap:10px; align-items:center; }
.dist-row .lbl{ font-size:12px; color:var(--ink-2); font-weight:600; } .dist-row .lbl .s{ color:var(--accent); }
.dist-track{ height:8px; border-radius:4px; background:var(--surface-3); overflow:hidden; } .dist-track span{ display:block; height:100%; border-radius:4px; background:var(--accent); }
.dist-row .cnt{ font-size:11.5px; color:var(--ink-3); font-variant-numeric:tabular-nums; text-align:right; }
.rev-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:14px; }
.revcard{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); padding:15px 16px; display:flex; flex-direction:column; gap:10px; }
.rc-top{ display:flex; align-items:center; gap:11px; } .rc-nm{ font-weight:600; font-size:13px; } .rc-sub{ font-size:11px; color:var(--ink-3); margin-top:1px; }
.rc-stars{ color:var(--accent); font-size:14px; letter-spacing:1px; margin-left:auto; }
.rc-text{ font-size:12.5px; color:var(--ink-2); line-height:1.55; }
.rc-foot{ display:flex; align-items:center; gap:8px; margin-top:2px; } .rc-foot .sp{ flex:1; }
.rc-bk{ font-size:11px; color:var(--ink-3); cursor:pointer; } .rc-bk:hover{ color:var(--accent-ink); text-decoration:underline; }
.rc-act{ width:28px; height:28px; border-radius:7px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-3); display:grid; place-items:center; text-decoration:none; } .rc-act:hover{ background:var(--surface-3); color:var(--ink); } .rc-act.wa:hover{ background:var(--ok-wash); color:var(--ok); border-color:transparent; } .rc-act svg{ width:14px; height:14px; }
.del{ width:28px; height:28px; border-radius:7px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-3); display:grid; place-items:center; } .del:hover{ background:var(--bad-wash); color:var(--bad); border-color:transparent; } .del svg{ width:14px; height:14px; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:820px){ .rev-top{ grid-template-columns:1fr; } }
`

function buildContent(list: ApiReviewRow[], filter: string): string {
  const rated = list.filter((r) => num(r.rating) > 0)
  const avg = rated.length ? rated.reduce((a, r) => a + num(r.rating), 0) / rated.length : 0
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: list.filter((r) => Math.round(num(r.rating)) === n).length }))
  const maxD = Math.max(1, ...dist.map((d) => d.c))

  const score = `<div class="rev-score"><div class="rev-num">${avg.toFixed(1)}</div><div class="rev-stars">${stars(avg)}</div><div class="rev-cap">${list.length} reviews</div></div>`
  const distHtml = `<div class="rev-dist">${dist.map((d) => `<div class="dist-row"><span class="lbl">${d.n}<span class="s">★</span></span><span class="dist-track"><span style="width:${Math.round((d.c / maxD) * 100)}%"></span></span><span class="cnt">${d.c}</span></div>`).join("")}</div>`

  const cnt = (n: number) => list.filter((r) => Math.round(num(r.rating)) === n).length
  const tab = (f: string, label: string, c: number) => `<button class="tab${f === filter ? " on" : ""}" data-f="${f}">${label} <span class="cnt">${c}</span></button>`
  const lowCnt = list.filter((r) => Math.round(num(r.rating)) <= 2 && num(r.rating) > 0).length
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">${tab("all", "Sab", list.length)}${tab("5", "5★", cnt(5))}${tab("4", "4★", cnt(4))}${tab("3", "3★", cnt(3))}${tab("low", "≤2★", lowCnt)}</div></div>`

  const rows = list.filter((r) => { if (filter === "all") return true; if (filter === "low") return Math.round(num(r.rating)) <= 2 && num(r.rating) > 0; return Math.round(num(r.rating)) === Number(filter) })
  const grid = rows.length ? `<div class="rev-grid" data-ww-list>${rows.map((r) => {
    const bkLink = r.bookingId ? `<span class="rc-bk" data-nav-btn="/dashboard/bookings/${escHtml(r.bookingId)}">Booking #${escHtml(r.bookingId)}</span>` : ""
    const waPh = waDigits(r.phone)
    const waText = encodeURIComponent(`Assalam o Alaikum ${r.reviewerName || "ji"}, aap ke review ke liye shukriya. Agar koi kami reh gayi ho to bara-e-meherbani batayein — hum ise theek karna chahte hain. Shukriya.`)
    const contactActs = r.phone ? `<a class="rc-act wa" href="https://wa.me/${waPh}?text=${waText}" target="_blank" rel="noopener" data-stop title="Review resolve karein" aria-label="WhatsApp">${svg(IC.wa, 1.9)}</a><a class="rc-act" href="tel:${escHtml(r.phone)}" data-stop title="Call karein" aria-label="Call">${svg(IC.call, 1.9)}</a>` : ""
    return `<div class="revcard">
    <div class="rc-top"><span class="ava">${escHtml(initialsOf(r.reviewerName))}</span><div><div class="rc-nm">${escHtml(r.reviewerName || "Customer")}</div><div class="rc-sub">${escHtml(r.businessName || "")} · ${fmtDate(r.createdAt)}</div></div><span class="rc-stars">${stars(num(r.rating))}</span></div>
    ${r.reviewText ? `<div class="rc-text">"${escHtml(r.reviewText)}"</div>` : `<div class="rc-text" style="color:var(--ink-4)">Koi tabsara nahi — sirf rating.</div>`}
    <div class="rc-foot"><span class="st ${statusTone(r.status)}"><i></i> ${escHtml(statusLabel(r.status))}</span><span class="sp"></span>${bkLink}${contactActs}<button class="del" data-del="${escHtml(r.id)}" title="Delete">${svg(IC.trash)}</button></div>
  </div>`
  }).join("")}</div>` : `<div class="card"><div class="empty">Is rating mein koi review nahi.</div></div>`

  return `
  <div class="head"><div><h1>Reviews</h1><div class="sub">Customers ne kya kaha — <b>${avg.toFixed(1)}★</b> se <b>${list.length}</b> reviews.</div></div></div>
  <div class="rev-top">${score}${distHtml}</div>
  ${toolbar}${grid}
  <div class="foot">WeddingWala vendor console · Reviews</div>`
}

export function ReviewsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/reviews", crumbBold: "Grow", crumbSub: "Reviews", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const { data, isError } = useQuery({ queryKey: ["reviews-art"], queryFn: () => ReviewsAPI.getAll(1, 100) })
  const list = React.useMemo(() => (data?.reviews ?? []) as ApiReviewRow[], [data])
  const [filter, setFilter] = React.useState(() => loadPref("tab:reviews", "all"))

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Reviews</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Reviews load ho rahe hain…</div>`; return }
    wwc.innerHTML = buildContent(list, filter)
    initTablePager(s, { rows: ".revcard", pageSize: 10, noun: "reviews" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, filter, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["reviews-art"] }); return }
      const tab = t.closest(".tab") as HTMLElement | null
      if (tab?.dataset.f) { savePref("tab:reviews", tab.dataset.f); setFilter(tab.dataset.f); return }
      const del = t.closest("[data-del]") as HTMLElement | null
      if (del?.dataset.del) { const rid = del.dataset.del; openConfirm(s, { title: "Review delete karein?", message: "Ye review hat jayega — wapas nahi aayega.", danger: true, onConfirm: async () => { try { await ReviewsAPI.delete(rid); toast.success("Review hata diya"); qc.invalidateQueries({ queryKey: ["reviews-art"] }) } catch { toast.error("Delete nahi hua") } } }); return }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default ReviewsArtifact
