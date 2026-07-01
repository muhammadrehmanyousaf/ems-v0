"use client";

/**
 * Venue-OS P2 · WS4 — AML guard-rails cockpit. The live §21 disallowance meter
 * for a proposed payment (cash cost vs clean-if-banked, ALWAYS paired with the
 * §111 framing so it nudges toward banking), the non-dismissable structuring
 * guard ("deposit in full", never "split"), and the BTPA benami truth test. The
 * guard-rails run server-side regardless of UI; this flag gates only the screen.
 * Gated on isAmlCockpitOn(); the backend 404s until ENABLE_AML_COCKPIT. Additive.
 */
import * as React from "react";
import { venueOsApi, type Section21Meter, type StructuringResult, type BenamiResult } from "@/lib/api/venueOs";
import { isAmlCockpitOn } from "@/lib/aml-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number): string => "Rs " + Math.round(n).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function AmlCockpitView(): React.ReactElement | null {
  const enabled = isAmlCockpitOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [amount, setAmount] = React.useState<string>("");
  const [mode, setMode] = React.useState<string>("cash");
  const [meter, setMeter] = React.useState<Section21Meter | null>(null);

  const [deposit, setDeposit] = React.useState<string>("");
  const [struct, setStruct] = React.useState<StructuringResult | null>(null);

  const [rel, setRel] = React.useState<string>("brother");
  const [traceable, setTraceable] = React.useState<boolean>(true);
  const [benami, setBenami] = React.useState<BenamiResult | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "AML cockpit is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AML cockpit (§21 meter · structuring · benami)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="text-sm">
          Business #
          <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
        </label>

        {/* §21 meter */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">§21 meter</span>
            <input type="number" placeholder="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-28 rounded border px-2 py-1" />
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded border px-2 py-1">
              <option value="cash">cash</option>
              <option value="online">online / bank</option>
              <option value="cheque">cheque</option>
              <option value="raast">Raast</option>
            </select>
            <Button size="sm" onClick={() => void guard(async () => setMeter(await venueOsApi.section21Meter({ businessId: Number(businessId), amountPkr: Number(amount), paymentMode: mode })))} disabled={!businessId || !amount || busy}>
              Check
            </Button>
          </div>
          {meter && (
            <div className="text-sm">
              <span className={meter.disallowedPkr ? "font-semibold text-red-600" : "font-semibold text-emerald-600"}>{PKR(meter.disallowedPkr)} disallowed</span>
              {meter.status !== "READY" && <Badge variant="secondary" className="ml-2">{meter.status}</Badge>}
              <p className="mt-1 text-xs text-muted-foreground">{meter.framing}</p>
            </div>
          )}
        </div>

        {/* structuring guard */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">Structuring guard</span>
            <input type="number" placeholder="deposit" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="w-28 rounded border px-2 py-1" />
            <Button
              size="sm"
              onClick={() => void guard(async () => setStruct(await venueOsApi.structuringCheck({ businessId: Number(businessId), proposedDepositPkr: Number(deposit) })))}
              disabled={!businessId || !deposit || busy}
            >
              Check
            </Button>
          </div>
          {struct && (
            <div className="text-sm">
              {struct.warn ? <Badge variant="destructive">structuring risk</Badge> : <Badge className="bg-emerald-500">clear</Badge>}
              <p className="mt-1 text-xs text-muted-foreground">{struct.warningText}</p>
            </div>
          )}
        </div>

        {/* benami */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">Benami check</span>
            <input type="text" placeholder="relationship" value={rel} onChange={(e) => setRel(e.target.value)} className="w-32 rounded border px-2 py-1" />
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={traceable} onChange={(e) => setTraceable(e.target.checked)} /> traceable funding
            </label>
            <Button size="sm" onClick={() => void guard(async () => setBenami(await venueOsApi.benamiCheck({ businessId: Number(businessId), relationship: rel, traceableFunding: traceable })))} disabled={!businessId || !rel || busy}>
              Check
            </Button>
          </div>
          {benami && (
            <div className="text-sm">
              <Badge variant={benami.level === "high" ? "destructive" : benami.level === "none" || benami.level === "family_exempt" ? "default" : "secondary"}>{benami.level}</Badge>
              <p className="mt-1 text-xs text-muted-foreground">{benami.reason}</p>
            </div>
          )}
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default AmlCockpitView;
