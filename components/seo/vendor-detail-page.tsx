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
import Link from "next/link"
import type { Metadata } from "next"
import { notFound, redirect, permanentRedirect } from "next/navigation"
import { VenueSpaceSelector } from "@/components/booking/venue-space-selector"
import { fetchVendorHasMultiSpace } from "@/lib/seo/fetch-vendor"
import VendorInquiryCta from "@/components/seo/vendor-inquiry-cta"
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
  if (!vt || !city) return { title: "Not Found" }

  const { id } = parseVendorSlugAndId(input.vendorSlug)
  if (!id) return { title: "Not Found" }

  const vendor = await fetchVendorById(id)
  if (!vendor) return { title: "Not Found" }

  const title = `${vendor.name} — ${vt.singular} in ${city.name}`
  const description = vendor.description
    ? vendor.description.slice(0, 155)
    : `${vendor.name} — ${vt.singular.toLowerCase()} in ${city.name}, Pakistan. Book on ${SITE_NAME}.`

  return buildPageMetadata({
    title,
    description,
    path: `/${vt.slug}/${city.slug}/${vendor.nameSlug}-${vendor.id}`,
    imageUrl: vendor.imageUrl,
    ogType: "profile",
  })
}

export async function VendorDetailPage(input: PageInput) {
  const vt = getVendorType(input.typeSlug)
  const city = getCity(input.citySlug)
  if (!vt || !city) notFound()

  const parsed = parseVendorSlugAndId(input.vendorSlug)
  if (!parsed.id) notFound()

  const vendor = await fetchVendorById(parsed.id)
  if (!vendor) notFound()

  // Editorial stand-in for a vendor with no photos of their own. Category-
  // matched, never presented as theirs — see the caption on the image itself.
  const imagery = getLocationImagery(vt.slug)
  const fallbackImage = {
    src: imagery.hero ?? "/images/home/cities/lahore.jpg",
    alt: imagery.heroAlt ?? `${vt.singular} in ${city.name}`,
  }

  // Canonicalization — if the user typed a stale slug, 301 to the
  // canonical URL. Compare against the slugified DB name.
  if (parsed.slug !== vendor.nameSlug) {
    permanentRedirect(buildVendorCanonicalPath(vt.slug, city.slug, vendor))
  }

  // Type / city sanity — refuse to serve a vendor under a URL that doesn't
  // match its actual category or city. Could 301, but 404 is safer for SEO
  // (avoid duplicate-content footguns).
  const expectedBackendType = getBackendVendorType(vt.slug)
  // Alias-aware: a vendor belongs on this type page when its backend type
  // resolves (directly or via a fold alias, e.g. Marquee->wedding-venues) to
  // this SEO slug. Using backendToSeoSlug keeps folds from 404-ing here.
  if (vendor.vendorType && backendToSeoSlug(vendor.vendorType) !== vt.slug) {
    notFound()
  }
  // The "pakistan" national catch-all accepts vendors whose real city is
  // unknown/unparseable in the source data, so skip the city-match guard there.
  if (
    city.slug !== "pakistan" &&
    vendor.city &&
    city.name &&
    vendor.city.toLowerCase() !== city.name.toLowerCase()
  ) {
    notFound()
  }

  // Related vendors (same type + city) — internal-link flywheel + crawl depth.
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
  const isVenue = vt.slug === "wedding-venues"
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
        rating:
          vendor.rating > 0
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
        phone: vendor.phone,
        email: vendor.email,
        websiteUrl: vendor.websiteUrl,
        priceRange: vendor.priceMin
          ? `PKR ${vendor.priceMin.toLocaleString("en-PK")}+`
          : undefined,
        rating:
          vendor.rating > 0
            ? { value: vendor.rating, count: vendor.reviewCount }
            : undefined,
      })

  const reviewLds = vendor.reviews.slice(0, 5).map((r: any) =>
    reviewLD({
      authorName: r?.author?.fullName ?? r?.authorName ?? "Customer",
      rating: Number(r?.rating ?? 5),
      reviewBody: r?.comment ?? r?.review ?? "",
      datePublished: r?.createdAt ?? r?.datePublished ?? new Date().toISOString(),
      itemReviewedName: vendor.name,
    }),
  )

  const faqs = [
    {
      question: `How do I book ${vendor.name}?`,
      answer: `Click "Check availability" below to start the booking. ${SITE_NAME} holds your deposit until ${vendor.name} confirms — full refund if they decline.`,
    },
    {
      question: `What's ${vendor.name}'s cancellation policy?`,
      answer:
        vendor.cancellationPolicy
          ? `${vendor.cancellationPolicy}. Full details on our Cancellation Policy page.`
          : `See ${SITE_NAME}'s default Cancellation Policy. Tier (Flexible / Moderate / Strict) is shown at checkout.`,
    },
    {
      question: `Where is ${vendor.name} based?`,
      answer: `${vendor.name} is based in ${city.name}, ${city.region}, and is listed on ${SITE_NAME} as a ${vt.singular.toLowerCase()}.`,
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
            <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
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
            <p className="mt-2 font-bridal text-[14px] text-bridal-charcoal">
              {vendor.priceMin ? (
                <strong>From PKR {vendor.priceMin.toLocaleString("en-PK")}</strong>
              ) : (
                <span className="text-bridal-text">Price on request</span>
              )}
            </p>

            {vendor.description && (
              <p className="mt-4 font-bridal text-[14.5px] text-bridal-text leading-relaxed line-clamp-5">
                {vendor.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {/* WW-PRICE0 — an unpriced vendor cannot be booked (the server
                  refuses it), so don't promise availability. The link still goes
                  to the booking funnel, which renders the price-on-request panel
                  with the inquiry — one funnel, one guard, no dead end. */}
              <Link
                href={`/${vendor.id}/booking`}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-bridal-gold text-white font-bridal text-[13px] font-medium hover:bg-bridal-gold-dark transition-colors"
              >
                {vendor.priceMin ? "Check availability" : "Ask for a price"}
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

        {/* Packages */}
        {vendor.packages.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
              Packages
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
              {vendor.packages.map((p: any) => (
                <li
                  key={p.id ?? p.name}
                  className="rounded-md border border-bridal-beige p-5"
                >
                  <p className="font-display italic text-[18px] text-bridal-charcoal">
                    {p.name}
                  </p>
                  {Number(p.price) > 0 && (
                    <p className="mt-1 font-bridal text-[14px] text-bridal-charcoal">
                      <strong>PKR {Number(p.price).toLocaleString("en-PK")}</strong>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

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
            <div className="max-w-2xl">
              <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-4">
                Booking a {vt.singular.toLowerCase()} in {city.name}
              </h2>
              <p className="font-bridal text-[14.5px] text-bridal-text leading-relaxed">
                {fillCity(guidance.intro)}
              </p>
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
      </div>
    </>
  )
}
