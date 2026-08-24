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
  /** WW-CHOICE-GROUPS — the "pick N of these" set this dish belongs to. */
  group?: string | null;
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
        // WW-CHOICE-GROUPS — which "pick N of these" set this dish belongs to.
        // Optional: a dish with no group is always served, which is every dish
        // on every menu written before this existed.
        group: raw.group ? String(raw.group) : null,
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

/**
 * WW-JURISDICTION — a fourth state: the rule may not reach this venue at all.
 *
 * The one-dish rule is s.5 of the PUNJAB Marriage Functions Act 2016. Judging a
 * Karachi menu against it produced a red badge for a law that does not extend
 * to Sindh — and a badge that fires where it shouldn't is untrustworthy in
 * exactly the same way as one that stays silent where it should.
 */
export type OneDishStatus = "compliant" | "violation" | "unknown" | "not_applicable";

/** Mirrors the server's `jurisdiction.ruleStatusFor`. */
export type RuleApplies = "applies" | "does_not_apply" | "unknown";

export interface OneDishResult {
  status: OneDishStatus;
  compliant: boolean;
  /** Set only when `status` is "unknown" — why we could not reach a verdict. */
  unknownReason: "no_items" | "unclassified" | "jurisdiction_unknown" | null;
  /** Whether the rule reaches this venue. Defaults to "applies" when unset. */
  ruleApplies?: RuleApplies;
  counts: Record<CountsAs, number>;
  /**
   * `items` lists only the ALWAYS-SERVED dishes in this category. A breach
   * caused by a choice group carries `viaChoice` and `why` instead, because
   * such a menu may list none — and "2 main dishes listed ()" reads to a
   * vendor as a platform error rather than as their own setting.
   */
  violations: {
    countsAs: CountsAs; allowed: number; found: number; items: string[];
    viaChoice?: { group: string; label: string; worst: number; of: number; pick: number }[];
    why?: string;
  }[];
  unclassified: string[];
  hasInferred: boolean;
  items: MenuDish[];
}

/**
 * WW-CHOICE-GROUPS — the "pick N of these" sets a menu declares.
 *
 *   data.groups = { mains: { label: "Main dish", choose: 1 }, … }
 *   data.items  = [ { name, countsAs, group: "mains" }, … ]
 *
 * A dish with no group, or one naming a group that does not exist, is always
 * served. A group with no `choose` reads as one, because "pick from these" with
 * no number is a choice of one on every printed menu.
 *
 * Kept identical to `oneDishRule.readChoiceGroups` — this file is a mirror, and
 * the reason the verdict is computed in one shape is so no surface can quietly
 * disagree about the same menu.
 */
export function readChoiceGroups(data: any): Record<string, { label: string | null; choose: number }> {
  const raw = data && typeof data === "object" ? data.groups : null;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, { label: string | null; choose: number }> = {};
  for (const [id, g] of Object.entries<any>(raw)) {
    if (!id || !g || typeof g !== "object") continue;
    const choose = parseInt(g.choose, 10);
    out[String(id)] = {
      label: g.label != null ? String(g.label) : null,
      choose: Number.isFinite(choose) && choose > 0 ? choose : 1,
    };
  }
  return out;
}

