"use client"

import { useMemo, useState } from "react"
import { addDays, format, isBefore, startOfToday } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Calendar18 from "@/components/calendar-18"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { 
  Star, 
  MapPin, 
  Users, 
  Car, 
  Clock, 
  ThumbsUp, 
  Phone, 
  Share2, 
  CalendarCheck,
  Heart,
  MessageCircle,
  Award,
  Shield,
  CheckCircle,
  Info,
  Camera,
  Palette,
  Utensils,
  Send,
  User,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Globe,
  Camera as CameraIcon,
  Image as ImageIcon,
  Video,
  Music,
  Flower,
  Crown,
  Sparkles,
  Zap,
  TrendingUp,
  Clock as ClockIcon,
  DollarSign,
  Package,
  Gift,
  Sparkle
} from "lucide-react"
import type { Vendor, Review } from "@/lib/types"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface VendorDetailsProps {
  vendor: Vendor
}

const dummyReviews: Review[] = [
  {
    id: "1",
    userId: "u1",
    userName: "Hira Sayyid",
    rating: 5,
    comment:
      "Absolutely amazing experience! The service was exceptional and very professional. They went above and beyond our expectations. Highly recommended for any special occasion!",
    date: "2024-02-10",
  },
  {
    id: "2",
    userId: "u2",
    userName: "Awais Ahmed",
    rating: 5,
    comment:
      "Professional Staff & Services. Quality is awesome. The attention to detail was incredible and they made our special day truly memorable. Will definitely book again!",
    date: "2024-02-08",
  },
  {
    id: "3",
    userId: "u3",
    userName: "Fatima Khan",
    rating: 4,
    comment:
      "Great service and very responsive. The team was professional and delivered exactly what we wanted. Would recommend to friends and family.",
    date: "2024-02-05",
  },
]

const dummyImages = [
  "/placeholder.jpg",
  "/placeholder.jpg", 
  "/placeholder.jpg",
  "/placeholder.jpg",
  "/placeholder.jpg",
  "/placeholder.jpg"
]

