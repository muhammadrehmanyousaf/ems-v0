import { ImageResponse } from "next/og"
import { OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image"
import { SITE_NAME } from "@/lib/seo"
import { getRealWedding } from "@/lib/real-weddings/recaps"

export const runtime = "nodejs"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Real Pakistani wedding recap"

const COLOR_CREAM = "#FAF6F0"
const COLOR_BLUSH = "#F5E1DC"
const COLOR_GOLD = "#B07D54"
const COLOR_CHARCOAL = "#2C1810"
const COLOR_TEXT_SOFT = "#7A6A5C"

export default async function OG({ params }: { params: { slug: string } }) {
  const recap = getRealWedding(params.slug)

  if (!recap) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: COLOR_CREAM,
            fontFamily: "serif",
            fontSize: 60,
            color: COLOR_CHARCOAL,
            fontStyle: "italic",
          }}
        >
          {SITE_NAME}
        </div>
      ),
      { ...OG_SIZE },
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: COLOR_CHARCOAL,
          position: "relative",
          fontFamily: "serif",
        }}
      >
        {/* Full-bleed hero */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={recap.coverImage}
          alt=""
          width={1200}
          height={630}
          style={{
            width: 1200,
            height: 630,
            objectFit: "cover",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
        {/* Bottom gradient for legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to top, rgba(44,24,16,0.92) 0%, rgba(44,24,16,0.55) 35%, transparent 65%)`,
          }}
        />

        {/* Top brand band */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "32px 48px",
            background: `linear-gradient(to bottom, rgba(44,24,16,0.6), transparent)`,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 14,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: COLOR_GOLD,
              fontWeight: 600,
            }}
          >
            Real wedding · {recap.city}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              fontStyle: "italic",
              color: COLOR_CREAM,
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        {/* Bottom title block */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 48,
            right: 48,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 18,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: COLOR_BLUSH,
              fontWeight: 600,
              fontFamily: "sans-serif",
              marginBottom: 12,
            }}
          >
            {new Date(recap.eventDate).toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </div>
          <div
            style={{
              fontSize:
                recap.couple.length > 22 ? 56 : recap.couple.length > 16 ? 70 : 88,
              fontStyle: "italic",
              fontWeight: 500,
              color: COLOR_CREAM,
              lineHeight: 1.05,
              letterSpacing: "-0.5px",
              maxWidth: 1000,
            }}
          >
            {recap.couple}
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 22,
              color: COLOR_BLUSH,
              fontFamily: "sans-serif",
              maxWidth: 900,
            }}
          >
            weddingwala.pk/real-weddings
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}
