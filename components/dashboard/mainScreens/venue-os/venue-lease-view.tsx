"use client";

/**
 * Venue-OS P2 — Rented-venue leases. Many operators rent the hall: monthly rent
 * + a big upfront pagri (key money) + a refundable deposit + periodic escalation.
 * Register the lease, see the remaining commitment, and run the monthly
 * rent + pagri-amortisation accrual — which posts to "Rent & Pagri" and feeds the
 * costing-depth overhead pool (so rent flows into every event's fully-costed
 * P&L). Gated on isVenueLeaseOn(); the backend 404s until VENUE_LEASE_ON. Additive.
 */
import * as React from "react";
import { venueOsApi, type VenueLease, type LeaseScheduleItem, type RentAccrualRun } from "@/lib/api/venueOs";
import { isVenueLeaseOn } from "@/lib/venue-lease-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: string | number): string => "Rs " + Math.round(Number(n) || 0).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function VenueLeaseView(): React.ReactElement | null {
  const enabled = isVenueLeaseOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [leases, setLeases] = React.useState<VenueLease[] | null>(null);
  const [schedule, setSchedule] = React.useState<LeaseScheduleItem[] | null>(null);
  const [run, setRun] = React.useState<RentAccrualRun | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  // new-lease form
  const [venueName, setVenueName] = React.useState<string>("");
  const [rent, setRent] = React.useState<string>("");
  const [pagri, setPagri] = React.useState<string>("");
  const [deposit, setDeposit] = React.useState<string>("");
  const [start, setStart] = React.useState<string>("");
  const [term, setTerm] = React.useState<string>("36");
  const [esc, setEsc] = React.useState<string>("10");
  const [period, setPeriod] = React.useState<string>("");

  async function guard(fn: () => Promise<void>, fallback: string): Promise<void> {
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

  const load = (): Promise<void> =>
    guard(async () => {
      const [l, s] = await Promise.all([venueOsApi.listVenueLeases(Number(businessId)), venueOsApi.leaseSchedule(Number(businessId))]);
      setLeases(l);
      setSchedule(s);
    }, "Lease economics is not enabled for your account yet.");

  const addLease = (): Promise<void> =>
    guard(async () => {
      await venueOsApi.createVenueLease({
        businessId: Number(businessId),
        venueName,
        monthlyRent: Number(rent),
        pagriAmount: Number(pagri) || 0,
        securityDeposit: Number(deposit) || 0,
        leaseStartDate: start,
        leaseTermMonths: Number(term),
        escalationPercent: Number(esc) || 0,
      });
      setVenueName("");
      setRent("");
      setPagri("");
      await load();
    }, "Could not create the lease.");

  const accrue = (dryRun: boolean): Promise<void> =>
    guard(async () => {
      setRun(await venueOsApi.runRentAccrual(Number(businessId), { period, dryRun }));
    }, "Could not run the rent accrual.");

  if (!enabled) return null;
  const schedById = new Map((schedule ?? []).map((s) => [s.leaseId, s]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rented-venue leases (rent &amp; pagri)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={!businessId || busy}>
            Load leases
          </Button>
        </div>

        {/* register a new lease */}
        <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/40 p-3">
          <label className="text-sm">
            Venue
            <input type="text" value={venueName} onChange={(e) => setVenueName(e.target.value)} className="ml-2 w-36 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            Rent/mo
            <input type="number" value={rent} onChange={(e) => setRent(e.target.value)} className="ml-2 w-28 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            Pagri
            <input type="number" value={pagri} onChange={(e) => setPagri(e.target.value)} className="ml-2 w-28 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            Deposit
            <input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="ml-2 w-28 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            Start
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="ml-2 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            Term (mo)
            <input type="number" value={term} onChange={(e) => setTerm(e.target.value)} className="ml-2 w-20 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            Esc %/yr
            <input type="number" value={esc} onChange={(e) => setEsc(e.target.value)} className="ml-2 w-16 rounded border px-2 py-1" />
          </label>
          <Button size="sm" onClick={() => void addLease()} disabled={!businessId || !venueName || !rent || !start || busy}>
            Add lease
          </Button>
        </div>

        {leases && leases.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Venue</th>
                  <th className="py-2 pr-3 text-right">Rent/mo</th>
                  <th className="py-2 pr-3 text-right">Pagri/mo</th>
                  <th className="py-2 pr-3 text-right">Remaining</th>
                  <th className="py-2 pr-3 text-right">Committed</th>
                  <th className="py-2 pr-3 text-right">Deposit</th>
                </tr>
              </thead>
              <tbody>
                {leases.map((l) => {
                  const s = schedById.get(l.id);
                  return (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{l.venueName}</td>
                      <td className="py-2 pr-3 text-right">{PKR(l.monthlyRent)}</td>
                      <td className="py-2 pr-3 text-right">{PKR(s?.monthlyPagri ?? 0)}</td>
                      <td className="py-2 pr-3 text-right">{s ? `${s.remainingMonths} mo` : "—"}</td>
                      <td className="py-2 pr-3 text-right font-medium">{PKR(s?.totalCommitted ?? 0)}</td>
                      <td className="py-2 pr-3 text-right">{PKR(l.securityDeposit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {leases && leases.length === 0 && <p className="text-sm text-muted-foreground">No leases registered yet.</p>}

        {/* run rent accrual */}
        <div className="flex flex-wrap items-end gap-3 border-t pt-3">
          <label className="text-sm">
            Period
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="ml-2 rounded border px-2 py-1" />
          </label>
          <Button size="sm" variant="outline" onClick={() => void accrue(true)} disabled={!businessId || !period || busy}>
            Preview
          </Button>
          <Button size="sm" onClick={() => void accrue(false)} disabled={!businessId || !period || busy}>
            Post rent
          </Button>
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}

        {run && (
          <div className="rounded-md border p-3 text-sm">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-semibold">{PKR(run.total)}</span>
              <span className="text-muted-foreground">
                for {run.period} — rent {PKR(run.totalRent)} + pagri {PKR(run.totalPagri)} · {run.leaseCount} leases
              </span>
              {run.dryRun && <Badge variant="secondary">preview (not written)</Badge>}
            </div>
            <ul className="space-y-1">
              {run.results.map((r) => (
                <li key={r.leaseId} className="flex justify-between">
                  <span>{r.venueName}</span>
                  {r.skipped ? (
                    <span className="text-muted-foreground">{r.skipped.replace(/_/g, " ")}</span>
                  ) : (
                    <span>
                      {PKR((r.rent || 0) + (r.pagri || 0))}
                      {r.rentIdempotentHit && <span className="ml-1 text-xs text-muted-foreground">(already posted)</span>}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default VenueLeaseView;
