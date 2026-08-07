"use client"

/**
 * FEAT_QUOTE_NEGOTIATION — vendor incoming-quotes screen (/dashboard/quotes).
 *
 * The vendor side of the haggle loop: customer quote-requests for the active
 * venue. Send a price (respond), counter the customer's counter, accept their
 * offer, or decline. Owner-scoped on the backend (only quotes for a business you
 * own). Dark until FEAT_QUOTE_NEGOTIATION — the API 404s → the disabled note shows.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { QuotesAPI, isMyTurn, hasStandingOffer, formatPkr, type Quote } from "@/lib/api/quotes"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge"
import { NegotiateDialog } from "@/components/quotes/negotiate-dialog"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useBusiness } from "@/context/BusinessContext"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { DangerousAction } from "@/components/dashboard/primitives/dangerous-action"
import { toast } from "sonner"

const fmtDate = (s?: string | null) => {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

function QuoteHistory({ quote }: { quote: Quote }) {
  const trail = Array.isArray(quote.counterHistory) ? quote.counterHistory : []
  if (trail.length === 0) return null
  return (
    <ol className="mt-3 space-y-1.5 border-t pt-3">
      {trail.map((h, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
          <span className="font-medium capitalize text-foreground">{h.by === "vendor" ? "You" : "Customer"}</span>
          {h.price != null && <span className="tabular-nums">{formatPkr(h.price)}</span>}
          {h.message && <span className="italic">“{h.message}”</span>}
        </li>
      ))}
    </ol>
  )
}

export function QuotesView() {
  const qc = useQueryClient()
  const activeBusinessId = useActiveBusinessId()
  const { business } = useBusiness()
  // "All venues" (null) falls back to the vendor's first business so the screen
  // still works for single-venue vendors; multi-venue vendors scope via the switcher.
  const businessId = activeBusinessId ?? (business ? Number(business.id) : null)

  const [priceFor, setPriceFor] = React.useState<Quote | null>(null)

  const { data: quotes, isLoading, isError } = useQuery<Quote[]>({
    queryKey: ["vendor-quotes", businessId],
    queryFn: () => (businessId != null ? QuotesAPI.listForBusiness(businessId) : Promise.resolve([])),
    enabled: businessId != null,
    retry: false,
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ["vendor-quotes"] })

  const acceptMut = useMutation({
    mutationFn: (id: number) => QuotesAPI.accept(id),
    onSuccess: () => { toast.success("Offer accepted"); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Couldn't accept"),
  })
  const declineMut = useMutation({
    mutationFn: (id: number) => QuotesAPI.decline(id),
    onSuccess: () => { toast.success("Quote declined"); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Couldn't decline"),
  })

  const list = quotes ?? []

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Sales"
        title="Quote requests"
        description="Customers asking for your best price. Send a quote, counter, or accept — this is where the haggling happens."
      />

      {businessId == null ? (
        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Pick a venue to see its quote requests.</div>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><Spinner size={16} /> Loading…</div>
      ) : isError ? (
        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Quote requests aren&apos;t enabled for your account yet.</div>
      ) : list.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <div className="text-sm font-medium">No quote requests yet</div>
          <p className="mt-1 text-xs text-muted-foreground">When a customer taps “Request a quote” on your listing, it lands here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((q) => {
            const myTurn = isMyTurn(q, "vendor")
            const terminal = q.status === "accepted" || q.status === "declined"
            const customerName = q.customer?.fullName || "Customer"
            const contact = q.customer?.phoneNumber || q.customer?.email
            return (
              <li key={q.id} className="rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{customerName}</span>
                      <QuoteStatusBadge status={q.status} />
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {[q.eventType, fmtDate(q.deliveryDate), q.guestCount ? `${q.guestCount} guests` : null].filter(Boolean).join(" · ") || "Quote request"}
                    </div>
                    {q.note && <div className="mt-1 text-xs italic text-muted-foreground">“{q.note}”</div>}
                    {/* Contact revealed only once the vendor is engaged (any non-inquiry state). */}
                    {contact && q.status !== "inquiry" && <div className="mt-1 text-xs text-muted-foreground">{contact}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold tabular-nums">{formatPkr(q.quotedPrice)}</div>
                    {!terminal && (
                      <div className="text-[11px] text-muted-foreground">{myTurn ? "Your move" : "Waiting for customer"}</div>
                    )}
                  </div>
                </div>

                <QuoteHistory quote={q} />

                {!terminal && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {myTurn && q.status === "inquiry" && (
                      <Button size="sm" onClick={() => setPriceFor(q)}><Icon name="Plus" size={14} className="mr-1" /> Send quote</Button>
                    )}
                    {myTurn && hasStandingOffer(q) && (
                      <>
                        {/* WWL-609 family — Accept commits this venue to the
                            customer's number. Confirm names the amount. */}
                        <DangerousAction
                          title="Accept this price?"
                          consequence={
                            <>
                              You&apos;ll be committing to <strong>{formatPkr(q.quotedPrice)}</strong> for{" "}
                              {q.customer?.fullName || "this customer"}. The customer is told straight away,
                              and the negotiation closes — you can&apos;t re-open it from this screen.
                            </>
                          }
                          confirmLabel={`Accept ${formatPkr(q.quotedPrice)}`}
                          confirmVariant="default"
                          disabled={acceptMut.isPending}
                          onConfirm={async () => { await acceptMut.mutateAsync(q.id) }}
                        >
                          <Button size="sm" disabled={acceptMut.isPending}>Accept {formatPkr(q.quotedPrice)}</Button>
                        </DangerousAction>
                        <Button size="sm" variant="outline" onClick={() => setPriceFor(q)}>Counter</Button>
                      </>
                    )}
                    {/* WWL-609 (S2) — Decline fired on the first click, on every
                        non-terminal quote including one you have never priced,
                        and ends a live sales conversation with no way back from
                        this screen. Visual quietness is not a guard. */}
                    <DangerousAction
                      title="Decline this enquiry?"
                      consequence={
                        <>
                          {q.customer?.fullName || "This customer"} will be told you&apos;re not quoting
                          for {q.eventType || "their event"}
                          {q.deliveryDate ? ` on ${fmtDate(q.deliveryDate)}` : ""}. This ends the conversation and
                          can&apos;t be undone from here.
                          {q.status === "inquiry" && (
                            <>
                              {" "}
                              <strong>You haven&apos;t sent them a price yet</strong> — you can quote
                              instead.
                            </>
                          )}
                        </>
                      }
                      confirmLabel="Decline"
                      disabled={declineMut.isPending}
                      onConfirm={async () => { await declineMut.mutateAsync(q.id) }}
                    >
                      <Button size="sm" variant="ghost" className="text-muted-foreground" disabled={declineMut.isPending}>Decline</Button>
                    </DangerousAction>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <NegotiateDialog
        open={priceFor != null}
        onOpenChange={(v) => { if (!v) setPriceFor(null) }}
        title={priceFor?.status === "inquiry" ? "Send your quote" : "Counter offer"}
        description="Enter your price. The customer can accept it or counter back."
        ctaLabel={priceFor?.status === "inquiry" ? "Send quote" : "Send counter"}
        initialPrice={priceFor?.quotedPrice != null ? Number(priceFor.quotedPrice) : null}
        onSubmit={async (price, message) => {
          if (!priceFor) return
          if (priceFor.status === "inquiry") {
            await QuotesAPI.respond(priceFor.id, price, message)
          } else {
            await QuotesAPI.counter(priceFor.id, price, message)
          }
          toast.success("Sent to customer")
          invalidate()
        }}
      />
    </div>
  )
}

export default QuotesView
