"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronDown, ChevronUp, Calendar, CreditCard, Star, Shield, MessageCircle, HelpCircle } from "lucide-react"
import Link from "next/link"

const faqs = [
  {
    category: "Booking",
    icon: Calendar,
    items: [
      { q: "How do I book a vendor?", a: "Browse vendors, select a package, choose your date and time, then click 'Book Now'. You'll be guided through the payment process to secure your booking." },
      { q: "Can I cancel a booking?", a: "Yes, you can cancel from your bookings page. Go to My Bookings, find the booking, and click 'Cancel'. Refund policies depend on the vendor's terms and how far in advance you cancel." },
      { q: "Can I book multiple vendors for one event?", a: "Absolutely! Our platform supports multi-vendor bookings. Add as many vendors as you need — venues, photographers, caterers, decorators — all in a single booking." },
    ],
  },
  {
    category: "Payments",
    icon: CreditCard,
    items: [
      { q: "What payment methods are accepted?", a: "We accept credit/debit cards through Stripe, as well as bank transfers. All online payments are secured with industry-standard encryption." },
      { q: "Do I have to pay the full amount upfront?", a: "No. Most vendors offer a down payment option (typically 20-50% of the total). You can pay the remaining balance later as per the vendor's terms." },
      { q: "How do refunds work?", a: "Refunds are processed back to your original payment method. The timeline depends on your bank but typically takes 5-10 business days after the refund is initiated." },
    ],
  },
  {
    category: "Reviews",
    icon: Star,
    items: [
      { q: "How do I leave a review?", a: "After your event is completed, go to My Bookings, find the completed booking, and click 'Leave a Review'. You can rate the vendor from 1-5 stars and add a comment." },
      { q: "Can vendors respond to reviews?", a: "Yes, vendors can reply to reviews. You'll see their response below your review on the vendor's profile page." },
    ],
  },
  {
    category: "Account & Security",
    icon: Shield,
    items: [
      { q: "How do I reset my password?", a: "Go to your Profile page and use the 'Change Password' section. You'll need your current password to set a new one. For security, you'll be logged out after changing your password." },
      { q: "Is my payment information safe?", a: "Yes. We use Stripe for payment processing, which is PCI DSS Level 1 certified — the highest level of payment security. We never store your card details on our servers." },
    ],
  },
]

export default function HelpPage() {
  const [search, setSearch] = useState("")
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const filteredFaqs = faqs.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0)

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-purple-200" />
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-lg text-purple-100 mb-8">Find answers to common questions about using our platform.</p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              placeholder="Search for help..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 bg-white text-neutral-900 border-0 rounded-xl shadow-lg"
            />
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-neutral-50">
        <div className="max-w-3xl mx-auto space-y-8">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-600 mb-4">No results found for &quot;{search}&quot;</p>
              <Button variant="outline" onClick={() => setSearch("")}>Clear Search</Button>
            </div>
          ) : (
            filteredFaqs.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center gap-2 mb-4">
                  <cat.icon className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-neutral-900">{cat.category}</h2>
                </div>
                <div className="space-y-2">
                  {cat.items.map((item) => {
                    const key = `${cat.category}-${item.q}`
                    const isOpen = openItems.has(key)
                    return (
                      <Card key={key} className="border-0 shadow-sm">
                        <CardContent className="p-0">
                          <button
                            onClick={() => toggleItem(key)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors rounded-lg"
                          >
                            <span className="font-medium text-sm text-neutral-900 pr-4">{item.q}</span>
                            {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />}
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4">
                              <p className="text-sm text-neutral-600 leading-relaxed">{item.a}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="py-12 px-4 bg-white border-t">
        <div className="max-w-2xl mx-auto text-center">
          <MessageCircle className="w-10 h-10 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Still need help?</h2>
          <p className="text-neutral-600 mb-6">Our support team is ready to assist you.</p>
          <Link href="/contact">
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white">
              Contact Support
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
