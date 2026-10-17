"use client"

/**
 * WP31 - the vendor's two taps for a PHANTOM ADVANCE, shared by every console screen that can meet one
 * (the Payments card on the booking page, the record-payment drawer that every screen opens, Receipts,
 * Cheques).
 *
 * A phantom advance is a booking that says "Rs X received" while no receipt backs it. The server refuses
 * money writes on it (409 ADVANCE_UNLEDGERED) until the vendor decides, explicitly, which is true:
 *
 *   ADOPT  "Haan, ye mila tha"          -> one receipt of exactly Rs X (method + date asked here)
 *   ZERO   "Yeh advance mila hi nahi"   -> the received figure comes down to the receipts (reason asked here)
 *
 * The amount is NEVER typed here: it is the figure the server measured, sent back as `expectedUnledgered`
 * so a stale screen is refused instead of settling a different number. Both taps ask for confirmation, send
 * an Idempotency-Key minted when the drawer opened, and when the answer is lost they read the booking back
 * before saying anything (the same rule as the record-payment drawer).
 *
 * Self-contained, like openConfirm: each function renders into the shell's drawer and wires its own buttons
 * on the freshly-rendered nodes, so a screen only passes `onSettled` and refreshes.
 */

import { toast } from "sonner"
import { BookingAPI } from "@/lib/api/bookings"
import { openDrawer, closeDrawer, openConfirm, escHtml } from "./artifact-shell"
import { invalidateMoney } from "@/lib/query/money-keys"
import { SubmitKey, isAmbiguousFailure, isRetrySameKey } from "@/lib/utils/idempotency"
import { ADOPT_BUTTON, PHANTOM_EXPLAIN, PHANTOM_STALE_CODES, ZERO_BUTTON, phantomNoticeText, rsOf, type UnledgeredInfo } from "@/lib/utils/phantom-advance"
import { todayInKarachi } from "@/lib/utils/pk-date"

export interface PhantomCtx {
  bookingId: number
  customerName?: string
  /** The gap the screen was shown: the server pins the settlement to it. */
  unledgered: number
  /** What the booking shows as received / what the receipts add up to / the booking total (for the before -> after line). */
  received?: number | null
  ledger?: number | null
  total?: number | null
  /** A cancelled booking cannot take a receipt: only ZERO is offered. */
  cancelled?: boolean
  /** YYYY-MM-DD the booking was created: the default date of an adopted receipt (the advance was taken then). */
  createdDate?: string | null
  /** A settlement landed (adopt or zero): refresh the screen. */
  onSettled: (kind: "adopt" | "zero") => void
  /** The booking moved under the screen (someone settled it first): refresh without a success message. */
  onStale?: () => void
}

const METHODS: { v: string; l: string }[] = [
  { v: "cash", l: "Cash" }, { v: "bank_transfer", l: "Bank transfer" }, { v: "jazzcash", l: "JazzCash" },
  { v: "easypaisa", l: "EasyPaisa" }, { v: "raast", l: "Raast" }, { v: "ibft", l: "IBFT" }, { v: "other", l: "Other" },
]
const DIGITAL = ["bank_transfer", "jazzcash", "easypaisa", "raast", "ibft"]
const todayStr = () => todayInKarachi() // WP37 (MONEY-014): the Pakistan day; the UTC day is yesterday until 05:00 PKT

const errMsg = (err: unknown): string | undefined =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message
const errCode = (err: unknown): string | undefined =>
  (err as { response?: { data?: { data?: { code?: string } } } })?.response?.data?.data?.code

/** The two buttons (a drawer panel or a card note): wired by wirePhantomButtons. */
export function phantomButtonsHtml(cancelled?: boolean): string {
  return `${cancelled ? "" : `<button class="btn btn-ghost" type="button" data-ph-adopt>${escHtml(ADOPT_BUTTON)}</button>`}<button class="btn btn-ghost" type="button" data-ph-zero>${escHtml(ZERO_BUTTON)}</button>`
}

/**
 * The block shown INSIDE a drawer when a save was refused with ADVANCE_UNLEDGERED: what is wrong, what each
 * choice does, and the two taps. Same look as the booking page's warning note (warn wash, 12px, small buttons).
 */
