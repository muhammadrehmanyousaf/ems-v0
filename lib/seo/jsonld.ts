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
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_E164,
  ONBOARDING_EMAIL,
  LEGAL_ENTITY_NAME,
  LEGAL_ENTITY_LINE,
  BUSINESS_NTN,
  BUSINESS_ADDRESS_LINE1,
  BUSINESS_ADDRESS_LINE2,
  BUSINESS_CITY,
  BUSINESS_REGION,
  BUSINESS_COUNTRY,
  BUSINESS_HOURS_SCHEMA,
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
    // A payment processor's merchant review reads this block and reconciles it
    // against the FBR registration and the utility bill. `addressCountry: "PK"`
    // alone was not an address — it named a country and nothing else, so the
    // site published no verifiable place of business at all.
    legalName: LEGAL_ENTITY_LINE,
    founder: { "@type": "Person", name: LEGAL_ENTITY_NAME },
    taxID: BUSINESS_NTN,
    vatID: BUSINESS_NTN,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${BUSINESS_ADDRESS_LINE1}, ${BUSINESS_ADDRESS_LINE2}`,
      addressLocality: BUSINESS_CITY,
      addressRegion: BUSINESS_REGION,
      addressCountry: BUSINESS_COUNTRY,
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
  regionName?: string;
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
  amenities?: string[];
  photos?: string[];
}

export function resolveSchemaType(vendorTypeSlug: string): string | string[] {
  switch (vendorTypeSlug) {
    case "wedding-venues":
      return "EventVenue";
    case "wedding-photographers":
      return ["LocalBusiness", "Photographer"];
    case "bridal-makeup-artists":
      return ["LocalBusiness", "BeautySalon"];
    case "caterers":
      return ["LocalBusiness", "FoodEstablishment", "CateringService"];
    case "wedding-planners":
      return ["LocalBusiness", "ProfessionalService"];
    case "wedding-decorators":
      return ["LocalBusiness", "HomeAndConstructionBusiness"];
    case "wedding-cake-designers":
    case "wedding-mithai":
      return ["LocalBusiness", "Bakery"];
    case "wedding-cars":
      return ["LocalBusiness", "AutoRental"];
    case "wedding-djs":
      return ["LocalBusiness", "EntertainmentBusiness"];
    case "mehndi-artists":
      return ["LocalBusiness", "BeautySalon"];
    case "bridal-wear":
      return ["LocalBusiness", "ClothingStore"];
    case "wedding-stationery":
      return ["LocalBusiness", "Store"];
    default:
      return "LocalBusiness";
  }
}

export function vendorLD(v: VendorInput) {
  const url = `${SITE_URL}/${v.vendorTypeSlug}/${v.citySlug}/${v.slug}`;
  const schemaType = resolveSchemaType(v.vendorTypeSlug);

  const postalAddress: Record<string, any> = {
    "@type": "PostalAddress",
    addressLocality: v.cityName,
    addressCountry: "PK",
  };
  if (v.addressLine) postalAddress.streetAddress = v.addressLine;
  if (v.postalCode) postalAddress.postalCode = v.postalCode;
  if (v.regionName) postalAddress.addressRegion = v.regionName;

  const images = v.photos && v.photos.length > 0
    ? v.photos
    : (v.imageUrl ? [v.imageUrl] : undefined);

  const cleanDesc = (v.description && !v.description.includes("Unclaimed") && !v.description.includes("public records"))
    ? v.description
    : `Explore ${v.name} in ${v.cityName}: 2026 packages, rates, real photos, verified couple reviews & direct booking on ${SITE_NAME}.`;

  const out: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": `${url}#vendor`,
    name: v.name,
    url,
    description: cleanDesc,
    address: postalAddress,
    currenciesAccepted: "PKR",
    paymentAccepted: "Cash, Credit Card, Bank Transfer, JazzCash, Easypaisa",
    parentOrganization: { "@id": `${SITE_URL}#organization` },
  };

  if (images && images.length > 0) out.image = images;
  if (v.phone) out.telephone = v.phone;
  if (v.email) out.email = v.email;
  if (v.websiteUrl) out.sameAs = v.websiteUrl;
  if (v.priceRange) out.priceRange = v.priceRange;

  if (v.latitude && v.longitude) {
    out.geo = {
      "@type": "GeoCoordinates",
      latitude: v.latitude,
      longitude: v.longitude,
    };
  }

  if (v.amenities && v.amenities.length > 0) {
    out.amenityFeature = v.amenities.map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a,
      value: true,
    }));
  }

  if (v.rating && v.rating.count > 0 && v.rating.value > 0) {
    out.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(v.rating.value.toFixed(1)),
      reviewCount: v.rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  out.knowsAbout = v.vendorType;
  out.areaServed = {
    "@type": "City",
    name: v.cityName,
    "@id": `${SITE_URL}/cities/${v.citySlug}`,
  };

  return out;
}

