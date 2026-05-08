import type { Metadata } from "next"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

/**
 * Wrapper layout for `/search` so the underlying client component can
 * keep its `"use client"` directive while still shipping proper SEO
 * metadata. Reference:
 * https://nextjs.org/docs/app/building-your-application/optimizing/metadata#dynamic-metadata-with-server-components
 */

export const metadata: Metadata = buildPageMetadata({
  title: "Search wedding vendors",
  description: `Search every wedding vendor on ${SITE_NAME} — filter by city, vendor type, budget, capacity, rating, and amenities. Pakistani couples find their perfect vendor in minutes.`,
  path: "/search",
  // Internal search results are conventionally noindex (Google specifically
  // discourages indexing search-on-search pages — doorway-page risk).
  // The hub-and-spoke programmatic pages already cover query-shaped URLs
  // for SEO. Reference: docs/seo/00-master-seo-playbook.md §1 item 95.
  index: false,
  follow: true,
})

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
