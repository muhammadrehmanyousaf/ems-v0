"use client"

/**
 * Users (Admin) — redesigned (Track C). Wired to UsersAPI.getAll(); rendered
 * through the primitives. Read-only; original screen untouched. Route
 * /dashboard/users-new. Mirrors the Staff redesigned view 1:1.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { UsersAPI, type ApiUser } from "@/lib/api/dashboard"
import { UserFormDialog } from "@/components/dashboard/mainScreens/users/redesigned/user-form-dialog"
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
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString()
}
const initials = (name?: string | null) =>
  (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")

export function UsersAdminRedesignedView() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ApiUser | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<ApiUser | null>(null)
  const invalidate = () => qc.invalidateQueries({ queryKey: ["users-admin-redesigned"] })
  const openCreate = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (u: ApiUser) => { setEditing(u); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => UsersAPI.delete(id),
    onSuccess: () => { showSuccessToast("User removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't remove user"),
  })

  // Server-side paging. The endpoint defaults to limit=10, so reading the
  // unpaged response and printing `rows.length` reported "Total users 9"
  // against a real total of 3,304 — and left pages 2..N unreachable.
  const PAGE_SIZE = 25
  const [page, setPage] = React.useState(1)

  // Search runs server-side (see UsersAPI.getPage). Debounced so typing doesn't
  // fire a request per keystroke, and any change resets to page 1 — otherwise a
  // narrower result set can leave you stranded past its last page.
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])
  React.useEffect(() => { setPage(1) }, [debouncedSearch])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["users-admin-redesigned", page, debouncedSearch],
    queryFn: () => UsersAPI.getPage(page, PAGE_SIZE, debouncedSearch),
    placeholderData: (prev) => prev,
  })

  const rows = data?.results ?? []
  const total = data?.meta?.total ?? 0
  const totalPages = Math.max(data?.meta?.totalPages ?? 1, 1)
  // The server already applied `search`; filtering again here would only ever
  // narrow the current page.
  const users = rows

  // Page-scoped counts. `customers` uses `!u.isVendor`, NOT `=== false`:
  // isVendor is nullable, so customers stored as null were counted by neither
  // branch — the tile read "Customers 0" while the very same rows rendered a
  // "Customer" badge from the truthy test in the Type column below.
  const vendors = rows.filter((u) => !!u.isVendor).length
  const customers = rows.filter((u) => !u.isVendor).length
  const active = rows.filter((u) => u.active).length

  const columns: Column<ApiUser>[] = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(u.fullName)}</span>
          <span className="font-medium">{u.fullName || "—"}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", cellClassName: "text-muted-foreground", render: (u) => u.email || "—" },
    { key: "phone", header: "Phone", cellClassName: "text-muted-foreground", render: (u) => u.phoneNumber || "—" },
    {
      key: "type",
      header: "Type",
      render: (u) => (
        <StatusPill tone={(u.isVendor ? "info" : "neutral") as StatusTone}>{u.isVendor ? "Vendor" : "Customer"}</StatusPill>
      ),
    },
    { key: "city", header: "City", cellClassName: "text-muted-foreground", render: (u) => u.city || "—" },
    {
      key: "status",
      header: "Status",
      render: (u) => <StatusPill tone={u.active ? "success" : "neutral"}>{u.active ? "Active" : "Inactive"}</StatusPill>,
    },
    {
      key: "actions", header: "", align: "right",
      render: (u) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button size="sm" variant="ghost" onClick={() => openEdit(u)} aria-label="Edit user"><Icon name="Pencil" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(u)} aria-label="Remove user"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description="All registered vendors and customers."
        actions={<Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Add user</Button>}
      />

      {/*
        "Total users" is the platform-wide figure from meta.total. The other
        three are counted from the loaded page and are labelled as such — the
        endpoint supports only paginate/sort/search (no isVendor or active
        filter), so a truthful platform-wide breakdown isn't available without a
        backend change. Better a scoped label than a confident wrong number.
      */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total users" value={total} icon="Users" />
        <StatCard label="Vendors (this page)" value={vendors} icon="Building2" />
        <StatCard label="Customers (this page)" value={customers} icon="Users" />
        <StatCard label="Active (this page)" value={active} icon="ShieldCheck" />
      </div>

      <DataTable
        columns={columns}
        data={users}
        getRowId={(u) => String(u.id)}
        loading={isLoading}
        error={isError ? "Couldn't load users." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Users",
          title: "No users yet",
          description: "Registered vendors and customers will appear here.",
          action: <Button size="sm" onClick={openCreate}><Icon name="Plus" size={14} className="mr-1" /> Add user</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(u) => String(u.id)} rows={users} filename="users" columns={[
                { header: "Name", value: (u) => u.fullName ?? "" },
                { header: "Email", value: (u) => u.email ?? "" },
                { header: "Phone", value: (u) => u.phoneNumber ?? "" },
                { header: "Type", value: (u) => (u.isVendor ? "Vendor" : "Customer") },
                { header: "City", value: (u) => u.city ?? "" },
                { header: "Status", value: (u) => (u.active ? "Active" : "Inactive") },
                { header: "Joined", value: (u) => fmtDate(u.createdAt) },
              ]} />
            </div>
          </>
        }
        renderCard={(u) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(u.fullName)}</span>
              <div className="min-w-0">
                <div className="truncate font-medium">{u.fullName || "—"}</div>
                <div className="text-xs text-muted-foreground">{(u.isVendor ? "Vendor" : "Customer")} · {u.city || "—"}</div>
              </div>
            </div>
            <StatusPill tone={u.active ? "success" : "neutral"}>{u.active ? "Active" : "Inactive"}</StatusPill>
          </div>
        )}
      />

      {/* Pagination — without this the screen showed page 1 of 3,304 users and
          offered no way to reach the rest. Hidden when everything fits. */}
      {totalPages > 1 && (
        <nav
          aria-label="Users pagination"
          className="flex flex-wrap items-center justify-between gap-3 text-sm"
        >
          <p className="text-muted-foreground">
            Page {page} of {totalPages}
            <span className="hidden sm:inline"> · {total.toLocaleString()} users</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
            >
              <Icon name="ChevronLeft" size={14} className="mr-1" /> Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
            >
              Next <Icon name="ChevronRight" size={14} className="ml-1" />
            </Button>
          </div>
        </nav>
      )}

      <UserFormDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editing} onSaved={invalidate} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this user?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.fullName || "This user"} will be removed. This can't be undone.</AlertDialogDescription>
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

export default UsersAdminRedesignedView
