import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/legal-page-shell"
import { buildPageMetadata, SITE_NAME, SUPPORT_EMAIL } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, uses, and protects your personal data — written in plain English for Pakistani couples and vendors.`,
  path: "/privacy",
})

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      lastUpdated="2026-05-07"
      breadcrumbs={[{ name: "Privacy Policy", href: "/privacy" }]}
      intro={
        <p>
          {SITE_NAME} (&quot;we&quot;, &quot;us&quot;) is committed to protecting your
          privacy. This policy explains what data we collect, why we collect it,
          and the controls you have over it. We do not sell your data to advertisers.
        </p>
      }
    >
      <h2>1. What this policy covers</h2>
      <p>
        This Privacy Policy applies to <Link href="/">weddingwala.pk</Link> and any
        related apps or services operated by {SITE_NAME}. It covers customers,
        vendors, and visitors. By using {SITE_NAME} you agree to the practices
        described here. If you do not agree, please do not use the platform.
      </p>

      <h2>2. Information we collect</h2>
      <h3>From customers</h3>
      <ul>
        <li><strong>Account data</strong> — name, email, phone number, password (hashed).</li>
        <li><strong>Booking data</strong> — event date, vendor selections, guest count, message threads with vendors.</li>
        <li><strong>Payment metadata</strong> — payment status, amount, last-4 of card, payment processor reference. <strong>We never store your full card number, CVV, or expiry date.</strong> All card data is handled by our PCI-DSS-compliant payment processor (PayFast / Stripe).</li>
        <li><strong>Reviews and photos</strong> — content you publish about vendors after a completed booking.</li>
        <li><strong>Device and usage data</strong> — IP address, browser type, pages visited, timestamps. Used for fraud prevention, analytics, and service improvement.</li>
      </ul>
      <h3>From vendors</h3>
      <ul>
        <li><strong>Business data</strong> — business name, registered name, address, NTN, bank details, portfolio photos, services and pricing.</li>
        <li><strong>Identity verification</strong> — CNIC and supporting documents required by Pakistani regulations and our Know-Your-Vendor (KYV) policy.</li>
      </ul>

      <h2>3. How we use your information</h2>
      <ul>
        <li>To create and operate your account.</li>
        <li>To process bookings, payments, refunds, and disputes.</li>
        <li>To send transactional messages — booking confirmations, reminders, payment receipts. You cannot opt out of essential transactional messages while you have an active booking.</li>
        <li>To send marketing communications you have opted into. You can unsubscribe at any time via the link in every marketing email.</li>
        <li>To detect fraud, abuse, and breaches of our <Link href="/terms">Terms of Service</Link> or <Link href="/acceptable-use">Acceptable Use Policy</Link>.</li>
        <li>To meet our obligations under Pakistani law (SBP, FBR, FMU AML/CFT reporting where required).</li>
      </ul>

      <h2>4. Who we share your information with</h2>
      <p>{SITE_NAME} does not sell your data. We share data only with:</p>
      <ul>
        <li><strong>Vendors you book</strong> — we share the minimum needed to fulfil the booking (name, contact, event date).</li>
        <li><strong>Payment processors</strong> — PayFast Pakistan, Stripe (legacy USD bookings) — to take payments and issue refunds.</li>
        <li><strong>Infrastructure providers</strong> — Neon (database), Vercel / Cloudflare (hosting), AWS (file storage), email delivery (e.g. Postmark or AWS SES), SMS providers (e.g. JazzCash SMS gateway).</li>
        <li><strong>Analytics providers</strong> — Google Analytics, Microsoft Clarity. We use anonymized / pseudonymized data where possible.</li>
        <li><strong>Law enforcement and regulators</strong> — when required by valid Pakistani legal process.</li>
      </ul>
      <p>
        Each processor is bound by a data-processing agreement. We do not transfer
        data to processors outside the categories above. <strong>[LEGAL REVIEW]</strong>
      </p>

      <h2>5. Cookies and tracking</h2>
      <p>
        We use cookies for authentication, preferences, fraud prevention, and
        analytics. Read our <Link href="/cookie-policy">Cookie Policy</Link> for the
        full list and your opt-out controls.
      </p>

      <h2>6. Data retention</h2>
      <ul>
        <li>Account data — retained while your account is active, plus 7 years (Pakistani tax / accounting law).</li>
        <li>Booking data — retained for 7 years after the event date.</li>
        <li>Marketing preferences — retained until you unsubscribe.</li>
        <li>Reviews — retained indefinitely (they are public-facing content).</li>
        <li>Logs / device data — typically 13 months, longer for unresolved fraud cases.</li>
      </ul>

      <h2>7. Your rights</h2>
      <p>You can:</p>
      <ul>
        <li>Access — request a copy of the personal data we hold about you.</li>
        <li>Correct — update inaccurate data via your account settings or by emailing us.</li>
        <li>Delete — request deletion of your account and personal data, subject to retention obligations under Pakistani law (e.g. tax records).</li>
        <li>Object — opt out of marketing at any time.</li>
        <li>Complain — to {SITE_NAME} or to the relevant Pakistani data-protection authority once Pakistan&apos;s data protection law is in force.</li>
      </ul>
      <p>
        To exercise these rights email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We respond within 30
        days.
      </p>

      <h2>8. Security</h2>
      <p>
        We use HTTPS everywhere, hashed passwords (bcrypt), encrypted database at
        rest, role-based access control, and audit logging on sensitive actions.
        No system is perfectly secure. Report security issues to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>9. Children</h2>
      <p>
        {SITE_NAME} is not intended for users under 18. We do not knowingly collect
        data from children. If you believe a child has created an account, contact
        us and we will delete it.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this policy. Material changes will be announced via email
        and a banner on the site at least 14 days before they take effect. The
        &quot;Last updated&quot; date above always reflects the current version.
      </p>

      <h2>11. Contact</h2>
      <p>
        Privacy questions: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        Postal address — see <Link href="/contact">Contact</Link>.
      </p>
    </LegalPageShell>
  )
}
