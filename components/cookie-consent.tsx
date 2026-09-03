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
 *   - The banner is fixed-bottom and dismissable, and RESERVES ITS OWN SPACE
 *     at the foot of the document so it never covers the page's controls.
 *     See the note on useReservedSpace below — "fixed-bottom and dismissable"
 *     was not, on its own, enough to keep it from blocking content.
 *   - Google "intrusive interstitial" penalty avoided.
 *   - Three categories: essential (always on, can't opt out), analytics,
 *     marketing. Each has a clear toggle.
 *   - Choice persists for 12 months. Re-prompt only after that.
 *   - First render comes AFTER mount to avoid SSR/CSR hydration mismatch
 *     and to avoid layout shift before localStorage read.
 */

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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

/**
 * Reserve room at the foot of the document for the banner, so it cannot sit
 * on top of the page's own controls.
 *
 * ── The defect this exists to stop coming back ───────────────────────────
 *
 * The banner is `position: fixed` at the bottom of the viewport, so it is out
 * of flow: the page lays out as though it were not there, and the banner then
 * paints over whatever happens to be underneath. Measured on production at
 * 360x640 — an ordinary Android size here — the banner occupied y 318..628,
 * half the screen, and the LOGIN page's "Sign In" button sat at y 399..447,
 * entirely inside it. `document.elementFromPoint` at the button's centre
 * returned the banner's paragraph, and Playwright reported the banner's
 * "subtree intercepts pointer events".
 *
 * The login page does not scroll (scrollHeight === innerHeight), so there was
 * no way to move the button out from under it. A visitor on that phone taps
 * Sign In, nothing happens, and the site looks broken. The same overlap made
 * "Cancel" 100% unclickable on the pay screen at 390x844, and covered the pay
 * button once scrolled to on a laptop.
 *
 * Padding the document rather than restyling the banner is deliberate: it is
 * the one change that is correct for every page, whether that page scrolls or
 * not. On a page that already scrolls it adds harmless space after the last
 * element. On a page that does not, it makes the page scrollable by exactly
 * the banner's height, which is the difference between "unreachable" and
 * "reachable". The reservation lasts only while the banner is up — that is,
 * until the visitor's first decision — and is removed on unmount.
 *
 * The height is measured rather than hard-coded because the banner grows when
 * "Customize" expands the category list, and the copy wraps differently at
 * every width.
 */
function useReservedSpace(open: boolean, el: HTMLElement | null) {
  useEffect(() => {
    if (!open || !el || typeof document === "undefined") return

    const previous = document.body.style.paddingBottom

    const apply = () => {
      const h = el.getBoundingClientRect().height
      if (!h) return
      // + 12px to match the banner's own `bottom-3` inset, so the last
      // element on the page clears it rather than touching it.
      document.body.style.paddingBottom = `${Math.ceil(h) + 12}px`
    }

    apply()

    // The banner changes height when Customize expands, on rotation, and on
    // any width change that rewraps the copy.
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(apply)
      ro.observe(el)
    }
    window.addEventListener("resize", apply)
    window.addEventListener("orientationchange", apply)

    return () => {
      ro?.disconnect()
      window.removeEventListener("resize", apply)
      window.removeEventListener("orientationchange", apply)
      // Restore rather than blank it, in case anything else set it.
      document.body.style.paddingBottom = previous
    }
  }, [open, el])
}

export function CookieConsent() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(false)
  // Callback ref: the node arrives after the first paint, and a plain ref
  // would not re-run the effect when it does.
  const [bannerEl, setBannerEl] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    // Defer the read to client-only to avoid hydration mismatch.
    const existing = getConsent()
    if (!existing) setOpen(true)
  }, [])

  useReservedSpace(open, bannerEl)

  // Not on the authenticated dashboard — a logged-in vendor already has
  // essential cookies, and the banner has no reserved-space anchor inside the
  // shadow-DOM app shell, so it floated over the console's content.
  if (pathname?.startsWith("/dashboard")) return null

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
      ref={setBannerEl}
      role="dialog"
      aria-label="Cookie preferences"
      aria-modal="false"
      className="fixed inset-x-3 bottom-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md z-[60] rounded-lg border border-bridal-beige bg-bridal-cream shadow-xl"
    >
      {/*
        The category list can be taller than a small phone. Cap it and let it
        scroll inside the banner, so expanding Customize can never grow the
        banner past the screen and bury its own Save button.
      */}
      {/*
        Sized down hard on phones. Reserving space stopped anything being
        permanently unreachable, but a 310px banner on a 640px screen still
        covered the login button on first paint, and a visitor who does not
        think to scroll still sees a dead button. Everything below that is
        responsive exists to buy vertical pixels back on small screens:
        the icon and the long copy are desktop-only, and the actions sit on
        one row instead of wrapping onto three.
      */}
      <div className="p-3.5 sm:p-5 max-h-[70svh] overflow-y-auto overscroll-contain">
        <div className="flex items-start gap-3">
          {/* Decorative only — it costs 48px of text width on a 360px screen,
              which is a whole extra line of wrapped copy. */}
          <span className="hidden sm:flex flex-shrink-0 w-9 h-9 rounded-full bg-bridal-gold/15 border border-bridal-gold/45 items-center justify-center">
            <Cookie className="w-4 h-4 text-bridal-gold-dark" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display italic text-[16px] sm:text-[18px] text-bridal-charcoal">
              Cookies on Wedding Wala
            </p>
            <p className="mt-1 font-bridal text-[12.5px] sm:text-[13px] text-bridal-text leading-snug sm:leading-relaxed">
              <span className="sm:hidden">
                Essential cookies keep you signed in. Analytics and marketing are
                optional.{" "}
              </span>
              <span className="hidden sm:inline">
                We use essential cookies to keep you signed in and the booking flow
                working. Analytics and marketing cookies are optional. Read our{" "}
              </span>
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

            {/*
              One row, not three. `flex-wrap` with three pill buttons wrapped
              onto three lines at 360px and cost ~80px of height on its own.
              min-w-0 + truncate lets the labels shrink instead of forcing a
              wrap, and the tap targets stay at 36px.
            */}
            <div className="mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2">
              {showOptions ? (
                <>
                  <button
                    type="button"
                    onClick={saveCustom}
                    className="min-w-0 flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 h-9 rounded-full bg-bridal-gold text-white font-bridal text-[12.5px] font-medium hover:bg-bridal-gold-dark transition-colors"
                  >
                    <span className="truncate">Save preferences</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOptions(false)}
                    className="flex-shrink-0 inline-flex items-center justify-center px-3 h-9 rounded-full font-bridal text-[12.5px] text-bridal-text-soft hover:text-bridal-charcoal transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="min-w-0 flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 h-9 rounded-full bg-bridal-gold text-white font-bridal text-[12.5px] font-medium hover:bg-bridal-gold-dark transition-colors"
                  >
                    <span className="truncate">Accept all</span>
                  </button>
                  <button
                    type="button"
                    onClick={rejectAll}
                    className="min-w-0 flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 h-9 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[12.5px] text-bridal-charcoal transition-colors"
                  >
                    <span className="truncate">Essential only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOptions(true)}
                    className="flex-shrink-0 inline-flex items-center justify-center px-2.5 sm:px-3 h-9 rounded-full font-bridal text-[12.5px] text-bridal-text-soft hover:text-bridal-charcoal transition-colors"
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
