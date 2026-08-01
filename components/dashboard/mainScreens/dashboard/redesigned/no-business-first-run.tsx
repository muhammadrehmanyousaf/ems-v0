"use client"

/**
 * First-run state for a vendor who owns no business yet.
 *
 * Found on production, signed in as a real vendor account with zero
 * businesses: the dashboard rendered its full furniture — Total bookings 0,
 * Revenue Rs 0, "No events today", "Nothing outstanding — you're all
 * collected" — and offered "Add booking" as its primary action. You cannot add
 * a booking without a business. Every number was honest and every door was the
 * wrong one.
 *
 * The only route to adding a business was a "+ Add a business" row inside the
 * business-switcher dropdown, behind a 44px initials button in the rail,
 * captioned "Another venue or service" — copy written for someone who already
 * has one. A vendor who signs up and lands here has no reason to open a
 * switcher for a business they do not have.
 *
 * So this takes over the top of the overview until the first business exists.
 * It does not hide the rest of the dashboard: the vendor can still look
 * around, and the moment a business is created this disappears on its own.
 */

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/dashboard/shared/icon"

const STEPS: { icon: "Building2" | "CalendarCheck" | "Wallet"; title: string; body: string }[] = [
  { icon: "Building2", title: "Add your business", body: "Name, city and a starting price is enough to begin." },
  { icon: "CalendarCheck", title: "We review it", body: "Usually the same day. You can add photos and packages while you wait." },
  { icon: "Wallet", title: "Take bookings", body: "Enquiries, bookings and your khata all open up once it's live." },
]

export function NoBusinessFirstRun() {
  return (
    <div className="overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/[0.07] via-primary/[0.03] to-transparent">
      <div className="p-5 md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              One step to go
            </p>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight md:text-2xl">
              Add your business to start taking bookings
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account is ready, but there&apos;s no business on it yet — so there are no enquiries to
              answer and nothing to show in your khata. Adding one takes about two minutes.
            </p>
          </div>

          <Button asChild size="lg" className="shrink-0">
            <Link href="/dashboard/business/new">
              <Icon name="Plus" size={16} className="mr-1.5" />
              Add your business
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-lg border border-border/70 bg-card/70 p-3.5">
              <div className="flex items-center gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icon name={s.icon} size={15} />
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Step {i + 1}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium">{s.title}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NoBusinessFirstRun
