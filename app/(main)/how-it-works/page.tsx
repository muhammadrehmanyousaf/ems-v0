import type { Metadata } from "next"
import Link from "next/link"
import {
  buildPageMetadata,
  SITE_NAME,
  faqLD,
  howToLD,
  combineGraph,
  serviceLD,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"

export const metadata: Metadata = buildPageMetadata({
  title: "How Wedding Wala Works",
  description: `${SITE_NAME} is a marketplace. Here's how booking, payment, and vendor payouts work — explained plainly.`,
  path: "/how-it-works",
})

const STEPS = [
  {
    name: "Discover vendors in your city",
    text: "Browse verified wedding venues, photographers, planners, caterers, decorators, and more — filtered by your city and budget. Every listing has real reviews from past bookings.",
  },
  {
    name: "Compare and shortlist",
    text: "Use our budget calculator and side-by-side compare to narrow down to a handful of vendors. Chat with vendors through the platform to clarify packages and availability.",
  },
  {
    name: "Book and pay your deposit",
    text: "When you find the right match, confirm the booking with a deposit through our secure payment processor (PayFast Pakistan). Wedding Wala holds the deposit — the vendor doesn't receive it until the booking is confirmed.",
  },
  {
    name: "Vendor confirms",
    text: "The vendor reviews and accepts the booking, typically within 24 hours. If they decline, the deposit is fully refunded.",
  },
  {
    name: "Pay the balance",
    text: "Pay the remaining balance per the schedule on your booking — usually before or on the event date. Every payment is on the platform; no off-platform transactions are needed.",
  },
  {
    name: "Enjoy the event",
    text: "The vendor delivers their service on the agreed date. Your peace of mind is built into the platform — if something goes wrong, you have refund and dispute protections.",
  },
  {
    name: "Mark complete & review",
    text: "After the event, mark the booking complete. Wedding Wala releases final payment to the vendor, and you can leave a review for future couples.",
  },
] as const

const FAQS = [
  {
    question: "Is Wedding Wala the actual vendor?",
    answer: `No. ${SITE_NAME} is a marketplace. Wedding services are delivered by independent third-party vendors. We help you find, book, and pay them — and we hold the deposit until the booking is confirmed.`,
  },
  {
    question: "Why does Wedding Wala hold the deposit?",
    answer: `Holding the deposit protects you. If a vendor cancels, declines, or fails to deliver, ${SITE_NAME} refunds you according to the Refund Policy — without you needing to chase the vendor for the money.`,
  },
  {
    question: "What does Wedding Wala charge?",
    answer: `Customers pay the price the vendor lists, in PKR. ${SITE_NAME}'s platform fee is included in the displayed price — no surprise charges at checkout. Vendors pay a small commission on each booking.`,
  },
  {
    question: "How are vendor payouts handled?",
    answer: `${SITE_NAME} pays vendors after the event is delivered and the booking is marked complete. This protects customers from vendor no-shows.`,
  },
  {
    question: "What happens on the customer's card statement?",
    answer: `The descriptor reads "WEDDINGWALA" (or our registered DBA), not the vendor's name. This is normal for marketplace transactions and is required by card-network rules.`,
  },
] as const

export default function HowItWorksPage() {
  const ld = combineGraph(
    howToLD({
      name: `How ${SITE_NAME} Works`,
      description: `Step-by-step booking flow on ${SITE_NAME}.`,
      steps: STEPS.map((s) => ({ name: s.name, text: s.text })),
    }),
    serviceLD({
      name: "Wedding marketplace platform",
      description: `${SITE_NAME} connects Pakistani couples with verified wedding vendors across 12 cities.`,
      url: "/how-it-works",
      serviceType: "Wedding Planning Marketplace",
      areaServed: "Pakistan",
    }),
    faqLD([...FAQS]),
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="container-responsive py-10 sm:py-14">
        <Breadcrumbs items={[{ name: "How it works", href: "/how-it-works" }]} className="mb-6" />

        <header className="mb-12 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            About {SITE_NAME}
          </p>
          <h1 className="font-display italic text-[38px] sm:text-[48px] leading-tight text-bridal-charcoal">
            How {SITE_NAME} works
          </h1>
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            {SITE_NAME} is a marketplace. We connect Pakistani couples with
            verified wedding vendors across 12 cities. Here&apos;s the booking flow,
            explained plainly — including what happens with your money.
          </p>
        </header>

        <ol className="space-y-8 max-w-3xl mb-14">
          {STEPS.map((step, i) => (
            <li key={step.name} className="flex gap-5">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-bridal-gold text-white font-display italic flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <h2 className="font-display italic text-[22px] text-bridal-charcoal mb-1">
                  {step.name}
                </h2>
                <p className="font-bridal text-[14.5px] text-bridal-text leading-relaxed">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <section className="max-w-3xl mb-12">
          <h2 className="font-display italic text-[26px] text-bridal-charcoal mb-5">
            Frequently asked questions
          </h2>
          <dl className="space-y-5">
            {FAQS.map((f) => (
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
        </section>

        <section className="max-w-3xl rounded-md border border-bridal-beige bg-bridal-cream p-6">
          <h2 className="font-display italic text-[20px] text-bridal-charcoal mb-2">
            Read the policies
          </h2>
          <ul className="font-bridal text-[14px] text-bridal-text space-y-1">
            <li><Link href="/terms" className="text-bridal-gold hover:underline">Terms of Service</Link></li>
            <li><Link href="/refund-policy" className="text-bridal-gold hover:underline">Refund Policy</Link></li>
            <li><Link href="/cancellation-policy" className="text-bridal-gold hover:underline">Cancellation Policy</Link></li>
            <li><Link href="/service-delivery-policy" className="text-bridal-gold hover:underline">Service Delivery Policy</Link></li>
            <li><Link href="/privacy" className="text-bridal-gold hover:underline">Privacy Policy</Link></li>
          </ul>
        </section>
      </div>
    </>
  )
}
