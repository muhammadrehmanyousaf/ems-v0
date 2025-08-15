import axios from 'axios'
import { BACKEND_URL } from '@/lib/backend-url'
import type { Vendor } from '@/lib/types'

// API endpoints
const API_ENDPOINTS = {
  ALL_BUSINESSES: `${BACKEND_URL}api/v1/businesses`,
  BUSINESSES_BY_VENDOR: `${BACKEND_URL}api/v1/businesses/businesses-by-vendor`,
} as const

// API service for vendors
export class VendorAPI {
  // Get all businesses
  static async getAllBusinesses(): Promise<Vendor[]> {
    try {
      console.log(`🌐 Calling API: ${API_ENDPOINTS.ALL_BUSINESSES}`)
      const response = await axios.get(API_ENDPOINTS.ALL_BUSINESSES)
      console.log(`✅ API Response:`, response.data)
      const vendors = response.data.data || []
      
      // Store vendors in localStorage for fallback access
      try {
        localStorage.setItem('all_vendors', JSON.stringify(vendors))
        console.log('💾 Stored vendors in localStorage for fallback access')
      } catch (error) {
        console.log('⚠️ Could not store vendors in localStorage:', error)
      }
      
      return vendors
    } catch (error) {
      console.error('❌ Error fetching all businesses:', error)
      return []
    }
  }

