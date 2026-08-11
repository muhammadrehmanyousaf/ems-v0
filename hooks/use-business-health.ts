"use client";

import { useQuery } from "@tanstack/react-query";
import { BusinessHealthAPI } from "@/lib/api/businessHealth";
import { BusinessesAPI } from "@/lib/api/dashboard";
import { computeHealth, type HealthResult, type HealthSignals } from "@/lib/health/score";

/**
 * The vendor's health score, assembled from two endpoints.
 *
 * Three of the four factors come from /analytics/health-signals. The fourth —
 * listing completeness — already had its own endpoint with a weighted breakdown
 * and suggestions, so this composes it rather than reimplementing a second,
 * subtly different definition of "complete".
 *
 * ── Why each query can fail independently ────────────────────────────────
 *
 * The two are deliberately NOT combined into one request, and neither failure
 * blocks the other. If completeness 500s, the score is still computed from the
 * three signals it did get and reports `coverage: 0.75` with "listing" named in
 * `unknownFactors`. Partial truth beats a spinner, and it beats inventing a
 * zero — which is the whole reason the model accepts unknowns.
 */
export function useBusinessHealth(businessId?: number | string | null): {
  health: HealthResult | null;
  isLoading: boolean;
} {
  const signalsQ = useQuery<HealthSignals>({
    queryKey: ["health-signals", businessId ?? "all"],
    queryFn: () => BusinessHealthAPI.getSignals(businessId),
    staleTime: 60_000,
    retry: false,
  });

  const bid = businessId != null ? Number(businessId) : null;
  const completenessQ = useQuery({
    // Completeness is per-business and has no all-venues form, so it is only
    // asked for when a venue is actually selected. Without one the factor is
    // simply unknown, which the model already handles.
    queryKey: ["business-completeness", bid],
    queryFn: () => BusinessesAPI.getCompleteness(bid as number),
    enabled: bid != null && Number.isFinite(bid),
    staleTime: 5 * 60_000,
    retry: false,
  });

  // `isLoading` is already false for a disabled query (it is pending but idle),
  // so no extra guard is needed for the no-venue-selected case.
  const isLoading = signalsQ.isLoading || completenessQ.isLoading;

  if (!signalsQ.data) return { health: null, isLoading };

  // `score` on the completeness response is 0..100; the model wants 0..1.
  const raw = completenessQ.data?.score;
  const profileCompleteness =
    typeof raw === "number" && Number.isFinite(raw) ? raw / 100 : undefined;

  return {
    health: computeHealth({ ...signalsQ.data, profileCompleteness }),
    isLoading,
  };
}
