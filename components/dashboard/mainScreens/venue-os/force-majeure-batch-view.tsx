"use client";

/**
 * Venue-OS P2 · WS9 — the force-majeure batch tool. Pick a business + an affected-
 * booking set (booking# + advance) + a rule (CARRY_FORWARD default / FULL / PARTIAL),
 * Preview (dry-run) shows the planned credits/refunds, then Run issues them. A
 * REFUNDED credit note reverses 236CB/PST; a forfeiture leaves tax standing. The
 * tool NEVER auto-cancels a booking — status stays an owner action. Gated on
 * isForceMajeureBatchOn(); the backend 404s until ENABLE_FORCE_MAJEURE_BATCH.
 */
import * as React from "react";
import { venueOsApi, type ForceMajeureBatchResult, type ForceMajeureItem } from "@/lib/api/venueOs";
import { isForceMajeureBatchOn } from "@/lib/force-majeure-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string): string => "Rs " + Math.round(Number(n)).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function ForceMajeureBatchView(): React.ReactElement | null {
  const enabled = isForceMajeureBatchOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [govtOrderRef, setGovtOrderRef] = React.useState<string>("");
  const [rule, setRule] = React.useState<string>("CARRY_FORWARD");
  const [itemsRaw, setItemsRaw] = React.useState<string>(""); // "bookingId:advance, bookingId:advance"
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ForceMajeureBatchResult | null>(null);

  function parseItems(): ForceMajeureItem[] {
    return itemsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((pair) => {
        const [b, a] = pair.split(":");
        return { bookingId: Number(b), advancePaid: Number(a) };
      })
      .filter((i) => i.bookingId && i.advancePaid >= 0);
  }

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Force-majeure batch is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const body = () => ({ businessId: Number(businessId), govtOrderRef: govtOrderRef || undefined, rule, items: parseItems(), reason: govtOrderRef || "force majeure" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Force-majeure batch (never auto-cancels)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <input type="text" placeholder="govt order ref" value={govtOrderRef} onChange={(e) => setGovtOrderRef(e.target.value)} className="w-36 rounded border px-2 py-1" />
          <select value={rule} onChange={(e) => setRule(e.target.value)} className="rounded border px-2 py-1">
            <option value="CARRY_FORWARD">CARRY_FORWARD</option>
            <option value="FULL_REFUND">FULL_REFUND</option>
            <option value="PARTIAL_REFUND">PARTIAL_REFUND</option>
          </select>
        </div>
        <label className="block text-xs text-muted-foreground">
          Affected bookings (bookingId:advance, comma-separated)
          <input type="text" placeholder="123:150000, 124:200000" value={itemsRaw} onChange={(e) => setItemsRaw(e.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
        </label>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setResult(await venueOsApi.previewForceMajeure(body())))} disabled={!businessId || busy}>
            Preview (dry-run)
          </Button>
          <Button size="sm" onClick={() => void guard(async () => setResult(await venueOsApi.runForceMajeureBatch(body())))} disabled={!businessId || busy}>
            Run batch
          </Button>
        </div>

        {result && (
          <div className="space-y-2 rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{result.ruleApplied}</Badge>
              {result.dryRun && <Badge variant="outline">preview</Badge>}
              <span className="text-muted-foreground">{result.affectedCount} bookings · {result.batchRef}</span>
              {result.totalCreditAmount ? <span>credits {PKR(result.totalCreditAmount)}</span> : null}
              {result.totalRefundAmount ? <span>refunds {PKR(result.totalRefundAmount)}</span> : null}
            </div>
            <div className="space-y-0.5 text-xs">
              {result.results.map((r) => (
                <div key={r.bookingId} className="flex items-center gap-2 border-t pt-0.5">
                  <span>Booking #{r.bookingId}</span>
                  <Badge variant={r.skipped ? "destructive" : "secondary"}>{r.skipped || r.action}</Badge>
                  {r.refundedAmount ? <span>refund {PKR(r.refundedAmount)}</span> : null}
                  {r.idempotentHit && <span className="text-muted-foreground">(already)</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default ForceMajeureBatchView;
