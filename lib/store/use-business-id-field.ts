"use client";

import * as React from "react";
import { useActiveBusinessId } from "./active-business-store";

/**
 * `businessId` text-field state for Venue-OS panels.
 *
 * Historically every panel started blank and made the operator type their
 * business id by hand — on every panel, every visit — which left the whole
 * Venue-OS console looking dead (all action buttons are `disabled={!businessId}`)
 * until a number was typed. This pre-fills the field with the venue currently
 * selected in the dashboard header (the active-business store), while still
 * letting the operator override it for cross-venue lookups.
 *
 * Additive + safe: when no venue is active ("All venues" → `activeBusinessId` is
 * null) and the operator hasn't typed anything, the value is `""` — byte-identical
 * to the old behaviour. Drop-in replacement for `React.useState<string>("")`.
 */
export function useBusinessIdField(): [string, React.Dispatch<React.SetStateAction<string>>] {
  const activeBusinessId = useActiveBusinessId();
  const activeStr = activeBusinessId != null ? String(activeBusinessId) : "";

  // `override` is what the operator typed; null = "follow the active venue".
  const [override, setOverride] = React.useState<string | null>(null);

  const value = override != null ? override : activeStr;

  const setValue = React.useCallback<React.Dispatch<React.SetStateAction<string>>>(
    (next) =>
      setOverride((prev) => {
        const base = prev != null ? prev : activeStr;
        return typeof next === "function" ? (next as (p: string) => string)(base) : next;
      }),
    [activeStr],
  );

  return [value, setValue];
}
