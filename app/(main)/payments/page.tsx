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
 *   - Since 2026-08-29 the platform takes no customer payment at all, so
 *     nothing here describes a charge, a gateway or a refund made by us.
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

/**
 * Must stay identical to the "Vendors accept" strip in components/footer.tsx.
 *
 * Cards were removed from both on 2026-08-29: there is no platform checkout to
 * put a card through any more. Customers pay the vendor directly, so the only
 * rails that mean anything here are the ones a Pakistani vendor is actually
 * paid on.
 */
const METHODS = [
  {
    Icon: Wallet,
    title: "Mobile wallets",
    body: "JazzCash and Easypaisa, sent to the number the vendor publishes on your booking. You confirm the payment on your own registered wallet number.",
  },
  {
    Icon: Landmark,
    title: "Bank transfer",
    body: "Direct transfer to the vendor's own account. Their account details appear on the booking once it is accepted.",
  },
  {
    Icon: CreditCard,
    title: "Vendor subscriptions only",
    body: `The one thing ${SITE_NAME} does charge for is the vendor's monthly subscription. Cards are never used for a customer booking.`,
  },
]

/**
 * Rewritten 2026-08-29 for direct pay.
 *
 * Four of these answered questions that cannot arise any more — card storage,
 * the WEDDINGWALA statement descriptor, what the platform does with a deposit
 * it holds, and how the platform refunds one. Answering them at all kept alive
 * the idea that Wedding Wala sits between the couple and their money. It does
 * not, so the questions are replaced rather than reworded.
 *
 * `TAT_REFUND_TO_CARD` is deliberately no longer referenced: there is no card
 * to refund to.
 */
const FAQS = [
  {
    question: `Does ${SITE_NAME} take my payment?`,
    answer: `No. You pay the vendor directly, into the account they publish on your booking. ${SITE_NAME} never takes or holds your money, adds nothing to the vendor's price, and takes no commission out of it — we earn from the monthly subscription vendors pay to use the platform.`,
  },
  {
    question: "What will appear on my bank or wallet statement?",
    answer: "The vendor's own account name — because the money goes to them, not to us. You will not see a WEDDINGWALA entry for a booking. If you are ever asked to send a booking payment to an account that is not the one shown on your booking, stop and contact us.",
  },
  {
    question: "Then what is the point of recording the payment here?",
    answer: `So there is one shared history. After you transfer, you enter the reference and a screenshot; the vendor matches it in their own account and confirms it on the booking. Both of you then see the same record of what was paid and when — which is exactly what is missing when a wedding is settled over WhatsApp.`,
  },
  {
    question: "What currency are payments in?",
    answer: "Pakistani Rupees (PKR). The price shown on the vendor's listing is the price you pay them — nothing is converted, and no service charge is added.",
  },
  {
    question: "What if the vendor cancels, or does not deliver?",
    answer: `Because the money went straight to the vendor, a refund is arranged with that vendor — ${SITE_NAME} is not holding anything to refund on their behalf. What we do hold is the record: the booking, its terms, and every payment you reported. If the vendor will not engage, raise a complaint with us and we will take it up with them.`,
  },
  {
    question: "Is it safe to use this site?",
    answer: `Every page is served over HTTPS. We never ask for your card PIN, your internet-banking password, or an OTP — by email, phone or WhatsApp, ever. And because ${SITE_NAME} never collects a booking payment, anyone asking you to pay ${SITE_NAME} for a booking is not us.`,
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
            {/* Rewritten 2026-08-29. Step 2 was literally captioned "We hold
                it" — "the money stays with us" — which describes a custody
                arrangement the platform does not have and is not licensed for.
                The money never touches Wedding Wala. */}
            {[
              [
                "The venue accepts",
                "Nothing is due while your request is waiting. Once the vendor accepts, their payment details appear on your booking.",
              ],
              [
                "You pay the vendor",
                `Straight to their account — bank transfer, JazzCash or Easypaisa. ${SITE_NAME} never takes or holds the money, and adds nothing to the vendor's price.`,
              ],
              [
                "You record what you sent",
                "Enter the transfer reference and a screenshot. The vendor matches it against their account and confirms it on the booking.",
              ],
              [
                "Both of you keep the record",
                `Every payment stays on the booking with its reference and date, so what was paid is never one person's word against another's. ${SITE_NAME} earns from the vendor's monthly subscription, not from your wedding.`,
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
              /* Rewritten 2026-08-29. Three of these described a card charge
                 taken by the platform: an "unrecognised WEDDINGWALA line", a
                 failed gateway transaction, and chargebacks. None can happen
                 when the money never reaches us. What CAN go wrong now is
                 different, and this says so. */
              [
                "Talk to us first",
                `Open the booking and raise a dispute, or write to ${SUPPORT_EMAIL}. We acknowledge ${TAT_FIRST_RESPONSE} and resolve ${TAT_RESOLUTION}. We cannot move money on the vendor's behalf, but we hold the record of the booking and of what you paid, which is what settles most of these.`,
              ],
              [
                "The vendor says they never got it",
                "Open the booking and check the reference and screenshot you recorded against the account shown on it. Bank and wallet transfers can take a few hours to appear. If it was sent to a different account from the one on the booking, tell us immediately.",
              ],
              [
                "Asked to pay somewhere else",
                "The only account you should ever send a booking payment to is the one published on your booking. Nobody at Wedding Wala will ask you to pay us for a booking, or to send money to a personal account. Report it to us.",
              ],
              [
                "The vendor cancelled",
                "A refund comes from the vendor, because they hold the money. Raise a dispute on the booking so the terms and the payment record are in one place, and we will take it up with them.",
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
