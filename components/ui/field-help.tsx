"use client"

/**
 * FieldHelp: the small "?" button that sits beside a form label and explains
 * the field (what it is, what to enter, an example and, for sensitive fields,
 * why it is asked and who sees it).
 *
 * Behaviour, by input type:
 *   - mouse / pen   hover opens it, leaving closes it; a click pins it open
 *   - keyboard      focusing the button opens it (Tab), Enter / Space pins it,
 *                   Escape closes it, Tab away closes it
 *   - touch         a tap opens it, a second tap or a tap anywhere else closes it
 *
 * Accessibility: the button is named "About <field>" and is described by an
 * always-present visually-hidden copy of the text (aria-describedby), so a
 * screen reader gets the help on focus even when the bubble is closed. The
 * visible bubble is a sighted-user duplicate and is aria-hidden to avoid
 * reading the same words twice.
 *
 * The bubble never takes keyboard focus (so hovering a "?" while typing in a
 * field does not pull the cursor away) and is placed ABOVE the "?" so the
 * input being filled stays visible; when there is no room above it opens
 * below the whole field block instead of on top of the input.
 *
 * All wording lives in lib/field-help.ts. Help is deliberately separate from
 * validation: this explains a field BEFORE the mistake, the red error text
 * under the field explains the mistake AFTER it.
 */

