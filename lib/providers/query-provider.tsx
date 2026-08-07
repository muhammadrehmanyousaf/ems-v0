'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Reduce refetching on window focus
            refetchOnWindowFocus: false,
            // Reduce refetching on reconnect
            refetchOnReconnect: false,
            // Increase stale time to reduce unnecessary refetches
            staleTime: 10 * 60 * 1000, // 10 minutes
            // Increase garbage collection time
            gcTime: 15 * 60 * 1000, // 15 minutes
            // Add retry configuration
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors (client errors)
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false
              }
              // Retry up to 2 times for other errors
              return failureCount < 2
            },
            // Add retry delay
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            /**
             * WWL-411 / WWL-432 / WWL-451 — this was `retry: 1`, which
             * automatically re-sends a failed mutation. Mutations in this app
             * are POSTs that create things, and almost none of them are
             * idempotent, so a flaky network turned one click into two writes.
             * Driven live under injected failure, a single click produced:
             *
             *   POST /promotions                     x2  — two paid placement requests
             *   POST /subscriptions/request-upgrade  x2  — two Rs 2,500/mo intents
             *   POST /collaborations                 x2  — two invites AND two
             *                                             notifications to a real
             *                                             vendor, each separately
             *                                             acceptable
             *
             * A retry is only safe when repeating the call is harmless. That is
             * true of reads, which is why `queries` above still retries; it is
             * not true of a write that books, charges or messages someone.
             *
             * The right way to make a specific mutation retry-safe is an
             * idempotency key on that endpoint, opted into per call site — not a
             * blanket retry across every write in the product.
             */
            retry: 0,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
