"use client";

/**
 * Shaadi Plan — add / edit a wedding function (WeddingEvent).
 *
 * A function's date / city / guests / slot are defined ONCE here and
 * shared by every vendor line inside it (spec §3.1). Doubles as the
 * edit dialog: pass `event` to prefill + PATCH instead of POST.
 */

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CalendarHeart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  WeddingPlansAPI,
  type CreateEventInput,
  type WeddingEvent,
  type WeddingEventType,
} from "@/lib/api/weddingPlans";
import { EVENT_TYPES, eventTypeOrder } from "@/lib/wedding-plan-events";

const SLOTS = ["Morning", "Afternoon", "Evening", "Night"];

interface AddEventDialogProps {
  planId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this event instead of creating a new one. */
  event?: WeddingEvent | null;
  onSaved?: (event: WeddingEvent) => void;
}

export function AddEventDialog({
  planId,
  open,
  onOpenChange,
  event,
  onSaved,
}: AddEventDialogProps) {
  const editing = !!event;
  const [eventType, setEventType] = React.useState<WeddingEventType>("mehndi");
  const [title, setTitle] = React.useState("");
  const [eventDate, setEventDate] = React.useState("");
  const [city, setCity] = React.useState("");
  const [expectedGuests, setExpectedGuests] = React.useState("");
  const [slotTime, setSlotTime] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Prefill on open (edit mode) or reset (create mode).
  React.useEffect(() => {
    if (!open) return;
    setEventType((event?.eventType as WeddingEventType) || "mehndi");
    setTitle(event?.title || "");
    setEventDate(event?.eventDate || "");
    setCity(event?.city || "");
    setExpectedGuests(event?.expectedGuests != null ? String(event.expectedGuests) : "");
    setSlotTime(event?.slotTime || "");
  }, [open, event]);

  const handleSubmit = async () => {
    const payload: CreateEventInput = { eventType };
    if (title.trim()) payload.title = title.trim();
    if (eventDate) payload.eventDate = eventDate;
    if (city.trim()) payload.city = city.trim();
    if (expectedGuests.trim()) {
      const n = Number(expectedGuests);
      if (Number.isFinite(n) && n > 0) payload.expectedGuests = Math.floor(n);
    }
    if (slotTime) payload.slotTime = slotTime;
    // sortOrder defaults to the canonical cultural running order so a new
    // function slots into the right place (mayoun → walima) without a drag.
    payload.sortOrder = eventTypeOrder(eventType);

    setSubmitting(true);
    try {
      const saved = editing
        ? await WeddingPlansAPI.updateEvent(planId, event!.id, payload)
        : await WeddingPlansAPI.addEvent(planId, payload);
      toast({ title: editing ? "Function updated" : "Function added" });
      onSaved?.(saved);
      onOpenChange(false);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't save this function";
      toast({ title: "Couldn't save", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const activeHint = EVENT_TYPES.find((t) => t.value === eventType)?.hint;

  return (
    <Dialog open={open} onOpenChange={(o) => (!submitting || o) && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarHeart className="h-4 w-4 text-bridal-gold" />
            {editing ? "Edit function" : "Add a function"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the date, city or guest count — it applies to every vendor in this function."
              : "Each function shares one date, city and guest count across all its vendors."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Function</Label>
            <Select
              value={eventType}
              onValueChange={(v) => setEventType(v as WeddingEventType)}
              disabled={submitting}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Choose a function" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeHint && (
              <p className="text-[11px] text-bridal-text-soft mt-1 italic">{activeHint}</p>
            )}
          </div>

          <div>
            <Label className="text-xs">
              Custom label <span className="text-neutral-400">(optional)</span>
            </Label>
            <Input
              className="h-9 text-sm"
              placeholder={`e.g. "Dulhan's Mehndi"`}
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                className="h-9 text-sm"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <Label className="text-xs">Time of day</Label>
              <Select value={slotTime} onValueChange={setSlotTime} disabled={submitting}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Slot" />
                </SelectTrigger>
                <SelectContent>
                  {SLOTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">City</Label>
              <Input
                className="h-9 text-sm"
                placeholder="Lahore"
                value={city}
                onChange={(e) => setCity(e.target.value.slice(0, 80))}
                disabled={submitting}
              />
            </div>
            <div>
              <Label className="text-xs">Guests</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                className="h-9 text-sm"
                placeholder="e.g. 250"
                value={expectedGuests}
                onChange={(e) => setExpectedGuests(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                {editing ? "Saving…" : "Adding…"}
              </>
            ) : editing ? (
              "Save changes"
            ) : (
              "Add function"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddEventDialog;
