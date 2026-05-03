"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react"
import { ScrollReveal, CountUp } from "@/components/ui/motion-wrapper"
import { FloralDivider } from "@/components/bridal/floral-divider"

const testimonials = [
  {
    quote:
      "We found our photographer, our venue, and our caterer in one evening. Truly the dream platform — every detail of our shaadi was perfect.",
    couple: "Sarah & Ahmed",
    location: "Lahore",
    rating: 5,
  },
  {
    quote:
      "The planning tools saved us so many late nights. Our walima went flawlessly because every vendor was already coordinated.",
    couple: "Aisha & Raja",
    location: "Karachi",
    rating: 5,
  },
  {
    quote:
      "AJOINT introduced us to vendors we never would have found on our own. The Mehndi was unforgettable — and so was the value.",
    couple: "Hira & Bilal",
    location: "Islamabad",
    rating: 5,
  },
  {
    quote:
      "Booking through AJOINT meant transparent pricing, real reviews, and a calendar that just worked. The least stressful wedding any of our friends have planned.",
    couple: "Mehar & Faisal",
    location: "Faisalabad",
    rating: 5,
  },
]

const stats = [
  { end: 10000, suffix: "+", label: "Happy Couples" },
  { end: 500,   suffix: "+", label: "Verified Vendors" },
  { end: 50,    suffix: "+", label: "Cities Covered" },
  { end: 4.8,   suffix: "/5", label: "Avg Rating", decimals: true },
]

export function TestimonialBand() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 6500)
    return () => clearInterval(timer)
  }, [])

  const t = testimonials[current]

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden bg-bridal-blush/55">
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-90" />
      <div aria-hidden className="absolute inset-0 bg-mughal-jaal opacity-40" />
      {/* Soft warm radials */}
      <span aria-hidden className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-bridal-rose/25 blur-3xl" />
      <span aria-hidden className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-bridal-gold/15 blur-3xl" />

      <div className="relative container-responsive">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* ── Left: Testimonial ── */}
          <ScrollReveal variant="fade-right" className="lg:col-span-7">
            <div className="max-w-2xl">
              {/* Caps eyebrow */}
              <div className="flex items-center gap-3 mb-3">
                <span className="block w-10 h-px bg-gradient-to-r from-transparent to-bridal-gold" />
                <span className="font-bridal text-[10.5px] uppercase tracking-[0.32em] text-bridal-gold font-medium">
                  Real Couples · Real Stories
                </span>
              </div>

              {/* Big italic Playfair gold opening quote */}
              <Quote
                className="w-14 h-14 text-bridal-gold/35 mb-4 -ml-2 rotate-180"
                strokeWidth={1.4}
              />

              <div className="relative min-h-[180px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -18 }}
                    transition={{ duration: 0.55 }}
                  >
                    <blockquote className="font-display italic text-[22px] sm:text-[26px] lg:text-[30px] leading-[1.3] text-bridal-charcoal">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>

                    <div className="mt-6 flex items-center gap-4 flex-wrap">
                      <div className="w-12 h-12 rounded-full bg-bridal-cream border-2 border-bridal-gold flex items-center justify-center font-display italic text-bridal-charcoal text-[20px] flex-shrink-0">
                        {t.couple.charAt(0)}
                      </div>
                      <div>
                        <p className="font-display italic text-[18px] text-bridal-charcoal leading-tight">
                          {t.couple}
                        </p>
                        <p className="font-bridal text-[11px] uppercase tracking-[0.22em] text-bridal-gold mt-0.5">
                          {t.location}
                        </p>
                      </div>
                      <div className="ml-auto flex items-center gap-0.5">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 text-bridal-gold fill-bridal-gold"
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bridal pagination — gold pill for active, beige dots otherwise + arrow controls */}
              <div className="mt-8 flex items-center gap-3">
                <div className="flex gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === current
                          ? "w-8 bg-bridal-gold"
                          : "w-1.5 bg-bridal-beige hover:bg-bridal-text-label/45"
                      }`}
                      aria-label={`Testimonial ${i + 1}`}
                    />
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrent(
                        (current - 1 + testimonials.length) %
                          testimonials.length
                      )
                    }
                    className="inline-flex w-9 h-9 items-center justify-center rounded-full border border-bridal-beige bg-bridal-cream text-bridal-mauve hover:border-bridal-gold/55 hover:text-bridal-charcoal transition-colors"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrent((current + 1) % testimonials.length)}
                    className="inline-flex w-9 h-9 items-center justify-center rounded-full border border-bridal-gold/55 bg-bridal-gold text-bridal-charcoal hover:bg-bridal-gold-dark hover:text-bridal-ivory transition-colors"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* ── Right: Stats ── */}
          <ScrollReveal variant="fade-left" className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bridal-card p-5 sm:p-6 text-center hover:border-bridal-gold/55 transition-colors"
                >
                  <div className="font-display italic text-[28px] sm:text-[34px] text-bridal-gold leading-none">
                    {stat.decimals ? (
                      <span>4.8/5</span>
                    ) : (
                      <CountUp end={stat.end} suffix={stat.suffix} duration={2.5} />
                    )}
                  </div>
                  <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-text-soft font-medium mt-2">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <FloralDivider className="mt-7" width={200} />
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
