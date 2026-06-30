"use client";

/**
 * Venue-OS P2 · WS9 — the "Safety & Risk" insurance register. Lists policies with
 * an expiry badge (green / amber <30d / red lapsed), an add-policy form with a
 * STRICT policyType select (a fire policy does NOT cover a liability claim), a
 * recompute-status sweep, renew/lapse actions, and the premium-vs-recovered claim
 * ROI strip. Gated on isInsuranceTrackingOn(); the backend 404s until
 * ENABLE_INSURANCE_TRACKING. Premium/recovery are tracked only, not posted to the GL.
 */
import * as React from "react";
import { venueOsApi, type InsurancePolicy, type ClaimRoi } from "@/lib/api/venueOs";
import { isInsuranceTrackingOn } from "@/lib/insurance-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string): string => "Rs " + Math.round(Number(n)).toLocaleString("en-PK");
const POLICY_TYPES = ["EVENT", "PUBLIC_LIABILITY", "PROPERTY_FIRE", "FIRE_ALLIED_PERILS", "GENERATOR_EQUIPMENT", "MOTOR_VEHICLE"];

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

function ExpiryBadge({ p }: { p: InsurancePolicy }): React.ReactElement {
  if (p.status === "LAPSED") return <Badge variant="destructive">lapsed</Badge>;
  if (p.status === "EXPIRING") return <Badge className="bg-amber-500">expiring</Badge>;
  if (p.status === "RENEWED") return <Badge className="bg-blue-500">renewed</Badge>;
  return <Badge className="bg-emerald-500">active</Badge>;
}

export function InsurancePoliciesView(): React.ReactElement | null {
  const enabled = isInsuranceTrackingOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [policyType, setPolicyType] = React.useState<string>("EVENT");
  const [insurer, setInsurer] = React.useState<string>("");
  const [expiryDate, setExpiryDate] = React.useState<string>("");
  const [premium, setPremium] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [policies, setPolicies] = React.useState<InsurancePolicy[]>([]);
  const [roi, setRoi] = React.useState<ClaimRoi | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Insurance tracking is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  async function refresh(bid: number): Promise<void> {
    setPolicies(await venueOsApi.listPolicies(bid));
    setRoi(await venueOsApi.claimRoi(bid));
  }

  if (!enabled) return null;
  const bid = Number(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Safety &amp; Risk (insurance register)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => refresh(bid))} disabled={!businessId || busy}>
            Load
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void guard(async () => { await venueOsApi.sweepPolicies(); await refresh(bid); })} disabled={!businessId || busy}>
            Recompute expiry
          </Button>
        </div>

        {roi && (
          <div className="rounded-md border p-3 text-sm">
            <span className="font-medium">Insurance ROI:</span> premium {PKR(roi.premiumPaid)} · recovered {PKR(roi.recovered)}
            {roi.ratio != null && <span className="ml-1 text-muted-foreground">({(roi.ratio * 100).toFixed(0)}%)</span>}
          </div>
        )}

        {/* add policy */}
        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <select value={policyType} onChange={(e) => setPolicyType(e.target.value)} className="rounded border px-2 py-1">
            {POLICY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input type="text" placeholder="insurer" value={insurer} onChange={(e) => setInsurer(e.target.value)} className="w-28 rounded border px-2 py-1" />
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="rounded border px-2 py-1" />
          <input type="number" placeholder="premium" value={premium} onChange={(e) => setPremium(e.target.value)} className="w-24 rounded border px-2 py-1" />
          <Button size="sm" onClick={() => void guard(async () => { await venueOsApi.createPolicy({ businessId: bid, policyType, insurer: insurer || undefined, expiryDate, premiumAmount: premium ? Number(premium) : undefined }); await refresh(bid); })} disabled={!businessId || !expiryDate || busy}>
            Add policy
          </Button>
        </div>

        {policies.length > 0 && (
          <div className="space-y-1 text-xs">
            {policies.map((p) => (
              <div key={p.id} className="flex items-center gap-2 border-t py-1">
                <ExpiryBadge p={p} />
                <span className="font-medium">{p.policyType}</span>
                <span>{p.insurer || "—"}</span>
                <span className="text-muted-foreground">exp {p.expiryDate}</span>
                {!p.isVendorOwned && <Badge variant="outline">sub-vendor</Badge>}
                {p.status !== "RENEWED" && (
                  <Button size="sm" variant="ghost" className="ml-auto h-6 px-2" onClick={() => void guard(async () => { await venueOsApi.updatePolicyStatus(p.id, "RENEWED"); await refresh(bid); })} disabled={busy}>
                    mark renewed
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default InsurancePoliciesView;
