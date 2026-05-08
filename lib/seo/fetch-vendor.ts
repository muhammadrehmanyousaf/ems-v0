/**
 * Server-side single-vendor fetch — used by L6 leaf detail pages
 * (`/{type-plural}/{city-slug}/{name-slug}-{shortid}`).
 *
 * The leaf URL puts the public id at the END of the slug. We extract it,
 * fetch by id from the existing backend `GET /api/v1/businesses/:id`,
 * and return a normalized shape. The page wrapper is responsible for
 * 301-ing the user to the canonical slug if they typed something stale.
 *
 * Reference: docs/seo/03-url-conventions-LOCKED.md §L6.
 */

import { BACKEND_URL } from "@/lib/backend-url"

export interface VendorDetail {
  id: number | string
  name: string
  /** Slugified business name, e.g. "sq-photography". Used to canonicalize URLs. */
  nameSlug: string
  city: string
  vendorType?: string
  description?: string
  imageUrl?: string
  images: string[]
  rating: number
  reviewCount: number
  reviews: any[]
  packages: any[]
  priceMin?: number | null
  phone?: string
  email?: string
  websiteUrl?: string
  socialLinks?: { instagram?: string; facebook?: string; website?: string }
  amenities?: string[]
  serviceProvided?: string[]
  cancellationPolicy?: string
  staff?: any[]
  raw: any // escape hatch for fields the page might want
}

/**
 * Slugify — lowercase, ASCII, hyphenated. Same algorithm everywhere so
 * the URL we generate matches the URL we expect on incoming requests.
 * Reference: docs/seo/03-url-conventions-LOCKED.md §L4.
 */
export function slugifyName(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Parse a leaf URL slug `name-slug-1234` into `{ slug: "name-slug", id: 1234 }`.
 * The id is whatever follows the LAST hyphen and is purely numeric (for now;
 * upgrade to Hashids decode later without changing call sites).
 */
export function parseVendorSlugAndId(
  vendorSlug: string,
): { slug: string; id: number | null } {
  const match = vendorSlug.match(/^(.+)-(\d+)$/)
  if (!match) return { slug: vendorSlug, id: null }
  const id = Number(match[2])
  if (!Number.isFinite(id) || id <= 0) return { slug: vendorSlug, id: null }
  return { slug: match[1], id }
}

/**
 * Build the canonical leaf URL for a vendor.
 * `/{type-plural}/{city-slug}/{name-slug}-{id}`
 */
export function buildVendorCanonicalPath(
  typeSlug: string,
  citySlug: string,
  vendor: { id: number | string; name: string; nameSlug?: string },
): string {
  const ns = vendor.nameSlug ?? slugifyName(vendor.name)
  return `/${typeSlug}/${citySlug}/${ns}-${vendor.id}`
}

/**
 * Fetch by id. Returns null if missing / network error / build-time
 * unreachable backend.
 */
export async function fetchVendorById(id: number): Promise<VendorDetail | null> {
  if (!Number.isFinite(id) || id <= 0) return null
  const url = `${BACKEND_URL}api/v1/businesses/${id}`
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data?: any }
    const raw = json?.data
    if (!raw) return null
    return normalize(raw)
  } catch {
    return null
  }
}

function pickFirstImage(raw: any): string | undefined {
  const imgs = raw?.images
  if (Array.isArray(imgs) && imgs.length > 0) {
    return typeof imgs[0] === "string" ? imgs[0] : imgs[0]?.url
  }
  if (typeof imgs === "string") {
    try {
      const parsed = JSON.parse(imgs)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return typeof parsed[0] === "string" ? parsed[0] : parsed[0]?.url
      }
    } catch {
      return imgs
    }
  }
  return undefined
}

function normalizeImages(raw: any): string[] {
  const imgs = raw?.images
  if (Array.isArray(imgs)) {
    return imgs.map((i) => (typeof i === "string" ? i : i?.url)).filter(Boolean)
  }
  if (typeof imgs === "string") {
    try {
      const parsed = JSON.parse(imgs)
      if (Array.isArray(parsed)) {
        return parsed.map((i) => (typeof i === "string" ? i : i?.url)).filter(Boolean)
      }
      return [imgs]
    } catch {
      return [imgs]
    }
  }
  return []
}

function normalize(raw: any): VendorDetail {
  const vendor = raw?.vendor ?? {}
  const id = raw?.id ?? raw?.businessId ?? 0
  const name = raw?.name ?? raw?.businessName ?? "Unnamed business"
  const city = raw?.city ?? raw?.location ?? vendor?.city ?? ""

  let priceMin: number | null = null
  if (raw?.minimumPrice) priceMin = Number(raw.minimumPrice)
  else if (Array.isArray(raw?.packages) && raw.packages.length > 0) {
    const prices = raw.packages
      .map((p: any) => Number(p?.price))
      .filter((p: number) => Number.isFinite(p) && p > 0)
    if (prices.length > 0) priceMin = Math.min(...prices)
  }

  return {
    id,
    name,
    nameSlug: slugifyName(name),
    city,
    vendorType: raw?.type || vendor?.vendorType || raw?.subBusinessType,
    description: raw?.description ?? "",
    imageUrl: pickFirstImage(raw),
    images: normalizeImages(raw),
    rating: Number(raw?.rating ?? 0) || 0,
    reviewCount: Number(raw?.reviewCount ?? 0) || 0,
    reviews: Array.isArray(raw?.reviews) ? raw.reviews : [],
    packages: Array.isArray(raw?.packages) ? raw.packages : [],
    priceMin,
    phone: raw?.phoneNumber ?? raw?.bookingPhone ?? vendor?.phoneNumber,
    email: raw?.bookingEmail ?? vendor?.email,
    websiteUrl: raw?.website ?? vendor?.website,
    socialLinks: {
      instagram: raw?.instagram,
      facebook: raw?.facebook,
      website: raw?.website,
    },
    amenities: Array.isArray(raw?.amenities) ? raw.amenities : [],
    serviceProvided: Array.isArray(raw?.serviceProvided) ? raw.serviceProvided : [],
    cancellationPolicy: raw?.cancellationPolicy ?? raw?.cancelationPolicy ?? "",
    staff: Array.isArray(raw?.staff) ? raw.staff : [],
    raw,
  }
}
