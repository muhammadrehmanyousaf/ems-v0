"use client"

/**
 * Automation — champagne rebuild, mirroring the LIVE two-surface model:
 *   1. Built-in reminders — a fixed set of server-defined reminder cards the
 *      vendor toggles on/off (GET /automation/status, PATCH /automation/prefs).
 *      This is the primary surface — timing is baked into each `kind`.
 *   2. Your custom rules — the optional no-code builder (AutomationRulesAPI):
 *      "N days before/after an event → notify me".
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AutomationRulesAPI, type AutomationRule, type TriggerType, type CreateRuleInput, type AutomationStatus, type BuiltInReminder } from "@/lib/api/automationRules"
import { useArtifactShell, escHtml, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

function triggerLabel(t: TriggerType, days: number) {
  return t === "days_after_event" ? `${days} din baad event ke` : `${days} din pehle event se`
}
function fmtDate(s?: string | null) { if (!s) return "kabhi nahi"; const d = new Date(s); return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("en-PK", { day: "numeric", month: "short" }) }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>', bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>', sparkle: '<path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4z"/>', inbox: '<path d="M22 12h-5l-2 3h-6l-2-3H2"/><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>', engine: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
}
const KIND_IC: Record<string, string> = { t_minus_14: IC.bell, t_minus_3: IC.clock, t_minus_1: IC.calendar, t_plus_1_review: IC.sparkle, lead_48h_stale: IC.inbox }

const EXTRA_CSS = String.raw`
.content{ max-width:940px; }
.sec-h{ font-size:12.5px; font-weight:600; letter-spacing:.03em; text-transform:uppercase; color:var(--ink-3); margin:22px 2px 12px; display:flex; align-items:center; gap:8px; } .sec-h:first-of-type{ margin-top:4px; } .sec-h svg{ width:15px; height:15px; flex:none; color:var(--accent-ink); }
.engine{ display:flex; gap:13px; align-items:center; padding:14px 17px; margin-bottom:16px; }
.eng-ic{ width:40px; height:40px; border-radius:12px; background:var(--accent-wash); border:1px solid var(--accent-line); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .eng-ic svg{ width:20px; height:20px; }
.eng-t{ font-weight:600; font-size:13.5px; } .eng-s{ font-size:12px; color:var(--ink-3); margin-top:2px; }
.br-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:6px; }
.brcard{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); padding:15px 16px; display:flex; flex-direction:column; gap:9px; } .brcard.off{ opacity:.72; }
.br-top{ display:flex; align-items:flex-start; gap:11px; }
.br-ic{ width:36px; height:36px; border-radius:10px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .br-ic svg{ width:18px; height:18px; }
.br-nm{ font-weight:600; font-size:13.5px; } .br-desc{ font-size:12px; color:var(--ink-3); line-height:1.5; margin-top:1px; }
.br-foot{ display:flex; align-items:center; gap:8px; margin-top:auto; }
.tgl{ width:42px; height:24px; border-radius:20px; border:1px solid var(--border-2); background:var(--surface-3); position:relative; flex:none; padding:0; } .tgl .dot{ position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%; background:var(--surface); box-shadow:var(--shadow-xs); transition:left .15s; } .tgl[aria-pressed="true"]{ background:var(--accent); border-color:transparent; } .tgl[aria-pressed="true"] .dot{ left:20px; } .tgl:disabled{ opacity:.5; cursor:not-allowed; }
.addform{ display:none; background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); padding:18px; margin-bottom:14px; } .addform.on{ display:block; }
.af-h{ font-size:13.5px; font-weight:600; margin-bottom:12px; }
.frow{ display:grid; grid-template-columns:2fr 1fr 1fr; gap:12px; margin-bottom:12px; }
.field{ display:flex; flex-direction:column; gap:5px; } .field.wide{ grid-column:1/-1; } .flabel{ font-size:11.5px; font-weight:600; color:var(--ink-2); } .flabel .req{ color:var(--bad); }
.field input,.field select{ width:100%; border:1px solid var(--border-2); border-radius:9px; background:var(--surface-2); color:var(--ink); padding:9px 10px; font:inherit; font-size:12.5px; outline:none; } .field input:focus,.field select:focus{ border-color:var(--accent); background:var(--surface); box-shadow:0 0 0 3px var(--accent-wash); }
.af-foot{ display:flex; gap:8px; justify-content:flex-end; }
.rule{ display:flex; align-items:center; gap:14px; padding:15px 16px; border-bottom:1px solid var(--border); } .rule:last-child{ border-bottom:0; } .rule.off{ opacity:.62; }
.r-ic{ width:38px; height:38px; border-radius:10px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .r-ic svg{ width:18px; height:18px; }
.r-main{ flex:1; min-width:0; } .r-nm{ font-weight:600; font-size:13.5px; } .r-when{ font-size:12px; color:var(--ink-2); margin-top:2px; display:flex; align-items:center; gap:6px; } .r-when svg{ width:12px; height:12px; color:var(--ink-4); } .r-msg{ font-size:11.5px; color:var(--ink-3); margin-top:3px; font-style:italic; }
.r-meta{ font-size:11px; color:var(--ink-4); margin-top:3px; }
.r-acts{ display:flex; align-items:center; gap:8px; flex:none; }
.iconbtn{ width:30px; height:30px; border-radius:7px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-3); display:grid; place-items:center; } .iconbtn:hover{ background:var(--surface-3); color:var(--ink); } .iconbtn.bad:hover{ color:var(--bad); border-color:var(--bad); } .iconbtn svg{ width:14px; height:14px; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:820px){ .frow{ grid-template-columns:1fr; } .br-grid{ grid-template-columns:1fr; } }
`

function builtInCard(r: BuiltInReminder): string {
  const locked = r.envDisabled || r.delegated
  const pills = [
    `<span class="st ${r.enabled ? "ok" : "mut"}"><i></i> ${r.enabled ? "Chal raha hai" : "Band"}</span>`,
    r.envDisabled ? `<span class="st bad"><i></i> Ops ne band kiya</span>` : "",
    r.delegated ? `<span class="st info"><i></i> Delegated cron</span>` : "",
  ].join("")
  return `<div class="brcard${r.enabled ? "" : " off"}">
    <div class="br-top"><span class="br-ic">${svg(KIND_IC[r.kind] || IC.bell, 1.8)}</span>
      <div><div class="br-nm">${escHtml(r.label)}</div><div class="br-desc">${escHtml(r.description)}</div></div></div>
    <div class="br-foot"><button class="tgl" data-pref="${escHtml(r.kind)}" data-on="${r.vendorEnabled}" aria-pressed="${r.vendorEnabled}" aria-label="${escHtml(r.label)} toggle"${locked ? " disabled" : ""}><span class="dot"></span></button>${pills}</div>
  </div>`
}

function buildContent(status: AutomationStatus | null, rules: AutomationRule[]): string {
  const engineOn = !!status?.engine?.enabled
  const mins = Math.max(1, Math.round((status?.engine?.intervalMs || 0) / 60000))
  const engine = `<div class="card engine"><span class="eng-ic">${svg(IC.engine, 1.8)}</span><div><div class="eng-t">Reminder engine ${engineOn ? "chal raha hai" : "band hai"}</div><div class="eng-s">${engineOn ? `Har ~${mins} min mein reminders check hote hain.` : "Abhi reminders nahi bhej raha."}</div></div><span class="st ${engineOn ? "ok" : "mut"}" style="margin-left:auto"><i></i> ${engineOn ? "Running" : "Off"}</span></div>`
  const built = (status?.rules ?? [])
  const builtIn = built.length ? `<div class="br-grid">${built.map(builtInCard).join("")}</div>` : `<div class="card"><div class="empty">Koi built-in reminder available nahi.</div></div>`

  const addForm = `<div class="addform" id="addform"><div class="af-h" id="af-title">Naya reminder</div><input type="hidden" id="r-id" value=""/>
    <div class="frow">
      <div class="field"><label class="flabel">Reminder ka naam <span class="req">*</span></label><input type="text" id="r-name" placeholder="Jaise: Baqaya reminder"/></div>
      <div class="field"><label class="flabel">Kab</label><select id="r-trigger"><option value="days_before_event">Event se pehle</option><option value="days_after_event">Event ke baad</option></select></div>
      <div class="field"><label class="flabel">Kitne din</label><input type="number" id="r-days" min="0" placeholder="3"/></div>
    </div>
    <div class="field wide" style="margin-bottom:14px"><label class="flabel">Message (optional)</label><input type="text" id="r-msg" placeholder="Jo yaad dilana hai…"/></div>
    <div class="af-foot"><button class="btn btn-ghost" id="af-cancel">Cancel</button><button class="btn btn-primary" id="af-save">Reminder save karein</button></div></div>`
  const custom = rules.length ? `<div class="card">${rules.map((r) => `<div class="rule${r.enabled ? "" : " off"}">
    <span class="r-ic">${svg(IC.bell, 1.8)}</span>
    <div class="r-main"><div class="r-nm">${escHtml(r.name)}</div><div class="r-when">${svg(IC.clock)} ${escHtml(triggerLabel(r.triggerType, r.offsetDays))} · mujhe notify karo</div>${r.message ? `<div class="r-msg">"${escHtml(r.message)}"</div>` : ""}<div class="r-meta">Aakhri baar chala: ${fmtDate(r.lastRunAt)}</div></div>
    <div class="r-acts"><button class="tgl" data-toggle="${r.id}" data-on="${r.enabled}" aria-pressed="${r.enabled}"><span class="dot"></span></button><button class="iconbtn" data-edit="${r.id}" title="Edit">${svg(IC.edit)}</button><button class="iconbtn bad" data-del="${r.id}" title="Delete">${svg(IC.trash)}</button></div>
  </div>`).join("")}</div>` : `<div class="card"><div class="empty">Abhi koi custom rule nahi. "Naya reminder" se banayein.</div></div>`

  return `
  <div class="head"><div><h1>Automation</h1><div class="sub">Khud-kar reminders — WeddingWala aapko kaam yaad dila deta hai.</div></div><div class="head-actions"><button class="btn btn-primary" id="addbtn">${svg(IC.plus, 2.2)} Naya rule</button></div></div>
  ${engine}
  <div class="sec-h">${svg(IC.bolt, 1.8)} Built-in reminders — on/off karein</div>
  ${builtIn}
  <div class="sec-h">${svg(IC.edit, 1.8)} Aap ke apne custom rules</div>
  ${addForm}${custom}
  <div class="foot">WeddingWala vendor console · Automation</div>`
}

export function AutomationArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/automation", crumbBold: "Ops", crumbSub: "Automation", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const statusQ = useQuery({ queryKey: ["automation-status"], queryFn: () => AutomationRulesAPI.getStatus().catch(() => null) })
  const rulesQ = useQuery({ queryKey: ["automation-art"], queryFn: () => AutomationRulesAPI.list() })
  const rules = React.useMemo(() => (rulesQ.data?.rules ?? []) as AutomationRule[], [rulesQ.data])
  const rulesRef = React.useRef(rules); rulesRef.current = rules

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!rulesQ.data && !statusQ.data) { wwc.innerHTML = `<div class="loadwrap">Automation load ho rahi hai…</div>`; return }
    wwc.innerHTML = buildContent(statusQ.data ?? null, rules)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, rulesQ.data, statusQ.data])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    const refetch = () => qc.invalidateQueries({ queryKey: ["automation-art"] })
    const refetchStatus = () => qc.invalidateQueries({ queryKey: ["automation-status"] })
    const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? ""
    const openForm = (r?: AutomationRule) => {
      const set = (id: string, v: string) => { const el = s.getElementById(id) as HTMLInputElement | HTMLSelectElement | null; if (el) el.value = v }
      set("r-id", r ? String(r.id) : ""); set("r-name", r?.name || ""); set("r-trigger", r?.triggerType || "days_before_event"); set("r-days", r != null ? String(r.offsetDays) : "3"); set("r-msg", r?.message || "")
      const title = s.getElementById("af-title"); if (title) title.textContent = r ? "Reminder edit karein" : "Naya reminder"
      s.getElementById("addform")?.classList.add("on")
    }
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      // built-in reminder toggle
      const pref = t.closest("[data-pref]") as HTMLElement | null
      if (pref?.dataset.pref) {
        const kind = pref.dataset.pref, on = pref.dataset.on === "true"
        pref.setAttribute("aria-pressed", String(!on)) // optimistic
        try { await AutomationRulesAPI.setPref(kind, !on); toast.success(!on ? "Reminder on" : "Reminder band"); refetchStatus() }
        catch { pref.setAttribute("aria-pressed", String(on)); toast.error("Nahi hua") }
        return
      }
      if (t.closest("#addbtn")) { openForm(); return }
      if (t.closest("#af-cancel")) { s.getElementById("addform")?.classList.remove("on"); return }
      const tg = t.closest("[data-toggle]") as HTMLElement | null
      if (tg?.dataset.toggle) { const id = Number(tg.dataset.toggle); const on = tg.dataset.on === "true"; try { await AutomationRulesAPI.toggle(id, !on); refetch() } catch { toast.error("Nahi hua") } return }
      const edit = t.closest("[data-edit]") as HTMLElement | null
      if (edit?.dataset.edit) { const r = rulesRef.current.find((x) => x.id === Number(edit.dataset.edit)); if (r) openForm(r); return }
      const del = t.closest("[data-del]") as HTMLElement | null
      if (del?.dataset.del) { const id = Number(del.dataset.del); openConfirm(s, { title: "Reminder delete karein?", message: "Ye rule hat jayega — wapas nahi aayega.", danger: true, onConfirm: async () => { try { await AutomationRulesAPI.remove(id); toast.success("Reminder hata diya"); refetch() } catch { toast.error("Delete nahi hua") } } }); return }
      if (t.closest("#af-save")) {
        const name = val("r-name"); if (!name) { toast.error("Naam likhein"); return }
        const days = Number(val("r-days")); if (!Number.isFinite(days) || days < 0) { toast.error("Sahi din likhein"); return }
        const editId = Number(val("r-id"))
        const body: CreateRuleInput = { name, triggerType: val("r-trigger") as TriggerType, offsetDays: days }
        if (val("r-msg")) body.message = val("r-msg")
        const btn = s.getElementById("af-save") as HTMLButtonElement | null
        if (btn) { btn.disabled = true; btn.textContent = "Save ho raha…" }
        try {
          if (editId) await AutomationRulesAPI.update(editId, body)
          else await AutomationRulesAPI.create(body)
          toast.success(editId ? "Reminder update ho gaya" : "Reminder ban gaya"); refetch()
        } catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua"); if (btn) { btn.disabled = false; btn.textContent = "Reminder save karein" } }
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default AutomationArtifact
