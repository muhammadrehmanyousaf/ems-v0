"use client";

/**
 * Venue-OS P2 · WS8 — working-capital instruments operator panel. Create + drive
 * the four instruments that feed the liability calendar: committee/BC (generate
 * the cycle, record contributions + the net-to-zero payout), Ijarah leases (+
 * monthly rental accrual), supplier udhaar (with the hidden-markup reveal + aging),
 * and a bank facility (comparator only).
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 */
import * as React from "react";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueOsApi, type Committee, type IjarahLeaseRow, type SupplierUdhaarResult, type UdhaarAging } from "@/lib/api/venueOs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";

const PKR = (n: number | string): string => "Rs " + Math.round(Number(n)).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function WorkingCapitalInstrumentsView(): React.ReactElement | null {
  const [businessId, setBusinessId] = useBusinessIdField();
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  // committee
  const [cName, setCName] = React.useState<string>("Biradari BC");
  const [cMonthly, setCMonthly] = React.useState<string>("50000");
  const [cCycle, setCCycle] = React.useState<string>("10");
  const [cStart, setCStart] = React.useState<string>("");
  const [committees, setCommittees] = React.useState<Committee[]>([]);

  // ijarah
  const [iRental, setIRental] = React.useState<string>("80000");
  const [iTerm, setITerm] = React.useState<string>("36");
  const [iStart, setIStart] = React.useState<string>("");
  const [leases, setLeases] = React.useState<IjarahLeaseRow[]>([]);

  // udhaar
  const [uCash, setUCash] = React.useState<string>("100000");
  const [uUdhaar, setUUdhaar] = React.useState<string>("110000");
  const [uDue, setUDue] = React.useState<string>("");
  const [udhaar, setUdhaar] = React.useState<SupplierUdhaarResult | null>(null);
  const [aging, setAging] = React.useState<UdhaarAging | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Couldn't load working-capital."));
    } finally {
      setBusy(false);
    }
  }

  const bid = Number(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Working-capital instruments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <BusinessScopeField value={businessId} onChange={setBusinessId} />

        {/* committee / BC */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">Committee / BC</span>
            <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Name<input type="text" placeholder="name" value={cName} onChange={(e) => setCName(e.target.value)} className="w-32 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
            <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Monthly<input min={0} type="number" placeholder="monthly" value={cMonthly} onChange={(e) => setCMonthly(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
            <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Cycle<input min={0} type="number" placeholder="cycle" value={cCycle} onChange={(e) => setCCycle(e.target.value)} className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
            <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Start YYYY-MM<input type="text" placeholder="start YYYY-MM" value={cStart} onChange={(e) => setCStart(e.target.value)} className="w-32 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
            <Button size="sm" onClick={() => void guard(async () => { const months = Number(cCycle); await venueOsApi.createCommittee({ businessId: bid, name: cName, monthlyContributionPkr: Number(cMonthly), cycleMonths: months, potPkr: Number(cMonthly) * months, startMonth: cStart }); setCommittees(await venueOsApi.listCommittees(bid)); })} disabled={!businessId || !cStart || busy}>
              Create
            </Button>
            <Button size="sm" variant="outline" onClick={() => void guard(async () => setCommittees(await venueOsApi.listCommittees(bid)))} disabled={!businessId || busy}>
              List
            </Button>
          </div>
          {committees.map((c) => (
            <div key={c.id} className="flex items-center gap-2 border-t pt-1 text-xs">
              <span>#{c.id} {c.name} · {PKR(c.monthlyContributionPkr)}×{c.cycleMonths}</span>
              <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => void guard(async () => { await venueOsApi.generateCommitteeLedger(c.id); })} disabled={busy}>
                generate ledger
              </Button>
            </div>
          ))}
        </div>

        {/* ijarah */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">Ijarah lease</span>
            <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Monthly rental<input min={0} type="number" placeholder="monthly rental" value={iRental} onChange={(e) => setIRental(e.target.value)} className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
            <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Term mo<input min={0} type="number" placeholder="term mo" value={iTerm} onChange={(e) => setITerm(e.target.value)} className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
            <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Start YYYY-MM-DD<input type="text" placeholder="start YYYY-MM-DD" value={iStart} onChange={(e) => setIStart(e.target.value)} className="w-36 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
            <Button size="sm" onClick={() => void guard(async () => { await venueOsApi.createIjarahLease({ businessId: bid, monthlyRentalPkr: Number(iRental), termMonths: Number(iTerm), rentalStartDate: iStart }); setLeases(await venueOsApi.listIjarahLeases(bid)); })} disabled={!businessId || !iStart || busy}>
              Create
            </Button>
            <Button size="sm" variant="outline" onClick={() => void guard(async () => setLeases(await venueOsApi.listIjarahLeases(bid)))} disabled={!businessId || busy}>
              List
            </Button>
          </div>
          {leases.map((l) => (
            <div key={l.lease.id} className="border-t pt-1 text-xs">
              #{l.lease.id} {l.lease.lessor} · {PKR(l.lease.monthlyRentalPkr)}/mo · {l.schedule.remainingMonths} mo left · committed {PKR(l.schedule.totalCommitted)}
            </div>
          ))}
        </div>

        {/* supplier udhaar */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">Supplier udhaar</span>
            <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Cash price<input min={0} type="number" placeholder="cash price" value={uCash} onChange={(e) => setUCash(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
            <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Udhaar price<input min={0} type="number" placeholder="udhaar price" value={uUdhaar} onChange={(e) => setUUdhaar(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
            <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Due YYYY-MM-DD<input type="text" placeholder="due YYYY-MM-DD" value={uDue} onChange={(e) => setUDue(e.target.value)} className="w-36 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
            <Button size="sm" onClick={() => void guard(async () => setUdhaar(await venueOsApi.recordSupplierUdhaar({ businessId: bid, cashPricePkr: Number(uCash), udhaarPricePkr: Number(uUdhaar), dueDate: uDue || undefined })))} disabled={!businessId || !uUdhaar || busy}>
              Record
            </Button>
            <Button size="sm" variant="outline" onClick={() => void guard(async () => setAging(await venueOsApi.supplierUdhaarAging(bid)))} disabled={!businessId || busy}>
              Aging
            </Button>
          </div>
          {udhaar && (
            <p className="text-xs">
              udhaar #{udhaar.udhaar.id}: <span className="font-medium text-amber-600">{udhaar.impliedMarkupPct}% markup</span>
              {udhaar.annualizedAprPct != null && <span className="text-muted-foreground"> ({udhaar.annualizedAprPct}% APR)</span>}
            </p>
          )}
          {aging && (
            <p className="text-xs text-muted-foreground">
              outstanding {PKR(aging.totalOutstanding)} · CURRENT {PKR(aging.buckets.CURRENT)} · 30d {PKR(aging.buckets.D30)} · 60d {PKR(aging.buckets.D60)} · 90d+ {PKR(aging.buckets.D90_PLUS)}
            </p>
          )}
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default WorkingCapitalInstrumentsView;
