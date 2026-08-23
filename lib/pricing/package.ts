/**
 * WW-PKG-UNIT (frontend mirror) — how a selected PACKAGE contributes to a
 * booking total, and whether a selected MENU still costs anything.
 *
 * The server rule lives in `event-planner-api/src/utils/packagePricing.js` and
 * is consumed by `pricingService.computeVendorPrice`. This file must agree with
 * it exactly, or the customer approves one number on the Review step and is
 * charged another. Sibling of `lib/pricing/menu.ts`, deliberately identical in
 * shape so the two halves of a quote read the same way.
 *
 * ── The rule ──────────────────────────────────────────────────────────────
 *
 *   pricingUnit = 'per_head'            -> price x max(guests, minGuarantee, 1)
 *   pricingUnit NULL | 'per_event'      -> price x qty   (legacy FLAT)
 *   package.includesFood = true         -> the selected menu contributes 0
 *
 * Every package on production today has `pricingUnit = NULL`, so flat packages
 * price byte-for-byte as they always have. `packageBillableHeads` MUST match
 * the server's `Math.max(1, guests, minGuaranteeCount)` — the same expression
 * `menuBillableHeads` already implements.
 */

import { toAmount } from "./unpriced";

/** buffet | sit_down | family | hi_tea | stations — see packagePricing.js. */
export type ServiceStyle = "buffet" | "sit_down" | "family" | "hi_tea" | "stations";

export interface PackageLike {
  price?: number | string | null;
  /** "per_head" bills per guest; NULL / "per_event" is a flat price. */
  pricingUnit?: string | null;
  /** Minimum billable head count — the Pakistani min-pax guarantee floor. */
  minGuaranteeCount?: number | null;
  /** TRUE = catering is already covered, so a chosen menu costs nothing. */
  includesFood?: boolean | null;
  /** Advisory band shown on the card ("200–800 guests"). */
  guestRangeMin?: number | null;
  guestRangeMax?: number | null;
  serviceStyle?: string | null;
  /** The menu this package bundles, when the vendor declared one. */
  menuId?: number | string | null;
}

/**
 * True when this package bills per guest.
 *
 * A NULL / absent / unrecognised unit is the legacy flat package and returns
 * false. That polarity is load-bearing — inverting it would multiply every
 * existing package by the guest count.
 */
export function packageIsPerHead(pkg: PackageLike | null | undefined): boolean {
  return String(pkg?.pricingUnit || "").toLowerCase() === "per_head";
}

/**
 * The number of guests a per-head package is billed for: the event guest count,
 * floored at the package's own minimum guarantee, never below 1.
 *
 * Returns 0 for a flat package (heads don't apply), so a caller that forgets to
 * branch produces an obvious zero rather than a plausible wrong number.
 */
export function packageBillableHeads(
  pkg: PackageLike | null | undefined,
  guestCount?: number | null,
): number {
  if (!packageIsPerHead(pkg)) return 0;
  const guests = Number(guestCount);
  const minG = Number(pkg?.minGuaranteeCount);
  return Math.max(
    1,
    Number.isFinite(guests) && guests > 0 ? Math.floor(guests) : 0,
    Number.isFinite(minG) && minG > 0 ? Math.floor(minG) : 0,
  );
}

/**
 * What a selected package contributes to the line total.
 *
 * `qty` (vehicles / outfits / sets) is NOT applied to a per-head package —
 * heads already are the quantity dimension, and only the car-rental, bridal-wear
 * and stationery surfaces ever send a qty, none of which price per guest.
 * Applying both would multiply twice.
 */
export function packageChargeFor(
  pkg: PackageLike | null | undefined,
  guestCount?: number | null,
  qty: number = 1,
): number {
  if (!pkg) return 0;
  const price = toAmount(pkg.price) ?? 0;
  if (packageIsPerHead(pkg)) return price * packageBillableHeads(pkg, guestCount);
  const n = Number(qty);
  return price * (Number.isFinite(n) && n > 0 ? Math.floor(n) : 1);
}