export function phantomPanelHtml(ctx: Pick<PhantomCtx, "unledgered" | "cancelled">): string {
  return `<div class="ph-panel" data-ph-panel style="margin-bottom:14px;padding:10px 12px;border-radius:9px;font-size:12px;line-height:1.5;background:var(--warn-wash);color:var(--warn);display:flex;flex-direction:column;gap:8px">
    <div style="font-weight:600">${escHtml(phantomNoticeText(ctx.unledgered, ctx.cancelled))}</div>
    <div>${escHtml(PHANTOM_EXPLAIN.intro)}</div>
    ${ctx.cancelled ? `<div>${escHtml(PHANTOM_EXPLAIN.cancelled)}</div>` : `<div>${escHtml(PHANTOM_EXPLAIN.adopt)}<br>${escHtml(PHANTOM_EXPLAIN.zero)}</div>`}
    <div style="display:flex;gap:8px;flex-wrap:wrap">${phantomButtonsHtml(ctx.cancelled)}</div>
  </div>`
}

/** The ctx of a refusal: the figures the 409 carried plus what the calling screen knows. */
export function phantomCtxFrom(
  info: UnledgeredInfo,
  base: { bookingId?: number | null; customerName?: string; total?: number | null; cancelled?: boolean; createdDate?: string | null; onSettled: PhantomCtx["onSettled"]; onStale?: () => void },
): PhantomCtx {
  return {
    bookingId: Number(info.bookingId ?? base.bookingId),
    customerName: base.customerName,
    unledgered: info.unledgered,
    received: info.received,
    ledger: info.ledger,
    total: base.total ?? null,
    cancelled: base.cancelled,
    createdDate: base.createdDate ?? null,
    onSettled: base.onSettled,
    onStale: base.onStale,
  }
}

/**
 * A save inside an open form drawer was refused with ADVANCE_UNLEDGERED: put the explanation and the two taps at the
 * TOP of that drawer, so what the vendor typed is still there. Returns false when there is no drawer body to put it in.
 */
export function prependPhantomPanel(shadow: ShadowRoot, ctx: PhantomCtx): boolean {
  const body = shadow.getElementById("ww-drawer-body")
  if (!body) return false
  body.querySelector("[data-ph-host]")?.remove()
  const host = document.createElement("div")
  host.setAttribute("data-ph-host", "")
  host.innerHTML = phantomPanelHtml(ctx)
  body.insertBefore(host, body.firstChild)
  wirePhantomButtons(shadow, host, ctx)
  host.scrollIntoView?.({ block: "nearest" })
  return true
}

/** The refusal came from an action with no form (delete, cheque clear): a drawer that only carries the panel. */
export function openPhantomDrawer(shadow: ShadowRoot, ctx: PhantomCtx): void {
  openDrawer(shadow, "Pehle advance theek karein", `${header(ctx)}${phantomPanelHtml(ctx)}<div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close type="button">Waapas</button></div>`)
  const body = shadow.getElementById("ww-drawer-body")
  if (body) wirePhantomButtons(shadow, body, ctx)
}

/** Wire the [data-ph-adopt] / [data-ph-zero] buttons found under `root`. */
export function wirePhantomButtons(shadow: ShadowRoot, root: ParentNode, ctx: PhantomCtx): void {
  root.querySelector("[data-ph-adopt]")?.addEventListener("click", () => openAdoptDrawer(shadow, ctx))
  root.querySelector("[data-ph-zero]")?.addEventListener("click", () => openZeroDrawer(shadow, ctx))
}

function header(ctx: PhantomCtx): string {
  return `<div style="display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px;margin-bottom:10px">${escHtml(ctx.customerName || "Booking")} <span style="font-size:12px;color:var(--ink-3);font-weight:600">#${ctx.bookingId}</span></div>`
}

const amountChip = (n: number) =>
  `<div style="display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--warn);background:var(--warn-wash);border-radius:7px;padding:5px 11px;margin-bottom:14px">Bina receipt ka advance: ${escHtml(rsOf(n))}</div>`

/** After an answer was lost: did the settlement land? (the gap is gone from the booking) */
async function landed(bookingId: number): Promise<boolean | null> {
  try {
    const fresh = await BookingAPI.getSchedule(bookingId)
    return Number(fresh?.money?.unledgered ?? NaN) === 0
  } catch {
    return null
  }
}

