"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import VenueDetails from "@/components/VenueDetails/VenueDetails"
import type { Venue } from "@/lib/types"

const dummyVenue: Venue = {
  id: 1,
  name: "Shershah Palace",
  images: [
    "https://images.pexels.com/photos/169190/pexels-photo-169190.jpeg",
    "https://images.pexels.com/photos/169211/pexels-photo-169211.jpeg",
    "https://images.pexels.com/photos/265900/pexels-photo-265900.jpeg",
  ],
  video: "https://www.pexels.com/video/wedding-venue-decoration-3643031/",
  location: "Adda Plot, Facing Ring Road, Lahore",
  rating: 4.9,
  reviews: 45,
  price: 2100,
  type: "Marquee",
  capacity: 1000,
  amenities: ["Parking Space", "Wheelchair Accessible", "Air Conditioning", "Catering Services", "DJ Services"],
  cancellationPolicy: "Partially Refundable",
  sponsored: true,
  packages: [
    {
      id: 1,
      name: "Basic Package",
      price: 2100,
      description: "Perfect for small gatherings",
      items: ["Venue rental", "Basic decoration", "Sound system"],
    },
    {
      id: 2,
      name: "Premium Package",
      price: 3500,
      description: "Ideal for large weddings",
      items: ["Venue rental", "Luxury decoration", "Sound system", "Catering", "Photography"],
    },
  ],
  description:
    "Shershah Palace is a luxurious wedding venue located in the heart of Lahore. With its spacious halls and beautiful gardens, it's the perfect place for your dream wedding.",
}

export default function VenueDetailsPage() {
  const { id } = useParams()
  const [venue, setVenue] = useState<Venue | null>(null)

  useEffect(() => {
    // Simulating an API call with a timeout
    const timer = setTimeout(() => {
      setVenue(dummyVenue)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (!venue) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  return <VenueDetails venue={venue} />
}

