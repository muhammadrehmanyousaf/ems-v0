import {
  VendorDetailRoute,
  VENDOR_DETAIL_REVALIDATE,
} from "@/components/VendorDetails/vendor-detail-route"

/**
 * Henna artist profile.
 *
 * WW-PERF — this was a 139-line client component that rendered an empty shell
 * and then fetched the vendor in a useEffect: a spinner for the visitor, and no
 * content in the HTML for a crawler. It is now server-rendered and ISR-cached,
 * matching the canonical SEO route at /wedding-henna-artists/[city]/[vendorSlug],
 * which has always worked this way. All seven vendor-type profile routes share
 * one implementation now instead of seven near-identical copies.
 */
export const revalidate = VENDOR_DETAIL_REVALIDATE

export default function Page({ params }: { params: { id: string } }) {
  return <VendorDetailRoute id={params.id} />
}
