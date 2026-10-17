/**
 * The plan-state cards of the billing screen, as HTML strings for the shadow-DOM console (the same pattern as every other
 * artifact screen): trial countdown, "your plan is paused", the manual proof route and its states, and the over-the-limit
 * card. Kept out of billing-artifact.tsx so that screen's diff stays small.
 *
 * Every sentence comes from lib/plans/copy.ts (English and Roman Urdu), every state from the server's access object; this
 * file decides nothing about who is locked.
 */

import { escHtml, pkNum } from "@/components/dashboard/mainScreens/artifact/artifact-shell"
import { daysLeftOf, fmtPkDate, fmtPkDateTime, fmtPkDateTimeRu, type Access } from "@/lib/plans/access"
import { firstFilled, say, type CopyKey, type CopyVars, type Lang } from "@/lib/plans/copy"
import type { ManualPaymentInfo, ManualMethod } from "@/lib/api/billing"

type LangPref = "both" | "en" | "ru"
export function langPref(): LangPref {
  try {
    const v = window.localStorage.getItem("ww:plans-lang")
    return v === "en" || v === "ru" || v === "both" ? v : "both"
  } catch { return "both" }
}

/** One sentence, English first and Roman Urdu under it (or just one, when the vendor chose). */
export function bi(keys: CopyKey | CopyKey[], vars: CopyVars | ((l: Lang) => CopyVars) = {}, cls = ""): string {
  const pref = langPref()
  const ladder = Array.isArray(keys) ? keys : [keys]
  const v = (l: Lang) => (typeof vars === "function" ? vars(l) : vars)
  const en = `<span class="bi-en">${escHtml(firstFilled(ladder, "en", v("en")))}</span>`
  const ru = `<span class="bi-${pref === "ru" ? "en" : "ru"}">${escHtml(firstFilled(ladder, "ru", v("ru")))}</span>`
  return `<span class="bi ${cls}">${pref !== "ru" ? en : ""}${pref !== "en" ? ru : ""}</span>`
}

export const STATE_CARDS_CSS = String.raw`
.sp-t.row{ display:flex; align-items:flex-start; gap:10px; flex-wrap:wrap; } .sp-t.row .st{ margin:2px 0 0 !important; }
.sp-grid dd{ margin:0; }
.bi{ display:block; } .bi-en{ display:block; } .bi-ru{ display:block; color:var(--ink-3); font-weight:400; font-size:.94em; margin-top:1px; }
.sp-t .bi-ru{ font-weight:500; font-size:12px; } .sp-s .bi-en{ color:var(--ink-2); }
.sp.accent{ background:var(--accent-wash); border-color:var(--accent-line); } .sp.accent svg{ color:var(--accent-ink); }
.sp-acts{ display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
.sp-grid.two{ grid-template-columns:repeat(3,auto); }
.mp-methods{ display:flex; flex-direction:column; gap:10px; margin-bottom:14px; }
.mp-m{ border:1px solid var(--border); border-radius:var(--r-sm); padding:11px 12px; background:var(--surface-2); }
.mp-m b{ font-size:12.5px; font-weight:600; } .mp-m dl{ margin:6px 0 0; display:grid; grid-template-columns:auto 1fr; gap:3px 12px; font-size:12px; }
.mp-m dt{ color:var(--ink-3); } .mp-m dd{ margin:0; font-weight:600; font-variant-numeric:tabular-nums; overflow-wrap:anywhere; } .mp-m .note{ margin-top:6px; font-size:11.5px; color:var(--ink-3); }
.mp-radio{ display:flex; gap:8px; flex-wrap:wrap; } .mp-radio label{ white-space:nowrap; display:inline-flex; align-items:center; gap:7px; border:1px solid var(--border-2); border-radius:9px; padding:7px 11px; font-size:12.5px; font-weight:600; cursor:pointer; background:var(--surface); }
.mp-radio input{ margin:0; }
.mp-hint{ font-size:11.5px; color:var(--ink-3); margin-top:4px; }
.ol-list{ display:flex; flex-direction:column; gap:6px; margin:12px 0 4px; }
.sp .ol-list{ max-height:236px; overflow-y:auto; padding-right:4px; }
.ol-row{ display:flex; align-items:center; gap:10px; padding:9px 11px; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface); }
.ol-row .nm{ flex:1; min-width:0; font-weight:600; font-size:12.5px; } .ol-row .nm span{ display:block; font-weight:400; color:var(--ink-3); font-size:11.5px; }
.ol-pick .ol-row{ cursor:pointer; } .ol-pick .ol-row input{ margin:0; width:16px; height:16px; }
.ol-pick .ol-row.on{ border-color:var(--accent); background:var(--accent-wash); }
.ol-count{ font-size:12px; color:var(--ink-3); margin-bottom:8px; }
`

