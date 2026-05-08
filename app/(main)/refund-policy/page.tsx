import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/legal-page-shell"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Refund Policy",
  description: `When and how ${SITE_NAME} issues refunds. Timelines, eligibility, and how refunds are credited back to your card.`,
  path: "/refund-policy",
})

export default function RefundPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Refunds"
      title="Refund Policy"
      lastUpdated="2026-05-07"
      breadcrumbs={[{ name: "Refund Policy", href: "/refund-policy" }]}
      intro={
        <p>
          This policy explains when {SITE_NAME} issues refunds, how long they take,
          and how they reach your account. Read alongside the{" "}
          <Link href="/cancellation-policy">Cancellation Policy</Link>.
        </p>
      }
    >
      <h2>1. When you are eligible for a refund</h2>
      <ul>
        <li><strong>Vendor cancellation</strong> — if a vendor cancels a confirmed booking, you receive a full refund of all amounts paid.</li>
        <li><strong>Vendor non-delivery / no-show</strong> — if the vendor fails to deliver the agreed service on the agreed date, you are eligible for a full refund less any work already performed and accepted.</li>
        <li><strong>Customer cancellation</strong> — refund amount depends on the timing of cancellation and the vendor&apos;s cancellation tier (Strict / Moderate / Flexible). See the <Link href="/cancellation-policy">Cancellation Policy</Link> for the matrix.</li>
        <li><strong>Force majeure</strong> — refund or rescheduling per the force-majeure provisions in the Cancellation Policy.</li>
        <li><strong>Service quality dispute</strong> — partial or full refund may be issued through our dispute process. Open a dispute via your booking page within 14 days of the event date.</li>
      </ul>

      <h2>2. How refunds reach you</h2>
      <p>
        Refunds are credited <strong>back to the original payment method</strong>.
        We do not refund to a different card, bank account, or cash equivalent.
        This is a card-network rule and a security measure.
      </p>
      <ul>
        <li>Card refunds typically reach your statement in <strong>10–12 working days</strong> after we initiate the refund (timing is set by your bank, not by {SITE_NAME}).</li>
        <li>JazzCash / Easypaisa refunds typically clear in 3–7 working days.</li>
        <li>You will receive an email confirmation when we initiate the refund.</li>
      </ul>

      <h2>3. Platform fees</h2>
      <p>
        For cancellations within the eligible window, {SITE_NAME}&apos;s platform
        fee is refunded along with the booking amount. For cancellations outside
        the eligible window, the platform fee is non-refundable. <strong>[LEGAL REVIEW]</strong>
      </p>

      <h2>4. How to request a refund</h2>
      <ol>
        <li>Open the booking from your <Link href="/user/bookings">Bookings</Link> page.</li>
        <li>Click <em>Request refund</em> and tell us what happened.</li>
        <li>We acknowledge within 48 hours and resolve within 14 days under normal circumstances. Complex disputes may take longer; we will keep you informed.</li>
      </ol>

      <h2>5. Chargebacks</h2>
      <p>
        If you raise a chargeback with your card issuer, please also open a
        dispute with us. Chargebacks are not faster than our refund process and
        can complicate cases where a partial refund is appropriate.
      </p>

      <h2>6. No refund scenarios</h2>
      <ul>
        <li>Services already rendered and accepted in writing or by completion of the event.</li>
        <li>Customer no-show on the event date.</li>
        <li>Cancellation due to a customer&apos;s breach of the vendor&apos;s reasonable conditions (e.g. unsafe behaviour, illegal use of the venue).</li>
      </ul>

      <h2>7. Contact</h2>
      <p>
        Refund questions: open a dispute on the booking, or visit{" "}
        <Link href="/contact">Contact</Link>. Persistent issues can be escalated
        through our <Link href="/complaints">Complaints process</Link>.
      </p>
    </LegalPageShell>
  )
}
