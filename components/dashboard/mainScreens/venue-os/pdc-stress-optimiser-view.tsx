"use client";

/**
 * Venue-OS P2 · WS8-depth — PDC bounce-stress + committee payout-optimiser. Run
 * the liability calendar with the expected customer-cheque clearings merged in:
 * a month that only balances because cheques clear is flagged (one bounce → that
 * month bounces). Then the optimiser names the financing-gap month and recommends
 * timing a committee's ROSCA payout into it — the halal, net-to-zero plug. Gated
 * on isWorkingCapitalOn() — the backend 404s until ENABLE_WORKING_CAPITAL.
 */
import * as React from "react";
import { venueOsApi, type PdcSchedule, type PayoutOptimiser } from "@/lib/api/venueOs";
import { isWorkingCapitalOn } from "@/lib/working-capital-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function PdcStressOptimiserView(): React.ReactElement | null {
  const enabled = isWorkingCapitalOn();
  const yr = new Date().getFullYear();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [from, setFrom] = React.useState<string>(`${yr}-10`);
  const [to, setTo] = React.useState<string>(`${yr + 1}-03`);
  const [sched, setSched] = React.useState<PdcSchedule | null>(null);
  const [opt, setOpt] = React.useState<PayoutOptimiser | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Working capital is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const bid = Number(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>PDC bounce-stress &amp; payout optimiser</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>Business #<input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" /></label>
          <label>From<input type="month" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-1 rounded border px-2 py-1" /></label>
          <label>To<input type="month" value={to} onChange={(e) => setTo(e.target.value)} className="ml-1 rounded border px-2 py-1" /></label>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setSched(await venueOsApi.liabilityCalendarPdc(bid, { fromMonth: from, toMonth: to })))} disabled={!businessId || busy}>Bounce-stress</Button>
          <Button size="sm" onClick={() => void guard(async () => setOpt(await venueOsApi.committeePayoutOptimiser(bid, { fromMonth: from, toMonth: to })))} disabled={!businessId || busy}>Optimise payout</Button>
        </div>

        {sched && (
          <div className="rounded-md border p-3 text-xs">
            <p className="text-sm font-medium">Liability calendar {sched.pdcDependentMonths.length > 0 && <Badge variant="destructive">cheque-dependent: {sched.pdcDependentMonths.join(", ")}</Badge>}</p>
            {sched.months.map((m) => (
              <div key={m.month} className="flex flex-wrap justify-between gap-2 border-t pt-0.5">
                <span>{m.month} · due {PKR(m.totalDuePkr)}</span>
                <span className="text-muted-foreground">cash {PKR(m.projectedCashPkr)} + cheques {PKR(m.pdcExpectedInflowPkr)}</span>
                <span className={m.bounceRisk ? "font-medium text-destructive" : m.pdcDependent ? "font-medium text-amber-600" : ""}>{m.bounceRisk ? `short ${PKR(m.shortfallWithPdcPkr)}` : m.pdcDependent ? "safe only if cheques clear" : "ok"}</span>
              </div>
            ))}
          </div>
        )}

        {opt && (
          <div className="rounded-md border p-3 text-sm">
            {opt.gapMonth ? (
              <>
                <p className="font-medium">Gap in {opt.gapMonth} — short {PKR(opt.shortfallPkr)}</p>
                {opt.recommendations.length === 0 && <p className="text-xs text-muted-foreground">{opt.note}</p>}
                {opt.recommendations.map((r) => (
                  <div key={r.committeeId} className="flex justify-between border-t pt-0.5 text-xs">
                    <span>{r.name} (pot {PKR(r.potPkr)})</span>
                    <span>{r.coversShortfall ? <Badge>covers gap</Badge> : <Badge variant="secondary">partial</Badge>} → target {r.recommendedMonth}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-xs text-emerald-600">{opt.note}</p>
            )}
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default PdcStressOptimiserView;
