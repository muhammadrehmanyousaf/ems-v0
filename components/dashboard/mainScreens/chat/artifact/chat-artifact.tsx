"use client"

/**
 * Chat — pixel-faithful to the design sample (docs/design-samples/chat.html):
 * WhatsApp-style 3-pane inbox (conversation list + thread + context rail) on the
 * shared artifact shell. Wired to the REAL chat backend through useChat()
 * (ChatProvider is mounted at app/layout.tsx): live conversations, messages,
 * typing indicators, online presence, and real send via socket + ChatAPI.
 *
 * The 3-pane skeleton is built once; only the dynamic sub-regions (#clistBody,
 * #thHead, #thBody, #cinfo, #quick) are re-rendered on data change, so the
 * composer input keeps focus and never loses what you're typing mid-message.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { openRecordPaymentDrawer } from "@/components/dashboard/mainScreens/artifact/record-payment"
import { useChat } from "@/context/ChatContext"
import { useUser } from "@/context/UserContext"
import { useBusiness } from "@/context/BusinessContext"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import type { ConversationItem, ChatMessageItem } from "@/lib/api/chat"
import { BookingAPI } from "@/lib/api/bookings"
import { LeadAPI } from "@/lib/api/leads"
import { waDigits } from "@/components/dashboard/mainScreens/leads/artifact/leads-artifact"
import { openBookingForm } from "@/components/dashboard/mainScreens/artifact/booking-form"
import { useArtifactShell, escHtml, initialsOf } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

/* ── time / date helpers ─────────────────────────────────────── */
function hhmm(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso); if (isNaN(d.getTime())) return ""
  return d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: false })
}
const DAY = 86400000
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime() }
function convTime(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso); if (isNaN(d.getTime())) return ""
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / DAY)
  if (days <= 0) return hhmm(iso)
  if (days === 1) return "Kal"
  if (days < 7) return d.toLocaleDateString("en-PK", { weekday: "short" })
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" })
}
function dayLabel(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso); if (isNaN(d.getTime())) return ""
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / DAY)
  if (days <= 0) return "Aaj"
  if (days === 1) return "Kal"
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "long" })
}

/* ── icons (inline, CSP-safe) ────────────────────────────────── */
const IC: Record<string, string> = {
  call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20l1.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  book: '<path d="M4 4h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 2v4M16 2v4M4 10h16"/>',
  money: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  quote: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  dl: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  tick2: '<path d="M1 8l4 4 6-8M8 12l3 2 6-8"/>',
}
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`

const kindOf = (c: ConversationItem) => (c.bookingId ? "book" : "lead")
const srcOf = (c: ConversationItem) => (c.bookingId ? "rf" : "web")

/* ── chat-specific CSS (generic names — isolated by the shadow root) ── */
const EXTRA_CSS = String.raw`
:host{ overflow:hidden; }
.main{ height:100vh; overflow:hidden; }
.content{ padding:0; max-width:none; margin:0; flex:1; min-height:0; display:flex; }
#wwc{ flex:1; display:flex; min-height:0; }

