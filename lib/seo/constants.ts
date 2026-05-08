/**
 * SEO constants — single source of truth for site identity, cities, and
 * vendor-type slugs. Imported by metadata helpers, JSON-LD helpers, sitemap,
 * robots, and every page that needs to render brand or hierarchy strings.
 *
 * Do NOT redefine SITE_URL or SITE_NAME elsewhere.
 *
 * Reference:
 *   - docs/company-info.md — canonical brand facts
 *   - docs/seo/03-url-conventions-LOCKED.md — URL rules these slugs respect
 */

export const SITE_URL = "https://weddingwala.pk" as const;
export const SITE_NAME = "Wedding Wala" as const;
export const SITE_TAGLINE = "Pakistan's Wedding & Event Planning Marketplace" as const;
export const SITE_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}` as const;
export const SITE_DESCRIPTION =
  "Find, compare, and book the best wedding vendors and event services across Pakistan. Venues, photographers, caterers, decorators, mehndi artists, planners — all in one place." as const;

export const SUPPORT_EMAIL = "info@weddingwala.pk" as const;
export const ONBOARDING_EMAIL = "onboarding@weddingwala.pk" as const;
export const SUPPORT_PHONE_DISPLAY = "+92 327 4811220" as const;
export const SUPPORT_PHONE_E164 = "+923274811220" as const;
export const SUPPORT_PHONE_TEL = "tel:+923274811220" as const;
export const SUPPORT_PHONE_WHATSAPP = "https://wa.me/923274811220" as const;

/**
 * Terms of Service version. Bumped whenever Terms / Privacy / Refund
 * meaningfully change. Stored on the User row when they accept (see
 * backend migration 20260507110000-user-terms-acceptance).
 *
 * Format: ISO date of the policy effective date.
 *
 * Reference:
 *   - docs/payfast/01-payfast-integration-overview.md §2 item 6
 *   - app/(main)/terms/page.tsx + privacy/refund-policy/cancellation-policy
 */
export const TERMS_VERSION = "2026-05-07" as const;

/**
 * Official Wedding Wala social profile URLs. Read from public env vars
 * so adding a real handle is a one-line change in Vercel — no code edit
 * needed. Empty values are filtered out before they reach schema /
 * footer / OG, so it's safe to ship with everything blank.
 *
 * Once registered, set these in Vercel:
 *   NEXT_PUBLIC_SOCIAL_INSTAGRAM=https://www.instagram.com/weddingwalapk
 *   NEXT_PUBLIC_SOCIAL_FACEBOOK=https://www.facebook.com/weddingwalapk
 *   NEXT_PUBLIC_SOCIAL_TWITTER=https://twitter.com/weddingwalapk
 *   NEXT_PUBLIC_SOCIAL_LINKEDIN=https://www.linkedin.com/company/weddingwalapk
 *   NEXT_PUBLIC_SOCIAL_YOUTUBE=https://www.youtube.com/@weddingwalapk
 *   NEXT_PUBLIC_SOCIAL_TIKTOK=https://www.tiktok.com/@weddingwalapk
 *   NEXT_PUBLIC_SOCIAL_PINTEREST=https://www.pinterest.com/weddingwalapk
 *
 * Reference: docs/seo/00-master-seo-playbook.md §19 brand SEO + §23 AIO.
 */
export interface SocialProfile {
  key: "instagram" | "facebook" | "twitter" | "linkedin" | "youtube" | "tiktok" | "pinterest";
  label: string;
  url: string;
}

export function getSocialProfiles(): SocialProfile[] {
  const env = (key: string) => (process.env[key] || "").trim();
  const candidates: SocialProfile[] = [
    { key: "instagram", label: "Instagram", url: env("NEXT_PUBLIC_SOCIAL_INSTAGRAM") },
    { key: "facebook",  label: "Facebook",  url: env("NEXT_PUBLIC_SOCIAL_FACEBOOK") },
    { key: "twitter",   label: "X / Twitter", url: env("NEXT_PUBLIC_SOCIAL_TWITTER") },
    { key: "linkedin",  label: "LinkedIn",  url: env("NEXT_PUBLIC_SOCIAL_LINKEDIN") },
    { key: "youtube",   label: "YouTube",   url: env("NEXT_PUBLIC_SOCIAL_YOUTUBE") },
    { key: "tiktok",    label: "TikTok",    url: env("NEXT_PUBLIC_SOCIAL_TIKTOK") },
    { key: "pinterest", label: "Pinterest", url: env("NEXT_PUBLIC_SOCIAL_PINTEREST") },
  ];
  return candidates.filter((s) => s.url.length > 0);
}

export const DEFAULT_LOCALE = "en-PK" as const;
export const SUPPORTED_LOCALES = ["en-PK", "ur-PK"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Pakistani cities Wedding Wala serves. Order matters — used in nav,
 * sitemap, and city-hub listings. Update sitemap.ts when this changes.
 */
export const CITIES = [
  { slug: "karachi", name: "Karachi", region: "Sindh" },
  { slug: "lahore", name: "Lahore", region: "Punjab" },
  { slug: "islamabad", name: "Islamabad", region: "ICT" },
  { slug: "rawalpindi", name: "Rawalpindi", region: "Punjab" },
  { slug: "faisalabad", name: "Faisalabad", region: "Punjab" },
  { slug: "multan", name: "Multan", region: "Punjab" },
  { slug: "peshawar", name: "Peshawar", region: "KP" },
  { slug: "sialkot", name: "Sialkot", region: "Punjab" },
  { slug: "gujranwala", name: "Gujranwala", region: "Punjab" },
  { slug: "hyderabad", name: "Hyderabad", region: "Sindh" },
  { slug: "quetta", name: "Quetta", region: "Balochistan" },
  { slug: "bahawalpur", name: "Bahawalpur", region: "Punjab" },
] as const;

export type CitySlug = (typeof CITIES)[number]["slug"];

/**
 * Vendor type slugs — match L6 of 03-url-conventions-LOCKED.md.
 * Plural form (matches search-query patterns: "wedding photographers Lahore").
 * `wedding-` prefix ensures keyword density on the slug for category SEO.
 */
export const VENDOR_TYPES = [
  {
    slug: "wedding-venues",
    singular: "Wedding Venue",
    plural: "Wedding Venues",
    description: "Banquet halls, marquees, lawns, hotels, farmhouses for the barat, walima, and mehndi.",
  },
  {
    slug: "wedding-photographers",
    singular: "Wedding Photographer",
    plural: "Wedding Photographers",
    description: "Photographers and cinematographers capturing every shaadi function.",
  },
  {
    slug: "wedding-planners",
    singular: "Wedding Planner",
    plural: "Wedding Planners",
    description: "Full-service event planners coordinating every detail end-to-end.",
  },
  {
    slug: "caterers",
    singular: "Caterer",
    plural: "Caterers",
    description: "Wedding caterers serving Pakistani, continental, BBQ, and fusion menus.",
  },
  {
    slug: "wedding-decorators",
    singular: "Wedding Decorator",
    plural: "Wedding Decorators",
    description: "Stage, mandap, and entrance decor — traditional through modern.",
  },
  {
    slug: "mehndi-artists",
    singular: "Mehndi Artist",
    plural: "Mehndi Artists",
    description: "Bridal mehndi designers — Indian, Arabic, Pakistani, and Moroccan styles.",
  },
  {
    slug: "bridal-makeup-artists",
    singular: "Bridal Makeup Artist",
    plural: "Bridal Makeup Artists",
    description: "Bridal makeup, hair, and grooming for every wedding function.",
  },
  {
    slug: "bridal-wear",
    singular: "Bridal Wear",
    plural: "Bridal Wear",
    description: "Designer lehengas, ghararas, and wedding outfits — ready-made and bespoke.",
  },
  {
    slug: "wedding-cars",
    singular: "Wedding Car",
    plural: "Wedding Cars",
    description: "Decorated cars and luxury rentals for the rukhsati.",
  },
  {
    slug: "wedding-stationery",
    singular: "Wedding Stationery",
    plural: "Wedding Stationery",
    description: "Invitation cards, save-the-dates, and bespoke wedding stationery.",
  },
  {
    slug: "wedding-djs",
    singular: "Wedding DJ",
    plural: "Wedding DJs",
    description: "DJs, dholis, and live performers for every wedding function.",
  },
] as const;

export type VendorTypeSlug = (typeof VENDOR_TYPES)[number]["slug"];

/**
 * Maps SEO slugs to backend `User.vendorType` enum values.
 * Reference: ems-v0/lib/vendor-types.ts (legacy mapping).
 *
 * `null` means there is no backend equivalent yet — the page renders the
 * editorial / SEO content but no vendor list. Add the backend type, then
 * map it here.
 */
export const VENDOR_TYPE_BACKEND_MAP: Record<VendorTypeSlug, string | null> = {
  "wedding-venues": "Wedding venue",
  "wedding-photographers": "Photographer",
  "wedding-planners": null, // backend does not yet have this type
  "caterers": "Catering",
  "wedding-decorators": "Decorator",
  "mehndi-artists": "Henna artist",
  "bridal-makeup-artists": "Makeup artist",
  "bridal-wear": "Bridal wearing",
  "wedding-cars": "Car rental",
  "wedding-stationery": "Wedding Invitations and Stationery",
  "wedding-djs": null, // backend does not yet have this type
};

export function getCity(slug: string) {
  return CITIES.find((c) => c.slug === slug);
}

export function getVendorType(slug: string) {
  return VENDOR_TYPES.find((v) => v.slug === slug);
}

export function getBackendVendorType(slug: string): string | null {
  return VENDOR_TYPE_BACKEND_MAP[slug as VendorTypeSlug] ?? null;
}
