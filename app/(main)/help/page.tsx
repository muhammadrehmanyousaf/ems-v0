import Link from "next/link"
import type { Metadata } from "next"
import {
  Calendar,
  CreditCard,
  Star,
  Shield,
  MessageCircle,
  HelpCircle,
  ScrollText,
  Users,
} from "lucide-react"
import {
  buildPageMetadata,
  SITE_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  faqLD,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"

export const metadata: Metadata = buildPageMetadata({
  title: "Help & support",
  description: `Answers to common questions about booking wedding vendors on ${SITE_NAME} — payments, refunds, cancellations, vendor verification, account security, and how Pakistani weddings work on the platform.`,
  path: "/help",
})

interface FaqItem {
  q: string
  a: string
}

interface FaqCategory {
  category: string
  Icon: typeof Calendar
  intro: string
  items: FaqItem[]
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    category: "Booking",
    Icon: Calendar,
    intro: "How discovery, shortlisting, and confirming a booking work.",
    items: [
      {
        q: "How do I book a vendor on Wedding Wala?",
        a: `Browse vendors, pick one, choose your event date, and click "Check availability". You enter the booking details, pay the deposit, and the vendor confirms within 24 hours. ${SITE_NAME} holds the deposit until the vendor accepts — if they decline, you're refunded in full automatically.`,
      },
      {
        q: "Can I book multiple vendors for one wedding?",
        a: `Yes. Most Pakistani weddings need 4–7 vendors (venue, photographer, caterer, decorator, mehndi artist, makeup artist, planner). You book each separately on ${SITE_NAME} — the platform tracks them all under My Bookings.`,
      },
      {
        q: "Can I book mehndi, baraat, and walima as separate dates?",
        a: "Yes. Multi-day weddings are the norm in Pakistan. You can book the same vendor for multiple dates (e.g. one photographer across all three functions) or different vendors per function. The platform handles each booking separately so the deposit and refund logic is clean per function.",
      },
      {
        q: "How far in advance should I book?",
        a: "For peak shaadi season (October–February): 6–9 months ahead for venues and top-tier photographers, 4–6 months for everything else. Off-season weddings can be booked 2–3 months out. Top vendors fill up faster than venues — book the date AND the vendor as soon as you're committed.",
      },
      {
        q: "Can I cancel a booking?",
        a: "Yes — from My Bookings, click \"Cancel\". Refund amount depends on the vendor's published cancellation tier (Flexible / Moderate / Strict) and how far out you cancel. You see the refund amount BEFORE confirming the cancellation. See our Cancellation Policy for the full matrix.",
      },
      {
        q: "What if a vendor cancels on me?",
        a: `If a vendor cancels a confirmed booking, you receive a full refund of all amounts paid — automatically, no chasing. ${SITE_NAME} also helps you find a replacement vendor at no additional platform fee.`,
      },
    ],
  },
  {
    category: "Payments",
    Icon: CreditCard,
    intro: "How money moves through Wedding Wala — deposits, balances, refunds.",
    items: [
      {
        q: "What payment methods does Wedding Wala accept?",
        a: "Cards (Visa, Mastercard, UnionPay) processed through licensed Pakistani payment gateways, plus JazzCash, Easypaisa, and direct bank transfer for some vendors. Every card payment is secured end-to-end — we never store your full card details.",
      },
      {
        q: "Why is the customer-facing card-statement descriptor 'WEDDINGWALA' rather than the vendor's name?",
        a: `Because ${SITE_NAME} is a marketplace and the platform collects the payment on the vendor's behalf. The descriptor identifies us — the operator who handled the transaction — which is what card networks require for marketplace transactions. The vendor receives their share via payout from the platform after the event.`,
      },
      {
        q: "Do I have to pay the full amount upfront?",
        a: "No. Most vendors require a deposit (typically 20–50% of the total) at booking, with the balance due closer to the event date as set out in your booking. Some vendors allow installments — visible at booking time.",
      },
      {
        q: "How do refunds work?",
        a: "Refunds are credited back to your ORIGINAL payment method — that's a card-network rule, not just our preference. Card refunds reach your statement in 10–12 working days (timing set by your bank). JazzCash / Easypaisa refunds typically clear in 3–7 working days. You'll receive an email confirmation when we initiate the refund.",
      },
      {
        q: "What if I want to dispute a charge?",
        a: `Open a dispute on the booking page first — that's faster than a chargeback. Our team responds within 48 hours and resolves within 14 days. If you raise a chargeback with your card issuer instead, please also open a dispute with us so we can help — chargebacks aren't faster than our refund process and complicate cases where a partial refund is appropriate.`,
      },
    ],
  },
  {
    category: "Vendors & verification",
    Icon: Users,
    intro: "How we vet vendors and what \"verified\" means on Wedding Wala.",
    items: [
      {
        q: "Are vendors on Wedding Wala verified?",
        a: `Yes. Every vendor passes a portfolio + identity + reviews check before going live on ${SITE_NAME}. We verify CNIC, business address, and a working contact number. Vendors who can't produce these never list.`,
      },
      {
        q: "Can vendors fake their reviews?",
        a: `No. Reviews can only be submitted by customers who have completed a booking on ${SITE_NAME}. Couples can only review a vendor after the wedding date passes. We don't accept reviews from outside the platform, and we don't allow incentivised ratings.`,
      },
      {
        q: "What happens if a vendor doesn't show up?",
        a: "Open a dispute on the booking page within 14 days of the event date. Our team reviews evidence from both sides and applies the Refund Policy. Vendors with no-show patterns are suspended.",
      },
      {
        q: "Can I message a vendor before booking?",
        a: "Yes. Every vendor profile has a \"Chat\" or \"Ask a question\" button. Messages thread inside the vendor's Wedding Wala dashboard — no WhatsApp number leakage, no off-platform-only conversations.",
      },
    ],
  },
  {
    category: "Reviews",
    Icon: Star,
    intro: "How reviews work — for customers and for vendors.",
    items: [
      {
        q: "How do I leave a review?",
        a: "After your event date passes, the booking shows up under My Bookings with a \"Leave a review\" button. Rate 1–5 stars and write what you actually thought. Reviews can't be edited after submission, so write what you'd want a friend to read.",
      },
      {
        q: "Can vendors respond to reviews?",
        a: "Yes. Vendor responses appear under your review on their profile. We don't allow vendors to delete or hide negative reviews — but they can reply and provide context.",
      },
      {
        q: "What if a vendor pressures me to change a review?",
        a: `That's a Terms violation. Email ${SUPPORT_EMAIL} with the conversation context — we'll investigate. Persistent pressuring of customers around reviews is grounds for vendor suspension.`,
      },
    ],
  },
  {
    category: "Account & security",
    Icon: Shield,
    intro: "Account, password, two-factor, and how we handle your data.",
    items: [
      {
        q: "How do I reset my password?",
        a: "Click \"Forgot password\" on the login page or go to Profile > Change Password if signed in. We email you a secure link that expires in 1 hour. For security, you're logged out of all devices after changing your password.",
      },
      {
        q: "Is my payment information safe?",
        a: `Yes. ${SITE_NAME} never stores your full card number, CVV, or expiry date. All card data is handled by our PCI-DSS-compliant payment processor. We only store payment metadata — status, amount, last-4 digits, processor reference — for receipts and dispute handling.`,
      },
      {
        q: "Can I enable two-factor authentication?",
        a: "Yes — Profile > Security > Two-factor authentication. We support TOTP (Google Authenticator, 1Password, Authy). Strongly recommended for vendor accounts since they hold business data.",
      },
      {
        q: "How do I delete my account?",
        a: `Email ${SUPPORT_EMAIL} from your registered email address with the subject "Delete my account". We delete personal data within 30 days, retaining only the records we're legally required to keep (booking + payment history under Pakistani tax law). Read our Privacy Policy for the full retention schedule.`,
      },
    ],
  },
  {
    category: "Policies & legal",
    Icon: ScrollText,
    intro: "Where to find every policy you might need.",
    items: [
      {
        q: "Where can I read all your policies?",
        a: "Footer links cover all 10 active policies: Terms, Privacy, Refund, Cancellation, Service Delivery, Cookie, Acceptable Use, AML, Disclaimer, and Complaints. Each has a clear \"Last reviewed\" date and policy version.",
      },
      {
        q: "How do I file a formal complaint?",
        a: `Open a dispute on the booking if it's a specific booking. For everything else, email ${SUPPORT_EMAIL} with subject "Complaint — [your name / booking ID]". We acknowledge complaints within 48 hours and resolve within 14 working days. See our Complaints Procedure for the full escalation path.`,
      },
      {
        q: "What's the governing law?",
        a: "Laws of the Islamic Republic of Pakistan. See our Terms of Service for the full disputes clause.",
      },
    ],
  },
]