.chat{ flex:1; display:flex; min-height:0; }
.avatar{ position:relative; flex:none; border-radius:50%; display:grid; place-items:center; font-weight:600; background:var(--surface-3); border:1px solid var(--border-2); color:var(--ink-2); font-size:12px; }
.avatar .src{ position:absolute; right:-1px; bottom:-1px; width:11px; height:11px; border-radius:50%; border:2px solid var(--surface); }
.src.wa{ background:var(--ok); } .src.ig{ background:#B5657A; } .src.rf{ background:var(--accent); } .src.web{ background:var(--info); }

/* conversation list */
.clist{ width:326px; flex:none; border-right:1px solid var(--border); display:flex; flex-direction:column; background:var(--surface); min-height:0; }
.clist-head{ padding:15px 16px 12px; border-bottom:1px solid var(--border); }
.clist-head .ct-row{ display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.clist-head h2{ font-size:17px; font-weight:600; letter-spacing:-.02em; }
.newchat{ width:32px; height:32px; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; }
.newchat:hover{ background:var(--surface-3); color:var(--ink); } .newchat svg{ width:16px; height:16px; }
.csearch{ display:flex; align-items:center; gap:8px; height:36px; padding:0 11px; border:1px solid var(--border); border-radius:9px; background:var(--surface-2); color:var(--ink-3); }
.csearch input{ border:0; background:transparent; color:var(--ink); width:100%; outline:none; font-size:12.5px; }
.csearch input::placeholder{ color:var(--ink-3); } .csearch svg{ width:15px; height:15px; }
.ctabs{ display:flex; gap:2px; padding:9px 12px; border-bottom:1px solid var(--border); }
.ctab{ height:28px; padding:0 11px; border-radius:7px; border:0; background:transparent; color:var(--ink-2); font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:6px; }
.ctab:hover{ background:var(--surface-3); color:var(--ink); } .ctab.on{ background:var(--surface-3); color:var(--ink); }
.ctab .cc{ font-size:10.5px; color:var(--ink-3); font-variant-numeric:tabular-nums; } .ctab.on .cc{ color:var(--accent-ink); }
.clist-body{ flex:1; overflow-y:auto; }
.conv{ display:flex; gap:11px; padding:12px 14px; cursor:pointer; position:relative; border-bottom:1px solid var(--border); transition:background .1s; }
.conv:hover{ background:var(--surface-2); } .conv.active{ background:var(--surface-3); }
.conv.active::before{ content:""; position:absolute; left:0; top:0; bottom:0; width:2.5px; background:var(--accent); }
.conv .avatar{ width:44px; height:44px; font-size:13px; }
.cv-main{ flex:1; min-width:0; }
.cv-top{ display:flex; align-items:center; gap:8px; }
.cv-nm{ font-weight:600; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; }
.cv-time{ font-size:10.5px; color:var(--ink-3); flex:none; font-variant-numeric:tabular-nums; }
.cv-time.acc{ color:var(--accent-ink); font-weight:600; }
.cv-bot{ display:flex; align-items:center; gap:8px; margin-top:3px; }
.cv-prev{ font-size:12px; color:var(--ink-3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; display:flex; align-items:center; gap:4px; }
.cv-prev svg{ width:13px; height:13px; flex:none; color:var(--accent-ink); }
.cv-prev.typing{ color:var(--ok); font-weight:600; font-style:italic; }
.cv-badge{ flex:none; min-width:19px; height:19px; padding:0 6px; border-radius:20px; background:var(--accent); color:var(--on-accent); font-size:10.5px; font-weight:700; display:grid; place-items:center; font-variant-numeric:tabular-nums; }
.cv-ctx{ display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:600; padding:1px 6px; border-radius:5px; margin-top:6px; white-space:nowrap; }
.cv-ctx svg{ width:11px; height:11px; }
.cv-ctx.book{ color:var(--accent-ink); background:var(--accent-wash); } .cv-ctx.lead{ color:var(--info); background:var(--info-wash); }
.clist-empty{ padding:40px 18px; text-align:center; color:var(--ink-3); font-size:12.5px; }

/* thread */
.thread{ flex:1; display:flex; flex-direction:column; min-width:0; min-height:0; background:var(--bg); }
.th-head{ display:flex; align-items:center; gap:12px; padding:10px 18px; border-bottom:1px solid var(--border); background:var(--surface); flex:none; min-height:61px; }
.th-head .avatar{ width:40px; height:40px; font-size:12px; }
.th-id{ min-width:0; } .th-nm{ font-weight:600; font-size:14px; display:flex; align-items:center; gap:8px; }
.th-pres{ font-size:11.5px; color:var(--ok); font-weight:500; margin-top:1px; display:flex; align-items:center; gap:5px; }
.th-pres.off{ color:var(--ink-3); } .th-pres i{ width:6px; height:6px; border-radius:50%; background:var(--ok); }
.th-actions{ margin-left:auto; display:flex; gap:6px; }
.thbtn{ width:36px; height:36px; border-radius:9px; border:1px solid var(--border); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; }
.thbtn:hover{ background:var(--surface-3); color:var(--ink); } .thbtn svg{ width:17px; height:17px; }
.th-body{ flex:1; overflow-y:auto; padding:20px 22px; display:flex; flex-direction:column; gap:3px; }
.daysep{ align-self:center; font-size:11px; font-weight:600; color:var(--ink-3); background:var(--surface-3); border:1px solid var(--border); border-radius:20px; padding:3px 12px; margin:10px 0; }
.sysmsg{ align-self:center; font-size:11.5px; color:var(--ink-3); text-align:center; max-width:80%; margin:6px 0; }
.msg{ max-width:66%; padding:8px 12px 6px; border-radius:13px; font-size:13px; line-height:1.45; position:relative; box-shadow:var(--shadow-xs); margin-top:2px; word-wrap:break-word; overflow-wrap:anywhere; }
.msg .mt{ font-size:10px; color:var(--ink-3); float:right; margin:4px 0 0 12px; display:inline-flex; align-items:center; gap:3px; font-variant-numeric:tabular-nums; }
.msg.in{ align-self:flex-start; background:var(--surface); border:1px solid var(--border); border-top-left-radius:4px; }
.msg.out{ align-self:flex-end; background:var(--accent-wash); border:1px solid var(--accent-line); border-top-right-radius:4px; color:var(--ink); }
.msg.first-in{ margin-top:10px; } .msg.first-out{ margin-top:10px; }
.tick{ color:var(--ink-4); } .tick.read{ color:var(--accent-ink); } .tick svg{ width:15px; height:12px; }
.msg-doc{ display:flex; align-items:center; gap:10px; padding:4px 2px 2px; } .msg-doc[data-dl]{ cursor:pointer; }
.msg-doc .di{ width:34px; height:34px; border-radius:8px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .msg-doc .di svg{ width:17px; height:17px; }
.msg-doc .dn{ font-weight:600; font-size:12.5px; } .msg-doc .ds{ font-size:11px; color:var(--ink-3); }
.msg-img{ display:block; cursor:pointer; margin:2px 0 2px; } .msg-img img{ max-width:240px; max-height:260px; width:auto; border-radius:10px; display:block; border:1px solid var(--border); }
.msg-cap{ margin-top:6px; font-size:13px; line-height:1.45; }
.typing-b{ align-self:flex-start; background:var(--surface); border:1px solid var(--border); border-radius:13px; border-top-left-radius:4px; padding:11px 14px; display:flex; gap:4px; margin-top:10px; }
.typing-b i{ width:6px; height:6px; border-radius:50%; background:var(--ink-4); animation:tp 1.2s infinite; }
.typing-b i:nth-child(2){ animation-delay:.2s } .typing-b i:nth-child(3){ animation-delay:.4s }
@keyframes tp{ 0%,60%,100%{ transform:translateY(0); opacity:.4 } 30%{ transform:translateY(-4px); opacity:1 } }
.th-empty{ flex:1; display:grid; place-items:center; color:var(--ink-3); font-size:13px; padding:20px; text-align:center; }

/* composer */
.composer{ flex:none; border-top:1px solid var(--border); background:var(--surface); padding:11px 16px 13px; }
.quick{ display:flex; gap:7px; margin-bottom:10px; flex-wrap:wrap; }
.qchip{ font-size:12px; font-weight:600; color:var(--ink-2); background:var(--surface-2); border:1px solid var(--border); border-radius:20px; padding:5px 12px; }
.qchip:hover{ background:var(--surface-3); color:var(--ink); border-color:var(--border-2); }
.cbar{ display:flex; align-items:flex-end; gap:9px; }
.cbtn{ width:38px; height:38px; border-radius:10px; border:1px solid var(--border); background:var(--surface); color:var(--ink-3); display:grid; place-items:center; flex:none; }
.cbtn:hover{ background:var(--surface-3); color:var(--ink); } .cbtn svg{ width:18px; height:18px; }
.cinput{ flex:1; display:flex; align-items:center; min-height:38px; padding:8px 14px; border:1px solid var(--border); border-radius:12px; background:var(--surface-2); }
.cinput input{ border:0; background:transparent; color:var(--ink); width:100%; outline:none; font-size:13px; } .cinput input::placeholder{ color:var(--ink-3); }
.csend{ width:38px; height:38px; border-radius:10px; border:0; background:var(--accent); color:var(--on-accent); display:grid; place-items:center; flex:none; box-shadow:var(--shadow-xs); }
.csend:hover{ filter:brightness(1.05); } .csend:disabled{ opacity:.5; cursor:default; } .csend svg{ width:18px; height:18px; }

/* context rail */
.cinfo{ width:296px; flex:none; border-left:1px solid var(--border); background:var(--surface); overflow-y:auto; }
.ci-hero{ padding:22px 18px 18px; text-align:center; border-bottom:1px solid var(--border); }
.ci-hero .avatar{ width:66px; height:66px; font-size:20px; margin:0 auto 12px; }
.ci-nm{ font-size:15px; font-weight:600; } .ci-sub{ font-size:12px; color:var(--ink-3); margin-top:3px; word-break:break-word; }
.ci-quick{ display:flex; justify-content:center; gap:8px; margin-top:14px; }
.ci-q{ width:38px; height:38px; border-radius:10px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; }
.ci-q:hover{ background:var(--surface-3); color:var(--ink); } .ci-q.wa:hover{ color:var(--ok); border-color:var(--ok); } .ci-q svg{ width:17px; height:17px; }
.ci-sec{ padding:15px 18px; border-bottom:1px solid var(--border); }
.ci-sec h4{ font-size:11px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; color:var(--ink-3); margin-bottom:11px; }
.ci-ctxcard{ border:1px solid var(--border); border-radius:10px; padding:12px; background:var(--surface-2); }
.ci-ctxcard .cc-t{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
.ci-ctxcard .cc-nm{ font-weight:600; font-size:13px; }
.ci-ctxcard .cc-meta{ font-size:11.5px; color:var(--ink-3); margin-top:5px; display:flex; flex-direction:column; gap:3px; }
.ci-ctxcard .cc-meta b{ color:var(--ink-2); font-weight:600; }
.act{ display:flex; flex-direction:column; gap:8px; }
.act .btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; height:38px; border-radius:9px; font-weight:600; font-size:12.5px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink); }
.act .btn:hover{ background:var(--surface-3); } .act .btn svg{ width:15px; height:15px; color:var(--ink-3); }
.act .btn.primary{ background:var(--accent); color:var(--on-accent); border-color:transparent; box-shadow:var(--shadow-xs); }
.act .btn.primary:hover{ filter:brightness(1.05); } .act .btn.primary svg{ color:var(--on-accent); }
.docrow{ display:flex; align-items:center; gap:10px; padding:8px 0; }
.docrow .di{ width:32px; height:32px; border-radius:8px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .docrow .di svg{ width:15px; height:15px; }
.docrow .dn{ font-weight:600; font-size:12.5px; } .docrow .ds{ font-size:11px; color:var(--ink-3); }
.docrow .dl-dl{ margin-left:auto; color:var(--ink-3); border:0; background:transparent; } .docrow .dl-dl:hover{ color:var(--accent-ink); }
.ci-empty{ padding:14px 18px; color:var(--ink-3); font-size:12px; }

@media (max-width:1180px){ .cinfo{ display:none; } }
@media (max-width:820px){ .chat{ flex-direction:column; } .clist{ width:100%; flex:none; max-height:42vh; border-right:0; border-bottom:1px solid var(--border); } .thread{ min-height:58vh; } }
`

/* ── skeleton (built once) ───────────────────────────────────── */
const SKELETON = `
<div class="chat">
  <div class="clist">
    <div class="clist-head">
      <div class="ct-row"><h2>Inbox</h2><button class="newchat" data-nav-btn="/dashboard/leads" title="Nayi puchh-gichh — leads" aria-label="Nayi chat">${svg('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>')}</button></div>
      <label class="csearch">${svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>')}<input id="csearch" placeholder="Naam dhoondein…" aria-label="Search chats"/></label>
    </div>
    <div class="ctabs" id="ctabs">
      <button class="ctab on" data-f="all">Sab <span class="cc" data-c="all">0</span></button>
      <button class="ctab" data-f="unread">Anpadhe <span class="cc" data-c="unread">0</span></button>
      <button class="ctab" data-f="lead">Leads <span class="cc" data-c="lead">0</span></button>
      <button class="ctab" data-f="book">Bookings <span class="cc" data-c="book">0</span></button>
    </div>
    <div class="clist-body" id="clistBody"></div>
  </div>
  <div class="thread">
    <div class="th-head" id="thHead"></div>
    <div class="th-body" id="thBody"></div>
    <div class="composer">
      <div class="quick" id="quick"></div>
      <div class="cbar">
        <div class="cinput"><input id="cmsg" placeholder="Message likhein…" aria-label="Message"/></div>
        <button class="cbtn" id="ctemplate" title="Ready reply daalein" aria-label="Template">${svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>')}</button>
        <button class="csend" id="csend" aria-label="Send">${svg('<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>')}</button>
      </div>
    </div>
  </div>
  <aside class="cinfo" id="cinfo"></aside>
</div>`

const QUICK_BOOK = ["Baqaya event se pehle clear kar dijiyega", "Sab tayari mukammal hai ✅", "Shukriya 🙏"]
const QUICK_LEAD = ["Rates PDF bhej deta hun", "Visit kab rakhein?", "Available dates bhej deta hun"]

export function ChatArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/chat", crumbBold: "Chat", crumbSub: "Puchh-gichh aur customers", extraCss: EXTRA_CSS,
  })
  const { user } = useUser()
  const myId = Number(user?.id)
  const { businesses } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizList = React.useMemo(() => ((businesses ?? []) as { id: number; name?: string | null }[]).map((b) => ({ id: b.id, name: b.name })), [businesses])
  const bizListRef = React.useRef(bizList); bizListRef.current = bizList
  const activeBizRef = React.useRef(activeBusinessId); activeBizRef.current = activeBusinessId
  const {
    conversations, activeConversationId, messages, typingUsers, onlineStatuses,
    setActiveConversation, sendMessage, isLoadingConversations,
  } = useChat()

  const [filter, setFilter] = React.useState<"all" | "unread" | "lead" | "book">("all")
  const [search, setSearch] = React.useState("")

  const qc = useQueryClient()
  // real phone for the active contact → tel:/wa.me. Uses only vendor-authorized
  // sources: their own booking's customerPhone, or their own matching lead.
  const activeConvForPhone = conversations.find((c) => c.id === activeConversationId)
  const contactQ = useQuery({
    queryKey: ["chat-phone", activeConversationId, activeConvForPhone?.bookingId, activeConvForPhone?.otherUser?.id],
    enabled: !!activeConvForPhone,
    queryFn: async (): Promise<{ phone: string; leadId: number | null }> => {
      const c = activeConvForPhone; if (!c) return { phone: "", leadId: null }
      if (c.bookingId) { const r = await BookingAPI.getWithAvailability(c.bookingId).catch(() => null); return { phone: r?.booking?.customerPhone || "", leadId: null } }
      // lead chat — match the vendor's own lead by linked user id, then email, then name
      const uid = c.otherUser?.id
      const email = (c.otherUser?.email || "").toLowerCase()
      const name = (c.otherUser?.fullName || "").trim().toLowerCase()
      const leads = await LeadAPI.list({}).then((r) => r.leads).catch(() => [])
      const lead = leads.find((l) => (uid && l.contactCustomerUserId === uid))
        || (email ? leads.find((l) => (l.contactEmail || "").toLowerCase() === email) : undefined)
        || (name ? leads.find((l) => (l.contactName || "").trim().toLowerCase() === name) : undefined)
      return { phone: lead?.contactPhone || lead?.contactWhatsapp || "", leadId: lead?.id ?? null }
    },
  })
  const contactPhone = contactQ.data?.phone || ""
  const leadId = contactQ.data?.leadId ?? null

  // latest values for the once-bound listeners
  const api = React.useRef({ setActiveConversation, sendMessage })
  api.current = { setActiveConversation, sendMessage }
  const built = React.useRef(false)
  const autoSel = React.useRef(false)

  // Auto-open the first conversation once the inbox loads.
  React.useEffect(() => {
    if (autoSel.current) return
    if (!activeConversationId && conversations.length) {
      autoSel.current = true
      setActiveConversation(conversations[0].id)
    }
  }, [conversations, activeConversationId, setActiveConversation])

  // Build the skeleton + bind listeners once.
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || built.current) return
    const wwc = s.getElementById("wwc")
    if (!wwc) return
    wwc.innerHTML = SKELETON
    built.current = true

    const doSend = () => {
      const inp = s.getElementById("cmsg") as HTMLInputElement | null
      if (!inp) return
      const txt = inp.value.trim()
      if (!txt) return
      api.current.sendMessage(txt)
      inp.value = ""
      const send = s.getElementById("csend") as HTMLButtonElement | null
      if (send) send.disabled = true
    }

    s.addEventListener("click", (e) => {
      const t = e.target as HTMLElement
      const conv = t.closest(".conv") as HTMLElement | null
      if (conv?.dataset.id) { api.current.setActiveConversation(Number(conv.dataset.id)); return }
      const tab = t.closest(".ctab") as HTMLElement | null
      if (tab?.dataset.f) { setFilter(tab.dataset.f as "all" | "unread" | "lead" | "book"); return }
      const q = t.closest(".qchip") as HTMLElement | null
      if (q) { const inp = s.getElementById("cmsg") as HTMLInputElement | null; if (inp) { inp.value = q.textContent || ""; inp.focus(); const send = s.getElementById("csend") as HTMLButtonElement | null; if (send) send.disabled = !inp.value.trim() } return }
      // "Template" → drop the first ready-reply into the composer
      if (t.closest("#ctemplate")) { const chip = s.querySelector(".qchip") as HTMLElement | null; const inp = s.getElementById("cmsg") as HTMLInputElement | null; if (chip && inp) { inp.value = chip.textContent || ""; inp.focus(); const send = s.getElementById("csend") as HTMLButtonElement | null; if (send) send.disabled = !inp.value.trim() } return }
      // inline record payment against this booking conversation — no round-trip
      const rec = t.closest("[data-rec]") as HTMLElement | null
      if (rec?.dataset.rec) { openRecordPaymentDrawer(s, { bookingId: Number(rec.dataset.rec), customerName: rec.dataset.recName || undefined, onSaved: () => qc.invalidateQueries({ queryKey: ["chat-phone"] }) }); return }
      // lead chat → booking, without leaving chat (shared BookingForm keystone)
      const cbk = t.closest("[data-chat-book]") as HTMLElement | null
      if (cbk) {
        openBookingForm(s, {
          prefill: { customerName: cbk.dataset.cbName || undefined, customerPhone: cbk.dataset.cbPhone || undefined, customerEmail: cbk.dataset.cbEmail || undefined },
          businesses: bizListRef.current, activeBiz: activeBizRef.current,
          onSaved: () => qc.invalidateQueries({ queryKey: ["chat-phone"] }),
        })
        return
      }
      // shared file → open in a new tab
      const dl = t.closest("[data-dl]") as HTMLElement | null
      if (dl?.dataset.dl) { window.open(dl.dataset.dl, "_blank", "noopener"); return }
      // real call / WhatsApp using the contact's phone
      const tel = t.closest("[data-tel]") as HTMLElement | null
      if (tel?.dataset.tel) { window.location.href = `tel:${tel.dataset.tel.replace(/\s/g, "")}`; return }
      const waBtn = t.closest("[data-wa]") as HTMLElement | null
      if (waBtn?.dataset.wa) { const d = waDigits(waBtn.dataset.wa); if (d) window.open(`https://wa.me/${d}`, "_blank", "noopener"); return }
      if (t.closest("#csend")) { doSend(); return }
    })
    s.addEventListener("keydown", (e) => {
      const ke = e as KeyboardEvent
      const t = ke.target as HTMLElement
      if (t?.id === "cmsg" && ke.key === "Enter" && !ke.shiftKey) { ke.preventDefault(); doSend() }
    })
    s.addEventListener("input", (e) => {
      const t = e.target as HTMLElement
      if (t?.id === "cmsg") { const inp = t as HTMLInputElement; const send = s.getElementById("csend") as HTMLButtonElement | null; if (send) send.disabled = !inp.value.trim() }
      if (t?.id === "csearch") { setSearch((t as HTMLInputElement).value) }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // Re-render the dynamic sub-regions on any data change (composer untouched).
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || !built.current) return

    const term = search.trim().toLowerCase()
    const counts = { all: conversations.length, unread: 0, lead: 0, book: 0 }
    conversations.forEach((c) => {
      if (c.unreadCount > 0) counts.unread++
      if (c.bookingId) counts.book++; else counts.lead++
    })
    ;(Object.keys(counts) as Array<keyof typeof counts>).forEach((k) => {
      const el = s.querySelector(`[data-c="${k}"]`); if (el) el.textContent = String(counts[k])
    })
    s.querySelectorAll(".ctab").forEach((b) => b.classList.toggle("on", (b as HTMLElement).dataset.f === filter))

    const rows = conversations.filter((c) => {
      const passF = filter === "all" || (filter === "unread" && c.unreadCount > 0) || (filter === "lead" && !c.bookingId) || (filter === "book" && !!c.bookingId)
      const passS = !term || (c.otherUser?.fullName || "").toLowerCase().includes(term)
      return passF && passS
    })

    // ── conversation list ──
    const clistBody = s.getElementById("clistBody")
    if (clistBody) {
      clistBody.innerHTML = rows.length ? rows.map((c) => {
        const nm = c.otherUser?.fullName || "Customer"
        const typing = !!typingUsers[c.id]
        const mine = c.lastMessageSenderId === myId
        const prevTxt = typing ? "likh rahe hain…" : (c.lastMessageText || "Koi message nahi")
        const prev = typing
          ? `<span class="cv-prev typing">${escHtml(prevTxt)}</span>`
          : `<span class="cv-prev">${mine ? svg(IC.tick2) + " " : ""}${escHtml(prevTxt)}</span>`
        const ctx = c.bookingId
          ? `<span class="cv-ctx book">${svg(IC.book)} Booking · #${c.bookingId}</span>`
          : `<span class="cv-ctx lead">${svg(IC.quote)} Lead</span>`
        return `<div class="conv ${c.id === activeConversationId ? "active" : ""}" data-id="${c.id}">
          <span class="avatar">${escHtml(initialsOf(nm))}<span class="src ${srcOf(c)}"></span></span>
          <div class="cv-main">
            <div class="cv-top"><span class="cv-nm">${escHtml(nm)}</span><span class="cv-time ${c.unreadCount ? "acc" : ""}">${escHtml(convTime(c.lastMessageAt))}</span></div>
            <div class="cv-bot">${prev}${c.unreadCount ? `<span class="cv-badge">${c.unreadCount}</span>` : ""}</div>
            ${ctx}
          </div></div>`
      }).join("") : `<div class="clist-empty">${isLoadingConversations ? "Load ho raha hai…" : term ? "Koi chat nahi mili." : "Abhi koi conversation nahi."}</div>`
    }

    const active = conversations.find((c) => c.id === activeConversationId)
    // where the contact is managed (phone-based call/WA actions live on the record)
    const recHref = active ? (active.bookingId ? `/dashboard/bookings/${active.bookingId}` : (leadId ? `/dashboard/leads/${leadId}` : "/dashboard/leads")) : "/dashboard/leads"

    // ── thread head + body ──
    const thHead = s.getElementById("thHead")
    const thBody = s.getElementById("thBody")
    const quick = s.getElementById("quick")
    if (!active) {
      if (thHead) thHead.innerHTML = ""
      if (thBody) thBody.innerHTML = `<div class="th-empty">Ek conversation chunein — messages yahan khulenge.</div>`
      if (quick) quick.innerHTML = ""
    } else {
      const nm = active.otherUser?.fullName || "Customer"
      const typing = !!typingUsers[active.id]
      const online = !!onlineStatuses[active.otherUser?.id]
      const presTxt = typing ? "likh rahe hain…" : online ? "online" : "offline"
      if (thHead) thHead.innerHTML = `
        <span class="avatar" style="width:40px;height:40px;font-size:12px">${escHtml(initialsOf(nm))}<span class="src ${srcOf(active)}"></span></span>
        <div class="th-id"><div class="th-nm">${escHtml(nm)}</div>
          <div class="th-pres ${typing || online ? "" : "off"}">${typing || online ? "<i></i>" : ""}${escHtml(presTxt)}</div></div>
        <div class="th-actions">
          <button class="thbtn" ${contactPhone ? `data-tel="${escHtml(contactPhone)}"` : `data-nav-btn="${recHref}"`} title="${contactPhone ? "Call karein" : "Record kholein"}" aria-label="Call">${svg(IC.call)}</button>
          <button class="thbtn" ${contactPhone ? `data-wa="${escHtml(contactPhone)}"` : `data-nav-btn="${recHref}"`} title="${contactPhone ? "WhatsApp karein" : "Record kholein"}" aria-label="WhatsApp">${svg(IC.wa)}</button>
          <button class="thbtn" data-nav-btn="${recHref}" title="${active.bookingId ? "Booking kholein" : "Lead kholein"}" aria-label="More">${svg(IC.more)}</button>
        </div>`

      if (thBody) {
        let html = "", lastDay: string | null = null, prevT: string | null = null
        messages.forEach((m: ChatMessageItem) => {
          if (m.isDeleted) return
          if (m.messageType === "system") { html += `<div class="sysmsg">${escHtml(m.content)}</div>`; prevT = null; return }
          const dl = dayLabel(m.createdAt)
          if (dl && dl !== lastDay) { html += `<div class="daysep">${escHtml(dl)}</div>`; lastDay = dl; prevT = null }
          const out = m.senderId === myId
          const t = out ? "out" : "in"
          const first = t !== prevT ? " first-" + t : ""; prevT = t
          const tick = out ? `<span class="tick ${m.isRead ? "read" : ""}">${svg(IC.tick2)}</span>` : ""
          let body: string
          if (m.messageType === "image" && m.attachmentUrl) {
            body = `<span class="msg-img" data-dl="${escHtml(m.attachmentUrl)}" role="button" title="Poori tasveer kholein"><img src="${escHtml(m.attachmentUrl)}" alt="${escHtml(m.attachmentName || "Tasveer")}" loading="lazy"/></span>${m.content ? `<div class="msg-cap">${escHtml(m.content)}</div>` : ""}`
          } else if (m.messageType === "file" || m.messageType === "image") {
            body = `<div class="msg-doc" ${m.attachmentUrl ? `data-dl="${escHtml(m.attachmentUrl)}" role="button"` : ""}><span class="di">${svg(IC.doc, 1.8)}</span><div><div class="dn">${escHtml(m.attachmentName || (m.messageType === "image" ? "Tasveer" : "File"))}</div><div class="ds">${m.attachmentUrl ? "Kholein" : escHtml(m.messageType === "image" ? "Image" : "File")}</div></div></div>`
          } else {
            body = escHtml(m.content)
          }
          html += `<div class="msg ${t}${first}">${body}<span class="mt">${escHtml(hhmm(m.createdAt))}${tick}</span></div>`
        })
        if (typing) html += `<div class="typing-b"><i></i><i></i><i></i></div>`
        if (!html) html = `<div class="th-empty">Abhi koi message nahi — pehla message bhejein.</div>`
        thBody.innerHTML = html
        thBody.scrollTop = thBody.scrollHeight
      }

      if (quick) {
        const qs = active.bookingId ? QUICK_BOOK : QUICK_LEAD
        quick.innerHTML = qs.map((q) => `<button class="qchip">${escHtml(q)}</button>`).join("")
      }
    }

    // ── context rail ──
    const cinfo = s.getElementById("cinfo")
    if (cinfo) {
      if (!active) { cinfo.innerHTML = "" }
      else {
        const nm = active.otherUser?.fullName || "Customer"
        const sub = [active.otherUser?.email, active.otherUser?.isVendor ? "Vendor" : "Customer"].filter(Boolean).join(" · ")
        const isBook = !!active.bookingId
        const ctxCard = isBook
          ? `<div class="ci-ctxcard"><div class="cc-t"><span class="cc-nm">Booking</span><span class="cv-ctx book">#${active.bookingId}</span></div>
              <div class="cc-meta"><span><b>Booking:</b> #${active.bookingId}</span><span><b>Rabta shuru:</b> ${escHtml(dayLabel(active.createdAt))}</span></div></div>`
          : `<div class="ci-ctxcard"><div class="cc-t"><span class="cc-nm">Nayi puchh-gichh</span><span class="cv-ctx lead">Lead</span></div>
              <div class="cc-meta"><span><b>Rabta shuru:</b> ${escHtml(dayLabel(active.createdAt))}</span><span><b>Zariya:</b> In-app chat</span></div></div>`
        const actions = isBook
          ? `<button class="btn primary" data-rec="${active.bookingId}" data-rec-name="${escHtml(nm)}">${svg(IC.money, 1.9)} Payment record karein</button>
             <button class="btn" data-nav-btn="/dashboard/bookings/${active.bookingId}">${svg(IC.book, 1.9)} Booking kholein</button>
             <button class="btn" data-nav-btn="/dashboard/bookings/${active.bookingId}/financials">${svg(IC.quote, 1.9)} Invoice dekhein</button>`
          : `<button class="btn primary" data-chat-book data-cb-name="${escHtml(nm)}" data-cb-phone="${escHtml(contactPhone)}" data-cb-email="${escHtml(active.otherUser?.email || "")}">${svg(IC.book, 1.9)} Booking banayein</button>
             <button class="btn" data-nav-btn="${recHref}">${svg(IC.quote, 1.9)} Leads mein dekhein</button>`
        const files = messages.filter((m) => !m.isDeleted && (m.messageType === "file" || m.messageType === "image"))
        const filesHtml = files.length
          ? files.slice(0, 6).map((m) => `<div class="docrow"><span class="di">${svg(IC.doc, 1.8)}</span><div><div class="dn">${escHtml(m.attachmentName || (m.messageType === "image" ? "Tasveer" : "File"))}</div><div class="ds">${escHtml(m.messageType === "image" ? "Image" : "File")}</div></div>${m.attachmentUrl ? `<button class="dl-dl" data-dl="${escHtml(m.attachmentUrl)}" title="Kholein" aria-label="Download">${svg(IC.dl)}</button>` : ""}</div>`).join("")
          : `<div class="ci-empty">Abhi koi file share nahi hui.</div>`
        cinfo.innerHTML = `
          <div class="ci-hero">
            <span class="avatar" style="width:66px;height:66px;font-size:20px">${escHtml(initialsOf(nm))}<span class="src ${srcOf(active)}"></span></span>
            <div class="ci-nm">${escHtml(nm)}</div>
            <div class="ci-sub">${escHtml(sub || "—")}</div>
            <div class="ci-quick">
              <button class="ci-q" ${contactPhone ? `data-tel="${escHtml(contactPhone)}"` : `data-nav-btn="${recHref}"`} title="${contactPhone ? "Call karein" : "Record kholein"}" aria-label="Call">${svg(IC.call)}</button>
              <button class="ci-q wa" ${contactPhone ? `data-wa="${escHtml(contactPhone)}"` : `data-nav-btn="${recHref}"`} title="${contactPhone ? "WhatsApp karein" : "Record kholein"}" aria-label="WhatsApp">${svg(IC.wa)}</button>
              <button class="ci-q" data-nav-btn="${recHref}" title="${isBook ? "Booking kholein" : "Lead kholein"}" aria-label="Profile">${svg(IC.info)}</button>
            </div>
          </div>
          <div class="ci-sec"><h4>${isBook ? "Booking" : "Lead"} detail</h4>${ctxCard}</div>
          <div class="ci-sec"><h4>Foran karein</h4><div class="act">${actions}</div></div>
          <div class="ci-sec"><h4>Share ki hui files</h4>${filesHtml}</div>`
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, conversations, activeConversationId, messages, typingUsers, onlineStatuses, filter, search, myId, contactPhone, leadId])

  return <div ref={hostRef} />
}

export default ChatArtifact
