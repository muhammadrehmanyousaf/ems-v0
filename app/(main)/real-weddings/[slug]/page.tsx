import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  buildPageMetadata,
  SITE_NAME,
  SITE_URL,
  articleLD,
  combineGraph,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { PinterestSaveButton } from "@/components/seo/pinterest-save-button"
import {
  REAL_WEDDINGS,
  getRealWedding,
  getAllRealWeddings,
} from "@/lib/real-weddings/recaps"

interface RouteProps {
  params: { slug: string }
}

export const dynamicParams = false

export function generateStaticParams() {
  return REAL_WEDDINGS.map((r) => ({ slug: r.slug }))
}

export function generateMetadata({ params }: RouteProps): Metadata {
  const recap = getRealWedding(params.slug)
  if (!recap) return { title: "Not Found" }
  return buildPageMetadata({
    title: recap.title,
    description: recap.excerpt,
    path: `/real-weddings/${recap.slug}`,
    imageUrl: recap.coverImage,
    ogType: "article",
    article: {
      publishedTime: recap.publishedAt,
      modifiedTime: recap.updatedAt ?? recap.publishedAt,
      section: "Real Weddings",
      tags: recap.tags,
    },
  })
}

export default function RealWeddingPage({ params }: RouteProps) {
  const recap = getRealWedding(params.slug)
  if (!recap) notFound()

  const url = `${SITE_URL}/real-weddings/${recap.slug}`

  const ld = combineGraph(
    articleLD({
      headline: recap.title,
      description: recap.excerpt,
      url,
      imageUrl: recap.coverImage,
      datePublished: recap.publishedAt,
      dateModified: recap.updatedAt ?? recap.publishedAt,
      authorName: `${SITE_NAME} Editorial`,
      authorUrl: `${SITE_URL}/about`,
    }),
  )

  // Other recaps for the cross-link footer
  const others = getAllRealWeddings()
    .filter((r) => r.slug !== recap.slug)
    .slice(0, 3)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <article className="container-responsive max-w-5xl [&>*]:mx-auto py-8 sm:py-12">
        <Breadcrumbs
          items={[
            { name: "Real weddings", href: "/real-weddings" },
            { name: recap.couple, href: `/real-weddings/${recap.slug}` },
          ]}
          className="mb-6"
        />

        {/* Header */}
        <header className="max-w-3xl mb-8">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            Real wedding · {recap.city}, {recap.region}
          </p>
          <h1 className="font-display italic text-[34px] sm:text-[48px] leading-tight text-bridal-charcoal">
            {recap.title}
          </h1>
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            {recap.excerpt}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4 font-bridal text-[12.5px] text-bridal-text-soft">
            <span>
              <time dateTime={recap.eventDate}>
                {new Date(recap.eventDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </span>
            <span aria-hidden>·</span>
            <span>{recap.readingMinutes} min read</span>
          </div>
        </header>

        {/* Hero */}
        <div className="relative aspect-[16/9] max-w-5xl mb-4 rounded-md overflow-hidden bg-bridal-cream">
          <Image
            src={recap.coverImage}
            alt={`${recap.couple} — wedding cover`}
            fill
            priority
            fetchPriority="high"
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover"
          />
        </div>

        {/* Pinterest save under hero */}
        <div className="max-w-5xl mb-10">
          <PinterestSaveButton
            imageUrl={recap.coverImage}
            description={`${recap.title} — ${SITE_NAME}`}
            pageUrl={url}
            size="sm"
            label="Save this wedding to Pinterest"
          />
        </div>

        {/* Story */}
        <div className="max-w-3xl prose prose-bridal font-bridal text-[15.5px] text-bridal-text leading-relaxed [&_h2]:font-display [&_h2]:italic [&_h2]:text-[26px] [&_h2]:text-bridal-charcoal [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:my-4">
          {recap.story.map((block, i) => {
            if (block.type === "p") return <p key={i}>{block.text}</p>
            if (block.type === "h2") return <h2 key={i}>{block.text}</h2>
            if (block.type === "quote") {
              return (
                <blockquote
                  key={i}
                  className="border-l-2 border-bridal-gold pl-5 my-8 italic font-display text-[20px] text-bridal-charcoal leading-snug"
                >
                  &ldquo;{block.text}&rdquo;
                  <footer className="mt-2 not-italic font-bridal text-[13px] text-bridal-text-soft">
                    — {block.attribution}
                  </footer>
                </blockquote>
              )
            }
            return null
          })}
        </div>

        {/* Photo gallery */}
        {recap.gallery.length > 0 && (
          <section className="max-w-5xl mt-12">
            <h2 className="font-display italic text-[26px] text-bridal-charcoal mb-5">
              The day in pictures
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {recap.gallery.map((src, i) => (
                <li
                  key={i}
                  className="relative aspect-square rounded-md overflow-hidden bg-bridal-cream"
                >
                  <Image
                    src={src}
                    alt={`${recap.couple} — gallery photo ${i + 1}`}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Vendor credits */}
        {recap.credits.length > 0 && (
          <section className="max-w-3xl mt-12">
            <h2 className="font-display italic text-[26px] text-bridal-charcoal mb-3">
              Vendor credits
            </h2>
            <p className="font-bridal text-[13px] text-bridal-text-soft mb-5">
              Every vendor who worked the day, with our thanks.
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {recap.credits.map((credit, i) => (
                <div key={i}>
                  <dt className="font-bridal text-[10.5px] uppercase tracking-[0.2em] text-bridal-gold font-medium mb-1">
                    {credit.role}
                  </dt>
                  <dd className="font-bridal text-[14.5px] text-bridal-charcoal">
                    {credit.url ? (
                      <Link
                        href={credit.url}
                        className="hover:text-bridal-gold transition-colors"
                      >
                        {credit.name}
                      </Link>
                    ) : (
                      credit.name
                    )}
                    {credit.city && (
                      <span className="text-bridal-text-soft"> · {credit.city}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Tags + share */}
        <div className="max-w-3xl mt-10 flex flex-wrap items-center justify-between gap-4">
          {recap.tags.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {recap.tags.map((tag) => (
                <li
                  key={tag}
                  className="inline-block px-3 py-1 rounded-full border border-bridal-beige font-bridal text-[12px] text-bridal-text-soft"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          )}
          <PinterestSaveButton
            imageUrl={recap.coverImage}
            description={`${recap.title} — ${SITE_NAME}`}
            pageUrl={url}
            size="sm"
            label="Save to Pinterest"
          />
        </div>

        {/* Submit-your-wedding CTA */}
        <aside className="max-w-3xl mt-14 rounded-md border border-bridal-beige bg-bridal-cream p-6">
          <p className="font-display italic text-[20px] text-bridal-charcoal mb-2">
            Just had your wedding?
          </p>
          <p className="font-bridal text-[14px] text-bridal-text leading-relaxed">
            We&apos;d love to feature your story. Email{" "}
            <a href="mailto:info@weddingwala.pk" className="text-bridal-gold hover:underline">
              info@weddingwala.pk
            </a>{" "}
            with a few photos, your vendor list, and a short story. We share
            recaps with your full permission only.
          </p>
        </aside>

        {/* More recaps */}
        {others.length > 0 && (
          <section className="max-w-5xl mt-14">
            <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
              More real weddings
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {others.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/real-weddings/${r.slug}`}
                    className="group block rounded-md border border-bridal-beige overflow-hidden hover:border-bridal-gold transition-all"
                  >
                    <div className="relative aspect-[16/10] bg-bridal-cream">
                      <Image
                        src={r.coverImage}
                        alt={r.couple}
                        fill
                        sizes="(min-width: 640px) 33vw, 100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-display italic text-[18px] text-bridal-charcoal group-hover:text-bridal-gold leading-tight line-clamp-2">
                        {r.couple}
                      </p>
                      <p className="mt-1 font-bridal text-[11.5px] text-bridal-text-soft">
                        {r.city}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </>
  )
}
