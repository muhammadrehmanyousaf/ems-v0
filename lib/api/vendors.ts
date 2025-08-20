import axios from 'axios'
import { BACKEND_URL } from '@/lib/backend-url'
import type { Vendor } from '@/lib/types'
import { getErrorMessage, shouldUseCache } from '@/lib/utils/health-check'

// API endpoints
const API_ENDPOINTS = {
  ALL_BUSINESSES: `${BACKEND_URL}api/v1/businesses`,
  BUSINESSES_BY_VENDOR: `${BACKEND_URL}api/v1/businesses/businesses-by-vendor`,
} as const

// Create axios instance with better configuration
const apiClient = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('❌ Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      code: error.code
    })
    return Promise.reject(error)
  }
)

// Helper function to get cached vendors
const getCachedVendors = (): Vendor[] => {
  try {
    const cached = localStorage.getItem('all_vendors')
    return cached ? JSON.parse(cached) : []
  } catch (error) {
    console.log('⚠️ Could not read cached vendors:', error)
    return []
  }
}

// Helper function to cache vendors
const cacheVendors = (vendors: Vendor[]) => {
  try {
    localStorage.setItem('all_vendors', JSON.stringify(vendors))
    console.log('💾 Cached vendors in localStorage')
  } catch (error) {
    console.log('⚠️ Could not cache vendors:', error)
  }
}

// API service for vendors
export class VendorAPI {
  // Get all businesses with better error handling
  static async getAllBusinesses(): Promise<Vendor[]> {
    try {
      console.log(`🌐 Calling API: ${API_ENDPOINTS.ALL_BUSINESSES}`)
      const response = await apiClient.get(API_ENDPOINTS.ALL_BUSINESSES)
      const vendors = response.data.data || []
      
      // Cache the vendors
      cacheVendors(vendors)
      
      return vendors
    } catch (error: any) {
      console.error('❌ Error fetching all businesses:', error)
      console.error('📝 Error details:', getErrorMessage(error))
      
      // Return cached data if available and appropriate
      if (shouldUseCache(error)) {
        const cachedVendors = getCachedVendors()
        if (cachedVendors.length > 0) {
          console.log('🔄 Using cached vendors as fallback')
          return cachedVendors
        }
      }
      
      return []
    }
  }

