import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import {
  buildPageMetadata,
  SITE_NAME,
  collectionPageLD,
  combineGraph,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { CLUSTERS, POSTS, getRecentPosts } from "@/lib/blog/posts"

export const metadata: Metadata = buildPageMetadata({
  title: "Wedding planning blog",
  description: `${SITE_NAME}'s editorial blog — Pakistani wedding planning, vendor edits, real-wedding stories, and practical shaadi-season notes.`,
  path: "/blog",
})

export default function BlogIndexPage() {
  const recent = getRecentPosts(6)

  const ld = combineGraph(
    collectionPageLD({
      name: `Blog — ${SITE_NAME}`,
      description: "Pakistani wedding planning notes, vendor selection guides, and real-wedding stories.",
      url: "/blog",
      items: recent.map((p) => ({
        name: p.headline,
        url: `/blog/${p.cluster}/${p.slug}`,
        imageUrl: p.imageUrl,
      })),
    }),
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="container-responsive py-10 sm:py-14">
        <Breadcrumbs items={[{ name: "Blog", href: "/blog" }]} className="mb-6" />

        <header className="mb-10 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            Editorial
          </p>
          <h1 className="font-display italic text-[38px] sm:text-[48px] leading-tight text-bridal-charcoal">
            Wedding planning notes
          </h1>
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            Pakistani wedding planning, vendor edits, real-wedding stories, and
            practical shaadi-season notes — written by the {SITE_NAME} editorial
            team.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
            Browse by topic
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CLUSTERS.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/blog/${c.slug}`}
                  className="group block p-5 rounded-md border border-bridal-beige hover:border-bridal-gold hover:bg-bridal-cream transition-all"
                >
                  <p className="font-display italic text-[20px] text-bridal-charcoal group-hover:text-bridal-gold transition-colors">
                    {c.name}
                  </p>
                  <p className="mt-1 font-bridal text-[12.5px] text-bridal-text-soft leading-relaxed line-clamp-2">
                    {c.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
            Recent posts
          </h2>
          {POSTS.length === 0 ? (
            <p className="font-bridal text-[14px] text-bridal-text-soft">
              First posts publishing soon — check back this week.
            </p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recent.map((post) => {
                const cluster = CLUSTERS.find((c) => c.slug === post.cluster)
                return (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.cluster}/${post.slug}`}
                      className="group block rounded-md border border-bridal-beige overflow-hidden hover:border-bridal-gold hover:shadow-md transition-all"
                    >
                      <div className="relative aspect-[16/10] bg-bridal-cream">
                        <Image
                          src={post.imageUrl}
                          alt={post.headline}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5">
                        {cluster && (
                          <p className="font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-gold mb-2">
                            {cluster.name}
                          </p>
                        )}
                        <p className="font-display italic text-[19px] text-bridal-charcoal group-hover:text-bridal-gold transition-colors leading-tight line-clamp-2">
                          {post.headline}
                        </p>
                        <p className="mt-2 font-bridal text-[13px] text-bridal-text-soft line-clamp-2">
                          {post.excerpt}
                        </p>
                        <p className="mt-3 font-bridal text-[11.5px] text-bridal-text-soft">
                          {post.readingMinutes} min read &middot;{" "}
                          <time dateTime={post.publishedAt}>
                            {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </time>
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