export function checkOneDish(data: any, opts?: { ruleApplies?: RuleApplies }): OneDishResult {
  const items = flattenMenuItems(data);
  const groups = readChoiceGroups(data);

  /**
   * Count the WORST MENU THE VENDOR IS OFFERING, not the list of dishes.
   *
   * "Pick 1 of: Karahi, Qorma, Nihari" serves one salan, so counting the three
   * listed would report a breach that cannot happen. "Pick 2 of" the same three
   * lets a customer assemble two, so counting one would certify a menu the
   * vendor is plainly offering illegally.
   *
   * s.5 makes the VENUE liable for the function that actually happens, so if
   * any combination the vendor allows breaches, the vendor is offering a
   * breach. Every ungrouped dish is always served and always counts; each group
   * contributes as many as a customer could take from it.
   */
  const counts = Object.fromEntries(COUNTS_AS.map((c) => [c, 0])) as Record<CountsAs, number>;
  for (const it of items) {
    if (it.group && groups[it.group]) continue; // counted per group below
    counts[it.countsAs] = (counts[it.countsAs] ?? 0) + 1;
  }
  const groupContribution: Record<string, { group: string; label: string; worst: number; of: number; pick: number }[]> = {};
  for (const [gid, g] of Object.entries(groups)) {
    const members = items.filter((i) => i.group === gid);
    if (members.length === 0) continue;
    // `choose` above the number of members means the whole group is served.
    const pick = Math.max(0, Math.min(Number(g.choose) || 0, members.length));
    for (const c of COUNTS_AS) {
      const inGroup = members.filter((i) => i.countsAs === c).length;
      if (inGroup === 0) continue;
      const worst = Math.min(pick, inGroup);
      counts[c] = (counts[c] ?? 0) + worst;
      if (worst > 0) (groupContribution[c] ||= []).push({ group: gid, label: g.label || gid, worst, of: inGroup, pick });
    }
  }

  const violations: OneDishResult["violations"] = [];
  for (const [countsAs, allowed] of Object.entries(CAPPED)) {
    const found = counts[countsAs as CountsAs] ?? 0;
    if (found > (allowed as number)) {
      const fromChoice = groupContribution[countsAs] ?? [];
      violations.push({
        countsAs: countsAs as CountsAs,
        allowed: allowed as number,
        found,
        items: items
          .filter((i) => i.countsAs === countsAs && (!i.group || !groups[i.group]))
          .map((i) => i.name),
        ...(fromChoice.length
          ? {
              viaChoice: fromChoice,
              // The group clause only — describeViolation supplies the sentence
              // around it, so the two cannot repeat each other.
              why: fromChoice.map((f) => `“${f.label}” lets them pick ${f.pick} from ${f.of}`).join(", "),
            }
          : {}),
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

  // Omitted by every existing caller, and omitting it keeps the old behaviour
  // exactly. Only a caller that resolved the province can turn the rule off.
  const applies: RuleApplies = opts?.ruleApplies ?? "applies";

  const status: OneDishStatus =
    applies === "does_not_apply" ? "not_applicable"
      : applies === "unknown" ? "unknown"
        : violations.length > 0 ? "violation"
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
    unknownReason:
      status !== "unknown"
        ? null
        : applies === "unknown"
          ? "jurisdiction_unknown"
          : nothingRead
            ? "no_items"
            : "unclassified",
    ruleApplies: applies,
    /**
     * Cleared when the rule does not reach this venue — a statement of fact,
     * not a convenience: there are no violations of a rule that does not bind
     * you. It is also the safe shape, because every surface renders red off
     * `violations.length`, so leaving them populated would keep the false red
     * on a Karachi menu whatever `status` said. `counts` is deliberately kept:
     * the vendor should still be able to read their own menu.
     */
    counts,
    violations: status === "not_applicable" ? [] : violations,
    unclassified: unclassified.map((i) => i.name),
    hasInferred: items.some((i) => i.inferred),
    items,
  };
}

/** Human sentence for a violation, in the words a vendor would use. */
export function describeViolation(v: OneDishResult["violations"][number]): string {
  const label = v.countsAs === "salan" ? "main dishes" : "sweet dishes";

  /**
   * A choice-driven breach must not be described as "listed".
   *
   * A menu offering "pick 2 of: Karahi, Qorma, Nihari" and nothing else lists
   * no ungrouped main dish at all, so this produced "2 main dishes listed ()" —
   * an empty bracket and a claim the vendor can see is false, which reads as a
   * platform error rather than as their own setting.
   *
   * Kept identical to the backend's wording: a parity check compares the two
   * strings, and it caught this exact sentence drifting.
   */
  if (v.viaChoice && v.viaChoice.length) {
    return `A customer could end up with ${v.found} ${label} — ${v.why}. The law allows one.`;
  }
  return `${v.found} ${label} listed (${v.items.join(", ")}). The law allows one.`;
}
