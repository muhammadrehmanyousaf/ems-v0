"use client"

/**
 * Collaborations — premium rebuild on the shared champagne shell.
 * Real vendor↔vendor invites via CollaborationsAPI.incoming / outgoing with
 * accept / decline / cancel / resend. Sending a new invite (directory picker)
 * stays in the dedicated flow.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CollaborationsAPI, type CollabInvite, type CollabStatus } from "@/lib/api/collaborations"
import { useArtifactShell, escHtml, initialsOf, pkNum, initTablePager, loadPref, savePref, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const STATUS_UI: Record<CollabStatus, { label: string; tone: string }> = {
  pending: { label: "Intezar mein", tone: "warn" }, accepted: { label: "Judi hui", tone: "ok" }, declined: { label: "Mana", tone: "bad" }, cancelled: { label: "Cancel", tone: "mut" },
}
const su = (s: CollabStatus) => STATUS_UI[s] || STATUS_UI.pending
function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', resend: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>', out: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>', link: '<path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8"/>',
}

const EXTRA_CSS = String.raw`
.col-tiles{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:14px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:14px 15px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:20px; font-weight:680; letter-spacing:-.02em; margin-top:8px; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.col-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:14px; }
.colcard{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); padding:15px 16px; display:flex; flex-direction:column; gap:12px; }
.col-top{ display:flex; align-items:center; gap:11px; }
.col-nm{ font-weight:600; font-size:13.5px; } .col-sub{ font-size:11.5px; color:var(--ink-3); margin-top:1px; }
.col-meta{ font-size:11.5px; color:var(--ink-3); }
.col-acts{ display:flex; gap:8px; }
.mini{ height:32px; padding:0 12px; border-radius:8px; font-size:12.5px; font-weight:600; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:inline-flex; align-items:center; gap:6px; } .mini:hover{ background:var(--surface-3); color:var(--ink); } .mini svg{ width:14px; height:14px; }
.mini.ok{ background:var(--accent); color:var(--on-accent); border-color:transparent; } .mini.ok:hover{ filter:brightness(1.05); } .mini.bad:hover{ color:var(--bad); border-color:var(--bad); }
.empty{ padding:44px 16px; text-align:center; color:var(--ink-3); font-size:13px; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:820px){ .col-tiles{ grid-template-columns:1fr; } }
`

function inviteCard(inv: CollabInvite, dir: "in" | "out"): string {
  const s = su(inv.status)
  const name = dir === "in"
    ? (inv.fromVendor?.fullName || inv.fromName || "Vendor")
    : (inv.toVendor?.fullName || inv.toNameSnapshot || "Vendor")
  const phone = dir === "in" ? (inv.fromVendor?.phoneNumber || "") : ""
  let acts = ""
  if (inv.status === "pending" && dir === "in") acts = `<button class="mini ok" data-accept="${inv.id}">${svg(IC.check)} Qubool karein</button><button class="mini bad" data-decline="${inv.id}">${svg(IC.x)} Mana karein</button>`
  else if (inv.status === "pending" && dir === "out") acts = `<button class="mini" data-resend="${inv.id}">${svg(IC.resend)} Dobara bhejein</button><button class="mini bad" data-cancel="${inv.id}">${svg(IC.x)} Cancel</button>`
  return `<div class="colcard">
    <div class="col-top"><span class="ava">${escHtml(initialsOf(name))}</span><div style="flex:1;min-width:0"><div class="col-nm">${escHtml(name)}</div><div class="col-sub">${dir === "in" ? "Aapko invite bheja" : "Aapne invite bheja"}${phone ? ` · ${escHtml(phone)}` : ""}</div></div><span class="st ${s.tone}"><i></i> ${escHtml(s.label)}</span></div>
    <div class="col-meta">${fmtDate(inv.createdAt)}${inv.eventLabel ? ` · ${escHtml(inv.eventLabel)}` : ""}${inv.agreedAmount != null && Number(inv.agreedAmount) > 0 ? ` · <b style="color:var(--accent-ink)">Rs ${pkNum(Number(inv.agreedAmount))}</b>` : ""}${inv.functionSheetId ? ` · function sheet #${inv.functionSheetId}` : ""}</div>
    ${inv.status === "declined" && (inv as { declineReason?: string | null }).declineReason ? `<div class="col-meta" style="color:var(--bad)">${escHtml((inv as { declineReason?: string }).declineReason as string)}</div>` : ""}
    ${acts ? `<div class="col-acts">${acts}</div>` : ""}</div>`
}

function buildContent(incoming: CollabInvite[], outgoing: CollabInvite[], tab: string): string {
  const pendingIn = incoming.filter((i) => i.status === "pending").length
  const accepted = [...incoming, ...outgoing].filter((i) => i.status === "accepted").length
  const tiles = `<div class="col-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.inbox, 1.8)} Aane wale invites</div><div class="t-val tnum">${pendingIn}</div><div class="t-sub">jawab ka intezar</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.out, 1.8)} Bheje hue</div><div class="t-val tnum">${outgoing.length}</div><div class="t-sub">aapke invites</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.link, 1.8)} Judi hui</div><div class="t-val tnum">${accepted}</div><div class="t-sub">active collaborations</div></div>
  </div>`
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">
    <button class="tab${tab === "in" ? " on" : ""}" data-f="in">Aane wale <span class="cnt">${incoming.length}</span></button>
    <button class="tab${tab === "out" ? " on" : ""}" data-f="out">Bheje hue <span class="cnt">${outgoing.length}</span></button>
  </div></div>`
  const rows = tab === "in" ? incoming : outgoing
  const grid = rows.length ? `<div class="col-grid" data-ww-list>${rows.map((i) => inviteCard(i, tab as "in" | "out")).join("")}</div>` : `<div class="card"><div class="empty">${tab === "in" ? "Abhi koi invite nahi aaya." : "Aapne abhi koi invite nahi bheja."}</div></div>`
  return `
  <div class="head"><div><h1>Collaborations</h1><div class="sub">Dusre vendors ke saath mil kar events karein — invites yahan.</div></div></div>
  ${tiles}${toolbar}${grid}
  <div class="foot">WeddingWala vendor console · Collaborations</div>`
}

export function CollaborationsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/collaborations", crumbBold: "Grow", crumbSub: "Collaborations", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const inQ = useQuery({ queryKey: ["collab-in"], queryFn: () => CollaborationsAPI.incoming() })
  const outQ = useQuery({ queryKey: ["collab-out"], queryFn: () => CollaborationsAPI.outgoing() })
  const incoming = React.useMemo(() => (inQ.data ?? []) as CollabInvite[], [inQ.data])
  const outgoing = React.useMemo(() => (outQ.data ?? []) as CollabInvite[], [outQ.data])
  const [tab, setTab] = React.useState(() => loadPref("tab:collaborations", "in"))
  const isError = inQ.isError || outQ.isError
  const ready2 = inQ.data !== undefined && outQ.data !== undefined

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Collaborations</h1></div></div>${errorBannerHtml()}`; return }
    if (!ready2) { wwc.innerHTML = `<div class="loadwrap">Collaborations load ho raha hai…</div>`; return }
    wwc.innerHTML = buildContent(incoming, outgoing, tab)
    initTablePager(s, { rows: ".col-grid > *", pageSize: 12, noun: "invites" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, inQ.data, outQ.data, isError, tab])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const refetch = () => { qc.invalidateQueries({ queryKey: ["collab-in"] }); qc.invalidateQueries({ queryKey: ["collab-out"] }) }
    const act = async (btn: HTMLButtonElement, fn: () => Promise<unknown>, ok: string) => {
      const prev = btn.innerHTML
      btn.disabled = true; btn.innerHTML = "…"
      try {
        await fn(); toast.success(ok); refetch()
        // success re-renders the grid via refetch — the button is replaced, no restore needed
      } catch (err: unknown) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Nahi hua — dobara koshish karein")
        btn.innerHTML = prev; btn.disabled = false
      }
    }
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { refetch(); return }
      const tab2 = t.closest(".tab") as HTMLElement | null
      if (tab2?.dataset.f) { savePref("tab:collaborations", tab2.dataset.f); setTab(tab2.dataset.f); return }
      const ac = t.closest("[data-accept]") as HTMLButtonElement | null
      if (ac?.dataset.accept) { act(ac, () => CollaborationsAPI.accept(Number(ac.dataset.accept)), "Collaboration qubool ho gayi"); return }
      const dc = t.closest("[data-decline]") as HTMLButtonElement | null
      if (dc?.dataset.decline) { act(dc, () => CollaborationsAPI.decline(Number(dc.dataset.decline)), "Invite mana kar diya"); return }
      const cn = t.closest("[data-cancel]") as HTMLButtonElement | null
      if (cn?.dataset.cancel) { act(cn, () => CollaborationsAPI.cancel(Number(cn.dataset.cancel)), "Invite cancel kar diya"); return }
      const rs = t.closest("[data-resend]") as HTMLButtonElement | null
      if (rs?.dataset.resend) { act(rs, () => CollaborationsAPI.resend(Number(rs.dataset.resend)), "Invite dobara bhej diya"); return }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default CollaborationsArtifact
