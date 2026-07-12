"use client"

/**
 * FEAT_QUOTE_NEGOTIATION — customer "My quotes" tracker (/user/quotes).
 *
 * The missing customer visibility: every quote a customer opened with a vendor,
 * with the live haggle state. When it's the customer's turn they can Accept the
 * standing offer, Counter with their own price, or Decline. Dark until the flag
 * is on (the API 404s → the empty/disabled note shows).
 */

import * as React from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { QuotesAPI, isMyTurn, hasStandingOffer, formatPkr, type Quote } from "@/lib/api/quotes"
import { PageContainer, PageHeader, EmptyState } from "@/components/user-dashboard"
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge"
import { NegotiateDialog } from "@/components/quotes/negotiate-dialog"
import { Button } from "@/components/ui/button"
import { Handshake, Loader2 } from "lucide-react"
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
          <span className="font-medium capitalize text-foreground">{h.by === "customer" ? "You" : "Vendor"}</span>
          {h.price != null && <span className="tabular-nums">{formatPkr(h.price)}</span>}
          {h.message && <span className="italic">“{h.message}”</span>}
        </li>
      ))}
    </ol>
  )
}

export function CustomerQuotesView() {
  const qc = useQueryClient()
  const [counterFor, setCounterFor] = React.useState<Quote | null>(null)

  const { data: quotes, isLoading, isError } = useQuery<Quote[]>({
    queryKey: ["my-quotes"],
    queryFn: () => QuotesAPI.listMine(),
    retry: false, // 404 when the feature is dark — don't hammer
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ["my-quotes"] })

  const acceptMut = useMutation({
    mutationFn: (id: number) => QuotesAPI.accept(id),
    onSuccess: () => { toast.success("Quote accepted — the vendor will be in touch"); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Couldn't accept"),
  })
  const declineMut = useMutation({
    mutationFn: (id: number) => QuotesAPI.decline(id),
    onSuccess: () => { toast.success("Quote declined"); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Couldn't decline"),
  })

  const list = quotes ?? []

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<><span>My account</span><span className="size-1 rounded-full bg-muted-foreground/40" /><span>Quotes</span></>}
        title="My quotes"
        description="Prices you've requested from vendors — accept, counter, or decline."
      />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : isError ? (
        <EmptyState icon={<Handshake className="size-6" />} title="Quotes aren't available yet"
          description="This feature isn't enabled for your account yet. Check back soon." />
      ) : list.length === 0 ? (
        <EmptyState icon={<Handshake className="size-6" />} title="No quotes yet"
          description="Open a vendor and tap “Request a quote” to start negotiating."
          action={<Button asChild size="sm"><Link href="/vendors">Explore vendors</Link></Button>} />
      ) : (
        <ul className="space-y-3">
          {list.map((q) => {
            const myTurn = isMyTurn(q, "customer")
            const terminal = q.status === "accepted" || q.status === "declined"
            const vendorName = q.business?.name || `Business #${q.businessId}`
            return (
              <li key={q.id} className="rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{vendorName}</span>
                      <QuoteStatusBadge status={q.status} />
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {[q.eventType, fmtDate(q.deliveryDate), q.guestCount ? `${q.guestCount} guests` : null].filter(Boolean).join(" · ") || "Quote request"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold tabular-nums">{formatPkr(q.quotedPrice)}</div>
                    {hasStandingOffer(q) && !terminal && (
                      <div className="text-[11px] text-muted-foreground">{myTurn ? "Your move" : `Waiting for ${vendorName}`}</div>
                    )}
                  </div>
                </div>

                <QuoteHistory quote={q} />

                {!terminal && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {myTurn && hasStandingOffer(q) && (
                      <Button size="sm" onClick={() => acceptMut.mutate(q.id)} disabled={acceptMut.isPending}>Accept {formatPkr(q.quotedPrice)}</Button>
                    )}
                    {myTurn && hasStandingOffer(q) && (
                      <Button size="sm" variant="outline" onClick={() => setCounterFor(q)}>Counter</Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => declineMut.mutate(q.id)} disabled={declineMut.isPending}>Decline</Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <NegotiateDialog
        open={counterFor != null}
        onOpenChange={(v) => { if (!v) setCounterFor(null) }}
        title={`Counter ${counterFor?.business?.name || "the vendor"}`}
        description="Propose the price you'd pay. They can accept or counter back."
        ctaLabel="Send counter"
        initialPrice={counterFor?.quotedPrice != null ? Number(counterFor.quotedPrice) : null}
        onSubmit={async (price, message) => {
          if (!counterFor) return
          await QuotesAPI.counter(counterFor.id, price, message)
          toast.success("Counter sent")
          invalidate()
        }}
      />
    </PageContainer>
  )
}

export default CustomerQuotesView