// ──────────────────────────────────────────────────────────────────────────
// Venue — Place + EventVenue
// ──────────────────────────────────────────────────────────────────────────

export interface VenueInput extends VendorInput {
  capacity?: { min?: number; max?: number };
}

export function venueLD(v: VenueInput) {
  const url = `${SITE_URL}/${v.vendorTypeSlug || "wedding-venues"}/${v.citySlug}/${v.slug}`;
  const postalAddress: Record<string, any> = {
    "@type": "PostalAddress",
    addressLocality: v.cityName,
    addressCountry: "PK",
  };
  if (v.addressLine) postalAddress.streetAddress = v.addressLine;
  if (v.postalCode) postalAddress.postalCode = v.postalCode;
  if (v.regionName) postalAddress.addressRegion = v.regionName;

  const images = v.photos && v.photos.length > 0
    ? v.photos
    : (v.imageUrl ? [v.imageUrl] : undefined);

  const cleanDesc = (v.description && !v.description.includes("Unclaimed") && !v.description.includes("public records"))
    ? v.description
    : `Explore ${v.name} in ${v.cityName}: 2026 per-head rates, hall capacity, real photos, verified couple reviews & direct booking on ${SITE_NAME}.`;

  const out: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "EventVenue",
    "@id": `${url}#venue`,
    name: v.name,
    url,
    description: cleanDesc,
    address: postalAddress,
    currenciesAccepted: "PKR",
    paymentAccepted: "Cash, Credit Card, Bank Transfer, JazzCash, Easypaisa",
    parentOrganization: { "@id": `${SITE_URL}#organization` },
  };

  if (images && images.length > 0) out.image = images;
  if (v.phone) out.telephone = v.phone;
  if (v.email) out.email = v.email;
  if (v.websiteUrl) out.sameAs = v.websiteUrl;
  if (v.priceRange) out.priceRange = v.priceRange;

  if (v.latitude && v.longitude) {
    out.geo = {
      "@type": "GeoCoordinates",
      latitude: v.latitude,
      longitude: v.longitude,
    };
  }

  if (v.capacity?.max) {
    out.maximumAttendeeCapacity = v.capacity.max;
  }

  if (v.amenities && v.amenities.length > 0) {
    out.amenityFeature = v.amenities.map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a,
      value: true,
    }));
  }

  if (v.rating && v.rating.count > 0 && v.rating.value > 0) {
    out.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(v.rating.value.toFixed(1)),
      reviewCount: v.rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  out.knowsAbout = "Weddings, Marquee Events, Barat, Walima, Mehndi, Corporate Events";
  out.areaServed = {
    "@type": "City",
    name: v.cityName,
    "@id": `${SITE_URL}/cities/${v.citySlug}`,
  };

  return out;
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
  itemReviewedType?: string;
  itemReviewedUrl?: string;
  itemReviewedImage?: string;
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
      "@type": r.itemReviewedType || "LocalBusiness",
      name: r.itemReviewedName,
      ...(r.itemReviewedUrl ? { url: r.itemReviewedUrl } : {}),
      ...(r.itemReviewedImage ? { image: r.itemReviewedImage } : {}),
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
  aggregateRating,
}: {
  name: string;
  description: string;
  url: string;
  imageUrl?: string;
  serviceType: string;
  areaServed: string;
  priceRange?: string;
  aggregateRating?: { value: number; count: number };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: url.startsWith("http") ? url : `${SITE_URL}${url}`,
    ...(imageUrl ? { image: imageUrl } : {}),
    serviceType,
    areaServed: { "@type": "City", name: areaServed },
    provider: { "@id": `${SITE_URL}#organization` },
    ...(priceRange ? { priceRange } : {}),
    ...(aggregateRating && aggregateRating.count > 0 && aggregateRating.value > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(aggregateRating.value.toFixed(1)),
            reviewCount: aggregateRating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// CollectionPage / ItemList — for category + city hubs
// ──────────────────────────────────────────────────────────────────────────

export interface ListItemInput {
  name: string;
  url: string;
  imageUrl?: string;
  type?: string | string[];
  description?: string;
  addressLocality?: string;
  addressRegion?: string;
  priceRange?: string;
  rating?: { value: number; count: number };
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
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => {
        const itemObj: Record<string, any> = {
          "@type": it.type || "LocalBusiness",
          name: it.name,
          url: it.url.startsWith("http") ? it.url : `${SITE_URL}${it.url}`,
        };
        if (it.imageUrl) itemObj.image = it.imageUrl;
        if (it.description) itemObj.description = it.description;
        if (it.addressLocality) {
          itemObj.address = {
            "@type": "PostalAddress",
            addressLocality: it.addressLocality,
            ...(it.addressRegion ? { addressRegion: it.addressRegion } : {}),
            addressCountry: "PK",
          };
        }
        if (it.priceRange) itemObj.priceRange = it.priceRange;
        if (it.rating && it.rating.count > 0 && it.rating.value > 0) {
          itemObj.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: Number(it.rating.value.toFixed(1)),
            reviewCount: it.rating.count,
            bestRating: 5,
            worstRating: 1,
          };
        }
        return {
          "@type": "ListItem",
          position: i + 1,
          item: itemObj,
        };
      }),
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// AboutPage & ContactPage
// ──────────────────────────────────────────────────────────────────────────

export function aboutPageLD() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/about#webpage`,
    url: `${SITE_URL}/about`,
    name: `About ${SITE_NAME} — Pakistan's Premier Wedding Planning Platform`,
    description: SITE_DESCRIPTION,
    isPartOf: { "@id": `${SITE_URL}#website` },
    about: { "@id": `${SITE_URL}#organization` },
    inLanguage: ["en-PK", "ur-PK"],
  };
}

