"use client";

/**
 * Shaadi Plan — "Add to my wedding plan" entry-point picker (spec §9).
 *
 * The additive action shown on vendor cards + the vendor detail page. It
 * does NOT touch the existing Book / Request-quote CTAs. Given a business,
 * it lets the customer choose which plan and which function to shortlist
 * it onto, creating a plan or a function inline if they have none yet.
 *
 * Two-step flow:
 *   1. pick-plan  — list the caller's plans (or create one).
 *   2. pick-event — list that plan's functions (or add one), then POST the
 *      vendor line via `WeddingPlansAPI.addItem` and close.
 *
 * Flag-gated by the wrapping button — this dialog is never mounted while
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
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sparkles,
  Plus,
  ChevronRight,
  CalendarDays,
  MapPin,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  WeddingPlansAPI,
  type WeddingPlan,
  type PlanFull,
} from "@/lib/api/weddingPlans";
import { eventTypeLabel, fmtPlanDate } from "@/lib/wedding-plan-events";
import { CreatePlanDialog } from "@/components/wedding-plan/create-plan-dialog";
import { AddEventDialog } from "@/components/wedding-plan/add-event-dialog";

interface AddToPlanDialogProps {
  businessId: number;
  businessName: string;
  vendorType?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function planTitle(p: WeddingPlan): string {
  if (p.title?.trim()) return p.title;
  if (p.brideName && p.groomName) return `${p.brideName} & ${p.groomName}`;
  if (p.brideName) return `${p.brideName}'s Wedding`;
  if (p.groomName) return `${p.groomName}'s Wedding`;
  return "Your Wedding";
}

export function AddToPlanDialog({
  businessId,
  businessName,
  vendorType,
  open,
  onOpenChange,
}: AddToPlanDialogProps) {
  const [step, setStep] = React.useState<"pick-plan" | "pick-event">("pick-plan");
  const [plans, setPlans] = React.useState<WeddingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = React.useState(false);
  const [planFull, setPlanFull] = React.useState<PlanFull | null>(null);
  const [loadingPlan, setLoadingPlan] = React.useState(false);
  const [addingEventId, setAddingEventId] = React.useState<number | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [addEventOpen, setAddEventOpen] = React.useState(false);

  const loadPlans = React.useCallback(async () => {
    setLoadingPlans(true);
    try {
      const rows = await WeddingPlansAPI.listMine();
      setPlans(rows);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't load your plans";
      toast({ title: "Couldn't load", description: msg, variant: "destructive" });
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  // Reset + fetch on open.
  React.useEffect(() => {
    if (!open) return;
    setStep("pick-plan");
    setPlanFull(null);
    loadPlans();
  }, [open, loadPlans]);

  const openPlan = React.useCallback(async (planId: number) => {
    setLoadingPlan(true);
    setStep("pick-event");
    try {
      const full = await WeddingPlansAPI.getFull(planId);
      setPlanFull(full);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't open that plan";
      toast({ title: "Couldn't open", description: msg, variant: "destructive" });
      setStep("pick-plan");
    } finally {
      setLoadingPlan(false);
    }
  }, []);

  const addToEvent = async (eventId: number) => {
    if (!planFull) return;
    setAddingEventId(eventId);
    try {
      await WeddingPlansAPI.addItem(planFull.plan.id, eventId, {
        businessId,
        vendorType,
      });
      toast({
        title: "Added to your plan",
        description: `${businessName} shortlisted.`,
      });
      onOpenChange(false);
    } catch (e) {
      const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
      const msg =
        data?.message === "DUPLICATE_LINE" || data?.message?.includes("unique")
          ? "This vendor is already on that function."
          : data?.message || (e as Error)?.message || "Couldn't add this vendor";
      toast({ title: "Couldn't add", description: msg, variant: "destructive" });
    } finally {
      setAddingEventId(null);
    }
  };

  const events = planFull?.events ?? [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-bridal-gold" />
              {step === "pick-plan" ? "Add to a wedding plan" : "Choose a function"}
            </DialogTitle>
            <DialogDescription>
              {step === "pick-plan"
                ? `Shortlist ${businessName} onto one of your wedding plans, then book everything together for a bundle discount.`
                : planFull
                  ? `Which function of ${planTitle(planFull.plan)} is ${businessName} for?`
                  : "Loading functions…"}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 min-h-[140px] pr-1 -mr-1">
            {/* STEP 1 — pick a plan */}
            {step === "pick-plan" &&
              (loadingPlans ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-bridal-text-soft">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading your plans…
                </div>
              ) : plans.length === 0 ? (
                <div className="rounded-md border border-dashed border-bridal-beige bg-bridal-cream/50 p-6 text-center">
                  <Sparkles className="h-6 w-6 text-bridal-gold mx-auto mb-2" />
                  <p className="text-sm font-medium text-bridal-charcoal">
                    No wedding plans yet
                  </p>
                  <p className="text-xs text-bridal-text-soft mt-1 max-w-xs mx-auto">
                    Start a plan for your whole shaadi, then add {businessName} to any
                    function.
                  </p>
                  <Button size="sm" className="mt-3 gap-1.5" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Plan my wedding
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => openPlan(p.id)}
                      className="w-full text-left rounded-md border border-bridal-beige bg-white hover:border-bridal-gold/55 transition-colors p-3 flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-bridal-charcoal truncate">
                          {planTitle(p)}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-bridal-text-soft mt-0.5 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {fmtPlanDate(p.weddingDate)}
                          </span>
                          {p.primaryCity && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {p.primaryCity}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-bridal-text-soft group-hover:text-bridal-gold-dark shrink-0" />
                    </button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 mt-1"
                    onClick={() => setCreateOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New plan
                  </Button>
                </div>
              ))}

            {/* STEP 2 — pick an event */}
            {step === "pick-event" &&
              (loadingPlan ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-bridal-text-soft">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading functions…
                </div>
              ) : events.length === 0 ? (
                <div className="rounded-md border border-dashed border-bridal-beige bg-bridal-cream/50 p-6 text-center">
                  <CalendarDays className="h-6 w-6 text-bridal-gold mx-auto mb-2" />
                  <p className="text-sm font-medium text-bridal-charcoal">
                    No functions in this plan yet
                  </p>
                  <p className="text-xs text-bridal-text-soft mt-1 max-w-xs mx-auto">
                    Add a function (Mehndi, Baraat, Walima…) to shortlist {businessName} onto
                    it.
                  </p>
                  <Button size="sm" className="mt-3 gap-1.5" onClick={() => setAddEventOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Add a function
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map((ev) => {
                    const busy = addingEventId === ev.id;
                    const label = ev.title?.trim() || eventTypeLabel(ev.eventType);
                    const already = (ev.items ?? []).some(
                      (it) =>
                        it.businessId === businessId &&
                        it.status !== "removed" &&
                        it.status !== "declined",
                    );
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        disabled={busy || already || addingEventId !== null}
                        onClick={() => addToEvent(ev.id)}
                        className="w-full text-left rounded-md border border-bridal-beige bg-white hover:border-bridal-gold/55 disabled:opacity-70 disabled:hover:border-bridal-beige transition-colors p-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-bridal-charcoal truncate">
                            {label}
                          </p>
                          <p className="text-[11px] text-bridal-text-soft mt-0.5">
                            {fmtPlanDate(ev.eventDate)}
                            {ev.city ? ` · ${ev.city}` : ""}
                          </p>
                        </div>
                        {already ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#3F6B43] shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Added
                          </span>
                        ) : busy ? (
                          <Loader2 className="h-4 w-4 animate-spin text-bridal-gold shrink-0" />
                        ) : (
                          <Plus className="h-4 w-4 text-bridal-gold-dark shrink-0" />
                        )}
                      </button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 mt-1"
                    onClick={() => setAddEventOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add another function
                  </Button>
                </div>
              ))}
          </div>

          <DialogFooter className="mt-2">
            {step === "pick-event" ? (
              <Button variant="ghost" className="gap-1.5" onClick={() => setStep("pick-plan")}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inline create-plan — auto-open the new plan to pick a function. */}
      <CreatePlanDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(p) => {
          setCreateOpen(false);
          setPlans((prev) => [p, ...prev]);
          openPlan(p.id);
        }}
      />

      {/* Inline add-function — reload the plan so it appears in the list. */}
      {planFull && (
        <AddEventDialog
          planId={planFull.plan.id}
          open={addEventOpen}
          onOpenChange={setAddEventOpen}
          onSaved={() => {
            setAddEventOpen(false);
            openPlan(planFull.plan.id);
          }}
        />
      )}
    </>
  );
}

export default AddToPlanDialog;
