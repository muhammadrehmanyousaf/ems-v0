"use client"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import type { ButtonHTMLAttributes, ReactNode } from "react"

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string
  variant?: "purple" | "gold" | "purple-gold"
  size?: "default" | "sm" | "lg"
}

export function GradientButton({
  children,
  className,
  variant = "purple",
  size = "default",
  ...props
}: GradientButtonProps) {
  // Bridal palette — kept the same variant keys so existing call sites keep
  // working. "purple" / "purple-gold" now render the bridal gold treatment.
  const variants = {
    purple: "bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] hover:shadow-[0_14px_30px_-12px_rgba(176,125,84,0.7)]",
    gold: "bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] hover:shadow-[0_14px_30px_-12px_rgba(176,125,84,0.7)]",
    "purple-gold": "bg-bridal-charcoal hover:bg-bridal-charcoal/90 text-bridal-ivory shadow-[0_10px_28px_-14px_rgba(44,24,16,0.6)] border border-bridal-gold/45",
  }

  const sizes = {
    sm: "px-4 py-2 text-sm",
    default: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3 text-base",
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
