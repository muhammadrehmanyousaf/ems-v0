"use client";

/**
 * Venue-OS P2 · WS2 — partner cap-table. Add partners (working/silent/investor +
 * share %), see the share total + retained %, and distribute a net profit by share
 * (penny-true). Read-only over the GL — distribution is a report; an actual drawing
 * posts separately. Gated on isCapTableOn(); the backend 404s until ENABLE_CAP_TABLE.
 */
import * as React from "react";
import { venueOsApi, type CapTable, type ProfitDistribution } from "@/lib/api/venueOs";
import { isCapTableOn } from "@/lib/cap-table-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string): string => "Rs " + Math.round(Number(n)).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function CapTableView(): React.ReactElement | null {
  const enabled = isCapTableOn();
  const [businessId, setBusinessId] = React.useState<string>("");
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
      setErr(readErr(e, "Cap-table is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const bid = Number(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Partner cap-table</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setTable(await venueOsApi.getCapTable(bid)))} disabled={!businessId || busy}>
            Load
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <input type="text" placeholder="partner name" value={name} onChange={(e) => setName(e.target.value)} className="w-36 rounded border px-2 py-1" />
          <select value={ptype} onChange={(e) => setPtype(e.target.value)} className="rounded border px-2 py-1">
            {["WORKING", "SILENT", "INVESTOR"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input type="number" placeholder="share %" value={share} onChange={(e) => setShare(e.target.value)} className="w-20 rounded border px-2 py-1" />
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
          <input type="number" placeholder="net profit" value={netProfit} onChange={(e) => setNetProfit(e.target.value)} className="w-32 rounded border px-2 py-1" />
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
