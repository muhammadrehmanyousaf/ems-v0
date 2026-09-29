import VendorSearch from "@/components/VendorSearch"
import { fetchListingSeed } from "@/lib/seo/fetch-listing-seed"

/**
 * A vendor listing, with its first screenful already rendered.
 *
 * Every one of the 24 listing routes was `return <VendorSearch vendorType=... />`
 * — a client component that fetched on mount, so the grid could not exist until
 * a browser round-trip finished, and the largest paint waited on it. This is the
 * same thing one `await` earlier: the server fetches twelve cards and hands them
 * over, so they are in the HTML and the first card's image is discoverable by
 * the preload scanner.
 *
 * `VendorSearch` still owns everything else. The seed is what gets painted while
 * the full list loads; it is not the data the filters run on.
 */
export async function ListingRoute({ vendorType }: { vendorType: string }) {
  const seed = await fetchListingSeed(vendorType)
  return (
    <VendorSearch
      vendorType={vendorType}
      initialVendors={seed.items}
      initialTotal={seed.total}
    />
  )
}

export default ListingRoute
