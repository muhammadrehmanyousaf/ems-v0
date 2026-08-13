"use client"

/**
 * Staff — redesigned (Track C). Wired to StaffAPI.listMembers(); rendered through
 * the primitives. Route /dashboard/staff.
 */

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { errorMessage } from "@/lib/utils/api-error"
import { useRecordBusinessId } from "@/hooks/use-record-business-id"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { StaffAPI, type StaffMember } from "@/lib/api/staff"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { StaffFormDialog } from "@/components/dashboard/mainScreens/staff/redesigned/staff-form-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { todayInKarachi } from "@/lib/utils/pk-date"
import { ImportButton } from "@/components/dashboard/shared/import-button"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PayrollTab } from "@/components/dashboard/mainScreens/staff/redesigned/payroll-tab"
import { StaffLoginControl } from "@/components/staff-portal/staff-login-control"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const initials = (name: string) => (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")

const rateLabel = (m: StaffMember) =>
  num(m.monthlySalary) > 0
    ? `${formatPkr(num(m.monthlySalary))} / mo`
    : num(m.defaultDihariRate) > 0
      ? `${formatPkr(num(m.defaultDihariRate))} / day`
      : "—"

export function StaffRedesignedView() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<StaffMember | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<StaffMember | null>(null)
  const { data: businesses } = useQuery({ queryKey: ["my-businesses"], queryFn: () => BusinessesAPI.getUserBusinesses() })
  /**
   * WWL-293/311/332/350 — this was `businesses?.[0]?.id`, so under "All venues"
   * a new record landed on whichever venue happened to be first in the array,
   * silently. The hook returns undefined rather than guessing when there is no
   * right answer; the create dialog then asks.
   */
  const businessId = useRecordBusinessId()
  const activeBusinessId = useActiveBusinessId()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams?.get("tab") === "payroll" ? "payroll" : "roster"
  const activeBusinessName =
    businesses?.find((b) => b.id === activeBusinessId)?.name ?? null
  const invalidate = () => qc.invalidateQueries({ queryKey: ["staff-redesigned"] })
  const openCreate = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (m: StaffMember) => { setEditing(m); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => StaffAPI.removeMember(id),
    onSuccess: () => { showSuccessToast("Staff removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't remove staff")),
  })
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    /**
     * WWL-272 — `/api/v1/staff` is in BUSINESS_SCOPED_PREFIXES, so the axios
     * interceptor appends `?businessId=` to every GET and the request is
     * correctly scoped. The cache key did not mention the venue, so venue A's
     * crew and venue B's crew shared one entry — a structural collision waiting
     * for a slow network to expose it.
     */
    queryKey: ["staff-redesigned", activeBusinessId ?? "all"],
    queryFn: () => StaffAPI.listMembers(),
  })

  const all = data?.members ?? []
  const members = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((m) => [m.fullName, m.role, m.phoneNumber].some((v) => (v ?? "").toLowerCase().includes(q)))
  }, [all, search])

  const active = all.filter((m) => m.isActive).length
  const salaried = all.filter((m) => num(m.monthlySalary) > 0).length
  const dihari = all.filter((m) => num(m.defaultDihariRate) > 0 && !(num(m.monthlySalary) > 0)).length

  const columns: Column<StaffMember>[] = [
    {
      key: "name",
      header: "Name",
      // The name opens the member's own page — what they are still owed and
      // every shift they worked. Without this the route is unreachable.
      sortKey: "name",
      sortValue: (m) => m.fullName || "",
      // The <Link> that was here is the table's `rowHref` now — same anchor, same
      // cell, plus the whole row. Joining them was not an option: an anchor
      // inside an anchor is invalid and the browser drops the inner one, so a
      // row link added on top would have killed this working one.
      render: (m) => (
        <span className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(m.fullName)}</span>
          <span className="font-medium">{m.fullName}</span>
        </span>
      ),
    },
    { key: "role", header: "Role", cellClassName: "text-muted-foreground", sortKey: "role", sortValue: (m) => m.role || "", render: (m) => cap(m.role) },
    { key: "space", header: "Space", cellClassName: "text-muted-foreground", render: (m) => m.defaultSubVenue?.name || "—" },
    { key: "type", header: "Type", render: (m) => <StatusPill tone="neutral">{cap(m.employmentType)}</StatusPill> },
    { key: "phone", header: "Phone", cellClassName: "text-muted-foreground", render: (m) => m.phoneNumber || "—" },
    { key: "rate", header: "Rate", align: "right", cellClassName: "tabular-nums", sortKey: "rate", sortValue: (m) => rateLabel(m), render: (m) => rateLabel(m) },
    { key: "status", header: "Status", sortKey: "status", sortValue: (m) => (m.isActive ? "Active" : "Inactive"), render: (m) => <StatusPill tone={m.isActive ? "success" : "neutral"}>{m.isActive ? "Active" : "Inactive"}</StatusPill> },
    {
      key: "actions", header: "", align: "right",
      render: (m) => (
        <div className="flex items-center justify-end gap-0.5">
          {/* Give this staff member their own login to the staff portal. The
              control and the whole /staff/me surface behind it were built in
              Phase 1 and have never been reachable — the vendor screen that
              rendered it was the legacy one. */}
          <StaffLoginControl member={m} onChanged={invalidate} />
          <Button size="sm" variant="ghost" onClick={() => openEdit(m)} aria-label="Edit staff"><Icon name="Pencil" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(m)} aria-label="Remove staff"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
        </div>
      ),
    },
  ]

  const businessOptions = React.useMemo(
    () => (businesses ?? []).map((b) => ({ id: b.id, name: b.name || `Business #${b.id}` })),
    [businesses],
  )

  return (
    /**
      * WWL-267 — `<Tabs defaultValue="roster">` with no onValueChange and no
      * URL sync, so switching to Shifts & payroll left the address bar at
      * /dashboard/staff: a vendor could not bookmark payroll or send their
      * accountant a link to it, and every reload threw the choice away.
      */
    <Tabs
      value={tab}
      onValueChange={(v) => {
        const qs = new URLSearchParams(searchParams?.toString() ?? "")
        if (v === "roster") qs.delete("tab")
        else qs.set("tab", v)
        const q = qs.toString()
        router.replace(q ? `?${q}` : "?", { scroll: false })
      }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* One header for both tabs, with the switcher on the title's own row.
          The tablist used to sit alone above it: measured on production it put
          the title at 165, the first stat at 220 and the staff table at 385 of
          a 674px viewport. It also meant Shifts & payroll had no title at all —
          the header lived inside the roster tab only. */}
      <PageHeader
        eyebrow="Operate"
        title="Staff & payroll"
        description="Your crew, roles and pay rates."
        tabs={
          <TabsList>
            <TabsTrigger value="roster">
              <Icon name="Users" size={15} className="mr-1.5" /> Roster
            </TabsTrigger>
            <TabsTrigger value="payroll">
              <Icon name="FileText" size={15} className="mr-1.5" /> Shifts &amp; payroll
            </TabsTrigger>
          </TabsList>
        }
        actions={
          tab === "roster" ? (
            <Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Add staff</Button>
          ) : undefined
        }
      />

      <TabsContent value="roster" className="space-y-6">

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total staff" value={all.length} icon="Users" />
        <StatCard label="Active" value={active} icon="ShieldCheck" trend="up" />
        <StatCard label="On salary" value={salaried} icon="Wallet" />
        <StatCard label="Daily (dihari)" value={dihari} icon="Clock" />
      </div>

      <DataTable
        filterQuery={search}
        onClearFilter={() => setSearch("")}
        caption="Staff"
        columns={columns}
        data={members}
        getRowId={(m) => String(m.id)}
        /**
         * The row opens the record.
         *
         * Swept across the portal: 38 screens use this table, 4 passed row
         * navigation to it. The destination here already existed and was already
         * linked from inside the row — so this is not a new door, it is the
         * whole row becoming the target instead of one small control at the end
         * of it.
         */
        rowHref={(m) => `/dashboard/staff/${m.id}`}
        loading={isLoading}
        error={isError ? "Couldn't load staff." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Users",
          title: "No staff yet",
          description: "Add your shooters, editors and assistants to track shifts, dihari and payroll.",
          action: <Button size="sm" onClick={openCreate}><Icon name="Plus" size={14} className="mr-1" /> Add staff</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ImportButton target="staff" label="staff" />
              {/**
                * WWL-266 — `staff.csv` carried 33 people's names, mobile
                * numbers and pay with nothing to say it was personal data.
                * Three defects in one file:
                *   - a null salary exported as 0, so every dihari worker read
                *     as being on a Rs 0 salary and every salaried one as having
                *     a Rs 0 day rate — a blank is not a zero on a pay column;
                *   - no venue column, so "Arshad Ali" appeared three times
                *     distinguishable only by phone number;
                *   - role and type exported raw snake_case where the table
                *     capitalises them.
                * The filename now carries the venue and the date too, so two
                * downloads a minute apart are not the same file.
                */}
              <ExportMenu
                selectedIds={selected}
                getRowId={(m) => String(m.id)}
                rows={members}
                filename={`staff-${activeBusinessName ? activeBusinessName.replace(/\s+/g, "-").toLowerCase() : "all-venues"}-${todayInKarachi()}`}
                sensitiveNote="This file contains staff names, mobile numbers and pay. Treat it like a payslip — don't forward it in a group."
                columns={[
                  { header: "Name", value: (m) => m.fullName },
                  { header: "Venue", value: () => activeBusinessName ?? "" },
                  { header: "Role", value: (m) => cap(m.role) },
                  { header: "Type", value: (m) => cap(m.employmentType) },
                  { header: "Phone", value: (m) => m.phoneNumber ?? "" },
                  // A blank stays blank: 0 is a claim about someone's pay.
                  { header: "Monthly salary", value: (m) => (m.monthlySalary == null ? "" : num(m.monthlySalary)) },
                  { header: "Dihari rate", value: (m) => (m.defaultDihariRate == null ? "" : num(m.defaultDihariRate)) },
                  { header: "Active", value: (m) => (m.isActive ? "Yes" : "No") },
                ]}
              />
            </div>
          </>
        }
        renderCard={(m) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(m.fullName)}</span>
              <div className="min-w-0">
                <div className="truncate font-medium">{m.fullName}</div>
                <div className="text-xs text-muted-foreground">{cap(m.role)} · {rateLabel(m)}</div>
              </div>
            </div>
            <StatusPill tone={m.isActive ? "success" : "neutral"}>{m.isActive ? "Active" : "Inactive"}</StatusPill>
          </div>
        )}
      />

      <StaffFormDialog open={dialogOpen} onOpenChange={setDialogOpen} member={editing} businessId={businessId} onSaved={invalidate} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this staff member?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.fullName || "This member"} will be removed. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && removeMut.mutate(deleting.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </TabsContent>

      <TabsContent value="payroll">
        <PayrollTab businesses={businessOptions} />
      </TabsContent>
    </Tabs>
  )
}

export default StaffRedesignedView
