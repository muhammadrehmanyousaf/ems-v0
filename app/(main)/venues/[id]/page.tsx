"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BookingModal } from "@/components/booking-modal"

// Mock data for a single venue
const venue = {
  id: 1,
  name: "Grand Palace",
  city: "Lahore",
  type: "Banquet Hall",
  capacity: 500,
  rating: 4.8,
  reviews: 156,
  images: [
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
  ],
  video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  description:
    "Grand Palace is a luxurious wedding venue located in the heart of Lahore. With its stunning architecture and state-of-the-art facilities, it's the perfect place for your dream wedding.",
  packages: [
    { name: "Basic", price: "₨100,000", features: ["Up to 300 guests", "Basic decoration", "Catering"] },
    {
      name: "Premium",
      price: "₨200,000",
      features: ["Up to 500 guests", "Elegant decoration", "Premium catering", "Photography"],
    },
    {
      name: "Luxury",
      price: "₨300,000",
      features: ["Up to 700 guests", "Exquisite decoration", "Gourmet catering", "Photography & Videography"],
    },
  ],
  review: [
    { id: 1, author: "Sarah A.", rating: 5, comment: "Absolutely stunning venue! Our wedding was perfect." },
    { id: 2, author: "Ahmed K.", rating: 4, comment: "Great service and beautiful location. Highly recommended." },
    { id: 3, author: "Fatima R.", rating: 5, comment: "The staff was incredibly helpful. Our guests loved the venue." },
  ],
}

export default function VenueDetailPage() {
  const { id } = useParams()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % venue.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + venue.images.length) % venue.images.length)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">{venue.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {/* Gallery */}
          <div className="relative mb-8">
            <img
              src={venue.images[currentImageIndex] || "/placeholder.svg"}
              alt={`${venue.name} - Image ${currentImageIndex + 1}`}
              className="w-full h-[400px] object-cover rounded-lg"
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 left-4 transform -translate-y-1/2"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 right-4 transform -translate-y-1/2"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Thumbnail Gallery */}
          <div className="flex space-x-2 mb-8 overflow-x-auto">
            {venue.images.map((image, index) => (
              <img
                key={index}
                src={image || "/placeholder.svg"}
                alt={`${venue.name} - Thumbnail ${index + 1}`}
                className={`w-20 h-20 object-cover rounded-lg cursor-pointer ${
                  index === currentImageIndex ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>

          {/* Video */}
          {venue.video && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Video Tour</h2>
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src={venue.video}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-[400px] rounded-lg"
                ></iframe>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">About {venue.name}</h2>
            <p>{venue.description}</p>
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
            {venue.review.map((review) => (
              <Card key={review.id} className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="ml-1 font-semibold">{review.rating}</span>
                    <span className="ml-2 text-gray-600">{review.author}</span>
                  </div>
                  <p>{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          {/* Venue Info */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Venue Information</h2>
              <div className="space-y-2">
                <p>
                  <strong>Type:</strong> {venue.type}
                </p>
                <p>
                  <strong>City:</strong> {venue.city}
                </p>
                <p>
                  <strong>Capacity:</strong> {venue.capacity} guests
                </p>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-1 font-semibold">{venue.rating}</span>
                  <span className="ml-1 text-gray-600">({venue.reviews} reviews)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Packages */}
          <Accordion type="single" collapsible className="w-full mb-8">
            {venue.packages.map((pkg, index) => (
              <AccordionItem key={index} value={`package-${index}`}>
                <AccordionTrigger>{pkg.name} Package</AccordionTrigger>
                <AccordionContent>
                  <p className="font-semibold mb-2">Price: {pkg.price}</p>
                  <ul className="list-disc pl-5">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex}>{feature}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Book Now Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
            <Button
              onClick={() => setIsBookingModalOpen(true)}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded"
            >
              Book Now
            </Button>
          </motion.div>
        </div>
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        vendorId={venue.id.toString()}
        vendorName={venue.name}
      />
    </div>
  )
}

