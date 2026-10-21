import type { Metadata } from "next"
import Link from "next/link"
import {
  buildPageMetadata,
  SITE_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import {
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Building2,
  Camera,
  BadgeAlert,
  ArrowRight,
} from "lucide-react"

export const metadata: Metadata = buildPageMetadata({
  title: "How We Verify Wedding Vendors | Verification Standards",
  description:
    "Learn about Wedding Wala's strict 5-step vendor verification process — identity checks, physical venue inspection, portfolio auditing, and transparent PKR pricing.",
  path: "/how-we-verify-vendors",
})

export default function HowWeVerifyVendorsPage() {
  const steps = [
    {
      icon: FileCheck,
      number: "01",
      title: "Identity & Business Registration Check",
      desc: "Every verified vendor provides official identification (CNIC of the primary owner or manager) and verified business credentials (NTN, municipal trade license, or business bank account details). This prevents ghost listings and impersonation.",
    },
    {
      icon: Building2,
      number: "02",
      title: "Physical Venue & Operations Inspection",
      desc: "For wedding halls, marquees, and farmhouses, we verify the physical location, street address, and active operations. We check air-conditioning facilities, generator backup capacity, dedicated parking space, and bridal room amenities.",
    },
    {
      icon: Camera,
      number: "03",
      title: "Portfolio & Media Authenticity Audit",
      desc: "We screen photography, videography, and stage decor portfolios against image databases to ensure work is 100% authentic to the vendor and not scraped from Pinterest, Indian wedding blogs, or competing Pakistani studios.",
    },
    {
      icon: ShieldCheck,
      number: "04",
      title: "Transparent PKR Pricing & Contract Review",
      desc: "Vendors confirm their exact pricing basis (per-head menu or flat event package), minimum guest counts, deposit requirements, and what is included (sound, generator fuel, waiter staff). We reject placeholder or fabricated prices.",
    },
    {
      icon: CheckCircle2,
      number: "05",
      title: "100% Genuine, Post-Event Reviews Only",
      desc: "Reviews on Wedding Wala can only be submitted by verified couples after their event date has passed. We do not permit self-reviews, competitor smear campaigns, or incentivized ratings.",
    },
  ]

  return (
    <div className="container-responsive py-10 sm:py-16">
      <Breadcrumbs
        items={[{ name: "How We Verify Vendors", href: "/how-we-verify-vendors" }]}
        className="mb-6"
      />

      <header className="max-w-3xl mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Trust & Safety Standards
        </span>
        <h1 className="font-display italic text-3xl sm:text-5xl text-bridal-charcoal leading-tight">
          How We Verify Wedding Vendors on {SITE_NAME}
        </h1>
        <p className="mt-4 font-bridal text-base sm:text-lg text-bridal-text leading-relaxed">
          Planning a wedding is one of the most significant financial and emotional investments a Pakistani family makes. Here is how our multi-stage vetting process ensures you connect with genuine, accountable professionals.
        </p>
      </header>

      {/* 5-Step Process */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-xl border border-bridal-beige bg-white p-6 shadow-sm hover:shadow-md transition-shadow relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-bridal-cream flex items-center justify-center text-bridal-gold-dark">
                  <step.icon className="w-6 h-6" />
                </div>
                <span className="font-display italic text-2xl text-bridal-gold/40">
                  {step.number}
                </span>
              </div>
              <h2 className="font-display italic text-xl text-bridal-charcoal mb-2">
                {step.title}
              </h2>
              <p className="font-bridal text-sm text-bridal-text leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Verified vs Unclaimed Explainer */}
      <section className="mb-16 rounded-2xl border border-bridal-beige bg-bridal-cream/40 p-8 sm:p-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <BadgeAlert className="w-5 h-5 text-bridal-gold-dark" />
            <h2 className="font-display italic text-2xl text-bridal-charcoal">
              Understanding Listing Badges
            </h2>
          </div>
          <div className="space-y-4 text-sm text-bridal-text leading-relaxed">
            <p>
              On {SITE_NAME}, you will notice two distinct types of listings:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-white border border-bridal-beige">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-xs px-2 py-0.5 rounded bg-emerald-50 mb-2">
                  ✓ Verified Vendor
                </span>
                <p className="text-xs text-bridal-text">
                  The vendor has completed our full 5-step verification process, verified their identity, and actively maintains their quotes, availability, and bookings.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white border border-bridal-beige">
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700 text-xs px-2 py-0.5 rounded bg-amber-50 mb-2">
                  Public Directory Listing
                </span>
                <p className="text-xs text-bridal-text">
                  Information indexed from public records and community directories. Unclaimed until the owner verifies their business. Prices on these cards are marked &quot;Price on request&quot; until confirmed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="rounded-2xl bg-bridal-charcoal text-white p-8 sm:p-12 text-center max-w-4xl mx-auto">
        <h2 className="font-display italic text-2xl sm:text-3xl mb-3 text-bridal-gold">
          Are You a Wedding Vendor in Pakistan?
        </h2>
        <p className="font-bridal text-sm sm:text-base text-white/80 max-w-xl mx-auto mb-6">
          Claim your listing, pass our verification review, and start receiving direct inquiries from families planning weddings in your city.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/list-your-business"
            className="inline-flex items-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-bridal text-sm font-semibold text-bridal-charcoal hover:bg-white transition-colors"
          >
            <span>Get Your Business Verified</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 font-bridal text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Contact Verification Desk
          </a>
        </div>
      </section>
    </div>
  )
}
