/**
 * JSON-LD helpers — every public page calls these to emit schema.org markup
 * server-rendered into <head>. Validates against Google Rich Results Test.
 *
 * Reference: docs/seo/00-master-seo-playbook.md §9 (items 385–421).
 *
 * Usage:
 *   import { breadcrumbsLD, vendorLD } from "@/lib/seo/jsonld";
 *
 *   // In a Server Component:
 *   <script type="application/ld+json"
 *           dangerouslySetInnerHTML={{ __html: JSON.stringify(vendorLD(vendor)) }} />
 */

import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_E164,
  ONBOARDING_EMAIL,
  getSocialProfiles,
} from "./constants";

// ──────────────────────────────────────────────────────────────────────────
// Organization + WebSite — emitted from app/layout.tsx site-wide
// ──────────────────────────────────────────────────────────────────────────

export function organizationLD() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    email: SUPPORT_EMAIL,
    telephone: SUPPORT_PHONE_E164,
    description: SITE_DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      addressCountry: "PK",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: SUPPORT_PHONE_E164,
        contactType: "customer support",
        email: SUPPORT_EMAIL,
        areaServed: "PK",
        availableLanguage: ["en", "ur"],
      },
      {
        "@type": "ContactPoint",
        email: ONBOARDING_EMAIL,
        contactType: "vendor onboarding",
        areaServed: "PK",
        availableLanguage: ["en", "ur"],
      },
    ],
    // Read from env-driven social profile list. Empty until handles are
    // registered + `NEXT_PUBLIC_SOCIAL_*` env vars are set (see
    // lib/seo/constants.ts → getSocialProfiles). Once populated, this
    // feeds the Organization Knowledge Graph entry on Google.
    sameAs: getSocialProfiles().map((s) => s.url),
  };
}

export function webSiteLD() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}#organization` },
    inLanguage: ["en-PK", "ur-PK"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  } as const;
}

// ──────────────────────────────────────────────────────────────────────────
// BreadcrumbList — emitted on every non-home page
// ──────────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string; // relative path or absolute
}