/**
 * True when the chosen package already covers catering, so a selected menu must
 * contribute nothing.
 *
 * Strict `=== true`: a truthy string from a stale API shape must never zero a
 * customer's food charge by accident.
 */
export function packageIncludesFood(pkg: PackageLike | null | undefined): boolean {
  return pkg?.includesFood === true;
}

/**
 * True when a per-head package's guest count is being lifted to the minimum
 * guarantee, so a surface can label "billed at minimum N guests".
 *
 * Mirrors `menuIsAtMinGuarantee`.
 */
export function packageIsAtMinGuarantee(
  pkg: PackageLike | null | undefined,
  guestCount?: number | null,
): boolean {
  if (!packageIsPerHead(pkg)) return false;
  const minG = Number(pkg?.minGuaranteeCount);
  if (!(Number.isFinite(minG) && minG > 0)) return false;
  const guests = Number(guestCount);
  return !(Number.isFinite(guests) && guests >= minG);
}

/**
 * Whether this guest count sits inside the package's advertised band.
 *
 * Advisory only — the server does not refuse an out-of-band booking, because a
 * vendor's range is a marketing statement rather than a capacity limit (that is
 * `fireRatedCapacity`'s job). Surfaces use it to explain, not to block.
 */
export function packageGuestRangeState(
  pkg: PackageLike | null | undefined,
  guestCount?: number | null,
): "ok" | "below" | "above" | "unbounded" {
  const lo = Number(pkg?.guestRangeMin);
  const hi = Number(pkg?.guestRangeMax);
  const hasLo = Number.isFinite(lo) && lo > 0;
  const hasHi = Number.isFinite(hi) && hi > 0;
  if (!hasLo && !hasHi) return "unbounded";
  const guests = Number(guestCount);
  if (!Number.isFinite(guests) || guests <= 0) return "unbounded";
  if (hasLo && guests < lo) return "below";
  if (hasHi && guests > hi) return "above";
  return "ok";
}

/** "Rs 2,500 per head" / "Rs 3,00,000 per event" — the unit is never dropped. */
export function packagePriceBasisLabel(pkg: PackageLike | null | undefined): string {
  return packageIsPerHead(pkg) ? "per head" : "per event";
}

const SERVICE_STYLE_LABELS: Record<string, string> = {
  buffet: "Buffet",
  sit_down: "Sit-down",
  family: "Family style",
  hi_tea: "Hi-tea",
  stations: "Live stations",
};

/** Human label for a service style, or null when the vendor left it unset. */
export function serviceStyleLabel(style?: string | null): string | null {
  if (!style) return null;
  return SERVICE_STYLE_LABELS[String(style).toLowerCase()] ?? null;
}

/**
 * The whole line: package + menu, with the includesFood rule applied once.
 *
 * Surfaces should call THIS rather than adding `packageChargeFor` and
 * `menuChargeFor` themselves — the addition is exactly where the double-charge
 * came from, and centralising it means a surface cannot forget the rule.
 *
 * `menuCharge` is what the caller computed from `menuChargeFor`; it is zeroed
 * here when the package covers food, and `menuIncluded` says so, so the UI can
 * render "included" instead of silently showing nothing.
 */
export function composeLineTotal(args: {
  pkg?: PackageLike | null;
  guestCount?: number | null;
  qty?: number;
  menuCharge?: number;
}): {
  packageCharge: number;
  menuCharge: number;
  menuIncluded: boolean;
  baseTotal: number;
} {
  const { pkg = null, guestCount = null, qty = 1, menuCharge = 0 } = args;
  const packageCharge = packageChargeFor(pkg, guestCount, qty);
  const menuIncluded = packageIncludesFood(pkg);
  const effectiveMenu = menuIncluded ? 0 : menuCharge;
  return {
    packageCharge,
    menuCharge: effectiveMenu,
    menuIncluded,
    baseTotal: packageCharge + effectiveMenu,
  };
}
