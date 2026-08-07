"use client";

/**
 * Venue-OS P2 — Month-end period close. Closing a month locks that business's
 * journal entries and freezes the reported P&L; the engine then rejects any new
 * posting into the closed month (so the books can't be quietly changed after the
 * fact). Reopening unlocks.
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 */
import * as React from "react";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueOsApi, type PeriodStatus } from "@/lib/api/venueOs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";
import { DangerousAction } from "@/components/dashboard/primitives/dangerous-action";

const PKR = (n: string | number | null | undefined): string => "Rs " + Math.round(Number(n) || 0).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function PeriodCloseView(): React.ReactElement | null {
  const [businessId, setBusinessId] = useBusinessIdField();
  const [period, setPeriod] = React.useState<string>("");
  const [status, setStatus] = React.useState<PeriodStatus | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

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

  const check = (): Promise<void> =>
    guard(async () => {
      setStatus(await venueOsApi.periodStatus(Number(businessId), period));
    }, "Couldn't load period close.");

  const close = (): Promise<void> =>
    guard(async () => {
      setStatus(await venueOsApi.closePeriod(Number(businessId), period));
    }, "Could not close the period.");

  const reopen = (): Promise<void> =>
    guard(async () => {
      setStatus(await venueOsApi.reopenPeriod(Number(businessId), period));
    }, "Could not reopen the period.");

  const ready = businessId && period;
  const closed = status?.status === "CLOSED";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Month-end close</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <BusinessScopeField value={businessId} onChange={setBusinessId} />
          <label className="text-sm">
            Period
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="ml-2 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <Button size="sm" variant="outline" onClick={() => void check()} disabled={!ready || busy}>
            Check status
          </Button>
          {status && !closed && (
            /* WWL-597 (S2) — "Close month" was the third button in a row of
               three, styled like the harmless "Check status" beside it, and one
               click froze that month's books: every journal entry locked and
               every new posting into the month rejected. It has to be asked for
               deliberately, so this one requires the period to be typed. */
            <DangerousAction
              title={`Close and lock ${status.period}?`}
              consequence={
                <>
                  Every journal entry in <strong>{status.period}</strong> will be locked and the
                  reported P&amp;L frozen. Nothing new can be posted into that month — a late
                  supplier bill, a correction, a receipt entered a day late will all be refused
                  until you reopen it.
                </>
              }
              requireTyped={status.period}
              confirmLabel="Close the month"
              disabled={!ready || busy}
              onConfirm={() => close()}
            >
              <Button size="sm" disabled={!ready || busy}>
                Close month
              </Button>
            </DangerousAction>
          )}
          {status && closed && (
            <Button size="sm" variant="outline" onClick={() => void reopen()} disabled={!ready || busy}>
              Reopen
            </Button>
          )}
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}

        {status && (
          <div className="rounded-md border p-3 text-sm">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-medium">{status.period}</span>
              {closed ? <Badge variant="destructive">CLOSED</Badge> : <Badge className="bg-emerald-500">OPEN</Badge>}
              {closed && status.lockedEntryCount != null && (
                <span className="text-xs text-muted-foreground">{status.lockedEntryCount} entries locked</span>
              )}
            </div>
            {closed && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Snap label="Revenue" value={status.snapshotRevenue} />
                <Snap label="COGS" value={status.snapshotCogs} />
                <Snap label="Overheads" value={status.snapshotOpex} />
                <Snap label="Net" value={status.snapshotNetProfit} tone />
              </div>
            )}
            {closed && (
              <p className="mt-2 text-xs text-muted-foreground">
                New posting into {status.period} is blocked while closed. Reopen to make corrections.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Snap({ label, value, tone = false }: { label: string; value: string | number | null | undefined; tone?: boolean }): React.ReactElement {
  const n = Number(value) || 0;
  const color = tone ? (n >= 0 ? "text-emerald-600" : "text-red-600") : "text-foreground";
  return (
    <div className="rounded border p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold ${color}`}>{PKR(value)}</div>
    </div>
  );
}

export default PeriodCloseView;
