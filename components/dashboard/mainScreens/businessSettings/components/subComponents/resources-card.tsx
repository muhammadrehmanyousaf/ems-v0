"use client";

/**
 * BK-100.51 — Vendor multi-resource-capacity admin card (Layer 1).
 *
 * Lets the vendor declare parallel-capacity realities:
 *   - A banquet with 3 halls
 *   - A caterer with kitchen capacity 2000 guests/night
 *   - A photographer studio with 5 crews
 *   - A marquee company with 20 tents
 *
 * Layer 1 is the declaration UI only. The slot engine still uses the
 * legacy single-capacity slot-template field until Layer 2 lights up
 * the integration behind the opt-in flag. The card shows a clear
 * "this won't change bookings yet" notice so the vendor understands
 * what they're configuring.
 */

import * as React from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  AlertCircle,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BusinessResourcesAPI,
  RESOURCE_KIND_LABELS,
  type BusinessResource,
  type BusinessResourceKind,
  type UpsertResourceInput,
} from "@/lib/api/businessResources";

interface ResourcesCardProps {
  businessId: number;
}

interface DraftResource {
  id?: number;
  kind: BusinessResourceKind;
  label: string;
  description: string;
  quantity: string;
  capacityUnit: string;
  unitsPerBooking: string;
  isActive: boolean;
}

const EMPTY_DRAFT: DraftResource = {
  kind: "hall",
  label: "",
  description: "",
  quantity: "1",
  capacityUnit: "",
  unitsPerBooking: "1",
  isActive: true,
};

function describeResource(r: BusinessResource): string {
  const meta = RESOURCE_KIND_LABELS[r.kind] || RESOURCE_KIND_LABELS.generic_unit;
  const qty = r.quantity > 1 ? `${r.quantity}×` : "";
  const cap = r.capacityUnit ? ` · cap ${r.capacityUnit}` : "";
  return `${qty}${meta.label}${cap}`.trim();
}

