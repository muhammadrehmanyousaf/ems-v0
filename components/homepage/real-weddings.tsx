"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Heart, Share2, Calendar, MapPin, Users, Camera, Star, Award, ArrowRight, Clock, DollarSign } from "lucide-react"
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
    budget: "₹45,00,000",
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
    budget: "₹38,00,000",
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
    budget: "₹52,00,000",
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
    budget: "₹35,00,000",
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
    budget: "₹48,00,000",
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
    budget: "₹55,00,000",
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
      title: "Liked!",
      description: "This wedding story has been liked successfully.",
    })
  }

  return (
    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-3xl font-bold text-neutral-900">{wedding.couple}</DialogTitle>
        <DialogDescription className="text-lg text-neutral-600">
          {wedding.location} • {wedding.date}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-8">
        {/* Hero Image */}
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-xl">
          <img
            src={wedding.gallery[selectedImage]}
            alt={wedding.couple}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <Badge className="bg-gradient-to-r from-rose-500 to-pink-600 text-white border-0 mb-3">
              {wedding.theme}
            </Badge>
            <h3 className="text-2xl font-bold mb-2">{wedding.theme}</h3>
            <p className="text-lg opacity-90">{wedding.story}</p>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-4 gap-3">
          {wedding.gallery.map((image: string, index: number) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`aspect-square rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${
                selectedImage === index ? 'ring-4 ring-rose-500 scale-105' : 'hover:scale-105'
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
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-2xl font-bold text-neutral-900">Wedding Details</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl">
                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Date</p>
                  <p className="text-neutral-600">{wedding.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Venue</p>
                  <p className="text-neutral-600">{wedding.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Guests</p>
                  <p className="text-neutral-600">{wedding.guests} people</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Budget</p>
                  <p className="text-neutral-600">{wedding.budget}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-2xl font-bold text-neutral-900">Highlights</h4>
            <div className="grid grid-cols-1 gap-3">
              {wedding.highlights.map((highlight: string, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="w-3 h-3 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full" />
                  <span className="font-medium text-neutral-900">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vendors */}
        <div className="space-y-6">
          <h4 className="text-2xl font-bold text-neutral-900">Featured Vendors</h4>
          <div className="grid md:grid-cols-3 gap-4">
            {wedding.vendors.map((vendor: string, index: number) => (
              <div key={index} className="p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl text-center border border-neutral-200 hover:shadow-lg transition-all duration-200">
                <Award className="w-6 h-6 text-rose-600 mx-auto mb-2" />
                <span className="font-semibold text-neutral-900">{vendor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-neutral-200">
          <Button onClick={handleLike} variant="outline" className="flex-1 h-12 border-neutral-200 hover:border-rose-500 hover:text-rose-600">
            <Heart className="w-5 h-5 mr-2" />
            Save Story
          </Button>
          <Button onClick={handleShare} variant="outline" className="flex-1 h-12 border-neutral-200 hover:border-rose-500 hover:text-rose-600">
            <Share2 className="w-5 h-5 mr-2" />
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
    <section className="py-16 bg-gradient-to-br from-neutral-50 via-white to-rose-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">Real Wedding Stories</h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Get inspired by these beautiful wedding celebrations. Each story is unique, 
            just like your love story will be.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {weddings.map((wedding) => (
            <Dialog key={wedding.id}>
              <DialogTrigger asChild>
                <Card className="group overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-500 hover:scale-105 border-0 shadow-lg bg-white">
                  <CardHeader className="p-0">
                    <div className="relative aspect-[4/3]">
                      <img
                        src={wedding.image}
                        alt={wedding.couple}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="text-2xl font-bold mb-2">{wedding.couple}</h3>
                        <p className="text-sm opacity-90 mb-3">{wedding.location}</p>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                            <Users className="w-3 h-3 mr-1" />
                            {wedding.guests} guests
                          </Badge>
                          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {wedding.budget}
                          </Badge>
                        </div>
                      </div>
                      <Badge className="absolute top-4 right-4 bg-white/95 text-neutral-800 border-0 shadow-lg">
                        <Calendar className="w-3 h-3 mr-1" />
                        {wedding.date}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-neutral-600 line-clamp-2 mb-4 leading-relaxed">{wedding.story}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-rose-600 text-sm font-semibold group-hover:text-rose-700 transition-colors duration-200">
                        Read their story →
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-600">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-600">
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
          <Button 
            variant="outline" 
            size="lg" 
            className="text-rose-600 hover:text-rose-700 border-rose-200 hover:border-rose-300 bg-white hover:bg-rose-50 transition-all duration-300 px-8 py-3"
          >
            View more wedding stories
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  )
}

