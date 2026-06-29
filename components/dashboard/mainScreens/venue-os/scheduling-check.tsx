"use client";

/**
 * Venue-OS — Sub-venue availability check (P1 FE, WS-1). Asks the parallel-slot
 * engine whether a sub-venue is free for a slot given the turnaround gap, before
 * a booking is confirmed — surfacing the conflicting CONFIRMED bookings when not.
 * Read-only probe (no write). Gated on isSchedulingMultiResourceOn(); the backend
 * 404s until SCHEDULING_MULTI_RESOURCE. Additive — no existing screen touched.
 */
import * as React from "react";
import { venueOsApi, type AvailabilityResult } from "@/lib/api/venueOs";
import { isSchedulingMultiResourceOn } from "@/lib/scheduling-flags";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function SchedulingCheck(): React.ReactElement | null {
  const enabled = isSchedulingMultiResourceOn();
  const [subVenueId, setSubVenueId] = React.useState<string>("");
  const [start, setStart] = React.useState<string>("");
  const [end, setEnd] = React.useState<string>("");
  const [turnaround, setTurnaround] = React.useState<string>("120");
  const [result, setResult] = React.useState<AvailabilityResult | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function check(): Promise<void> {
    setBusy(true);
    setErr(null);
    setResult(null);
    try {
      setResult(
        await venueOsApi.checkAvailability({
          subVenueId: Number(subVenueId),
          slot: { start: new Date(start).toISOString(), end: new Date(end).toISOString() },
          turnaroundMin: Number(turnaround) || 0,
        }),
      );
    } catch (e: unknown) {
      setErr(readErr(e, "Scheduling check is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const ready = subVenueId && start && end;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sub-venue availability check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Sub-venue #
            <input type="number" value={subVenueId} onChange={(e) => setSubVenueId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            Start
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="ml-2 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            End
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="ml-2 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            Turnaround (min)
            <input type="number" value={turnaround} onChange={(e) => setTurnaround(e.target.value)} className="ml-2 w-20 rounded border px-2 py-1" />
          </label>
          <Button size="sm" onClick={() => void check()} disabled={!ready || busy}>
            {busy ? "Checking…" : "Check"}
          </Button>
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}

        {result && (
          <div className="space-y-2">
            {result.available ? (
              <Badge className="bg-emerald-500">Available</Badge>
            ) : (
              <Badge variant="destructive">{result.conflicts.length} conflict{result.conflicts.length === 1 ? "" : "s"}</Badge>
            )}
            {!result.available && (
              <ul className="space-y-1 text-sm">
                {result.conflicts.map((c) => (
                  <li key={c.id} className="rounded border p-2">
                    Booking {c.bookingId != null ? `#${c.bookingId}` : `(space #${c.id})`} ·{" "}
                    {new Date(c.s).toLocaleString()} → {new Date(c.e).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SchedulingCheck;
