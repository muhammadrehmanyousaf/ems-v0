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
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { QuotesAPI, isMyTurn, hasStandingOffer, formatPkr, quoteIsExpired, type Quote } from "@/lib/api/quotes"
import { QuoteLinesTable } from "@/components/quotes/quote-document"
import { SiteVisitCard } from "@/components/quotes/site-visit-card"
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
  const router = useRouter()
  const [counterFor, setCounterFor] = React.useState<Quote | null>(null)

  const { data: quotes, isLoading, isError } = useQuery<Quote[]>({
    queryKey: ["my-quotes"],
    queryFn: () => QuotesAPI.listMine(),
    retry: false, // 404 when the feature is dark — don't hammer
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ["my-quotes"] })

  const acceptMut = useMutation({
    mutationFn: (id: number) => QuotesAPI.accept(id),
    // WW-QUOTE-PIPELINE — accepting used to change a status and nothing else,
    // so "the vendor will be in touch" was the honest description of a dead
    // end. It now creates the booking and holds the date, and the advance is
    // the next step — so take them to it rather than leaving them guessing.
    onSuccess: (res) => {
      invalidate()
      if (res.bookingId) {
        toast.success("Accepted — your date is held. Pay the advance to confirm it.")
        router.push(`/user/bookings/${res.bookingId}`)
      } else {
        toast.success("Quote accepted — the vendor will be in touch")
      }
    },
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
                    {q.version && q.version > 1 && (
                      <div className="text-[11px] text-muted-foreground">Quotation v{q.version}</div>
                    )}
                    {hasStandingOffer(q) && !terminal && (
                      <div className="text-[11px] text-muted-foreground">{myTurn ? "Your move" : `Waiting for ${vendorName}`}</div>
                    )}
                  </div>
                </div>

                {/* WW-QUOTE-PIPELINE — what you're actually paying for. Without
                    this the customer compares venues on a single number and
                    cannot see that one includes the food and the other doesn't. */}
                {Array.isArray(q.lineItems) && q.lineItems.length > 0 && (
                  <div className="mt-3 rounded-lg border border-border p-3">
                    <QuoteLinesTable lines={q.lineItems} guestCount={q.guestCount} total={q.quotedPrice as any} />
                  </div>
                )}

                {q.validUntil && !terminal && (
                  <p className={"mt-2 text-xs " + (quoteIsExpired(q) ? "text-destructive" : "text-muted-foreground")}>
                    {quoteIsExpired(q)
                      ? `This price expired on ${fmtDate(q.validUntil)} — ask ${vendorName} to re-issue it.`
                      : `${vendorName} is holding this price until ${fmtDate(q.validUntil)}.`}
                  </p>
                )}

                {q.status === "accepted" && q.bookingId && (
                  <Link
                    href={`/user/bookings/${q.bookingId}`}
                    className="mt-3 block rounded-lg border border-emerald-300 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-900 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"
                  >
                    Your date is held — booking #{q.bookingId}. Pay the advance to confirm it.
                  </Link>
                )}

                <div className="mt-3">
                  <SiteVisitCard quote={q} role="customer" />
                </div>

                <QuoteHistory quote={q} />

                {!terminal && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {/* An expired price can't be accepted — the server refuses
                        it, so offering the button would only produce an error
                        the customer can do nothing about. */}
                    {myTurn && hasStandingOffer(q) && !quoteIsExpired(q) && (
                      <Button size="sm" onClick={() => acceptMut.mutate(q.id)} disabled={acceptMut.isPending}>
                        {acceptMut.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        Accept {formatPkr(q.quotedPrice)} &amp; hold the date
                      </Button>
                    )}
                    {myTurn && hasStandingOffer(q) && !quoteIsExpired(q) && (
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