import * as React from "react"
import { CircleHelp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import {
  FIELD_HELP,
  fieldHelpPlainText,
  hasFieldHelp,
  type FieldHelpKey,
} from "@/lib/field-help"

const OPEN_DELAY_MS = 120
const CLOSE_DELAY_MS = 180
/** Clearance for the fixed site header, so the bubble is never tucked under it. */
const TOP_SAFE_PX = 76
const EDGE_GAP_PX = 12
const GAP_PX = 8
/** Rough characters per line of the bubble body at 13px in a 288px bubble. */
const CHARS_PER_LINE = 36
const LINE_PX = 19

/**
 * `side` is the side we ask for; `clearance` is how far below the "?" the
 * bubble must start to sit under the whole field (label + input + hint).
 */
type Placement = { side: "top" | "bottom"; clearance: number }

function estimateBubbleHeight(textLength: number, extraBlocks: number): number {
  // 24px of padding; each extra block adds its own top margin/rule. Erring low
  // is safe: if the bubble does not fit, Radix flips it and the observer below
  // moves it clear of the field.
  return Math.ceil(textLength / CHARS_PER_LINE) * LINE_PX + extraBlocks * 10 + 22
}

function choosePlacement(trigger: HTMLElement, textLength: number, extraBlocks: number): Placement {
  const rect = trigger.getBoundingClientRect()
  // The label row's parent is the field block (label + input + hint + error).
  const row = trigger.closest("[data-fieldhelp-row]") ?? trigger.parentElement
  const block = row?.parentElement
  const below = block ? block.getBoundingClientRect().bottom - rect.bottom + GAP_PX : GAP_PX
  const clearance = Math.min(Math.max(below, GAP_PX), 240)
  const needed = estimateBubbleHeight(textLength, extraBlocks)
  const room = rect.top - TOP_SAFE_PX
  return { side: room >= needed + GAP_PX ? "top" : "bottom", clearance }
}

export interface FieldHelpProps {
  /** Key into FIELD_HELP (lib/field-help.ts). */
  field: FieldHelpKey
  className?: string
  /** Horizontal alignment of the bubble relative to the "?" (default: start). */
  align?: "start" | "center" | "end"
}

export function FieldHelp({ field, className, align = "start" }: FieldHelpProps) {
  const entry = FIELD_HELP[field]
  const uid = React.useId()
  const descId = `${uid}-help`
  const [open, setOpen] = React.useState(false)
  const [placement, setPlacement] = React.useState<Placement>({ side: "top", clearance: GAP_PX })
  /** The side Radix actually used (it flips when our size estimate was off). */
  const [placedSide, setPlacedSide] = React.useState<string | null>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const bubbleRef = React.useRef<HTMLDivElement>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  /** Opened by a click / tap / Enter, so leaving or blurring does not close it. */
  const pinned = React.useRef(false)
  /** A pointer press is in flight: its focus event must not also open the bubble. */
  const pointerDown = React.useRef(false)

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = undefined
  }
  React.useEffect(() => clearTimer, [])

  // Follow the side Radix really picked. If the bubble turned out taller than
  // our estimate it flips below the "?", and the offset must then clear the
  // whole field rather than the 8px gap meant for the top placement.
  React.useEffect(() => {
    if (!open) {
      setPlacedSide(null)
      return
    }
    let observer: MutationObserver | undefined
    const frame = requestAnimationFrame(() => {
      const el = bubbleRef.current
      if (!el) return
      // Once it has gone below it stays below for this opening: the bigger
      // offset must not tempt it back above and set up a flip-flop.
      const read = () => setPlacedSide((prev) => (prev === "bottom" ? prev : el.getAttribute("data-side")))
      read()
      observer = new MutationObserver(read)
      observer.observe(el, { attributes: true, attributeFilter: ["data-side"] })
    })
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [open])

  if (!entry) return null

  const sideOffset = (placedSide ?? placement.side) === "bottom" ? placement.clearance : GAP_PX

  const extraBlocks = (entry.example ? 1 : 0) + (entry.why ? 1 : 0)

  const show = () => {
    clearTimer()
    if (buttonRef.current) {
      setPlacement(choosePlacement(buttonRef.current, fieldHelpPlainText(entry).length, extraBlocks))
    }
    setOpen(true)
  }
  const hide = () => {
    clearTimer()
    pinned.current = false
    setOpen(false)
  }
  const hideSoon = () => {
    clearTimer()
    timer.current = setTimeout(() => {
      if (!pinned.current) setOpen(false)
    }, CLOSE_DELAY_MS)
  }
  const showSoon = () => {
    clearTimer()
    timer.current = setTimeout(show, OPEN_DELAY_MS)
  }

  const isMouse = (e: React.PointerEvent) => e.pointerType === "mouse" || e.pointerType === "pen"

  return (
    <span className={cn("relative inline-flex shrink-0 items-center", className)}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          // Radix reports Escape and outside presses here.
          if (next) show()
          else hide()
        }}
      >
        <PopoverAnchor asChild>
          <button
            ref={buttonRef}
            type="button"
            data-field-help={field}
            data-state={open ? "open" : "closed"}
            aria-label={`About ${entry.name}`}
            aria-describedby={descId}
            aria-expanded={open}
            onPointerDown={() => {
              pointerDown.current = true
            }}
            onPointerUp={() => {
              // Cleared on the next tick so the focus/click that follows the
              // press is still recognised as pointer-driven.
              setTimeout(() => {
                pointerDown.current = false
              }, 0)
            }}
            onPointerEnter={(e) => {
              if (isMouse(e)) showSoon()
            }}
            onPointerLeave={(e) => {
              if (isMouse(e) && !pinned.current) hideSoon()
            }}
            onFocus={() => {
              // Keyboard (or programmatic) focus opens it; a press is handled by onClick.
              if (!pointerDown.current) show()
            }}
            onBlur={() => hide()}
            onClick={() => {
              if (open && pinned.current) {
                hide()
              } else {
                pinned.current = true
                show()
              }
            }}
            className={cn(
              "relative inline-flex h-5 w-5 items-center justify-center rounded-full",
              "text-neutral-500 transition-colors hover:text-bridal-gold-dark",
              "data-[state=open]:text-bridal-gold-dark",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-1",
              // A 32px hit area for fingers without growing the layout box.
              "before:absolute before:-inset-1.5 before:content-['']",
            )}
          >
            <CircleHelp aria-hidden="true" className="h-4 w-4" />
          </button>
        </PopoverAnchor>
        <PopoverContent
          ref={bubbleRef}
          side={placement.side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={{ top: TOP_SAFE_PX, right: EDGE_GAP_PX, bottom: EDGE_GAP_PX, left: EDGE_GAP_PX }}
          // The bubble is a read-only caption: never move focus into it or back
          // out of it, so hovering a "?" cannot steal the cursor from an input.
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          // The "?" button itself is not "outside": pressing it is handled by onClick.
          onInteractOutside={(e) => {
            if (buttonRef.current && e.target instanceof Node && buttonRef.current.contains(e.target)) {
              e.preventDefault()
            }
          }}
          onPointerEnter={(e) => {
            if (isMouse(e)) clearTimer()
          }}
          onPointerLeave={(e) => {
            if (isMouse(e) && !pinned.current) hideSoon()
          }}
          role="presentation"
          aria-hidden="true"
          data-field-help-bubble={field}
          className={cn(
            "w-72 min-w-0 max-w-[var(--radix-popover-content-available-width)]",
            "p-3 text-[13px] leading-[1.45] shadow-lg normal-case tracking-normal",
            "motion-reduce:animate-none",
          )}
        >
          <p className="text-popover-foreground">{entry.text}</p>
          {entry.example ? (
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              <span className="font-medium text-popover-foreground">Example: </span>
              {entry.example}
            </p>
          ) : null}
          {entry.why ? (
            <p className="mt-2 border-t border-border pt-2 text-[12px] text-muted-foreground">
              <span className="font-medium text-popover-foreground">Why we ask: </span>
              {entry.why}
            </p>
          ) : null}
        </PopoverContent>
      </Popover>
      <span id={descId} className="sr-only">
        {fieldHelpPlainText(entry)}
      </span>
    </span>
  )
}

