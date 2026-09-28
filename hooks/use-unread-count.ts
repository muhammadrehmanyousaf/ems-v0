"use client"

import { useQuery } from "@tanstack/react-query"
import { NotificationAPI } from "@/lib/api/notifications"

/**
 * The unread-notification badge count — fetched once, shared by everyone.
 *
 * WW-PERF. Measured on /dashboard/bookings: `/notifications/unread-count` was
 * requested FOUR times in a single page load, slowest 1,177ms. Four components
 * each ran their own `useEffect` with a raw fetch and no cache:
 *
 *   components/dashboard/layout/champagne-shell.tsx:208
 *   components/dashboard/layout/champagne-user-menu.tsx:35
 *   components/dashboard/mainScreens/artifact/artifact-shell.tsx:816
 *   context/NotificationContext.tsx:196
 *
 * They all want the same number. One React Query key means one request however
 * many of them mount, on every one of the 82 vendor-console pages.
 *
 * This is one instance of a wider pattern in this codebase: 114 `useEffect`
 * blocks call an API class directly, with no caching, no deduplication and no
 * retry policy, against 92 files that do use `useQuery`.
 */
export const unreadCountKey = ["notifications", "unread-count"] as const

export function useUnreadCount() {
  const q = useQuery({
    queryKey: unreadCountKey,
    queryFn: () => NotificationAPI.getUnreadCount(),
    // A badge that is a minute stale costs nothing; the socket pushes real
    // updates (NotificationContext listens for "notification:unread-count").
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  })
  return { unread: q.data ?? 0, isLoading: q.isLoading, refetch: q.refetch }
}
