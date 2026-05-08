import Link from "next/link"
import type { Metadata } from "next"
import { Newspaper, Mail, Download, ArrowUpRight } from "lucide-react"
import {
  buildPageMetadata,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
  collectionPageLD,
  combineGraph,
  articleLD,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"

export const metadata: Metadata = buildPageMetadata({
  title: "Press & media",
  description: `${SITE_NAME} in the news — press mentions, founder interviews, and a downloadable media kit for journalists covering Pakistani wedding tech and shaadi-season trends.`,
  path: "/press",
})

interface PressMention {
  /** Slug-safe id used as the React key + anchor link. */
  id: string
  outlet: string
  /** Headline — quoted verbatim from the publication. */
  headline: string
  /** External URL to the published piece. */
  url: string
  /** ISO date the piece ran. */
  date: string
  /** 1–2 sentence excerpt — quote from the article or our editorial summary. */
  excerpt: string
  /** Outlet's logo or a placeholder character — keep simple until we have permission to use real logos. */
  badge?: string
}

/**
 * Press mentions — empty until Wedding Wala earns coverage. Once
 * journalists run pieces, add entries here. Each entry feeds the
 * NewsArticle JSON-LD `@graph` below.
 *
 * The empty-state copy is intentional: editorial honesty over
 * fake-it-till-you-make-it (PayFast underwriting reads this stuff).
 */
const PRESS: PressMention[] = []

export default function PressPage() {
  const ld = combineGraph(
    collectionPageLD({
      name: `Press — ${SITE_NAME}`,
      description: `Press mentions and media coverage of ${SITE_NAME}.`,
      url: "/press",
      items: PRESS.map((p) => ({
        name: p.headline,
        url: p.url,
      })),
    }),
    ...PRESS.map((p) =>
      articleLD({
        headline: p.headline,
        description: p.excerpt,
        url: p.url,
        imageUrl: `${SITE_URL}/og-default.jpg`,
        datePublished: p.date,
        authorName: p.outlet,
      }),
    ),
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="container-responsive py-10 sm:py-14">
        <Breadcrumbs items={[{ name: "Press", href: "/press" }]} className="mb-6" />

        <header className="mb-12 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            Press &amp; media
          </p>
          <h1 className="font-display italic text-[40px] sm:text-[48px] leading-tight text-bridal-charcoal">
            Wedding Wala in the news
          </h1>
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            Press mentions, founder interviews, and the {SITE_NAME} media kit
            for journalists covering Pakistani wedding-tech, shaadi-season
            trends, and marketplace platforms in the GCC + South Asian region.
          </p>
        </header>

        {/* Press list */}
        <section className="mb-14">
          <h2 className="font-display italic text-[26px] text-bridal-charcoal mb-6">
            Coverage
          </h2>
          {PRESS.length === 0 ? (
            <div className="max-w-2xl rounded-md border border-dashed border-bridal-beige bg-bridal-ivory/40 p-7">
              <Newspaper className="w-7 h-7 text-bridal-gold-dark mb-3" />
              <p className="font-display italic text-[20px] text-bridal-charcoal mb-2">
                No coverage yet — happy to chat.
              </p>
              <p className="font-bridal text-[14px] text-bridal-text leading-relaxed">
                We&apos;d rather show an empty page than a fake one. Wedding
                Wala is a young Pakistani marketplace; if you cover wedding
                tech, the Pakistani consumer-internet sector, or
                marketplace platforms in South Asia, get in touch — we&apos;ll
                send you original data, founder time, and on-the-record
                quotes.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=Press%20enquiry`}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-bridal-gold text-white font-bridal text-[13px] font-medium hover:bg-bridal-gold-dark transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email press@weddingwala.pk
                </a>
              </div>
            </div>
          ) : (
            <ul className="space-y-5 max-w-3xl">
              {PRESS.map((p) => (
                <li
                  key={p.id}
                  className="rounded-md border border-bridal-beige bg-white p-5 hover:border-bridal-gold transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-12 h-12 rounded-md bg-bridal-cream border border-bridal-beige inline-flex items-center justify-center font-display italic text-[20px] text-bridal-charcoal">
                      {p.badge ?? p.outlet.charAt(0)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bridal text-[10.5px] uppercase tracking-[0.2em] text-bridal-gold font-medium">
                        {p.outlet} &middot;{" "}
                        <time dateTime={p.date}>
                          {new Date(p.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </time>
                      </p>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-start gap-1.5 font-display italic text-[20px] text-bridal-charcoal hover:text-bridal-gold transition-colors"
                      >
                        <span>{p.headline}</span>
                        <ArrowUpRight className="flex-shrink-0 w-4 h-4 mt-1.5 text-bridal-text-soft" />
                      </a>
                      <p className="mt-2 font-bridal text-[13.5px] text-bridal-text leading-relaxed">
                        {p.excerpt}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Media kit */}
        <section className="mb-14 max-w-3xl">
          <h2 className="font-display italic text-[26px] text-bridal-charcoal mb-3">
            Media kit
          </h2>
          <p className="font-bridal text-[14px] text-bridal-text-soft mb-5">
            Press-ready brand assets, founder bio, fact sheet, and original
            data on Pakistani wedding-industry trends.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "Brand assets",
                desc: "Logo (light + dark), wordmark, favicon, brand colours.",
                cta: "Email request",
                href: `mailto:${SUPPORT_EMAIL}?subject=Media%20kit%20request%20-%20brand%20assets`,
              },
              {
                title: "Founder bio + photo",
                desc: "Press-ready 200-word bio + headshot of founder Waheed.",
                cta: "Email request",
                href: `mailto:${SUPPORT_EMAIL}?subject=Media%20kit%20request%20-%20founder%20bio`,
              },
              {
                title: "Fact sheet",
                desc: "What Wedding Wala is, what it isn't, founding date, business model.",
                cta: "Email request",
                href: `mailto:${SUPPORT_EMAIL}?subject=Media%20kit%20request%20-%20fact%20sheet`,
              },
              {
                title: "Industry data",
                desc: "Original data on Pakistani shaadi-season pricing, vendor categories, city-by-city demand.",
                cta: "Email request",
                href: `mailto:${SUPPORT_EMAIL}?subject=Media%20kit%20request%20-%20industry%20data`,
              },
            ].map((item) => (
              <li
                key={item.title}
                className="rounded-md border border-bridal-beige p-5 hover:border-bridal-gold transition-colors"
              >
                <Download className="w-5 h-5 text-bridal-gold-dark mb-3" />
                <p className="font-display italic text-[18px] text-bridal-charcoal">
                  {item.title}
                </p>
                <p className="mt-1 font-bridal text-[13px] text-bridal-text leading-relaxed">
                  {item.desc}
                </p>
                <a
                  href={item.href}
                  className="mt-3 inline-flex items-center gap-1.5 font-bridal text-[12.5px] text-bridal-gold hover:underline"
                >
                  {item.cta}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* For journalists */}
        <aside className="max-w-3xl rounded-md border border-bridal-beige bg-bridal-cream p-6">
          <h2 className="font-display italic text-[22px] text-bridal-charcoal mb-2">
            Working on a piece? Talk to us directly.
          </h2>
          <p className="font-bridal text-[14px] text-bridal-text leading-relaxed mb-4">
            We respond within 24 hours on weekdays and 48 hours on weekends.
            Founder Waheed is available for on-the-record quotes about
            Pakistani wedding-tech, marketplace economics, and shaadi-season
            consumer behaviour.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Press%20enquiry`}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-bridal-gold text-white font-bridal text-[13px] font-medium hover:bg-bridal-gold-dark transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Email press
            </a>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[13px] text-bridal-charcoal transition-colors"
            >
              Learn about Wedding Wala
            </Link>
          </div>
        </aside>
      </div>
    </>
  )
}
