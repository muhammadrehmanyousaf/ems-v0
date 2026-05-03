import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, UserPlus, Store, Package, Star, CreditCard, TrendingUp, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: "Create Your Account",
    description: "Sign up as a vendor on AJOINT. It takes less than 2 minutes — just your name, email, and phone number.",
  },
  {
    step: 2,
    icon: Store,
    title: "Set Up Your Business Profile",
    description: "Add your business name, category, location, description, and high-quality photos to attract customers.",
  },
  {
    step: 3,
    icon: Package,
    title: "Create Packages",
    description: "Define your service packages with pricing, details, and what's included. Customers can compare and choose easily.",
  },
  {
    step: 4,
    icon: Star,
    title: "Get Discovered & Booked",
    description: "Your business appears in search results. Customers can view your profile, read reviews, and book directly.",
  },
  {
    step: 5,
    icon: CreditCard,
    title: "Receive Payments",
    description: "Accept secure payments through our platform. Track bookings, manage your calendar, and grow your revenue.",
  },
  {
    step: 6,
    icon: TrendingUp,
    title: "Grow Your Business",
    description: "Earn reviews, build your reputation, and access analytics through your vendor dashboard to optimize performance.",
  },
]

const benefits = [
  "Free listing on Pakistan's premier event platform",
  "Reach thousands of couples actively planning weddings",
  "Secure payment processing through Stripe",
  "Dedicated vendor dashboard with analytics",
  "Booking management and calendar tools",
  "Real-time chat with potential customers",
  "Review and reputation management",
  "Priority support for vendor accounts",
]

export default function VendorGuidePage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-bridal-gold to-bridal-gold-dark text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-bridal-gold/40" />
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Vendor Guide</h1>
          <p className="text-lg text-bridal-cream max-w-xl mx-auto">
            Everything you need to know about listing your business and growing with AJOINT.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-neutral-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-neutral-900 text-center mb-10">How It Works</h2>
          <div className="space-y-6">
            {steps.map((item) => (
              <Card key={item.step} className="border-0 shadow-sm">
                <CardContent className="p-6 flex gap-5">
                  <div className="flex-shrink-0 w-12 h-12 bg-bridal-gold/15 rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-bridal-gold-dark" />
                  </div>
                  <div>
                    <p className="text-xs text-bridal-gold-dark font-semibold mb-1">Step {item.step}</p>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-neutral-600">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-neutral-900 text-center mb-8">Vendor Benefits</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 p-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-neutral-700">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-neutral-50 border-t">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-3">Ready to Grow Your Business?</h2>
          <p className="text-neutral-600 mb-6">Join hundreds of vendors already thriving on AJOINT.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/business-registration">
              <Button className="bg-gradient-to-r from-bridal-gold to-bridal-gold-dark hover:from-bridal-gold-dark hover:to-bridal-gold-dark text-white gap-2">
                Register as Vendor <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/vendor-success">
              <Button variant="outline">Read Success Stories</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
