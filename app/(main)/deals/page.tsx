import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tag, Percent, Clock, Sparkles, ArrowRight, Bell } from "lucide-react"
import Link from "next/link"

const deals = [
  {
    vendor: "Royal Marquee",
    category: "Venues",
    discount: "20% Off",
    description: "Book your wedding venue for Baraat or Walima and get 20% off on weekday bookings.",
    validUntil: "Mar 31, 2025",
    hot: true,
  },
  {
    vendor: "Capture Studios",
    category: "Photography",
    discount: "Free Pre-Wedding Shoot",
    description: "Book a full-day wedding package and get a complimentary pre-wedding shoot worth PKR 25,000.",
    validUntil: "Apr 15, 2025",
    hot: true,
  },
  {
    vendor: "Flavors Catering",
    category: "Catering",
    discount: "15% Off",
    description: "Get 15% off on premium wedding menus for events with 300+ guests.",
    validUntil: "Mar 20, 2025",
    hot: false,
  },
  {
    vendor: "Bloom Decor",
    category: "Decor",
    discount: "Bundle Deal",
    description: "Book both mehndi and baraat decor packages together and save PKR 50,000.",
    validUntil: "May 1, 2025",
    hot: false,
  },
  {
    vendor: "Glamour Makeup",
    category: "Makeup",
    discount: "10% Off",
    description: "Bridal makeup package with 10% off when booked 3 months in advance.",
    validUntil: "Ongoing",
    hot: false,
  },
  {
    vendor: "DJ Beats",
    category: "Music",
    discount: "Free Sound Setup",
    description: "Book DJ services for your mehndi and get complimentary sound system setup for baraat.",
    validUntil: "Apr 30, 2025",
    hot: false,
  },
]

export default function DealsPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Tag className="w-12 h-12 mx-auto mb-4 text-purple-200" />
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Wedding Deals</h1>
          <p className="text-lg text-purple-100 max-w-xl mx-auto">
            Exclusive offers from top-rated vendors. Save big on your dream wedding.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <Card key={deal.vendor} className="border-0 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                {deal.hot && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-red-500 text-white gap-1"><Sparkles className="w-3 h-3" />Hot</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <Badge variant="secondary" className="mb-3">{deal.category}</Badge>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">{deal.vendor}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Percent className="w-4 h-4 text-purple-600" />
                    <span className="text-purple-600 font-bold">{deal.discount}</span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-4">{deal.description}</p>
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <Clock className="w-3 h-3" />Valid until {deal.validUntil}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12 bg-white rounded-2xl p-8 shadow-sm border">
            <Bell className="w-10 h-10 text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Never Miss a Deal</h2>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              Browse our vendor catalog to discover more offers and seasonal promotions.
            </p>
            <Link href="/venues">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white gap-2">
                Browse Vendors <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
