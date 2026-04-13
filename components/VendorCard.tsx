"use client"

import { useState, useRef, useCallback } from "react"
import { motion, useInView } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, MapPin, Users, Calendar, Clock, Award, Heart, Loader2, Eye } from "lucide-react"
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
import { useFavorites } from "@/hooks/use-favorites"
import { getFirstImage } from "@/lib/utils/image-utils"

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
  isFavorite?: boolean
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
  isFavorite: initialIsFavorite = false,
  showBookButton = true,
  showDetails = true,
  className = "",
}: VendorCardProps) {
  const [openAlert, setOpenAlert] = useState(false)
  const router = useRouter()
  
  // Use the simple favorites hook
  const { isFavorited, toggleFavorite, isLoading } = useFavorites()

  // Check if this vendor is favorited
  const isFavorite = isFavorited(id)

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[data-no-navigate]')) {
      return;
    }
    
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
      
      // Clean the vendor type before mapping
      const cleanVendorType = vendorType?.trim() || ''
      
      // Check if we have a direct mapping
      if (typeMap[cleanVendorType]) {
        return typeMap[cleanVendorType]
      }
      
      // For unmapped types like "Event Planning", redirect to vendors page
      return 'vendors'
    }
    
    const vendorTypePath = getVendorTypePath(type)
    // Ensure clean URL construction
    const cleanId = String(id).trim()
    const cleanPath = vendorTypePath.trim()
    
    if (cleanPath === 'vendors') {
      // For unmapped vendor types, go to main vendors page
      router.push('/vendors')
    } else if (cleanPath && cleanId) {
      // For mapped vendor types, go to specific vendor page
      router.push(`/${cleanPath}/${cleanId}`)
    }
  }

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation()
    const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('user_id') && localStorage.getItem('auth_token')
    
    if (isLoggedIn) {
      // Route to the main booking page
      router.push(`/${id}/booking`)
    } else {
      setOpenAlert(true)
    }
  }

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('user_id') && localStorage.getItem('auth_token')
    
    if (isLoggedIn) {
      try {
        await toggleFavorite(id)
      } catch (error) {
        // favorite toggle failed silently
      }
    } else {
      setOpenAlert(true)
    }
  }

  const formatPrice = (price: number | string) => {
    if (typeof price === 'number') {
      return `Rs. ${price.toLocaleString()}`
    }
    return `Rs. ${price}`
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "#10b981" // emerald
    if (rating >= 4.0) return "#7C3AED" // purple
    if (rating >= 3.5) return "#D4AF37" // gold
    return "#9ca3af" // gray
  }

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return "Exceptional"
    if (rating >= 4.0) return "Excellent"
    if (rating >= 3.5) return "Very Good"
    return "Good"
  }

  // ── 3D Tilt ──
  const cardRef = useRef<HTMLDivElement>(null)
  const inViewRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(inViewRef, { once: true, margin: "0px 0px -60px 0px" })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    cardRef.current.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${y * -6}deg) scale(1.02)`
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return
    cardRef.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)"
  }, [])

  // Circular rating SVG
  const ratingPercent = (rating / 5) * 100
  const circumference = 2 * Math.PI * 18 // radius=18
  const strokeOffset = circumference - (ratingPercent / 100) * circumference

  return (
    <>
      <div ref={inViewRef}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
          className={`h-full ${className}`}
        >
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transition: "transform 0.2s ease-out", transformStyle: "preserve-3d" }}
          >
            <Card
              onClick={handleCardClick}
              className="group h-full cursor-pointer overflow-hidden border border-purple-100/50 shadow-md hover:shadow-2xl hover:shadow-purple-200/30 transition-all duration-500 bg-white/80 backdrop-blur-sm rounded-2xl relative flex flex-col w-full"
            >
              {/* ── Image Section with Ken Burns ── */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={getFirstImage(Array.isArray(image) ? image : [image])}
                  alt={name}
                  fill
                  className="object-cover transition-all duration-[2000ms] ease-out group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* ── Quick-view overlay on hover ── */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-950/80 via-purple-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4">
                  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">{type}</Badge>
                      <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {location}
                      </Badge>
                      {capacity && (
                        <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {capacity}
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCardClick(e) }}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-gold-300 transition-colors"
                      data-no-navigate
                    >
                      <Eye className="w-4 h-4" />
                      Quick View
                    </button>
                  </div>
                </div>

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
                  {sponsored && (
                    <Badge className="bg-gradient-to-r from-gold-500 to-gold-600 text-white border-0 shadow-lg font-semibold text-xs px-3 py-1">
                      <Award className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {!sponsored && <span />}

                  <Button
                    onClick={handleFavoriteToggle}
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    className="w-9 h-9 p-0 bg-white/90 backdrop-blur-sm hover:bg-white border-0 shadow-md rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50"
                    data-no-navigate
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    ) : (
                      <Heart
                        className={`w-4 h-4 transition-all duration-200 ${
                          isFavorite
                            ? "fill-purple-500 text-purple-500"
                            : "text-gray-600 hover:text-purple-500"
                        }`}
                      />
                    )}
                  </Button>
                </div>
              </div>

              {/* ── Content ── */}
              <CardContent className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg leading-tight group-hover:text-purple-700 transition-colors duration-300 line-clamp-2">
                      {name}
                    </h3>
                    <div className="flex items-center text-gray-500 text-xs sm:text-sm mt-1.5">
                      <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0 text-purple-400" />
                      <span className="truncate">{location}</span>
                    </div>
                  </div>

                  {/* ── Circular progress rating ── */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                        <circle
                          cx="20"
                          cy="20"
                          r="18"
                          fill="none"
                          stroke={getRatingColor(rating)}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeOffset}
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold">{rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-gray-400 mt-0.5">{getRatingLabel(rating)}</span>
                  </div>
                </div>

                {/* Reviews count */}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
                  <span className="font-medium">{reviews} reviews</span>
                </div>

                {/* Price & Availability */}
                <div className="flex items-end justify-between mt-auto pt-2 border-t border-gray-100/80">
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Starting from</p>
                    <p className="text-xl sm:text-2xl font-bold text-gradient-purple-gold">
                      {formatPrice(price)}
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-emerald-600 font-medium">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                    Available
                  </div>
                </div>
              </CardContent>

              {/* ── Book Now CTA ── */}
              {showBookButton && (
                <CardFooter className="p-4 sm:p-5 pt-0">
                  <Button
                    onClick={handleBookNow}
                    size="lg"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-300/30 transition-all duration-300 min-h-[44px] sm:min-h-[48px]"
                  >
                    <Calendar className="w-4 h-4" />
                    Book Now
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </motion.div>
      </div>

      {/* Login Alert Dialog */}
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              Please log in to {showBookButton ? "book this vendor or add it to your favorites" : "add this vendor to your favorites"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/login")} className="rounded-xl bg-purple-600 hover:bg-purple-700">
              Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

