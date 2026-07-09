/**
 * Phase-1 navigation foundation — adaptive persona + Roman-Urdu labels.
 *
 * Pakistani wedding vendors are not one audience: a 55-year-old marquee malik
 * and a 22-year-old studio manager should NOT see the same words. At sign-up we
 * ask "Aap in systems se waqif hain? / Are you familiar with such software?":
 *   - No  -> "Aasaan"        (plain Roman-Urdu, layman words, essentials only)
 *   - Yes -> "Professional"  (standard industry English, full feature set)
 * Switchable anytime in Settings.
 *
 * This module is the single source of truth for that choice and for the
 * bilingual label of every nav destination. It is ADDITIVE and imports nothing
 * from the render tree — the live sidebar keeps its current labels until a
 * screen opts in (behind NEXT_PUBLIC_NAV_V2). Nothing here changes production
 * behaviour on its own.
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type NavPersona = "aasaan" | "professional"

/** A label that reads correctly for either persona. */
export interface DualLabel {
  /** Plain Roman-Urdu, layman. */
  simple: string
  /** Standard industry English. */
  pro: string
}

const L = (simple: string, pro: string): DualLabel => ({ simple, pro })

/**
 * Canonical bilingual labels, keyed by the nav item `name` used in
 * `components/dashboard/layout/nav-data.ts` (and the group headings). This is
 * the dictionary the redesigned sidebar / bottom-tabs read through
 * `navLabel(name, persona)` — it never renames a route, only the words shown.
 */
export const NAV_LABELS: Record<string, DualLabel> = {
  // ── Group headings (the approved 5 groups) ─────────────────────────────
  "group.aaj": L("Aaj", "Overview"),
  "group.booking": L("Booking", "Bookings"),
  "group.paisa": L("Paisa", "Money"),
  "group.business": L("Mera Business", "My Business"),
  "group.grow": L("Barhao", "Grow"),
  "group.settings": L("Settings", "Settings"),

  // ── Vendor destinations (keys = nav-data item names) ───────────────────
  Dashboard: L("Ghar", "Dashboard"),
  Today: L("Aaj", "Today"),
  "Lead inbox": L("Naye Rabtay", "Enquiries"),
  Bookings: L("Booking", "Bookings"),
  "Function sheets": L("Event Parchi", "Quotes & Invoices"),
  Customers: L("Grahak", "Customers"),
  Calendar: L("Khali Tareekhein", "Calendar"),
  Conversations: L("Baat Cheet", "Messages"),
  Payments: L("Aya Paisa", "Payments"),
  Receivables: L("Baqaya", "Receivables"),
  Receipts: L("Raseed", "Receipts"),
  "Cheque ledger": L("Cheque", "Cheques"),
  Expenses: L("Kharcha", "Expenses"),
  Inventory: L("Saman", "Inventory"),
  "Staff & payroll": L("Staff", "Staff & Payroll"),
  Suppliers: L("Udhaar", "Suppliers"),
  Brokers: L("Broker", "Brokers"),
  "Generator fuel": L("Diesel", "Generator Fuel"),
  "Halal certs": L("Halal Sartifikate", "Halal Certificates"),
  "Drone NOC": L("Drone Ijazat", "Drone NOC"),
  Reviews: L("Raaye", "Reviews"),
  Notifications: L("Ittila", "Notifications"),
  Promote: L("Mashhoori", "Promote"),
  "Plan & billing": L("Mera Plan", "Plan & Billing"),
  Collaborations: L("Partner", "Collaborations"),
  "Business Settings": L("Business Settings", "Business Settings"),
  "Venue-OS": L("Meri Venues", "Venues"),

  // ── Existing sidebar group headings (so NAV_V2 can restyle them too) ────
  Main: L("Aaj", "Overview"),
  Khata: L("Paisa", "Money"),
  Operations: L("Kaam", "Operations"),
  Grow: L("Barhao", "Grow"),
  "My Business": L("Mera Business", "My Business"),
}

/** Resolve a bilingual label for the active persona; falls back to the raw key. */
export function navLabel(name: string, persona: NavPersona): string {
  const entry = NAV_LABELS[name]
  if (!entry) return name
  return persona === "professional" ? entry.pro : entry.simple
}

interface NavPersonaState {
  /** Vocabulary register — set at onboarding, switchable in Settings. */
  persona: NavPersona
  /** Simple (essentials only) vs Full (advanced modules revealed). */
  full: boolean
  /** Whether the onboarding "are you familiar?" question has been answered/dismissed. */
  asked: boolean
  setPersona: (p: NavPersona) => void
  setFull: (f: boolean) => void
  /** One-shot from onboarding: "familiar?" yes -> professional+full, no -> aasaan+simple. */
  setFromFamiliarity: (familiar: boolean) => void
  /** Dismiss the onboarding question without changing the (default) register. */
  dismissAsk: () => void
}

/**
 * Persisted vendor preference. Default = Aasaan + Simple (the safe default for a
 * non-technical owner). Persona is independent of the app language (اردو-script
 * is a separate flip within Aasaan, handled by i18n).
 */
export const useNavPersona = create<NavPersonaState>()(
  persist(
    (set) => ({
      persona: "aasaan",
      full: false,
      asked: false,
      setPersona: (persona) => set({ persona }),
      setFull: (full) => set({ full }),
      setFromFamiliarity: (familiar) =>
        set({ persona: familiar ? "professional" : "aasaan", full: familiar, asked: true }),
      dismissAsk: () => set({ asked: true }),
    }),
    { name: "ww-nav-persona" },
  ),
)
