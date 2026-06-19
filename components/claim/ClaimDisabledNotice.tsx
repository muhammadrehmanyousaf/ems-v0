"use client"

// Shown at /claim/[id] when NEXT_PUBLIC_CLAIM_ENABLED is not "true". Keeps the
// route navigable (no 404) but tells the visitor the feature is dark-shipped.

import Link from "next/link"
import { Clock } from "lucide-react"

import { BridalCrown, BridalTitle } from "@/components/bridal/bridal-card"
import { FloralDivider } from "@/components/bridal/floral-divider"

export function ClaimDisabledNotice() {
  return (
    <div className="min-h-screen bridal-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-bridal-hero" aria-hidden />
      <div className="absolute inset-0 bg-bridal-wash opacity-95" aria-hidden />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 py-12">
        <div className="w-full max-w-[460px] animate-stagger-fade-up">
          <div className="bridal-card bg-bridal-cream border border-bridal-beige shadow-[0_24px_50px_-30px_rgba(176,125,84,0.5)] rounded-md p-6 sm:p-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-bridal-gold/15 border border-bridal-gold/40 flex items-center justify-center">
              <Clock className="w-7 h-7 text-bridal-gold-dark" />
            </div>
            <BridalCrown className="mb-3">Coming Soon</BridalCrown>
            <BridalTitle size="h2" className="mb-3">
              Claiming is{" "}
              <span className="text-bridal-gold">not available yet</span>
            </BridalTitle>
            <p className="font-bridal text-bridal-text-soft text-sm mb-7">
              We&apos;re putting the finishing touches on listing claims. Please
              check back soon — in the meantime you can browse vendors or get in
              touch.
            </p>
            <Link
              href="/vendors"
              className="inline-flex w-full items-center justify-center h-12 px-8 rounded-[4px] bg-bridal-gold text-bridal-charcoal hover:bg-bridal-gold-dark hover:text-bridal-ivory font-bridal font-medium text-sm uppercase tracking-[0.2em] shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] hover:shadow-[0_12px_28px_-12px_rgba(176,125,84,0.7)] transition-all duration-250"
            >
              Browse Vendors
            </Link>

            <div className="my-6">
              <FloralDivider />
            </div>

            <p className="font-bridal text-sm text-bridal-text-soft">
              Questions?{" "}
              <Link
                href="/contact"
                className="text-bridal-gold hover:text-bridal-gold-dark font-medium underline-offset-4 hover:underline transition-colors"
              >
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
