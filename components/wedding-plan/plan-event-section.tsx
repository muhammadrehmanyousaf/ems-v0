"use client";

/**
 * Shaadi Plan — one wedding function rendered as a section.
 *
 * A `WeddingEvent` becomes a card: its shared date / city / guests in the
 * header (editable via the add-event dialog in edit mode, spec §3.1),
 * every vendor line beneath it (`PlanItemRow`), an "Add vendor" action
 * that opens the event-scoped shortlist picker, and a per-event subtotal.
 *
 * The whole surface is flag-gated upstream — this section is only mounted
 * behind `useWeddingPlanFlag()` on the plan builder.
 */

import * as React from "react";
import {
  CalendarDays,
  MapPin,
  Users,
  Clock,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Sparkles,
} from "lucide-react";
import { SectionCard } from "@/components/user-dashboard";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  WeddingPlansAPI,
  type WeddingEvent,
  type PlanItem,
} from "@/lib/api/weddingPlans";
import {
  eventTypeLabel,
  fmtPlanDate,
  fmtPKR,
  toNum,
} from "@/lib/wedding-plan-events";
import { AddEventDialog } from "@/components/wedding-plan/add-event-dialog";
import { AddVendorDialog } from "@/components/wedding-plan/add-vendor-dialog";
import { PlanItemRow } from "@/components/wedding-plan/plan-item-row";

interface PlanEventSectionProps {
  planId: number;
  event: WeddingEvent;
  onChanged?: () => void;
}

/** Active lines drive the subtotal + "already added" set (spec §3.2). */
function activeItems(items: PlanItem[] | undefined): PlanItem[] {
  return (items ?? []).filter(
    (it) => it.status !== "removed" && it.status !== "declined",
  );
}

export function PlanEventSection({ planId, event, onChanged }: PlanEventSectionProps) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [addVendorOpen, setAddVendorOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);

  const items = activeItems(event.items);
  const subtotal = items.reduce((sum, it) => sum + toNum(it.agreedAmount), 0);
  const bookedCount = items.filter((it) => it.status === "booked").length;
  const label = event.title?.trim() || eventTypeLabel(event.eventType);
  const existingBusinessIds = items.map((it) => it.businessId);

  // Compact header line for the vendor picker ("Mehndi · 12 Dec").
  const eventLabel = event.eventDate
    ? `${label} · ${fmtPlanDate(event.eventDate)}`
    : label;

  const removeEvent = async () => {
    if (bookedCount > 0) {
      toast({
        title: "Cancel the bookings first",
        description:
          "This function has booked vendors. Cancel those bookings from their pages before removing the function.",
        variant: "destructive",
      });
      return;
    }
    if (
      !confirm(
        `Remove the ${label} function and its ${items.length} vendor line${
          items.length === 1 ? "" : "s"
        }?`,
      )
    )
      return;
    setRemoving(true);
    try {
      await WeddingPlansAPI.removeEvent(planId, event.id);
      toast({ title: "Function removed" });
      onChanged?.();
    } catch (e) {
      const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
      const msg =
        data?.message === "EVENT_HAS_BOOKINGS"
          ? "This function has booked vendors — cancel those bookings first."
          : data?.message || (e as Error)?.message || "Couldn't remove the function";
      toast({ title: "Couldn't remove", description: msg, variant: "destructive" });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <SectionCard
      title={
        <span className="inline-flex items-center gap-2">
          {label}
          {bookedCount > 0 && (
            <span className="font-bridal not-italic text-[10px] uppercase tracking-[0.2em] text-[#3F6B43] border border-bridal-sage/45 bg-bridal-sage/15 rounded-full px-2 py-0.5">
              {bookedCount} booked
            </span>
          )}
        </span>
      }
      description={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {fmtPlanDate(event.eventDate)}
          </span>
          {event.slotTime && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {event.slotTime}
            </span>
          )}
          {event.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.city}
            </span>
          )}
          {event.expectedGuests ? (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />~{event.expectedGuests} guests
            </span>
          ) : null}
        </span>
      }
      action={
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-xs text-bridal-text-soft hover:text-bridal-gold-dark"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-neutral-400 hover:text-bridal-coral"
            onClick={removeEvent}
            disabled={removing}
            aria-label="Remove function"
          >
            {removing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      }
    >
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-bridal-beige bg-bridal-cream/50 p-5 text-center">
          <Sparkles className="h-5 w-5 text-bridal-gold mx-auto mb-1.5" />
          <p className="text-sm font-medium text-bridal-charcoal">
            No vendors on this function yet
          </p>
          <p className="text-xs text-bridal-text-soft mt-1 max-w-xs mx-auto">
            Shortlist a hall, caterer, photographer or any vendor for your {label}.
          </p>
          <Button size="sm" className="mt-3 gap-1.5" onClick={() => setAddVendorOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add a vendor
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <PlanItemRow
              key={it.id}
              planId={planId}
              eventId={event.id}
              item={it}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}

      {/* Footer: add-vendor + per-event subtotal */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-bridal-beige/70 pt-3">
        {items.length > 0 ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setAddVendorOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add another vendor
          </Button>
        ) : (
          <span />
        )}
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-bridal-text-label font-medium">
            {label} subtotal
          </p>
          <p className="font-display italic text-[18px] text-bridal-charcoal tabular-nums leading-tight">
            {fmtPKR(subtotal)}
          </p>
        </div>
      </div>

      <AddEventDialog
        planId={planId}
        open={editOpen}
        onOpenChange={setEditOpen}
        event={event}
        onSaved={() => {
          setEditOpen(false);
          onChanged?.();
        }}
      />
      <AddVendorDialog
        planId={planId}
        eventId={event.id}
        eventLabel={eventLabel}
        existingBusinessIds={existingBusinessIds}
        open={addVendorOpen}
        onOpenChange={setAddVendorOpen}
        onAdded={() => onChanged?.()}
      />
    </SectionCard>
  );
}

export default PlanEventSection;
