import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/legal-page-shell"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "AML & KYC Policy",
  description: `${SITE_NAME}'s anti-money-laundering and know-your-vendor controls, aligned with State Bank of Pakistan and FATF guidance.`,
  path: "/aml-policy",
})

export default function AmlPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Compliance"
      title="AML & KYC Policy"
      lastUpdated="2026-05-07"
      breadcrumbs={[{ name: "AML Policy", href: "/aml-policy" }]}
      intro={
        <p>
          {SITE_NAME} operates in Pakistan and complies with the Anti-Money
          Laundering (AML) and Counter-Financing-of-Terrorism (CFT) framework
          set by the State Bank of Pakistan and the Financial Monitoring Unit
          (FMU). This page summarises our controls.
        </p>
      }
    >
      <h2>1. Vendor onboarding (Know Your Vendor)</h2>
      <ul>
        <li>Every vendor account is identity-verified at sign-up: CNIC of beneficial owner(s), business registration where applicable, NTN, business address.</li>
        <li>Bank account name must match the registered business name on file.</li>
        <li>Politically Exposed Persons (PEPs) and adverse-media flags trigger enhanced due diligence before approval.</li>
      </ul>

      <h2>2. Customer KYC</h2>
      <p>
        Customers verify their phone and email at sign-up. For bookings above a
        threshold defined by Pakistani regulation we may request additional
        identity verification (CNIC, address proof). <strong>[LEGAL REVIEW —
        confirm threshold value]</strong>
      </p>

      <h2>3. Transaction monitoring</h2>
      <ul>
        <li>Automated monitoring flags unusual booking or payout patterns: high-value bookings split into multiple transactions, mismatched names, rapid refund-and-rebook loops, and other AML red flags.</li>
        <li>Flagged accounts are reviewed by our compliance team. Where required, we file Suspicious Transaction Reports (STR) with the FMU.</li>
      </ul>

      <h2>4. Sanctions screening</h2>
      <p>
        Vendors and customers are screened against UN, OFAC, EU, and Pakistan-level
        sanctions lists at onboarding and on a recurring basis.
      </p>

      <h2>5. Record-keeping</h2>
      <p>
        We retain transaction and KYC records for at least 7 years, as required
        by Pakistani law.
      </p>

      <h2>6. Reporting concerns</h2>
      <p>
        If you believe an account on {SITE_NAME} is being used for money
        laundering, terrorism financing, or other illegal purposes, report it to{" "}
        <Link href="/contact">Contact</Link> with as much detail as you can
        share. We take all reports seriously and never disclose reporter
        identities to subjects.
      </p>

      <h2>7. Limitations</h2>
      <p>
        {SITE_NAME} is a marketplace, not a financial institution. We rely on
        licensed payment processors (PayFast Pakistan, Stripe) for the
        money-handling itself, who maintain their own AML/CFT controls in
        addition to ours.
      </p>
    </LegalPageShell>
  )
}
