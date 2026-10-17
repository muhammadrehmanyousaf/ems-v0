/**
 * What the Wall says and offers for a given Access. PURE (no React): scripts/plans-wall-check.mts runs every state through
 * it. The Wall component only draws what this returns, so a rule such as "staff never see a pay button" or "a suspended
 * account has no renew button" lives in ONE place and is tested there.
 */

import { fmtPkDate, type Access } from "./access"
import type { CopyKey, CopyVars } from "./copy"

export type WallVariant =
  | "trial_ended" | "plan_ended" | "payment_failed" | "cancelled" | "no_plan"
  | "dormant" | "closed" | "suspended" | "staff"

export type WallCta = "renew" | "choose" | "none"

export interface WallModel {
  variant: WallVariant
  /** Eyebrow above the title. */
  eyebrow: CopyKey
  title: CopyKey
  /** Body sentences in order of preference: the first whose placeholders are all known is used. */
  body: CopyKey[]
  /** The primary action. "none" for staff and for a suspended account. */
  cta: WallCta
  /** Offer the bank / JazzCash / Easypaisa route (only to someone who can pay). */
  manual: boolean
  /** Show "your data is safe, kept until ..." (always, except staff who are not the data's owner). */
  safe: boolean
  /** Show the obligations strip, the export button and the missed-enquiries line (owner only). */
  owner: boolean
  /** Show support contact as the main action (suspended and closed). */
  supportFirst: boolean
  /** The "N enquiries came in while paused, renew to see them" line: only to someone who can renew. */
  missed: boolean
  /** The obligations strip says "plan is paused" or, for a suspended account, "account is on hold". */
  onHold: boolean
}

export function planNameFor(a: Access): string | null {
  return a.planName
}

export function wallVars(a: Access, extra: CopyVars = {}): CopyVars {
  return {
    planName: a.planName,
    lockedDate: fmtPkDate(a.lockedAt) || null,
    retainUntil: fmtPkDate(a.retainUntil) || null,
    owner: a.ownerMasked,
    ...extra,
  }
}

export function wallModel(a: Access): WallModel {
  if (a.staff) {
    return { variant: "staff", eyebrow: "wall.eyebrow.locked", title: "wall.staff.title", body: ["wall.staff.body"], cta: "none", manual: false, safe: false, owner: false, supportFirst: false, missed: false, onHold: false }
  }
  if (a.state === "suspended_admin") {
    return { variant: "suspended", eyebrow: "wall.eyebrow.suspended", title: "wall.suspended.title", body: ["wall.suspended.body"], cta: "none", manual: false, safe: true, owner: true, supportFirst: true, missed: false, onHold: true }
  }
  const cta = (v: WallVariant): WallCta => (!a.canPay ? "none" : v === "trial_ended" || v === "no_plan" || !a.planName ? "choose" : "renew")
  const base = { eyebrow: "wall.eyebrow.locked" as CopyKey, manual: a.canPay, safe: true, owner: true, supportFirst: false, missed: a.canPay, onHold: false }
  if (a.state === "closed") return { ...base, variant: "closed", title: "wall.closed.title", body: ["wall.closed.body"], cta: cta("closed"), supportFirst: true }
  if (a.state === "dormant") return { ...base, variant: "dormant", title: "wall.dormant.title", body: ["wall.dormant.body"], cta: cta("dormant") }
  const reason = (a.lockReason || "").toLowerCase()
  if (reason === "trial_ended" || reason === "trial") return { ...base, variant: "trial_ended", title: "wall.trial_ended.title", body: ["wall.trial_ended.body"], cta: cta("trial_ended") }
  if (reason === "payment_failed" || reason === "grace_ended") return { ...base, variant: "payment_failed", title: "wall.payment_failed.title", body: ["wall.payment_failed.body"], cta: cta("payment_failed") }
  if (reason === "cancelled" || reason === "canceled") return { ...base, variant: "cancelled", title: "wall.cancelled.title", body: ["wall.cancelled.body"], cta: cta("cancelled") }
  if (reason === "no_plan" || (!a.planName && !reason)) return { ...base, variant: "no_plan", title: "wall.no_plan.title", body: ["wall.no_plan.body"], cta: cta("no_plan") }
  // plan_ended, or a reason this build does not know: the safe, true sentence for a plan that is over.
  return a.planName
    ? { ...base, variant: "plan_ended", title: "wall.plan_ended.title", body: ["wall.plan_ended.body", "wall.plan_ended.body_nodate"], cta: cta("plan_ended") }
    : { ...base, variant: "trial_ended", title: "wall.trial_ended.title", body: ["wall.trial_ended.body"], cta: cta("trial_ended") }
}
