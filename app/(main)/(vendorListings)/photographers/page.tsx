import VendorSearch from "@/components/VendorSearch"

// VendorSearch uses useSearchParams() — bail out of static prerendering
// to avoid the missing-suspense-boundary build error.
export const dynamic = "force-dynamic"

export default function PhotographersPage() {
  return <VendorSearch vendorType="photographers" />
}

