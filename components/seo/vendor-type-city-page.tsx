import { computeCityPriceRange } from "@/lib/pricing/pricing-model";
/**
 * Shared component for `/[vendor-type-plural]/[city]` programmatic SEO pages
 * (the commercial "money pages"). Each per-vendor-type [city] route file
 * imports this with its own slug.
 *
 * Server component: fetches vendors via `fetchCityVendors` (ISR-cached 1h),
 * emits CollectionPage + Service + FAQPage JSON-LD, and renders the
 * blueprint block order (B0–B13) — see seo-strategy/mega-plan-2yr/12-page-blueprint.md.
 */

import { safeJsonLd } from "@/lib/seo/jsonld";
import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  CITIES,
  VENDOR_TYPES,
  SITE_NAME,
  SITE_URL,
  getCity,
  getVendorType,
  getBackendVendorType,
  buildPageMetadata,
  collectionPageLD,
  faqLD,
  combineGraph,
  serviceLD,
  resolveSchemaType,
  type VendorTypeSlug,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { fetchCityVendorsResult, type VendorListItem } from "@/lib/seo/fetch-vendors"
import { getCityEditorial, getVendorTypeGuide } from "@/lib/seo/city-editorial"
import {
  getVendorTypePricing,
  getVendorTypeQuestions,
  getVendorTypeGuidePillar,
  type VendorTypePricing,
} from "@/lib/seo/pricing-guide"
import { getVendorTypeRelatedGuides } from "@/lib/seo/related-guides"
import { getVendorTypeChecklist } from "@/lib/seo/things-to-check"
import { getVendorTypeEventNotes } from "@/lib/seo/event-notes"
import { getLocationImagery } from "@/lib/seo/location-imagery"
import { CityVendorListingGrid } from "@/components/seo/location/CityVendorListingGrid"

const WHATSAPP_E164 = "923274811220"

// ── Reusable button styles (kept as consts so every CTA matches) ───────────
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-bridal text-[14px] font-semibold text-white shadow-[0_10px_28px_-10px_rgba(201,149,106,0.7)] transition-all hover:-translate-y-0.5 hover:bg-bridal-gold-dark"
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-full border border-bridal-gold/50 bg-bridal-ivory/60 px-6 py-3 font-bridal text-[14px] font-semibold text-bridal-gold-dark transition-all hover:border-bridal-gold hover:bg-bridal-gold/10"
const CHIP =
  "inline-block rounded-full border border-bridal-beige bg-bridal-cream px-3.5 py-1.5 font-bridal text-[13px] text-bridal-text-soft transition-all hover:border-bridal-gold hover:text-bridal-charcoal"

/** Strip obvious seed/demo vendors so production never shows test data. */
function filterRealVendors(vendors: VendorListItem[]): VendorListItem[] {
  return vendors.filter(
    (v) => !/\b(demo|test|sample|lorem|example|dummy)\b/i.test(v.name || ""),
  )
}

/** Indicative headline range from the pricing tiers (e.g. "PKR 800–6,500+ / head" or "PKR 30,000–600,000+"). Separates per-head from flat packages. */
function indicativeRange(pricing: VendorTypePricing | null, slug?: string): string | null {
  if (!pricing) return null
  if (slug === "wedding-venues") {
    return "PKR 800–6,500+ / head"
  }
  const perHeadNums: number[] = []
  const flatNums: number[] = []
  let plus = false
  for (const t of pricing.tiers) {
    if (t.band.includes("+")) plus = true
    const isPerHead = t.band.toLowerCase().includes("/head") || t.band.toLowerCase().includes("per head")
    for (const m of t.band.match(/[\d,]+/g) ?? []) {
      const n = Number(m.replace(/,/g, ""))
      if (Number.isFinite(n) && n > 0) {
        if (isPerHead) perHeadNums.push(n)
        else flatNums.push(n)
      }
    }
  }
  const nums = perHeadNums.length > 0 ? perHeadNums : flatNums
  if (nums.length === 0) return null
  const lo = Math.min(...nums)
  const hi = Math.max(...nums)
  const unit = perHeadNums.length > 0 ? " / head" : ""
  return `PKR ${lo.toLocaleString("en-PK")}–${hi.toLocaleString("en-PK")}${plus ? "+" : ""}${unit}`
}

const B2_DRIVERS: Record<string, string> = {
  "wedding-photographers":
    "how many functions you cover (a single barat vs. full mehndi–barat–walima) and whether cinematography is bundled with the photography",
  "wedding-venues":
    "guest count, the area, and whether your date falls in peak Decemberistan season",
  "caterers": "the menu depth, number of live BBQ/handi stations, and final guest count",
  "bridal-makeup-artists":
    "the artist's reputation, the number of looks, and whether a trial is included",
  "wedding-decorators":
    "stage size, how much fresh floral you want, and the number of functions",
  "mehndi-artists": "coverage (wrist vs. elbow), the intricacy, and the artist's name",
}

function buildAnswerLead(
  plural: string,
  singular: string,
  cityName: string,
  slug: string,
  range: string | null,
): string {
  const driver = B2_DRIVERS[slug] ?? "the package, the season, and the vendor's experience"
  const rangePart = range ? `typically range ${range}` : "vary by package and season"
  return `${plural} in ${cityName} ${rangePart}, depending on ${driver}. Below you'll find ${cityName} ${plural.toLowerCase()}, real PKR package tiers, exactly what to check before you book, and how to lock your date.`
}

/** Centered crown-rule kicker + serif title — reused by every section. */
function SectionHeading({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div className="mb-9 text-center">
      {kicker && (
        <span className="bridal-crown">
          <span className="bridal-label">{kicker}</span>
        </span>
      )}
      <h2 className="mt-3 font-display text-[27px] italic leading-tight text-bridal-charcoal sm:text-[33px]">
        {title}
      </h2>
    </div>
  )
}

/** Small gold uppercase label — used to head a de-boxed text block. */
function FacetLabel({ children }: { children: string }) {
  return (
    <p className="font-bridal text-[11.5px] font-semibold uppercase tracking-[0.16em] text-bridal-gold-dark">
      {children}
    </p>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-bridal text-[10px] uppercase tracking-[0.16em] text-bridal-text-label">
        {label}
      </p>
      <p className="mt-0.5 font-display text-[17px] italic text-bridal-charcoal">{value}</p>
    </div>
  )
}

