"use client";

/**
 * Venue-OS P3-F — DNFBP AML/CFT readiness card. The AML shield (deposit trail,
 * turnover recon, structuring guard-rail, beneficial ownership) ships in WS4-B/C;
 * this card scores FBR AML readiness (registration, designated officer, CDD
 * threshold, beneficial-ownership register, STR/CTR) and lists the gaps. Gated on
 * isAmlShieldOn() — the backend 404s until ENABLE_AML_SHIELD.
 */
import * as React from "react";
import { venueOsApi, type DnfbpCard } from "@/lib/api/venueOs";
import { isAmlShieldOn } from "@/lib/aml-shield-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function DnfbpCardView(): React.ReactElement | null {
  const enabled = isAmlShieldOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [card, setCard] = React.useState<DnfbpCard | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "AML shield is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const bid = Number(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>DNFBP — AML/CFT readiness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>Business #<input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" /></label>
          <Button size="sm" onClick={() => void guard(async () => setCard(await venueOsApi.dnfbpCard(bid)))} disabled={!businessId || busy}>Readiness card</Button>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => { await venueOsApi.dnfbpUpsert(bid, { fbrRegistered: true }); setCard(await venueOsApi.dnfbpCard(bid)); })} disabled={!businessId || busy}>Mark registered</Button>
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
