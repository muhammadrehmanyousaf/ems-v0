"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/dashboard/shared/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SEVERITY_LABEL, type HealthResult, type Severity } from "@/lib/health/score";

/**
 * The vendor's setup health, as one panel: a ring, a sentence, the factors, and
 * exactly one thing to do next.
 *
 * ── The rules this component follows ─────────────────────────────────────
 *
 * 1. It never renders a number it does not have. `score === null` means nothing
 *    could be measured, and it shows an em dash. A 0 would be a claim about the
 *    vendor rather than a statement about what we could see.
 *
 * 2. It says what it could NOT see. When coverage < 1 the footnote names the
 *    unmeasured factors, so a 60/100 built from two factors cannot be mistaken
 *    for a 60/100 built from four.
 *
 * 3. It offers one action, not a backlog. The model already ranks by how many
 *    points are actually recoverable, so the panel just renders the winner.
 *
 * 4. Healthy is a real state with its own face — not an absence of warnings.
 */

const TONE: Record<Severity, { ring: string; text: string; chip: string }> = {
  healthy: {
    ring: "text-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  "needs-attention": {
    ring: "text-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  "at-risk": {
    ring: "text-orange-500",
    text: "text-orange-600 dark:text-orange-400",
    chip: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  critical: {
    ring: "text-destructive",
    text: "text-destructive",
    chip: "bg-destructive/10 text-destructive",
  },
};

const FACTOR_ICON: Record<string, IconName> = {
  responsiveness: "Inbox",
  availability: "Calendar",
  listing: "Star",
  bookkeeping: "Wallet",
};

/** Score ring. Pure SVG — no chart library for one arc. */
function Ring({ score, tone }: { score: number | null; tone: string }) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className="relative grid h-[68px] w-[68px] shrink-0 place-items-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 68 68" aria-hidden>
        <circle cx="34" cy="34" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
        {score != null && (
          <circle
            cx="34"
            cy="34"
            r={r}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className={cn("transition-[stroke-dashoffset] duration-700", tone)}
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
          />
        )}
      </svg>
      <span className="absolute text-lg font-semibold tabular-nums">
        {score == null ? "—" : score}
      </span>
    </div>
  );
}

export function HealthPanel({
  health,
  isLoading,
  className,
}: {
  health: HealthResult | null;
  isLoading?: boolean;
  className?: string;
}) {
  if (isLoading) {
    return (
      <div className={cn("rounded-xl border bg-card p-5", className)}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-[68px] w-[68px] rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
      </div>
    );
  }

  if (!health) return null;

  const severity = health.severity ?? "needs-attention";
  const tone = TONE[severity];
  const unknownCount = health.unknownFactors.length;

  return (
    <section
      className={cn("rounded-xl border bg-card p-5", className)}
      aria-label="Your setup health"
    >
      <div className="flex items-start gap-4">
        <Ring score={health.score} tone={tone.ring} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Your setup</h2>
            {health.severity && (
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", tone.chip)}>
                {SEVERITY_LABEL[health.severity]}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{health.headline}</p>

          {health.nextAction && (
            <div className="mt-3">
              {health.nextAction.href ? (
                <Link href={health.nextAction.href}>
                  <Button size="sm">{health.nextAction.label}</Button>
                </Link>
              ) : (
                <Button size="sm" disabled>
                  {health.nextAction.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {health.factors.length > 0 && (
        <ul className="mt-4 grid gap-2 border-t pt-4 sm:grid-cols-2">
          {health.factors.map((f) => {
            const t = TONE[f.severity];
            const row = (
              <>
                <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full", t.chip)}>
                  <Icon name={FACTOR_ICON[f.key] ?? "Inbox"} size={13} />
                </span>
                <span className="min-w-0 flex-1 truncate text-left">{f.label}</span>
                {f.action && (
                  <Icon name="ChevronRight" size={14} className="shrink-0 text-muted-foreground" />
                )}
              </>
            );
            return (
              <li key={f.key} className="text-sm">
                {f.action && f.href ? (
                  // Only the factors with something to do are links. A healthy
                  // factor that navigates somewhere invites a pointless trip.
                  <Link
                    href={f.href}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent"
                  >
                    {row}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 px-2 py-1.5">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {unknownCount > 0 && (
        // Naming what we could not measure is the difference between a score
        // and a guess wearing a score's clothes.
        <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
          Based on {Math.round(health.coverage * 100)}% of the checks —{" "}
          {health.unknownFactors.join(", ")} couldn&apos;t be read just now.
        </p>
      )}
    </section>
  );
}

export default HealthPanel;