export interface FieldLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  /** Key into FIELD_HELP (lib/field-help.ts). */
  help: FieldHelpKey
  /** Classes for the row that holds the label and its "?". */
  wrapperClassName?: string
}

/**
 * A <Label> with its "?" beside it. Drop-in for <Label>: every Label prop
 * (htmlFor, className, ...) goes to the label itself; the "?" is a sibling, not
 * a child, because a button inside a <label> would also activate the field.
 */
export const FieldLabel = React.forwardRef<React.ElementRef<typeof Label>, FieldLabelProps>(
  ({ help, wrapperClassName, children, ...props }, ref) => (
    <div data-fieldhelp-row="" className={cn("flex items-center gap-1.5", wrapperClassName)}>
      <Label ref={ref} {...props}>
        {children}
      </Label>
      <FieldHelp field={help} />
    </div>
  ),
)
FieldLabel.displayName = "FieldLabel"

/**
 * A caption (group title, section heading) with an optional "?" beside it. With
 * no `help` it renders the children untouched, so adding the prop to a shared
 * component changes nothing for callers that do not use it.
 */
export function HelpRow({
  help,
  className,
  children,
}: {
  help?: FieldHelpKey
  className?: string
  children: React.ReactNode
}) {
  if (!help) return <>{children}</>
  return (
    <div data-fieldhelp-row="" className={cn("flex items-center gap-1.5", className)}>
      {children}
      <FieldHelp field={help} />
    </div>
  )
}

/**
 * FieldLabel when `field` has an entry in FIELD_HELP, a plain Label when it
 * does not. For forms that build their fields from a key (the specialty
 * steps), so a new entry in lib/field-help.ts is enough to give a field its "?".
 */
export function AutoFieldLabel({
  field,
  wrapperClassName,
  ...props
}: React.ComponentPropsWithoutRef<typeof Label> & { field: string; wrapperClassName?: string }) {
  return hasFieldHelp(field) ? (
    <FieldLabel help={field} wrapperClassName={wrapperClassName} {...props} />
  ) : (
    <Label {...props} />
  )
}
