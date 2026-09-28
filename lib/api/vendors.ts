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
  // Every consumer of these treats them as strings (.toLowerCase(), .includes()),
  // so guarantee that here rather than hoping the row is well-formed. `str()`
  // also stops a non-empty-but-non-string value winning an `||` chain: an empty
  // ARRAY is truthy, so `raw.type || vendor.vendorType || raw.subBusinessType`
  // would happily promote `[]` into `type` and crash every downstream filter.
  // Business 3273 did exactly that and took the whole /search route down.
  const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v))
  const firstStr = (...vals: unknown[]): string => {
    for (const v of vals) { const s = str(v).trim(); if (s) return s }
    return ''
  }
  return {
    ...raw,
    userId: raw.userId ?? vendor.id,
    type: firstStr(raw.type, vendor.vendorType, raw.subBusinessType),
    subBusinessType: str(raw.subBusinessType),
    name: str(raw.name),
    city: str(raw.city),
    location: firstStr(raw.location, raw.subArea, raw.city, vendor.city),
    rating,
    reviewCount,
    reviews: raw.reviews || [],
    // WW-PERF — `?view=card` sends `minPackagePrice` (computed in SQL) instead
    // of the whole packages array, so the "from Rs X" line survives the slim
    // projection. Full responses still fall back to the array as before.
    price: (raw.price || raw.minimumPrice) ||
      (Array.isArray(raw.packages) && raw.packages.length > 0
        ? Math.min(...raw.packages.map((p: any) => Number(p.price)).filter((p: number) => p > 0))
        : null) ||
      (Number(raw.minPackagePrice) > 0 ? Number(raw.minPackagePrice) : null) ||
      null,
    staff: raw.staff || [],
    amenities: raw.amenities || [],
    serviceProvided: raw.serviceProvided || [],
    cancellationPolicy: raw.cancellationPolicy || raw.cancelationPolicy || '',
    sponsored: raw.sponsored ?? false,
    description: raw.description || '',
    // `?view=card` returns one image as `primaryImage` rather than the whole
    // array. Re-shaping it here means every existing card renderer — which all
    // read `images[0]` — works with a card row without knowing it is one.
    images: Array.isArray(raw.images) && raw.images.length
      ? raw.images
      : raw.primaryImage
        ? [raw.primaryImage]
        : [],
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

// Fetch EVERY page of a paginated /businesses listing so the category grid
// shows ALL approved vendors — not just the backend's default first page (20).
// The backend caps `limit` at 100, so we read totalPages off page 1 and pull
// the remaining pages in parallel, then return the merged raw rows. Previously
// the listing only ever fetched the top 20 (by completeness), leaving every
// vendor ranked 21+ unreachable in the UI.
async function fetchAllBusinessPages(
  url: string,
  baseParams: Record<string, unknown> = {},
): Promise<any[]> {
  // F-A — larger pages (fewer round-trips; backend cap is 200) + a bounded
  // concurrency pool instead of firing every remaining page at once. The old
  // `Promise.all` over ~32 pages burst the single API instance, which 503'd
  // shared endpoints (the favourites retry-storm, F-B). Same data, same order.
  const PAGE_SIZE = 200
  const CONCURRENCY = 5
  const rowsOf = (resp: any): any[] => {
    const d = resp?.data?.data
    return Array.isArray(d) ? d : d?.data || []
  }
  const first = await axiosInstance.get(url, {
    params: { ...baseParams, page: 1, limit: PAGE_SIZE },
  })
  let rows = rowsOf(first)
  const totalPages = first?.data?.data?.pagination?.totalPages || 1
  if (totalPages > 1) {
    const pageNums = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)
    const results: any[][] = new Array(pageNums.length)
    let cursor = 0
    const worker = async () => {
      while (cursor < pageNums.length) {
        const idx = cursor++
        results[idx] = await axiosInstance
          .get(url, { params: { ...baseParams, page: pageNums[idx], limit: PAGE_SIZE } })
          .then(rowsOf)
          .catch(() => [])
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, pageNums.length) }, worker),
    )
    for (const r of results) rows = rows.concat(r)
  }
  return rows
}

export class VendorAPI {
  // Get all businesses (every page, not just the first).
  // availableOn (YYYY-MM-DD) → only venues free that day.
  // verifiedOnly → D-4: only KYC-verified halls.
  static async getAllBusinesses(availableOn?: string, verifiedOnly?: boolean): Promise<Vendor[]> {
    try {
      const list = await fetchAllBusinessPages(BASE, {
        ...(availableOn ? { availableOn } : {}),
        ...(verifiedOnly ? { verifiedOnly: 'true' } : {}),
      })
      return list.map(normalizeBusiness)
    } catch {
      return []
    }
  }

  // Get businesses by vendor type (every page, not just the first)
  static async getBusinessesByVendorType(
    vendorType: string,
    pakistaniFilters?: PakistaniFilterParams,
    availableOn?: string,
    verifiedOnly?: boolean,
  ): Promise<Vendor[]> {
    try {
      const list = await fetchAllBusinessPages(`${BASE}/businesses-by-vendor`, {
        vendorType,
        ...(pakistaniFilters || {}),
        ...(availableOn ? { availableOn } : {}),
        ...(verifiedOnly ? { verifiedOnly: 'true' } : {}),
      })
      return list.map(normalizeBusiness)
    } catch {
      return []
    }
  }

