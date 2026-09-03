"use client"

/**
 * Shared "Record payment" drawer — the single inline action that kills the
 * console's most-repeated round-trip (booking-detail → Receipts → re-pick the
 * booking). Any screen that has a bookingId in hand can call this to record a
 * receipt against it WITHOUT leaving the screen. Prefills the remaining amount.
 *
 * Uses the shell's right-side drawer (openDrawer/closeDrawer). The save button is
 * wired directly on the freshly-rendered node, so there's no listener leak.
 */

import { toast } from "sonner"
import { ReceiptsAPI, type ReceiptMethod } from "@/lib/api/paymentReceipts"
import { openDrawer, closeDrawer, escHtml, pkNum } from "./artifact-shell"

const METHODS: { v: ReceiptMethod; l: string }[] = [
  { v: "cash", l: "Cash" }, { v: "bank_transfer", l: "Bank transfer" }, { v: "jazzcash", l: "JazzCash" },
  { v: "easypaisa", l: "EasyPaisa" }, { v: "raast", l: "Raast" }, { v: "ibft", l: "IBFT" }, { v: "other", l: "Other" },
]
const todayStr = () => new Date().toISOString().slice(0, 10)

export interface RecordPaymentOpts {
  bookingId: number
  customerName?: string
  /** Remaining/baqaya amount — prefilled into the amount field when > 0. */
  due?: number
  /** Called after a successful create (invalidate queries / refetch). */
  onSaved?: () => void
}

export function openRecordPaymentDrawer(shadow: ShadowRoot, opts: RecordPaymentOpts) {
  const { bookingId, customerName, due } = opts
  const hasDue = typeof due === "number" && due > 0
  const body = `
    <div style="display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px;margin-bottom:4px">${escHtml(customerName || "Booking")} <span style="font-size:12px;color:var(--ink-3);font-weight:600">#${bookingId}</span></div>
    ${hasDue ? `<div style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--warn);background:var(--warn-wash);border-radius:7px;padding:4px 10px;margin-bottom:14px">Baqaya: Rs ${pkNum(due!)}</div>` : ""}
    <div class="dfield"><label class="dlabel">Raqam (Rs) <span class="req">*</span></label><input id="rp-amount" type="number" inputmode="numeric" min="1" placeholder="0"${hasDue ? ` value="${Math.round(due!)}"` : ""}/></div>
    <div class="dfield row2">
      <div class="dfield"><label class="dlabel">Tareeqa</label><select id="rp-method">${METHODS.map((m) => `<option value="${m.v}">${m.l}</option>`).join("")}</select></div>
      <div class="dfield"><label class="dlabel">Tareekh</label><input id="rp-date" type="date" value="${todayStr()}"/></div>
    </div>
    <div class="dfield"><label class="dlabel">Reference / note</label><input id="rp-ref" placeholder="Transaction ID ya note (optional)"/></div>
    <div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close type="button">Cancel</button><button class="btn btn-primary" data-rp-save type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg> Payment record karein</button></div>
  `
  openDrawer(shadow, "Payment record karein", body)
  const btn = shadow.querySelector("[data-rp-save]") as HTMLButtonElement | null
  const getv = (id: string) => (shadow.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? ""
  if (btn) {
    btn.onclick = async () => {
      const amount = Number(getv("rp-amount"))
      if (!amount || amount <= 0) { toast.error("Sahi raqam likhein"); return }
      btn.disabled = true
      const orig = btn.innerHTML; btn.textContent = "Record ho raha…"
      try {
        await ReceiptsAPI.create({
          bookingId, amount,
          method: (getv("rp-method") as ReceiptMethod) || "cash",
          receivedDate: getv("rp-date") || todayStr(),
          transactionRef: getv("rp-ref") || undefined,
        })
        toast.success("Payment record ho gayi")
        closeDrawer(shadow)
        opts.onSaved?.()
      } catch (err: unknown) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Record nahi hui")
        btn.disabled = false; btn.innerHTML = orig
      }
    }
  }
}
