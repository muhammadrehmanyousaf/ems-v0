import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface VendorCardProps {
  id: number
  name: string
  image: string
  location: string
  rating?: number
  reviews?: number
  price: number
  type: string
  vendorType: string;
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
  console.log("vendor type ", vendorType)
  const isLoggedin = localStorage.getItem('user') && localStorage.getItem('token')
  const [openAlert, setOpenAlert] = useState(false)
  const router = useRouter()

  return (
    <>
      {/* <Link href={`/${id}`} passHref> */}
      <Card onClick={isLoggedin ? () => router.push(`/${id}`) : undefined} className="overflow-hidden h-full flex flex-col cursor-pointer transition-shadow hover:shadow-lg">
        <div className="relative h-48">
          <Image src={image || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT94cn1WbeqHekCixMvQfZIGwLp46-C4idwAw&s"} alt={'image'} layout="fill" objectFit="cover" />
        </div>
        <CardContent className="p-4 flex-grow">
          <h3 className="text-lg sm:text-xl font-bold mb-2">{name}</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-2">{location}</p>
          <div className="flex items-center mb-2">
            <Star className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            <span className="ml-1 text-sm sm:text-base">
              reviews
            </span>
          </div>
          <p className="font-semibold text-sm sm:text-base">Starting at PKR {price}</p>
          <div className="mt-2">
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded">{type}</span>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 p-4">
            <Button
              onClick={(e) => {
                e.stopPropagation(); // prevent Card's onClick from firing
                if (isLoggedin) {
                  router.push(`/${id}/booking`);
                } else {
                  setOpenAlert(true);
                }
              }}
              className="w-full text-sm sm:text-base"
            >
              Book Now
            </Button>
        </CardFooter>
      </Card>
      {/* </Link> */}
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required to Book</AlertDialogTitle>
            <AlertDialogDescription>
              You must be logged in to book a venue/vendor. Please sign in to continue with your booking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenAlert(false)}>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/login')}>
              Login Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

