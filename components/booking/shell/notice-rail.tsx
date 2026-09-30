"use client"

/**
 * Advisories, bounded.
 *
 * The date step can have eight things to say at once — one-dish policy, a
 * capacity clamp, a comfort note, a gender-arrangement verdict, rain on an
 * open lawn, a hold timer, a blocked day, a lost slot. Stacked as boxes they
 * pushed the calendar off the screen. Here they are one line each, at most
 * `max` inline, and the rest fold into a "+N notes" popover. Every folded line
 * is still rendered visually-hidden inside the rail, so a screen reader hears
 * all of them and nothing is lost — only pixels.
 *
 * Priority is the caller's: pass the lines in the order they matter.
 */

import { useState } from "react"
import { AlertTriangle, Info, Check, XCircle, Timer, ChevronDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type NoticeTone = "rose" | "amber" | "mauve" | "sage" | "beige" | "soft"

export interface NoticeLine {
  id: string
  tone: NoticeTone
  text: string
  /** Screen readers interrupt for this one (slot conflicts, lost holds). */
  assertive?: boolean
  icon?: "warning" | "info" | "check" | "error" | "timer"
}

const TONE: Record<NoticeTone, { text: string; icon: string; bg: string }> = {
  rose: { text: "text-rose-800", icon: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
  amber: { text: "text-amber-800", icon: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  mauve: { text: "text-bridal-mauve", icon: "text-bridal-mauve", bg: "bg-bridal-blush/50 border-bridal-rose/50" },
  sage: { text: "text-[#3F6B43]", icon: "text-[#3F6B43]", bg: "bg-bridal-sage/15 border-bridal-sage/45" },
  beige: { text: "text-bridal-charcoal/80", icon: "text-bridal-text-soft", bg: "bg-bridal-sand/50 border-bridal-beige" },
  soft: { text: "text-bridal-text-soft", icon: "text-bridal-text-soft", bg: "bg-transparent border-transparent" },
}

const ICON = {
  warning: AlertTriangle,
  info: Info,
  check: Check,
  error: XCircle,
  timer: Timer,
}

function defaultIcon(tone: NoticeTone): keyof typeof ICON {
  if (tone === "rose") return "error"
  if (tone === "sage") return "check"
  if (tone === "soft" || tone === "beige") return "info"
  return "warning"
}

function Line({ line, dense }: { line: NoticeLine; dense?: boolean }) {
  const t = TONE[line.tone]
  const Icon = ICON[line.icon ?? defaultIcon(line.tone)]
  return (
    <div
      className={`flex items-start gap-2 rounded-[4px] border px-3 ${dense ? "py-1.5" : "py-[5px]"} ${t.bg}`}
      role={line.assertive ? "alert" : undefined}
    >
      <Icon className={`mt-[3px] h-3 w-3 shrink-0 ${t.icon}`} strokeWidth={2} aria-hidden />
      <p className={`min-w-0 font-bridal text-[12px] leading-[18px] ${t.text}`}>{line.text}</p>
    </div>
  )
}

interface NoticeRailProps {
  lines: NoticeLine[]
  /** Inline lines before the rest fold. Default 2. */
  max?: number
  className?: string
}

export default function NoticeRail({ lines, max = 2, className = "" }: NoticeRailProps) {
  const [open, setOpen] = useState(false)
  if (!lines.length) return null
  const inline = lines.slice(0, max)
  const folded = lines.slice(max)
  const assertive = lines.some((l) => l.assertive)

  return (
    <div
      className={`space-y-1.5 ${className}`}
      aria-live={assertive ? "assertive" : "polite"}
      data-booking-notices={lines.length}
    >
      {inline.map((l) => (
        <Line key={l.id} line={l} />
      ))}

      {folded.length > 0 && (
        <div className="flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-7 items-center gap-1 rounded-full border border-bridal-beige bg-white px-3 font-bridal text-[11.5px] text-bridal-text-label hover:border-bridal-gold-dark hover:text-bridal-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2"
                aria-expanded={open}
              >
                +{folded.length} {folded.length === 1 ? "note" : "notes"}
                <ChevronDown className="h-3 w-3" aria-hidden />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[420px] max-w-[calc(100vw-32px)] space-y-1.5 border-bridal-beige bg-bridal-ivory p-3">
              {folded.map((l) => (
                <Line key={l.id} line={l} dense />
              ))}
            </PopoverContent>
          </Popover>
          {/* Folded lines stay in the accessibility tree even while the popover
              is closed, so the live region carries every advisory. */}
          <span className="sr-only">
            {folded.map((l) => l.text).join(". ")}
          </span>
        </div>
      )}
    </div>
  )
}
