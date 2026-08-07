"use client";

/**
 * Venue-OS P3-H — diaspora FX rail + multi-vendor service lines. Capture an overseas
 * FX payment (PKR from the snapshot rate) and see the by-currency summary; and run a
 * type-discriminated service line (photographer / salon / sound-light …) through its
 * deliverable status — the whole marketplace on the one venue-OS core. The FX section
 * Both sections always render — ENABLE_DIASPORA_FX and ENABLE_MULTIVENDOR_TYPES
 * are globally enabled in production.
 */
import * as React from "react";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueOsApi, type FxSummary, type ServiceLine } from "@/lib/api/venueOs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function DiasporaVendorView(): React.ReactElement | null {
  const [businessId, setBusinessId] = useBusinessIdField();
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

  const bid = Number(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diaspora FX &amp; multi-vendor lines</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <BusinessScopeField value={businessId} onChange={setBusinessId} />
        </div>

        {(
          <div className="space-y-2 rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-end gap-2">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {["USD", "GBP", "AED", "EUR", "SAR"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Amount<input min={0} type="number" placeholder="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
              <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Rate<input min={0} type="number" placeholder="rate" value={rate} onChange={(e) => setRate(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
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

        {(
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
