"use client"

/**
 * First booking — the chain from an enquiry to money in hand.
 *
 * A vendor can now complete their listing and find their way around the
 * product, and still not know how an enquiry turns into money. The pieces are
 * all built — Enquiries, Bookings, Khata, Function sheets — but nothing
 * connects them, and "Add booking" on an empty dashboard assumes you already
 * know where a booking comes from.
 *
 * So this shows the four links and where the vendor actually is in them:
 *
 *   1. Reply to an enquiry          Enquiries
 *   2. Turn it into a booking       Bookings
 *   3. Record the advance           Khata
 *   4. Send the paperwork           Function sheets
 *
 * Rules it follows, learned from the completion card:
 *   - Exactly ONE next action is highlighted. A vendor who has never taken a
 *     booking does not need four things to do; they need the next one.
 *   - Every step reflects real rows, counted server-side from the same tables
 *     the screens read, so it can never congratulate someone for a step they
 *     have not taken.
 *   - It disappears the moment the chain is complete. This is a first-booking
 *     guide, not a permanent scoreboard — a vendor running fifty weddings a
 *     year should never see it again.
 */

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { CompletenessAPI, type BusinessCompleteness } from "@/lib/api/completeness"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { Button } from "@/components/ui/button"
import { Icon, type IconName } from "@/components/dashboard/shared/icon"
import { cn } from "@/lib/utils"

interface Step {
  key: string
  title: string
  /** Shown when this is the step to do next. */
  body: string
  done: boolean
  href: string
  cta: string
  icon: IconName
}

function buildSteps(b: BusinessCompleteness): Step[] {
  const a = b.activation ?? { bookings: 0, futureConfirmed: 0, baaqiTracked: 0, shieldOn: false }
  const leadsTotal = a.leadsTotal ?? 0
  const leadsWorked = a.leadsWorked ?? 0
  const bookings = a.bookings ?? 0
  const receipts = a.receipts ?? 0
  const sheets = a.functionSheets ?? 0

  return [
    {
      key: "lead",
      title: "Reply to an enquiry",
      body:
        leadsTotal > 0
          ? "Someone has already asked about your venue. Answering quickly is the single biggest thing that wins the booking."
          : "Enquiries from your listing, WhatsApp and walk-ins all land in one inbox. You can also add one by hand from a phone call.",
      done: leadsWorked > 0,
      href: "/dashboard/leads",
      cta: leadsTotal > 0 ? "Open enquiries" : "See the inbox",
      icon: "Inbox",
    },
    {
      key: "booking",
      title: "Turn it into a booking",
      body:
        "Lock the date with a price. Once it is a booking, the date is protected and nobody can double-book it.",
      done: bookings > 0,
      href: "/dashboard/bookings",
      cta: "Add a booking",
      icon: "CalendarCheck",
    },
    {
      key: "receipt",
      title: "Record the advance",
      body:
        "Log what they actually paid — cash, JazzCash, bank, anything. Your khata and the baqaya you chase both come from this.",
      done: receipts > 0,
      href: "/dashboard/money?tab=receipts",
      cta: "Record a payment",
      icon: "Wallet",
    },
    {
      key: "sheet",
      title: "Send the paperwork",
      body:
        "A function sheet is the quote, the contract and the running order in one. It is what stops an argument on the night.",
      done: sheets > 0,
      href: "/dashboard/function-sheets",
      cta: "Create a sheet",
      icon: "FileText",
    },
  ]
}

export function FirstBookingJourney() {
  const activeBusinessId = useActiveBusinessId()

  const { data, isLoading } = useQuery({
    queryKey: ["my-completeness"],
    queryFn: () => CompletenessAPI.listMine(),
    staleTime: 60_000,
  })

  if (isLoading || !data?.length) return null

  // Follow the switcher. On "All venues" guide the venue that has got the
  // furthest without finishing — the one closest to its first real booking.
  const scoped = activeBusinessId
    ? data.filter((b) => b.businessId === activeBusinessId)
    : [...data].sort((x, y) => (y.activation?.bookings ?? 0) - (x.activation?.bookings ?? 0))

  const target = scoped[0]
  if (!target) return null

  // Nothing to show if the backend predates the chain counts — better silent
  // than a guide built on numbers we do not have.
  const a = target.activation
  if (!a || a.leadsTotal === undefined) return null

  const steps = buildSteps(target)
  const nextIndex = steps.findIndex((s) => !s.done)
  if (nextIndex === -1) return null // chain complete — this vendor is running.

  const next = steps[nextIndex]
  const doneCount = steps.filter((s) => s.done).length

  return (
    <section
      data-tour="first-booking"
      aria-label="Getting your first booking"
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3 md:px-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon name="Sparkles" size={16} />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Your first booking
            </p>
            <p className="text-[13px] text-muted-foreground">
              {target.name} · step {nextIndex + 1} of {steps.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5" aria-hidden>
          {steps.map((s, i) => (
            <span
              key={s.key}
              className={cn(
                "h-1.5 rounded-full transition-all",
                s.done ? "w-6 bg-emerald-500" : i === nextIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/25",
              )}
            />
          ))}
          <span className="ml-1.5 text-[11px] tabular-nums text-muted-foreground">
            {doneCount}/{steps.length}
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[1.15fr_0.85fr] md:p-5">
        {/* The one thing to do next. */}
        <div>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Icon name={next.icon} size={17} />
            </span>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold tracking-tight">{next.title}</h3>
              <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{next.body}</p>
              <Button asChild size="sm" className="mt-3">
                <Link href={next.href}>
                  {next.cta}
                  <Icon name="ArrowRight" size={14} className="ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* The whole chain, so the shape of the job is visible at a glance. */}
        <ol className="space-y-1.5 rounded-lg border border-border/60 bg-muted/25 p-3">
          {steps.map((s, i) => {
            const isNext = i === nextIndex
            return (
              <li key={s.key} className="flex items-center gap-2 text-[13px]">
                {s.done ? (
                  <Icon name="CheckCircle2" size={15} className="shrink-0 text-emerald-600" />
                ) : (
                  <span
                    className={cn(
                      "grid size-[15px] shrink-0 place-items-center rounded-full border text-[9px] font-semibold",
                      isNext ? "border-primary text-primary" : "border-muted-foreground/40 text-muted-foreground/60",
                    )}
                  >
                    {i + 1}
                  </span>
                )}
                <Link
                  href={s.href}
                  className={cn(
                    "truncate transition-colors hover:text-foreground hover:underline",
                    s.done
                      ? "text-muted-foreground line-through decoration-muted-foreground/40"
                      : isNext
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {s.title}
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

export default FirstBookingJourney
