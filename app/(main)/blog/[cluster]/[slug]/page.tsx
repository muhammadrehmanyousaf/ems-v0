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
  CLUSTERS,
  POSTS,
  getCluster,
  getPost,
  getPostsByCluster,
} from "@/lib/blog/posts"

interface RouteProps {
  params: { cluster: string; slug: string }
}

export const dynamicParams = false

export function generateStaticParams() {
  return POSTS.map((p) => ({ cluster: p.cluster, slug: p.slug }))
}

export function generateMetadata({ params }: RouteProps): Metadata {
  const post = getPost(params.cluster, params.slug)
  if (!post) return { title: "Not Found" }
  return buildPageMetadata({
    title: post.headline,
    description: post.excerpt,
    path: `/blog/${post.cluster}/${post.slug}`,
    imageUrl: post.imageUrl,
    ogType: "article",
    article: {
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      author: post.author.name,
      section: getCluster(post.cluster)?.name,
      tags: post.tags,
    },
  })
}

export default function BlogPostPage({ params }: RouteProps) {
  const post = getPost(params.cluster, params.slug)
  const cluster = getCluster(params.cluster)
  if (!post || !cluster) notFound()

  const url = `${SITE_URL}/blog/${post.cluster}/${post.slug}`

  const ld = combineGraph(
    articleLD({
      headline: post.headline,
      description: post.excerpt,
      url,
      imageUrl: post.imageUrl,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt ?? post.publishedAt,
      authorName: post.author.name,
      authorUrl: post.author.url,
    }),
  )

  // Related posts in the same cluster, excluding the current one.
  const related = getPostsByCluster(cluster.slug)
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <article className="container-responsive max-w-5xl [&>*]:mx-auto py-10 sm:py-14">
        <Breadcrumbs
          items={[
            { name: "Blog", href: "/blog" },
            { name: cluster.name, href: `/blog/${cluster.slug}` },
            { name: post.headline, href: `/blog/${post.cluster}/${post.slug}` },
          ]}
          className="mb-6"
        />

        {/* Header */}
        <header className="max-w-3xl mb-8">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            {cluster.name}
          </p>
          <h1 className="font-display italic text-[34px] sm:text-[48px] leading-tight text-bridal-charcoal">
            {post.headline}
          </h1>
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            {post.excerpt}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4 font-bridal text-[12.5px] text-bridal-text-soft">
            <span>
              By{" "}
              {post.author.url ? (
                <Link href={post.author.url} className="text-bridal-charcoal hover:text-bridal-gold">
                  {post.author.name}
                </Link>
              ) : (
                <span className="text-bridal-charcoal">{post.author.name}</span>
              )}
            </span>
            <span aria-hidden>·</span>
            <span>{post.readingMinutes} min read</span>
            <span aria-hidden>·</span>
            <span>
              <time dateTime={post.publishedAt}>
                Published{" "}
                {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </span>
            {post.updatedAt && post.updatedAt !== post.publishedAt && (
              <>
                <span aria-hidden>·</span>
                <span>
                  <time dateTime={post.updatedAt}>
                    Updated{" "}
                    {new Date(post.updatedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                </span>
              </>
            )}
          </div>
        </header>

        {/* Hero */}
        <div className="relative aspect-[16/9] max-w-4xl mb-4 rounded-md overflow-hidden bg-bridal-cream">
          <Image
            src={post.imageUrl}
            alt={post.headline}
            fill
            priority
            fetchPriority="high"
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover"
          />
        </div>

        {/*
          Pinterest save affordance — directly under the hero, the
          natural moment to save. Pinterest is the highest-leverage
          social-search surface for wedding content. Reference:
          docs/seo/08-pinterest-strategy.md.
        */}
        <div className="max-w-4xl mb-10">
          <PinterestSaveButton
            imageUrl={post.imageUrl}
            description={`${post.headline} — ${SITE_NAME}`}
            pageUrl={url}
            size="sm"
            label="Save to Pinterest"
          />
        </div>

        {/* Body */}
        <div className="prose prose-bridal max-w-3xl font-bridal text-[15.5px] text-bridal-text leading-relaxed [&_h2]:font-display [&_h2]:italic [&_h2]:text-[26px] [&_h2]:text-bridal-charcoal [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:font-display [&_h3]:italic [&_h3]:text-[20px] [&_h3]:text-bridal-charcoal [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_li]:my-1.5">
          {post.body.map((block, i) => {
            if (block.type === "p") return <p key={i}>{block.text}</p>
            if (block.type === "h2") return <h2 key={i}>{block.text}</h2>
            if (block.type === "h3") return <h3 key={i}>{block.text}</h3>
            if (block.type === "ul") {
              return (
                <ul key={i}>
                  {block.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )
            }
            return null
          })}
        </div>

        {/* Tags + share row */}
        <div className="max-w-3xl mt-10 flex flex-wrap items-center justify-between gap-4">
          {post.tags && post.tags.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
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
            imageUrl={post.imageUrl}
            description={`${post.headline} — ${SITE_NAME}`}
            pageUrl={url}
            size="sm"
            label="Save to Pinterest"
          />
        </div>

        {/* Author bio */}
        <aside className="max-w-3xl mt-12 rounded-md border border-bridal-beige bg-bridal-cream p-6">
          <p className="font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-gold mb-2">
            About the author
          </p>
          <p className="font-display italic text-[20px] text-bridal-charcoal">
            {post.author.name}
          </p>
          <p className="mt-1 font-bridal text-[12.5px] text-bridal-text-soft">
            {post.author.role}
          </p>
          <p className="mt-3 font-bridal text-[14px] text-bridal-text leading-relaxed">
            {post.author.bioShort}
          </p>
          {post.author.url && (
            <p className="mt-3">
              <Link
                href={post.author.url}
                className="font-bridal text-[13px] text-bridal-gold hover:underline"
              >
                More about the {SITE_NAME} editorial team →
              </Link>
            </p>
          )}
        </aside>

        {/* Related posts */}
        {related.length > 0 && (
          <section className="max-w-5xl mt-14">
            <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
              More from {cluster.name.toLowerCase()}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.cluster}/${p.slug}`}
                    className="group block rounded-md border border-bridal-beige overflow-hidden hover:border-bridal-gold transition-all"
                  >
                    <div className="relative aspect-[16/10] bg-bridal-cream">
                      <Image
                        src={p.imageUrl}
                        alt={p.headline}
                        fill
                        sizes="(min-width: 640px) 33vw, 100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-display italic text-[16px] text-bridal-charcoal group-hover:text-bridal-gold leading-tight line-clamp-2">
                        {p.headline}
                      </p>
                      <p className="mt-2 font-bridal text-[11.5px] text-bridal-text-soft">
                        {p.readingMinutes} min read
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
