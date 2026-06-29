"use client";

/**
 * Venue-OS P2 — Group consolidation (ghar-ka-maal). Shows the group's standalone
 * sum (which double-counts internal trade) next to the CONSOLIDATED view that
 * eliminates inter-business revenue against the matching cost — so the owner sees
 * true external revenue/cost and how much of the "group revenue" was really just
 * selling to themselves. Gated on isGroupConsolidationOn(); the backend 404s
 * until GROUP_CONSOLIDATION_ON. Additive — no existing screen touched.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { venueOsApi, type IsDeclared, type ConsolidatedRollup } from "@/lib/api/venueOs";
import { isGroupConsolidationOn } from "@/lib/group-consolidation-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number): string => "Rs " + Math.round(n).toLocaleString("en-PK");
const netClass = (n: number): string => (n >= 0 ? "text-emerald-600" : "text-red-600");

function Col({ title, rev, cogs, opex, net, muted = false }: { title: string; rev: number; cogs: number; opex: number; net: number; muted?: boolean }): React.ReactElement {
  return (
    <div className={`rounded-md border p-3 ${muted ? "opacity-70" : ""}`}>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</div>
      <Row label="Revenue" value={rev} />
      <Row label="COGS" value={cogs} />
      <Row label="Overheads" value={opex} />
      <div className="mt-1 flex justify-between border-t pt-1 text-sm font-semibold">
        <span>Net</span>
        <span className={netClass(net)}>{PKR(net)}</span>
      </div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{PKR(value)}</span>
    </div>
  );
}

export function GroupConsolidationView(): React.ReactElement | null {
  const enabled = isGroupConsolidationOn();
  const [orgInput, setOrgInput] = React.useState<string>("");
  const [orgId, setOrgId] = React.useState<number | null>(null);
  const [view, setView] = React.useState<IsDeclared>("MANAGEMENT_ONLY");

  const q = useQuery({
    queryKey: ["venueOs", "consolidated", orgId, view],
    queryFn: () => venueOsApi.orgConsolidated(orgId as number, view),
    enabled: enabled && orgId != null,
    retry: false,
  });

  if (!enabled) return null;
  const d: ConsolidatedRollup | undefined = q.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group consolidation (ghar-ka-maal netting)</CardTitle>
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

        {q.isError && <p className="text-sm text-muted-foreground">Group consolidation is not enabled for your account yet.</p>}
        {orgId != null && q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {d && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Col title="Standalone sum (gross)" rev={d.gross.revenue} cogs={d.gross.cogs} opex={d.gross.opex} net={d.gross.netProfit} muted />
              <Col title="Consolidated (external)" rev={d.consolidated.revenue} cogs={d.consolidated.cogs} opex={d.consolidated.opex} net={d.consolidated.netProfit} />
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/40 p-3 text-sm">
              <span>
                Internal trade eliminated: <strong>{PKR(d.eliminations.internalTradeVolume)}</strong>
              </span>
              {d.eliminations.internalTradeVolume > 0 && d.gross.revenue > 0 && (
                <Badge variant="secondary">
                  {Math.round((d.eliminations.internalTradeVolume / d.gross.revenue) * 100)}% of gross revenue was internal
                </Badge>
              )}
              {Math.abs(d.eliminations.netImpact) < 0.01 ? (
                <Badge className="bg-emerald-500">net preserved</Badge>
              ) : (
                <Badge variant="destructive">net impact {PKR(d.eliminations.netImpact)}</Badge>
              )}
              <span className="text-muted-foreground">{d.businessCount} venues</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GroupConsolidationView;
