"use client";

/**
 * Venue-OS — Per-event P&L view (P1 FE). Reads the per-event P&L straight off
 * the double-entry GL via /api/v1/venue-os/bookings/:id/pnl, with the
 * management-vs-tax (is_declared) toggle.
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 * touched.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { venueOsApi, type IsDeclared, type PerEventPnl } from "@/lib/api/venueOs";
import { useActiveBusinessId } from "@/lib/store/active-business-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingPicker } from "@/components/dashboard/shared/booking-picker";

const PKR = (n: number): string => "Rs " + Math.round(n).toLocaleString("en-PK");

function Stat({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "good" | "bad" | "neutral" }): React.ReactElement {
  const color = tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-red-600" : "text-foreground";
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>{PKR(value)}</div>
    </div>
  );
}

/**
 * `lockedBookingId` — when this view is rendered inside a booking's own
 * financials module the booking is already known, so the picker is a redundant
 * question. Passing the id locks it and hides the picker. Standalone use
 * (the Venue-OS hub) passes nothing and keeps the picker.
 */
export function EventPnlView({
  lockedBookingId,
}: { lockedBookingId?: number } = {}): React.ReactElement | null {
  const activeBusinessId = useActiveBusinessId();
  const [pickedBookingId, setBookingId] = React.useState<number | null>(null);
  const bookingId = lockedBookingId ?? pickedBookingId;
  const [view, setView] = React.useState<IsDeclared>("MANAGEMENT_ONLY");

  const pnl = useQuery({
    queryKey: ["venueOs", "eventPnl", bookingId, view, activeBusinessId],
    // Pass the active venue so the GL_ENGINE_ON gate resolves per-business (else null → 404).
    queryFn: () => venueOsApi.eventPnl(bookingId as number, activeBusinessId ?? undefined, view),
    enabled: bookingId != null,
    retry: false,
  });

  const d: PerEventPnl | undefined = pnl.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Per-event P&amp;L (off the ledger)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          {lockedBookingId == null && (
            <BookingPicker value={bookingId} onChange={setBookingId} className="w-64" placeholder="Which function?" />
          )}
          <div className="flex gap-1">
            <Button size="sm" variant={view === "MANAGEMENT_ONLY" ? "default" : "outline"} onClick={() => setView("MANAGEMENT_ONLY")}>
              Management
            </Button>
            <Button size="sm" variant={view === "DECLARED" ? "default" : "outline"} onClick={() => setView("DECLARED")}>
              Tax (declared)
            </Button>
          </div>
        </div>

        {pnl.isError && <p className="text-sm text-muted-foreground">Couldn't load per-event P&amp;L.</p>}
        {bookingId != null && !pnl.data && !pnl.isError && <p className="text-sm text-muted-foreground">Loading…</p>}

        {d && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Revenue" value={d.revenue} />
            <Stat label="Food / COGS" value={d.cogs} />
            <Stat label="Overheads" value={d.opex} />
            <Stat label="Gross profit" value={d.grossProfit} />
            <Stat label="Net profit" value={d.netProfit} tone={d.netProfit >= 0 ? "good" : "bad"} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EventPnlView;
