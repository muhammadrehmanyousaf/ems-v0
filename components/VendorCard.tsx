"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, MapPin, Users, Calendar, Clock, Award } from "lucide-react"
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
  const [openAlert, setOpenAlert] = useState(false)
  const router = useRouter()
  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('user_id') && localStorage.getItem('auth_token')
  


  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[data-no-navigate]')) {
      return;
    }
    
    if (isLoggedIn) {
      // Map vendor type to URL path - Support ALL vendor types
      const getVendorTypePath = (vendorType: string) => {
        const typeMap: { [key: string]: string } = {
          'Photographer': 'photographers',
          'Decorator': 'decor',
          'Henna artist': 'henna-artists',
          'Hena artist': 'henna-artists',
          'Makeup artist': 'makeup-artists',
          'Wedding venue': 'venues',
          'Car rental': 'car-rental',
          'Catering': 'catering',
          'Bridal wearing': 'bridal-wear',
          'Wedding Invitations and Stationery': 'wedding-stationery',
          'Venue': 'venues',
          'Caterer': 'catering',
          'Makeup Artist': 'makeup-artists',
          'Henna Artist': 'henna-artists',
          'Car Rental': 'car-rental',
          'Wedding Stationery': 'wedding-stationery',
          'Bridal Wear': 'bridal-wear'
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
      return `₹${price.toLocaleString()}`
    }
    return `₹${price}`
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-emerald-600"
    if (rating >= 4.0) return "text-green-600"
    if (rating >= 3.5) return "text-yellow-600"
    return "text-gray-600"
  }

  return (
    <>
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ 
          duration: 0.3, 
          ease: "easeOut",
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
        className={`h-full ${className}`}
      >
        <Card 
          onClick={handleCardClick}
          className="group h-full cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white rounded-2xl relative flex flex-col w-full"
        >
          {/* Image Section */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={image || "/placeholder.svg"}
              alt={name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Top Badges */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              {/* Sponsored Badge */}
              {sponsored && (
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg font-semibold text-xs px-3 py-1">
                  <Award className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
              

            </div>

            {/* Bottom Badge */}
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-white/95 backdrop-blur-sm text-gray-800 border-0 shadow-md font-medium text-xs px-3 py-1.5">
                {type}
              </Badge>
            </div>
          </div>

          {/* Content Section - Flex-1 to take remaining space */}
          <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1 flex flex-col">
            {/* Title and Location */}
            <div className="space-y-2">
              <h3 className="font-bold text-lg sm:text-xl leading-tight group-hover:text-rose-600 transition-colors duration-300 line-clamp-2">
                {name}
              </h3>
              <div className="flex items-center text-gray-600 text-xs sm:text-sm">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0 text-rose-500" />
                <span className="truncate font-medium">{location}</span>
              </div>
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="flex items-center">
                  <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${getRatingColor(rating)} fill-current`} />
                  <span className="ml-1 text-xs sm:text-sm font-bold">{rating.toFixed(1)}</span>
                </div>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">({reviews} reviews)</span>
              </div>
              
              {/* Quick Info */}
              {capacity && (
                <div className="flex items-center text-xs text-gray-500">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{capacity} guests</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Starting from</p>
                <p className="text-2xl font-bold text-rose-600">
                  {formatPrice(price)}
                </p>
              </div>
              
              {/* Availability Indicator */}
              <div className="flex items-center text-xs text-green-600 font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Available
              </div>
            </div>

            {/* Additional Info - Flex-1 to push button to bottom */}
            {showDetails && (
              <div className="space-y-3 pt-2 border-t border-gray-100 flex-1">
                {/* Amenities */}
                {amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {amenities.slice(0, 3).map((amenity, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                      >
                        {amenity}
                      </Badge>
                    ))}
                    {amenities.length > 3 && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                      >
                        +{amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Quick Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Quick Response</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>Flexible Booking</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Footer with Book Button - Fixed at bottom */}
          {showBookButton && (
            <CardFooter className="p-6 pt-0 mt-auto">
              <motion.div 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                className="w-full"
              >
                <Button
                  onClick={handleBookNow}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Now
                </Button>
              </motion.div>
            </CardFooter>
          )}
        </Card>
      </motion.div>

      {/* Login Alert Dialog */}
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Login Required</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              You must be logged in to book this vendor. Please sign in to continue with your booking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setOpenAlert(false)}
              className="rounded-lg"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => router.push('/login')}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 rounded-lg"
            >
              Login Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