export function generateVendorTypeCityStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }))
}

export function generateVendorTypeCityMetadata(
  typeSlug: VendorTypeSlug,
  citySlug: string,
): Metadata {
  const vt = getVendorType(typeSlug)
  const city = getCity(citySlug)
  if (!vt || !city) return { title: "Not Found" }

  let fullTitle = `Best ${vt.plural} in ${city.name} (2026 Rates & Reviews)`
  let description = `Compare top ${vt.plural.toLowerCase()} in ${city.name}: ✅ 2026 package rates ✅ Verified couple reviews ✅ Direct booking on ${SITE_NAME}!`

  switch (typeSlug) {
    case "wedding-venues":
      fullTitle = `Wedding Halls in ${city.name} with Rates: 2026 Price List`
      description = `Compare wedding halls in ${city.name} with rates: ✅ 2026 per-head prices (PKR 1,500+) ✅ AC marquee menus ✅ Guest capacity & photos. Get instant quotes on ${SITE_NAME}!`
      break
    case "wedding-photographers":
      fullTitle = `Best Wedding Photographers in ${city.name} (2026 Packages)`
      description = `Compare wedding photographers in ${city.name}: ✅ 2026 shoot packages ✅ Female photo crews ✅ Cinematic portfolios & verified couple reviews on ${SITE_NAME}!`
      break
    case "caterers":
      fullTitle = `Best Wedding Caterers in ${city.name} (2026 Rates & Menus)`
      description = `Compare top wedding caterers in ${city.name}: ✅ 2026 per-head rates ✅ 12kg degh portions ✅ Live BBQ & one-dish menus. Get quotes on ${SITE_NAME}!`
      break
    case "bridal-makeup-artists":
      fullTitle = `Best Bridal Makeup Artists in ${city.name} (2026 Rates)`
      description = `Book bridal makeup in ${city.name}: ✅ 2026 signature bridal & party packages ✅ Salon addresses & real bride photos. Book on ${SITE_NAME}!`
      break
    case "mehndi-artists":
      fullTitle = `Best Bridal Mehndi Artists in ${city.name} (2026 Rates)`
      description = `Book bridal mehndi in ${city.name}: ✅ 2026 dulhan henna packages ✅ Home service available ✅ Organic dark stain. Book on ${SITE_NAME}!`
      break
    case "wedding-decorators":
      fullTitle = `Best Wedding Stage Decorators in ${city.name} (2026 Rates)`
      description = `Compare stage decorators in ${city.name}: ✅ 2026 floral stage packages ✅ Entryways, truss & ambient lighting. Get free quotes on ${SITE_NAME}!`
      break
    case "bridal-wear":
      fullTitle = `Best Bridal Wear & Sherwani in ${city.name} (2026 Prices)`
      description = `Compare bridal boutiques in ${city.name}: ✅ 2026 bridal lehengas, maxi & sherwani packages ✅ Custom fittings. Book trials on ${SITE_NAME}!`
      break
    case "wedding-cars":
      fullTitle = `Wedding Car Rental in ${city.name} (2026 Rates & Models)`
      description = `Rent wedding cars in ${city.name}: ✅ Audi, Prado, Fortuner & Limousines ✅ Driver & fuel included ✅ Flower ribbon decor. Book on ${SITE_NAME}!`
      break
    case "wedding-planners":
      fullTitle = `Best Wedding & Event Planners in ${city.name} (2026)`
      description = `Hire wedding planners in ${city.name}: ✅ End-to-end management for Mehndi, Barat & Walima ✅ Budget & vendor coordination on ${SITE_NAME}!`
      break
    case "nikah-khwan":
      fullTitle = `Licensed Nikah Khwan in ${city.name} (Official Registrar)`
      description = `Find registered Nikah Khwan in ${city.name}: ✅ Union Council certified ✅ Official 4-copy register & NADRA MRC guidance. Book on ${SITE_NAME}!`
      break
    case "wedding-stationery":
      fullTitle = `Wedding Cards & Digital Invites in ${city.name} (2026)`
      description = `Order shaadi cards in ${city.name}: ✅ 2026 print prices ✅ Islamic calligraphy ✅ Digital WhatsApp e-cards & maps. Order on ${SITE_NAME}!`
      break
    case "wedding-cake-designers":
      fullTitle = `Best Wedding Cakes in ${city.name} (2026 Flavors & Prices)`
      description = `Order wedding cakes in ${city.name}: ✅ 2026 multi-tier fondant cakes ✅ Fresh floral styling ✅ Safe delivery to venue. Book on ${SITE_NAME}!`
      break
    case "wedding-djs":
      fullTitle = `Wedding DJs & Sound Systems in ${city.name} (2026 Rates)`
      description = `Book wedding sound & DJs in ${city.name}: ✅ Dholki, Mehndi & Qawwali sound systems ✅ Smoke effects & truss lights. Get quotes on ${SITE_NAME}!`
      break
    case "wedding-generators":
      fullTitle = `Wedding Generator Rental in ${city.name} (2026 Rates)`
      description = `Rent wedding generators in ${city.name}: ✅ 50kVA to 500kVA silent gensets ✅ AC & heavy marquee load backup. Book on ${SITE_NAME}!`
      break
    case "wedding-mithai":
      fullTitle = `Wedding Mithai Boxes in ${city.name} (2026 Prices & Menu)`
      description = `Order wedding mithai in ${city.name}: ✅ 2026 per kg sweet rates ✅ Custom luxury boxes & Baat Pakki gifts. Order on ${SITE_NAME}!`
      break
  }

  return buildPageMetadata({
    fullTitle,
    description: description.slice(0, 155),
    path: `/${vt.slug}/${city.slug}`,
  })
}

function formatPriceRange(vendors: VendorListItem[], isVenue = false): string | undefined {
  return computeCityPriceRange(vendors, isVenue);
}


interface CategoryTool {
  title: string;
  desc: string;
  href: string;
  badge: string;
  icon: string;
}

