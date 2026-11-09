/**
 * SEO Master Plan Part 2.3 & Part 3.1: Automated Validation & Quality Gate.
 *
 * Rules:
 * 1. Automated validation:
 *    - Flags names containing junk symbols (&^, %, @, repeated punctuation), all caps, or test words.
 *    - Flags off-topic / non-wedding businesses (dental, motors, electronics, pizza, pharmacy).
 *    - Sanity check pricing: per-head Rs 800 - Rs 15,000; total package >= Rs 20,000 for marquee/banquet.
 * 2. Listing Quality Gate (Part 3.1 & Phase T2):
 *    - Thin/broken listings (< 3 photos, off-topic, test/junk names, or missing core data)
 *      are set to `noindex, follow` and excluded from the sitemap.
 */

import { resolvePricingModel } from "./pricing-model";

const JUNK_SYMBOLS_RE = /(&\^|[%@$*~<>{}\[\]\\]|(\|{2,})|(\?{2,})|(!{2,}))/;
const TEST_WORDS_RE = /\b(test|demo|asdf|dummy|sample|testing)\b/i;

// Strict off-topic keywords (always off-topic across all categories)
const STRICT_OFF_TOPIC_RE = /\b(dental|dentist|clinic|hospital|doctor|exim|import export|pizza|burger|shawarma|chai dhabba|pharmacy|chemist|hardware|sanitary|plumber|plumbing)\b/i;

function isListingOffTopic(name: string, description: string, raw: any): boolean {
  const type = String(raw?.type || raw?.vendorType || raw?.vendor?.vendorType || raw?.subBusinessType || "").toLowerCase();

  // Contextual exceptions for legitimate wedding categories
  const isCarService = type.includes("car") || /rent\s*a\s*car|car\s*rental|wedding\s*car/i.test(name);
  const isGeneratorService = type.includes("generator") || /generator/i.test(name);
  const isStationeryService = type.includes("stationery") || type.includes("invitation") || /wedding\s*card|invitation|printer|printing/i.test(name);
  const isCateringOrMithai = type.includes("cater") || type.includes("mithai") || /halwa|mithai|dastarkhwan|pakwan/i.test(name);

  if (STRICT_OFF_TOPIC_RE.test(name)) return true;

  // Category-specific checks: allow motors for car services, electronics for generators, stationery for printers, halwa/paratha for catering
  if (!isCarService && /\b(motors|automotive|auto repair|workshop)\b/i.test(name)) return true;
  if (!isGeneratorService && /\b(electronics|electric store|home appliances)\b/i.test(name)) return true;
  if (!isStationeryService && /\b(photocopy|stationers)\b/i.test(name)) return true;
  if (!isCateringOrMithai && /\b(paratha|fast food)\b/i.test(name)) return true;

  return false;
}

export interface ValidationResult {
  isValid: boolean;
  isIndexable: boolean;
  reasons: string[];
  flags: {
    hasJunkSymbols: boolean;
    isTestWord: boolean;
    isAllCaps: boolean;
    isOffTopic: boolean;
    pricingSanityFailed: boolean;
    thinContent: boolean;
  };
}

export function validateListing(raw: any): ValidationResult {
  const reasons: string[] = [];
  const name = String(raw?.name ?? raw?.businessName ?? "").trim();
  const images = Array.isArray(raw?.images) ? raw.images : [];
  const description = String(raw?.description ?? "").trim();
  const descWords = description.split(/\s+/).filter(Boolean).length;

  // 1. Name checks
  const hasJunkSymbols = JUNK_SYMBOLS_RE.test(name);
  if (hasJunkSymbols) {
    reasons.push(`Name contains junk symbols or invalid punctuation: "${name}"`);
  }

  const isTestWord = TEST_WORDS_RE.test(name);
  if (isTestWord) {
    reasons.push(`Name contains test/demo keywords: "${name}"`);
  }

  const isAllCaps = name.length >= 6 && name === name.toUpperCase() && /[A-Z]/.test(name);
  if (isAllCaps) {
    reasons.push(`Name is ALL CAPS: "${name}"`);
  }

  // 2. Off-topic checks
  const isOffTopic = isListingOffTopic(name, description, raw);
  if (isOffTopic) {
    reasons.push(`Business appears off-topic / non-wedding: "${name}"`);
  }

  // 3. Pricing Sanity Checks (Part 2.3)
  const pricing = resolvePricingModel(raw);
  let pricingSanityFailed = false;

  if (pricing.priceBasis === "per_head" && pricing.perHeadPrice != null) {
    if (pricing.perHeadPrice < 800 || pricing.perHeadPrice > 15000) {
      pricingSanityFailed = true;
      reasons.push(`Per-head price Rs ${pricing.perHeadPrice} is outside sanity range (Rs 800 - Rs 15,000)`);
    }
  }

  const isVenue = /venue|marquee|hall|banquet|lawn/i.test(String(raw?.type || raw?.vendorType || ""));
  if (isVenue && (pricing.priceBasis === "package" || pricing.priceBasis === "fixed") && pricing.packagePrice != null) {
    if (pricing.packagePrice < 20000) {
      pricingSanityFailed = true;
      reasons.push(`Marquee/Banquet package price Rs ${pricing.packagePrice} is below sanity threshold (Rs 20,000)`);
    }
  }

  // 4. Quality Gate (Part 3.1 & Phase T2)
  // Thin listings: 0 photos, or 0 description and 0 pricing
  const thinContent = images.length === 0 || (descWords < 3 && pricing.priceBasis === "on_request");
  if (thinContent) {
    reasons.push(`Listing has thin content (${images.length} images, ${descWords} words)`);
  }

  const isIndexable =
    !hasJunkSymbols &&
    !isTestWord &&
    !isOffTopic &&
    !thinContent &&
    name.length > 2 &&
    raw?.deletedAt == null;

  return {
    isValid: reasons.length === 0,
    isIndexable,
    reasons,
    flags: {
      hasJunkSymbols,
      isTestWord,
      isAllCaps,
      isOffTopic,
      pricingSanityFailed,
      thinContent,
    },
  };
}

export function isListingIndexable(raw: any): boolean {
  return validateListing(raw).isIndexable;
}
