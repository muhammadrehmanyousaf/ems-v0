"use client"

import Link from "next/link"
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
  Heart,
  Star,
  Users,
  Calendar,
  Award,
  Send,
  ArrowRight,
} from "lucide-react"
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion-wrapper"
import { FloralDivider } from "@/components/bridal/floral-divider"
import { BridalButton } from "@/components/bridal/bridal-button"

export function Footer() {
  return (
    <footer className="relative bg-bridal-cream text-bridal-charcoal overflow-hidden">
      {/* Mughal jaal watermark + warm grain — same vocabulary as the hero */}
      <div
        aria-hidden
        className="absolute inset-0 bg-bridal-grain opacity-90"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-mughal-jaal opacity-40"
      />
      {/* Soft blush wash from the top */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-bridal-blush/55 via-bridal-blush/15 to-transparent"
      />

      <div className="relative">
        {/* ── Newsletter band ── */}
        <div className="border-b border-bridal-beige/60">
          <div className="container-responsive py-10 sm:py-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="max-w-md">
                <div className="flex items-center gap-2 mb-3">
                  <span className="block w-8 h-px bg-gradient-to-r from-transparent to-bridal-gold" />
                  <span className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold font-medium">
                    The Bridal Letter
                  </span>
                </div>
                <h3 className="font-display italic text-[26px] sm:text-[30px] leading-tight text-bridal-charcoal">
                  Stories, vendor edits, and{" "}
                  <span className="text-bridal-gold">real shaadi inspiration</span>{" "}
                  — once a week
                </h3>
                <p className="mt-2 font-bridal text-[14px] text-bridal-text-soft">
                  Hand-curated by our team. No spam, ever — just thoughtful wedding
                  planning notes.
                </p>
              </div>

              <form
                onSubmit={(e) => e.preventDefault()}
                className="w-full lg:w-auto flex items-center gap-2 max-w-md"
              >
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bridal-gold pointer-events-none" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="
                      w-full h-11 pl-9 pr-3 rounded-[4px]
                      bg-bridal-cream border border-bridal-beige
                      font-bridal text-[14px] text-bridal-charcoal
                      placeholder:text-bridal-text-label/70
                      focus:outline-none focus:ring-2 focus:ring-bridal-gold/25 focus:border-bridal-gold
                      transition-all
                    "
                  />
                </div>
                <BridalButton type="submit" variant="primary" size="md" className="h-11">
                  <Send className="w-3.5 h-3.5" />
                  Subscribe
                </BridalButton>
              </form>
            </div>
          </div>
        </div>

        {/* ── Main columns ── */}
        <div className="container-responsive py-12 sm:py-14 lg:py-16">
          <StaggerContainer
            staggerDelay={0.08}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10"
          >
            {/* Brand block */}
            <StaggerItem className="lg:col-span-4 space-y-5">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <span className="w-12 h-12 rounded-full bg-bridal-cream border border-bridal-gold/45 flex items-center justify-center group-hover:border-bridal-gold transition-colors">
                  <Heart className="w-5 h-5 text-bridal-gold" />
                </span>
                <span className="leading-none">
                  <span className="block font-display italic text-[28px] text-bridal-charcoal leading-none">
                    AJOINT
                  </span>
                  <span className="block font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mt-1">
                    Pakistan&apos;s Shaadi Platform
                  </span>
                </span>
              </Link>

              <p className="font-bridal text-[14px] text-bridal-text leading-relaxed max-w-sm">
                Where every love story finds its perfect setting. From the first
                mehndi to the final rukhsati, we&apos;re here for every detail.
              </p>

              {/* Trust strip */}
              <div className="flex items-center gap-5 pt-1">
                <span className="inline-flex items-center gap-1.5 font-bridal text-[12px] text-bridal-text-soft">
                  <Star className="w-3.5 h-3.5 text-bridal-gold fill-bridal-gold" />
                  <span className="font-medium text-bridal-charcoal">4.8/5</span>
                  rating
                </span>
                <span className="inline-flex items-center gap-1.5 font-bridal text-[12px] text-bridal-text-soft">
                  <Users className="w-3.5 h-3.5 text-bridal-gold" />
                  <span className="font-medium text-bridal-charcoal">10K+</span>
                  couples
                </span>
              </div>

              {/* Social */}
              <div className="pt-2">
                <span className="font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-text-label font-medium block mb-3">
                  Follow the Story
                </span>
                <div className="flex gap-2">
                  {[
                    { Icon: Instagram, label: "Instagram", href: "#" },
                    { Icon: Facebook,  label: "Facebook",  href: "#" },
                    { Icon: Twitter,   label: "Twitter",   href: "#" },
                  ].map(({ Icon, label, href }) => (
                    <Link
                      key={label}
                      href={href}
                      aria-label={label}
                      className="
                        group inline-flex w-10 h-10 items-center justify-center rounded-full
                        bg-bridal-blush/55 border border-bridal-rose/40
                        text-bridal-mauve hover:text-bridal-charcoal
                        hover:bg-bridal-rose/30 hover:border-bridal-gold/55
                        transition-all duration-200
                      "
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.6} />
                    </Link>
                  ))}
                </div>
              </div>
            </StaggerItem>

            {/* For Couples */}
            <StaggerItem className="lg:col-span-2 space-y-4">
              <h4 className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold font-medium">
                For Couples
              </h4>
              <ul className="space-y-2.5">
                {[
                  { href: "/planning-tools",  name: "Planning Tools" },
                  { href: "/wedding-website", name: "Wedding Website" },
                  { href: "/registry",        name: "Registry" },
                  { href: "/deals",           name: "Special Deals" },
                  { href: "/help",            name: "Help & Support" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="
                        group inline-flex items-center gap-1.5
                        font-bridal text-[14px] text-bridal-text
                        hover:text-bridal-gold transition-colors duration-200
                      "
                    >
                      <span>{item.name}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </StaggerItem>

            {/* For Vendors */}
            <StaggerItem className="lg:col-span-2 space-y-4">
              <h4 className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold font-medium">
                For Vendors
              </h4>
              <ul className="space-y-2.5">
                {[
                  { href: "/business-registration", name: "List Your Business" },
                  { href: "/vendor-success",        name: "Success Stories" },
                  { href: "/vendor-guide",          name: "Vendor Guide" },
                  { href: "/vendor-success",        name: "Partner Program" },
                  { href: "/careers",               name: "Join Our Team" },
                ].map((item) => (
                  <li key={item.href + item.name}>
                    <Link
                      href={item.href}
                      className="
                        group inline-flex items-center gap-1.5
                        font-bridal text-[14px] text-bridal-text
                        hover:text-bridal-gold transition-colors duration-200
                      "
                    >
                      <span>{item.name}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </StaggerItem>

            {/* Contact */}
            <StaggerItem className="lg:col-span-4 space-y-4">
              <h4 className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold font-medium">
                Reach Us
              </h4>
              <ul className="space-y-3">
                {[
                  { Icon: Mail,    label: "Email",   value: "hello@ajoint.com",        href: "mailto:hello@ajoint.com" },
                  { Icon: Phone,   label: "Phone",   value: "+92 300 0000000",         href: "tel:+923000000000"     },
                  { Icon: MapPin,  label: "Studio",  value: "Lahore · Karachi · Islamabad", href: "#" },
                ].map(({ Icon, label, value, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="group flex items-center gap-3"
                    >
                      <span className="
                        inline-flex w-10 h-10 rounded-full bg-bridal-blush/55 border border-bridal-beige
                        items-center justify-center flex-shrink-0
                        group-hover:bg-bridal-gold/15 group-hover:border-bridal-gold/55
                        transition-colors
                      ">
                        <Icon className="w-4 h-4 text-bridal-gold-dark" strokeWidth={1.6} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-bridal text-[10.5px] uppercase tracking-[0.2em] text-bridal-text-label font-medium">
                          {label}
                        </p>
                        <p className="font-bridal text-[14px] text-bridal-charcoal truncate group-hover:text-bridal-gold transition-colors">
                          {value}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* ── Floral divider before bottom bar ── */}
        <div className="container-responsive">
          <FloralDivider width={240} className="opacity-80" />
        </div>

        {/* ── Bottom bar ── */}
        <div className="container-responsive pt-6 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-bridal text-[12.5px] text-bridal-text-soft">
              © {new Date().getFullYear()}{" "}
              <span className="font-display italic text-bridal-charcoal">AJOINT</span>{" "}
              · Crafted with{" "}
              <Heart className="w-3 h-3 inline-block text-bridal-rose fill-bridal-rose mx-0.5" />{" "}
              for Pakistani couples
            </p>
            <nav className="flex items-center gap-1 sm:gap-3 flex-wrap justify-center">
              {[
                { href: "/privacy",  name: "Privacy Policy" },
                { href: "/terms",    name: "Terms of Service" },
                { href: "/cookies",  name: "Cookie Policy" },
              ].map((link, i, arr) => (
                <span key={link.href} className="inline-flex items-center gap-3">
                  <Link
                    href={link.href}
                    className="font-bridal text-[12.5px] text-bridal-text-soft hover:text-bridal-gold transition-colors"
                  >
                    {link.name}
                  </Link>
                  {i < arr.length - 1 && (
                    <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-bridal-beige" />
                  )}
                </span>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
