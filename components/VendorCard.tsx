"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, MapPin, Users, Heart } from "lucide-react"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

interface VendorCardProps {
  id: string | number
  name: string
  image: string
  location: string
  rating?: number
  reviews?: number
  price: number | string
  type: string
  vendorType?: string
  capacity?: number
  amenities?: string[]
  sponsored?: boolean
  showBookButton?: boolean
  showDetails?: boolean
  className?: string
}

export default function VendorCard({
  id,
  name,
  image,
  location,
  rating = 0,
  reviews = 0,
  price,
  type,
  vendorType,
  capacity,
  amenities = [],
  sponsored = false,
  showBookButton = true,
  showDetails = true,
  className = "",
}: VendorCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const router = useRouter()
  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('user') && localStorage.getItem('token')

  const handleCardClick = () => {
    if (isLoggedIn) {
      // Map vendor type to URL path
      const getVendorTypePath = (vendorType: string) => {
        const typeMap: { [key: string]: string } = {
          'Photographer': 'photographers',
          'Decorator': 'decor',
          'Hena artist': 'henna-artists',
          'Makeup artist': 'makeup-artists',
          'Wedding venue': 'venues',
          'Car rental': 'car-rental',
          'Catering': 'catering',
          'Bridal wearing': 'bridal-wear',
          'Wedding Invitations and Stationery': 'wedding-stationery'
        }
        return typeMap[vendorType] || vendorType.toLowerCase().replace(/\s+/g, '-')
      }
      
      const vendorTypePath = getVendorTypePath(type)
      router.push(`/${vendorTypePath}/${id}`)
    }
  }

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoggedIn) {
      // Route to the main booking page
      router.push(`/${id}/booking`)
    } else {
      setOpenAlert(true)
    }
  }

  const formatPrice = (price: number | string) => {
    if (typeof price === 'number') {
      return `PKR ${price.toLocaleString()}`
    }
    return `PKR ${price}`
  }

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={`h-full ${className}`}
      >
        <Card 
          onClick={handleCardClick}
          className="group h-full cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white"
        >
          {/* Image Section */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={image || "/placeholder.svg"}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {/* Sponsored Badge */}
            {sponsored && (
              <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                Sponsored
              </Badge>
            )}
            
            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsFavorite(!isFavorite)
              }}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white p-0"
            >
              <Heart 
                className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
              />
            </Button>

            {/* Type Badge */}
            <Badge className="absolute bottom-3 left-3 bg-white/90 text-gray-800 border-0">
              {type}
            </Badge>
          </div>

          {/* Content Section */}
          <CardContent className="p-4 space-y-3">
            {/* Title and Location */}
            <div className="space-y-1">
              <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                {name}
              </h3>
              <div className="flex items-center text-gray-600 text-sm">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
                <span className="ml-1 text-sm text-gray-500">({reviews})</span>
              </div>
            </div>

            {/* Price */}
            <div className="text-lg font-bold text-primary">
              Starting from {formatPrice(price)}
            </div>

            {/* Additional Info */}
            {showDetails && (
              <div className="space-y-2">
                {/* Capacity */}
                {capacity && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-1" />
                    <span>Capacity: {capacity} guests</span>
                  </div>
                )}
                
                {/* Amenities */}
                {amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {amenities.slice(0, 2).map((amenity, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {amenities.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{amenities.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>

          {/* Footer with Book Button */}
          {showBookButton && (
            <CardFooter className="p-4 pt-0">
              <motion.div 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                className="w-full"
              >
                <Button
                  onClick={handleBookNow}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Book Now
                </Button>
              </motion.div>
            </CardFooter>
          )}
        </Card>
      </motion.div>

      {/* Login Alert Dialog */}
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You must be logged in to book this vendor. Please sign in to continue with your booking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenAlert(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/login')}>
              Login Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

