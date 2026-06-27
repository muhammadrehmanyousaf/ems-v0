"use client"

/**
 * Function-sheet TRADE OPERATIONS editor (redesigned, Track C — interactive).
 * The per-trade operational layer of the morphing doc. Photography is the
 * reference implementation (the demo vendor's trade): an editable shot list,
 * crew roster and deliverables tracker, persisted to the sheet's photographyJson
 * + deliverablesJson via FunctionSheetAPI.update (both are accepted update
 * fields). The same shape (repeating editable rows → a JSON column → one save)
 * is the template every other trade card (BEO/kitchen/decor/henna/makeup/…)
 * follows. Route /dashboard/function-sheet-operations-new. Loads the latest
 * sheet (or ?id=). Original screens untouched.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FunctionSheetAPI, type FunctionSheet } from "@/lib/api/functionSheets"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { DetailSkeleton } from "@/components/dashboard/primitives/skeletons"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { Icon, Spinner, type IconName } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"

interface Shot { moment: string; notes?: string; _rid?: string }
interface Crew { role: string; name?: string; _rid?: string }
interface Deliverable { label: string; qty: number | string; format?: string; dueDate?: string; status?: string; _rid?: string }
let _ridSeq = 0
const newRid = () => `r${++_ridSeq}`
const stripRid = <T extends { _rid?: string }>(r: T) => { const { _rid, ...rest } = r; return rest }

const DELIVERY_STATUS: Record<string, StatusTone> = { pending: "neutral", "in progress": "info", editing: "warning", delivered: "success" }

export function FunctionSheetOperationsView() {
  const qc = useQueryClient()
  const { data: sheet, isLoading, isError } = useQuery<FunctionSheet | null>({
    queryKey: ["fs-operations"],
    queryFn: async () => {
      const idParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null
      if (idParam) return FunctionSheetAPI.get(Number(idParam))
      const list = await FunctionSheetAPI.list()
      const first = list?.functionSheets?.[0]
      return first ? FunctionSheetAPI.get(first.id) : null
    },
  })

  const [shots, setShots] = React.useState<Shot[]>([])
  const [crew, setCrew] = React.useState<Crew[]>([])
  const [deliverables, setDeliverables] = React.useState<Deliverable[]>([])
  const [dirty, setDirty] = React.useState(false)
  const loadedId = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (sheet && loadedId.current !== sheet.id) {
      loadedId.current = sheet.id
      const p = (sheet.photographyJson || {}) as any
      const d = (sheet.deliverablesJson || {}) as any
      const withRid = (arr: any[]) => arr.map((x) => ({ ...x, _rid: newRid() }))
      setShots(Array.isArray(p.shotList) ? withRid(p.shotList) : [])
      setCrew(Array.isArray(p.crew) ? withRid(p.crew) : [])
      setDeliverables(Array.isArray(d.items) ? withRid(d.items) : [])
      setDirty(false)
    }
  }, [sheet])

  const mark = () => setDirty(true)
  const upd = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>) => ({
    set: (i: number, patch: Partial<T>) => { setter((arr) => arr.map((x, ix) => (ix === i ? { ...x, ...patch } : x))); mark() },
    add: (blank: T) => { setter((arr) => [...arr, { ...blank, _rid: newRid() } as T]); mark() },
    remove: (i: number) => { setter((arr) => arr.filter((_, ix) => ix !== i)); mark() },
  })
  const shotOps = upd<Shot>(setShots)
  const crewOps = upd<Crew>(setCrew)
  const delOps = upd<Deliverable>(setDeliverables)

  const saveMut = useMutation({
    mutationFn: () =>
      FunctionSheetAPI.update(sheet!.id, {
        photographyJson: { shotList: shots.map(stripRid), crew: crew.map(stripRid) },
        deliverablesJson: { items: deliverables.map((d) => ({ ...stripRid(d), qty: Number(d.qty) || 0 })) },
      } as any),
    onSuccess: () => { showSuccessToast("Operations saved"); setDirty(false); qc.invalidateQueries({ queryKey: ["fs-operations"] }) },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  })

  if (isLoading) return <div className="p-4 md:p-6"><DetailSkeleton /></div>
  if (isError || !sheet) {
    return <div className="p-4 md:p-6"><EmptyState icon="ClipboardList" title="No function sheet" description="Create a function sheet first to plan its operations." /></div>
  }

  const delivered = deliverables.filter((d) => (d.status || "pending") === "delivered").length

  return (
    <div className="space-y-6 p-4 md:p-6 pb-24">
      <PageHeader
        eyebrow="Operate · Trade operations"
        title="Photography operations"
        description="Shot list, crew and deliverables for this function sheet."
        breadcrumb={
          <a href="/dashboard/function-sheet-detail-new" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <Icon name="ChevronLeft" size={14} /> {sheet.title || "Function sheet"}
          </a>
        }
        actions={<StatusPill tone="info">Photographer</StatusPill>}
      />

      {/* Shot list */}
      <Card icon="Camera" title="Shot list" desc="Key moments to capture, in running order." onAdd={() => shotOps.add({ moment: "", notes: "" })} addLabel="Add moment">
        {shots.length === 0 && <Empty>No moments yet — add the first (e.g. Nikah, Rukhsati).</Empty>}
        {shots.map((s, i) => (
          <RowGrid key={s._rid ?? i} onRemove={() => shotOps.remove(i)}>
            <input className={cn(inputCls, "col-span-12 sm:col-span-4")} placeholder="Moment" value={s.moment} onChange={(e) => shotOps.set(i, { moment: e.target.value })} />
            <input className={cn(inputCls, "col-span-12 sm:col-span-7")} placeholder="Notes (lens, location, must-haves…)" value={s.notes ?? ""} onChange={(e) => shotOps.set(i, { notes: e.target.value })} />
          </RowGrid>
        ))}
      </Card>

      {/* Crew */}
      <Card icon="Users2" title="Crew" desc="Who's on the shoot." onAdd={() => crewOps.add({ role: "", name: "" })} addLabel="Add crew">
        {crew.length === 0 && <Empty>No crew assigned yet.</Empty>}
        {crew.map((c, i) => (
          <RowGrid key={c._rid ?? i} onRemove={() => crewOps.remove(i)}>
            <input className={cn(inputCls, "col-span-12 sm:col-span-5")} placeholder="Role (Lead photographer, Videographer…)" value={c.role} onChange={(e) => crewOps.set(i, { role: e.target.value })} />
            <input className={cn(inputCls, "col-span-12 sm:col-span-6")} placeholder="Name" value={c.name ?? ""} onChange={(e) => crewOps.set(i, { name: e.target.value })} />
          </RowGrid>
        ))}
      </Card>

      {/* Deliverables */}
      <Card
        icon="Package"
        title="Deliverables"
        desc="What the couple receives after the event."
        onAdd={() => delOps.add({ label: "", qty: 1, format: "", dueDate: "", status: "pending" })}
        addLabel="Add deliverable"
        headerExtra={<StatusPill tone={delivered === deliverables.length && deliverables.length > 0 ? "success" : "neutral"}>{delivered}/{deliverables.length} delivered</StatusPill>}
      >
        {deliverables.length === 0 && <Empty>No deliverables yet (e.g. edited album, highlight reel).</Empty>}
        {deliverables.map((d, i) => (
          <RowGrid key={d._rid ?? i} onRemove={() => delOps.remove(i)}>
            <input className={cn(inputCls, "col-span-12 sm:col-span-4")} placeholder="Deliverable" value={d.label} onChange={(e) => delOps.set(i, { label: e.target.value })} />
            <input className={cn(inputCls, "col-span-4 sm:col-span-1 text-right tabular-nums")} type="number" placeholder="Qty" value={d.qty} onChange={(e) => delOps.set(i, { qty: e.target.value })} />
            <input className={cn(inputCls, "col-span-8 sm:col-span-2")} placeholder="Format" value={d.format ?? ""} onChange={(e) => delOps.set(i, { format: e.target.value })} />
            <input className={cn(inputCls, "col-span-7 sm:col-span-2")} type="date" value={d.dueDate ?? ""} onChange={(e) => delOps.set(i, { dueDate: e.target.value })} />
            <select className={cn(inputCls, "col-span-5 sm:col-span-2")} value={d.status ?? "pending"} onChange={(e) => delOps.set(i, { status: e.target.value })}>
              {Object.keys(DELIVERY_STATUS).map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </RowGrid>
        ))}
      </Card>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur md:left-[var(--sidebar-width,0)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="text-sm text-muted-foreground">
            {shots.length} moments · {crew.length} crew · {deliverables.length} deliverables
            {dirty && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">Unsaved</span>}
          </div>
          <Button disabled={!dirty || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Save operations</>}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Card({ icon, title, desc, onAdd, addLabel, headerExtra, children }: { icon: IconName; title: string; desc: string; onAdd: () => void; addLabel: string; headerExtra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name={icon} size={16} /></span>
        <div className="mr-auto"><h2 className="text-sm font-semibold">{title}</h2><p className="text-xs text-muted-foreground">{desc}</p></div>
        {headerExtra}
        <Button size="sm" variant="outline" onClick={onAdd}><Icon name="Plus" size={14} className="mr-1" /> {addLabel}</Button>
      </div>
      <div className="space-y-2 p-3">{children}</div>
    </div>
  )
}

function RowGrid({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="grid grid-cols-12 items-center gap-2 rounded-lg border border-border/70 p-2">
      {children}
      <button onClick={onRemove} aria-label="Remove" className="col-span-12 grid h-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive sm:col-span-1">
        <Icon name="Trash2" size={15} />
      </button>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-1 py-3 text-sm text-muted-foreground">{children}</p>
}

export default FunctionSheetOperationsView
