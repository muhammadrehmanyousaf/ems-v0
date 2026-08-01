"use client"

/**
 * Vendors (admin) — redesigned (Track C). Wired to VendorsAPI.getAll(); rendered
 * through the primitives. Read-only; original screen untouched. Route
 * /dashboard/vendors-new. Mirrors the staff redesigned view 1:1.
 */

import * as React from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { VendorsAPI, UsersAPI, type ApiUser } from "@/lib/api/dashboard"
import { VendorEditDialog } from "@/components/dashboard/mainScreens/vendors/redesigned/vendor-edit-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const initials = (name?: string | null) =>
  (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export function VendorsAdminRedesignedView() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [editing, setEditing] = React.useState<ApiUser | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<ApiUser | null>(null)
  const invalidate = () => qc.invalidateQueries({ queryKey: ["vendors-admin-redesigned"] })
  const reviewMut = useMutation({
    mutationFn: ({ id, approve }: { id: number; approve: boolean }) => VendorsAPI.changeProfileStatus(id, approve),
    onSuccess: (_d, v) => { showSuccessToast(v.approve ? "Vendor approved" : "Approval revoked"); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't update approval"),
  })
  const removeMut = useMutation({
    mutationFn: (id: number) => UsersAPI.delete(id),
    onSuccess: () => { showSuccessToast("Vendor removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't remove vendor"),
  })

  // Server-side paging. The endpoint defaults to limit=10, so the unpaged read
  // reported "Total vendors 10" while the Roles screen showed the true 3,278
  // for the same role, two clicks away.
  const PAGE_SIZE = 25
  const [page, setPage] = React.useState(1)

  // Search runs server-side; filtering one page would have searched 25 rows out
  // of 3,278. Debounced, and any change resets to page 1 so a narrower result
  // set can't strand you past its last page.
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])
  React.useEffect(() => { setPage(1) }, [debouncedSearch])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["vendors-admin-redesigned", page, debouncedSearch],
    queryFn: () => VendorsAPI.getPage(page, PAGE_SIZE, debouncedSearch),
    placeholderData: (prev) => prev,
  })

  const all = data?.results ?? []
  const total = data?.meta?.total ?? 0
  const totalPages = Math.max(data?.meta?.totalPages ?? 1, 1)
  // Server already applied `search`; re-filtering here would only narrow the page.
  const rows = all

  const approved = all.filter((r) => r.reviewProfile === true).length
  const pending = all.filter((r) => r.reviewProfile === false).length
  const active = all.filter((r) => r.active === true).length

  const columns: Column<ApiUser>[] = [
    {
      key: "vendor",
      header: "Vendor",
      // The name opens the vendor's own page. Without this the detail route
      // exists and is unreachable — the exact shape of the 37 dead routes.
      render: (r) => (
        <Link href={`/dashboard/vendors/${r.id}`} className="flex items-center gap-2.5 group">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(r.fullName)}</span>
          <span className="font-medium group-hover:text-primary group-hover:underline">{r.fullName || "—"}</span>
        </Link>
      ),
    },
    { key: "type", header: "Type", render: (r) => <StatusPill tone="neutral">{cap(r.vendorType)}</StatusPill> },
    { key: "city", header: "City", cellClassName: "text-muted-foreground", render: (r) => r.city || "—" },
    { key: "phone", header: "Phone", cellClassName: "text-muted-foreground", render: (r) => r.phoneNumber || "—" },
    { key: "joined", header: "Joined", cellClassName: "text-muted-foreground", render: (r) => fmtDate(r.createdAt) },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const tone: StatusTone = r.reviewProfile === true ? "success" : "warning"
        return <StatusPill tone={tone}>{r.reviewProfile === true ? "Approved" : "Pending"}</StatusPill>
      },
    },
    {
      key: "actions", header: "", align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-0.5">
          {r.reviewProfile === true ? (
            <Button size="sm" variant="ghost" disabled={reviewMut.isPending} onClick={() => reviewMut.mutate({ id: r.id, approve: false })} aria-label="Revoke approval"><Icon name="XCircle" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
          ) : (
            <Button size="sm" variant="outline" disabled={reviewMut.isPending} onClick={() => reviewMut.mutate({ id: r.id, approve: true })}><Icon name="Check" size={14} className="mr-1 text-emerald-600" /> Approve</Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setEditing(r)} aria-label="Edit vendor"><Icon name="Pencil" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(r)} aria-label="Remove vendor"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Admin"
        title="Vendors"
        description="Every vendor on the platform — approval status, type and city."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* "Total vendors" is platform-wide from meta.total. The other three are
            counted from the loaded page and labelled as such — the endpoint has
            no reviewProfile/active filter, so a truthful platform-wide breakdown
            isn't available without a backend change. */}
        <StatCard label="Total vendors" value={total} icon="Building2" />
        <StatCard label="Approved (this page)" value={approved} icon="CheckCircle2" />
        <StatCard label="Pending review (this page)" value={pending} icon="Clock" />
        <StatCard label="Active (this page)" value={active} icon="ShieldCheck" />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => String(r.id)}
        loading={isLoading}
        error={isError ? "Couldn't load vendors." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Building2",
          title: "No vendors yet",
          description: "Vendors who register on the platform will appear here for review and approval.",
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendors…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(r) => String(r.id)} rows={rows} filename="vendors" columns={[
                { header: "Vendor", value: (r) => r.fullName ?? "" },
                { header: "Email", value: (r) => r.email ?? "" },
                { header: "Type", value: (r) => r.vendorType ?? "" },
                { header: "City", value: (r) => r.city ?? "" },
                { header: "Phone", value: (r) => r.phoneNumber ?? "" },
                { header: "Joined", value: (r) => fmtDate(r.createdAt) },
                { header: "Status", value: (r) => (r.reviewProfile === true ? "Approved" : "Pending") },
                { header: "Active", value: (r) => (r.active ? "Yes" : "No") },
                { header: "Balance", value: (r) => num(r.balance) },
              ]} />
            </div>
          </>
        }
        renderCard={(r) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(r.fullName)}</span>
              <div className="min-w-0">
                <div className="truncate font-medium">{r.fullName || "—"}</div>
                <div className="text-xs text-muted-foreground">{cap(r.vendorType)} · {r.city || "—"}</div>
              </div>
            </div>
            <StatusPill tone={r.reviewProfile === true ? "success" : "warning"}>{r.reviewProfile === true ? "Approved" : "Pending"}</StatusPill>
          </div>
        )}
      />

      {/* Without this, only the first 25 of 3,278 vendors were reachable. */}
      {totalPages > 1 && (
        <nav aria-label="Vendors pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            Page {page} of {totalPages}
            <span className="hidden sm:inline"> · {total.toLocaleString()} vendors</span>
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || isLoading}>
              <Icon name="ChevronLeft" size={14} className="mr-1" /> Previous
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isLoading}>
              Next <Icon name="ChevronRight" size={14} className="ml-1" />
            </Button>
          </div>
        </nav>
      )}

      <VendorEditDialog open={!!editing} onOpenChange={(v) => !v && setEditing(undefined)} vendor={editing} onSaved={invalidate} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this vendor?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.fullName || "This vendor"} will be removed. This can't be undone.</AlertDialogDescription>
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

export default VendorsAdminRedesignedView
