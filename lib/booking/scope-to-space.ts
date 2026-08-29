/**
 * Which packages (or menus) belong to the space being booked.
 *
 * The customer booking flow has enforced this since the hall work landed: a
 * couple booking the 120-seat Terrace Lawn must not be shown — or sold — the
 * Main Hall's 500-guest walima package, because it is not a thing the venue can
 * deliver in the room they are paying for.
 *
 * The VENDOR's own offline-booking form had none of it. It listed every package
 * and every menu on the business regardless of the hall picked, so the two
 * halves of the product disagreed about what was on sale. The founder's report
 * (2026-08-29) was that the convert-to-booking form "should be according to our
 * actual booking format ... package and menu of that selected venue and also
 * selected space".
 *
 * One implementation, used by both, so they cannot drift apart again.
 *
 * The rule, stated once:
 *   - a venue-wide item (`subVenueId == null`) is always offered;
 *   - a space-specific item is offered only when ITS space is the one chosen;
 *   - the chosen space's own items sort FIRST, so the item written for the room
 *     the vendor just picked is not sitting third under two generic ones;
 *   - and if narrowing would leave NOTHING to choose, the full list stands —
 *     an empty package step is a dead end, and a slightly wrong list beats no
 *     list at all on a live booking.
 */

/** Anything carrying an optional sub-venue scope: Package, Menu. */
export interface SpaceScoped {
  subVenueId?: number | string | null;
}

/** True when this item was written for the space the vendor/customer picked. */
export function isOwnedBySpace<T extends SpaceScoped>(
  item: T,
  spaceId: number | null,
): boolean {
  return spaceId != null && Number(item?.subVenueId) === spaceId;
}

export function scopeToSpace<T extends SpaceScoped>(
  items: readonly T[],
  spaceId: number | null,
): T[] {
  const all = items ?? [];
  const scoped = all.filter(
    (p) => p?.subVenueId == null || isOwnedBySpace(p, spaceId),
  );
  const list = scoped.length > 0 ? scoped : [...all];
  // Stable: space-specific first, everything else in the order it arrived.
  return [...list].sort(
    (a, b) => (isOwnedBySpace(a, spaceId) ? 0 : 1) - (isOwnedBySpace(b, spaceId) ? 0 : 1),
  );
}

export default scopeToSpace;
