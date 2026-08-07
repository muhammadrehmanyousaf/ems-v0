"use client";

/**
 * Venue-OS — Cash-float (galla) close (P1 FE, WS-5). Opens a drawer against a
 * business with an opening float, records collections/deposits through the
 * night, then closes with a counted amount — surfacing the over/short the
 * register hides (expected = opening + collected − deposited).
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 * existing screen touched.
 */
import * as React from "react";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueOsApi, type CashFloat, type CloseFloatResult } from "@/lib/api/venueOs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";
import { DangerousAction } from "@/components/dashboard/primitives/dangerous-action";

const PKR = (n: string | number): string => "Rs " + Math.round(Number(n) || 0).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function CashFloatClose(): React.ReactElement | null {
  const [businessId, setBusinessId] = useBusinessIdField();
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
    }, "Couldn't load cash-float.");

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


  const expectedNow = float ? Number(float.openingFloat) + Number(float.collected) - Number(float.deposited) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash-float close (galla reconciliation)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!float ? (
          <div className="flex flex-wrap items-end gap-3">
            <BusinessScopeField value={businessId} onChange={setBusinessId} />
            <label className="text-sm">
              Opening float
              <input type="number" value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} className="ml-2 w-28 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </label>
            {/* WWL-583 (S3) — "Open drawer" opens a real galla for the day on
                one click. Opening the wrong venue's drawer, or opening one
                twice, is a reconciliation problem the vendor then has to unpick
                by hand. */}
            <DangerousAction
              title="Open the cash drawer for today?"
              consequence={
                <>
                  This starts today&apos;s galla with an opening float of{" "}
                  <strong>Rs {Math.round(Number(openingFloat) || 0).toLocaleString("en-PK")}</strong>.
                  Every cash movement from now until you close it is reconciled against that figure,
                  so check the venue and the float before you open.
                </>
              }
              confirmLabel="Open the drawer"
              confirmVariant="default"
              disabled={!businessId || busy}
              onConfirm={() => open()}
            >
              <Button size="sm" disabled={!businessId || busy}>
                Open drawer
              </Button>
            </DangerousAction>
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
                    <input type="number" value={collected} onChange={(e) => setCollected(e.target.value)} className="ml-2 w-28 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  </label>
                  <label className="text-sm">
                    + Deposited
                    <input type="number" value={deposited} onChange={(e) => setDeposited(e.target.value)} className="ml-2 w-28 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  </label>
                  <Button size="sm" variant="outline" onClick={() => void record()} disabled={busy || (!collected && !deposited)}>
                    Record
                  </Button>
                </div>
                <div className="flex flex-wrap items-end gap-3 border-t pt-3">
                  <label className="text-sm">
                    Counted at close
                    <input type="number" value={counted} onChange={(e) => setCounted(e.target.value)} className="ml-2 w-32 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
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