export default function HelpPage() {
  const allFaqs: FaqItem[] = FAQ_CATEGORIES.flatMap((c) => c.items)

  const ld = faqLD(
    allFaqs.map((it) => ({ question: it.q, answer: it.a })),
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="min-h-screen">
        <section className="bg-gradient-to-br from-bridal-gold to-bridal-gold-dark text-white py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-bridal-cream" />
            <h1 className="font-display italic text-4xl sm:text-5xl mb-4 leading-tight">
              Help & support
            </h1>
            <p className="font-bridal text-lg text-bridal-cream max-w-xl mx-auto">
              Answers to common questions about booking Pakistani wedding
              vendors on {SITE_NAME}.
            </p>
          </div>
        </section>

        <div className="container-responsive pt-6">
          <Breadcrumbs items={[{ name: "Help", href: "/help" }]} />
        </div>

        <section className="py-12 px-4 bg-neutral-50">
          <div className="max-w-3xl mx-auto space-y-12">
            {FAQ_CATEGORIES.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex w-9 h-9 rounded-full bg-bridal-gold/15 border border-bridal-gold/45 items-center justify-center">
                    <cat.Icon className="w-4 h-4 text-bridal-gold-dark" />
                  </span>
                  <h2 className="font-display italic text-[24px] text-bridal-charcoal">
                    {cat.category}
                  </h2>
                </div>
                <p className="font-bridal text-[13.5px] text-bridal-text-soft mb-5 ml-12">
                  {cat.intro}
                </p>
                <ul className="space-y-2">
                  {cat.items.map((item) => (
                    <li key={item.q}>
                      <details className="group rounded-md border border-bridal-beige bg-white open:bg-bridal-cream/40 transition-colors">
                        <summary className="cursor-pointer list-none flex items-center justify-between gap-4 p-4 font-bridal text-[14.5px] font-medium text-bridal-charcoal hover:text-bridal-gold transition-colors">
                          <span>{item.q}</span>
                          <span
                            aria-hidden
                            className="flex-shrink-0 text-bridal-gold transition-transform group-open:rotate-180"
                          >
                            ▾
                          </span>
                        </summary>
                        <div className="px-4 pb-4 font-bridal text-[14px] text-bridal-text leading-relaxed">
                          {item.a}
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12 px-4 bg-white border-t border-bridal-beige">
          <div className="max-w-2xl mx-auto text-center">
            <MessageCircle className="w-10 h-10 text-bridal-gold-dark mx-auto mb-4" />
            <h2 className="font-display italic text-2xl text-bridal-charcoal mb-2">
              Still need help?
            </h2>
            <p className="font-bridal text-[14px] text-bridal-text mb-6">
              Our support team is based in Pakistan and replies in English or Urdu.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center justify-center px-5 h-11 rounded-full bg-bridal-gold text-white font-bridal text-[14px] font-medium hover:bg-bridal-gold-dark transition-colors"
              >
                Email {SUPPORT_EMAIL}
              </a>
              <a
                href={SUPPORT_PHONE_TEL}
                className="inline-flex items-center justify-center px-5 h-11 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[14px] text-bridal-charcoal transition-colors"
              >
                Call {SUPPORT_PHONE_DISPLAY}
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-5 h-11 font-bridal text-[14px] text-bridal-text-soft hover:text-bridal-charcoal transition-colors"
              >
                Or open a contact ticket
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
