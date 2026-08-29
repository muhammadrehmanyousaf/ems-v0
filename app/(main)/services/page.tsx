/**
 * Public services page — /services
 *
 * What Wedding Wala actually does, stated once, for both sides of the
 * marketplace. Until now the site had no such page: the homepage sold
 * discovery, /how-it-works explained money, /list-your-business sold vendors,
 * and nothing said plainly "here is the service, here is who pays for it".
 *
 * On imagery — this page exists partly because a payment processor's review
 * found service listings carrying photographs that were not of that service.
 * So the rule here is narrow and absolute: a category gets a photograph ONLY
 * when public/images/home/credits.md documents that photograph as depicting
 * that subject. Categories without a truthful photograph get a typographic
 * card. A decorative stand-in that implies "this is a mithai shop" when it is
 * a stock photo of a bride is exactly the misrepresentation being fixed, and a
 * pretty grid is not worth it.
 */

import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ShieldCheck, Wallet, Search, CalendarCheck } from "lucide-react"
import {
  buildPageMetadata,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  LEGAL_ENTITY_LINE,
  BUSINESS_NTN,
  BUSINESS_ADDRESS_ONELINE,
  VENDOR_TYPES,
  faqLD,
  combineGraph,
  safeJsonLd,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"

export const metadata: Metadata = buildPageMetadata({
  title: "Our services — what Wedding Wala does",
  description: `${SITE_NAME} helps Pakistani couples find, compare and book verified wedding vendors, and gives those vendors a portal to run their business. Free for couples; vendors pay a monthly subscription.`,
  path: "/services",
})

/**
 * Category → photograph. A slug appears here ONLY if credits.md documents the
 * file as depicting that subject. Missing on purpose; do not "fill the gaps".
 */
const CATEGORY_IMAGE: Partial<Record<string, { src: string; alt: string }>> = {
  "wedding-venues": {
    src: "/images/home/partners/venue.jpg",
    alt: "Bride standing in a decorated wedding venue",
  },
  "wedding-photographers": {
    src: "/images/home/partners/photography.jpg",
    alt: "Photographer shooting a wedding function",
  },
  "wedding-planners": {
    src: "/images/home/spotlight/spotlight.jpg",
    alt: "Grand floral wedding stage set for a function",
  },
  caterers: {
    src: "/images/home/partners/catering.jpg",
    alt: "Wedding reception table laid with place settings",
  },
  "wedding-decorators": {
    src: "/images/home/partners/decor.jpg",
    alt: "Floral stage decor at a wedding",
  },
  "mehndi-artists": {
    src: "/images/home/partners/henna.jpg",
    alt: "Bridal mehndi being applied to hands at a mehndi ceremony",
  },
  "bridal-makeup-artists": {
    src: "/images/home/partners/makeup.jpg",
    alt: "Bridal makeup being applied before a wedding function",
  },
  "bridal-wear": {
    src: "/images/home/lookbook/l1.jpg",
    alt: "Embroidery detail on a red bridal lehenga",
  },
  "wedding-cars": {
    src: "/images/placeholders/car.jpg",
    alt: "Wedding car decorated with flowers for the rukhsati",
  },
}

const STEPS = [
  {
    Icon: Search,
    title: "Search and compare",
    body: "Browse verified vendors by city and category. Every profile carries the vendor's own prices, photos and availability — no phone-number hunting, no guesswork about budget.",
  },
  {
    Icon: CalendarCheck,
    title: "Check the date, ask for a quote",
    body: "See which dates a vendor still has open, message them through the platform, and get a written quote you can compare against others.",
  },
  /* "Protected deposit" and "we release the deposit" removed 2026-08-29 —
     the platform never holds a customer's money, so neither was true. */
  {
    Icon: Wallet,
    title: "Pay the vendor, on the record",
    body: `Nothing is due until the vendor accepts. You then pay them directly — ${SITE_NAME} never takes or holds your money — and record the reference so both of you have the same history.`,
  },
  {
    Icon: ShieldCheck,
    title: "One record of the whole booking",
    body: "What was agreed, what was paid and when, all on the booking rather than scattered across WhatsApp. If something goes wrong, that record is what settles it.",
  },
]

const FAQS = [
  {
    question: `Does ${SITE_NAME} cost anything for couples?`,
    answer: `No. Searching, comparing, messaging vendors and booking are free for couples. You pay the vendor's own price for their service — ${SITE_NAME} does not add a fee to it.`,
  },
  {
    question: `Does ${SITE_NAME} provide the wedding services itself?`,
    answer: `No. ${SITE_NAME} is a marketplace. Venues, catering, photography, decor and every other service are delivered by independent Pakistani businesses. We provide the platform you find and book them on — you pay the vendor directly, and we never take or hold that money.`,
  },
  {
    question: "What does a vendor pay?",
    answer: `Vendors pay a monthly subscription for the ${SITE_NAME} vendor portal, from PKR 2,500 per month. That subscription is our only charge — we take no commission from a vendor's bookings. Full prices are on our pricing page.`,
  },
  {
    question: "Which cities do you cover?",
    answer:
      "Vendors across Pakistan, with the deepest coverage in Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Peshawar and Hyderabad.",
  },
  {
    question: "How do I raise a problem with a booking?",
    answer: `Open the booking in your account and start a dispute, or contact us at ${SUPPORT_EMAIL} or ${SUPPORT_PHONE_DISPLAY}. Our refund, cancellation and service delivery policies set out what happens next and how long it takes.`,
  },
]

export default function ServicesPage() {
  // <Breadcrumbs> below already emits the BreadcrumbList node; adding
  // breadcrumbsLD() here too would publish the trail twice.
  const jsonLd = combineGraph(
    faqLD(FAQS),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `${SITE_NAME} wedding vendor marketplace`,
      serviceType: "Wedding vendor marketplace and vendor management software",
      description: `Find, compare and book verified wedding vendors across Pakistan, with deposits held until the function is delivered. Vendors subscribe to the ${SITE_NAME} portal to manage bookings, payments and availability.`,
      url: `${SITE_URL}/services`,
      provider: { "@id": `${SITE_URL}#organization` },
      areaServed: { "@type": "Country", name: "Pakistan" },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Wedding vendor categories",
        itemListElement: VENDOR_TYPES.map((vt) => ({
          "@type": "OfferCatalog",
          name: vt.plural,
          url: `${SITE_URL}/${vt.slug}`,
        })),
      },
    },
  )

  const withPhoto = VENDOR_TYPES.filter((vt) => CATEGORY_IMAGE[vt.slug])
  const withoutPhoto = VENDOR_TYPES.filter((vt) => !CATEGORY_IMAGE[vt.slug])

  return (
    <div className="bg-bridal-ivory">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <div className="container-responsive pt-6">
        <Breadcrumbs items={[{ name: "Our services", href: "/services" }]} />
      </div>

      {/* ── Hero ── */}
      <section className="container-responsive pb-14 pt-8 sm:pt-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="font-bridal text-[10.5px] font-medium uppercase tracking-[0.24em] text-bridal-gold">
              What we do
            </p>
            <h1 className="mt-3 font-display text-[34px] italic leading-[1.12] text-bridal-charcoal sm:text-[46px]">
              A marketplace for Pakistani weddings — and the software behind it.
            </h1>
            <p className="mt-5 max-w-xl font-bridal text-[15.5px] leading-relaxed text-bridal-text-soft">
              {SITE_NAME} does two things. It helps couples find, compare and book verified wedding
              vendors across Pakistan, with the deposit held until the function is delivered. And it
              gives those vendors a portal to run bookings, payments and availability. Couples pay
              nothing. Vendors pay a monthly subscription.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-bridal text-[14px] font-medium text-white transition-colors hover:bg-bridal-gold-dark"
              >
                Find vendors <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-full border border-bridal-beige px-6 py-3 font-bridal text-[14px] text-bridal-charcoal transition-colors hover:border-bridal-gold"
              >
                Vendor pricing
              </Link>
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            {/* Not spotlight.jpg — that one is the Wedding Planners card further
                down, and the same photograph twice on one page is the exact
                duplication this page was written to stop doing. */}
            <Image
              src="/images/home/hero/h1.jpg"
              alt="Gold columns and a floral stage set for a Pakistani wedding"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── The two sides, priced ── */}
      <section className="border-y border-bridal-beige/60 bg-bridal-cream py-14">
        <div className="container-responsive grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-bridal-beige/70 bg-white p-7">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.2em] text-bridal-gold-dark">
              For couples
            </p>
            <h2 className="mt-2 font-display text-[26px] italic text-bridal-charcoal">
              Free to search, free to book
            </h2>
            <p className="mt-3 font-bridal text-[14px] leading-relaxed text-bridal-text-soft">
              Search verified vendors, compare real PKR prices, message them, check dates and book —
              at no cost to you. You pay the vendor&apos;s own price for their service and nothing on
              top. Your deposit is held by {SITE_NAME} until the function is delivered.
            </p>
            <Link
              href="/how-it-works"
              className="mt-5 inline-flex items-center gap-1.5 font-bridal text-[13.5px] font-medium text-bridal-gold-dark hover:underline"
            >
              How booking and payment work <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-bridal-gold bg-white p-7 shadow-[0_12px_40px_-18px_rgba(201,149,106,0.5)]">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.2em] text-bridal-gold-dark">
              For vendors
            </p>
            <h2 className="mt-2 font-display text-[26px] italic text-bridal-charcoal">
              A portal, from Rs 2,500 a month
            </h2>
            <p className="mt-3 font-bridal text-[14px] leading-relaxed text-bridal-text-soft">
              Bookings, an availability calendar, khata for payments and receipts, quotes and
              contracts, staff accounts and analytics — in one place. The subscription is our only
              charge: we take no commission on your bookings and deduct nothing from your deposits.
            </p>
            <Link
              href="/pricing"
              className="mt-5 inline-flex items-center gap-1.5 font-bridal text-[13.5px] font-medium text-bridal-gold-dark hover:underline"
            >
              See plans and prices <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Categories with a real photograph ── */}
      <section className="container-responsive py-14">
        <h2 className="font-display text-[28px] italic text-bridal-charcoal">
          Vendor categories we cover
        </h2>
        <p className="mt-2 max-w-2xl font-bridal text-[14px] leading-relaxed text-bridal-text-soft">
          Every category below is live on {SITE_NAME}, with verified vendors listed by city.
        </p>

        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {withPhoto.map((vt) => {
            const img = CATEGORY_IMAGE[vt.slug]!
            return (
              <Link
                key={vt.slug}
                href={`/${vt.slug}`}
                className="group overflow-hidden rounded-2xl border border-bridal-beige/70 bg-white transition-shadow hover:shadow-[0_14px_44px_-22px_rgba(44,24,16,0.45)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-[20px] italic text-bridal-charcoal transition-colors group-hover:text-bridal-gold-dark">
                    {vt.plural}
                  </h3>
                  <p className="mt-1.5 font-bridal text-[13px] leading-relaxed text-bridal-text-soft">
                    {vt.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Categories we do not hold a truthful photograph for. A typographic
            card is the honest option — see the note at the top of this file. */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withoutPhoto.map((vt) => (
            <Link
              key={vt.slug}
              href={`/${vt.slug}`}
              className="group rounded-2xl border border-bridal-beige/70 bg-white p-5 transition-colors hover:border-bridal-gold"
            >
              <h3 className="font-display text-[19px] italic text-bridal-charcoal transition-colors group-hover:text-bridal-gold-dark">
                {vt.plural}
              </h3>
              <p className="mt-1.5 font-bridal text-[13px] leading-relaxed text-bridal-text-soft">
                {vt.description}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 font-bridal text-[12.5px] font-medium text-bridal-gold-dark">
                Browse <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How a booking runs ── */}
      <section className="border-t border-bridal-beige/60 py-14">
        <div className="container-responsive">
          <h2 className="font-display text-[28px] italic text-bridal-charcoal">
            How a booking runs
          </h2>
          <ol className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ Icon, title, body }, i) => (
              <li key={title}>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bridal-blush">
                  <Icon className="h-4.5 w-4.5 text-bridal-gold-dark" strokeWidth={1.7} />
                </span>
                <p className="mt-3 font-bridal text-[10.5px] uppercase tracking-[0.2em] text-bridal-text-label">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 font-bridal text-[15px] font-medium text-bridal-charcoal">
                  {title}
                </h3>
                <p className="mt-1.5 font-bridal text-[13.5px] leading-relaxed text-bridal-text-soft">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── What we are not ── */}
      <section className="border-y border-bridal-beige/60 bg-bridal-cream py-14">
        <div className="container-responsive">
          <h2 className="font-display text-[26px] italic text-bridal-charcoal">
            What {SITE_NAME} is not
          </h2>
          <ul className="mt-5 grid max-w-4xl gap-3 sm:grid-cols-2">
            {[
              `We do not provide the wedding services ourselves. Venues, catering, photography and decor are delivered by independent Pakistani businesses.`,
              `We do not set vendor prices. Each vendor sets their own, in PKR, and we do not add a fee on top of it.`,
              `We do not keep any part of a customer's deposit. It is held, then released to the vendor in full after the function.`,
              `We are not a bank or a wallet. Card, wallet and bank payments are processed by a licensed Pakistani payment processor.`,
            ].map((line) => (
              <li
                key={line}
                className="rounded-xl border border-bridal-beige/60 bg-white px-4 py-3.5 font-bridal text-[13.5px] leading-relaxed text-bridal-text-soft"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="container-responsive py-14">
        <h2 className="font-display text-[26px] italic text-bridal-charcoal">Common questions</h2>
        <div className="mt-6 space-y-5">
          {FAQS.map((f) => (
            <div key={f.question} className="border-b border-bridal-beige/60 pb-5 last:border-0">
              <h3 className="font-bridal text-[15px] font-medium text-bridal-charcoal">
                {f.question}
              </h3>
              <p className="mt-2 max-w-3xl font-bridal text-[14px] leading-relaxed text-bridal-text-soft">
                {f.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who we are ── */}
      <section className="border-t border-bridal-beige/60 py-12">
        <div className="container-responsive">
          <h2 className="font-bridal text-[11px] uppercase tracking-[0.2em] text-bridal-gold-dark">
            The business behind {SITE_NAME}
          </h2>
          <p className="mt-3 max-w-3xl font-bridal text-[14px] leading-relaxed text-bridal-text-soft">
            <strong className="font-medium text-bridal-charcoal">{LEGAL_ENTITY_LINE}</strong> · NTN{" "}
            {BUSINESS_NTN}
            <br />
            {BUSINESS_ADDRESS_ONELINE}
            <br />
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-bridal-gold-dark underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            ·{" "}
            <a href={SUPPORT_PHONE_TEL} className="text-bridal-gold-dark underline">
              {SUPPORT_PHONE_DISPLAY}
            </a>
          </p>
          <p className="mt-4 font-bridal text-[13px] leading-relaxed text-bridal-text-soft">
            <Link href="/terms" className="text-bridal-gold-dark underline">
              Terms of service
            </Link>{" "}
            ·{" "}
            <Link href="/refund-policy" className="text-bridal-gold-dark underline">
              Refund policy
            </Link>{" "}
            ·{" "}
            <Link href="/cancellation-policy" className="text-bridal-gold-dark underline">
              Cancellation policy
            </Link>{" "}
            ·{" "}
            <Link href="/service-delivery-policy" className="text-bridal-gold-dark underline">
              Service delivery policy
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="text-bridal-gold-dark underline">
              Privacy policy
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
