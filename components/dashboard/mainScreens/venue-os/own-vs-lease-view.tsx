"use client";

/**
 * Venue-OS P2 — Rent vs own (break-even). The capital decision: keep renting
 * (rent + pagri + deposit, with escalation) or buy the venue (price +
 * maintenance, less salvage)? Walks both paths over a horizon, shows the
 * break-even month, the discounted (NPV) cost of each, and which is cheaper.
 * Pure analysis — nothing is posted. Gated on isVenueLeaseOn(); the backend 404s
 * until VENUE_LEASE_ON. Additive — no existing screen touched.
 */
import * as React from "react";
import { venueOsApi, type OwnVsLeaseResult } from "@/lib/api/venueOs";
import { isVenueLeaseOn } from "@/lib/venue-lease-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number): string => "Rs " + Math.round(n).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

function Num({ label, value, set, width = "w-28" }: { label: string; value: string; set: (v: string) => void; width?: string }): React.ReactElement {
  return (
    <label className="text-sm">
      {label}
      <input type="number" value={value} onChange={(e) => set(e.target.value)} className={`ml-2 ${width} rounded border px-2 py-1`} />
    </label>
  );
}

export function OwnVsLeaseView(): React.ReactElement | null {
  const enabled = isVenueLeaseOn();
  const [horizon, setHorizon] = React.useState<string>("120");
  const [discount, setDiscount] = React.useState<string>("12");
  // lease
  const [rent, setRent] = React.useState<string>("500000");
  const [pagri, setPagri] = React.useState<string>("1200000");
  const [deposit, setDeposit] = React.useState<string>("1000000");
  const [esc, setEsc] = React.useState<string>("10");
  // own
  const [price, setPrice] = React.useState<string>("30000000");
  const [salvage, setSalvage] = React.useState<string>("6000000");
  const [maint, setMaint] = React.useState<string>("100000");

  const [result, setResult] = React.useState<OwnVsLeaseResult | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function compute(): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      setResult(
        await venueOsApi.ownVsLease({
          horizonMonths: Number(horizon),
          annualDiscountRate: (Number(discount) || 0) / 100,
          lease: { monthlyRent: Number(rent), pagriAmount: Number(pagri) || 0, securityDeposit: Number(deposit) || 0, escalationPercent: Number(esc) || 0 },
          own: { purchasePrice: Number(price), salvageValue: Number(salvage) || 0, monthlyMaintenance: Number(maint) || 0 },
        }),
      );
    } catch (e: unknown) {
      setErr(readErr(e, "Rent-vs-own is not enabled for your account yet."));
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const own = result?.recommendation === "OWN";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rent vs own (break-even)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border bg-muted/40 p-3">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Lease</div>
          <div className="flex flex-wrap items-end gap-2">
            <Num label="Rent/mo" value={rent} set={setRent} />
            <Num label="Pagri" value={pagri} set={setPagri} />
            <Num label="Deposit" value={deposit} set={setDeposit} />
            <Num label="Esc %/yr" value={esc} set={setEsc} width="w-16" />
          </div>
        </div>
        <div className="rounded-md border bg-muted/40 p-3">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Own</div>
          <div className="flex flex-wrap items-end gap-2">
            <Num label="Price" value={price} set={setPrice} width="w-32" />
            <Num label="Salvage" value={salvage} set={setSalvage} />
            <Num label="Maint/mo" value={maint} set={setMaint} />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Num label="Horizon (mo)" value={horizon} set={setHorizon} width="w-20" />
          <Num label="Discount %/yr" value={discount} set={setDiscount} width="w-20" />
          <Button size="sm" onClick={() => void compute()} disabled={busy}>
            {busy ? "Computing…" : "Compare"}
          </Button>
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}

        {result && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 rounded-md border p-3">
              <Badge className={own ? "bg-emerald-500" : "bg-sky-500"}>{own ? "Owning is cheaper" : "Leasing is cheaper"}</Badge>
              <span className="text-sm">
                NPV saving <strong>{PKR(result.npvSaving)}</strong> over {result.horizonMonths} months
              </span>
              <span className="text-sm text-muted-foreground">
                {result.breakEvenMonth != null
                  ? `Owning breaks even at month ${result.breakEvenMonth} (~${(result.breakEvenMonth / 12).toFixed(1)} yrs)`
                  : "Owning never breaks even within the horizon"}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <PathCol title="Lease" path={result.lease} highlight={!own} />
              <PathCol title="Own" path={result.own} highlight={own} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PathCol({ title, path, highlight }: { title: string; path: OwnVsLeaseResult["lease"]; highlight: boolean }): React.ReactElement {
  return (
    <div className={`rounded-md border p-3 ${highlight ? "border-emerald-500" : ""}`}>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</div>
      <Row label="Upfront" value={path.upfront} />
      <Row label="Total cash" value={path.totalCash} />
      <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
        <span>NPV cost</span>
        <span>{PKR(path.npvCost)}</span>
      </div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{PKR(value)}</span>
    </div>
  );
}

export default OwnVsLeaseView;
