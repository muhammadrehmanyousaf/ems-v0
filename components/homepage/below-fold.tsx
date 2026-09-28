import type { ReactNode } from "react"

/**
 * Skips layout and paint for a section until it is near the viewport.
 *
 * WW-PERF. Lighthouse on the deployed homepage, mobile emulation:
 *
 *     Largest Contentful Paint   8.0s   of which RENDER DELAY 5,129ms (64%)
 *     Style & Layout             1,582ms
 *     Rendering                    403ms
 *     DOM                        2,129 elements
 *
 * The hero image is not the problem — it already paints from static SSR markup
 * with `priority`, ahead of the Swiper, and Lighthouse confirms it downloads in
 * ~1.1s. It then waits five seconds for a main thread busy laying out and
 * painting eleven sections the visitor cannot see yet.
 *
 * `content-visibility: auto` tells the browser to skip rendering work for
 * off-screen content while leaving the markup in the document — so crawlers,
 * Ctrl+F and screen readers still see every word. It is the one lever here that
 * cuts layout cost without removing anything from the page.
 *
 * `contain-intrinsic-size` is NOT optional: without a size estimate the browser
 * treats skipped content as zero-height, the scrollbar jumps as sections come
 * into view, and CLS — currently 0, the one Core Web Vital this site passes —
 * would break. The estimate only has to be in the right region; it is replaced
 * by the real size once a section has been rendered once.
 */
export function BelowFold({
  children,
  minHeight = 600,
}: {
  children: ReactNode
  /** Rough rendered height in px. Over-estimate rather than under: a too-small
   *  value lets the scrollbar shrink when the section resolves. */
  minHeight?: number
}) {
  return (
    <div
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: `auto ${minHeight}px`,
      }}
    >
      {children}
    </div>
  )
}
