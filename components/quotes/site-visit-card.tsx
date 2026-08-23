"use client"

/**
 * WW-QUOTE-PIPELINE — the family's walk-through.
 *
 * A Pakistani venue deal is not closed on a price; it is closed after the
 * family has walked the hall, seen the stage, and counted the parking. That
 * step happens today entirely in WhatsApp, which means the platform cannot see
 * it: nobody knows a quote is warm because a visit is booked for Sunday, and no
 * reminder ever goes out.
 *
 * It deliberately sits ALONGSIDE the price negotiation rather than inside the
 * state machine — a visit is routinely arranged while the haggling is still
 * open, and gating one on the other would model the deal wrongly.
 *
 * One component, both roles, for the same reason `RequirementsCard` is: what
 * settles a disagreement later is that both parties saw the same thing.
 */

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarClock, Check, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { errorMessage } from "@/lib/utils/api-error"
import { Button } from "@/components/ui/button"
import { QuotesAPI, SITE_VISIT_LABELS, type Quote, type QuoteParty } from "@/lib/api/quotes"

/** Local datetime string for <input type="datetime-local">. */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("en-PK", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit",
  })
}

/** Who proposed the standing visit, read off the trail. */
function lastProposer(quote: Quote): QuoteParty | null {
  const trail = Array.isArray(quote.counterHistory) ? quote.counterHistory : []
  for (let i = trail.length - 1; i >= 0; i -= 1) {
    if (trail[i]?.siteVisitStatus === "proposed") return trail[i].by ?? null
  }
  return null
}

export function SiteVisitCard({ quote, role }: { quote: Quote; role: QuoteParty }) {
  const qc = useQueryClient()
  const [proposing, setProposing] = useState(false)
  const [when, setWhen] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    d.setHours(16, 0, 0, 0)
    return toLocalInput(d)
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ["quotes"] })

  const act = useMutation({
    mutationFn: (v: { action: "propose" | "confirm" | "decline" | "complete"; at?: string }) =>
      QuotesAPI.siteVisit(quote.id, v.action, v.at),
    onSuccess: (_d, v) => {
      toast.success(
        v.action === "propose" ? "Visit proposed."
          : v.action === "confirm" ? "Visit confirmed."
            : v.action === "decline" ? "Visit declined."
              : "Visit marked done.",
      )
      setProposing(false)
      invalidate()
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't update the site visit")),
  })

  const settled = quote.status === "accepted" || quote.status === "declined"
  if (settled && !quote.siteVisitAt) return null

  const status = quote.siteVisitStatus
  const proposer = lastProposer(quote)
  // Confirming your own proposal isn't agreement — the point of the step is
  // that the OTHER side said yes.
  const canConfirm = status === "proposed" && proposer !== role

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Site visit</h4>
        {status && (
          <span
            className={
              "ml-auto rounded-full px-2 py-0.5 text-[11px] " +
              (status === "confirmed"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : status === "declined"
                  ? "bg-muted text-muted-foreground"
                  : status === "completed"
                    ? "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                    : "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300")
            }
          >
            {SITE_VISIT_LABELS[status]}
          </span>
        )}
      </div>

      {quote.siteVisitAt ? (
        <p className="mt-1.5 text-sm tabular-nums">{formatWhen(quote.siteVisitAt)}</p>
      ) : (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {role === "vendor"
            ? "Most families book after they've walked the hall. Offer them a time."
            : "Want to see the place first? Ask for a time that suits you."}
        </p>
      )}

      {!settled && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {canConfirm && (
            <>
              <Button size="sm" disabled={act.isPending} onClick={() => act.mutate({ action: "confirm" })}>
                {act.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
                That works
              </Button>
              <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => act.mutate({ action: "decline" })}>
                <X className="mr-1.5 h-3.5 w-3.5" /> Can&apos;t make it
              </Button>
            </>
          )}

          {status === "confirmed" && role === "vendor" && (
            <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => act.mutate({ action: "complete" })}>
              Mark as done
            </Button>
          )}

          {!proposing && status !== "confirmed" && (
            <Button size="sm" variant={status ? "outline" : "default"} onClick={() => setProposing(true)}>
              {status ? "Suggest another time" : "Propose a visit"}
            </Button>
          )}
        </div>
      )}

      {proposing && (
        <div className="mt-2.5 space-y-2">
          <input
            type="datetime-local"
            className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none ring-ring focus-visible:ring-2"
            value={when}
            min={toLocalInput(new Date())}
            onChange={(e) => setWhen(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={act.isPending || !when}
              onClick={() => act.mutate({ action: "propose", at: new Date(when).toISOString() })}
            >
              {act.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Send
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setProposing(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}
