"use client"

/**
 * Function sheets — premium rebuild on the shared champagne shell.
 * Real quote→contract→BEO→invoice→paid pipeline via FunctionSheetAPI.list.
 * Pipeline tiles, state filter, a sheet table with lifecycle badges; rows open
 * the existing sheet detail (composer / sign / PDF stay there).
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { FunctionSheetAPI, variantsAvailable, type FunctionSheet, type FunctionSheetState, type PdfVariant, type BeoData, type BeoTimelineRow, STATE_LABELS } from "@/lib/api/functionSheets"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useArtifactShell, pkNum, escHtml, initialsOf, initTablePager, loadPref, savePref, openDrawer, closeDrawer, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import { waDigits } from "@/components/dashboard/mainScreens/leads/artifact/leads-artifact"

const STATE_LABEL_UR: Partial<Record<FunctionSheetState, string>> = {
  draft: "Draft", quote_sent: "Quote bheja", contract_pending: "Contract pending", signed: "Signed", beo_ready: "BEO ready", invoiced: "Invoiced", paid: "Paid", archived: "Archive", cancelled: "Cancel",
}
const stateLabel = (s: FunctionSheetState) => STATE_LABEL_UR[s] || STATE_LABELS[s] || s
const STATE_TONE: Partial<Record<FunctionSheetState, string>> = {
  draft: "mut", quote_sent: "info", contract_pending: "warn", signed: "info", beo_ready: "info", invoiced: "warn", paid: "ok", archived: "mut", cancelled: "bad",
}
const st = (s: FunctionSheetState) => STATE_TONE[s] || "mut"
const ORDER: FunctionSheetState[] = ["draft", "quote_sent", "contract_pending", "signed", "beo_ready", "invoiced", "paid"]
const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
function fmtDate(s?: string | null) { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>', wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>', check: '<path d="M20 6 9 17l-5-5"/>', pen: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  dl: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 11v6M9.5 14.5 12 17l2.5-2.5"/>', wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20l1.2-5.6A8.4 8.4 0 1 1 21 11.5z"/>', phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.1 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
}
// Stage-aware PDF button label — the customer-facing document that matches each stage.
const PDF_LABEL: Record<PdfVariant, string> = { quote: "Quote", contract: "Contract", beo: "BEO", invoice: "Invoice", receipt: "Receipt" }

const EXTRA_CSS = String.raw`
.fs-tiles{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:10px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:10px 13px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); } .tile.ok .t-val{ color:var(--ok); } .tile.warn .t-val{ color:var(--warn); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:17px; font-weight:680; letter-spacing:-.02em; margin-top:4px; } .t-val .rs{ font-size:12px; color:var(--ink-3); font-weight:600; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.mark{ display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; } .mark svg{ width:13px; height:13px; } .mark.ok{ color:var(--ok); } .mark.mut{ color:var(--ink-4); }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
.rowact{ display:inline-flex; gap:6px; }
.beobtn{ height:28px; padding:0 10px; border-radius:7px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); font-size:11.5px; font-weight:600; display:inline-flex; align-items:center; gap:5px; } .beobtn:hover{ background:var(--surface-3); color:var(--ink); } .beobtn svg{ width:12px; height:12px; }
.beobtn.on{ color:var(--accent-ink); border-color:var(--accent-line); background:var(--accent-wash); }
.beobtn.ic{ width:28px; padding:0; justify-content:center; } .beobtn.ic svg{ width:14px; height:14px; }
.beobtn.wa:hover{ color:var(--ok); border-color:var(--ok); }
.bklink{ color:var(--accent-ink); font-weight:600; cursor:pointer; } .bklink:hover{ text-decoration:underline; }
.beonote{ font-size:12px; color:var(--ink-3); background:var(--surface-2); border:1px solid var(--border); border-radius:9px; padding:9px 11px; margin-bottom:14px; line-height:1.5; }
.beo-tl-h{ display:flex; align-items:center; justify-content:space-between; margin:2px 0 8px; } .beo-tl-h .dlabel{ font-size:11.5px; font-weight:600; color:var(--ink-2); }
.beo-trow{ display:grid; grid-template-columns:96px 1fr 32px; gap:8px; margin-bottom:8px; align-items:center; }
.beo-trow .bt-del{ width:32px; height:36px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--ink-3); display:grid; place-items:center; } .beo-trow .bt-del:hover{ color:var(--bad); border-color:var(--bad); } .beo-trow .bt-del svg{ width:15px; height:15px; }
.beo-empty{ font-size:12px; color:var(--ink-3); padding:8px 0 12px; }
@media (max-width:980px){ .fs-tiles{ grid-template-columns:repeat(2,1fr); } }
`

/* ── New function-sheet quick-create ───────────────────────────── */
function newSheetDrawerBody(): string {
  return `
  <div class="beonote">Nayi sheet — quote/contract yahin se shuru karein. Save ke baad poora composer (line items, PDF, sign) khul jayega.</div>
  <div class="dfield"><label class="dlabel">Sheet ka unwaan (title)</label><input id="fsn-title" placeholder="e.g. Ahmed–Sara Shaadi — Quote"/></div>
  <div class="dfield row2">
    <div><label class="dlabel">Customer ka naam</label><input id="fsn-name" placeholder="Customer"/></div>
    <div><label class="dlabel">Phone</label><input id="fsn-phone" placeholder="03xx…"/></div>
  </div>
  <div class="dfield"><label class="dlabel">Event ki tareekh</label><input id="fsn-date" type="date"/></div>
  <div class="ww-dfoot">
    <button class="btn btn-primary" type="button" data-fsnew-save>Sheet banayein</button>
  </div>`
}

