import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import Image from "next/image"

export default function VenueList() {
  return (
    <Card>
      <div className="flex">
        <Image src="/placeholder.svg" alt="Venue" width={200} height={150} className="object-cover" />
        <CardContent className="p-4 flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold mb-2">Venue Name</h3>
              <p className="text-gray-600 mb-2">Location, City</p>
              <div className="flex items-center mb-2">
                <Star className="text-yellow-400 w-5 h-5" />
                <span className="ml-1">4.5 (415 reviews)</span>
              </div>
              <p className="font-semibold">Starting at PKR 2,100</p>
            </div>
            <Button>View Details</Button>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

