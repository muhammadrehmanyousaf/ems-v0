/**
 * How many units a customer may ask for in one booking (VENDORTYPES-022; the server half is
 * createBookingCore's UNIT_STOCK_MODE check, VENDORTYPES-011).
 *
 * The package step's stepper was `Math.max(1, qty + n)`: no ceiling, so "5 vehicles" could be asked of a
 * fleet of 3, and no floor, so a stationery printer's minimum order was ignored. The bounds come from what the
 * vendor registered: a car-rental package carries `features.unitsAvailable` ("3 Units"); a stationery business
 * carries its minimum order in `minCapacity`.
 */

export interface QuantityBounds { min: number; max: number | null }

function leadingInt(v: unknown): number | null {
  const raw = Array.isArray(v) ? v[0] : v;
  const n = parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** features is stored either as { unitsAvailable: ["3 Units"] } (registration) or an array of {name, values}. */
export function unitsAvailableOf(pkg: { features?: unknown } | null | undefined): number | null {
  const f = pkg?.features as unknown;
  if (!f) return null;
  if (!Array.isArray(f) && typeof f === "object") return leadingInt((f as Record<string, unknown>).unitsAvailable);
  if (Array.isArray(f)) {
    const hit = (f as Array<Record<string, unknown>>).find((x) => x && (x.name === "unitsAvailable" || x.key === "unitsAvailable"));
    return hit ? leadingInt(hit.values ?? hit.value) : null;
  }
  return null;
}

export function quantityBounds(pkg: { features?: unknown } | null | undefined, o: { isCarRental?: boolean; minOrder?: number | null } = {}): QuantityBounds {
  const max = o.isCarRental ? unitsAvailableOf(pkg) : null;
  const minOrder = o.minOrder && o.minOrder > 0 ? Math.floor(o.minOrder) : 1;
  return { min: max != null ? Math.min(minOrder, max) : minOrder, max };
}

export function clampQuantity(n: number, b: QuantityBounds): number {
  const lo = Math.max(1, b.min);
  const v = Math.max(lo, Math.floor(Number.isFinite(n) ? n : lo));
  return b.max != null ? Math.min(v, Math.max(lo, b.max)) : v;
}
