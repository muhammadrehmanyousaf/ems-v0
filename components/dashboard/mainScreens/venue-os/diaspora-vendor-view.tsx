"use client";

/**
 * Venue-OS P3-H — diaspora FX rail + multi-vendor service lines. Capture an overseas
 * FX payment (PKR from the snapshot rate) and see the by-currency summary; and run a
 * type-discriminated service line (photographer / salon / sound-light …) through its
 * deliverable status — the whole marketplace on the one venue-OS core. The FX section
 * renders on isDiasporaFxOn(), the service-line section on isMultivendorTypesOn().
 */
import * as React from "react";
import { venueOsApi, type FxSummary, type ServiceLine } from "@/lib/api/venueOs";
import { isDiasporaFxOn, isMultivendorTypesOn } from "@/lib/diaspora-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function DiasporaVendorView(): React.ReactElement | null {
  const fxOn = isDiasporaFxOn();
  const mvOn = isMultivendorTypesOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [currency, setCurrency] = React.useState<string>("USD");
  const [amount, setAmount] = React.useState<string>("");
  const [rate, setRate] = React.useState<string>("");
  const [summary, setSummary] = React.useState<FxSummary | null>(null);
  const [lines, setLines] = React.useState<ServiceLine[] | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!fxOn && !mvOn) return null;
  const bid = Number(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diaspora FX &amp; multi-vendor lines</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>Business #<input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-1 w-24 rounded border px-2 py-1" /></label>
        </div>

        {fxOn && (
          <div className="space-y-2 rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-end gap-2">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded border px-2 py-1">
                {["USD", "GBP", "AED", "EUR", "SAR"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" placeholder="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-24 rounded border px-2 py-1" />
              <input type="number" placeholder="rate" value={rate} onChange={(e) => setRate(e.target.value)} className="w-24 rounded border px-2 py-1" />
              <Button size="sm" onClick={() => void guard(async () => { await venueOsApi.captureFx({ businessId: bid, currency, amountForeign: Number(amount), fxRate: Number(rate) }); setSummary(await venueOsApi.fxSummary(bid)); })} disabled={!businessId || !amount || !rate || busy}>Capture FX</Button>
              <Button size="sm" variant="outline" onClick={() => void guard(async () => setSummary(await venueOsApi.fxSummary(bid)))} disabled={!businessId || busy}>Summary</Button>
            </div>
            {summary && (
              <div className="text-xs">
                <p className="text-sm">Received {PKR(summary.receivedPkr)} · refunded {PKR(summary.refundedPkr)} · net {PKR(summary.netPkr)}</p>
                {summary.byCurrency.map((c) => (
                  <div key={c.currency} className="flex justify-between border-t pt-0.5"><span>{c.currency}: {c.inboundForeign}</span><span>{PKR(c.inboundPkr)}</span></div>
                ))}
              </div>
            )}
          </div>
        )}

        {mvOn && (
          <div className="space-y-2 rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-end gap-2">
              <span className="font-medium">Service lines</span>
              <Button size="sm" variant="outline" onClick={() => void guard(async () => setLines(await venueOsApi.listServiceLines(bid)))} disabled={!businessId || busy}>Load</Button>
              <Button size="sm" onClick={() => void guard(async () => { await venueOsApi.createServiceLine({ businessId: bid, vendorType: "PHOTOGRAPHER", lineType: "PHOTO_SESSION", title: "Wedding shoot", amountPkr: 80000 }); setLines(await venueOsApi.listServiceLines(bid)); })} disabled={!businessId || busy}>+ Photo session</Button>
            </div>
            {lines && lines.map((l) => (
              <div key={l.id} className="flex items-center justify-between border-t pt-0.5 text-xs">
                <span><Badge variant="secondary">{l.vendorType}</Badge> {l.title} · {PKR(l.amountPkr)}</span>
                <span className="flex items-center gap-1">
                  <Badge>{l.deliverableStatus}</Badge>
                  {l.deliverableStatus !== "DELIVERED" && <Button size="sm" variant="ghost" onClick={() => void guard(async () => { await venueOsApi.updateDeliverable(l.id, { deliverableStatus: "DELIVERED" }); setLines(await venueOsApi.listServiceLines(bid)); })} disabled={busy}>deliver</Button>}
                </span>
              </div>
            ))}
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default DiasporaVendorView;
