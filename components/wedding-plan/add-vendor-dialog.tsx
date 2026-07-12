"use client";

/**
 * Shaadi Plan — add a vendor line to a function.
 *
 * A search-and-shortlist picker scoped to one WeddingEvent. Searches the
 * public business catalogue (reusing `VendorAPI.searchBusinesses`) and
 * adds the chosen business as a `shortlisted` PlanItem on this event
 * (spec §4 `POST …/events/:eventId/items`). Businesses already on this
 * function are marked "added" so a family can't shortlist the same
 * vendor twice (mirrors the BE partial-unique on event×business).
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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Plus,
  CheckCircle2,
  MapPin,
  Store,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { VendorAPI } from "@/lib/api/vendors";
import type { Vendor } from "@/lib/types";
import { WeddingPlansAPI, type PlanItem } from "@/lib/api/weddingPlans";
import { fmtPKR } from "@/lib/wedding-plan-events";

interface AddVendorDialogProps {
  planId: number;
  eventId: number;
  /** Label of the function ("Mehndi · 12 Dec") for the header. */
  eventLabel: string;
  /** businessIds already on this function — shown as "added". */
  existingBusinessIds: number[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: (item: PlanItem) => void;
}

export function AddVendorDialog({
  planId,
  eventId,
  eventLabel,
  existingBusinessIds,
  open,
  onOpenChange,
  onAdded,
}: AddVendorDialogProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Vendor[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [addingId, setAddingId] = React.useState<number | null>(null);
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setTouched(false);
    }
  }, [open]);

  // Debounced search — only fires for 2+ chars so we don't spam the API.
  React.useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    setTouched(true);
    const handle = setTimeout(async () => {
      try {
        const rows = await VendorAPI.searchBusinesses(q);
        setResults(rows.slice(0, 24));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query, open]);

  const handleAdd = async (v: Vendor) => {
    const businessId = Number(v.id);
    if (!Number.isFinite(businessId)) return;
    setAddingId(businessId);
    try {
      const item = await WeddingPlansAPI.addItem(planId, eventId, {
        businessId,
        vendorType: (v as { vendorType?: string }).vendorType || v.type || undefined,
      });
      toast({ title: "Added to your plan", description: `${v.name} · ${eventLabel}` });
      onAdded?.(item);
    } catch (e) {
      const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
      const msg =
        data?.message === "DUPLICATE_LINE" || data?.message?.includes("unique")
          ? "This vendor is already on this function."
          : data?.message || (e as Error)?.message || "Couldn't add this vendor";
      toast({ title: "Couldn't add", description: msg, variant: "destructive" });
    } finally {
      setAddingId(null);
    }
  };

  const already = new Set(existingBusinessIds);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-4 w-4 text-bridal-gold" />
            Add a vendor to {eventLabel}
          </DialogTitle>
          <DialogDescription>
            Search photographers, caterers, halls, decorators and more, then
            shortlist them onto this function. You can set the agreed price and
            send an inquiry afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bridal-text-soft" />
          <Input
            autoFocus
            className="h-10 pl-9 text-sm"
            placeholder="Search by name or vendor type…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="mt-3 space-y-2 overflow-y-auto flex-1 min-h-[160px] pr-1">
          {searching ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-bridal-text-soft">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          ) : query.trim().length < 2 ? (
            <p className="text-sm text-bridal-text-soft italic py-10 text-center">
              Type at least 2 letters to search the vendor catalogue.
            </p>
          ) : results.length === 0 && touched ? (
            <p className="text-sm text-bridal-text-soft italic py-10 text-center">
              No vendors matched “{query.trim()}”. Try a different name or type.
            </p>
          ) : (
            results.map((v) => {
              const businessId = Number(v.id);
              const added = already.has(businessId);
              const busy = addingId === businessId;
              const vType = (v as { vendorType?: string }).vendorType || v.type;
              const priceLabel =
                v.price && Number(v.price) > 0 ? fmtPKR(v.price) : "Price on request";
              return (
                <div
                  key={v.id}
                  className={cn(
                    "rounded-md border p-3 flex items-start justify-between gap-3",
                    added
                      ? "border-bridal-sage/45 bg-bridal-sage/10"
                      : "border-bridal-beige bg-white",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-bridal-charcoal truncate">
                      {v.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-bridal-text-soft mt-1 flex-wrap">
                      {vType && (
                        <Badge variant="outline" className="text-[10px]">
                          {vType}
                        </Badge>
                      )}
                      {v.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {v.city}
                        </span>
                      )}
                      <span className="text-bridal-gold-dark">{priceLabel}</span>
                    </div>
                  </div>
                  {added ? (
                    <Badge className="shrink-0 gap-1 text-[10px] bg-bridal-sage/20 text-[#3F6B43] hover:bg-bridal-sage/20">
                      <CheckCircle2 className="h-3 w-3" />
                      Added
                    </Badge>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 gap-1"
                      onClick={() => handleAdd(v)}
                      disabled={busy || addingId !== null}
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" /> Add
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddVendorDialog;
