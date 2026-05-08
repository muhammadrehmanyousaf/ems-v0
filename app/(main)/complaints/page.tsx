import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/legal-page-shell"
import { buildPageMetadata, SITE_NAME, SUPPORT_EMAIL } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Complaints",
  description: `How to raise a complaint with ${SITE_NAME}. Acknowledgement and resolution SLAs, escalation paths, and external regulators.`,
  path: "/complaints",
})

export default function ComplaintsPage() {
  return (
    <LegalPageShell
      eyebrow="Complaints"
      title="Complaints Procedure"
      lastUpdated="2026-05-07"
      breadcrumbs={[{ name: "Complaints", href: "/complaints" }]}
      intro={
        <p>
          We want to hear when something goes wrong. This page explains how to
          raise a complaint, what timelines you can expect, and where to escalate
          if we can&apos;t resolve it.
        </p>
      }
    >
      <h2>1. Step 1 — Talk to support</h2>
      <ol>
        <li>If your issue is about a specific booking, open a dispute on the booking page first — that gets your case in front of the right team fastest.</li>
        <li>For everything else, email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with the subject
          line <em>Complaint — [your name / booking ID]</em>.
        </li>
        <li>We <strong>acknowledge complaints within 48 hours</strong> with a case reference number.</li>
      </ol>

      <h2>2. Step 2 — Investigation</h2>
      <p>
        Our team investigates and aims to <strong>resolve within 14 working days</strong>.
        For complex disputes (multi-party, regulatory, fraud) we may take longer
        and will keep you updated every 7 days.
      </p>

      <h2>3. Step 3 — Resolution</h2>
      <p>
        Possible resolutions include refund, partial refund, rebooking, vendor
        replacement, written apology, or no further action with a reasoned
        explanation.
      </p>

      <h2>4. Step 4 — Escalation</h2>
      <p>
        If you are not satisfied with our resolution:
      </p>
      <ul>
        <li>Reply to the resolution email asking for senior review. Our complaints lead reviews escalations within 7 working days.</li>
        <li>For payment / refund disputes, you may also raise a chargeback with your card issuer or contact <a href="https://gopayfast.com/faqs/" target="_blank" rel="noopener noreferrer">PayFast support</a> directly.</li>
        <li>For data-protection complaints, contact the relevant Pakistani data-protection authority (TBD as Pakistan&apos;s data-protection law comes into force).</li>
        <li>For consumer-rights complaints, the relevant provincial Consumer Court may apply. <strong>[LEGAL REVIEW]</strong></li>
      </ul>

      <h2>5. What we ask of you</h2>
      <ul>
        <li>Be specific — booking ID, dates, names, evidence (screenshots, messages).</li>
        <li>Be respectful — abusive complaints can be closed without resolution.</li>
        <li>Use one channel at a time — duplicate complaints across email, Twitter, and chat slow our response down, not speed it up.</li>
      </ul>

      <h2>6. Public reporting</h2>
      <p>
        We publish anonymised complaint statistics annually as part of our trust
        commitments. <strong>[LEGAL REVIEW — confirm we will commit to this]</strong>
      </p>

      <h2>7. Contact</h2>
      <p>
        Email: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Visit{" "}
        <Link href="/contact">Contact</Link> for phone and address.
      </p>
    </LegalPageShell>
  )
}
