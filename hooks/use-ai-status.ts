"use client"

/**
 * Phase 5 — shared, cached AI availability.
 *
 * `AiSuggestButton` calls `AiAPI.status()` on every mount, which is fine for a
 * single button but becomes one request per row when an AI affordance hangs off
 * a table. This hook puts the status behind the react-query cache so any number
 * of call sites share exactly one request.
 *
 * Status is a deployment-level fact (is ANTHROPIC_API_KEY set?), not per-user
 * state, so it's cached for the session and never refetched on focus.
 *
 * `retry: false` matters: a 404/5xx on /ai/status must resolve to "AI is off"
 * rather than retrying and then leaving the UI in a loading limbo.
 */

import { useQuery } from "@tanstack/react-query"
import { AiAPI, type AiStatus } from "@/lib/api/ai"

const OFF: AiStatus = {
  configured: false,
  features: { leadReply: false, beoLineItems: false, receiptOcr: false, reviewSummary: false },
}

export function useAiStatus() {
  const { data } = useQuery<AiStatus>({
    queryKey: ["ai-status"],
    queryFn: () => AiAPI.status(),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  })
  return data ?? OFF
}

/** True only when the provider is configured AND this specific feature is on. */
export function useAiFeature(feature: keyof AiStatus["features"]): boolean {
  const status = useAiStatus()
  return !!status.configured && !!status.features[feature]
}
