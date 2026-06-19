import type { Metadata } from "next"

/**
 * SEO guard for the app's CLIENT browse/UX surface.
 *
 * The `(vendorListings)` group — `/makeup-artists`, `/photographers`,
 * `/venues`, `/catering`, … and each `/[id]` detail page — is the interactive
 * browse experience. It PARALLELS the SEO-canonical routes that are actually
 * built to rank and are the only vendor URLs in the sitemap:
 *   • type hubs   → `/bridal-makeup-artists`, `/wedding-photographers`,
 *                    `/wedding-venues`, `/caterers`, `/mehndi-artists`, …
 *   • city pages  → `/{seo-type}/{city}`
 *   • vendor leaf → `/{seo-type}/{city}/{name-slug}-{id}`
 *
 * These UX pages are `force-dynamic`, thin (a client `<VendorSearch>` / detail
 * view, no server content or schema), and NOT in the sitemap. Left indexable,
 * they create thin/duplicate pages competing with the SEO routes and waste
 * crawl budget on a low-authority domain.
 *
 * Fix: `noindex, follow` the whole group. Google still CRAWLS and FOLLOWS the
 * internal links (so equity flows through to the SEO hubs + vendor profiles),
 * it just doesn't index these UX pages. Per-page titles/descriptions are
 * preserved (metadata merges field-by-field); a page may override `robots` if
 * it should ever be indexed.
 *
 * Reference: docs/seo/2026-06-rank-everything/02-EXECUTE.md ("Verified code findings").
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function VendorListingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
