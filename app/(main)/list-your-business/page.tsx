import Link from "next/link"
import type { Metadata } from "next"
import { CheckCircle2, ArrowRight, ShieldCheck, Calendar, MessageCircle, TrendingUp, Wallet, Users } from "lucide-react"
import {
  buildPageMetadata,
  SITE_NAME,
  SUPPORT_EMAIL,
  ONBOARDING_EMAIL,
  faqLD,
  serviceLD,
  combineGraph,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"

export const metadata: Metadata = buildPageMetadata({
  title: "List your business on Wedding Wala",
  description: `Reach Pakistani couples planning their wedding right now. ${SITE_NAME} is the trust-first marketplace for Pakistani wedding vendors — verified profiles, real reviews, secure deposits, no chargeback drama.`,
  path: "/list-your-business",
})

const BENEFITS = [
  {
    Icon: TrendingUp,
    title: "Real demand, real bookings",
    body: "Pakistani couples discover vendors via search, not vibes. We rank you for the queries your customers actually type — `wedding photographer Lahore`, `mehndi artist Karachi`, `farmhouse in Islamabad` — and route ready-to-book customers to your profile.",
  },
  {
    Icon: ShieldCheck,
    title: "Verified, no fake reviews",
    body: "Every review on Wedding Wala comes from a verified booking. Couples can only review you after the event date passes. No incentivised ratings, no review-trading. Your real work earns your real rating.",
  },
  {
    Icon: Wallet,
    title: "Deposits held until you confirm",
    body: "When a customer books you, the deposit is held by Wedding Wala — released to you when you confirm. If you can't take the date, the customer is refunded automatically and we don't charge a fee. No payment chasing, no awkward conversations.",
  },
  {
    Icon: Calendar,
    title: "Calendar that actually syncs",
    body: "Block dates, set capacity, mark recurring days off. Wedding Wala respects your availability rules. Customers see the right slots, you don't get double-booked.",
  },
  {
    Icon: MessageCircle,
    title: "Built-in customer chat",
    body: "Every customer enquiry lands in your dashboard inbox with full context — date, function, budget. No WhatsApp number leakage, no off-platform negotiation needed for the discovered booking.",
  },
  {
    Icon: Users,
    title: "Editorial spotlights",
    body: "We feature standout vendors in our blog and real-wedding recaps. Free editorial coverage when your work earns it. Vendor backlinks count for your own SEO too.",
  },
]

const STEPS = [
  {
    n: 1,
    title: "Apply",
    body: "Fill the registration form. Takes ~10 minutes. Tell us about your service, pricing, sample work.",
  },
  {
    n: 2,
    title: "Verification",
    body: "Our team reviews your portfolio + identity within 1–2 business days. Verified vendors only — protects everyone.",
  },
  {
    n: 3,
    title: "Profile + go live",
    body: "Add packages, prices, photos, available dates. Once approved you're indexed across the city × vendor-type pages.",
  },
  {
    n: 4,
    title: "Start receiving bookings",
    body: "Customers find you via search, save you, message you, book you. Confirm dates from your dashboard. We hold deposits, release on confirmation.",
  },
]

const FAQS = [
  {
    question: "How much does it cost to list?",
    answer: `Listing on ${SITE_NAME} is free. We take a small commission only on bookings completed through the platform — there's no monthly fee, no listing fee, no charge for browsers viewing your profile.`,
  },
  {
    question: "Who can list?",
    answer: `Verified Pakistani wedding vendors across 11 categories: venues, photographers, planners, caterers, decorators, mehndi artists, bridal makeup, bridal wear, wedding cars, stationery, and DJs. We require identity verification, portfolio review, and a working business number before approval.`,
  },
  {
    question: "What if my customer wants to pay off-platform?",
    answer: `Bookings discovered through ${SITE_NAME} must be completed on ${SITE_NAME}. Off-platform circumvention is a Terms violation — see our Acceptable Use Policy. The platform protections (deposit holding, cancellation insurance, dispute resolution) only work if the booking flows through us.`,
  },
  {
    question: "How long until I start getting bookings?",
    answer: `Depends on category, city, and how complete your profile is. Profiles with 8+ portfolio photos, transparent PKR pricing, and quick-reply behaviour typically receive their first enquiry within 2–3 weeks of going live. The most active vendors close their first booking inside a month.`,
  },
  {
    question: "Can I run my own pricing?",
    answer: `Yes — you set every price. ${SITE_NAME} doesn't dictate vendor pricing. You can run different packages, seasonal pricing, custom quotes for specific dates. We just require pricing be transparent before booking — no surprise fees at the contract stage.`,
  },
  {
    question: "What happens if a customer cancels?",
    answer: `Refunds follow your published cancellation tier (Flexible / Moderate / Strict). The customer sees your tier before booking, so cancellations are predictable. ${SITE_NAME} handles the refund processing — you don't have to chase customers for money.`,
  },
  {
    question: "How do payouts work?",
    answer: `${SITE_NAME} disburses your earnings after the event date passes (with a small holding window for dispute coverage). Payouts go to your registered Pakistani bank account. We provide a downloadable statement for tax purposes.`,
  },
]

export default function ListYourBusinessPage() {
  const ld = combineGraph(
    serviceLD({
      name: `Vendor onboarding — ${SITE_NAME}`,
      description: "Pakistani wedding vendors join Wedding Wala for verified bookings, secure deposits, and calendar tooling.",
      url: "/list-your-business",
      serviceType: "Vendor onboarding",
      areaServed: "Pakistan",
    }),
    faqLD(FAQS),
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="container-responsive py-10 sm:py-14">
        <Breadcrumbs items={[{ name: "List your business", href: "/list-your-business" }]} className="mb-6" />

        {/* Hero */}
        <header className="mb-14 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            For Pakistani wedding vendors
          </p>
          <h1 className="font-display italic text-[40px] sm:text-[52px] leading-tight text-bridal-charcoal">
            Build your wedding business on Pakistan&apos;s trust-first marketplace.
          </h1>
          <p className="mt-5 font-bridal text-[16px] text-bridal-text leading-relaxed">
            Real bookings, verified reviews, deposits held until you confirm.
            No fake leads, no chargeback drama, no spammy WhatsApp messages
            — just couples ready to book and a platform that protects both
            of you.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/business-registration"
              className="inline-flex items-center gap-2 px-5 h-12 rounded-full bg-bridal-gold text-white font-bridal text-[14px] font-medium hover:bg-bridal-gold-dark transition-colors"
            >
              List your business
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/vendor-guide"
              className="inline-flex items-center gap-2 px-5 h-12 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[14px] text-bridal-charcoal transition-colors"
            >
              Read the vendor guide
            </Link>
            <a
              href={`mailto:${ONBOARDING_EMAIL}`}
              className="inline-flex items-center gap-2 px-5 h-12 font-bridal text-[14px] text-bridal-text-soft hover:text-bridal-charcoal transition-colors"
            >
              Or email us → {ONBOARDING_EMAIL}
            </a>
          </div>
        </header>

        {/* Benefits grid */}
        <section className="mb-16">
          <h2 className="font-display italic text-[28px] text-bridal-charcoal mb-7">
            Why vendors choose Wedding Wala
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map(({ Icon, title, body }) => (
              <li
                key={title}
                className="rounded-md border border-bridal-beige bg-bridal-cream p-6"
              >
                <span className="inline-flex w-11 h-11 rounded-full bg-bridal-gold/15 border border-bridal-gold/45 items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-bridal-gold-dark" />
                </span>
                <p className="font-display italic text-[20px] text-bridal-charcoal leading-tight">
                  {title}
                </p>
                <p className="mt-2 font-bridal text-[14px] text-bridal-text leading-relaxed">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works for vendors */}
        <section className="mb-16">
          <h2 className="font-display italic text-[28px] text-bridal-charcoal mb-7">
            From sign-up to first booking
          </h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="rounded-md border border-bridal-beige p-5"
              >
                <span className="inline-flex w-9 h-9 rounded-full bg-bridal-gold text-white font-display italic text-[18px] items-center justify-center">
                  {s.n}
                </span>
                <p className="mt-3 font-display italic text-[19px] text-bridal-charcoal">
                  {s.title}
                </p>
                <p className="mt-1 font-bridal text-[13.5px] text-bridal-text leading-relaxed">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Verified-vendor expectations */}
        <section className="mb-16 max-w-3xl">
          <h2 className="font-display italic text-[28px] text-bridal-charcoal mb-5">
            What we ask of every vendor
          </h2>
          <ul className="space-y-3">
            {[
              "Identity verification — CNIC + business address on file",
              "Working contact number, answered within business hours",
              "Transparent PKR pricing visible before customer commits",
              "8+ portfolio photos that are your own work",
              "Honest cancellation policy — Flexible / Moderate / Strict tier locked",
              "Reply to customer enquiries within 24 hours",
              "Deliver the booking date you accepted; no double-booking",
              "No off-platform circumvention of bookings discovered through Wedding Wala",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-bridal-gold flex-shrink-0 mt-1" />
                <span className="font-bridal text-[14px] text-bridal-text leading-relaxed">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="mb-14 max-w-3xl">
          <h2 className="font-display italic text-[28px] text-bridal-charcoal mb-7">
            Vendor FAQ
          </h2>
          <dl className="space-y-6">
            {FAQS.map((f) => (
              <div key={f.question}>
                <dt className="font-bridal text-[15.5px] font-semibold text-bridal-charcoal">
                  {f.question}
                </dt>
                <dd className="mt-2 font-bridal text-[14px] text-bridal-text leading-relaxed">
                  {f.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Closing CTA */}
        <aside className="rounded-md border border-bridal-beige bg-bridal-cream p-7 text-center max-w-3xl mx-auto">
          <p className="font-display italic text-[26px] text-bridal-charcoal">
            Ready to grow your wedding business?
          </p>
          <p className="mt-2 font-bridal text-[14px] text-bridal-text leading-relaxed max-w-xl mx-auto">
            10-minute signup. Verification within 2 business days. No upfront cost.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/business-registration"
              className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-bridal-gold text-white font-bridal text-[14px] font-medium hover:bg-bridal-gold-dark transition-colors"
            >
              Start vendor signup
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[14px] text-bridal-charcoal transition-colors"
            >
              Talk to onboarding first
            </a>
          </div>
        </aside>
      </div>
    </>
  )
}
