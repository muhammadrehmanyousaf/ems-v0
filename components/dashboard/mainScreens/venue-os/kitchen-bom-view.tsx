"use client";

/**
 * Venue-OS P3-E — RecipeBOM + production yield/cost variance. Load the recipes,
 * pull a recipe's standard cost/plate (from the BOM × latest ingredient rates), and
 * run a yield-variance check on a production run — fewer plates than the degh should
 * give + ghee over the standard bill get flagged in rupees ("prove your cook is
 * honest").
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 */
import * as React from "react";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueOsApi, type RecipeBom, type YieldVariance } from "@/lib/api/venueOs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function KitchenBomView(): React.ReactElement | null {
  const [businessId, setBusinessId] = useBusinessIdField();
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
      setErr(readErr(e, "Couldn't load kitchen BOM."));
    } finally {
      setBusy(false);
    }
  }

  const bid = Number(businessId);

  // Load on arrival — the Kitchen tab opened as a heading and three empty boxes
  // because nothing fetched until "Load recipes" was pressed.
  React.useEffect(() => {
    if (!businessId) return;
    void guard(async () => setBoms(await venueOsApi.listRecipeBoms(Number(businessId))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kitchen BOM &amp; degh-yield variance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <BusinessScopeField value={businessId} onChange={setBusinessId} />
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
          <input type="number" placeholder="production run #" value={runId} onChange={(e) => setRunId(e.target.value)} className="w-36 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
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
