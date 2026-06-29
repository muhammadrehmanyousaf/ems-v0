"use client"

/**
 * Suppliers — redesigned (Track C). Two tabs rendered through the redesign
 * primitives, wired to the live SupplierAPI:
 *
 *   1. A/P invoices (default) — aging stat cards (current / 0-7 / 8-30 / 31-60 /
 *      60+), a DataTable of invoices with per-invoice paid/total + overdue
 *      badges, and row actions Log invoice / Record payment / Dispute / Void /
 *      Delete. The four invoice forms are REUSED from the original screen's
 *      working dialogs (ported into ./invoice-dialogs — the originals are not
 *      exported and that file must not be touched).
 *
 *   2. Suppliers — the existing directory (create/edit via SupplierFormDialog).
 *
 * Original screen untouched. Route /dashboard/suppliers-new.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  SupplierAPI,
  INVOICE_STATUS_LABELS,
  type Supplier,
  type SupplierInvoice,
  type InvoiceStatus,
  type AgingReport,
} from "@/lib/api/suppliers"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SupplierFormDialog } from "@/components/dashboard/mainScreens/suppliers/redesigned/supplier-form-dialog"
import {
  LogInvoiceDialog,
  RecordPaymentDialog,
  DisputeInvoiceDialog,
  VoidInvoiceDialog,
  type VendorBusinessOption,
} from "@/components/dashboard/mainScreens/suppliers/redesigned/invoice-dialogs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const initials = (name: string) => (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return iso as string
  }
}
function daysFromNow(iso: string | null | undefined): number | null {
  if (!iso) return null
  try {
    const t = new Date(iso).getTime()
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    return Math.floor((t - today.getTime()) / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}

const INVOICE_TONE: Record<InvoiceStatus, StatusTone> = {
  draft: "neutral",
  received: "info",
  partially_paid: "info",
  paid: "success",
  disputed: "error",
  void: "neutral",
  overdue: "warning",
}

export function SuppliersRedesignedView() {
  const { data: businesses } = useQuery({ queryKey: ["my-businesses"], queryFn: () => BusinessesAPI.getUserBusinesses() })
  const businessOptions: VendorBusinessOption[] = React.useMemo(
    () => (businesses ?? []).map((b) => ({ id: b.id, name: b.name || `Business #${b.id}` })),
    [businesses],
  )
  const businessId = businesses?.[0]?.id

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Operate"
        title="Suppliers"
        description="Your A/P ledger and vendor network — redesigned, wired to live data."
      />
      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="invoices">
            <Icon name="FileText" size={15} className="mr-1.5" /> A/P invoices
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            <Icon name="Truck" size={15} className="mr-1.5" /> Suppliers
          </TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="space-y-6">
          <InvoicesTab businessOptions={businessOptions} />
        </TabsContent>
        <TabsContent value="suppliers" className="space-y-6">
          <SuppliersDirectoryTab businessId={businessId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── A/P invoices tab ─────────────────────────────────────────────

function InvoicesTab({ businessOptions }: { businessOptions: VendorBusinessOption[] }) {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = React.useState<InvoiceStatus | "all">("all")
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [logOpen, setLogOpen] = React.useState(false)
  const [paying, setPaying] = React.useState<SupplierInvoice | null>(null)
  const [disputing, setDisputing] = React.useState<SupplierInvoice | null>(null)
  const [voiding, setVoiding] = React.useState<SupplierInvoice | null>(null)
  const [deleting, setDeleting] = React.useState<SupplierInvoice | null>(null)

  const invKey = ["supplier-invoices", statusFilter] as const
  const invQuery = useQuery({
    queryKey: invKey,
    queryFn: () => SupplierAPI.listInvoices({ status: statusFilter === "all" ? undefined : statusFilter }),
  })
  const agingQuery = useQuery({ queryKey: ["supplier-aging"], queryFn: () => SupplierAPI.aging() })
  // Suppliers list feeds the "Log invoice" picker.
  const suppliersQuery = useQuery({ queryKey: ["suppliers-for-invoices"], queryFn: () => SupplierAPI.list({ isActive: true }) })

  const refetchAll = () => {
    qc.invalidateQueries({ queryKey: ["supplier-invoices"] })
    qc.invalidateQueries({ queryKey: ["supplier-aging"] })
  }

  const removeMut = useMutation({
    mutationFn: (id: number) => SupplierAPI.removeInvoice(id),
    onSuccess: () => { showSuccessToast("Invoice removed"); setDeleting(null); refetchAll() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't remove invoice"),
  })

  const summary = invQuery.data?.summary
  const allInvoices = invQuery.data?.invoices ?? []
  const invoices = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allInvoices
    return allInvoices.filter((inv) =>
      [inv.supplierNameSnapshot, inv.invoiceNumber, inv.description].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
  }, [allInvoices, search])

  const aging: AgingReport | undefined = agingQuery.data
  const b = aging?.buckets

  const statusOptions: Array<InvoiceStatus | "all"> = [
    "all", "received", "partially_paid", "paid", "overdue", "disputed", "void", "draft",
  ]

  const columns: Column<SupplierInvoice>[] = [
    {
      key: "supplier",
      header: "Supplier",
      render: (inv) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(inv.supplierNameSnapshot)}</span>
          <div className="min-w-0">
            <div className="truncate font-medium">{inv.supplierNameSnapshot}</div>
            <div className="text-xs text-muted-foreground">
              {inv.invoiceNumber ? `#${inv.invoiceNumber} · ` : ""}{fmtDate(inv.invoiceDate)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "due",
      header: "Due",
      cellClassName: "text-muted-foreground",
      render: (inv) => {
        const dueIn = daysFromNow(inv.dueDate)
        const overdue = inv.status !== "paid" && inv.status !== "void" && dueIn != null && dueIn < 0
        if (!inv.dueDate) return "—"
        return (
          <div className="flex flex-col gap-1">
            <span>{fmtDate(inv.dueDate)}</span>
            {overdue && <StatusPill tone="warning" variant="icon">{Math.abs(dueIn!)}d overdue</StatusPill>}
            {!overdue && dueIn != null && dueIn >= 0 && dueIn <= 7 && (
              <StatusPill tone="info">Due in {dueIn}d</StatusPill>
            )}
          </div>
        )
      },
    },
    {
      key: "paid",
      header: "Paid / Total",
      align: "right",
      render: (inv) => {
        const total = num(inv.totalAmount)
        const paid = num(inv.amountPaid)
        const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0
        return (
          <div className="flex flex-col items-end gap-1">
            <div className="tabular-nums">
              <MoneyCell amount={paid} tone={paid > 0 ? "success" : "muted"} prefix={false} />
              <span className="px-1 text-muted-foreground">/</span>
              <MoneyCell amount={total} />
            </div>
            {total > 0 && (
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: "outstanding",
      header: "Outstanding",
      align: "right",
      render: (inv) => {
        const out = Math.max(0, num(inv.totalAmount) - num(inv.amountPaid))
        return <MoneyCell amount={out} tone={out > 0 ? "warning" : "muted"} />
      },
    },
    {
      key: "status",
      header: "Status",
      render: (inv) => <StatusPill tone={INVOICE_TONE[inv.status]}>{INVOICE_STATUS_LABELS[inv.status]}</StatusPill>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (inv) => {
        const canPay = inv.status !== "paid" && inv.status !== "void"
        const canVoid = inv.status !== "paid" && inv.status !== "void"
        const canDelete = inv.status !== "paid"
        return (
          <div className="flex items-center justify-end gap-0.5">
            {canPay && (
              <Button size="sm" variant="ghost" onClick={() => setPaying(inv)} aria-label="Record payment">
                <Icon name="CheckCircle2" size={14} className="text-emerald-600" />
              </Button>
            )}
            {inv.status !== "void" && (
              <Button size="sm" variant="ghost" onClick={() => setDisputing(inv)} aria-label="Dispute invoice">
                <Icon name="AlertTriangle" size={14} className="text-amber-600" />
              </Button>
            )}
            {canVoid && (
              <Button size="sm" variant="ghost" onClick={() => setVoiding(inv)} aria-label="Void invoice">
                <Icon name="XCircle" size={14} className="text-muted-foreground" />
              </Button>
            )}
            {canDelete && (
              <Button size="sm" variant="ghost" onClick={() => setDeleting(inv)} aria-label="Remove invoice">
                <Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          A/P ledger. Every payment routes through the backend payment applier — amount paid and status can never drift.
        </p>
        <Button onClick={() => setLogOpen(true)}><Icon name="Plus" size={16} className="mr-1.5" /> Log invoice</Button>
      </div>

      {/* A/P aging stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Current" value={b ? formatPkr(Math.round(b.current.total)) : "—"} icon="Wallet" />
        <StatCard label="0-7d overdue" value={b ? formatPkr(Math.round(b.d0_7.total)) : "—"} icon="Clock" trend={b && b.d0_7.total > 0 ? "down" : undefined} />
        <StatCard label="8-30d overdue" value={b ? formatPkr(Math.round(b.d8_30.total)) : "—"} icon="Clock" trend={b && b.d8_30.total > 0 ? "down" : undefined} />
        <StatCard label="31-60d overdue" value={b ? formatPkr(Math.round(b.d31_60.total)) : "—"} icon="AlertTriangle" trend={b && b.d31_60.total > 0 ? "down" : undefined} />
        <StatCard label="60d+ overdue" value={b ? formatPkr(Math.round(b.d60plus.total)) : "—"} icon="AlertTriangle" trend={b && b.d60plus.total > 0 ? "down" : undefined} />
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        getRowId={(inv) => String(inv.id)}
        loading={invQuery.isLoading}
        error={invQuery.isError ? "Couldn't load invoices." : null}
        onRetry={() => invQuery.refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "FileText",
          title: "No invoices in this window",
          description: "Log a supplier bill to start tracking accounts payable, due dates and aging.",
          action: <Button size="sm" onClick={() => setLogOpen(true)}><Icon name="Plus" size={14} className="mr-1" /> Log invoice</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {statusOptions.map((s) => {
                const active = statusFilter === s
                const count = s === "all"
                  ? Object.values(summary?.byStatus ?? {}).reduce((a, n) => a + (n || 0), 0)
                  : summary?.byStatus?.[s] ?? 0
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={
                      "rounded-full border px-2.5 py-0.5 text-xs transition-colors " +
                      (active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background text-muted-foreground hover:bg-accent")
                    }
                  >
                    {s === "all" ? "All" : INVOICE_STATUS_LABELS[s]}
                    <span className="ml-1 opacity-70">({count})</span>
                  </button>
                )
              })}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(inv) => String(inv.id)} rows={invoices} filename="supplier-invoices" columns={[
                { header: "Supplier", value: (inv) => inv.supplierNameSnapshot },
                { header: "Invoice #", value: (inv) => inv.invoiceNumber ?? "" },
                { header: "Invoice date", value: (inv) => inv.invoiceDate ?? "" },
                { header: "Due date", value: (inv) => inv.dueDate ?? "" },
                { header: "Total", value: (inv) => num(inv.totalAmount) },
                { header: "Paid", value: (inv) => num(inv.amountPaid) },
                { header: "Outstanding", value: (inv) => Math.max(0, num(inv.totalAmount) - num(inv.amountPaid)) },
                { header: "Status", value: (inv) => INVOICE_STATUS_LABELS[inv.status] },
              ]} />
            </div>
          </>
        }
        renderCard={(inv) => {
          const total = num(inv.totalAmount)
          const paid = num(inv.amountPaid)
          const out = Math.max(0, total - paid)
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(inv.supplierNameSnapshot)}</span>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{inv.supplierNameSnapshot}</div>
                    <div className="text-xs text-muted-foreground">{inv.invoiceNumber ? `#${inv.invoiceNumber} · ` : ""}{fmtDate(inv.invoiceDate)}</div>
                  </div>
                </div>
                <StatusPill tone={INVOICE_TONE[inv.status]}>{INVOICE_STATUS_LABELS[inv.status]}</StatusPill>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Paid {formatPkr(Math.round(paid))} / {formatPkr(Math.round(total))}</span>
                {out > 0 && <span className="text-amber-600">Outstanding {formatPkr(Math.round(out))}</span>}
              </div>
            </div>
          )
        }}
      />

      <LogInvoiceDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        businesses={businessOptions}
        suppliers={suppliersQuery.data?.suppliers ?? []}
        onSaved={() => { setLogOpen(false); refetchAll() }}
      />
      <RecordPaymentDialog invoice={paying} onOpenChange={(o) => !o && setPaying(null)} onSaved={() => { setPaying(null); refetchAll() }} />
      <DisputeInvoiceDialog invoice={disputing} onOpenChange={(o) => !o && setDisputing(null)} onSaved={() => { setDisputing(null); refetchAll() }} />
      <VoidInvoiceDialog invoice={voiding} onOpenChange={(o) => !o && setVoiding(null)} onSaved={() => { setVoiding(null); refetchAll() }} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this invoice?</AlertDialogTitle>
            <AlertDialogDescription>Soft delete. Paid invoices cannot be removed.</AlertDialogDescription>
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

// ─── Suppliers directory tab ──────────────────────────────────────

function SuppliersDirectoryTab({ businessId }: { businessId?: number }) {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Supplier | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<Supplier | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["suppliers-redesigned"],
    queryFn: () => SupplierAPI.list(),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ["suppliers-redesigned"] })
  const openCreate = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (s: Supplier) => { setEditing(s); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => SupplierAPI.remove(id),
    onSuccess: () => { showSuccessToast("Supplier removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(e?.message || "Couldn't remove supplier"),
  })

  const all = data?.suppliers ?? []
  const suppliers = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((s) => [s.name, s.contactPerson, s.phoneNumber, s.category].some((v) => (v ?? "").toLowerCase().includes(q)))
  }, [all, search])

  const active = all.filter((s) => s.isActive).length
  const categories = new Set(all.map((s) => s.category).filter(Boolean)).size
  const creditTotal = all.reduce((s, x) => s + num(x.creditLimit), 0)

  const columns: Column<Supplier>[] = [
    {
      key: "name",
      header: "Supplier",
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(s.name)}</span>
          <span className="font-medium">{s.name}</span>
        </div>
      ),
    },
    { key: "category", header: "Category", cellClassName: "text-muted-foreground", render: (s) => cap(s.category) },
    { key: "contact", header: "Contact", cellClassName: "text-muted-foreground", render: (s) => s.contactPerson || "—" },
    { key: "phone", header: "Phone", cellClassName: "text-muted-foreground", render: (s) => s.phoneNumber || "—" },
    { key: "credit", header: "Credit limit", align: "right", render: (s) => <MoneyCell amount={s.creditLimit != null ? num(s.creditLimit) : null} tone="muted" /> },
    { key: "status", header: "Status", render: (s) => <StatusPill tone={s.isActive ? "success" : "neutral"}>{s.isActive ? "Active" : "Inactive"}</StatusPill> },
    {
      key: "actions", header: "", align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button size="sm" variant="ghost" onClick={() => openEdit(s)} aria-label="Edit supplier"><Icon name="Pencil" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(s)} aria-label="Remove supplier"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Your vendor network and credit terms — the suppliers you buy from.
        </p>
        <Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Add supplier</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total suppliers" value={all.length} icon="Building2" />
        <StatCard label="Active" value={active} icon="ShieldCheck" trend="up" />
        <StatCard label="Categories" value={categories} icon="LayoutGrid" />
        <StatCard label="Credit available" value={creditTotal ? formatPkr(creditTotal) : "—"} icon="Wallet" />
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        getRowId={(s) => String(s.id)}
        loading={isLoading}
        error={isError ? "Couldn't load suppliers." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Building2",
          title: "No suppliers yet",
          description: "Add the vendors you buy from — albums, frames, props — to track credit and invoices.",
          action: <Button size="sm" onClick={openCreate}><Icon name="Plus" size={14} className="mr-1" /> Add supplier</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(s) => String(s.id)} rows={suppliers} filename="suppliers" columns={[
                { header: "Supplier", value: (s) => s.name },
                { header: "Category", value: (s) => s.category ?? "" },
                { header: "Contact", value: (s) => s.contactPerson ?? "" },
                { header: "Phone", value: (s) => s.phoneNumber ?? "" },
                { header: "Credit limit", value: (s) => (s.creditLimit != null ? num(s.creditLimit) : 0) },
                { header: "Active", value: (s) => (s.isActive ? "Yes" : "No") },
              ]} />
            </div>
          </>
        }
        renderCard={(s) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(s.name)}</span>
              <div className="min-w-0">
                <div className="truncate font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">{cap(s.category)} · {s.phoneNumber || "no phone"}</div>
              </div>
            </div>
            <StatusPill tone={s.isActive ? "success" : "neutral"}>{s.isActive ? "Active" : "Inactive"}</StatusPill>
          </div>
        )}
      />

      <SupplierFormDialog open={dialogOpen} onOpenChange={setDialogOpen} supplier={editing} businessId={businessId} onSaved={invalidate} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this supplier?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.name} will be removed. This can't be undone.</AlertDialogDescription>
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

export default SuppliersRedesignedView
