import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface VendorCardProps {
  id: number
  name: string
  image: string
  location: string
  rating: number
  reviews: number
  price: number
  type: string
  vendorType: string
}

export default function VendorCard({
  id,
  name,
  image,
  location,
  rating,
  reviews,
  price,
  type,
  vendorType,
}: VendorCardProps) {
  function bookingForm(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    event.preventDefault();
    // Implement the booking logic here
    alert(`Booking for ${name} initiated!`);
  }
  console.log("vendor type ",vendorType)
  return (

    <Link href={`/${vendorType}/${id}`} passHref>
      <Card className="overflow-hidden h-full flex flex-col cursor-pointer transition-shadow hover:shadow-lg">
        <div className="relative h-48">
          <Image src={image || "/placeholder.svg"} alt={name} layout="fill" objectFit="cover" />
        </div>
        <CardContent className="p-4 flex-grow">
          <h3 className="text-lg sm:text-xl font-bold mb-2">{name}</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-2">{location}</p>
          <div className="flex items-center mb-2">
            <Star className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            <span className="ml-1 text-sm sm:text-base">
              {rating.toFixed(1)} ({reviews} reviews)
            </span>
          </div>
          <p className="font-semibold text-sm sm:text-base">Starting at PKR {price.toLocaleString()}</p>
          <div className="mt-2">
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded">{type}</span>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 p-4">
          <Button className="w-full text-sm sm:text-base" onClick={bookingForm}>Book Now</Button>
        </CardFooter>
      </Card>
    </Link>
  )
}

