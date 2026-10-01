import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/legal-page-shell"
import { buildPageMetadata, SITE_NAME, SUPPORT_EMAIL } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Vendor Subscription Policy",
  description: `How vendors pay for the ${SITE_NAME} portal: monthly plans billed through Safepay, cancellation, plan changes, failed payments and refunds.`,
  path: "/vendor-subscription-policy",
})

export default function VendorSubscriptionPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Vendors"
      title="Vendor Subscription Policy"
      lastUpdated="2026-10-02"
      breadcrumbs={[{ name: "Vendor Subscription Policy", href: "/vendor-subscription-policy" }]}
      intro={
        <p>
          This policy covers the monthly subscription a vendor pays {SITE_NAME} for the
          vendor portal. It is separate from wedding bookings and the money couples pay
          vendors, which the <Link href="/refund-policy">Refund Policy</Link> and{" "}
          <Link href="/cancellation-policy">Cancellation Policy</Link> cover.
        </p>
      }
    >
      <h2>1. Plans and prices</h2>
      <p>
        The portal is sold in monthly plans. The current prices are shown on the Billing
        page inside the portal and on the <Link href="/pricing">pricing page</Link>, in
        Pakistani rupees. {SITE_NAME} is not registered for sales tax, so no sales tax is
        added. If a price changes, existing subscribers are told at least 30 days before
        the new price applies to their next renewal.
      </p>

      <h2>2. How payment works</h2>
      <ul>
        <li>
          <strong>Safepay.</strong> Subscriptions are billed through Safepay, a payment
          service provider regulated by the State Bank of Pakistan. To pay, you create a
          Safepay account on Safepay&apos;s own secure page and save a Visa or Mastercard
          there. {SITE_NAME} never sees or stores your card number, expiry or CVV.
        </li>
        <li>
          <strong>Automatic renewal.</strong> Your plan renews every month on the day you
          first paid. Safepay charges the saved card and the portal stays open. You can
          change the card at any time from Billing (&quot;Card badlein&quot;).
        </li>
        <li>
          <strong>Receipts.</strong> Every successful charge produces a numbered receipt
          (for example WW-SUB-2026-00012). It is emailed to you and listed under Billing
          history, where you can print it or save it as a PDF.
        </li>
      </ul>

      <h2>3. If a payment fails</h2>
      <p>
        If Safepay cannot charge your card, we email you and show the plan as past due.
        Safepay retries over the following days. Your portal stays open for a grace
        period of 3 days after the paid period ends. If no payment goes through by then,
        the portal closes until you subscribe again. Your listing stays visible to
        couples, and your bookings, khata and records are kept.
      </p>

      <h2>4. Cancelling</h2>
      <ul>
        <li>You can cancel at any time from Billing. No further charge is taken.</li>
        <li>You keep full access until the end of the period you have already paid for.</li>
        <li>Unused days of a cancelled plan are not refunded.</li>
        <li>You can subscribe again whenever you like; a new paid period starts on that day.</li>
      </ul>

      <h2>5. Changing plans</h2>
      <p>
        You can move to a higher or lower plan at any time from Billing. The change is
        immediate: you pay the new plan&apos;s monthly price today, and the unused days of
        your old plan are converted into extra days on the new plan at the ratio of the
        two prices. Billing shows you the exact credit before you confirm. The old plan
        is cancelled automatically, so you are never charged for two plans.
      </p>

      <h2>6. Refunds</h2>
      <ul>
        <li>Subscription charges are not refunded for partial months or unused days.</li>
        <li>
          A duplicate or mistaken charge is refunded in full. Tell us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> within 14 days of the
          charge and we will record the refund on your receipt and return the money through
          Safepay to the card you paid with, normally within 7 working days. Banks can take
          a further 5 to 10 working days to show it.
        </li>
      </ul>

      <h2>7. Pausing</h2>
      <p>
        If your business closes for a season, write to us and we can pause collection.
        No charges are taken while a plan is paused; the portal stays open to the end of
        the paid period and reopens when the plan resumes and is paid.
      </p>

      <h2>8. Your responsibilities</h2>
      <ul>
        <li>Keep a valid card saved with Safepay and enough balance for the monthly charge.</li>
        <li>Keep the email address on your account current; receipts and payment notices go there.</li>
        <li>The portal subscription is for your own business. One subscription covers one vendor account and its venues.</li>
      </ul>

      <h2>9. Changes to this policy</h2>
      <p>
        We may update this policy. Material changes are announced in the portal and by
        email at least 30 days before they take effect. Continuing to use the portal after
        that date means you accept the updated policy.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about a charge, a receipt or your plan: {" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalPageShell>
  )
}