function getCategoryTools(slug: string, cityName: string): CategoryTool[] {
  switch (slug) {
    case "wedding-venues":
      return [
        {
          title: "Marquee Hidden Cost & AC Calculator",
          desc: `Calculate generator diesel (PKR 6,000–12,000/hr), AC charges, and PRA/SRB taxes for ${cityName} venues.`,
          href: "/planning-tools/marquee-hidden-cost-calculator-pakistan",
          badge: "Saves PKR 100K+",
          icon: "⚡",
        },
        {
          title: "Punjab & Sindh One-Dish Checker",
          desc: `Check if your 1-dish meat + 1 sweet menu complies with ${cityName} marriage laws and 10 PM curfew.`,
          href: "/planning-tools/one-dish-menu-checker-pakistan",
          badge: "Curfew & Law",
          icon: "📋",
        },
        {
          title: "Guest List & Seating Manager",
          desc: `Allocate guest count between Ladkiwale and Ladkewale, track RSVPs, and calculate hall capacity.`,
          href: "/planning-tools/guest-list",
          badge: "RSVP Manager",
          icon: "👥",
        },
        {
          title: "Pakistani Wedding Budget Calculator",
          desc: `Estimate total wedding venue, catering, and decor budget in PKR with real-time variance.`,
          href: "/planning-tools/budget",
          badge: "Essential",
          icon: "💰",
        },
      ];
    case "caterers":
      return [
        {
          title: "Degh & Catering Portion Calculator",
          desc: `Calculate how many 12kg deghs of Biryani, Qorma, and Zarda are needed for your ${cityName} wedding.`,
          href: "/planning-tools/degh-catering-calculator-pakistan",
          badge: "Zero Food Waste",
          icon: "🍲",
        },
        {
          title: "One-Dish Rule Compliance Checker",
          desc: `Ensure your catering menu adheres to provincial One-Dish regulations in ${cityName}.`,
          href: "/planning-tools/one-dish-menu-checker-pakistan",
          badge: "Curfew & Law",
          icon: "📋",
        },
        {
          title: "Wedding Budget Calculator",
          desc: `Track per-head catering spend vs overall Shaadi budget in PKR.`,
          href: "/planning-tools/budget",
          badge: "PKR Tracker",
          icon: "💰",
        },
        {
          title: "Day-of Event Timeline Creator",
          desc: `Schedule buffet opening before 10 PM curfew to avoid venue lights-off penalties.`,
          href: "/planning-tools/timeline",
          badge: "Curfew Safe",
          icon: "⏱️",
        },
      ];
    case "wedding-photographers":
      return [
        {
          title: "Day-of Event Timeline Creator",
          desc: `Schedule golden-hour couple shoot, Baraat entry, stage family photos, and Rukhsati in ${cityName}.`,
          href: "/planning-tools/timeline",
          badge: "Shot List Sync",
          icon: "⏱️",
        },
        {
          title: "12-Month Shaadi Checklist",
          desc: `Book your photographer 6–9 months ahead of ${cityName}'s peak wedding season.`,
          href: "/planning-tools/checklist",
          badge: "Roadmap",
          icon: "📅",
        },
        {
          title: "Wedding Budget Calculator",
          desc: `Allocate budget for cinematic film, drone, and traditional photography packages.`,
          href: "/planning-tools/budget",
          badge: "Budgeting",
          icon: "💰",
        },
        {
          title: "Salami & Bari Trousseau Tracker",
          desc: `Catalog bride and groom outfits and record photo session deliverables.`,
          href: "/planning-tools/salami-bari-trousseau-tracker-pakistan",
          badge: "Tracker",
          icon: "🎁",
        },
      ];
    case "wedding-decorators":
      return [
        {
          title: "Wedding Stage & Floral Decor Calculator",
          desc: `Compare fresh floral vs artificial stage setup costs, entry walkways, and truss lighting in ${cityName}.`,
          href: "/planning-tools/wedding-decor-stage-lighting-cost-calculator",
          badge: "Cost Estimator",
          icon: "🌸",
        },
        {
          title: "Marquee Hidden Cost Calculator",
          desc: `Calculate venue outside-decorator royalties and stage power supply charges.`,
          href: "/planning-tools/marquee-hidden-cost-calculator-pakistan",
          badge: "Hidden Fees",
          icon: "⚡",
        },
        {
          title: "Day-of Event Timeline Creator",
          desc: `Coordinate setup and teardown hours before the 10 PM curfew in ${cityName}.`,
          href: "/planning-tools/timeline",
          badge: "Setup Sync",
          icon: "⏱️",
        },
        {
          title: "Wedding Budget Calculator",
          desc: `Plan decor allocations for Mehndi, Baraat, and Walima events in PKR.`,
          href: "/planning-tools/budget",
          badge: "Essential",
          icon: "💰",
        },
      ];
    case "nikah-khwan":
      return [
        {
          title: "Nikkah Nama Clauses & NADRA Checklist",
          desc: `Understand Column 18 (Tafweez-e-Talaq), Column 17 (Maintenance), and NADRA MRC requirements in ${cityName}.`,
          href: "/planning-tools/nikkah-nama-clauses-nadra-checklist-pakistan",
          badge: "Legal Guide",
          icon: "📜",
        },
        {
          title: "Haq Mehr & Gold Rate Calculator",
          desc: `Calculate Haq Mehr based on live 2026 24K gold tola rates with Islamic jurisprudence guidelines.`,
          href: "/planning-tools/haq-mehr-gold-calculator-pakistan",
          badge: "Live Tola Rates",
          icon: "🪙",
        },
        {
          title: "Day-of Event Timeline Creator",
          desc: `Schedule Nikah recitation, witness signatures, and dua before dinner buffet.`,
          href: "/planning-tools/timeline",
          badge: "Nikah Sync",
          icon: "⏱️",
        },
        {
          title: "12-Month Shaadi Checklist",
          desc: `Track Nikahnama Union Council registration and NADRA certificate collection.`,
          href: "/planning-tools/checklist",
          badge: "Checklist",
          icon: "📅",
        },
      ];
    case "bridal-makeup-artists":
    case "bridal-wear":
      return [
        {
          title: "Haq Mehr & Gold Rate Calculator",
          desc: `Calculate gold jewelry set costs (tola + making + wastage charges) for ${cityName} weddings.`,
          href: "/planning-tools/haq-mehr-gold-calculator-pakistan",
          badge: "Gold Estimator",
          icon: "👑",
        },
        {
          title: "Salami & Bari Trousseau Tracker",
          desc: `Catalog bridal lehengas, jewelry sets, and trousseau gifts with photos.`,
          href: "/planning-tools/salami-bari-trousseau-tracker-pakistan",
          badge: "Bari Ledger",
          icon: "🎁",
        },
        {
          title: "Day-of Event Timeline Creator",
          desc: `Plan salon appointment slots, dupatta setting, and photoshoot departure times.`,
          href: "/planning-tools/timeline",
          badge: "Slot Scheduler",
          icon: "⏱️",
        },
        {
          title: "Wedding Budget Calculator",
          desc: `Budget for bridal salon looks, party makeup for family, and bridal attire.`,
          href: "/planning-tools/budget",
          badge: "PKR Budget",
          icon: "💰",
        },
      ];
    case "wedding-cars":
      return [
        {
          title: "Wedding Car Rental & Convoy Calculator",
          desc: `Estimate rental costs for Audi, Prado, Fortuner & Limousines with fuel and flower decor in ${cityName}.`,
          href: "/planning-tools/pakistan-wedding-car-rental-convoy-calculator",
          badge: "Convoy Cost",
          icon: "🚗",
        },
        {
          title: "Day-of Event Timeline Creator",
          desc: `Schedule Rukhsati departure and convoy timings to ensure smooth arrival.`,
          href: "/planning-tools/timeline",
          badge: "Departure Sync",
          icon: "⏱️",
        },
        {
          title: "Marquee Hidden Cost Calculator",
          desc: `Check valet parking provisions and venue entrance restrictions.`,
          href: "/planning-tools/marquee-hidden-cost-calculator-pakistan",
          badge: "Parking & Access",
          icon: "⚡",
        },
        {
          title: "Wedding Budget Calculator",
          desc: `Track transport logistics within your overall shaadi budget in PKR.`,
          href: "/planning-tools/budget",
          badge: "Budgeting",
          icon: "💰",
        },
      ];
    case "wedding-djs":
      return [
        {
          title: "Dholki & Qawwali Night Budget Calculator",
          desc: `Estimate costs for live Qawwali troupe, dhol players, sound system, and floor seating in ${cityName}.`,
          href: "/planning-tools/dholki-qawwali-night-budget-calculator-pakistan",
          badge: "Sangeet & Qawwali",
          icon: "🪕",
        },
        {
          title: "Day-of Event Timeline Creator",
          desc: `Plan musical entries, cake cutting fanfare, and comply with the 10 PM sound curfew.`,
          href: "/planning-tools/timeline",
          badge: "Sound Curfew",
          icon: "⏱️",
        },
        {
          title: "Marquee Hidden Cost Calculator",
          desc: `Check venue sound system NOC charges and generator power capacity for DJ gear.`,
          href: "/planning-tools/marquee-hidden-cost-calculator-pakistan",
          badge: "Sound NOC",
          icon: "⚡",
        },
        {
          title: "Wedding Budget Calculator",
          desc: `Keep entertainment costs aligned with your overall shaadi budget.`,
          href: "/planning-tools/budget",
          badge: "Budgeting",
          icon: "💰",
        },
      ];
    default:
      return [
        {
          title: "Pakistani Wedding Budget Calculator",
          desc: `Plan and track your entire wedding expenditure in PKR with realistic Pakistani benchmarks.`,
          href: "/planning-tools/budget",
          badge: "Essential",
          icon: "💰",
        },
        {
          title: "12-Month Wedding Checklist",
          desc: `A complete Pakistani shaadi roadmap from Baat Pakki to Walima.`,
          href: "/planning-tools/checklist",
          badge: "Roadmap",
          icon: "📅",
        },
        {
          title: "Guest List & Seating Manager",
          desc: `Track guest counts for Ladkiwale and Ladkewale with instant headcount tally.`,
          href: "/planning-tools/guest-list",
          badge: "RSVP Manager",
          icon: "👥",
        },
        {
          title: "Overseas Wedding Currency Converter",
          desc: `Convert GBP, USD, AED, SAR, and CAD to PKR for diaspora weddings in ${cityName}.`,
          href: "/planning-tools/wedding-currency-converter-overseas-pakistanis",
          badge: "Diaspora",
          icon: "💱",
        },
      ];
  }
}

