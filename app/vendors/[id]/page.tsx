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

// Mock data for a single vendor
const vendor = {
  id: 1,
  name: "Elegant Events",
  city: "Lahore",
  type: "Event Planner",
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
    "Elegant Events is a premier wedding planning service in Lahore. With years of experience and a keen eye for detail, we create unforgettable wedding experiences.",
  packages: [
    { name: "Basic", price: "₨50,000", features: ["Venue selection", "Basic decoration", "Day-of coordination"] },
    {
      name: "Premium",
      price: "₨100,000",
      features: ["Full planning service", "Custom decoration", "Vendor management", "Guest list management"],
    },
    {
      name: "Luxury",
      price: "₨200,000",
      features: ["Full planning service", "Luxury decoration", "Complete vendor management", "Custom wedding website"],
    },
  ],
  reviews: [
    { id: 1, author: "Amina S.", rating: 5, comment: "Elegant Events made our wedding day absolutely perfect!" },
    { id: 2, author: "Hassan M.", rating: 4, comment: "Great service and attention to detail. Highly recommended." },
    {
      id: 3,
      author: "Zainab T.",
      rating: 5,
      comment: "They took care of everything, allowing us to enjoy our special day stress-free.",
    },
  ],
}

export default function VendorDetailPage() {
  const { id } = useParams()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % vendor.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + vendor.images.length) % vendor.images.length)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">{vendor.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {/* Gallery */}
          <div className="relative mb-8">
            <img
              src={vendor.images[currentImageIndex] || "/placeholder.svg"}
              alt={`${vendor.name} - Image ${currentImageIndex + 1}`}
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
            {vendor.images.map((image, index) => (
              <img
                key={index}
                src={image || "/placeholder.svg"}
                alt={`${vendor.name} - Thumbnail ${index + 1}`}
                className={`w-20 h-20 object-cover rounded-lg cursor-pointer ${
                  index === currentImageIndex ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>

          {/* Video */}
          {vendor.video && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Video Showcase</h2>
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src={vendor.video}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-[400px] rounded-lg"
                ></iframe>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">About {vendor.name}</h2>
            <p>{vendor.description}</p>
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
            {vendor.reviews.map((review) => (
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
          {/* Vendor Info */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Vendor Information</h2>
              <div className="space-y-2">
                <p>
                  <strong>Type:</strong> {vendor.type}
                </p>
                <p>
                  <strong>City:</strong> {vendor.city}
                </p>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-1 font-semibold">{vendor.rating}</span>
                  <span className="ml-1 text-gray-600">({vendor.reviews.length} reviews)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Packages */}
          <Accordion type="single" collapsible className="w-full mb-8">
            {vendor.packages.map((pkg, index) => (
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
        vendorId={vendor.id.toString()}
        vendorName={vendor.name}
      />
    </div>
  )
}

