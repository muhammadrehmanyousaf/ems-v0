/**
 * <ContentPillar> — renders a data-driven SEO content pillar from a PillarData
 * object: answer-first lead, h2/h3/p/ul/table/callout body, FAQ, trust box,
 * and an internal-link CTA. Emits Article + FAQPage JSON-LD and breadcrumbs.
 *
 * Every page built on this template is automatically answer-first + schema-rich
 * + internally linked — the format AI search cites and Google rewards. Add a
 * new pillar = author one PillarData object + a thin route. No bespoke TSX.
 */

import Link from "next/link"
import type { Metadata } from "next"
import {
  SITE_NAME,
  SITE_URL,
  buildPageMetadata,
  articleLD,
  faqLD,
  combineGraph,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import type { PillarData, PillarSection } from "@/lib/content/pillar-types"

const DEFAULT_PUBLISHED = "2026-06-14"
const DEFAULT_UPDATED = "2026-06-14"

export function buildPillarMetadata(data: PillarData): Metadata {
  return buildPageMetadata({
    title: data.title,
    description: data.metaDescription,
    path: `/${data.slug}`,
    ogType: "article",
    article: {
      publishedTime: data.publishedAt ?? DEFAULT_PUBLISHED,
      modifiedTime: data.updatedAt ?? DEFAULT_UPDATED,
      author: data.authorName,
      section: data.eyebrow,
    },
  })
}

function DataTable({
  caption,
  headers,
  rows,
}: {
  caption?: string
  headers: string[]
  rows: string[][]
}) {
  return (
    <div className="my-6 overflow-x-auto rounded-md border border-bridal-beige">
      <table className="w-full text-left border-collapse">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-bridal-ivory/60 font-bridal text-[11px] uppercase tracking-[0.1em] text-bridal-text-label">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-bridal-beige align-top">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 font-bridal text-[13.5px] ${
                    j === 0 ? "text-bridal-charcoal font-medium" : "text-bridal-text"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Section({ block }: { block: PillarSection }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
          {block.text}
        </h2>
      )
    case "h3":
      return (
        <h3 className="font-display italic text-[20px] text-bridal-charcoal mt-6 mb-2">
          {block.text}
        </h3>
      )
    case "p":
      return (
        <p className="font-bridal text-[15px] text-bridal-text leading-relaxed my-4">
          {block.text}
        </p>
      )
    case "ul":
      return (
        <ul className="list-disc pl-6 my-4 font-bridal text-[15px] text-bridal-text leading-relaxed space-y-1.5">
          {(block.items ?? []).map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      )
    case "table":
      return (
        <DataTable
          caption={block.caption}
          headers={block.headers ?? []}
          rows={block.rows ?? []}
        />
      )
    case "callout":
      return (
        <div className="my-5 rounded-md border border-bridal-beige bg-bridal-cream p-5">
          {block.label && (
            <p className="font-bridal text-[11px] uppercase tracking-[0.18em] text-bridal-gold mb-3">
              {block.label}
            </p>
          )}
          {/* callouts may carry a `text` string, an `items` list, or both */}
          {block.text && (
            <p className="font-bridal text-[14px] text-bridal-text leading-relaxed">
              {block.text}
            </p>
          )}
          {block.items && block.items.length > 0 && (
            <ul className="list-disc pl-5 space-y-1.5 font-bridal text-[14px] text-bridal-text mt-2">
              {block.items.map((it, i) => (
                <li key={i}>{it}</li>
              ))}
            </ul>
          )}
        </div>
      )
    default:
      return null
  }
}

export function ContentPillar({ data }: { data: PillarData }) {
  const path = `/${data.slug}`
  const ld = combineGraph(
    articleLD({
      headline: data.h1,
      description: data.metaDescription,
      url: path,
      imageUrl: `${SITE_URL}/og-default.jpg`,
      datePublished: data.publishedAt ?? DEFAULT_PUBLISHED,
      dateModified: data.updatedAt ?? DEFAULT_UPDATED,
      authorName: data.authorName,
    }),
    ...(data.faqs.length > 0 ? [faqLD(data.faqs)] : []),
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="container-responsive max-w-5xl [&>*]:mx-auto py-10 sm:py-14">
        {/* Breadcrumbs auto-prepends Home, so drop any Home the data carries. */}
        <Breadcrumbs
          items={data.breadcrumb.filter(
            (b) => b.href !== "/" && b.name.toLowerCase() !== "home",
          )}
          className="mb-6"
        />

        <header className="mb-8 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            {data.eyebrow}
          </p>
          <h1 className="font-display italic text-[34px] sm:text-[46px] leading-tight text-bridal-charcoal">
            {data.h1}
          </h1>
          <p className="mt-4 font-bridal text-[15.5px] text-bridal-text leading-relaxed">
            {data.lead}
          </p>
          <p className="mt-3 font-bridal text-[12px] text-bridal-text-soft">
            By {data.authorName} · Updated {data.updatedLabel}
          </p>
        </header>

        <div className="max-w-3xl">
          {data.sections.map((block, i) => (
            <Section key={i} block={block} />
          ))}

          {data.faqs.length > 0 && (
            <>
              <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
                Frequently asked questions
              </h2>
              <dl className="space-y-5">
                {data.faqs.map((f) => (
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
            </>
          )}

          {data.methodologyNote && (
            <aside className="mt-10 rounded-md border border-bridal-beige bg-bridal-cream p-6">
              <p className="font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-gold mb-2">
                How we put this together
              </p>
              <p className="font-bridal text-[13.5px] text-bridal-text leading-relaxed">
                {data.methodologyNote}
              </p>
            </aside>
          )}

          {data.internalLinks.length > 0 && (
            <div className="mt-10 rounded-md border border-bridal-beige bg-bridal-ivory/40 p-6 sm:p-8">
              <p className="font-display italic text-[20px] text-bridal-charcoal">
                Plan it on {SITE_NAME}
              </p>
              <p className="mt-1 font-bridal text-[13px] text-bridal-text-soft">
                Compare verified vendors and tools for your wedding.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {data.internalLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="inline-block px-3 py-1.5 rounded-full bg-bridal-charcoal text-bridal-ivory font-bridal text-[12.5px] hover:bg-bridal-gold-dark transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
