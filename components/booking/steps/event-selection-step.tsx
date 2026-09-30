"use client"

import { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import { Palette, Music, Heart, Cake, Gift, Calendar, Check, Utensils, Briefcase, Baby, GraduationCap, Moon } from "lucide-react"
import { EVENT_OPTIONS, MARRIAGE_EVENTS } from "@/lib/event-options"

interface EventSelectionStepProps {
  selectedEvents?: string[]
  onEventToggle?: (eventId: string) => void
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>
  formData: BookingFormData
  venue: EventVenue | Vendor | null
}

// Anything unlisted falls back to Calendar, so a new event type never renders
// without an icon.
const iconMap: Record<string, any> = {
  Mehndi: Palette,
  Baraat: Heart,
  Walima: Utensils,
  Nikah: Heart,
  Mayoun: Palette,
  Dholki: Music,
  Reception: Music,
  Engagement: Gift,
  Birthday: Cake,
  Corporate: Briefcase,
  Aqiqa: Baby,
  Graduation: GraduationCap,
  Milaad: Moon,
  Soyem: Moon,
  Other: Calendar,
}

/**
 * One line of context per function, so the grid reads as a set of occasions
 * rather than fifteen interchangeable words. Absent here = no line, which is
 * what a vendor's own custom service name will get.
 */
const eventNote: Record<string, string> = {
  Mehndi: "Colour, dhol and henna",
  Baraat: "The groom's procession",
  Walima: "The reception feast",
  Nikah: "The ceremony itself",
  Mayoun: "The days before",
  Dholki: "Singing and drums",
  Reception: "An evening for everyone",
  Engagement: "Where it begins",
  Birthday: "Any age, any size",
  Corporate: "Dinners and launches",
  Aqiqa: "Welcoming a newborn",
  Graduation: "Marking the milestone",
  Milaad: "A devotional gathering",
  Soyem: "A remembrance",
  Other: "Tell us what you have in mind",
}

/**
 * The step renders no heading of its own: the shell's StepFrame carries
 * "STEP 1 OF n · EVENT SELECTION", the title and the subtitle. Nor does it
 * render a running "N functions — …" box any more — the Stage's Event row and
 * the Continue label ("Continue to date · 2 functions") are the live answer.
 *
 * Base layout is drawn for a 544px column (the phone and the narrowest desk):
 * two columns of 96px horizontal cards. At `xl` (≥1280) the desk is wide
 * enough for four columns of 183px. Vendors that list four or fewer services
 * get one unlabelled group in two columns at every width.
 */
export default function EventSelectionStep({ selectedEvents = [], onEventToggle, setFormData, formData, venue }: EventSelectionStepProps) {
  const getAvailableEvents = () => {
    if (!venue) return []
    // venue is a loosely-typed union across booking surfaces; read these dynamic
    // fields off an `any` alias (as the original code effectively did).
    const v = venue as any
    // BUG-023 — guard on LENGTH, not just presence + array-ness. An empty array
    // is truthy and IS an array, so `expertise: []` used to be returned as the
    // answer, making the fallback below unreachable and killing the booking page
    // (no event options, "Continue" disabled forever). Only use a populated list.
    if (Array.isArray(v.expertise) && v.expertise.length > 0) return v.expertise
    if (Array.isArray(v.serviceProvided) && v.serviceProvided.length > 0) return v.serviceProvided
    if (v.services) {
      if (typeof v.services === 'string') {
        const parsed = v.services.split(',').map((s: string) => s.trim()).filter(Boolean)
        if (parsed.length > 0) return parsed
      } else if (Array.isArray(v.services) && v.services.length > 0) {
        return v.services
      }
    }
    return EVENT_OPTIONS
  }

  const availableEvents: string[] = getAvailableEvents()

  /**
   * Split into wedding functions and everything else.
   *
   * Fifteen equal boxes in one grid is a wall — nothing to anchor on, and the
   * thing most people came to book (a mehndi, a baraat) sits beside "Corporate"
   * with identical weight. The grouping comes from `MARRIAGE_EVENTS`, the same
   * set that decides whether the Marriage Functions Act reaches a booking, so
   * the UI is not making up its own idea of what a wedding function is. A group
   * with nothing in it renders nothing, so a photographer who only lists two
   * services still gets a clean screen.
   */
  const marriage = availableEvents.filter((e) => MARRIAGE_EVENTS.has(e))
  const other = availableEvents.filter((e) => !MARRIAGE_EVENTS.has(e))
  // A short list (≤ 4 services) is one group, unlabelled, in two wide columns —
  // a label over two cards is noise, and four 183px cards in a row is thin.
  const compact = availableEvents.length <= 4
  const groups = compact
    ? [{ key: "all", title: "Occasions", events: availableEvents }]
    : [
        { key: "wedding", title: "Wedding functions", events: marriage },
        { key: "other", title: marriage.length > 0 ? "Other occasions" : "Occasions", events: other },
      ].filter((g) => g.events.length > 0)

  const gridClass = compact
    ? "grid grid-cols-2 gap-3"
    : "grid grid-cols-2 gap-3 xl:grid-cols-4"

  const renderCard = (event: string, index: number) => {
    const isSelected = selectedEvents.includes(event)
    const Icon = iconMap[event] || Calendar
    const note = eventNote[event]

    return (
      <button
        key={event}
        type="button"
        // BUG-024 — the selected state was carried only by border colour, so
        // a screen-reader user (and anyone who can't tell the two browns
        // apart) had no way to confirm their choice on this multi-select
        // step before paying. aria-pressed exposes the toggle state.
        aria-pressed={isSelected}
        aria-label={`${event}${isSelected ? " (selected)" : ""}`}
        onClick={() => onEventToggle?.(event)}
        // The entrance is CSS, not framer-motion. A JS-driven reveal on this
        // grid once left the whole thing at opacity 0 on production when its
        // observer failed to attach; a keyframe cannot get stuck that way
        // (the keyframe ends at opacity 1 with `forwards`).
        style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
        // Vertical: icon above the words. Side by side, a 183px card left
        // ~105px for text and every note truncated ("Colour, dhol …") and
        // "Engagement" lost its last letter. Stacked, the words get the full
        // card width and the card stays 92px, which keeps the two groups
        // inside the fold at 1366×768.
        className={`group relative flex h-[92px] min-w-0 flex-col justify-between rounded-[4px] p-3 text-left motion-safe:animate-stagger-fade-up transition-[border-color,background-color,transform] duration-150 motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 focus-visible:ring-offset-bridal-ivory ${
          isSelected
            ? "border-[1.5px] border-bridal-gold-dark bg-bridal-cream"
            : "border border-bridal-beige bg-white hover:border-bridal-gold/60 hover:bg-bridal-blush/45"
        }`}
      >
        <span
          aria-hidden
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${
            isSelected
              ? "bg-bridal-gold-dark text-bridal-ivory"
              : "bg-bridal-blush/55 text-bridal-mauve group-hover:bg-bridal-blush"
          }`}
        >
          <Icon className="h-[15px] w-[15px]" strokeWidth={1.6} />
        </span>

        <span className="min-w-0 pr-5">
          <span className="block truncate font-display italic text-[15px] leading-[20px] text-bridal-charcoal">
            {event}
          </span>
          {note && (
            <span className="block truncate font-bridal text-[11.5px] leading-[14px] text-bridal-text-soft">
              {note}
            </span>
          )}
        </span>

        {/* The tick sits in the corner rather than replacing anything, so the
            card does not change size when it is chosen and the grid never
            reflows under the cursor. It mounts only when selected, so it
            never rests invisible in the tree. */}
        {isSelected && (
          <span
            aria-hidden
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-bridal-gold-dark text-bridal-ivory motion-safe:animate-scale-in"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </button>
    )
  }

  // The venue has not arrived yet: eight card-shaped placeholders hold the
  // layout so nothing jumps when the real list lands.
  if (!venue) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading functions">
        <div className="h-5 w-40 rounded-full bg-bridal-sand/70" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[92px] rounded-[4px] border border-bridal-beige bg-white motion-safe:animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (availableEvents.length === 0) {
    return (
      <p className="font-bridal text-[13px] leading-[18px] text-bridal-text-soft">
        This vendor has not listed any functions yet.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.title} className="space-y-3">
          {!compact && (
            <h3 className="font-bridal text-[11px] uppercase leading-[20px] tracking-[0.18em] text-bridal-gold-dark">
              {group.title}
            </h3>
          )}
          <div className={gridClass}>{group.events.map(renderCard)}</div>
        </section>
      ))}
    </div>
  )
}
