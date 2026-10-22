/**
 * SEO Master Plan Part 2 — Mandatory Data Integrity Rules.
 * Single source of truth for all pricing displays across WeddingWala.pk.
 *
 * Rules:
 * - Do NOT invent data. If not confirmed in DB, write "Price on request".
 * - Never make up numbers.
 * - Test packages (e.g. name="test") are strictly ignored.
 * - All text, calculators, cards, meta tags, and schema MUST read from this engine.
 */

import { toAmount } from "./unpriced";

export type PriceBasis = "per_head" | "package" | "fixed" | "hourly" | "on_request";
export type PriceSource = "vendor_confirmed" | "public_listing";

export interface PricingModel {
  priceBasis: PriceBasis;
  perHeadPrice: number | null;
  packagePrice: number | null;
  minGuests: number | null;
  maxGuests: number | null;
  priceIncludes: string[];
  priceExcludes: string[];
  priceUpdatedAt: string | null;
  priceSource: PriceSource;
  isStale: boolean;
}

export interface FormattedPriceResult {
  /** The headline display string matching Part 2 display rules */
  headline: string;
  /** Primary numeric amount (perHeadPrice if per_head, packagePrice if package/fixed) */
  primaryAmount: number | null;
  /** Basis unit label */
  unitLabel: "/head" | "/event" | "/hour" | null;
  /** Secondary explanatory text (e.g., approx per head at N guests) */
  subtext: string | null;
  /** Total calculated at the requested guest count */
  calculatedTotal: number | null;
  /** Approximate per-head figure for packages (Y ÷ N) */
  approxPerHead: number | null;
  /** Recency note: 'Price confirmed on ...' or 'Price may have changed – confirm with vendor' */
  confirmationNote: string | null;
  /** Short price string for meta description */
  metaPrice: string;
  /** Schema price for JSON-LD (numeric or null) */
  schemaPrice: number | null;
  /** Pricing model metadata */
  model: PricingModel;
}

const pkr = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

