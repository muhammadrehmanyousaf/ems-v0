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

// IMPORTANT — must match the hostname Vercel actually serves the site at.
// Vercel is currently configured with `www.weddingwala.pk` as primary and
// 307-redirects the apex `weddingwala.pk` to `www`. If we declare the
// canonical as the apex, Google sees every page as "Alternate page with
// proper canonical tag" (the crawled URL doesn't match the canonical),
// which prevents indexing.
// Reference: GSC "Page indexing" report 2026-05-12 — 56 pages affected.
export const SITE_URL = "https://www.weddingwala.pk" as const;
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
  { slug: "faisalabad", name: "Faisalabad", region: "Punjab" },
  { slug: "islamabad", name: "Islamabad", region: "Islamabad Capital Territory" },
  { slug: "rawalpindi", name: "Rawalpindi", region: "Punjab" },
  { slug: "peshawar", name: "Peshawar", region: "Khyber Pakhtunkhwa" },
  { slug: "hyderabad", name: "Hyderabad", region: "Sindh" },
  { slug: "nawabshah", name: "Nawabshah", region: "Sindh" },
  { slug: "sialkot", name: "Sialkot", region: "Punjab" },
  { slug: "gujranwala", name: "Gujranwala", region: "Punjab" },
  { slug: "jhelum", name: "Jhelum", region: "Punjab" },
  { slug: "gujrat", name: "Gujrat", region: "Punjab" },
  { slug: "multan", name: "Multan", region: "Punjab" },
  { slug: "sheikhupura", name: "Sheikhupura", region: "Punjab" },
  { slug: "shahdara", name: "Shahdara", region: "Punjab" },
  { slug: "sargodha", name: "Sargodha", region: "Punjab" },
  { slug: "bahawalpur", name: "Bahawalpur", region: "Punjab" },
  { slug: "abbottabad", name: "Abbottabad", region: "Khyber Pakhtunkhwa" },
  { slug: "wah-cantonment", name: "Wah Cantonment", region: "Punjab" },
  { slug: "mardan", name: "Mardan", region: "Khyber Pakhtunkhwa" },
  { slug: "quetta", name: "Quetta", region: "Balochistan" },
  { slug: "jacobabad", name: "Jacobabad", region: "Sindh" },
  { slug: "gilgit", name: "Gilgit", region: "Gilgit-Baltistan" },
  { slug: "usta-muhammad", name: "Usta Muhammad", region: "Balochistan" },
  { slug: "rahim-yar-khan", name: "Rahim Yar Khan", region: "Punjab" },
  { slug: "khanewal", name: "Khanewal", region: "Punjab" },
  { slug: "sukkur", name: "Sukkur", region: "Sindh" },
  { slug: "hafizabad", name: "Hafizabad", region: "Punjab" },
  { slug: "larkana", name: "Larkana", region: "Sindh" },
  { slug: "mirpur-khas", name: "Mirpur Khas", region: "Sindh" },
  { slug: "shakargarh", name: "Shakargarh", region: "Punjab" },
  { slug: "mandi-bahauddin", name: "Mandi Bahauddin", region: "Punjab" },
  { slug: "sadiqabad", name: "Sadiqabad", region: "Punjab" },
  { slug: "chiniot", name: "Chiniot", region: "Punjab" },
  { slug: "mingora", name: "Mingora", region: "Khyber Pakhtunkhwa" },
  { slug: "okara", name: "Okara", region: "Punjab" },
  { slug: "muridke", name: "Muridke", region: "Punjab" },
  { slug: "kamoke", name: "Kamoke", region: "Punjab" },
  { slug: "burewala", name: "Burewala", region: "Punjab" },
  { slug: "mandra", name: "Mandra", region: "Punjab" },
  { slug: "nowshera", name: "Nowshera", region: "Khyber Pakhtunkhwa" },
  { slug: "bhakkar", name: "Bhakkar", region: "Punjab" },
  { slug: "raiwind", name: "Raiwind", region: "Punjab" },
  { slug: "chakwal", name: "Chakwal", region: "Punjab" },
  { slug: "ahmad-abad", name: "Ahmad Abad", region: "Punjab" },
  { slug: "gambat", name: "Gambat", region: "Sindh" },
  { slug: "dera-ghazi-khan", name: "Dera Ghazi Khan", region: "Punjab" },
  { slug: "bannu", name: "Bannu", region: "Khyber Pakhtunkhwa" },
  { slug: "sahiwal", name: "Sahiwal", region: "Punjab" },
  { slug: "kasur", name: "Kasur", region: "Punjab" },
  { slug: "ranipur-riyast", name: "Ranipur Riyast", region: "Sindh" },
  { slug: "sardarabad", name: "Sardarabad", region: "Punjab" },
  { slug: "sanghar", name: "Sanghar", region: "Sindh" },
  { slug: "tarramri", name: "Tarramri", region: "Punjab" },
  { slug: "matiari", name: "Matiari", region: "Sindh" },
  { slug: "mohra-mandho", name: "Mohra Mandho", region: "Punjab" },
  { slug: "khuzdar", name: "Khuzdar", region: "Balochistan" },
  { slug: "nushki", name: "Nushki", region: "Balochistan" },
  { slug: "thokar-niaz-baig", name: "Thokar Niaz Baig", region: "Punjab" },
  { slug: "allai", name: "Allai", region: "Khyber Pakhtunkhwa" },
  { slug: "jampur", name: "Jampur", region: "Punjab" },
  { slug: "nooriabad", name: "Nooriabad", region: "Sindh" },
  { slug: "ferozwala", name: "Ferozwala", region: "Punjab" },
  { slug: "bhalwal", name: "Bhalwal", region: "Punjab" },
  { slug: "daska", name: "Daska", region: "Punjab" },
  { slug: "kandiaro", name: "Kandiaro", region: "Sindh" },
  { slug: "sohawa", name: "Sohawa", region: "Punjab" },
  { slug: "thatta", name: "Thatta", region: "Sindh" },
  { slug: "qasimabad", name: "Qasimabad", region: "Sindh" },
  { slug: "kahror-pakka", name: "Kahror Pakka", region: "Punjab" },
  { slug: "malir-cantt", name: "Malir Cantt", region: "Sindh" },
  { slug: "taobat-village", name: "Taobat Village", region: "Azad Kashmir" },
  { slug: "muzaffarabad", name: "Muzaffarabad", region: "Azad Kashmir" },
  { slug: "qazi-ahmed", name: "Qazi Ahmed", region: "Sindh" },
  { slug: "malankand", name: "Malankand", region: "Khyber Pakhtunkhwa" },
  { slug: "farooqabad", name: "Farooqabad", region: "Punjab" },
  { slug: "dhabeji", name: "Dhabeji", region: "Sindh" },
  { slug: "shahdadpur", name: "Shahdadpur", region: "Sindh" },
  { slug: "gandhian", name: "Gandhian", region: "Khyber Pakhtunkhwa" },
  { slug: "dando", name: "Dando", region: "Sindh" },
  { slug: "muzaffargarh", name: "Muzaffargarh", region: "Punjab" },
  { slug: "jahanian", name: "Jahanian", region: "Punjab" },
  { slug: "jalalpur", name: "Jalalpur", region: "Punjab" },
  { slug: "ghakhar", name: "Ghakhar", region: "Punjab" },
] as const;

