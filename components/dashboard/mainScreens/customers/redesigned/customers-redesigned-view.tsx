"use client"

/**
 * Customers — redesigned (Track C). Wired to CustomersAPI.getAll() and rendered
 * through the primitives. Read-only presentation; the original Customers screen
 * is untouched. Mounted at /dashboard/customers-new.
 */

import * as React from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CustomersAPI, OfflineCustomersAPI, type ApiCustomer } from "@/lib/api/dashboard"
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

  /**
   * The manually-added client book, merged in below.
   *
   * This screen listed GET /customers — customers derived from bookings — while
   * its own "Add customer" button wrote to POST /offlineCustomers. Two disjoint
   * datasets behind one screen, so a vendor added a customer, it saved, and it
   * was nowhere: not in the table, not in the count, not findable by search.
   * Adding them again returned "You already have a customer with this phone
   * number" — a contradiction with no way out.
   *
   * Measured on production: 22 booking-derived rows, 4 offline rows, no overlap.
   * Three of those four were the vendor's real customers, invisible to them.
   *
   * Its own query so a failure here cannot blank the main list — an offline
   * book that will not load is worse as a blank screen than as a short one.
   */
  const offlineQ = useQuery({
    queryKey: ["customers-redesigned", "offline"],
    queryFn: () => OfflineCustomersAPI.list(),
    retry: false,
  })

  const all = React.useMemo<ApiCustomer[]>(() => {
    const derived = data?.customers ?? []
    // Same person can exist in both — they walked in, then booked online. Match
    // on digits so "0300 1112223" and "03001112223" are one customer, not two.
    const digits = (v: string | null | undefined) => String(v ?? "").replace(/\D/g, "")
    const seenPhone = new Set(derived.map((c) => digits(c.phone)).filter(Boolean))
    const seenEmail = new Set(
      derived.map((c) => (c.email ?? "").trim().toLowerCase()).filter(Boolean),
    )
    const extra: ApiCustomer[] = (offlineQ.data ?? [])
      .filter((o) => {
        const p = digits(o.phoneno)
        const e = (o.email ?? "").trim().toLowerCase()
        return !(p && seenPhone.has(p)) && !(e && seenEmail.has(e))
      })
      .map((o) => ({
        _id: `offline-${o.id}`,
        name: o.name ?? "—",
        email: o.email ?? "",
        phone: o.phoneno ?? "",
        address: o.address ?? "",
        // Genuinely zero: an offline customer has no platform booking yet. The
        // column reads 0 rather than inventing a number.
        total_booking: 0,
        last_booking: "",
      }))
    return [...derived, ...extra]
  }, [data?.customers, offlineQ.data])
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
      sortKey: "name",
      sortValue: (c) => c.name || "",
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
    { key: "bookings", header: "Bookings", align: "right", sortKey: "bookings", sortValue: (c) => Number(c.total_booking) || 0, render: (c) => <span className="tabular-nums font-medium">{c.total_booking ?? 0}</span> },
    { key: "last", header: "Last booking", cellClassName: "text-muted-foreground", sortKey: "last", sortValue: (c) => c.last_booking || null, render: (c) => fmtDate(c.last_booking) },
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
        description="Your client book."
        actions={<Button onClick={() => setDialogOpen(true)}><Icon name="Plus" size={16} className="mr-1.5" /> Add customer</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total customers" value={all.length} icon="Users" />
        <StatCard label="Total bookings" value={totalBookings} icon="Calendar" />
        <StatCard label="Repeat clients" value={repeat} icon="Heart" trend="up" delta="loyal" />
        <StatCard label="Avg / customer" value={all.length ? (totalBookings / all.length).toFixed(1) : "0"} icon="TrendingUp" />
      </div>

      <DataTable
        filterQuery={search}
        onClearFilter={() => setSearch("")}
        caption="Customers"
        columns={columns}
        data={customers}
        getRowId={(c) => c._id}
        /**
         * The row opens the customer. It already had an "Open detail" icon in
         * the actions column — so the destination existed and worked — but the
         * row itself was dead (`cursor: auto`), which is the same half-clickable
         * shape Leads had: a person learns rows are inert, then one small icon
         * at the end of the row is the exception.
         *
         * The actions column keeps its explicit icons; the row is now the large
         * target for the same place. `_id` IS the email here, hence the encode.
         *
         * Sorting is client-side: this screen loads the customer list in one
         * call and pages it locally, so ordering by booking count or last
         * booking here is the whole set, not the visible page.
         */
        rowHref={(c) => `/dashboard/customers/${encodeURIComponent(c._id)}`}
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
