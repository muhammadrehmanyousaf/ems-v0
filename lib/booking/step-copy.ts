/**
 * Every heading, subtitle and button label on the booking route, in one place.
 *
 * The steps used to each carry their own <h2> and intro paragraph, so the
 * journey read as six unrelated pages. The shell now renders the heading
 * block above whichever step is showing, from this table, and the action bar
 * derives its label from what comes next. Copy moves here; nothing is
 * reworded except where the redesign spec says so.
 */

import type { BookingStepKey } from "@/components/booking/shell/booking-shell-context"

export interface StepCopyCtx {
  /** 0-based index among the displayed steps, and the count. */
  stepIndex: number
  stepCount: number
  vendorTypeName: string
  isCarRental: boolean
  isBridalWear: boolean
  isWeddingStationery: boolean
  isVenueBooking: boolean
  includedInPackage: boolean
  hasMenus: boolean
  hasPackages: boolean
  venueName: string
  /** The active function on a multi-event booking, e.g. "Baraat". */
  eventType?: string
  multiEvent: boolean
  unitLabel?: string
  requiresApproval: boolean
}

export interface StepHeading {
  eyebrow: string
  title: string
  subtitle?: string
}

const STEP_TITLES: Record<string, string> = {
  event: "Event selection",
  datetime: "Date & time",
  vendors: "Additional vendors",
  packages: "Packages",
  menu: "Menu",
  unit: "Quantity",
  requirements: "Your requirements",
  review: "Review",
  success: "Confirmed",
}

export function stepTitleShort(key: string, ctx?: Partial<StepCopyCtx>): string {
  if (key === "menu" && ctx?.includedInPackage) return "Customise menu"
  if (key === "unit" && ctx?.unitLabel) return `How many ${ctx.unitLabel}?`
  return STEP_TITLES[key] ?? key
}

export function stepHeading(key: BookingStepKey | string, ctx: StepCopyCtx): StepHeading {
  const n = ctx.stepIndex + 1
  const eyebrowTail = ctx.multiEvent && ctx.eventType ? ctx.eventType : stepTitleShort(key, ctx)
  const eyebrow = `Step ${n} of ${ctx.stepCount} · ${eyebrowTail}`

  switch (key) {
    case "event":
      return {
        eyebrow,
        title: "What are you celebrating?",
        subtitle:
          "Pick every function you want at this venue. Choose more than one and each gets its own date, menu and pricing — you only fill this in once.",
      }
    case "datetime":
      return {
        eyebrow,
        title: "When is your event?",
        subtitle: ctx.requiresApproval
          ? "Pick a date and a time of day. The date isn't reserved until the venue accepts your request, so send it as soon as you're ready."
          : "Pick a date and a time of day.",
      }
    case "vendors":
      return {
        eyebrow,
        title: "Add other vendors?",
        subtitle: "Optional — bring a photographer, decorator or caterer into the same booking.",
      }
    case "packages":
      return {
        eyebrow,
        title: ctx.isCarRental
          ? "Choose a vehicle"
          : ctx.isBridalWear
            ? "Choose your outfit"
            : ctx.isWeddingStationery
              ? "Choose a product"
              : "Choose your package",
        subtitle: ctx.isCarRental
          ? "Pick the car. Add service packages on the next step if needed."
          : ctx.isVenueBooking
            ? "These packages set the base for your venue booking."
            : "All packages include the vendor's full attention for your event.",
      }
    case "menu":
      return {
        eyebrow,
        title: "Choose your menu",
        subtitle: ctx.includedInPackage
          ? "Pick the dishes you'd like. Your food is already covered — this won't change your price."
          : "Select a menu for your event.",
      }
    case "unit":
      return {
        eyebrow,
        title: ctx.unitLabel ? `How many ${ctx.unitLabel} do you need?` : "How many do you need?",
        subtitle: "The price updates as you change the number.",
      }
    case "requirements":
      return {
        eyebrow,
        title: "Anything we should know?",
        subtitle: `All optional — but whatever you write here goes straight to ${ctx.venueName || "the venue"} and onto their kitchen sheet.`,
      }
    case "review":
      return {
        eyebrow,
        title: ctx.requiresApproval ? "Review your request" : "Review your booking",
        subtitle: ctx.requiresApproval
          ? "Check the details before you send them. Nothing is charged until the venue accepts."
          : "Double-check the details. The down payment is charged on confirm — the rest is due at the venue.",
      }
    default:
      return { eyebrow, title: stepTitleShort(key, ctx) }
  }
}

/** "Continue to packages", "Review booking", "Send request · Rs 76,000 advance". */
export function continueLabel({
  currentKey,
  nextKey,
  valid,
  isReview,
  requiresApproval,
  advance,
  functionCount,
  phone,
  signedIn,
  ctx,
  disabledReason,
}: {
  currentKey: string
  nextKey?: string
  valid: boolean
  isReview: boolean
  requiresApproval: boolean
  advance: string | null
  functionCount: number
  phone: boolean
  signedIn: boolean
  ctx?: Partial<StepCopyCtx>
  disabledReason?: string | null
}): string {
  if (isReview) {
    if (!signedIn) return phone ? "Sign in to send" : "Sign in to send request"
    if (requiresApproval) return advance ? (phone ? `Send request · ${advance}` : `Send request · ${advance} advance`) : "Send request"
    return advance ? `Pay & confirm · ${advance}` : "Pay & confirm"
  }
  // "Pick a date to continue" wraps to two lines in a phone's action bar;
  // the short form says the same thing in the space there is.
  if (!valid && disabledReason) return phone ? disabledReason.replace(/ to continue$/, "") : disabledReason
  if (phone) return "Continue"
  if (currentKey === "event") {
    return functionCount > 1 ? `Continue to date · ${functionCount} functions` : "Continue to date"
  }
  if (nextKey === "review") return "Review booking"
  if (!nextKey) return "Continue"
  const next = stepTitleShort(nextKey, ctx).toLowerCase()
  // "Continue to date & time" reads better as "Continue to date".
  const short = next.startsWith("date") ? "date" : next.replace(/^your /, "").replace(/^additional /, "")
  return `Continue to ${short}`
}

/** Why Continue is disabled, said in the button. */
export function disabledReason(
  stepKey: string,
  form: { bookingDate?: unknown; timeSlot?: string; guestCount?: number; selectedPackage?: string } | null,
  opts: { functionCount: number; needsGuestCount: boolean; hasPackages: boolean },
): string | null {
  switch (stepKey) {
    case "event":
      return opts.functionCount > 0 ? null : "Pick a function to continue"
    case "datetime":
      if (!form?.bookingDate) return "Pick a date to continue"
      if (!form?.timeSlot) return "Pick a time to continue"
      if (opts.needsGuestCount && !((form?.guestCount || 0) > 0)) return "Enter guests to continue"
      return null
    case "packages":
      return opts.hasPackages && !form?.selectedPackage ? "Choose a package to continue" : null
    default:
      return null
  }
}
