"use client"

import { useEffect, useState } from "react"
import Script from "next/script"

/**
 * GA4 (gtag.js), loaded on first interaction or after the page has been idle —
 * whichever comes first.
 *
 * WHY THIS IS NOT `strategy="lazyOnload"` ANY MORE. It was, and the comment here
 * claimed that put gtag "fully off the critical render path". Measured on
 * production against a mid-range Android on a shaped 4G link, running each page
 * twice — once as shipped, once with googletagmanager blocked at the network
 * layer:
 *
 *     /wedding-venues/karachi    blocking time  2,080ms -> 709ms   (-66%)
 *     /                          blocking time  8,347ms -> 5,637ms (-2,710ms)
 *                                LCP            8,600ms -> 7,152ms
 *
 * `lazyOnload` fires on the window `load` event. gtag.js is ~514kb — the largest
 * single script on a page like /wedding-venues/[city], which fetches nothing
 * else at all — so "after load" still means parsing and executing half a
 * megabyte at exactly the moment the visitor starts scrolling and tapping. Off
 * the *render* path, yes; off the *interaction* path, no.
 *
 * So it now waits for one of:
 *   - a real interaction (pointer, key, touch, scroll) — by which point the
 *     visitor has engaged and a few hundred ms of script no longer costs them
 *     their first impression, or
 *   - IDLE_DELAY_MS of quiet, via requestIdleCallback — so a visitor who reads
 *     without touching anything is still counted.
 *
 * WHAT THIS COSTS IN DATA. A visitor who leaves within IDLE_DELAY_MS without
 * touching the page is not counted. That was already partly true under
 * `lazyOnload` (its own comment accepted it), and this widens the window. It is
 * a deliberate trade: on the measurements above, the alternative is every
 * visitor paying 1.4-2.7 seconds of frozen main thread. If the analytics gap
 * ever matters more than the speed, the honest fix is server-side GA4 via the
 * Measurement Protocol, not moving this back onto the main thread.
 *
 * Verify after deploying: GA4 Realtime should still show pageviews, and
 * scripts/perf/perf-3p.cjs should show the with/without gap has closed.
 */

// Long enough to be clear of hydration and the LCP image on a slow phone,
// short enough that an average reader is still on the page.
const IDLE_DELAY_MS = 3500

const TRIGGERS = ["pointerdown", "keydown", "touchstart", "scroll", "wheel"] as const

export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-SGNECTNX2B"
  const [load, setLoad] = useState(false)

  useEffect(() => {
    if (load) return
    let done = false
    const fire = () => {
      if (done) return
      done = true
      cleanup()
      setLoad(true)
    }
    const opts = { passive: true, capture: true } as AddEventListenerOptions
    const cleanup = () => {
      for (const t of TRIGGERS) window.removeEventListener(t, fire, opts)
      if (timer) clearTimeout(timer)
      if (idle && "cancelIdleCallback" in window) (window as any).cancelIdleCallback(idle)
    }
    for (const t of TRIGGERS) window.addEventListener(t, fire, opts)

    // requestIdleCallback so the load lands in a gap rather than competing with
    // hydration; the timeout is the backstop for a page that never goes idle.
    let idle: number | undefined
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        idle = (window as any).requestIdleCallback(fire, { timeout: 2000 })
      } else {
        fire()
      }
    }, IDLE_DELAY_MS)

    return cleanup
  }, [load])

  if (!load) return null

  return (
    <>
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
    </>
  )
}
