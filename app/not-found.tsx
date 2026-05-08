import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { Home, Search, MessageCircle } from "lucide-react"
import { CITIES, VENDOR_TYPES, SITE_NAME } from "@/lib/seo"
import { fetchCityVendors } from "@/lib/seo/fetch-vendors"

export const metadata: Metadata = {
  title: `Page not found | ${SITE_NAME}`,
  description: "The page you were looking for couldn't be found. Browse vendors and venues across Pakistan, or contact our team.",
  robots: { index: false, follow: true },
}

// Top vendor types and cities for the "Where to next?" affordance.
// Reference: docs/seo/00-master-seo-playbook.md §6 item 268 + §26 item 721.
const TOP_VENDOR_TYPES = VENDOR_TYPES.slice(0, 6)
const TOP_CITIES = CITIES.slice(0, 6)

/**
 * Fetch up to 6 most-recently-active vendors for the "Popular right now"
 * row. Wrapped in a short timeout — we never let a slow backend block the
 * 404 from rendering. Empty array = the section silently doesn't render.
 */
async function fetchPopularVendors() {
  try {
    return await Promise.race([
      fetchCityVendors({ city: undefined, vendorType: "Wedding venue", limit: 6 }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("404-popular-vendors-timeout")), 1500),
      ),
    ])
  } catch {
    return []
  }
}

export default async function NotFound() {
  const popularVendors = await fetchPopularVendors()
  return (
    <div className="min-h-screen bg-gradient-to-br from-bridal-cream via-white to-bridal-cream/30 px-4 py-16">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            404
          </p>
          <h1 className="font-display italic text-[40px] sm:text-[52px] leading-tight text-bridal-charcoal mb-4">
            Page not found
          </h1>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed max-w-xl mx-auto">
            The page you were looking for doesn&apos;t exist or has moved.
            Let&apos;s get you somewhere useful.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-12">
          <form action="/search" method="get" className="relative" role="search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-bridal-gold pointer-events-none" />
            <input
              type="search"
              name="q"
              placeholder="Search wedding venues, photographers, planners…"
              autoComplete="off"
              autoFocus
              className="
                w-full h-12 pl-11 pr-4 rounded-md
                bg-white border border-bridal-beige
                font-bridal text-[14.5px] text-bridal-charcoal
                placeholder:text-bridal-text-soft
                focus:outline-none focus:ring-2 focus:ring-bridal-gold/25 focus:border-bridal-gold
                transition-all
              "
              aria-label="Search Wedding Wala"
            />
          </form>
        </div>

        {/* Popular vendors (live from backend, falls back silently) */}
        {popularVendors.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display italic text-[22px] text-bridal-charcoal mb-4">
              Popular right now
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {popularVendors.slice(0, 6).map((v) => (
                <li key={v.id}>
                  <Link
                    href={v.href ?? "#"}
                    className="group block rounded-md border border-bridal-beige overflow-hidden hover:border-bridal-gold transition-colors"
                  >
                    <div className="relative aspect-square bg-bridal-cream">
                      {v.imageUrl ? (
                        <Image
                          src={v.imageUrl}
                          alt={v.name}
                          fill
                          sizes="(min-width: 1024px) 16vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : null}
                    </div>
                    <p className="px-2 py-2 font-bridal text-[12px] text-bridal-charcoal group-hover:text-bridal-gold transition-colors line-clamp-1">
                      {v.name}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Quick links */}
        <div className="grid sm:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="font-display italic text-[22px] text-bridal-charcoal mb-4">
              Browse vendors
            </h2>
            <ul className="space-y-1.5">
              {TOP_VENDOR_TYPES.map((vt) => (
                <li key={vt.slug}>
                  <Link
                    href={`/${vt.slug}`}
                    className="font-bridal text-[14px] text-bridal-text hover:text-bridal-gold transition-colors"
                  >
                    {vt.plural}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display italic text-[22px] text-bridal-charcoal mb-4">
              Browse by city
            </h2>
            <ul className="space-y-1.5">
              {TOP_CITIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/cities/${c.slug}`}
                    className="font-bridal text-[14px] text-bridal-text hover:text-bridal-gold transition-colors"
                  >
                    Wedding services in {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 h-11 rounded-full bg-bridal-gold text-white font-bridal text-[13px] font-medium hover:bg-bridal-gold-dark transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to home
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-5 h-11 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[13px] text-bridal-charcoal transition-colors"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact us
          </Link>
        </div>

        <p className="mt-10 text-center font-bridal text-[12.5px] text-bridal-text-soft">
          Found a broken link?{" "}
          <Link href="/contact" className="text-bridal-gold hover:underline">
            Let us know
          </Link>{" "}
          — we&apos;ll fix it.
        </p>
      </div>
    </div>
  )
}