  /**
   * WW-PERF — one page of CARD-shaped rows, filtered by the server.
   *
   * This is the call that replaces "download all 3,272 vendors and filter them
   * in a useMemo". `?view=card` returns ~580 bytes a row instead of ~3.7 KB
   * (measured: a 200-row page went 743 KB -> 113 KB), and the server applies
   * the filters it has always supported and the client was re-implementing.
   *
   * Returns the page AND the total, because the surfaces that need this — the
   * hero's "N vendors match", the search results header — need the count of
   * everything matching, not the length of the page.
   */
  static async searchCards(params: {
    q?: string
    city?: string
    cityLike?: string
    vendorTypes?: string
    minCapacity?: number
    maxBudget?: number
    limit?: number
    page?: number
    signal?: AbortSignal
  }): Promise<{ items: Vendor[]; total: number }> {
    const { signal, limit = 12, page = 1, ...rest } = params
    const query: Record<string, string> = { view: 'card', limit: String(limit), page: String(page) }
    for (const [k, v] of Object.entries(rest)) {
      const s = typeof v === 'number' ? String(v) : (v || '').toString().trim()
      if (s) query[k] = s
    }
    try {
      const res = await axiosInstance.get(BASE, { params: query, signal })
      const d = res?.data?.data
      const rows = Array.isArray(d) ? d : d?.data || []
      const total = Number(d?.pagination?.totalItems ?? d?.pagination?.total ?? rows.length) || 0
      return { items: rows.map(normalizeBusiness), total }
    } catch (e: any) {
      // An aborted request is a newer keystroke, not a failure — let the caller
      // ignore it instead of rendering "0 matches" for a request we cancelled.
      if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') throw e
      return { items: [], total: 0 }
    }
  }

  /**
   * WW-PERF — every homepage section in ONE request.
   *
   * The homepage renders five section components, three of which ask for a
   * different vendor type each, so the browser made ELEVEN /businesses requests
   * to fill strips of at most eight cards. On a phone on 4G that is eleven
   * round-trips before the page settles. The fan-out now happens on the server,
   * where the queries run in parallel against a database on the private network
   * that answers each in single-digit milliseconds.
   *
   * Returns a map keyed by vendor type. A type that is not a real enum member
   * comes back as an empty array rather than missing, so a caller can render its
   * section either way.
   */
  static async getByTypes(
    types: string[],
    perType = 8,
    signal?: AbortSignal
  ): Promise<Record<string, Vendor[]>> {
    try {
      const res = await axiosInstance.get(`${BASE}/by-types`, {
        params: { types: types.join(','), perType: String(perType) },
        signal,
      })
      const d = res?.data?.data || {}
      const out: Record<string, Vendor[]> = {}
      for (const [k, v] of Object.entries(d)) {
        out[k] = Array.isArray(v) ? (v as any[]).map(normalizeBusiness) : []
      }
      return out
    } catch (e: any) {
      if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') throw e
      return {}
    }
  }

  /**
   * WW-PERF — counts without the catalog.
   *
   * The homepage hero walked all 17 pages of `/businesses` and counted cities in
   * JavaScript to render ten chips. This is the same answer as one GROUP BY:
   * ~1.2 KB, ~380 ms, in place of ~12 MB of JSON.
   */
  static async getFacets(cities = 12): Promise<{
    total: number
    cities: Array<{ city: string; count: number }>
    vendorTypes: Array<{ vendorType: string; count: number }>
  }> {
    try {
      const res = await axiosInstance.get(`${BASE}/facets`, { params: { cities: String(cities) } })
      const d = res?.data?.data || {}
      return {
        total: Number(d.total) || 0,
        cities: Array.isArray(d.cities) ? d.cities : [],
        vendorTypes: Array.isArray(d.vendorTypes) ? d.vendorTypes : [],
      }
    } catch {
      return { total: 0, cities: [], vendorTypes: [] }
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

  /**
   * GET /businesses/:id/related — other PUBLIC businesses owned by the same
   * vendor, for the detail-page "other branches / more from this vendor"
   * surfaces. `branches` = same vendor-type (other locations); `otherServices` =
   * different type. Empty arrays for a single-business vendor (FE self-hides).
   */
  static async getRelatedBusinesses(id: string | number): Promise<{
    self: { id: number; vendorType: string | null; city: string | null; slug: string | null } | null
    branches: Vendor[]
    otherServices: Vendor[]
  }> {
    try {
      const response = await axiosInstance.get(`${BASE}/${id}/related`)
      const d = response.data?.data || {}
      const norm = (arr: unknown): Vendor[] =>
        Array.isArray(arr) ? (arr.map(normalizeBusiness).filter(Boolean) as Vendor[]) : []
      return { self: d.self ?? null, branches: norm(d.branches), otherServices: norm(d.otherServices) }
    } catch {
      return { self: null, branches: [], otherServices: [] }
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
