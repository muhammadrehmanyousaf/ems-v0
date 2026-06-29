"use client";

/**
 * Venue-OS P2 — Event profitability ranking (fully-costed). Over a chosen period,
 * ranks a venue's bookings by net AFTER each one carries its share of the venue's
 * untagged overhead — the owner's "which weddings actually made money, and which
 * quietly lost it once rent/utilities were counted?" view. Period window is
 * required (overhead is a period concept). Gated on isEventCostingOn(); the
 * backend 404s until EVENT_COSTING_DEPTH_ON. Additive — no existing screen touched.
 */
import * as React from "react";
import { venueOsApi, type EventMargins } from "@/lib/api/venueOs";
import { isEventCostingOn } from "@/lib/event-costing-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PKR = (n: number): string => "Rs " + Math.round(n).toLocaleString("en-PK");
const netClass = (n: number): string => (n >= 0 ? "text-emerald-600" : "text-red-600");

type Driver = "REVENUE_SHARE" | "EVENT_COUNT";

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function EventMarginsView(): React.ReactElement | null {
  const enabled = isEventCostingOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [driver, setDriver] = React.useState<Driver>("REVENUE_SHARE");
  const [data, setData] = React.useState<EventMargins | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function load(): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      setData(await venueOsApi.eventMargins(Number(businessId), { driver, from: from || undefined, to: to || undefined }));
    } catch (e: unknown) {
      setErr(readErr(e, "Event profitability is not enabled for your account yet."));
      setData(null);
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const ready = businessId && from && to;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event profitability (fully-costed, ranked)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-2 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ml-2 rounded border px-2 py-1" />
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
            {busy ? "Ranking…" : "Rank"}
          </Button>
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}

        {data && (
          <>
            <p className="text-xs text-muted-foreground">
              {data.eventCount} events · overhead pool {PKR(data.pool)} spread by {data.driver === "REVENUE_SHARE" ? "revenue share" : "equal split"}
            </p>
            {data.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events with ledger activity in this window.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Booking</th>
                      <th className="py-2 pr-3 text-right">Revenue</th>
                      <th className="py-2 pr-3 text-right">Direct net</th>
                      <th className="py-2 pr-3 text-right">− Overhead</th>
                      <th className="py-2 pr-3 text-right">Fully-costed</th>
                      <th className="py-2 pr-3 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.events.map((e, i) => (
                      <tr key={e.eventId} className={`border-b last:border-0 ${e.fullyCostedNet < 0 ? "bg-red-50" : ""}`}>
                        <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
                        <td className="py-2 pr-3">#{e.eventId}</td>
                        <td className="py-2 pr-3 text-right">{PKR(e.revenue)}</td>
                        <td className={`py-2 pr-3 text-right ${netClass(e.directNet)}`}>{PKR(e.directNet)}</td>
                        <td className="py-2 pr-3 text-right">{PKR(e.allocatedOverhead)}</td>
                        <td className={`py-2 pr-3 text-right font-medium ${netClass(e.fullyCostedNet)}`}>{PKR(e.fullyCostedNet)}</td>
                        <td className={`py-2 pr-3 text-right ${e.marginPct != null ? netClass(e.marginPct) : ""}`}>
                          {e.marginPct != null ? `${e.marginPct}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default EventMarginsView;
