import { renderOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image"
import { getCity, getVendorType } from "@/lib/seo"

const SLUG = "wedding-venues" as const

export const runtime = "edge"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Wedding Wala — vendors in this city"

export default async function OG({ params }: { params: { city: string } }) {
  const vt = getVendorType(SLUG)
  const city = getCity(params.city)
  if (!vt || !city) return renderOGImage({ title: "Wedding Wala" })
  return renderOGImage({
    eyebrow: `${city.region} · Pakistan`,
    title: `${vt.plural} in ${city.name}`,
    subtitle: `Verified ${vt.plural.toLowerCase()} reviewed by real Pakistani couples.`,
    pill: city.name,
  })
}
