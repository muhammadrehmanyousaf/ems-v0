import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Star, TrendingUp, Users, ArrowRight, Quote } from "lucide-react"
import Link from "next/link"
import { buildPageMetadata } from "@/lib/seo/metadata"

export const metadata = buildPageMetadata({
  title: "Vendor Success Stories",
  description: "How wedding vendors across Pakistan grow their business with Wedding Wala.",
  path: "/vendor-success",
})

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
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-neutral-600">
            We&apos;re just getting started — real vendor success stories will appear here as our community grows.
          </p>
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
