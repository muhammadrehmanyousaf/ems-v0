import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/legal-page-shell"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Cookie Policy",
  description: `What cookies ${SITE_NAME} uses, why, and how to manage them.`,
  path: "/cookie-policy",
})

export default function CookiePolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Cookies"
      title="Cookie Policy"
      lastUpdated="2026-05-07"
      breadcrumbs={[{ name: "Cookie Policy", href: "/cookie-policy" }]}
      intro={
        <p>
          Cookies are small text files set on your device when you visit a
          website. {SITE_NAME} uses cookies for essential functions, preferences,
          and analytics. This policy explains what we set and how to control it.
        </p>
      }
    >
      <h2>1. Categories of cookies we use</h2>
      <h3>Essential (always on)</h3>
      <p>Without these the site does not work. They cannot be disabled.</p>
      <ul>
        <li><code>auth_token</code> — keeps you signed in.</li>
        <li><code>user_id</code> — links your session to your account.</li>
        <li>Session cookies for security (CSRF protection, fraud signals).</li>
      </ul>

      <h3>Preferences (optional)</h3>
      <p>Remember your choices so you don&apos;t reset them every visit.</p>
      <ul>
        <li>Language preference (en-PK or ur-PK).</li>
        <li>City preference if you opted to default to your home city.</li>
      </ul>

      <h3>Analytics (optional)</h3>
      <p>Help us understand how the site is used so we can improve it.</p>
      <ul>
        <li>Google Analytics 4 — pseudonymised page-view and event data.</li>
        <li>Microsoft Clarity — heatmaps and anonymised session replays.</li>
      </ul>

      <h3>Marketing (optional)</h3>
      <p>Used by ad platforms to measure campaigns. We turn these on only with consent.</p>
      <ul>
        <li>Meta Pixel (Facebook / Instagram) — campaign attribution.</li>
        <li>Google Ads — campaign attribution.</li>
        <li>TikTok Pixel — campaign attribution if running TikTok ads.</li>
      </ul>

      <h2>2. How to manage cookies</h2>
      <ul>
        <li>Use the &quot;Cookie preferences&quot; banner on first visit (and at any time via the link in the footer) to opt in or out of optional categories.</li>
        <li>Browser controls let you delete or block all cookies. Note: blocking essential cookies will sign you out of your account.</li>
        <li>Mobile-app analytics: opt out via the app&apos;s Settings &gt; Privacy.</li>
      </ul>

      <h2>3. Do Not Track</h2>
      <p>
        We honour the Global Privacy Control (GPC) signal. When set, we treat
        you as opted out of marketing cookies.
      </p>

      <h2>4. Changes</h2>
      <p>
        We add or remove cookies as the platform evolves. The list above is kept
        current; the &quot;Last updated&quot; date reflects when this list was last
        reviewed.
      </p>

      <h2>5. Questions</h2>
      <p>
        Visit <Link href="/contact">Contact</Link> or email us. Our full data
        practices are documented in the <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPageShell>
  )
}
