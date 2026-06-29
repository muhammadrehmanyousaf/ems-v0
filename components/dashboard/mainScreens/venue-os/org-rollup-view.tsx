"use client";

/**
 * Venue-OS — Org roll-up table (P1 FE). Consolidates per-business P&L across a
 * workspace/Org off the double-entry GL via /api/v1/venue-os/org/:id/rollup,
 * with the management-vs-tax (is_declared) toggle — the "how is the whole group
 * doing this month" view a single-business dashboard can't give. Gated on
 * isGlEngineOn(); the backend 404s until GL_ENGINE_ON. Additive — no existing
 * screen touched.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { venueOsApi, type IsDeclared, type OrgRollup, type OrgBusinessPnl } from "@/lib/api/venueOs";
import { isGlEngineOn } from "@/lib/gl-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PKR = (n: number): string => "Rs " + Math.round(n).toLocaleString("en-PK");

function netClass(n: number): string {
  return n >= 0 ? "text-emerald-600" : "text-red-600";
}

export function OrgRollupView(): React.ReactElement | null {
  const enabled = isGlEngineOn();
  const [orgInput, setOrgInput] = React.useState<string>("");
  const [orgId, setOrgId] = React.useState<number | null>(null);
  const [view, setView] = React.useState<IsDeclared>("MANAGEMENT_ONLY");

  const rollup = useQuery({
    queryKey: ["venueOs", "orgRollup", orgId, view],
    queryFn: () => venueOsApi.orgRollup(orgId as number, view),
    enabled: enabled && orgId != null,
    retry: false,
  });

  if (!enabled) return null;
  const d: OrgRollup | undefined = rollup.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group roll-up (all venues)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Org #
            <input type="number" value={orgInput} onChange={(e) => setOrgInput(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <Button size="sm" onClick={() => setOrgId(orgInput ? Number(orgInput) : null)} disabled={!orgInput}>
            Load
          </Button>
          <div className="flex gap-1">
            <Button size="sm" variant={view === "MANAGEMENT_ONLY" ? "default" : "outline"} onClick={() => setView("MANAGEMENT_ONLY")}>
              Management
            </Button>
            <Button size="sm" variant={view === "DECLARED" ? "default" : "outline"} onClick={() => setView("DECLARED")}>
              Tax (declared)
            </Button>
          </div>
        </div>

        {rollup.isError && <p className="text-sm text-muted-foreground">Group roll-up is not enabled for your account yet.</p>}
        {orgId != null && rollup.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {d && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Venues</div>
                <div className="text-lg font-semibold">{d.businessCount}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Revenue</div>
                <div className="text-lg font-semibold">{PKR(d.totals.revenue)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Gross profit</div>
                <div className="text-lg font-semibold">{PKR(d.totals.grossProfit)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Net profit</div>
                <div className={`text-lg font-semibold ${netClass(d.totals.netProfit)}`}>{PKR(d.totals.netProfit)}</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3">Venue</th>
                    <th className="py-2 pr-3 text-right">Revenue</th>
                    <th className="py-2 pr-3 text-right">COGS</th>
                    <th className="py-2 pr-3 text-right">Overheads</th>
                    <th className="py-2 pr-3 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {d.perBusiness.map((b: OrgBusinessPnl) => (
                    <tr key={b.businessId} className="border-b last:border-0">
                      <td className="py-2 pr-3">{b.name}</td>
                      <td className="py-2 pr-3 text-right">{PKR(b.revenue)}</td>
                      <td className="py-2 pr-3 text-right">{PKR(b.cogs)}</td>
                      <td className="py-2 pr-3 text-right">{PKR(b.opex)}</td>
                      <td className={`py-2 pr-3 text-right font-medium ${netClass(b.netProfit)}`}>{PKR(b.netProfit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default OrgRollupView;