export function contactPageLD() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${SITE_URL}/contact#webpage`,
    url: `${SITE_URL}/contact`,
    name: `Contact Us — ${SITE_NAME}`,
    description: `Contact Wedding Wala support, vendor relations, and partnership teams across Pakistan. Phone: ${SUPPORT_PHONE_DISPLAY}, Email: ${SUPPORT_EMAIL}.`,
    isPartOf: { "@id": `${SITE_URL}#website` },
    mainEntity: { "@id": `${SITE_URL}#organization` },
    inLanguage: ["en-PK", "ur-PK"],
  };
}

// ──────────────────────────────────────────────────────────────────────────
// WebApplication — for planning tools & interactive calculators
// ──────────────────────────────────────────────────────────────────────────

export function webApplicationLD(params: {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
}) {
  const normUrl = params.url.startsWith("/") ? params.url : `/${params.url}`;
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${SITE_URL}${normUrl}#app`,
    name: params.name,
    description: params.description,
    url: `${SITE_URL}${normUrl}`,
    applicationCategory: params.applicationCategory || "LifestyleApplication",
    operatingSystem: "All (Web Browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "PKR",
      availability: "https://schema.org/InStock",
    },
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    provider: { "@id": `${SITE_URL}#organization` },
    inLanguage: ["en-PK", "ur-PK"],
  };
}

// ──────────────────────────────────────────────────────────────────────────
// WebPage / PolicyPage — for terms, privacy & institutional disclosures
// ──────────────────────────────────────────────────────────────────────────

export function policyPageLD(params: {
  name: string;
  description: string;
  url: string;
  dateModified?: string;
}) {
  const normUrl = params.url.startsWith("/") ? params.url : `/${params.url}`;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${normUrl}#webpage`,
    name: params.name,
    description: params.description,
    url: `${SITE_URL}${normUrl}`,
    isPartOf: { "@id": `${SITE_URL}#website` },
    publisher: { "@id": `${SITE_URL}#organization` },
    inLanguage: ["en-PK", "ur-PK"],
    ...(params.dateModified ? { dateModified: params.dateModified } : {}),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// JobPosting — for careers
// ──────────────────────────────────────────────────────────────────────────

export function jobPostingLD(job: {
  title: string;
  description: string;
  employmentType?: string;
  location?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: "2026-05-01",
    validThrough: "2026-12-31",
    employmentType: job.employmentType || "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: SITE_NAME,
      sameAs: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location?.includes("Lahore") ? "Lahore" : "Lahore",
        addressCountry: "PK",
      },
    },
    applicantLocationRequirements: {
      "@type": "Country",
      name: "Pakistan",
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

// ──────────────────────────────────────────────────────────────────────────
// BUG-028 — safe JSON-LD serializer.
//
// `<script type="application/ld+json">{JSON.stringify(ld)}</script>` is a stored
// XSS sink: JSON.stringify does NOT escape `<`, `>` or `/`, and the HTML parser
// ends a <script> on the literal bytes `</script>` regardless of JSON context.
// A vendor-controlled field (e.g. business name — not server-validated, see
// BUG-021) containing `</script><script>…</script>` therefore breaks out and
// executes in every visitor's browser on a Google-indexed page.
//
// Emitting `<`, `>` and `&` as their \uXXXX escapes keeps the JSON byte-for-byte
// valid (parsers read the escapes) while making a `</script>` breakout
// impossible. Use this everywhere JSON-LD is injected via dangerouslySetInnerHTML.
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
