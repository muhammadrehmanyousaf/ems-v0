"use client"

/**
 * Customers — redesigned (Track C). Wired to CustomersAPI.getAll() and rendered
 * through the primitives. Read-only presentation; the original Customers screen
 * is untouched. Mounted at /dashboard/customers-new.
 */

import * as React from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CustomersAPI, type ApiCustomer } from "@/lib/api/dashboard"
import { AddCustomerDialog } from "@/components/dashboard/mainScreens/customers/redesigned/add-customer-dialog"
import { ViewCustomerDialog } from "@/components/dashboard/mainScreens/customers/customersListing/components/view-customer-dialog"
import ImportCustomersDialog from "@/components/dashboard/mainScreens/customers/customersListing/components/import-customers-dialog"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

const initials = (name: string) =>
  (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")

export function CustomersRedesignedView() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [viewCustomer, setViewCustomer] = React.useState<ApiCustomer | null>(null)
  const invalidate = () => qc.invalidateQueries({ queryKey: ["customers-redesigned"] })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["customers-redesigned"],
    queryFn: () => CustomersAPI.getAll(1, 100),
  })

  const all = data?.customers ?? []
  const customers = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((c) => [c.name, c.phone, c.email].some((v) => (v ?? "").toLowerCase().includes(q)))
  }, [all, search])

  const totalBookings = all.reduce((s, c) => s + (Number(c.total_booking) || 0), 0)
  const repeat = all.filter((c) => (Number(c.total_booking) || 0) > 1).length

  const columns: Column<ApiCustomer>[] = [
    {
      key: "name",
      header: "Customer",
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(c.name)}
          </span>
          <span className="font-medium">{c.name || "—"}</span>
        </div>
      ),
    },
    { key: "phone", header: "Phone", cellClassName: "text-muted-foreground", render: (c) => c.phone || "—" },
    { key: "email", header: "Email", cellClassName: "text-muted-foreground", render: (c) => c.email || "—" },
    { key: "bookings", header: "Bookings", align: "right", render: (c) => <span className="tabular-nums font-medium">{c.total_booking ?? 0}</span> },
    { key: "last", header: "Last booking", cellClassName: "text-muted-foreground", render: (c) => fmtDate(c.last_booking) },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "88px",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Quick view"
            onClick={() => setViewCustomer(c)}
          >
            <Icon name="Eye" size={16} />
            <span className="sr-only">Quick view</span>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Open detail">
            <Link href={`/dashboard/customers/${encodeURIComponent(c._id)}`}>
              <Icon name="ExternalLink" size={16} />
              <span className="sr-only">Open detail</span>
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Operate"
        title="Customers"
        description="Your client book — redesigned, wired to live data."
        actions={<Button onClick={() => setDialogOpen(true)}><Icon name="Plus" size={16} className="mr-1.5" /> Add customer</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total customers" value={all.length} icon="Users" />
        <StatCard label="Total bookings" value={totalBookings} icon="Calendar" />
        <StatCard label="Repeat clients" value={repeat} icon="Heart" trend="up" delta="loyal" />
        <StatCard label="Avg / customer" value={all.length ? (totalBookings / all.length).toFixed(1) : "0"} icon="TrendingUp" />
      </div>

      <DataTable
        columns={columns}
        data={customers}
        getRowId={(c) => c._id}
        loading={isLoading}
        error={isError ? "Couldn't load customers." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Users",
          title: "No customers yet",
          description: "Customers appear here as you take bookings. Import your existing client list to get a head start.",
          action: <Button size="sm" onClick={() => setDialogOpen(true)}><Icon name="Plus" size={14} className="mr-1" /> Add customer</Button>,
          secondaryAction: <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><Icon name="Upload" size={14} className="mr-1" /> Import</Button>,
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
                placeholder="Search customers…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(c) => c._id}
                rows={customers}
                filename="customers"
                columns={[
                  { header: "Name", value: (c) => c.name },
                  { header: "Phone", value: (c) => c.phone },
                  { header: "Email", value: (c) => c.email },
                  { header: "Bookings", value: (c) => c.total_booking ?? 0 },
                  { header: "Last booking", value: (c) => fmtDate(c.last_booking) },
                ]}
              />
            </div>
          </>
        }
        renderCard={(c) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials(c.name)}
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.phone}</div>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="font-medium tabular-nums">{c.total_booking ?? 0} bookings</div>
              <div className="text-xs text-muted-foreground">{fmtDate(c.last_booking)}</div>
            </div>
          </div>
        )}
      />

      <AddCustomerDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={invalidate} />
      <ImportCustomersDialog open={importOpen} onOpenChange={setImportOpen} onImported={invalidate} />
      <ViewCustomerDialog
        open={viewCustomer !== null}
        onOpenChange={(v) => { if (!v) setViewCustomer(null) }}
        customer={viewCustomer}
      />
    </div>
  )
}

export default CustomersRedesignedView
