"use client"

/**
 * Design Gallery — the in-app showcase of the redesign primitives, rendered
 * under the live theme engine. Open it while logged in and switch themes in the
 * header (palette icon) to watch every primitive re-color. Reference surface for
 * the Track-C screen migration.
 *
 * Route: /dashboard/design-gallery
 */

import * as React from "react"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell } from "@/components/dashboard/primitives/money-cell"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { CardSkeleton, TableSkeleton } from "@/components/dashboard/primitives/skeletons"
import { Icon, Spinner, type IconName } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

type Booking = {
  id: string
  event: string
  customer: string
  date: string
  amount: number
  paid: number
  status: "paid" | "partial" | "overdue"
}

const BOOKINGS: Booking[] = [
  { id: "1", event: "Walima", customer: "Ahmed Raza", date: "12 Jul", amount: 180000, paid: 180000, status: "paid" },
  { id: "2", event: "Mehndi", customer: "Sana Khan", date: "28 Jun", amount: 240000, paid: 120000, status: "partial" },
  { id: "3", event: "Barat", customer: "Bilal Tariq", date: "03 Aug", amount: 320000, paid: 0, status: "overdue" },
  { id: "4", event: "Nikkah", customer: "Hira Sheikh", date: "19 Aug", amount: 95000, paid: 95000, status: "paid" },
]

const STATUS_TONE = { paid: "success", partial: "warning", overdue: "error" } as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

export default function DesignGallery() {
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const columns: Column<Booking>[] = [
    { key: "event", header: "Event", render: (r) => <span className="font-medium">{r.event}</span> },
    { key: "customer", header: "Customer", cellClassName: "text-muted-foreground" },
    { key: "date", header: "Date", cellClassName: "text-muted-foreground" },
    { key: "amount", header: "Amount", align: "right", render: (r) => <MoneyCell amount={r.amount} /> },
    { key: "paid", header: "Paid", align: "right", render: (r) => <MoneyCell amount={r.paid} tone="muted" /> },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusPill tone={STATUS_TONE[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</StatusPill>,
    },
  ]

  const sampleIcons: IconName[] = [
    "Calendar", "Search", "Plus", "Trash2", "Pencil", "Filter", "Download", "Upload",
    "Wallet", "Users", "MessageCircle", "Bell", "Settings", "Star", "Eye", "Phone",
    "MapPin", "ShieldCheck", "ChevronRight", "TrendingUp", "DollarSign", "RefreshCw",
  ]

  return (
    <div className="space-y-8 p-6">
      <PageHeader
        eyebrow="Design system"
        title="Component gallery"
        description="Every primitive uses semantic tokens only — switch themes in the header (palette icon) and watch it all re-color. This is what migrated screens look like."
        actions={<Button>Primary action</Button>}
      />

      <Section title="Stat cards">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Owed to you" value="Rs 540,000" delta="+8%" trend="up" icon="Wallet" />
          <StatCard label="This month" value="Rs 1,240,000" delta="+18%" trend="up" icon="TrendingUp" />
          <StatCard label="PDCs clearing" value="Rs 95,000" delta="this week" icon="Clock" />
          <StatCard label="Active events" value="12" delta="-2" trend="down" icon="Calendar" />
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
          <Button disabled>Disabled</Button>
          <Button>
            <Spinner size={14} className="mr-1.5" /> Loading
          </Button>
        </div>
      </Section>

      <Section title="Status pills">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="success">Paid</StatusPill>
          <StatusPill tone="warning">Due soon</StatusPill>
          <StatusPill tone="error">Overdue</StatusPill>
          <StatusPill tone="info">Pending</StatusPill>
          <StatusPill tone="neutral">Draft</StatusPill>
          <StatusPill tone="success" variant="icon">Confirmed</StatusPill>
        </div>
      </Section>

      <Section title="Data table (select rows → bulk bar · resize window → mobile cards)">
        <DataTable
          columns={columns}
          data={BOOKINGS}
          getRowId={(r) => r.id}
          selectable
          selectedIds={selected}
          onSelectionChange={setSelected}
          bulkActions={() => (
            <>
              <Button size="sm" variant="outline">Mark paid</Button>
              <Button size="sm" variant="outline">Export</Button>
            </>
          )}
          toolbar={
            <>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Icon name="Search" size={15} />
                </span>
                <input
                  placeholder="Search bookings…"
                  className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
                />
              </div>
              <Button size="sm" variant="secondary">All</Button>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline"><Icon name="Download" size={14} className="mr-1" /> Export</Button>
                <Button size="sm" variant="outline"><Icon name="Upload" size={14} className="mr-1" /> Import</Button>
              </div>
            </>
          }
          renderCard={(r) => (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{r.event}</div>
                <div className="text-xs text-muted-foreground">{r.customer} · {r.date}</div>
              </div>
              <div className="text-right">
                <MoneyCell amount={r.amount} className="block text-sm" />
                <StatusPill tone={STATUS_TONE[r.status]} className="mt-1">{r.status}</StatusPill>
              </div>
            </div>
          )}
        />
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon="Calendar"
          title="No bookings yet"
          description="When you log a booking it'll show up here with its payment status and timeline."
          action={<Button size="sm">Add booking</Button>}
          secondaryAction={<Button size="sm" variant="outline">Import</Button>}
        />
      </Section>

      <Section title="Loading skeletons">
        <div className="space-y-4">
          <CardSkeleton count={4} />
          <TableSkeleton rows={4} cols={5} />
        </div>
      </Section>

      <Section title="Icons (Iconly core + lucide fallback)">
        <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
          {sampleIcons.map((n) => (
            <span key={n} className="flex w-16 flex-col items-center gap-1 text-muted-foreground">
              <Icon name={n} size={22} className="text-foreground" />
              <span className="truncate text-[10px]">{n}</span>
            </span>
          ))}
        </div>
      </Section>
    </div>
  )
}
