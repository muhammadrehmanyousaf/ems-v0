'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { VendorAPI } from '@/lib/api/vendors'
import type { Vendor } from '@/lib/types'

// Query keys
export const vendorKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorKeys.all, 'list'] as const,
  list: (filters: string) => [...vendorKeys.lists(), { filters }] as const,
  details: () => [...vendorKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...vendorKeys.details(), id] as const,
  byType: (type: string) => [...vendorKeys.all, 'byType', type] as const,
  featured: () => [...vendorKeys.all, 'featured'] as const,
}

// Single source of truth: fetch all vendors once, share via TanStack Query cache
export function useVendors() {
  return useQuery({
    queryKey: vendorKeys.lists(),
    // Wrapped, NOT passed by reference. React Query calls queryFn with its own
    // context object, and `getAllBusinesses`'s first parameter is `availableOn`
    // (a YYYY-MM-DD date) — so passing the reference sent the whole context
    // down the wire as a date filter. Observed on the homepage:
    //   /businesses?availableOn[client]=[object+Object]
    //     &availableOn[queryKey][0]=vendors&availableOn[signal]=[object+AbortSignal]
    // The backend ignores it (bookedBusinessIdsOn requires a string matching
    // /^\d{4}-\d{2}-\d{2}$/), so nothing broke — but it also made `data`
    // `unknown` for every caller, which is why the homepage hero and /search
    // were full of untyped vendor loops.
    queryFn: () => VendorAPI.getAllBusinesses(),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

// Filter from the already-cached all-vendors list instead of a separate API call.
// Falls back to a direct API call only if the all-vendors query hasn't loaded yet.
export function useVendorsByType(type: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: vendorKeys.byType(type),
    queryFn: async () => {
      // Try to use already-cached all-vendors data first
      const cached = queryClient.getQueryData<Vendor[]>(vendorKeys.lists())
      if (cached && cached.length > 0) {
        // `subBusinessType` is a Postgres TEXT[] (businessModel.js:147).
        // normalizeBusiness() flattens it to a string, but this reads from the
        // query cache, so tolerate both shapes rather than trusting that —
        // calling .toLowerCase() on an array throws and would fail the whole
        // queryFn. Same two-shape handling as the `catering` readers.
        const want = type.toLowerCase()
        return cached.filter((v) => {
          const subRaw = v.subBusinessType
          const subs = Array.isArray(subRaw) ? subRaw : subRaw ? [subRaw] : []
          return (
            v.vendor?.vendorType?.toLowerCase() === want ||
            subs.some((s) => String(s).toLowerCase() === want)
          )
        })
      }
      // Fallback to dedicated API call
      return VendorAPI.getBusinessesByVendorType(type)
    },
    enabled: !!type && type !== 'all',
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

// Featured vendors: just the first 8 from the all-vendors cache
export function useFeaturedVendors() {
  return useQuery({
    queryKey: vendorKeys.featured(),
    queryFn: async () => {
      const allVendors = await VendorAPI.getAllBusinesses()
      if (allVendors.length === 0) return []
      return allVendors.slice(0, 8)
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

// Get vendor by ID
export function useVendor(id: string | number) {
  return useQuery({
    queryKey: vendorKeys.detail(id),
    queryFn: () => VendorAPI.getBusinessById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

// Search vendors
export function useVendorSearch(query: string, type?: string) {
  return useQuery({
    queryKey: vendorKeys.list(`search-${query}-${type || 'all'}`),
    queryFn: () => VendorAPI.searchBusinesses(query, type),
    enabled: !!query && query.length >= 2,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

// Paginated vendors
export function useVendorsWithPagination(
  page: number = 1,
  limit: number = 12,
  type?: string,
  filters?: {
    city?: string
    minPrice?: number
    maxPrice?: number
    rating?: number
  }
) {
  return useQuery({
    queryKey: vendorKeys.list(`page-${page}-limit-${limit}-type-${type || 'all'}-filters-${JSON.stringify(filters)}`),
    queryFn: () => VendorAPI.getBusinessesWithPagination(type, page, limit, filters),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

// Invalidate all vendor caches
export function useRefreshVendors() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: vendorKeys.all })
    },
  })
}
