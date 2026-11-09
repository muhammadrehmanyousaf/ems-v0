import { formatPrice } from "@/lib/pricing/pricing-model";
import { isListingIndexable } from "@/lib/pricing/pricing-validator";
/**
 * Shared L6 leaf detail page — `/{type-plural}/{city-slug}/{name-slug}-{id}`.
 *
 * Each per-vendor-type [vendorSlug] route in
 * `app/(main)/<type-slug>/[city]/[vendorSlug]/page.tsx` is a thin wrapper
 * that delegates here. Behavior:
 *   1. Parse the trailing -{id} from the URL slug.
 *   2. Fetch the vendor by id (ISR-cached 1h).
 *   3. 404 if not found.
 *   4. 301 to the canonical slug if the user typed a stale name-slug.
 *   5. 404 if the vendor's actual city or type doesn't match the URL.
 *   6. Render schema (LocalBusiness or EventVenue), breadcrumbs,
 *      gallery, packages, reviews, contact CTA.
 *
 * Reference: docs/seo/03-url-conventions-LOCKED.md §L6 +
 *            docs/seo/00-master-seo-playbook.md §9 schema.
 */

import { safeJsonLd } from "@/lib/seo/jsonld";
import Image from "next/image"
import { Phone, MessageCircle } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { notFound, redirect, permanentRedirect } from "next/navigation"
import { VenueSpaceSelector } from "@/components/booking/venue-space-selector"
import { ClaimListingCard } from "@/components/seo/claim-listing-card"
import { fetchVendorHasMultiSpace } from "@/lib/seo/fetch-vendor"
import VendorInquiryCta from "@/components/seo/vendor-inquiry-cta"
import { UnavailableButton, VenueUnavailableNotice } from "@/components/venue/venue-unavailable-notice"
import { readAvailabilityNotice } from "@/lib/plans/venue-availability"
import VendorOfferings from "@/components/seo/vendor-offerings"
import { SeoVendorSecondaryCtas } from "@/components/seo/seo-vendor-secondary-ctas"
import {
  CITIES,
  VENDOR_TYPES,
  SITE_NAME,
  SITE_URL,
  getCity,
  getVendorType,
  getBackendVendorType,
  backendToSeoSlug,
  buildPageMetadata,
  vendorLD,
  venueLD,
  reviewLD,
  combineGraph,
  faqLD,
  type VendorTypeSlug,
} from "@/lib/seo"
import {
  fetchVendorById,
  parseVendorSlugAndId,
  buildVendorCanonicalPath,
  slugifyName,
  type VendorDetail,
} from "@/lib/seo/fetch-vendor"
import { getVendorGuidance } from "@/lib/seo/vendor-type-guidance"
import { fetchCityVendors } from "@/lib/seo/fetch-vendors"
import { getVendorTypeGuidePillar } from "@/lib/seo/pricing-guide"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { getLocationImagery } from "@/lib/seo/location-imagery"
import { VenueAnswers } from "@/components/seo/venue-answers"
import { resolveAmenityLabels } from "@/lib/amenities"
import { StickyQuoteBar } from "@/components/seo/sticky-quote-bar"
import { cancellationDisplay } from "@/lib/cancellation-policy"

interface PageInput {
  typeSlug: VendorTypeSlug
  citySlug: string
  vendorSlug: string
}

