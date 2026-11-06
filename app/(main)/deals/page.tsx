import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tag, Percent, Clock, Sparkles, ArrowRight, Bell } from "lucide-react"
import Link from "next/link"
import { buildPageMetadata } from "@/lib/seo/metadata"
import {
  SITE_NAME,
  collectionPageLD,
  breadcrumbsLD,
  combineGraph,
} from "@/lib/seo"
import { safeJsonLd } from "@/lib/seo/jsonld"

export const metadata = buildPageMetadata({
  title: "Wedding Deals & Offers",
  description: "Current deals and seasonal offers from Wedding Wala vendors across Pakistan.",
  path: "/deals",
})

export default function DealsPage() {
  const collectionLd = collectionPageLD({
    name: `Wedding Deals & Offers — ${SITE_NAME}`,
    description: "Current deals and seasonal wedding offers from verified vendors across Pakistan.",
    url: "/deals",
    items: [
      { name: "Wedding Venues Deals", url: "/wedding-venues" },
      { name: "Wedding Photographers Deals", url: "/wedding-photographers" },
      { name: "Bridal Makeup Deals", url: "/bridal-makeup-artists" },
      { name: "Catering Packages", url: "/caterers" },
    ],
  })
  const breadcrumbLd = breadcrumbsLD([
    { name: "Home", url: "/" },
    { name: "Deals", url: "/deals" },
  ])
  const combined = combineGraph(collectionLd, breadcrumbLd)

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(combined) }}
      />
      <section className="bg-gradient-to-br from-bridal-gold to-bridal-gold-dark text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Tag className="w-12 h-12 mx-auto mb-4 text-bridal-gold/40" />
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Wedding Deals</h1>
          <p className="text-lg text-bridal-cream max-w-xl mx-auto">
            Exclusive offers from top-rated vendors. Save big on your dream wedding.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center text-neutral-600 mb-4">
            No active deals right now — browse the vendor catalog below for current pricing and offers.
          </div>

          <div className="text-center mt-12 bg-white rounded-2xl p-8 shadow-sm border">
            <Bell className="w-10 h-10 text-bridal-gold-dark mx-auto mb-4" />
            <h2 className="text-xl font-bold text-bridal-charcoal mb-2">Never Miss a Deal</h2>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              Browse our vendor catalog to discover more offers and seasonal promotions.
            </p>
            <Link href="/wedding-venues">
              <Button className="bg-gradient-to-r from-bridal-gold to-bridal-gold-dark hover:from-bridal-gold-dark hover:to-bridal-gold-dark text-white gap-2">
                Browse Vendors <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
