/**
 * Shared "Waqt" slot picker for the console's drawers.
 *
 * Replaces the free clock (`<input type="time">`) in the "Nayi booking" form and
 * in the reschedule dialog with the list of the venue's own slots for the chosen
 * date, venue and hall. Full / blocked / closed slots are shown disabled with
 * the reason, never hidden; a venue that sells no slots shows no clock at all.
 *
 * The data is the SAME answer the public booking page reads
 * (`BusinessAvailabilityAPI.getDayPlan` -> `/slots/availability/bulk`), and what
 * is offered is decided by `lib/booking/slot-picker-model.ts`, so the vendor and
 * the customer cannot disagree about what is open. This file only fetches,
 * remembers the selection, and draws it.
 *
 * Usage (one call each):
 *   slotPickerField("bf-slots")                         // markup, inside the drawer body
 *   bindSlotPicker(shadow)                              // once per shadow root
 *   await loadSlotPicker(shadow, "bf-slots", { ... })   // on open and on every date/venue/hall change
 *   pickerChoice(shadow, "bf-slots")                    // what to send, or why not
 *   await recheckPicker(shadow, "bf-slots")             // fresh read right before submitting
 *
 * A stale response never wins: every load carries a sequence number, so picking
 * a second date while the first is still loading cannot draw the first's list.
 */

