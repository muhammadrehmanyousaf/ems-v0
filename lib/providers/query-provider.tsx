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
            // Add retry configuration for mutations
            retry: 1,
            retryDelay: 1000,
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
