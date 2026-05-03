"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Bridal button system per the Phase 0 design tokens.
// - primary  : champagne gold bg, charcoal text, 4px radius
// - ghost    : rose petal border, mauve text, transparent bg
// - mauve    : deep mauve bg, ivory text (used on dark/blush sections)
// - link     : underline gold, no chrome (text-only CTA)
const bridalButton = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-bridal font-medium tracking-wide",
    "rounded-[4px] transition-all duration-250",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bridal-ivory",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-bridal-gold text-bridal-charcoal hover:bg-bridal-gold-dark hover:text-bridal-ivory shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] hover:shadow-[0_12px_28px_-12px_rgba(176,125,84,0.7)]",
        ghost:
          "bg-transparent text-bridal-mauve border border-bridal-rose hover:bg-bridal-blush hover:border-bridal-mauve/50",
        mauve:
          "bg-bridal-mauve text-bridal-ivory hover:bg-[#74485e] shadow-[0_8px_22px_-12px_rgba(139,90,114,0.6)]",
        outline:
          "bg-bridal-cream text-bridal-charcoal border border-bridal-beige hover:border-bridal-gold hover:text-bridal-mauve",
        link:
          "bg-transparent text-bridal-gold hover:text-bridal-gold-dark underline-offset-4 hover:underline px-0 py-0 h-auto",
      },
      size: {
        sm: "h-9 px-4 text-xs uppercase tracking-[0.18em]",
        md: "h-11 px-6 text-[13px] uppercase tracking-[0.18em]",
        lg: "h-12 px-8 text-sm uppercase tracking-[0.2em]",
        xl: "h-14 px-10 text-sm uppercase tracking-[0.22em]",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  }
)

export interface BridalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof bridalButton> {
  asChild?: boolean
  loading?: boolean
}

export const BridalButton = React.forwardRef<
  HTMLButtonElement,
  BridalButtonProps
>(({ className, variant, size, block, loading, disabled, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(bridalButton({ variant, size, block }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="inline-block w-3.5 h-3.5 rounded-full border-[2px] border-current border-t-transparent animate-spin"
        />
      )}
      {children}
    </button>
  )
})
BridalButton.displayName = "BridalButton"
