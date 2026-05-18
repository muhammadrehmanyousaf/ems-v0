import type { Metadata } from "next"
import { SITE_NAME, SITE_URL } from "@/lib/seo"

/**
 * Canonical for /contact forces Google to dedupe every `/contact?vendor=…`
 * variant back to the bare /contact URL. GSC's "Page indexing" report
 * was flooded with one row per vendor query string (Floral Affair Karachi,
 * Mehfil Stationers, etc.) — they're not real pages, they're contact-form
 * deep-links from vendor detail pages. Canonical = `/contact` collapses
 * them all into a single indexable URL.
 *
 * Layout exports metadata so we can hint canonical without converting the
 * page itself off `"use client"`.
 */
export const metadata: Metadata = {
  title: `Contact us — ${SITE_NAME}`,
  description: `Get in touch with the ${SITE_NAME} team. Vendor enquiries, booking support, partnership opportunities — we respond within one business day.`,
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: `Contact ${SITE_NAME}`,
    description: `Reach the ${SITE_NAME} team for booking support or vendor enquiries.`,
    url: `${SITE_URL}/contact`,
    siteName: SITE_NAME,
    type: "website",
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
