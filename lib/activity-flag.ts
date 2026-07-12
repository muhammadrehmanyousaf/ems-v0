/**
 * Activity & Audit Engine — feature-flag helper (mirrors lib/wedding-plan.ts).
 *
 * The activity surfaces (user feed, superadmin console) stay dark unless the
 * build enables them via `NEXT_PUBLIC_FEAT_ACTIVITY_ENGINE=true` OR a per-device
 * localStorage override (`FEAT_ACTIVITY_ENGINE=true`) for pilot testing.
 *
 * `isActivityEngineEnabled()` returns false during SSR so the server render
 * never leaks the surface. UI consumers MUST resolve via the `useActivityFlag()`
 * mount effect so the first client render matches the server render (no
 * hydration mismatch). The BE `/api/v1/activity/*` routes 404 until the backend
 * FEAT_ACTIVITY_ENGINE flag is on too, so flipping this client-side alone shows
 * an empty surface, never real data from a closed backend.
 */
import { useEffect, useState } from "react";

export const ACTIVITY_FLAG_KEY = "FEAT_ACTIVITY_ENGINE";

export function isActivityEngineEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_FEAT_ACTIVITY_ENGINE === "true") return true;
  if (typeof window !== "undefined") {
    try {
      if (window.localStorage.getItem(ACTIVITY_FLAG_KEY) === "true") return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

/** Resolves after mount so SSR (false) matches the first client render. */
export function useActivityFlag(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(isActivityEngineEnabled());
  }, []);
  return on;
}
