import axiosInstance from '@/lib/axiosConfig'
import type { Vendor } from '@/lib/types'

// API base path
const BASE = '/api/v1/businesses'

/**
 * BK-100.54 — Pakistani-specific search filter query params accepted by
 * GET /api/v1/businesses and GET /api/v1/businesses/businesses-by-vendor.
 * Backed by `event-planner-api/src/utils/pakistaniFilters.js`. All fields
 * optional; missing/false = no filter (legacy result set preserved).
 */
export type PakistaniFilterParams = {
  femalePhotographer?: boolean
  mahramOnly?: boolean
  separateHalls?: boolean
  noMusicNikah?: boolean
  sectKitchen?: boolean
  vegetarian?: boolean
  wifi?: boolean
  outdoorCapable?: boolean
  travelsToHome?: boolean
  droneOffered?: boolean
  secondShooter?: boolean
  halalCert?: boolean
  /** Comma-separated server-side; we pass an array here for ergonomics. */
  languages?: string[] | string
}

/**
 * Normalize raw backend business data to the flat Vendor shape the frontend expects.
 * The backend returns { id, name, city, subBusinessType, vendor: { vendorType, ... }, ... }
 * but the frontend expects { type, location, userId, rating, ... } at the top level.
 */
function safeParseJson(val: any): any {
  if (val == null) return val
  if (typeof val !== 'string') return val
  try { return JSON.parse(val) } catch { return val }
}

function normalizePackages(packages: any[]): any[] {
  if (!Array.isArray(packages)) return []
  return packages.map((pkg) => {
    const features = safeParseJson(pkg.features)
    const images = safeParseJson(pkg.images)
    return {
      ...pkg,
      features: features ?? [],
      images: Array.isArray(images) ? images : (images ? [images] : []),
    }
  })
}

function normalizeBusiness(raw: any): any {
  if (!raw) return raw
  const vendor = raw.vendor || {}
  // Backend now returns `rating` (avg) and `reviewCount` aggregated by SQL.
  // Coerce safely — Postgres can hand them back as numeric strings.
  const rating = Number(raw.rating ?? 0) || 0
  const reviewCount =
    Number(raw.reviewCount ?? (Array.isArray(raw.reviews) ? raw.reviews.length : 0)) || 0
  return {
    ...raw,
    userId: raw.userId ?? vendor.id,
    type: raw.type || vendor.vendorType || raw.subBusinessType || '',
    location: raw.location || raw.subArea || raw.city || vendor.city || '',
    rating,
    reviewCount,
    reviews: raw.reviews || [],
    price: (raw.price || raw.minimumPrice) ||
      (Array.isArray(raw.packages) && raw.packages.length > 0
        ? Math.min(...raw.packages.map((p: any) => Number(p.price)).filter((p: number) => p > 0))
        : null) ||
      null,
    staff: raw.staff || [],
    amenities: raw.amenities || [],
    serviceProvided: raw.serviceProvided || [],
    cancellationPolicy: raw.cancellationPolicy || raw.cancelationPolicy || '',
    sponsored: raw.sponsored ?? false,
    description: raw.description || '',
    images: raw.images || [],
    packages: normalizePackages(raw.packages),
    // BK-100.54 — pass through Pakistani-specific search filter inputs.
    // Backend returns typeSpecificDetails as JSONB (already parsed) and
    // languagesSpoken as TEXT[]. Both may be NULL on legacy vendor rows;
    // we coerce to safe defaults that fail the filter predicate harmlessly.
    typeSpecificDetails:
      raw.typeSpecificDetails && typeof raw.typeSpecificDetails === 'object'
        ? raw.typeSpecificDetails
        : null,
    languagesSpoken: Array.isArray(raw.languagesSpoken) ? raw.languagesSpoken : null,
    // BK-100.6 — reliability + badges block attached by the backend.
    // Strict shape check so we don't blindly pass through whatever
    // arrives on the wire.
    reliability:
      raw.reliability &&
      typeof raw.reliability === 'object' &&
      typeof raw.reliability.score === 'number' &&
      Array.isArray(raw.reliability.badges)
        ? {
            score: raw.reliability.score,
            tier: raw.reliability.tier,
            badges: raw.reliability.badges,
            breakdown: raw.reliability.breakdown,
          }
        : null,
  }
}

export class VendorAPI {
  // Get all businesses
  static async getAllBusinesses(): Promise<Vendor[]> {
    try {
      const response = await axiosInstance.get(BASE)
      const result = response.data.data
      const list = Array.isArray(result) ? result : result?.data || []
      return list.map(normalizeBusiness)
    } catch {
      return []
    }
  }

  // Get businesses by vendor type
  static async getBusinessesByVendorType(
    vendorType: string,
    pakistaniFilters?: PakistaniFilterParams,
  ): Promise<Vendor[]> {
    try {
      const response = await axiosInstance.get(`${BASE}/businesses-by-vendor`, {
        params: { vendorType, ...(pakistaniFilters || {}) },
      })
      const result = response.data.data
      const list = Array.isArray(result) ? result : result?.data || []
      return list.map(normalizeBusiness)
    } catch {
      return []
    }
  }

  // Get business by ID
  static async getBusinessById(id: string | number): Promise<Vendor | null> {
    try {
      const response = await axiosInstance.get(`${BASE}/${id}`)
      return normalizeBusiness(response.data.data) || null
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
      const result = response.data.data
      const list = Array.isArray(result) ? result : result?.data || []
      return list.map(normalizeBusiness)
    } catch {
      return []
    }
  }

  // Check date availability for businesses
  static async checkDateAvailability(
    businessIds: number[],
    date: string,
    time: string
  ): Promise<{ available: boolean; conflicts: { businessId: number; businessName: string }[]; alternativeSlots: any }> {
    try {
      const response = await axiosInstance.post('/api/v1/bookings/check-availability', {
        businessIds,
        bookingDate: date,
        bookingTime: time,
      })
      return response.data.data || { available: true, conflicts: [], alternativeSlots: null }
    } catch {
      return { available: true, conflicts: [], alternativeSlots: null }
    }
  }

  // Get bulk availability for businesses over a month
  static async getMonthAvailability(
    businessIds: number[],
    month: string
  ): Promise<Record<number, Record<string, { bookedSlots: string[]; availableSlots: string[] }>>> {
    try {
      const response = await axiosInstance.get('/api/v1/bookings/availability', {
        params: { businessIds: businessIds.join(','), month },
      })
      return response.data.data?.availability || {}
    } catch {
      return {}
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
      const result = response.data.data
      const rawData = Array.isArray(result) ? result : result?.data || []
      const data = rawData.map(normalizeBusiness)
      const pagination = result?.pagination
      const total = pagination?.total || response.data.total || data.length

      return {
        data,
        total,
        page,
        limit,
        totalPages: pagination?.totalPages || Math.ceil(total / limit),
      }
    } catch {
      return { data: [], total: 0, page, limit, totalPages: 0 }
    }
  }
}
