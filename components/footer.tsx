"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Mail,
  Phone,
  MapPin,
  Heart,
  Star,
  Users,
  Send,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Music2,
  Pin,
} from "lucide-react"
import { getSocialProfiles, type SocialProfile } from "@/lib/seo"

// Social-icon mapping — keep in sync with SocialProfile["key"].
const SOCIAL_ICONS: Record<SocialProfile["key"], typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Music2, // lucide doesn't ship a TikTok icon — Music2 is the cleanest match
  pinterest: Pin,
}
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion-wrapper"
import { FloralDivider } from "@/components/bridal/floral-divider"
import { BridalButton } from "@/components/bridal/bridal-button"

type SubscribeState = "idle" | "loading" | "success" | "error"

export function Footer() {
  const [email, setEmail] = useState("")
  const [bot, setBot] = useState("") // honeypot
  const [state, setState] = useState<SubscribeState>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubscribe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === "loading") return
    setState("loading")
    setErrorMsg("")
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), bot }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) {
        setState("error")
        setErrorMsg(data?.error || "Something went wrong. Please try again.")
        return
      }
      setState("success")
      setEmail("")
    } catch {
      setState("error")
      setErrorMsg("Network error. Please try again.")
    }
  }

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

              {state === "success" ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="w-full lg:w-auto flex items-center gap-2 max-w-md h-11 px-4 rounded-[4px] bg-bridal-cream border border-bridal-gold/55 text-bridal-charcoal"
                >
                  <CheckCircle2 className="w-4 h-4 text-bridal-gold-dark" />
                  <span className="font-bridal text-[14px]">
                    Thank you — check your inbox to confirm.
                  </span>
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="w-full lg:w-auto flex flex-col gap-2 max-w-md"
                  noValidate
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="relative w-full sm:flex-1 min-w-0">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bridal-gold pointer-events-none" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        inputMode="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={state === "loading"}
                        aria-invalid={state === "error"}
                        aria-describedby={state === "error" ? "newsletter-error" : undefined}
                        className="
                          w-full h-11 pl-9 pr-3 rounded-[4px]
                          bg-bridal-cream border border-bridal-beige
                          font-bridal text-[14px] text-bridal-charcoal
                          placeholder:text-bridal-text-label/70
                          focus:outline-none focus:ring-2 focus:ring-bridal-gold/25 focus:border-bridal-gold
                          transition-all
                          disabled:opacity-60
                        "
                      />
                    </div>
                    {/* Honeypot — hidden from real users, bots fill it. */}
                    <input
                      type="text"
                      name="bot"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      value={bot}
                      onChange={(e) => setBot(e.target.value)}
                      className="hidden"
                    />
                    <BridalButton
                      type="submit"
                      variant="primary"
                      size="md"
                      className="h-11 w-full sm:w-auto shrink-0"
                      disabled={state === "loading"}
                    >
                      {state === "loading" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      {state === "loading" ? "Sending…" : "Subscribe"}
                    </BridalButton>
                  </div>
                  {state === "error" && (
                    <p
                      id="newsletter-error"
                      role="alert"
                      className="font-bridal text-[12.5px] text-bridal-coral"
                    >
                      {errorMsg}
                    </p>
                  )}
                </form>
              )}
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon-mark.png" alt="Wedding Wala" className="w-7 h-7" />
                </span>
                <span className="leading-none">
                  <span className="block font-display italic text-[28px] text-bridal-charcoal leading-none">
                    Wedding Wala
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
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
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

              {/*
                Social row — renders ONLY if at least one
                NEXT_PUBLIC_SOCIAL_* env var is set. Until handles are
                registered nothing renders, so we never ship dead `href="#"`
                links (Google flags those as low-quality). Adding a handle
                later is a one-line Vercel env-var add — no code edit.
              */}
              {(() => {
                const profiles = getSocialProfiles()
                if (profiles.length === 0) return null
                return (
                  <div className="pt-2">
                    <span className="font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-text-label font-medium block mb-3">
                      Follow the Story
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {profiles.map((p) => {
                        const Icon = SOCIAL_ICONS[p.key]
                        return (
                          <a
                            key={p.key}
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer me"
                            aria-label={p.label}
                            className="
                              group inline-flex w-10 h-10 items-center justify-center rounded-full
                              bg-bridal-blush/55 border border-bridal-rose/40
                              text-bridal-mauve hover:text-bridal-charcoal
                              hover:bg-bridal-rose/30 hover:border-bridal-gold/55
                              transition-all duration-200
                            "
                          >
                            <Icon className="w-4 h-4" strokeWidth={1.6} />
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </StaggerItem>

            {/* For Couples */}
            <StaggerItem className="lg:col-span-2 space-y-4">
              <h4 className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold font-medium">
                For Couples
              </h4>
              <ul className="space-y-2.5">
                {[
                  { href: "/how-it-works",    name: "How it works" },
                  { href: "/planning-tools",  name: "Planning tools" },
                  { href: "/cities",          name: "Browse by city" },
                  { href: "/real-weddings",   name: "Real weddings" },
                  { href: "/blog",            name: "Wedding blog" },
                  { href: "/help",            name: "Help & support" },
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
                  { href: "/business-registration", name: "List your business" },
                  { href: "/vendor-guide",          name: "Vendor guide" },
                  { href: "/vendor-success",        name: "Success stories" },
                  { href: "/careers",               name: "Join our team" },
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

            {/* Policies — required for PayFast underwriting + card-network compliance */}
            <StaggerItem className="lg:col-span-2 space-y-4">
              <h4 className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold font-medium">
                Policies
              </h4>
              <ul className="space-y-2">
                {[
                  { href: "/terms",                    name: "Terms of service" },
                  { href: "/privacy",                  name: "Privacy policy" },
                  { href: "/refund-policy",            name: "Refund policy" },
                  { href: "/cancellation-policy",      name: "Cancellation policy" },
                  { href: "/service-delivery-policy",  name: "Service delivery" },
                  { href: "/cookie-policy",            name: "Cookie policy" },
                  { href: "/acceptable-use",           name: "Acceptable use" },
                  { href: "/aml-policy",               name: "AML policy" },
                  { href: "/disclaimer",               name: "Disclaimer" },
                  { href: "/complaints",               name: "Complaints" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="font-bridal text-[13px] text-bridal-text hover:text-bridal-gold transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </StaggerItem>

            {/* Contact */}
            <StaggerItem className="lg:col-span-2 space-y-4">
              <h4 className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold font-medium">
                Reach Us
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:info@weddingwala.pk"
                    className="group flex items-center gap-3"
                  >
                    <span className="
                      inline-flex w-10 h-10 rounded-full bg-bridal-blush/55 border border-bridal-beige
                      items-center justify-center flex-shrink-0
                      group-hover:bg-bridal-gold/15 group-hover:border-bridal-gold/55
                      transition-colors
                    ">
                      <Mail className="w-4 h-4 text-bridal-gold-dark" strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bridal text-[10.5px] uppercase tracking-[0.2em] text-bridal-text-label font-medium">
                        Email
                      </p>
                      <p className="font-bridal text-[14px] text-bridal-charcoal truncate group-hover:text-bridal-gold transition-colors">
                        info@weddingwala.pk
                      </p>
                    </div>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+923274811220"
                    className="group flex items-center gap-3"
                  >
                    <span className="
                      inline-flex w-10 h-10 rounded-full bg-bridal-blush/55 border border-bridal-beige
                      items-center justify-center flex-shrink-0
                      group-hover:bg-bridal-gold/15 group-hover:border-bridal-gold/55
                      transition-colors
                    ">
                      <Phone className="w-4 h-4 text-bridal-gold-dark" strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bridal text-[10.5px] uppercase tracking-[0.2em] text-bridal-text-label font-medium">
                        Phone &amp; WhatsApp
                      </p>
                      <p className="font-bridal text-[14px] text-bridal-charcoal truncate group-hover:text-bridal-gold transition-colors">
                        +92 327 4811220
                      </p>
                    </div>
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="
                    inline-flex w-10 h-10 rounded-full bg-bridal-blush/55 border border-bridal-beige
                    items-center justify-center flex-shrink-0
                  ">
                    <MapPin className="w-4 h-4 text-bridal-gold-dark" strokeWidth={1.6} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bridal text-[10.5px] uppercase tracking-[0.2em] text-bridal-text-label font-medium">
                      Service area
                    </p>
                    <p className="font-bridal text-[14px] text-bridal-charcoal">
                      Pakistan-wide
                    </p>
                  </div>
                </li>
              </ul>
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* ── Floral divider before bottom bar ── */}
        <div className="container-responsive">
          <FloralDivider width={240} className="opacity-80" />
        </div>

        {/* ── Payment methods strip ── */}
        <div className="container-responsive pt-3 pb-3 border-t border-bridal-beige/60">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-3xl mx-auto">
            <span className="font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-text-label font-medium">
              We accept
            </span>
            <ul
              aria-label="Accepted payment methods"
              className="flex items-center gap-2 flex-wrap justify-center"
            >
              {/*
                Text-only badges until card-scheme + PayFast logo files are
                added with proper licence attribution. Reference:
                docs/payfast/01-payfast-integration-overview.md §3 PayFast
                integration. Once approved, swap each <span> for the
                official SVG.
              */}
              {[
                "VISA",
                "Mastercard",
                "UnionPay",
                "JazzCash",
                "Easypaisa",
                "Bank transfer",
              ].map((label) => (
                <li
                  key={label}
                  className="inline-flex items-center justify-center px-2.5 h-7 rounded border border-bridal-beige bg-bridal-ivory/60 font-bridal text-[10.5px] tracking-wide text-bridal-charcoal"
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Marketplace disclosure (PayFast + card-network compliance) ── */}
        <div className="container-responsive pt-2 pb-2">
          <p className="font-bridal text-[12px] text-bridal-text-soft text-center max-w-3xl mx-auto leading-relaxed">
            Wedding Wala is a marketplace. Wedding services are delivered by independent vendors. Payments are processed securely through licensed Pakistani payment gateways — your card statement reads <strong className="text-bridal-charcoal">WEDDINGWALA</strong>. We never store full card details.
          </p>
        </div>

        {/* ── Bottom bar ── */}
        <div className="container-responsive pt-4 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="font-bridal text-[12.5px] text-bridal-text-soft text-center md:text-left">
              © {new Date().getFullYear()}{" "}
              <span className="font-display italic text-bridal-charcoal">Wedding Wala</span>
              {" "}· Crafted with{" "}
              <Heart className="w-3 h-3 inline-block text-bridal-rose fill-bridal-rose mx-0.5" />
              {" "}for Pakistani couples
              {/*
                TODO: append registered legal name + SECP # + NTN once
                provided. Pending fields tracked in docs/company-info.md.
                Example final shape:
                  © 2026 Wedding Wala (Pvt) Ltd · SECP #XXXXXX · NTN XXXXXXX-X
              */}
            </p>
            <p className="font-bridal text-[12.5px] text-bridal-text-soft text-center md:text-right">
              <Link href="/contact" className="hover:text-bridal-gold transition-colors">
                Contact
              </Link>
              <span className="mx-2 text-bridal-beige">·</span>
              <Link href="/complaints" className="hover:text-bridal-gold transition-colors">
                Complaints
              </Link>
              <span className="mx-2 text-bridal-beige">·</span>
              <Link href="/how-it-works" className="hover:text-bridal-gold transition-colors">
                How it works
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
