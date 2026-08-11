/**
 * Business health — score what the vendor CONTROLS, never how busy they are.
 *
 * ── The rule this file exists to enforce ─────────────────────────────────
 *
 * A vendor in a quiet month must never be told they are "Critical". Wedding
 * demand in Pakistan is violently seasonal — a marquee owner can have zero
 * bookings through Muharram and be running a perfectly healthy business. A
 * score that counts bookings would light up red every year for reasons the
 * vendor cannot act on, and a red light you cannot act on is noise you learn
 * to ignore. That is worse than no score at all.
 *
 * So every signal below is a thing the vendor can change this afternoon:
 * answer the enquiry, publish the calendar, finish the listing, record the
 * payment. Volume is deliberately absent.
 *
 * ── Why it is pure ───────────────────────────────────────────────────────
 *
 * No fetching, no dates read from the clock, no imports. Everything arrives in
 * `signals`, including `now`. That makes every verdict reproducible and lets
 * the tests assert monotonicity — improving an input can never lower a score.
 */

export type Severity = "healthy" | "needs-attention" | "at-risk" | "critical"

/** One thing the vendor can act on. */
export interface HealthFactor {
  key: string
  /** What the vendor sees. Written as a fact, not a scolding. */
  label: string
  severity: Severity
  /** 0..1 — how much of this factor's weight was earned. */
  earned: number
  weight: number
  /** The single next action, or null when there is nothing to do. */
  action: string | null
  href?: string
}

export interface HealthSignals {
  /** Enquiries with no vendor reply, and the oldest one's age in hours. */
  unansweredEnquiries: number
  oldestUnansweredHours: number | null
  /** Has the vendor published availability for any future date? */
  hasPublishedAvailability: boolean
  /** 0..1 — how much of the listing is filled in. */
  profileCompleteness: number
  /** Confirmed bookings whose money was never recorded. */
  bookingsMissingPayment: number
  /** Bookings sitting in a state that needs a decision (hold expiring, etc). */
  bookingsAwaitingAction: number
  /** Does the vendor have a business listing at all? */
  hasBusiness: boolean
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : Number.isFinite(n) ? n : 0)

/**
 * Severity from earned fraction. Thresholds are deliberately forgiving at the
 * top: 80% earned is "healthy", because a vendor who has done nearly everything
 * should not be nagged about the remainder.
 */
function severityOf(earned: number): Severity {
  if (earned >= 0.8) return "healthy"
  if (earned >= 0.55) return "needs-attention"
  if (earned >= 0.3) return "at-risk"
  return "critical"
}

/**
 * Responsiveness. The clock matters more than the count: one enquiry ignored
 * for three days is a worse signal than five that came in this morning.
 */
function responsiveness(s: HealthSignals): HealthFactor {
  const n = Math.max(0, s.unansweredEnquiries)
  const hours = s.oldestUnansweredHours
  let earned = 1
  if (n > 0) {
    // Nothing is overdue until 24h — vendors are not a call centre and should
    // not be marked down for sleeping.
    const age = hours == null ? 0 : Math.max(0, hours - 24)
    earned = clamp01(1 - age / 96) // fully lapsed five days after the grace period
  }
  return {
    key: "responsiveness",
    label:
      n === 0
        ? "Every enquiry has a reply"
        : `${n} enquir${n === 1 ? "y" : "ies"} waiting on you`,
    severity: severityOf(earned),
    earned,
    weight: 30,
    action: n === 0 ? null : "Reply to the oldest enquiry",
    href: "/dashboard/leads",
  }
}

function availability(s: HealthSignals): HealthFactor {
  const earned = s.hasPublishedAvailability ? 1 : 0
  return {
    key: "availability",
    label: s.hasPublishedAvailability
      ? "Your calendar is published"
      : "No availability published",
    severity: severityOf(earned),
    earned,
    weight: 25,
    action: s.hasPublishedAvailability
      ? null
      : "Publish your available dates so customers can book",
    href: "/dashboard/availability",
  }
}

function listing(s: HealthSignals): HealthFactor {
  const earned = clamp01(s.profileCompleteness)
  return {
    key: "listing",
    label:
      earned >= 0.8
        ? "Your listing is complete"
        : `Your listing is ${Math.round(earned * 100)}% complete`,
    severity: severityOf(earned),
    earned,
    weight: 25,
    action: earned >= 0.8 ? null : "Finish your listing — it decides where you rank",
    href: "/dashboard/settings",
  }
}

function bookkeeping(s: HealthSignals): HealthFactor {
  const missing = Math.max(0, s.bookingsMissingPayment)
  const pending = Math.max(0, s.bookingsAwaitingAction)
  const open = missing + pending
  // Forgiving curve: one loose end is normal bookkeeping, not a crisis.
  const earned = open === 0 ? 1 : clamp01(1 - (open - 1) / 8)
  return {
    key: "bookkeeping",
    label:
      open === 0
        ? "Your bookings are all up to date"
        : `${open} booking${open === 1 ? "" : "s"} need${open === 1 ? "s" : ""} attention`,
    severity: severityOf(earned),
    earned,
    weight: 20,
    action: open === 0 ? null : "Record the missing payments",
    href: "/dashboard/bookings",
  }
}

export interface HealthResult {
  score: number
  severity: Severity
  /** One sentence. States the position; never lectures. */
  headline: string
  factors: HealthFactor[]
  /** The single highest-value thing to do next, or null when all clear. */
  nextAction: { label: string; href?: string } | null
}

export function computeHealth(s: HealthSignals): HealthResult {
  // A vendor with no business has no meaningful score — everything else is
  // downstream of that one act. Reporting 0/100 here would read as a judgement
  // on them rather than a prompt.
  if (!s.hasBusiness) {
    return {
      score: 0,
      severity: "critical",
      headline: "Create your business listing to get started.",
      factors: [],
      nextAction: { label: "Create a business", href: "/dashboard/business/new" },
    }
  }

  const factors = [responsiveness(s), availability(s), listing(s), bookkeeping(s)]
  const totalWeight = factors.reduce((t, f) => t + f.weight, 0)
  const score = Math.round(
    factors.reduce((t, f) => t + f.earned * f.weight, 0) / totalWeight * 100,
  )
  const severity = severityOf(score / 100)

  // Rank by unearned weight: the factor where the most points are actually
  // recoverable, not merely the worst-looking one.
  const worst = factors
    .filter((f) => f.action)
    .sort((a, b) => (1 - b.earned) * b.weight - (1 - a.earned) * a.weight)[0]

  const headline =
    severity === "healthy"
      ? "Everything a customer needs from you is in place."
      : worst
        ? worst.label
        : "A few things are worth tidying up."

  return {
    score,
    severity,
    headline,
    factors,
    nextAction: worst ? { label: worst.action as string, href: worst.href } : null,
  }
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  healthy: "Healthy",
  "needs-attention": "Needs attention",
  "at-risk": "At risk",
  critical: "Critical",
}
