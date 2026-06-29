"use client";

/**
 * Venue-OS P2 — Per-event dihari labour. Record a daily-wage shift into the
 * immutable wage register (with the min-wage-floor warning), tag it to the event
 * it was worked for, then post it to the GL as EXPENSE_DIHARI — so the labour
 * becomes a DIRECT cost in that event's P&L (the counterpart to depreciation's
 * indirect overhead). The labour-by-event view sums committed labour per booking.
 * Gated on isWageRegisterOn(); the backend 404s until WAGE_REGISTER_ON. Additive.
 */
import * as React from "react";
import { venueOsApi, type WageRecordResult, type WagePostResult, type LabourByEvent } from "@/lib/api/venueOs";
import { isWageRegisterOn } from "@/lib/wage-register-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: string | number): string => "Rs " + Math.round(Number(n) || 0).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function WageCostingView(): React.ReactElement | null {
  const enabled = isWageRegisterOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [eventId, setEventId] = React.useState<string>("");
  const [workerName, setWorkerName] = React.useState<string>("");
  const [shiftDate, setShiftDate] = React.useState<string>("");
  const [rate, setRate] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");

  const [recorded, setRecorded] = React.useState<WageRecordResult | null>(null);
  const [posted, setPosted] = React.useState<WagePostResult | null>(null);
  const [byEvent, setByEvent] = React.useState<LabourByEvent[] | null>(null);
  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>, fallback: string): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, fallback));
    } finally {
      setBusy(false);
    }
  }

  const record = (): Promise<void> =>
    guard(async () => {
      setPosted(null);
      setRecorded(
        await venueOsApi.recordWage({
          businessId: Number(businessId),
          eventId: eventId ? Number(eventId) : undefined,
          workerName,
          shiftDate,
          agreedRate: Number(rate),
          amountPaid: Number(amount),
        }),
      );
    }, "Wage register is not enabled for your account yet.");

  const postToGl = (): Promise<void> =>
    guard(async () => {
      if (!recorded) return;
      setPosted(await venueOsApi.postWageToGl(recorded.entry.id));
    }, "Could not post the wage to the GL.");

  const loadByEvent = (): Promise<void> =>
    guard(async () => {
      setByEvent(await venueOsApi.labourByEvent(Number(businessId), { from: from || undefined, to: to || undefined }));
    }, "Could not load labour by event.");

  if (!enabled) return null;
  const ready = businessId && workerName && shiftDate && rate && amount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Per-event dihari labour</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* record a shift */}
        <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/40 p-3">
          <label className="text-sm">
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-20 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            Booking #
            <input type="number" value={eventId} onChange={(e) => setEventId(e.target.value)} className="ml-2 w-20 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            Worker
            <input type="text" value={workerName} onChange={(e) => setWorkerName(e.target.value)} className="ml-2 w-36 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            Shift date
            <input type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} className="ml-2 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            Rate
            <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            Paid
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <Button size="sm" onClick={() => void record()} disabled={!ready || busy}>
            Record shift
          </Button>
        </div>

        {recorded && (
          <div className="rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{recorded.entry.workerName}</span>
              <span className="text-muted-foreground">
                {String(recorded.entry.shiftDate).slice(0, 10)} · {PKR(recorded.entry.amountPaid)}
                {recorded.entry.eventId != null && <> · booking #{recorded.entry.eventId}</>}
              </span>
              {recorded.subFloorFlag && <Badge variant="destructive">below min wage</Badge>}
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => void postToGl()} disabled={busy || posted != null}>
                Post to GL
              </Button>
            </div>
            {recorded.warnings.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-xs text-amber-600">
                {recorded.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
            {posted && (
              <p className="mt-1 text-xs text-emerald-600">
                {posted.idempotentHit ? "Already posted" : "Posted"} {PKR(posted.amount)} as dihari
                {posted.eventId != null ? ` to booking #${posted.eventId}` : " (overhead)"}.
              </p>
            )}
          </div>
        )}

        {/* labour by event */}
        <div className="flex flex-wrap items-end gap-3 border-t pt-3">
          <label className="text-sm">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-2 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ml-2 rounded border px-2 py-1" />
          </label>
          <Button size="sm" variant="outline" onClick={() => void loadByEvent()} disabled={!businessId || busy}>
            Labour by event
          </Button>
        </div>

        {byEvent && byEvent.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Booking</th>
                  <th className="py-2 pr-3 text-right">Shifts</th>
                  <th className="py-2 pr-3 text-right">Labour paid</th>
                </tr>
              </thead>
              <tbody>
                {byEvent.map((r) => (
                  <tr key={r.eventId} className="border-b last:border-0">
                    <td className="py-2 pr-3">#{r.eventId}</td>
                    <td className="py-2 pr-3 text-right">{r.shifts}</td>
                    <td className="py-2 pr-3 text-right font-medium">{PKR(r.totalPaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {byEvent && byEvent.length === 0 && <p className="text-sm text-muted-foreground">No event-tagged labour in this window.</p>}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default WageCostingView;
