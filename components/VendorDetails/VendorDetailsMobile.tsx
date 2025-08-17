"use client"

import { useMemo, useState, useEffect } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Star, 
  MapPin, 
  Users, 
  Clock, 
  Phone, 
  Share2, 
  CalendarCheck,
  Heart,
  MessageCircle,
  Award,
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
  Calendar
} from "lucide-react"
import type { Vendor, Review } from "@/lib/types"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface VendorDetailsMobileProps {
  vendor: Vendor
}

const dummyReviews: Review[] = [
  {
    id: "1",
    userId: "u1",
    userName: "Hira Sayyid",
    rating: 5,
    comment: "Absolutely amazing experience! The service was exceptional and very professional.",
    date: "2024-02-10",
  },
  {
    id: "2",
    userId: "u2",
    userName: "Awais Ahmed",
    rating: 5,
    comment: "Professional Staff & Services. Quality is awesome. Highly recommended!",
    date: "2024-02-08",
  },
]

export default function VendorDetailsMobile({ vendor }: VendorDetailsMobileProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()
  const { toast } = useToast()

  const primaryImage = useMemo(() => vendor.images?.[0] || "/placeholder.jpg", [vendor.images])

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
      console.error('Error sharing:', error)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
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

    return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-rose-50">
              {/* Hero Section - Mobile Optimized */}
       <div className="relative h-[60vh] sm:h-[70vh] overflow-hidden">
        <Image
          src={primaryImage}
          alt={`${vendor.name} hero image`}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-rose-900/80 via-pink-800/70 to-purple-900/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        {/* Mobile Hero Content */}
        <div className="relative h-full flex items-end justify-center pb-20 sm:pb-32">
          <div className="text-center text-white max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <VendorIcon className="w-6 h-6 sm:w-8 sm:h-8 text-rose-300" />
                             <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs sm:text-sm">
                 {vendor.type || 'Vendor'}
               </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 leading-tight">
              {vendor.name}
            </h1>
            <p className="text-sm sm:text-xl md:text-2xl opacity-90 mb-6 flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4 sm:w-6 sm:h-6 text-rose-300" />
              {vendor.location || vendor.city}
            </p>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-1 sm:gap-2">
                <Star className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400 fill-current" />
                <span className="text-sm sm:text-xl font-semibold">{vendor.rating}</span>
                <span className="text-xs sm:text-lg opacity-80">({vendor.reviews?.length || 0})</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Award className="w-4 h-4 sm:w-6 sm:h-6 text-rose-300" />
                <span className="text-xs sm:text-lg opacity-80">Verified</span>
              </div>
            </div>
            
                         {/* Mobile Action Buttons */}
             <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
               <Button 
                 onClick={handleBookNow}
                 size="lg"
                 className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 min-h-[48px]"
               >
                 <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                 Book Now
               </Button>
               <Button 
                 variant="outline"
                 size="lg"
                 onClick={() => setIsFavorite(!isFavorite)}
                 className="w-full sm:w-auto border-rose-300 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 backdrop-blur-sm px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold rounded-xl transition-all duration-200 min-h-[48px]"
               >
                 <Heart className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                 {isFavorite ? 'Saved' : 'Save'}
               </Button>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8 -mt-16 sm:-mt-20 relative z-10">
        {/* Mobile Breadcrumbs */}
        <div className="mb-4 sm:mb-6">
          <nav aria-label="Breadcrumb" className="text-xs sm:text-sm">
            <ol className="flex items-center space-x-2">
              <li>
                <Link href="/" className="text-rose-600 hover:text-rose-700">Home</Link>
              </li>
                             <li className="flex items-center">
                 <ChevronRight className="w-3 h-3 mx-1" />
                 <Link href={`/${(vendor.type || 'vendors').toLowerCase().replace(/\s+/g, '-')}`} className="text-rose-600 hover:text-rose-700">
                   {vendor.type || 'Vendors'}
                 </Link>
               </li>
              <li className="flex items-center">
                <ChevronRight className="w-3 h-3 mx-1" />
                <span className="text-gray-500 truncate max-w-[120px] sm:max-w-none">{vendor.name}</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Vendor Info Card - Mobile Optimized */}
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Vendor Header */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900">{vendor.name}</h2>
                      {vendor.sponsored && (
                        <Badge className="w-fit bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-2 sm:px-3 py-1 text-xs sm:text-sm">
                          <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-neutral-600">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-rose-500 flex-shrink-0" />
                      <p className="text-sm sm:text-lg truncate">{vendor.location || vendor.city}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400 fill-current" />
                        <span className="ml-1 sm:ml-2 text-sm sm:text-xl font-semibold">{vendor.rating}</span>
                        <span className="ml-1 sm:ml-2 text-xs sm:text-base text-neutral-600">({vendor.reviews?.length || 0} reviews)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                        <span className="text-xs sm:text-base text-neutral-600">Verified</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats - Mobile Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-neutral-200">
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl">
                    <VendorIcon className="w-4 h-4 sm:w-6 sm:h-6 text-rose-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">Type</p>
                                             <p className="text-xs sm:text-sm text-neutral-600 truncate">{vendor.type || 'Vendor'}</p>
                    </div>
                  </div>
                  {vendor.capacity && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">Capacity</p>
                        <p className="text-xs sm:text-sm text-neutral-600 truncate">{vendor.capacity} Guests</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                    <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">Cancellation</p>
                      <p className="text-xs sm:text-sm text-neutral-600 truncate">Flexible</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
                    <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-purple-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">Starting Price</p>
                      <p className="text-xs sm:text-sm text-neutral-600 truncate">{formatPrice(vendor.minimumPrice || vendor.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl col-span-2 sm:col-span-1">
                    <CalendarCheck className="w-4 h-4 sm:w-6 sm:h-6 text-orange-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">Availability</p>
                      <p className="text-xs sm:text-sm text-neutral-600 truncate">Check Calendar</p>
                    </div>
                  </div>
                </div>
              </div>

                             {/* Mobile Action Buttons */}
               <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-neutral-200">
                 <Button
                   variant="outline"
                   size="lg"
                   onClick={handleShare}
                   className="flex items-center justify-center gap-2 border-rose-300 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-200 h-12 min-h-[48px]"
                 >
                   <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                   <span className="hidden sm:inline">Share</span>
                 </Button>
                 <Button 
                   variant="outline" 
                   size="lg" 
                   onClick={() => setActiveTab("availability")}
                   className="flex items-center justify-center gap-2 border-rose-300 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-200 h-12 min-h-[48px]"
                 >
                   <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                   <span className="hidden sm:inline">Check Availability</span>
                 </Button>
                 <Button 
                   onClick={handleBookNow}
                   size="lg" 
                   className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 h-12 min-h-[48px]"
                 >
                   <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                   Book Now
                 </Button>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Tabs */}
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-0">
                         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
               <TabsList className="grid w-full grid-cols-5 h-12 sm:h-14 bg-neutral-100 p-1">
                 <TabsTrigger value="overview" className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-rose-600 min-h-[44px]">
                   Overview
                 </TabsTrigger>
                 <TabsTrigger value="gallery" className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-rose-600 min-h-[44px]">
                   Gallery
                 </TabsTrigger>
                 <TabsTrigger value="availability" className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-rose-600 min-h-[44px]">
                   Availability
                 </TabsTrigger>
                 <TabsTrigger value="pricing" className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-rose-600 min-h-[44px]">
                   Pricing
                 </TabsTrigger>
                 <TabsTrigger value="reviews" className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-rose-600 min-h-[44px]">
                   Reviews
                 </TabsTrigger>
               </TabsList>

              <TabsContent value="overview" className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3">Description</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{vendor.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3">Amenities</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {vendor.amenities?.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
                          <div className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0" />
                          <span className="text-sm sm:text-base text-gray-600">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

                             <TabsContent value="gallery" className="p-4 sm:p-6">
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                   {vendor.images?.slice(0, 6).map((image, index) => (
                     <div 
                       key={index}
                       className="relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105"
                     >
                       <Image
                         src={image}
                         alt={`${vendor.name} - Image ${index + 1}`}
                         fill
                         className="object-cover"
                       />
                     </div>
                   ))}
                 </div>
               </TabsContent>

               <TabsContent value="availability" className="p-4 sm:p-6">
                 <div className="space-y-6">
                   <div className="text-center">
                     <h3 className="text-lg sm:text-xl font-semibold mb-2">Check Availability</h3>
                     <p className="text-sm sm:text-base text-gray-600">Select your preferred date to check availability</p>
                   </div>
                   
                   {/* Calendar Component */}
                   <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-6">
                     <div className="flex items-center justify-between mb-4">
                       <h4 className="text-base sm:text-lg font-semibold text-neutral-900">Calendar</h4>
                       <Calendar className="w-5 h-5 text-rose-500" />
                     </div>
                     
                     {/* Simple Calendar Grid */}
                     <div className="grid grid-cols-7 gap-1 mb-4">
                       {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                         <div key={day} className="text-center text-xs sm:text-sm font-medium text-neutral-600 py-2">
                           {day}
                         </div>
                       ))}
                       
                       {/* Calendar Days */}
                       {Array.from({ length: 35 }, (_, i) => {
                         const day = i + 1
                         const isAvailable = Math.random() > 0.3 // Random availability for demo
                         const isToday = day === new Date().getDate()
                         
                         return (
                           <div
                             key={i}
                             className={`
                               text-center text-xs sm:text-sm py-2 rounded-lg cursor-pointer transition-all duration-200
                               ${isToday 
                                 ? 'bg-rose-500 text-white font-semibold' 
                                 : isAvailable 
                                   ? 'hover:bg-rose-50 text-neutral-900 hover:text-rose-600' 
                                   : 'text-neutral-400 cursor-not-allowed'
                               }
                             `}
                           >
                             {day <= 31 ? day : ''}
                           </div>
                         )
                       })}
                     </div>
                     
                     {/* Availability Legend */}
                     <div className="flex items-center justify-center gap-4 text-xs sm:text-sm">
                       <div className="flex items-center gap-2">
                         <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                         <span>Today</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="w-3 h-3 bg-rose-50 border border-rose-200 rounded-full"></div>
                         <span>Available</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="w-3 h-3 bg-neutral-100 rounded-full"></div>
                         <span>Unavailable</span>
                       </div>
                     </div>
                   </div>
                   
                   {/* Quick Booking Info */}
                   <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 sm:p-6">
                     <div className="flex items-start gap-3">
                       <CalendarCheck className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                       <div>
                         <h4 className="text-base sm:text-lg font-semibold text-neutral-900 mb-2">Booking Information</h4>
                         <ul className="space-y-2 text-sm sm:text-base text-neutral-600">
                           <li>• Minimum booking notice: 48 hours</li>
                           <li>• Flexible cancellation policy</li>
                           <li>• Instant confirmation available</li>
                           <li>• Multiple payment options accepted</li>
                         </ul>
                       </div>
                     </div>
                   </div>
                   
                   {/* Contact for Availability */}
                   <div className="text-center">
                     <p className="text-sm sm:text-base text-gray-600 mb-4">
                       Need to check specific dates or have questions about availability?
                     </p>
                     <Button 
                       variant="outline"
                       size="lg"
                       className="border-rose-300 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-200"
                     >
                       <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                       Contact Vendor
                     </Button>
                   </div>
                 </div>
               </TabsContent>

              <TabsContent value="pricing" className="p-4 sm:p-6">
                <div className="space-y-4">
                  {vendor.packages?.map((pkg, index) => (
                    <div key={index} className="border border-neutral-200 rounded-xl p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <h4 className="text-lg sm:text-xl font-semibold">{pkg.name}</h4>
                        <Badge className="w-fit bg-rose-100 text-rose-700 border-rose-200">
                          {formatPrice(pkg.price)}
                        </Badge>
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 mb-4">{pkg.description}</p>
                      <div className="space-y-2">
                        {pkg.features?.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm sm:text-base text-gray-600">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {dummyReviews.map((review) => (
                    <div key={review.id} className="border border-neutral-200 rounded-xl p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-sm sm:text-base">{review.userName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                    i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
