"use client";

/**
 * Venue-OS P2 · WS8 — the hero bounce-risk timeline. Merges committee + Ijarah +
 * supplier-udhaar + bank-markup + PDC dues into one month-by-month table vs the
 * projected cash, flagging any month where total due > projected cash in red. The
 * advance-float meter (negative-WC: customer cash funding ops + the refundable
 * portion the owner must NOT spend, read live from MON-6 deposit accounts) sits
 * alongside. Gated on isWorkingCapitalOn(); the backend 404s until
 * ENABLE_WORKING_CAPITAL. Additive — a pure read over the GL + instruments.
 */
import * as React from "react";
import { venueOsApi, type LiabilityCalendar, type AdvanceFloat } from "@/lib/api/venueOs";
import { isWorkingCapitalOn } from "@/lib/working-capital-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string): string => "Rs " + Math.round(Number(n)).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function LiabilityCalendarView(): React.ReactElement | null {
  const enabled = isWorkingCapitalOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [cal, setCal] = React.useState<LiabilityCalendar | null>(null);
  const [float, setFloat] = React.useState<AdvanceFloat | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Working-capital is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liability calendar (bounce-risk timeline)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <input type="text" placeholder="from YYYY-MM" value={from} onChange={(e) => setFrom(e.target.value)} className="w-32 rounded border px-2 py-1" />
          <input type="text" placeholder="to YYYY-MM" value={to} onChange={(e) => setTo(e.target.value)} className="w-32 rounded border px-2 py-1" />
          <Button size="sm" onClick={() => void guard(async () => setCal(await venueOsApi.liabilityCalendar(Number(businessId), from, to)))} disabled={!businessId || !from || !to || busy}>
            Build calendar
          </Button>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setFloat(await venueOsApi.advanceFloat(Number(businessId))))} disabled={!businessId || busy}>
            Advance float
          </Button>
        </div>

        {float && (
          <div className="rounded-md border p-3 text-sm">
            <span className="font-medium">Advance float (negative WC):</span> {PKR(float.netFloatPkr)} of customer cash funding ops ·{" "}
            <span className="text-amber-600">{PKR(float.refundablePortionPkr)} refundable — do not spend</span>
          </div>
        )}

        {cal && (
          <div className="overflow-x-auto">
            {cal.bounceRiskMonth && (
              <p className="mb-2 text-sm font-semibold text-red-600">Bounce-risk month: {cal.bounceRiskMonth}</p>
            )}
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-1 pr-2">Month</th>
                  <th className="pr-2">Committee</th>
                  <th className="pr-2">Ijarah</th>
                  <th className="pr-2">Udhaar</th>
                  <th className="pr-2">Bank</th>
                  <th className="pr-2">PDC</th>
                  <th className="pr-2 font-medium">Total due</th>
                  <th className="pr-2">Proj. cash</th>
                  <th className="pr-2">Shortfall</th>
                </tr>
              </thead>
              <tbody>
                {cal.months.map((m) => (
                  <tr key={m.month} className={m.bounceRisk ? "bg-red-50" : ""}>
                    <td className="py-1 pr-2 font-medium">{m.month}</td>
                    <td className="pr-2">{m.committeeDuePkr ? PKR(m.committeeDuePkr) : "—"}</td>
                    <td className="pr-2">{m.ijarahRentalDuePkr ? PKR(m.ijarahRentalDuePkr) : "—"}</td>
                    <td className="pr-2">{m.supplierUdhaarDuePkr ? PKR(m.supplierUdhaarDuePkr) : "—"}</td>
                    <td className="pr-2">{m.bankMarkupDuePkr ? PKR(m.bankMarkupDuePkr) : "—"}</td>
                    <td className="pr-2">{m.pdcChequesDuePkr ? PKR(m.pdcChequesDuePkr) : "—"}</td>
                    <td className="pr-2 font-medium">{PKR(m.totalDuePkr)}</td>
                    <td className="pr-2">{PKR(m.projectedCashPkr)}</td>
                    <td className="pr-2">{m.bounceRisk ? <Badge variant="destructive">{PKR(m.shortfallPkr)}</Badge> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default LiabilityCalendarView;
