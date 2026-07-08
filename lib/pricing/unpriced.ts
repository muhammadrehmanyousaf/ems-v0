/**
 * WW-PRICE0 (frontend mirror) — is this vendor bookable, or price-on-request?
 *
 * Must agree with the server, or a customer clicks "Book now" and gets a
 * 400 `vendor_not_priced` from `pricingService`. The server rule lives in
 * `event-planner-api/src/utils/zeroPriceGuard.js`:
 *
 *   minimumPrice IS NULL / undefined / ""  ->  UNPRICED       (refuse booking)
 *   minimumPrice = 0  (or "0.00")          ->  EXPLICITLY FREE (allow)
 *
 * The RAW value matters: the API serialises DECIMAL as a string, so an explicit
 * zero arrives as `"0.00"` (priced) while a missing one arrives as `null`
 * (unpriced). `Number(x) || 0` collapses the two — that coercion is precisely
 * the bug this whole change exists to fix. Never "simplify" this to a truthiness
 * check.
 *
 * One nuance vs the server: a vendor with NULL minimumPrice but priced packages
 * IS bookable, because the customer selects a package and `actualTotal > 0`. So
 * "unpriced" means: no minimum price AND nothing priced to select.
 */

type Money = number | string | null | undefined;

interface PricedLike {
  minimumPrice?: Money;
  price?: Money;
  packages?: { price?: Money }[] | null;
}

/**
 * True when the value was never set, or is not a parseable number.
 * `0` / `"0.00"` are a real, typed zero and are NOT unset.
 *
 * The unparseable case matters: `Number("abc") || 0` would coerce garbage into a
 * "free" Rs 0 booking — the same bug, one layer up. Unreachable from a DECIMAL
 * column today; guarded anyway.
 */
export function isMoneyUnset(raw: Money): boolean {
  if (raw === null || raw === undefined || raw === "") return true;
  return !Number.isFinite(Number(raw));
}

/** Parse a money value that may arrive as a DECIMAL string. NaN-safe. */
export function toAmount(raw: Money): number | null {
  if (isMoneyUnset(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Any selectable package with a real price above zero. */
export function hasPricedPackage(vendor: PricedLike): boolean {
  return (vendor.packages ?? []).some((p) => {
    const n = toAmount(p?.price);
    return n !== null && n > 0;
  });
}

/**
 * The vendor never declared a price and has nothing priced to select.
 * These render as "Price on request" and route to the inquiry dialog rather
 * than the booking flow — the server would reject the booking anyway.
 */
export function isUnpricedVendor(vendor: PricedLike): boolean {
  if (!isMoneyUnset(vendor.minimumPrice)) return false; // includes an explicit 0
  const legacy = toAmount(vendor.price);
  if (legacy !== null && legacy > 0) return false;
  return !hasPricedPackage(vendor);
}
