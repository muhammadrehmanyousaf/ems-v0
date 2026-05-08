import { renderOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image"
import { getVendorType } from "@/lib/seo"

const SLUG = "bridal-wear" as const

export const runtime = "edge"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Wedding Wala — vendor category"

export default async function OG() {
  const vt = getVendorType(SLUG)
  if (!vt) {
    return renderOGImage({ title: "Wedding Wala" })
  }
  return renderOGImage({
    eyebrow: "Pakistan-wide",
    title: `${vt.plural} in Pakistan`,
    subtitle: vt.description,
    pill: "12 cities",
  })
}
