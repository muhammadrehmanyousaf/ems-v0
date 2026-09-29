import { ListingRoute } from "@/components/listing/listing-route"

export const dynamic = "force-dynamic"

export default function MakeupArtistsPage() {
  return <ListingRoute vendorType="makeup-artists" />
}

