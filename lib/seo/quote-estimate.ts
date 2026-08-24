/**
 * WW-SHAPES P1.9 (frontend mirror) — what this venue costs at YOUR guest count.
 *
 * Mirrors `event-planner-api/src/utils/perHeadEquivalent.js`. Needed on the
 * client because the whole point of the sticky quote bar (§4.4) is that the
 * number moves as the couple types a guest count, and a round trip per
 * keystroke is not an option.
 *
 * `scripts/quote-estimate-parity.mts` drives both implementations across every
 * shape and fails on any disagreement. A mirror that drifts shows a couple one
 * figure on the listing and charges another at checkout, which is the same
 * class of failure as the double-charge this programme started with.
 *
 * ── What it refuses to do ─────────────────────────────────────────────────
 *
 * Return a number on its own. An all-in per-head figure is only true at a
 * stated head count, and it refuses outright for a quote-only vendor or one
 * with no published price — `comparable: false` with a reason beats a confident
 * figure derived from nothing, which a couple would use to rule a venue out.
 */

export type QuoteBasis =
  | "package_all_in"
  | "package_plus_menu"
  | "menu_only"
  | "package_only"
  | "minimum_price";

export interface QuoteEstimate {
  comparable: boolean;
  perHead: number | null;
  guestCount: number;
  total: number | null;
  basis: QuoteBasis | null;
  reason: string | null;
  assumptions: string[];
}

const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
};
const round2 = (n: number) => Math.round(n * 100) / 100;
const isPerHead = (x: any) => String(x?.pricingUnit || "").toLowerCase() === "per_head";

/**
 * The guest count to reduce at when the couple has not named one.
 *
 * A venue's own band is the honest default — reducing a 200-cover restaurant
 * and an 800-cover marquee at the same arbitrary number flatters whichever the
 * number happens to suit. 300 (roughly the Pakistani median wedding) only when
 * a venue states no capacity at all.
 */
export function defaultHeadcount(business: any): number {
  const min = num(business?.minCapacity);
  const max = num(business?.maxCapacity);
  if (min && max) return Math.round((min + max) / 2);
  if (max) return Math.round(max * 0.75);
  if (min) return min;
  return 300;
}

/** Reduce a venue to "all-in, per head, at N guests". Mirrors the server. */
export function quoteEstimate({
  business,
  packages = [],
  menus = [],
  guestCount,
}: {
  business: any;
  packages?: any[];
  menus?: any[];
  guestCount?: number | null;
}): QuoteEstimate {
  const heads = Math.max(1, num(guestCount) ?? defaultHeadcount(business));
  const pkgs = (Array.isArray(packages) ? packages : []).filter(Boolean);
  const mnus = (Array.isArray(menus) ? menus : []).filter(Boolean);
  const assumptions: string[] = [];

  const no = (reason: string): QuoteEstimate => ({
    comparable: false, perHead: null, guestCount: heads,
    total: null, basis: null, reason, assumptions,
  });

  if (String(business?.pricingMode || "").toLowerCase() === "quote") {
    return no("This venue prices each event individually, so there is no figure to compare yet.");
  }

  /**
   * The cheapest way in, not the average and not the headline. A couple is
   * asking "what would this cost me", and the answer they can act on is the
   * least it can cost — averaging the tiers produces a number no booking pays.
   */
  const cheapestPackage = pkgs
    .map((p: any) => {
      const price = num(p.price);
      if (price == null || price <= 0) return null;
      const covers = isPerHead(p)
        ? price * Math.max(heads, num(p.minGuaranteeCount) ?? 0)
        : price;
      return { pkg: p, total: round2(covers), includesFood: p.includesFood === true };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.total - b.total)[0] as any || null;

  const cheapestMenu = mnus
    .map((m: any) => {
      const price = num(m.price);
      if (price == null || price <= 0) return null;
      const total = isPerHead(m)
        ? price * Math.max(heads, num(m.minGuaranteeCount) ?? 0)
        : price;
      return { menu: m, total: round2(total) };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.total - b.total)[0] as any || null;

  let total: number | null = null;
  let basis: QuoteBasis | null = null;

  if (cheapestPackage && cheapestPackage.includesFood) {
    total = cheapestPackage.total;
    basis = "package_all_in";
    assumptions.push(`Their cheapest all-in package, "${cheapestPackage.pkg.name ?? "package"}".`);
  } else if (cheapestPackage && cheapestMenu) {
    total = round2(cheapestPackage.total + cheapestMenu.total);
    basis = "package_plus_menu";
    assumptions.push(`Their cheapest package plus their cheapest menu.`);
  } else if (cheapestMenu) {
    total = cheapestMenu.total;
    basis = "menu_only";
    assumptions.push("Food only — this vendor doesn't charge for a venue.");
  } else if (cheapestPackage) {
    total = cheapestPackage.total;
    basis = "package_only";
    assumptions.push("The venue only — you would bring your own caterer.");
  } else {
    const floor = num(business?.minimumPrice);
    if (floor && floor > 0) {
      total = floor;
      basis = "minimum_price";
      assumptions.push("Their starting price — they haven't published packages or menus.");
    } else {
      return no("This venue hasn't published a price yet.");
    }
  }

  /**
   * Every branch above either assigned `total` or returned, but the compiler
   * cannot see that through the else-if chain. Narrowed here rather than
   * asserted with `!`, so a future branch that forgets to assign fails to
   * compile instead of producing a NaN price on a live listing.
   */
  if (total === null || basis === null) return no("This venue hasn't published a price yet.");
  let running: number = total;

  // P1.5 — a venue whose food floor sits above its cheapest menu is dearer than
  // that menu suggests, and hiding it makes the estimate wrong in the venue's
  // favour at exactly the moment a couple is deciding.
  const foodFloor = num(business?.minFoodSpendPkr);
  if (foodFloor && foodFloor > 0 && basis === "package_plus_menu" && cheapestMenu.total < foodFloor) {
    running = round2(running - cheapestMenu.total + foodFloor);
    assumptions.push(`Their minimum food spend of Rs ${foodFloor.toLocaleString("en-PK")} applies.`);
  }

  // The whole-booking floor, last, exactly as the engine applies it.
  const minPrice = num(business?.minimumPrice);
  if (minPrice && minPrice > 0 && running < minPrice) {
    running = minPrice;
    assumptions.push(`Lifted to their Rs ${minPrice.toLocaleString("en-PK")} minimum booking value.`);
  }

  return {
    comparable: true,
    perHead: round2(running / heads),
    guestCount: heads,
    total: round2(running),
    basis,
    reason: null,
    assumptions,
  };
}

/** The sentence shown beside the number. Never the bare figure. */
export function describeQuote(result: QuoteEstimate): string {
  if (!result?.comparable) return result?.reason ?? "No published price.";
  return `About Rs ${result.perHead!.toLocaleString("en-PK")} per head, all in, for ${result.guestCount} guests.`;
}
