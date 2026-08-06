"use client";

import { useQuery } from "@tanstack/react-query";
import { BusinessesAPI, type ApiBusiness } from "@/lib/api/dashboard";

/**
 * The signed-in vendor's own venues, by name.
 *
 * Shares the `["my-businesses"]` query key already used by Brokers, Drone-NOC,
 * Function sheets, Generator fuel and Business settings, so adding this hook to
 * the Venue-OS panels costs zero extra requests — TanStack dedupes on the key.
 *
 * Exists because Venue-OS scoping had no way to turn "which venue?" into
 * anything a human can answer: every panel asked for a numeric `businessId` that
 * only appears in the database.
 */
export function useMyBusinesses() {
  return useQuery<ApiBusiness[]>({
    queryKey: ["my-businesses"],
    queryFn: () => BusinessesAPI.getUserBusinesses(),
    staleTime: 5 * 60_000,
  });
}
