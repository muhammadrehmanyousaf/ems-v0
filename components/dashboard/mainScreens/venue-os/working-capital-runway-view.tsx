"use client";

/**
 * Venue-OS P2 · WS8 — the runway headline card. "You need ~Rs X this season; the
 * gap peaks in [month]" derived from the booking calendar (inflows) vs the merged
 * liability outflows + opening cash, plus a HALAL-FIRST recommended facility mix
 * (BC + Ijarah + customer-advance + udhaar; conventional bank RF shown only as a
 * flagged comparator). Self-gates on isWorkingCapitalRunwayOn() (the runway needs
 * ≥1 season of history); the backend 404s until WORKING_CAPITAL_RUNWAY_ON.
 */
import * as React from "react";
import { venueOsApi, type RunwayPlan } from "@/lib/api/venueOs";
import { isWorkingCapitalRunwayOn } from "@/lib/working-capital-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string): string => "Rs " + Math.round(Number(n)).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function WorkingCapitalRunwayView(): React.ReactElement | null {
  const enabled = isWorkingCapitalRunwayOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [seasonYear, setSeasonYear] = React.useState<string>("");
  const [openingCash, setOpeningCash] = React.useState<string>("0");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<RunwayPlan | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Runway projection is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Season runway</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <input type="number" placeholder="season year" value={seasonYear} onChange={(e) => setSeasonYear(e.target.value)} className="w-28 rounded border px-2 py-1" />
          <input type="number" placeholder="opening cash" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} className="w-32 rounded border px-2 py-1" />
          <Button size="sm" onClick={() => void guard(async () => setPlan(await venueOsApi.computeRunway(Number(businessId), { seasonYear: Number(seasonYear), openingCashPkr: Number(openingCash) })))} disabled={!businessId || !seasonYear || busy}>
            Compute runway
          </Button>
        </div>

        {plan && (
          <div className="space-y-3">
            <div className={`rounded-md border p-4 ${plan.peakGapPkr > 0 ? "border-amber-300 bg-amber-50" : "border-emerald-300 bg-emerald-50"}`}>
              <p className="text-lg font-semibold">{plan.runwayHeadline}</p>
              {plan.peakGapPkr > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">Peak gap {PKR(plan.peakGapPkr)} in {plan.financingGapMonth}</p>
              )}
            </div>
            {plan.recommendedFacilityMix.length > 0 && (
              <div className="space-y-1 text-sm">
                <p className="font-medium">Recommended mix (halal-first):</p>
                {plan.recommendedFacilityMix.map((m) => (
                  <div key={m.instrument} className="flex items-center justify-between border-t pt-1">
                    <span className="flex items-center gap-2">
                      {m.instrument}
                      {m.instrument === "BANK_RF" && <Badge variant="outline">comparator</Badge>}
                    </span>
                    <span className="text-muted-foreground">{m.note}</span>
                    <span className="font-medium">{PKR(m.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default WorkingCapitalRunwayView;
