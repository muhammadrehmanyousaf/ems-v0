/**
 * Premium vendor card for the {vendor-type}/{city} money pages (blueprint B4).
 * Server component, presentational, no hooks.
 *
 * Key fix vs. the old card: NEVER renders an empty "No image" box. When a
 * vendor has no photo, it shows an elegant branded fallback (warm gradient +
 * Mughal-jaal texture + the vendor's monogram + category) so the grid always
 * looks intentional and premium. Real photos take over as vendors upload them.
 */

import Link from "next/link"
import type { VendorListItem } from "@/lib/seo/fetch-vendors"

const STOPWORDS = new Set(["the", "and", "of", "&", "co", "company"])

function initials(name: string): string {
  const words = name
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, ""))
    .filter((w) => w.length > 0 && !STOPWORDS.has(w.toLowerCase()))
  const picked = words.slice(0, 2).map((w) => w[0]!.toUpperCase())
  return picked.join("") || name.slice(0, 1).toUpperCase() || "W"
}

export function PremiumVendorCard({
  vendor,
  categoryLabel,
}: {
  vendor: VendorListItem
  categoryLabel: string
}) {
  const hasImage = Boolean(vendor.imageUrl)

  return (
    <Link
      href={vendor.href ?? "#"}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-bridal-beige bg-bridal-cream shadow-[0_1px_2px_rgba(176,125,84,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-bridal-gold/60 hover:shadow-[0_20px_44px_-22px_rgba(176,125,84,0.5)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vendor.imageUrl}
            alt={`${vendor.name} — ${categoryLabel}`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.07]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-bridal-sand via-bridal-blush to-bridal-cream">
            <div className="absolute inset-0 bg-mughal-jaal opacity-50" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span className="grid h-[68px] w-[68px] place-items-center rounded-full border border-bridal-gold/40 bg-bridal-ivory/80 font-display text-[25px] italic text-bridal-gold-dark shadow-sm">
                {initials(vendor.name)}
              </span>
              <span className="font-bridal text-[10px] uppercase tracking-[0.24em] text-bridal-text-label/85">
                {categoryLabel}
              </span>
            </div>
          </div>
        )}

        {/* Verified badge — platform identity-verification signal (B0/E-E-A-T) */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-bridal-ivory/90 px-2.5 py-1 font-bridal text-[10.5px] font-medium text-bridal-text shadow-sm backdrop-blur">
          <span className="text-bridal-gold-dark">✓</span> Verified
        </span>

        {vendor.rating > 0 && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-bridal-charcoal/85 px-2.5 py-1 font-bridal text-[11px] font-semibold text-bridal-ivory shadow-sm">
            <span className="text-bridal-rose">★</span> {vendor.rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="font-display text-[19px] italic leading-snug text-bridal-charcoal transition-colors group-hover:text-bridal-gold-dark line-clamp-1">
          {vendor.name}
        </p>
        <p className="mt-1 flex items-center gap-1.5 font-bridal text-[12px] text-bridal-text-soft">
          <span className="line-clamp-1">{vendor.areaServed || vendor.city}</span>
          {vendor.reviewCount > 0 && (
            <>
              <span className="text-bridal-beige">•</span>
              <span className="whitespace-nowrap">{vendor.reviewCount} reviews</span>
            </>
          )}
        </p>

        {vendor.specialties && vendor.specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {vendor.specialties.slice(0, 3).map((s) => (
              <span
                key={s}
                className="rounded-full bg-bridal-blush/60 px-2 py-0.5 font-bridal text-[10.5px] text-bridal-text-soft"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            {vendor.priceMin ? (
              <>
                <span className="block font-bridal text-[10px] uppercase tracking-wider text-bridal-text-label">
                  From
                </span>
                <span className="font-bridal text-[15px] font-semibold text-bridal-charcoal">
                  PKR {vendor.priceMin.toLocaleString("en-PK")}
                </span>
              </>
            ) : (
              <span className="font-bridal text-[12.5px] text-bridal-text-soft">
                Request a quote
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 font-bridal text-[12.5px] font-medium text-bridal-gold-dark">
            View
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
