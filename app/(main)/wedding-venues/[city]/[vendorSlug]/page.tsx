import {
  VendorDetailPage,
  generateVendorDetailMetadata,
} from "@/components/seo/vendor-detail-page"

const TYPE_SLUG = "wedding-venues" as const

export const revalidate = 3600

export const generateMetadata = ({
  params,
}: {
  params: { city: string; vendorSlug: string }
}) =>
  generateVendorDetailMetadata({
    typeSlug: TYPE_SLUG,
    citySlug: params.city,
    vendorSlug: params.vendorSlug,
  })

export default function Page({
  params,
}: {
  params: { city: string; vendorSlug: string }
}) {
  return (
    <VendorDetailPage
      typeSlug={TYPE_SLUG}
      citySlug={params.city}
      vendorSlug={params.vendorSlug}
    />
  )
}
