import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/legal-page-shell"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Disclaimer",
  description: `Important disclaimers about ${SITE_NAME}'s role as a marketplace and the responsibilities of vendors and customers.`,
  path: "/disclaimer",
})

export default function DisclaimerPage() {
  return (
    <LegalPageShell
      eyebrow="Disclaimer"
      title="Disclaimer"
      lastUpdated="2026-05-07"
      breadcrumbs={[{ name: "Disclaimer", href: "/disclaimer" }]}
    >
      <h2>1. Marketplace, not service provider</h2>
      <p>
        {SITE_NAME} is a marketplace. Wedding services advertised on the platform
        are delivered by independent third-party vendors. {SITE_NAME} is not the
        photographer at your wedding, the caterer at your walima, or the planner
        running your timeline — those are the vendors you book through us.
      </p>

      <h2>2. Pricing and availability</h2>
      <p>
        Prices, availability, packages, and inclusions shown on vendor profiles
        are supplied by the vendor and may change. The price you see at the
        moment of booking is the price you pay, subject to PKR exchange-rate
        rules where applicable.
      </p>

      <h2>3. Reviews and ratings</h2>
      <p>
        Reviews are from verified customers and reflect their personal
        experience. Past performance is not a guarantee of future results.
      </p>

      <h2>4. Editorial content</h2>
      <p>
        Blog posts, planning guides, and budget calculators are educational
        content. They are written by our editorial team and updated regularly,
        but do not constitute professional, legal, financial, or medical advice.
        Always verify critical details with a qualified professional.
      </p>

      <h2>5. Third-party links</h2>
      <p>
        Our site may link to third-party websites. {SITE_NAME} does not control
        and is not responsible for the content, privacy practices, or terms of
        third-party sites.
      </p>

      <h2>6. Trade marks</h2>
      <p>
        &quot;Wedding Wala&quot; and the {SITE_NAME} logo are trade marks of {SITE_NAME}.
        Other brands referenced on the site are trade marks of their respective
        owners.
      </p>

      <h2>7. Contact</h2>
      <p>
        Visit <Link href="/contact">Contact</Link> for any questions.
      </p>
    </LegalPageShell>
  )
}
