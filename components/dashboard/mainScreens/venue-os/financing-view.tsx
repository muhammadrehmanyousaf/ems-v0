"use client";

/**
 * Venue-OS P3-C — the financing modeller (the referral surface to banks / Meezan /
 * Oraan / Qist Bazaar). Model a committee bridge (0 markup), an Ijarah lease vs a
 * conventional comparator, a Shaadi-Qist BNPL schedule for a customer, and pull the
 * bankable one-pager (season gap + which partner fits). Gated on isFinancingOn() —
 * the backend 404s until ENABLE_FINANCING.
 */
import * as React from "react";
import { venueOsApi, type IjarahModel, type BnplPreview, type ReferralPack } from "@/lib/api/venueOs";
import { isFinancingOn } from "@/lib/financing-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function FinancingView(): React.ReactElement | null {
  const enabled = isFinancingOn();
  const [ijarah, setIjarah] = React.useState<IjarahModel | null>(null);
  const [bnpl, setBnpl] = React.useState<BnplPreview | null>(null);
  const [booking, setBooking] = React.useState<string>("");
  const [businessId, setBusinessId] = React.useState<string>("");
  const [pack, setPack] = React.useState<ReferralPack | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Financing is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financing modeller &amp; bank referral</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setIjarah(await venueOsApi.modelIjarah({ assetPricePkr: 1000000, termMonths: 12, monthlyRentalPkr: 95000, comparatorAnnualPct: 20 })))} disabled={busy}>Ijarah sample</Button>
          <input type="number" placeholder="booking Rs" value={booking} onChange={(e) => setBooking(e.target.value)} className="w-32 rounded border px-2 py-1" />
          <Button size="sm" onClick={() => void guard(async () => setBnpl(await venueOsApi.bnplPreview({ bookingTotalPkr: Number(booking), downPct: 20, instalmentCount: 4 })))} disabled={!booking || busy}>Shaadi-Qist</Button>
        </div>

        {ijarah && (
          <div className="rounded-md border p-3 text-xs">
            <p className="text-sm font-medium">Ijarah — {PKR(ijarah.monthlyRentalPkr)}/mo, effective {ijarah.effectiveAnnualPct}%/yr</p>
            <p className="text-muted-foreground">total {PKR(ijarah.totalCostPkr)}{ijarah.conventionalComparator && ` vs conventional ${PKR(ijarah.conventionalComparator.totalPaidPkr)}`}</p>
            <p>{ijarah.note}</p>
          </div>
        )}

        {bnpl && (
          <div className="rounded-md border p-3 text-xs">
            <p className="text-sm font-medium">BNPL — down {PKR(bnpl.downPaymentPkr)} + {bnpl.instalmentCount} × {PKR(bnpl.schedule[0]?.amountPkr)}</p>
            <p className="text-muted-foreground">financed {PKR(bnpl.financedPkr)} · total {PKR(bnpl.totalPayablePkr)} · APR {bnpl.effectiveAprPct}%</p>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <span className="font-medium">Bank referral pack</span>
          <input type="number" placeholder="business #" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="w-24 rounded border px-2 py-1" />
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setPack(await venueOsApi.referralPack(Number(businessId), { seasonYear: new Date().getFullYear() })))} disabled={!businessId || busy}>Build one-pager</Button>
        </div>

        {pack && (
          <div className="rounded-md border p-3 text-xs">
            <p className="text-sm font-medium">Season {pack.seasonYear}: gap {PKR(pack.peakGapPkr)}{pack.gapMonth && ` (peaks ${pack.gapMonth})`}</p>
            {pack.runwayHeadline && <p className="text-muted-foreground">{pack.runwayHeadline}</p>}
            {pack.referralPartners.map((p) => (
              <div key={p.partner} className="flex items-center gap-1 border-t pt-0.5">
                <Badge variant="secondary">{p.instrument}</Badge>
                <span>{p.partner}</span>
                <span className="ml-auto text-muted-foreground">{p.fit}</span>
              </div>
            ))}
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default FinancingView;
