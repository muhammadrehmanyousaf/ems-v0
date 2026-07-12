/**
 * Shaadi Plan — display metadata for wedding event types + plan-item
 * statuses. Kept out of the API client so both the builder screens and
 * the dialogs share one source of truth for labels, ordering, and chip
 * styling (bridal design tokens).
 */

import type { WeddingEventType, PlanItemStatus } from "@/lib/api/weddingPlans";

export interface EventTypeMeta {
  value: WeddingEventType;
  label: string;
  /** Canonical cultural order (Dholki → … → Reception) for display sort. */
  order: number;
  /** One-liner used in the add-event picker. */
  hint: string;
}

/**
 * Canonical Pakistani wedding running order. `sortOrder` from the BE
 * wins; this is the tiebreak + the default running order in the picker.
 */
export const EVENT_TYPES: EventTypeMeta[] = [
  { value: "dholki", label: "Dholki", order: 1, hint: "Pre-wedding song & dhol nights at home" },
  { value: "mayoun", label: "Mayoun", order: 2, hint: "Ubtan / haldi ceremony before the wedding" },
  { value: "mehndi", label: "Mehndi", order: 3, hint: "Henna night — often bride & groom sides" },
  { value: "nikah", label: "Nikah", order: 4, hint: "The religious marriage ceremony" },
  { value: "baraat", label: "Baraat", order: 5, hint: "The groom's procession & main wedding day" },
  { value: "walima", label: "Walima", order: 6, hint: "The reception hosted by the groom's family" },
  { value: "reception", label: "Reception", order: 7, hint: "A separate reception / valima-style dinner" },
  { value: "other", label: "Other function", order: 8, hint: "Qawwali night, rasm-e-heena, sangeet, etc." },
];

const BY_VALUE: Record<string, EventTypeMeta> = Object.fromEntries(
  EVENT_TYPES.map((e) => [e.value, e]),
);

export function eventTypeLabel(type: string | null | undefined): string {
  if (!type) return "Function";
  return BY_VALUE[type]?.label ?? type.charAt(0).toUpperCase() + type.slice(1);
}

export function eventTypeOrder(type: string | null | undefined): number {
  if (!type) return 99;
  return BY_VALUE[type]?.order ?? 90;
}

// ---------------------------------------------------------------------------
// Plan-item status chips
// ---------------------------------------------------------------------------

export interface StatusMeta {
  label: string;
  /** Tailwind classes for a Badge (border/bg/text) in bridal tokens. */
  tone: string;
}

export const ITEM_STATUS_META: Record<PlanItemStatus, StatusMeta> = {
  shortlisted: {
    label: "Shortlisted",
    tone: "border-bridal-beige bg-bridal-cream text-bridal-text-soft",
  },
  inquiry_sent: {
    label: "Inquiry sent",
    tone: "border-bridal-rose/45 bg-bridal-blush text-bridal-mauve",
  },
  quoted: {
    label: "Quoted",
    tone: "border-bridal-gold/45 bg-bridal-gold/12 text-bridal-gold-dark",
  },
  booked: {
    label: "Booked",
    tone: "border-bridal-sage/45 bg-bridal-sage/15 text-[#3F6B43]",
  },
  declined: {
    label: "Declined",
    tone: "border-bridal-coral/35 bg-bridal-coral/12 text-bridal-coral",
  },
  removed: {
    label: "Removed",
    tone: "border-bridal-beige bg-bridal-cream text-bridal-text-soft",
  },
};

export function statusMeta(status: string): StatusMeta {
  return (
    ITEM_STATUS_META[status as PlanItemStatus] ?? {
      label: status,
      tone: "border-bridal-beige bg-bridal-cream text-bridal-text-soft",
    }
  );
}

/** Money coercion — PG DECIMAL arrives as a string via Sequelize. */
export function toNum(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Rs. formatter matching the umbrella screens. */
export function fmtPKR(v: number | string | null | undefined): string {
  return `Rs. ${toNum(v).toLocaleString("en-PK")}`;
}

export function fmtPlanDate(s: string | null | undefined): string {
  if (!s) return "Date TBD";
  try {
    // These are DATEONLY ("YYYY-MM-DD") values. `new Date("YYYY-MM-DD")`
    // parses as UTC midnight, so sub-UTC (Americas/diaspora) viewers would
    // see the previous calendar day. Parse the date parts as LOCAL so every
    // viewer sees the Pakistan-correct day; fall back to native parsing for
    // any non date-only string.
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
    const d = m
      ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
      : new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return s;
  }
}
