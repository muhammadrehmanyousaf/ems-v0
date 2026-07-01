"use client";

/**
 * Venue-OS P3-E — RecipeBOM + production yield/cost variance. Load the recipes,
 * pull a recipe's standard cost/plate (from the BOM × latest ingredient rates), and
 * run a yield-variance check on a production run — fewer plates than the degh should
 * give + ghee over the standard bill get flagged in rupees ("prove your cook is
 * honest"). Gated on isKitchenBomOn() — the backend 404s until ENABLE_KITCHEN_BOM.
 */
import * as React from "react";
import { venueOsApi, type RecipeBom, type YieldVariance } from "@/lib/api/venueOs";
import { isKitchenBomOn } from "@/lib/kitchen-bom-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function KitchenBomView(): React.ReactElement | null {
  const enabled = isKitchenBomOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [boms, setBoms] = React.useState<RecipeBom[] | null>(null);
  const [runId, setRunId] = React.useState<string>("");
  const [variance, setVariance] = React.useState<YieldVariance | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Kitchen BOM is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const bid = Number(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kitchen BOM &amp; degh-yield variance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>Business #<input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" /></label>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setBoms(await venueOsApi.listRecipeBoms(bid)))} disabled={!businessId || busy}>Load recipes</Button>
        </div>

        {boms && (
          <div className="space-y-1 text-xs">
            {boms.length === 0 && <p className="text-muted-foreground">No recipe BOMs yet.</p>}
            {boms.map((b) => (
              <div key={b.id} className="flex items-center justify-between border-t pt-0.5">
                <span>#{b.id} {b.dishName} · {b.standardYieldPlates} plates/degh · {b.ingredients.length} ingredients</span>
                <Button size="sm" variant="ghost" onClick={() => void guard(async () => { const c = await venueOsApi.standardCost(bid, b.id); setErr(`Standard cost/plate: ${PKR(c.costPerPlate)}`); })} disabled={busy}>Std cost</Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <span className="font-medium">Yield check</span>
          <input type="number" placeholder="production run #" value={runId} onChange={(e) => setRunId(e.target.value)} className="w-36 rounded border px-2 py-1" />
          <Button size="sm" onClick={() => void guard(async () => setVariance(await venueOsApi.yieldVariance(Number(runId))))} disabled={!runId || busy}>Check variance</Button>
        </div>

        {variance && (
          <div className="rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{variance.dishName}: {variance.actualPlates}/{variance.stdPlates} plates</span>
              {variance.yieldShortfall && <Badge variant="destructive">yield short {variance.yieldVariancePct}%</Badge>}
              {variance.overuseCostPkr > 0 && <Badge variant="secondary">over-used {PKR(variance.overuseCostPkr)}</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">std cost {PKR(variance.stdCostPkr)} → actual {PKR(variance.actualCostPkr)} (variance {PKR(variance.costVariancePkr)})</p>
            {variance.overuseItems.map((l) => (
              <div key={l.itemId} className="flex justify-between text-xs text-muted-foreground">
                <span>item #{l.itemId}: {l.actualQty} vs std {l.stdQty}</span>
                <span>+{PKR(l.overuseCostPkr)}</span>
              </div>
            ))}
            <p className="mt-1 text-xs">{variance.note}</p>
          </div>
        )}

        {err && <p className="text-sm text-muted-foreground">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default KitchenBomView;
