import {
  BestVendorListiclePage,
  generateListicleMetadata,
  generateListicleStaticParams,
} from "@/components/seo/best-vendor-listicle-page"

export const dynamicParams = false
export const revalidate = 3600

export const generateStaticParams = () => generateListicleStaticParams()

export const generateMetadata = ({ params }: { params: { slug: string } }) =>
  generateListicleMetadata(params.slug)

export default function Page({ params }: { params: { slug: string } }) {
  return <BestVendorListiclePage slug={params.slug} />
}
