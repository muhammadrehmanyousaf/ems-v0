import {
  VendorTypeHubPage,
  generateVendorTypeHubMetadata,
} from "@/components/seo/vendor-type-hub-page"

const SLUG = "wedding-photographers" as const

export const generateMetadata = () => generateVendorTypeHubMetadata(SLUG)

export default function Page() {
  return <VendorTypeHubPage slug={SLUG} />
}
