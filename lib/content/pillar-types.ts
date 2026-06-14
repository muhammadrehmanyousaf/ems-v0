/**
 * Types for the data-driven content-pillar system.
 *
 * Each SEO content pillar (e.g. "How to plan a wedding in Pakistan") is a typed
 * `PillarData` object rendered by <ContentPillar>. This keeps content as data —
 * safe to generate, review, and scale to dozens of pages — instead of bespoke
 * TSX per page.
 *
 * The shape mirrors the StructuredOutput schema used by the content-engine
 * workflow, so generated + fact-checked data drops straight in.
 */

/** A single body block. Fields are populated per `type`. */
export interface PillarSection {
  type: "h2" | "h3" | "p" | "ul" | "table" | "callout"
  /** for h2 / h3 / p */
  text?: string
  /** for ul / callout */
  items?: string[]
  /** for callout (e.g. "In", "Out", "Do", "Don't") */
  label?: string
  /** for table */
  caption?: string
  headers?: string[]
  rows?: string[][]
}

export interface PillarLink {
  label: string
  href: string
}

export interface PillarFAQ {
  question: string
  answer: string
}

export interface PillarData {
  /** Evergreen lowercase-kebab URL segment (no year). Renders at /{slug}. */
  slug: string
  /** <title> fragment (may carry a year for freshness). */
  title: string
  h1: string
  metaDescription: string
  /** Small label above the H1, e.g. "Wedding Planning · 2026". */
  eyebrow: string
  /** Human "Updated June 2026" label. */
  updatedLabel: string
  /** Answer-first lead paragraph (plain text). */
  lead: string
  authorName: string
  /** Breadcrumb trail (uses `name`, matching the Breadcrumbs component). */
  breadcrumb: { name: string; href: string }[]
  sections: PillarSection[]
  faqs: PillarFAQ[]
  internalLinks: PillarLink[]
  /** Optional E-E-A-T / honesty trust box. */
  methodologyNote?: string
  /** ISO dates for Article schema; default applied in the component. */
  publishedAt?: string
  updatedAt?: string
}
