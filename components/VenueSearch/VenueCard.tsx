import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Vendor } from "@/lib/types"

interface VenueCardProps {
  vendor: Vendor
}

export default function VenueCard({ vendor }: VenueCardProps) {
  return (
    <Link href={`/venues/${vendor.id}`} passHref>
      <Card className="overflow-hidden h-full flex flex-col cursor-pointer transition-shadow hover:shadow-lg">
        <div className="relative h-48">
          <Image src={vendor.images[0] || "/placeholder.svg"} alt={vendor.name} layout="fill" objectFit="cover" />
          {vendor.sponsored && (
            <span className="absolute top-2 left-2 bg-yellow-400 text-xs font-semibold px-2 py-1 rounded">
              Sponsored
            </span>
          )}
        </div>
        <CardContent className="p-4 flex-grow">
          <h3 className="text-lg sm:text-xl font-bold mb-2">{vendor.name}</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-2">{vendor.location}</p>
          <div className="flex items-center mb-2">
            <Star className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            <span className="ml-1 text-sm sm:text-base">
              {vendor.rating.toFixed(1)} ({vendor.reviews.length} reviews)
            </span>
          </div>
          <p className="font-semibold text-sm sm:text-base">Starting at PKR {vendor.price.toLocaleString()}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded">{vendor.type}</span>
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded">
              Capacity: {vendor.capacity}
            </span>
            {vendor.amenities.slice(0, 2).map((amenity: string, index: number) => (
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
    </Link>
  )
}

