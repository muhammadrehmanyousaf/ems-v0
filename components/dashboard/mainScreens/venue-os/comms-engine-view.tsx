"use client";

/**
 * Venue-OS P2 · WS6 — comms engine panel. The per-event/per-month PKR+USD cost
 * roll-up (answers "no idea what messaging costs"), the venue messaging config
 * (tier, quality chip, budget, sender mask, default language, IVR toggle — IVR
 * gated by COMMS_IVR_ON), and the read-only MessageEvent catalog with each event's
 * channel ladder. Gated on isBspCommsOn(); the backend 404s until ENABLE_BSP_COMMS.
 * Comms never posts to the GL — cost rides the prepaid wallet. Additive.
 */
import * as React from "react";
import { venueOsApi, type CommsConfig, type CommsCostRollup, type MessageEventRow } from "@/lib/api/venueOs";
import { isBspCommsOn, isCommsIvrOn } from "@/lib/comms-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string): string => "Rs " + Math.round(Number(n)).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

function QualityChip({ rating }: { rating: string | null }): React.ReactElement | null {
  if (!rating) return null;
  const cls = rating === "GREEN" ? "bg-emerald-500" : rating === "RED" ? "bg-red-500" : "bg-amber-500";
  return <Badge className={cls}>{rating}</Badge>;
}

export function CommsEngineView(): React.ReactElement | null {
  const enabled = isBspCommsOn();
  const ivrUi = isCommsIvrOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [cfg, setCfg] = React.useState<CommsConfig | null>(null);
  const [rollup, setRollup] = React.useState<CommsCostRollup | null>(null);
  const [events, setEvents] = React.useState<MessageEventRow[]>([]);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Multi-channel comms is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const bid = Number(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comms engine (cost · config · catalog)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <Button size="sm" onClick={() => void guard(async () => { setCfg(await venueOsApi.getCommsConfig(bid)); setRollup(await venueOsApi.getCommsCostRollup(bid, "event")); setEvents(await venueOsApi.listMessageEvents(bid)); })} disabled={!businessId || busy}>
            Load
          </Button>
        </div>

        {cfg && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm">
            <span className="font-medium">{cfg.displayName || "Venue"}</span>
            {cfg.greenTick && <Badge className="bg-blue-500">green tick</Badge>}
            <QualityChip rating={cfg.qualityRating} />
            {cfg.messagingTier && <span className="text-muted-foreground">tier {cfg.messagingTier}</span>}
            {cfg.monthlyBudgetPkr && <span className="text-muted-foreground">budget {PKR(cfg.monthlyBudgetPkr)}</span>}
            <span className="text-muted-foreground">lang {cfg.defaultLanguage}</span>
            {ivrUi && (
              <Button size="sm" variant="outline" className="h-7" onClick={() => void guard(async () => setCfg(await venueOsApi.putCommsConfig(bid, { ivrEnabled: !cfg.ivrEnabled })))} disabled={busy}>
                IVR {cfg.ivrEnabled ? "on" : "off"}
              </Button>
            )}
          </div>
        )}

        {rollup && rollup.rows.length > 0 && (
          <div className="rounded-md border p-3">
            <p className="mb-1 text-sm font-medium">Cost roll-up (by {rollup.groupBy})</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-1 pr-2">Event</th>
                  <th className="pr-2"># sent</th>
                  <th className="pr-2">PKR</th>
                  <th className="pr-2">USD</th>
                </tr>
              </thead>
              <tbody>
                {rollup.rows.map((r) => (
                  <tr key={r.bucket} className="border-t">
                    <td className="py-1 pr-2">{r.bucket}</td>
                    <td className="pr-2">{r.count}</td>
                    <td className="pr-2">{PKR(r.pkr)}</td>
                    <td className="pr-2">${Number(r.usd).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {events.length > 0 && (
          <div className="rounded-md border p-3 text-xs">
            <p className="mb-1 text-sm font-medium">Event catalog</p>
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center gap-2 border-t py-0.5">
                <span className="font-medium">{ev.key}</span>
                <Badge variant="secondary">{ev.defaultCategory}</Badge>
                <span className="text-muted-foreground">{Array.isArray(ev.channelLadderJson) ? ev.channelLadderJson.join(" → ") : "WHATSAPP"}</span>
                {ev.requiresOptIn && <Badge variant="outline">opt-in</Badge>}
              </div>
            ))}
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default CommsEngineView;
