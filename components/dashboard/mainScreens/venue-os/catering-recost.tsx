"use client";

/**
 * Venue-OS — Catering deg-rate-card re-cost (P1 FE, WS-3). Computes a defensible
 * per-head food cost from the selected deg-rate-cards at the LATEST ingredient
 * rates, and — given a quoted price/head — flags an underwater booking ("chicken
 * +Rs90/kg, this booking now loses money"). Gated on isCateringDegcardOn(); the
 * backend 404s until CATERING_DEGCARD_ON. Additive — no existing screen touched.
 */
import * as React from "react";
import { venueOsApi, type MenuRecost } from "@/lib/api/venueOs";
import { isCateringDegcardOn } from "@/lib/catering-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number): string => "Rs " + (Math.round(n * 100) / 100).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function CateringRecost(): React.ReactElement | null {
  const enabled = isCateringDegcardOn();
  const [cardIds, setCardIds] = React.useState<string>("");
  const [quoted, setQuoted] = React.useState<string>("");
  const [result, setResult] = React.useState<MenuRecost | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function recost(): Promise<void> {
    setBusy(true);
    setErr(null);
    setResult(null);
    try {
      const ids = cardIds
        .split(/[,\s]+/)
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
      setResult(
        await venueOsApi.recostMenu({
          cardIds: ids,
          quotedPerHead: quoted ? Number(quoted) : undefined,
        }),
      );
    } catch (e: unknown) {
      setErr(readErr(e, "Catering re-cost is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const alert = result?.alert ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu re-cost (deg-rate-card)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Card IDs
            <input
              type="text"
              placeholder="e.g. 12, 14, 19"
              value={cardIds}
              onChange={(e) => setCardIds(e.target.value)}
              className="ml-2 w-40 rounded border px-2 py-1"
            />
          </label>
          <label className="text-sm">
            Quoted / head
            <input type="number" value={quoted} onChange={(e) => setQuoted(e.target.value)} className="ml-2 w-28 rounded border px-2 py-1" />
          </label>
          <Button size="sm" onClick={() => void recost()} disabled={!cardIds || busy}>
            {busy ? "Costing…" : "Re-cost"}
          </Button>
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}

        {result && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Food cost / head</div>
                <div className="text-lg font-semibold">{PKR(result.costPerHead)}</div>
              </div>
              {alert && (
                <>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Margin / head</div>
                    <div className={`text-lg font-semibold ${alert.underwater ? "text-red-600" : "text-emerald-600"}`}>
                      {PKR(alert.marginPerHead)}
                      {alert.marginPct != null && <span className="ml-1 text-xs font-normal">({alert.marginPct}%)</span>}
                    </div>
                  </div>
                  {alert.underwater ? <Badge variant="destructive">UNDERWATER</Badge> : <Badge className="bg-emerald-500">profitable</Badge>}
                </>
              )}
            </div>

            {result.missingRates.length > 0 && (
              <p className="text-xs text-amber-600">
                Missing rates for {result.missingRates.length} ingredient(s) — cost is understated. Capture their latest rates.
              </p>
            )}

            {result.dishes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-3">Dish</th>
                      <th className="py-2 pr-3 text-right">Degh cost</th>
                      <th className="py-2 pr-3 text-right">Plates/degh</th>
                      <th className="py-2 pr-3 text-right">Cost/plate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.dishes.map((d, i) => (
                      <tr key={`${d.dishName}-${i}`} className="border-b last:border-0">
                        <td className="py-2 pr-3">{d.dishName}</td>
                        <td className="py-2 pr-3 text-right">{PKR(d.deghCost)}</td>
                        <td className="py-2 pr-3 text-right">{d.platesPerDegh}</td>
                        <td className="py-2 pr-3 text-right font-medium">{PKR(d.costPerPlate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CateringRecost;