export default function VendorDetails({ vendor }: VendorDetailsProps) {
  const [reviews, setReviews] = useState<Review[]>(dummyReviews)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [isFavorite, setIsFavorite] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [newRating, setNewRating] = useState(5)
  const [newUserName, setNewUserName] = useState("")
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isDateAvailable, setIsDateAvailable] = useState<boolean | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('user_id') && localStorage.getItem('auth_token')

  const primaryImage = useMemo(() => vendor.images?.[0] || "/placeholder.jpg", [vendor.images])

  const typeToPathMap: { [key: string]: string } = {
    'Photographer': 'photographers',
    'Makeup artist': 'makeup-artists',
    'Decorator': 'decor',
    'Catering': 'catering',
    'Wedding venue': 'venues',
    'Bridal wearing': 'bridal-wear',
    'Car rental': 'car-rental',
    'Hena artist': 'henna-artists',
    'Wedding Invitations and Stationery': 'wedding-stationery',
  }

  const vendorTypePath = typeToPathMap[vendor.type] || 'vendors'

  const addReview = (newReview: Review) => {
    setReviews([...reviews, newReview])
    setNewComment("")
    setNewRating(5)
    setNewUserName("")
    toast({
      title: "Review Added!",
      description: "Thank you for your feedback!",
      variant: "default"
    })
  }

  const handleBookNow = () => {
    if (isLoggedIn) {
      router.push(`/${vendor.id}/booking`)
    } else {
      router.push('/login')
    }
  }

  const handleGetQuote = () => {
    if (isLoggedIn) {
      router.push(`/${vendor.id}/booking`)
    } else {
      router.push('/login')
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({ title: "Link copied", description: "Vendor link copied to clipboard" })
    } catch {
      toast({ title: "Copy failed", description: "Could not copy link", variant: "destructive" })
    }
  }

  const formatPrice = (price: number | string) => {
    if (typeof price === 'number') {
      return `₹${price.toLocaleString()}`
    }
    return `₹${price}`
  }

  const getVendorIcon = (type: string) => {
    const typeMap: { [key: string]: any } = {
      'Photographer': Camera,
      'Decorator': Palette,
      'Catering': Utensils,
      'Wedding venue': Shield,
      'Makeup artist': Palette,
      'Henna artist': Palette,
      'Car rental': Car,
      'Bridal wearing': Shield,
      'Wedding Invitations and Stationery': Shield
    }
    return typeMap[type] || Shield
  }

  const VendorIcon = getVendorIcon(vendor.type)

  // Mock function to check date availability
  const checkDateAvailability = (date: Date) => {
    // Simulate availability check - in real app, this would call an API
    const today = startOfToday()
    const isPast = isBefore(date, today)
    
    if (isPast) {
      return false
    }
    
    // Simulate some dates as unavailable (weekends, holidays, etc.)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday
    
    // For demo purposes, make some dates unavailable
    const day = date.getDate()
    const month = date.getMonth()
    
    // Make some specific dates unavailable for demo
    const unavailableDates = [
      new Date(2024, 11, 25), // Christmas
      new Date(2024, 11, 31), // New Year's Eve
      new Date(2025, 0, 1),   // New Year's Day
    ]
    
    const isUnavailableDate = unavailableDates.some(unavailableDate => 
      unavailableDate.getDate() === day && 
      unavailableDate.getMonth() === month
    )
    
    return !isWeekend && !isUnavailableDate
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const isAvailable = checkDateAvailability(date)
      setIsDateAvailable(isAvailable)
      
      if (isAvailable) {
        toast({
          title: "Date Available!",
          description: `${format(date, 'MMMM dd, yyyy')} is available for booking.`,
        })
      } else {
        toast({
          title: "Date Unavailable",
          description: `${format(date, 'MMMM dd, yyyy')} is not available. Please select another date.`,
          variant: "destructive"
        })
      }
    } else {
      setIsDateAvailable(null)
    }
  }

  const handleSubmitComment = () => {
    if (!newComment.trim() || !newUserName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    const newReview: Review = {
      id: String(reviews.length + 1),
      userId: "guest",
      userName: newUserName,
      rating: newRating,
      comment: newComment,
      date: new Date().toISOString().split('T')[0],
    }

    addReview(newReview)
  }

  return (
    <>
      <style jsx>{`
        .calendar-container {
          width: 100%;
          max-width: 100%;
        }
        .calendar-container .rdp {
          width: 100%;
          margin: 0;
        }
        .calendar-container .rdp-table {
          width: 100%;
        }
        .calendar-container .rdp-head_row {
          width: 100%;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 24px;
        }
        .calendar-container .rdp-row {
          width: 100%;
          justify-content: space-between;
          gap: 12px;
          margin-top: 16px;
          margin-bottom: 8px;
        }
        .calendar-container .rdp-cell {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0 8px;
          height: 64px;
        }
        .calendar-container .rdp-day {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0 4px;
          min-height: 56px;
        }
        .calendar-container .rdp-caption {
          margin-bottom: 24px;
          padding-top: 12px;
        }
        .calendar-container .rdp-nav {
          gap: 12px;
        }
        .calendar-container .rdp-nav_button {
          margin: 0 8px;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-rose-50">
      {/* Hero Section with Beautiful Background */}
      <div className="relative h-[70vh] overflow-hidden">
        {/* Background Image */}
        <Image
          src={primaryImage}
          alt={`${vendor.name} hero image`}
          fill
          priority
          className="object-cover"
        />
        {/* Color Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-900/80 via-pink-800/70 to-purple-900/60" />
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-rose-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-pink-400/30 rounded-full blur-lg animate-pulse delay-2000"></div>
        
        {/* Hero Content */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <VendorIcon className="w-8 h-8 text-rose-300" />
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                {vendor.type}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              {vendor.name}
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8 flex items-center justify-center gap-2">
              <MapPin className="w-6 h-6 text-rose-300" />
              {vendor.location || vendor.city}
            </p>
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400 fill-current" />
                <span className="text-xl font-semibold">{vendor.rating}</span>
                <span className="text-lg opacity-80">({reviews.length} reviews)</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-rose-300" />
                <span className="text-lg opacity-80">Verified</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button 
                onClick={handleBookNow}
                size="lg"
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <CalendarCheck className="w-5 h-5 mr-2" />
                Book Now
              </Button>
                             <Button 
                 variant="outline"
                 size="lg"
                 onClick={() => setIsFavorite(!isFavorite)}
                 className="border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white backdrop-blur-sm px-6 py-3 text-lg font-semibold rounded-xl transition-all duration-200"
               >
                <Heart className={`w-5 h-5 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                {isFavorite ? 'Saved' : 'Save'}
              </Button>
                             <Button
                 variant="outline"
                 size="lg"
                 onClick={handleShare}
                 className="border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white backdrop-blur-sm px-6 py-3 text-lg font-semibold rounded-xl transition-all duration-200"
                 aria-label="Share vendor link"
               >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 -mt-20 relative z-10">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/${vendorTypePath}`}>{vendor.type}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{vendor.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Vendor Info Card */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Left Side - Vendor Info */}
                  <div className="flex-1 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900">{vendor.name}</h2>
                            {vendor.sponsored && (
                              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-3 py-1">
                                <Crown className="w-4 h-4 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-neutral-600">
                            <MapPin className="w-5 h-5 mr-2 text-rose-500" />
                            <p className="text-lg">{vendor.location || vendor.city}</p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center">
                              <Star className="w-6 h-6 text-yellow-400 fill-current" />
                              <span className="ml-2 text-xl font-semibold">{vendor.rating}</span>
                              <span className="ml-2 text-neutral-600">({reviews.length} reviews)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Shield className="w-5 h-5 text-green-500" />
                              <span className="text-neutral-600">Verified</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-neutral-200">
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl">
                          <VendorIcon className="w-6 h-6 text-rose-500" />
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">Type</p>
                            <p className="text-sm text-neutral-600">{vendor.type}</p>
                          </div>
                        </div>
                        {vendor.capacity && (
                          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                            <Users className="w-6 h-6 text-blue-500" />
                            <div>
                              <p className="text-sm font-semibold text-neutral-900">Capacity</p>
                              <p className="text-sm text-neutral-600">{vendor.capacity} Guests</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                          <Clock className="w-6 h-6 text-green-500" />
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">Cancellation</p>
                            <p className="text-sm text-neutral-600">Flexible</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
                          <DollarSign className="w-6 h-6 text-purple-500" />
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">Starting Price</p>
                            <p className="text-sm text-neutral-600">{formatPrice(vendor.minimumPrice || vendor.price)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
                          <CalendarCheck className="w-6 h-6 text-orange-500" />
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">Availability</p>
                            <p className="text-sm text-neutral-600">Check Calendar</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Action Buttons */}
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleShare}
                      className="flex items-center gap-2 border-neutral-200 hover:border-rose-500 hover:text-rose-600 transition-all duration-200"
                      aria-label="Share vendor link"
                    >
                      <Share2 className="w-5 h-5" />
                      Share
                    </Button>
                    <Button variant="outline" size="lg" className="flex items-center gap-2 border-neutral-200 hover:border-rose-500 hover:text-rose-600 transition-all duration-200">
                      <MessageCircle className="w-5 h-5" />
                      Contact
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={() => {
                        const availabilityTab = document.querySelector('[data-state="active"][value="availability"]')
                        if (!availabilityTab) {
                          const tabsList = document.querySelector('[role="tablist"]')
                          const availabilityTrigger = tabsList?.querySelector('[value="availability"]') as HTMLElement
                          availabilityTrigger?.click()
                        }
                      }}
                      className="flex items-center gap-2 border-neutral-200 hover:border-rose-500 hover:text-rose-600 transition-all duration-200"
                    >
                      <CalendarCheck className="w-5 h-5" />
                      Check Availability
                    </Button>
                    <Button 
                      onClick={handleBookNow}
                      size="lg" 
                      className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <CalendarCheck className="w-5 h-5" />
                      Book Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Gallery */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                  <CameraIcon className="w-6 h-6 text-rose-500" />
                  Gallery
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6">
                  {dummyImages.map((image, index) => (
                    <div 
                      key={index}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 ${
                        selectedImage === index ? 'ring-4 ring-rose-500' : 'hover:shadow-lg'
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <Image
                        src={image}
                        alt={`${vendor.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      {selectedImage === index && (
                        <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center">
                          <CameraIcon className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tabs Content */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full p-0 bg-transparent border-b border-neutral-200 rounded-none">
                  <TabsTrigger
                    value="details"
                    className="flex-1 rounded-none border-b-2 data-[state=active]:border-rose-500 data-[state=active]:text-rose-600 text-neutral-600 hover:text-rose-600 transition-all duration-200"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="pricing"
                    className="flex-1 rounded-none border-b-2 data-[state=active]:border-rose-500 data-[state=active]:text-rose-600 text-neutral-600 hover:text-rose-600 transition-all duration-200"
                  >
                    Pricing
                  </TabsTrigger>
                  <TabsTrigger
                    value="availability"
                    className="flex-1 rounded-none border-b-2 data-[state=active]:border-rose-500 data-[state=active]:text-rose-600 text-neutral-600 hover:text-rose-600 transition-all duration-200"
                  >
                    Availability
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="flex-1 rounded-none border-b-2 data-[state=active]:border-rose-500 data-[state=active]:text-rose-600 text-neutral-600 hover:text-rose-600 transition-all duration-200"
                  >
                    Reviews
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="p-8">
                  <div className="space-y-8">
                    {/* Description */}
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-rose-500" />
                        Description
                      </h3>
                      <p className="text-neutral-600 leading-relaxed text-lg">
                        {vendor.description || `${vendor.name} is a premier ${vendor.type.toLowerCase()} offering exceptional services for your special day. Our dedicated team ensures every detail is perfect for your celebration. We pride ourselves on delivering outstanding quality and creating unforgettable memories for your most important moments.`}
                      </p>
                    </div>

                    {/* Amenities */}
                    {vendor.amenities && vendor.amenities.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-rose-500" />
                          Services & Amenities
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {vendor.amenities.map((amenity, index) => (
                            <div key={index} className="flex items-center gap-3 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-100">
                              <div className="w-3 h-3 bg-rose-500 rounded-full" />
                              <span className="text-neutral-700 font-medium">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Information */}
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-6">Additional Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex justify-between py-3 border-b border-neutral-200">
                            <span className="font-semibold text-neutral-700">Service Type</span>
                            <span className="text-neutral-600">{vendor.type}</span>
                          </div>
                          {vendor.capacity && (
                            <div className="flex justify-between py-3 border-b border-neutral-200">
                              <span className="font-semibold text-neutral-700">Capacity</span>
                              <span className="text-neutral-600">{vendor.capacity} guests</span>
                            </div>
                          )}
                          <div className="flex justify-between py-3 border-b border-neutral-200">
                            <span className="font-semibold text-neutral-700">Starting Price</span>
                            <span className="text-neutral-600 font-bold text-rose-600">{formatPrice(vendor.minimumPrice || vendor.price)}</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between py-3 border-b border-neutral-200">
                            <span className="font-semibold text-neutral-700">Rating</span>
                            <span className="text-neutral-600">{vendor.rating}/5</span>
                          </div>
                          <div className="flex justify-between py-3 border-b border-neutral-200">
                            <span className="font-semibold text-neutral-700">Reviews</span>
                            <span className="text-neutral-600">{reviews.length}</span>
                          </div>
                          <div className="flex justify-between py-3 border-b border-neutral-200">
                            <span className="font-semibold text-neutral-700">Location</span>
                            <span className="text-neutral-600">{vendor.location || vendor.city}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="p-8">
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-neutral-900">Pricing Information</h3>
                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-8 rounded-2xl border border-rose-100">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-rose-600 mb-4">
                          {formatPrice(vendor.minimumPrice || vendor.price)}
                        </div>
                        <p className="text-neutral-600 text-lg mb-6">Starting price</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                          <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                            <Package className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                            <h4 className="font-semibold text-neutral-900 mb-2">Basic Package</h4>
                            <p className="text-sm text-neutral-600">Essential services included</p>
                          </div>
                          <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                            <Gift className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                            <h4 className="font-semibold text-neutral-900 mb-2">Premium Package</h4>
                            <p className="text-sm text-neutral-600">Enhanced services & extras</p>
                          </div>
                          <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                            <Crown className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                            <h4 className="font-semibold text-neutral-900 mb-2">Luxury Package</h4>
                            <p className="text-sm text-neutral-600">Complete premium experience</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-neutral-600 text-center text-lg">
                      Contact us for detailed pricing and package information tailored to your specific needs.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="availability" className="p-8">
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                      <CalendarCheck className="w-6 h-6 text-rose-500" />
                      Check Availability
                    </h3>
                    
                    <div className="space-y-8">
                      {/* Calendar Section */}
                      <div className="space-y-6 w-full">
                        <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-8 rounded-2xl border border-rose-100 w-full calendar-container">
                          <h4 className="text-xl font-semibold text-neutral-900 mb-6">Select Your Date</h4>
                          <Calendar18 
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            disabled={(date) => {
                              const today = startOfToday()
                              return isBefore(date, today)
                            }}
                          />
                        </div>
                        
                        {/* Availability Status */}
                        {selectedDate && (
                          <div className={`p-4 rounded-xl border ${
                            isDateAvailable 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                isDateAvailable ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              <div>
                                <h5 className="font-semibold text-neutral-900">
                                  {format(selectedDate, 'MMMM dd, yyyy')}
                                </h5>
                                <p className={`text-sm ${
                                  isDateAvailable ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {isDateAvailable ? 'Available for booking' : 'Not available'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Availability Info */}
                      <div className="space-y-6 w-full">
                        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                          <h4 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-rose-500" />
                            Availability Information
                          </h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                              <span className="text-neutral-600">Available Days</span>
                              <span className="font-semibold text-neutral-900">Monday - Friday</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                              <span className="text-neutral-600">Booking Lead Time</span>
                              <span className="font-semibold text-neutral-900">2 weeks minimum</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                              <span className="text-neutral-600">Peak Season</span>
                              <span className="font-semibold text-neutral-900">October - March</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <span className="text-neutral-600">Cancellation Policy</span>
                              <span className="font-semibold text-neutral-900">Flexible</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-3">
                          <Button 
                            onClick={handleBookNow}
                            disabled={!selectedDate || !isDateAvailable}
                            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
                          >
                            <CalendarCheck className="w-4 h-4 mr-2" />
                            Book This Date
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={handleGetQuote}
                            className="w-full border-rose-200 text-rose-600 hover:bg-rose-50"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Get Quote
                          </Button>
                        </div>

                        {/* Availability Tips */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                          <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Booking Tips
                          </h5>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Book early for peak season dates</li>
                            <li>• Weekends and holidays fill up quickly</li>
                            <li>• Contact us for custom date requests</li>
                            <li>• Flexible cancellation up to 7 days before</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="p-8">
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-neutral-900">Customer Reviews</h3>
                    
                    {/* Add Review Section */}
                    <Card className="border-2 border-dashed border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-rose-500" />
                          Add Your Review
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-semibold text-neutral-700 mb-2 block">Your Name</label>
                            <Input
                              placeholder="Enter your name"
                              value={newUserName}
                              onChange={(e) => setNewUserName(e.target.value)}
                              className="border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-neutral-700 mb-2 block">Rating</label>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setNewRating(star)}
                                  className="p-1 hover:scale-110 transition-transform duration-200"
                                >
                                  <Star 
                                    className={`w-6 h-6 ${
                                      star <= newRating 
                                        ? 'text-yellow-400 fill-current' 
                                        : 'text-neutral-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-neutral-700 mb-2 block">Your Review</label>
                          <Textarea
                            placeholder="Share your experience with this vendor..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[100px] border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                          />
                        </div>
                        <Button 
                          onClick={handleSubmitComment}
                          className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Submit Review
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Reviews List */}
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <Card key={review.id} className="shadow-sm border-neutral-200 hover:shadow-md transition-shadow duration-200">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-neutral-900">{review.userName}</h4>
                                  <div className="flex items-center gap-2">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-neutral-300'}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm text-neutral-500">{review.date}</span>
                            </div>
                            <p className="text-neutral-600 leading-relaxed">{review.comment}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* FAQs */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                  <Info className="w-6 h-6 text-rose-500" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="booking" className="border-neutral-200">
                    <AccordionTrigger className="text-lg font-semibold text-neutral-900 hover:text-rose-600 transition-colors duration-200">
                      How can I book this service?
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-600 leading-relaxed">
                      You can book this service by contacting us directly or using our online booking system. We'll guide
                      you through the process and help you select the perfect package for your event. Our team is available 24/7 to assist you.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="payment" className="border-neutral-200">
                    <AccordionTrigger className="text-lg font-semibold text-neutral-900 hover:text-rose-600 transition-colors duration-200">
                      What are the payment terms?
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-600 leading-relaxed">
                      We require a 30% advance payment to confirm your booking. The remaining amount should be paid one
                      week before the event date. We accept all major credit cards, bank transfers, and digital payments.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cancellation" className="border-neutral-200">
                    <AccordionTrigger className="text-lg font-semibold text-neutral-900 hover:text-rose-600 transition-colors duration-200">
                      What is the cancellation policy?
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-600 leading-relaxed">
                      Our service follows a flexible cancellation policy. Please contact us for specific details about
                      refunds and rescheduling. We understand that plans can change and we're here to accommodate your needs.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="services" className="border-neutral-200">
                    <AccordionTrigger className="text-lg font-semibold text-neutral-900 hover:text-rose-600 transition-colors duration-200">
                      What services are included?
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-600 leading-relaxed">
                      Our service includes professional equipment, experienced staff, and quality materials. Additional
                      services can be arranged upon request. We customize our packages to meet your specific requirements.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Calendar Card */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-rose-500" />
                  Check Available Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Calendar18 
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => {
                    const today = startOfToday()
                    return isBefore(date, today)
                  }}
                />
                <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white" size="lg">
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  Check Availability
                </Button>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-rose-500" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-neutral-600">{vendor.location || vendor.city}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-neutral-600">+91 98765 43210</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
                    <Mail className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-neutral-600">info@{vendor.name.toLowerCase().replace(/\s+/g, '')}.com</span>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white" size="lg">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            {/* Price Card */}
            <Card className="shadow-xl border-0 bg-gradient-to-r from-rose-500 to-pink-600 text-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Starting Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-4">
                    {formatPrice(vendor.minimumPrice || vendor.price)}
                  </div>
                  <p className="text-rose-100 mb-6">per service</p>
                  <Button 
                    onClick={handleGetQuote}
                    className="w-full bg-white text-rose-600 hover:bg-rose-50 font-semibold" 
                    size="lg"
                  >
                    Get Quote
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-rose-500" />
                  Follow Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-neutral-200 hover:border-blue-500 hover:text-blue-600">
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-neutral-200 hover:border-pink-500 hover:text-pink-600">
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-neutral-200 hover:border-blue-400 hover:text-blue-600">
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-neutral-200 hover:border-blue-600 hover:text-blue-600">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-neutral-200 p-3 sm:hidden">
        <div className="container mx-auto px-2 flex gap-3">
          <Button
            onClick={handleGetQuote}
            variant="outline"
            className="flex-1 border-neutral-200"
            aria-label="Contact vendor"
          >
            <MessageCircle className="w-4 h-4 mr-2" /> Contact
          </Button>
          <Button
            onClick={handleBookNow}
            className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
            aria-label="Book now"
          >
            <CalendarCheck className="w-4 h-4 mr-2" /> Book Now
          </Button>
        </div>
      </div>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: vendor.name,
            image: vendor.images && vendor.images.length ? vendor.images : [primaryImage],
            address: {
              "@type": "PostalAddress",
              addressLocality: vendor.city || vendor.location || "",
            },
            aggregateRating: vendor.rating
              ? { "@type": "AggregateRating", ratingValue: vendor.rating, reviewCount: reviews.length }
              : undefined,
            priceRange: vendor.minimumPrice || vendor.price ? `₹${Number(vendor.minimumPrice || vendor.price).toLocaleString()}` : undefined,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            telephone: "+91 98765 43210",
          }),
        }}
      />
    </div>
    </>
  )
} 