/** Common outcome handling of both taps. Returns true when the drawer's work is finished. */
async function settle(
  shadow: ShadowRoot,
  ctx: PhantomCtx,
  kind: "adopt" | "zero",
  key: SubmitKey,
  fingerprint: string,
  call: (idempotencyKey: string) => Promise<unknown>,
  btn: HTMLButtonElement,
  restore: () => void,
): Promise<void> {
  const done = (msg: string, warn = false) => {
    key.rotate()
    if (warn) toast.warning(msg, { duration: 9000 }); else toast.success(msg)
    closeDrawer(shadow)
    void invalidateMoney({ bookingId: ctx.bookingId })
    ctx.onSettled(kind)
  }
  try {
    await call(key.forBody(fingerprint))
    done(kind === "adopt" ? "Advance ki receipt ban gayi" : "Advance hata di gayi")
  } catch (err: unknown) {
    if (isRetrySameKey(err)) {
      // the server is still on the same submit: the key is KEPT, a second tap replays the first answer
      toast.warning(errMsg(err) || "Pichli koshish abhi chal rahi hai — thori der baad dobara dabayein, kuch dobara nahi likha jayega.", { duration: 9000 })
      restore()
      return
    }
    if (isAmbiguousFailure(err)) {
      btn.textContent = "Check ho raha…"
      const ok = await landed(ctx.bookingId)
      if (ok === true) { done("Ho chuka hai — jawab raaste mein kho gaya tha. Booking par dekh lein.", true); return }
      if (ok === false) toast.error("Network ka masla — kuch nahi badla. Dobara koshish karein.")
      else toast.error("Shayad ho chuka hai — jawab nahi aaya. Dobara dabane se pehle booking check karein.", { duration: 9000 })
      restore()
      return
    }
    key.rotate()
    const code = errCode(err)
    if (code && (PHANTOM_STALE_CODES as readonly string[]).includes(code)) {
      // the booking moved under this screen (settled elsewhere, or another receipt landed): show the truth, never settle a different figure
      toast.error(errMsg(err) || "Booking badal chuki hai — page refresh ho raha hai.", { duration: 9000 })
      closeDrawer(shadow)
      void invalidateMoney({ bookingId: ctx.bookingId })
      ;(ctx.onStale || (() => ctx.onSettled(kind)))()
      return
    }
    toast.error(errMsg(err) || (kind === "adopt" ? "Receipt nahi bani" : "Advance hata nahi saki"))
    restore()
  }
}

