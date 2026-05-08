import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import {
  buildPageMetadata,
  SITE_NAME,
  collectionPageLD,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { getAllRealWeddings } from "@/lib/real-weddings/recaps"

export const metadata: Metadata = buildPageMetadata({
  title: "Real Pakistani weddings",
  description: `Real wedding stories from couples across Pakistan — mehndi, baraat, walima, and the vendors who made each day. Editorial recaps with full vendor credits on ${SITE_NAME}.`,
  path: "/real-weddings",
})

export default function RealWeddingsIndexPage() {
  const recaps = getAllRealWeddings()

  const ld = collectionPageLD({
    name: `Real Pakistani weddings — ${SITE_NAME}`,
    description: "Editorial recaps of real Pakistani weddings with full vendor credits.",
    url: "/real-weddings",
    items: recaps.map((r) => ({
      name: r.title,
      url: `/real-weddings/${r.slug}`,
      imageUrl: r.coverImage,
    })),
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="container-responsive py-10 sm:py-14">
        <Breadcrumbs
          items={[{ name: "Real weddings", href: "/real-weddings" }]}
          className="mb-6"
        />

        <header className="mb-10 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            Real weddings
          </p>
          <h1 className="font-display italic text-[38px] sm:text-[48px] leading-tight text-bridal-charcoal">
            Pakistani weddings, told well
          </h1>
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            Editorial recaps of real Pakistani weddings — mehndi, baraat,
            walima — with full vendor credits. Each story is shared with the
            couple&apos;s permission.
          </p>
        </header>

        {recaps.length === 0 ? (
          <p className="font-bridal text-[14px] text-bridal-text-soft">
            First recaps publishing soon. Couples — if you&apos;d like your
            wedding featured, email{" "}
            <a href="mailto:info@weddingwala.pk" className="text-bridal-gold hover:underline">
              info@weddingwala.pk
            </a>
            .
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recaps.map((recap) => (
              <li key={recap.slug}>
                <Link
                  href={`/real-weddings/${recap.slug}`}
                  className="group block rounded-md border border-bridal-beige overflow-hidden hover:border-bridal-gold hover:shadow-md transition-all"
                >
                  <div className="relative aspect-[4/3] bg-bridal-cream">
                    <Image
                      src={recap.coverImage}
                      alt={recap.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <p className="font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-gold mb-2">
                      {recap.city} · {new Date(recap.eventDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    </p>
                    <p className="font-display italic text-[20px] text-bridal-charcoal group-hover:text-bridal-gold transition-colors leading-tight line-clamp-2">
                      {recap.couple}
                    </p>
                    <p className="mt-2 font-bridal text-[13px] text-bridal-text-soft line-clamp-3">
                      {recap.excerpt}
                    </p>
                    <p className="mt-3 font-bridal text-[11.5px] text-bridal-text-soft">
                      {recap.readingMinutes} min read
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
