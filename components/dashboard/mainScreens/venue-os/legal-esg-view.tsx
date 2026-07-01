"use client";

/**
 * Venue-OS P3-G — legal cockpit + ESG. Draft a 489-F case from a bounced cheque,
 * draft a DE-ESCALATING reply to a bad review (a retaliatory/defamatory reply is
 * hard-refused by the backend — ETH-4, no flag), and check a district's ESG rules
 * / banned single-use inputs. The legal section renders on isLegalOn(), the ESG
 * section on isEsgOn(); the backend 404s until ENABLE_LEGAL / ENABLE_ESG.
 */
import * as React from "react";
import { venueOsApi } from "@/lib/api/venueOs";
import { isLegalOn, isEsgOn } from "@/lib/legal-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function LegalEsgView(): React.ReactElement | null {
  const legalOn = isLegalOn();
  const esgOn = isEsgOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");
  const [reply, setReply] = React.useState<string | null>(null);
  const [caseMsg, setCaseMsg] = React.useState<string | null>(null);
  const [item, setItem] = React.useState<string>("plastic_bag");
  const [esg, setEsg] = React.useState<string | null>(null);
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

  if (!legalOn && !esgOn) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal cockpit &amp; ESG</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {legalOn && (
          <div className="space-y-2 rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-end gap-2">
              <label>Business #<input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-1 w-24 rounded border px-2 py-1" /></label>
              <input type="number" placeholder="cheque Rs" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-28 rounded border px-2 py-1" />
              <Button size="sm" onClick={() => void guard(async () => { const c = await venueOsApi.build489f(Number(businessId), { counterpartyName: "Defaulter", amountPkr: Number(amount) }); setCaseMsg(`489-F drafted — file by ${c.statutoryDeadline}`); })} disabled={!businessId || !amount || busy}>Draft 489-F</Button>
              <Button size="sm" variant="outline" onClick={() => void guard(async () => { const r = await venueOsApi.reviewResponse({ requestedIntent: "resolve", concessionOffer: "10% off next booking" }); setReply(r.publicReply); })} disabled={busy}>Draft review reply</Button>
            </div>
            {caseMsg && <p className="text-xs text-muted-foreground">{caseMsg}</p>}
            {reply && <p className="text-xs">💬 {reply}</p>}
            <p className="text-xs text-muted-foreground">A retaliatory / defamatory reply is always refused (ETH-4).</p>
          </div>
        )}

        {esgOn && (
          <div className="space-y-2 rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-end gap-2">
              <span className="font-medium">ESG check (Punjab)</span>
              <input type="text" value={item} onChange={(e) => setItem(e.target.value)} className="w-40 rounded border px-2 py-1" />
              <Button size="sm" variant="outline" onClick={() => void guard(async () => { const r = await venueOsApi.esgCheckInput({ jurisdiction: "PUNJAB", item }); setEsg(r.note); })} disabled={busy}>Check input</Button>
            </div>
            {esg && <p className="text-xs">{esg}</p>}
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default LegalEsgView;
