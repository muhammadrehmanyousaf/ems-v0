"use client"

// Plain, simple everyday English status words & progress steps for call-center staff.
import { Status, type Tone } from "@/components/ops/ops-ui"
import { dueLabel } from "@/components/ops/prospect-bits"
import type { AssignmentStage, Availability, ClientEventKind, ClientRow, ClientSource, ClientStatus } from "@/lib/api/ops-clients"

export const CLIENT_STATUS: Record<ClientStatus, { label: string; tone: Tone }> = {
  new: { label: "New — Call Now", tone: "warn" },
  contacted: { label: "Spoke on Phone", tone: "info" },
  shortlisting: { label: "Picking Venues", tone: "acc" },
  assigned: { label: "Waiting on Vendor Team", tone: "info" },
  vendor_replied: { label: "Reply Ready — Call Client", tone: "ok" },
  visit_scheduled: { label: "Visit Planned", tone: "acc" },
  booked: { label: "Booked", tone: "ok" },
  lost: { label: "Not Booking", tone: "mut" },
  closed: { label: "Closed", tone: "mut" },
}
export const SOURCE_LABEL: Record<ClientSource, string> = { website: "Website Form", whatsapp: "WhatsApp", phone: "Phone Call", referral: "Referral", walk_in: "Walk-in", other: "Other" }
export const EVENT_LABEL: Record<ClientEventKind, string> = { mehndi: "Mehndi", barat: "Barat", walima: "Walima", nikah: "Nikah", engagement: "Engagement", dholki: "Dholki", other: "Other event" }
export const CLOSED = new Set<ClientStatus>(["booked", "lost", "closed"])

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const m = CLIENT_STATUS[status] ?? { label: status, tone: "mut" as Tone }
  return <Status tone={m.tone}>{m.label}</Status>
}

export function ResponseBadge({ row }: { row: Pick<ClientRow, "firstResponseAt" | "firstResponseDueAt" | "overdue" | "status"> }) {
  if (row.firstResponseAt) return <Status tone="ok">Called Back</Status>
  if (CLOSED.has(row.status)) return <Status tone="mut">Closed</Status>
  const d = dueLabel(row.firstResponseDueAt)
  if (row.overdue) return <Status tone="bad">{d.text.replace("Due ", "Late ")}</Status>
  return <Status tone="warn">{d.text === "Due now" ? "Call now" : `Call ${d.text}`}</Status>
}

export const STAGE_META: Record<AssignmentStage, { label: string; short: string; pick: string; tone: Tone }> = {
  new: { label: "Not called vendor yet", short: "Not called", pick: "Not called", tone: "mut" },
  contacted: { label: "Called vendor, waiting reply", short: "Waiting", pick: "Waiting", tone: "info" },
  confirmed: { label: "Vendor confirmed free", short: "Available", pick: "Available", tone: "ok" },
  unavailable: { label: "Vendor is booked / busy", short: "Not free", pick: "Not free", tone: "bad" },
}
export function StageBadge({ stage, short }: { stage: AssignmentStage; short?: boolean }) {
  const m = STAGE_META[stage] ?? STAGE_META.new
  return <Status tone={m.tone}>{short ? m.short : m.label}</Status>
}

export const AVAIL_META: Record<Availability, { label: string; tone: Tone }> = {
  pending: { label: "Not checked", tone: "mut" },
  available: { label: "Available", tone: "ok" },
  unavailable: { label: "Not free", tone: "bad" },
  no_answer: { label: "No answer", tone: "warn" },
}
export function AvailabilityBadge({ value }: { value: Availability }) {
  const m = AVAIL_META[value] ?? AVAIL_META.pending
  return <Status tone={m.tone}>{m.label}</Status>
}

export const JOURNEY_STEPS: { key: ClientStatus; label: string }[] = [
  { key: "new", label: "1. Client Added" },
  { key: "contacted", label: "2. Spoke to Client" },
  { key: "shortlisting", label: "3. Venues Picked" },
  { key: "assigned", label: "4. Vendor Team Checking" },
  { key: "vendor_replied", label: "5. Reply Ready" },
  { key: "visit_scheduled", label: "6. Visit Planned" },
  { key: "booked", label: "7. Booked!" },
]

export function journeyStepIndex(status: ClientStatus): number {
  const idx = JOURNEY_STEPS.findIndex((s) => s.key === status)
  return idx >= 0 ? idx : 0
}

export const fmtPkr = (v: string | number | null | undefined) => (v == null || v === "" || Number(v) <= 0 ? "—" : `Rs ${Number(v).toLocaleString("en-PK")}`)

export function ageLabel(iso: string): string {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (m < 1) return "just now"
  if (m < 60) return `${m} min`
  if (m < 1440) return `${Math.round(m / 60)} h`
  return `${Math.round(m / 1440)} d`
}
