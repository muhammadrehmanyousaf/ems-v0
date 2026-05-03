"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import axiosInstance from "@/lib/axiosConfig";
import { AvailabilitySettingsCard } from "@/components/bookings/availability-settings-card";

interface VendorBusinessRow {
  id: number;
  name: string;
  city?: string | null;
  vacationMode?: boolean;
  vacationStartsAt?: string | null;
  vacationEndsAt?: string | null;
  vacationMessage?: string | null;
  honorMarketplaceBlackouts?: boolean;
}

/**
 * Calendar-toolbar drawer that lets the vendor manage availability for
 * any of their businesses without leaving the calendar surface:
 *   - BK-048 vacation mode (date window + back-on message)
 *   - BK-011 recurring blocks (Mon=1..Sun=64 mask + start/end dates)
 *   - BK-012 marketplace-blackout opt-out (per-business honor flag)
 *
 * Loads `/api/v1/businesses/user-business` (vendor's own businesses) and
 * lets them pick one before showing the AvailabilitySettingsCard.
 */
export function AvailabilityDrawer() {
  const [open, setOpen] = useState(false);
  const [businesses, setBusinesses] = useState<VendorBusinessRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!open || businesses) return;
    setLoading(true);
    axiosInstance
      .get("/api/v1/businesses/user-business")
      .then((res) => {
        const list: VendorBusinessRow[] =
          res.data?.data?.data ??
          res.data?.data ??
          res.data ??
          [];
        const arr = Array.isArray(list) ? list : [];
        setBusinesses(arr);
        if (arr.length > 0 && selectedId == null) setSelectedId(arr[0].id);
      })
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false));
  }, [open, businesses, selectedId]);

  const selected = useMemo(
    () => businesses?.find((b) => b.id === selectedId) ?? null,
    [businesses, selectedId],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          Manage availability
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Manage availability</SheetTitle>
          <SheetDescription>
            Vacation mode, recurring blocks, and marketplace-blackout opt-out.
            Changes take effect immediately for new bookings.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          {loading && !businesses ? (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </>
          ) : null}

          {businesses && businesses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You don&apos;t own any businesses yet. Create one first to manage
              availability.
            </p>
          ) : null}

          {businesses && businesses.length > 0 ? (
            <>
              {businesses.length > 1 ? (
                <div>
                  <label className="text-[12px] font-medium text-neutral-700 mb-1 block">
                    Business
                  </label>
                  <Select
                    value={selectedId != null ? String(selectedId) : ""}
                    onValueChange={(v) => setSelectedId(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a business" />
                    </SelectTrigger>
                    <SelectContent>
                      {businesses.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
                          {b.city ? ` · ${b.city}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {selected ? (
                <AvailabilitySettingsCard
                  key={selected.id}
                  businessId={selected.id}
                  initial={{
                    vacationMode: selected.vacationMode,
                    vacationStartsAt: selected.vacationStartsAt,
                    vacationEndsAt: selected.vacationEndsAt,
                    vacationMessage: selected.vacationMessage,
                    honorMarketplaceBlackouts: selected.honorMarketplaceBlackouts,
                  }}
                />
              ) : null}
            </>
          ) : null}

          {loading && businesses ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Refreshing…
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default AvailabilityDrawer;
