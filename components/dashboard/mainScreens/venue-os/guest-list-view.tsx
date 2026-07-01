"use client";

/**
 * Venue-OS P2 · WS10-depth — GuestList reconciliation. Add RSVP segments per side,
 * then reconcile against the live gauge: invited vs RSVP vs actual (gauge peak) vs
 * the fire-rated safe cap, with no-show / walk-in counts and the planned-vs-actual
 * catering headcount (the degh-billing truth). Gated on isEventNightConsoleOn() —
 * the backend 404s until ENABLE_EVENTNIGHT_CONSOLE.
 */
import * as React from "react";
import { venueOsApi, type GuestSegment, type GuestReconcile } from "@/lib/api/venueOs";
import { isEventNightConsoleOn } from "@/lib/eventnight-console-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function GuestListView(): React.ReactElement | null {
  const enabled = isEventNightConsoleOn();
  const [nightId, setNightId] = React.useState<string>("");
  const [side, setSide] = React.useState<string>("BRIDE");
  const [invited, setInvited] = React.useState<string>("");
  const [rsvp, setRsvp] = React.useState<string>("");
  const [perHead, setPerHead] = React.useState<string>("");
  const [segs, setSegs] = React.useState<GuestSegment[] | null>(null);
  const [rec, setRec] = React.useState<GuestReconcile | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "EventNight console is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const nid = Number(nightId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest list &amp; headcount reconciliation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>Event night #<input type="number" value={nightId} onChange={(e) => setNightId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" /></label>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setSegs(await venueOsApi.listGuestSegments(nid)))} disabled={!nightId || busy}>Load</Button>
          <Button size="sm" onClick={() => void guard(async () => setRec(await venueOsApi.guestReconcile(nid)))} disabled={!nightId || busy}>Reconcile</Button>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <select value={side} onChange={(e) => setSide(e.target.value)} className="rounded border px-2 py-1">
            {["BRIDE", "GROOM", "COMMON", "FAMILY"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="number" placeholder="invited" value={invited} onChange={(e) => setInvited(e.target.value)} className="w-24 rounded border px-2 py-1" />
          <input type="number" placeholder="RSVP yes" value={rsvp} onChange={(e) => setRsvp(e.target.value)} className="w-24 rounded border px-2 py-1" />
          <input type="number" placeholder="per-head Rs" value={perHead} onChange={(e) => setPerHead(e.target.value)} className="w-28 rounded border px-2 py-1" />
          <Button size="sm" onClick={() => void guard(async () => { await venueOsApi.addGuestSegment(nid, { side, invitedCount: Number(invited), rsvpYesCount: rsvp ? Number(rsvp) : 0, perHeadCostPkr: perHead ? Number(perHead) : 0 }); setSegs(await venueOsApi.listGuestSegments(nid)); })} disabled={!nightId || !invited || busy}>Add segment</Button>
        </div>

        {segs && (
          <div className="space-y-0.5 text-xs">
            {segs.map((s) => (
              <div key={s.id} className="flex justify-between border-t pt-0.5">
                <span><Badge variant="secondary">{s.side}</Badge> {s.segmentLabel || ""}</span>
                <span>invited {s.invitedCount} · RSVP {s.rsvpYesCount} · {PKR(s.perHeadCostPkr)}/head</span>
              </div>
            ))}
          </div>
        )}

        {rec && (
          <div className="rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Expected {rec.expectedTotal} · actual {rec.gauge.actualPeak} / cap {rec.gauge.safeCapacity ?? "—"}</span>
              {rec.overSafeCap && <Badge variant="destructive">over cap</Badge>}
              {rec.noShowCount > 0 && <Badge variant="secondary">{rec.noShowCount} no-shows</Badge>}
              {rec.walkInCount > 0 && <Badge variant="secondary">{rec.walkInCount} walk-ins</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">catering planned {PKR(rec.catering.plannedPkr)} → actual {PKR(rec.catering.actualPkr)} ({rec.catering.overCatered ? "over" : "under"}-catered {PKR(Math.abs(rec.catering.variancePkr))})</p>
            <p className="mt-1 text-xs">{rec.note}</p>
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default GuestListView;
