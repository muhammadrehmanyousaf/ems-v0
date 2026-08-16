/**
 * WW-PRICING-OVERHAUL (frontend mirror) — the single source of truth for how a
 * selected menu contributes to a booking total, so the four customer-facing
 * surfaces that show it (booking-form payload, review step, mobile summary bar,
 * menu-selection step) can never drift apart or from the server.
 *
 * The server rule lives in `event-planner-api/src/services/pricingService.js`
 * (computeVendorPrice, step 5):
 *
 *   pricingUnit = 'per_head'          -> menu.price × max(guests, minGuarantee, 1)
 *   pricingUnit NULL / 'per_event'    -> menu.price  (legacy FLAT, unchanged)
 *
 * A NULL pricingUnit is the legacy flat menu — every existing menu on prod is
 * NULL, so flat menus render byte-for-byte as before. `menuBillableHeads` MUST
 * match the server's `Math.max(1, guests, minGuaranteeCount)`.
 */

import { toAmount } from "./unpriced";

export interface MenuLike {
  price?: number | string | null;
  /** "per_head" bills per guest; NULL / "per_event" is a flat price. */
  pricingUnit?: string | null;
  /** Minimum guaranteed head count — the Pakistani min-pax guarantee floor. */
  minGuaranteeCount?: number | null;
}

/** True when this menu bills per guest (else flat / per_event). */
export function menuIsPerHead(menu: MenuLike | null | undefined): boolean {
  return String(menu?.pricingUnit || "").toLowerCase() === "per_head";
}

/**
 * The number of guests a per-head menu is billed for: the event guest count,
 * floored at the vendor's minimum guaranteed head count, never below 1.
 * Returns 0 for a flat menu (heads don't apply). Mirrors the server exactly.
 */
export function menuBillableHeads(
  menu: MenuLike | null | undefined,
  guestCount?: number | null,
): number {
  if (!menuIsPerHead(menu)) return 0;
  const guests = Number(guestCount);
  const minG = Number(menu?.minGuaranteeCount);
  return Math.max(
    1,
    Number.isFinite(guests) && guests > 0 ? Math.floor(guests) : 0,
    Number.isFinite(minG) && minG > 0 ? Math.floor(minG) : 0,
  );
}

/**
 * What a selected menu contributes to the total. Flat menu → its price;
 * per-head menu → price × billable heads. Use this everywhere a menu price is
 * added, so the customer's preview always equals the server's charge.
 */
export function menuChargeFor(
  menu: MenuLike | null | undefined,
  guestCount?: number | null,
): number {
  if (!menu) return 0;
  const price = toAmount(menu.price) ?? 0;
  return menuIsPerHead(menu) ? price * menuBillableHeads(menu, guestCount) : price;
}

/**
 * True when a per-head menu's guest count is being lifted to the minimum
 * guarantee (i.e. the customer entered fewer guests than the vendor's minimum),
 * so a surface can label "billed at minimum N guests".
 */
export function menuIsAtMinGuarantee(
  menu: MenuLike | null | undefined,
  guestCount?: number | null,
): boolean {
  if (!menuIsPerHead(menu)) return false;
  const minG = Number(menu?.minGuaranteeCount);
  if (!(Number.isFinite(minG) && minG > 0)) return false;
  const guests = Number(guestCount);
  return !(Number.isFinite(guests) && guests >= minG);
}
