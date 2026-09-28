"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

/**
 * The hero crossfade's 2nd-7th images, mounted only once the page is settled.
 *
 * WW-PERF, and this fixes a regression I introduced. Replacing Swiper with a CSS
 * crossfade stacked all seven hero images absolutely inside the viewport, and
 * `loading="lazy"` does nothing for an in-viewport image — so the browser
 * downloaded every one of them on arrival:
 *
 *     spotlight 40kb · h2 36kb · h3 28kb · h4 52kb · venue 27kb · h6 56kb · h7 70kb
 *     = 310kb, where only the first 40kb is the LCP image
 *
 * Swiper had been lazy-loading its slides, so the CSS version was cheaper in
 * JavaScript and 270kb more expensive in images. Both matter; this keeps the
 * JavaScript win and takes the images back.
 *
 * The first image stays server-rendered in hero-backdrop.tsx with `priority`,
 * so it is preloaded and is the LCP element. These mount after the browser goes
 * idle, which is long before the crossfade needs them — the second image is not
 * due until 5.5s.
 */
const REST = [
  "/images/home/hero/h2.jpg",
  "/images/home/hero/h3.jpg",
  "/images/home/hero/h4.jpg",
  "/images/home/partners/venue.jpg",
  "/images/home/hero/h6.jpg",
  "/images/home/hero/h7.jpg",
]

export function HeroBackdropRest() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let cancelled = false
    const start = () => { if (!cancelled) setShow(true) }
    // requestIdleCallback where available, so these never compete with the
    // work that gets the page usable; a timeout as the backstop for Safari.
    let idle: number | undefined
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        idle = (window as { requestIdleCallback: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback(start, { timeout: 2000 })
      } else {
        start()
      }
    }, 1200)
    return () => {
      cancelled = true
      clearTimeout(timer)
      if (idle !== undefined && "cancelIdleCallback" in window) {
        (window as { cancelIdleCallback: (h: number) => void }).cancelIdleCallback(idle)
      }
    }
  }, [])

  if (!show) return null

  return (
    <>
      {REST.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          fetchPriority="low"
          loading="lazy"
          sizes="100vw"
          className="object-cover animate-hero-fade opacity-0 motion-reduce:hidden"
          // +1 because the first image is rendered by the server component and
          // holds slot 0 of the same staggered keyframe.
          style={{ animationDelay: `${(i + 1) * 5.5}s` }}
        />
      ))}
    </>
  )
}
