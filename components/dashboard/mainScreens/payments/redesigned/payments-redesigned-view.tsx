"use client"

/**
 * Payments (revenue) — redesigned (Track C, computed). Wired to
 * PaymentsAPI.getVendorRevenue(); rendered through the primitives. Read-only;
 * original screen untouched. Route /dashboard/payments-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { PaymentsAPI } from "@/lib/api/dashboard"
import type { VendorPayment } from "@/lib/dashboard-types"
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
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}
const payTone = (s?: string): StatusTone => {
  const v = (s || "").toLowerCase()
  if (v.includes("partial")) return "warning"
  if (v.includes("refund")) return "neutral"
  if (v.includes("paid")) return "success"
  return "error"
}

export function PaymentsRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["payments-redesigned"],
    queryFn: () => PaymentsAPI.getVendorRevenue(),
  })

  const stats = data?.stats
  const all = (data?.payments ?? []) as VendorPayment[]
  const payments = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((p) => [p.customerName, p.customerPhone, p.businessName].some((v) => (v ?? "").toLowerCase().includes(q)))
  }, [all, search])

  const columns: Column<VendorPayment>[] = [
    { key: "customer", header: "Customer", render: (p) => <span className="font-medium">{p.customerName || "—"}</span> },
    { key: "date", header: "Event date", cellClassName: "text-muted-foreground", render: (p) => fmtDate(p.bookingDate) },
    { key: "total", header: "Total", align: "right", render: (p) => <MoneyCell amount={num(p.totalAmount)} /> },
    { key: "received", header: "Received", align: "right", render: (p) => <MoneyCell amount={num(p.received)} tone="success" /> },
    { key: "due", header: "Due", align: "right", render: (p) => <MoneyCell amount={num(p.due)} tone={num(p.due) > 0 ? "warning" : "muted"} /> },
    { key: "status", header: "Payment", render: (p) => <StatusPill tone={payTone(p.paymentStatus)} variant="icon">{p.paymentStatus || "—"}</StatusPill> },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Payments"
        description="Revenue collected and outstanding per booking — redesigned, wired to live data."
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> Record payment</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total billed" value={isLoading ? "…" : formatPkr(num(stats?.all?.total))} icon="Wallet" />
        <StatCard label="Received" value={isLoading ? "…" : formatPkr(num(stats?.all?.received))} icon="CheckCircle2" trend="up" delta="collected" />
        <StatCard label="Due" value={isLoading ? "…" : formatPkr(num(stats?.all?.due))} icon="Clock" delta="to chase" />
        <StatCard label="Payments" value={isLoading ? "…" : num(stats?.all?.count)} icon="FileText" />
      </div>

      <DataTable
        columns={columns}
        data={payments}
        getRowId={(p) => String(p.bookingId)}
        loading={isLoading}
        error={isError ? "Couldn't load payments." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Wallet",
          title: "No payments yet",
          description: "Payments against your bookings will appear here as they come in.",
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payments…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(p) => String(p.bookingId)} rows={payments} filename="payments" columns={[
                { header: "Customer", value: (p) => p.customerName ?? "" },
                { header: "Phone", value: (p) => p.customerPhone ?? "" },
                { header: "Event date", value: (p) => fmtDate(p.bookingDate) },
                { header: "Total", value: (p) => num(p.totalAmount) },
                { header: "Received", value: (p) => num(p.received) },
                { header: "Due", value: (p) => num(p.due) },
                { header: "Status", value: (p) => p.paymentStatus ?? "" },
              ]} />
            </div>
          </>
        }
        renderCard={(p) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{p.customerName}</div>
              <div className="text-xs text-muted-foreground">{fmtDate(p.bookingDate)}</div>
              <div className="mt-1"><StatusPill tone={payTone(p.paymentStatus)} variant="icon">{p.paymentStatus}</StatusPill></div>
            </div>
            <div className="text-right">
              <MoneyCell amount={num(p.received)} tone="success" className="block text-sm font-medium" />
              {num(p.due) > 0 && <MoneyCell amount={num(p.due)} tone="warning" className="block text-xs" />}
            </div>
          </div>
        )}
      />
    </div>
  )
}

export default PaymentsRedesignedView
