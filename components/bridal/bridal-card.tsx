import * as React from "react"
import { cn } from "@/lib/utils"

// Bridal card surface — cream background, beige border, gold-on-hover.
// Used as the foundational card across the redesigned site.
export interface BridalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  blush?: boolean // alternate blush rose surface (testimonials etc.)
}

export const BridalCard = React.forwardRef<HTMLDivElement, BridalCardProps>(
  ({ className, elevated, blush, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bridal-card",
          blush && "bg-bridal-blush",
          elevated && "shadow-[0_24px_40px_-28px_rgba(176,125,84,0.4)]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
BridalCard.displayName = "BridalCard"

// Crown rule used above titles. Renders as a centered caps label flanked
// by short gold gradient lines. Pairs naturally with a Playfair italic H2.
export function BridalCrown({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-3 justify-center", className)}>
      <span className="block w-10 h-px bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
      <span className="bridal-label">{children}</span>
      <span className="block w-10 h-px bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
    </div>
  )
}

// Section title — Playfair Display Italic with optional accent word in gold italic.
export function BridalTitle({
  children,
  size = "h2",
  className,
}: {
  children: React.ReactNode
  size?: "h1" | "h2" | "h3"
  className?: string
}) {
  const sizes = {
    h1: "text-[40px] sm:text-[48px] lg:text-[52px] leading-[1.05]",
    h2: "text-[28px] sm:text-[32px] lg:text-[34px] leading-[1.15]",
    h3: "text-[20px] sm:text-[22px] leading-[1.3]",
  } as const
  const Tag = size as keyof JSX.IntrinsicElements
  return (
    <Tag
      className={cn(
        "font-display italic font-normal text-bridal-charcoal",
        sizes[size],
        className
      )}
    >
      {children}
    </Tag>
  )
}
