"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Quote } from "lucide-react"
import { ScrollReveal, CountUp } from "@/components/ui/motion-wrapper"

const testimonials = [
  {
    quote: "The vendors we found here made our wedding absolutely magical. Every detail was perfect!",
    couple: "Priya & Rahul",
    location: "Mumbai",
    rating: 5,
  },
  {
    quote: "From photographer to caterer, we booked everything through this platform. Couldn't be happier!",
    couple: "Sara & Ahmed",
    location: "Delhi",
    rating: 5,
  },
  {
    quote: "The planning tools saved us so much time. Our wedding day went flawlessly thanks to them.",
    couple: "Meera & Arun",
    location: "Chennai",
    rating: 5,
  },
  {
    quote: "We discovered amazing vendors we never would have found otherwise. Truly a game-changer!",
    couple: "Aisha & Raj",
    location: "Udaipur",
    rating: 5,
  },
]

const stats = [
  { end: 10000, suffix: "+", label: "Happy Couples" },
  { end: 500, suffix: "+", label: "Verified Vendors" },
  { end: 50, suffix: "+", label: "Cities Covered" },
  { end: 4.8, suffix: "", label: "Avg Rating", decimals: true },
]

export function TestimonialBand() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.15),transparent_50%)]" />

      <div className="relative container-responsive">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Testimonials */}
          <ScrollReveal variant="fade-right">
            <div>
              {/* Large quote mark */}
              <Quote className="w-12 h-12 text-gold-500/40 mb-6 rotate-180" />

              <div className="relative min-h-[160px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <blockquote className="text-xl sm:text-2xl lg:text-3xl font-heading text-white/95 leading-relaxed mb-6">
                      &ldquo;{testimonials[current].quote}&rdquo;
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold text-sm">
                        {testimonials[current].couple.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{testimonials[current].couple}</p>
                        <p className="text-sm text-purple-200">{testimonials[current].location}</p>
                      </div>
                      <div className="ml-auto flex gap-0.5">
                        {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-gold-400 text-gold-400" />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Dots */}
              <div className="flex gap-2 mt-8">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === current ? "w-8 bg-gold-400" : "bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Right: Stats */}
          <ScrollReveal variant="fade-left">
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
                >
                  <div className="text-3xl sm:text-4xl font-bold font-heading text-white mb-1">
                    {stat.decimals ? (
                      <span>4.8</span>
                    ) : (
                      <CountUp end={stat.end} suffix={stat.suffix} duration={2.5} />
                    )}
                  </div>
                  <p className="text-sm text-purple-200">{stat.label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
