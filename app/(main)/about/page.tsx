import { Card, CardContent } from "@/components/ui/card"
import { Heart, Users, Award, Target, Sparkles, Shield } from "lucide-react"

export default function AboutPage() {
  const values = [
    { icon: Heart, title: "Passion for Celebrations", desc: "We believe every event deserves to be extraordinary. Our platform connects you with vendors who share that vision." },
    { icon: Users, title: "Community First", desc: "We've built a thriving community of verified vendors and happy customers across Pakistan." },
    { icon: Shield, title: "Trust & Transparency", desc: "Verified reviews, secure payments, and transparent pricing — so you can plan with confidence." },
    { icon: Award, title: "Quality Standards", desc: "Every vendor on our platform is vetted for quality, reliability, and professionalism." },
  ]

  const stats = [
    { value: "500+", label: "Verified Vendors" },
    { value: "10,000+", label: "Events Planned" },
    { value: "50+", label: "Cities Covered" },
    { value: "4.8/5", label: "Average Rating" },
  ]

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Pakistan's Premier Event Platform</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Making Every Event<br />Unforgettable
          </h1>
          <p className="text-lg sm:text-xl text-purple-100 max-w-2xl mx-auto">
            We connect event planners with the best vendors in Pakistan — from wedding venues
            and photographers to caterers and decorators. All in one place.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-white border-b">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-purple-600">{stat.value}</p>
              <p className="text-sm text-neutral-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 bg-neutral-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Our Mission</h2>
          </div>
          <h3 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-6">
            Simplify Event Planning Across Pakistan
          </h3>
          <p className="text-lg text-neutral-600 leading-relaxed">
            Planning an event should be exciting, not stressful. We built this platform to eliminate
            the hassle of finding, comparing, and booking vendors. Whether it's a wedding, corporate
            event, or birthday celebration — our goal is to give you access to the best vendors
            with transparent pricing, genuine reviews, and secure booking.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-neutral-900 text-center mb-12">What We Stand For</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <Card key={v.title} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <v.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">{v.title}</h3>
                    <p className="text-sm text-neutral-600">{v.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
