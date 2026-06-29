"use client";

/**
 * Venue-OS — Cash-float (galla) close (P1 FE, WS-5). Opens a drawer against a
 * business with an opening float, records collections/deposits through the
 * night, then closes with a counted amount — surfacing the over/short the
 * register hides (expected = opening + collected − deposited). Gated on
 * isPaymentLedgerOn(); the backend 404s until PAYMENT_LEDGER_ON. Additive — no
 * existing screen touched.
 */
import * as React from "react";
import { venueOsApi, type CashFloat, type CloseFloatResult } from "@/lib/api/venueOs";
import { isPaymentLedgerOn } from "@/lib/payment-ledger-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: string | number): string => "Rs " + Math.round(Number(n) || 0).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function CashFloatClose(): React.ReactElement | null {
  const enabled = isPaymentLedgerOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [openingFloat, setOpeningFloat] = React.useState<string>("0");
  const [collected, setCollected] = React.useState<string>("");
  const [deposited, setDeposited] = React.useState<string>("");
  const [counted, setCounted] = React.useState<string>("");
  const [float, setFloat] = React.useState<CashFloat | null>(null);
  const [result, setResult] = React.useState<CloseFloatResult | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function run(fn: () => Promise<void>, fallback: string): Promise<void> {
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

  const open = (): Promise<void> =>
    run(async () => {
      setFloat(await venueOsApi.openCashFloat({ businessId: Number(businessId), openingFloat: Number(openingFloat) || 0 }));
      setResult(null);
    }, "Cash-float is not enabled for your account yet.");

  const record = (): Promise<void> =>
    run(async () => {
      if (!float) return;
      setFloat(await venueOsApi.recordToFloat(float.id, { collected: Number(collected) || 0, deposited: Number(deposited) || 0 }));
      setCollected("");
      setDeposited("");
    }, "Could not record to the drawer.");

  const close = (): Promise<void> =>
    run(async () => {
      if (!float) return;
      setResult(await venueOsApi.closeCashFloat(float.id, { closingCounted: Number(counted) || 0 }));
      setFloat({ ...float, status: "CLOSED" });
    }, "Could not close the drawer.");

  if (!enabled) return null;

  const expectedNow = float ? Number(float.openingFloat) + Number(float.collected) - Number(float.deposited) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash-float close (galla reconciliation)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!float ? (
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              Business #
              <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
            </label>
            <label className="text-sm">
              Opening float
              <input type="number" value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} className="ml-2 w-28 rounded border px-2 py-1" />
            </label>
            <Button size="sm" onClick={() => void open()} disabled={!businessId || busy}>
              Open drawer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Opening</div>
                <div className="text-lg font-semibold">{PKR(float.openingFloat)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Collected</div>
                <div className="text-lg font-semibold">{PKR(float.collected)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Deposited</div>
                <div className="text-lg font-semibold">{PKR(float.deposited)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Expected in drawer</div>
                <div className="text-lg font-semibold">{PKR(expectedNow)}</div>
              </div>
            </div>

            {float.status === "OPEN" && (
              <>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="text-sm">
                    + Collected
                    <input type="number" value={collected} onChange={(e) => setCollected(e.target.value)} className="ml-2 w-28 rounded border px-2 py-1" />
                  </label>
                  <label className="text-sm">
                    + Deposited
                    <input type="number" value={deposited} onChange={(e) => setDeposited(e.target.value)} className="ml-2 w-28 rounded border px-2 py-1" />
                  </label>
                  <Button size="sm" variant="outline" onClick={() => void record()} disabled={busy || (!collected && !deposited)}>
                    Record
                  </Button>
                </div>
                <div className="flex flex-wrap items-end gap-3 border-t pt-3">
                  <label className="text-sm">
                    Counted at close
                    <input type="number" value={counted} onChange={(e) => setCounted(e.target.value)} className="ml-2 w-32 rounded border px-2 py-1" />
                  </label>
                  <Button size="sm" onClick={() => void close()} disabled={busy || !counted}>
                    Close &amp; reconcile
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {result && (
          <div className="rounded-md border p-3 text-sm">
            <div className="flex justify-between">
              <span>Expected</span>
              <span>{PKR(result.expected)}</span>
            </div>
            <div className="flex justify-between">
              <span>Counted</span>
              <span>{PKR(result.closingCounted)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between border-t pt-1 font-semibold">
              <span>Over / short</span>
              <span className="flex items-center gap-2">
                <span className={result.overShort < 0 ? "text-red-600" : result.overShort > 0 ? "text-amber-600" : "text-emerald-600"}>
                  {result.overShort >= 0 ? "+" : "−"}
                  {PKR(Math.abs(result.overShort))}
                </span>
                {result.short ? <Badge variant="destructive">SHORT</Badge> : <Badge variant="secondary">balanced</Badge>}
              </span>
            </div>
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default CashFloatClose;