export function ResourcesCard({ businessId }: ResourcesCardProps) {
  const [resources, setResources] = React.useState<BusinessResource[]>([]);
  const [useFlag, setUseFlag] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [draft, setDraft] = React.useState<DraftResource | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [savingFlag, setSavingFlag] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await BusinessResourcesAPI.list(businessId, {
        includeInactive: true,
      });
      setResources(res.resources || []);
      setUseFlag(!!res.useMultiResourceCapacity);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Failed to load resources";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const startCreate = () => setDraft({ ...EMPTY_DRAFT });
  const startEdit = (r: BusinessResource) =>
    setDraft({
      id: r.id,
      kind: r.kind,
      label: r.label,
      description: r.description || "",
      quantity: String(r.quantity),
      capacityUnit: r.capacityUnit === null ? "" : String(r.capacityUnit),
      unitsPerBooking: String(r.unitsPerBooking),
      isActive: r.isActive,
    });
  const cancelDraft = () => setDraft(null);

  const handleSubmitDraft = async () => {
    if (!draft) return;
    const label = draft.label.trim();
    if (!label || label.length < 2) {
      toast.error("Please enter a label (at least 2 characters).");
      return;
    }
    const qty = Number(draft.quantity);
    if (!Number.isFinite(qty) || qty < 1 || qty > 1000000) {
      toast.error("Quantity must be 1 or greater.");
      return;
    }
    const cap = draft.capacityUnit.trim() === "" ? null : Number(draft.capacityUnit);
    if (cap !== null && (!Number.isFinite(cap) || cap < 0)) {
      toast.error("Capacity must be a non-negative number or empty.");
      return;
    }
    const upb = Number(draft.unitsPerBooking);
    if (!Number.isFinite(upb) || upb < 1) {
      toast.error("Units per booking must be 1 or greater.");
      return;
    }

    const payload: UpsertResourceInput = {
      kind: draft.kind,
      label,
      description: draft.description.trim() || null,
      quantity: Math.floor(qty),
      capacityUnit: cap === null ? null : Math.floor(cap),
      unitsPerBooking: Math.floor(upb),
      isActive: draft.isActive,
    };

    setSubmitting(true);
    try {
      if (draft.id) {
        await BusinessResourcesAPI.update(businessId, draft.id, payload);
        toast.success("Resource updated");
      } else {
        await BusinessResourcesAPI.create(businessId, payload);
        toast.success("Resource added");
      }
      setDraft(null);
      await load();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't save resource";
      toast.error("Couldn't save", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (r: BusinessResource) => {
    if (!confirm(`Remove "${r.label}" from your resources?`)) return;
    setDeletingId(r.id);
    try {
      await BusinessResourcesAPI.remove(businessId, r.id);
      toast.success("Resource removed");
      await load();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't remove resource";
      toast.error("Couldn't remove", { description: msg });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleFlag = async (next: boolean) => {
    setSavingFlag(true);
    try {
      await BusinessResourcesAPI.setMultiResourceFlag(businessId, next);
      setUseFlag(next);
      toast.success(
        next
          ? "Multi-resource mode enabled (engine integration ships in Layer 2)"
          : "Multi-resource mode disabled",
      );
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't update flag";
      toast.error("Couldn't update", { description: msg });
    } finally {
      setSavingFlag(false);
    }
  };

  return (
    <Card className="border-neutral-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-bridal-gold" />
              <h3 className="font-medium text-neutral-900">Capacity & resources</h3>
            </div>
            <p className="text-xs text-neutral-500">
              Declare what you actually own — 3 halls, kitchen for 2000 guests, 5 photographer crews, 20 tents — so the booking engine can match concurrent demand.
            </p>
          </div>
          {!draft && (
            <Button type="button" size="sm" onClick={startCreate} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add resource
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Layer 1 notice — surface the "this doesn't change bookings yet" reality so the vendor isn't surprised. */}
        <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3 flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Heads up:</strong> declaring resources here doesn&apos;t change your bookings yet. The engine integration ships in our next release. You can fill this in now so it&apos;s ready the moment it lights up.
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-6 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && resources.length === 0 && !draft && (
          <p className="text-sm text-neutral-500 italic py-4 text-center">
            No resources declared yet. Click &quot;Add resource&quot; to map your venue / studio / fleet.
          </p>
        )}

        {!loading && resources.length > 0 && (
          <div className="space-y-2">
            {resources.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "rounded-md border p-3 flex items-start justify-between gap-3",
                  r.isActive
                    ? "border-neutral-200 bg-white"
                    : "border-neutral-200 bg-neutral-50 opacity-70",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-neutral-900">
                      {r.label}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {RESOURCE_KIND_LABELS[r.kind]?.label || r.kind}
                    </Badge>
                    {!r.isActive && (
                      <Badge variant="outline" className="text-[10px]">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      {r.description}
                    </p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">{describeResource(r)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(r)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(r)}
                    disabled={deletingId === r.id}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    aria-label="Delete"
                  >
                    {deletingId === r.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Draft form */}
        {draft && (
          <div className="rounded-md border-2 border-bridal-gold/45 bg-bridal-cream/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-900">
                {draft.id ? "Edit resource" : "Add resource"}
              </p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={cancelDraft}
                disabled={submitting}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs">Resource kind</Label>
                <Select
                  value={draft.kind}
                  onValueChange={(v) =>
                    setDraft({ ...draft, kind: v as BusinessResourceKind })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(RESOURCE_KIND_LABELS) as BusinessResourceKind[]).map(
                      (k) => (
                        <SelectItem key={k} value={k}>
                          {RESOURCE_KIND_LABELS[k].label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-neutral-500 mt-1 italic">
                  {RESOURCE_KIND_LABELS[draft.kind]?.hint}
                </p>
              </div>
              <div>
                <Label className="text-xs">Label</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder='e.g. "Main Hall" / "Kitchen" / "Lead Crew #1"'
                  value={draft.label}
                  onChange={(e) =>
                    setDraft({ ...draft, label: e.target.value.slice(0, 120) })
                  }
                  disabled={submitting}
                />
              </div>
              <div>
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  className="h-9 text-sm"
                  value={draft.quantity}
                  onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div>
                <Label className="text-xs">
                  Capacity per unit{" "}
                  <span className="text-neutral-400">(optional)</span>
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="h-9 text-sm"
                  placeholder='e.g. 800 max-seated for a hall, 2000 guests/night for kitchen'
                  value={draft.capacityUnit}
                  onChange={(e) =>
                    setDraft({ ...draft, capacityUnit: e.target.value })
                  }
                  disabled={submitting}
                />
              </div>
              <div>
                <Label className="text-xs">Units per booking</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  className="h-9 text-sm"
                  value={draft.unitsPerBooking}
                  onChange={(e) =>
                    setDraft({ ...draft, unitsPerBooking: e.target.value })
                  }
                  disabled={submitting}
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  Most resources: 1. (Engine integration in Layer 2.)
                </p>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Description (optional)</Label>
                <Textarea
                  className="text-sm resize-none"
                  rows={2}
                  placeholder="Any special notes — floor level, allowed noise, separate halls flag, etc."
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value.slice(0, 5000) })
                  }
                  disabled={submitting}
                />
              </div>
              <label className="flex items-start gap-2 text-xs cursor-pointer sm:col-span-2">
                <Checkbox
                  checked={draft.isActive}
                  onCheckedChange={(c) => setDraft({ ...draft, isActive: !!c })}
                  disabled={submitting}
                />
                <span>
                  <span className="font-medium text-neutral-900">Active</span>
                  <span className="block text-neutral-500">Counts toward your concurrency once Layer 2 ships</span>
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={cancelDraft}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmitDraft}
                disabled={submitting || !draft.label.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-3.5 w-3.5" />
                    {draft.id ? "Save changes" : "Add resource"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Layer 2 opt-in flag */}
        {!loading && !error && (
          <div className="pt-4 mt-2 border-t border-neutral-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={useFlag}
                onCheckedChange={(c) => handleToggleFlag(!!c)}
                disabled={savingFlag}
              />
              <span className="text-xs">
                <span className="font-medium text-neutral-900">
                  Use multi-resource capacity for bookings
                </span>
                <span className="block text-neutral-500 mt-0.5">
                  Switches your booking engine from single-slot capacity to consuming from the resource pool above. Per-kind capacity = quantity / units-per-booking; overall capacity is the bottleneck across kinds (a studio with 2 photographers + 1 videographer crew accepts 1 booking at a time, not 3). Per-date overrides still win — flip back to disable anytime.
                </span>
                {savingFlag && (
                  <span className="block text-amber-600 mt-1 inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                  </span>
                )}
              </span>
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ResourcesCard;
