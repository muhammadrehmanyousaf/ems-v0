import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  buildPageMetadata,
  SITE_NAME,
  collectionPageLD,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { CLUSTERS, getCluster, getPostsByCluster } from "@/lib/blog/posts"

interface RouteProps {
  params: { cluster: string }
}

export const dynamicParams = false

export function generateStaticParams() {
  return CLUSTERS.map((c) => ({ cluster: c.slug }))
}

export function generateMetadata({ params }: RouteProps): Metadata {
  const cluster = getCluster(params.cluster)
  if (!cluster) return { title: "Not Found" }
  return buildPageMetadata({
    title: `${cluster.name} — Blog`,
    description: cluster.description,
    path: `/blog/${cluster.slug}`,
  })
}

export default function BlogClusterPage({ params }: RouteProps) {
  const cluster = getCluster(params.cluster)
  if (!cluster) notFound()
  const posts = getPostsByCluster(cluster.slug)

  const ld = collectionPageLD({
    name: `${cluster.name} — ${SITE_NAME}`,
    description: cluster.description,
    url: `/blog/${cluster.slug}`,
    items: posts.map((p) => ({
      name: p.headline,
      url: `/blog/${p.cluster}/${p.slug}`,
      imageUrl: p.imageUrl,
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
          items={[
            { name: "Blog", href: "/blog" },
            { name: cluster.name, href: `/blog/${cluster.slug}` },
          ]}
          className="mb-6"
        />

        <header className="mb-10 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            Editorial · Topic
          </p>
          <h1 className="font-display italic text-[38px] sm:text-[48px] leading-tight text-bridal-charcoal">
            {cluster.name}
          </h1>
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            {cluster.description}
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="font-bridal text-[14px] text-bridal-text-soft">
            First posts on this topic publishing soon.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
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
            ))}
          </ul>
        )}

        <section className="mt-14">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-4">
            Other topics
          </h2>
          <ul className="flex flex-wrap gap-2">
            {CLUSTERS.filter((c) => c.slug !== cluster.slug).map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/blog/${other.slug}`}
                  className="inline-block px-3 py-1.5 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[13px] text-bridal-text-soft hover:text-bridal-charcoal transition-all"
                >
                  {other.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
