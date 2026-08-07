"use client"

/**
 * Leads — redesigned (Track C). Wired to the real LeadAPI.list() and rendered
 * through the primitives. Read-only presentation; the original Leads inbox is
 * untouched. Mounted at /dashboard/leads-new.
 */

import * as React from "react"
import { useRecordBusinessId } from "@/hooks/use-record-business-id"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { LeadAPI, type Lead, type LeadStatus } from "@/lib/api/leads"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { LeadFormDialog, type LeadPrefill } from "@/components/dashboard/mainScreens/leads/redesigned/lead-form-dialog"
import { OutboxStatus } from "@/components/dashboard/shared/outbox-status"
import { OutboxConflicts } from "@/components/dashboard/shared/outbox-conflicts"
// F-8 — convert-to-booking reuses the same offline-booking dialog the bookings
// page uses, prefilled from the lead (parity with the legacy inbox view).
import { OfflineBookingDialog } from "@/components/dashboard/mainScreens/bookings/bookingListing/components/offline-booking-dialog"
// Phase 5 — AI draft-reply. Gated on the deployment having ANTHROPIC_API_KEY;
// useAiFeature is cached so the row action doesn't fire one /ai/status per row.
import { LeadReplyDialog } from "@/components/dashboard/mainScreens/leads/redesigned/lead-reply-dialog"
import { useAiFeature } from "@/hooks/use-ai-status"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { ImportButton } from "@/components/dashboard/shared/import-button"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

const TONE: Record<LeadStatus, StatusTone> = {
  new: "info",
  contacted: "warning",
  qualified: "info",
  quoted: "warning",
  booked: "success",
  lost: "error",
  archived: "neutral",
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)
const pretty = (s?: string | null) => (s ? cap(s.replace(/_/g, " ")) : "—")

/**
 * WWL-032 — this rendered "01 Jan" with no year, so a lead for January 2020
 * was visually identical to one for January 2027. This inbox holds leads
 * spanning multiple years (Jan/Feb dates are next season), so a vendor could
 * not tell a stale or mistyped lead from a live one by looking at it.
 */
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

