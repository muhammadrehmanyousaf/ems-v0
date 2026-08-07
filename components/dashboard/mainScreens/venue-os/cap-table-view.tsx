"use client";

/**
 * Venue-OS P2 · WS2 — partner cap-table. Add partners (working/silent/investor +
 * share %), see the share total + retained %, and distribute a net profit by share
 * (penny-true). Read-only over the GL — distribution is a report; an actual drawing
 * posts separately.
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 */
import * as React from "react";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueOsApi, type CapTable, type ProfitDistribution } from "@/lib/api/venueOs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";

const PKR = (n: number | string): string => "Rs " + Math.round(Number(n)).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function CapTableView(): React.ReactElement | null {
  const [businessId, setBusinessId] = useBusinessIdField();
  const [name, setName] = React.useState<string>("");
  const [ptype, setPtype] = React.useState<string>("WORKING");
  const [share, setShare] = React.useState<string>("");
  const [netProfit, setNetProfit] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [table, setTable] = React.useState<CapTable | null>(null);
  const [dist, setDist] = React.useState<ProfitDistribution | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Couldn't load cap-table."));
    } finally {
      setBusy(false);
    }
  }

  const bid = Number(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Partner cap-table</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <BusinessScopeField value={businessId} onChange={setBusinessId} />
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setTable(await venueOsApi.getCapTable(bid)))} disabled={!businessId || busy}>
            Load
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Partner name<input type="text" placeholder="partner name" value={name} onChange={(e) => setName(e.target.value)} className="w-36 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <select value={ptype} onChange={(e) => setPtype(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {["WORKING", "SILENT", "INVESTOR"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Share %<input min={0} type="number" placeholder="share %" value={share} onChange={(e) => setShare(e.target.value)} className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <Button size="sm" onClick={() => void guard(async () => { await venueOsApi.addPartner({ businessId: bid, partnerName: name, partnerType: ptype, sharePercent: Number(share) }); setTable(await venueOsApi.getCapTable(bid)); })} disabled={!businessId || !name || !share || busy}>
            Add partner
          </Button>
        </div>

        {table && (
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Total {table.totalSharePercent}%</span>
              {!table.valid && <Badge variant="destructive">over-allocated</Badge>}
              <span className="text-muted-foreground">retained {table.retainedPercent}%</span>
            </div>
            {table.partners.map((p) => (
              <div key={p.id} className="flex items-center gap-2 border-t pt-1 text-xs">
                <Badge variant="secondary">{p.partnerType}</Badge>
                <span>{p.partnerName}</span>
                <span className="ml-auto font-medium">{p.sharePercent}%</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <span className="font-medium">Distribute</span>
          <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Net profit<input min={0} type="number" placeholder="net profit" value={netProfit} onChange={(e) => setNetProfit(e.target.value)} className="w-32 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <Button size="sm" onClick={() => void guard(async () => setDist(await venueOsApi.distributeProfit(bid, netProfit ? { netProfitPkr: Number(netProfit) } : {})))} disabled={!businessId || busy}>
            Distribute
          </Button>
        </div>
        {dist && (
          <div className="space-y-0.5 text-xs">
            <p className="text-sm">Net {PKR(dist.netProfitPkr)} · retained {PKR(dist.retainedPkr)}</p>
            {dist.allocations.map((a) => (
              <div key={a.partnerId} className="flex justify-between border-t pt-0.5">
                <span>{a.partnerName} ({a.sharePercent}%)</span>
                <span className="font-medium">{PKR(a.amountPkr)}</span>
              </div>
            ))}
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default CapTableView;
