"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Heart, Share2, Calendar, MapPin, Users, Camera, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const weddings = [
  {
    id: 1,
    couple: "Priya & Rahul",
    location: "The Grand Hyatt, Mumbai",
    image: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    date: "March 15, 2024",
    story: "A beautiful destination wedding with a perfect blend of traditional and modern elements. The couple chose a stunning beachfront venue that perfectly captured their love for travel and adventure.",
    guests: 250,
    budget: "$45,000",
    duration: "3 Days",
    theme: "Beach Elegance",
    vendors: ["Luxury Catering Co.", "Elite Photography", "Dream Decorators"],
    highlights: ["Sunset ceremony", "Traditional rituals", "Live music performance", "Gourmet dining"],
    gallery: [
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    ]
  },
  {
    id: 2,
    couple: "Sarah & Ahmed",
    location: "Taj Palace, Delhi",
    image: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    date: "February 28, 2024",
    story: "An elegant wedding celebration featuring stunning decor and memorable moments. The couple's fusion of cultures created a unique and unforgettable experience for all guests.",
    guests: 180,
    budget: "$38,000",
    duration: "2 Days",
    theme: "Cultural Fusion",
    vendors: ["Royal Catering", "Artistic Photography", "Cultural Decorators"],
    highlights: ["Cultural ceremony", "Fusion cuisine", "Traditional dance", "Luxury accommodations"],
    gallery: [
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    ]
  },
  {
    id: 3,
    couple: "Meera & Arun",
    location: "ITC Grand Chola, Chennai",
    image: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    date: "January 20, 2024",
    story: "A royal South Indian wedding with spectacular ceremonies and celebrations. The couple's traditional approach with modern touches created a perfect balance of heritage and contemporary elegance.",
    guests: 300,
    budget: "$52,000",
    duration: "4 Days",
    theme: "Royal Traditional",
    vendors: ["Heritage Catering", "Royal Photography", "Traditional Decorators"],
    highlights: ["Traditional rituals", "Royal procession", "Classical music", "Heritage venue"],
    gallery: [
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    ]
  },
  {
    id: 4,
    couple: "Aisha & Raj",
    location: "The Oberoi, Udaipur",
    image: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    date: "December 10, 2023",
    story: "A magical lakeside wedding in the city of lakes. The couple's romantic celebration featured breathtaking views and intimate moments that will be cherished forever.",
    guests: 120,
    budget: "$35,000",
    duration: "2 Days",
    theme: "Lakeside Romance",
    vendors: ["Lakeside Catering", "Romantic Photography", "Elegant Decorators"],
    highlights: ["Lakeside ceremony", "Boat procession", "Candlelight dinner", "Sunset views"],
    gallery: [
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    ]
  },
  {
    id: 5,
    couple: "Zara & Vikram",
    location: "The Leela Palace, Bangalore",
    image: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    date: "November 25, 2023",
    story: "A modern luxury wedding with international flair. The couple's sophisticated celebration featured world-class cuisine and entertainment that left guests in awe.",
    guests: 200,
    budget: "$48,000",
    duration: "3 Days",
    theme: "Modern Luxury",
    vendors: ["International Catering", "Luxury Photography", "Modern Decorators"],
    highlights: ["International cuisine", "Live entertainment", "Luxury accommodations", "Modern decor"],
    gallery: [
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    ]
  },
  {
    id: 6,
    couple: "Nisha & Arjun",
    location: "The Taj Mahal Palace, Mumbai",
    image: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    date: "October 15, 2023",
    story: "A classic Mumbai wedding with timeless elegance. The couple's celebration featured the perfect blend of tradition and sophistication in the heart of the city.",
    guests: 280,
    budget: "$55,000",
    duration: "3 Days",
    theme: "Classic Elegance",
    vendors: ["Classic Catering", "Elegant Photography", "Timeless Decorators"],
    highlights: ["Classic ceremony", "Elegant reception", "Traditional rituals", "Luxury venue"],
    gallery: [
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    ]
  }
]

function WeddingDetailModal({ wedding }: { wedding: any }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const { toast } = useToast()

  const handleShare = () => {
    navigator.share?.({
      title: `${wedding.couple}'s Wedding`,
      text: wedding.story,
      url: window.location.href
    }).catch(() => {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied!",
        description: "Wedding story link has been copied to clipboard.",
      })
    })
  }

  const handleLike = () => {
    toast({
      title: "Added to favorites!",
      description: "This wedding story has been added to your favorites.",
    })
  }

  return (
    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold">{wedding.couple}</DialogTitle>
        <DialogDescription className="text-lg">
          {wedding.location} • {wedding.date}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Hero Image */}
        <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
          <img
            src={wedding.gallery[selectedImage]}
            alt={wedding.couple}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="text-xl font-semibold">{wedding.theme}</h3>
            <p className="text-sm opacity-90">{wedding.story}</p>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-4 gap-2">
          {wedding.gallery.map((image: string, index: number) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`aspect-square rounded-lg overflow-hidden ${
                selectedImage === index ? 'ring-2 ring-primary' : ''
              }`}
            >
              <img
                src={image}
                alt={`${wedding.couple} - Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Wedding Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Wedding Details</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span><strong>Date:</strong> {wedding.date}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <span><strong>Venue:</strong> {wedding.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <span><strong>Guests:</strong> {wedding.guests}</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-primary" />
                <span><strong>Budget:</strong> {wedding.budget}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Highlights</h4>
            <div className="grid grid-cols-2 gap-2">
              {wedding.highlights.map((highlight: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vendors */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Featured Vendors</h4>
          <div className="grid md:grid-cols-3 gap-3">
            {wedding.vendors.map((vendor: string, index: number) => (
              <div key={index} className="p-3 bg-muted rounded-lg text-center">
                <span className="text-sm font-medium">{vendor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={handleLike} variant="outline" className="flex-1">
            <Heart className="w-4 h-4 mr-2" />
            Save Story
          </Button>
          <Button onClick={handleShare} variant="outline" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share Story
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}

export function RealWeddings() {
  const { toast } = useToast()

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Real Wedding Stories</h2>
          <p className="text-gray-600">Get inspired by these beautiful wedding celebrations</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {weddings.map((wedding) => (
            <Dialog key={wedding.id}>
              <DialogTrigger asChild>
                <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <CardHeader className="p-0">
                    <div className="relative aspect-[4/3]">
                      <img
                        src={wedding.image}
                        alt={wedding.couple}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="text-xl font-semibold mb-1">{wedding.couple}</h3>
                        <p className="text-sm opacity-90">{wedding.location}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                            {wedding.guests} guests
                          </Badge>
                          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                            {wedding.budget}
                          </Badge>
                        </div>
                      </div>
                      <Badge className="absolute top-4 right-4 bg-white/90 text-gray-800">
                        {wedding.date}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-gray-600 line-clamp-2 mb-3">{wedding.story}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-primary text-sm font-medium">Read their story →</span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <WeddingDetailModal wedding={wedding} />
            </Dialog>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="text-primary hover:text-primary">
            View more wedding stories →
          </Button>
        </div>
      </div>
    </section>
  )
}

