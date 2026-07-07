"use client"

/**
 * F-9 depth — day-of timeline editor, restored on the LIVE (redesigned) Today.
 *
 * The redesign made Today read-only, so vendors could no longer build or adjust
 * their run-of-show (the legacy screen had the editor; it's off by default). This
 * brings back seed-template + add/edit/retime/reassign/tick/delete, wired to the
 * existing BookingTimelineAPI, and assigns tasks to real team members (Issue #38
 * pattern). Feeds the Run Sheet. No backend change.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  BookingTimelineAPI, TIMELINE_EVENT_KINDS, TIMELINE_EVENT_KIND_LABELS,
  type TimelineTask, type TimelineCategory, type TimelineEventKind,
} from "@/lib/api/bookingTimeline"
import { TeamMembersAPI, type BusinessTeamMember } from "@/lib/api/teamMembers"
import { useUser } from "@/context/UserContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const CATS: TimelineCategory[] = ["setup", "event", "teardown"]
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none ring-ring focus-visible:ring-2"
const fmtTime = (t: string | null) => {
  if (!t) return "—"
  const [h, m] = t.split(":"); const hh = Number(h)
  if (!Number.isFinite(hh)) return t
  return `${hh % 12 === 0 ? 12 : hh % 12}:${m ?? "00"} ${hh < 12 ? "AM" : "PM"}`
}
const blankForm = () => ({ label: "", category: "event" as TimelineCategory, scheduledTime: "", durationMin: "", assignedTo: "", notes: "" })

export function TimelineManagerDialog({
  open, onOpenChange, bookingId, businessId, anchorTime, onChanged,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  bookingId: number
  businessId?: number
  anchorTime?: string | null
  onChanged?: () => void
}) {
  const qc = useQueryClient()
  const { user } = useUser()
  const meName = user?.fullName?.trim() || "Me"
  const [editingId, setEditingId] = React.useState<number | "new" | null>(null)
  const [form, setForm] = React.useState(blankForm())
  const [seedKind, setSeedKind] = React.useState<TimelineEventKind>("walima")
  const set = (k: keyof ReturnType<typeof blankForm>, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const tasksQ = useQuery({
    queryKey: ["timeline", bookingId],
    queryFn: () => BookingTimelineAPI.list(bookingId),
    enabled: open && !!bookingId,
  })
  const teamQ = useQuery({
    queryKey: ["team-members", businessId],
    queryFn: () => TeamMembersAPI.list(businessId as number),
    enabled: open && !!businessId,
  })
  const team: BusinessTeamMember[] = teamQ.data ?? []
  const tasks = (tasksQ.data ?? []).slice().sort((a, b) =>
    (a.scheduledTime || "99").localeCompare(b.scheduledTime || "99") || a.sortOrder - b.sortOrder)

  const refresh = () => { qc.invalidateQueries({ queryKey: ["timeline", bookingId] }); onChanged?.() }
  const wrap = (fn: () => Promise<any>, ok: string) => async () => {
    try { await fn(); toast.success(ok); refresh() }
    catch (e: any) { toast.error(e?.response?.data?.message || e?.message || "Something went wrong") }
  }

  const startAdd = () => { setForm(blankForm()); setEditingId("new") }
  const startEdit = (t: TimelineTask) => {
    setForm({ label: t.label, category: t.category, scheduledTime: (t.scheduledTime || "").slice(0, 5), durationMin: t.durationMin != null ? String(t.durationMin) : "", assignedTo: t.assignedTo || "", notes: t.notes || "" })
    setEditingId(t.id)
  }
  const cancelEdit = () => { setEditingId(null); setForm(blankForm()) }

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        label: form.label.trim(),
        category: form.category,
        scheduledTime: form.scheduledTime || undefined,
        durationMin: form.durationMin ? Number(form.durationMin) : undefined,
        assignedTo: form.assignedTo.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }
      if (editingId === "new") await BookingTimelineAPI.create(bookingId, body)
      else if (typeof editingId === "number") await BookingTimelineAPI.update(editingId, body)
    },
    onSuccess: () => { toast.success("Saved"); cancelEdit(); refresh() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save"),
  })
  const seedMut = useMutation({
    mutationFn: () => BookingTimelineAPI.seedFromTemplate(bookingId, { kind: seedKind, anchorTime: anchorTime || undefined }),
    onSuccess: (t) => { toast.success(`${t.length} tasks added — edit any time`); refresh() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't seed template"),
  })

  const AssigneeField = (
    team.length > 0 ? (
      <select className={inputCls} value={form.assignedTo || "__u"} onChange={(e) => set("assignedTo", e.target.value === "__u" ? "" : e.target.value)}>
        <option value="__u">— Unassigned —</option>
        <option value={meName}>Me ({meName})</option>
        {team.map((m) => <option key={m.id} value={m.name}>{m.name}{m.role ? ` · ${m.role}` : ""}</option>)}
      </select>
    ) : (
      <input className={inputCls} value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)} placeholder="e.g. lead photographer" maxLength={120} />
    )
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Day-of timeline</DialogTitle>
          <DialogDescription>Build your run-of-show — add tasks, set times, and assign your team. Tick them off on the day.</DialogDescription>
        </DialogHeader>

        {tasksQ.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground"><Spinner size={16} /> Loading…</div>
        ) : (
          <div className="space-y-3">
            {tasks.length === 0 && editingId == null && (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm font-medium">No timeline yet</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Start from a Pakistani-wedding template, then tweak.</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <select className={cn(inputCls, "w-auto")} value={seedKind} onChange={(e) => setSeedKind(e.target.value as TimelineEventKind)}>
                    {TIMELINE_EVENT_KINDS.map((k) => <option key={k} value={k}>{TIMELINE_EVENT_KIND_LABELS[k]}</option>)}
                  </select>
                  <Button size="sm" disabled={seedMut.isPending} onClick={() => seedMut.mutate()}>
                    {seedMut.isPending ? <Spinner size={14} className="mr-1.5" /> : <Icon name="Plus" size={14} className="mr-1" />} Seed template
                  </Button>
                </div>
              </div>
            )}

            {tasks.length > 0 && (
              <ul className="divide-y rounded-lg border">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 px-3 py-2">
                    <button type="button" aria-label="Toggle done"
                      onClick={wrap(() => BookingTimelineAPI.setStatus(t.id, t.status === "done" ? "pending" : "done"), t.status === "done" ? "Reopened" : "Done")}
                      className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border", t.status === "done" ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/40")}>
                      {t.status === "done" ? <Icon name="Check" size={13} /> : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={cn("truncate text-sm", t.status === "done" && "text-muted-foreground line-through")}>{t.label}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{fmtTime(t.scheduledTime)}{t.durationMin ? ` · ${t.durationMin}m` : ""}{t.assignedTo ? ` · ${t.assignedTo}` : ""}</div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={() => startEdit(t)} aria-label="Edit"><Icon name="Pencil" size={13} /></Button>
                    <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={wrap(() => BookingTimelineAPI.remove(t.id), "Removed")} aria-label="Delete"><Icon name="Trash2" size={13} className="text-muted-foreground hover:text-destructive" /></Button>
                  </li>
                ))}
              </ul>
            )}

            {editingId != null ? (
              <div className="space-y-2.5 rounded-lg border bg-muted/30 p-3">
                <div className="text-xs font-semibold">{editingId === "new" ? "Add a task" : "Edit task"}</div>
                <input className={inputCls} value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="What happens? e.g. Baraat entry + rasm" autoFocus />
                <div className="grid grid-cols-3 gap-2">
                  <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value as TimelineCategory)}>
                    {CATS.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
                  </select>
                  <input className={inputCls} type="time" value={form.scheduledTime} onChange={(e) => set("scheduledTime", e.target.value)} />
                  <input className={inputCls} type="number" value={form.durationMin} onChange={(e) => set("durationMin", e.target.value)} placeholder="mins" />
                </div>
                {AssigneeField}
                <input className={inputCls} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Note (optional)" />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  <Button size="sm" disabled={!form.label.trim() || saveMut.isPending} onClick={() => saveMut.mutate()}>
                    {saveMut.isPending ? <Spinner size={14} className="mr-1.5" /> : null}{editingId === "new" ? "Add task" : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              tasks.length > 0 && (
                <Button size="sm" variant="outline" className="w-full" onClick={startAdd}><Icon name="Plus" size={14} className="mr-1" /> Add task</Button>
              )
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default TimelineManagerDialog
