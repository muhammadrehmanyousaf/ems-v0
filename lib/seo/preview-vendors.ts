/**
 * PREVIEW-ONLY sample vendors. Used ONLY when NEXT_PUBLIC_UI_PREVIEW === "1"
 * (set locally to design/screenshot the money-page UI when the dev box can't
 * reach the production backend). Production NEVER renders these — the env
 * flag is off in prod, and the template only falls back to them behind that
 * flag. No fabricated data ever reaches a live, indexable page.
 *
 * Names are generic/illustrative (not real studios) to avoid impersonation.
 */

import type { VendorListItem } from "./fetch-vendors";

const PREVIEW_ENABLED = process.env.NEXT_PUBLIC_UI_PREVIEW === "1";

const LAHORE_PHOTOGRAPHERS: VendorListItem[] = [
  {
    id: "pv-1", name: "Lens & Loom Studios", city: "Lahore", rating: 4.9, reviewCount: 128,
    priceMin: 120000, vendorType: "Photographer", href: "#",
    specialties: ["Cinematic film", "Candid", "Drone"], areaServed: "DHA & Gulberg",
  },
  {
    id: "pv-2", name: "Saaya Wedding Films", city: "Lahore", rating: 4.8, reviewCount: 94,
    priceMin: 150000, vendorType: "Photographer", href: "#",
    specialties: ["Storytelling films", "Same-day edit"], areaServed: "Bahria Town",
  },
  {
    id: "pv-3", name: "Roshan Frames", city: "Lahore", rating: 4.7, reviewCount: 61,
    priceMin: 75000, vendorType: "Photographer", href: "#",
    specialties: ["Traditional", "Candid", "Albums"], areaServed: "Johar Town",
  },
  {
    id: "pv-4", name: "The Baraat Company", city: "Lahore", rating: 4.9, reviewCount: 112,
    priceMin: 90000, vendorType: "Photographer", href: "#",
    specialties: ["Multi-day", "Reels", "Couple shoot"], areaServed: "Model Town",
  },
  {
    id: "pv-5", name: "Noor Photography", city: "Lahore", rating: 4.6, reviewCount: 47,
    priceMin: 60000, vendorType: "Photographer", href: "#",
    specialties: ["Documentary", "Candid"], areaServed: "Cantt",
  },
  {
    id: "pv-6", name: "Dewan Studios", city: "Lahore", rating: 4.8, reviewCount: 73,
    priceMin: 135000, vendorType: "Photographer", href: "#",
    specialties: ["Cinematic", "Drone", "Premium album"], areaServed: "Walled City & Gulberg",
  },
];

/**
 * Returns sample vendors for a combo ONLY in preview mode. Returns [] in
 * production and for any combo without curated preview data.
 */
export function getPreviewVendors(typeSlug: string, citySlug: string): VendorListItem[] {
  if (!PREVIEW_ENABLED) return [];
  if (typeSlug === "wedding-photographers" && citySlug === "lahore") return LAHORE_PHOTOGRAPHERS;
  return [];
}
