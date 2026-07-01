"use client";

/**
 * Venue-OS P2 · WS9-depth — weather → insurance-claim parametric workflow. Enter a
 * logged weather event id (and any measured params like rainfall/wind) and the
 * engine evaluates the policy's parametric triggers, auto-filing a claim when a
 * threshold is met (INDEMNITY = min(loss, sum insured) or a FIXED payout). Gated
 * on isInsuranceTrackingOn() — the backend 404s until ENABLE_INSURANCE_TRACKING.
 */
import * as React from "react";
import { venueOsApi, type WeatherClaimResult } from "@/lib/api/venueOs";
import { isInsuranceTrackingOn } from "@/lib/insurance-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function WeatherClaimView(): React.ReactElement | null {
  const enabled = isInsuranceTrackingOn();
  const [weatherId, setWeatherId] = React.useState<string>("");
  const [windKph, setWindKph] = React.useState<string>("");
  const [rainMm, setRainMm] = React.useState<string>("");
  const [res, setRes] = React.useState<WeatherClaimResult | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Insurance tracking is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  function measurement(): Record<string, number> {
    const m: Record<string, number> = {};
    if (windKph) m.windKph = Number(windKph);
    if (rainMm) m.rainfallMm = Number(rainMm);
    return m;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather → insurance claim (parametric)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>Weather event #<input type="number" value={weatherId} onChange={(e) => setWeatherId(e.target.value)} className="ml-2 w-28 rounded border px-2 py-1" /></label>
          <label>Wind kph<input type="number" value={windKph} onChange={(e) => setWindKph(e.target.value)} className="ml-1 w-20 rounded border px-2 py-1" /></label>
          <label>Rain mm<input type="number" value={rainMm} onChange={(e) => setRainMm(e.target.value)} className="ml-1 w-20 rounded border px-2 py-1" /></label>
          <Button size="sm" onClick={() => void guard(async () => setRes(await venueOsApi.evaluateWeatherClaims(Number(weatherId), { measurement: measurement() })))} disabled={!weatherId || busy}>Evaluate triggers</Button>
        </div>

        {res && (
          <div className="rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{res.peril} · loss {PKR(res.lossPkr)}</span>
              {res.fired.length > 0 ? <Badge>{res.fired.length} claim(s) filed</Badge> : <Badge variant="secondary">no trigger met</Badge>}
            </div>
            {res.fired.map((f) => (
              <div key={f.claimId} className="flex justify-between border-t pt-0.5 text-xs">
                <span>{f.policyType} · {f.trigger.metric} {f.trigger.measured} ≥ {f.trigger.threshold} ({f.trigger.basis})</span>
                <span className="font-medium">claim {PKR(f.claimedAmountPkr)}</span>
              </div>
            ))}
            {res.skipped.map((s, i) => (
              <p key={i} className="text-xs text-muted-foreground">policy #{s.policyId}: {s.reason}</p>
            ))}
            <p className="mt-1 text-xs">{res.note}</p>
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default WeatherClaimView;
