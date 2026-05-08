"use client"

/**
 * Cookie consent banner — granular consent (essential / analytics /
 * marketing), persists choice in localStorage + a `wedding_wala_consent`
 * cookie so server-side analytics gating can read it.
 *
 * Reference:
 *   - docs/seo/00-master-seo-playbook.md §28 item 736 + §29 consent mode v2
 *   - docs/payfast/01-payfast-integration-overview.md (privacy compliance)
 *   - SEO playbook anti-pattern §6 item 293 (don't block content on first scroll)
 *
 * Design notes:
 *   - The banner is fixed-bottom and dismissable — never blocks content
 *     (Google "intrusive interstitial" penalty avoided).
 *   - Three categories: essential (always on, can't opt out), analytics,
 *     marketing. Each has a clear toggle.
 *   - Choice persists for 12 months. Re-prompt only after that.
 *   - First render comes AFTER mount to avoid SSR/CSR hydration mismatch
 *     and to avoid layout shift before localStorage read.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { Cookie, X } from "lucide-react"

const COOKIE_NAME = "wedding_wala_consent"
const STORAGE_KEY = "wedding_wala_consent_v1"
const TTL_DAYS = 365

export interface ConsentState {
  essential: true // always true; presence here makes the type self-documenting
  analytics: boolean
  marketing: boolean
  decidedAt: string // ISO timestamp
}

/** Read the persisted consent. Returns null if the user hasn't decided yet. */
export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentState
    if (!parsed?.decidedAt) return null
    // Expire after TTL_DAYS — re-prompt the user.
    const ageMs = Date.now() - new Date(parsed.decidedAt).getTime()
    if (ageMs > TTL_DAYS * 24 * 60 * 60 * 1000) return null
    return parsed
  } catch {
    return null
  }
}

function persist(consent: ConsentState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    // Mirror to a cookie so server actions / middleware can read it.
    const encoded = encodeURIComponent(JSON.stringify(consent))
    const maxAge = TTL_DAYS * 24 * 60 * 60
    document.cookie = `${COOKIE_NAME}=${encoded}; Max-Age=${maxAge}; Path=/; SameSite=Lax`
  } catch {
    /* localStorage unavailable — silent no-op */
  }
}

const ALL_ACCEPTED: ConsentState = {
  essential: true,
  analytics: true,
  marketing: true,
  decidedAt: new Date().toISOString(),
}

const ALL_REJECTED: ConsentState = {
  essential: true,
  analytics: false,
  marketing: false,
  decidedAt: new Date().toISOString(),
}

export function CookieConsent() {
  const [open, setOpen] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    // Defer the read to client-only to avoid hydration mismatch.
    const existing = getConsent()
    if (!existing) setOpen(true)
  }, [])

  if (!open) return null

  const acceptAll = () => {
    persist({ ...ALL_ACCEPTED, decidedAt: new Date().toISOString() })
    setOpen(false)
  }

  const rejectAll = () => {
    persist({ ...ALL_REJECTED, decidedAt: new Date().toISOString() })
    setOpen(false)
  }

  const saveCustom = () => {
    persist({
      essential: true,
      analytics,
      marketing,
      decidedAt: new Date().toISOString(),
    })
    setOpen(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      aria-modal="false"
      className="fixed inset-x-3 bottom-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md z-[60] rounded-lg border border-bridal-beige bg-bridal-cream shadow-xl"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-9 h-9 rounded-full bg-bridal-gold/15 border border-bridal-gold/45 flex items-center justify-center">
            <Cookie className="w-4 h-4 text-bridal-gold-dark" />
          </span>
          <div className="flex-1">
            <p className="font-display italic text-[18px] text-bridal-charcoal">
              Cookies on Wedding Wala
            </p>
            <p className="mt-1 font-bridal text-[13px] text-bridal-text leading-relaxed">
              We use essential cookies to keep you signed in and the booking flow
              working. Analytics and marketing cookies are optional. Read our{" "}
              <Link href="/cookie-policy" className="text-bridal-gold hover:underline">
                Cookie Policy
              </Link>
              .
            </p>

            {showOptions && (
              <fieldset className="mt-4 space-y-2">
                <legend className="sr-only">Cookie categories</legend>
                <label className="flex items-start gap-3 p-2 rounded-md border border-bridal-beige bg-bridal-ivory/40">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="mt-0.5 accent-bridal-gold"
                  />
                  <span className="font-bridal text-[12.5px] text-bridal-text-soft">
                    <strong className="text-bridal-charcoal">Essential</strong> · always on.
                    Authentication, security, fraud prevention.
                  </span>
                </label>
                <label className="flex items-start gap-3 p-2 rounded-md border border-bridal-beige cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="mt-0.5 accent-bridal-gold"
                  />
                  <span className="font-bridal text-[12.5px] text-bridal-text">
                    <strong className="text-bridal-charcoal">Analytics</strong> · helps
                    us understand which pages and vendors are useful.
                  </span>
                </label>
                <label className="flex items-start gap-3 p-2 rounded-md border border-bridal-beige cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="mt-0.5 accent-bridal-gold"
                  />
                  <span className="font-bridal text-[12.5px] text-bridal-text">
                    <strong className="text-bridal-charcoal">Marketing</strong> · attribution
                    for ad campaigns we run on Meta, TikTok, Google.
                  </span>
                </label>
              </fieldset>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {showOptions ? (
                <>
                  <button
                    type="button"
                    onClick={saveCustom}
                    className="inline-flex items-center justify-center px-4 h-9 rounded-full bg-bridal-gold text-white font-bridal text-[12.5px] font-medium hover:bg-bridal-gold-dark transition-colors"
                  >
                    Save preferences
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOptions(false)}
                    className="inline-flex items-center justify-center px-3 h-9 rounded-full font-bridal text-[12.5px] text-bridal-text-soft hover:text-bridal-charcoal transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="inline-flex items-center justify-center px-4 h-9 rounded-full bg-bridal-gold text-white font-bridal text-[12.5px] font-medium hover:bg-bridal-gold-dark transition-colors"
                  >
                    Accept all
                  </button>
                  <button
                    type="button"
                    onClick={rejectAll}
                    className="inline-flex items-center justify-center px-4 h-9 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[12.5px] text-bridal-charcoal transition-colors"
                  >
                    Essential only
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOptions(true)}
                    className="inline-flex items-center justify-center px-3 h-9 rounded-full font-bridal text-[12.5px] text-bridal-text-soft hover:text-bridal-charcoal transition-colors"
                  >
                    Customize
                  </button>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={rejectAll}
            aria-label="Dismiss (essential cookies only)"
            className="flex-shrink-0 -mt-1 -mr-1 w-8 h-8 inline-flex items-center justify-center rounded-full text-bridal-text-soft hover:bg-bridal-blush/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
