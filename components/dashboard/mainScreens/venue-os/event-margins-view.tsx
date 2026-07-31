"use client";

/**
 * Venue-OS P2 — Event profitability ranking (fully-costed). Over a chosen period,
 * ranks a venue's bookings by net AFTER each one carries its share of the venue's
 * untagged overhead — the owner's "which weddings actually made money, and which
 * quietly lost it once rent/utilities were counted?" view. Period window is
 * required (overhead is a period concept). Always rendered — the gating flag was removed once the backend feature
 * was confirmed GA (global FeatureFlagOverride, owner-authorized 2026-07-11). Additive — no existing screen touched.
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 */
import * as React from "react";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueOsApi, type EventMargins } from "@/lib/api/venueOs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";

const PKR = (n: number): string => "Rs " + Math.round(n).toLocaleString("en-PK");
const netClass = (n: number): string => (n >= 0 ? "text-emerald-600" : "text-red-600");

type Driver = "REVENUE_SHARE" | "EVENT_COUNT";

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function EventMarginsView(): React.ReactElement | null {
  const [businessId, setBusinessId] = useBusinessIdField();
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

  const ready = businessId && from && to;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event profitability (fully-costed, ranked)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <BusinessScopeField value={businessId} onChange={setBusinessId} />
          <label className="text-sm">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-2 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="text-sm">
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ml-2 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
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