export async function generateVendorDetailMetadata(
  input: PageInput,
): Promise<Metadata> {
  const vt = getVendorType(input.typeSlug)
  const city = getCity(input.citySlug)
  if (!vt || !city) return { title: `Wedding Vendors | ${SITE_NAME}` }

  const { id } = parseVendorSlugAndId(input.vendorSlug)
  if (!id) return { title: `${vt?.plural || "Vendors"} in ${city?.name || "Pakistan"} | ${SITE_NAME}` }

  const vendor = await fetchVendorById(id)
  if (!vendor) {
    return {
      title: `${vt.plural} in ${city.name} | ${SITE_NAME}`,
      description: `Browse verified ${vt.plural.toLowerCase()} in ${city.name}, Pakistan on ${SITE_NAME}.`,
    }
  }

  let title = `${vendor.name} — ${vt.singular} in ${city.name}`
  let description = `${vendor.name} — ${vt.singular.toLowerCase()} in ${city.name}, Pakistan. Book on ${SITE_NAME}.`


  const priceDisplay = formatPrice(vendor.raw || vendor);
  const indexable = isListingIndexable(vendor.raw || vendor);
  const priceStr = (priceDisplay.metaPrice && priceDisplay.metaPrice !== "Price on request")
    ? priceDisplay.metaPrice
    : "2026 packages & per-head rates";

  let fullTitle = `${vendor.name} ${city.name}: 2026 Rates & Reviews`;

  switch (input.typeSlug) {
    case "wedding-venues":
      fullTitle = `${vendor.name} ${city.name} Booking Price: 2026 Rates & Photos`;
      if (fullTitle.length > 58) {
        fullTitle = `${vendor.name} ${city.name}: 2026 Rates & Photos`;
      }
      const capStr = vendor.raw?.maxCapacity ? ` (${vendor.raw.maxCapacity} guests)` : "";
      description = `Planning your event at ${vendor.name} in ${city.name}? ✅ 2026 per-head rates (${priceStr}) ✅ Hall photos & capacity${capStr}. View menus & book on ${SITE_NAME}!`.slice(0, 155);
      break;
    case "wedding-photographers":
      fullTitle = `${vendor.name} ${city.name}: 2026 Packages & Photos`;
      description = `Book ${vendor.name} in ${city.name}. ✅ 2026 packages (${priceStr}) ✅ Photo & video portfolio ✅ Verified reviews. Check dates & book on ${SITE_NAME}!`.slice(0, 155);
      break;
    case "caterers":
      fullTitle = `${vendor.name} ${city.name}: 2026 Catering Menu & Rates`;
      description = `Book ${vendor.name} in ${city.name}. ✅ 2026 per-head rates (${priceStr}) ✅ Live degh & BBQ menu ✅ One-dish packages. Get instant quotes on ${SITE_NAME}!`.slice(0, 155);
      break;
    case "bridal-makeup-artists":
      fullTitle = `${vendor.name} ${city.name}: 2026 Bridal Makeup Rates`;
      description = `Book ${vendor.name} in ${city.name}. ✅ 2026 bridal packages (${priceStr}) ✅ Real bride looks ✅ Salon address. Book your slot on ${SITE_NAME}!`.slice(0, 155);
      break;
    case "mehndi-artists":
      fullTitle = `${vendor.name} ${city.name}: 2026 Mehndi Rates & Henna`;
      description = `Book ${vendor.name} in ${city.name}. ✅ 2026 bridal mehndi rates (${priceStr}) ✅ Dulhan henna photos ✅ Home service available. Book on ${SITE_NAME}!`.slice(0, 155);
      break;
    case "wedding-decorators":
      fullTitle = `${vendor.name} ${city.name}: 2026 Stage Decor Rates`;
      description = `Book ${vendor.name} in ${city.name}. ✅ 2026 stage decor rates (${priceStr}) ✅ Floral backdrops, walkway & lights. Book on ${SITE_NAME}!`.slice(0, 155);
      break;
    case "bridal-wear":
      fullTitle = `${vendor.name} ${city.name}: 2026 Bridal Lehenga Prices`;
      description = `Explore ${vendor.name} in ${city.name}. ✅ 2026 bridal lehengas & sherwani collection (${priceStr}) ✅ Custom fittings on ${SITE_NAME}!`.slice(0, 155);
      break;
    case "wedding-cars":
      fullTitle = `${vendor.name} ${city.name}: 2026 Wedding Car Rental Rates`;
      description = `Rent wedding cars from ${vendor.name} in ${city.name}. ✅ 2026 rates (${priceStr}) ✅ Audi, Prado & Fortuner with driver on ${SITE_NAME}!`.slice(0, 155);
      break;
    case "wedding-planners":
      fullTitle = `${vendor.name} ${city.name}: 2026 Wedding Planner Rates`;
      description = `Plan your wedding with ${vendor.name} in ${city.name}. ✅ 2026 packages (${priceStr}) ✅ End-to-end event coordination on ${SITE_NAME}!`.slice(0, 155);
      break;
    case "nikah-khwan":
      fullTitle = `${vendor.name} ${city.name}: Registered Nikah Khwan`;
      description = `Book ${vendor.name} in ${city.name}. ✅ Union Council registered Nikah Khwan ✅ NADRA MRC compliance & Nikkahnama signing on ${SITE_NAME}!`.slice(0, 155);
      break;
    case "wedding-stationery":
      fullTitle = `${vendor.name} ${city.name}: 2026 Wedding Card Prices`;
      description = `Order shaadi cards from ${vendor.name} in ${city.name}. ✅ 2026 prices (${priceStr}) ✅ Custom Islamic calligraphy & e-cards on ${SITE_NAME}!`.slice(0, 155);
      break;
    case "wedding-cake-designers":
      fullTitle = `${vendor.name} ${city.name}: 2026 Wedding Cake Prices`;
      description = `Order wedding cakes from ${vendor.name} in ${city.name}. ✅ 2026 multi-tier cake prices (${priceStr}) ✅ Delivery to venue on ${SITE_NAME}!`.slice(0, 155);
      break;
    case "wedding-djs":
      fullTitle = `${vendor.name} ${city.name}: 2026 Wedding Sound & DJ Rates`;
      description = `Book ${vendor.name} in ${city.name}. ✅ 2026 sound & DJ rates (${priceStr}) ✅ Dholki, Mehndi & Qawwali sound systems on ${SITE_NAME}!`.slice(0, 155);
      break;
    case "wedding-generators":
      fullTitle = `${vendor.name} ${city.name}: 2026 Wedding Generator Rates`;
      description = `Rent backup generators from ${vendor.name} in ${city.name}. ✅ 2026 rental rates (${priceStr}) ✅ 50kVA-500kVA silent gensets on ${SITE_NAME}!`.slice(0, 155);
      break;
    case "wedding-mithai":
      fullTitle = `${vendor.name} ${city.name}: 2026 Mithai Box Prices`;
      description = `Order mithai from ${vendor.name} in ${city.name}. ✅ 2026 sweet box prices (${priceStr}) ✅ Custom shaadi packaging. Order on ${SITE_NAME}!`.slice(0, 155);
      break;
    default:
      fullTitle = `${vendor.name} ${city.name}: 2026 Rates & Packages`;
      description = `Planning your wedding with ${vendor.name} in ${city.name}? ✅ 2026 rates (${priceStr}) ✅ Verified portfolio & direct booking on ${SITE_NAME}!`.slice(0, 155);
      break;
  }
  return {
    ...buildPageMetadata({
      fullTitle,
      description,
      path: `/${vt.slug}/${city.slug}/${vendor.nameSlug}-${vendor.id}`,
      imageUrl: vendor.imageUrl,
      ogType: "profile",
    }),
    ...(!indexable ? { robots: { index: false, follow: true } } : {}),
  }
}

