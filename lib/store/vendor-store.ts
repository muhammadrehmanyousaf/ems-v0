import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { VendorAPI } from '@/lib/api/vendors'
import type { Vendor } from '@/lib/types'

// Types
interface VendorFilters {
  search: string
  vendorType: string
  location: string
  priceRange: [number, number]
  rating: number
  capacity: number
  amenities: string[]
}

interface VendorState {
  // Data
  vendors: Vendor[]
  featuredVendors: Vendor[]
  vendorsByType: Record<string, Vendor[]>
  
  // Loading states
  isLoading: boolean
  isLoadingFeatured: boolean
  isLoadingByType: Record<string, boolean>
  
  // Cache management
  lastFetched: number
  cacheExpiry: number
  
  // Filters and pagination
  filters: VendorFilters
  currentPage: number
  totalPages: number
  totalVendors: number
  
  // Actions
  fetchAllVendors: () => Promise<void>
  fetchVendorsByType: (type: string) => Promise<Vendor[]>
  fetchFeaturedVendors: () => Promise<void>
  setFilters: (filters: Partial<VendorFilters>) => void
  clearFilters: () => void
  getFilteredVendors: () => Vendor[]
  getVendorById: (id: string | number) => Vendor | null
  refreshCache: () => void
  clearCache: () => void
}

// Constants
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const DEFAULT_FILTERS: VendorFilters = {
  search: '',
  vendorType: 'all',
  location: '',
  priceRange: [0, 1000000],
  rating: 0,
  capacity: 0,
  amenities: []
}