import { BusinessAvailabilityAPI, type SlotAvailabilityRow, type SlotDayMeta } from "@/lib/api/businessAvailability"
import {
  buildPickerModel, chooseSelection, submitChoice,
  type PickerModel, type PickerOption, type SubmitChoice,
} from "@/lib/booking/slot-picker-model"
import { escHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

export type PickerParams = {
  businessId: number
  /** YYYY-MM-DD */
  date: string
  /** The hall the vendor chose, or null for "poora venue". */
  subVenueId: number | null
  /** A clock time a lead/hold arrived with; used once, to preselect the slot it sits in. */
  preferTime?: string | null
  /** Reschedule: the booking's own slot, and the date it is on now. */
  currentSlotId?: number | null
  originalDate?: string | null
}

type State = {
  seq: number
  phase: "idle" | "loading" | "error" | "ready"
  params: PickerParams | null
  rows: SlotAvailabilityRow[]
  meta: SlotDayMeta | null
  model: PickerModel | null
  selectedId: number | null
}

const STATES = new WeakMap<ShadowRoot, Map<string, State>>()
const BOUND = new WeakSet<ShadowRoot>()

function stateOf(shadow: ShadowRoot, id: string): State {
  let m = STATES.get(shadow)
  if (!m) { m = new Map(); STATES.set(shadow, m) }
  let s = m.get(id)
  if (!s) { s = { seq: 0, phase: "idle", params: null, rows: [], meta: null, model: null, selectedId: null }; m.set(id, s) }
  return s
}

/** The field (label + live region) to place in a drawer body. */
export function slotPickerField(id: string, label = "Waqt (slot)"): string {
  return `<div class="dfield" data-sk-field="${escHtml(id)}">
    <label class="dlabel" id="${escHtml(id)}-lbl">${escHtml(label)} <span class="req">*</span></label>
    <div class="sk-box" id="${escHtml(id)}" data-sk aria-labelledby="${escHtml(id)}-lbl" aria-live="polite"><div class="sk-msg">Pehle taareekh aur venue chunein.</div></div>
  </div>`
}

function optionHtml(o: PickerOption): string {
  const label = `${o.name}${o.range ? `, ${o.range}` : ""}${o.enabled ? "" : ` — ${o.note}`}`
  return `<button type="button" class="sk-card" role="radio" aria-checked="${o.selected ? "true" : "false"}" aria-label="${escHtml(label)}"
      data-sk-pick="${o.id}"${o.enabled ? "" : " disabled"}>
    <span class="sk-dot" aria-hidden="true"></span>
    <span class="sk-main"><span class="sk-name">${escHtml(o.name)}</span>${o.range ? `<span class="sk-time">${escHtml(o.range)}</span>` : ""}${o.detail ? `<span class="sk-why">${escHtml(o.detail)}</span>` : ""}</span>
    <span class="sk-pill ${o.tone}">${escHtml(o.note)}</span>
  </button>`
}

function render(shadow: ShadowRoot, id: string): void {
  const box = shadow.getElementById(id)
  if (!box) return
  const s = stateOf(shadow, id)
  box.setAttribute("aria-busy", s.phase === "loading" ? "true" : "false")
  if (s.phase === "idle") { box.innerHTML = `<div class="sk-msg">Pehle taareekh aur venue chunein.</div>`; return }
  if (s.phase === "loading") {
    box.innerHTML = `<div class="sk-msg">Slots dekh rahe hain…</div><div class="sk-skel"></div><div class="sk-skel"></div>`
    return
  }
  if (s.phase === "error" || !s.model) {
    box.innerHTML = `<div class="sk-msg err" role="alert">Slots load nahi hue. <button type="button" class="sk-retry" data-sk-retry>Dobara koshish karein</button></div>`
    return
  }
  const m = s.model
  if (m.mode === "whole_day") { box.innerHTML = `<div class="sk-msg info">${escHtml(m.banner)}</div>`; return }
  if (m.mode === "needs_space") { box.innerHTML = `<div class="sk-msg warn">${escHtml(m.banner)}</div>`; return }
  box.innerHTML = `${m.banner ? `<div class="sk-msg warn" role="status">${escHtml(m.banner)}</div>` : ""}
    <div class="sk-list" role="radiogroup" aria-labelledby="${escHtml(id)}-lbl">${m.options.map(optionHtml).join("")}</div>`
}

function rebuildModel(s: State): void {
  const p = s.params
  s.model = s.meta && p
    ? buildPickerModel({
        rows: s.rows, meta: s.meta, selectedId: s.selectedId,
        currentId: p.currentSlotId ?? null,
        dateMoved: !p.originalDate || p.originalDate !== p.date,
      })
    : null
}

/**
 * (Re)load the list for a date, venue and hall. Call it when the drawer opens
 * and again on every change of any of the three.
 */
export async function loadSlotPicker(shadow: ShadowRoot, id: string, params: PickerParams): Promise<void> {
  const s = stateOf(shadow, id)
  const seq = ++s.seq
  const prevParams = s.params
  s.params = params
  if (!params.businessId || !/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
    s.phase = "idle"; s.rows = []; s.meta = null; s.model = null; s.selectedId = null
    render(shadow, id)
    return
  }
  // A different venue's slot ids mean nothing here; so does a different hall's.
  if (prevParams && (prevParams.businessId !== params.businessId || prevParams.subVenueId !== params.subVenueId)) s.selectedId = null
  s.phase = "loading"
  render(shadow, id)
  let plan: { slots: SlotAvailabilityRow[]; meta: SlotDayMeta }
  try {
    plan = await BusinessAvailabilityAPI.getDayPlan(params.businessId, params.date, params.subVenueId)
  } catch {
    if (seq !== s.seq) return // a later pick won
    s.phase = "error"; s.rows = []; s.meta = null; s.model = null
    render(shadow, id)
    return
  }
  if (seq !== s.seq) return // a later pick won
  s.rows = plan.slots
  s.meta = plan.meta
  rebuildModel(s)
  if (s.model?.mode === "slots") {
    s.selectedId = chooseSelection({
      options: s.model.options, previousId: s.selectedId,
      preferTime: params.preferTime ?? null, currentId: params.currentSlotId ?? null,
    })
    rebuildModel(s)
  } else {
    s.selectedId = null
  }
  s.phase = "ready"
  render(shadow, id)
}

/** Re-read the list with the parameters it was last loaded with (after a refusal, or on demand). */
export async function refreshPicker(shadow: ShadowRoot, id: string): Promise<void> {
  const s = stateOf(shadow, id)
  if (s.params) await loadSlotPicker(shadow, id, { ...s.params, preferTime: null })
}

/** What the form may send right now, or the sentence for why it must not. */
export function pickerChoice(shadow: ShadowRoot, id: string): SubmitChoice {
  const s = stateOf(shadow, id)
  return submitChoice({ model: s.model, selectedId: s.selectedId, loadFailed: s.phase === "error", loading: s.phase === "loading" })
}

/** The chosen slot's row, for callers that need its hours (e.g. the reschedule note). */
export function pickedOption(shadow: ShadowRoot, id: string): PickerOption | null {
  const s = stateOf(shadow, id)
  if (s.model?.mode !== "slots") return null
  return s.model.options.find((o) => o.selected) ?? null
}

/**
 * A fresh read right before submitting. A slot that was open when the form was
 * drawn can be gone a minute later (another booking, a block from the calendar);
 * this redraws the list and says so instead of letting the stale choice go out.
 * The server still has the last word.
 */
export async function recheckPicker(shadow: ShadowRoot, id: string): Promise<{ choice: SubmitChoice; changed: boolean }> {
  const s = stateOf(shadow, id)
  const before = pickerChoice(shadow, id)
  if (!s.params) return { choice: before, changed: false }
  await loadSlotPicker(shadow, id, { ...s.params, preferTime: null })
  const after = pickerChoice(shadow, id)
  const changed = before.ok && (!after.ok || after.slotTemplateId !== before.slotTemplateId)
  return { choice: after, changed }
}

/** One click listener per shadow root: picking an option, retrying a failed load. */
export function bindSlotPicker(shadow: ShadowRoot): void {
  if (BOUND.has(shadow)) return
  BOUND.add(shadow)
  shadow.addEventListener("click", (e) => {
    const t = e.target as HTMLElement
    const box = t.closest("[data-sk]") as HTMLElement | null
    if (!box) return
    const id = box.id
    const s = stateOf(shadow, id)
    if (t.closest("[data-sk-retry]")) {
      if (s.params) void loadSlotPicker(shadow, id, s.params)
      return
    }
    const pick = t.closest("[data-sk-pick]") as HTMLButtonElement | null
    if (pick && !pick.disabled) {
      s.selectedId = Number(pick.dataset.skPick)
      rebuildModel(s)
      render(shadow, id)
      // The list was redrawn: hand focus back to the card that was chosen.
      ;(shadow.querySelector(`#${id} [data-sk-pick="${s.selectedId}"]`) as HTMLElement | null)?.focus()
      box.dispatchEvent(new CustomEvent("sk-change", { bubbles: true, composed: true, detail: { id, slotTemplateId: s.selectedId } }))
    }
  })
}
