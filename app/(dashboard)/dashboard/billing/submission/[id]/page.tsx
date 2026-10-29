"use client"

/**
 * A printable SUBMISSION SLIP for a payment the vendor sent by bank transfer / JazzCash / Easypaisa. It exists from the moment
 * the payment is sent, before anyone has checked it, so the vendor always holds a record of what they paid, when, with which
 * reference, and where it stands. It is NOT a receipt: the receipt is issued when a super admin approves the payment (the slip
 * then links to it). Everything on it comes from the server's record.
 */

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { getManualPaymentSlip } from "@/lib/api/billing"
import { planNameOf } from "@/lib/plan-gate"

type Slip = {
  payment: {
    id: number; status: "pending" | "approved" | "rejected" | "withdrawn"; tier: string; method: string; methodLabel: string; amountPkr: number
    reference: string; submittedAt: string | null; decidedAt: string | null; rejectionReason: string | null; receiptNo: string | null; hasProof: boolean
    proofUrl: string | null
  }
  vendor: { fullName: string | null; email: string | null; phoneNumber: string | null } | null
  businesses: { id: number; name: string }[]
  issuer: { name: string; legalName: string; email: string }
}

const fmtDateTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"

const STATUS: Record<Slip["payment"]["status"], { label: string; cls: string; line: string }> = {
  pending: { label: "Waiting for approval", cls: "text-amber-700", line: "We have your payment details. Our team checks every transfer and will tell you here and by e-mail. This is usually done within one working day." },
  approved: { label: "Approved", cls: "text-emerald-700", line: "Your payment was checked and your plan is active. Your receipt has been issued." },
  rejected: { label: "Not accepted", cls: "text-red-700", line: "We could not accept this payment. The reason is below. If you did pay, send the details again or contact us." },
  withdrawn: { label: "Withdrawn", cls: "text-neutral-600", line: "You withdrew this submission. Nothing was charged and nothing was approved." },
}

export default function SubmissionSlipPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = Number(params?.id)
  const q = useQuery({ queryKey: ["manual-slip", id], queryFn: () => getManualPaymentSlip(id) as Promise<Slip>, enabled: Number.isInteger(id) && id > 0 })

  if (q.isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>
  if (q.isError || !q.data) return <div className="p-8 text-sm">Payment not found. <button className="underline" onClick={() => router.push("/dashboard/billing")}>Back to billing</button></div>

  const { payment: p, vendor, businesses, issuer } = q.data
  const st = STATUS[p.status]
  return (
    <div className="mx-auto max-w-[760px] p-4 print:p-0 md:p-8">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <button type="button" className="text-sm underline" onClick={() => router.push("/dashboard/billing")}>← Back to billing</button>
        <button type="button" className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50" onClick={() => window.print()}>Print / Save as PDF</button>
      </div>
      <article className="rounded-xl border border-neutral-200 bg-white p-8 text-neutral-900 shadow-sm print:border-0 print:shadow-none" data-testid="submission-slip">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-neutral-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Payment submission slip</p>
            <h1 className="mt-1 text-2xl font-semibold">{issuer.name}</h1>
            <p className="mt-1 text-sm text-neutral-600">{issuer.legalName}</p>
            <p className="text-sm text-neutral-600">{issuer.email}</p>
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-sm">
            <dt className="text-neutral-500">Slip no.</dt><dd className="font-medium tabular-nums">WW-PAY-{String(p.id).padStart(5, "0")}</dd>
            <dt className="text-neutral-500">Sent</dt><dd>{fmtDateTime(p.submittedAt)}</dd>
            <dt className="text-neutral-500">Status</dt><dd className={`font-medium ${st.cls}`}>{st.label}</dd>
            {p.decidedAt && <><dt className="text-neutral-500">Decided</dt><dd>{fmtDateTime(p.decidedAt)}</dd></>}
          </dl>
        </header>

        <p className="mt-6 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-700">{st.line}</p>
        {p.status === "rejected" && p.rejectionReason && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><b>Reason:</b> {p.rejectionReason}</p>}

        <section className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Sent by</p>
            <p className="mt-1 font-medium">{vendor?.fullName || "—"}</p>
            <p className="text-sm text-neutral-600">{vendor?.email || ""}</p>
            <p className="text-sm text-neutral-600">{vendor?.phoneNumber || ""}</p>
            {businesses.length > 0 && <p className="mt-1 text-sm text-neutral-600">For {businesses.map((b) => b.name).join(", ")}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Payment</p>
            <p className="mt-1 text-sm">{p.methodLabel}</p>
            <p className="text-sm text-neutral-600">Your reference: <b className="tabular-nums">{p.reference}</b></p>
            <p className="text-sm text-neutral-600">Screenshot: {p.hasProof ? "received" : "not uploaded"}</p>
          </div>
        </section>

        <table className="w-full border-collapse text-sm">
          <thead><tr className="border-y border-neutral-200 text-left text-xs uppercase tracking-[0.14em] text-neutral-500"><th className="py-2 pr-4 font-medium">Description</th><th className="py-2 text-right font-medium">Amount</th></tr></thead>
          <tbody><tr className="border-b border-neutral-200"><td className="py-3 pr-4">{planNameOf(p.tier)} plan, one month — Wedding Wala vendor portal</td><td className="whitespace-nowrap py-3 text-right text-lg font-semibold tabular-nums">PKR {Math.round(p.amountPkr).toLocaleString("en-PK")}</td></tr></tbody>
        </table>

        {p.status === "approved" && p.receiptNo && (
          <p className="mt-6 text-sm">Receipt <Link className="font-medium underline" href={`/dashboard/billing/receipt/${encodeURIComponent(p.receiptNo)}`}>{p.receiptNo}</Link> has been issued for this payment.</p>
        )}
        <footer className="mt-8 space-y-2 text-xs text-neutral-500">
          <p>This slip confirms that we received the details of your payment. It is not a receipt and does not mean the payment has been approved. A receipt with a number is issued when it is approved.</p>
        </footer>
      </article>
    </div>
  )
}
