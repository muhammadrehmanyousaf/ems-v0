"use client";

import { useQuery } from "@tanstack/react-query";
import { BusinessesAPI, type ApiBusiness } from "@/lib/api/dashboard";
import { businessListKey } from "@/lib/query/business-keys";
import { useUser } from "@/context/UserContext";

/**
 * The signed-in vendor's own venues. ONE request per session, for the whole portal.
 *
 * WW-PERF. `GET /businesses/user-business` was fetched under five different
 * query keys — `biz-settings-hub`, `settings-businesses`, `blocked-dates-
 * businesses`, `my-businesses` and `['businesses','mine']` — plus three raw
 * promises in `useEffect`s. TanStack dedupes on the key, so five keys meant
 * five caches: the shell's venue switcher fetched the list on every navigation
 * and the screen underneath fetched the same list again beside it.
 *
 * Worse, all but one of those call sites passed no `staleTime`, and the default
 * is 0 — so each one refetched on every single mount. That is why a vendor
 * screen showed two `/businesses/user-business` requests where one would do,
 * and why the list was re-downloaded on every click in the rail.
 *
 * Every reader now shares this hook and therefore this key. Adding a fifteenth
 * screen costs zero requests.
 *
 * `staleTime` is generous because a vendor's business list changes when THEY
 * change it, and every mutation that changes it calls `invalidateBusinessData`.
 */
export function useMyBusinesses(options?: { enabled?: boolean }) {
  const { user, isAuthenticated } = useUser();
  // Gated on auth: the switcher lives in the shell and used to guard its fetch
  // with `if (!user) return`. Without this the shared hook would fire a 401 on
  // any render that happens before the session resolves.
  const enabled = (options?.enabled ?? true) && !!isAuthenticated && !!user;

  return useQuery<ApiBusiness[]>({
    queryKey: businessListKey,
    queryFn: () => BusinessesAPI.getUserBusinesses(),
    enabled,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    // Keep showing what we have on a transient failure rather than blanking the
    // venue switcher — behaviour inherited from BusinessContext.
    retry: 1,
  });
}
