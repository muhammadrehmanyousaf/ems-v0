/**
 * Public vendor pricing — /pricing
 *
 * Wedding Wala sells ONE thing to vendors: a monthly subscription to the
 * vendor portal. This page is the public, authoritative statement of that
 * price list.
 *
 * Two audiences read it and both matter:
 *   1. A marquee owner in Lahore deciding whether Rs 5,000/month is worth it.
 *   2. A payment processor's merchant review, checking that the merchant
 *      discloses what it charges, in PKR, with terms, before taking money.
 *
 * Consequences of (2), which are NOT decoration:
 *   - Every tier states what it does NOT include. The wording mirrors the
 *     backend's own `FEATURE_LABELS.absent` map so this page cannot drift away
 *     from the actual entitlement gate
 *     (event-planner-api/src/utils/entitlementHelper.js).
 *   - Nothing is listed as shipped unless it ships. FBR/PRA e-invoicing runs a
 *     noop adapter today (services/fbrProvider.js) and is therefore marked
 *     "in rollout", not sold as a live feature.
 *   - Card / wallet collection is described as being enabled, because it is.
 *     Bank transfer is what works today.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { Check, Minus, ArrowRight } from "lucide-react"
import {
  buildPageMetadata,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
  ONBOARDING_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  LEGAL_ENTITY_LINE,
  BUSINESS_NTN,
  BUSINESS_ADDRESS_ONELINE,
  TAT_FIRST_RESPONSE,
  TAT_RESOLUTION,
  TAT_REFUND_TO_CARD,
  faqLD,
  combineGraph,
  safeJsonLd,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"

export const metadata: Metadata = buildPageMetadata({
  title: "Vendor pricing — plans and monthly fees",
  description: `What ${SITE_NAME} charges wedding vendors in Pakistan. Monthly plans from PKR 2,500. No commission on your bookings, no setup fee, no listing fee — the subscription is our only charge.`,
  path: "/pricing",
})

// ── Plans ────────────────────────────────────────────────────────────
// `includes` / `excludes` mirror FEATURE_MIN_TIER. If you gate a new feature in
// the backend, it belongs in both places or this page starts lying.

type Plan = {
  id: string
  name: string
  tagline: string
  /** PKR per month. `null` = priced on enquiry. */
  monthly: number | null
  forWho: string
  includes: string[]
  excludes: string[]
  featured?: boolean
}

const CORE = [
  "Your public listing and profile",
  "Unlimited bookings and enquiries",
  "Availability calendar with date blocking",
  "Khata — payments, receipts, balances",
  "Quotes and lead inbox",
  "Excel / CSV import",
]

const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    tagline: "Run one business properly",
    monthly: 2500,
    forWho: "A single hall, studio, salon or kitchen.",
    includes: [
      "Everything in the core toolkit",
      "Analytics",
      "Cheque / PDC ledger",
      "Quotes, contracts and e-sign",
      "WhatsApp message templates",
      "Staff accounts",
      `${SITE_NAME} branding removed from your quotes`,
    ],
    excludes: ["One business only", "No client portal", "No automations", "No forecasting"],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "More than one place to fill",
    monthly: 5000,
    forWho: "Two or more halls, or a team working several venues.",
    includes: [
      "Everything in Basic",
      "Multiple businesses and halls under one login",
      "Client portal for your couples",
      "Priority email support",
    ],
    excludes: ["No automations", "No forecasting"],
    featured: true,
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Run the season on numbers",
    monthly: 10000,
    forWho: "Established groups planning capacity across a full season.",
    includes: [
      "Everything in Pro",
      "Automations",
      "Forecasting",
      "A named account manager",
      "FBR / PRA e-invoicing — in rollout, not yet live",
    ],
    excludes: [],
  },
  {
    id: "custom",
    name: "Custom",
    tagline: "Chains and multi-city groups",
    monthly: null,
    forWho: "Five or more venues, or a group that needs its own terms.",
    includes: [
      "Everything in Premium",
      "Onboarding and data migration",
      "Terms and invoicing agreed with you",
    ],
    excludes: [],
  },
]

// ── Comparison matrix ────────────────────────────────────────────────
// Mirrors FEATURE_MIN_TIER exactly, in the map's own order.