/** True when the event date has already gone by — a lead worth double-checking. */
const isPastDate = (s?: string | null) => {
  if (!s) return false
  const d = new Date(s)
  if (isNaN(d.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

export function LeadsRedesignedView() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Lead | undefined>(undefined)
  const [prefill, setPrefill] = React.useState<LeadPrefill | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<Lead | null>(null)
  // WWL-033 — archived leads are out of the working inbox unless asked for.
  const [showArchived, setShowArchived] = React.useState(false)
  // Phase 5 — lead whose "Draft reply" was clicked. Null when AI is dark.
  const [replyLead, setReplyLead] = React.useState<Lead | null>(null)
  const aiReply = useAiFeature("leadReply")
  // F-8 — lead whose "Convert to booking" was clicked; drives the dialog.
  const [convertLead, setConvertLead] = React.useState<Lead | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["leads-redesigned"],
    queryFn: () => LeadAPI.list(),
  })
  const { data: businesses } = useQuery({ queryKey: ["my-businesses"], queryFn: () => BusinessesAPI.getUserBusinesses() })
  /**
   * WWL-293/311/332/350 — this was `businesses?.[0]?.id`, so under "All venues"
   * a new record landed on whichever venue happened to be first in the array,
   * silently. The hook returns undefined rather than guessing when there is no
   * right answer; the create dialog then asks.
   */
  const businessId = useRecordBusinessId()
  const invalidate = () => qc.invalidateQueries({ queryKey: ["leads-redesigned"] })
  const openCreate = () => { setEditing(undefined); setPrefill(undefined); setDialogOpen(true) }
  const openEdit = (l: Lead) => { setEditing(l); setPrefill(undefined); setDialogOpen(true) }
  // PWA-03 — re-enter a conflicted offline lead with its values seeded.
  const openReenter = (p: LeadPrefill) => { setEditing(undefined); setPrefill(p); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => LeadAPI.remove(id),
    onSuccess: () => { showSuccessToast("Lead removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't remove lead"),
  })

  const all = data?.leads ?? []
  const archivedCount = React.useMemo(
    () => all.filter((l) => l.status === "archived").length,
    [all],
  )
  const leads = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    // WWL-033 — archived leads were rendered in the main table alongside live
    // ones with no status filter anywhere on the screen, so they permanently
    // padded an inbox the vendor is meant to work top-down. Hidden by default;
    // one click brings them back.
    const base = showArchived ? all : all.filter((l) => l.status !== "archived")
    if (!q) return base
    return base.filter((l) =>
      [l.contactName, l.contactPhone, l.inquiry, l.eventType].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
  }, [all, search, showArchived])

  const byStatus = data?.summary?.byStatus ?? {}
  const count = (s: LeadStatus) => byStatus[s] ?? all.filter((l) => l.status === s).length

  const columns: Column<Lead>[] = [
    {
      key: "contact",
      header: "Contact",
      // The name is the door into the lead's own page. Every other spine object
      // opens from its list this way; the lead only had inline actions, so the
      // enquiry itself — what they actually wrote, whether it converted — had
      // nowhere to be read.
      render: (l) => (
        <Link
          href={`/dashboard/leads/${l.id}`}
          className="font-medium hover:text-primary hover:underline"
        >
          {l.contactName || "Unknown"}
        </Link>
      ),
    },
    { key: "phone", header: "Phone", cellClassName: "text-muted-foreground", render: (l) => l.contactPhone || "—" },
    { key: "source", header: "Source", render: (l) => <StatusPill tone="neutral">{pretty(l.source)}</StatusPill> },
    { key: "event", header: "Event", cellClassName: "text-muted-foreground", render: (l) => pretty(l.eventType) },
    {
      key: "date", header: "Event date", cellClassName: "text-muted-foreground",
      render: (l) => (
        <span className={cn("whitespace-nowrap", isPastDate(l.eventDate) && "text-muted-foreground/70 line-through")}
          title={isPastDate(l.eventDate) ? "This date has already passed" : undefined}>
          {fmtDate(l.eventDate)}
        </span>
      ),
    },
    { key: "budget", header: "Budget", align: "right", render: (l) => <MoneyCell amount={l.estimatedBudget != null ? Number(l.estimatedBudget) || null : null} tone="muted" /> },
    { key: "status", header: "Status", render: (l) => <StatusPill tone={TONE[l.status] ?? "neutral"}>{cap(l.status)}</StatusPill> },
    {
      key: "actions", header: "", align: "right",
      render: (l) => (
        <div className="flex items-center justify-end gap-0.5">
          {l.bookingId ? (
            <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-600" title={`Converted to booking #${l.bookingId}`}>
              <Icon name="CheckCircle2" size={13} /> #{l.bookingId}
            </span>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConvertLead(l)} aria-label="Convert to booking" title="Convert to booking">
              <Icon name="CalendarCheck" size={14} className="text-primary" />
            </Button>
          )}
          {aiReply && !l.bookingId && (
            <Button size="sm" variant="ghost" onClick={() => setReplyLead(l)} aria-label="Draft a reply" title="Draft a reply">
              <Icon name="Sparkles" size={14} className="text-bridal-gold" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => openEdit(l)} aria-label="Edit lead"><Icon name="Pencil" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(l)} aria-label="Remove lead"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Operate"
        title="Leads"
        description="Every inquiry in one inbox."
        actions={<div className="flex items-center gap-2"><OutboxStatus /><Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Log a lead</Button></div>}
      />

      <OutboxConflicts reenterOps={["capture_lead"]} onReenter={(p) => openReenter(p)} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total leads" value={all.length} icon="Inbox" />
        <StatCard label="New" value={count("new")} icon="Sparkles" />
        <StatCard label="Qualified" value={count("qualified")} icon="ShieldCheck" />
        <StatCard label="Booked" value={count("booked")} icon="CheckCircle2" trend="up" delta="converted" />
      </div>

      <DataTable
        filterQuery={search}
        onClearFilter={() => setSearch("")}
        caption="Leads"
        columns={columns}
        data={leads}
        getRowId={(l) => String(l.id)}
        loading={isLoading}
        error={isError ? "Couldn't load leads." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Inbox",
          title: "No leads yet",
          description: "WhatsApp, walk-in, phone and form inquiries all land here so none slip through.",
          action: <Button size="sm" onClick={openCreate}><Icon name="Plus" size={14} className="mr-1" /> Log a lead</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </div>
            {/* WWL-033 — the only way to get archived leads out of the inbox. */}
            {archivedCount > 0 && (
              <Button
                size="sm"
                variant={showArchived ? "secondary" : "ghost"}
                aria-pressed={showArchived}
                onClick={() => setShowArchived((v) => !v)}
              >
                <Icon name="Inbox" size={14} className="mr-1" />
                {showArchived ? `Hide archived (${archivedCount})` : `Show archived (${archivedCount})`}
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ImportButton target="leads" label="leads" />
              <ExportMenu selectedIds={selected} getRowId={(l) => String(l.id)}
                rows={leads}
                filename="leads"
                columns={[
                  { header: "Contact", value: (l) => l.contactName ?? "" },
                  { header: "Phone", value: (l) => l.contactPhone ?? "" },
                  { header: "Source", value: (l) => pretty(l.source) },
                  { header: "Event", value: (l) => pretty(l.eventType) },
                  { header: "Event date", value: (l) => fmtDate(l.eventDate) },
                  { header: "Budget", value: (l) => (l.estimatedBudget != null ? Number(l.estimatedBudget) || 0 : 0) },
                  { header: "Status", value: (l) => l.status },
                ]}
              />
            </div>
          </>
        }
        renderCard={(l) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{l.contactName || "Unknown"}</div>
              <div className="text-xs text-muted-foreground">{pretty(l.source)} · {pretty(l.eventType)} · {fmtDate(l.eventDate)}</div>
              <div className="mt-1"><StatusPill tone={TONE[l.status]}>{cap(l.status)}</StatusPill></div>
            </div>
            <MoneyCell amount={l.estimatedBudget != null ? Number(l.estimatedBudget) || null : null} tone="muted" className="text-sm" />
          </div>
        )}
      />

      <LeadFormDialog open={dialogOpen} onOpenChange={setDialogOpen} lead={editing} prefill={prefill} businessId={businessId} onSaved={invalidate} />

      {/* Phase 5 — only ever mounted once a lead's Sparkles action is clicked. */}
      <LeadReplyDialog lead={replyLead} onOpenChange={(o) => !o && setReplyLead(null)} />

      {/* F-8 — convert-to-booking. Prefills customer + event date from the
          lead; on success links the lead (sets bookingId + status='booked')
          and refetches so the "#X" converted badge appears. */}
      {convertLead && (
        <OfflineBookingDialog
          open={!!convertLead}
          onOpenChange={(v) => { if (!v) setConvertLead(null) }}
          initialDate={convertLead.eventDate ? new Date(convertLead.eventDate) : undefined}
          initialCustomer={{
            name: convertLead.contactName || undefined,
            phone: convertLead.contactPhone || undefined,
            email: convertLead.contactEmail || undefined,
          }}
          // WWL-034 — the lead's budget is the one number that made it worth
          // chasing. It used to be dropped at the exact moment the lead became
          // a booking, so a Rs 1,175,000 lead converted into a booking with no
          // amount captured at all.
          initialAmount={
            convertLead.estimatedBudget != null && Number(convertLead.estimatedBudget) > 0
              ? Number(convertLead.estimatedBudget)
              : null
          }
          onCreated={async (bookingId) => {
            try {
              await LeadAPI.linkBooking(convertLead.id, bookingId)
              toast.success(`Lead converted to booking #${bookingId}`)
            } catch (e: any) {
              toast.error(e?.response?.data?.message || "Booking created, but the lead couldn't be linked. You can mark it Booked manually.")
            }
          }}
          onSuccess={async () => { setConvertLead(null); invalidate() }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this lead?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.contactName || "This lead"} will be removed. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && removeMut.mutate(deleting.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default LeadsRedesignedView
