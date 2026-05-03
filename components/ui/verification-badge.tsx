"use client"

// 01-VR-ENHANCE-V1-FE — small inline pill used everywhere the user's email or
// phone verification status is surfaced.

import { cn } from "@/lib/utils"
import { CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"

interface VerificationBadgeProps {
  verified: boolean
  label: string
  className?: string
  /** "lg" makes it stand alone in a card; "sm" is for inline use next to text. */
  size?: "sm" | "lg"
}

export function VerificationBadge({ verified, label, className, size = "sm" }: VerificationBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bridal font-medium tracking-wide",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        verified
          ? "bg-bridal-sage/15 text-bridal-sage border border-bridal-sage/30"
          : "bg-bridal-coral/15 text-bridal-coral border border-bridal-coral/30",
        className
      )}
    >
      {verified ? (
        <CheckCircle2 className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      ) : (
        <AlertCircle className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      )}
      {verified ? label : `${label} not verified`}
    </span>
  )
}

interface TwoFactorBadgeProps {
  enabled: boolean
  className?: string
}

export function TwoFactorBadge({ enabled, className }: TwoFactorBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bridal font-medium tracking-wide px-2 py-0.5 text-[11px]",
        enabled
          ? "bg-bridal-gold/15 text-bridal-gold border border-bridal-gold/40"
          : "bg-bridal-text-soft/10 text-bridal-text-soft border border-bridal-text-soft/30",
        className
      )}
    >
      <ShieldCheck className="w-3 h-3" />
      {enabled ? "2FA on" : "2FA off"}
    </span>
  )
}

interface KycStatusPillProps {
  status: "pending" | "approved" | "rejected" | "request_changes"
  className?: string
  children?: ReactNode
}

export function KycStatusPill({ status, className, children }: KycStatusPillProps) {
  const map: Record<KycStatusPillProps["status"], string> = {
    approved: "bg-bridal-sage/15 text-bridal-sage border-bridal-sage/30",
    pending: "bg-bridal-gold/15 text-bridal-gold border-bridal-gold/30",
    rejected: "bg-bridal-coral/15 text-bridal-coral border-bridal-coral/30",
    request_changes: "bg-bridal-mauve/15 text-bridal-mauve border-bridal-mauve/30",
  }
  const label: Record<KycStatusPillProps["status"], string> = {
    approved: "Approved",
    pending: "Under review",
    rejected: "Rejected",
    request_changes: "Changes requested",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border",
        map[status],
        className
      )}
    >
      {children ?? label[status]}
    </span>
  )
}