const MATRIX: { label: string; basic: boolean; pro: boolean; premium: boolean; note?: string }[] = [
  { label: "Analytics", basic: true, pro: true, premium: true },
  { label: "Cheque / PDC ledger", basic: true, pro: true, premium: true },
  { label: "Quotes, contracts + e-sign", basic: true, pro: true, premium: true },
  { label: "WhatsApp templates", basic: true, pro: true, premium: true },
  { label: "Staff accounts", basic: true, pro: true, premium: true },
  { label: `${SITE_NAME} branding removed`, basic: true, pro: true, premium: true },
  { label: "Multiple businesses / halls", basic: false, pro: true, premium: true },
  { label: "Client portal", basic: false, pro: true, premium: true },
  { label: "Automations", basic: false, pro: false, premium: true },
  { label: "Forecasting", basic: false, pro: false, premium: true },
  {
    label: "FBR / PRA e-invoicing",
    basic: false,
    pro: false,
    premium: false,
    note: "In rollout — included with Premium when it goes live, at no extra cost.",
  },
]

const FAQS = [
  {
    question: `Does ${SITE_NAME} take a commission on my bookings?`,
    answer:
      "No. The monthly subscription is our only charge. We do not take a percentage of what your customers pay you, and we do not add a fee to your quoted price.",
  },
  {
    question: "What happens to the customer's deposit?",
    answer: `${SITE_NAME} holds the deposit a customer pays when they book you, and releases it to you in full once the function is delivered and the booking is marked complete. We deduct nothing from it. Holding it protects both sides: the customer knows the money is not gone if you cannot take the date, and you know the date is backed by real money.`,
  },
  {
    question: "Is there a setup fee, a listing fee or a contract?",
    answer:
      "No setup fee and no listing fee. Plans are monthly and you can stop at the end of any paid month — there is no lock-in period and no cancellation charge.",
  },
  {
    question: "What currency and what taxes?",
    answer: `All prices are in Pakistani Rupees (PKR). ${LEGAL_ENTITY_LINE} is registered with the FBR under NTN ${BUSINESS_NTN} and is not currently registered for sales tax, so no sales tax is added to these prices. Where any tax becomes applicable by law, it will be charged and shown on your invoice.`,
  },
  {
    question: "How do I pay?",
    answer:
      "Choose a plan from your vendor dashboard and we confirm it with you before anything is charged — requesting a plan is not an agreement to pay. Invoices are payable by bank transfer today. Card and mobile-wallet payment is being enabled through our licensed Pakistani payment processor.",
  },
  {
    question: "Can I change or cancel my plan?",
    answer:
      "Yes. Upgrade, downgrade or cancel at any time from Plan & billing in your dashboard. Changes apply from your next billing month; we do not charge a fee to move between plans.",
  },
  {
    question: "What if I am charged incorrectly?",
    answer: `Contact us at ${SUPPORT_EMAIL} or ${SUPPORT_PHONE_DISPLAY}. We acknowledge ${TAT_FIRST_RESPONSE} and resolve ${TAT_RESOLUTION}. Approved refunds are returned to the original payment method and typically reach a card in ${TAT_REFUND_TO_CARD}.`,
  },
]

function formatPkr(n: number) {
  return `Rs ${n.toLocaleString("en-PK")}`
}

