"use client"

/**
 * Profile completion — permanent on the dashboard until the profile is done.
 *
 * A vendor adds their business and is then left alone with it. The checklist
 * that could help exists at /dashboard/onboarding, behind a sidebar row called
 * "Setup checklist" that nobody has a reason to click, and until now it could
 * name a gap without naming its fix. Live scores for the three demo venues when
 * this was written: 27, 40, 40 — with **no photos at all** on any of them.
 *
 * So this sits on the screen they actually open, every day, until it is not
 * needed. Three rules it follows:
 *
 *   1. Never more than three asks at once. A list of twenty-two missing fields
 *      is a reason to close the tab. The three richest are shown; the rest are
 *      one click away.
 *   2. Every ask is a link. The whole point of the backend work behind this is
 *      that "Add photos" now goes to the photo tab.
 *   3. Every ask says what it costs. "At least 5 photos" is a chore.
 *      "Families shortlist from photos before they ever call" is a reason.
 *
 * It collapses (remembered per business) but does not permanently dismiss while
 * the profile is incomplete — an unfinished listing is the vendor's single
 * biggest lever on enquiries, and quietly letting it be hidden forever would be
 * doing them a disservice dressed up as politeness. At 100% it disappears on
 * its own and stops asking anything.
 */

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { CompletenessAPI, nextBestOf, remainingOf, type BusinessCompleteness } from "@/lib/api/completeness"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/dashboard/shared/icon"
import { cn } from "@/lib/utils"

const COLLAPSE_KEY = "ww:profile-completion-collapsed"

/** A ring is read at a glance; a progress bar is read as decoration. */
function ScoreRing({ score }: { score: number }) {
  const r = 30
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, score))
  const tone = pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-primary"
  return (
    <div className="relative grid size-[76px] shrink-0 place-items-center">
      <svg viewBox="0 0 72 72" className="size-[76px] -rotate-90">
        <circle cx="36" cy="36" r={r} strokeWidth="7" className="stroke-muted" fill="none" />
        <circle
          cx="36" cy="36" r={r} strokeWidth="7" fill="none" strokeLinecap="round"
          className={cn("transition-[stroke-dashoffset] duration-700 ease-out", tone)}
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
        />
      </svg>
      <div className="absolute grid place-items-center">
        <span className="text-lg font-semibold tabular-nums leading-none">{pct}</span>
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">of 100</span>
      </div>
    </div>
  )
}

function headline(score: number): { title: string; body: string } {
  if (score < 35) {
    return {
      title: "Your listing isn't ready for customers yet",
      body: "The essentials are missing, so families browsing Wedding Wala have almost nothing to judge you on.",
    }
  }
  if (score < 70) {
    return {
      title: "Your listing is half-built",
      body: "The basics are in. What's left is what families actually compare — photos, pricing and proof.",
    }
  }
  return {
    title: "Almost there",
    body: "A few details away from a listing that answers every question before a family has to ask.",
  }
}

export function ProfileCompletionCard() {
  const activeBusinessId = useActiveBusinessId()
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY)
      if (raw) setCollapsed(JSON.parse(raw))
    } catch {
      /* a corrupt preference must never stop the card rendering */
    }
  }, [])

  const toggle = (id: number) => {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const { data, isLoading } = useQuery({
    queryKey: ["my-completeness"],
    queryFn: () => CompletenessAPI.listMine(),
    staleTime: 60_000,
  })

  if (isLoading || !data?.length) return null

  // Follow the venue switcher. On "All venues" show the weakest listing — the
  // one costing the vendor the most — rather than an arbitrary first row.
  const scoped: BusinessCompleteness[] = activeBusinessId
    ? data.filter((b) => b.businessId === activeBusinessId)
    : [...data].sort((a, b) => a.score - b.score)

  const target = scoped[0]
  if (!target || target.score >= 100) return null

  const isCollapsed = !!collapsed[target.businessId]
  const next = nextBestOf(target, 3)
  const { count, points } = remainingOf(target)
  const { title, body } = headline(target.score)
  const many = !activeBusinessId && data.filter((b) => b.score < 100).length > 1

  return (
    <section
      data-tour="profile-completion"
      aria-label="Profile completion"
      className="overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/[0.06] via-primary/[0.02] to-transparent"
    >
      <div className="flex items-start gap-4 p-4 md:p-5">
        <ScoreRing score={target.score} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Profile completion
            </p>
            <span className="text-[11px] text-muted-foreground">· {target.name}</span>
            {many && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                weakest of {data.filter((b) => b.score < 100).length}
              </span>
            )}
          </div>

          <h3 className="mt-1 text-base font-semibold tracking-tight md:text-lg">{title}</h3>
          {!isCollapsed && <p className="mt-1 text-sm text-muted-foreground">{body}</p>}

          {/* Activation deliberately sits beside the score: a vendor running
              real bookings should not be told they are "27% complete" full
              stop, as though the work they do every day counts for nothing. */}
          {target.activation && target.activation.bookings > 0 && (
            <p className="mt-2 inline-flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
              <Icon name="CheckCircle2" size={13} className="text-emerald-600" />
              You&apos;re already running {target.activation.bookings} booking
              {target.activation.bookings === 1 ? "" : "s"} here
              {target.activation.shieldOn && " with dates protected"} — this is only about
              what customers see.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => toggle(target.businessId)}
          aria-expanded={!isCollapsed}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={isCollapsed ? "Show what's left" : "Hide details"}
        >
          <Icon name={isCollapsed ? "ChevronDown" : "ChevronUp"} size={16} />
        </button>
      </div>

      {!isCollapsed && (
        <div className="px-4 pb-4 md:px-5 md:pb-5">
          <div className="grid gap-2.5 sm:grid-cols-3">
            {next.map((n) => {
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-snug">{n.label}</span>
                    <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      +{n.weight}
                    </span>
                  </div>
                  {n.why && (
                    <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{n.why}</p>
                  )}
                  {n.href && (
                    <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
                      Add it <Icon name="ArrowRight" size={12} />
                    </span>
                  )}
                </>
              )
              const cls =
                "rounded-lg border border-border/70 bg-card/70 p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
              return n.href ? (
                <Link key={n.key} href={n.href} className={cls}>
                  {inner}
                </Link>
              ) : (
                <div key={n.key} className={cls}>
                  {inner}
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/onboarding">
                See all {count} remaining
                <Icon name="ArrowRight" size={14} className="ml-1.5" />
              </Link>
            </Button>
            <span className="text-[12px] text-muted-foreground">
              Worth {points} more points on your profile score.
            </span>
          </div>
        </div>
      )}
    </section>
  )
}

export default ProfileCompletionCard