  // Get businesses by vendor type
  static async getBusinessesByVendorType(vendorType: string): Promise<Vendor[]> {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.BUSINESSES_BY_VENDOR}?vendorType=${encodeURIComponent(vendorType)}`)
      const vendors = response.data.data || []
      
      // Cache the vendors
      cacheVendors(vendors)
      
      return vendors
    } catch (error: any) {
      console.error(`Error fetching businesses for vendor type ${vendorType}:`, error)
      
      // Return cached data filtered by type if available
      const cachedVendors = getCachedVendors()
      if (cachedVendors.length > 0) {
        console.log('🔄 Using cached vendors filtered by type as fallback')
        return cachedVendors.filter(vendor => 
          vendor.type?.toLowerCase() === vendorType.toLowerCase() ||
          vendor.subBusinessType?.toLowerCase() === vendorType.toLowerCase()
        )
      }
      
      return []
    }
  }

  // Get businesses with pagination
  static async getBusinessesWithPagination(
    vendorType?: string,
    page: number = 1,
    limit: number = 10,
    filters?: {
      city?: string
      minPrice?: number
      maxPrice?: number
      rating?: number
    }
  ): Promise<{
    data: Vendor[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(vendorType && { vendorType }),
        ...(filters?.city && { city: filters.city }),
        ...(filters?.minPrice && { minPrice: filters.minPrice.toString() }),
        ...(filters?.maxPrice && { maxPrice: filters.maxPrice.toString() }),
        ...(filters?.rating && { rating: filters.rating.toString() }),
      })

      const url = vendorType 
        ? `${API_ENDPOINTS.BUSINESSES_BY_VENDOR}?${params}`
        : `${API_ENDPOINTS.ALL_BUSINESSES}?${params}`

      const response = await apiClient.get(url)
      const data = response.data.data || []
      const total = response.data.total || data.length
      const totalPages = Math.ceil(total / limit)

      // Cache the vendors
      cacheVendors(data)

      return {
        data,
        total,
        page,
        limit,
        totalPages
      }
    } catch (error: any) {
      console.error('Error fetching businesses with pagination:', error)
      
      // Return cached data with pagination if available
      const cachedVendors = getCachedVendors()
      if (cachedVendors.length > 0) {
        console.log('🔄 Using cached vendors with pagination as fallback')
        
        let filtered = [...cachedVendors]
        
        // Apply filters
        if (vendorType) {
          filtered = filtered.filter(vendor => 
            vendor.type?.toLowerCase() === vendorType.toLowerCase() ||
            vendor.subBusinessType?.toLowerCase() === vendorType.toLowerCase()
          )
        }
        
        if (filters?.city) {
          filtered = filtered.filter(vendor => 
            vendor.city?.toLowerCase().includes(filters.city!.toLowerCase()) ||
            vendor.location?.toLowerCase().includes(filters.city!.toLowerCase())
          )
        }
        
        if (filters?.minPrice) {
          filtered = filtered.filter(vendor => 
            (vendor.minimumPrice || 0) >= filters.minPrice!
          )
        }
        
        if (filters?.maxPrice) {
          filtered = filtered.filter(vendor => 
            (vendor.minimumPrice || 0) <= filters.maxPrice!
          )
        }
        
        if (filters?.rating) {
          filtered = filtered.filter(vendor => 
            (vendor.rating || 0) >= filters.rating!
          )
        }
        
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedData = filtered.slice(startIndex, endIndex)
        
        return {
          data: paginatedData,
          total: filtered.length,
          page,
          limit,
          totalPages: Math.ceil(filtered.length / limit)
        }
      }
      
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      }
    }
  }

  // Search businesses
  static async searchBusinesses(
    query: string,
    vendorType?: string
  ): Promise<Vendor[]> {
    try {
      const params = new URLSearchParams({
        search: query,
        ...(vendorType && { vendorType }),
      })

      const url = vendorType 
        ? `${API_ENDPOINTS.BUSINESSES_BY_VENDOR}?${params}`
        : `${API_ENDPOINTS.ALL_BUSINESSES}?${params}`

      const response = await apiClient.get(url)
      const vendors = response.data.data || []
      
      // Cache the vendors
      cacheVendors(vendors)
      
      return vendors
    } catch (error: any) {
      console.error('Error searching businesses:', error)
      
      // Return cached data with search if available
      const cachedVendors = getCachedVendors()
      if (cachedVendors.length > 0) {
        console.log('🔄 Using cached vendors with search as fallback')
        
        let filtered = [...cachedVendors]
        
        // Apply search filter
        const searchTerm = query.toLowerCase().trim()
        filtered = filtered.filter(vendor => {
          const nameMatch = vendor.name?.toLowerCase().includes(searchTerm)
          const locationMatch = vendor.location?.toLowerCase().includes(searchTerm)
          const cityMatch = vendor.city?.toLowerCase().includes(searchTerm)
          const typeMatch = vendor.type?.toLowerCase().includes(searchTerm)
          const subTypeMatch = vendor.subBusinessType?.toLowerCase().includes(searchTerm)
          
          return nameMatch || locationMatch || cityMatch || typeMatch || subTypeMatch
        })
        
        // Apply vendor type filter if specified
        if (vendorType) {
          filtered = filtered.filter(vendor => 
            vendor.type?.toLowerCase() === vendorType.toLowerCase() ||
            vendor.subBusinessType?.toLowerCase() === vendorType.toLowerCase()
          )
        }
        
        return filtered
      }
      
      return []
    }
  }

  // Get featured businesses (you can customize this based on your backend)
  static async getFeaturedBusinesses(vendorType?: string): Promise<Vendor[]> {
    try {
      const allVendors = await this.getAllBusinesses()
      let featured = allVendors.filter(vendor => 
        vendor.sponsored || (vendor.rating || 0) >= 4.5
      )
      
      if (vendorType) {
        featured = featured.filter(vendor => 
          vendor.type?.toLowerCase() === vendorType.toLowerCase() ||
          vendor.subBusinessType?.toLowerCase() === vendorType.toLowerCase()
        )
      }
      
      return featured.slice(0, 8)
    } catch (error: any) {
      console.error('Error fetching featured businesses:', error)
      return []
    }
  }

  // Get business by ID
  static async getBusinessById(id: string | number): Promise<Vendor | null> {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.ALL_BUSINESSES}/${id}`)
      return response.data.data || null
    } catch (error: any) {
      console.error(`Error fetching business with ID ${id}:`, error)
      
      // Try to find in cached data
      const cachedVendors = getCachedVendors()
      const cachedVendor = cachedVendors.find(vendor => vendor.id == id)
      if (cachedVendor) {
        console.log('🔄 Using cached vendor as fallback')
        return cachedVendor
      }
      
      return null
    }
  }

  // Get businesses by city
  static async getBusinessesByCity(city: string): Promise<Vendor[]> {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.ALL_BUSINESSES}?city=${encodeURIComponent(city)}`)
      const vendors = response.data.data || []
      
      // Cache the vendors
      cacheVendors(vendors)
      
      return vendors
    } catch (error: any) {
      console.error(`Error fetching businesses for city ${city}:`, error)
      
      // Return cached data filtered by city if available
      const cachedVendors = getCachedVendors()
      if (cachedVendors.length > 0) {
        console.log('🔄 Using cached vendors filtered by city as fallback')
        return cachedVendors.filter(vendor => 
          vendor.city?.toLowerCase().includes(city.toLowerCase()) ||
          vendor.location?.toLowerCase().includes(city.toLowerCase())
        )
      }
      
      return []
    }
  }
}

// Hook for using vendor data (for React components)
export const useVendorData = () => {
  return {
    getAllBusinesses: VendorAPI.getAllBusinesses,
    getBusinessesByVendorType: VendorAPI.getBusinessesByVendorType,
    getBusinessesWithPagination: VendorAPI.getBusinessesWithPagination,
    searchBusinesses: VendorAPI.searchBusinesses,
    getFeaturedBusinesses: VendorAPI.getFeaturedBusinesses,
    getBusinessById: VendorAPI.getBusinessById,
  }
} 