// Create the store
export const useVendorStore = create<VendorState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        vendors: [],
        featuredVendors: [],
        vendorsByType: {},
        isLoading: false,
        isLoadingFeatured: false,
        isLoadingByType: {},
        lastFetched: 0,
        cacheExpiry: CACHE_DURATION,
        filters: DEFAULT_FILTERS,
        currentPage: 1,
        totalPages: 1,
        totalVendors: 0,

        // Fetch all vendors with caching
        fetchAllVendors: async () => {
          const { lastFetched, cacheExpiry, vendors } = get()
          const now = Date.now()

          // Return cached data if still valid
          if (vendors.length > 0 && (now - lastFetched) < cacheExpiry) {
            console.log('💾 Using cached vendors data')
            return
          }

          set({ isLoading: true })

          try {
            console.log('🌐 Fetching all vendors from API...')
            const allVendors = await VendorAPI.getAllBusinesses()
            
            set({
              vendors: allVendors,
              totalVendors: allVendors.length,
              lastFetched: now,
              isLoading: false
            })

            console.log(`✅ Loaded ${allVendors.length} vendors`)
          } catch (error) {
            console.error('❌ Error fetching vendors:', error)
            set({ isLoading: false })
          }
        },

        // Fetch vendors by type with caching
        fetchVendorsByType: async (type: string) => {
          const { vendorsByType, isLoadingByType, lastFetched, cacheExpiry } = get()
          const now = Date.now()

          // Return cached data if still valid
          if (vendorsByType[type] && (now - lastFetched) < cacheExpiry) {
            console.log(`💾 Using cached ${type} vendors`)
            return vendorsByType[type]
          }

          // Set loading state for this type
          set({
            isLoadingByType: { ...isLoadingByType, [type]: true }
          })

          try {
            console.log(`🌐 Fetching ${type} vendors from API...`)
            const typeVendors = await VendorAPI.getBusinessesByVendorType(type)
            
            set({
              vendorsByType: { ...vendorsByType, [type]: typeVendors },
              isLoadingByType: { ...isLoadingByType, [type]: false }
            })

            console.log(`✅ Loaded ${typeVendors.length} ${type} vendors`)
            return typeVendors
          } catch (error) {
            console.error(`❌ Error fetching ${type} vendors:`, error)
            set({
              isLoadingByType: { ...isLoadingByType, [type]: false }
            })
            return []
          }
        },

        // Fetch featured vendors
        fetchFeaturedVendors: async () => {
          const { lastFetched, cacheExpiry, featuredVendors } = get()
          const now = Date.now()

          // Return cached data if still valid
          if (featuredVendors.length > 0 && (now - lastFetched) < cacheExpiry) {
            console.log('💾 Using cached featured vendors')
            return
          }

          set({ isLoadingFeatured: true })

          try {
            console.log('🌐 Fetching featured vendors...')
            const allVendors = await VendorAPI.getAllBusinesses()
            const featured = allVendors
              .filter(vendor => vendor.sponsored || vendor.rating >= 4.5)
              .slice(0, 8)

            set({
              featuredVendors: featured,
              isLoadingFeatured: false
            })

            console.log(`✅ Loaded ${featured.length} featured vendors`)
          } catch (error) {
            console.error('❌ Error fetching featured vendors:', error)
            set({ isLoadingFeatured: false })
          }
        },

        // Set filters
        setFilters: (newFilters) => {
          set({
            filters: { ...get().filters, ...newFilters },
            currentPage: 1 // Reset to first page when filters change
          })
        },

        // Clear filters
        clearFilters: () => {
          set({
            filters: DEFAULT_FILTERS,
            currentPage: 1
          })
        },

        // Get filtered vendors
        getFilteredVendors: () => {
          const { vendors, filters } = get()
          let filtered = [...vendors]

          // Search filter
          if (filters.search.trim()) {
            const searchTerm = filters.search.toLowerCase().trim()
            filtered = filtered.filter(vendor => {
              const nameMatch = vendor.name?.toLowerCase().includes(searchTerm)
              const locationMatch = vendor.location?.toLowerCase().includes(searchTerm)
              const cityMatch = vendor.city?.toLowerCase().includes(searchTerm)
              const typeMatch = vendor.type?.toLowerCase().includes(searchTerm)
              const subTypeMatch = vendor.subBusinessType?.toLowerCase().includes(searchTerm)
              
              return nameMatch || locationMatch || cityMatch || typeMatch || subTypeMatch
            })
          }

          // Vendor type filter
          if (filters.vendorType !== 'all') {
            filtered = filtered.filter(vendor => {
              const vendorType = vendor.type || vendor.subBusinessType || ''
              return vendorType.toLowerCase() === filters.vendorType.toLowerCase()
            })
          }

          // Location filter
          if (filters.location.trim()) {
            const locationTerm = filters.location.toLowerCase().trim()
            filtered = filtered.filter(vendor => {
              const locationMatch = vendor.location?.toLowerCase().includes(locationTerm)
              const cityMatch = vendor.city?.toLowerCase().includes(locationTerm)
              return locationMatch || cityMatch
            })
          }

          // Price range filter
          filtered = filtered.filter(vendor => {
            const price = vendor.minimumPrice || 0
            return price >= filters.priceRange[0] && price <= filters.priceRange[1]
          })

          // Rating filter
          if (filters.rating > 0) {
            filtered = filtered.filter(vendor => (vendor.rating || 0) >= filters.rating)
          }

          // Capacity filter
          if (filters.capacity > 0) {
            filtered = filtered.filter(vendor => (vendor.maxCapacity || 0) >= filters.capacity)
          }

          // Amenities filter
          if (filters.amenities.length > 0) {
            filtered = filtered.filter(vendor => {
              const vendorAmenities = vendor.amenities || []
              return filters.amenities.some(amenity => 
                vendorAmenities.some(vendorAmenity => 
                  vendorAmenity.toLowerCase().includes(amenity.toLowerCase())
                )
              )
            })
          }

          return filtered
        },

        // Get vendor by ID
        getVendorById: (id) => {
          const { vendors } = get()
          return vendors.find(vendor => vendor.id.toString() === id.toString()) || null
        },

        // Refresh cache
        refreshCache: () => {
          set({ lastFetched: 0 })
        },

        // Clear cache
        clearCache: () => {
          set({
            vendors: [],
            featuredVendors: [],
            vendorsByType: {},
            lastFetched: 0
          })
        }
      }),
      {
        name: 'vendor-store',
        partialize: (state) => ({
          vendors: state.vendors,
          featuredVendors: state.featuredVendors,
          vendorsByType: state.vendorsByType,
          lastFetched: state.lastFetched
        })
      }
    ),
    {
      name: 'vendor-store'
    }
  )
)
