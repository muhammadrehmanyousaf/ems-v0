/**
 * Which banner (if any) the console shows for a given Access. PURE: scripts/plans-wall-check.mts walks every state and
 * every day of a trial through it.
 *
 * The rules (PLANS-SPEC / PLANS-RESEARCH B3.4, B4.1, C2, C6):
 *   trialing   welcome once; then quiet until 7 days are left; T-7 (7..4), T-3 (3..2), T-1 (1), and the last day.
 *   past_due   red, always, with the exact grace end and a Pay now button.
 *   cancelling info, with the exact date access ends and a Resume button.
 *   comp       a note in the last 7 days.
 *   locked...  on the few pages that stay open while locked (billing, account): a red line saying so.
 * and the quiet chip for a trial / past due / cancelling is always there (chipFor).
 */

import { daysLeftOf, fmtPkDate, fmtPkDateTime, fmtPkDateTimeRu, isLockedState, type Access } from "./access"
import type { CopyKey, CopyVars } from "./copy"

export type BannerTone = "info" | "accent" | "warn" | "bad" | "ok"
export type BannerCta = "choose" | "pay" | "resume" | "renew" | "over"

export interface BannerSpec {
  kind: "trial_welcome" | "trial_t7" | "trial_t3" | "trial_t1" | "trial_today" | "past_due" | "cancelling" | "comp_end" | "locked_here" | "reactivated" | "over_limit"
  tone: BannerTone
  /** Copy ladder (first with all placeholders filled wins) and the values, per language (dates are spoken per language). */
  keys: CopyKey[]
  vars: (lang: "en" | "ru") => CopyVars
  cta: BannerCta | null
  /** "day": hidden until tomorrow once dismissed. "once": never again. null: cannot be dismissed. */
  dismiss: "day" | "once" | null
}

const dt = (iso: string | null, lang: "en" | "ru") => (lang === "ru" ? fmtPkDateTimeRu(iso) : fmtPkDateTime(iso)) || null

/** The trial's last moment, spoken exactly. */
const trialVars = (a: Access, days: number | null) => (lang: "en" | "ru"): CopyVars => ({
  planName: a.planName, trialEnd: dt(a.trialEndsAt ?? a.endsAt, lang), days,
})

type BannerOpts = { welcomeSeen?: boolean; onPaymentPage?: boolean; wasLocked?: boolean; overLimit?: boolean }

/** The banner for the plan state, else (lowest priority) the over-the-limit one. */
export function bannerFor(a: Access | null, now: Date = new Date(), opts: BannerOpts = {}): BannerSpec | null {
  const s = stateBanner(a, now, opts)
  if (s || !a || a.staff || isLockedState(a.state)) return s
  return opts.overLimit && !opts.onPaymentPage ? { kind: "over_limit", tone: "warn", keys: ["over.banner"], vars: () => ({}), cta: "over", dismiss: "day" } : null
}

function stateBanner(a: Access | null, now: Date, opts: BannerOpts): BannerSpec | null {
  if (!a) return null
  if (a.staff) return null
  const end = a.trialEndsAt ?? a.endsAt
  if (a.state === "trialing") {
    const days = daysLeftOf(a, end, now)
    if (days !== null && days <= 0) return { kind: "trial_today", tone: "bad", keys: ["trial.today"], vars: trialVars(a, days), cta: "choose", dismiss: null }
    if (days !== null && days === 1) return { kind: "trial_t1", tone: "bad", keys: ["trial.t1"], vars: trialVars(a, days), cta: "choose", dismiss: null }
    if (days !== null && days <= 3) return { kind: "trial_t3", tone: "warn", keys: ["trial.t3"], vars: trialVars(a, days), cta: "choose", dismiss: "day" }
    if (days !== null && days <= 7) return { kind: "trial_t7", tone: "accent", keys: ["trial.t7"], vars: trialVars(a, days), cta: "choose", dismiss: "day" }
    if (!opts.welcomeSeen) return { kind: "trial_welcome", tone: "accent", keys: ["trial.welcome"], vars: trialVars(a, days), cta: null, dismiss: "once" }
    return null
  }
  if (a.state === "past_due") {
    return {
      kind: "past_due", tone: "bad", keys: ["past_due.banner", "past_due.banner_nodate"],
      vars: (lang) => ({ graceEnd: dt(a.graceEndsAt ?? a.endsAt, lang) }), cta: a.canPay ? "pay" : null, dismiss: null,
    }
  }
  if (a.state === "cancelling") {
    return { kind: "cancelling", tone: "info", keys: ["cancelling.banner"], vars: () => ({ date: fmtPkDate(a.endsAt) || null }), cta: a.canPay ? "resume" : null, dismiss: "day" }
  }
  if (a.state === "comp") {
    const days = daysLeftOf(a, a.endsAt, now)
    if (days !== null && days <= 7) return { kind: "comp_end", tone: days <= 1 ? "warn" : "info", keys: ["comp.banner"], vars: () => ({ date: fmtPkDate(a.endsAt) || null }), cta: "choose", dismiss: days <= 1 ? null : "day" }
    return null
  }
  if (isLockedState(a.state)) {
    // Only reachable on the pages that stay open while locked (billing, account). The billing page says it itself, in a card.
    if (opts.onPaymentPage) return null
    return { kind: "locked_here", tone: "bad", keys: ["banner.locked_here"], vars: () => ({}), cta: a.canPay ? "renew" : null, dismiss: null }
  }
  if (opts.wasLocked) return { kind: "reactivated", tone: "ok", keys: ["banner.reactivated"], vars: () => ({}), cta: null, dismiss: "once" }
  return null
}

export interface ChipSpec { tone: "ok" | "warn" | "bad"; key: CopyKey; vars: CopyVars }

/** The quiet always-there chip. null when nothing is worth saying (an active paid plan says nothing). */
export function chipFor(a: Access | null, now: Date = new Date()): ChipSpec | null {
  if (!a || a.staff) return null
  if (a.state === "trialing") {
    const days = daysLeftOf(a, a.trialEndsAt ?? a.endsAt, now)
    if (days === null) return { tone: "ok", key: "chip.trial_nodays", vars: {} }
    if (days <= 0) return { tone: "bad", key: "chip.trial_0", vars: {} }
    if (days === 1) return { tone: "bad", key: "chip.trial_1", vars: {} }
    return { tone: days <= 3 ? "warn" : "ok", key: "chip.trial", vars: { days } }
  }
  if (a.state === "past_due") return { tone: "bad", key: "chip.past_due", vars: {} }
  if (a.state === "cancelling") return { tone: "warn", key: "chip.cancelling", vars: { date: fmtPkDate(a.endsAt) || null } }
  if (a.state === "comp") return { tone: "ok", key: "chip.comp", vars: {} }
  return null
}
