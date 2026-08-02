"use client"

/**
 * Product tour — spotlight + tooltip, built in-house.
 *
 * Deliberately not a library. driver.js / react-joyride would each add a
 * dependency to a 77-package build that ships to production behind a type gate,
 * and neither knows about this app's design tokens, its Urdu labels, or the fact
 * that the rail is `position: sticky` and the panel `position: fixed`. This is
 * ~200 lines, styles itself from the same tokens as everything else, and cannot
 * break the build.
 *
 * Behaviour that matters:
 *   - A step whose target is missing is SKIPPED, not shown against an empty
 *     box. Targets legitimately vary by role, route and screen width.
 *   - The spotlight follows the element on scroll and resize.
 *   - Escape exits, arrow keys move, and the whole thing is keyboard-reachable.
 *   - Body scroll is locked while it runs, so the highlighted element cannot
 *     drift out from under the cutout.
 */

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { createPortal } from "react-dom"
import { TOUR_STEPS, TOUR_SEEN_KEY, type TourStep } from "@/lib/tour/steps"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/dashboard/shared/icon"

interface Ctx {
  start: () => void
  isRunning: boolean
}
const TourContext = React.createContext<Ctx>({ start: () => {}, isRunning: false })
export const useProductTour = () => React.useContext(TourContext)

const PAD = 8
const isDesktop = () => typeof window !== "undefined" && window.innerWidth >= 768

/** Wait for a selector to exist — routes render asynchronously. */
function waitFor(selector: string, timeout = 2500): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const found = document.querySelector<HTMLElement>(selector)
    if (found) return resolve(found)
    const started = Date.now()
    const tick = () => {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) return resolve(el)
      if (Date.now() - started > timeout) return resolve(null)
      requestAnimationFrame(tick)
    }
    tick()
  })
}

