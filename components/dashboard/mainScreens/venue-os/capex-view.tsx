"use client";

/**
 * Venue-OS P3-B — capex / asset-ROI. Enter an asset price + the option costs and get
 * buy-vs-rent-vs-lease over a horizon, the payback clock, the ROI, and the monthly
 * replacement (sinking-fund) reserve — a genset/marquee buy as a decision with
 * numbers.
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 */
import * as React from "react";
import { venueOsApi, type CapexCompare } from "@/lib/api/venueOs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function CapexView(): React.ReactElement | null {
  const [price, setPrice] = React.useState<string>("");
  const [rental, setRental] = React.useState<string>("");
  const [earnings, setEarnings] = React.useState<string>("");
  const [res, setRes] = React.useState<CapexCompare | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Capex ROI is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Capex — buy vs rent vs lease</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>Asset price<input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="ml-1 w-32 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <label>Ijarah/mo<input type="number" value={rental} onChange={(e) => setRental(e.target.value)} className="ml-1 w-28 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <label>Net earn/mo<input type="number" value={earnings} onChange={(e) => setEarnings(e.target.value)} className="ml-1 w-28 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <Button size="sm" onClick={() => void guard(async () => setRes(await venueOsApi.capexCompare({ assetPricePkr: Number(price), usefulLifeMonths: 60, monthlyMaintenancePkr: Math.round(Number(price) * 0.005), ijarahMonthlyPkr: Number(rental || 0), ijarahTermMonths: 36, horizonMonths: 36, monthlyNetEarningsPkr: Number(earnings || 0), inflationAnnualPct: 10 })))} disabled={!price || busy}>Compare</Button>
        </div>

        {res && (
          <div className="space-y-2 rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Recommend</span>
              <Badge>{res.comparison.recommendedOption}</Badge>
              <span className="text-xs text-muted-foreground">saves {PKR(res.comparison.savingsVsNextPkr)} vs next</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {res.comparison.options.map((o) => (
                <div key={o.option} className="rounded-md border p-2"><div className="text-muted-foreground">{o.option}</div><div className="font-medium">{PKR(o.totalCostPkr)}</div></div>
              ))}
            </div>
            <p className="text-xs">{res.payback.note} · ROI {res.roi.roiPct ?? "—"}% · reserve {PKR(res.reserve.monthlyReservePkr)}/mo</p>
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default CapexView;
