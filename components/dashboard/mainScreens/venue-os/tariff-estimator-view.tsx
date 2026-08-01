"use client";

/**
 * Venue-OS P2 · WS7-depth — auto-tariff estimator. Type the meter units (and kVA)
 * and the slab engine computes the DISCO bill from the effective-dated tariff —
 * block slabs + fixed-per-kVA + surcharge + electricity duty + GST — so the bill
 * the allocation engine apportions is computed, not hand-typed. An unverified
 * tariff is clearly flagged as an estimate (rate-as-data).
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 */
import * as React from "react";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueOsApi, type TariffEstimate } from "@/lib/api/venueOs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function TariffEstimatorView(): React.ReactElement | null {
  const [businessId, setBusinessId] = useBusinessIdField();
  const [units, setUnits] = React.useState<string>("");
  const [kva, setKva] = React.useState<string>("");
  const [est, setEst] = React.useState<TariffEstimate | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Couldn't load utility allocation."));
    } finally {
      setBusy(false);
    }
  }

  const bid = Number(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-tariff bill estimator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <BusinessScopeField value={businessId} onChange={setBusinessId} />
          <label>Units (kWh)<input type="number" value={units} onChange={(e) => setUnits(e.target.value)} className="ml-1 w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <label>kVA<input type="number" value={kva} onChange={(e) => setKva(e.target.value)} className="ml-1 w-20 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <Button size="sm" onClick={() => void guard(async () => setEst(await venueOsApi.estimateBill(bid, { utility: "GRID", consumption: { totalUnitsKwh: Number(units), sanctionedKva: kva ? Number(kva) : 0 } })))} disabled={!businessId || !units || busy}>Estimate</Button>
        </div>

        {est && (
          <div className="rounded-md border p-3 text-sm">
            {est.status === "NO_TARIFF" ? (
              <p className="text-muted-foreground">{est.note}</p>
            ) : est.bill ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Estimated bill {PKR(est.bill.total)}</span>
                  <Badge variant={est.status === "READY" ? "secondary" : "destructive"}>{est.status === "READY" ? "verified tariff" : "estimate — unverified"}</Badge>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                  <span>energy {PKR(est.bill.energyCharge)}</span>
                  <span>fixed {PKR(est.bill.fixedCharge)}</span>
                  <span>surcharge {PKR(est.bill.surchargeTotal)}</span>
                  <span>duty {PKR(est.bill.dutyAmount)}</span>
                  <span>GST {PKR(est.bill.gstAmount)}</span>
                  <span>{est.bill.units} kWh</span>
                </div>
                <p className="mt-1 text-xs">{est.note}</p>
              </>
            ) : null}
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default TariffEstimatorView;
