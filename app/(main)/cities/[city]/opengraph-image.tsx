import { renderOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image"
import { getCity } from "@/lib/seo"

export const runtime = "edge"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Wedding services across Pakistan — Wedding Wala"

export default async function OG({ params }: { params: { city: string } }) {
  const city = getCity(params.city)
  if (!city) {
    return renderOGImage({
      title: "Wedding services in Pakistan",
      subtitle: "Find verified wedding vendors across every major Pakistani city.",
    })
  }

  return renderOGImage({
    eyebrow: `${city.region} · Pakistan`,
    title: `Plan your wedding in ${city.name}`,
    subtitle: `Verified venues, photographers, planners — every shaadi vendor in ${city.name}.`,
    pill: city.name,
  })
}
