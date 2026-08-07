"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * F2 + F8 — the two mechanical families, in one primitive.
 *
 * F2 / WWL-237, 254, 270, 281, 297, 315, 331, 349, 379, 405, 423, 446, 467,
 * 498, 522, 598, 607: 73 inputs across three modules had no accessible name at
 * all — placeholder-only, no `<label>`, no `aria-label`. WWL-607 counted 28
 * fields on one screen, 28 unlabelled, 0 marked required. A placeholder
 * disappears the moment you type, so a screen-reader user gets "edit text" and
 * a sighted user loses the only clue to what they are filling in.
 *
 * F8 / WWL-246, 263, 279, 303, 305, 320, 325, 340, 342, 551, 586: numeric
 * fields accepted negatives (a negative day-rate, a negative cost per litre, a
 * negative renewal lead time), rejected legitimate zeroes (a tank reading of 0
 * could not be recorded), and had no ceiling (no sanity limit on a head count).
 *
 * `LabelledField` gives every input a real label bound by id, marks required
 * fields in the accessible tree rather than only in colour, renders its error
 * with `role="alert"`, and — for `type="number"` — applies min/max/step so the
 * browser and the app agree about what is valid.
 */

let seq = 0
const useAutoId = (given?: string) => {
  const [id] = React.useState(() => given || `fld-${++seq}`)
  return given || id
}

export interface LabelledFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string
  /** Shown under the field; also announced. */
  hint?: React.ReactNode
  /** Validation message. Rendered with role="alert" so it is announced. */
  error?: string | null
  id?: string
  containerClassName?: string
}

export function LabelledField({
  label,
  hint,
  error,
  required,
  id: givenId,
  className,
  containerClassName,
  type = "text",
  min,
  max,
  step,
  ...rest
}: LabelledFieldProps) {
  const id = useAutoId(givenId)
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-err` : undefined

  // A money/quantity field that has not said otherwise cannot be negative.
  // Callers that genuinely need negatives (an adjustment, a correction) pass
  // min explicitly.
  const numericProps =
    type === "number"
      ? { min: min ?? 0, max, step: step ?? "any" }
      : { min, max, step }

  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      <label htmlFor={id} className="block text-xs font-medium text-muted-foreground">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errId].filter(Boolean).join(" ") || undefined}
        className={cn(
          "h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-destructive",
          className,
        )}
        {...numericProps}
        {...rest}
      />
      {hint && (
        <p id={hintId} className="text-[11px] text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-[11px] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export interface LabelledSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  label: string
  hint?: React.ReactNode
  error?: string | null
  id?: string
  containerClassName?: string
}

export function LabelledSelect({
  label,
  hint,
  error,
  required,
  id: givenId,
  className,
  containerClassName,
  children,
  ...rest
}: LabelledSelectProps) {
  const id = useAutoId(givenId)
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-err` : undefined

  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      <label htmlFor={id} className="block text-xs font-medium text-muted-foreground">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      <select
        id={id}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errId].filter(Boolean).join(" ") || undefined}
        className={cn(
          "h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-destructive",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {hint && (
        <p id={hintId} className="text-[11px] text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-[11px] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export default LabelledField
