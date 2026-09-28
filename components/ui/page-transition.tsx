"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"

interface PageTransitionProps {
  children: ReactNode
}

/**
 * Fades page content on navigation — but NOT on first paint.
 *
 * WW-PERF, and this was the single most expensive line on the public site.
 *
 * `initial={{ opacity: 0 }}` is applied during server rendering too, so every
 * public page was served as literally `<div style="opacity:0">` wrapped around
 * all of its content. The browser had the HTML, had the images, and could not
 * show any of it until framer-motion had downloaded, hydrated and run an
 * animation. Confirmed in the served HTML: 22 `opacity:0` on the homepage, 6 on
 * /about.
 *
 * Lighthouse across 22 public templates showed the symptom without naming the
 * cause — Render Delay of 4,000-6,800ms on 19 of them, INCLUDING static pages
 * like /about and /help that fetch nothing at all and had no other reason to be
 * slow:
 *
 *     city landing   LCP 7,597ms   Render Delay 6,825ms
 *     home           LCP 6,867ms   Render Delay 5,639ms
 *     about          LCP 4,918ms   Render Delay 4,200ms
 *     how it works   LCP 4,731ms   Render Delay 3,975ms
 *
 * `initial={false}` tells framer-motion to render the FIRST frame already at
 * its animated state, so the server sends visible content and the paint happens
 * without waiting for JavaScript. Subsequent client-side navigations still
 * cross-fade, because `key={pathname}` changing is what drives the transition —
 * and by then framer-motion is loaded anyway.
 *
 * In other words: the animation people actually see is kept, and the one nobody
 * could see — a fade from invisible on a page they had not navigated to yet —
 * is gone.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
