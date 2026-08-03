"use client"

/**
 * Field-level validation messaging.
 *
 * WHY THIS EXISTS
 * ---------------
 * Dashboard forms were validating correctly and saying nothing. The packages
 * form is the clearest case: `canSave = form.name.trim() && Number(form.price) > 0`
 * is right, but the ONLY thing it drives is `disabled` on the Save button.
 * Measured on the live site with a negative price:
 *
 *     saveDisabled: true
 *     error message shown: none
 *     aria-invalid: null
 *     aria-describedby: null
 *     red border: no
 *
 * So a vendor types a price, the button greys out, and nothing on screen tells
 * them why. They reasonably conclude the button is broken — which is exactly the
 * "not a single patch is going / the CRUDs don't work" report. It is also an
 * accessibility failure: with no aria-invalid and no aria-describedby, a screen
 * reader user gets no signal at all.
 *
 * A disabled button is not feedback. Any control that refuses to act must say
 * what it is waiting for.
 *
 * USAGE
 *   const err = touched.price ? validatePrice(form.price) : undefined
 *   <input {...fieldAria("pkg-price", err)} className={cn(inputCls, err && ERROR_INPUT_CLS)} />
 *   <FieldError id="pkg-price" message={err} />
 */

import * as React from "react"
import { cn } from "@/lib/utils"

/** Border/ring treatment for an invalid control. Pair with <FieldError />. */
export const ERROR_INPUT_CLS =
  "border-destructive focus-visible:ring-destructive/40"

/**
 * Wires a control to its message for assistive tech. `aria-describedby` is only
 * set when there IS a message — pointing at an absent node is worse than nothing.
 */
export function fieldAria(id: string, message?: string) {
  return {
    "aria-invalid": message ? true : undefined,
    "aria-describedby": message ? `${id}-error` : undefined,
  } as const
}

/**
 * Renders nothing when valid, so it never reserves space or shifts the layout —
 * this dashboard already had a 15px shift problem and must not gain another.
 *
 * role="alert" so the message is announced the moment it appears.
 */
export function FieldError({
  id,
  message,
  className,
}: {
  id: string
  message?: string
  className?: string
}) {
  if (!message) return null
  return (
    <p
      id={`${id}-error`}
      role="alert"
      className={cn("text-xs font-medium text-destructive", className)}
    >
      {message}
    </p>
  )
}

/**
 * Explains a disabled submit button. A vendor should never face a dead control
 * with no reason given; this is the catch-all for "the form as a whole isn't
 * ready yet" when no single field is at fault.
 */
export function FormBlockedHint({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="status" className="text-xs text-muted-foreground">
      {message}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Shared validators. Messages are written for a Pakistani venue owner: say what
// to do, not what the code expects. Bounds mirror the server so the two can
// never disagree and produce a "the form let me but the server refused" loop.
// ---------------------------------------------------------------------------

/** Required free text, e.g. a package or menu name. */
export function validateName(
  value: string,
  { label = "Name", min = 2, max = 150 }: { label?: string; min?: number; max?: number } = {},
): string | undefined {
  const v = (value ?? "").trim()
  if (!v) return `${label} is required.`
  if (v.length < min) return `${label} must be at least ${min} characters.`
  if (v.length > max) return `${label} must be ${max} characters or fewer — currently ${v.length}.`
  return undefined
}

/**
 * Rupee amount. Rejects negatives and zero by default because a Rs 0 listing is
 * the "3,268 businesses bookable at Rs 0" hole, not a real free service.
 */
export function validatePkr(
  value: string | number,
  {
    label = "Price",
    allowZero = false,
    max = 100_000_000, // Rs 10 crore — far above any real venue package
  }: { label?: string; allowZero?: boolean; max?: number } = {},
): string | undefined {
  const raw = String(value ?? "").trim()
  if (!raw) return `${label} is required.`
  const n = Number(raw)
  if (!Number.isFinite(n)) return `${label} must be a number.`
  if (n < 0) return `${label} cannot be negative.`
  if (!allowZero && n === 0) return `${label} must be more than Rs 0.`
  if (n > max) return `${label} looks too large. Please check the amount.`
  return undefined
}

/** Optional free text with a ceiling, e.g. a description. */
export function validateOptionalText(
  value: string,
  { label = "This field", max = 500 }: { label?: string; max?: number } = {},
): string | undefined {
  const v = (value ?? "").trim()
  if (v.length > max) return `${label} must be ${max} characters or fewer — currently ${v.length}.`
  return undefined
}
