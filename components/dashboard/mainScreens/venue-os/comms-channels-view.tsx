"use client";

/**
 * Venue-OS P2 · WS6-depth — swappable provider adapters + outbox dispatcher. Shows
 * which channel (WhatsApp/SMS/IVR) is LIVE vs SANDBOX (a provider swap is an env
 * change, not a code change), and dispatches the QUEUED outbox — flipping messages
 * to SENT through the resolved adapter (sandbox-safe until credentials are wired).
 * Gated on isBspCommsOn() — the backend 404s until ENABLE_BSP_COMMS.
 */
import * as React from "react";
import { venueOsApi } from "@/lib/api/venueOs";
import { isBspCommsOn } from "@/lib/comms-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function CommsChannelsView(): React.ReactElement | null {
  const enabled = isBspCommsOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [channels, setChannels] = React.useState<{ channel: string; provider: string; mode: string }[] | null>(null);
  const [run, setRun] = React.useState<{ dispatched: number; sent: number; failed: number } | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "BSP comms is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message channels &amp; outbox dispatch</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setChannels((await venueOsApi.commsChannels()).channels))} disabled={busy}>Channel status</Button>
          <label>Business #<input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" /></label>
          <Button size="sm" onClick={() => void guard(async () => setRun(await venueOsApi.dispatchQueued(Number(businessId))))} disabled={!businessId || busy}>Dispatch queued</Button>
        </div>

        {channels && (
          <div className="flex flex-wrap gap-2 text-xs">
            {channels.map((c) => (
              <div key={c.channel} className="flex items-center gap-1 rounded-md border px-2 py-1">
                <span className="font-medium">{c.channel}</span>
                <span className="text-muted-foreground">{c.provider}</span>
                <Badge variant={c.mode === "LIVE" ? "default" : "secondary"}>{c.mode}</Badge>
              </div>
            ))}
          </div>
        )}

        {run && (
          <p className="text-sm">
            Dispatched {run.dispatched} · <span className="text-emerald-600">{run.sent} sent</span>
            {run.failed > 0 && <span className="text-destructive"> · {run.failed} failed (laddered)</span>}
          </p>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default CommsChannelsView;
