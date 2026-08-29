import { safeJsonLd } from "@/lib/seo/jsonld";
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

/**
 * Rewritten 2026-08-29 for the direct-pay model.
 *
 * This list contradicted itself: one answer said the platform "holds the
 * deposit", another said it "earns from the monthly subscription vendors pay,
 * not from your booking". The second was already correct — it is the model the
 * founder described — so the rest is now brought into line with it rather than
 * written from scratch.
 *
 * Removed outright: "Why does Wedding Wala hold the deposit?" and the card-
 * statement descriptor answer. Both described a custody arrangement and a card
 * charge that do not exist. Answering them at all would keep the idea alive.
 */
const FAQS = [
  {
    question: "Is Wedding Wala the actual vendor?",
    answer: `No. ${SITE_NAME} is a marketplace. Wedding services are delivered by independent third-party vendors. We help you find and book them — and you pay the vendor directly.`,
  },
  {
    question: "Who do I pay, and how?",
    answer: `You pay the vendor directly — usually by bank transfer, JazzCash or Easypaisa into the account they publish on their booking. ${SITE_NAME} never takes or holds your money. After you pay, you enter the transfer reference and a screenshot so the vendor can match it, and both of you keep one shared record of what was paid and when.`,
  },
  {
    question: "What does Wedding Wala charge?",
    answer: `Customers pay the price the vendor lists, in PKR — ${SITE_NAME} adds nothing on top of it and takes nothing out of it. We earn from the monthly subscription vendors pay for the vendor portal, not from your booking. Our pricing page sets out exactly what a vendor pays.`,
  },
  {
    question: "What if the vendor cancels or doesn't deliver?",
    answer: `Because the money goes straight to the vendor, any refund is arranged with that vendor directly. ${SITE_NAME} holds nothing to refund on their behalf. We keep the record of the booking and of every payment you reported, which is what you need to settle it — and you can raise a complaint with us if the vendor will not engage.`,
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
        dangerouslySetInnerHTML={{ __html: safeJsonLd(ld) }}
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
