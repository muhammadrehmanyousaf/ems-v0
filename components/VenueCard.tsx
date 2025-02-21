import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import Image from "next/image"

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
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative">
        <Image
          src={venue.image || "/placeholder.svg"}
          alt={venue.name}
          width={400}
          height={200}
          className="w-full h-48 object-cover"
        />
        {venue.sponsored && (
          <span className="absolute top-2 left-2 bg-yellow-400 text-xs font-semibold px-2 py-1 rounded">Sponsored</span>
        )}
      </div>
      <CardContent className="p-4 flex-grow">
        <h3 className="text-lg sm:text-xl font-bold mb-2">{venue.name}</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-2">{venue.location}</p>
        <div className="flex items-center mb-2">
          <Star className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          <span className="ml-1 text-sm sm:text-base">
            {venue.rating} ({venue.reviews} reviews)
          </span>
        </div>
        <p className="font-semibold text-sm sm:text-base">Starting at PKR {venue.price.toLocaleString()}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded">{venue.type}</span>
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded">
            Capacity: {venue.capacity}
          </span>
          {venue.amenities.slice(0, 2).map((amenity, index) => (
            <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded">
              {amenity}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 p-4">
        <Button className="w-full text-sm sm:text-base">Book Now</Button>
      </CardFooter>
    </Card>
  )
}

