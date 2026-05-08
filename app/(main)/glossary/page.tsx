import Link from "next/link"
import type { Metadata } from "next"
import {
  buildPageMetadata,
  SITE_NAME,
  collectionPageLD,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { GLOSSARY } from "@/lib/glossary/terms"

export const metadata: Metadata = buildPageMetadata({
  title: "Pakistani wedding glossary",
  description: `What is a mehndi? A baraat? A walima? Plain-English definitions of every Pakistani wedding tradition, ceremony, and term — for couples, families, and curious guests.`,
  path: "/glossary",
})

export default function GlossaryIndexPage() {
  const ld = collectionPageLD({
    name: `Pakistani wedding glossary — ${SITE_NAME}`,
    description: "Definitions of Pakistani wedding traditions, ceremonies, and vendor categories.",
    url: "/glossary",
    items: GLOSSARY.map((t) => ({
      name: t.term,
      url: `/glossary/${t.slug}`,
    })),
  })

  // Sort terms alphabetically for the index display.
  const sorted = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="container-responsive py-10 sm:py-14">
        <Breadcrumbs items={[{ name: "Glossary", href: "/glossary" }]} className="mb-6" />

        <header className="mb-10 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            Glossary
          </p>
          <h1 className="font-display italic text-[38px] sm:text-[48px] leading-tight text-bridal-charcoal">
            Pakistani wedding glossary
          </h1>
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            What is a mehndi? A baraat? A walima? Plain-English definitions
            of every Pakistani wedding tradition, ceremony, and vendor
            category — for couples planning their wedding, families
            supporting them, and curious guests trying to follow along.
          </p>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
          {sorted.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/glossary/${t.slug}`}
                className="group block p-5 rounded-md border border-bridal-beige hover:border-bridal-gold hover:bg-bridal-cream transition-all"
              >
                <div className="flex items-baseline gap-2">
                  <p className="font-display italic text-[20px] text-bridal-charcoal group-hover:text-bridal-gold transition-colors">
                    {t.term}
                  </p>
                  {t.termUrdu && (
                    <span className="font-bridal text-[14px] text-bridal-text-soft" dir="rtl">
                      {t.termUrdu}
                    </span>
                  )}
                </div>
                <p className="mt-2 font-bridal text-[12.5px] text-bridal-text leading-relaxed line-clamp-3">
                  {t.definition}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