export type CitySlug = (typeof CITIES)[number]["slug"];

/**
 * Subset of CITIES surfaced in the nav dropdown + homepage so the UI stays
 * clean. The full CITIES list still powers /cities, city hubs, vendor-type×city
 * pages, canonical URLs, and the sitemap — so every real city is indexable.
 */
export const FEATURED_CITY_SLUGS = [
  "karachi", "lahore", "islamabad", "rawalpindi", "faisalabad", "multan",
  "peshawar", "sialkot", "gujranwala", "hyderabad", "quetta", "bahawalpur",
] as const;
export const FEATURED_CITIES = CITIES.filter((c) =>
  (FEATURED_CITY_SLUGS as readonly string[]).includes(c.slug),
);

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
    description: "DJs, dholis, qawwals, and live performers for every wedding function.",
  },
  {
    slug: "wedding-mithai",
    singular: "Mithai & Sweets Shop",
    plural: "Mithai & Sweets",
    description: "Traditional mithai, barfi, ladoo, and wedding sweets for every shaadi function.",
  },
  {
    slug: "nikah-khwan",
    singular: "Nikah Khwan",
    plural: "Nikah Khwans",
    description: "Nikah khwans and officiants to solemnise your nikah ceremony.",
  },
  {
    slug: "wedding-generators",
    singular: "Generator Rental",
    plural: "Generator Rentals",
    description: "Backup power and generator rentals to keep every wedding function running.",
  },
  {
    slug: "wedding-cake-designers",
    singular: "Wedding Cake Designer",
    plural: "Wedding Cake Designers",
    description: "Custom wedding cakes and dessert tables for the big day.",
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
  "wedding-djs": "Dhol player",
  "wedding-mithai": "Mithai and sweets",
  "nikah-khwan": "Nikahkhwan",
  "wedding-generators": "Generator rental",
  "wedding-cake-designers": "Wedding cakes",
};

/**
 * Extra backend `vendorType` strings folded into an existing SEO slug, so small
 * categories share a relevant page instead of needing their own route. Merged
 * into the reverse lookup by backendToSeoSlug(). ALWAYS resolve a vendor's SEO
 * type via that helper (detail page, category page, sitemap) so folds stay
 * consistent and never 404.
 */
export const BACKEND_TYPE_ALIASES: Record<string, VendorTypeSlug> = {
  "Marquee rental": "wedding-venues",
  Florist: "wedding-decorators",
  "Qawwali and Naat": "wedding-djs",
  "Sound system rental": "wedding-djs",
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

/**
 * Reverse map (primary 1:1 entries + fold aliases): backend `vendorType`
 * string -> SEO slug. Returns null for types with no SEO page (e.g. types the
 * backend has but we haven't surfaced). Single source of truth for "which SEO
 * page does this vendor belong on".
 */
export function backendToSeoSlug(
  backendType: string | null | undefined,
): VendorTypeSlug | null {
  if (!backendType) return null;
  for (const [slug, backend] of Object.entries(VENDOR_TYPE_BACKEND_MAP)) {
    if (backend === backendType) return slug as VendorTypeSlug;
  }
  return BACKEND_TYPE_ALIASES[backendType] ?? null;
}
