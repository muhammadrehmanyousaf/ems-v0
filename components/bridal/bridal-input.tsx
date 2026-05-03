"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Bridal input — cream surface, gold focus ring, optional leading icon and
// trailing slot (e.g. password reveal toggle). Intentionally simple: it
// composes with react-hook-form via {...register('field')} just like the
// existing UI input did, so swapping it in is drop-in.
export interface BridalInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode
  trailing?: React.ReactNode
  invalid?: boolean
}

export const BridalInput = React.forwardRef<HTMLInputElement, BridalInputProps>(
  ({ className, leadingIcon, trailing, invalid, ...props }, ref) => {
    return (
      <div
        className={cn(
          "relative flex items-center w-full",
          // Reduce right padding when a trailing element is present so the
          // 32px hit-area sits cleanly inside the rounded border instead of
          // being shoved against it.
          "bridal-input h-12 rounded-[4px] py-2",
          trailing ? "pl-4 pr-1.5" : "px-4",
          invalid && "border-bridal-coral focus-within:border-bridal-coral",
          // Focus styling on the wrapper — a real ring would clip an inset icon.
          "focus-within:border-bridal-gold focus-within:shadow-[0_0_0_3px_rgba(201,149,106,0.18)]",
          className
        )}
      >
        {leadingIcon && (
          <span className="mr-3 flex-shrink-0 text-bridal-gold/80 inline-flex items-center justify-center">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "flex-1 min-w-0 bg-transparent border-0 outline-none text-bridal-charcoal placeholder:text-bridal-text-label/70",
            "font-bridal text-[14px]",
            "disabled:cursor-not-allowed disabled:text-bridal-text-soft"
          )}
          {...props}
        />
        {trailing && (
          // Fixed 32×32 hit area, controlled spacing. Children (icon button)
          // get the full slot so they're always centered inside the border.
          <span className="ml-1 flex-shrink-0 inline-flex items-center justify-center w-8 h-8 text-bridal-text-label">
            {trailing}
          </span>
        )}
      </div>
    )
  }
)
BridalInput.displayName = "BridalInput"

// Floating-label field wrapper. Pairs a top-aligned caps label with a bridal
// input and renders error/helper text underneath.
export interface BridalFieldProps {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function BridalField({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: BridalFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className="bridal-label flex items-center gap-1"
      >
        {label}
        {required && <span className="text-bridal-coral">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] text-bridal-coral font-bridal">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-bridal-text-soft font-bridal">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
