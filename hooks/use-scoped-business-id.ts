"use client";

import { useActiveBusinessId } from "@/lib/store/active-business-store";
import { useMyBusinesses } from "@/hooks/use-my-businesses";

/**
 * The venue a create form should write to (WP36 / OPS-018, OPS-034).
 *
 * `activeBusinessId` is null for a vendor who owns ONE venue and never touched the venue switcher, so the create
 * forms of the function-sheet / halal-certificate / generator-fuel / drone-permit screens refused with "choose a venue
 * first" although there was nothing to choose. A single owned venue is the scope; several venues still need a choice
 * (null until the switcher is used, which the forms already ask for).
 */
export function useScopedBusinessId(): number | null {
  const active = useActiveBusinessId();
  const { data } = useMyBusinesses();
  if (active != null) return active;
  return Array.isArray(data) && data.length === 1 ? Number(data[0].id) : null;
}
