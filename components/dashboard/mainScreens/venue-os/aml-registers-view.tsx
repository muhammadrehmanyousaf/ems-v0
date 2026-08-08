"use client";

/**
 * Venue-OS P2 · WS4-B/C — AML cockpit registers (on top of the non-toggleable
 * guard-rails). Record a bank deposit (the structuring guard-rail scores it at
 * entry and only ever says "bank in full"), reconcile a month's declared turnover
 * against what was banked, maintain the beneficial-ownership register (the benami
 * counter), and stamp an immutable Compliance-Shield for the raid-defence pack.
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 */
import * as React from "react";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueOsApi, type TurnoverRecon, type BeneficialOwner, type ComplianceShield, type StructuringVerdict } from "@/lib/api/venueOs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";
import { lastDayOfPeriod } from "@/lib/utils/pk-date";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function AmlRegistersView(): React.ReactElement | null {
  const [businessId, setBusinessId] = useBusinessIdField();
  const [period, setPeriod] = React.useState<string>(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
  const [amount, setAmount] = React.useState<string>("");
  const [verdict, setVerdict] = React.useState<StructuringVerdict | null>(null);
  const [recon, setRecon] = React.useState<TurnoverRecon | null>(null);
  const [owners, setOwners] = React.useState<{ owners: BeneficialOwner[]; highRisk: { ownerName: string; level: string }[] } | null>(null);
  const [shield, setShield] = React.useState<ComplianceShield | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Couldn't load aML cockpit."));
    } finally {
      setBusy(false);
    }
  }

  const bid = Number(businessId);
  // WWL-455 — `new Date(y, m, 0).toISOString()` is local midnight rendered in
  // UTC, so east of Greenwich it returns the SECOND-to-last day: every AML
  // register silently excluded the final day of the month it claimed to cover.
  const monthRange = (): { from: string; to: string } => ({
    from: `${period}-01`,
    to: lastDayOfPeriod(period),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>AML cockpit — deposits · turnover · ownership · shield</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <BusinessScopeField value={businessId} onChange={setBusinessId} />
          <label>Month<input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="ml-1 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <span className="font-medium">Bank a deposit</span>
          <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Amount<input min={0} type="number" placeholder="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-32 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setVerdict((await venueOsApi.preDepositCheck(bid, { proposedDepositPkr: Number(amount) }))))} disabled={!businessId || !amount || busy}>Check</Button>
          <Button size="sm" onClick={() => void guard(async () => { const r = await venueOsApi.recordBankDeposit({ businessId: bid, amountPkr: Number(amount) }); setVerdict(r.structuring); })} disabled={!businessId || !amount || busy}>Record</Button>
        </div>
        {verdict && (
          <p className={`text-xs ${verdict.warn ? "text-amber-600" : "text-muted-foreground"}`}>
            {verdict.warn && <Badge variant="destructive" className="mr-1">structuring watch</Badge>}
            {verdict.warningText}
          </p>
        )}

        <div className="flex flex-wrap items-end gap-2">
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setRecon(await venueOsApi.turnoverRecon(bid, { period })))} disabled={!businessId || busy}>Reconcile turnover</Button>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setOwners(await venueOsApi.listBeneficialOwners(bid)))} disabled={!businessId || busy}>Beneficial owners</Button>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => { const r = monthRange(); setShield(await venueOsApi.complianceShield(bid, { periodFrom: r.from, periodTo: r.to, persist: true })); })} disabled={!businessId || busy}>Compliance shield</Button>
        </div>

        {recon && (
          <div className="rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Turnover {recon.period}</span>
              <Badge variant={recon.status === "RECONCILED" ? "secondary" : "destructive"}>{recon.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">declared {PKR(recon.declaredRevenuePkr)} · banked {PKR(recon.bankedPkr)} · unreconciled {PKR(recon.unreconciledPkr)}</p>
            <p className="mt-1 text-xs">{recon.note}</p>
          </div>
        )}

        {owners && (
          <div className="rounded-md border p-3 text-xs">
            <p className="text-sm font-medium">Beneficial owners {owners.highRisk.length > 0 && <Badge variant="destructive">benami risk</Badge>}</p>
            {owners.owners.map((o) => (
              <div key={o.id} className="flex justify-between border-t pt-0.5">
                <span>{o.ownerName} · {o.relationship} · {o.sharePercent}%</span>
                <Badge variant={o.benamiLevel === "none" || o.benamiLevel === "family_exempt" ? "secondary" : "destructive"}>{o.benamiLevel}</Badge>
              </div>
            ))}
          </div>
        )}

        {shield && (
          <div className="rounded-md border p-3 text-xs">
            <p className="text-sm font-medium">Compliance-Shield {shield.periodFrom} → {shield.periodTo}</p>
            <p className="text-muted-foreground">declared {PKR(shield.grossDeclaredPkr)} · banked {PKR(shield.bankedPkr)} · WHT {PKR(shield.taxCollectedPkr)} · owners {shield.beneficialOwnerCount} · flags {shield.structuringFlagCount}</p>
            <p className="text-muted-foreground">immutable · hash {shield.packHash.slice(0, 16)}…</p>
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default AmlRegistersView;