/* ── BEO run-sheet editor (day-of venue operations) ────────────── */
const beoRowHtml = (r?: BeoTimelineRow) => `<div class="beo-trow">
  <input class="bt-time" type="time" value="${r?.time ? escHtml(String(r.time).slice(0, 5)) : ""}" aria-label="Waqt"/>
  <input class="bt-act" value="${escHtml(r?.activity || "")}" placeholder="Kya hoga — e.g. Baraat ki aamad, Khaana khulega"/>
  <button class="bt-del" type="button" data-beo-delrow aria-label="Row hataayein">${svg('<path d="M18 6 6 18M6 6l12 12"/>', 2.2)}</button>
</div>`

function beoDrawerBody(fs: FunctionSheet): string {
  const b: BeoData = fs.beoJson || {}
  const rows = (b.timeline && b.timeline.length ? b.timeline : []).map((r) => beoRowHtml(r)).join("")
  const canPdf = ["beo_ready", "invoiced", "paid", "archived"].includes(fs.state)
  const canMarkReady = fs.state === "signed" // the only legal predecessor of beo_ready
  return `
  <div class="beonote">Din-ka-plan (BEO run-sheet) — <b>${escHtml(fs.title || "Event")}</b>${fs.bookingId ? ` · Booking #${fs.bookingId}` : ""}${fs.eventDate ? ` · ${fmtDate(fs.eventDate)}` : ""}. Ye sirf aap ki team ke liye hai — crew ko waqt-ba-waqt plan.</div>
  <div class="dfield"><label class="dlabel">Halls / jagah</label><input id="beo-spaces" value="${escHtml(b.spaces || "")}" placeholder="e.g. Main Hall + Lawn"/></div>
  <div class="dfield row2">
    <div><label class="dlabel">Guaranteed mehmaan</label><input id="beo-head" type="number" min="0" value="${b.guaranteedHeadcount ?? ""}" placeholder="e.g. 400"/></div>
    <div><label class="dlabel">Setup time</label><input id="beo-setup" type="time" value="${b.setupTime ? escHtml(String(b.setupTime).slice(0, 5)) : ""}"/></div>
  </div>
  <div class="dfield"><label class="dlabel">Teardown time</label><input id="beo-teardown" type="time" value="${b.teardownTime ? escHtml(String(b.teardownTime).slice(0, 5)) : ""}"/></div>
  <div class="beo-tl-h"><span class="dlabel">Run-sheet — waqt ba waqt</span><button class="beobtn" type="button" data-beo-addrow>${svg('<path d="M12 5v14M5 12h14"/>')} Row</button></div>
  <div id="beo-timeline">${rows || `<div class="beo-empty" id="beo-tl-empty">Abhi koi timeline row nahi — "Row" daba kar shuru karein.</div>`}</div>
  <div class="dfield" style="margin-top:6px"><label class="dlabel">Crew ke liye hidayaat</label><textarea id="beo-crew" placeholder="Staff ke liye khaas notes — parking, VIP entry, generator, etc.">${escHtml(b.crewNotes || "")}</textarea></div>
  <div class="ww-dfoot">
    ${canPdf ? `<button class="btn btn-ghost" type="button" data-beo-pdf="${fs.id}">BEO PDF</button>` : ""}
    ${canMarkReady ? `<button class="btn btn-ghost" type="button" data-beo-ready="${fs.id}">Save + BEO ready</button>` : ""}
    <button class="btn btn-primary" type="button" data-beo-save="${fs.id}">Save karein</button>
  </div>`
}

function readBeo(s: ShadowRoot): BeoData {
  const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null)?.value?.trim() || ""
  const headRaw = val("beo-head")
  const timeline: BeoTimelineRow[] = [...s.querySelectorAll("#beo-timeline .beo-trow")].map((r) => ({
    time: (r.querySelector(".bt-time") as HTMLInputElement | null)?.value || "",
    activity: (r.querySelector(".bt-act") as HTMLInputElement | null)?.value?.trim() || "",
  })).filter((r) => r.time || r.activity)
  return {
    spaces: val("beo-spaces") || undefined,
    guaranteedHeadcount: headRaw ? Number(headRaw) : null,
    setupTime: val("beo-setup") || undefined,
    teardownTime: val("beo-teardown") || undefined,
    timeline,
    crewNotes: val("beo-crew") || undefined,
  }
}

function buildContent(list: FunctionSheet[], summary: { byState: Partial<Record<FunctionSheetState, number>>; totalGrand: number }, filter: string): string {
  const cnt = (s: FunctionSheetState) => list.filter((x) => x.state === s).length
  const paidCount = cnt("paid")
  const paidVal = list.filter((x) => x.state === "paid").reduce((a, x) => a + money(x.grandTotal), 0)
  const dueVal = list.filter((x) => x.state === "invoiced" || x.state === "signed" || x.state === "beo_ready").reduce((a, x) => a + money(x.grandTotal), 0)
  const tiles = `<div class="fs-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.doc, 1.8)} Kul sheets</div><div class="t-val tnum">${list.length}</div><div class="t-sub">${cnt("draft") + cnt("quote_sent")} draft/quote</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.wallet, 1.8)} Kul value</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(money(summary.totalGrand) || list.reduce((a, x) => a + money(x.grandTotal), 0))}</div><div class="t-sub">grand total</div></div>
    <div class="tile ok"><div class="t-cap">${svg(IC.check, 1.8)} Paid</div><div class="t-val tnum">${paidCount}</div><div class="t-sub">Rs ${pkNum(paidVal)}</div></div>
    <div class="tile warn"><div class="t-cap">${svg(IC.clock, 1.8)} Invoice/signed value</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(dueVal)}</div><div class="t-sub">in stages ki total value</div></div>
  </div>`

  const tabS = ORDER.filter((s) => cnt(s) > 0)
  const tab = (f: string, label: string, c: number) => `<button class="tab${f === filter ? " on" : ""}" data-f="${f}">${label} <span class="cnt">${c}</span></button>`
  const toolbar = `<div class="toolbar"><div class="tabs" id="tabs">${tab("all", "Sab", list.length)}${tabS.map((s) => tab(s, stateLabel(s), cnt(s))).join("")}</div></div>`

  const rows = list.filter((x) => filter === "all" || x.state === filter)
  const body = rows.map((x) => {
    // Stage-aware customer document: newest-legal variant (paid→Receipt, invoiced→Invoice, else Quote).
    const avail = variantsAvailable(x.state)
    const pdfV: PdfVariant = (["receipt", "invoice", "quote"] as PdfVariant[]).find((v) => avail.includes(v)) || "quote"
    const waP = waDigits(x.customerPhone)
    const waMsg = encodeURIComponent(`Assalam-o-Alaikum${x.customerName ? " " + x.customerName : ""}! ${x.title || "Aap ki function sheet"} ke silsile mein raabta.`)
    const contact = x.customerPhone
      ? `${waP ? `<a class="beobtn ic wa" href="https://wa.me/${waP}?text=${waMsg}" target="_blank" rel="noopener" data-stop title="WhatsApp bhejein" aria-label="WhatsApp">${svg(IC.wa, 1.9)}</a>` : ""}<a class="beobtn ic" href="tel:${escHtml(String(x.customerPhone).replace(/\s/g, ""))}" data-stop title="Call karein" aria-label="Call">${svg(IC.phone, 1.9)}</a>`
      : ""
    const bookingChip = x.bookingId ? ` · <a class="bklink" data-nav-btn="/dashboard/bookings/${x.bookingId}" data-stop role="link" title="Booking kholein">Booking #${x.bookingId}</a>` : ""
    return `<tr data-nav-btn="/dashboard/function-sheets/${x.id}">
    <td><div class="c-couple"><span class="ava">${escHtml(initialsOf(x.customerName || x.title))}</span><div><div class="cc-nm">${escHtml(x.title || "Function sheet")}</div><div class="cc-ev">${escHtml(x.customerName || "—")}${bookingChip}</div></div></div></td>
    <td class="td-date">${fmtDate(x.eventDate)}${x.state === "quote_sent" && x.validUntil ? `<div class="cc-ev">Quote valid: ${fmtDate(x.validUntil)}</div>` : ""}</td>
    <td><span class="st ${st(x.state)}"><i></i> ${escHtml(stateLabel(x.state))}</span></td>
    <td class="r td-amt tnum"><span class="rs">Rs</span> ${pkNum(money(x.grandTotal))}</td>
    <td><span class="mark ${x.signedAt ? "ok" : "mut"}">${svg(IC.pen, 2)} ${x.signedAt ? "Signed" : "—"}</span></td>
    <td><span class="mark ${x.paidAt ? "ok" : "mut"}">${svg(IC.check, 2.4)} ${x.paidAt ? "Paid" : "—"}</span></td>
    <td class="r"><span class="rowact"><button class="beobtn ${x.beoJson && (x.beoJson.timeline?.length || x.beoJson.spaces) ? "on" : ""}" data-beo="${x.id}" title="Din-ka-plan (BEO run-sheet)">${svg(IC.list, 2)} BEO</button><button class="beobtn" data-fspdf="${x.id}" data-fspdf-v="${pdfV}" title="PDF — ${escHtml(PDF_LABEL[pdfV])} kholein">${svg(IC.dl, 2)} ${escHtml(PDF_LABEL[pdfV])}</button>${contact}</span></td>
  </tr>`
  }).join("")

  const emptyCta = list.length === 0
    ? `<div class="empty">Abhi koi function sheet nahi.<br><button class="btn btn-primary" id="fs-new-btn" style="margin-top:10px">${svg(IC.plus, 2.2)} Pehli sheet banayein</button></div>`
    : `<div class="empty">Is stage mein koi sheet nahi.<br><button class="btn btn-ghost" data-f="all" style="margin-top:10px">Sab dikhayein</button></div>`
  return `
  <div class="head"><div><h1>Function sheets</h1><div class="sub">Quote → contract → invoice → paid — <b>${list.length}</b> sheets.</div></div><div class="head-actions"><button class="btn btn-primary" id="fs-new-btn">${svg(IC.plus, 2.2)} Nayi sheet</button></div></div>
  ${tiles}${toolbar}
  <div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Sheet</th><th>Event</th><th>Stage</th><th class="r">Total</th><th>Sign</th><th>Paid</th><th class="r">Din ka plan</th></tr></thead>
    <tbody>${body}</tbody></table></div>
    ${rows.length ? `<div class="tbl-foot"><span>${rows.length} sheets</span></div>` : emptyCta}</div>
  <div class="foot">WeddingWala vendor console · Function sheets</div>`
}

