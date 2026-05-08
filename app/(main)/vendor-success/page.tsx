import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Star, TrendingUp, Users, ArrowRight, Quote } from "lucide-react"
import Link from "next/link"

const stories = [
  {
    name: "Royal Marquee & Events",
    category: "Venues",
    location: "Lahore",
    quote: "Since joining Wedding Wala, our bookings have increased by 40%. The platform makes it incredibly easy for customers to find and book us. The dashboard analytics helped us understand peak seasons better.",
    stats: { bookings: "200+", rating: "4.9", years: "2 years on platform" },
  },
  {
    name: "Capture Studios",
    category: "Photography",
    location: "Islamabad",
    quote: "Wedding Wala changed how we get clients. Before, we relied solely on word of mouth. Now, 60% of our new clients come through the platform. The review system builds trust with couples we've never met.",
    stats: { bookings: "150+", rating: "4.8", years: "1.5 years on platform" },
  },
  {
    name: "Flavors Premium Catering",
    category: "Catering",
    location: "Karachi",
    quote: "The booking management tools are fantastic. We can track all our events, manage payments, and communicate with clients in one place. Our revenue grew by 35% in the first year.",
    stats: { bookings: "300+", rating: "4.7", years: "3 years on platform" },
  },
  {
    name: "Bloom & Petal Decor",
    category: "Decor",
    location: "Lahore",
    quote: "As a small business, getting visibility was our biggest challenge. Wedding Wala put us in front of thousands of couples. We've built a loyal customer base and our portfolio speaks for itself now.",
    stats: { bookings: "120+", rating: "4.9", years: "1 year on platform" },
  },
]

const stats = [
  { icon: Users, value: "500+", label: "Active Vendors" },
  { icon: Star, value: "4.8", label: "Avg Vendor Rating" },
  { icon: TrendingUp, value: "35%", label: "Avg Revenue Growth" },
  { icon: Trophy, value: "10,000+", label: "Events Completed" },
]

export default function VendorSuccessPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-bridal-gold to-bridal-gold-dark text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-bridal-gold/40" />
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Vendor Success Stories</h1>
          <p className="text-lg text-bridal-cream max-w-xl mx-auto">
            See how vendors across Pakistan are growing their businesses with Wedding Wala.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-0 shadow-sm text-center">
                <CardContent className="p-6">
                  <stat.icon className="w-8 h-8 text-bridal-gold-dark mx-auto mb-3" />
                  <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
                  <p className="text-sm text-neutral-600">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            {stories.map((story) => (
              <Card key={story.name} className="border-0 shadow-sm">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-bridal-gold/15 rounded-xl flex items-center justify-center">
                      <Quote className="w-6 h-6 text-bridal-gold-dark" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-neutral-900">{story.name}</h3>
                        <Badge variant="secondary">{story.category}</Badge>
                        <span className="text-xs text-neutral-500">{story.location}</span>
                      </div>
                      <p className="text-neutral-600 mb-4 italic">&quot;{story.quote}&quot;</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-bridal-gold-dark font-medium">{story.stats.bookings} bookings</span>
                        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />{story.stats.rating} rating</span>
                        <span className="text-neutral-500">{story.stats.years}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white border-t">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-3">Start Your Success Story</h2>
          <p className="text-neutral-600 mb-6">Join the fastest-growing vendor network in Pakistan.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/business-registration">
              <Button className="bg-gradient-to-r from-bridal-gold to-bridal-gold-dark hover:from-bridal-gold-dark hover:to-bridal-gold-dark text-white gap-2">
                Register Your Business <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/vendor-guide">
              <Button variant="outline">Read the Vendor Guide</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
