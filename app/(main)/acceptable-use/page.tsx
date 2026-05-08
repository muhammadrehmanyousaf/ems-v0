import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/legal-page-shell"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Acceptable Use Policy",
  description: `What you can and can't do on ${SITE_NAME}. Conduct rules for customers, vendors, and visitors.`,
  path: "/acceptable-use",
})

export default function AcceptableUsePage() {
  return (
    <LegalPageShell
      eyebrow="Conduct"
      title="Acceptable Use Policy"
      lastUpdated="2026-05-07"
      breadcrumbs={[{ name: "Acceptable Use Policy", href: "/acceptable-use" }]}
      intro={
        <p>
          {SITE_NAME} is a platform for celebrating Pakistani weddings safely and
          professionally. This policy lists what we don&apos;t allow.
        </p>
      }
    >
      <h2>1. Prohibited activities</h2>
      <ul>
        <li>Posting false, misleading, or stolen content (photos, reviews, listings).</li>
        <li>Impersonating another person or business.</li>
        <li>Creating duplicate accounts to evade bans or platform fees.</li>
        <li>Attempting to circumvent {SITE_NAME} payment flow for a discovered booking.</li>
        <li>Soliciting customers off-platform after meeting them through {SITE_NAME}.</li>
        <li>Posting reviews for bookings that never happened, or trading reviews.</li>
        <li>Harassing, threatening, or discriminating against any user.</li>
        <li>Posting content that is obscene, hateful, or that incites violence.</li>
        <li>Uploading malware, phishing links, or content that exploits security vulnerabilities.</li>
        <li>Scraping the site or its API without written permission.</li>
        <li>Using the platform to launder money, evade tax, or finance prohibited activities.</li>
      </ul>

      <h2>2. Vendor-specific rules</h2>
      <ul>
        <li>List only services you are licensed and capable of providing.</li>
        <li>Do not advertise services in restricted categories (gambling, adult content, weapons, restricted pharma).</li>
        <li>Honour pricing and availability as published. Bait-and-switch is grounds for suspension.</li>
        <li>Use only photos you own or have a licence to use. <strong>[LEGAL REVIEW]</strong></li>
      </ul>

      <h2>3. Customer-specific rules</h2>
      <ul>
        <li>Do not abuse refund or chargeback processes for bookings you actually used.</li>
        <li>Do not threaten vendors with negative reviews to extract discounts.</li>
        <li>Respect vendor staff and venue rules at events.</li>
      </ul>

      <h2>4. Reporting violations</h2>
      <p>
        Use the &quot;Report&quot; link on any vendor profile, review, or message thread.
        Or email us — see <Link href="/contact">Contact</Link>. Persistent or
        serious issues can be escalated through the{" "}
        <Link href="/complaints">Complaints process</Link>.
      </p>

      <h2>5. Enforcement</h2>
      <p>
        Violations may result in warning, content removal, payout holds,
        suspension, or permanent ban. We cooperate with Pakistani law enforcement
        on illegal activity.
      </p>
    </LegalPageShell>
  )
}
