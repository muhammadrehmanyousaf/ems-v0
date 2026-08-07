"use client";

/**
 * Venue-OS P3-F — DNFBP AML/CFT readiness card. The AML shield (deposit trail,
 * turnover recon, structuring guard-rail, beneficial ownership) ships in WS4-B/C;
 * this card scores FBR AML readiness (registration, designated officer, CDD
 * threshold, beneficial-ownership register, STR/CTR) and lists the gaps.
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 */
import * as React from "react";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueOsApi, type DnfbpCard } from "@/lib/api/venueOs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DangerousAction } from "@/components/dashboard/primitives/dangerous-action";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function DnfbpCardView(): React.ReactElement | null {
  const [businessId, setBusinessId] = useBusinessIdField();
  const [card, setCard] = React.useState<DnfbpCard | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Couldn't load aML shield."));
    } finally {
      setBusy(false);
    }
  }

  const bid = Number(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>DNFBP — AML/CFT readiness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <BusinessScopeField value={businessId} onChange={setBusinessId} />
          <Button size="sm" onClick={() => void guard(async () => setCard(await venueOsApi.dnfbpCard(bid)))} disabled={!businessId || busy}>Readiness card</Button>
          {/* WWL-602 (S3) — one click asserted a regulatory status about this
              business. Getting it wrong is a compliance claim, not a UI state. */}
          <DangerousAction
            title="Mark this business as FBR-registered?"
            consequence={
              <>
                You&apos;re recording that this venue <strong>is registered with the FBR</strong>.
                That claim feeds your DNFBP compliance card and the reports built on it — only set
                it if the registration actually exists.
              </>
            }
            confirmLabel="Yes, it's registered"
            confirmVariant="default"
            disabled={!businessId || busy}
            onConfirm={() => guard(async () => { await venueOsApi.dnfbpUpsert(bid, { fbrRegistered: true }); setCard(await venueOsApi.dnfbpCard(bid)); })}
          >
            <Button size="sm" variant="outline" disabled={!businessId || busy}>Mark registered</Button>
          </DangerousAction>
        </div>

        {card && (
          <div className="rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Readiness {card.readinessPct}%</span>
              <Badge variant={card.readinessPct === 100 ? "default" : "secondary"}>{card.gaps.length} gap(s)</Badge>
            </div>
            <div className="mt-1 space-y-0.5 text-xs">
              {card.obligations.map((o) => (
                <div key={o.key} className="flex justify-between border-t pt-0.5">
                  <span>{o.done ? "✓" : "○"} {o.label}</span>
                  <span className="text-muted-foreground">{o.detail || ""}</span>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs">{card.note}</p>
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default DnfbpCardView;
