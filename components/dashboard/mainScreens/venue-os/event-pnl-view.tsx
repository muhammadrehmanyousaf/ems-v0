"use client";

/**
 * Venue-OS — Per-event P&L view (P1 FE). Reads the per-event P&L straight off
 * the double-entry GL via /api/v1/venue-os/bookings/:id/pnl, with the
 * management-vs-tax (is_declared) toggle. Gated on isGlEngineOn(); the backend
 * 404s until a pilot Org enables GL_ENGINE_ON. Additive — no existing screen
 * touched.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { venueOsApi, type IsDeclared, type PerEventPnl } from "@/lib/api/venueOs";
import { useActiveBusinessId } from "@/lib/store/active-business-store";
import { isGlEngineOn } from "@/lib/gl-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export function EventPnlView(): React.ReactElement | null {
  const enabled = isGlEngineOn();
  const activeBusinessId = useActiveBusinessId();
  const [bookingInput, setBookingInput] = React.useState<string>("");
  const [bookingId, setBookingId] = React.useState<number | null>(null);
  const [view, setView] = React.useState<IsDeclared>("MANAGEMENT_ONLY");

  const pnl = useQuery({
    queryKey: ["venueOs", "eventPnl", bookingId, view, activeBusinessId],
    // Pass the active venue so the GL_ENGINE_ON gate resolves per-business (else null → 404).
    queryFn: () => venueOsApi.eventPnl(bookingId as number, activeBusinessId ?? undefined, view),
    enabled: enabled && bookingId != null,
    retry: false,
  });

  if (!enabled) return null;
  const d: PerEventPnl | undefined = pnl.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Per-event P&amp;L (off the ledger)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Booking #
            <input
              type="number"
              value={bookingInput}
              onChange={(e) => setBookingInput(e.target.value)}
              className="ml-2 w-28 rounded border px-2 py-1"
            />
          </label>
          <Button size="sm" onClick={() => setBookingId(bookingInput ? Number(bookingInput) : null)} disabled={!bookingInput}>
            Load
          </Button>
          <div className="flex gap-1">
            <Button size="sm" variant={view === "MANAGEMENT_ONLY" ? "default" : "outline"} onClick={() => setView("MANAGEMENT_ONLY")}>
              Management
            </Button>
            <Button size="sm" variant={view === "DECLARED" ? "default" : "outline"} onClick={() => setView("DECLARED")}>
              Tax (declared)
            </Button>
          </div>
        </div>

        {pnl.isError && <p className="text-sm text-muted-foreground">Per-event P&amp;L is not enabled for your account yet.</p>}
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
