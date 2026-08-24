/**
 * WW-ONE-DISH (frontend mirror) — the Punjab / ICT one-dish arithmetic.
 *
 * Mirrors `event-planner-api/src/utils/oneDishRule.js`. Needed on the client
 * because the vendor has to see the count WHILE they build the menu, when
 * fixing it is free — not after a save round-trip.
 *
 * ── The rule ──────────────────────────────────────────────────────────────
 *
 * Punjab Marriage Functions Act 2016: "one dish" means one salan, one rice
 * dish, one salad, hot and cold drinks, roti, nan and one sweet dish. s.4 binds
 * the host, s.5 binds the venue owner AND the caterer, s.8 makes it up to one
 * month's imprisonment and Rs 50,000–2,000,000. So only two counts can put
 * anyone in breach: SALAN and SWEET.
 *
 * ── Declared, never guessed ───────────────────────────────────────────────
 *
 * `countsAs` is set by the vendor. A checker that read dish NAMES would be
 * defeated by the documented workaround — listing a second salan as a "special
 * salad" — and would then certify an illegal menu as legal, which is worse than
 * not checking, because the venue would be relying on it.
 */

export type CountsAs = "salan" | "rice" | "salad" | "bread" | "drink" | "sweet" | "other";

export const COUNTS_AS: CountsAs[] = ["salan", "rice", "salad", "bread", "drink", "sweet", "other"];

/** Only these two can put a venue in breach. */
export const CAPPED: Partial<Record<CountsAs, number>> = { salan: 1, sweet: 1 };

export const COUNTS_AS_LABELS: Record<CountsAs, string> = {
  salan: "Main dish (salan)",
  rice: "Rice",
  salad: "Salad / chaat",
  bread: "Roti / naan",
  drink: "Drink",
  sweet: "Sweet dish",
  other: "Snack / live counter (not counted)",
};

const SECTION_DEFAULTS: Record<string, CountsAs> = {
  maincourse: "salan", main_course: "salan", mains: "salan", salan: "salan", curry: "salan",
  rice: "rice", biryani: "rice",
  starters: "other", chaat: "salad", salad: "salad", saladbar: "salad",
  bread: "bread", roti: "bread", naan: "bread",
  desserts: "sweet", dessert: "sweet", sweet: "sweet", sweets: "sweet",
  drinks: "drink", beverages: "drink", welcomedrink: "drink",
  bbq: "other", livebbq: "other", livecounters: "other", stations: "other",
};

const normaliseKey = (k: unknown) => String(k ?? "").toLowerCase().replace(/[^a-z]/g, "");

export interface MenuDish {
  name: string;
  countsAs: CountsAs;
  /** TRUE when we placed it, rather than the vendor declaring it. */
  inferred: boolean;
  section?: string | null;
  isLive?: boolean;
  supplementPerHead?: number;
}

/**
 * Flatten `menu.data` into dishes. Handles every shape this column has held:
 *   { items: ["Chicken Karahi", …] }                     portal, flat, legacy
 *   { items: [{ name, countsAs }, …] }                   portal, classified
 *   { mainCourse: { items: [...] }, desserts: { items } } booking-flow sections
 */
export function flattenMenuItems(data: any): MenuDish[] {
  const out: MenuDish[] = [];
  if (!data || typeof data !== "object") return out;

  const push = (raw: any, section: string | null) => {
    if (raw == null) return;
    const sectionDefault = SECTION_DEFAULTS[normaliseKey(section)] ?? null;

    if (typeof raw === "string") {
      const name = raw.trim();
      if (!name) return;
      out.push({ name, countsAs: sectionDefault ?? "other", inferred: true, section });
      return;
    }
    if (typeof raw === "object") {
      const name = String(raw.name ?? raw.title ?? "").trim();
      if (!name) return;
      const declared = COUNTS_AS.includes(String(raw.countsAs).toLowerCase() as CountsAs)
        ? (String(raw.countsAs).toLowerCase() as CountsAs)
        : null;
      out.push({
        name,
        countsAs: declared ?? sectionDefault ?? "other",
        inferred: !declared,
        section: section ?? raw.section ?? null,
        isLive: raw.isLive === true,
        supplementPerHead: Number(raw.supplementPerHead) > 0 ? Number(raw.supplementPerHead) : 0,
      });
    }
  };

  if (Array.isArray(data.items)) for (const it of data.items) push(it, null);
  for (const [key, val] of Object.entries<any>(data)) {
    if (key === "items") continue;
    if (val && typeof val === "object" && Array.isArray(val.items)) {
      for (const it of val.items) push(it, key);
    }
  }
  return out;
}

