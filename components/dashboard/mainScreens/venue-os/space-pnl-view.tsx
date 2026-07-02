"use client";

/**
 * Per-space P&L — "which hall/floor/partition earns the most and is most
 * profitable?". Revenue (bookings → resource → space) minus cost (expenses tagged
 * to the space), folded up the Hall→Floor→Partition tree. Gated by the venue-
 * hierarchy flag; scopes to the active venue.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { venueSpacesApi, type SpacePnl } from "@/lib/api/venueSpaces";
import { useActiveBusinessId } from "@/lib/store/active-business-store";
import { isVenueHierarchyOn } from "@/lib/venue-hierarchy-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PKR = (n: number): string => "Rs " + Math.round(Number(n) || 0).toLocaleString("en-PK");

function Stat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

export function SpacePnlView(): React.ReactElement | null {
  const enabled = isVenueHierarchyOn();
  const businessId = useActiveBusinessId();
  const q = useQuery({
    queryKey: ["spacePnl", businessId],
    queryFn: () => venueSpacesApi.spacePnl(businessId as number),
    enabled: enabled && businessId != null,
    retry: false,
  });
  if (!enabled || businessId == null) return null;
  const d: SpacePnl | undefined = q.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Per-space P&amp;L — which space earns the most</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {q.isError && <p className="text-sm text-muted-foreground">Per-space P&amp;L isn&apos;t enabled for this venue yet.</p>}
        {d && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Revenue" value={PKR(d.totals.revenue)} />
              <Stat label="Cost" value={PKR(d.totals.cost)} />
              <Stat label="Margin" value={`${PKR(d.totals.margin)}${d.totals.marginPct != null ? ` · ${d.totals.marginPct}%` : ""}`} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-1.5 font-medium">Space</th>
                    <th className="py-1.5 text-right font-medium">Revenue</th>
                    <th className="py-1.5 text-right font-medium">Cost</th>
                    <th className="py-1.5 text-right font-medium">Margin</th>
                    <th className="py-1.5 text-right font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {d.ranked.map((s) => (
                    <tr key={s.subVenueId} className="border-t">
                      <td className="py-1.5">
                        {s.name} <span className="text-xs text-muted-foreground">· {s.kind}</span>
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{PKR(s.revenue)}</td>
                      <td className="py-1.5 text-right tabular-nums">{PKR(s.cost)}</td>
                      <td className={`py-1.5 text-right font-medium tabular-nums ${s.margin >= 0 ? "text-emerald-600" : "text-red-600"}`}>{PKR(s.margin)}</td>
                      <td className="py-1.5 text-right tabular-nums">{s.marginPct != null ? `${s.marginPct}%` : "—"}</td>
                    </tr>
                  ))}
                  {d.ranked.length === 0 && (
                    <tr><td colSpan={5} className="py-3 text-sm text-muted-foreground">No per-space revenue or cost recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {(d.businessLevel.revenue > 0 || d.businessLevel.cost > 0) && (
              <p className="text-xs text-muted-foreground">
                Business-level (not tied to a space): revenue {PKR(d.businessLevel.revenue)}, overhead cost {PKR(d.businessLevel.cost)}.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default SpacePnlView;
