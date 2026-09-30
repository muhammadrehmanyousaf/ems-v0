"use client"

/**
 * The contract between the booking shell and the steps that live inside it.
 *
 * The shell (`booking-desk.tsx`) owns the scrolling body, the action bar, the
 * headings and the navigation. A step owns only its own controls. Everything a
 * step legitimately needs from the shell comes through this context, so no
 * step ever reaches for `window.scrollTo`, `position: sticky` or the document
 * — the three things that made the previous layout fight itself.
 *
 * `useBookingShell()` returns a harmless fallback outside the shell, so a step
 * can still be rendered on its own (a storybook, a test, the legacy page)
 * without throwing.
 */

import { createContext, useContext, useEffect, useState, type RefObject } from "react"

/**
 * phone  < 768px  — the document scrolls, a fixed action bar, bottom drawers
 * tablet 768–1023 — stacked hero band, the document scrolls
 * desk   ≥ 1024   — split Stage/Desk, the desk body scrolls, right-hand sheets
 */
export type ShellTier = "phone" | "tablet" | "desk"

export interface BookingShellApi {
  tier: ShellTier
  /** Jump BACK to an earlier step by key (`event`, `datetime`, `packages`, …). Forward jumps are ignored. */
  onJump: (stepKey: string) => void
  /** Scroll the desk body (or the document on phone) so `el` is in view. Never an observer, always a call. */
  scrollBodyTo: (el: HTMLElement | null, opts?: ScrollIntoViewOptions) => void
  /** The scrolling body on desk tiers; null on phone/tablet where the document scrolls. */
  bodyRef: RefObject<HTMLDivElement> | null
  /** Polite live announcement for screen readers (e.g. "Tuesday 6 October selected"). */
  announce: (text: string) => void
}

const noop = () => {}

const FALLBACK: BookingShellApi = {
  tier: "desk",
  onJump: noop,
  scrollBodyTo: (el, opts) => el?.scrollIntoView?.({ block: "nearest", ...(opts || {}) }),
  bodyRef: null,
  announce: noop,
}

export const BookingShellContext = createContext<BookingShellApi | null>(null)

export function useBookingShell(): BookingShellApi {
  return useContext(BookingShellContext) ?? FALLBACK
}

/**
 * Which tier the viewport is in. Measured from the window because Tailwind's
 * breakpoints measure the window too — a step must never assume the desk is
 * as wide as the screen.
 */
export function useShellTier(): ShellTier {
  const [tier, setTier] = useState<ShellTier>("desk")
  useEffect(() => {
    const read = () => {
      const w = window.innerWidth
      setTier(w < 768 ? "phone" : w < 1024 ? "tablet" : "desk")
    }
    read()
    window.addEventListener("resize", read)
    return () => window.removeEventListener("resize", read)
  }, [])
  return tier
}

/** Step keys as `eventStepOrder` names them, plus the global first step. */
export type BookingStepKey =
  | "event"
  | "datetime"
  | "vendors"
  | "packages"
  | "menu"
  | "unit"
  | "requirements"
  | "review"
  | "success"
