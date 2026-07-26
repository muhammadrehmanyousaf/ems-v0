/**
 * Server-side handling for the LEGACY numeric vendor detail routes
 * (`/{short-type}/[id]`, e.g. `/venues/3273`, `/photographers/2522`).
 *
 * These were `"use client"` pages that fetched in useEffect, so Googlebot got a
 * spinner with the site-wide generic title (see docs/seo/SEO-RESCUE-2026-07.md).
 * The site ALSO has proper canonical 3-level SSR pages at
 * `/{seo-type}/{city}/{name}-{id}` (components/seo/vendor-detail-page.tsx, in the
 * sitemap). So the correct fix for the numeric pages is:
 *
 *   - Types that HAVE a canonical 3-level route (backendToSeoSlug != null, 15 of
 *     them): **308-redirect** the numeric URL to the canonical slug URL, so all
 *     link equity consolidates on the one good page. No duplicate content.
 *   - The ~8 orphan types with no SEO route (choreographer, qawwali, event-host,
 *     live-streaming, marquee/furniture/sound rental, live-cooking): server-render
 *     in place with a UNIQUE title/description/canonical(slug)/OG + JSON-LD, since
 *     there is nowhere else to send them.
 */

import { redirect, notFound } from "next/navigation"
import type { Metadata } from "next"

import { buildPageMetadata, SITE_URL, backendToSeoSlug } from "@/lib/seo"
import { getVendorGuidance } from "@/lib/seo/vendor-type-guidance"
import { fetchVendorById, slugifyName, parseVendorSlugAndId } from "@/lib/seo/fetch-vendor"
import VendorDetailsMobile from "@/components/VendorDetails/VendorDetailsMobile"
import type { Vendor } from "@/lib/types"

const SLUG_LABEL: Record<string, string> = {
  "wedding-choreographers": "Choreographer",
  "event-hosts": "Event host",
  "live-streaming": "Live streaming",
  "marquee-rental": "Marquee rental",
  "furniture-rental": "Furniture rental",
  "live-cooking-stalls": "Live cooking stall",
  "sound-system-rental": "Sound system rental",
  qawwali: "Qawwali & Naat",
}

/** Resolve the id + the canonical target for a raw business row. */
function resolve(typeSlug: string, raw: any) {
  const id = raw?.id
  const cityRaw = raw?.city || raw?.location || raw?.vendor?.city || ""
  const vendorType = raw?.vendor?.vendorType || raw?.type
  const seoSlug = backendToSeoSlug(vendorType)
  const citySlug = slugifyName(cityRaw) || "pakistan"
  const nameSlug = slugifyName(raw?.name ?? "") || String(id)
  // Canonical 3-level SEO URL when this type has one (matches the sitemap).
  const threeLevel = seoSlug ? `/${seoSlug}/${citySlug}/${nameSlug}-${id}` : null
  // Orphan-type in-place slug (single [id] segment): `name-city-id`.
  const twoLevelSeg = `${nameSlug}-${citySlug}-${id}`
  const twoLevel = `/${typeSlug}/${twoLevelSeg}`
  return { id, seoSlug, citySlug, nameSlug, vendorType, threeLevel, twoLevel, twoLevelSeg }
}

function typeLabelFor(typeSlug: string, raw: any): string {
  return raw?.vendor?.vendorType || raw?.type || SLUG_LABEL[typeSlug] || "Wedding vendor"
}

function metaDescription(raw: any, label: string): string {
  const city = raw?.city || raw?.location || "Pakistan"
  const name = raw?.name || "This vendor"
  const d = (raw?.description || "").toString().trim()
  const thin = !d || /listed from public records|unclaimed/i.test(d)
  const text = thin
    ? `${name} — ${label.toLowerCase()} in ${city}. See packages, photos, reviews and availability, and request a quote on Wedding Wala.`
    : d
  return text.replace(/\s+/g, " ").slice(0, 300)
}

