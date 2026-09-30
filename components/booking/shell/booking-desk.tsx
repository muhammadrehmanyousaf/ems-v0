"use client"

/**
 * The Desk: top bar, one scrolling body, and the action bar — three flex
 * children in a column that is exactly as tall as the viewport on the desk
 * tiers. The body is the only thing that scrolls there. On a phone the
 * document scrolls instead and the shell's CSS pins the action bar.
 *
 * Layout only. It knows nothing about steps; `booking-form.tsx` decides what
 * goes in each slot.
 */

import { forwardRef, type ReactNode } from "react"
import type { ShellTier } from "./booking-shell-context"

interface BookingDeskProps {
  tier: ShellTier
  breadcrumb?: ReactNode
  topRight?: ReactNode
  tabs?: ReactNode
  actionBar?: ReactNode
  children: ReactNode
}

const BookingDesk = forwardRef<HTMLDivElement, BookingDeskProps>(function BookingDesk(
  { tier, breadcrumb, topRight, tabs, actionBar, children },
  bodyRef,
) {
  const desk = tier === "desk"
  return (
    <div className="booking-desk relative flex min-w-0 flex-1 flex-col bg-bridal-ivory">
      {desk && (
        <div className="booking-top-bar flex h-[var(--bk-top-bar)] shrink-0 items-center justify-between gap-6 border-b border-bridal-beige px-10 large:px-14">
          <div className="min-w-0 flex-1">{breadcrumb}</div>
          <div className="flex shrink-0 items-center gap-2">{topRight}</div>
        </div>
      )}
      {tabs && (
        <div
          className={`shrink-0 border-b border-bridal-beige bg-bridal-ivory ${
            desk ? "flex h-12 items-center px-10 large:px-14" : "sticky top-[66px] z-20 flex h-11 items-center px-4"
          }`}
        >
          {tabs}
        </div>
      )}
      <div
        ref={bodyRef}
        role="region"
        aria-label="Booking step"
        tabIndex={0}
        className={`booking-body bridal-scroll min-h-0 flex-1 outline-none ${desk ? "overflow-y-auto overscroll-contain [scrollbar-gutter:stable]" : ""}`}
      >
        {/* Capped so a 1920px screen does not stretch rows to 850px; the
            reading width stays what it is at 1440. */}
        <div className={desk ? "max-w-[1040px] px-10 py-[var(--bk-body-pad-y)] large:px-14" : "px-4 pb-6 pt-5"}>{children}</div>
      </div>
      {actionBar}
    </div>
  )
})

export default BookingDesk
