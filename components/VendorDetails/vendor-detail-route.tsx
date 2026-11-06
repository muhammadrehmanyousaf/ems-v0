import { notFound } from "next/navigation"
import VendorDetailsMobile from "@/components/VendorDetails/VendorDetailsMobile"
import { BACKEND_URL } from "@/lib/backend-url"
import { vendorCacheTag, slugifyName } from "@/lib/seo/fetch-vendor"
import { venueLD, vendorLD } from "@/lib/seo/jsonld"
import { safeJsonLd } from "@/lib/seo/jsonld"

/**
 * The vendor profile page, server-rendered.
 *
 * Emits complete Schema.org JSON-LD (EventVenue or LocalBusiness)
 * with ratings and contact details for Google rich search results.
 */
export const VENDOR_DETAIL_REVALIDATE = 3600

async function fetchVendor(id: string) {
  const numeric = Number(id)
  if (!Number.isFinite(numeric) || numeric <= 0) return null
  try {
    const res = await fetch(`${BACKEND_URL}api/v1/businesses/${numeric}`, {
      next: { revalidate: VENDOR_DETAIL_REVALIDATE, tags: [vendorCacheTag(numeric)] },
      headers: { Accept: "application/json" },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? null
  } catch {
    return null
  }
}

export async function VendorDetailRoute({ id }: { id: string }) {
  const vendor = await fetchVendor(id)
  if (!vendor) notFound()

  const type = typeof vendor.type === "string" && vendor.type.trim() ? vendor.type : vendor.vendor?.vendorType || ""
  const isVenue = type?.toLowerCase().includes("venue") || type?.toLowerCase().includes("hall") || type?.toLowerCase().includes("marquee")
  const city = vendor.city || "Pakistan"
  const slug = `${slugifyName(vendor.name || "vendor")}-${vendor.id}`
  
  const ld = isVenue
    ? venueLD({
        id: vendor.id,
        name: vendor.name,
        slug,
        vendorType: "Wedding Venue",
        vendorTypeSlug: "wedding-venues",
        description: vendor.description || "",
        imageUrl: vendor.featuredImage || vendor.images?.[0] || "",
        citySlug: slugifyName(city),
        cityName: city,
        addressLine: vendor.address,
        phone: vendor.phone,
        email: vendor.email,
        rating: vendor.rating ? { value: Number(vendor.rating), count: Number(vendor.reviewCount || 1) } : undefined,
      })
    : vendorLD({
        id: vendor.id,
        name: vendor.name,
        slug,
        vendorType: type || "Wedding Vendor",
        vendorTypeSlug: "vendors",
        description: vendor.description || "",
        imageUrl: vendor.featuredImage || vendor.images?.[0] || "",
        citySlug: slugifyName(city),
        cityName: city,
        addressLine: vendor.address,
        phone: vendor.phone,
        email: vendor.email,
        rating: vendor.rating ? { value: Number(vendor.rating), count: Number(vendor.reviewCount || 1) } : undefined,
      })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(ld) }}
      />
      <VendorDetailsMobile vendor={{ ...vendor, type }} />
    </>
  )
}
