"use client";

import * as React from "react";
import { useActiveBusinessId } from "./active-business-store";
import { useMyBusinesses } from "@/hooks/use-my-businesses";

/**
 * `businessId` state for Venue-OS panels.
 *
 * Historically every panel started blank and made the operator type their
 * business id by hand — on every panel, every visit — which left the whole
 * Venue-OS console looking dead (all action buttons are `disabled={!businessId}`)
 * until a number was typed. Pre-filling from the venue selected in the dashboard
 * header fixed that for a vendor who had picked one.
 *
 * It did NOT fix the default. "All venues" is the header's persisted default, and
 * under it `activeBusinessId` is null — so Spaces, Cash & Cheques, Kitchen and
 * half of Money & Expenses rendered their shells and then loaded nothing at all,
 * with the only clue being a placeholder inside a box labelled "Venue #". A
 * vendor cannot know their venue is #3358. So the last resort is the vendor's
 * FIRST venue, which makes every panel work on arrival.
 *
 * Precedence — the header still wins:
 *   1. what the operator picked in this panel  (cross-venue lookup)
 *   2. the venue active in the dashboard header
 *   3. the vendor's first venue                (only under "All venues")
 *
 * (3) is deliberately NOT the silent `businesses?.[0]?.id` that this codebase
 * gets wrong elsewhere: it never overrides an active header selection, and
 * `BusinessScopeField` renders a named dropdown alongside it, so a multi-venue
 * owner can always see which venue the numbers belong to and switch.
 */
export function useBusinessIdField(): [string, React.Dispatch<React.SetStateAction<string>>] {
  const activeBusinessId = useActiveBusinessId();
  const { data: businesses } = useMyBusinesses();

  const activeStr = activeBusinessId != null ? String(activeBusinessId) : "";
  const firstStr = businesses?.length ? String(businesses[0].id) : "";
  const resolved = activeStr || firstStr;

  // `override` is what the operator picked; null = "follow the header".
  const [override, setOverride] = React.useState<string | null>(null);

  const value = override != null ? override : resolved;

  const setValue = React.useCallback<React.Dispatch<React.SetStateAction<string>>>(
    (next) =>
      setOverride((prev) => {
        const base = prev != null ? prev : resolved;
        return typeof next === "function" ? (next as (p: string) => string)(base) : next;
      }),
    [resolved],
  );

  return [value, setValue];
}
