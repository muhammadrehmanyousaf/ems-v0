"use client";

/**
 * Venue-OS P3-D — succession & equity. A Faraid (Islamic inheritance) calculator
 * (spouse / sons / daughters / parents, with Aul + residuary split) and a partner
 * exit valuation off the WS2-depth cap-table (capital + current + goodwill share).
 * The document a family relies on when the malik passes. Gated on isOwnershipOn() —
 * the backend 404s until ENABLE_OWNERSHIP.
 */
import * as React from "react";
import { venueOsApi, type FaraidResult, type ExitValuation } from "@/lib/api/venueOs";
import { isOwnershipOn } from "@/lib/ownership-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function SuccessionView(): React.ReactElement | null {
  const enabled = isOwnershipOn();
  const [estate, setEstate] = React.useState<string>("");
  const [husband, setHusband] = React.useState<boolean>(false);
  const [wives, setWives] = React.useState<string>("0");
  const [sons, setSons] = React.useState<string>("0");
  const [daughters, setDaughters] = React.useState<string>("0");
  const [father, setFather] = React.useState<boolean>(false);
  const [mother, setMother] = React.useState<boolean>(false);
  const [faraid, setFaraid] = React.useState<FaraidResult | null>(null);
  const [businessId, setBusinessId] = React.useState<string>("");
  const [partnerId, setPartnerId] = React.useState<string>("");
  const [goodwill, setGoodwill] = React.useState<string>("");
  const [exit, setExit] = React.useState<ExitValuation | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Succession is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Succession — Faraid &amp; partner exit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <span className="font-medium">Faraid calculator</span>
          <input type="number" placeholder="estate Rs" value={estate} onChange={(e) => setEstate(e.target.value)} className="w-32 rounded border px-2 py-1" />
          <label className="flex items-center gap-1"><input type="checkbox" checked={husband} onChange={(e) => setHusband(e.target.checked)} /> husband</label>
          <label>wives<input type="number" value={wives} onChange={(e) => setWives(e.target.value)} className="ml-1 w-14 rounded border px-1 py-1" /></label>
          <label>sons<input type="number" value={sons} onChange={(e) => setSons(e.target.value)} className="ml-1 w-14 rounded border px-1 py-1" /></label>
          <label>daughters<input type="number" value={daughters} onChange={(e) => setDaughters(e.target.value)} className="ml-1 w-14 rounded border px-1 py-1" /></label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={father} onChange={(e) => setFather(e.target.checked)} /> father</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={mother} onChange={(e) => setMother(e.target.checked)} /> mother</label>
          <Button size="sm" onClick={() => void guard(async () => setFaraid(await venueOsApi.faraidPreview({ estatePkr: Number(estate), husband, wives: Number(wives), sons: Number(sons), daughters: Number(daughters), father, mother })))} disabled={!estate || busy}>Compute</Button>
        </div>

        {faraid && (
          <div className="rounded-md border p-3 text-xs">
            <p className="text-sm font-medium">Shares of {PKR(faraid.estatePkr)}</p>
            {faraid.shares.map((s) => (
              <div key={s.heir} className="flex justify-between border-t pt-0.5">
                <span>{s.heir}{s.count > 1 ? ` ×${s.count}` : ""} · {(s.fraction * 100).toFixed(2)}%</span>
                <span className="font-medium">{PKR(s.amountPkr)}{s.count > 1 ? ` (${PKR(s.perHeadPkr)} each)` : ""}</span>
              </div>
            ))}
            {faraid.notes.map((n, i) => <p key={i} className="pt-1 text-muted-foreground">{n}</p>)}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <span className="font-medium">Partner exit</span>
          <input type="number" placeholder="business #" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="w-24 rounded border px-2 py-1" />
          <input type="number" placeholder="partner #" value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="w-24 rounded border px-2 py-1" />
          <input type="number" placeholder="goodwill Rs" value={goodwill} onChange={(e) => setGoodwill(e.target.value)} className="w-32 rounded border px-2 py-1" />
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setExit(await venueOsApi.exitValuation(Number(businessId), { partnerEquityId: Number(partnerId), goodwillPkr: goodwill ? Number(goodwill) : 0 })))} disabled={!businessId || !partnerId || busy}>Value exit</Button>
        </div>

        {exit && (
          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">{exit.partnerName} ({exit.sharePercent}%) exit value {PKR(exit.exitValuationPkr)}</p>
            <p className="text-xs text-muted-foreground">capital {PKR(exit.capitalPkr)} + current {PKR(exit.currentPkr)} + loan {PKR(exit.loanPkr)} + goodwill share {PKR(exit.goodwillSharePkr)}</p>
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default SuccessionView;
