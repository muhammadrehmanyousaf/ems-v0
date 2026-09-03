"use client"

/**
 * Notifications — premium rebuild on the shared champagne shell.
 * Real feed via NotificationAPI.getNotifications with mark-as-read, mark-all,
 * and delete. Unread filter, type icons, relative times.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { NotificationAPI, type Notification } from "@/lib/api/notifications"
import { useArtifactShell, escHtml, initTablePager, errorBannerHtml, loadPref, savePref, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

function timeAgo(s?: string | null) {
  if (!s) return ""
  const d = new Date(s).getTime(); if (isNaN(d)) return ""
  const sec = Math.floor((Date.now() - d) / 1000)
  if (sec < 60) return "abhi"
  const m = Math.floor(sec / 60); if (m < 60) return `${m} min pehle`
  const h = Math.floor(m / 60); if (h < 24) return `${h} ghante pehle`
  const dd = Math.floor(h / 24); if (dd < 30) return `${dd} din pehle`
  return new Date(s).toLocaleDateString("en-PK", { day: "numeric", month: "short" })
}
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  book: '<path d="M4 4h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 2v4M16 2v4M4 10h16"/>', money: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>', users: '<path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>', star: '<path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"/>', chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>', check: '<path d="M20 6 9 17l-5-5"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', checkAll: '<path d="M1 12l5 5L17 6M8 12l4 4"/>',
}
function iconFor(type: string): { icon: string; color: string } {
  const t = (type || "").toLowerCase()
  if (t.includes("book")) return { icon: IC.book, color: "var(--accent-ink)" }
  if (t.includes("pay") || t.includes("receipt") || t.includes("money") || t.includes("refund")) return { icon: IC.money, color: "var(--ok)" }
  if (t.includes("lead") || t.includes("enquir")) return { icon: IC.users, color: "var(--info)" }
  if (t.includes("review") || t.includes("rating")) return { icon: IC.star, color: "var(--warn)" }
  if (t.includes("chat") || t.includes("message")) return { icon: IC.chat, color: "var(--info)" }
  return { icon: IC.bell, color: "var(--ink-3)" }
}

const EXTRA_CSS = String.raw`
.content{ max-width:820px; }
.nfeed{ display:flex; flex-direction:column; }
.nrow{ display:flex; gap:13px; padding:14px 16px; border-bottom:1px solid var(--border); position:relative; }
.nrow:last-child{ border-bottom:0; } .nrow.unread{ background:var(--accent-wash); }
.nrow.unread::before{ content:""; position:absolute; left:0; top:0; bottom:0; width:2.5px; background:var(--accent); }
.n-ic{ width:38px; height:38px; border-radius:10px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; flex:none; } .n-ic svg{ width:18px; height:18px; }
.n-main{ flex:1; min-width:0; } .n-t{ font-weight:600; font-size:13px; } .n-t .dot{ display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--accent); margin-left:6px; vertical-align:middle; }
.n-m{ font-size:12.5px; color:var(--ink-2); margin-top:2px; line-height:1.5; } .n-time{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.n-acts{ display:flex; flex-direction:column; gap:6px; align-items:flex-end; flex:none; }
.iconbtn{ width:28px; height:28px; border-radius:7px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-3); display:grid; place-items:center; } .iconbtn:hover{ background:var(--surface-3); color:var(--ink); } .iconbtn.ok:hover{ color:var(--ok); border-color:var(--ok); } .iconbtn.bad:hover{ color:var(--bad); border-color:var(--bad); } .iconbtn svg{ width:14px; height:14px; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
`

function buildContent(list: Notification[], filter: string): string {
  const unread = list.filter((n) => !n.isRead).length
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">
    <button class="tab${filter === "all" ? " on" : ""}" data-f="all">Sab <span class="cnt">${list.length}</span></button>
    <button class="tab${filter === "unread" ? " on" : ""}" data-f="unread">Anpadhe <span class="cnt">${unread}</span></button>
    </div><div class="filters">${unread > 0 ? `<button class="btn btn-ghost" id="markall">${svg(IC.checkAll)} Sab read karein</button>` : ""}</div></div>`
  const rows = list.filter((n) => filter === "all" || !n.isRead)
  const navFor = (n: Notification): string => {
    const d = (n.data || {}) as Record<string, unknown>
    if (d.bookingId) return `/dashboard/bookings/${d.bookingId}`
    if (d.leadId) return `/dashboard/leads/${d.leadId}`
    if (typeof d.link === "string" && d.link.startsWith("/")) return d.link
    const ty = (n.type || "").toLowerCase()
    if (ty.includes("chat") || ty.includes("message")) return "/dashboard/chat"
    if (ty.includes("booking") || ty.includes("payment") || ty.includes("receipt")) return "/dashboard/bookings"
    if (ty.includes("lead") || ty.includes("quote") || ty.includes("inquiry")) return "/dashboard/leads"
    if (ty.includes("review")) return "/dashboard/reviews"
    return ""
  }
  const feed = rows.length ? `<div class="card"><div class="nfeed" data-ww-list>${rows.map((n) => {
    const ic = iconFor(n.type)
    const href = navFor(n)
    return `<div class="nrow${!n.isRead ? " unread" : ""}">
      <span class="n-ic" style="color:${ic.color}">${svg(ic.icon, 1.8)}</span>
      <div class="n-main"${href ? ` data-nav-btn="${href}" style="cursor:pointer"` : ""}><div class="n-t">${escHtml(n.title)}${!n.isRead ? `<span class="dot"></span>` : ""}</div>${n.message ? `<div class="n-m">${escHtml(n.message)}</div>` : ""}<div class="n-time">${timeAgo(n.createdAt)}</div></div>
      <div class="n-acts">${!n.isRead ? `<button class="iconbtn ok" data-read="${n.id}" title="Mark read">${svg(IC.check)}</button>` : ""}<button class="iconbtn bad" data-del="${n.id}" title="Delete">${svg(IC.trash)}</button></div>
    </div>`
  }).join("")}</div></div>` : `<div class="card"><div class="empty">${filter === "unread" ? "Koi anpadhi notification nahi 🎉" : "Abhi koi notification nahi."}</div></div>`
  return `
  <div class="head"><div><h1>Notifications</h1><div class="sub">${unread > 0 ? `<b>${unread}</b> anpadhi` : "Sab padh li"} · ${list.length} total.</div></div></div>
  ${toolbar}${feed}
  <div class="foot">WeddingWala vendor console · Notifications</div>`
}

export function NotificationsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/notifications", crumbBold: "Ops", crumbSub: "Notifications", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const { data, isError } = useQuery({ queryKey: ["notifs-art"], queryFn: () => NotificationAPI.getNotifications(1, 50, false) })
  const list = React.useMemo(() => (data?.notifications ?? []) as Notification[], [data])
  const [filter, setFilter] = React.useState(() => loadPref("tab:notifications", "all"))

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Notifications</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Notifications load ho rahi hain…</div>`; return }
    wwc.innerHTML = buildContent(list, filter)
    initTablePager(s, { rows: ".nrow", pageSize: 20, noun: "ittilaat" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, filter, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const refetch = () => qc.invalidateQueries({ queryKey: ["notifs-art"] })
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["notifs-art"] }); return }
      const tab = t.closest(".tab") as HTMLElement | null
      if (tab?.dataset.f) { savePref("tab:notifications", tab.dataset.f); setFilter(tab.dataset.f); return }
      if (t.closest("#markall")) { try { await NotificationAPI.markAllAsRead(); toast.success("Sab read ho gayi"); refetch() } catch { toast.error("Nahi hua") } return }
      const rd = t.closest("[data-read]") as HTMLElement | null
      if (rd?.dataset.read) { try { await NotificationAPI.markAsRead(Number(rd.dataset.read)); refetch() } catch { toast.error("Nahi hua") } return }
      const del = t.closest("[data-del]") as HTMLElement | null
      if (del?.dataset.del) { const id = Number(del.dataset.del); openConfirm(s, { title: "Notification delete karein?", message: "Ye notification hat jayega.", danger: true, onConfirm: async () => { try { await NotificationAPI.deleteNotification(id); toast.success("Hata diya"); refetch() } catch { toast.error("Delete nahi hua") } } }); return }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default NotificationsArtifact
