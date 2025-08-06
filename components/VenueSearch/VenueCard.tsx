import VendorCard from "@/components/VendorCard"
import type { Vendor } from "@/lib/types"

interface VenueCardProps {
  vendor: Vendor
}

export default function VenueCard({ vendor }: VenueCardProps) {
  return (
    <VendorCard
      id={vendor.id}
      name={vendor.name}
      image={vendor.images[0] || "/placeholder.svg"}
      location={vendor.location}
      rating={vendor.rating}
      reviews={vendor.reviews.length}
      price={vendor.price}
      type={vendor.type}
      capacity={vendor.capacity}
      amenities={vendor.amenities}
      sponsored={vendor.sponsored}
    />
  )
}

