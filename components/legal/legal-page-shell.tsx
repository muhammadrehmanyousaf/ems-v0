/**
 * Shared shell for legal / policy pages.
 *
 * Every page under /privacy, /terms, /refund-policy, etc. wraps its content
 * in <LegalPageShell> for consistent chrome, breadcrumbs, last-updated stamp,
 * and contact CTA. Reduces ~300 lines of duplicated layout per page.
 *
 * Reference: docs/payfast/01-payfast-integration-overview.md §1 item 6 +
 * docs/seo/00-master-seo-playbook.md §8 (E-E-A-T trust signals).
 */

import Link from "next/link"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  SITE_NAME,
  TERMS_VERSION,
} from "@/lib/seo"

interface LegalPageShellProps {
  /** Page title — also used as the H1. */
  title: string
  /** Short tagline above the H1 (e.g. "Privacy policy" eyebrow). */
  eyebrow?: string
  /** ISO date — when the policy was last reviewed. */
  lastUpdated: string // e.g. "2026-05-07"
  /** Optional intro paragraph above the body. */
  intro?: React.ReactNode
  /** Page body — provided by the consuming page. */
  children: React.ReactNode
  /** Breadcrumb segments after Home. The current page must be the last item. */
  breadcrumbs: { name: string; href?: string }[]
}

export function LegalPageShell({
  title,
  eyebrow,
  lastUpdated,
  intro,
  children,
  breadcrumbs,
}: LegalPageShellProps) {
  return (
    <div className="container-responsive py-10 sm:py-14">
      <Breadcrumbs items={breadcrumbs} className="mb-6" />

      <header className="mb-10 max-w-3xl">
        {eyebrow && (
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display italic text-[36px] sm:text-[44px] leading-tight text-bridal-charcoal">
          {title}
        </h1>
        <p className="mt-3 font-bridal text-[12.5px] text-bridal-text-soft">
          Last updated:{" "}
          <time dateTime={lastUpdated} className="text-bridal-charcoal">
            {new Date(lastUpdated).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </p>
        {intro && (
          <div className="mt-5 font-bridal text-[15px] text-bridal-text leading-relaxed">
            {intro}
          </div>
        )}
      </header>

      <article className="prose prose-bridal max-w-3xl font-bridal text-[14.5px] text-bridal-text leading-relaxed [&_h2]:font-display [&_h2]:italic [&_h2]:text-[24px] [&_h2]:text-bridal-charcoal [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:font-display [&_h3]:italic [&_h3]:text-[18px] [&_h3]:text-bridal-charcoal [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_li]:my-1 [&_a]:text-bridal-gold [&_a:hover]:underline [&_strong]:text-bridal-charcoal">
        {children}
      </article>

      <aside className="mt-12 max-w-3xl rounded-md border border-bridal-beige bg-bridal-cream p-5">
        <h2 className="font-display italic text-[18px] text-bridal-charcoal mb-2">
          Questions about this policy?
        </h2>
        <p className="font-bridal text-[14px] text-bridal-text leading-relaxed">
          Email us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-bridal-gold hover:underline">
            {SUPPORT_EMAIL}
          </a>{" "}
          or call{" "}
          <a href={SUPPORT_PHONE_TEL} className="text-bridal-gold hover:underline">
            {SUPPORT_PHONE_DISPLAY}
          </a>
          . Our team is based in Pakistan and replies in English or Urdu.
        </p>
        <p className="mt-3 font-bridal text-[13px] text-bridal-text-soft">
          {SITE_NAME} is a marketplace operated in Pakistan. Customer service hours: <em>see <Link href="/contact" className="text-bridal-gold hover:underline">Contact</Link></em>.
        </p>
      </aside>

      {/*
        Policy footnote — required for PayFast underwriting + card-network
        scheme rules. Identifies the legal entity, jurisdiction, and policy
        version the customer accepted at signup.
      */}
      <div className="mt-6 max-w-3xl border-t border-bridal-beige pt-5 text-bridal-text-soft font-bridal text-[12px] leading-relaxed">
        <p className="mb-1">
          <strong className="text-bridal-charcoal">Policy version:</strong>{" "}
          <code className="font-mono text-[11px] text-bridal-charcoal">{TERMS_VERSION}</code>
          {" "}· <strong className="text-bridal-charcoal">Last reviewed:</strong>{" "}
          <time dateTime={lastUpdated}>
            {new Date(lastUpdated).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </p>
        <p className="mb-1">
          <strong className="text-bridal-charcoal">Operator:</strong> {SITE_NAME} ({" "}
          <Link href="/about" className="text-bridal-gold hover:underline">about</Link>
          {" "}) · <strong className="text-bridal-charcoal">Country:</strong> Islamic Republic of Pakistan
        </p>
        <p>
          <strong className="text-bridal-charcoal">Governing law:</strong> Laws of Pakistan
          {" "}· <strong className="text-bridal-charcoal">Companion policies:</strong>{" "}
          <Link href="/terms" className="hover:text-bridal-gold">Terms</Link>{" "}·{" "}
          <Link href="/privacy" className="hover:text-bridal-gold">Privacy</Link>{" "}·{" "}
          <Link href="/refund-policy" className="hover:text-bridal-gold">Refunds</Link>{" "}·{" "}
          <Link href="/cancellation-policy" className="hover:text-bridal-gold">Cancellation</Link>{" "}·{" "}
          <Link href="/cookie-policy" className="hover:text-bridal-gold">Cookies</Link>{" "}·{" "}
          <Link href="/complaints" className="hover:text-bridal-gold">Complaints</Link>
        </p>
      </div>
    </div>
  )
}