export function breadcrumbsLD(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Article / BlogPosting — for /blog/* pages
// ──────────────────────────────────────────────────────────────────────────

export interface ArticleInput {
  headline: string;
  description: string;
  url: string;
  imageUrl: string;
  datePublished: string; // ISO 8601
  dateModified?: string; // ISO 8601
  authorName: string;
  authorUrl?: string;
}

export function articleLD(a: ArticleInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.headline,
    description: a.description,
    url: a.url.startsWith("http") ? a.url : `${SITE_URL}${a.url}`,
    image: a.imageUrl,
    datePublished: a.datePublished,
    dateModified: a.dateModified ?? a.datePublished,
    author: {
      "@type": "Person",
      name: a.authorName,
      ...(a.authorUrl ? { url: a.authorUrl } : {}),
    },
    publisher: { "@id": `${SITE_URL}#organization` },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": a.url.startsWith("http") ? a.url : `${SITE_URL}${a.url}`,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// FAQPage — for category and vendor pages with Q&A blocks
// ──────────────────────────────────────────────────────────────────────────

export interface FAQItem {
  question: string;
  answer: string; // plain text or HTML; Google strips most tags
}

export function faqLD(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.answer,
      },
    })),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// HowTo — for tutorial pages
// ──────────────────────────────────────────────────────────────────────────

export interface HowToStep {
  name: string;
  text: string;
  imageUrl?: string;
  url?: string;
}

export function howToLD({
  name,
  description,
  imageUrl,
  totalTime,
  steps,
}: {
  name: string;
  description: string;
  imageUrl?: string;
  totalTime?: string; // ISO 8601 duration e.g. "PT30M"
  steps: HowToStep[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(totalTime ? { totalTime } : {}),
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.imageUrl ? { image: s.imageUrl } : {}),
      ...(s.url ? { url: s.url } : {}),
    })),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// LocalBusiness / Service — vendor profile pages
// ──────────────────────────────────────────────────────────────────────────

export interface VendorInput {
  id: string | number;
  name: string;
  slug: string; // full slug-shortid (used in URL)
  vendorType: string; // e.g. "Wedding Photographer"
  vendorTypeSlug: string; // e.g. "wedding-photographers"
  description: string;
  imageUrl: string;
  citySlug: string;
  cityName: string;
  addressLine?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  websiteUrl?: string;
  priceRange?: string; // "$$" or "PKR 50,000–250,000"
  rating?: { value: number; count: number };
  yearsActive?: number;
}

export function vendorLD(v: VendorInput) {
  const url = `${SITE_URL}/${v.vendorTypeSlug}/${v.citySlug}/${v.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${url}#vendor`,
    name: v.name,
    url,
    image: v.imageUrl,
    description: v.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: v.cityName,
      addressCountry: "PK",
      ...(v.addressLine ? { streetAddress: v.addressLine } : {}),
      ...(v.postalCode ? { postalCode: v.postalCode } : {}),
    },
    ...(v.latitude && v.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: v.latitude,
            longitude: v.longitude,
          },
        }
      : {}),
    ...(v.phone ? { telephone: v.phone } : {}),
    ...(v.email ? { email: v.email } : {}),
    ...(v.priceRange ? { priceRange: v.priceRange } : {}),
    ...(v.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: v.rating.value,
            reviewCount: v.rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    knowsAbout: v.vendorType,
    areaServed: { "@type": "City", name: v.cityName, "@id": `${SITE_URL}/cities/${v.citySlug}` },
    parentOrganization: { "@id": `${SITE_URL}#organization` },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Venue — Place + EventVenue
// ──────────────────────────────────────────────────────────────────────────

export interface VenueInput extends VendorInput {
  capacity?: { min?: number; max?: number };
}

export function venueLD(v: VenueInput) {
  const url = `${SITE_URL}/venues/${v.citySlug}/${v.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "EventVenue",
    "@id": `${url}#venue`,
    name: v.name,
    url,
    image: v.imageUrl,
    description: v.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: v.cityName,
      addressCountry: "PK",
      ...(v.addressLine ? { streetAddress: v.addressLine } : {}),
      ...(v.postalCode ? { postalCode: v.postalCode } : {}),
    },
    ...(v.latitude && v.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: v.latitude,
            longitude: v.longitude,
          },
        }
      : {}),
    ...(v.capacity?.max ? { maximumAttendeeCapacity: v.capacity.max } : {}),
    ...(v.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: v.rating.value,
            reviewCount: v.rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    parentOrganization: { "@id": `${SITE_URL}#organization` },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Review — for vendor + venue pages
// ──────────────────────────────────────────────────────────────────────────

export interface ReviewInput {
  authorName: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
  itemReviewedName: string;
}

export function reviewLD(r: ReviewInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    author: { "@type": "Person", name: r.authorName },
    reviewRating: {
      "@type": "Rating",
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: r.reviewBody,
    datePublished: r.datePublished,
    itemReviewed: {
      "@type": "LocalBusiness",
      name: r.itemReviewedName,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Service — for category landing pages
// ──────────────────────────────────────────────────────────────────────────

export function serviceLD({
  name,
  description,
  url,
  imageUrl,
  serviceType,
  areaServed,
  priceRange,
}: {
  name: string;
  description: string;
  url: string;
  imageUrl?: string;
  serviceType: string;
  areaServed: string;
  priceRange?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: url.startsWith("http") ? url : `${SITE_URL}${url}`,
    ...(imageUrl ? { image: imageUrl } : {}),
    serviceType,
    areaServed: { "@type": "Country", name: areaServed },
    provider: { "@id": `${SITE_URL}#organization` },
    ...(priceRange ? { priceRange } : {}),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// CollectionPage / ItemList — for category + city hubs
// ──────────────────────────────────────────────────────────────────────────

export interface ListItemInput {
  name: string;
  url: string;
  imageUrl?: string;
}

export function collectionPageLD({
  name,
  description,
  url,
  items,
}: {
  name: string;
  description: string;
  url: string;
  items: ListItemInput[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: url.startsWith("http") ? url : `${SITE_URL}${url}`,
    inLanguage: "en-PK",
    isPartOf: { "@id": `${SITE_URL}#website` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        url: it.url.startsWith("http") ? it.url : `${SITE_URL}${it.url}`,
        ...(it.imageUrl ? { image: it.imageUrl } : {}),
      })),
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Helper: combine multiple LD objects into a @graph
// ──────────────────────────────────────────────────────────────────────────

export function combineGraph(...nodes: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.map((n) => {
      // strip per-node @context to avoid duplication when using @graph
      const { ["@context"]: _, ...rest } = n as any;
      return rest;
    }),
  };
}
