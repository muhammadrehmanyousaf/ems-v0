"use client";

/**
 * Venue-OS P2 · WS8 — working-capital instruments operator panel. Create + drive
 * the four instruments that feed the liability calendar: committee/BC (generate
 * the cycle, record contributions + the net-to-zero payout), Ijarah leases (+
 * monthly rental accrual), supplier udhaar (with the hidden-markup reveal + aging),
 * and a bank facility (comparator only). Gated on isWorkingCapitalOn(); the
 * backend 404s until ENABLE_WORKING_CAPITAL. Additive — money posts only via the GL.
 */
import * as React from "react";
import { venueOsApi, type Committee, type IjarahLeaseRow, type SupplierUdhaarResult, type UdhaarAging } from "@/lib/api/venueOs";
import { isWorkingCapitalOn } from "@/lib/working-capital-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string): string => "Rs " + Math.round(Number(n)).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function WorkingCapitalInstrumentsView(): React.ReactElement | null {
  const enabled = isWorkingCapitalOn();
  const [businessId, setBusinessId] = React.useState<string>("");
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
      setErr(readErr(e, "Working-capital is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const bid = Number(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Working-capital instruments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="text-sm">
          Business #
          <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
        </label>

        {/* committee / BC */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">Committee / BC</span>
            <input type="text" placeholder="name" value={cName} onChange={(e) => setCName(e.target.value)} className="w-32 rounded border px-2 py-1" />
            <input type="number" placeholder="monthly" value={cMonthly} onChange={(e) => setCMonthly(e.target.value)} className="w-24 rounded border px-2 py-1" />
            <input type="number" placeholder="cycle" value={cCycle} onChange={(e) => setCCycle(e.target.value)} className="w-16 rounded border px-2 py-1" />
            <input type="text" placeholder="start YYYY-MM" value={cStart} onChange={(e) => setCStart(e.target.value)} className="w-32 rounded border px-2 py-1" />
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
            <input type="number" placeholder="monthly rental" value={iRental} onChange={(e) => setIRental(e.target.value)} className="w-28 rounded border px-2 py-1" />
            <input type="number" placeholder="term mo" value={iTerm} onChange={(e) => setITerm(e.target.value)} className="w-20 rounded border px-2 py-1" />
            <input type="text" placeholder="start YYYY-MM-DD" value={iStart} onChange={(e) => setIStart(e.target.value)} className="w-36 rounded border px-2 py-1" />
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
            <input type="number" placeholder="cash price" value={uCash} onChange={(e) => setUCash(e.target.value)} className="w-24 rounded border px-2 py-1" />
            <input type="number" placeholder="udhaar price" value={uUdhaar} onChange={(e) => setUUdhaar(e.target.value)} className="w-24 rounded border px-2 py-1" />
            <input type="text" placeholder="due YYYY-MM-DD" value={uDue} onChange={(e) => setUDue(e.target.value)} className="w-36 rounded border px-2 py-1" />
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
