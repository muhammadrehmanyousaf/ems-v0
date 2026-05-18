'use client';

/**
 * Phase 0 #6.2 + #6.3 + #6.4 — Availability admin tab.
 *
 * Today the slot engine (BK-008/15/19) drives every customer-facing
 * availability check, but vendors have NO UI to:
 *   - declare their slot templates (Morning / Afternoon / Evening)
 *   - mark recurring closed days (e.g. "Closed every Monday")
 *   - override capacity for specific dates (e.g. "Sat Aug 15: only 1
 *     booking instead of 3 because the lawn is under repair")
 *
 * Customers couldn't book without templates; vendors couldn't tell
 * the engine they were closed every Monday without contacting
 * support. This tab closes all three gaps.
 *
 * Three sections, each independently usable:
 *   1. Slot Templates — list + add/edit/deactivate + seed-defaults
 *   2. Recurring Blocks — list + add/delete (existing BK-011 backend)
 *   3. Capacity Overrides — list + add/clear (existing BK-019 backend)
 *
 * Live-system safety: pure additive — all three backends shipped
 * months ago and are LIVE on every booking flow. We're only adding
 * the missing vendor-facing UI; no backend mutation, no migration.
 *
 * Weekday mask encoding: Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32,
 * Sun=64 (bitfield). All-days = 127. Matches slotService.js helper
 * `_weekdayBitForDate` and the `WEEKDAY_BITS` array exported from
 * lib/api/businessAvailability.ts.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Calendar,
  Clock,
  Repeat,
  TrendingUp,
  Trash2,
  Pencil,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import {
  BusinessAvailabilityAPI,
  SlotTemplatesAPI,
  CapacityOverridesAPI,
  WEEKDAY_BITS,
  type SlotTemplate,
  type RecurringBlock,
  type CapacityOverride,
} from '@/lib/api/businessAvailability';
import { useBusiness } from '@/context/BusinessContext';

function weekdayLabel(mask: number): string {
  if (mask === 127) return 'Every day';
  const days = WEEKDAY_BITS.filter((d) => (mask & d.bit) !== 0).map((d) => d.label);
  return days.length === 0 ? '—' : days.join(', ');
}

function fmtTime(t: string): string {
  // Sequelize TIME comes back as HH:MM:SS — display as HH:MM.
  if (!t) return '—';
  const m = String(t).match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : t;
}

// ─── Slot Template dialog ──────────────────────────────────────────

interface SlotDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: SlotTemplate | null;
  onSaved: () => void;
  businessId: number;
}

const SlotTemplateDialog: React.FC<SlotDialogProps> = ({
  open,
  onOpenChange,
  editing,
  onSaved,
  businessId,
}) => {
  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState('1');
  const [bufferAfterMinutes, setBufferAfter] = useState('0');
  const [unitGuestCapacity, setUnitGuestCap] = useState('');
  const [mask, setMask] = useState<number>(127);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setLabel(editing.label || '');
      setStartTime(fmtTime(editing.startTime) || '');
      setEndTime(fmtTime(editing.endTime) || '');
      setCapacity(String(editing.capacity ?? 1));
      setBufferAfter(String(editing.bufferAfterMinutes ?? 0));
      setUnitGuestCap(
        editing.unitGuestCapacity != null ? String(editing.unitGuestCapacity) : '',
      );
      setMask(editing.weekdayMask ?? 127);
    } else {
      setLabel('');
      setStartTime('');
      setEndTime('');
      setCapacity('1');
      setBufferAfter('0');
      setUnitGuestCap('');
      setMask(127);
    }
  }, [editing, open]);

  const toggleDay = (bit: number) => {
    setMask((m) => (m & bit ? m & ~bit : m | bit));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !startTime || !endTime) {
      toast.error('Label, start time, and end time are required');
      return;
    }
    if (startTime >= endTime) {
      toast.error('End time must be after start time');
      return;
    }
    if (mask === 0) {
      toast.error('Pick at least one day of the week');
      return;
    }
    const capN = Math.max(1, Number(capacity) || 1);
    const bufN = Math.max(0, Math.min(720, Number(bufferAfterMinutes) || 0));
    const ugN = unitGuestCapacity.trim() ? Math.max(1, Number(unitGuestCapacity) || 1) : null;

    setSaving(true);
    try {
      if (editing) {
        await SlotTemplatesAPI.update(businessId, editing.id, {
          label: label.trim(),
          startTime,
          endTime,
          capacity: capN,
          weekdayMask: mask,
          bufferAfterMinutes: bufN,
          unitGuestCapacity: ugN,
        });
        toast.success('Slot template updated');
      } else {
        await SlotTemplatesAPI.create(businessId, {
          label: label.trim(),
          startTime,
          endTime,
          capacity: capN,
          weekdayMask: mask,
          bufferAfterMinutes: bufN,
          unitGuestCapacity: ugN,
        });
        toast.success('Slot template added');
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save slot');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit slot template' : 'Add slot template'}</DialogTitle>
          <DialogDescription>
            Slot templates define the time bands you accept bookings for
            (e.g. Morning 8 AM–2 PM, Evening 6 PM–11 PM). Each slot has its
            own capacity — customers can only book if at least one slot has
            free capacity on their date.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="slot-label">Label</Label>
            <Input
              id="slot-label"
              placeholder="e.g. Morning, Evening, Mehndi"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={60}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="slot-start">Start time</Label>
              <Input
                id="slot-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slot-end">End time</Label>
              <Input
                id="slot-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="slot-cap">Capacity (concurrent bookings)</Label>
              <Input
                id="slot-cap"
                type="number"
                inputMode="numeric"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slot-buf">Buffer after (mins)</Label>
              <Input
                id="slot-buf"
                type="number"
                inputMode="numeric"
                min={0}
                value={bufferAfterMinutes}
                onChange={(e) => setBufferAfter(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slot-ug">Unit guest capacity (optional)</Label>
            <Input
              id="slot-ug"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="e.g. 200 (each booking unit serves up to this many)"
              value={unitGuestCapacity}
              onChange={(e) => setUnitGuestCap(e.target.value)}
            />
            <p className="text-[10.5px] text-muted-foreground">
              Caterers + venues: when set, the engine measures capacity in
              guests, not bookings. A 400-guest hall on a 200-guest-unit slot
              accepts up to 2 events. Leave blank for plain booking-count cap.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Days of the week</Label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_BITS.map((d) => {
                const on = (mask & d.bit) !== 0;
                return (
                  <button
                    key={d.bit}
                    type="button"
                    onClick={() => toggleDay(d.bit)}
                    className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                      on
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10.5px] text-muted-foreground">
              {weekdayLabel(mask)}
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
              {editing ? 'Save changes' : 'Add slot'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Recurring Block dialog ────────────────────────────────────────

interface RecurringBlockDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
  businessId: number;
  templates: SlotTemplate[];
}

const RecurringBlockDialog: React.FC<RecurringBlockDialogProps> = ({
  open,
  onOpenChange,
  onSaved,
  businessId,
  templates,
}) => {
  const [mask, setMask] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [slotTemplateId, setSlotTemplateId] = useState<string>('all');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMask(0);
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate('');
      setSlotTemplateId('all');
      setReason('');
    }
  }, [open]);

  const toggleDay = (bit: number) => {
    setMask((m) => (m & bit ? m & ~bit : m | bit));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mask === 0) {
      toast.error('Pick at least one weekday to block');
      return;
    }
    if (!startDate) {
      toast.error('Start date is required');
      return;
    }
    setSaving(true);
    try {
      await BusinessAvailabilityAPI.createRecurringBlock(businessId, {
        weekdayMask: mask,
        slotTemplateId: slotTemplateId === 'all' ? null : Number(slotTemplateId),
        startDate,
        endDate: endDate || null,
        reason: reason.trim() || undefined,
      });
      toast.success('Recurring block added');
      onSaved();
      onOpenChange(false);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save block');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add recurring closed days</DialogTitle>
          <DialogDescription>
            Closing the same day every week (e.g. Mondays) or every weekend?
            Set the rule here and the engine blocks bookings on matching
            dates automatically until you delete the rule or pass the end date.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Days of the week to block</Label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_BITS.map((d) => {
                const on = (mask & d.bit) !== 0;
                return (
                  <button
                    key={d.bit}
                    type="button"
                    onClick={() => toggleDay(d.bit)}
                    className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                      on
                        ? 'bg-destructive text-destructive-foreground border-destructive'
                        : 'bg-background text-muted-foreground border-border hover:border-destructive/50'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rb-start">Starts</Label>
              <Input
                id="rb-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rb-end">Ends (optional)</Label>
              <Input
                id="rb-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Open-ended"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Scope</Label>
            <Select value={slotTemplateId} onValueChange={setSlotTemplateId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Block the whole day</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    Only the &quot;{t.label}&quot; slot
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rb-reason">Reason (optional)</Label>
            <Input
              id="rb-reason"
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Weekly maintenance, family day"
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
            <Button type="submit" disabled={saving} variant="destructive">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Add block
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Capacity Override dialog ──────────────────────────────────────

interface CapacityOverrideDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
  businessId: number;
  templates: SlotTemplate[];
}

const CapacityOverrideDialog: React.FC<CapacityOverrideDialogProps> = ({
  open,
  onOpenChange,
  onSaved,
  businessId,
  templates,
}) => {
  const [forDate, setForDate] = useState('');
  const [slotTemplateId, setSlotTemplateId] = useState<string>('all');
  const [capacityOverride, setCap] = useState('1');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForDate(new Date().toISOString().slice(0, 10));
      setSlotTemplateId('all');
      setCap('1');
      setReason('');
    }
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forDate) {
      toast.error('Date is required');
      return;
    }
    const n = Number(capacityOverride);
    if (!Number.isInteger(n) || n < 0) {
      toast.error('Capacity must be a non-negative integer');
      return;
    }
    setSaving(true);
    try {
      await CapacityOverridesAPI.set(businessId, {
        forDate,
        slotTemplateId: slotTemplateId === 'all' ? null : Number(slotTemplateId),
        capacityOverride: n,
        reason: reason.trim() || undefined,
      });
      toast.success('Capacity override saved');
      onSaved();
      onOpenChange(false);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save override');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add capacity override</DialogTitle>
          <DialogDescription>
            Override capacity for a specific date (e.g. &quot;Saturday Aug 15:
            only 1 booking instead of 3 because lawn is under repair&quot;).
            Set capacity to <strong>0</strong> to effectively close that
            date/slot — same effect as a one-off block.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="co-date">Date</Label>
            <Input
              id="co-date"
              type="date"
              value={forDate}
              onChange={(e) => setForDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Scope</Label>
            <Select value={slotTemplateId} onValueChange={setSlotTemplateId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Whole day (all slots)</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    Only the &quot;{t.label}&quot; slot
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="co-cap">New capacity for this date</Label>
            <Input
              id="co-cap"
              type="number"
              inputMode="numeric"
              min={0}
              value={capacityOverride}
              onChange={(e) => setCap(e.target.value)}
            />
            <p className="text-[10.5px] text-muted-foreground">
              0 = closed for that date/slot. Higher than your usual capacity =
              one-off boost (e.g. shaadi-season Saturday).
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="co-reason">Reason (optional)</Label>
            <Input
              id="co-reason"
              maxLength={255}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Lawn under repair"
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
              Save override
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main tab ──────────────────────────────────────────────────────

const AvailabilityTab = () => {
  const { business } = useBusiness();
  const businessId = business?.id ? Number(business.id) : null;

  const [templates, setTemplates] = useState<SlotTemplate[]>([]);
  const [recurring, setRecurring] = useState<RecurringBlock[]>([]);
  const [overrides, setOverrides] = useState<CapacityOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<SlotTemplate | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<SlotTemplate | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [deletingRecurringId, setDeletingRecurringId] = useState<number | null>(null);

  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [clearingOverrideId, setClearingOverrideId] = useState<number | null>(null);

  const load = React.useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [tpl, rb, co] = await Promise.all([
        SlotTemplatesAPI.list(businessId, { onlyActive: false }),
        BusinessAvailabilityAPI.listRecurringBlocks(businessId).then(
          (r) => r?.blocks || [],
        ),
        CapacityOverridesAPI.list(businessId, {}),
      ]);
      setTemplates(tpl);
      setRecurring(rb);
      setOverrides(co);
    } catch (e) {
      toast.error('Could not load availability data');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSeedDefaults = async () => {
    if (!businessId) return;
    setSeeding(true);
    try {
      const seeded = await SlotTemplatesAPI.seedDefaults(businessId);
      toast.success(`${seeded.length} default slots created`);
      await load();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to seed defaults');
    } finally {
      setSeeding(false);
    }
  };

  const handleDeactivateSlot = async () => {
    if (!businessId || !confirmDeactivate) return;
    setDeactivatingId(confirmDeactivate.id);
    try {
      await SlotTemplatesAPI.deactivate(businessId, confirmDeactivate.id);
      toast.success('Slot deactivated');
      setConfirmDeactivate(null);
      await load();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to deactivate');
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleDeleteRecurring = async (id: number) => {
    if (!businessId) return;
    setDeletingRecurringId(id);
    try {
      await BusinessAvailabilityAPI.deleteRecurringBlock(businessId, id);
      toast.success('Recurring block deleted');
      await load();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeletingRecurringId(null);
    }
  };

  const handleClearOverride = async (id: number) => {
    if (!businessId) return;
    setClearingOverrideId(id);
    try {
      await CapacityOverridesAPI.clear(businessId, id);
      toast.success('Override cleared');
      await load();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to clear override');
    } finally {
      setClearingOverrideId(null);
    }
  };

  if (!businessId) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* ─── Slot Templates ─── */}
      <section className="space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Slot templates</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-prose">
              Each slot is a time band you accept bookings for, with its own
              capacity. Customers can only book if at least one slot has free
              capacity on their date. New here? Seed three defaults (Morning
              / Afternoon / Evening) and customise from there.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!loading && templates.length === 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSeedDefaults}
                disabled={seeding}
                className="gap-1.5"
              >
                {seeding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Seed defaults
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                setEditingSlot(null);
                setSlotDialogOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add slot
            </Button>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center space-y-2">
              <Clock className="h-6 w-6 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">No slot templates yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Without slots, customers see &quot;no availability&quot;.
                Seed the defaults to start accepting bookings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {templates.map((t) => (
              <Card key={t.id} className={t.isActive ? '' : 'opacity-60'}>
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{t.label}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {fmtTime(t.startTime)}–{fmtTime(t.endTime)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        Cap {t.capacity}
                        {t.unitGuestCapacity ? ` · ${t.unitGuestCapacity} guests/unit` : ''}
                      </Badge>
                      {t.bufferAfterMinutes > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{t.bufferAfterMinutes} min buffer
                        </Badge>
                      )}
                      {!t.isActive && (
                        <Badge variant="secondary" className="text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {weekdayLabel(t.weekdayMask)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingSlot(t);
                        setSlotDialogOpen(true);
                      }}
                      aria-label="Edit slot"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {t.isActive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmDeactivate(t)}
                        aria-label="Deactivate slot"
                        disabled={deactivatingId === t.id}
                      >
                        {deactivatingId === t.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ─── Recurring Blocks ─── */}
      <section className="space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Recurring closed days</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-prose">
              Closing every Monday? Every Sunday-night slot? Set the rule once
              and the booking engine blocks all matching dates automatically.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setRecurringDialogOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add rule
          </Button>
        </div>

        {loading ? (
          <Skeleton className="h-12 w-full" />
        ) : recurring.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">
                No recurring blocks. You&apos;re open every day your slot
                templates allow.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {recurring.map((r) => {
              const tpl = r.slotTemplateId
                ? templates.find((t) => t.id === r.slotTemplateId)
                : null;
              return (
                <Card key={r.id}>
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">
                          {weekdayLabel(r.weekdayMask)}
                        </p>
                        <Badge variant="outline" className="text-[10px]">
                          {tpl ? `Only "${tpl.label}"` : 'Whole day'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        From {r.startDate}
                        {r.endDate ? ` to ${r.endDate}` : ' · open-ended'}
                        {r.reason ? ` · "${r.reason}"` : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteRecurring(r.id)}
                      disabled={deletingRecurringId === r.id}
                      aria-label="Delete recurring block"
                    >
                      {deletingRecurringId === r.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Capacity Overrides ─── */}
      <section className="space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Per-date capacity overrides</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-prose">
              Override capacity for a specific date — boost it for a high-
              demand Saturday or drop it to 0 for a one-off closure. Override
              wins over the slot-template default for that date.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setOverrideDialogOpen(true)}
            className="gap-1.5"
            disabled={templates.length === 0}
          >
            <Plus className="h-3.5 w-3.5" />
            Add override
          </Button>
        </div>

        {loading ? (
          <Skeleton className="h-12 w-full" />
        ) : overrides.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">
                No date overrides set. Each date uses its slot template&apos;s
                default capacity.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {overrides.map((o) => {
              const tpl = o.slotTemplateId
                ? templates.find((t) => t.id === o.slotTemplateId)
                : null;
              return (
                <Card key={o.id}>
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm font-medium">{o.forDate}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {tpl ? `Only "${tpl.label}"` : 'Whole day'}
                        </Badge>
                        <Badge
                          variant={o.capacityOverride === 0 ? 'destructive' : 'default'}
                          className="text-[10px]"
                        >
                          {o.capacityOverride === 0
                            ? 'Closed'
                            : `Capacity ${o.capacityOverride}`}
                        </Badge>
                      </div>
                      {o.reason && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          &ldquo;{o.reason}&rdquo;
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleClearOverride(o.id)}
                      disabled={clearingOverrideId === o.id}
                      aria-label="Clear override"
                    >
                      {clearingOverrideId === o.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Dialogs */}
      <SlotTemplateDialog
        open={slotDialogOpen}
        onOpenChange={setSlotDialogOpen}
        editing={editingSlot}
        onSaved={load}
        businessId={businessId}
      />
      <RecurringBlockDialog
        open={recurringDialogOpen}
        onOpenChange={setRecurringDialogOpen}
        onSaved={load}
        businessId={businessId}
        templates={templates}
      />
      <CapacityOverrideDialog
        open={overrideDialogOpen}
        onOpenChange={setOverrideDialogOpen}
        onSaved={load}
        businessId={businessId}
        templates={templates}
      />
      <AlertDialog
        open={!!confirmDeactivate}
        onOpenChange={(o) => !o && setConfirmDeactivate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Deactivate {confirmDeactivate?.label}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The slot disappears from new customer bookings immediately.
              Existing confirmed bookings on this slot are untouched. You can
              re-create the slot later if you change your mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deactivatingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeactivateSlot();
              }}
              disabled={!!deactivatingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deactivatingId && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              )}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AvailabilityTab;
