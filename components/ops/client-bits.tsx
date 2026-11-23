"use client"

// Small pieces shared by the client-desk screens: status and response badges, labels, money.
import { Status, type Tone } from "@/components/ops/ops-ui"
import { dueLabel } from "@/components/ops/prospect-bits"
import type { AssignmentStage, Availability, ClientEventKind, ClientRow, ClientSource, ClientStatus } from "@/lib/api/ops-clients"

export const CLIENT_STATUS: Record<ClientStatus, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "warn" },
  contacted: { label: "Spoke", tone: "info" },
  shortlisting: { label: "Shortlisting", tone: "acc" },
  assigned: { label: "With vendor manager", tone: "info" },
  booked: { label: "Booked", tone: "ok" },
  lost: { label: "Lost", tone: "mut" },
  closed: { label: "Closed", tone: "mut" },
}
export const SOURCE_LABEL: Record<ClientSource, string> = { website: "Website", whatsapp: "WhatsApp", phone: "Phone", referral: "Referral", walk_in: "Walk-in", other: "Other" }
export const EVENT_LABEL: Record<ClientEventKind, string> = { mehndi: "Mehndi", barat: "Barat", walima: "Walima", nikah: "Nikah", engagement: "Engagement", dholki: "Dholki", other: "Other function" }
export const CLOSED = new Set<ClientStatus>(["booked", "lost", "closed"])

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const m = CLIENT_STATUS[status] ?? { label: status, tone: "mut" as Tone }
  return <Status tone={m.tone}>{m.label}</Status>
}

/** The first-response timer in words: answered, due in 12 min, or overdue by 2 h. */
export function ResponseBadge({ row }: { row: Pick<ClientRow, "firstResponseAt" | "firstResponseDueAt" | "overdue" | "status"> }) {
  if (row.firstResponseAt) return <Status tone="ok">Replied</Status>
  if (CLOSED.has(row.status)) return <Status tone="mut">Closed</Status>
  const d = dueLabel(row.firstResponseDueAt)
  if (row.overdue) return <Status tone="bad">{d.text.replace("Due ", "Overdue ")}</Status>
  return <Status tone="warn">{d.text === "Due now" ? "Reply now" : `Reply ${d.text}`}</Status>
}

/** Where a handed-over client stands with the vendor, in the words both teams use. */
export const STAGE_META: Record<AssignmentStage, { label: string; short: string; pick: string; tone: Tone }> = {
  new: { label: "Not contacted yet", short: "Not contacted", pick: "Not yet", tone: "mut" },
  contacted: { label: "Vendor contacted, waiting", short: "Contacted", pick: "Contacted", tone: "info" },
  confirmed: { label: "Vendor confirmed", short: "Confirmed", pick: "Confirmed", tone: "ok" },
  unavailable: { label: "Vendor not available", short: "Not available", pick: "Unavailable", tone: "bad" },
}
export function StageBadge({ stage, short }: { stage: AssignmentStage; short?: boolean }) {
  const m = STAGE_META[stage] ?? STAGE_META.new
  return <Status tone={m.tone}>{short ? m.short : m.label}</Status>
}

export const AVAIL_META: Record<Availability, { label: string; tone: Tone }> = {
  pending: { label: "Not checked", tone: "mut" },
  available: { label: "Available", tone: "ok" },
  unavailable: { label: "Not available", tone: "bad" },
  no_answer: { label: "No answer", tone: "warn" },
}
export function AvailabilityBadge({ value }: { value: Availability }) {
  const m = AVAIL_META[value] ?? AVAIL_META.pending
  return <Status tone={m.tone}>{m.label}</Status>
}

/** "Rs 1,500,000" (or a dash) from a NUMERIC string the API returns. */
export const fmtPkr = (v: string | number | null | undefined) => (v == null || v === "" || Number(v) <= 0 ? "—" : `Rs ${Number(v).toLocaleString("en-PK")}`)

export function ageLabel(iso: string): string {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (m < 1) return "just now"
  if (m < 60) return `${m} min`
  if (m < 1440) return `${Math.round(m / 60)} h`
  return `${Math.round(m / 1440)} d`
}
