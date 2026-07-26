import type { Metadata } from "next"

import { generateVendorMetadata, VendorDetailServer } from "@/lib/seo/vendor-detail-server"

// ISR: server-render + revalidate hourly (docs/seo/SEO-RESCUE-2026-07.md).
export const revalidate = 3600

export function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return generateVendorMetadata("car-rental", params.id)
}

export default function Page({ params }: { params: { id: string } }) {
  return <VendorDetailServer typeSlug="car-rental" param={params.id} />
}
