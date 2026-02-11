import axiosInstance from '@/lib/axiosConfig'
import type { Vendor } from '@/lib/types'

// API base path
const BASE = '/api/v1/businesses'

export class VendorAPI {
  // Get all businesses
  static async getAllBusinesses(): Promise<Vendor[]> {
    try {
      const response = await axiosInstance.get(BASE)
      return response.data.data || []
    } catch {
      return []
    }
  }

  // Get businesses by vendor type
  static async getBusinessesByVendorType(vendorType: string): Promise<Vendor[]> {
    try {
      const response = await axiosInstance.get(`${BASE}/businesses-by-vendor`, {
        params: { vendorType },
      })
      return response.data.data || []
    } catch {
      return []
    }
  }

  // Get business by ID
  static async getBusinessById(id: string | number): Promise<Vendor | null> {
    try {
      const response = await axiosInstance.get(`${BASE}/${id}`)
      return response.data.data || null
    } catch {
      return null
    }
  }

  // Search businesses
  static async searchBusinesses(query: string, vendorType?: string): Promise<Vendor[]> {
    try {
      const params: Record<string, string> = { search: query }
      if (vendorType) params.vendorType = vendorType

      const url = vendorType ? `${BASE}/businesses-by-vendor` : BASE
      const response = await axiosInstance.get(url, { params })
      return response.data.data || []
    } catch {
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
      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
      }
      if (vendorType) params.vendorType = vendorType
      if (filters?.city) params.city = filters.city
      if (filters?.minPrice) params.minPrice = filters.minPrice.toString()
      if (filters?.maxPrice) params.maxPrice = filters.maxPrice.toString()
      if (filters?.rating) params.rating = filters.rating.toString()

      const url = vendorType ? `${BASE}/businesses-by-vendor` : BASE
      const response = await axiosInstance.get(url, { params })
      const data = response.data.data || []
      const total = response.data.total || data.length

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    } catch {
      return { data: [], total: 0, page, limit, totalPages: 0 }
    }
  }
}
