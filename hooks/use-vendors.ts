'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { VendorAPI } from '@/lib/api/vendors'
import type { Vendor } from '@/lib/types'

// Query keys for React Query
export const vendorKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorKeys.all, 'list'] as const,
  list: (filters: string) => [...vendorKeys.lists(), { filters }] as const,
  details: () => [...vendorKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...vendorKeys.details(), id] as const,
  byType: (type: string) => [...vendorKeys.all, 'byType', type] as const,
  featured: () => [...vendorKeys.all, 'featured'] as const,
}

// Hook to get all vendors
export function useVendors() {
  return useQuery({
    queryKey: vendorKeys.lists(),
    queryFn: VendorAPI.getAllBusinesses,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook to get vendors by type
export function useVendorsByType(type: string) {
  return useQuery({
    queryKey: vendorKeys.byType(type),
    queryFn: () => VendorAPI.getBusinessesByVendorType(type),
    enabled: !!type && type !== 'all',
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook to get featured vendors
export function useFeaturedVendors() {
  return useQuery({
    queryKey: vendorKeys.featured(),
    queryFn: async () => {
      const allVendors = await VendorAPI.getAllBusinesses()
      return allVendors
        .filter(vendor => vendor.sponsored || (vendor.rating || 0) >= 4.5)
        .slice(0, 8)
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook to get vendor by ID
export function useVendor(id: string | number) {
  return useQuery({
    queryKey: vendorKeys.detail(id),
    queryFn: () => VendorAPI.getBusinessById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes for individual vendors
    gcTime: 15 * 60 * 1000,
  })
}

// Hook to search vendors
export function useVendorSearch(query: string, type?: string) {
  return useQuery({
    queryKey: vendorKeys.list(`search-${query}-${type || 'all'}`),
    queryFn: () => VendorAPI.searchBusinesses(query, type),
    enabled: !!query && query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000,
  })
}

// Hook to get vendors with pagination
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

// Hook to refresh vendors cache
export function useRefreshVendors() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      // Invalidate all vendor queries
      await queryClient.invalidateQueries({ queryKey: vendorKeys.all })
    },
  })
}

// Hook to prefetch vendors
export function usePrefetchVendors() {
  const queryClient = useQueryClient()
  
  return {
    prefetchAll: () => {
      queryClient.prefetchQuery({
        queryKey: vendorKeys.lists(),
        queryFn: VendorAPI.getAllBusinesses,
        staleTime: 5 * 60 * 1000,
      })
    },
    prefetchByType: (type: string) => {
      queryClient.prefetchQuery({
        queryKey: vendorKeys.byType(type),
        queryFn: () => VendorAPI.getBusinessesByVendorType(type),
        staleTime: 5 * 60 * 1000,
      })
    },
    prefetchFeatured: () => {
      queryClient.prefetchQuery({
        queryKey: vendorKeys.featured(),
        queryFn: async () => {
          const allVendors = await VendorAPI.getAllBusinesses()
          return allVendors
            .filter(vendor => vendor.sponsored || (vendor.rating || 0) >= 4.5)
            .slice(0, 8)
        },
        staleTime: 5 * 60 * 1000,
      })
    },
  }
}
