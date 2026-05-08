import {
  VendorTypeCityPage,
  generateVendorTypeCityMetadata,
  generateVendorTypeCityStaticParams,
} from "@/components/seo/vendor-type-city-page"

const SLUG = "bridal-wear" as const

export const dynamicParams = false
export const revalidate = 3600

export const generateStaticParams = () => generateVendorTypeCityStaticParams()

export const generateMetadata = ({ params }: { params: { city: string } }) =>
  generateVendorTypeCityMetadata(SLUG, params.city)

export default function Page({ params }: { params: { city: string } }) {
  return <VendorTypeCityPage typeSlug={SLUG} citySlug={params.city} />
}
