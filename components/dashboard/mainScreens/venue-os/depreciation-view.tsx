"use client";

/**
 * Venue-OS P2 — Fixed assets + depreciation. Register a venue's depreciable
 * assets (generators, crockery, sound gear), then run straight-line monthly
 * depreciation for a period — which posts to the GL and feeds the costing-depth
 * overhead pool so every event carries its share of wear-and-tear. "Preview" is a
 * dry-run; "Post" writes (idempotent per asset+period).
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 */
import * as React from "react";
import { EmptyState } from "@/components/dashboard/primitives/empty-state";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueOsApi, type FixedAsset, type DepreciationRun } from "@/lib/api/venueOs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";

const PKR = (n: string | number): string => "Rs " + Math.round(Number(n) || 0).toLocaleString("en-PK");
const CATEGORIES = ["GENERATOR", "CROCKERY", "FURNITURE", "SOUND_LIGHT", "VEHICLE", "LEASEHOLD", "OTHER"];

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function DepreciationView(): React.ReactElement | null {
  const [businessId, setBusinessId] = useBusinessIdField();
  const [assets, setAssets] = React.useState<FixedAsset[] | null>(null);
  const [run, setRun] = React.useState<DepreciationRun | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  // new-asset form
  const [name, setName] = React.useState<string>("");
  const [category, setCategory] = React.useState<string>("GENERATOR");
  const [cost, setCost] = React.useState<string>("");
  const [life, setLife] = React.useState<string>("60");
  const [inService, setInService] = React.useState<string>("");
  const [period, setPeriod] = React.useState<string>("");

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

  const loadAssets = (): Promise<void> =>
    guard(async () => {
      setAssets(await venueOsApi.listFixedAssets(Number(businessId)));
    }, "Couldn't load depreciation.");

  const addAsset = (): Promise<void> =>
    guard(async () => {
      await venueOsApi.createFixedAsset({
        businessId: Number(businessId),
        name,
        category,
        cost: Number(cost),
        usefulLifeMonths: Number(life),
        inServiceDate: inService,
      });
      setName("");
      setCost("");
      setAssets(await venueOsApi.listFixedAssets(Number(businessId)));
    }, "Could not create the asset.");

  const doRun = (dryRun: boolean): Promise<void> =>
    guard(async () => {
      setRun(await venueOsApi.runDepreciation(Number(businessId), { period, dryRun }));
    }, "Could not run depreciation.");


  return (
    <Card>
      <CardHeader>
        <CardTitle>Fixed assets &amp; depreciation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <BusinessScopeField value={businessId} onChange={setBusinessId} />
          <Button size="sm" variant="outline" onClick={() => void loadAssets()} disabled={!businessId || busy}>
            Load assets
          </Button>
        </div>

        {/* register a new asset */}
        <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/40 p-3">
          <label className="text-sm">
            Name
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="ml-2 w-40 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="text-sm">
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="ml-2 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace("_", " ").toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Cost
            <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className="ml-2 w-28 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="text-sm">
            Life (months)
            <input type="number" value={life} onChange={(e) => setLife(e.target.value)} className="ml-2 w-20 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="text-sm">
            In service
            <input type="date" value={inService} onChange={(e) => setInService(e.target.value)} className="ml-2 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <Button size="sm" onClick={() => void addAsset()} disabled={!businessId || !name || !cost || !inService || busy}>
            Add asset
          </Button>
        </div>

        {assets && assets.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-3">Asset</th>
                  <th scope="col" className="py-2 pr-3">Category</th>
                  <th scope="col" className="py-2 pr-3 text-right">Cost</th>
                  <th scope="col" className="py-2 pr-3 text-right">Life</th>
                  <th scope="col" className="py-2 pr-3">In service</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{a.name}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{a.category.replace("_", " ").toLowerCase()}</td>
                    <td className="py-2 pr-3 text-right">{PKR(a.cost)}</td>
                    <td className="py-2 pr-3 text-right">{a.usefulLifeMonths}m</td>
                    <td className="py-2 pr-3">{String(a.inServiceDate).slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {assets && assets.length === 0 && (
          <EmptyState
            size="inline"
            title="No fixed assets registered yet."
            description="Register generators, marquees or kitchen equipment to run depreciation."
          />
        )}

        {/* run depreciation */}
        <div className="flex flex-wrap items-end gap-3 border-t pt-3">
          <label className="text-sm">
            Period
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="ml-2 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <Button size="sm" variant="outline" onClick={() => void doRun(true)} disabled={!businessId || !period || busy}>
            Preview
          </Button>
          <Button size="sm" onClick={() => void doRun(false)} disabled={!businessId || !period || busy}>
            Post
          </Button>
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}

        {run && (
          <div className="rounded-md border p-3 text-sm">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-semibold">{PKR(run.totalDepreciation)}</span>
              <span className="text-muted-foreground">depreciation for {run.period} · {run.postedCount}/{run.assetCount} assets</span>
              {run.results.some((r) => r.dryRun) && <Badge variant="secondary">preview (not written)</Badge>}
            </div>
            <ul className="space-y-1">
              {run.results.map((r) => (
                <li key={r.assetId} className="flex justify-between">
                  <span>{r.name}</span>
                  {r.skipped ? (
                    <span className="text-muted-foreground">{r.skipped.replace(/_/g, " ")}</span>
                  ) : (
                    <span>
                      {PKR(r.amount || 0)}
                      {r.idempotentHit && <span className="ml-1 text-xs text-muted-foreground">(already posted)</span>}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DepreciationView;
