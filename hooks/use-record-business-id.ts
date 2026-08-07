"use client";

/**
 * WWL-242 / 262 / 293 / 311 / 332 / 350 — which venue a NEW record belongs to.
 *
 * Seven modules in a row computed it the same wrong way:
 *
 *     const businessId = businesses?.[0]?.id
 *
 * So a vendor working under "All venues" added a commission, a fuel entry, a
 * halal certificate or a drone permit and it landed on whichever venue happened
 * to be first in the array — with no venue field in the form, so they were
 * never asked and never told. Captured live, every time: `businessId: 3358`
 * while the header said All venues.
 *
 * The header's selection is the answer whenever there is one. When there isn't,
 * a single-venue vendor has exactly one possible answer and a multi-venue
 * vendor has none — so this returns `undefined` rather than guessing, and the
 * dialog asks with `RecordVenueField`.
 *
 * Returning `undefined` is the point. A wrong id is worse than no id: the write
 * succeeds, lands on the wrong venue's books, and nothing ever says so.
 */

import { useActiveBusinessId } from "@/lib/store/active-business-store";
import { useMyBusinesses } from "@/hooks/use-my-businesses";

export function useRecordBusinessId(): number | undefined {
  const activeBusinessId = useActiveBusinessId();
  const { data: businesses } = useMyBusinesses();
  const list = businesses ?? [];

  if (activeBusinessId != null && list.some((b) => b.id === activeBusinessId)) {
    return activeBusinessId;
  }
  // Exactly one venue: there is nothing to get wrong.
  if (list.length === 1) return list[0].id;
  return undefined;
}

export default useRecordBusinessId;
