"use client"

import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { format } from "date-fns"
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Autoplay, EffectFade, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/effect-fade"
import "swiper/css/navigation"
import "swiper/css/pagination"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Star,
  MapPin,
  Users,
  Clock,
  Share2,
  CalendarCheck,
  Heart,
  MessageCircle,
  Shield,
  CheckCircle,
  Camera,
  Palette,
  Utensils,
  Crown,
  Sparkles,
  Car,
  Gift,
  Package,
  DollarSign,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  X,
  Expand,
} from "lucide-react"
import type { Vendor, Review, AvailabilityDay, VendorMenu } from "@/lib/types"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper"
import { useUser } from "@/context/UserContext"
import { ChatDrawer } from "@/components/chat/chat-drawer"
import { toast as sonnerToast } from "sonner"

interface VendorDetailsMobileProps {
  vendor: Vendor
}


// Scroll-spy section IDs (menus conditionally added at render time)
const BASE_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "gallery", label: "Gallery" },
  { id: "packages", label: "Packages" },
  { id: "menus", label: "Menus" },
  { id: "reviews", label: "Reviews" },
  { id: "availability", label: "Availability" },
] as const

// Animated review bar component
function AnimatedBar({ percentage, color, label, count }: { percentage: number; color: string; label: string; count: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <div ref={ref} className="flex items-center gap-3">
      <span className="text-sm font-medium text-neutral-600 w-8">{label}</span>
      <div className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${percentage}%` } : { width: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs text-neutral-500 w-6 text-right">{count}</span>
    </div>
  )
}

// Circular SVG rating component
function CircularRating({ rating, size = 100 }: { rating: number; size?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const circumference = 2 * Math.PI * 40
  const progress = (rating / 5) * circumference
  const offset = circumference - progress

  const ratingColor = rating >= 4.5 ? "text-emerald-500" : rating >= 4 ? "text-purple-500" : rating >= 3 ? "text-gold-500" : "text-neutral-400"
  const strokeColor = rating >= 4.5 ? "#10b981" : rating >= 4 ? "#8b5cf6" : rating >= 3 ? "#D4AF37" : "#9ca3af"
  const ratingLabel = rating >= 4.5 ? "Exceptional" : rating >= 4 ? "Excellent" : rating >= 3 ? "Very Good" : "Good"

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r="40" fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={isInView ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${ratingColor}`}>{rating.toFixed(1)}</span>
          <span className="text-[10px] text-neutral-400">/5</span>
        </div>
      </div>
      <span className={`text-sm font-semibold ${ratingColor}`}>{ratingLabel}</span>
    </div>
  )
}

