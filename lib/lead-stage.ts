/**
 * How a lead's stage is WORDED to the vendor, and what colour it wears.
 *
 * Leads and bookings are different records with different lifecycles, and the
 * portal words them differently on purpose — a lead is "Naya / Raabta hua /
 * Quote bheja", a booking is "Pending approval / Confirmed". What matters is
 * that each record type has exactly ONE vocabulary wherever it appears. The
 * Leads screen owned this table privately, so the Overview printed the raw
 * stored value ("New") beside a screen that says "Naya". It lives here now and
 * both read it.
 *
 * `LeadStatus` values are the stored ones (backend LEAD_STATUSES).
 */

export type LeadStageKey = "new" | "contacted" | "qualified" | "quoted" | "booked" | "lost" | "archived";

export interface LeadStage {
  label: string;
  tone: "info" | "warn" | "ok" | "bad" | "mut";
  /** The Leads screen's filter tab this stage belongs to. */
  tab: string;
}

export const LEAD_STAGE: Record<LeadStageKey, LeadStage> = {
  new: { label: "Naya", tone: "info", tab: "new" },
  contacted: { label: "Raabta hua", tone: "warn", tab: "contacted" },
  qualified: { label: "Visit tay", tone: "info", tab: "qualified" },
  quoted: { label: "Quote bheja", tone: "warn", tab: "quoted" },
  booked: { label: "Jeeta", tone: "ok", tab: "booked" },
  lost: { label: "Khoya", tone: "bad", tab: "lost" },
  archived: { label: "Archive", tone: "mut", tab: "archived" },
};

/** Unknown / missing stage reads as a new enquiry, exactly as the Leads screen does. */
export function leadStageOf(status?: string | null): LeadStage {
  return LEAD_STAGE[(status || "new") as LeadStageKey] || LEAD_STAGE.new;
}