/** ADOPT: "Haan, ye mila tha" - one receipt of exactly the gap. */
export function openAdoptDrawer(shadow: ShadowRoot, ctx: PhantomCtx): void {
  const body = `
    ${header(ctx)}
    ${amountChip(ctx.unledgered)}
    <div class="bf-hint">${escHtml(PHANTOM_EXPLAIN.intro)}<br><br><b>Adopt</b>: ${escHtml(rsOf(ctx.unledgered))} ki ek asli receipt ban jayegi. Mil chuka${ctx.received != null ? ` (${escHtml(rsOf(ctx.received))})` : ""} aur Baqaya wohi rahenge — bas khata aur booking ek jaisay ho jayenge. Raqam badli nahi ja sakti.</div>
    <div class="dfield row2">
      <div class="dfield"><label class="dlabel" for="ph-method">Tareeqa</label><select id="ph-method">${METHODS.map((m) => `<option value="${m.v}">${m.l}</option>`).join("")}</select></div>
      <div class="dfield"><label class="dlabel" for="ph-date">Tareekh (jab mila)</label><input id="ph-date" type="date" value="${escHtml(ctx.createdDate || todayStr())}" max="${todayStr()}"/></div>
    </div>
    <div class="dfield"><label class="dlabel" for="ph-ref" id="ph-ref-l">Note (optional)</label><input id="ph-ref" placeholder="Note"/></div>
    <div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close type="button">Waapas</button><button class="btn btn-primary" type="button" data-ph-adopt-go>Haan, receipt banayein</button></div>`
  openDrawer(shadow, "Advance adopt karein", body)
  const val = (id: string) => (shadow.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? ""
  const method = shadow.getElementById("ph-method") as HTMLSelectElement | null
  const lab = shadow.getElementById("ph-ref-l")
  const ref = shadow.getElementById("ph-ref") as HTMLInputElement | null
  method?.addEventListener("change", () => {
    const dig = DIGITAL.includes(method.value)
    if (lab) lab.textContent = dig ? "Reference / transaction ID (optional)" : "Note (optional)"
    if (ref) ref.placeholder = dig ? "Transaction ID" : "Note"
  })
  const key = new SubmitKey()
  const btn = shadow.querySelector("[data-ph-adopt-go]") as HTMLButtonElement | null
  if (!btn) return
  btn.onclick = async () => {
    const m = val("ph-method") || "cash"
    const text = val("ph-ref")
    const payload = {
      expectedUnledgered: ctx.unledgered,
      method: m as "cash",
      receivedDate: val("ph-date") || undefined,
      ...(text ? (DIGITAL.includes(m) ? { transactionRef: text } : { note: text }) : {}),
    }
    btn.disabled = true
    const orig = btn.innerHTML
    btn.textContent = "Ban rahi hai…"
    await settle(shadow, ctx, "adopt", key, JSON.stringify(payload), (k) => BookingAPI.adoptAdvance(ctx.bookingId, payload, { idempotencyKey: k }), btn, () => { btn.disabled = false; btn.innerHTML = orig })
  }
}

/** ZERO: "Yeh advance mila hi nahi" - the received figure comes down to the receipts; a reason is required. */
export function openZeroDrawer(shadow: ShadowRoot, ctx: PhantomCtx): void {
  const after = ctx.ledger != null ? ctx.ledger : ctx.received != null ? ctx.received - ctx.unledgered : null
  const body = `
    ${header(ctx)}
    ${amountChip(ctx.unledgered)}
    <div class="bf-hint">${escHtml(PHANTOM_EXPLAIN.intro)}<br><br><b>Zero</b>: ${escHtml(rsOf(ctx.unledgered))} booking se hat jayegi${ctx.received != null && after != null ? ` — Mil chuka ${escHtml(rsOf(ctx.received))} se ${escHtml(rsOf(after))} ho jayega` : ""}${ctx.total != null && after != null && !ctx.cancelled ? `, Baqaya ${escHtml(rsOf(Math.max(0, ctx.total - after)))}` : ""}. Koi receipt nahi badlegi. Ye wajah ke saath record mein save hota hai.</div>
    <div class="dfield"><label class="dlabel" for="ph-reason">Wajah (zaroori) <span class="req">*</span></label><textarea id="ph-reason" rows="3" maxlength="300" placeholder="Jaise: customer ne advance diya hi nahi / galat likh di gayi thi"></textarea></div>
    <div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close type="button">Waapas</button><button class="btn btn-primary" type="button" data-ph-zero-go style="background:var(--bad);border-color:var(--bad)">Advance hata dein</button></div>`
  openDrawer(shadow, "Advance zero karein", body)
  const key = new SubmitKey()
  const btn = shadow.querySelector("[data-ph-zero-go]") as HTMLButtonElement | null
  if (!btn) return
  btn.onclick = () => {
    const reason = ((shadow.getElementById("ph-reason") as HTMLTextAreaElement | null)?.value || "").trim()
    if (Array.from(reason).length < 3) { toast.error("Wajah likhna zaroori hai (kam az kam 3 harf)"); return }
    openConfirm(shadow, {
      title: `Pakka? ${rsOf(ctx.unledgered)} ka advance hata diya jayega`,
      message: "Ye is booking se bina-receipt wali raqam hata deta hai. Receipts nahi chhuyi jayengi. Galti ho to baad mein Adopt se wapas likh sakte hain.",
      confirmLabel: "Haan, mila hi nahi",
      cancelLabel: "Rehne dein",
      danger: true,
      onConfirm: async () => {
        const payload = { expectedUnledgered: ctx.unledgered, reason }
        btn.disabled = true
        const orig = btn.innerHTML
        btn.textContent = "Ho raha hai…"
        await settle(shadow, ctx, "zero", key, JSON.stringify(payload), (k) => BookingAPI.voidAdvance(ctx.bookingId, payload, { idempotencyKey: k }), btn, () => { btn.disabled = false; btn.innerHTML = orig })
      },
    })
  }
}

