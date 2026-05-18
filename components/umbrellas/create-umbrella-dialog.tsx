"use client";

/**
 * BK-100.2 Layer 2a — Create-umbrella dialog.
 *
 * Minimal form to spin up a new WeddingUmbrella. All fields are
 * optional except an implied title — the form is lenient so a family
 * in early-planning mode can create an umbrella with just bride+groom
 * names and fill in the rest later.
 *
 * Backend (lib/api/weddingUmbrellas.ts) validates wedding date parses
 * and clips long strings; this dialog enforces the most common gates
 * client-side for snappy feedback.
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
  WeddingUmbrellasAPI,
  type CreateUmbrellaInput,
  type WeddingUmbrella,
} from "@/lib/api/weddingUmbrellas";

interface CreateUmbrellaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (umbrella: WeddingUmbrella) => void;
}

export function CreateUmbrellaDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateUmbrellaDialogProps) {
  const [title, setTitle] = React.useState("");
  const [brideName, setBrideName] = React.useState("");
  const [groomName, setGroomName] = React.useState("");
  const [weddingDate, setWeddingDate] = React.useState("");
  const [primaryCity, setPrimaryCity] = React.useState("");
  const [estimatedGuests, setEstimatedGuests] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const reset = () => {
    setTitle("");
    setBrideName("");
    setGroomName("");
    setWeddingDate("");
    setPrimaryCity("");
    setEstimatedGuests("");
    setNotes("");
  };

  const handleClose = (next: boolean) => {
    if (submitting && !next) return;
    onOpenChange(next);
    if (!next) reset();
  };

  // Lenient gate — at least one of title/brideName/groomName must be set
  // so the umbrella has a meaningful display.
  const hasDisplayLabel =
    title.trim().length > 0 ||
    brideName.trim().length > 0 ||
    groomName.trim().length > 0;

  const handleSubmit = async () => {
    if (!hasDisplayLabel) {
      toast({
        title: "Add a label",
        description: "Please provide a title or at least the bride/groom name.",
        variant: "destructive",
      });
      return;
    }

    const payload: CreateUmbrellaInput = {};
    if (title.trim()) payload.title = title.trim();
    if (brideName.trim()) payload.brideName = brideName.trim();
    if (groomName.trim()) payload.groomName = groomName.trim();
    if (weddingDate) payload.weddingDate = weddingDate;
    if (primaryCity.trim()) payload.primaryCity = primaryCity.trim();
    if (estimatedGuests.trim()) {
      const n = Number(estimatedGuests);
      if (Number.isFinite(n) && n > 0) payload.estimatedGuests = Math.floor(n);
    }
    if (notes.trim()) payload.notes = notes.trim();

    setSubmitting(true);
    try {
      const created = await WeddingUmbrellasAPI.create(payload);
      toast({ title: "Umbrella created" });
      onCreated?.(created);
      reset();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't create umbrella";
      toast({ title: "Couldn't create", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-bridal-gold" />
            Create a wedding umbrella
          </DialogTitle>
          <DialogDescription>
            Group all your wedding events — Mehndi, Nikah, Baraat, Walima — into one container. Most fields are optional; you can fill them in later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">
              Title <span className="text-neutral-400">(optional)</span>
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
              <Label className="text-xs">Bride name</Label>
              <Input
                className="h-9 text-sm"
                placeholder="Ayesha"
                value={brideName}
                onChange={(e) => setBrideName(e.target.value.slice(0, 120))}
                disabled={submitting}
              />
            </div>
            <div>
              <Label className="text-xs">Groom name</Label>
              <Input
                className="h-9 text-sm"
                placeholder="Ali"
                value={groomName}
                onChange={(e) => setGroomName(e.target.value.slice(0, 120))}
                disabled={submitting}
              />
            </div>
            <div>
              <Label className="text-xs">Primary wedding date</Label>
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
              <Label className="text-xs">Estimated total guests</Label>
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
              Notes <span className="text-neutral-400">(optional)</span>
            </Label>
            <Textarea
              className="text-sm resize-none"
              rows={2}
              placeholder='e.g. "Walima at a different city — please coordinate transport for vendors."'
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
              "Create umbrella"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateUmbrellaDialog;
