import {
  renderVendorOG,
  OG_SIZE,
  OG_CONTENT_TYPE,
  alt,
} from "@/components/seo/vendor-og-image"

const TYPE_SLUG = "bridal-makeup-artists" as const

export const runtime = "nodejs"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export { alt }

export default async function OG({
  params,
}: {
  params: { city: string; vendorSlug: string }
}) {
  return renderVendorOG({
    typeSlug: TYPE_SLUG,
    citySlug: params.city,
    vendorSlug: params.vendorSlug,
  })
}
