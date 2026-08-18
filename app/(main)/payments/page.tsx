/**
 * Payments & security — /payments
 *
 * The page a payment processor's merchant review looks for and the site did
 * not have: what we accept, who processes it, what we never store, what shows
 * on a card statement, and how money comes back when something goes wrong.
 *
 * Every claim here is deliberately checkable:
 *   - Accepted methods mirror the footer's "We accept" strip exactly. Adding a
 *     method here without adding it there would put two different answers on
 *     the same site.
 *   - The processor is described as "a State Bank of Pakistan-licensed payment
 *     gateway" rather than named, because naming a specific gateway before its
 *     underwriting completes would claim a live integration we do not yet have.
 *   - Refund timings match /refund-policy and the card-network reality
 *     (TAT_REFUND_TO_CARD), not an optimistic number.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { ShieldCheck, CreditCard, Wallet, Landmark, RotateCcw, Lock } from "lucide-react"
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
  TAT_FIRST_RESPONSE,
  TAT_RESOLUTION,
  TAT_REFUND_TO_CARD,
  faqLD,
  combineGraph,
  safeJsonLd,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"

export const metadata: Metadata = buildPageMetadata({
  title: "Payments & security",
  description: `How payments work on ${SITE_NAME} — accepted methods, how your card details are protected, what appears on your statement, and how refunds are returned. All amounts in PKR.`,
  path: "/payments",
})

/** Must stay identical to the "We accept" strip in components/footer.tsx. */
const METHODS = [
  {
    Icon: CreditCard,
    title: "Payment cards",
    body: "Visa, Mastercard and UnionPay. Card payments are confirmed with a One-Time Password sent by your own bank.",
  },
  {
    Icon: Wallet,
    title: "Mobile wallets",
    body: "JazzCash and Easypaisa. You confirm the payment on your registered wallet number.",
  },
  {
    Icon: Landmark,
    title: "Bank transfer",
    body: "Direct transfer from your bank account. Useful for larger balances and for vendors paying a subscription invoice.",
  },
]

const FAQS = [
  {
    question: `Does ${SITE_NAME} store my card number?`,
    answer: `No. Card details are entered on the payment gateway's own secure page and are never stored on ${SITE_NAME}'s servers. We keep only the transaction reference, the amount, and the last four digits so you can recognise the payment in your history.`,
  },
  {
    question: "What will appear on my card or bank statement?",
    answer: `Your statement will read WEDDINGWALA — not the vendor's business name. This is normal for marketplace transactions and is required by card-network rules. If you do not recognise a WEDDINGWALA charge, contact us before raising a chargeback and we will identify the booking for you.`,
  },
  {
    question: "What currency are payments taken in?",
    answer: "All payments are taken in Pakistani Rupees (PKR). Prices shown on the site are the prices charged — nothing is converted, and no separate service charge is added at checkout.",
  },
  {
    question: "What happens to my deposit after I pay it?",
    answer: `${SITE_NAME} holds it. The vendor does not receive the deposit at the moment you pay — we release it to them in full after your function has been delivered and the booking is marked complete. That is what makes a cancelled date recoverable instead of a chase.`,
  },
  {
    question: "How long does a refund take?",
    answer: `Once we approve and initiate a refund it goes back to the original payment method — we cannot send it to a different card or account, which is a card-network rule and a fraud protection. A card refund typically appears in ${TAT_REFUND_TO_CARD}; JazzCash and Easypaisa usually clear in 3–7 working days. The timing after we initiate is set by your bank, not by us.`,
  },
  {
    question: "My payment failed but the money left my account. What now?",
    answer: `A failed transaction is normally reversed automatically within 7 working days of the transaction date. If it has not returned by then, contact us at ${SUPPORT_EMAIL} with the date, amount and your account or card's last four digits and we will trace it with the payment gateway.`,
  },
  {
    question: "Is it safe to pay on this site?",
    answer: "Every page is served over HTTPS, card and wallet payments are handled by a State Bank of Pakistan-licensed payment gateway, and card transactions require a One-Time Password from your own bank before they complete. We never ask for your card PIN, your full card number, or your internet-banking password — by email, phone or WhatsApp.",
  },
]

const NEVER_ASK = [
  "Your card PIN",
  "Your internet-banking password",
  "An OTP sent to your phone",
  "Payment to a personal account outside the platform",
]

