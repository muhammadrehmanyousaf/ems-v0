/**
 * WW-RATECARD 10.7 (frontend mirror) — a vendor whose rate card IS a unit.
 *
 * The server rule lives in `event-planner-api/src/services/pricingService.js`,
 * in the `per_unit` branch of `computeVendorPrice`. This file must agree with
 * it exactly, or the customer approves one number on the Review step and is
 * charged another. Sibling of `lib/pricing/package.ts` and `lib/pricing/menu.ts`,
 * deliberately identical in shape so all three halves of a quote read the same.
 *
 * ── The case ──────────────────────────────────────────────────────────────
 *
 * A car-rental firm has no packages and no guests. It has a car at a price and
 * a number of cars. The same is true of a stationery press (cards, per hundred)
 * and a chair supplier (chairs). `pricingMode = "per_unit"` plus a unit in
 * `pricingConfigJson` is that vendor's whole rate card.
 *
 * The engine honours it. Nothing in the booking flow ever ASKED how many —
 * `vehicleQuantity` was collected inside the package step, gated on three
 * hardcoded vendor-type strings, and a per-unit vendor has no package step to
 * put it in. So the quantity defaulted to 1 and a customer wanting four cars
 * had no way to say so.
 *
 * ── The rule ──────────────────────────────────────────────────────────────
 *
 *   billed quantity  =  max(1, requested, minUnitQty)
 *   line total       =  unitPrice x billed quantity
 *
 * The vendor's minimum is a floor on the QUANTITY, the same shape as a menu's
 * minimum guarantee: order one car against a three-car minimum and three is
 * what is billed. Both figures are carried, because a customer shown a number
 * they did not ask for is owed the reason.
 *
 * ── When this applies, and why the test is so narrow ──────────────────────
 *
 * The server bills the unit line only when NOTHING else is selected — a real
 * package always wins, because a real selection is more specific than a
 * default. A vendor with packages forces a package choice at the packages step,
 * so their unit line can never fire.
 *
 * `sellsByTheUnit` therefore also requires no packages and no menus. Showing a
 * quantity control that does not move the price would be worse than showing
 * nothing at all.
 */

/** The unit a vendor sells by, once it is actually usable. */
export interface UnitConfig {
  /** "car", "chair", "100 cards" — the vendor's own word, shown verbatim. */
  unitLabel: string;
  unitPrice: number;
  /** A floor on the quantity, or null when the vendor set none. */
  minUnitQty: number | null;
}

/** One priced line, mirroring the server's `breakdown.unitLine`. */
export interface UnitLine {
  unitLabel: string;
  unitPrice: number;
  requestedQty: number;
  billedQty: number;
  minUnitQty: number | null;
  total: number;
  /** True when the vendor's minimum lifted the quantity above what was asked. */
  liftedByMinimum: boolean;
}

/** `MAX_QTY_PER_PACKAGE` in pricingService.js. Over this the server refuses. */
export const MAX_UNIT_QTY = 50;

const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
};

/**
 * The unit this vendor sells by, or null.
 *
 * Null covers every reason the server would decline to price a unit line: no
 * declared mode, a different mode, no config, no price, a price of zero or
 * less, a price that will not parse. Read `pricingConfigJson` exactly as the
 * server does, `unitPricePkr` first and `unitPrice` as the older spelling.
 */
export function readUnitConfig(business: any): UnitConfig | null {
  if (String(business?.pricingMode || "").toLowerCase() !== "per_unit") return null;
  const cfg = business?.pricingConfigJson;
  if (!cfg || typeof cfg !== "object") return null;

  const unitPrice = num(cfg.unitPricePkr ?? cfg.unitPrice);
  if (unitPrice === null || unitPrice <= 0) return null;

  const min = num(cfg.minUnitQty);
  return {
    // "unit" is the server's own fallback; a vendor who priced a unit without
    // naming it still gets a working step rather than a blank label.
    unitLabel: cfg.unitLabel ? String(cfg.unitLabel).trim() || "unit" : "unit",
    unitPrice,
    minUnitQty: min !== null && min > 0 ? Math.floor(min) : null,
  };
}

/**
 * Whether the booking flow should ask this vendor's customers "how many?".
 *
 * Narrower than `readUnitConfig` on purpose: a unit line the server will never
 * bill must not be given a step that implies it will.
 */
export function sellsByTheUnit(business: any): boolean {
  if (!readUnitConfig(business)) return false;
  const packages = Array.isArray(business?.packages) ? business.packages : [];
  const menus = Array.isArray(business?.menus) ? business.menus : [];
  return packages.length === 0 && menus.length === 0;
}

/** The priced line for a requested quantity. Mirrors the server exactly. */
export function unitLineFor(cfg: UnitConfig, requestedQty: unknown): UnitLine {
  const asked = num(requestedQty);
  const requested = asked !== null && asked >= 1 ? Math.floor(asked) : 1;
  const billedQty = Math.max(1, requested, cfg.minUnitQty ?? 0);
  return {
    unitLabel: cfg.unitLabel,
    unitPrice: cfg.unitPrice,
    requestedQty: requested,
    billedQty,
    minUnitQty: cfg.minUnitQty,
    total: Math.round(cfg.unitPrice * billedQty * 100) / 100,
    liftedByMinimum: billedQty > requested,
  };
}

/**
 * "3 cars" / "1 car" / "3 x 100 cards".
 *
 * A vendor's unit label is their own word and may already be plural or contain
 * a number ("100 cards"), so pluralising is limited to appending an "s" to a
 * single bare word. Anything else is left exactly as typed rather than mangled.
 */
export function describeUnitQty(unitLabel: string, qty: number): string {
  const label = unitLabel.trim();
  if (qty === 1) return `1 ${label}`;
  const bare = /^[A-Za-z]+$/.test(label);
  if (!bare) return `${qty} x ${label}`;
  return `${qty} ${label.endsWith("s") ? label : `${label}s`}`;
}
