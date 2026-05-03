"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, X, Plane, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  BusinessAvailabilityAPI,
  WEEKDAY_BITS,
  type RecurringBlock,
} from "@/lib/api/businessAvailability";

interface BusinessAvailabilityFields {
  vacationMode?: boolean;
  vacationStartsAt?: string | null;
  vacationEndsAt?: string | null;
  vacationMessage?: string | null;
  honorMarketplaceBlackouts?: boolean;
}

function maskToLabels(mask: number): string {
  if (mask === 127) return "Every day";
  return WEEKDAY_BITS.filter((w) => (mask & w.bit) !== 0)
    .map((w) => w.label)
    .join(", ");
}

interface VacationModeSectionProps {
  businessId: number;
  initial: BusinessAvailabilityFields;
  onSaved: (fields: BusinessAvailabilityFields) => void;
}

function VacationModeSection({
  businessId,
  initial,
  onSaved,
}: VacationModeSectionProps) {
  const [vacationMode, setVacationMode] = useState<boolean>(
    !!initial.vacationMode,
  );
  const [startsAt, setStartsAt] = useState<string>(
    initial.vacationStartsAt ?? "",
  );
  const [endsAt, setEndsAt] = useState<string>(initial.vacationEndsAt ?? "");
  const [message, setMessage] = useState<string>(initial.vacationMessage ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await BusinessAvailabilityAPI.setVacationMode(businessId, {
        vacationMode,
        vacationStartsAt: startsAt || null,
        vacationEndsAt: endsAt || null,
        vacationMessage: message.trim() || null,
      });
      toast({
        title: vacationMode ? "Vacation mode on" : "Vacation mode off",
        description: vacationMode
          ? "We'll refuse new bookings inside the window."
          : "Bookings resumed.",
      });
      onSaved({
        vacationMode,
        vacationStartsAt: startsAt || null,
        vacationEndsAt: endsAt || null,
        vacationMessage: message.trim() || null,
      });
    } catch (e: any) {
      toast({
        title: "Couldn't save",
        description: e?.response?.data?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 rounded-full bg-bridal-cream p-2">
            <Plane className="h-4 w-4 text-bridal-gold-dark" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neutral-800">
              Vacation mode
            </h4>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Listing stays visible. Bookings inside the window are refused.
            </p>
          </div>
        </div>
        <Switch
          checked={vacationMode}
          onCheckedChange={setVacationMode}
          disabled={saving}
        />
      </div>

      {vacationMode ? (
        <div className="space-y-3 pt-2 border-t border-neutral-100">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[12px]">Starts</Label>
              <Input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[12px]">Ends</Label>
              <Input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-[12px]">
              Message (shown on listing badge)
            </Label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Back on Aug 16"
              maxLength={200}
            />
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
          Save
        </Button>
      </div>
    </div>
  );
}

interface RecurringBlocksSectionProps {
  businessId: number;
}

function RecurringBlocksSection({ businessId }: RecurringBlocksSectionProps) {
  const [blocks, setBlocks] = useState<RecurringBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [mask, setMask] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    BusinessAvailabilityAPI.listRecurringBlocks(businessId)
      .then((res) => setBlocks(res?.blocks ?? []))
      .catch(() => setBlocks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const toggleBit = (bit: number) =>
    setMask((m) => ((m & bit) !== 0 ? m & ~bit : m | bit));

  const submit = async () => {
    if (mask <= 0) {
      toast({
        title: "Pick at least one weekday",
        variant: "destructive",
      });
      return;
    }
    if (!startDate) {
      toast({ title: "Start date required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await BusinessAvailabilityAPI.createRecurringBlock(businessId, {
        weekdayMask: mask,
        startDate,
        endDate: endDate || null,
        reason: reason.trim() || undefined,
      });
      toast({ title: "Recurring block added" });
      setShowForm(false);
      setMask(0);
      setStartDate("");
      setEndDate("");
      setReason("");
      load();
    } catch (e: any) {
      toast({
        title: "Couldn't save",
        description: e?.response?.data?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await BusinessAvailabilityAPI.deleteRecurringBlock(businessId, id);
      toast({ title: "Block removed" });
      load();
    } catch (e: any) {
      toast({
        title: "Couldn't remove",
        description: e?.response?.data?.message ?? "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 rounded-full bg-bridal-cream p-2">
            <Calendar className="h-4 w-4 text-bridal-gold-dark" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neutral-800">
              Recurring blocks
            </h4>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              "Every Monday closed", "No Friday Jumma weddings". Materialised
              on lookup — one row covers years.
            </p>
          </div>
        </div>
        {!showForm ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 shrink-0"
            onClick={() => setShowForm(true)}
            disabled={loading}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <div className="space-y-3 pt-2 border-t border-neutral-100">
          <div>
            <Label className="text-[12px]">Weekdays</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {WEEKDAY_BITS.map((w) => (
                <button
                  key={w.bit}
                  type="button"
                  onClick={() => toggleBit(w.bit)}
                  className={cn(
                    "px-2.5 h-7 rounded-md border text-[12px] font-medium transition",
                    (mask & w.bit) !== 0
                      ? "bg-bridal-gold-dark text-white border-bridal-gold-dark"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300",
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[12px]">Starts</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[12px]">
                Ends <span className="text-neutral-400">(optional)</span>
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-[12px]">
              Reason <span className="text-neutral-400">(optional)</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="e.g. Jumma break"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : null}
              Save block
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : blocks.length === 0 ? (
        <p className="text-sm text-neutral-400 italic">
          No recurring blocks set.
        </p>
      ) : (
        <div className="space-y-1.5">
          {blocks.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-md border border-neutral-100 bg-neutral-50/40 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium text-neutral-800">
                  {maskToLabels(b.weekdayMask)}
                  {b.slotTemplateId
                    ? ` · slot #${b.slotTemplateId}`
                    : ""}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {b.startDate}
                  {b.endDate ? ` → ${b.endDate}` : " → ongoing"}
                  {b.reason ? ` · ${b.reason}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 shrink-0 text-neutral-500 hover:text-red-600"
                onClick={() => remove(b.id)}
                aria-label="Remove block"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AvailabilitySettingsCardProps {
  businessId: number;
  initial?: BusinessAvailabilityFields;
}

/**
 * Vendor-side availability settings: BK-048 vacation mode + BK-011 recurring
 * blocks. Drop into a business edit page; pass current Business row's
 * vacation-mode fields as `initial`.
 */
export function AvailabilitySettingsCard({
  businessId,
  initial = {},
}: AvailabilitySettingsCardProps) {
  const [vacFields, setVacFields] = useState<BusinessAvailabilityFields>(initial);

  return (
    <Card className="p-4">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-neutral-700">Availability</h3>
        <p className="text-[12px] text-neutral-500 mt-0.5">
          Control when this business accepts bookings.
        </p>
        {vacFields.vacationMode ? (
          <Badge variant="secondary" className="mt-2 text-[10.5px]">
            On vacation
          </Badge>
        ) : null}
      </div>
      <div className="space-y-3">
        <VacationModeSection
          businessId={businessId}
          initial={vacFields}
          onSaved={setVacFields}
        />
        <RecurringBlocksSection businessId={businessId} />
      </div>
    </Card>
  );
}

export default AvailabilitySettingsCard;
