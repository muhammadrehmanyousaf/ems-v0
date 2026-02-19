"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
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
  Info
} from "lucide-react"
import type { Vendor, Review } from "@/lib/types"
import VenueGallery from "./VenueGallery"
import VenuePackages from "./VenuePackages"
import VenueMenus from "./VenueMenus"
import VenueReviews from "./VenueReviews"
import AddReview from "./AddReview"

interface VenueDetailsProps {
  venue: Vendor
}

const dummyReviews: Review[] = [
  {
    id: 1,
    vendorId: 1,
    userName: "Hira Sayyid",
    rating: 4,
    comment: "Great experience overall. The venue was beautiful and the staff was very helpful.",
    date: "2024-02-10",
  },
  {
    id: 2,
    vendorId: 1,
    userName: "Awais Ahmed",
    rating: 5,
    comment: "Professional Staff & Services. Food Quality is awesome. Highly recommended",
    date: "2024-02-08",
  },
]

export default function VenueDetails({ venue }: VenueDetailsProps) {
  const [reviews, setReviews] = useState<Review[]>(dummyReviews)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [isFavorite, setIsFavorite] = useState(false)

  const addReview = (newReview: Review) => {
    setReviews([...reviews, newReview])
  }

  const formatPrice = (price: number | string) => {
    if (typeof price === 'number') {
      return `PKR ${price.toLocaleString()}`
    }
    return `PKR ${price}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Gallery */}
      <VenueGallery images={venue.images} video={venue.video} />

      <div className="container mx-auto px-4 py-8">
        {/* Vendor Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8 border">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left Side - Vendor Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{venue.name}</h1>
                    {venue.sponsored && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                        Sponsored
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <p className="text-sm sm:text-base">{venue.location || venue.city}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="ml-1 font-semibold">{venue.rating}</span>
                      <span className="ml-1 text-gray-600 text-sm">({reviews.length} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">Verified</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="hidden sm:flex"
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">Capacity</p>
                    <p className="text-xs text-gray-600">{venue.capacity} Guests</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">Parking</p>
                    <p className="text-xs text-gray-600">Available</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">Cancellation</p>
                    <p className="text-xs text-gray-600">Flexible</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">Type</p>
                    <p className="text-xs text-gray-600">{venue.type}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Contact
              </Button>
              <Button size="sm" className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                <CalendarCheck className="w-4 h-4" />
                Book Now
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Tabs Content */}
            <Card className="shadow-sm">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full p-0 bg-transparent border-b rounded-none">
                  <TabsTrigger
                    value="details"
                    className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="pricing"
                    className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    Pricing
                  </TabsTrigger>
                  <TabsTrigger
                    value="menus"
                    className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    Menus
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    Reviews
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="p-6">
                  <div className="space-y-8">
                    {/* Description */}
                    <div>
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary" />
                        Description
                      </h2>
                      <p className="text-gray-600 leading-relaxed">
                        {venue.description || `${venue.name} is a premier wedding venue offering exceptional services and beautiful surroundings for your special day. Our dedicated team ensures every detail is perfect for your celebration.`}
                      </p>
                    </div>

                    {/* Amenities */}
                    <div>
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        Amenities & Services
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {venue.amenities?.map((amenity, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <span className="text-gray-700 font-medium">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium text-gray-700">Venue Type</span>
                            <span className="text-gray-600">{venue.type}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium text-gray-700">Capacity</span>
                            <span className="text-gray-600">{venue.capacity} guests</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium text-gray-700">Starting Price</span>
                            <span className="text-gray-600 font-semibold">{formatPrice(venue.minimumPrice || venue.price)}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium text-gray-700">Rating</span>
                            <span className="text-gray-600">{venue.rating}/5</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium text-gray-700">Reviews</span>
                            <span className="text-gray-600">{reviews.length}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium text-gray-700">Location</span>
                            <span className="text-gray-600">{venue.location || venue.city}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="p-6">
                  <VenuePackages packages={venue.packages} />
                </TabsContent>

                <TabsContent value="menus" className="p-6">
                  <VenueMenus venue={venue} />
                </TabsContent>

                <TabsContent value="reviews" className="p-6">
                  <VenueReviews reviews={reviews} />
                  <AddReview venueId={venue.id} onAddReview={addReview} />
                </TabsContent>
              </Tabs>
            </Card>

            {/* FAQs */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="booking">
                    <AccordionTrigger>How can I book this venue?</AccordionTrigger>
                    <AccordionContent>
                      You can book this venue by contacting us directly or using our online booking system. We'll guide
                      you through the process and help you select the perfect package for your event.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="payment">
                    <AccordionTrigger>What are the payment terms?</AccordionTrigger>
                    <AccordionContent>
                      We require a 30% advance payment to confirm your booking. The remaining amount should be paid one
                      week before the event date.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cancellation">
                    <AccordionTrigger>What is the cancellation policy?</AccordionTrigger>
                    <AccordionContent>
                      Our venue follows a flexible cancellation policy. Please contact us for specific details about
                      refunds and rescheduling.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="amenities">
                    <AccordionTrigger>What amenities are included?</AccordionTrigger>
                    <AccordionContent>
                      Our venue includes parking, catering services, decoration, sound system, and professional staff.
                      Additional services can be arranged upon request.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Calendar Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                  Check Available Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
                <Button className="w-full" variant="outline" size="lg">
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  Check Availability
                </Button>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{venue.location || venue.city}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">+92 300 1234567</span>
                  </div>
                </div>
                <Button className="w-full" size="lg">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            {/* Price Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Starting Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {formatPrice(venue.minimumPrice || venue.price)}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">per event</p>
                  <Button className="w-full" size="lg">
                    Get Quote
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

