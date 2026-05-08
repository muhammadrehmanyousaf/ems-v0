/**
 * Shared Open Graph image generator. Every route's
 * `opengraph-image.tsx` calls one of these helpers — keeps the brand
 * design consistent across templates while the actual route file stays
 * tiny.
 *
 * Reference:
 *   - https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 *   - docs/seo/00-master-seo-playbook.md §6 item 256 (dynamic OG per vendor)
 *   - docs/seo/00-master-seo-playbook.md §33 items 848 + 908
 *
 * OG image dimensions: 1200×630 (Twitter/Facebook standard, also fine for LinkedIn).
 *
 * Constraints:
 *   - Must be edge-renderable (no Node-only APIs, no remote font loads
 *     unless explicitly fetched via the runtime fetch API).
 *   - Each render runs at build time (SSG) or on first request (SSR/ISR);
 *     subsequent requests serve from CDN cache.
 */

import { ImageResponse } from "next/og"
import { SITE_NAME } from "./constants"

export const OG_SIZE = { width: 1200, height: 630 } as const
export const OG_CONTENT_TYPE = "image/png" as const

/** Bridal palette tokens — keep in sync with tailwind.config.js. */
const COLOR_CREAM = "#FAF6F0"
const COLOR_BLUSH = "#F5E1DC"
const COLOR_GOLD = "#B07D54"
const COLOR_GOLD_DARK = "#8B5E3C"
const COLOR_CHARCOAL = "#2C1810"
const COLOR_TEXT_SOFT = "#7A6A5C"

interface OGTemplateInput {
  /** Eyebrow line — small uppercase label above the title. */
  eyebrow?: string
  /** Main headline — the largest text on the card. */
  title: string
  /** Optional secondary line under the title. */
  subtitle?: string
  /** Optional pill text bottom-left (e.g. "Pakistan", "Karachi"). */
  pill?: string
}

/**
 * Render the standard Wedding Wala OG card.
 * Returns an ImageResponse — usable as the default export of an
 * `opengraph-image.tsx` route file.
 */
export function renderOGImage({
  eyebrow,
  title,
  subtitle,
  pill,
}: OGTemplateInput): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          background: `linear-gradient(135deg, ${COLOR_CREAM} 0%, ${COLOR_BLUSH} 100%)`,
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Decorative circle top-right (gold accent) */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: `${COLOR_GOLD}22`,
          }}
        />
        {/* Decorative circle bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: `${COLOR_GOLD_DARK}1a`,
          }}
        />

        {/* Top row: eyebrow + brand */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 16,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: COLOR_GOLD,
              fontWeight: 600,
            }}
          >
            {eyebrow ?? "Wedding Wala"}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 22,
              fontStyle: "italic",
              color: COLOR_CHARCOAL,
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        {/* Center: title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            zIndex: 1,
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              fontSize: title.length > 50 ? 60 : title.length > 30 ? 76 : 92,
              fontStyle: "italic",
              fontWeight: 500,
              color: COLOR_CHARCOAL,
              lineHeight: 1.05,
              letterSpacing: "-1px",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                marginTop: 24,
                fontSize: 28,
                color: COLOR_TEXT_SOFT,
                lineHeight: 1.4,
                fontFamily: "sans-serif",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Bottom row: pill + URL */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {pill && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 22px",
                  borderRadius: 999,
                  background: COLOR_GOLD,
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: 600,
                  fontFamily: "sans-serif",
                }}
              >
                {pill}
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 18,
              color: COLOR_TEXT_SOFT,
              fontFamily: "sans-serif",
            }}
          >
            weddingwala.pk
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}
