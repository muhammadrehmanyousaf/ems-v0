import type { Metadata } from "next"
import {
  SITE_NAME,
  SITE_URL,
  contactPageLD,
  breadcrumbsLD,
  combineGraph,
} from "@/lib/seo"
import { safeJsonLd } from "@/lib/seo/jsonld"

/**
 * Canonical for /contact forces Google to dedupe every `/contact?vendor=…`
 * variant back to the bare /contact URL.
 *
 * Emits ContactPage + BreadcrumbList JSON-LD server-side.
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
  const contactLd = contactPageLD()
  const breadcrumbsLd = breadcrumbsLD([
    { name: "Home", url: "/" },
    { name: "Contact Us", url: "/contact" },
  ])
  const combined = combineGraph(contactLd, breadcrumbsLd)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(combined) }}
      />
      {children}
    </>
  )
}
