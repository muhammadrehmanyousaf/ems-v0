"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { BookingModal } from "./booking-modal"

interface VendorCardProps {
  id: string
  name: string
  type: string
  rating: number
  reviews: number
  image: string
  capacity: number
  price: string
  city: string
}

export function VendorCard({ id, name, type, rating, reviews, image, price, city }: VendorCardProps) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  return (
    <>
      <Link href={`/vendors/${id}`} passHref>
        <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="p-0">
            <div className="relative aspect-[4/3]">
              <img src={image || "/placeholder.svg"} alt={name} className="w-full h-full object-cover rounded-t-lg" />
              <Badge className="absolute top-4 left-4">{type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg group-hover:text-primary">{name}</h3>
            <p className="text-gray-600 text-sm">{city}</p>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-between items-center">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm font-medium">{rating}</span>
              <span className="ml-1 text-sm text-gray-600">({reviews})</span>
            </div>
            <div className="text-sm font-medium">Starting from {price}</div>
          </CardFooter>
          <CardFooter className="p-4 pt-0">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  setIsBookingModalOpen(true)
                }}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded"
              >
                Book Now
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </Link>
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        vendorId={id}
        vendorName={name}
      />
    </>
  )
}