export function FunctionSheetsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/function-sheets", crumbBold: "Ops", crumbSub: "Function sheets", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const router = useRouter()
  const activeBusinessId = useActiveBusinessId()
  const bizRef = React.useRef(activeBusinessId); bizRef.current = activeBusinessId
  const { data, isError } = useQuery({ queryKey: ["fsheets-art"], queryFn: () => FunctionSheetAPI.list({}) })
  const list = React.useMemo(() => (data?.functionSheets ?? []) as FunctionSheet[], [data])
  const summary = data?.summary ?? { byState: {}, totalGrand: 0 }
  const [filter, setFilter] = React.useState(() => loadPref("tab:function-sheets", "all"))

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Function sheets</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Function sheets load ho rahi hain…</div>`; return }
    wwc.innerHTML = buildContent(list, summary, filter)
    initTablePager(s, { pageSize: 25 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, filter, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true

    const saveBeo = async (id: number, markReady: boolean) => {
      const beo = readBeo(s)
      const btn = s.querySelector(markReady ? "[data-beo-ready]" : "[data-beo-save]") as HTMLButtonElement | null
      const label = btn?.textContent || ""
      if (btn) { btn.disabled = true; btn.textContent = "Save ho raha…" }
      try {
        await FunctionSheetAPI.update(id, { beoJson: beo })
        if (markReady) {
          try { await FunctionSheetAPI.transition(id, { to: "beo_ready" }) }
          catch { toast.message("Plan save ho gaya — stage aage nahi barha (state machine)") }
        }
        toast.success("Din ka plan (BEO) save ho gaya")
        closeDrawer(s)
        qc.invalidateQueries({ queryKey: ["fsheets-art"] })
      } catch (err: unknown) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua")
        if (btn) { btn.disabled = false; btn.textContent = label }
      }
    }
    const openBeoPdf = async (id: number) => {
      try {
        const blob = await FunctionSheetAPI.pdfBlob(id, "beo")
        const url = URL.createObjectURL(blob)
        window.open(url, "_blank", "noopener")
        setTimeout(() => URL.revokeObjectURL(url), 60000)
      } catch { toast.error("BEO PDF nahi bani") }
    }
    // Stage-aware customer document (Quote / Invoice / Receipt) — mirrors openBeoPdf.
    const openSheetPdf = async (id: number, variant: PdfVariant) => {
      try {
        const blob = await FunctionSheetAPI.pdfBlob(id, variant)
        const url = URL.createObjectURL(blob)
        window.open(url, "_blank", "noopener")
        setTimeout(() => URL.revokeObjectURL(url), 60000)
      } catch { toast.error("PDF nahi bani") }
    }

    const openNewSheet = () => {
      openDrawer(s, "Nayi function sheet", newSheetDrawerBody())
      const d = (s.getElementById("fsn-date") as HTMLInputElement | null); if (d) d.value = new Date().toISOString().slice(0, 10)
      ;(s.getElementById("fsn-title") as HTMLInputElement | null)?.focus()
    }
    const saveNewSheet = async () => {
      const biz = bizRef.current
      if (!biz) { toast.error("Pehle upar se venue chunein"); return }
      const val = (id: string) => (s.getElementById(id) as HTMLInputElement | null)?.value?.trim() || ""
      const name = val("fsn-name")
      const title = val("fsn-title") || (name ? `${name} — Quote` : "Nayi sheet")
      const btn = s.querySelector("[data-fsnew-save]") as HTMLButtonElement | null
      if (btn) { btn.disabled = true; btn.textContent = "Ban raha…" }
      try {
        const fs = await FunctionSheetAPI.create({
          businessId: biz, title,
          customerName: name || undefined, customerPhone: val("fsn-phone") || undefined,
          eventDate: val("fsn-date") || undefined,
        })
        toast.success("Function sheet ban gayi")
        closeDrawer(s)
        qc.invalidateQueries({ queryKey: ["fsheets-art"] })
        if (fs?.id) router.push(`/dashboard/function-sheets/${fs.id}`)
      } catch (err: unknown) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Sheet nahi bani")
        if (btn) { btn.disabled = false; btn.textContent = "Sheet banayein" }
      }
    }

    s.addEventListener("click", (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["fsheets-art"] }); return }
      if (t.closest("#fs-new-btn")) { openNewSheet(); return }
      if (t.closest("[data-fsnew-save]")) { void saveNewSheet(); return }
      const tab = t.closest(".tab") as HTMLElement | null
      if (tab?.dataset.f) { savePref("tab:function-sheets", tab.dataset.f); setFilter(tab.dataset.f); return }
      // empty-state "Sab dikhayein" reset (a plain button, not a .tab)
      const reset = t.closest("[data-f]") as HTMLElement | null
      if (reset?.dataset.f) { savePref("tab:function-sheets", reset.dataset.f); setFilter(reset.dataset.f); return }
      // stage-aware customer-document PDF (Quote / Invoice / Receipt) — opens in a new tab
      const fspdf = t.closest("[data-fspdf]") as HTMLElement | null
      if (fspdf?.dataset.fspdf) { void openSheetPdf(Number(fspdf.dataset.fspdf), (fspdf.dataset.fspdfV as PdfVariant) || "quote"); return }
      // open the BEO run-sheet editor for a row
      const beoBtn = t.closest("[data-beo]") as HTMLElement | null
      if (beoBtn?.dataset.beo) {
        const id = Number(beoBtn.dataset.beo)
        openDrawer(s, "Din ka plan — BEO", `<div class="beo-empty">Load ho raha hai…</div>`)
        FunctionSheetAPI.get(id).then((fs) => {
          const body = s.getElementById("ww-drawer-body")
          if (body) body.innerHTML = fs ? beoDrawerBody(fs) : `<div class="beo-empty">Sheet nahi mili.</div>`
        }).catch(() => { const body = s.getElementById("ww-drawer-body"); if (body) body.innerHTML = `<div class="beo-empty">Load nahi hui.</div>` })
        return
      }
      if (t.closest("[data-beo-addrow]")) {
        const tl = s.getElementById("beo-timeline"); const empty = s.getElementById("beo-tl-empty"); if (empty) empty.remove()
        if (tl) { tl.insertAdjacentHTML("beforeend", beoRowHtml()); (tl.lastElementChild?.querySelector(".bt-time") as HTMLInputElement | null)?.focus() }
        return
      }
      const del = t.closest("[data-beo-delrow]") as HTMLElement | null
      if (del) { del.closest(".beo-trow")?.remove(); return }
      const save = t.closest("[data-beo-save]") as HTMLElement | null
      if (save?.dataset.beoSave) { void saveBeo(Number(save.dataset.beoSave), false); return }
      const rdy = t.closest("[data-beo-ready]") as HTMLElement | null
      if (rdy?.dataset.beoReady) { void saveBeo(Number(rdy.dataset.beoReady), true); return }
      const pdf = t.closest("[data-beo-pdf]") as HTMLElement | null
      if (pdf?.dataset.beoPdf) { void openBeoPdf(Number(pdf.dataset.beoPdf)); return }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default FunctionSheetsArtifact
