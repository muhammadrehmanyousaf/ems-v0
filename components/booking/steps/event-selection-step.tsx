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
  const groups = [
    { key: "wedding", title: "Wedding functions", events: marriage },
    { key: "other", title: marriage.length > 0 ? "Other occasions" : "Occasions", events: other },
  ].filter((g) => g.events.length > 0)

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
        // observer failed to attach; a keyframe cannot get stuck that way.
        style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
        className={`group relative flex flex-col items-start gap-3 rounded-lg border p-4 text-left animate-stagger-fade-up transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 ${
          isSelected
            ? "border-bridal-gold-dark bg-bridal-cream shadow-[0_14px_30px_-20px_rgba(145,101,57,0.55)]"
            : "border-bridal-beige bg-white hover:border-bridal-gold/60 hover:shadow-[0_14px_30px_-24px_rgba(145,101,57,0.4)]"
        }`}
      >
        <span
          aria-hidden
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
            isSelected
              ? "bg-bridal-gold-dark text-white"
              : "bg-bridal-blush/55 text-bridal-mauve group-hover:bg-bridal-gold/20 group-hover:text-bridal-gold-dark"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </span>

        <span className="min-w-0">
          <span
            className={`block font-display italic text-[17px] leading-tight ${
              isSelected ? "text-bridal-gold-dark" : "text-bridal-charcoal"
            }`}
          >
            {event}
          </span>
          {note && (
            <span className="mt-0.5 block font-bridal text-[11.5px] leading-snug text-bridal-text-soft">
              {note}
            </span>
          )}
        </span>

        {/* The tick sits in the corner rather than replacing anything, so the
            card does not change size when it is chosen and the grid never
            reflows under the cursor. */}
        <span
          aria-hidden
          className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-200 ${
            isSelected
              ? "scale-100 border-bridal-gold-dark bg-bridal-gold-dark opacity-100"
              : "scale-75 border-bridal-beige bg-white opacity-0 group-hover:opacity-60"
          }`}
        >
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </span>
      </button>
    )
  }

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="font-bridal text-[11px] uppercase tracking-[0.22em] text-bridal-text-label">
          Step one
        </p>
        <h2 className="mt-2 font-display italic text-[30px] sm:text-[38px] leading-[1.1] text-bridal-charcoal">
          What are you celebrating?
        </h2>
        <p className="mt-3 font-bridal text-[14px] leading-relaxed text-bridal-text-soft">
          Pick every function you want at this venue. Choose more than one and each
          gets its own date, menu and pricing — you only fill this in once.
        </p>
      </header>

      {groups.map((group) => (
        <section key={group.key} aria-label={group.title} className="space-y-3">
          {groups.length > 1 && (
            <h3 className="font-bridal text-[11px] uppercase tracking-[0.2em] text-bridal-text-label">
              {group.title}
            </h3>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.events.map(renderCard)}
          </div>
        </section>
      ))}

      {/* A running answer to "what have I chosen", in words rather than a count
          in a pill — on a multi-select step the list is the reassurance. */}
      <div
        aria-live="polite"
        className={`rounded-lg border px-4 py-3 transition-colors ${
          selectedEvents.length > 0
            ? "border-bridal-gold/45 bg-bridal-cream"
            : "border-dashed border-bridal-beige bg-transparent"
        }`}
      >
        {selectedEvents.length > 0 ? (
          <p className="font-bridal text-[13px] leading-relaxed text-bridal-charcoal">
            <span className="font-display italic text-[15px] text-bridal-gold-dark">
              {selectedEvents.length} {selectedEvents.length === 1 ? "function" : "functions"}
            </span>{" "}
            — {selectedEvents.join(", ")}. You can set the date and details for each one next.
          </p>
        ) : (
          <p className="font-bridal text-[13px] text-bridal-text-soft">
            Nothing chosen yet — pick at least one function to continue.
          </p>
        )}
      </div>
    </div>
  )
}
