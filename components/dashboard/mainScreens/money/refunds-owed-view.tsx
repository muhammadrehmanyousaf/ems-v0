"use client"

/**
 * WW-SETTLE — "Wapsi", the refunds this venue still owes.
 *
 * A recorded refund obligation lived inside one booking's detail page. A venue
 * with forty bookings had no way to see the four they owed money on: the only
 * route to that number was to remember which weddings had been called off and
 * open each one. It was money out with no page in Khata.
 *
 * Two things belong here and nothing else:
 *   APPLIED  — the policy said this much goes back and the venue has not paid it
 *   DISPUTED — the venue said it paid and the customer says it never arrived
 *
 * PAID_BY_VENDOR is deliberately absent. It is not the venue's move; it is
 * sitting with the customer, and listing it as an outstanding job would tell an
 * owner to pay twice.
 */

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Loader2, HandCoins, TriangleAlert, ArrowRight, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { listRefundObligations, type RefundObligation } from "@/lib/api/bookingOrder"
import { cn } from "@/lib/utils"

const rs = (n: number) => "Rs " + Math.round(n || 0).toLocaleString("en-PK")
const nice = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : ""

const REASON_LABEL: Record<string, string> = {
  customer_cancel: "Customer ne cancel kiya",
  vendor_cancel: "Aap ne cancel kiya",
  force_majeure: "Force majeure",
  dispute_resolution: "Dispute resolution",
}

export function RefundsOwedView() {
  const q = useQuery({ queryKey: ["refund-obligations"], queryFn: () => listRefundObligations() })

  if (q.isLoading) {
    return (
      <div className="flex grow items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Wapsi…
      </div>
    )
  }

  // 404 = the refund engine is dark for this account. Say so plainly rather
  // than showing an empty list, which would read as "you owe nothing".
  if (!q.data) {
    return (
      <div className="flex grow flex-col gap-6 p-4 md:p-6">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Cancellation aur refund engine is account par abhi chalu nahi hai.
          </CardContent>
        </Card>
      </div>
    )
  }

  const rows: RefundObligation[] = q.data.obligations ?? []

  return (
    <div className="flex grow flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Wapsi — jo aap ko dena hai</h2>
          <p className="text-sm text-muted-foreground">
            Cancel hui bookings jin ka refund ab tak customer tak nahi pohncha.
          </p>
        </div>
        {rows.length > 0 && (
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Kul baqaya</div>
            <div className="text-xl font-semibold tabular-nums text-rose-700 dark:text-rose-400">
              {rs(q.data.totalOutstanding)}
            </div>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Check className="size-4 text-emerald-600" />
            Koi refund baqaya nahi. Sab settle hain.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <Card key={r.id} className={cn(r.state === "DISPUTED" && "border-rose-300 dark:border-rose-900/70")}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">Booking #{r.bookingId}</span>
                    <span className="text-xs text-muted-foreground">
                      {REASON_LABEL[r.reason] ?? r.reason}
                    </span>
                    {r.state === "DISPUTED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                        <TriangleAlert className="size-3" /> Customer kehta hai nahi mila
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.appliedAt ? `Refund ${nice(r.appliedAt)} ko tay hua.` : "Refund tay ho chuka hai."}
                    {r.state === "DISPUTED" && r.disputeNote ? ` Customer: “${r.disputeNote}”` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      <HandCoins className="size-3" /> Dena hai
                    </div>
                    <div className="text-base font-semibold tabular-nums">{rs(r.outstanding)}</div>
                  </div>
                  {/* The action itself lives on the booking, beside the policy,
                      the receipts and the audit trail it has to be recorded
                      against — not duplicated here where none of that context is. */}
                  <Link
                    href={`/dashboard/bookings/${r.bookingId}`}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                  >
                    Kholein <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default RefundsOwedView