export default function VendorDetailsMobile({ vendor }: VendorDetailsMobileProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [activeSection, setActiveSection] = useState("overview")
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated } = useUser()

  const handleMessageVendor = () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (!vendor.userId) {
      sonnerToast.error('Unable to message this vendor at the moment.')
      return
    }
    setChatDrawerOpen(true)
  }

  // Refs for scroll-spy sections
  const heroRef = useRef<HTMLDivElement>(null)
  const overviewRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)
  const packagesRef = useRef<HTMLDivElement>(null)
  const menusRef = useRef<HTMLDivElement>(null)
  const reviewsRef = useRef<HTMLDivElement>(null)
  const availabilityRef = useRef<HTMLDivElement>(null)
  const scrollSpyNavRef = useRef<HTMLDivElement>(null)

  // Parallax for hero
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  // Whether this vendor has menus to display
  const hasMenus = Array.isArray(vendor.menus) && vendor.menus.length > 0

  // Filter sections based on vendor data
  const SECTIONS = useMemo(() =>
    BASE_SECTIONS.filter((s) => s.id !== "menus" || hasMenus),
    [hasMenus]
  )

  // Section refs map for scroll-spy
  const sectionRefs = useMemo(() => ({
    overview: overviewRef,
    gallery: galleryRef,
    packages: packagesRef,
    ...(hasMenus ? { menus: menusRef } : {}),
    reviews: reviewsRef,
    availability: availabilityRef,
  }), [hasMenus])

  // Load favorite status from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites')
    if (savedFavorites) {
      const favorites = JSON.parse(savedFavorites)
      setIsFavorite(favorites.includes(vendor.id))
    }
  }, [vendor.id])

  // Scroll-spy IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    const entries = Object.entries(sectionRefs) as [string, React.RefObject<HTMLDivElement | null>][]

    entries.forEach(([id, ref]) => {
      if (!ref.current) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id)
          }
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
      )
      observer.observe(ref.current)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [sectionRefs])

  // Save favorite status to localStorage
  const handleFavoriteToggle = () => {
    const newFavoriteStatus = !isFavorite
    setIsFavorite(newFavoriteStatus)

    const savedFavorites = localStorage.getItem('favorites')
    let favorites = savedFavorites ? JSON.parse(savedFavorites) : []

    if (newFavoriteStatus) {
      if (!favorites.includes(vendor.id)) {
        favorites.push(vendor.id)
      }
    } else {
      favorites = favorites.filter((id: string) => id !== vendor.id)
    }

    localStorage.setItem('favorites', JSON.stringify(favorites))
  }

  const primaryImage = useMemo(() => vendor.images?.[0] || "/placeholder.jpg", [vendor.images])
  const galleryImages = useMemo(() => vendor.images?.length ? vendor.images : ["/placeholder.jpg"], [vendor.images])

  // Helper function to check if a date is available
  const isDateAvailable = (date: Date): boolean => {
    if (!vendor.availability?.availability) return false
    const dateString = format(date, 'yyyy-MM-dd')
    const availabilityDay = vendor.availability.availability.find(day => day.date === dateString)
    return availabilityDay ? availabilityDay.isAvailable && availabilityDay.availableCount > 0 : false
  }

  // Helper function to get availability info for a date
  const getAvailabilityInfo = (date: Date): AvailabilityDay | null => {
    if (!vendor.availability?.availability) return null
    const dateString = format(date, 'yyyy-MM-dd')
    return vendor.availability.availability.find(day => day.date === dateString) || null
  }

  // Helper function to check if date is in the past
  const isDateInPast = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  // Helper function to check if date is within availability period
  const isDateInAvailabilityPeriod = (date: Date): boolean => {
    if (!vendor.availability?.availabilityPeriod) return false
    const { startDate, endDate } = vendor.availability.availabilityPeriod
    const dateString = format(date, 'yyyy-MM-dd')
    return dateString >= startDate && dateString <= endDate
  }

  const handleDateSelect = (date: Date) => {
    if (isDateInPast(date) || !isDateAvailable(date)) return
    setSelectedDate(date)
  }

  const handleBookNow = () => {
    const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('user_id')
    if (isLoggedIn) {
      router.push(`/${vendor.id}/booking`)
    } else {
      router.push('/login')
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: vendor.name,
          text: `Check out ${vendor.name} - ${vendor.type}`,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link Copied!",
          description: "Vendor link has been copied to clipboard",
        })
      }
    } catch (error) {
      // share failed silently
    }
  }

  const formatPrice = (price: number) => {
    return `Rs. ${new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)}`
  }

  const getVendorIcon = (type: string | undefined) => {
    if (!type) return Package
    const iconMap: { [key: string]: any } = {
      'Photographer': Camera,
      'Makeup artist': Palette,
      'Decorator': Sparkles,
      'Catering': Utensils,
      'Wedding venue': Crown,
      'Bridal wearing': Sparkles,
      'Car rental': Car,
      'Hena artist': Palette,
      'Wedding Invitations and Stationery': Gift,
    }
    return iconMap[type] || Package
  }

  const VendorIcon = getVendorIcon(vendor.type)

  // Calendar functions
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  const formatMonthYear = (date: Date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  const goToToday = () => setCurrentDate(new Date())

  const scrollToSection = useCallback((sectionId: string) => {
    const ref = sectionRefs[sectionId as keyof typeof sectionRefs]
    if (ref?.current) {
      const yOffset = -80
      const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: "smooth" })
    }
  }, [sectionRefs])

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  // Review stats calculation
  const allReviews = vendor.reviews || []
  const avgRating = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : vendor.rating || 0
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allReviews.filter((r) => r.rating === star).length,
    percentage: (allReviews.filter((r) => r.rating === star).length / allReviews.length) * 100,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-purple-50/30">
      {/* ===== PARALLAX HERO SECTION ===== */}
      <div ref={heroRef} className="relative h-[55vh] sm:h-[65vh] lg:h-[75vh] overflow-hidden">
        {/* Swiper Carousel with Ken Burns */}
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <Swiper
            modules={[Autoplay, EffectFade]}
            effect="fade"
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={galleryImages.length > 1}
            className="h-full w-full"
          >
            {galleryImages.slice(0, 5).map((img, i) => (
              <SwiperSlide key={i}>
                <div className="relative h-full w-full">
                  <Image
                    src={img}
                    alt={`${vendor.name} - ${i + 1}`}
                    fill
                    priority={i === 0}
                    className="object-cover animate-ken-burns"
                    sizes="100vw"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>

        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/60 via-purple-900/40 to-purple-950/80 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/30 via-transparent to-purple-950/30 z-10" />

        {/* Top navigation bar */}
        <motion.div style={{ opacity: heroOpacity }} className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavoriteToggle}
              className="p-2.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 hover:text-white"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="p-2.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 hover:text-white"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute bottom-0 left-0 right-0 z-20 p-6 sm:p-8 lg:p-12"
        >
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-md text-xs px-3 py-1">
                  <VendorIcon className="w-3.5 h-3.5 mr-1.5" />
                  {vendor.type || "Vendor"}
                </Badge>
                {vendor.sponsored && (
                  <Badge className="bg-gold-500/90 text-white border-0 text-xs px-3 py-1">
                    <Crown className="w-3.5 h-3.5 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-3 leading-tight">
                {vendor.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 mb-5">
                <span className="flex items-center gap-1.5 text-sm sm:text-base">
                  <MapPin className="w-4 h-4 text-purple-300" />
                  {vendor.location || vendor.city}
                </span>
                <span className="flex items-center gap-1.5 text-sm sm:text-base">
                  <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                  {vendor.rating?.toFixed(1)} ({allReviews.length} reviews)
                </span>
                <span className="flex items-center gap-1.5 text-sm sm:text-base">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Verified
                </span>
              </div>

              {/* Price + CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="text-white">
                  <span className="text-xs text-white/60 uppercase tracking-wider">Starting from</span>
                  <p className="text-2xl sm:text-3xl font-bold text-gold-300">
                    {formatPrice(vendor.minimumPrice || vendor.price)}
                  </p>
                </div>
                <Button
                  onClick={handleBookNow}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 text-base font-semibold rounded-xl shadow-lg shadow-purple-900/30 hover:shadow-xl transition-all duration-300"
                >
                  <CalendarCheck className="w-5 h-5 mr-2" />
                  Book Now
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Image counter badge */}
        <div className="absolute bottom-6 right-6 z-20">
          <button
            onClick={() => openLightbox(0)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full text-white text-xs border border-white/10 hover:bg-black/50 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            {galleryImages.length} Photos
          </button>
        </div>
      </div>

      {/* ===== SCROLL-SPY NAVIGATION ===== */}
      <div
        ref={scrollSpyNavRef}
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-purple-100/50 shadow-sm"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none px-4 py-2">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`relative px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300 ${
                  activeSection === section.id
                    ? "text-purple-700 bg-purple-50"
                    : "text-neutral-500 hover:text-purple-600 hover:bg-purple-50/50"
                }`}
              >
                {section.label}
                {activeSection === section.id && (
                  <motion.div
                    layoutId="scrollspy-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-purple-600 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-12">

            {/* ===== OVERVIEW SECTION ===== */}
            <section ref={overviewRef} id="overview">
              <ScrollReveal>
                <div className="space-y-8">
                  {/* Quick stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-purple-50/80 rounded-2xl text-center">
                      <VendorIcon className="w-5 h-5 text-purple-500 mx-auto mb-1.5" />
                      <p className="text-xs text-neutral-500">Type</p>
                      <p className="text-sm font-semibold text-neutral-800 truncate">{vendor.type || "Vendor"}</p>
                    </div>
                    {vendor.capacity && (
                      <div className="p-4 bg-blue-50/80 rounded-2xl text-center">
                        <Users className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
                        <p className="text-xs text-neutral-500">Capacity</p>
                        <p className="text-sm font-semibold text-neutral-800">{vendor.capacity} Guests</p>
                      </div>
                    )}
                    <div className="p-4 bg-green-50/80 rounded-2xl text-center">
                      <Clock className="w-5 h-5 text-green-500 mx-auto mb-1.5" />
                      <p className="text-xs text-neutral-500">Cancellation</p>
                      <p className="text-sm font-semibold text-neutral-800">Flexible</p>
                    </div>
                    <div className="p-4 bg-orange-50/80 rounded-2xl text-center">
                      <DollarSign className="w-5 h-5 text-orange-500 mx-auto mb-1.5" />
                      <p className="text-xs text-neutral-500">Starting</p>
                      <p className="text-sm font-semibold text-neutral-800">{formatPrice(vendor.minimumPrice || vendor.price)}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h2 className="text-xl font-heading font-bold text-neutral-900 mb-3">About</h2>
                    <p className="text-neutral-600 leading-relaxed">{vendor.description}</p>
                  </div>

                  {/* Amenities */}
                  {vendor.amenities?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-heading font-semibold text-neutral-900 mb-4">Amenities & Services</h3>
                      <StaggerContainer staggerDelay={0.05} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {vendor.amenities.map((amenity, index) => (
                          <StaggerItem key={index}>
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-neutral-100 hover:border-purple-200 hover:shadow-sm transition-all duration-200">
                              <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                              <span className="text-sm text-neutral-700">{amenity}</span>
                            </div>
                          </StaggerItem>
                        ))}
                      </StaggerContainer>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </section>

            {/* ===== GALLERY SECTION ===== */}
            <section ref={galleryRef} id="gallery">
              <ScrollReveal>
                <h2 className="text-xl font-heading font-bold text-neutral-900 mb-5">Gallery</h2>
              </ScrollReveal>
              <div className="columns-2 sm:columns-3 gap-3 space-y-3">
                {galleryImages.map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="break-inside-avoid cursor-pointer group relative rounded-xl overflow-hidden"
                    onClick={() => openLightbox(i)}
                  >
                    <div className={`relative ${i % 3 === 0 ? "aspect-[3/4]" : i % 3 === 1 ? "aspect-square" : "aspect-[4/3]"}`}>
                      <Image
                        src={img}
                        alt={`${vendor.name} gallery ${i + 1}`}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-purple-950/0 group-hover:bg-purple-950/30 transition-colors duration-300 flex items-center justify-center">
                        <Expand className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ===== PACKAGES SECTION ===== */}
            <section ref={packagesRef} id="packages">
              <ScrollReveal>
                <h2 className="text-xl font-heading font-bold text-neutral-900 mb-5">Packages & Pricing</h2>
              </ScrollReveal>
              <StaggerContainer staggerDelay={0.1} className="space-y-4">
                {vendor.packages?.map((pkg, index) => (
                  <StaggerItem key={index}>
                    <Card className="border-neutral-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
                      {index === 0 && (
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-center py-1.5 text-xs font-semibold tracking-wide uppercase">
                          Most Popular
                        </div>
                      )}
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-neutral-900">{pkg.name}</h3>
                            <p className="text-sm text-neutral-500 mt-1">{pkg.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-purple-700">{formatPrice(pkg.price)}</p>
                            {pkg.duration && <p className="text-xs text-neutral-400">{pkg.duration}</p>}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                          {pkg.features?.map((feature, fi) => (
                            <div key={fi} className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              <span className="text-sm text-neutral-600">{feature}</span>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={handleBookNow}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl"
                        >
                          Select Package
                        </Button>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>

            {/* ===== MENUS SECTION ===== */}
            {hasMenus && (
              <section ref={menusRef} id="menus">
                <ScrollReveal>
                  <h2 className="text-xl font-heading font-bold text-neutral-900 mb-5">
                    <span className="flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-purple-500" />
                      Menus
                    </span>
                  </h2>
                </ScrollReveal>
                <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vendor.menus!.map((menu, index) => {
                    const menuItems = Array.isArray(menu.data?.items) ? menu.data!.items : []
                    return (
                      <StaggerItem key={menu.id ?? index}>
                        <Card className="border-neutral-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 h-full">
                          <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <h3 className="text-lg font-semibold text-neutral-900 capitalize">{menu.title}</h3>
                              <Badge className="bg-purple-100 text-purple-700 border-purple-200 shrink-0">
                                Rs. {menu.price?.toLocaleString()}
                                <span className="text-[10px] font-normal ml-0.5">/ head</span>
                              </Badge>
                            </div>
                            {menuItems.length > 0 && (
                              <div className="flex-1">
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Includes</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {menuItems.map((item, i) => (
                                    <Badge key={i} variant="outline" className="text-xs font-normal bg-neutral-50">
                                      {String(item)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <Button
                              onClick={handleBookNow}
                              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl"
                            >
                              Select Menu
                            </Button>
                          </CardContent>
                        </Card>
                      </StaggerItem>
                    )
                  })}
                </StaggerContainer>
              </section>
            )}

            {/* ===== REVIEWS SECTION ===== */}
            <section ref={reviewsRef} id="reviews">
              <ScrollReveal>
                <h2 className="text-xl font-heading font-bold text-neutral-900 mb-6">Reviews & Ratings</h2>
              </ScrollReveal>

              {/* Review summary */}
              <ScrollReveal>
                <Card className="border-neutral-100 mb-6">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                      <CircularRating rating={avgRating} size={120} />
                      <div className="flex-1 w-full space-y-2">
                        {ratingDistribution.map((item) => (
                          <AnimatedBar
                            key={item.star}
                            label={`${item.star}`}
                            percentage={item.percentage}
                            count={item.count}
                            color={
                              item.star >= 4 ? "bg-emerald-500" :
                              item.star === 3 ? "bg-gold-500" :
                              "bg-orange-400"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              {/* Individual reviews */}
              {allReviews.length === 0 && (
                <p className="text-sm text-neutral-500 text-center py-8">No reviews yet. Be the first to book and leave a review!</p>
              )}
              <StaggerContainer staggerDelay={0.1} className="space-y-4">
                {allReviews.map((review) => (
                  <StaggerItem key={review.id}>
                    <Card className="border-neutral-100 hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold text-sm">
                              {review.userName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-neutral-900">{review.userName}</h4>
                              <p className="text-xs text-neutral-400">{review.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < review.rating ? "text-gold-400 fill-gold-400" : "text-neutral-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-neutral-600 leading-relaxed">{review.comment}</p>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>

            {/* ===== AVAILABILITY SECTION ===== */}
            <section ref={availabilityRef} id="availability">
              <ScrollReveal>
                <h2 className="text-xl font-heading font-bold text-neutral-900 mb-5">Check Availability</h2>
              </ScrollReveal>

              <ScrollReveal>
                <Card className="border-neutral-100">
                  <CardContent className="p-5 sm:p-6">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-purple-50">
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <h4 className="text-base font-semibold text-neutral-900">{formatMonthYear(currentDate)}</h4>
                        <Button variant="ghost" size="sm" onClick={goToNextMonth} className="p-2 rounded-full hover:bg-purple-50">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button variant="outline" size="sm" onClick={goToToday} className="text-xs border-purple-300 text-purple-600 hover:bg-purple-50">
                        Today
                      </Button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-neutral-500 py-2">{day}</div>
                      ))}
                      {(() => {
                        const daysInMonth = getDaysInMonth(currentDate)
                        const firstDayOfMonth = getFirstDayOfMonth(currentDate)
                        const today = new Date()
                        const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()
                        const calendarDays = []

                        for (let i = 0; i < firstDayOfMonth; i++) {
                          calendarDays.push(<div key={`empty-${i}`} className="py-2" />)
                        }

                        for (let day = 1; day <= daysInMonth; day++) {
                          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                          const available = isDateAvailable(date)
                          const isToday = isCurrentMonth && day === today.getDate()
                          const isPast = isDateInPast(date)
                          const isInPeriod = isDateInAvailabilityPeriod(date)
                          const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                          const availabilityInfo = getAvailabilityInfo(date)

                          calendarDays.push(
                            <div
                              key={day}
                              onClick={() => handleDateSelect(date)}
                              className={`text-center text-xs sm:text-sm py-2 rounded-lg transition-all duration-200 relative ${
                                isSelected
                                  ? "bg-purple-600 text-white font-semibold shadow-lg"
                                  : isToday
                                    ? "bg-purple-100 text-purple-700 font-semibold"
                                    : available && isInPeriod && !isPast
                                      ? "hover:bg-purple-50 text-neutral-900 cursor-pointer"
                                      : "text-neutral-300 cursor-not-allowed"
                              }`}
                            >
                              {day}
                              {availabilityInfo && availabilityInfo.availableCount > 0 && !isSelected && (
                                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              )}
                            </div>
                          )
                        }
                        return calendarDays
                      })()}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 text-xs text-neutral-500 flex-wrap">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-purple-100 rounded-full" /> Today</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-purple-600 rounded-full" /> Selected</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Available</span>
                    </div>

                    {/* Selected date details */}
                    {selectedDate && (() => {
                      const info = getAvailabilityInfo(selectedDate)
                      return info ? (
                        <div className="mt-5 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                          <div className="flex items-start gap-3">
                            <CalendarCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-neutral-900 mb-1">
                                {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                                  {info.availableCount} of {info.totalSlots} slots
                                </Badge>
                              </div>
                              {info.availableSlots.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {info.availableSlots.map((slot, i) => {
                                    const time = slot.replace(/^(\d{1,2}):(\d{2})$/, (_m: string, hour: string, minute: string) => {
                                      const h = parseInt(hour)
                                      return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${minute} ${h >= 12 ? 'PM' : 'AM'}`
                                    })
                                    return <Badge key={i} variant="outline" className="text-xs">{time}</Badge>
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null
                    })()}
                  </CardContent>
                </Card>
              </ScrollReveal>
            </section>
          </div>

          {/* ===== STICKY SIDEBAR (Desktop) ===== */}
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-5">
              {/* Booking card */}
              <Card className="border-purple-100 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center mb-5">
                    <span className="text-xs text-neutral-500 uppercase tracking-wider">Starting from</span>
                    <p className="text-3xl font-bold text-purple-700">{formatPrice(vendor.minimumPrice || vendor.price)}</p>
                  </div>
                  <Button
                    onClick={handleBookNow}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl text-base font-semibold shadow-lg shadow-purple-200/50 hover:shadow-xl transition-all duration-300 mb-3"
                  >
                    <CalendarCheck className="w-5 h-5 mr-2" />
                    Book Now
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleFavoriteToggle}
                    className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl"
                  >
                    <Heart className={`w-5 h-5 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    {isFavorite ? "Saved" : "Save to Favorites"}
                  </Button>
                </CardContent>
              </Card>

              {/* Location & Contact card */}
              <Card className="border-neutral-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-500" />
                    Get in Touch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span>{vendor.location || vendor.city}</span>
                  </div>
                  <Button
                    onClick={handleMessageVendor}
                    variant="outline"
                    size="sm"
                    className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl mt-2"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message Vendor
                  </Button>
                  <Button
                    onClick={handleBookNow}
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl"
                  >
                    <CalendarCheck className="w-4 h-4 mr-2" />
                    Book & Get Contact Details
                  </Button>
                </CardContent>
              </Card>

              {/* Share card */}
              <Button
                variant="outline"
                onClick={handleShare}
                className="w-full border-neutral-200 text-neutral-600 hover:text-purple-600 hover:border-purple-200"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share this vendor
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FIXED BOTTOM BAR (Mobile) ===== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-purple-100/50 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">From</span>
            <p className="text-lg font-bold text-purple-700">{formatPrice(vendor.minimumPrice || vendor.price)}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFavoriteToggle}
            className="p-2.5 border-purple-200 rounded-xl"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-purple-500'}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMessageVendor}
            className="p-2.5 border-purple-200 rounded-xl"
          >
            <MessageCircle className="w-5 h-5 text-purple-500" />
          </Button>
          <Button
            onClick={handleBookNow}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 rounded-xl font-semibold shadow-lg shadow-purple-200/50"
          >
            Book Now
          </Button>
        </div>
      </div>

      {/* Bottom spacer for fixed bar */}
      <div className="lg:hidden h-20" />

      {/* ===== LIGHTBOX DIALOG ===== */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0 rounded-2xl overflow-hidden">
          <DialogTitle className="sr-only">Gallery - {vendor.name}</DialogTitle>
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Close gallery"
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            initialSlide={lightboxIndex}
            className="h-[85vh] w-full lightbox-swiper"
          >
            {galleryImages.map((img, i) => (
              <SwiperSlide key={i} className="flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <Image
                    src={img}
                    alt={`${vendor.name} - ${i + 1}`}
                    fill
                    className="object-contain"
                    sizes="95vw"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </DialogContent>
      </Dialog>

      {/* Chat Drawer */}
      {vendor.userId && (
        <ChatDrawer
          open={chatDrawerOpen}
          onOpenChange={setChatDrawerOpen}
          vendorUserId={vendor.userId}
          vendorName={vendor.name}
          vendorImage={vendor.images?.[0]}
        />
      )}
    </div>
  )
}
