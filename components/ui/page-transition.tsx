"use client"

import { ReactNode, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

interface PageTransitionProps {
  children: ReactNode
}

/**
 * Cross-fades page content on navigation. No JavaScript animation library.
 *
 * WW-PERF. This used framer-motion, which put the entire animation library into
 * the shared chrome of EVERY public page — `PublicChrome` renders it around all
 * children — for a 150ms fade that is only ever visible when you navigate.
 * Header, Footer and the cookie banner do not import framer-motion, so on a page
 * like /about this component was the sole reason ~100kb of it was downloaded,
 * parsed and compiled before the page could settle.
 *
 * Worse, `initial={{ opacity: 0 }}` applied during server rendering, so the
 * content was served invisible: 22 `opacity:0` on the homepage, 6 on /about,
 * none of which could paint until the library had hydrated.
 *
 * A CSS keyframe does the same fade with no library, and — critically — does
 * NOT run on first paint. The first render of a page is plain, visible markup;
 * only subsequent client-side navigations fade, which is the only time anyone
 * could see the effect anyway.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  // `false` until the first client-side navigation, so the initial paint is
  // never gated on an animation.
  const [navigated, setNavigated] = useState(false)
  const first = useRef(pathname)

  useEffect(() => {
    if (pathname !== first.current) setNavigated(true)
  }, [pathname])

  return (
    <div key={pathname} className={navigated ? "animate-page-fade" : undefined}>
      {children}
    </div>
  )
}