export type OneDishStatus = "compliant" | "violation" | "unknown";

export interface OneDishResult {
  status: OneDishStatus;
  compliant: boolean;
  /** Set only when `status` is "unknown" — why we could not reach a verdict. */
  unknownReason: "no_items" | "unclassified" | null;
  counts: Record<CountsAs, number>;
  violations: { countsAs: CountsAs; allowed: number; found: number; items: string[] }[];
  unclassified: string[];
  hasInferred: boolean;
  items: MenuDish[];
}

export function checkOneDish(data: any): OneDishResult {
  const items = flattenMenuItems(data);
  const counts = Object.fromEntries(COUNTS_AS.map((c) => [c, 0])) as Record<CountsAs, number>;
  for (const it of items) counts[it.countsAs] = (counts[it.countsAs] ?? 0) + 1;

  const violations: OneDishResult["violations"] = [];
  for (const [countsAs, allowed] of Object.entries(CAPPED)) {
    const found = counts[countsAs as CountsAs] ?? 0;
    if (found > (allowed as number)) {
      violations.push({
        countsAs: countsAs as CountsAs,
        allowed: allowed as number,
        found,
        items: items.filter((i) => i.countsAs === countsAs).map((i) => i.name),
      });
    }
  }

  const unclassified = items.filter((i) => i.inferred && i.countsAs === "other");

  /**
   * Three states, not two. A legacy flat menu — three curries, no sections,
   * nothing declared — used to report COMPLIANT, because everything fell to
   * "other" and the salan count was zero. That is a green badge on an illegal
   * menu. A menu we cannot read is `unknown`, and the UI asks rather than
   * reassures.
   */
  /**
   * A menu with NO readable dishes is `unknown` too, not `compliant`.
   *
   * The three states above refuse to call a menu compliant when SOME dishes
   * could not be placed, but zero items parsed produced no violations and
   * nothing unclassified, and fell through to "compliant" — a clean verdict on
   * a menu that was never read.
   *
   * Found on production, where every menu row carries `data: NULL`, so every
   * menu on the platform was reporting compliant on the strength of nothing.
   * Kept identical to the backend rule: this file is a mirror, and the reason
   * the verdict is computed in one place is so no surface can quietly disagree.
   */
  const nothingRead = items.length === 0;

  const status: OneDishStatus =
    violations.length > 0 ? "violation"
      : unclassified.length > 0 || nothingRead ? "unknown"
        : "compliant";

  return {
    status,
    compliant: status === "compliant",
    /**
     * Why it is `unknown`, so the screen asks the right question: "no_items"
     * means no dishes are recorded at all, "unclassified" means the dishes are
     * there but some could not be placed into a course.
     */
    unknownReason: status !== "unknown" ? null : (nothingRead ? "no_items" : "unclassified"),
    counts,
    violations,
    unclassified: unclassified.map((i) => i.name),
    hasInferred: items.some((i) => i.inferred),
    items,
  };
}

/** Human sentence for a violation, in the words a vendor would use. */
export function describeViolation(v: OneDishResult["violations"][number]): string {
  const label = v.countsAs === "salan" ? "main dishes" : "sweet dishes";
  return `${v.found} ${label} listed (${v.items.join(", ")}). The law allows one.`;
}
