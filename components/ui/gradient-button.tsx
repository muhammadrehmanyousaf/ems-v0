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
  const variants = {
    purple: "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40",
    gold: "bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white shadow-lg shadow-gold-500/25 hover:shadow-gold-500/40",
    "purple-gold": "bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 border border-gold-400/20",
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
