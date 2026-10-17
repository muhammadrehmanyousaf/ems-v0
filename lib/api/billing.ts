/**
 * Billing APIs the Wall and the billing page use that are NOT in lib/api/subscription.ts:
 *
 *   GET  /billing/obligations            PLANS-SPEC contract 3 (allowed while locked)
 *   GET  /billing/export                 PLANS-SPEC contract 4 (allowed while locked): money/tax CSV
 *   GET  /subscriptions/manual-payment   PL-C contract (BACKEND DEPENDENCY, not yet specified by PL-A/B): bank/JazzCash/
 *   POST /subscriptions/manual-payment   Easypaisa details, and upload of the vendor's proof; a super-admin approves it
 *   GET  /subscriptions/live-venues      PL-C contract (BACKEND DEPENDENCY for PL-B): which venues stay live over the limit
 *   PUT  /subscriptions/live-venues
 *
 * Every reader here is TOLERANT of the exact envelope but never invents a value: a missing number is `null` (rendered as
 * "not available"), never 0, so a failed or partial answer can not read as "you owe nothing" (the missing-not-zero rule).
 */

import axiosInstance from "@/lib/axiosConfig"
import {
  isNotThere, parseLiveVenues, parseManualPayment, parseObligations,
  type LiveVenues, type ManualMethodKey, type ManualPaymentInfo, type Obligations,
} from "@/lib/plans/billing-shapes"

// The shapes and readers are pure and live in lib/plans/billing-shapes.ts; re-exported here for the screens.
export * from "@/lib/plans/billing-shapes"

/* ───────────── obligations strip ───────────── */

export async function getObligations(): Promise<Obligations | null> {
  const res = await axiosInstance.get("/api/v1/billing/obligations")
  return parseObligations(res.data?.data)
}

/** Download the money/tax CSV. Resolves with the file name it saved. */
export async function downloadMoneyExport(): Promise<string> {
  const res = await axiosInstance.get("/api/v1/billing/export", { responseType: "blob" })
  const disp = String(res.headers?.["content-disposition"] ?? "")
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disp)
  const stamp = new Date().toISOString().slice(0, 10)
  const name = m ? decodeURIComponent(m[1]) : `weddingwala-money-tax-${stamp}.csv`
  const blob: Blob = res.data instanceof Blob ? res.data : new Blob([String(res.data ?? "")], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return name
}

/* ───────────── manual payment (bank / JazzCash / Easypaisa with proof) ───────────── */

export async function getManualPayment(): Promise<ManualPaymentInfo | null> {
  const res = await axiosInstance.get("/api/v1/subscriptions/manual-payment")
  return parseManualPayment(res.data?.data)
}

export interface ManualPaymentSubmit {
  tier: string
  method: ManualMethodKey
  reference: string
  amountPkr: number
  proof: File
}
export async function submitManualPayment(input: ManualPaymentSubmit): Promise<void> {
  const fd = new FormData()
  fd.append("tier", input.tier)
  fd.append("method", input.method)
  fd.append("reference", input.reference)
  fd.append("amountPkr", String(input.amountPkr))
  fd.append("proof", input.proof)
  await axiosInstance.post("/api/v1/subscriptions/manual-payment", fd, { headers: { "Content-Type": "multipart/form-data" } })
}

/* ───────────── which venues stay live when the plan allows fewer ───────────── */

export async function getLiveVenues(): Promise<LiveVenues | null> {
  const res = await axiosInstance.get("/api/v1/subscriptions/live-venues")
  return parseLiveVenues(res.data?.data)
}
export async function saveLiveVenues(liveBusinessIds: number[]): Promise<void> {
  await axiosInstance.put("/api/v1/subscriptions/live-venues", { liveBusinessIds })
}