const IC = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  alert: '<path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  spin: '<path d="M21 12a9 9 0 1 1-6.2-8.6"/>',
  upload: '<path d="M12 16V4m0 0 4 4m-4-4L8 8"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
}
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`

/* ───────────── trial ───────────── */

export function trialCardHtml(a: Access, now: Date = new Date()): string {
  const end = a.trialEndsAt ?? a.endsAt
  const days = daysLeftOf(a, end, now)
  const vars = (l: Lang): CopyVars => ({ planName: a.planName, trialEnd: (l === "ru" ? fmtPkDateTimeRu(end) : fmtPkDateTime(end)) || null, days })
  const pill = days === null ? "" : `<span class="st ${days <= 3 ? "warn" : "ok"}">${escHtml(days <= 0 ? say("chip.trial_0", "en") : days === 1 ? say("chip.trial_1", "en") : say("bill.trial.countdown", "en", { days }))}</span>`
  return `<div class="sp ${days !== null && days <= 3 ? "warn" : "ok"}" role="status" data-testid="trial-card">${svg(IC.clock)}<div style="flex:1;min-width:0">
    <div class="sp-t row">${bi("bill.trial.title")}${pill}</div>
    <div class="sp-s">${bi(["bill.trial.line"], vars)}</div>
    <div class="sp-s" style="margin-top:6px">${bi("bill.trial.carry")}</div>
    <dl class="sp-grid"><div><dt>Trial ends</dt><dd>${escHtml(fmtPkDateTime(end) || "-")}</dd></div>${days !== null ? `<div><dt>Days left</dt><dd>${days <= 0 ? "Today" : days}</dd></div>` : ""}<div><dt>Billing</dt><dd>No card, no charge</dd></div></dl>
  </div></div>`
}

/* ───────────── locked ───────────── */

export function lockedCardHtml(a: Access): string {
  const vars: CopyVars = { retainUntil: fmtPkDate(a.retainUntil) || null }
  return `<div class="sp bad" role="status" data-testid="locked-card">${svg(IC.lock)}<div style="flex:1;min-width:0">
    <div class="sp-t">${bi("bill.locked.title")}</div>
    <div class="sp-s">${bi("bill.locked.line")}</div>
    <div class="sp-s" style="margin-top:6px">${bi(["wall.safe", "wall.safe_nodate"], vars)}</div>
  </div></div>`
}

/* ───────────── manual payment (bank / JazzCash / Easypaisa + proof) ───────────── */

const METHOD_LABEL: Record<string, string> = { bank: "Bank transfer", jazzcash: "JazzCash", easypaisa: "Easypaisa" }

/**
 * `settled`: the vendor is open and nothing is owed (the server says so). An old APPROVED proof is only good news while that holds;
 * once the plan lapsed again (locked, or past due) it must not hide the upload button, or the vendor could never renew by this route.
 */
export function manualCardHtml(info: ManualPaymentInfo | null, planName: (tier: string) => string, canPay: boolean, settled = true): string {
  if (!canPay) return ""
  if (!info || !info.enabled) {
    // The route is not open on this server: say so only when the vendor came here to use it (?pay=manual), see billing-artifact.
    return ""
  }
  const cur = info.current
  const fmt = (iso: string | null) => fmtPkDateTime(iso) || "-"
  const summary = cur
    ? `<dl class="sp-grid"><div><dt>Plan</dt><dd>${escHtml(cur.tier ? planName(cur.tier) : "-")}</dd></div><div><dt>Amount</dt><dd>${cur.amountPkr !== null ? `<span class="rs">Rs</span> ${pkNum(cur.amountPkr)}` : "-"}</dd></div><div><dt>Via</dt><dd>${escHtml(METHOD_LABEL[cur.method || ""] || cur.method || "-")}</dd></div></dl>`
    : ""
  if (cur?.status === "pending") {
    return `<div class="sp warn" role="status" data-testid="manual-pending">${svg(IC.spin)}<div style="flex:1;min-width:0">
      <div class="sp-t">${bi("manual.pending.title")}</div>
      <div class="sp-s">${bi("manual.pending.body", (l) => ({ date: (l === "ru" ? fmtPkDateTimeRu(cur.submittedAt) : fmt(cur.submittedAt)) || null }))}</div>${summary}</div></div>`
  }
  if (cur?.status === "approved" && settled) {
    return `<div class="sp ok" role="status" data-testid="manual-approved">${svg(IC.check, 2.4)}<div style="flex:1;min-width:0">
      <div class="sp-t">${bi("manual.approved.title")}</div><div class="sp-s">${bi("manual.approved.body")}</div>${summary}</div></div>`
  }
  const rejected = cur?.status === "rejected"
    ? `<div class="sp bad" role="status" data-testid="manual-rejected" style="margin-bottom:10px">${svg(IC.alert)}<div style="flex:1;min-width:0"><div class="sp-t">${bi("manual.rejected.title")}</div><div class="sp-s">${bi(["manual.rejected.body", "manual.rejected.body_noreason"], { reason: (cur.rejectionReason ?? "").replace(/[\s.!?;:,]+$/, "") })}</div></div></div>`
    : ""
  return `${rejected}<div class="card" style="margin-bottom:16px;padding:16px 18px;display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap" data-testid="manual-card" id="manual">
    <span class="cur-ic" style="flex:none">${svg(IC.upload, 1.8)}</span>
    <div style="flex:1;min-width:240px"><div class="cur-t">${bi("manual.title")}</div><div class="cur-s" style="margin-top:4px">${bi("manual.intro")}</div></div>
    <button class="btn btn-ghost" data-manual-open>${svg(IC.upload)} ${escHtml(say("manual.open", "en"))}</button></div>`
}

export function manualUnavailableHtml(): string {
  return `<div class="sp" role="status" data-testid="manual-unavailable">${svg(IC.alert)}<div style="flex:1;min-width:0"><div class="sp-t">${bi("manual.title")}</div><div class="sp-s">${bi("manual.unavailable")}</div></div></div>`
}

function methodPanel(m: ManualMethod): string {
  const rows = [
    m.accountTitle ? `<dt>Account title</dt><dd>${escHtml(m.accountTitle)}</dd>` : "",
    m.bankName ? `<dt>Bank</dt><dd>${escHtml(m.bankName)}</dd>` : "",
    m.accountNumber ? `<dt>${m.key === "bank" ? "Account / IBAN" : "Number"}</dt><dd>${escHtml(m.accountNumber)}</dd>` : "",
  ].join("")
  return `<div class="mp-m" data-method-panel="${escHtml(m.key)}"><b>${escHtml(m.label)}</b><dl>${rows}</dl>${m.note ? `<div class="note">${escHtml(m.note)}</div>` : ""}</div>`
}

/** The drawer's form: pick a plan, see where to send the money, upload the proof. */
export function manualDrawerHtml(info: ManualPaymentInfo, plans: { tier: string; name: string; pricePkrMonthly: number }[], defaultTier: string | null): string {
  const paid = plans.filter((p) => p.pricePkrMonthly > 0)
  const tier = paid.find((p) => p.tier === defaultTier) ?? paid[0]
  const opts = paid.map((p) => `<option value="${escHtml(p.tier)}" data-price="${p.pricePkrMonthly}"${tier && p.tier === tier.tier ? " selected" : ""}>${escHtml(p.name)} - Rs ${pkNum(p.pricePkrMonthly)} / month</option>`).join("")
  const methodRadios = info.methods.map((m, i) => `<label><input type="radio" name="mp-method" value="${escHtml(m.key)}"${i === 0 ? " checked" : ""}> ${escHtml(m.label)}</label>`).join("")
  return `<form data-mp-form novalidate>
    <div class="dfield"><label class="dlabel">${escHtml(say("manual.step1", "en"))} <span class="req">*</span></label><select id="mp-tier">${opts}</select></div>
    <div class="dlabel" style="margin-bottom:6px">${escHtml(say("manual.step2", "en"))}</div>
    <div class="mp-methods">${info.methods.map(methodPanel).join("")}</div>
    <div class="dlabel" style="margin-bottom:6px">${escHtml(say("manual.step3", "en"))}</div>
    <div class="dfield"><label class="dlabel">${escHtml(say("manual.field.method", "en"))} <span class="req">*</span></label><div class="mp-radio">${methodRadios}</div></div>
    <div class="dfield row2">
      <div class="dfield" style="margin:0"><label class="dlabel" for="mp-ref">${escHtml(say("manual.field.reference", "en"))} <span class="req">*</span></label><input id="mp-ref" maxlength="80" autocomplete="off"></div>
      <div class="dfield" style="margin:0"><label class="dlabel" for="mp-amt">${escHtml(say("manual.field.amount", "en"))} <span class="req">*</span></label><input id="mp-amt" inputmode="numeric" value="${tier ? tier.pricePkrMonthly : ""}"></div>
    </div>
    <div class="dfield"><label class="dlabel" for="mp-proof">${escHtml(say("manual.field.proof", "en"))} <span class="req">*</span></label><input id="mp-proof" type="file" accept="image/*,application/pdf"><div class="mp-hint">${escHtml(say("manual.field.proof", "ru"))} - max 8 MB</div></div>
    <div class="mp-hint" id="mp-err" role="alert" style="color:var(--bad);min-height:16px"></div>
    <div class="ww-dfoot"><button type="button" class="btn btn-ghost" data-drawer-close>Cancel</button><button type="submit" class="btn btn-primary" data-mp-submit>${escHtml(say("manual.submit", "en"))}</button></div>
  </form>`
}

/* ───────────── over the plan's limit ───────────── */

export interface OverLimitRow { label: string; used: number; max: number; nouns: [string, string] }

export function overLimitCardHtml(o: {
  planName: string
  rows: OverLimitRow[]
  venues: { id: number; name: string; city: string | null; live: boolean | null }[]
  canChoose: boolean
  venueLimit: number | null
}): string {
  const lines = o.rows.map((r) => `<div class="sp-s" style="color:var(--ink-2)"><b>${escHtml(r.label)}</b>: ${r.used} in use, ${escHtml(o.planName)} allows ${r.max}</div>`).join("")
  const venueRows = o.venues.length
    ? `<div class="ol-list">${o.venues.map((v) => `<div class="ol-row"><div class="nm">${escHtml(v.name)}${v.city ? `<span>${escHtml(v.city)}</span>` : ""}</div>${v.live === null ? "" : v.live ? '<span class="st ok"><i></i>Live</span>' : '<span class="st mut"><i></i>Paused</span>'}</div>`).join("")}</div>`
    : ""
  const body = o.rows.length
    ? bi("over.body", () => ({ planName: o.planName, max: o.rows[0].max, noun: o.rows[0].max === 1 ? o.rows[0].nouns[0] : o.rows[0].nouns[1], used: o.rows[0].used }))
    : ""
  const action = o.canChoose
    ? `<button class="btn btn-primary sm" data-live-open>${escHtml(say("over.pick", "en"))}</button>`
    : `<span class="sp-s">${bi("over.unavailable")}</span>`
  return `<div class="sp warn" role="status" id="over" data-testid="over-limit-card">${svg(IC.alert)}<div style="flex:1;min-width:0">
    <div class="sp-t">${bi("over.title")}</div>
    <div class="sp-s">${body}</div>${lines ? `<div style="margin-top:6px">${lines}</div>` : ""}
    ${o.canChoose && o.venues.length ? `<div class="sp-s" style="margin-top:8px">${bi("over.paused_note")}</div>${venueRows}` : ""}
    <div class="sp-acts">${action}<button class="btn btn-ghost sm" data-nav-btn="/dashboard/billing#plans">${escHtml(say("over.upgrade", "en"))}</button></div>
  </div></div>`
}

export function liveVenuesDrawerHtml(o: { limit: number | null; venues: { id: number; name: string; city: string | null; live: boolean }[] }): string {
  const rows = o.venues.map((v) => `<label class="ol-row${v.live ? " on" : ""}"><input type="checkbox" value="${v.id}"${v.live ? " checked" : ""}><div class="nm">${escHtml(v.name)}${v.city ? `<span>${escHtml(v.city)}</span>` : ""}</div></label>`).join("")
  return `<form data-live-form novalidate>
    <div class="ol-count" data-live-count>${o.limit !== null ? escHtml(say("over.pick_hint", "en", { max: o.limit })) : ""}</div>
    <div class="ol-list ol-pick">${rows}</div>
    <div class="mp-hint">${escHtml(say("over.paused_note", "en"))}</div>
    <div class="mp-hint" id="live-err" role="alert" style="color:var(--bad);min-height:16px"></div>
    <div class="ww-dfoot"><button type="button" class="btn btn-ghost" data-drawer-close>Cancel</button><button type="submit" class="btn btn-primary" data-live-save>${escHtml(say("over.save", "en"))}</button></div>
  </form>`
}
