"use client"

import { cn } from "@/lib/utils"

interface GoldDividerProps {
  className?: string
  ornament?: boolean
}

export function GoldDivider({ className, ornament = false }: GoldDividerProps) {
  if (ornament) {
    return (
      <div className={cn("flex items-center justify-center gap-3", className)}>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-400/60 to-gold-400/60" />
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gold-500 flex-shrink-0">
          <path d="M10 0L12.5 7.5L20 10L12.5 12.5L10 20L7.5 12.5L0 10L7.5 7.5L10 0Z" fill="currentColor" />
        </svg>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gold-400/60 to-gold-400/60" />
      </div>
    )
  }

  return (
    <div className={cn("h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent", className)} />
  )
}
