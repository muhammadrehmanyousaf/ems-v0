"use client";

/**
 * Venue-OS — EventNight live headcount gauge (P1 FE, SCO-5). Opens a night
 * against a booking's fire-rated safe capacity and updates a live heads-in count
 * via gate ticks; the bar goes green → amber → red and trips an OVER CAPACITY
 * badge past the cap. Gated on isOrgMembershipOn() (the umbrella); the backend
 * 404s until EVENTNIGHT_GAUGE_ON. Additive — no existing screen touched.
 */
import * as React from "react";
import { venueOsApi, type EventNight, type HeadcountResult } from "@/lib/api/venueOs";
import { isOrgMembershipOn } from "@/lib/org-membership-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function EventNightGauge(): React.ReactElement | null {
  const enabled = isOrgMembershipOn();
  const [bookingId, setBookingId] = React.useState<string>("");
  const [safeCap, setSafeCap] = React.useState<string>("400");
  const [night, setNight] = React.useState<EventNight | null>(null);
  const [live, setLive] = React.useState<HeadcountResult | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function open(): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      const n = await venueOsApi.openEventNight({ bookingId: Number(bookingId), safeCapacity: Number(safeCap) });
      setNight(n);
      setLive({ liveHeadcount: n.liveHeadcount, peakHeadcount: n.peakHeadcount, safeCapacity: n.safeCapacity, overCapFlag: n.overCapFlag });
    } catch (e: unknown) {
      setErr(readErr(e, "EventNight gauge is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  async function tick(direction: "IN" | "OUT", count: number): Promise<void> {
    if (!night) return;
    setBusy(true);
    setErr(null);
    try {
      setLive(await venueOsApi.recordHeadcount(night.id, direction, count));
    } catch (e: unknown) {
      setErr(readErr(e, "Could not update headcount."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  const cap = live?.safeCapacity ?? null;
  const head = live?.liveHeadcount ?? 0;
  const peak = live?.peakHeadcount ?? 0;
  const pct = cap && cap > 0 ? Math.min(100, Math.round((head / cap) * 100)) : 0;
  const over = Boolean(live?.overCapFlag);
  const near = cap != null && head >= cap * 0.9 && !over;
  const barColor = over ? "bg-red-600" : near ? "bg-amber-500" : "bg-emerald-500";

  return (
    <Card>
      <CardHeader>
        <CardTitle>EventNight — live headcount gauge</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!night ? (
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              Booking #
              <input type="number" value={bookingId} onChange={(e) => setBookingId(e.target.value)} className="ml-2 w-28 rounded border px-2 py-1" />
            </label>
            <label className="text-sm">
              Fire-rated capacity
              <input type="number" value={safeCap} onChange={(e) => setSafeCap(e.target.value)} className="ml-2 w-28 rounded border px-2 py-1" />
            </label>
            <Button size="sm" onClick={() => void open()} disabled={!bookingId || busy}>
              Open night
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">
                {head}
                <span className="text-base font-normal text-muted-foreground"> / {cap ?? "—"} guests</span>
              </div>
              {over ? (
                <Badge variant="destructive">OVER CAPACITY</Badge>
              ) : near ? (
                <Badge className="bg-amber-500">Near capacity</Badge>
              ) : (
                <Badge variant="secondary">OK</Badge>
              )}
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => void tick("IN", 1)} disabled={busy}>+1 in</Button>
              <Button size="sm" onClick={() => void tick("IN", 10)} disabled={busy}>+10</Button>
              <Button size="sm" onClick={() => void tick("IN", 50)} disabled={busy}>+50</Button>
              <Button size="sm" variant="outline" onClick={() => void tick("OUT", 1)} disabled={busy}>&minus;1 out</Button>
              <span className="ml-auto text-sm text-muted-foreground">peak {peak}</span>
            </div>
          </div>
        )}
        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default EventNightGauge;
