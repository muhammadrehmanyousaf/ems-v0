import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Globe, Palette, Share2, Heart, Clock, Gift, MapPin, Camera, Bell, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

const features = [
  { icon: Palette, title: "Beautiful Templates", desc: "Choose from elegant, modern designs that match your wedding theme and colors." },
  { icon: Share2, title: "Easy Sharing", desc: "Share your wedding website link with guests via WhatsApp, email, or social media." },
  { icon: Heart, title: "Your Love Story", desc: "Tell your unique story with a beautiful timeline of your journey together." },
  { icon: Clock, title: "Countdown Timer", desc: "Build excitement with a live countdown to your big day on every page." },
  { icon: Gift, title: "Gift Registry", desc: "Create a gift registry so guests know exactly what you need." },
  { icon: MapPin, title: "Event Details & Maps", desc: "Share venue details, directions, and interactive maps for all events." },
  { icon: Camera, title: "Photo Gallery", desc: "Showcase your engagement photos and share wedding day memories later." },
  { icon: Bell, title: "RSVP Management", desc: "Collect RSVPs online and track guest responses in real-time." },
]

export default function WeddingWebsitePage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-bridal-gold to-bridal-gold-dark text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Globe className="w-12 h-12 mx-auto mb-4 text-bridal-gold/40" />
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Wedding Website</h1>
          <p className="text-lg text-bridal-cream max-w-xl mx-auto">
            Create a beautiful, personalized wedding website to share your love story and event details with guests.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="bg-bridal-gold/15 text-bridal-gold-dark mb-3">
              <Sparkles className="w-3 h-3 mr-1" />Coming Soon
            </Badge>
            <h2 className="text-2xl font-bold text-neutral-900 mb-3">Everything You Need in One Place</h2>
            <p className="text-neutral-600 max-w-lg mx-auto">
              Your wedding website will be the go-to hub for your guests — from event details to RSVPs to your registry.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((f) => (
              <Card key={f.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-bridal-gold/15 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <f.icon className="w-6 h-6 text-bridal-gold-dark" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-neutral-600">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-bridal-cream to-pink-50 p-8 sm:p-12 text-center">
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">Be the First to Know</h3>
                <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                  We&apos;re building something special. Wedding websites are launching soon on AJOINT. Start planning your wedding now and your website will be ready when you need it.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/planning-tools">
                    <Button className="bg-gradient-to-r from-bridal-gold to-bridal-gold-dark hover:from-bridal-gold-dark hover:to-bridal-gold-dark text-white gap-2">
                      Explore Planning Tools <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/venues">
                    <Button variant="outline">Browse Vendors</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
