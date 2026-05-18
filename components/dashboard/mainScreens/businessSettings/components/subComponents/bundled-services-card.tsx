"use client";

/**
 * BK-100.52 — Vendor bundled-services admin card.
 *
 * Pakistani banquets routinely offer in-house catering + decor + DJ +
 * valet + generator etc. This card lets the vendor declare those
 * offerings on their business settings page so customers see them on
 * the public profile (Layer 2 wires the customer-facing display).
 *
 * Drops into the existing Basic Information tab as a standalone
 * section beneath the cancellation-policy card.
 *
 * Layer 1 surface: list / add / edit / delete bundled services +
 * outside-vendor policy. Layer 2 adds customer-facing rendering and
 * booking-flow integration (line items, conditional pricing rules).
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
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
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
  BundledServicesAPI,
  BUNDLED_CATEGORY_LABELS,
  BUNDLED_PRICE_MODEL_LABELS,
  type BundledService,
  type BundledServiceCategory,
  type BundledServicePriceModel,
  type UpsertBundledServiceInput,
} from "@/lib/api/bundledServices";

interface BundledServicesCardProps {
  businessId: number;
}

interface DraftService {
  // `id` is only present when editing.
  id?: number;
  category: BundledServiceCategory;
  name: string;
  description: string;
  priceModel: BundledServicePriceModel;
  priceAmount: string; // string in form, coerced to number on submit
  included: boolean;
  mandatory: boolean;
  isActive: boolean;
}

const EMPTY_DRAFT: DraftService = {
  category: "catering",
  name: "",
  description: "",
  priceModel: "per_plate",
  priceAmount: "",
  included: false,
  mandatory: false,
  isActive: true,
};

function formatPriceLabel(s: BundledService): string {
  const amt = typeof s.priceAmount === "string" ? parseFloat(s.priceAmount) : s.priceAmount;
  if (s.priceModel === "free" || !amt || amt === 0) return "Included";
  if (s.priceModel === "per_plate") return `Rs. ${amt.toLocaleString()} / plate`;
  if (s.priceModel === "percentage_of_total") return `${amt}% of total`;
  return `Rs. ${amt.toLocaleString()}`;
}

export function BundledServicesCard({ businessId }: BundledServicesCardProps) {
  const [services, setServices] = React.useState<BundledService[]>([]);
  const [outsideAllowed, setOutsideAllowed] = React.useState<boolean | null>(null);
  const [outsideFee, setOutsideFee] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [draft, setDraft] = React.useState<DraftService | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await BundledServicesAPI.list(businessId, { includeInactive: true });
      setServices(res.services || []);
      setOutsideAllowed(res.outsideVendorsAllowed);
      setOutsideFee(
        res.outsideVendorFee === null || res.outsideVendorFee === undefined
          ? ""
          : String(res.outsideVendorFee),
      );
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Failed to load bundled services";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const startCreate = () => setDraft({ ...EMPTY_DRAFT });
  const startEdit = (s: BundledService) =>
    setDraft({
      id: s.id,
      category: s.category,
      name: s.name,
      description: s.description || "",
      priceModel: s.priceModel,
      priceAmount: s.priceAmount === null ? "" : String(s.priceAmount),
      included: s.included,
      mandatory: s.mandatory,
      isActive: s.isActive,
    });
  const cancelDraft = () => setDraft(null);

  const handleSubmitDraft = async () => {
    if (!draft) return;
    if (!draft.name.trim() || draft.name.trim().length < 2) {
      toast.error("Please enter a service name (at least 2 characters).");
      return;
    }
    const priceAmt = draft.priceAmount === "" ? 0 : Number(draft.priceAmount);
    if (!Number.isFinite(priceAmt) || priceAmt < 0) {
      toast.error("Price amount must be a non-negative number.");
      return;
    }
    if (draft.priceModel === "percentage_of_total" && priceAmt > 100) {
      toast.error("Percentage of total cannot exceed 100.");
      return;
    }

    const payload: UpsertBundledServiceInput = {
      category: draft.category,
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      priceModel: draft.priceModel,
      priceAmount: priceAmt,
      included: draft.included,
      mandatory: draft.mandatory,
      isActive: draft.isActive,
    };

    setSubmitting(true);
    try {
      if (draft.id) {
        await BundledServicesAPI.update(businessId, draft.id, payload);
        toast.success("Service updated");
      } else {
        await BundledServicesAPI.create(businessId, payload);
        toast.success("Service added");
      }
      setDraft(null);
      await load();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't save service";
      toast.error("Couldn't save", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (s: BundledService) => {
    if (!confirm(`Remove "${s.name}" from your bundled services?`)) return;
    setDeletingId(s.id);
    try {
      await BundledServicesAPI.remove(businessId, s.id);
      toast.success("Service removed");
      await load();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't remove service";
      toast.error("Couldn't remove", { description: msg });
    } finally {
      setDeletingId(null);
    }
  };

  const handleOutsideSave = async () => {
    setSubmitting(true);
    try {
      const fee = outsideFee.trim() === "" ? null : Number(outsideFee);
      if (fee !== null && (!Number.isFinite(fee) || fee < 0)) {
        toast.error("Outside-vendor fee must be a non-negative number or empty.");
        setSubmitting(false);
        return;
      }
      await BundledServicesAPI.setOutsideVendorPolicy(businessId, {
        outsideVendorsAllowed: outsideAllowed,
        outsideVendorFee: fee,
      });
      toast.success("Outside-vendor policy saved");
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't save policy";
      toast.error("Couldn't save policy", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-neutral-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-bridal-gold" />
              <h3 className="font-medium text-neutral-900">In-house bundled services</h3>
            </div>
            <p className="text-xs text-neutral-500">
              Do you bundle catering, decor, DJ, valet, etc. with your venue? Declare them here so customers see your complete offering at booking time.
            </p>
          </div>
          {!draft && (
            <Button type="button" size="sm" onClick={startCreate} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add service
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {!loading && !error && services.length === 0 && !draft && (
          <p className="text-sm text-neutral-500 italic py-4 text-center">
            No bundled services yet. Click &quot;Add service&quot; to declare your first in-house offering.
          </p>
        )}

        {!loading && services.length > 0 && (
          <div className="space-y-2">
            {services.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "rounded-md border p-3 flex items-start justify-between gap-3",
                  s.isActive ? "border-neutral-200 bg-white" : "border-neutral-200 bg-neutral-50 opacity-70",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-neutral-900">{s.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {BUNDLED_CATEGORY_LABELS[s.category] || s.category}
                    </Badge>
                    {s.included && (
                      <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">
                        Included in venue
                      </Badge>
                    )}
                    {s.mandatory && (
                      <Badge variant="outline" className="text-[10px] border-rose-300 text-rose-700">
                        Mandatory
                      </Badge>
                    )}
                    {!s.isActive && (
                      <Badge variant="outline" className="text-[10px]">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  {s.description && (
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{s.description}</p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">
                    {formatPriceLabel(s)} · {BUNDLED_PRICE_MODEL_LABELS[s.priceModel]}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button type="button" size="sm" variant="ghost" onClick={() => startEdit(s)} aria-label="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(s)}
                    disabled={deletingId === s.id}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    aria-label="Delete"
                  >
                    {deletingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Draft (create/edit) form ── */}
        {draft && (
          <div className="rounded-md border-2 border-bridal-gold/45 bg-bridal-cream/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-900">
                {draft.id ? "Edit service" : "Add service"}
              </p>
              <Button type="button" size="sm" variant="ghost" onClick={cancelDraft} disabled={submitting}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select
                  value={draft.category}
                  onValueChange={(v) =>
                    setDraft({ ...draft, category: v as BundledServiceCategory })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(BUNDLED_CATEGORY_LABELS) as BundledServiceCategory[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {BUNDLED_CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Service name</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder='e.g. "Pakistani Buffet · Premium"'
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value.slice(0, 120) })}
                  disabled={submitting}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Description (optional)</Label>
                <Textarea
                  className="text-sm resize-none"
                  rows={2}
                  placeholder="What's included? e.g. 12-dish buffet + chai/coke + crockery. Live tandoor stations available as add-on."
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value.slice(0, 5000) })
                  }
                  disabled={submitting}
                />
              </div>
              <div>
                <Label className="text-xs">Price model</Label>
                <Select
                  value={draft.priceModel}
                  onValueChange={(v) =>
                    setDraft({ ...draft, priceModel: v as BundledServicePriceModel })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(BUNDLED_PRICE_MODEL_LABELS) as BundledServicePriceModel[]).map(
                      (m) => (
                        <SelectItem key={m} value={m}>
                          {BUNDLED_PRICE_MODEL_LABELS[m]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">
                  Amount{" "}
                  {draft.priceModel === "percentage_of_total"
                    ? "(0-100)"
                    : draft.priceModel === "free"
                      ? "(unused)"
                      : "(PKR)"}
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className="h-9 text-sm"
                  placeholder="0"
                  value={draft.priceAmount}
                  onChange={(e) => setDraft({ ...draft, priceAmount: e.target.value })}
                  disabled={submitting || draft.priceModel === "free"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={draft.included}
                  onCheckedChange={(c) => setDraft({ ...draft, included: !!c })}
                  disabled={submitting}
                />
                <span>
                  <span className="font-medium text-neutral-900">Included</span>
                  <span className="block text-neutral-500">Part of the base venue price</span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={draft.mandatory}
                  onCheckedChange={(c) => setDraft({ ...draft, mandatory: !!c })}
                  disabled={submitting}
                />
                <span>
                  <span className="font-medium text-neutral-900">Mandatory</span>
                  <span className="block text-neutral-500">Customer cannot opt out</span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={draft.isActive}
                  onCheckedChange={(c) => setDraft({ ...draft, isActive: !!c })}
                  disabled={submitting}
                />
                <span>
                  <span className="font-medium text-neutral-900">Active</span>
                  <span className="block text-neutral-500">Shown to customers</span>
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
                disabled={submitting || !draft.name.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-3.5 w-3.5" />
                    {draft.id ? "Save changes" : "Add service"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Outside-vendor policy ── */}
        {!loading && !error && (
          <div className="pt-4 mt-2 border-t border-neutral-100 space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-900">Outside-vendor policy</p>
              <p className="text-xs text-neutral-500">
                Can customers bring their own caterer / decorator / DJ?
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { key: "null", label: "Unspecified", icon: EyeOff },
                { key: "true", label: "Allowed", icon: CheckCircle2 },
                { key: "false", label: "Not allowed", icon: X },
              ].map((opt) => {
                const matches =
                  (opt.key === "null" && outsideAllowed === null) ||
                  (opt.key === "true" && outsideAllowed === true) ||
                  (opt.key === "false" && outsideAllowed === false);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() =>
                      setOutsideAllowed(
                        opt.key === "null" ? null : opt.key === "true",
                      )
                    }
                    disabled={submitting}
                    className={cn(
                      "rounded-md border p-2 text-left transition-colors text-sm",
                      matches
                        ? "border-bridal-gold/55 bg-bridal-cream"
                        : "border-neutral-200 bg-white hover:border-neutral-300",
                      submitting && "opacity-60 cursor-not-allowed",
                    )}
                  >
                    <opt.icon className="h-3.5 w-3.5 inline mr-1.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {outsideAllowed === true && (
              <div>
                <Label className="text-xs">
                  Outside-vendor fee{" "}
                  <span className="text-neutral-400">(optional, PKR)</span>
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className="h-9 text-sm max-w-xs"
                  placeholder='e.g. 50000 for "kitchen use" fee'
                  value={outsideFee}
                  onChange={(e) => setOutsideFee(e.target.value)}
                  disabled={submitting}
                />
              </div>
            )}
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleOutsideSave}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-3.5 w-3.5" />
                )}
                Save policy
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BundledServicesCard;
