/**
 * Pinterest pin generator — vertical 1000×1500 (2:3) image for blog
 * posts and real-wedding recaps. The editorial team hits one of:
 *
 *   /pin/blog/<post-slug>
 *   /pin/real-wedding/<recap-slug>
 *
 * …and gets a Pinterest-ready PNG to download and post. Saves the team
 * 10–15 minutes of manual design work per pin.
 *
 * Returns 404 if the kind is unknown or the slug doesn't match a
 * published post / recap.
 *
 * Reference: docs/seo/08-pinterest-strategy.md (pin design rules:
 * vertical 2:3, brand watermark, keyword-rich text overlay).
 */

import { ImageResponse } from "next/og"
import { NextResponse } from "next/server"
import { SITE_NAME } from "@/lib/seo"
import { getPost, getCluster } from "@/lib/blog/posts"
import { getRealWedding } from "@/lib/real-weddings/recaps"

// Pin canvas size — Pinterest's recommended portrait aspect.
const PIN_WIDTH = 1000
const PIN_HEIGHT = 1500

// Brand palette — keep in sync with tailwind.config.js / lib/seo/og-image.tsx.
const COLOR_CREAM = "#FAF6F0"
const COLOR_BLUSH = "#F5E1DC"
const COLOR_GOLD = "#B07D54"
const COLOR_CHARCOAL = "#2C1810"
const COLOR_IVORY = "#FBF8F2"

export const runtime = "nodejs"

interface RouteParams {
  params: { kind: string; slug: string }
}

export async function GET(_request: Request, { params }: RouteParams) {
  if (params.kind === "blog") {
    return renderBlogPin(params.slug)
  }
  if (params.kind === "real-wedding") {
    return renderRealWeddingPin(params.slug)
  }
  return NextResponse.json(
    { error: `Unknown pin kind: ${params.kind}. Use 'blog' or 'real-wedding'.` },
    { status: 404 },
  )
}

// ─── Blog pin ────────────────────────────────────────────────────────────

function renderBlogPin(slug: string) {
  // Walk all clusters to find the post — slug alone is enough at the URL
  // level since the editorial team typically knows which post they want.
  // O(n) is fine; we have <100 posts.
  // Resolve via the cluster manifest.
  const post = findPostBySlug(slug)
  if (!post) {
    return NextResponse.json({ error: `Blog post not found: ${slug}` }, { status: 404 })
  }
  const cluster = getCluster(post.cluster)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: COLOR_CHARCOAL,
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Top half — full-bleed hero image with bottom fade */}
        <div
          style={{
            display: "flex",
            position: "relative",
            width: PIN_WIDTH,
            height: 850,
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt=""
            width={PIN_WIDTH}
            height={850}
            style={{ width: PIN_WIDTH, height: 850, objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: 240,
              background: `linear-gradient(to bottom, transparent, ${COLOR_CREAM})`,
            }}
          />
        </div>

        {/* Bottom half — title + brand */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "30px 64px 60px",
            background: `linear-gradient(180deg, ${COLOR_CREAM} 0%, ${COLOR_BLUSH} 100%)`,
          }}
        >
          {/* Cluster eyebrow */}
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: COLOR_GOLD,
              fontWeight: 600,
              fontFamily: "sans-serif",
            }}
          >
            {cluster?.name ?? "Wedding planning"}
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize:
                post.headline.length > 60
                  ? 56
                  : post.headline.length > 40
                    ? 70
                    : 84,
              fontStyle: "italic",
              fontWeight: 500,
              color: COLOR_CHARCOAL,
              lineHeight: 1.05,
              letterSpacing: "-0.5px",
            }}
          >
            {post.headline}
          </div>

          {/* Brand footer */}
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
                fontSize: 28,
                fontStyle: "italic",
                color: COLOR_CHARCOAL,
              }}
            >
              {SITE_NAME}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: COLOR_GOLD,
                fontFamily: "sans-serif",
                letterSpacing: 4,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              weddingwala.pk
            </div>
          </div>
        </div>
      </div>
    ),
    { width: PIN_WIDTH, height: PIN_HEIGHT },
  )
}

// ─── Real-wedding pin ────────────────────────────────────────────────────

function renderRealWeddingPin(slug: string) {
  const recap = getRealWedding(slug)
  if (!recap) {
    return NextResponse.json({ error: `Real wedding not found: ${slug}` }, { status: 404 })
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
        {/* Full-bleed hero with bottom gradient */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={recap.coverImage}
          alt=""
          width={PIN_WIDTH}
          height={PIN_HEIGHT}
          style={{
            width: PIN_WIDTH,
            height: PIN_HEIGHT,
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
            background: `linear-gradient(to top, rgba(44,24,16,0.95) 0%, rgba(44,24,16,0.65) 30%, rgba(44,24,16,0.0) 55%)`,
          }}
        />

        {/* Top brand band */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "40px 56px",
            background: `linear-gradient(to bottom, rgba(44,24,16,0.7), transparent)`,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: COLOR_GOLD,
              fontWeight: 600,
              fontFamily: "sans-serif",
            }}
          >
            Real Pakistani wedding
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontStyle: "italic",
              color: COLOR_IVORY,
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        {/* Bottom title block */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 56,
            right: 56,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 24,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: COLOR_BLUSH,
              fontWeight: 600,
              fontFamily: "sans-serif",
              marginBottom: 16,
            }}
          >
            {recap.city} ·{" "}
            {new Date(recap.eventDate).toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </div>
          <div
            style={{
              fontSize:
                recap.couple.length > 22 ? 84 : recap.couple.length > 16 ? 110 : 140,
              fontStyle: "italic",
              fontWeight: 500,
              color: COLOR_IVORY,
              lineHeight: 1.0,
              letterSpacing: "-1px",
            }}
          >
            {recap.couple}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 22,
              color: COLOR_BLUSH,
              fontFamily: "sans-serif",
              letterSpacing: 3,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            weddingwala.pk
          </div>
        </div>
      </div>
    ),
    { width: PIN_WIDTH, height: PIN_HEIGHT },
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function findPostBySlug(slug: string) {
  // Try every cluster — quick + small data set.
  // Imported lazily to avoid circular imports on this lightweight route.
  const { POSTS } = require("@/lib/blog/posts") as typeof import("@/lib/blog/posts")
  return POSTS.find((p) => p.slug === slug) ?? null
}
