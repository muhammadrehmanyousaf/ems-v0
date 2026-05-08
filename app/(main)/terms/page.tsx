import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/legal-page-shell"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Service",
  description: `The legal contract between you and ${SITE_NAME} when you use the platform — booking, payments, marketplace rules, vendor obligations, and dispute resolution.`,
  path: "/terms",
})

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Terms of Service"
      lastUpdated="2026-05-07"
      breadcrumbs={[{ name: "Terms of Service", href: "/terms" }]}
      intro={
        <p>
          These Terms govern your use of {SITE_NAME} (&quot;the platform&quot;,
          &quot;we&quot;). By creating an account or making a booking you agree to
          these Terms, the <Link href="/privacy">Privacy Policy</Link>, the{" "}
          <Link href="/refund-policy">Refund Policy</Link>, the{" "}
          <Link href="/cancellation-policy">Cancellation Policy</Link>, and the{" "}
          <Link href="/acceptable-use">Acceptable Use Policy</Link>. If you do not
          agree, do not use the platform.
        </p>
      }
    >
      <h2>1. The service we provide</h2>
      <p>
        {SITE_NAME} is an <strong>online marketplace</strong> connecting Pakistani
        couples (&quot;Customers&quot;) with independent wedding and event vendors
        (&quot;Vendors&quot;). We are an intermediary. The actual wedding services
        — venue, photography, catering, decor, planning, etc. — are delivered by
        the Vendor, not by {SITE_NAME}.
      </p>
      <p>
        We collect your payments on behalf of the Vendor, hold the deposit
        through a regulated payment processor, and disburse funds to the Vendor
        according to our payout schedule and the Refund Policy.
      </p>

      <h2>2. Account registration</h2>
      <ul>
        <li>You must be at least 18 years old.</li>
        <li>You must provide accurate, current information and keep it updated.</li>
        <li>You are responsible for all activity on your account. Keep your password secret.</li>
        <li>One person, one account. Vendors operate business accounts which can have multiple authorized users.</li>
      </ul>

      <h2>3. Bookings and payments</h2>
      <ul>
        <li>Vendor pricing on the platform is set by the Vendor, in PKR.</li>
        <li>To confirm a booking you pay a deposit (typically the down-payment); the balance is due as set out in your booking.</li>
        <li>Payments are processed by our licensed payment processor. {SITE_NAME} does not store your full card details.</li>
        <li>The customer-facing card-statement descriptor is &quot;WEDDINGWALA&quot; (or our registered DBA). <strong>[LEGAL REVIEW]</strong></li>
        <li>Once you make a booking you enter into a contract <em>with the Vendor</em>, mediated by {SITE_NAME}.</li>
      </ul>

      <h2>4. Cancellations and refunds</h2>
      <p>
        Cancellation rules are governed by our{" "}
        <Link href="/cancellation-policy">Cancellation Policy</Link>. Refund timing
        and method are governed by the{" "}
        <Link href="/refund-policy">Refund Policy</Link>. Where the Vendor sets a
        custom cancellation policy, the stricter of the Vendor policy and our
        platform policy applies (we never let a Vendor restrict your statutory
        rights).
      </p>

      <h2>5. Vendor obligations</h2>
      <ul>
        <li>Provide accurate listings — pricing, availability, services described.</li>
        <li>Hold any licences and insurance required for their service in Pakistan.</li>
        <li>Deliver the agreed service on the agreed date. If the Vendor cannot deliver, notify {SITE_NAME} immediately so we can help find a replacement and refund where appropriate.</li>
        <li>Maintain professional conduct in all customer communications.</li>
        <li>Comply with our <Link href="/acceptable-use">Acceptable Use Policy</Link>.</li>
      </ul>

      <h2>6. Customer obligations</h2>
      <ul>
        <li>Provide accurate information when booking.</li>
        <li>Pay agreed amounts on time.</li>
        <li>Respect Vendor staff, premises, and other guests.</li>
        <li>Do not post fake reviews or use the platform to harass or defraud anyone.</li>
      </ul>

      <h2>7. Reviews</h2>
      <p>
        Reviews can only be submitted by Customers who have completed a booking.
        Reviews must be honest, factual, and respectful. {SITE_NAME} may remove
        reviews that violate our review guidelines (defamation, off-topic
        content, personal attacks, attempts to extort vendors). We do not edit
        reviews to make Vendors look better.
      </p>

      <h2>8. Marketplace rule (no off-platform circumvention)</h2>
      <p>
        Customers and Vendors connected through {SITE_NAME} must complete payment
        through the platform for the discovered booking. Off-platform payment to
        avoid platform fees is a Terms violation and we may suspend your account.
      </p>

      <h2>9. Liability</h2>
      <p>
        {SITE_NAME} is the intermediary, not the service provider. We are not
        liable for the quality, timing, or outcome of services rendered by
        Vendors. We are liable only for our own acts or omissions in operating
        the platform.
      </p>
      <p>
        To the maximum extent permitted by Pakistani law, our aggregate liability
        for any claim arising out of or relating to the platform is limited to
        the amount you paid through {SITE_NAME} in the 12 months preceding the
        claim. <strong>[LEGAL REVIEW]</strong>
      </p>
      <p>
        We are not liable for force-majeure events (natural disasters, civil
        unrest, government action, pandemics). Our force-majeure handling is
        described in the <Link href="/cancellation-policy">Cancellation Policy</Link>.
      </p>

      <h2>10. Intellectual property</h2>
      <p>
        {SITE_NAME} branding, software, and editorial content are owned by us.
        Vendor and Customer content (photos, reviews) remains owned by the
        contributor; you grant us a worldwide, royalty-free licence to display,
        reproduce, and adapt that content as reasonably needed to operate the
        platform.
      </p>

      <h2>11. Account suspension and termination</h2>
      <p>
        We may suspend or close accounts that breach these Terms, our policies,
        or applicable law. Where allowed, we will give notice and an opportunity
        to remedy.
      </p>

      <h2>12. Changes to these Terms</h2>
      <p>
        We may update these Terms. Material changes will be notified by email
        and via a banner on the site at least 14 days before they take effect.
        Continued use after the effective date constitutes acceptance.
      </p>

      <h2>13. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of the Islamic Republic of Pakistan.
        Disputes are subject to the exclusive jurisdiction of the courts of{" "}
        <strong>[LEGAL REVIEW — confirm city: Lahore / Karachi / Islamabad]</strong>.
        Before filing court action, both parties agree to attempt resolution
        through our <Link href="/complaints">Complaints process</Link>.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about these Terms? Visit <Link href="/contact">Contact</Link>.
      </p>
    </LegalPageShell>
  )
}
