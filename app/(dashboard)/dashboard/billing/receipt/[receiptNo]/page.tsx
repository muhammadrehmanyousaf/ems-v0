"use client"

/**
 * A printable receipt for one subscription charge. Plain, white, A4-shaped,
 * and everything on it comes from the server's receipt record — the vendor
 * saves it as PDF with the browser's print dialog.
 */

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { SubscriptionAPI } from "@/lib/api/subscription"

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"
const pkr = (paisas: number) => `PKR ${Math.round(paisas / 100).toLocaleString("en-PK")}`

export default function ReceiptPage() {
  const params = useParams<{ receiptNo: string }>()
  const router = useRouter()
  // Receipt numbers are upper-case; the URL may not be (the site lowercases paths).
  const receiptNo = decodeURIComponent(String(params?.receiptNo || "")).toUpperCase()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["subscription-receipt", receiptNo],
    queryFn: () => SubscriptionAPI.getReceipt(receiptNo),
    enabled: !!receiptNo,
  })

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading receipt…</div>
  if (isError || !data) return <div className="p-8 text-sm">Receipt not found. <button className="underline" onClick={() => router.push("/dashboard/billing")}>Back to billing</button></div>

  const r = data.receipt
  return (
    <div className="mx-auto max-w-[760px] p-4 print:p-0 md:p-8">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <button type="button" className="text-sm underline" onClick={() => router.push("/dashboard/billing")}>← Back to billing</button>
        <button type="button" className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50" onClick={() => window.print()}>Print / Save as PDF</button>
      </div>

      <article className="rounded-xl border border-neutral-200 bg-white p-8 text-neutral-900 shadow-sm print:border-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-neutral-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Receipt</p>
            <h1 className="mt-1 text-2xl font-semibold">{data.issuer.name}</h1>
            <p className="mt-1 text-sm text-neutral-600">{data.issuer.legalName}</p>
            <p className="text-sm text-neutral-600">NTN {data.issuer.ntn}</p>
            <p className="mt-1 max-w-[320px] text-sm text-neutral-600">{data.issuer.address}</p>
            <p className="text-sm text-neutral-600">{data.issuer.email}</p>
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-sm">
            <dt className="text-neutral-500">Receipt no.</dt><dd className="font-medium tabular-nums">{r.receiptNo}</dd>
            <dt className="text-neutral-500">Date</dt><dd className="tabular-nums">{fmtDate(r.paidAt)}</dd>
            <dt className="text-neutral-500">Status</dt><dd className="font-medium text-emerald-700">Paid</dd>
            {r.environment === "sandbox" && (<><dt className="text-neutral-500">Mode</dt><dd className="text-amber-700">Sandbox (test)</dd></>)}
          </dl>
        </header>

        <section className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Billed to</p>
            <p className="mt-1 font-medium">{r.user?.fullName || "—"}</p>
            <p className="text-sm text-neutral-600">{r.user?.email || ""}</p>
            <p className="text-sm text-neutral-600">{r.user?.phoneNumber || ""}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Payment</p>
            <p className="mt-1 text-sm">Safepay · recurring monthly</p>
            {r.transactionId && <p className="text-sm text-neutral-600">Transaction {r.transactionId}</p>}
          </div>
        </section>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-neutral-200 text-left text-xs uppercase tracking-[0.14em] text-neutral-500">
              <th className="py-2 pr-4 font-medium">Description</th>
              <th className="py-2 pr-4 font-medium">Period</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neutral-200">
              <td className="py-3 pr-4">{data.planName} plan — Wedding Wala vendor portal subscription</td>
              <td className="py-3 pr-4 tabular-nums sm:whitespace-nowrap">{fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}</td>
              <td className="whitespace-nowrap py-3 text-right tabular-nums">{pkr(r.amountPaisas)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="py-3 pr-4" colSpan={2}><span className="text-neutral-500">Sales tax</span></td>
              <td className="py-3 text-right tabular-nums">PKR 0</td>
            </tr>
            <tr className="border-t border-neutral-300">
              <td className="py-3 pr-4 font-semibold" colSpan={2}>Total paid</td>
              <td className="whitespace-nowrap py-3 text-right text-lg font-semibold tabular-nums">{pkr(r.amountPaisas)}</td>
            </tr>
            {!!r.refundedPaisas && r.refundedPaisas > 0 && (
              <tr className="border-t border-neutral-200 text-amber-800">
                <td className="py-3 pr-4" colSpan={2}>Refunded{r.refundedAt ? ` on ${fmtDate(r.refundedAt)}` : ""}</td>
                <td className="whitespace-nowrap py-3 text-right font-semibold tabular-nums">− {pkr(r.refundedPaisas)}</td>
              </tr>
            )}
          </tfoot>
        </table>

        <footer className="mt-8 space-y-2 text-xs text-neutral-500">
          <p>{data.issuer.taxNote}</p>
          <p>This receipt confirms a subscription payment to Wedding Wala for use of the vendor portal. It is not an invoice for any wedding booking. Subscriptions renew monthly and can be cancelled from Billing; no refunds are made for partial months.</p>
        </footer>
      </article>
    </div>
  )
}
