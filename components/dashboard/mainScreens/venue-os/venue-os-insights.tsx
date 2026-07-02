"use client";

/**
 * Venue-OS Insights panel (P1 FE). Surfaces the flag-gated venue-OS engine:
 * a live status of which features the account has, and a self-contained wedding
 * tax calculator (236CB + provincial off the verified rate-store). Gated by
 * isOrgMembershipOn(); renders nothing when the flag is off, and every API call
 * 404s on the backend until a pilot Org enables the feature. Additive — no
 * existing screen is touched. Route this in wherever the dashboard wants it.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { venueOsApi, type TaxBreakdown } from "@/lib/api/venueOs";
import { isOrgMembershipOn } from "@/lib/org-membership-flag";
import { useActiveBusinessId } from "@/lib/store/active-business-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PKR = (n: number): string => "Rs " + Math.round(n).toLocaleString("en-PK");
const JURISDICTIONS = ["PRA", "SRB", "KPRA", "BRA", "ICT"] as const;
type Jurisdiction = (typeof JURISDICTIONS)[number];

export function VenueOsInsights(): React.ReactElement | null {
  const enabled = isOrgMembershipOn();
  // Scope status + tax to the ACTIVE venue — the flags are per-business overrides,
  // so a global health() call would report the env defaults (all off) and the tax
  // gate would 404 even for a pilot venue.
  const activeBusinessId = useActiveBusinessId();
  const health = useQuery({
    queryKey: ["venueOs", "health", activeBusinessId],
    queryFn: () => venueOsApi.health(activeBusinessId),
    enabled,
    retry: false,
  });

  const [baseAmount, setBaseAmount] = React.useState<number>(1000000);
  const [jurisdiction, setJurisdiction] = React.useState<Jurisdiction>("PRA");
  const [filer, setFiler] = React.useState<"FILER" | "NON_FILER">("NON_FILER");
  const [tax, setTax] = React.useState<TaxBreakdown | null>(null);
  const [computing, setComputing] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function compute(): Promise<void> {
    setComputing(true);
    setErr(null);
    try {
      setTax(await venueOsApi.computeTax({ baseAmount, jurisdiction, filerStatus: filer, businessId: activeBusinessId ?? undefined }));
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Tax engine not enabled for your account";
      setErr(msg);
      setTax(null);
    } finally {
      setComputing(false);
    }
  }

  if (!enabled) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Venue-OS status</CardTitle>
        </CardHeader>
        <CardContent>
          {health.isError ? (
            <p className="text-sm text-muted-foreground">Venue-OS is not enabled for your account yet.</p>
          ) : !health.data ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(health.data.flags).map(([flag, on]) => (
                <Badge key={flag} variant={on ? "default" : "secondary"}>
                  {flag.replace(/_ON$/, "").replace(/_/g, " ").toLowerCase()}: {on ? "on" : "off"}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wedding tax calculator (236CB + provincial)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              Bill (PKR)
              <input
                type="number"
                value={baseAmount}
                onChange={(e) => setBaseAmount(Number(e.target.value))}
                className="ml-2 w-36 rounded border px-2 py-1"
              />
            </label>
            <div className="flex gap-1">
              {JURISDICTIONS.map((j) => (
                <Button key={j} size="sm" variant={jurisdiction === j ? "default" : "outline"} onClick={() => setJurisdiction(j)}>
                  {j}
                </Button>
              ))}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant={filer === "FILER" ? "default" : "outline"} onClick={() => setFiler("FILER")}>
                Filer
              </Button>
              <Button size="sm" variant={filer === "NON_FILER" ? "default" : "outline"} onClick={() => setFiler("NON_FILER")}>
                Non-filer
              </Button>
            </div>
            <Button size="sm" onClick={() => void compute()} disabled={computing}>
              {computing ? "Computing…" : "Compute"}
            </Button>
          </div>

          {err && <p className="text-sm text-destructive">{err}</p>}

          {tax &&
            (() => {
              const prov = tax.provincial;
              const wht = tax.wht236cb;
              return (
                <div className="rounded-md border p-3 text-sm">
                  {prov && (
                    <div className="flex justify-between">
                      <span>
                        Provincial ({prov.jurisdiction} {prov.ratePercent ? `${prov.ratePercent}%` : prov.basis})
                      </span>
                      <span>{PKR(prov.taxAmount)}</span>
                    </div>
                  )}
                  {wht && (
                    <div className="flex justify-between">
                      <span>
                        236CB ({wht.ratePercent}% {filer.toLowerCase()})
                      </span>
                      <span>{PKR(wht.taxAmount)}</span>
                    </div>
                  )}
                  <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
                    <span>Total tax</span>
                    <span>{PKR(tax.totalTax)}</span>
                  </div>
                </div>
              );
            })()}
        </CardContent>
      </Card>
    </div>
  );
}

export default VenueOsInsights;