export function ProductTourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [running, setRunning] = React.useState(false)
  const [index, setIndex] = React.useState(0)
  const [rect, setRect] = React.useState<DOMRect | null>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const steps = React.useMemo(
    () => TOUR_STEPS.filter((s) => (s.desktopOnly ? isDesktop() : true)),
    // Re-evaluated whenever the tour starts; width rarely changes mid-tour.
    [running],
  )
  const step: TourStep | undefined = steps[index]

  const finish = React.useCallback(() => {
    setRunning(false)
    setRect(null)
    try {
      localStorage.setItem(TOUR_SEEN_KEY, new Date().toISOString())
    } catch {}
  }, [])

  const start = React.useCallback(() => {
    setIndex(0)
    setRunning(true)
  }, [])

  // Resolve the current step: navigate if needed, then locate + spotlight.
  React.useEffect(() => {
    if (!running || !step) return
    let cancelled = false

    // Navigate FIRST and measure nothing until we have actually arrived.
    //
    // Previously this pushed the route and fell straight through to waitFor.
    // Most steps target `[data-tour="page-root"]`, which exists on every
    // dashboard page — so waitFor resolved instantly against the page we were
    // leaving. The result: the tooltip said "Enquiries — every one, in one
    // place" while the spotlight sat on the dashboard, and the route caught up
    // a step later. Returning here is safe because `pathname` is a dependency:
    // the effect re-runs the moment navigation completes.
    if (step.route && pathname !== step.route) {
      router.push(step.route)
      return
    }

    ;(async () => {
      const el = await waitFor(step.target)
      if (cancelled) return
      if (!el) {
        // Missing target — move on rather than spotlight nothing.
        setIndex((i) => (i + 1 < steps.length ? i + 1 : i))
        if (index + 1 >= steps.length) finish()
        return
      }
      el.scrollIntoView({ block: "center", behavior: "smooth" })
      // Let the smooth scroll settle before measuring, or the cutout lands
      // where the element used to be.
      setTimeout(() => {
        if (!cancelled) setRect(el.getBoundingClientRect())
      }, 320)
    })()

    return () => {
      cancelled = true
    }
  }, [running, step, index, pathname, router, steps.length, finish])

  // Keep the cutout glued to the element.
  React.useEffect(() => {
    if (!running || !step) return
    const track = () => {
      const el = document.querySelector<HTMLElement>(step.target)
      if (el) setRect(el.getBoundingClientRect())
    }
    window.addEventListener("resize", track)
    window.addEventListener("scroll", track, true)
    return () => {
      window.removeEventListener("resize", track)
      window.removeEventListener("scroll", track, true)
    }
  }, [running, step])

  // Lock page scroll while running.
  React.useEffect(() => {
    if (!running) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [running])

  const next = React.useCallback(() => {
    if (index + 1 >= steps.length) return finish()
    setRect(null)
    setIndex((i) => i + 1)
  }, [index, steps.length, finish])

  const back = React.useCallback(() => {
    if (index === 0) return
    setRect(null)
    setIndex((i) => i - 1)
  }, [index])

  React.useEffect(() => {
    if (!running) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish()
      else if (e.key === "ArrowRight") next()
      else if (e.key === "ArrowLeft") back()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [running, next, back, finish])

  const value = React.useMemo(() => ({ start, isRunning: running }), [start, running])

  return (
    <TourContext.Provider value={value}>
      {children}
      {mounted && running && step
        ? createPortal(
            <TourOverlay
              step={step}
              rect={rect}
              index={index}
              total={steps.length}
              onNext={next}
              onBack={back}
              onSkip={finish}
            />,
            document.body,
          )
        : null}
    </TourContext.Provider>
  )
}

function TourOverlay({
  step, rect, index, total, onNext, onBack, onSkip,
}: {
  step: TourStep
  rect: DOMRect | null
  index: number
  total: number
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440
  const vh = typeof window !== "undefined" ? window.innerHeight : 900

  // Tooltip placement: prefer the step's hint, fall back to whichever side has
  // room. On a phone it is always pinned to the bottom — there is no room to be
  // clever, and a tooltip half off-screen is worse than a predictable one.
  const narrow = vw < 768
  const box = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null

  let tip: React.CSSProperties
  if (narrow || !box) {
    tip = { left: 12, right: 12, bottom: 16, maxWidth: "none" }
  } else {
    const wantRight = step.placement === "right" || (step.placement === "auto" && box.left < vw / 3)
    const spaceBelow = vh - (box.top + box.height)
    if (wantRight && box.left + box.width + 340 < vw) {
      tip = { left: box.left + box.width + 12, top: Math.min(Math.max(12, box.top), vh - 260), width: 330 }
    } else if (spaceBelow > 240) {
      tip = { left: Math.min(Math.max(12, box.left), vw - 350), top: box.top + box.height + 12, width: 330 }
    } else {
      tip = { left: Math.min(Math.max(12, box.left), vw - 350), top: Math.max(12, box.top - 232), width: 330 }
    }
  }

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Product tour">
      {/* The cutout. A huge spread shadow is the least fragile way to dim
          everything except one rectangle — no SVG mask, no clip-path support
          questions, and it animates cleanly between steps. */}
      {box ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-primary transition-all duration-300 ease-out"
          style={{
            top: box.top, left: box.left, width: box.width, height: box.height,
            boxShadow: "0 0 0 9999px rgba(15, 15, 20, 0.62)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(15,15,20,0.62)]" />
      )}

      {/* Click-away closes, matching every other overlay in the product. */}
      <button
        type="button"
        aria-label="End tour"
        onClick={onSkip}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div
        style={tip}
        className="absolute rounded-xl border border-border bg-popover p-4 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Step {index + 1} of {total}
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="End tour"
          >
            <Icon name="X" size={14} />
          </button>
        </div>

        <h3 className="mt-1.5 text-[15px] font-semibold tracking-tight">{step.title}</h3>
        <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{step.body}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all ${i === index ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {index > 0 && (
              <Button size="sm" variant="ghost" onClick={onBack}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={onNext}>
              {index + 1 === total ? "Finish" : "Next"}
              {index + 1 < total && <Icon name="ArrowRight" size={13} className="ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTourProvider
