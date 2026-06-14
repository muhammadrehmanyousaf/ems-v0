"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, MapPin, Users, Calendar, Clock, Award, Heart, Loader2, Eye, Plane } from "lucide-react"
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
import {
  ListingBadges,
  type ListingBadgeBusiness,
} from "@/components/listings/listing-badges"
// BK-100.6 — vendor trust badges (Top Vendor / ID Verified / etc.)
import { VendorTrustBadges } from "@/components/vendors/vendor-trust-badges"

interface VendorCardProps {
  id: string | number
  name: string
  image: string
  location: string
  rating?: number
  reviews?: number
  price: number | string | null | undefined
  type: string
  vendorType?: string
  capacity?: number
  amenities?: string[]
  sponsored?: boolean
  isFavorite?: boolean
  showBookButton?: boolean
  showDetails?: boolean
  className?: string
  onFavoriteToggle?: (id: string | number, nowFavorited: boolean) => void
  /**
   * Raw listing-response fields used to drive backend-signal badges
   * (vacation mode, permit required, last-spot urgency). Optional —
   * cards rendered without it stay backwards-compatible. Typed as a
   * Partial so callers can pass the full Vendor / Business object directly.
   */
  business?: ListingBadgeBusiness
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
  onFavoriteToggle,
  business,
}: VendorCardProps) {
  // BK-048 — vacation mode dims the card and replaces the booking CTA with
  // a disabled "Back on …" button. Listing stays visible per BK-048's spec
  // (customer can still favourite, just can't book inside the window).
  const onVacation = business?.vacationMode === true
  const vacationBackOn = (() => {
    const raw = business?.vacationEndsAt
    if (!raw) return null
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    const d = dateOnly ? new Date(`${raw}T00:00:00`) : new Date(raw)
    if (Number.isNaN(d.getTime())) return null
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  })()
  const [openAlert, setOpenAlert] = useState(false)
  const router = useRouter()

  // Issue #61 — "bootstrap" the card visual when the vendor's image
  // URL is missing or 404s. Without this, Next/Image failures left the
  // card showing raw alt-text ("Shad bagh Photography", "Demo
  // Photography Studio", …) instead of an image, which is what the
  // bug report screenshotted as broken cards on the customer-side
  // listing. Swap to the placeholder on load failure and reset the
  // flag whenever the parent passes in a new image src.
  const initialSrc = getFirstImage(Array.isArray(image) ? image : [image])
  const [imgSrc, setImgSrc] = useState<string>(initialSrc)
  useEffect(() => {
    setImgSrc(initialSrc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image])

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
        'Makeup artist': 'makeup-artists',
        'Wedding venue': 'venues',
        'Car rental': 'car-rental',
        'Catering': 'catering',
        // `bridal-wear` / `wedding-stationery` are SEO listing routes that
        // own /bridal-wear/[city] and /wedding-stationery/[city]; routing a
        // numeric id there collides with [city] and never reaches a detail
        // page. The numeric-id detail routes live under these slugs instead.
        'Bridal wearing': 'bridal-wearing',
        'Wedding Invitations and Stationery': 'wedding-invitations',
        'Venue': 'venues',
        'Caterer': 'catering',
        'Makeup Artist': 'makeup-artists',
        'Henna Artist': 'henna-artists',
        'Car Rental': 'car-rental',
        'Wedding Stationery': 'wedding-invitations',
        'Bridal Wear': 'bridal-wearing'
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
    // BK-048 — vacation mode disables the booking CTA. The disabled button
    // below is also rendered via `disabled`, but stop propagation here too
    // so a click on a stale CTA never routes to /booking.
    if (onVacation) return

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
        onFavoriteToggle?.(id, !isFavorite)
      } catch (error) {
        // favorite toggle failed silently
      }
    } else {
      setOpenAlert(true)
    }
  }

  const formatPrice = (price: number | string | null | undefined) => {
    if (!price && price !== 0) return null;
    if (typeof price === 'number') {
      return price > 0 ? `Rs. ${price.toLocaleString()}` : null;
    }
    return `Rs. ${price}`;
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
              className={`
                group h-full cursor-pointer overflow-hidden relative flex flex-col w-full
                bg-bridal-cream border border-bridal-beige rounded-md
                transition-all duration-500
                hover:border-bridal-gold/55
                hover:shadow-[0_28px_50px_-32px_rgba(176,125,84,0.5)]
                ${onVacation ? "opacity-70" : ""}
              `}
            >
              {/* ── Image Section ── */}
              <div className="relative aspect-[4/3] overflow-hidden bg-bridal-cream">
                <Image
                  src={imgSrc}
                  alt={name}
                  fill
                  className="object-cover transition-all duration-[2000ms] ease-out group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={() => {
                    // Issue #61 — listing came back with a stale /
                    // moved / private image URL. Fall back so the card
                    // doesn't render raw alt-text inside the image box.
                    if (imgSrc !== '/placeholder.svg') {
                      setImgSrc('/placeholder.svg')
                    }
                  }}
                />

                {/* Bridal hover veil — gold/charcoal/blush instead of purple */}
                <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/85 via-bridal-charcoal/15 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4">
                  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-bridal-cream/95 border border-bridal-gold/55 text-bridal-charcoal text-[10px] font-bridal font-medium uppercase tracking-[0.2em] backdrop-blur-sm">
                        {type}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-bridal-blush/95 border border-bridal-rose/55 text-bridal-mauve text-[10px] font-bridal font-medium uppercase tracking-[0.2em] backdrop-blur-sm">
                        <MapPin className="w-3 h-3" />
                        {location}
                      </span>
                      {capacity && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-bridal-ivory/15 backdrop-blur-sm border border-bridal-ivory/25 text-bridal-ivory text-[10px] font-bridal font-medium uppercase tracking-[0.2em]">
                          <Users className="w-3 h-3" />
                          {capacity}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCardClick(e) }}
                      className="inline-flex items-center gap-1.5 font-bridal text-[11px] uppercase tracking-[0.22em] font-medium text-bridal-gold hover:text-bridal-rose transition-colors"
                      data-no-navigate
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Quick View
                    </button>
                  </div>
                </div>

                {/* Top: Featured ribbon + favourite button */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
                  {sponsored ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-bridal-gold/95 border border-bridal-gold-dark/30 text-bridal-charcoal text-[10px] font-bridal font-medium uppercase tracking-[0.22em] backdrop-blur-sm">
                      <Award className="w-3 h-3" />
                      Featured
                    </span>
                  ) : (
                    <span />
                  )}

                  <Button
                    onClick={handleFavoriteToggle}
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    className="w-9 h-9 p-0 bg-bridal-cream/95 backdrop-blur-sm hover:bg-bridal-cream border border-bridal-beige hover:border-bridal-gold/55 shadow-sm rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50"
                    data-no-navigate
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-bridal-gold" />
                    ) : (
                      <Heart
                        className={`w-4 h-4 transition-all duration-200 ${
                          isFavorite
                            ? "fill-bridal-coral text-bridal-coral"
                            : "text-bridal-text-soft hover:text-bridal-coral"
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
                    <h3 className="font-display italic text-[18px] sm:text-[20px] leading-tight text-bridal-charcoal group-hover:text-bridal-gold-dark transition-colors duration-300 line-clamp-2">
                      {name}
                    </h3>
                    <div className="flex items-center font-bridal text-bridal-text-soft text-[12px] mt-1">
                      <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0 text-bridal-gold/80" />
                      <span className="truncate">{location}</span>
                    </div>
                  </div>

                  {/* Circular gold rating progress */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="#EDD9C3" strokeWidth="3" />
                        <circle
                          cx="20"
                          cy="20"
                          r="18"
                          fill="none"
                          stroke="#C9956A"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeOffset}
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-display italic text-[14px] text-bridal-charcoal">
                          {rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <span className="font-bridal text-[9.5px] uppercase tracking-[0.2em] font-medium text-bridal-gold mt-1">
                      {getRatingLabel(rating)}
                    </span>
                  </div>
                </div>

                {/* Reviews count */}
                <div className="flex items-center gap-1.5 font-bridal text-[12px] text-bridal-text-soft">
                  <Star className="w-3 h-3 text-bridal-gold fill-bridal-gold" />
                  <span className="font-medium">{reviews} reviews</span>
                </div>

                {/* Backend-signal pills (BK-048 vacation, BK-074 permit, BK-053 last-spot).
                    Wrapper renders nothing when no signal applies, so existing layouts
                    of vendors with none of these flags are unaffected. */}
                <ListingBadges business={business} />

                {/* BK-100.6 — vendor reliability trust badges (Top Vendor /
                    ID Verified / Established / Dispute-free / etc.). Component
                    renders nothing when neither `tier` nor `badges` are
                    present so legacy vendor rows are unaffected. */}
                {business?.reliability && (
                  <VendorTrustBadges
                    tier={business.reliability.tier}
                    badges={business.reliability.badges}
                    max={3}
                  />
                )}

                {/* Price + availability */}
                <div className="flex items-end justify-between mt-auto pt-3 border-t border-bridal-beige/70">
                  <div>
                    <p className="font-bridal text-[10px] uppercase tracking-[0.2em] font-medium text-bridal-text-label">
                      Starting from
                    </p>
                    <p className="font-display italic text-[22px] sm:text-[24px] text-bridal-gold-dark mt-0.5 leading-none">
                      {formatPrice(price) ?? (
                        <span className="text-[15px] text-bridal-text-soft">
                          Contact us
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center font-bridal text-[11px] text-[#3F6B43] font-medium">
                    <div className="w-1.5 h-1.5 bg-bridal-sage rounded-full mr-1.5 animate-pulse" />
                    Available
                  </div>
                </div>
              </CardContent>

              {/* Book Now CTA — replaced by a disabled "Back on …" button while
                  the vendor is on vacation (BK-048). Card itself stays clickable
                  so the customer can still browse details / favourite. */}
              {showBookButton && (
                <CardFooter className="p-4 sm:p-5 pt-0">
                  {onVacation ? (
                    <button
                      type="button"
                      disabled
                      onClick={(e) => e.stopPropagation()}
                      title={
                        business?.vacationMessage?.trim()
                          ? business.vacationMessage.trim()
                          : "This vendor is on vacation — bookings inside the window will be refused. You can still favourite for later."
                      }
                      className="
                        w-full flex items-center justify-center gap-2
                        h-11 px-6 rounded-[4px]
                        bg-amber-100 border border-amber-300 text-amber-800
                        font-bridal text-[12px] uppercase tracking-[0.22em] font-medium
                        cursor-not-allowed
                      "
                      data-no-navigate
                    >
                      <Plane className="w-3.5 h-3.5" />
                      {vacationBackOn ? `Back on ${vacationBackOn}` : "On vacation"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBookNow}
                      className="
                        w-full flex items-center justify-center gap-2
                        h-11 px-6 rounded-[4px]
                        bg-bridal-gold text-bridal-charcoal
                        font-bridal text-[12px] uppercase tracking-[0.22em] font-medium
                        hover:bg-bridal-gold-dark hover:text-bridal-ivory
                        shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)]
                        hover:shadow-[0_12px_28px_-12px_rgba(176,125,84,0.7)]
                        transition-all duration-300
                      "
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Book Now
                    </button>
                  )}
                </CardFooter>
              )}
            </Card>
          </div>
        </motion.div>
      </div>

      {/* Login Alert Dialog */}
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent className="rounded-md bg-bridal-cream border border-bridal-beige">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display italic text-bridal-charcoal text-[22px]">
              Login Required
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bridal text-bridal-text-soft">
              Please log in to {showBookButton ? "book this vendor or add it to your favorites" : "add this vendor to your favorites"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[4px] border-bridal-beige bg-bridal-ivory hover:bg-bridal-cream font-bridal uppercase tracking-[0.2em] text-[11px] text-bridal-charcoal">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push("/login")}
              className="rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal uppercase tracking-[0.22em] text-[11px]"
            >
              Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

