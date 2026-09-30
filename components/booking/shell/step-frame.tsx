"use client"

/**
 * The frame every step sits in: the eyebrow, the title, the subtitle, and the
 * entrance.
 *
 * Steps render none of their own headings any more — six different <h2>
 * treatments were the reason the journey read as six unrelated pages. The
 * frame is re-keyed by the shell on every step change, so the enter motion
 * runs on mount, unconditionally, and ends visible.
 *
 * The entrance is a CSS keyframe, not framer-motion: this was the only thing
 * on the main path still pulling the animation library into the route's first
 * load, for a 220ms slide. A keyframe with `forwards` cannot get stuck at
 * opacity 0 and costs nothing to download. `--bk-dx` carries the direction.
 */

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import type { StepHeading } from "@/lib/booking/step-copy"

interface StepFrameProps {
  stepKey: string
  heading: StepHeading | null
  /** +1 forward, −1 back, 0 for a tab switch. */
  direction: -1 | 0 | 1
  /** Whether to move focus to the title (skipped on the very first paint). */
  focusTitle?: boolean
  children: ReactNode
}

export default function StepFrame({ stepKey, heading, direction, focusTitle = true, children }: StepFrameProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!focusTitle) return
    const raf = requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(raf)
  }, [focusTitle, stepKey])

  return (
    <div data-booking-step={stepKey} className="booking-step">
      <div
        className="motion-safe:animate-booking-step-in"
        style={{ "--bk-dx": `${16 * direction}px` } as CSSProperties}
      >
        {heading && (
          <header className="booking-step-heading mb-5 xl:mb-6">
            <p className="font-bridal text-[11px] font-medium uppercase tracking-[0.18em] text-bridal-text-label">
              {heading.eyebrow}
            </p>
            <h2
              ref={titleRef}
              tabIndex={-1}
              className="mt-2 font-display italic text-[26px] leading-[30px] text-bridal-charcoal outline-none xl:text-[length:var(--bk-step-title)] xl:leading-[var(--bk-step-title-lh)]"
            >
              {heading.title}
            </h2>
            {heading.subtitle && (
              <p className="mt-2 max-w-[640px] font-bridal text-[13px] leading-[18px] text-bridal-text-soft xl:text-[14px] xl:leading-[20px]">
                {heading.subtitle}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </div>
  )
}