export async function VendorDetailPage(input: PageInput) {
  const vt = getVendorType(input.typeSlug)
  const city = getCity(input.citySlug)
  if (!vt || !city) {
    permanentRedirect("/wedding-venues")
  }

  const parsed = parseVendorSlugAndId(input.vendorSlug)
  if (!parsed.id) {
    permanentRedirect(`/${vt.slug}/${city.slug}`)
  }

  const vendor = await fetchVendorById(parsed.id)
  if (!vendor) {
    // Stale or deleted vendor ID: 301 redirect to the city category hub instead of 404
    permanentRedirect(`/${vt.slug}/${city.slug}`)
  }
  const priceDisplay = formatPrice(vendor.raw || vendor)

  // Editorial stand-in for a vendor with no photos of their own. Category-
  // matched, never presented as theirs — see the caption on the image itself.
  const imagery = getLocationImagery(vt.slug)
  const fallbackImage = {
    src: imagery.hero ?? "/images/home/cities/lahore.jpg",
    alt: imagery.heroAlt ?? `${vt.singular} in ${city.name}`,
  }

  // Type / city sanity — if vendor category or city was reclassified, 301 redirect
  // to their real canonical profile URL instead of returning 404 to Google
  const actualTypeSlug = (vendor.vendorType && backendToSeoSlug(vendor.vendorType)) || vt.slug
  const actualCitySlug = slugifyName(vendor.city || city.slug)

  if (actualTypeSlug !== vt.slug || (city.slug !== "pakistan" && actualCitySlug !== city.slug)) {
    const targetCity = getCity(actualCitySlug) || city
    permanentRedirect(buildVendorCanonicalPath(actualTypeSlug, targetCity.slug, vendor))
  }

  // Canonicalization — if the user typed a stale slug, 301 to the
  // canonical URL. Compare against the slugified DB name.
  if (parsed.slug !== vendor.nameSlug) {
    permanentRedirect(buildVendorCanonicalPath(vt.slug, city.slug, vendor))
  }

  // Related vendors (same type + city) — internal-link flywheel + crawl depth.
  const expectedBackendType = getBackendVendorType(vt.slug)
  const related = (
    expectedBackendType
      ? await fetchCityVendors({
          city: city.slug,
          vendorType: expectedBackendType,
          limit: 7,
        })
      : []
  )
    .filter((v) => String(v.id) !== String(vendor.id))
    .slice(0, 4)
  const guidePillar = getVendorTypeGuidePillar(vt.slug)
  const otherTypes = VENDOR_TYPES.filter((t) => t.slug !== vt.slug).slice(0, 6)

  // Schema — venues use EventVenue, everything else uses LocalBusiness.
  /**
   * WW-AMENITIES — the vendor's ticked facilities.
   *
   * Reads `amenitiesJson` (canonical, machine keys) FIRST and falls back to the
   * legacy `amenities` label column. Reading only the legacy column would show
   * a vendor fewer facilities than they ticked — measured on production, 3
   * labels against 5 keys on the same row. See lib/amenities.ts.
   */
  const amenityList = resolveAmenityLabels(vendor.raw, vendor.amenities)

  const isVenue = vt.slug === "wedding-venues";
  const venuePhotos = (vendor.images && vendor.images.length > 0)
    ? vendor.images
    : (vendor.imageUrl ? [vendor.imageUrl] : []);

  const ldSchema = isVenue
    ? venueLD({
        id: vendor.id,
        name: vendor.name,
        slug: `${vendor.nameSlug}-${vendor.id}`,
        vendorType: vt.singular,
        vendorTypeSlug: vt.slug,
        description: vendor.description ?? "",
        imageUrl: vendor.imageUrl ?? "",
        citySlug: city.slug,
        cityName: city.name,
        regionName: city.region,
        addressLine: vendor.raw?.address,
        postalCode: vendor.raw?.postalCode,
        latitude: vendor.raw?.latitude ? Number(vendor.raw.latitude) : undefined,
        longitude: vendor.raw?.longitude ? Number(vendor.raw.longitude) : undefined,
        capacity: vendor.raw?.maxCapacity
          ? { min: vendor.raw?.minCapacity, max: vendor.raw?.maxCapacity }
          : undefined,
        phone: vendor.phone || vendor.raw?.contactPhone,
        email: vendor.email || vendor.raw?.contactEmail,
        websiteUrl: vendor.websiteUrl || vendor.raw?.website,
        priceRange: priceDisplay.metaPrice !== "Price on request"
          ? priceDisplay.metaPrice
          : undefined,
        amenities: amenityList,
        photos: venuePhotos,
        rating:
          vendor.rating > 0 && vendor.reviewCount > 0
            ? { value: vendor.rating, count: vendor.reviewCount }
            : undefined,
      })
    : vendorLD({
        id: vendor.id,
        name: vendor.name,
        slug: `${vendor.nameSlug}-${vendor.id}`,
        vendorType: vt.singular,
        vendorTypeSlug: vt.slug,
        description: vendor.description ?? "",
        imageUrl: vendor.imageUrl ?? "",
        citySlug: city.slug,
        cityName: city.name,
        regionName: city.region,
        addressLine: vendor.raw?.address,
        postalCode: vendor.raw?.postalCode,
        latitude: vendor.raw?.latitude ? Number(vendor.raw.latitude) : undefined,
        longitude: vendor.raw?.longitude ? Number(vendor.raw.longitude) : undefined,
        phone: vendor.phone || vendor.raw?.contactPhone,
        email: vendor.email || vendor.raw?.contactEmail,
        websiteUrl: vendor.websiteUrl || vendor.raw?.website,
        priceRange: priceDisplay.metaPrice !== "Price on request"
          ? priceDisplay.metaPrice
          : undefined,
        amenities: amenityList,
        photos: venuePhotos,
        rating:
          vendor.rating > 0 && vendor.reviewCount > 0
            ? { value: vendor.rating, count: vendor.reviewCount }
            : undefined,
      });

  const reviewLds = vendor.reviews.slice(0, 5).map((r: any) =>
    reviewLD({
      authorName: r?.author?.fullName ?? r?.authorName ?? "Verified Customer",
      rating: Number(r?.rating ?? 5),
      reviewBody: r?.comment ?? r?.review ?? "",
      datePublished: r?.createdAt ?? r?.datePublished ?? new Date().toISOString(),
      itemReviewedName: vendor.name,
      itemReviewedType: isVenue ? "EventVenue" : "LocalBusiness",
      itemReviewedUrl: `${SITE_URL}/${vt.slug}/${city.slug}/${vendor.nameSlug}-${vendor.id}`,
      itemReviewedImage: vendor.imageUrl,
    }),
  );

  const priceStr = (priceDisplay.metaPrice && priceDisplay.metaPrice !== "Price on request")
    ? priceDisplay.metaPrice
    : "2026 packages & per-head rates";


  // WP29: the policy as the refund engine will apply it (server summary), not only the registration label
  const cancelShown = cancellationDisplay(vendor)
  const venueFaqs = isVenue
    ? [
        {
          question: `What is the 2026 per-head price at ${vendor.name}?`,
          answer: `Per-head rates at ${vendor.name} in ${city.name} start from ${priceStr}. Packages include banquet hall seating, stage decor, ambient lighting, and one-dish or multi-course dinner menus.`,
        },
        {
          question: `What is the guest capacity of ${vendor.name}?`,
          answer: `${vendor.name} can accommodate up to ${vendor.raw?.maxCapacity || "500+"} guests, suitable for intimate Nikkah ceremonies as well as grand Barat and Walima receptions.`,
        },
      ]
    : [
        {
          question: `What are the 2026 packages and rates for ${vendor.name}?`,
          answer: `Packages for ${vendor.name} in ${city.name} start from ${priceStr}. View full service breakdown, photo portfolio, and real couple reviews on ${SITE_NAME}.`,
        },
      ];

  const faqs = [
    ...venueFaqs,
    {
      question: `How do I book ${vendor.name} through Wedding Wala?`,
      answer: `You can check live dates, request a direct quote, or message ${vendor.name} on WhatsApp directly through Wedding Wala with verified price transparency.`,
    },
    {
      question: `Where is ${vendor.name} located?`,
      answer: `${vendor.name} is located in ${city.name}, ${city.region}, Pakistan. Verified location, directions, and hall photos are available on ${SITE_NAME}.`,
    },
  ]

  // Per-type guidance + FAQ (true, keyword-rich) — rendered on the page AND
  // merged into the FAQPage schema. The SERP is feature-sparse in PK wedding
  // search, so structured FAQ + citable content is a cheap, early win.
  const guidance = getVendorGuidance(getBackendVendorType(vt.slug) ?? "")
  const fillCity = (s: string) => s.replace(/\{city\}/g, city.name)
  const allFaqs = guidance
    ? [
        ...faqs,
        ...guidance.faqs.map((f) => ({ question: fillCity(f.q), answer: fillCity(f.a) })),
      ]
    : faqs

  const ld = combineGraph(ldSchema, ...reviewLds, faqLD(allFaqs))

  // Decide server-side (ISR-cached 1h) whether to surface the space selector, and
  // only make the call at all when the feature is on — zero per-visitor cost.
  const hasMultiSpace = await fetchVendorHasMultiSpace(Number(vendor.id))
  // PLANS-SPEC contract 6: set while the venue's plan is paused. Null for every venue that is taking enquiries.
  const availabilityNotice = readAvailabilityNotice(vendor.raw)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(ld) }}
      />

      <div className="container-responsive py-8 sm:py-12">
        <Breadcrumbs
          items={[
            { name: vt.plural, href: `/${vt.slug}` },
            { name: city.name, href: `/${vt.slug}/${city.slug}` },
            {
              name: vendor.name,
              href: `/${vt.slug}/${city.slug}/${vendor.nameSlug}-${vendor.id}`,
            },
          ]}
          className="mb-6"
        />

        {/* Hero */}
        <header className="mb-10 grid lg:grid-cols-2 gap-8">
          <div className="aspect-[4/3] relative rounded-md overflow-hidden bg-bridal-cream">
            {vendor.imageUrl ? (
              <Image
                src={vendor.imageUrl}
                alt={vendor.name}
                fill
                priority
                fetchPriority="high"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              /* A vendor who has not uploaded photos yet used to get a beige
                 rectangle with the words "No image" in it — the single most
                 prominent element on their page, telling every visitor that
                 something is missing. A category-appropriate editorial photo
                 fills the space instead, clearly captioned as illustrative so
                 nobody mistakes it for the venue's own work. The vendor is
                 separately nudged to upload real ones by the completion card
                 on their dashboard. */
              <>
                <Image
                  src={fallbackImage.src}
                  alt={fallbackImage.alt}
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bridal-charcoal/70 to-transparent p-3">
                  <p className="font-bridal text-[11px] text-white/90">
                    Photos coming soon — ask {vendor.name} to share theirs
                  </p>
                </div>
              </>
            )}
          </div>

          <div>
            <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold-dark mb-3">
              {vt.singular} · {city.name}
            </p>
            <h1 className="font-display italic text-[36px] sm:text-[44px] leading-tight text-bridal-charcoal">
              {vendor.name}
            </h1>

            {vendor.rating > 0 && (
              <p className="mt-3 font-bridal text-[14px] text-bridal-charcoal">
                ★ {vendor.rating.toFixed(1)}{" "}
                <span className="text-bridal-text-soft">
                  ({vendor.reviewCount} {vendor.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </p>
            )}

            {/* WW-PRICE0 — say "Price on request" rather than nothing. This page
                serves the canonical vendor URL, so it is what a customer arriving
                from Google sees. `priceRange` is (correctly) omitted from the
                JSON-LD in the same case, so we never claim a price we don't have. */}
            {/* SEO Master Plan Part 2.2 — Single source of truth price display */}
            <div className="mt-2.5">
              <p className="font-bridal text-[16px] sm:text-[18px] text-bridal-charcoal font-semibold">
                {priceDisplay.headline}
              </p>
              {priceDisplay.subtext && (
                <p className="font-bridal text-[12.5px] text-bridal-text-soft mt-0.5">
                  {priceDisplay.subtext}
                </p>
              )}
              {priceDisplay.confirmationNote && (
                <p className="font-bridal text-[11px] text-bridal-gold-dark mt-1 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-bridal-gold" />
                  <span>{priceDisplay.confirmationNote}</span>
                </p>
              )}
            </div>

            {/*
              WW-TEST-CASES 2.23 — the six answers that decide whether this
              venue is even a candidate: how the price is counted, how many
              people fit, the date, whether food is included, the deposit, and
              when the music has to stop.

              The hero answered two of them. Everything else lived further down
              the page, inside a package card, or nowhere — so a couple learned
              that "From Rs 450,000" was the HALL ONLY after they had already
              been misled by the headline.

              Placed ABOVE the description on purpose: prose is what you read
              once you are interested, and these are what decide whether you get
              that far.
            */}
            <VenueAnswers raw={vendor.raw} />

            {(() => {
              const hasCleanDesc = vendor.description && !/public records|unclaimed/i.test(vendor.description);
              const displayDesc = hasCleanDesc
                ? vendor.description
                : `${vendor.name} is a premier ${vt.singular.toLowerCase()} in ${city.name}, offering exceptional event spaces and verified wedding packages for Barat, Walima, Mehndi, and intimate family celebrations. Managed with dedicated on-site support, reliable generator backup, and transparent booking management on Wedding Wala.`;
              return (
                <p className="mt-5 font-bridal text-[14.5px] text-bridal-text leading-relaxed">
                  {displayDesc}
                </p>
              );
            })()}

            {/* Interactive Planning Tool Bridge for Vendor Intent */}
            <div className="mt-5 rounded-2xl border border-bridal-gold/30 bg-bridal-cream/50 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-lg shadow-sm">
                  {isVenue ? "🏛️" : vt.slug === "caterers" ? "🍲" : vt.slug === "nikah-khwan" ? "📜" : "💍"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bridal text-[11px] font-semibold uppercase tracking-wider text-bridal-gold-dark">
                    {isVenue
                      ? "Marquee Hidden Charges & AC Cost"
                      : vt.slug === "caterers"
                      ? "Degh & Catering Portion Calculator"
                      : vt.slug === "nikah-khwan"
                      ? "Nikkah Nama & Legal Clauses"
                      : "Free Pakistani Wedding Planning Tools"}
                  </p>
                  <p className="mt-0.5 font-bridal text-[13px] leading-relaxed text-bridal-text">
                    {isVenue ? (
                      <>
                        Calculate generator diesel fuel, AC surcharge &amp; PRA/SRB tax estimates for {vendor.name} with our{" "}
                        <Link
                          href="/planning-tools/marquee-hidden-cost-calculator-pakistan"
                          className="font-semibold text-bridal-gold-dark underline hover:text-bridal-charcoal"
                        >
                          Marquee Cost Calculator
                        </Link>
                        .
                      </>
                    ) : vt.slug === "caterers" ? (
                      <>
                        Calculate exact 12kg deghs of Biryani &amp; Qorma for your guest count with our{" "}
                        <Link
                          href="/planning-tools/degh-catering-calculator-pakistan"
                          className="font-semibold text-bridal-gold-dark underline hover:text-bridal-charcoal"
                        >
                          Degh Catering Calculator
                        </Link>
                        .
                      </>
                    ) : vt.slug === "nikah-khwan" ? (
                      <>
                        Review Column 18 right of divorce &amp; NADRA MRC registration requirements with our{" "}
                        <Link
                          href="/planning-tools/nikkah-nama-clauses-nadra-checklist-pakistan"
                          className="font-semibold text-bridal-gold-dark underline hover:text-bridal-charcoal"
                        >
                          Nikkah Nama Checklist
                        </Link>
                        .
                      </>
                    ) : (
                      <>
                        Plan your entire shaadi budget in PKR and track vendor allocations with our{" "}
                        <Link
                          href="/planning-tools/budget"
                          className="font-semibold text-bridal-gold-dark underline hover:text-bridal-charcoal"
                        >
                          Wedding Budget Calculator
                        </Link>
                        .
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* A venue whose plan is paused (PLANS-SPEC contract 6): the page stays up (200) with a calm notice, the enquiry /
                booking / quote doors are shown disabled, and an existing booking is not affected. */}
            {availabilityNotice && <VenueUnavailableNotice text={availabilityNotice.text} className="mt-6" />}
            <div className="mt-6 flex flex-wrap gap-3">
              {availabilityNotice ? (
                <>
                  <UnavailableButton label={priceDisplay.primaryAmount ? "Check availability" : "Ask for a price"} />
                  <UnavailableButton label="Ask a question" />
                  <UnavailableButton label="Request a quote" />
                </>
              ) : (
              <>
              {/* WW-PRICE0 — an unpriced vendor cannot be booked (the server
                  refuses it), so don't promise availability. The link still goes
                  to the booking funnel, which renders the price-on-request panel
                  with the inquiry — one funnel, one guard, no dead end. */}
              <Link
                href={`/${vendor.id}/booking`}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-bridal-gold text-white font-bridal text-[13px] font-medium hover:bg-bridal-gold-dark transition-colors"
              >
                {priceDisplay.primaryAmount ? "Check availability" : "Ask for a price"}
              </Link>
              {/* Anonymous inquiry — a first-time visitor from Google can ask a
                  question or ask for a price WITHOUT logging in, and the dialog
                  drops a form_inquiry Lead straight into the vendor's inbox.
                  This was flag-gated off, so every visitor arriving from search
                  was sent to a generic /contact page instead — a lead the vendor
                  never saw. POST /leads/inquiry verified live (201). */}
              <VendorInquiryCta businessId={vendor.id} vendorName={vendor.name} />
              {/* Request a quote + Add to plan existed only on the legacy
                  /{type}/{id} pages, never here — and THIS is the page Google
                  sends organic traffic to. Both backends are live
                  (/quotes/mine and /wedding-plans/mine each 401 against a 200
                  catch-all), and both surfaces were un-flagged earlier, so the
                  only thing missing was the door on the page that matters most.
                  Haggling is how this market actually buys; sending a search
                  visitor to a fixed price with no way to negotiate loses the
                  conversation before it starts. */}
              <SeoVendorSecondaryCtas
                businessId={vendor.id}
                vendorName={vendor.name}
                vendorType={vendor.vendorType}
              />
              <a
                href="tel:03274811220"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-800 text-white font-bridal text-[13px] font-semibold hover:bg-emerald-900 transition-colors shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Booking Desk (0327-4811220)</span>
              </a>
              <a
                href={`https://wa.me/923274811220?text=${encodeURIComponent(`Hi Wedding Wala, I am interested in booking ${vendor.name} in ${city.name}. Can you share pricing and date availability?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#25D366] text-white font-bridal text-[13px] font-semibold hover:bg-[#20bd5a] transition-colors shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Booking Desk</span>
              </a>
              </>
              )}
            </div>
          </div>
        </header>

        {/* Gallery */}
        {vendor.images.length > 1 && (
          <section className="mb-12">
            <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
              Gallery
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {vendor.images.slice(1, 9).map((src, i) => (
                <li key={i} className="aspect-square relative rounded-md overflow-hidden">
                  <Image
                    src={src}
                    alt={`${vendor.name} — gallery ${i + 1}`}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* WW-CLAIM — the door to a flow that was fully built and unreachable.
            Shown only on unclaimed imports, directly on the page a venue owner
            reaches by googling themselves. */}
        {vendor.claimable && (
          <ClaimListingCard businessId={Number(vendor.id)} businessName={vendor.name} />
        )}

        {/* WW-MEDIA — walkthrough clips.

            A venue is a space, and stills do not tell a couple what it feels
            like to walk into it. Vendors were already sending these over
            WhatsApp; this is where they belong. `preload="metadata"` so a
            gallery of clips costs a few KB until someone actually presses play,
            and no autoplay — a page that starts making noise on a phone in a
            quiet room is a page people close. */}
        {vendor.videos?.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
              Videos
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vendor.videos.slice(0, 6).map((src, i) => (
                <li key={i} className="overflow-hidden rounded-md bg-black">
                  <video
                    src={src}
                    controls
                    preload="metadata"
                    playsInline
                    className="aspect-video w-full object-cover"
                    aria-label={`${vendor.name} — video ${i + 1}`}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* WW-AMENITIES — what the vendor actually ticked in Setup.

            `lib/seo/fetch-vendor.ts` had already normalised `amenities` onto
            VendorDetail, and this page never referenced it. So a vendor could
            tick AC, bridal suite, valet, generator backup and covered parking
            in Business Settings, watch them save, and none of it ever reached
            the page a couple reads. The data was arriving; the render threw it
            away.

            Resolution goes through lib/amenities.ts because there are TWO
            columns and the obvious one is wrong: `amenitiesJson` is canonical
            (the editor writes it, the server whitelists it) while `amenities`
            is an older label column holding a subset — 3 labels against 5 keys
            on the same production row. Rendering the legacy column would have
            shown fewer facilities than the vendor ticked, which is the original
            complaint wearing a different hat.

            Renders nothing when the vendor has ticked nothing — an empty
            heading tells a couple less than no heading at all. */}
        {amenityList.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
              What&rsquo;s included
            </h2>
            <ul className="flex flex-wrap gap-2 max-w-3xl">
              {amenityList.map((a) => (
                <li
                  key={a}
                  className="inline-flex items-center rounded-full border border-bridal-beige bg-bridal-cream px-3.5 py-1.5 font-bridal text-[13px] text-bridal-text"
                >
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* WW-OFFERINGS — packages and menus as the pamphlet a venue hands over.
            The previous block printed a name and a bare number: no unit, so a
            per-head rate and a per-event rate looked identical, and no menus at
            all. See components/seo/vendor-offerings.tsx. */}
        <VendorOfferings packages={vendor.packages} menus={vendor.menus} city={vendor.city ?? null} businessId={Number(vendor.id) || null} />

        {/* Hierarchical spaces (Hall→Floor→Partition) — renders nothing until the
            venue enables NEXT_PUBLIC_VENUE_HIERARCHY_ON; legacy vendors unaffected. */}
        {hasMultiSpace && (
          <div className="mb-12">
            <VenueSpaceSelector businessId={Number(vendor.id)} hasMultiSpace />
          </div>
        )}

        {/* Reviews */}
        {vendor.reviews.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
              Reviews ({vendor.reviewCount})
            </h2>
            <ul className="space-y-5 max-w-3xl">
              {vendor.reviews.slice(0, 5).map((r: any, i: number) => (
                <li
                  key={r.id ?? i}
                  className="rounded-md border border-bridal-beige p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-display italic text-[15px] text-bridal-charcoal">
                      {r?.author?.fullName ?? r?.authorName ?? "Customer"}
                    </p>
                    <span className="font-bridal text-[12.5px] text-bridal-charcoal">
                      ★ {Number(r?.rating ?? 5).toFixed(1)}
                    </span>
                  </div>
                  {r?.comment && (
                    <p className="mt-2 font-bridal text-[14px] text-bridal-text leading-relaxed">
                      {r.comment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Category guidance — true, keyword-rich; helps rank + AI-cite */}
        {/* Prose left, checklist right.
            This was one `max-w-3xl` column, so on a desktop the whole right
            half of the section sat empty while the "What to ask" list ran on
            below the fold. The reading measure is still capped — long lines are
            genuinely harder to read — but the questions now sit beside the
            explanation as a card a family can actually work through, which is
            what that list is for. */}
        {guidance && (
          <section className="mb-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="max-w-2xl space-y-4">
              <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-4">
                Booking a {vt.singular.toLowerCase()} in {city.name}
              </h2>
              <p className="font-bridal text-[14.5px] text-bridal-text leading-relaxed">
                {fillCity(guidance.intro)}
              </p>

              {/* Essential Pakistani Shaadi Guidelines to eliminate empty whitespace */}
              <div className="mt-6 rounded-2xl border border-bridal-beige bg-bridal-cream/60 p-5 space-y-3">
                <p className="font-bridal text-[11px] uppercase tracking-[0.2em] font-semibold text-bridal-gold-dark">
                  Important Guidelines for {city.name} Weddings
                </p>
                <div className="grid gap-3 sm:grid-cols-2 pt-1">
                  <div className="rounded-xl border border-bridal-beige/80 bg-white/80 p-3.5">
                    <p className="font-bridal text-[12.5px] font-semibold text-bridal-charcoal">
                      🕒 Closing Curfew &amp; Timings
                    </p>
                    <p className="mt-1 font-bridal text-[12px] text-bridal-text-soft leading-normal">
                      Venues in {city.name} adhere strictly to official 10:00 PM closing laws. Schedule stage entries and dinner buffet early to ensure a relaxed celebration.
                    </p>
                  </div>
                  <div className="rounded-xl border border-bridal-beige/80 bg-white/80 p-3.5">
                    <p className="font-bridal text-[12.5px] font-semibold text-bridal-charcoal">
                      ⚡ Generator &amp; AC Backup
                    </p>
                    <p className="mt-1 font-bridal text-[12px] text-bridal-text-soft leading-normal">
                      Confirm diesel generator fuel arrangements (typically PKR 6,000–12,000/hr) and ensure seamless AC load capacity throughout the function.
                    </p>
                  </div>
                  <div className="rounded-xl border border-bridal-beige/80 bg-white/80 p-3.5">
                    <p className="font-bridal text-[12.5px] font-semibold text-bridal-charcoal">
                      🍲 One-Dish Rule Compliance
                    </p>
                    <p className="mt-1 font-bridal text-[12px] text-bridal-text-soft leading-normal">
                      Verify that your menu complies with provincial One-Dish standards (1 meat item + 1 sweet) to avoid municipal inspection penalties.
                    </p>
                  </div>
                  <div className="rounded-xl border border-bridal-beige/80 bg-white/80 p-3.5">
                    <p className="font-bridal text-[12.5px] font-semibold text-bridal-charcoal">
                      🛡️ Dedicated Booking Manager
                    </p>
                    <p className="mt-1 font-bridal text-[12px] text-bridal-text-soft leading-normal">
                      Need immediate help booking {vendor.name}? Call our concierge desk directly at <strong className="text-bridal-charcoal">0327-4811220</strong> for instant date checks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-bridal-beige bg-bridal-cream/40 p-5">
              <p className="font-bridal text-[11px] uppercase tracking-[0.22em] font-medium text-bridal-gold mb-3">
                What to ask {vendor.name}
              </p>
              <ul className="space-y-2.5">
                {guidance.ask.map((a, i) => (
                  <li
                    key={i}
                    className="font-bridal text-[14px] text-bridal-text leading-relaxed pl-4 border-l-2 border-bridal-gold/30"
                  >
                    {fillCity(a)}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
            Frequently asked questions
          </h2>
          {/* Two columns from lg. Same reason: a single narrow column left the
              right half of a wide screen empty and pushed the later questions
              a long way down. Each answer keeps its own readable measure. */}
          <dl className="grid gap-x-10 gap-y-5 lg:grid-cols-2">
            {allFaqs.map((f) => (
              <div key={f.question} className="max-w-2xl">
                <dt className="font-bridal text-[15px] font-semibold text-bridal-charcoal">
                  {f.question}
                </dt>
                <dd className="mt-2 font-bridal text-[14px] text-bridal-text leading-relaxed">
                  {f.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* In-depth guide bridge (keyword + helpfulness) */}
        {guidePillar && (
          <section className="mb-10">
            <p className="font-bridal text-[14px] text-bridal-text">
              Planning ahead?{" "}
              <Link
                href={guidePillar.href}
                className="text-bridal-gold font-semibold hover:underline"
              >
                {guidePillar.label} →
              </Link>
            </p>
          </section>
        )}

        {/* Related vendors — the internal-link flywheel */}
        {related.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
              More {vt.plural.toLowerCase()} in {city.name}
            </h2>
            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((v) => (
                <li key={v.id}>
                  <Link
                    href={v.href ?? "#"}
                    className="group block rounded-md border border-bridal-beige overflow-hidden hover:border-bridal-gold transition-all"
                  >
                    <div className="aspect-[4/3] bg-bridal-cream relative overflow-hidden">
                      {v.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.imageUrl}
                          alt={v.name}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : null}
                    </div>
                    <div className="p-3">
                      <p className="font-display italic text-[15px] text-bridal-charcoal group-hover:text-bridal-gold transition-colors line-clamp-1">
                        {v.name}
                      </p>
                      {v.rating > 0 && (
                        <p className="mt-1 font-bridal text-[12px] text-bridal-text-soft">
                          ★ {v.rating.toFixed(1)} ({v.reviewCount})
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Other vendor types in this city */}
        <section className="mb-12">
          <h2 className="font-display italic text-[20px] text-bridal-charcoal mb-3">
            Other wedding vendors in {city.name}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {otherTypes.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/${t.slug}/${city.slug}`}
                  className="inline-block px-3 py-1.5 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[13px] text-bridal-text-soft hover:text-bridal-charcoal transition-all"
                >
                  {t.plural}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Back to category + city */}
        <section className="mb-4">
          <Link
            href={`/${vt.slug}/${city.slug}`}
            className="font-bridal text-[14px] text-bridal-gold hover:underline"
          >
            ← Browse more {vt.plural.toLowerCase()} in {city.name}
          </Link>
        </section>

        {/*
          WW-TEST-CASES 2.24 — the sticky quote bar.

          The page showed "From PKR 450,000". A Pakistani wedding is priced per
          head ON TOP of that, so the headline is not a price — it is the start
          of an arithmetic problem the couple has to finish themselves, having
          scrolled past the packages, the menus and the minimum guarantee to
          find the three numbers they need.

          Last in the DOM but sticky, so it sits over the page from the moment
          they scroll and is still there when the photographs or the menus make
          them wonder again.
        */}
        {!availabilityNotice && (
          <StickyQuoteBar
            raw={vendor.raw}
            vendorId={vendor.id}
            ctaLabel={priceDisplay.primaryAmount ? "Check availability" : "Ask for a price"}
          />
        )}
      </div>
    </>
  )
}