export default function PaymentsPage() {
  // <Breadcrumbs> below already emits the BreadcrumbList node.
  const jsonLd = combineGraph(faqLD(FAQS), {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Payments & security — ${SITE_NAME}`,
    url: `${SITE_URL}/payments`,
    publisher: { "@id": `${SITE_URL}#organization` },
    inLanguage: "en-PK",
  })

  return (
    <div className="bg-bridal-ivory">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <div className="container-responsive pt-6">
        <Breadcrumbs items={[{ name: "Payments & security", href: "/payments" }]} />
      </div>

      {/* ── Hero ── */}
      <section className="container-responsive pb-12 pt-8 sm:pt-12">
        <p className="font-bridal text-[10.5px] font-medium uppercase tracking-[0.24em] text-bridal-gold">
          Payments &amp; security
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-[34px] italic leading-[1.12] text-bridal-charcoal sm:text-[46px]">
          Your money is held, not handed over.
        </h1>
        <p className="mt-5 max-w-2xl font-bridal text-[15.5px] leading-relaxed text-bridal-text-soft">
          Everything on {SITE_NAME} is charged in Pakistani Rupees through a State Bank of
          Pakistan-licensed payment gateway. Your card details never reach our servers, your deposit
          stays with us until your function has actually happened, and if something goes wrong the
          money goes back the way it came.
        </p>
      </section>

      {/* ── Accepted methods ── */}
      <section className="container-responsive pb-14">
        <h2 className="font-display text-[26px] italic text-bridal-charcoal">What you can pay with</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {METHODS.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-bridal-beige/70 bg-white p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bridal-blush">
                <Icon className="h-4.5 w-4.5 text-bridal-gold-dark" strokeWidth={1.7} />
              </span>
              <h3 className="mt-3 font-bridal text-[15px] font-medium text-bridal-charcoal">{title}</h3>
              <p className="mt-1.5 font-bridal text-[13.5px] leading-relaxed text-bridal-text-soft">
                {body}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-5 font-bridal text-[12.5px] leading-relaxed text-bridal-text-soft">
          All amounts are in PKR. The price shown is the price charged — {SITE_NAME} adds no service
          charge at checkout.
        </p>
      </section>

      {/* ── The journey of a payment ── */}
      <section className="border-y border-bridal-beige/60 bg-bridal-cream py-14">
        <div className="container-responsive">
          <h2 className="font-display text-[26px] italic text-bridal-charcoal">
            Where your money actually goes
          </h2>
          <ol className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "You pay a deposit",
                `The gateway takes the payment and confirms it with an OTP from your bank. ${SITE_NAME} receives the confirmation, not your card number.`,
              ],
              [
                "We hold it",
                "The vendor is told the date is secured, but the money stays with us. Nothing is released at this point.",
              ],
              [
                "Your function happens",
                "The vendor delivers. You or the vendor marks the booking complete; if neither does, we auto-confirm from the event date once the dispute window has passed.",
              ],
              [
                "The vendor is paid",
                "We release the deposit to the vendor in full. We deduct no commission from it — vendors pay us a monthly subscription instead.",
              ],
            ].map(([title, body], i) => (
              <li key={title}>
                <p className="font-bridal text-[10.5px] uppercase tracking-[0.2em] text-bridal-text-label">
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

      {/* ── Security ── */}
      <section className="container-responsive py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-[26px] italic text-bridal-charcoal">
              How your details are protected
            </h2>
            <ul className="mt-5 space-y-3">
              {[
                [Lock, "Card details never reach us", "You enter them on the gateway's own secure page. We store the transaction reference, the amount and the last four digits — nothing else."],
                [ShieldCheck, "Every card payment needs your bank's OTP", "A one-time password sent to your registered number has to be entered before the transaction completes."],
                [RotateCcw, "Refunds only go back the way they came", "We cannot redirect a refund to a different card or account. That is a card-network rule, and it is what stops a refund being diverted."],
              ].map(([Icon, title, body]: any) => (
                <li key={title} className="flex gap-3 rounded-xl border border-bridal-beige/60 bg-white p-4">
                  <Icon className="mt-0.5 h-4.5 w-4.5 flex-shrink-0 text-bridal-gold-dark" strokeWidth={1.7} />
                  <div>
                    <p className="font-bridal text-[14px] font-medium text-bridal-charcoal">{title}</p>
                    <p className="mt-1 font-bridal text-[13px] leading-relaxed text-bridal-text-soft">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-[26px] italic text-bridal-charcoal">
              We will never ask you for
            </h2>
            <p className="mt-3 font-bridal text-[13.5px] leading-relaxed text-bridal-text-soft">
              Nobody from {SITE_NAME} will request any of the following — by email, phone, SMS or
              WhatsApp. If someone does, they are not us. Report it to {SUPPORT_EMAIL}.
            </p>
            <ul className="mt-5 space-y-2.5">
              {NEVER_ASK.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 rounded-xl border border-bridal-beige/60 bg-white px-4 py-3 font-bridal text-[13.5px] text-bridal-text"
                >
                  <span className="font-bridal text-[15px] leading-none text-bridal-coral">✕</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 font-bridal text-[13px] leading-relaxed text-bridal-text-soft">
              Pay only through the booking page on {SITE_NAME}. A vendor asking you to transfer to a
              personal account leaves you with no deposit protection and no refund route.
            </p>
          </div>
        </div>
      </section>

      {/* ── If something goes wrong ── */}
      <section className="border-y border-bridal-beige/60 bg-bridal-cream py-14">
        <div className="container-responsive">
          <h2 className="font-display text-[26px] italic text-bridal-charcoal">
            If something goes wrong
          </h2>
          <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {[
              [
                "Talk to us first",
                `Open the booking and raise a dispute, or write to ${SUPPORT_EMAIL}. We acknowledge ${TAT_FIRST_RESPONSE} and resolve ${TAT_RESOLUTION}. This is almost always faster than a chargeback.`,
              ],
              [
                "Unrecognised charge",
                "A WEDDINGWALA line you do not recognise is usually a booking made by someone else in your household. Contact us with the date and amount and we will identify it.",
              ],
              [
                "Failed payment, money debited",
                "Normally reversed automatically within 7 working days of the transaction date. If it has not returned, contact us and we will trace it with the gateway.",
              ],
              [
                "Chargebacks",
                "You can raise one with your bank, and you should also open a dispute with us. A chargeback is not faster than our own process and it complicates cases where a partial refund is the fair outcome.",
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
            Read next:{" "}
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
            <Link href="/complaints" className="text-bridal-gold-dark underline">
              Complaints process
            </Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="container-responsive py-14">
        <h2 className="font-display text-[26px] italic text-bridal-charcoal">
          Questions about paying
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

      {/* ── Who takes the payment ── */}
      <section className="border-t border-bridal-beige/60 py-12">
        <div className="container-responsive">
          <h2 className="font-bridal text-[11px] uppercase tracking-[0.2em] text-bridal-gold-dark">
            Who takes the payment
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
