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
 *   - the LARGEST PAINT having happened, then a short idle.
 *
 * WHY THE PAINT AND NOT A FIXED DELAY. The fixed delay was 3,500ms, and on a
 * page whose LCP is later than that the script loads BEFORE the thing being
 * measured: /vendors measured LCP 7.8s, and Lighthouse attributed 173ms of
 * blocking and 173kb of transfer to Google Tag Manager inside that window. A
 * clock cannot know when the page has finished painting; the paint can.
 *
 * Gating on the LCP entry means the script can never compete with the largest
 * paint, on a fast page or a slow one, without guessing a number.
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

// The earliest we will consider loading, once the largest paint has happened.
// Short, because the real gate below is the paint, not the clock.
const IDLE_DELAY_MS = 1500

// Hard backstop. A page that never reports a largest paint -- no image, no big
// text block, or a browser without the entry type -- still gets counted.
const BACKSTOP_MS = 8000

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

    // Load once the largest paint has happened and the browser is idle.
    // requestIdleCallback so it lands in a gap rather than competing with
    // hydration; the backstop covers a page that reports no paint at all.
    let idle: number | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    // Restarted on every new largest-paint candidate, NOT just the first.
    // The browser reports a candidate each time something bigger paints, so the
    // first one is not the largest -- on /vendors the hero text lands early and
    // the card image, which is the real LCP, arrives seconds later. Waiting for
    // the candidates to STOP is what "after the largest paint" actually means.
    const armIdleLoad = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        if ("requestIdleCallback" in window) {
          idle = (window as any).requestIdleCallback(fire, { timeout: 2000 })
        } else {
          fire()
        }
      }, IDLE_DELAY_MS)
    }

    let observer: PerformanceObserver | undefined
    try {
      observer = new PerformanceObserver(armIdleLoad)
      observer.observe({ type: "largest-contentful-paint", buffered: true })
    } catch {
      // No LCP entry type (Safari before 16, mostly). Fall back to the clock.
    }
    // Also arm it immediately, so a page that paints nothing large enough to
    // report a candidate is not left waiting for the backstop alone.
    armIdleLoad()
    const backstop = setTimeout(fire, BACKSTOP_MS)

    return () => {
      observer?.disconnect()
      clearTimeout(backstop)
      cleanup()
    }
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