/* normalizeBusiness parity (lib/api/vendors) — the shape VendorDetailsMobile expects. */
function safeParseJson(val: any): any {
  if (val == null) return val
  if (typeof val !== "string") return val
  try { return JSON.parse(val) } catch { return val }
}
function normalizePackages(packages: any[]): any[] {
  if (!Array.isArray(packages)) return []
  return packages.map((pkg) => {
    const features = safeParseJson(pkg.features)
    const images = safeParseJson(pkg.images)
    return { ...pkg, features: features ?? [], images: Array.isArray(images) ? images : images ? [images] : [] }
  })
}
function rawToVendor(raw: any): Vendor {
  const vendor = raw?.vendor || {}
  const rating = Number(raw?.rating ?? 0) || 0
  const reviewCount = Number(raw?.reviewCount ?? (Array.isArray(raw?.reviews) ? raw.reviews.length : 0)) || 0
  const pkgPrices = Array.isArray(raw?.packages)
    ? raw.packages.map((p: any) => Number(p.price)).filter((p: number) => p > 0)
    : []
  return {
    ...raw,
    userId: raw?.userId ?? vendor.id,
    type: raw?.type || vendor.vendorType || raw?.subBusinessType || "",
    location: raw?.location || raw?.subArea || raw?.city || vendor.city || "",
    rating,
    reviewCount,
    reviews: raw?.reviews || [],
    price: raw?.price || raw?.minimumPrice || (pkgPrices.length ? Math.min(...pkgPrices) : null) || null,
    staff: raw?.staff || [],
    amenities: raw?.amenities || [],
    serviceProvided: raw?.serviceProvided || [],
    cancellationPolicy: raw?.cancellationPolicy || raw?.cancelationPolicy || "",
    sponsored: raw?.sponsored ?? false,
    description: raw?.description || "",
    images: raw?.images || [],
    packages: normalizePackages(raw?.packages),
    typeSpecificDetails: raw?.typeSpecificDetails && typeof raw.typeSpecificDetails === "object" ? raw.typeSpecificDetails : null,
    languagesSpoken: Array.isArray(raw?.languagesSpoken) ? raw.languagesSpoken : null,
  } as Vendor
}

export async function generateVendorMetadata(typeSlug: string, param: string): Promise<Metadata> {
  const { id } = parseVendorSlugAndId(param)
  if (!id) return { title: "Vendor not found", robots: { index: false, follow: true } }
  const detail = await fetchVendorById(id)
  if (!detail) return { title: "Vendor not found", robots: { index: false, follow: true } }
  const raw = detail.raw
  const r = resolve(typeSlug, raw)
  const label = typeLabelFor(typeSlug, raw)
  const city = raw?.city || raw?.location || "Pakistan"
  return buildPageMetadata({
    title: `${raw?.name || detail.name} — ${label} in ${city}`,
    description: metaDescription(raw, label),
    path: r.threeLevel ?? r.twoLevel, // canonical always points to the good URL
    imageUrl: detail.imageUrl,
  })
}

export async function VendorDetailServer({ typeSlug, param }: { typeSlug: string; param: string }) {
  const { id } = parseVendorSlugAndId(param)
  if (!id) notFound()
  const detail = await fetchVendorById(id as number)
  if (!detail) notFound()
  const raw = detail.raw
  const r = resolve(typeSlug, raw)

  // 15 mapped types → consolidate to the canonical 3-level SEO page.
  if (r.threeLevel) redirect(r.threeLevel)
  // Orphan types → keep the numeric route but canonicalise to the slug form.
  if (param !== r.twoLevelSeg) redirect(r.twoLevel)

  const label = typeLabelFor(typeSlug, raw)
  const city = raw?.city || raw?.location || "Pakistan"
  const url = `${SITE_URL}${r.twoLevel}`
  const images = Array.isArray(raw?.images) ? raw.images.filter(Boolean) : []
  const priceMin = detail.priceMin ?? undefined
  const guidance = getVendorGuidance(r.vendorType)

  const businessLD: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${url}#business`,
    name: raw?.name,
    description: metaDescription(raw, label),
    url,
    ...(images.length ? { image: images.slice(0, 6) } : {}),
    address: { "@type": "PostalAddress", addressLocality: city, addressCountry: "PK" },
    ...(raw?.vendor?.phoneNumber ? { telephone: raw.vendor.phoneNumber } : {}),
    ...(priceMin ? { priceRange: `From Rs ${Number(priceMin).toLocaleString("en-PK")}` } : {}),
    ...(detail.reviewCount > 0 && detail.rating > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: detail.rating, reviewCount: detail.reviewCount } }
      : {}),
  }
  const breadcrumbLD = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: `${label}s`, item: `${SITE_URL}/${typeSlug}` },
      { "@type": "ListItem", position: 3, name: raw?.name, item: url },
    ],
  }
  const faqLD = guidance
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: guidance.faqs.map((f: any) => ({
          "@type": "Question",
          name: (f.q || "").replace(/\{city\}/g, city),
          acceptedAnswer: { "@type": "Answer", text: (f.a || "").replace(/\{city\}/g, city) },
        })),
      }
    : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLD) }} />
      {faqLD && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLD) }} />}
      <VendorDetailsMobile vendor={rawToVendor(raw)} />
    </>
  )
}
