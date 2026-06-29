"use client";

/**
 * Venue-OS P2 — Fully-costed per-event P&L. The direct per-event P&L only counts
 * costs tagged to the event; this adds the booking's fair share of the venue's
 * untagged period overhead (rent/utilities/admin), spread by a driver
 * (revenue-share / equal). A booking that looks profitable on direct cost can go
 * negative once it carries overhead — that's the number this surfaces. Gated on
 * isEventCostingOn(); the backend 404s until EVENT_COSTING_DEPTH_ON. Additive.
 */
import * as React from "react";
import { venueOsApi, type FullyCostedEventPnl } from "@/lib/api/venueOs";
import { isEventCostingOn } from "@/lib/event-costing-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number): string => "Rs " + Math.round(n).toLocaleString("en-PK");
const netClass = (n: number): string => (n >= 0 ? "text-emerald-600" : "text-red-600");

type Driver = "REVENUE_SHARE" | "EVENT_COUNT";

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function EventCostedPnlView(): React.ReactElement | null {
  const enabled = isEventCostingOn();
  const [bookingId, setBookingId] = React.useState<string>("");
  const [businessId, setBusinessId] = React.useState<string>("");
  const [driver, setDriver] = React.useState<Driver>("REVENUE_SHARE");
  const [data, setData] = React.useState<FullyCostedEventPnl | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function load(): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      setData(await venueOsApi.costedEventPnl(Number(bookingId), Number(businessId), driver));
    } catch (e: unknown) {
      setErr(readErr(e, "Fully-costed P&L is not enabled for your account yet."));
      setData(null);
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const ready = bookingId && businessId;
  const flippedNegative = data != null && data.direct.netProfit >= 0 && data.fullyCostedNet < 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fully-costed per-event P&amp;L (with overhead)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Booking #
            <input type="number" value={bookingId} onChange={(e) => setBookingId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <div className="flex gap-1">
            <Button size="sm" variant={driver === "REVENUE_SHARE" ? "default" : "outline"} onClick={() => setDriver("REVENUE_SHARE")}>
              Revenue share
            </Button>
            <Button size="sm" variant={driver === "EVENT_COUNT" ? "default" : "outline"} onClick={() => setDriver("EVENT_COUNT")}>
              Equal split
            </Button>
          </div>
          <Button size="sm" onClick={() => void load()} disabled={!ready || busy}>
            {busy ? "Loading…" : "Cost it"}
          </Button>
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}

        {data && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Direct net</div>
                <div className={`text-lg font-semibold ${netClass(data.direct.netProfit)}`}>{PKR(data.direct.netProfit)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">− Allocated overhead</div>
                <div className="text-lg font-semibold">{PKR(data.allocatedOverhead)}</div>
                <div className="text-[11px] text-muted-foreground">{Math.round(data.weight * 100)}% of pool {PKR(data.overheadPool)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">= Fully-costed net</div>
                <div className={`text-lg font-semibold ${netClass(data.fullyCostedNet)}`}>{PKR(data.fullyCostedNet)}</div>
              </div>
              <div className="flex items-center justify-center rounded-md border p-3">
                {flippedNegative ? (
                  <Badge variant="destructive">profitable → loss after overhead</Badge>
                ) : data.fullyCostedNet >= 0 ? (
                  <Badge className="bg-emerald-500">profitable fully-costed</Badge>
                ) : (
                  <Badge variant="destructive">loss</Badge>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue {PKR(data.direct.revenue)} · COGS {PKR(data.direct.cogs)} · direct overheads {PKR(data.direct.opex)} ·
              driver {data.driver === "REVENUE_SHARE" ? "revenue share" : "equal split"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EventCostedPnlView;
