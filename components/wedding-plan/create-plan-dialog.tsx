"use client";

/**
 * Shaadi Plan — "Plan my wedding" create dialog.
 *
 * Spins up a new WeddingPlan (a WeddingUmbrella under the hood, spec §2)
 * with the couple's names, wedding date, city, an optional budget range
 * and a few cultural preferences. Mirrors the create-umbrella dialog's
 * lenient UX (most fields optional; at least one display label required)
 * and adds the budget + cultural-prefs the plan cart needs.
 *
 * The whole surface is flag-gated upstream — this dialog is only ever
 * mounted behind `useWeddingPlanFlag()`.
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  WeddingPlansAPI,
  type CreatePlanInput,
  type WeddingPlan,
} from "@/lib/api/weddingPlans";

/** Warm, Pakistani-context cultural preferences saved to the plan. */
const CULTURAL_PREFS: { key: string; label: string }[] = [
  { key: "segregated_seating", label: "Segregated (zenana / mardana) seating" },
  { key: "halal_only", label: "Halal-only catering" },
  { key: "no_music", label: "No music / dhol" },
  { key: "rukhsati_same_day", label: "Rukhsati on the Baraat day" },
  { key: "outstation_vendors", label: "Vendors may travel between cities" },
];

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (plan: WeddingPlan) => void;
}

export function CreatePlanDialog({
  open,
  onOpenChange,
  onCreated,
}: CreatePlanDialogProps) {
  const [title, setTitle] = React.useState("");
  const [brideName, setBrideName] = React.useState("");
  const [groomName, setGroomName] = React.useState("");
  const [weddingDate, setWeddingDate] = React.useState("");
  const [primaryCity, setPrimaryCity] = React.useState("");
  const [estimatedGuests, setEstimatedGuests] = React.useState("");
  const [budgetMin, setBudgetMin] = React.useState("");
  const [budgetMax, setBudgetMax] = React.useState("");
  const [prefs, setPrefs] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const reset = () => {
    setTitle("");
    setBrideName("");
    setGroomName("");
    setWeddingDate("");
    setPrimaryCity("");
    setEstimatedGuests("");
    setBudgetMin("");
    setBudgetMax("");
    setPrefs([]);
    setNotes("");
  };

  const handleClose = (next: boolean) => {
    if (submitting && !next) return;
    onOpenChange(next);
    if (!next) reset();
  };

  const togglePref = (key: string) =>
    setPrefs((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );

  const hasDisplayLabel =
    title.trim().length > 0 ||
    brideName.trim().length > 0 ||
    groomName.trim().length > 0;

  const handleSubmit = async () => {
    if (!hasDisplayLabel) {
      toast({
        title: "Add a name",
        description: "Give your plan a title or at least the bride/groom name.",
        variant: "destructive",
      });
      return;
    }

    const min = budgetMin.trim() ? Number(budgetMin) : null;
    const max = budgetMax.trim() ? Number(budgetMax) : null;
    if (min != null && max != null && Number.isFinite(min) && Number.isFinite(max) && max < min) {
      toast({
        title: "Check your budget",
        description: "The maximum budget can't be less than the minimum.",
        variant: "destructive",
      });
      return;
    }

    const payload: CreatePlanInput = {};
    if (title.trim()) payload.title = title.trim();
    if (brideName.trim()) payload.brideName = brideName.trim();
    if (groomName.trim()) payload.groomName = groomName.trim();
    if (weddingDate) payload.weddingDate = weddingDate;
    if (primaryCity.trim()) payload.primaryCity = primaryCity.trim();
    if (estimatedGuests.trim()) {
      const n = Number(estimatedGuests);
      if (Number.isFinite(n) && n > 0) payload.estimatedGuests = Math.floor(n);
    }
    if (min != null && Number.isFinite(min) && min > 0) payload.budgetMin = min;
    if (max != null && Number.isFinite(max) && max > 0) payload.budgetMax = max;
    if (prefs.length) payload.culturalMetadataJson = { preferences: prefs };
    if (notes.trim()) payload.notes = notes.trim();

    setSubmitting(true);
    try {
      const created = await WeddingPlansAPI.create(payload);
      toast({ title: "Wedding plan created", description: "Now add your functions and vendors." });
      onCreated?.(created);
      reset();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't create your plan";
      toast({ title: "Couldn't create", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-bridal-gold" />
            Plan my wedding
          </DialogTitle>
          <DialogDescription>
            One plan for your whole shaadi — Mayoun, Mehndi, Baraat, Walima and
            more. Book every vendor together and unlock a bundle discount. Most
            fields are optional; fill them in as you go.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">
              Plan title <span className="text-neutral-400">(optional)</span>
            </Label>
            <Input
              className="h-9 text-sm"
              placeholder='e.g. "Ali & Ayesha · December 2026"'
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Bride&apos;s name</Label>
              <Input
                className="h-9 text-sm"
                placeholder="Ayesha"
                value={brideName}
                onChange={(e) => setBrideName(e.target.value.slice(0, 120))}
                disabled={submitting}
              />
            </div>
            <div>
              <Label className="text-xs">Groom&apos;s name</Label>
              <Input
                className="h-9 text-sm"
                placeholder="Ali"
                value={groomName}
                onChange={(e) => setGroomName(e.target.value.slice(0, 120))}
                disabled={submitting}
              />
            </div>
            <div>
              <Label className="text-xs">Main wedding date</Label>
              <Input
                type="date"
                className="h-9 text-sm"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <Label className="text-xs">Primary city</Label>
              <Input
                className="h-9 text-sm"
                placeholder="Karachi / Lahore / Islamabad"
                value={primaryCity}
                onChange={(e) => setPrimaryCity(e.target.value.slice(0, 80))}
                disabled={submitting}
              />
            </div>
            <div>
              <Label className="text-xs">Total guests (approx.)</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                className="h-9 text-sm"
                placeholder="e.g. 400"
                value={estimatedGuests}
                onChange={(e) => setEstimatedGuests(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">
              Budget range <span className="text-neutral-400">(Rs., optional)</span>
            </Label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                className="h-9 text-sm"
                placeholder="Min (e.g. 1,500,000)"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                disabled={submitting}
              />
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                className="h-9 text-sm"
                placeholder="Max (e.g. 3,000,000)"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">
              Cultural preferences <span className="text-neutral-400">(optional)</span>
            </Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {CULTURAL_PREFS.map((p) => {
                const on = prefs.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    disabled={submitting}
                    onClick={() => togglePref(p.key)}
                    className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
                      on
                        ? "border-bridal-gold/55 bg-bridal-gold/12 text-bridal-gold-dark font-medium"
                        : "border-bridal-beige bg-bridal-cream text-bridal-text-soft hover:border-bridal-gold/40"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs">
              Notes <span className="text-neutral-400">(optional)</span>
            </Label>
            <Textarea
              className="text-sm resize-none"
              rows={2}
              placeholder='e.g. "Walima in Islamabad, rest in Lahore — plan vendor travel."'
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 5000))}
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleClose(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !hasDisplayLabel}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Creating…
              </>
            ) : (
              "Create plan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreatePlanDialog;
