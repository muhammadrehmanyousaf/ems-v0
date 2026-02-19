"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Heart, Share2, Calendar, MapPin, Users, Camera, Star, Award, ArrowRight, Clock, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const px = (id: number, w = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`

const weddings = [
  {
    id: 1,
    couple: "Ayesha & Hamza",
    location: "The Grand Imperial, Lahore",
    image: px(1024993),
    date: "March 15, 2025",
    story: "A beautiful wedding with a perfect blend of traditional and modern elements. The couple chose a stunning venue that perfectly captured their love for elegance and culture.",
    guests: 350,
    budget: "PKR 45,00,000",
    duration: "3 Days",
    theme: "Royal Elegance",
    vendors: ["Spice Route Catering", "Elegant Frames Studio", "Bloom & Blossom Events"],
    highlights: ["Grand baraat", "Traditional nikkah", "Live qawwali night", "Grand valima dinner"],
    gallery: [px(1024993), px(2253870), px(1456613), px(1444442)],
  },
  {
    id: 2,
    couple: "Fatima & Ali",
    location: "Royal Garden Marquee, Islamabad",
    image: px(2253870),
    date: "February 28, 2025",
    story: "An enchanting outdoor celebration with fairy lights and fresh flowers. Their garden-themed mehndi and classic valima created unforgettable memories.",
    guests: 280,
    budget: "PKR 38,00,000",
    duration: "2 Days",
    theme: "Garden Romance",
    vendors: ["Zaika Caterers", "Golden Moments Photography", "Dream Decor Studio"],
    highlights: ["Garden mehndi", "Floral canopy nikkah", "Fairy-light reception", "Live music"],
    gallery: [px(2253870), px(1616113), px(931177), px(169193)],
  },
  {
    id: 3,
    couple: "Sana & Bilal",
    location: "Pearl Continental, Karachi",
    image: px(1456613),
    date: "January 20, 2025",
    story: "A grand five-star celebration that blended classic luxury with contemporary style. Every detail was meticulously planned to perfection.",
    guests: 500,
    budget: "PKR 65,00,000",
    duration: "4 Days",
    theme: "Luxury Grand",
    vendors: ["Dawat-e-Khaas Caterers", "Nikkah Stories Studio", "Royal Sajawat"],
    highlights: ["Grand stage setup", "Royal baraat", "Multi-cuisine feast", "Designer outfits"],
    gallery: [px(1456613), px(260922), px(1128783), px(1267320)],
  },
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
            <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0 mb-3">
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
                selectedImage === index ? 'ring-4 ring-purple-500 scale-105' : 'hover:scale-105'
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
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
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
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full" />
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
                <Award className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <span className="font-semibold text-neutral-900">{vendor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-neutral-200">
          <Button onClick={handleLike} variant="outline" className="flex-1 h-12 border-neutral-200 hover:border-purple-500 hover:text-purple-600">
            <Heart className="w-5 h-5 mr-2" />
            Save Story
          </Button>
          <Button onClick={handleShare} variant="outline" className="flex-1 h-12 border-neutral-200 hover:border-purple-500 hover:text-purple-600">
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
    <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-neutral-50 via-white to-purple-50/30">
      <div className="w-[90%] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-center mb-12">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold-600 mb-2">Love Stories</p>
          <h2 className="text-4xl font-heading font-bold text-foreground mb-4">Real Wedding Stories</h2>
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
                      <span className="text-purple-600 text-sm font-semibold group-hover:text-purple-700 transition-colors duration-200">
                        Read their story →
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600">
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
            className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300 bg-white hover:bg-purple-50 transition-all duration-300 px-8 py-3"
          >
            View more wedding stories
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  )
}

