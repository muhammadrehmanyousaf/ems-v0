"use client"

// Small shared pieces for the Ops screens: one look, so every screen reads the same way.
import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-bridal-charcoal md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-bridal-text-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ title, description, actions, children, className }: {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("rounded-xl border border-bridal-beige/70 bg-white shadow-sm", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-bridal-beige/60 px-4 py-4 md:px-6">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold leading-snug tracking-tight text-bridal-charcoal">{title}</h2>}
            {description && <p className="mt-1 text-sm leading-relaxed text-bridal-text-soft">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-4 md:p-6">{children}</div>
    </section>
  )
}

const TONES = {
  neutral: "border-status-neutral-line bg-status-neutral-soft text-status-neutral",
  success: "border-status-success-line bg-status-success-soft text-status-success",
  warning: "border-status-warning-line bg-status-warning-soft text-status-warning",
  danger: "border-status-danger-line bg-status-danger-soft text-status-danger",
  info: "border-status-info-line bg-status-info-soft text-status-info",
} as const

export function Pill({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", TONES[tone])}>
      {children}
    </span>
  )
}

export const inputCls =
  "h-10 w-full rounded-md border border-bridal-beige bg-white px-3 text-sm text-bridal-charcoal placeholder:text-bridal-text-soft/70 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"

export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-bridal-charcoal">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-bridal-text-soft">{hint}</p>}
    </div>
  )
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warning" | "danger" | "success"; children: React.ReactNode }) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-lg border px-4 py-3 text-sm leading-relaxed", TONES[tone])}>
      {children}
    </div>
  )
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2 transition-all duration-150 active:scale-[0.98]"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 2000)
        } catch {
          /* clipboard blocked: the text is selectable in the field above */
        }
      }}
    >
      {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {copied ? "Copied" : label}
    </Button>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-bridal-beige px-4 py-8 text-center text-sm text-bridal-text-soft">{children}</p>
}
