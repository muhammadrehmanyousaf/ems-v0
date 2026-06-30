"use client";

/**
 * Venue-OS P2 · WS7-B — utility apportionment panel. Add a meter, enter a shared
 * GRID/GAS/WATER bill, then run the allocation: the cascade picks a basis
 * (SUBMETER→LOAD_HOURS→GUESTS→REVENUE→MANUAL — shown per run), each event's share
 * posts TAGGED to its booking's P&L, and the unallocatable remainder lands in
 * UTIL_GRID_COMMON (untagged overhead). Dry-run previews before posting; a re-run
 * reverses the prior posted run. Gated on isUtilityAllocationOn(); the backend
 * 404s until ENABLE_UTILITY_ALLOCATION. Additive — money posts only via the GL.
 */
import * as React from "react";
import { venueOsApi, type UtilityMeter, type AllocationResult } from "@/lib/api/venueOs";
import { isUtilityAllocationOn } from "@/lib/utility-allocation-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string): string => "Rs " + Math.round(Number(n)).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function UtilityAllocationView(): React.ReactElement | null {
  const enabled = isUtilityAllocationOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [meters, setMeters] = React.useState<UtilityMeter[]>([]);
  const [label, setLabel] = React.useState<string>("Main LESCO");
  const [meterType, setMeterType] = React.useState<string>("GRID");
  const [kva, setKva] = React.useState<string>("");

  const [meterId, setMeterId] = React.useState<string>("");
  const [month, setMonth] = React.useState<string>("");
  const [total, setTotal] = React.useState<string>("");

  const [residualShare, setResidualShare] = React.useState<string>("0");
  const [result, setResult] = React.useState<AllocationResult | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Utility allocation is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utility allocation (shared bill → per-event)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="text-sm">
          Business #
          <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
        </label>

        {/* meters */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">Meters</span>
            <input type="text" placeholder="label" value={label} onChange={(e) => setLabel(e.target.value)} className="w-32 rounded border px-2 py-1" />
            <select value={meterType} onChange={(e) => setMeterType(e.target.value)} className="rounded border px-2 py-1">
              <option value="GRID">GRID</option>
              <option value="GENSET">GENSET</option>
              <option value="GAS">GAS</option>
              <option value="WATER_SOURCE">WATER</option>
            </select>
            <input type="number" placeholder="kVA" value={kva} onChange={(e) => setKva(e.target.value)} className="w-20 rounded border px-2 py-1" />
            <Button size="sm" onClick={() => void guard(async () => { await venueOsApi.createUtilityMeter({ businessId: Number(businessId), label, meterType, sanctionedLoadKva: kva ? Number(kva) : undefined }); setMeters(await venueOsApi.listUtilityMeters(Number(businessId))); })} disabled={!businessId || !label || busy}>
              Add
            </Button>
            <Button size="sm" variant="outline" onClick={() => void guard(async () => setMeters(await venueOsApi.listUtilityMeters(Number(businessId))))} disabled={!businessId || busy}>
              List
            </Button>
          </div>
          {meters.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {meters.map((m) => (
                <span key={m.id} className="mr-3">#{m.id} {m.label} ({m.meterType})</span>
              ))}
            </div>
          )}
        </div>

        {/* bill */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">Bill</span>
            <input type="number" placeholder="meter #" value={meterId} onChange={(e) => setMeterId(e.target.value)} className="w-24 rounded border px-2 py-1" />
            <input type="text" placeholder="YYYY-MM" value={month} onChange={(e) => setMonth(e.target.value)} className="w-28 rounded border px-2 py-1" />
            <input type="number" placeholder="total payable" value={total} onChange={(e) => setTotal(e.target.value)} className="w-32 rounded border px-2 py-1" />
            <Button size="sm" onClick={() => void guard(async () => { await venueOsApi.createUtilityBill({ meterId: Number(meterId), billingMonth: month, totalPayable: Number(total) }); })} disabled={!meterId || !month || !total || busy}>
              Record bill
            </Button>
          </div>
        </div>

        {/* allocate */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">Allocate</span>
            <input type="text" placeholder="YYYY-MM" value={month} onChange={(e) => setMonth(e.target.value)} className="w-28 rounded border px-2 py-1" />
            <label className="text-xs">
              residual %
              <input type="number" value={residualShare} onChange={(e) => setResidualShare(e.target.value)} className="ml-1 w-16 rounded border px-2 py-1" />
            </label>
            <Button size="sm" variant="outline" onClick={() => void guard(async () => setResult(await venueOsApi.runUtilityAllocation(Number(businessId), { billingMonth: month, residualShare: Number(residualShare) / 100, dryRun: true })))} disabled={!businessId || !month || busy}>
              Preview
            </Button>
            <Button size="sm" onClick={() => void guard(async () => setResult(await venueOsApi.runUtilityAllocation(Number(businessId), { billingMonth: month, residualShare: Number(residualShare) / 100 })))} disabled={!businessId || !month || busy}>
              Post
            </Button>
          </div>
          {result && (
            <div className="text-sm">
              {result.reason ? (
                <p className="text-muted-foreground">{result.reason}</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">basis: {result.basisUsed}</Badge>
                    {result.dryRun && <Badge variant="outline">preview</Badge>}
                    <span>allocatable {PKR(result.totalAllocatable)}</span>
                    <span className="text-amber-600">residual {PKR(result.residualPkr)} (overhead)</span>
                  </div>
                  <div className="mt-1 space-y-0.5 text-xs">
                    {result.eventCosts.map((c) => (
                      <div key={c.eventId} className="flex justify-between border-t pt-0.5">
                        <span>Booking #{c.eventId}</span>
                        <span>{(c.weight * 100).toFixed(0)}%</span>
                        <span className="font-medium">{PKR(c.allocatedPkr)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default UtilityAllocationView;