  // Get businesses by vendor type
  static async getBusinessesByVendorType(vendorType: string): Promise<Vendor[]> {
    try {
      const response = await axios.get(`${API_ENDPOINTS.BUSINESSES_BY_VENDOR}?vendorType=${encodeURIComponent(vendorType)}`)
      const vendors = response.data.data || []
      
      // Store vendors in localStorage for fallback access
      try {
        localStorage.setItem('all_vendors', JSON.stringify(vendors))
        console.log('💾 Stored vendors in localStorage for fallback access')
      } catch (error) {
        console.log('⚠️ Could not store vendors in localStorage:', error)
      }
      
      return vendors
    } catch (error) {
      console.error(`Error fetching businesses for vendor type ${vendorType}:`, error)
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

      const response = await axios.get(url)
      const data = response.data.data || []
      const total = response.data.total || data.length
      const totalPages = Math.ceil(total / limit)

      // Store vendors in localStorage for fallback access
      try {
        localStorage.setItem('all_vendors', JSON.stringify(data))
        console.log('💾 Stored vendors in localStorage for fallback access')
      } catch (error) {
        console.log('⚠️ Could not store vendors in localStorage:', error)
      }

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      }
    } catch (error) {
      console.error('Error fetching businesses with pagination:', error)
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

      const response = await axios.get(url)
      const vendors = response.data.data || []
      
      // Store vendors in localStorage for fallback access
      try {
        localStorage.setItem('all_vendors', JSON.stringify(vendors))
        console.log('💾 Stored vendors in localStorage for fallback access')
      } catch (error) {
        console.log('⚠️ Could not store vendors in localStorage:', error)
      }
      
      return vendors
    } catch (error) {
      console.error('Error searching businesses:', error)
      return []
    }
  }

  // Get featured businesses (you can customize this based on your backend)
  static async getFeaturedBusinesses(vendorType?: string): Promise<Vendor[]> {
    try {
      console.log(`🔍 Fetching featured businesses for vendor type: ${vendorType || 'all'}`)
      
      const businesses = vendorType 
        ? await this.getBusinessesByVendorType(vendorType)
        : await this.getAllBusinesses()
      
      console.log(`📊 Found ${businesses.length} businesses`)
      
      // Filter featured businesses (you can adjust this logic)
      const featured = businesses
        .filter(business => business.rating >= 4.0) // Lowered rating threshold
        .sort((a, b) => b.rating - a.rating) // Sort by rating
        .slice(0, 8) // Limit to 8 featured businesses
      
      console.log(`⭐ Featured businesses: ${featured.length}`)
      
      // If no featured businesses found, return some mock data for testing
      if (featured.length === 0) {
        console.log('⚠️ No featured businesses found, returning mock data')
        return this.getMockData(vendorType)
      }
      
      return featured
    } catch (error) {
      console.error('❌ Error fetching featured businesses:', error)
      console.log('🔄 Returning mock data due to API error')
      return this.getMockData(vendorType)
    }
  }

  // Mock data for testing when API is not available
  private static getMockData(vendorType?: string): Vendor[] {
    const mockData: Vendor[] = [
      {
        id: 1,
        name: "Premium Wedding Photography",
        type: vendorType || "Photographer",
        subBusinessType: vendorType || "Photographer",
        images: ["https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg"],
        location: "Mumbai, Maharashtra",
        city: "Mumbai",
        rating: 4.8,
        reviews: [{ id: 1, rating: 5, comment: "Amazing work!" }],
        price: 25000,
        minimumPrice: 25000,
        capacity: 100,
        amenities: ["Professional Equipment", "Album", "Video"],
        sponsored: true
      },
      {
        id: 2,
        name: "Elegant Wedding Venues",
        type: vendorType || "Wedding venue",
        subBusinessType: vendorType || "Wedding venue",
        images: ["https://images.pexels.com/photos/169193/pexels-photo-169193.jpeg"],
        location: "Delhi, NCR",
        city: "Delhi",
        rating: 4.6,
        reviews: [{ id: 2, rating: 4, comment: "Beautiful venue!" }],
        price: 150000,
        minimumPrice: 150000,
        capacity: 200,
        amenities: ["Parking", "Catering", "Decoration"],
        sponsored: false
      },
      {
        id: 3,
        name: "Glamour Makeup Studio",
        type: vendorType || "Makeup artist",
        subBusinessType: vendorType || "Makeup artist",
        images: ["https://images.pexels.com/photos/457701/pexels-photo-457701.jpeg"],
        location: "Bangalore, Karnataka",
        city: "Bangalore",
        rating: 4.7,
        reviews: [{ id: 3, rating: 5, comment: "Perfect makeup!" }],
        price: 15000,
        minimumPrice: 15000,
        capacity: 50,
        amenities: ["Bridal Makeup", "Hair Styling", "Touch-ups"],
        sponsored: true
      },
      {
        id: 4,
        name: "Royal Decor Services",
        type: vendorType || "Decorator",
        subBusinessType: vendorType || "Decorator",
        images: ["https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg"],
        location: "Chennai, Tamil Nadu",
        city: "Chennai",
        rating: 4.5,
        reviews: [{ id: 4, rating: 4, comment: "Stunning decorations!" }],
        price: 75000,
        minimumPrice: 75000,
        capacity: 150,
        amenities: ["Flowers", "Lighting", "Backdrop"],
        sponsored: false
      }
    ]
    
    // Store mock data in localStorage for fallback access
    try {
      localStorage.setItem('all_vendors', JSON.stringify(mockData))
      console.log('💾 Stored mock vendors in localStorage for fallback access')
    } catch (error) {
      console.log('⚠️ Could not store mock vendors in localStorage:', error)
    }
    
    return mockData
  }

  // Get business by ID
  static async getBusinessById(id: string | number): Promise<Vendor | null> {
    try {
      console.log(`🔍 Fetching business with ID: ${id}`)
      const response = await axios.get(`${API_ENDPOINTS.ALL_BUSINESSES}/${id}`)
      const vendor = response.data.data || null
      
      if (vendor) {
        console.log(`✅ Successfully fetched vendor: ${vendor.name}`)
      } else {
        console.log(`❌ No vendor found with ID: ${id}`)
      }
      
      return vendor
    } catch (error) {
      console.error(`❌ Error fetching business with ID ${id}:`, error)
      
      // Try to get from localStorage as fallback
      try {
        const storedVendors = localStorage.getItem('all_vendors')
        if (storedVendors) {
          const parsedVendors = JSON.parse(storedVendors)
          const storedVendor = parsedVendors.find((v: Vendor) => v.id.toString() === id.toString())
          if (storedVendor) {
            console.log(`✅ Found vendor in localStorage fallback: ${storedVendor.name}`)
            return storedVendor
          }
        }
      } catch (localStorageError) {
        console.log('❌ Error reading from localStorage:', localStorageError)
      }
      
      return null
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