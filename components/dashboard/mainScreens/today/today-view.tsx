'use client';

/**
 * Vendor Portal Phase 1 #7.6 — Today (day-of timeline runner).
 *
 * The vendor's home for the day of an event. Every active booking
 * scheduled for today gets a card with its full timeline embedded.
 * Each task has a one-tap status toggle (pending → in_progress →
 * done). The floor manager opens this on their phone, ticks tasks
 * off as they happen, and the whole crew sees real-time progress.
 *
 * Pakistani-wedding context: floor managers today run the wedding
 * off a printed schedule + WhatsApp groups. This page replaces the
 * paper. Mobile-first; large tap targets (44px minimum) for use on
 * the actual floor of the event.
 *
 * Surfaces:
 *   - Header: today's date (Asia/Karachi) + count of active events
 *   - Per-event card:
 *     - Customer name + phone (one-tap call link)
 *     - Booking time + venue + total amount
 *     - "Seed Pakistani template" button when timeline is empty
 *     - Add-task button
 *     - Three category groups: Setup · Event · Teardown
 *     - Per-task row: status badge · scheduledTime · label ·
 *       assigned · status-flip button · edit · delete
 *   - Empty state when no events today
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Sparkles,
  Clock,
  Phone,
  CheckCircle2,
  Circle,
  CircleDashed,
  XCircle,
  Pencil,
  Trash2,
  CalendarDays,
  Building,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  BookingTimelineAPI,
  CATEGORY_LABELS,
  CATEGORY_TONES,
  TIMELINE_EVENT_KINDS,
  TIMELINE_EVENT_KIND_LABELS,
  type TimelineTask,
  type TimelineStatus,
  type TimelineCategory,
  type TimelineEventKind,
  type TodayEvent,
} from '@/lib/api/bookingTimeline';

function fmtTime(s: string | null | undefined): string {
  if (!s) return '—';
  const m = String(s).match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : s;
}

function fmtPKR(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `Rs. ${Math.round(x).toLocaleString('en-PK')}`;
}

const STATUS_ICON: Record<TimelineStatus, React.ComponentType<{ className?: string }>> = {
  pending: Circle,
  in_progress: CircleDashed,
  done: CheckCircle2,
  skipped: XCircle,
};

const STATUS_TONES: Record<TimelineStatus, string> = {
  pending: 'text-muted-foreground',
  in_progress: 'text-amber-600',
  done: 'text-emerald-600',
  skipped: 'text-neutral-400',
};

// ─── Add-task dialog ───────────────────────────────────────────────

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  bookingId: number | null;
  editing: TimelineTask | null;
  onSaved: () => void;
}

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({
  open,
  onOpenChange,
  bookingId,
  editing,
  onSaved,
}) => {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<TimelineCategory>('event');
  const [scheduledTime, setScheduledTime] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setLabel(editing.label);
      setCategory(editing.category);
      setScheduledTime(fmtTime(editing.scheduledTime));
      setDurationMin(
        editing.durationMin != null ? String(editing.durationMin) : '',
      );
      setAssignedTo(editing.assignedTo || '');
      setNotes(editing.notes || '');
    } else if (open) {
      setLabel('');
      setCategory('event');
      setScheduledTime('');
      setDurationMin('');
      setAssignedTo('');
      setNotes('');
    }
  }, [editing, open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error('Task label is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label: label.trim(),
        category,
        scheduledTime: scheduledTime || undefined,
        durationMin: durationMin ? Number(durationMin) : undefined,
        assignedTo: assignedTo.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      if (editing) {
        await BookingTimelineAPI.update(editing.id, payload);
        toast.success('Task updated');
      } else if (bookingId) {
        await BookingTimelineAPI.create(bookingId, payload);
        toast.success('Task added');
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit task' : 'Add task'}</DialogTitle>
          <DialogDescription>
            One step in the day-of timeline. Time + duration are optional —
            some tasks (like &quot;stock the bar&quot;) don&apos;t have a fixed slot.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="task-label">Label</Label>
            <Input
              id="task-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Bride entry + Rasm-e-Hina"
              maxLength={160}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TimelineCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="setup">Setup</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="teardown">Teardown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-time">Scheduled time</Label>
              <Input
                id="task-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-dur">Duration (min)</Label>
              <Input
                id="task-dur"
                type="number"
                inputMode="numeric"
                min={0}
                max={720}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-assignee">Assigned to</Label>
              <Input
                id="task-assignee"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. lead photographer"
                maxLength={120}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-notes">Notes (optional)</Label>
            <Textarea
              id="task-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions for the crew"
              maxLength={2000}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {editing ? 'Save' : 'Add task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Seed-template dialog ──────────────────────────────────────────

interface SeedDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  bookingId: number | null;
  bookingTime: string | null;
  onSaved: () => void;
}

const SeedTemplateDialog: React.FC<SeedDialogProps> = ({
  open,
  onOpenChange,
  bookingId,
  bookingTime,
  onSaved,
}) => {
  const [kind, setKind] = useState<TimelineEventKind>('walima');
  const [anchorTime, setAnchorTime] = useState('19:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setKind('walima');
      setAnchorTime(fmtTime(bookingTime) || '19:00');
    }
  }, [open, bookingTime]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;
    setSaving(true);
    try {
      const tasks = await BookingTimelineAPI.seedFromTemplate(bookingId, {
        kind,
        anchorTime,
      });
      toast.success(`${tasks.length} tasks seeded — edit any time`);
      onSaved();
      onOpenChange(false);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to seed template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Seed a Pakistani-wedding template</DialogTitle>
          <DialogDescription>
            We&apos;ll create the standard task list for the event kind you
            pick, anchored at the time you set. You can edit / delete / add
            tasks after.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label>Event kind</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as TimelineEventKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMELINE_EVENT_KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {TIMELINE_EVENT_KIND_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anchor-time">Anchor time (event start)</Label>
            <Input
              id="anchor-time"
              type="time"
              value={anchorTime}
              onChange={(e) => setAnchorTime(e.target.value)}
            />
            <p className="text-[10.5px] text-muted-foreground">
              Setup tasks back up from this; event tasks run around it;
              teardown follows. Anchor defaults to the booking&apos;s scheduled
              time.
            </p>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Seed timeline
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Event card ────────────────────────────────────────────────────

interface EventCardProps {
  event: TodayEvent;
  onReload: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onReload }) => {
  const { booking, tasks } = event;
  const [addOpen, setAddOpen] = useState(false);
  const [seedOpen, setSeedOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineTask | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TimelineTask | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const doneCount = tasks.filter((t) => t.status === 'done').length;

  const grouped: Record<TimelineCategory, TimelineTask[]> = {
    setup: tasks.filter((t) => t.category === 'setup'),
    event: tasks.filter((t) => t.category === 'event'),
    teardown: tasks.filter((t) => t.category === 'teardown'),
  };

  const cycleStatus = async (task: TimelineTask) => {
    // pending → in_progress → done → pending (skip 'skipped' on tap;
    // skipped is set via explicit secondary action)
    const next: TimelineStatus =
      task.status === 'pending'
        ? 'in_progress'
        : task.status === 'in_progress'
          ? 'done'
          : 'pending';
    setBusyTaskId(task.id);
    try {
      await BookingTimelineAPI.setStatus(task.id, next);
      onReload();
    } catch (e) {
      toast.error('Could not update status');
    } finally {
      setBusyTaskId(null);
    }
  };

  const setStatus = async (task: TimelineTask, status: TimelineStatus) => {
    setBusyTaskId(task.id);
    try {
      await BookingTimelineAPI.setStatus(task.id, status);
      onReload();
    } catch (e) {
      toast.error('Could not update status');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await BookingTimelineAPI.remove(confirmDelete.id);
      toast.success('Task removed');
      setConfirmDelete(null);
      onReload();
    } catch (e) {
      toast.error('Could not delete task');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold">{booking.customerName || 'Customer'}</h3>
              <Badge variant="outline" className="text-[10px]">
                Booking #{booking.id}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {booking.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
              {booking.bookingTime && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Start: {fmtTime(booking.bookingTime)}
                </span>
              )}
              {booking.primaryBusiness?.name && (
                <span className="inline-flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {booking.primaryBusiness.name}
                </span>
              )}
              {booking.customerPhone && (
                <a
                  href={`tel:${booking.customerPhone}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {booking.customerPhone}
                </a>
              )}
              <span className="inline-flex items-center gap-1 tabular-nums">
                {fmtPKR(booking.totalAmount)}
              </span>
            </div>
            {tasks.length > 0 && (
              <p className="text-[10.5px] text-muted-foreground">
                Progress: <strong>{doneCount}</strong> / {tasks.length} done
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {tasks.length === 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSeedOpen(true)}
                className="gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Seed template
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setAddOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add task
            </Button>
          </div>
        </div>

        {/* Empty timeline */}
        {tasks.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No timeline yet for this booking. Seed a Pakistani-wedding
              template OR add tasks one by one. Either way, the floor crew
              sees real-time progress as you tick tasks off.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(['setup', 'event', 'teardown'] as TimelineCategory[]).map((cat) => {
              const list = grouped[cat];
              if (list.length === 0) return null;
              const tone = CATEGORY_TONES[cat];
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${tone.bg} ${tone.text} ${tone.border}`}
                    >
                      {CATEGORY_LABELS[cat]}
                    </Badge>
                    <span className="text-[10.5px] text-muted-foreground">
                      {list.length} task{list.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {list.map((task) => {
                      const Icon = STATUS_ICON[task.status];
                      const tonecls = STATUS_TONES[task.status];
                      const isBusy = busyTaskId === task.id;
                      return (
                        <div
                          key={task.id}
                          className={`flex items-start gap-2 p-2 rounded-md border ${
                            task.status === 'done'
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : task.status === 'in_progress'
                                ? 'bg-amber-50/40 border-amber-200'
                                : task.status === 'skipped'
                                  ? 'bg-neutral-50 border-neutral-200 opacity-60'
                                  : 'bg-white border-border'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => cycleStatus(task)}
                            disabled={isBusy}
                            className="shrink-0 mt-0.5"
                            aria-label="Toggle status"
                          >
                            {isBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Icon className={`h-4 w-4 ${tonecls}`} />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {task.scheduledTime && (
                                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                                  {fmtTime(task.scheduledTime)}
                                </span>
                              )}
                              <span
                                className={`text-sm ${
                                  task.status === 'done'
                                    ? 'line-through text-muted-foreground'
                                    : ''
                                }`}
                              >
                                {task.label}
                              </span>
                              {task.durationMin != null && task.durationMin > 0 && (
                                <Badge variant="outline" className="text-[10px]">
                                  {task.durationMin} min
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10.5px] text-muted-foreground mt-0.5">
                              {task.assignedTo && (
                                <span className="mr-2">→ {task.assignedTo}</span>
                              )}
                              {task.notes && <span className="italic">&ldquo;{task.notes}&rdquo;</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            {task.status !== 'skipped' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground"
                                onClick={() => setStatus(task, 'skipped')}
                                disabled={isBusy}
                                aria-label="Mark skipped"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                setEditing(task);
                                setAddOpen(true);
                              }}
                              aria-label="Edit task"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => setConfirmDelete(task)}
                              disabled={deletingId === task.id}
                              aria-label="Delete task"
                            >
                              {deletingId === task.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <AddTaskDialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) setEditing(null);
        }}
        bookingId={booking.id}
        editing={editing}
        onSaved={onReload}
      />
      <SeedTemplateDialog
        open={seedOpen}
        onOpenChange={setSeedOpen}
        bookingId={booking.id}
        bookingTime={booking.bookingTime}
        onSaved={onReload}
      />
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Remove this task?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Soft-delete only — Wedding Wala keeps the row so the audit
              trail survives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

// ─── Main view ─────────────────────────────────────────────────────

const TodayView = () => {
  const [date, setDate] = useState<string>('');
  const [events, setEvents] = useState<TodayEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await BookingTimelineAPI.today();
      setDate(res.date || '');
      setEvents(res.events || []);
    } catch (e) {
      toast.error("Couldn't load today's events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Today on the floor</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-prose">
            Every active booking scheduled for today, with its full timeline.
            Tap any task to cycle pending → in progress → done. The crew sees
            real-time progress as you tick tasks off.
            {date && <span className="ml-1 text-foreground font-medium">({date})</span>}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-medium">No events today</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                No active bookings scheduled for today. Check back in the
                morning when your next event runs — and prep timelines in
                advance from the booking detail.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <EventCard key={ev.booking.id} event={ev} onReload={load} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TodayView;
