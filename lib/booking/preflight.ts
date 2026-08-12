/**
 * Booking pre-flight — can a customer actually book this vendor right now?
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 *
 * `bookingCreateService` rejects a booking with eighteen different codes.
 * They fall into two groups, and the split is the whole point of this file:
 *
 *   RACES  — SLOT_CONFLICT, DAILY_CAPACITY_FULL, UNIT_POOL_FULL, DATE_BLOCKED…
 *            Someone else booked first. Nothing the vendor prepares can
 *            prevent these and they must be checked at confirm time.
 *
 *   SETUP  — VENDOR_NOT_PRICED, BUSINESS_NOT_BOOKABLE, SPACE_OVER_CAPACITY,
 *            SLOT_ENDS_AFTER_CLOSURE… Every one of these is knowable from the
 *            vendor's own data before a single customer opens the page, yet
 *            each was discovered at the customer's last step.
 *
 * The 10 PM closure bug was one of these: a slot the vendor had saved months
 * earlier, that no customer could ever complete, and the first anyone heard of
 * it was a stranger failing to pay. This file runs the SETUP rules where they
 * can still be acted on — against the vendor, in their dashboard, before
 * anyone arrives.
 *
 * ── Why it is pure ───────────────────────────────────────────────────────
 *
 * No fetching, no clock, no imports. Signals in, verdict out — so the rules
 * can be checked exhaustively without a server, and so the same function can
 * later run on the backend against the real row without drifting from what the
 * vendor was shown.
 *
 * `undefined` on any signal means NOT KNOWN — the check is skipped and named
 * in `unknown`, never failed. A pre-flight that invents blockers out of its
 * own ignorance is worse than none: it teaches vendors to ignore it.
 */

/** Wedding halls in Punjab must close by 10 PM; applied nationally. */
export const CLOSING_MINUTES = 22 * 60;
export const CLOSING_LABEL = "10 PM";

export type Blocker = "blocking" | "warning";

export interface PreflightIssue {
  key: string;
  severity: Blocker;
  /** Stated as a fact about the listing, never as a scolding. */
  title: string;
  /** What a customer experiences because of it — the reason to care. */
  consequence: string;
  /** The single next action. */
  action: string;
  href: string;
}

export interface SlotSignal {
  label?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  capacity?: number | null;
  isActive?: boolean | null;
  /** null = venue-wide. */
  subVenueId?: number | null;
}

export interface SpaceSignal {
  id: number;
  name?: string | null;
  capacity?: number | null;
}

export interface PreflightSignals {
  /** 'submitted' | 'approved' | 'draft' | 'suspended' | 'pending_review' */
  status?: string | null;
  /** Business.minimumPrice. 0/null means unpriced. */
  minimumPrice?: number | null;
  /** How many packages the business sells. */
  packageCount?: number;
  /** Every slot template across every scope. */
  slots?: SlotSignal[];
  /** The hall / floor / partition tree, flattened. */
  spaces?: SpaceSignal[];
}

/** "22:00" | "22:00:00" -> 1320. Anything unparseable -> null. */
export function parseHHMM(t: string | null | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t ?? ""));
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h > 23 || min > 59) return null;
  return h * 60 + min;
}

const fmt = (t: string | null | undefined): string => String(t ?? "").slice(0, 5);

/**
 * A vendor with no price and no package cannot be booked at all — the booking
 * page correctly offers "Ask for a price" instead of a wizard. That is right
 * for the customer and invisible to the vendor, who goes on believing they are
 * bookable. On production this is the largest single group by a wide margin.
 */
function priceIssue(s: PreflightSignals): PreflightIssue | null {
  if (s.minimumPrice === undefined && s.packageCount === undefined) return null;
  const priced = Number(s.minimumPrice ?? 0) > 0 || Number(s.packageCount ?? 0) > 0;
  if (priced) return null;
  return {
    key: "price",
    severity: "blocking",
    title: "You have no price and no packages",
    consequence:
      "Customers can't book you — your page offers them a quote request instead of a booking.",
    action: "Set a starting price or add a package",
    href: "/dashboard/settings",
  };
}

function statusIssue(s: PreflightSignals): PreflightIssue | null {
  if (s.status == null) return null;
  if (s.status === "approved") return null;
  if (s.status === "suspended") {
    return {
      key: "status",
      severity: "blocking",
      title: "This listing is suspended",
      consequence: "It does not appear in search and cannot take bookings.",
      action: "Contact support to resolve it",
      href: "/dashboard/settings",
    };
  }
  return {
    key: "status",
    severity: "warning",
    title: `Your listing is still "${s.status}"`,
    consequence: "Until it is approved, customers are unlikely to find you in search.",
    action: "Finish your listing so it can be reviewed",
    href: "/dashboard/settings",
  };
}

/**
 * Slots that end after closing time. These are the exact rows that produced
 * the original bug: visible to customers, impossible to pay for. Reported per
 * slot, because a vendor with one bad row out of six needs to know which.
 */
