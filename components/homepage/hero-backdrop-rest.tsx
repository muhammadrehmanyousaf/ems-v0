"use client"

import { useEffect, useState } from "react"
import { HERO_SLIDES } from "@/components/homepage/hero-sources"

/**
 * The hero crossfade's 2nd-7th images, each mounted just before its turn.
 *
 * WW-PERF, and this fixes a regression I introduced. Replacing Swiper with a CSS
 * crossfade stacked all seven hero images absolutely inside the viewport, and
 * `loading="lazy"` does nothing for an in-viewport image — so the browser
 * downloaded every one of them on arrival:
 *
 *     spotlight 40kb · h2 36kb · h3 28kb · h4 52kb · venue 27kb · h6 56kb · h7 70kb
 *     = 310kb, where only the first 40kb is the LCP image
 *
 * Deferring the six to an idle callback kept them out of the critical path but
 * still fetched every one in a burst a second after arrival. Measured against
 * production at 390px: all SEVEN hero images, 150kb, within three seconds — and
 * Lighthouse's three largest payloads on the homepage were h7, h6 and h4, none
 * of which is on screen for another twenty-two seconds.
 *
 * They are needed 5.5s apart, so they mount 5.5s apart. Image i mounts at
 * i × 5.5s and carries a fixed 5.5s `animationDelay`, so it becomes visible at
 * (i+1) × 5.5s — exactly the schedule the single-burst version produced, and in
 * phase with the 38.5s cycle forever after, because the animation is infinite
 * and 7 × 5.5 = 38.5. Identical to watch. Measured locally: 2 images by 3s,
 * 3 by 8s, 4 by 14s, against 7 by 3s on production.
 *
 * The first image stays server-rendered in hero-backdrop.tsx with `priority`,
 * so it is preloaded and is the LCP element.
 */
/** The six that are not the LCP image. Paths live in hero-sources.ts. */
const REST = HERO_SLIDES.slice(1)

/** One slot of the 38.5s cycle, in ms. Seven slots, seven images. */
const SLOT_MS = 5500

export function HeroBackdropRest() {
  // How many of REST have been mounted so far. Starts at zero; one more every
  // slot. Rendering a prefix rather than a set keeps the DOM order stable.
  const [mounted, setMounted] = useState(0)

  useEffect(() => {
    // `motion-reduce:hidden` already spares the bandwidth — a `display:none`
    // image with `loading="lazy"` is never fetched, and production measures at
    // one image, 18kb, under reduced motion. What it does NOT spare is six
    // <img> elements that exist only to stay hidden, so they are not created.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

    const timers: ReturnType<typeof setTimeout>[] = []
    let idle: number | undefined

    const begin = () => {
      REST.forEach((_, i) => {
        // Image i is due on screen at (i+1) × 5.5s and mounts one slot early,
        // which is 5.5s of download lead for a file of at most 70kb.
        timers.push(setTimeout(() => setMounted((n) => Math.max(n, i + 1)), i * SLOT_MS))
      })
    }

    // Start the sequence once the browser is idle, so the first mount never
    // competes with the work that gets the page usable.
    const kickoff = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        idle = (window as { requestIdleCallback: (cb: () => void, o?: { timeout: number }) => number })
          .requestIdleCallback(begin, { timeout: 2000 })
      } else {
        begin()
      }
    }, 1200)

    return () => {
      clearTimeout(kickoff)
      for (const t of timers) clearTimeout(t)
      if (idle !== undefined && "cancelIdleCallback" in window) {
        (window as { cancelIdleCallback: (h: number) => void }).cancelIdleCallback(idle)
      }
    }
  }, [])

  if (mounted === 0) return null

  return (
    <>
      {HERO_SLIDES.slice(1, mounted + 1).map((slide) => (
        // Plain <img> for the same reason as the LCP one: these are
        // pre-generated AVIF under /public, so the optimizer — whose quota is
        // exhausted — is not involved at all. See hero-sources.ts.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide.base}
          src={slide.src}
          srcSet={slide.srcSet}
          sizes="100vw"
          alt=""
          fetchPriority="low"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover animate-hero-fade opacity-0 motion-reduce:hidden"
          // Fixed, not staggered: each image mounts one slot before it is due,
          // so one slot of delay puts every one of them on the original
          // schedule. Staggering both would double-count the offset.
          style={{ animationDelay: `${SLOT_MS / 1000}s` }}
        />
      ))}
    </>
  )
}
