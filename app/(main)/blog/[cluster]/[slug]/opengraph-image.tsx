import { ImageResponse } from "next/og"
import { OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image"
import { SITE_NAME } from "@/lib/seo"
import { getCluster, getPost } from "@/lib/blog/posts"

export const runtime = "nodejs"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Wedding Wala blog post"

const COLOR_CREAM = "#FAF6F0"
const COLOR_BLUSH = "#F5E1DC"
const COLOR_GOLD = "#B07D54"
const COLOR_CHARCOAL = "#2C1810"
const COLOR_TEXT_SOFT = "#7A6A5C"

export default async function OG({
  params,
}: {
  params: { cluster: string; slug: string }
}) {
  const post = getPost(params.cluster, params.slug)
  const cluster = getCluster(params.cluster)

  if (!post || !cluster) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: `linear-gradient(135deg, ${COLOR_CREAM} 0%, ${COLOR_BLUSH} 100%)`,
            fontFamily: "serif",
          }}
        >
          <div style={{ fontSize: 64, fontStyle: "italic", color: COLOR_CHARCOAL }}>
            {SITE_NAME}
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 22,
              color: COLOR_TEXT_SOFT,
              fontFamily: "sans-serif",
            }}
          >
            Wedding planning notes for Pakistani couples
          </div>
        </div>
      ),
      { ...OG_SIZE },
    )
  }

  // Two-column: left = hero photo, right = post info.
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          background: `linear-gradient(135deg, ${COLOR_CREAM} 0%, ${COLOR_BLUSH} 100%)`,
          fontFamily: "serif",
        }}
      >
        {/* LEFT: hero photo */}
        <div
          style={{
            display: "flex",
            width: 520,
            height: "100%",
            background: COLOR_CHARCOAL,
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt=""
            width={520}
            height={630}
            style={{ width: 520, height: 630, objectFit: "cover" }}
          />
          {/* Soft right-edge fade */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 80,
              height: "100%",
              background: `linear-gradient(to right, transparent, ${COLOR_CREAM})`,
            }}
          />
        </div>

        {/* RIGHT: post info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "60px 60px 60px 40px",
          }}
        >
          {/* Eyebrow + brand */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 14,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: COLOR_GOLD,
                fontWeight: 600,
              }}
            >
              {cluster.name}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 18,
                fontStyle: "italic",
                color: COLOR_CHARCOAL,
              }}
            >
              {SITE_NAME}
            </div>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize:
                post.headline.length > 60
                  ? 44
                  : post.headline.length > 40
                    ? 54
                    : 64,
              fontStyle: "italic",
              fontWeight: 500,
              color: COLOR_CHARCOAL,
              lineHeight: 1.05,
              letterSpacing: "-0.5px",
              maxWidth: 620,
            }}
          >
            {post.headline}
          </div>

          {/* Footer: reading time + URL */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 22px",
                borderRadius: 999,
                background: COLOR_GOLD,
                color: "#fff",
                fontSize: 16,
                fontWeight: 600,
                fontFamily: "sans-serif",
              }}
            >
              {post.readingMinutes} min read
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 16,
                color: COLOR_TEXT_SOFT,
                fontFamily: "sans-serif",
              }}
            >
              weddingwala.pk/blog
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}
