import * as React from "react"
import { cn } from "@/lib/utils"

// Caps badge — small gold/rose/coral/sage chip. Used above headlines
// (e.g. "Pakistan's #1 Wedding Platform") and on cards (e.g. "Featured").
export type BridalBadgeVariant = "rose" | "gold" | "coral" | "sage" | "mauve"

const variants: Record<BridalBadgeVariant, string> = {
  rose:  "bg-bridal-blush text-bridal-mauve border-bridal-rose/60",
  gold:  "bg-[#FFF8EE] text-[#8B5E2E] border-bridal-gold/60",
  coral: "bg-[#FFF1EC] text-[#9B4A38] border-bridal-coral/60",
  sage:  "bg-[#EFF5EC] text-[#3F6B43] border-bridal-sage/70",
  mauve: "bg-bridal-mauve/10 text-bridal-mauve border-bridal-mauve/30",
}

export interface BridalBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BridalBadgeVariant
}

export function BridalBadge({
  variant = "rose",
  className,
  children,
  ...props
}: BridalBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 border rounded-full",
        "font-bridal text-[10.5px] font-medium tracking-[0.2em] uppercase",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
