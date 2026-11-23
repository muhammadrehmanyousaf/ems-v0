"use client"

// Small pieces shared by the prospect screens.
import { Copy, MessageCircle, Phone } from "lucide-react"

import { Status, useOpsToast, type Tone } from "@/components/ops/ops-ui"
import type { ProspectPhone, ProspectStatus } from "@/lib/api/ops-prospects"

export const STATUS_META: Record<ProspectStatus, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "mut" },
  attempting: { label: "Trying", tone: "warn" },
  contacted: { label: "Spoke", tone: "info" },
  interested: { label: "Interested", tone: "acc" },
  onboarding: { label: "Onboarding", tone: "info" },
  live: { label: "Live", tone: "ok" },
  not_interested: { label: "Not interested", tone: "mut" },
  invalid: { label: "Invalid", tone: "bad" },
  do_not_contact: { label: "Do not contact", tone: "bad" },
  duplicate: { label: "Duplicate", tone: "mut" },
}

export function StatusBadge({ status }: { status: ProspectStatus }) {
  const m = STATUS_META[status] ?? { label: status, tone: "mut" as Tone }
  return <Status tone={m.tone}>{m.label}</Status>
}

/** "0300 1234567" for a Pakistani mobile, the typed text otherwise. */
export function fmtPhone(p: Pick<ProspectPhone, "raw" | "e164">): string {
  if (p.e164 && /^\+92\d{10}$/.test(p.e164)) return `0${p.e164.slice(3, 6)} ${p.e164.slice(6)}`
  return p.raw
}
export const telHref = (p: Pick<ProspectPhone, "raw" | "e164">) => `tel:${p.e164 ?? p.raw.replace(/[^\d+]/g, "")}`
export const waHref = (p: Pick<ProspectPhone, "e164">, text?: string) => (p.e164 ? `https://wa.me/${p.e164.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}` : null)

export function PhoneActions({ phone, compact }: { phone: ProspectPhone; compact?: boolean }) {
  const toast = useOpsToast()
  const wa = waHref(phone)
  const size = compact ? "ibtn" : "btn btn-ghost sm"
  return (
    <span className="row" style={{ gap: 6 }}>
      <a className={size} href={telHref(phone)} aria-label={`Call ${fmtPhone(phone)}`} title="Call"><Phone aria-hidden size={compact ? 15 : 14} />{!compact && "Call"}</a>
      {wa && <a className={size} href={wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${fmtPhone(phone)}`} title="WhatsApp"><MessageCircle aria-hidden size={compact ? 15 : 14} />{!compact && "WhatsApp"}</a>}
      <button type="button" className={size} aria-label={`Copy ${fmtPhone(phone)}`} title="Copy number" onClick={async () => {
        try { await navigator.clipboard.writeText(fmtPhone(phone)); toast({ title: "Number copied" }) } catch { /* selectable on screen */ }
      }}><Copy aria-hidden size={compact ? 15 : 14} />{!compact && "Copy"}</button>
    </span>
  )
}

/** "Due now" / "in 3 h" / "2 d ago" style label for a next-action time, plus whether it is due. */
export function dueLabel(iso: string | null): { text: string; due: boolean; tone: Tone } {
  if (!iso) return { text: "—", due: false, tone: "mut" }
  const t = new Date(iso).getTime()
  const diff = t - Date.now()
  const m = Math.round(Math.abs(diff) / 60000)
  const unit = m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`
  if (diff <= 0) return { text: m < 1 ? "Due now" : `Due ${unit} ago`, due: true, tone: m > 24 * 60 ? "bad" : "warn" }
  return { text: `in ${unit}`, due: false, tone: "mut" }
}

export const KIND_LABEL: Record<string, string> = {
  callback: "Callback", follow_up: "Follow up", send_listing_preview: "Send preview", collect_media: "Collect photos", check_availability: "Check availability", review: "Review",
}

export const DISPOSITION_LABEL: Record<string, string> = {
  no_answer: "No answer", busy_callback: "Busy - call back", switched_off: "Switched off", wrong_number: "Wrong number", not_a_vendor: "Not a wedding vendor / closed",
  not_interested: "Not interested", thinking: "Needs time to think", interested: "Interested", onboarded: "Onboarded", do_not_contact: "Do not contact",
}
