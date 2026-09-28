"use client";

import { useQuery } from "@tanstack/react-query";
import { UsersAPI } from "@/lib/api/dashboard";
import { useUser } from "@/context/UserContext";

/** THE key for `GET /users/profile/me`. Invalidate this after any profile save. */
export const myProfileKey = ["users", "profile", "me"] as const;

/**
 * The signed-in user's own profile record.
 *
 * WW-PERF, same fault as `useMyBusinesses`: `/users/profile/me` was fetched
 * under `profile-me` (the profile editor) and `account-settings-redesigned`
 * (the account screen), neither with a `staleTime`, so each refetched the same
 * record on every mount and neither could see the other's result. One key, one
 * request, and a save on either screen now refreshes both.
 */
export function useMyProfile() {
  const { isAuthenticated } = useUser();
  return useQuery({
    queryKey: myProfileKey,
    queryFn: () => UsersAPI.getMyProfile(),
    enabled: !!isAuthenticated,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}