export default function PricingPage() {
  // <Breadcrumbs> below already emits the BreadcrumbList node; adding
  // breadcrumbsLD() here too would publish the trail twice.
  const jsonLd = combineGraph(
    faqLD(FAQS),
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${SITE_NAME} vendor portal`,
      description: `Subscription to the ${SITE_NAME} vendor portal for wedding businesses in Pakistan.`,
      url: `${SITE_URL}/pricing`,
      brand: { "@id": `${SITE_URL}#organization` },
      offers: PLANS.filter((p) => p.monthly !== null).map((p) => ({
        "@type": "Offer",
        name: p.name,
        price: String(p.monthly),
        priceCurrency: "PKR",
        url: `${SITE_URL}/pricing`,
        availability: "https://schema.org/InStock",
      })),
    },
  )

  return (
    <div className="bg-bridal-ivory">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <div className="container-responsive pt-6">
        <Breadcrumbs items={[{ name: "Vendor pricing", href: "/pricing" }]} />
      </div>

      {/* ── Hero: state the charge, once, plainly ── */}
      <section className="container-responsive pb-12 pt-8 sm:pt-12">
        <p className="font-bridal text-[10.5px] font-medium uppercase tracking-[0.24em] text-bridal-gold">
          For wedding vendors
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-[34px] italic leading-[1.12] text-bridal-charcoal sm:text-[46px]">
          One monthly fee. Nothing taken from your bookings.
        </h1>
        <p className="mt-5 max-w-2xl font-bridal text-[15.5px] leading-relaxed text-bridal-text-soft">
          {SITE_NAME} charges vendors a subscription to the vendor portal — and that is our only
          charge. We take no commission on what your customers pay you. The deposit a customer places
          against a booking is held until the function is delivered, then released to you in full.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href="/list-your-business"
            className="inline-flex items-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-bridal text-[14px] font-medium text-white transition-colors hover:bg-bridal-gold-dark"
          >
            List your business <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={`mailto:${ONBOARDING_EMAIL}`}
            className="inline-flex items-center rounded-full border border-bridal-beige px-6 py-3 font-bridal text-[14px] text-bridal-charcoal transition-colors hover:border-bridal-gold"
          >
            Talk to us first
          </a>
        </div>
      </section>

      {/* ── Plan cards ── */}
      <section className="container-responsive pb-4">
        <div className="grid gap-5 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={[
                "flex flex-col rounded-2xl border bg-white p-6",
                plan.featured
                  ? "border-bridal-gold shadow-[0_12px_40px_-18px_rgba(201,149,106,0.55)]"
                  : "border-bridal-beige/70",
              ].join(" ")}
            >
              {plan.featured && (
                <p className="mb-3 inline-flex self-start rounded-full bg-bridal-blush px-3 py-1 font-bridal text-[10.5px] uppercase tracking-[0.18em] text-bridal-gold-dark">
                  Most vendors pick this
                </p>
              )}

              <h2 className="font-display text-[24px] italic text-bridal-charcoal">{plan.name}</h2>
              <p className="mt-1 font-bridal text-[13px] text-bridal-text-label">{plan.tagline}</p>

              <div className="mt-5">
                {plan.monthly === null ? (
                  <p className="font-display text-[30px] italic text-bridal-charcoal">
                    Let&apos;s talk
                  </p>
                ) : (
                  <>
                    <p className="font-display text-[34px] italic leading-none text-bridal-charcoal">
                      {formatPkr(plan.monthly)}
                    </p>
                    <p className="mt-1.5 font-bridal text-[12.5px] text-bridal-text-soft">
                      per month · {formatPkr(plan.monthly * 12)} a year
                    </p>
                  </>
                )}
              </div>

              <p className="mt-4 border-t border-bridal-beige/60 pt-4 font-bridal text-[13px] leading-relaxed text-bridal-text-soft">
                {plan.forWho}
              </p>

              <ul className="mt-4 space-y-2">
                {plan.includes.map((f) => (
                  <li
                    key={f}
                    className="flex gap-2 font-bridal text-[13.5px] leading-snug text-bridal-text"
                  >
                    <Check
                      className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-bridal-gold-dark"
                      strokeWidth={2.5}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* Stating the ceiling is the point. A vendor who finds the limit
                  after paying is a refund request and a bad review. */}
              {plan.excludes.length > 0 && (
                <ul className="mt-3 space-y-2 border-t border-bridal-beige/60 pt-3">
                  {plan.excludes.map((f) => (
                    <li
                      key={f}
                      className="flex gap-2 font-bridal text-[13px] leading-snug text-bridal-text-label"
                    >
                      <Minus className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.5} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 flex-1" />
              <Link
                href={plan.monthly === null ? "/contact" : "/list-your-business"}
                className={[
                  "inline-flex w-full items-center justify-center rounded-full px-5 py-2.5 font-bridal text-[13.5px] font-medium transition-colors",
                  plan.featured
                    ? "bg-bridal-gold text-white hover:bg-bridal-gold-dark"
                    : "border border-bridal-beige text-bridal-charcoal hover:border-bridal-gold",
                ].join(" ")}
              >
                {plan.monthly === null ? "Contact us" : `Start on ${plan.name}`}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-5 font-bridal text-[12.5px] leading-relaxed text-bridal-text-soft">
          Prices are in Pakistani Rupees and billed monthly. No setup fee, no listing fee, no
          lock-in. Requesting a plan is not an agreement to pay — we confirm with you before anything
          is charged.
        </p>
      </section>

      {/* ── Core toolkit ── */}
      <section className="container-responsive py-14">
        <h2 className="font-display text-[26px] italic text-bridal-charcoal">In every plan</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CORE.map((f) => (
            <li
              key={f}
              className="flex items-start gap-2.5 rounded-xl border border-bridal-beige/60 bg-white px-4 py-3 font-bridal text-[13.5px] text-bridal-text"
            >
              <Check
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-bridal-gold-dark"
                strokeWidth={2.5}
              />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Comparison ── */}
      <section className="container-responsive pb-14">
        <h2 className="font-display text-[26px] italic text-bridal-charcoal">Compare the plans</h2>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-bridal-beige/70 bg-white">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-bridal-beige/70">
                <th className="px-4 py-3 text-left font-bridal text-[11px] uppercase tracking-[0.16em] text-bridal-text-label">
                  Feature
                </th>
                {["Basic", "Pro", "Premium"].map((t) => (
                  <th
                    key={t}
                    className="px-4 py-3 text-center font-bridal text-[11px] uppercase tracking-[0.16em] text-bridal-text-label"
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row) => (
                <tr key={row.label} className="border-b border-bridal-beige/40 last:border-0">
                  <td className="px-4 py-3 font-bridal text-[13.5px] text-bridal-text">
                    {row.label}
                    {row.note && (
                      <span className="mt-0.5 block font-bridal text-[12px] text-bridal-text-label">
                        {row.note}
                      </span>
                    )}
                  </td>
                  {[row.basic, row.pro, row.premium].map((on, i) => (
                    <td key={i} className="px-4 py-3 text-center">
                      {on ? (
                        <Check
                          className="mx-auto h-4 w-4 text-bridal-gold-dark"
                          strokeWidth={2.5}
                          aria-label="Included"
                        />
                      ) : (
                        <Minus
                          className="mx-auto h-4 w-4 text-bridal-beige"
                          strokeWidth={2.5}
                          aria-label="Not included"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Billing terms ── */}
      <section className="border-y border-bridal-beige/60 bg-bridal-cream py-14">
        <div className="container-responsive">
          <h2 className="font-display text-[26px] italic text-bridal-charcoal">
            Billing and payment terms
          </h2>
          <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {[
              ["Currency", "All prices and invoices are in Pakistani Rupees (PKR)."],
              [
                "Billing cycle",
                "Monthly, in advance. Your plan runs for one month from the date it is activated.",
              ],
              [
                "Taxes",
                `${LEGAL_ENTITY_LINE} is not currently registered for sales tax, so no sales tax is added. Any tax that becomes applicable by law will be charged and shown on your invoice.`,
              ],
              [
                "How to pay",
                "Bank transfer against an invoice today. Card and mobile-wallet payment is being enabled through our licensed Pakistani payment processor.",
              ],
              [
                "Changing plans",
                "Upgrade, downgrade or cancel at any time from Plan & billing in your dashboard. Changes apply from your next billing month. No fee to move between plans.",
              ],
              [
                "Cancelling",
                "No lock-in and no cancellation charge. Your plan runs to the end of the month you have paid for, then stops.",
              ],
              [
                "If something is wrong",
                `Write to ${SUPPORT_EMAIL} or call ${SUPPORT_PHONE_DISPLAY}. We acknowledge ${TAT_FIRST_RESPONSE} and resolve ${TAT_RESOLUTION}. Approved refunds go back to the original payment method and typically reach a card in ${TAT_REFUND_TO_CARD}.`,
              ],
              [
                "Customer deposits",
                "Separate from your subscription. A deposit a customer places against a booking is held by us and released to you in full after the function is delivered. We deduct nothing from it.",
              ],
            ].map(([term, def]) => (
              <div key={term}>
                <dt className="font-bridal text-[11px] uppercase tracking-[0.18em] text-bridal-gold-dark">
                  {term}
                </dt>
                <dd className="mt-1.5 font-bridal text-[14px] leading-relaxed text-bridal-text-soft">
                  {def}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 font-bridal text-[13px] leading-relaxed text-bridal-text-soft">
            Full terms:{" "}
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

      {/* ── FAQ ── */}
      <section className="container-responsive py-14">
        <h2 className="font-display text-[26px] italic text-bridal-charcoal">
          Questions vendors ask
        </h2>
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

      {/* ── Who you are contracting with ── */}
      <section className="border-t border-bridal-beige/60 py-12">
        <div className="container-responsive">
          <h2 className="font-bridal text-[11px] uppercase tracking-[0.2em] text-bridal-gold-dark">
            Who you are paying
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
        </div>
      </section>
    </div>
  )
}
