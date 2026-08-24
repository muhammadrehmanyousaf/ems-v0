import { closingTimeFor } from "@/lib/compliance/jurisdiction";

/**
 * WW-TEST-CASES 2.23 — the six answers a couple needs above the fold.
 *
 * `D1-SETTLED-AND-PACKAGE-MENU-DESIGN.md` §4.1. The hero answered two of them:
 * the vendor's name and "From PKR X". Everything else — how the price is
 * counted, how many people fit, whether food is included, what deposit is
 * held, and when the music has to stop — was somewhere further down the page,
 * inside a package card, or nowhere at all.
 *
 * These are the questions that decide whether a venue is even a candidate. A
 * couple who has to scroll and cross-reference to learn that "From Rs 450,000"
 * is the HALL ONLY has already been misled by the headline, and a family whose
 * baraat traditionally arrives at 10 needs the closing time before they fall in
 * love with the photographs — not at checkout, where it becomes a refusal.
 *
 * ── Each answer earns its place or is omitted ─────────────────────────────
 *
 * Nothing is rendered on a guess. A venue that has not set a capacity shows no
 * capacity chip rather than "Capacity: —", because a dash is a worse answer
 * than a missing question: it implies we asked and the venue declined, when in
 * fact nobody ever filled it in. The same rule the compliance work follows —
 * `unknown` is never dressed as a verdict.
 */

const pkr = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;
const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
};
const isPerHead = (x: any) => String(x?.pricingUnit || "").toLowerCase() === "per_head";

/** Which icon the component should draw. Kept as a KEY rather than a
 *  component so this file stays plain TypeScript and can be exercised by
 *  `scripts/venue-answers-check.mts` under plain node. */
export type AnswerIcon = "price" | "capacity" | "date" | "food" | "deposit" | "closing";

export interface VenueAnswer {
  key: string;
  iconKey: AnswerIcon;
  label: string;
  value: string;
  /** Shown smaller underneath. The caveat that stops the value being a half-truth. */
  note?: string;
}

/**
 * Build the answers this venue can actually give.
 *
 * @param raw  the Business row (the detail page's `vendor.raw` escape hatch)
 */
export function buildVenueAnswers(raw: any): VenueAnswer[] {
  const out: VenueAnswer[] = [];
  const packages = Array.isArray(raw?.packages) ? raw.packages : [];
  const menus = Array.isArray(raw?.menus) ? raw.menus : [];

  /* 1 — Price basis. The headline number is meaningless without it. */
  {
    const perHeadItems = [...packages, ...menus].filter(isPerHead);
    const cheapestPerHead = perHeadItems
      .map((x: any) => num(x.price))
      .filter((n: number | null): n is number => n != null && n > 0)
      .sort((a: number, b: number) => a - b)[0];
    const flatPkgs = packages.filter((p: any) => !isPerHead(p));
    const cheapestFlat = flatPkgs
      .map((p: any) => num(p.price))
      .filter((n: number | null): n is number => n != null && n > 0)
      .sort((a: number, b: number) => a - b)[0];
    const floor = num(raw?.minimumPrice);

    if (cheapestPerHead) {
      out.push({
        key: "price",
        iconKey: "price",
        label: "Price basis",
        value: `From ${pkr(cheapestPerHead)} per head`,
        // The single most useful sentence on the page for a Pakistani wedding:
        // a per-head rate is a total nobody can read without multiplying.
        note: "Your total moves with the guest count.",
      });
    } else if (cheapestFlat) {
      out.push({
        key: "price",
        iconKey: "price",
        label: "Price basis",
        value: `From ${pkr(cheapestFlat)} per event`,
        note: "One price, whatever the guest count.",
      });
    } else if (floor && floor > 0) {
      out.push({ key: "price", iconKey: "price", label: "Starting price", value: pkr(floor) });
    }
  }

  /* 2 — Capacity. */
  {
    const min = num(raw?.minCapacity);
    const max = num(raw?.maxCapacity);
    if (min && max) {
      out.push({ key: "capacity", iconKey: "capacity", label: "Capacity", value: `${min}–${max} guests` });
    } else if (max) {
      out.push({ key: "capacity", iconKey: "capacity", label: "Capacity", value: `Up to ${max} guests` });
    }
  }

  /* 3 — The date. Not a claim about availability, which we cannot make from
         here without a query; a claim about how quickly they can answer. */
  {
    const lead = num(raw?.minLeadDays);
    out.push({
      key: "date",
      iconKey: "date",
      label: "Your date",
      value: "Check availability",
      note: lead && lead > 0 ? `They need at least ${lead} ${lead === 1 ? "day" : "days"} notice.` : undefined,
    });
  }

  /* 4 — Food. Three genuinely different propositions, and the headline price
         means something different under each. */
  {
    const anyIncludesFood = packages.some((p: any) => p.includesFood === true);
    const cheapestMenu = menus
      .map((m: any) => (isPerHead(m) ? num(m.price) : null))
      .filter((n: number | null): n is number => n != null && n > 0)
      .sort((a: number, b: number) => a - b)[0];

    if (anyIncludesFood) {
      out.push({
        key: "food",
        iconKey: "food",
        label: "Food",
        value: "Included in the package",
        note: menus.length ? "You still choose the menu." : undefined,
      });
    } else if (cheapestMenu) {
      out.push({
        key: "food",
        iconKey: "food",
        label: "Food",
        value: `Menus from ${pkr(cheapestMenu)} per head`,
        note: "Charged on top of the venue.",
      });
    } else if (menus.length === 0 && packages.length > 0) {
      // Shape 3 — hall only, outside caterer. Real, common, and the single
      // thing most likely to be discovered too late.
      out.push({
        key: "food",
        iconKey: "food",
        label: "Food",
        value: "Not included",
        note: "You'd arrange your own caterer.",
      });
    }
  }

  /* 5 — The deposit. A17: it is NOT part of the price, and saying so here is
         the whole point — a couple budgeting from the headline is short. */
  {
    const dep = num(raw?.securityDepositPkr);
    if (dep && dep > 0) {
      const days = num(raw?.depositReturnDays) ?? 7;
      out.push({
        key: "deposit",
        iconKey: "deposit",
        label: "Security deposit",
        value: `${pkr(dep)}, refundable`,
        note: `Held separately from your total, back within ${days} ${days === 1 ? "day" : "days"}.`,
      });
    }
  }

  /* 6 — Closing time. A family whose baraat arrives at 10 needs this before
         they fall in love with the photographs, not at checkout. */
  {
    const close = closingTimeFor(raw?.city);
    if (close) {
      out.push({
        key: "closing",
        iconKey: "closing",
        label: "Events close by",
        value: close.closeBy,
        note: "Provincial law, not a house rule — it applies to every venue here.",
      });
    }
  }

  return out;
}
