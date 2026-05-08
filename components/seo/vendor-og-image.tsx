/**
 * Per-vendor Open Graph image generator.
 *
 * Each leaf-route `app/(main)/<slug>/[city]/[vendorSlug]/opengraph-image.tsx`
 * delegates here with its own type slug. The function parses the trailing
 * id from `vendorSlug`, fetches the vendor, and renders a custom OG card
 * with the vendor name + city + rating + photo (if available).
 *
 * Falls back to the brand template (no photo, generic copy) on any
 * failure — never 500s the social-share scraper.
 *
 * Reference: docs/seo/00-master-seo-playbook.md §6 item 256 + §33 item 908.
 */

import { ImageResponse } from "next/og"
import {
  getCity,
  getVendorType,
  type VendorTypeSlug,
} from "@/lib/seo"
import { fetchVendorById, parseVendorSlugAndId } from "@/lib/seo/fetch-vendor"
import { OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image"

export { OG_SIZE, OG_CONTENT_TYPE }
export const alt = "Wedding Wala vendor profile"

const COLOR_CREAM = "#FAF6F0"
const COLOR_BLUSH = "#F5E1DC"
const COLOR_GOLD = "#B07D54"
const COLOR_CHARCOAL = "#2C1810"
const COLOR_TEXT_SOFT = "#7A6A5C"

interface Args {
  typeSlug: VendorTypeSlug
  citySlug: string
  vendorSlug: string
}

export async function renderVendorOG(args: Args): Promise<ImageResponse> {
  const vt = getVendorType(args.typeSlug)
  const city = getCity(args.citySlug)
  const { id } = parseVendorSlugAndId(args.vendorSlug)

  // Fast-fail to brand template if any input is invalid. Scraper still
  // gets a 200 OG image — never 500.
  if (!vt || !city || !id) {
    return brandFallback("Wedding Wala", "Pakistan's wedding marketplace")
  }

  let vendor = null
  try {
    vendor = await fetchVendorById(id)
  } catch {
    /* fall through to brand fallback */
  }

  if (!vendor) {
    return brandFallback(
      `${vt.singular} in ${city.name}`,
      `Verified ${vt.plural.toLowerCase()} on Wedding Wala.`,
    )
  }

  // Two-column layout: left = vendor photo (if present), right = info.
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
        {/* LEFT: vendor photo or initials */}
        <div
          style={{
            display: "flex",
            width: 480,
            height: "100%",
            backgroundColor: COLOR_CHARCOAL,
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {vendor.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vendor.imageUrl}
              alt=""
              width={480}
              height={630}
              style={{ width: 480, height: 630, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                fontSize: 200,
                fontStyle: "italic",
                color: COLOR_GOLD,
              }}
            >
              {vendor.name.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Soft right-edge gradient so the image fades into the card */}
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

        {/* RIGHT: vendor info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "60px 60px 60px 40px",
          }}
        >
          {/* Top: eyebrow + brand */}
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
              {vt.singular} · {city.name}
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
              Wedding Wala
            </div>
          </div>

          {/* Center: vendor name + rating */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize:
                  vendor.name.length > 26
                    ? 56
                    : vendor.name.length > 18
                      ? 70
                      : 84,
                fontStyle: "italic",
                fontWeight: 500,
                color: COLOR_CHARCOAL,
                lineHeight: 1.05,
                letterSpacing: "-1px",
              }}
            >
              {vendor.name}
            </div>
            {vendor.rating > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: 18,
                  fontSize: 22,
                  color: COLOR_TEXT_SOFT,
                  fontFamily: "sans-serif",
                }}
              >
                ★ {vendor.rating.toFixed(1)}{" "}
                {vendor.reviewCount > 0 ? `· ${vendor.reviewCount} reviews` : ""}
              </div>
            )}
            {vendor.priceMin && (
              <div
                style={{
                  display: "flex",
                  marginTop: 8,
                  fontSize: 22,
                  color: COLOR_CHARCOAL,
                  fontFamily: "sans-serif",
                }}
              >
                From PKR {vendor.priceMin.toLocaleString("en-PK")}
              </div>
            )}
          </div>

          {/* Bottom: pill + URL */}
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
              {city.name}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 16,
                color: COLOR_TEXT_SOFT,
                fontFamily: "sans-serif",
              }}
            >
              weddingwala.pk
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}

function brandFallback(title: string, subtitle: string): ImageResponse {
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
          padding: 80,
          background: `linear-gradient(135deg, ${COLOR_CREAM} 0%, ${COLOR_BLUSH} 100%)`,
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 76,
            fontStyle: "italic",
            color: COLOR_CHARCOAL,
            textAlign: "center",
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 24,
            color: COLOR_TEXT_SOFT,
            fontFamily: "sans-serif",
            textAlign: "center",
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 18,
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
    ),
    { ...OG_SIZE },
  )
}
