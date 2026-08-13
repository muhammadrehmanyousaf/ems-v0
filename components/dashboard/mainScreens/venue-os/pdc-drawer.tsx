"use client";

/**
 * Venue-OS — Post-dated cheque (PDC) clearing drawer (P1 FE). Lists cheques due
 * to clear within N days off /api/v1/venue-os/pdc/alerts, flagging overdue ones
 * — the "cheque bounced last week and nobody chased it" gap.
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 * existing screen touched.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { venueOsApi, type PdcAlert } from "@/lib/api/venueOs";
import { useActiveBusinessId } from "@/lib/store/active-business-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PKR = (n: string | number): string => "Rs " + Math.round(Number(n) || 0).toLocaleString("en-PK");

export function PdcDrawer(): React.ReactElement | null {
  const [withinDays, setWithinDays] = React.useState<number>(5);
  const activeBusinessId = useActiveBusinessId();

  const alerts = useQuery({
    /**
     * `businessId` was hardcoded `undefined`, so this panel asked
     * /venue-os/pdc/alerts?withinDays=5 with no business and the backend
     * answered 400 "BusinessId is required" — every time, for every vendor,
     * since it shipped. The card has only ever shown "Couldn't load PDC
     * tracking", which reads like a temporary outage rather than a request
     * that cannot succeed. Meanwhile /dashboard/pdcs lists the same cheques
     * fine, so the data was always there.
     *
     * It is also in the key: without it, switching venue would have served the
     * first venue's cheques from cache — the same class of bug as the slot
     * scoping leak, and worse here because it is money owed.
     */
    queryKey: ["venueOs", "pdcAlerts", activeBusinessId, withinDays],
    queryFn: () => venueOsApi.pdcAlerts(activeBusinessId ?? undefined, withinDays),
    // On "All venues" there is no single business to scope to, and the endpoint
    // requires one. Ask only when we can ask properly.
    enabled: activeBusinessId != null,
    retry: false,
  });

  const rows: PdcAlert[] = alerts.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cheques clearing soon (PDC)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Window</span>
          {[3, 5, 7, 14].map((d) => (
            <Button key={d} size="sm" variant={withinDays === d ? "default" : "outline"} onClick={() => setWithinDays(d)}>
              {d}d
            </Button>
          ))}
        </div>

        {/* "All venues" is not a failure — cheque clearing is per-venue, so say
            which control to use instead of showing an error for a question we
            never asked. */}
        {activeBusinessId == null && (
          <p className="text-sm text-muted-foreground">
            Choose a single venue in the switcher to see its cheques.
          </p>
        )}
        {activeBusinessId != null && alerts.isError && (
          <p className="text-sm text-muted-foreground">Couldn&apos;t load PDC tracking.</p>
        )}
        {alerts.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!alerts.isLoading && !alerts.isError && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No cheques due to clear in the next {withinDays} days.</p>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-3">Cheque #</th>
                  <th scope="col" className="py-2 pr-3">Booking</th>
                  <th scope="col" className="py-2 pr-3 text-right">Amount</th>
                  <th scope="col" className="py-2 pr-3">Clears</th>
                  <th scope="col" className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">#{r.id}</td>
                    <td className="py-2 pr-3">{r.bookingId != null ? `#${r.bookingId}` : "—"}</td>
                    <td className="py-2 pr-3 text-right font-medium">{PKR(r.amount)}</td>
                    <td className="py-2 pr-3">{String(r.chequeDate).slice(0, 10)}</td>
                    <td className="py-2 pr-3">
                      {r.overdue ? <Badge variant="destructive">overdue</Badge> : <Badge variant="secondary">{r.status}</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PdcDrawer;
