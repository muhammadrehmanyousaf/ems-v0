/**
 * What a business's `status` means, in words a vendor can act on.
 *
 * The portal used to print the raw column ("Lahore, submitted"), which tells a
 * vendor nothing: not what is pending, who is looking at it, or what to do next.
 * This is the ONE place those words live, so the venue switcher, Business
 * settings and the Add a business screen cannot drift apart.
 *
 * Two statuses read alike and are NOT interchangeable (see
 * ems-v0-backend/src/utils/businessStatusGate.js):
 *
 *   pending_review  a business the vendor added from the portal. Hidden from the
 *                   public catalog and unbookable until an admin approves it.
 *   submitted       registered through the public sign-up form (or imported). It
 *                   is in the admin queue, but the catalog does NOT hide it. So
 *                   the copy for `submitted` never claims "hidden" or "cannot
 *                   take bookings"; that would be untrue for most of them.
 */

import type { BusinessStatus } from "@/lib/api/adminQueue"

export type StatusTone = "ok" | "warn" | "bad" | "muted"

export interface BusinessStatusInfo {
  /** Short chip text. */
  label: string
  /** The line that opens a status note: what stage the business is at. */
  headline: string
  tone: StatusTone
  /** True while our team still has to make a decision. */
  inReview: boolean
  /** One line, for a tooltip or a list row. */
  summary: string
  /** The full explanation: what it means, who decides, what to do next. */
  detail: string
}

const INFO: Record<BusinessStatus, BusinessStatusInfo> = {
  approved: {
    label: "Live",
    headline: "Live",
    tone: "ok",
    inReview: false,
    summary: "Approved by our team.",
    detail: "Our team has approved this business. Couples can find it and send you enquiries and bookings.",
  },
  pending_review: {
    label: "Under review",
    headline: "Submitted, under review",
    tone: "warn",
    inReview: true,
    summary: "Submitted. Our team is reviewing it.",
    detail:
      "You submitted this business from your portal. Our team checks every new business before couples can see it. " +
      "Until it is approved it is hidden from search and cannot take bookings. " +
      "We will tell you in the app and by email when it is approved, or if we need something changed. " +
      "You do not need to submit it again. Meanwhile you can add photos, packages and prices in Business settings.",
  },
  submitted: {
    label: "Under review",
    headline: "Submitted, under review",
    tone: "warn",
    inReview: true,
    summary: "Submitted. Waiting for our team's review.",
    detail:
      "We have received this business and it is waiting in our team's review queue. " +
      "We will contact you in the app and by email if we need anything, and when the review is done. " +
      "You do not need to submit it again.",
  },
  draft: {
    label: "Needs changes",
    headline: "Needs changes",
    tone: "warn",
    inReview: false,
    summary: "Not with our team yet, or changes were requested.",
    detail:
      "This business is saved but is not waiting for review. If our team asked for changes, " +
      "check your notifications and email for what to update.",
  },
  rejected: {
    label: "Not approved",
    headline: "Not approved",
    tone: "bad",
    inReview: false,
    summary: "Our team did not approve this business.",
    detail:
      "Our team did not approve this business. Check your email for the reason, " +
      "update the details and contact support if you think this is a mistake.",
  },
  suspended: {
    label: "Suspended",
    headline: "Suspended",
    tone: "bad",
    inReview: false,
    summary: "No longer listed.",
    detail: "This business has been suspended and is no longer listed. Contact support if you think this is a mistake.",
  },
}

/** `null` for a row with no (or an unknown) status: show nothing rather than guess. */
export function businessStatusInfo(status: string | null | undefined): BusinessStatusInfo | null {
  if (!status) return null
  return (INFO as Record<string, BusinessStatusInfo>)[status] ?? null
}

/** `subBusinessType` is a Postgres array but older typings say string. Take the first label. */
export function firstLabel(v: unknown): string {
  if (Array.isArray(v)) return v.length && v[0] != null ? String(v[0]).trim() : ""
  return typeof v === "string" ? v.trim() : ""
}

interface BizLike {
  city?: string | null
  subArea?: string | null
  subBusinessType?: unknown
  vendor?: { vendorType?: string | null } | null
}

/**
 * The line under a business name wherever businesses are listed, so two
 * businesses with similar names can be told apart: "Marquee · Lahore · Gulberg".
 * Type first (venue type, else the account's business type), then where it is.
 */
export function businessSubtitle(b: BizLike): string {
  const type = firstLabel(b.subBusinessType) || (b.vendor?.vendorType ?? "")
  return [type, b.city, b.subArea].map((x) => (x ?? "").toString().trim()).filter(Boolean).join(" · ")
}
