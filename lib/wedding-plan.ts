/**
 * Shaadi Plan — feature flag helper.
 *
 * Mirrors the quote-negotiation / offline-outbox pilot-flag pattern
 * (`lib/outbox.ts:isOutboxEnabled`): the whole "Book my whole wedding"
 * cart surface stays dark unless the build enables it via env
 * (`NEXT_PUBLIC_FEAT_WEDDING_PLAN=true`) OR a per-device localStorage
 * override (`FEAT_WEDDING_PLAN=true`) for pilot testing.
 *
 * `isWeddingPlanEnabled()` returns false during SSR (`window`
 * undefined) so the server render never leaks the surface. Consumers
 * that render UI MUST resolve the flag inside a mount effect (see
 * `useWeddingPlanFlag`) so the first client render matches the server
 * render and React never throws a hydration mismatch.
 *
 * BE gates the matching `/api/v1/wedding-plans/*` router at the
 * global/env level (a plan spans many businesses, so per-business
 * gating doesn't fit) and 404s when off — so even if this helper is
 * flipped on client-side, the API stays closed until the deployment
 * turns the backend flag on too.
 */

import { useEffect, useState } from "react";

export const WEDDING_PLAN_FLAG_KEY = "FEAT_WEDDING_PLAN";

/** Pure check — env true OR localStorage override. SSR-safe (false). */
export function isWeddingPlanEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    process.env.NEXT_PUBLIC_FEAT_WEDDING_PLAN === "true" ||
    window.localStorage?.getItem(WEDDING_PLAN_FLAG_KEY) === "true"
  );
}

/**
 * Hydration-safe React hook. Always returns `false` on the first
 * render (server + initial client), then resolves the real flag value
 * after mount — so gated UI appears only client-side and never causes
 * a mismatch. Use this anywhere the flag decides what to render.
 */
export function useWeddingPlanFlag(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(isWeddingPlanEnabled());
  }, []);
  return enabled;
}