function closureIssues(s: PreflightSignals): PreflightIssue[] {
  if (!s.slots) return [];
  return s.slots
    .filter((sl) => sl.isActive !== false)
    .filter((sl) => {
      const end = parseHHMM(sl.endTime);
      return end != null && end > CLOSING_MINUTES;
    })
    .map((sl) => ({
      key: `closure:${sl.label ?? fmt(sl.startTime)}`,
      severity: "blocking" as const,
      title: `"${sl.label || "A slot"}" ends after ${CLOSING_LABEL} (${fmt(sl.startTime)}–${fmt(sl.endTime)})`,
      consequence:
        "Customers can see this time and pick it, but the booking is refused when they try to pay.",
      action: `Change the end time to ${CLOSING_LABEL} or earlier`,
      href: "/dashboard/venue-os?tab=spaces",
    }));
}

/** A slot that takes zero bookings is on display and unbookable. */
function capacityIssues(s: PreflightSignals): PreflightIssue[] {
  if (!s.slots) return [];
  return s.slots
    .filter((sl) => sl.isActive !== false && sl.capacity != null && Number(sl.capacity) < 1)
    .map((sl) => ({
      key: `capacity:${sl.label ?? fmt(sl.startTime)}`,
      severity: "blocking" as const,
      title: `"${sl.label || "A slot"}" takes 0 bookings at once`,
      consequence: "Customers see the time offered but it is always full.",
      action: "Set how many bookings it can take",
      href: "/dashboard/venue-os?tab=spaces",
    }));
}

/**
 * No live slot anywhere. Note this is a WARNING, not a blocker: a venue that
 * defines no templates falls back to the four canonical periods, so it is
 * still bookable — just on our defaults rather than its own hours.
 */
function slotIssue(s: PreflightSignals): PreflightIssue | null {
  if (!s.slots) return null;
  if (s.slots.length === 0) {
    return {
      key: "slots-none",
      severity: "warning",
      title: "You haven't set your own booking times",
      consequence:
        "Customers are offered our standard four — Whole day, Day, Midday and Evening — which may not match how you actually sell.",
      action: "Set your booking times",
      href: "/dashboard/venue-os?tab=spaces",
    };
  }
  if (s.slots.every((sl) => sl.isActive === false)) {
    return {
      key: "slots-all-hidden",
      severity: "blocking",
      title: "Every one of your booking times is hidden",
      consequence: "There is no time a customer can choose, so nothing can be booked.",
      action: "Turn at least one back on",
      href: "/dashboard/venue-os?tab=spaces",
    };
  }
  return null;
}

/** A hall that holds nobody fails SPACE_OVER_CAPACITY for every guest count. */
function spaceIssues(s: PreflightSignals): PreflightIssue[] {
  if (!s.spaces) return [];
  return s.spaces
    .filter((sp) => sp.capacity != null && Number(sp.capacity) < 1)
    .map((sp) => ({
      key: `space:${sp.id}`,
      severity: "blocking" as const,
      title: `"${sp.name || "A space"}" has no guest capacity`,
      consequence: "Any booking for this space is refused, whatever the guest count.",
      action: "Set how many guests it holds",
      href: "/dashboard/venue-os?tab=spaces",
    }));
}

export interface PreflightResult {
  /** True only when nothing blocking was found AND something was checked. */
  bookable: boolean | null;
  /** One sentence, stating the position. */
  headline: string;
  issues: PreflightIssue[];
  blocking: PreflightIssue[];
  warnings: PreflightIssue[];
  /** Checks we had no signal for. Named, not hidden. */
  unknown: string[];
}

const ALL_CHECKS = ["price", "status", "slots", "spaces"] as const;

export function preflight(s: PreflightSignals): PreflightResult {
  const unknown: string[] = [];
  if (s.minimumPrice === undefined && s.packageCount === undefined) unknown.push("price");
  if (s.status == null) unknown.push("status");
  if (!s.slots) unknown.push("slots");
  if (!s.spaces) unknown.push("spaces");

  const issues: PreflightIssue[] = [
    priceIssue(s),
    statusIssue(s),
    slotIssue(s),
    ...closureIssues(s),
    ...capacityIssues(s),
    ...spaceIssues(s),
  ].filter((i): i is PreflightIssue => i !== null);

  const blocking = issues.filter((i) => i.severity === "blocking");
  const warnings = issues.filter((i) => i.severity === "warning");

  // Nothing checked means nothing known. Saying "you're bookable" here would
  // be a claim we cannot support, and it is the claim that costs the vendor.
  if (unknown.length === ALL_CHECKS.length) {
    return {
      bookable: null,
      headline: "Couldn't check your booking setup just now.",
      issues: [],
      blocking: [],
      warnings: [],
      unknown,
    };
  }

  const headline = blocking.length
    ? blocking.length === 1
      ? "One thing is stopping customers booking you."
      : `${blocking.length} things are stopping customers booking you.`
    : warnings.length
      ? "Customers can book you. A few things are worth tidying."
      : "Customers can book you — nothing is in the way.";

  return { bookable: blocking.length === 0, headline, issues, blocking, warnings, unknown };
}
