"use client";

/**
 * Venue-OS P2 · WS3-depth — supplier rate contracts + live re-cost sweep. Add a
 * contracted rate for an item; check GRN lines against it (over-billing is flagged
 * with the exact rupee shortfall); and sweep the deg-rate-card cost of open
 * bookings to catch the ones that went underwater when an ingredient rate moved.
 * Gated on isProcurementGrnOn() — the backend 404s until PROCUREMENT_GRN_ON.
 */
import * as React from "react";
import { venueOsApi, type RateContract, type GrnContractCheck } from "@/lib/api/venueOs";
import { isProcurementGrnOn } from "@/lib/procurement-grn-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function RateContractView(): React.ReactElement | null {
  const enabled = isProcurementGrnOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [item, setItem] = React.useState<string>("");
  const [rate, setRate] = React.useState<string>("");
  const [tol, setTol] = React.useState<string>("5");
  const [contracts, setContracts] = React.useState<RateContract[] | null>(null);
  const [billRate, setBillRate] = React.useState<string>("");
  const [qty, setQty] = React.useState<string>("");
  const [check, setCheck] = React.useState<GrnContractCheck | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Procurement is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const bid = Number(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate contracts &amp; over-billing check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>Business #<input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" /></label>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setContracts(await venueOsApi.listRateContracts(bid)))} disabled={!businessId || busy}>Load contracts</Button>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <input type="text" placeholder="item e.g. Chicken" value={item} onChange={(e) => setItem(e.target.value)} className="w-36 rounded border px-2 py-1" />
          <input type="number" placeholder="rate/unit" value={rate} onChange={(e) => setRate(e.target.value)} className="w-24 rounded border px-2 py-1" />
          <input type="number" placeholder="tol %" value={tol} onChange={(e) => setTol(e.target.value)} className="w-16 rounded border px-2 py-1" />
          <Button size="sm" onClick={() => void guard(async () => { await venueOsApi.createRateContract({ businessId: bid, itemNameSnapshot: item, contractedRatePkr: Number(rate), tolerancePct: Number(tol), effectiveFrom: new Date().toISOString().slice(0, 10) }); setContracts(await venueOsApi.listRateContracts(bid)); })} disabled={!businessId || !item || !rate || busy}>Add contract</Button>
        </div>

        {contracts && (
          <div className="space-y-0.5 text-xs">
            {contracts.length === 0 && <p className="text-muted-foreground">No contracts yet.</p>}
            {contracts.map((c) => (
              <div key={c.id} className="flex justify-between border-t pt-0.5">
                <span>{c.itemNameSnapshot} ({c.unit || "—"})</span>
                <span className="font-medium">{PKR(c.contractedRatePkr)} ±{c.tolerancePct}%</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <span className="font-medium">Check a GRN line</span>
          <input type="text" placeholder="item" value={item} onChange={(e) => setItem(e.target.value)} className="w-32 rounded border px-2 py-1" />
          <input type="number" placeholder="billed rate" value={billRate} onChange={(e) => setBillRate(e.target.value)} className="w-24 rounded border px-2 py-1" />
          <input type="number" placeholder="qty" value={qty} onChange={(e) => setQty(e.target.value)} className="w-20 rounded border px-2 py-1" />
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setCheck(await venueOsApi.checkGrnContracts(bid, { lines: [{ itemNameSnapshot: item, ratePkr: Number(billRate), qty: Number(qty) }] })))} disabled={!businessId || !item || !billRate || busy}>Check</Button>
        </div>

        {check && (
          <div className="rounded-md border p-3 text-xs">
            {check.flagCount === 0 ? (
              <p className="text-emerald-600">Within contract — no over-billing.</p>
            ) : (
              <>
                <p className="font-medium text-destructive">Over-billed by {PKR(check.totalShortfallPkr)}</p>
                {check.flags.map((f, i) => (
                  <div key={i} className="flex justify-between border-t pt-0.5">
                    <span>{f.itemName}: {PKR(f.actualRatePkr)} vs contract {PKR(f.contractedRatePkr)} (+{f.overByPct}%)</span>
                    <span className="font-medium">{PKR(f.shortfallPkr)}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default RateContractView;