function isPerHeadUnit(unit: any): boolean {
  return String(unit || "").toLowerCase() === "per_head";
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

const TEST_PACKAGE_RE = /\b(test|demo|asdf|testing)\b/i;

function isLegitimatePackage(pkg: any): boolean {
  if (!pkg) return false;
  const name = String(pkg.name || "").trim();
  const desc = String(pkg.description || "").trim();
  if (TEST_PACKAGE_RE.test(name) || desc === "this is testing") return false;
  const price = toAmount(pkg.price);
  return price !== null && price > 0;
}

function isLegitimateMenu(menu: any): boolean {
  if (!menu) return false;
  const title = String(menu.title || "").trim();
  if (TEST_PACKAGE_RE.test(title)) return false;
  const price = toAmount(menu.price);
  return price !== null && price > 0;
}

/**
 * Derives the canonical PricingModel from a raw vendor/venue record.
 * Handles both explicit DB columns and legacy package/menu structures.
 */
export function resolvePricingModel(venue: any): PricingModel {
  if (!venue) {
    return {
      priceBasis: "on_request",
      perHeadPrice: null,
      packagePrice: null,
      minGuests: null,
      maxGuests: null,
      priceIncludes: [],
      priceExcludes: [],
      priceUpdatedAt: null,
      priceSource: "public_listing",
      isStale: false,
    };
  }

  const raw = venue.raw || venue;

  // 1. Capacity bounds
  const minGuests = toAmount(raw.minGuests ?? raw.minCapacity ?? venue.minGuests ?? venue.minCapacity);
  const maxGuests = toAmount(raw.maxGuests ?? raw.maxCapacity ?? venue.maxGuests ?? venue.maxCapacity);

  // 2. Updated date & recency
  const updatedAtRaw = raw.priceUpdatedAt || raw.price_updated_at || raw.updatedAt || venue.updatedAt;
  let priceUpdatedAt: string | null = null;
  let isStale = false;
  if (updatedAtRaw) {
    const d = new Date(updatedAtRaw);
    if (!isNaN(d.getTime())) {
      priceUpdatedAt = d.toISOString();
      const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000;
      isStale = Date.now() - d.getTime() > twelveMonthsMs;
    }
  }

  const priceSource: PriceSource =
    raw.priceSource === "vendor_confirmed" || raw.price_source === "vendor_confirmed" || raw.claimed === true
      ? "vendor_confirmed"
      : "public_listing";

  const priceIncludes: string[] = Array.isArray(raw.priceIncludes ?? raw.price_includes)
    ? raw.priceIncludes ?? raw.price_includes
    : [];
  const priceExcludes: string[] = Array.isArray(raw.priceExcludes ?? raw.price_excludes)
    ? raw.priceExcludes ?? raw.price_excludes
    : [];

  // Check explicit price_basis
  const explicitBasis = String(raw.priceBasis || raw.price_basis || "").toLowerCase() as PriceBasis;

  // Inspect legitimate packages & menus (filtering out test records)
  const packages = (Array.isArray(raw.packages) ? raw.packages : Array.isArray(venue.packages) ? venue.packages : []).filter(isLegitimatePackage);
  const menus = (Array.isArray(raw.menus) ? raw.menus : Array.isArray(venue.menus) ? venue.menus : []).filter(isLegitimateMenu);

  const perHeadOfferings = [...packages, ...menus].filter((x: any) => isPerHeadUnit(x?.pricingUnit));
  const perHeadPrices = perHeadOfferings
    .map((x: any) => toAmount(x?.price))
    .filter((n: number | null): n is number => n != null && n > 0)
    .sort((a: number, b: number) => a - b);

  const flatOfferings = packages.filter((p: any) => !isPerHeadUnit(p?.pricingUnit));
  const flatPrices = flatOfferings
    .map((p: any) => toAmount(p?.price))
    .filter((n: number | null): n is number => n != null && n > 0)
    .sort((a: number, b: number) => a - b);

  const minimumPrice = toAmount(raw.minimumPrice ?? venue.minimumPrice ?? venue.priceMin);

  // If quote mode or explicitly unpriced
  if (String(raw.pricingMode || "").toLowerCase() === "quote") {
    return {
      priceBasis: "on_request",
      perHeadPrice: null,
      packagePrice: null,
      minGuests,
      maxGuests,
      priceIncludes,
      priceExcludes,
      priceUpdatedAt,
      priceSource,
      isStale,
    };
  }

  // Derive per-head vs package
  if (explicitBasis === "per_head") {
    const p = toAmount(raw.perHeadPrice ?? raw.per_head_price) ?? perHeadPrices[0] ?? minimumPrice;
    return {
      priceBasis: p && p > 0 ? "per_head" : "on_request",
      perHeadPrice: p && p > 0 ? p : null,
      packagePrice: null,
      minGuests: minGuests ?? toAmount(perHeadOfferings[0]?.minGuaranteeCount),
      maxGuests,
      priceIncludes,
      priceExcludes,
      priceUpdatedAt,
      priceSource,
      isStale,
    };
  }

  if (explicitBasis === "package" || explicitBasis === "fixed") {
    const pkgP = toAmount(raw.packagePrice ?? raw.package_price) ?? flatPrices[0] ?? minimumPrice;
    return {
      priceBasis: pkgP && pkgP > 0 ? explicitBasis : "on_request",
      perHeadPrice: null,
      packagePrice: pkgP && pkgP > 0 ? pkgP : null,
      minGuests,
      maxGuests: maxGuests ?? toAmount(flatOfferings[0]?.guestRangeMax),
      priceIncludes,
      priceExcludes,
      priceUpdatedAt,
      priceSource,
      isStale,
    };
  }

  // Auto-detect from offerings
  if (perHeadPrices.length > 0) {
    const lowestPerHead = perHeadPrices[0];
    const offeringMin = toAmount(perHeadOfferings[0]?.minGuaranteeCount) ?? minGuests;
    return {
      priceBasis: "per_head",
      perHeadPrice: lowestPerHead,
      packagePrice: null,
      minGuests: offeringMin,
      maxGuests,
      priceIncludes,
      priceExcludes,
      priceUpdatedAt,
      priceSource,
      isStale,
    };
  }

  if (flatPrices.length > 0) {
    const lowestFlat = flatPrices[0];
    return {
      priceBasis: "package",
      perHeadPrice: null,
      packagePrice: lowestFlat,
      minGuests,
      maxGuests: maxGuests ?? toAmount(flatOfferings[0]?.guestRangeMax),
      priceIncludes,
      priceExcludes,
      priceUpdatedAt,
      priceSource,
      isStale,
    };
  }

  // Fallback to minimumPrice if defined
  if (minimumPrice && minimumPrice > 0) {
    const isVenueOrCaterer = /venue|cater|marquee|hall|banquet/i.test(
      String(raw.type || raw.vendorType || venue.vendorType || ""),
    );
    if (isVenueOrCaterer && minimumPrice <= 15000) {
      return {
        priceBasis: "per_head",
        perHeadPrice: minimumPrice,
        packagePrice: null,
        minGuests,
        maxGuests,
        priceIncludes,
        priceExcludes,
        priceUpdatedAt,
        priceSource,
        isStale,
      };
    } else {
      return {
        priceBasis: "package",
        perHeadPrice: null,
        packagePrice: minimumPrice,
        minGuests,
        maxGuests,
        priceIncludes,
        priceExcludes,
        priceUpdatedAt,
        priceSource,
        isStale,
      };
    }
  }

  return {
    priceBasis: "on_request",
    perHeadPrice: null,
    packagePrice: null,
    minGuests,
    maxGuests,
    priceIncludes,
    priceExcludes,
    priceUpdatedAt,
    priceSource,
    isStale,
  };
}

/**
 * Universal single source of truth price formatter (Part 2.2).
 * Every surface (header, calculator, listing cards, schema, and tables) calls this function.
 *
 * @param venue  Vendor/Venue entity (raw or normalized)
 * @param guests Optional guest count requested by user or calculator
 */
export function formatPrice(venue: any, guests?: number | null): FormattedPriceResult {
  const model = resolvePricingModel(venue);
  const guestCount = guests && guests > 0 ? Math.floor(guests) : null;

  // Confirmation note
  let confirmationNote: string | null = null;
  if (model.priceUpdatedAt) {
    const formatted = formatDate(model.priceUpdatedAt);
    confirmationNote = model.isStale
      ? "Price may have changed – confirm with vendor"
      : `Price confirmed on ${formatted}`;
  }

  // 1. ON REQUEST / UNPRICED
  if (model.priceBasis === "on_request" || (!model.perHeadPrice && !model.packagePrice)) {
    return {
      headline: "Price on request",
      primaryAmount: null,
      unitLabel: null,
      subtext: null,
      calculatedTotal: null,
      approxPerHead: null,
      confirmationNote,
      metaPrice: "Price on request",
      schemaPrice: null,
      model,
    };
  }

  // 2. PER HEAD
  if (model.priceBasis === "per_head" && model.perHeadPrice != null) {
    const rate = model.perHeadPrice;
    const minG = model.minGuests ? Math.floor(model.minGuests) : null;

    let headline = `${pkr(rate)} per head`;
    if (minG && minG > 0) {
      headline += ` (minimum ${minG} guests)`;
    }

    let calculatedTotal: number | null = null;
    let subtext: string | null = null;

    if (guestCount) {
      const billable = minG ? Math.max(guestCount, minG) : guestCount;
      calculatedTotal = rate * billable;
      subtext = `Total ${pkr(calculatedTotal)} for ${guestCount} guests`;
      if (minG && guestCount < minG) {
        subtext += ` (billed at minimum ${minG} guests guarantee)`;
      }
    } else {
      subtext = "Total moves with guest count";
    }

    return {
      headline,
      primaryAmount: rate,
      unitLabel: "/head",
      subtext,
      calculatedTotal,
      approxPerHead: rate,
      confirmationNote,
      metaPrice: headline,
      schemaPrice: rate,
      model,
    };
  }

  // 3. PACKAGE / FIXED
  if ((model.priceBasis === "package" || model.priceBasis === "fixed") && model.packagePrice != null) {
    const pkg = model.packagePrice;
    const maxG = model.maxGuests ? Math.floor(model.maxGuests) : null;

    let headline = `Package from ${pkr(pkg)}`;
    if (maxG && maxG > 0) {
      headline += ` for up to ${maxG} guests`;
    }

    let subtext: string | null = null;
    let approxPerHead: number | null = null;

    if (guestCount && guestCount > 0) {
      approxPerHead = Math.round(pkg / guestCount);
      subtext = `approx. ${pkr(approxPerHead)} per head at ${guestCount} guests`;
    } else if (maxG && maxG > 0) {
      approxPerHead = Math.round(pkg / maxG);
      subtext = `approx. ${pkr(approxPerHead)} per head at ${maxG} guests`;
    }

    return {
      headline,
      primaryAmount: pkg,
      unitLabel: "/event",
      subtext,
      calculatedTotal: pkg,
      approxPerHead,
      confirmationNote,
      metaPrice: headline,
      schemaPrice: pkg,
      model,
    };
  }

  // Fallback
  return {
    headline: "Price on request",
    primaryAmount: null,
    unitLabel: null,
    subtext: null,
    calculatedTotal: null,
    approxPerHead: null,
    confirmationNote,
    metaPrice: "Price on request",
    schemaPrice: null,
    model,
  };
}

/**
 * Computes a credible, outlier-trimmed (10th-90th percentile) price range for a city/category.
 * Specifically separates per-head venue rates from full package prices so we never show "Rs 800 - 800,000".
 */
export function computeCityPriceRange(
  items: { priceMin?: number | null; price?: number | null }[],
  isVenueOrCaterer = false,
): string | undefined {
  const rawPrices = items
    .map((v) => toAmount(v.priceMin ?? v.price))
    .filter((p): p is number => p != null && p > 0);

  if (rawPrices.length === 0) return undefined;

  // If venue or caterer, distinguish per-head rates (<= 15,000) from lump packages
  if (isVenueOrCaterer) {
    const perHead = rawPrices.filter((p) => p >= 800 && p <= 15000).sort((a: number, b: number) => a - b);
    if (perHead.length > 0) {
      const p10 = perHead[Math.floor(perHead.length * 0.1)] ?? perHead[0];
      const p90 = perHead[Math.floor(perHead.length * 0.9)] ?? perHead[perHead.length - 1];
      if (p10 === p90) return `PKR ${p10.toLocaleString("en-PK")} per head`;
      return `PKR ${p10.toLocaleString("en-PK")} – PKR ${p90.toLocaleString("en-PK")} per head`;
    }
  }

  // General package range with 10th-90th percentile trimming
  const sorted = rawPrices.sort((a: number, b: number) => a - b);
  const p10 = sorted[Math.floor(sorted.length * 0.1)] ?? sorted[0];
  const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? sorted[sorted.length - 1];
  if (p10 === p90) return `PKR ${p10.toLocaleString("en-PK")}`;
  return `PKR ${p10.toLocaleString("en-PK")} – PKR ${p90.toLocaleString("en-PK")}`;
}
