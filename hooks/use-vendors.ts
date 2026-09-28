'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { VendorAPI } from '@/lib/api/vendors'
import type { Vendor } from '@/lib/types'
import { getVendorTypeFromPath } from '@/lib/vendor-types'

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

/**
 * `useVendors()` used to live here: one query that fetched EVERY page of
 * /businesses and shared the whole catalogue through the React Query cache.
 *
 * WW-PERF — it is gone, not deprecated, because it is the primitive that made
 * "download the entire marketplace" the path of least resistance. Its three
 * callers were the homepage hero (which used it to count city names), /search
 * (which re-implemented the server's filters over it) and the favourites
 * preloader (which never read a row of it). All three now ask the server for
 * what they render: VendorAPI.searchCards() for a page of card-shaped rows, and
 * VendorAPI.getFacets() for counts.
 *
 * `fetchAllBusinessPages` still exists in lib/api/vendors.ts and is still
 * correct — for app/sitemap.ts, which genuinely needs every vendor, once, at
 * build time. It has no business running in a browser.
 */

/**
 * The vendor types the homepage's sections ask for.
 *
 * WW-PERF — these are batched into ONE request. They live here rather than in
 * the page because `useVendorsByType` needs to know, before it fetches, whether
 * the type it was handed is part of the batch: every section calling the hook
 * with a type on this list shares a single query key, so React Query dedupes
 * five components down to one request. A type NOT on the list falls back to its
 * own small fetch, so the hook stays correct for any caller.
 */
export const HOME_SECTION_PATHS = [
  "photographers",
  "venues",
  "makeup-artists",
  "decor",
  "henna-artists",
  "bridal-wear",
  "catering",
  "car-rental",
  "wedding-stationery",
] as const

const HOME_SECTION_TYPES = HOME_SECTION_PATHS.map((p) => getVendorTypeFromPath(p)).filter(Boolean)

/** How many rows a section can render. The widest is EditorialGallerySection at 8. */
const PER_TYPE = 8

/**
 * A handful of vendors of one type, for a homepage section.
 *
 * This used to read the all-vendors cache and, when that cache was empty, fall
 * back to `getBusinessesByVendorType`, which walks EVERY page for that type.
 * Four homepage sections call it and they all mount at once, so the cache was
 * always empty and each one downloaded its own full list: 18 of the homepage's
 * 36 API calls at ~740 KB of JSON each.
 *
 * It then fetched one small page per type — better, but still one request per
 * section. Now the whole set comes back in one call and each section selects
 * its own slice.
 */
export function useVendorsByType(type: string, limit = 12) {
  const batched = !!type && HOME_SECTION_TYPES.includes(type)

  const batch = useQuery({
    queryKey: ["home-sections", HOME_SECTION_TYPES, PER_TYPE],
    queryFn: ({ signal }) => VendorAPI.getByTypes(HOME_SECTION_TYPES, PER_TYPE, signal),
    enabled: batched,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })

  const single = useQuery({
    queryKey: [...vendorKeys.byType(type), { limit }],
    queryFn: ({ signal }) =>
      VendorAPI.searchCards({ vendorTypes: type, limit, signal }).then((r) => r.items),
    enabled: !!type && type !== "all" && !batched,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })

  if (!batched) return single
  return { ...batch, data: batch.data?.[type] ?? [] }
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
