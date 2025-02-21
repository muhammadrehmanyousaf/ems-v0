"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Calendar } from "@/components/ui/calendar"
import { Star, MapPin, Users, Car, Clock, ThumbsUp, Phone, Share2, CalendarCheck } from "lucide-react"
import type { Vendor, Review } from "@/lib/types"
import VendorGallery from "./VendorGallery"
import VendorPackages from "./VendorPackages"
import VendorReviews from "./VendorReviews"
import AddReview from "./AddReview"

interface VendorDetailsProps {
  vendor: Vendor
  vendorType: string
}

export default function VendorDetails({ vendor, vendorType }: VendorDetailsProps) {
  const [reviews, setReviews] = useState<Review[]>(vendor.reviews)
  const [date, setDate] = useState<Date | undefined>(undefined)

  const addReview = (newReview: Review) => {
    setReviews([...reviews, newReview])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VendorGallery images={vendor.images} video={vendor.video} />

      <div className="container mx-auto px-4 py-8">
        {/* Vendor Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{vendor.name}</h1>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <p className="text-sm sm:text-base">{vendor.location}</p>
              </div>
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="ml-1 font-semibold">{vendor.rating}</span>
                <span className="ml-1 text-gray-600 text-sm">({vendor.reviews.length} reviews)</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Phone className="w-4 h-4 mr-2" />
                Contact
              </Button>
              <Button size="sm" className="w-full sm:w-auto">
                Book Now
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Quick Info */}
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm mb-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {vendorType === "venues" && (
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium">Capacity</p>
                      <p className="text-xs sm:text-sm text-gray-600">{vendor.capacity} Guests</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium">Parking</p>
                    <p className="text-xs sm:text-sm text-gray-600">Available</p>
                  </div>
                </div>
                {vendorType === "venues" && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium">Cancellation</p>
                      <p className="text-xs sm:text-sm text-gray-600">{vendor.cancellationPolicy}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium">Type</p>
                    <p className="text-xs sm:text-sm text-gray-600">{vendor.type}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="details" className="bg-white rounded-lg shadow-sm">
              <TabsList className="w-full p-0 bg-transparent border-b rounded-none">
                <TabsTrigger
                  value="details"
                  className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="pricing"
                  className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary"
                >
                  Pricing
                </TabsTrigger>
                {vendorType === "venues" && (
                  <TabsTrigger
                    value="menus"
                    className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary"
                  >
                    Menus
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="reviews"
                  className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary"
                >
                  Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Description</h2>
                    <p className="text-gray-600">{vendor.description}</p>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-3">Amenities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {vendor.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="text-gray-600">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="p-6">
                <VendorPackages packages={vendor.packages} />
              </TabsContent>

              {vendorType === "venues" && (
                <TabsContent value="menus" className="p-6">
                  {/* Add menu component here */}
                </TabsContent>
              )}

              <TabsContent value="reviews" className="p-6">
                <VendorReviews reviews={reviews} />
                <AddReview vendorId={vendor.id} onAddReview={addReview} />
              </TabsContent>
            </Tabs>

            {/* FAQs */}
            <div className="bg-white rounded-lg shadow-sm mt-8 p-6">
              <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="booking">
                  <AccordionTrigger>How can I book this {vendorType.slice(0, -1)}?</AccordionTrigger>
                  <AccordionContent>
                    You can book this {vendorType.slice(0, -1)} by contacting us directly or using our online booking
                    system. We'll guide you through the process and help you select the perfect package for your event.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="payment">
                  <AccordionTrigger>What are the payment terms?</AccordionTrigger>
                  <AccordionContent>
                    We require a 30% advance payment to confirm your booking. The remaining amount should be paid one
                    week before the event date.
                  </AccordionContent>
                </AccordionItem>
                {vendorType === "venues" && (
                  <AccordionItem value="cancellation">
                    <AccordionTrigger>What is the cancellation policy?</AccordionTrigger>
                    <AccordionContent>
                      Our venue follows a {vendor.cancellationPolicy} policy. Please contact us for specific details
                      about refunds and rescheduling.
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            {/* Calendar Card */}
            <Card>
              <CardHeader>
                <CardTitle>Check Available Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
                <Button className="w-full" variant="outline" size="lg">
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  Check Availability
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

