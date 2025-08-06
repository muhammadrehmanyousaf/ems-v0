import VendorCard from "@/components/VendorCard"

interface VenueCardProps {
  venue: {
    id: number
    name: string
    image: string
    location: string
    rating: number
    reviews: number
    price: number
    type: string
    capacity: number
    amenities: string[]
    cancellationPolicy: string
    sponsored: boolean
  }
}

export default function VenueCard({ venue }: VenueCardProps) {
  return (
    <VendorCard
      id={venue.id}
      name={venue.name}
      image={venue.image || "/placeholder.svg"}
      location={venue.location}
      rating={venue.rating}
      reviews={venue.reviews}
      price={venue.price}
      type={venue.type}
      capacity={venue.capacity}
      amenities={venue.amenities}
      sponsored={venue.sponsored}
    />
  )
}

