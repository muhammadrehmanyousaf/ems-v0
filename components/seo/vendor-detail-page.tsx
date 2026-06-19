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

import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { notFound, redirect, permanentRedirect } from "next/navigation"
import {
  CITIES,
  VENDOR_TYPES,
  SITE_NAME,
  SITE_URL,
  getCity,
  getVendorType,
  getBackendVendorType,
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

  // Canonicalization — if the user typed a stale slug, 301 to the
  // canonical URL. Compare against the slugified DB name.
  if (parsed.slug !== vendor.nameSlug) {
    permanentRedirect(buildVendorCanonicalPath(vt.slug, city.slug, vendor))
  }

  // Type / city sanity — refuse to serve a vendor under a URL that doesn't
  // match its actual category or city. Could 301, but 404 is safer for SEO
  // (avoid duplicate-content footguns).
  const expectedBackendType = getBackendVendorType(vt.slug)
  if (expectedBackendType && vendor.vendorType && vendor.vendorType !== expectedBackendType) {
    notFound()
  }
  if (vendor.city && city.name && vendor.city.toLowerCase() !== city.name.toLowerCase()) {
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
      answer: `${vendor.name} is based in ${city.name}, ${city.region}. They list on ${SITE_NAME} as a verified ${vt.singular.toLowerCase()}.`,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
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
              <div className="absolute inset-0 flex items-center justify-center font-bridal text-[14px] text-bridal-text-soft">
                No image
              </div>
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

            {vendor.priceMin && (
              <p className="mt-2 font-bridal text-[14px] text-bridal-charcoal">
                <strong>From PKR {vendor.priceMin.toLocaleString("en-PK")}</strong>
              </p>
            )}

            {vendor.description && (
              <p className="mt-4 font-bridal text-[14.5px] text-bridal-text leading-relaxed line-clamp-5">
                {vendor.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/${vendor.id}/booking`}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-bridal-gold text-white font-bridal text-[13px] font-medium hover:bg-bridal-gold-dark transition-colors"
              >
                Check availability
              </Link>
              <Link
                href={`/contact?vendor=${encodeURIComponent(vendor.name)}`}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[13px] text-bridal-charcoal transition-colors"
              >
                Ask a question
              </Link>
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
        {guidance && (
          <section className="mb-12 max-w-3xl">
            <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-4">
              Booking a {vt.singular.toLowerCase()} in {city.name}
            </h2>
            <p className="font-bridal text-[14.5px] text-bridal-text leading-relaxed mb-4">
              {fillCity(guidance.intro)}
            </p>
            <p className="font-bridal text-[11px] uppercase tracking-[0.22em] font-medium text-bridal-gold mb-2.5">
              What to ask
            </p>
            <ul className="space-y-2.5">
              {guidance.ask.map((a, i) => (
                <li
                  key={i}
                  className="font-bridal text-[14px] text-bridal-text leading-relaxed pl-4 border-l-2 border-bridal-beige"
                >
                  {fillCity(a)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
            Frequently asked questions
          </h2>
          <dl className="space-y-5 max-w-3xl">
            {allFaqs.map((f) => (
              <div key={f.question}>
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
