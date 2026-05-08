import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  buildPageMetadata,
  SITE_NAME,
  combineGraph,
  faqLD,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { GLOSSARY, getGlossaryTerm } from "@/lib/glossary/terms"

interface RouteProps {
  params: { slug: string }
}

export const dynamicParams = false

export function generateStaticParams() {
  return GLOSSARY.map((t) => ({ slug: t.slug }))
}

export function generateMetadata({ params }: RouteProps): Metadata {
  const t = getGlossaryTerm(params.slug)
  if (!t) return { title: "Not Found" }
  return buildPageMetadata({
    title: `${t.term} — Pakistani wedding glossary`,
    description: t.definition,
    path: `/glossary/${t.slug}`,
  })
}

export default function GlossaryTermPage({ params }: RouteProps) {
  const t = getGlossaryTerm(params.slug)
  if (!t) notFound()

  // DefinedTerm + FAQPage schema. The FAQ has just one Q ("What is X?")
  // mapped to the one-sentence definition — exactly the shape AI Overview
  // and Google's featured-snippet algorithm prefer for definitional queries.
  const ld = combineGraph(
    {
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      name: t.term,
      description: t.definition,
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://weddingwala.pk"}/glossary/${t.slug}`,
      inDefinedTermSet: {
        "@type": "DefinedTermSet",
        name: `Pakistani wedding glossary — ${SITE_NAME}`,
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://weddingwala.pk"}/glossary`,
      },
    },
    faqLD([
      {
        question: `What is ${t.term.toLowerCase()}?`,
        answer: t.definition,
      },
    ]),
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <article className="container-responsive py-10 sm:py-14">
        <Breadcrumbs
          items={[
            { name: "Glossary", href: "/glossary" },
            { name: t.term, href: `/glossary/${t.slug}` },
          ]}
          className="mb-6"
        />

        <header className="mb-8 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            Pakistani wedding glossary
          </p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-display italic text-[44px] sm:text-[56px] leading-tight text-bridal-charcoal">
              {t.term}
            </h1>
            {t.termUrdu && (
              <span
                dir="rtl"
                className="font-bridal text-[26px] text-bridal-text-soft"
              >
                {t.termUrdu}
              </span>
            )}
          </div>

          {/* The one-sentence definition lives here as the LCP-eligible
              text and as the snippet target. */}
          <p className="mt-5 font-bridal text-[16.5px] text-bridal-charcoal leading-relaxed">
            <strong className="font-medium">{t.term}</strong> {t.definition}
          </p>
        </header>

        {t.placement && (
          <aside className="max-w-3xl mb-8 rounded-md border border-bridal-gold/45 bg-bridal-cream p-4">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold-dark font-medium mb-1">
              When it happens
            </p>
            <p className="font-bridal text-[14px] text-bridal-text leading-relaxed">
              {t.placement}
            </p>
          </aside>
        )}

        {/* Body */}
        <div className="max-w-3xl prose prose-bridal font-bridal text-[15px] text-bridal-text leading-relaxed [&_h2]:font-display [&_h2]:italic [&_h2]:text-[24px] [&_h2]:text-bridal-charcoal [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:my-4">
          {t.body.map((block, i) => {
            if (block.type === "h2") return <h2 key={i}>{block.text}</h2>
            return <p key={i}>{block.text}</p>
          })}
        </div>

        {/* Aliases */}
        {t.aliases && t.aliases.length > 0 && (
          <p className="max-w-3xl mt-8 font-bridal text-[12.5px] text-bridal-text-soft">
            <strong className="text-bridal-charcoal">Also known as:</strong>{" "}
            {t.aliases.join(", ")}
          </p>
        )}

        {/* Related terms */}
        {t.related && t.related.length > 0 && (
          <section className="max-w-3xl mt-12">
            <h2 className="font-display italic text-[22px] text-bridal-charcoal mb-4">
              Related terms
            </h2>
            <ul className="flex flex-wrap gap-2">
              {t.related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/glossary/${r.slug}`}
                    className="inline-block px-3 py-1.5 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[13px] text-bridal-text-soft hover:text-bridal-charcoal transition-all"
                  >
                    {r.term}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Back to index */}
        <p className="max-w-3xl mt-12 font-bridal text-[14px]">
          <Link href="/glossary" className="text-bridal-gold hover:underline">
            ← Back to glossary
          </Link>
        </p>
      </article>
    </>
  )
}
