"use client";

/**
 * Venue-OS — Post-dated cheque (PDC) clearing drawer (P1 FE). Lists cheques due
 * to clear within N days off /api/v1/venue-os/pdc/alerts, flagging overdue ones
 * — the "cheque bounced last week and nobody chased it" gap. Gated on
 * isPaymentLedgerOn(); the backend 404s until PAYMENT_LEDGER_ON. Additive — no
 * existing screen touched.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { venueOsApi, type PdcAlert } from "@/lib/api/venueOs";
import { isPaymentLedgerOn } from "@/lib/payment-ledger-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PKR = (n: string | number): string => "Rs " + Math.round(Number(n) || 0).toLocaleString("en-PK");

export function PdcDrawer(): React.ReactElement | null {
  const enabled = isPaymentLedgerOn();
  const [withinDays, setWithinDays] = React.useState<number>(5);

  const alerts = useQuery({
    queryKey: ["venueOs", "pdcAlerts", withinDays],
    queryFn: () => venueOsApi.pdcAlerts(undefined, withinDays),
    enabled,
    retry: false,
  });

  if (!enabled) return null;
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

        {alerts.isError && <p className="text-sm text-muted-foreground">PDC tracking is not enabled for your account yet.</p>}
        {alerts.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!alerts.isLoading && !alerts.isError && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No cheques due to clear in the next {withinDays} days.</p>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Cheque #</th>
                  <th className="py-2 pr-3">Booking</th>
                  <th className="py-2 pr-3 text-right">Amount</th>
                  <th className="py-2 pr-3">Clears</th>
                  <th className="py-2 pr-3">Status</th>
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