export async function VendorTypeCityPage({
  typeSlug,
  citySlug,
}: {
  typeSlug: VendorTypeSlug
  citySlug: string
}) {
  const vt = getVendorType(typeSlug)
  const city = getCity(citySlug)
  if (!vt || !city) notFound()

  const backendType = getBackendVendorType(vt.slug)
  const { vendors: fetched, ok: listingsOk } = await fetchCityVendorsResult({
    city: city.slug,
    vendorType: backendType,
    limit: 60,
  })
  // Strip seed/demo vendors so a live page never shows test data. This used to
  // fall back to curated sample vendors behind NEXT_PUBLIC_UI_PREVIEW for local
  // design work; the flag was off in production, so real vendors are the only
  // thing this has ever rendered live. Flag and sample data both removed.
  const vendors = filterRealVendors(fetched)

  // For pages with zero real listings, we render the page but mark it
  // `noindex,follow` so Google still crawls outbound internal links but
  // doesn't index the empty page itself. When at least one vendor is onboarded
  // the page becomes indexable automatically. (Content-led indexing gate is a
  // follow-up — see the SEO design backlog.)
  const hasListings = vendors.length > 0
  // "We have no vendors here" is only sayable when the backend actually
  // answered. When it did not, we know nothing — and must claim nothing.
  const genuinelyEmpty = listingsOk && !hasListings
  const editorial = getCityEditorial(city.slug)
  const guide = getVendorTypeGuide(vt.slug)
  const pricing = getVendorTypePricing(vt.slug)
  const questions = getVendorTypeQuestions(vt.slug)
  const guidePillar = getVendorTypeGuidePillar(vt.slug)
  const relatedGuides = getVendorTypeRelatedGuides(vt.slug, city.slug)
  const checklist = getVendorTypeChecklist(vt.slug)
  const eventNotes = getVendorTypeEventNotes(vt.slug)
  const imagery = getLocationImagery(vt.slug)
  const editorialFacets: { label: string; body: string }[] = [
    editorial.notable
      ? { label: `Where they cluster in ${city.name}`, body: editorial.notable }
      : null,
    guide ? { label: "What to look for", body: guide } : null,
    editorial.priceContext ? { label: "Pricing context", body: editorial.priceContext } : null,
  ].filter((f): f is { label: string; body: string } => f !== null)
  const range = indicativeRange(pricing, vt.slug)
  const answerLead = buildAnswerLead(vt.plural, vt.singular, city.name, vt.slug, range)
  const waLink = `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(
    `Hi Wedding Wala — I'm looking for ${vt.plural.toLowerCase()} in ${city.name}. Can you help me get quotes?`,
  )}`

  const url = `${SITE_URL}/${vt.slug}/${city.slug}`
  const isVenue = vt.slug === 'wedding-venues' || vt.slug === 'caterers';
  const priceRangeStr = formatPriceRange(vendors, isVenue);

  // Calculate city-level aggregate rating for Schema.org rich snippets
  const ratedVendors = vendors.filter((v) => v.rating > 0 && v.reviewCount > 0);
  const totalCityReviews = ratedVendors.reduce((acc, v) => acc + v.reviewCount, 0);
  const avgCityRating = ratedVendors.length > 0 && totalCityReviews > 0
    ? ratedVendors.reduce((acc, v) => acc + (v.rating * v.reviewCount), 0) / totalCityReviews
    : 0;

  const schemaItemType = resolveSchemaType(vt.slug);

  const collectionLd = collectionPageLD({
    name: `${vt.plural} in ${city.name} — ${SITE_NAME}`,
    description: `${vt.plural} serving weddings in ${city.name}, Pakistan.`,
    url: `/${vt.slug}/${city.slug}`,
    items: vendors.slice(0, 15).map((v) => ({
      name: v.name,
      url: v.href && v.href !== "#" ? `${SITE_URL}${v.href}` : url,
      imageUrl: v.imageUrl,
      type: schemaItemType,
      description: v.description,
      addressLocality: city.name,
      addressRegion: city.region,
      priceRange: v.priceMin ? `PKR ${v.priceMin.toLocaleString("en-PK")}` : undefined,
      rating: v.rating > 0 && v.reviewCount > 0 ? { value: v.rating, count: v.reviewCount } : undefined,
    })),
  });

  const svcLd = serviceLD({
    name: `${vt.plural} in ${city.name}`,
    description: `${vt.description} Serving ${city.name}, ${city.region}.`,
    url: `/${vt.slug}/${city.slug}`,
    serviceType: vt.singular,
    areaServed: city.name,
    priceRange: priceRangeStr ?? range ?? undefined,
    aggregateRating: totalCityReviews > 0 && avgCityRating > 0
      ? { value: avgCityRating, count: totalCityReviews }
      : undefined,
  });

  const faqs = [
    {
      question: `How much do ${vt.plural.toLowerCase()} in ${city.name} cost?`,
      answer: range
        ? `${vt.plural} in ${city.name} typically range ${range}, depending on the package, season, and experience level. See the indicative PKR tiers above and each vendor's transparent pricing below.`
        : `Prices vary by package, season, and vendor experience. Browse the listings below to see PKR ranges — every price on ${SITE_NAME} is transparent before you book.`,
    },
    {
      question: `How far in advance should I book a ${vt.singular.toLowerCase()} in ${city.name}?`,
      answer: editorial.peakSeason
        ? `${city.name}'s peak shaadi season is ${editorial.peakSeason} — for any date in that window, book 6–9 months ahead. Off-season weddings can often be booked 2–3 months out. Popular ${city.name} ${vt.plural.toLowerCase()} fill up faster, so secure the date before locking the vendor.`
        : `For peak shaadi season (October–February), book 6–9 months ahead. Off-season weddings can often be booked 2–3 months out — popular ${city.name} ${vt.plural.toLowerCase()} fill up faster.`,
    },
    {
      question: `Can I see real reviews for these ${vt.plural.toLowerCase()}?`,
      answer: `Yes. Every review on ${SITE_NAME} is from a verified booking — couples can only review a vendor after the wedding date passes. No fake reviews, no incentivised ratings.`,
    },
    {
      question: `What if my ${vt.singular.toLowerCase()} cancels?`,
      answer: `You pay the deposit directly to the vendor once they confirm — ${SITE_NAME} never takes or holds your money. If a vendor cancels last-minute, we help you find a replacement, and the vendor refunds what you paid per the cancellation policy on your booking.`,
    },
    ...(pricing
      ? [
          {
            question: `What's included at different ${vt.singular.toLowerCase()} price points in ${city.name}?`,
            answer: `${pricing.tiers
              .map((t) => `${t.tier} (${t.band}): ${t.includes}`)
              .join(" ")} ${pricing.note}`,
          },
        ]
      : []),
  ]

  const ld = combineGraph(collectionLd, svcLd, faqLD(faqs))

  const otherCities = CITIES.filter((c) => c.slug !== city.slug).slice(0, 6)
  const otherTypes = VENDOR_TYPES.filter((v) => v.slug !== vt.slug).slice(0, 6)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(ld) }}
      />
      {/* Deindex only a page we KNOW is empty.
          This was `!hasListings`, and fetchCityVendors returned [] for a failed
          request exactly as it did for a genuinely empty city. So one slow
          Railway container during a Vercel build noindexed the page — and it
          stayed noindexed until the next successful ISR pass. Found live:
          /wedding-venues/lahore, /karachi and /islamabad were all carrying
          noindex while that very query returned 24 venues. Those are the
          highest-commercial-intent URLs on the site. */}
      {genuinelyEmpty && <meta name="robots" content="noindex,follow" />}

      {/* ─────────── HERO (B0 · B1 · B2) ─────────── */}
      <section className="relative overflow-hidden bg-bridal-hero">
        <div className="pointer-events-none absolute inset-0 bg-bridal-wash opacity-90" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 top-8 h-44 w-44 rounded-full bg-bridal-rose/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/4 -bottom-20 h-52 w-52 rounded-full bg-bridal-gold/15 blur-3xl"
        />

        <div className="container-responsive relative py-12 sm:py-16 lg:py-20">
          <Breadcrumbs
            items={[
              { name: vt.plural, href: `/${vt.slug}` },
              { name: city.name, href: `/${vt.slug}/${city.slug}` },
            ]}
            className="mb-8"
          />
          <div
            className={`grid items-center gap-10 ${
              imagery.hero ? "lg:grid-cols-[1.04fr_0.96fr]" : ""
            }`}
          >
            <div className={imagery.hero ? "" : "max-w-3xl"}>
              <span className="bridal-crown">
                <span className="bridal-label">{city.region} · Pakistan</span>
              </span>
              <h1 className="mt-4 font-display text-[40px] leading-[1.04] text-bridal-charcoal sm:text-[52px] lg:text-[58px]">
                {vt.plural} in{" "}
                <span className="italic text-bridal-gold-dark">{city.name}</span>
              </h1>
              <p className="mt-5 max-w-2xl font-bridal text-[16px] leading-relaxed text-bridal-text sm:text-[17px]">
                {answerLead}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#vendors" className={BTN_PRIMARY}>
                  Browse {vt.plural.toLowerCase()}
                </a>
                <a href={waLink} target="_blank" rel="noopener noreferrer" className={BTN_SECONDARY}>
                  Get free quotes →
                </a>
              </div>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                {[
                  "Verified badge only when earned",
                  "Vendor-set PKR pricing",
                  "Refund-protected booking",
                  "Real reviews only",
                ].map((c) => (
                  <li
                    key={c}
                    className="flex items-center gap-1.5 font-bridal text-[12.5px] text-bridal-text-soft"
                  >
                    <span className="text-bridal-gold-dark">✓</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {imagery.hero && (
              <div className="relative">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] border border-bridal-gold/20 shadow-[0_34px_90px_-32px_rgba(176,125,84,0.55)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagery.hero}
                    alt={imagery.heroAlt ?? `${vt.singular} in ${city.name}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/35 via-transparent to-transparent" />
                </div>
                <div className="absolute -bottom-5 left-4 hidden rounded-2xl border border-bridal-beige bg-bridal-ivory/95 px-4 py-3 shadow-[0_18px_40px_-18px_rgba(176,125,84,0.5)] backdrop-blur sm:block">
                  <p className="font-bridal text-[9.5px] uppercase tracking-[0.18em] text-bridal-text-label">
                    Real {city.name} weddings
                  </p>
                  <p className="font-display text-[17px] italic text-bridal-charcoal">
                    Real {city.name} venues
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative border-t border-bridal-beige/70 bg-bridal-ivory/55 backdrop-blur">
          <div className="container-responsive grid grid-cols-2 gap-4 py-4 sm:grid-cols-4">
            <StatItem label="Indicative range" value={range ?? "On request"} />
            <StatItem
              label="Listed vendors"
              value={
                hasListings
                  ? String(vendors.length)
                  : genuinelyEmpty
                    ? "Adding weekly"
                    : "On request"
              }
            />
            <StatItem label="Peak season" value={editorial.peakSeason ?? "Nov–Feb"} />
            <StatItem label="Last updated" value="June 2026" />
          </div>
        </div>
      </section>

      <div className="container-responsive py-12 pb-28 sm:py-16 sm:pb-16">
        {/* ─────────── B4 VENDOR GRID ─────────── */}
        <section id="vendors" className="mb-16 scroll-mt-24">
          <SectionHeading
            kicker={hasListings ? `${vendors.length} listed` : genuinelyEmpty ? "Coming soon" : "Get matched"}
            title={`Top ${vt.plural.toLowerCase()} in ${city.name}`}
          />
          {vendors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-bridal-gold/30 bg-bridal-cream/40 p-10 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-bridal-gold/10 font-display text-[22px] italic text-bridal-gold-dark">
                ✦
              </span>
              {/* Two different situations, two different sentences. Telling a
                  family "we're still onboarding venues in Lahore" when we have
                  24 of them — because a request timed out — is worse than
                  saying nothing. The fallback makes the same offer without the
                  false claim about our inventory. */}
              <p className="mx-auto mt-4 max-w-md font-bridal text-[14px] leading-relaxed text-bridal-text-soft">
                {genuinelyEmpty ? (
                  <>
                    We&apos;re onboarding {vt.plural.toLowerCase()} in {city.name} now.
                    Tell us what you need and we&apos;ll send you matched quotes — usually within a
                    day.
                  </>
                ) : (
                  <>
                    Tell us your date and guest count and we&apos;ll send you matched{" "}
                    {vt.plural.toLowerCase()} in {city.name} with real prices — usually within a
                    day.
                  </>
                )}
              </p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-5 ${BTN_PRIMARY}`}
              >
                Get free quotes
              </a>
            </div>
          ) : (
            <CityVendorListingGrid
              initialVendors={vendors}
              categoryLabel={vt.singular}
              categoryPlural={vt.plural}
              cityName={city.name}
              citySlug={city.slug}
              typeSlug={vt.slug}
              waLink={waLink}
            />
          )}
        </section>

        {/* ─────────── B3 CITY EDITORIAL ─────────── */}
        <section className="mb-16">
          <SectionHeading
            kicker="Local guide"
            title={`About ${vt.plural.toLowerCase()} in ${city.name}`}
          />
          <div className="mx-auto max-w-3xl space-y-4 font-bridal text-[15.5px] leading-relaxed text-bridal-text">
            <p>
              {editorial.intro ??
                `${city.name} is one of Pakistan's busiest wedding destinations — whether you're planning a baraat at a banquet hall, a mehndi under string lights, or a walima at a marquee, there's a ${vt.singular.toLowerCase()} here for every style and budget.`}
            </p>
            <p>
              {SITE_NAME} makes the {city.name} {vt.singular.toLowerCase()} search simple:
              every review comes from a real booking, every quote is transparent before you commit
              a deposit, and a vendor only carries a Verified badge once we have actually checked
              their identity — the rest are listings compiled from public directories, marked as
              unclaimed until their owner takes them over.
              {editorial.peakSeason
                ? ` Peak season here is ${editorial.peakSeason} — book ahead for those dates.`
                : ""}
            </p>
          </div>
          {editorialFacets.length > 0 && (
            <div className="mx-auto mt-10 grid max-w-5xl gap-x-12 gap-y-8 border-t border-bridal-beige/60 pt-9 sm:grid-cols-3">
              {editorialFacets.map((f) => (
                <div key={f.label}>
                  <FacetLabel>{f.label}</FacetLabel>
                  <p className="mt-2.5 font-bridal text-[13.5px] leading-relaxed text-bridal-text-soft">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─────────── INSPIRATION GALLERY ─────────── */}
        {imagery.gallery && imagery.gallery.length > 0 && (
          <section className="mb-16">
            <SectionHeading kicker="Inspiration" title={`A glimpse of ${city.name} weddings`} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {imagery.gallery.map((g) => (
                <div key={g.src} className="group relative overflow-hidden rounded-xl">
                  <div className="aspect-[3/4] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.src}
                      alt={g.alt}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bridal-charcoal/15 to-transparent" />
                </div>
              ))}
            </div>
            <p className="mt-3 font-bridal text-[12px] italic text-bridal-text-soft">
              Real Pakistani wedding photography for inspiration — each vendor&apos;s own
              portfolio appears on their profile.
            </p>
          </section>
        )}

        {/* ─────────── B5 PRICE TIERS ─────────── */}
        {pricing && (
          <section className="mb-16">
            <SectionHeading
              kicker="Transparent pricing"
              title={`What does a ${vt.singular.toLowerCase()} in ${city.name} cost?`}
            />
            <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
              {pricing.tiers.map((t) => (
                <div key={t.tier} className="border-t-2 border-bridal-gold/40 pt-4">
                  <FacetLabel>{t.tier}</FacetLabel>
                  <p className="mt-1.5 font-display text-[19px] italic leading-snug text-bridal-gold-dark">
                    {t.band}
                  </p>
                  <p className="mt-3 font-bridal text-[12.5px] leading-relaxed text-bridal-text-soft">
                    {t.includes}
                  </p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-center font-bridal text-[12px] italic text-bridal-text-soft">
              {pricing.note}
            </p>
            {guidePillar && (
              <p className="mt-5 text-center">
                <Link
                  href={guidePillar.href}
                  className="font-bridal text-[14px] font-semibold text-bridal-gold-dark hover:underline"
                >
                  {guidePillar.label} →
                </Link>
              </p>
            )}
          </section>
        )}

        {/* ─────────── B6 THINGS TO CHECK ─────────── */}
        {checklist.length > 0 && (
          <section className="mb-16">
            <SectionHeading
              kicker="Buyer's checklist"
              title={`${checklist.length} things to check before you book`}
            />
            <ol className="mx-auto grid max-w-5xl gap-x-12 gap-y-7 sm:grid-cols-2">
              {checklist.map((item, i) => (
                <li key={i} className="flex gap-5 border-b border-bridal-beige/50 pb-6">
                  <span className="font-display text-[30px] italic leading-none text-bridal-gold/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-bridal text-[13.5px] leading-relaxed text-bridal-text">
                    {item}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ─────────── B8 EVENT-BY-EVENT ─────────── */}
        {eventNotes.length > 0 && (
          <section className="mb-16">
            <SectionHeading
              kicker="Every function"
              title={`${vt.singular} coverage by event in ${city.name}`}
            />
            <div className="mx-auto grid max-w-5xl gap-x-12 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {eventNotes.map((e) => (
                <div key={e.event} className="border-t-2 border-bridal-gold/40 pt-4">
                  <FacetLabel>{e.event}</FacetLabel>
                  <p className="mt-2 font-bridal text-[13px] leading-relaxed text-bridal-text-soft">
                    {e.note}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─────────── B7 QUESTIONS ─────────── */}
        {questions.length > 0 && (
          <section className="mb-16">
            <SectionHeading
              kicker="Pre-qualify the vendor"
              title={`Questions to ask before booking in ${city.name}`}
            />
            <ul className="mx-auto grid max-w-5xl gap-x-12 gap-y-4 sm:grid-cols-2">
              {questions.map((q) => (
                <li
                  key={q}
                  className="flex gap-3 border-b border-bridal-beige/40 pb-4 font-bridal text-[13.5px] leading-relaxed text-bridal-text"
                >
                  <span className="mt-0.5 text-bridal-gold-dark">✓</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ─────────── LOCAL RULES & TIMINGS (SEO Master Plan Part 3.2 #6) ─────────── */}
        {isVenue && (
          <section className="mb-16 rounded-2xl border border-bridal-gold/30 bg-bridal-cream/50 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="font-bridal text-[10.5px] uppercase tracking-[0.2em] text-bridal-gold-dark font-medium">
                  Regulations &amp; Curfews
                </span>
                <h3 className="font-display italic text-2xl text-bridal-charcoal mt-1">
                  Local Wedding Laws &amp; Timings in {city.name}
                </h3>
              </div>
              <Link
                href="/one-dish-law-and-wedding-guest-limits-pakistan"
                className="shrink-0 text-xs font-semibold text-bridal-gold-dark hover:underline flex items-center gap-1"
              >
                <span>Read Pakistan One-Dish Guide</span>
                <span>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm text-bridal-text">
              <div className="space-y-1.5 p-4 rounded-xl bg-white border border-bridal-beige/70">
                <p className="font-semibold text-bridal-charcoal text-xs uppercase tracking-wider text-bridal-gold-dark">
                  Closing Curfew Hours
                </p>
                <p className="text-xs leading-relaxed text-bridal-text">
                  {['karachi', 'hyderabad', 'sukkur'].includes(city.slug)
                    ? 'In Sindh, wedding halls and marquees must adhere to the 11:00 PM curfew. Noise regulations require music and loud speakers to conclude on time to avoid municipal penalties.'
                    : 'Under provincial regulations in Punjab and the federal capital territory, all wedding ceremonies and banquet functions must strictly conclude by 10:00 PM. Venue lights are turned off at curfew.'}
                </p>
              </div>
              <div className="space-y-1.5 p-4 rounded-xl bg-white border border-bridal-beige/70">
                <p className="font-semibold text-bridal-charcoal text-xs uppercase tracking-wider text-bridal-gold-dark">
                  Menu &amp; One-Dish Regulations
                </p>
                <p className="text-xs leading-relaxed text-bridal-text">
                  {['karachi', 'hyderabad', 'sukkur'].includes(city.slug)
                    ? 'Karachi and Sindh allow multi-course wedding menus, but caterers must follow food safety and hygiene guidelines issued by the Sindh Food Authority.'
                    : 'The Punjab Marriage Functions Act strictly enforces the one-dish rule: one main rice or meat dish plus one dessert (with salad and bread). Serving extra dishes invites heavy fines and temporary venue sealing.'}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ─────────── INTERACTIVE PLANNING TOOLS (Zero Friction Desi Lead Magnets) ─────────── */}
        <section className="mb-16">
          <SectionHeading
            kicker="Free Interactive Tools"
            title={`Shaadi planning tools for ${city.name} weddings`}
          />
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
            {getCategoryTools(vt.slug, city.name).map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-bridal-beige bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-bridal-gold hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-bridal-cream text-xl">
                      {tool.icon}
                    </span>
                    <span className="rounded-full bg-bridal-gold/10 px-3 py-1 font-bridal text-[11px] font-semibold text-bridal-gold-dark">
                      {tool.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-[19px] italic text-bridal-charcoal group-hover:text-bridal-gold-dark transition-colors">
                    {tool.title}
                  </h3>
                  <p className="mt-2 font-bridal text-[13px] leading-relaxed text-bridal-text-soft">
                    {tool.desc}
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-1.5 font-bridal text-[13px] font-semibold text-bridal-gold-dark">
                  <span>Open interactive tool</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-center">
            <Link
              href="/planning-tools"
              className="inline-flex items-center gap-1.5 font-bridal text-[13.5px] font-semibold text-bridal-gold-dark hover:underline"
            >
              <span>Explore all 16 free wedding planning tools</span>
              <span>→</span>
            </Link>
          </p>
        </section>

        {/* ─────────── B11 FAQ ─────────── */}
        <section className="mb-16">
          <SectionHeading
            kicker="FAQ"
            title={`${vt.singular} in ${city.name} — frequently asked`}
          />
          <div className="mx-auto max-w-3xl border-t border-bridal-beige/60">
            {faqs.map((f) => (
              <details key={f.question} className="group border-b border-bridal-beige/60">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-bridal text-[14.5px] font-semibold text-bridal-charcoal">
                  {f.question}
                  <span className="shrink-0 text-[18px] text-bridal-gold-dark transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-5 font-bridal text-[13.5px] leading-relaxed text-bridal-text">
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ─────────── B12 GUIDES + CROSS-LINKS ─────────── */}
        {relatedGuides.length > 0 && (
          <section className="mb-12">
            <SectionHeading kicker="Helpful guides" title={`For your ${vt.singular.toLowerCase()} search`} />
            <ul className="flex flex-wrap justify-center gap-2">
              {relatedGuides.map((g) => (
                <li key={g.href}>
                  <Link href={g.href} className={CHIP}>
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mb-16 grid grid-cols-1 gap-10 sm:grid-cols-2">
          <div className="text-center">
            <FacetLabel>{`${vt.plural} in other cities`}</FacetLabel>
            <ul className="mt-3 flex flex-wrap justify-center gap-2">
              {otherCities.map((c) => (
                <li key={c.slug}>
                  <Link href={`/${vt.slug}/${c.slug}`} className={CHIP}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-center">
            <FacetLabel>{`Other vendors in ${city.name}`}</FacetLabel>
            <ul className="mt-3 flex flex-wrap justify-center gap-2">
              {otherTypes.map((other) => (
                <li key={other.slug}>
                  <Link href={`/${other.slug}/${city.slug}`} className={CHIP}>
                    {other.plural}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─────────── B13 FINAL CTA ─────────── */}
        <section className="relative overflow-hidden rounded-3xl border border-bridal-gold/30">
          {imagery.cta ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagery.cta}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-bridal-charcoal/78" />
            </>
          ) : (
            <div className="absolute inset-0 bg-bridal-wash" />
          )}
          <div className="relative p-8 text-center sm:p-14">
            <span className="bridal-crown">
              <span className="bridal-label">Wedding Wala</span>
            </span>
            <h2
              className={`mx-auto mt-3 max-w-2xl font-display text-[28px] italic leading-tight sm:text-[34px] ${
                imagery.cta ? "text-bridal-ivory" : "text-bridal-charcoal"
              }`}
            >
              Find your {city.name} {vt.singular.toLowerCase()} today
            </h2>
            <p
              className={`mx-auto mt-3 max-w-xl font-bridal text-[14.5px] leading-relaxed ${
                imagery.cta ? "text-bridal-ivory/85" : "text-bridal-text-soft"
              }`}
            >
              Compare {vt.plural.toLowerCase()}, see transparent PKR pricing, and get
              free quotes — every booking is protected by a refund-backed deposit.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="#vendors" className={BTN_PRIMARY}>
                Browse {vt.plural.toLowerCase()}
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  imagery.cta
                    ? "inline-flex items-center justify-center gap-2 rounded-full border border-bridal-ivory/60 px-6 py-3 font-bridal text-[14px] font-semibold text-bridal-ivory transition-all hover:bg-bridal-ivory/10"
                    : BTN_SECONDARY
                }
              >
                Get free quotes on WhatsApp
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* ─────────── STICKY MOBILE CTA (B13) ─────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-bridal-beige bg-bridal-ivory/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-bridal text-[11px] text-bridal-text-soft">
              {vt.plural} in {city.name}
            </p>
            <p className="truncate font-bridal text-[13px] font-semibold text-bridal-charcoal">
              {range ?? "Get free quotes"}
            </p>
          </div>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-bridal-gold px-5 py-2.5 font-bridal text-[13px] font-semibold text-white"
          >
            Get quotes
          </a>
        </div>
      </div>
    </>
  )
}
