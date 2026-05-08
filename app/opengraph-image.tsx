/**
 * Root-level OG image fallback. Any route that doesn't define its own
 * `opengraph-image.tsx` falls back to this. Replaces the static
 * `/og-default.jpg` reference that was hardcoded into layout metadata.
 *
 * Reference: docs/seo/00-master-seo-playbook.md §6 item 256.
 */

import { renderOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image"

export const runtime = "edge"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Wedding Wala — Pakistan's wedding planning marketplace"

export default function OG() {
  return renderOGImage({
    eyebrow: "Pakistan's wedding marketplace",
    title: "Wedding Wala",
    subtitle:
      "Find verified wedding vendors across 12 Pakistani cities — venues, photographers, planners, decorators, and more.",
    pill: "weddingwala.pk",
  })
}
