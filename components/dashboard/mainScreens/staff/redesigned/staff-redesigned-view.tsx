"use client"

/**
 * Staff — redesigned (Track C). Wired to StaffAPI.listMembers(); rendered through
 * the primitives. Read-only; original screen untouched. Route /dashboard/staff-new.
 */

import * as React from "react"
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
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

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
  const businessId = businesses?.[0]?.id
  const invalidate = () => qc.invalidateQueries({ queryKey: ["staff-redesigned"] })
  const openCreate = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (m: StaffMember) => { setEditing(m); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => StaffAPI.removeMember(id),
    onSuccess: () => { showSuccessToast("Staff removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't remove staff"),
  })
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["staff-redesigned"],
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
      render: (m) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(m.fullName)}</span>
          <span className="font-medium">{m.fullName}</span>
        </div>
      ),
    },
    { key: "role", header: "Role", cellClassName: "text-muted-foreground", render: (m) => cap(m.role) },
    { key: "type", header: "Type", render: (m) => <StatusPill tone="neutral">{cap(m.employmentType)}</StatusPill> },
    { key: "phone", header: "Phone", cellClassName: "text-muted-foreground", render: (m) => m.phoneNumber || "—" },
    { key: "rate", header: "Rate", align: "right", cellClassName: "tabular-nums", render: (m) => rateLabel(m) },
    { key: "status", header: "Status", render: (m) => <StatusPill tone={m.isActive ? "success" : "neutral"}>{m.isActive ? "Active" : "Inactive"}</StatusPill> },
    {
      key: "actions", header: "", align: "right",
      render: (m) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button size="sm" variant="ghost" onClick={() => openEdit(m)} aria-label="Edit staff"><Icon name="Pencil" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(m)} aria-label="Remove staff"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Operate"
        title="Team & Shooters"
        description="Your crew, roles and pay rates — redesigned, wired to live data."
        actions={<Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Add staff</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total staff" value={all.length} icon="Users" />
        <StatCard label="Active" value={active} icon="ShieldCheck" trend="up" />
        <StatCard label="On salary" value={salaried} icon="Wallet" />
        <StatCard label="Daily (dihari)" value={dihari} icon="Clock" />
      </div>

      <DataTable
        columns={columns}
        data={members}
        getRowId={(m) => String(m.id)}
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
              <ExportMenu selectedIds={selected} getRowId={(m) => String(m.id)} rows={members} filename="staff" columns={[
                { header: "Name", value: (m) => m.fullName },
                { header: "Role", value: (m) => m.role ?? "" },
                { header: "Type", value: (m) => m.employmentType ?? "" },
                { header: "Phone", value: (m) => m.phoneNumber ?? "" },
                { header: "Monthly salary", value: (m) => num(m.monthlySalary) },
                { header: "Dihari rate", value: (m) => num(m.defaultDihariRate) },
                { header: "Active", value: (m) => (m.isActive ? "Yes" : "No") },
              ]} />
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
    </div>
  )
}

export default StaffRedesignedView
