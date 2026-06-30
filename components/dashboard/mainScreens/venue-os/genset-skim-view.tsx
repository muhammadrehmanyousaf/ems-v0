"use client";

/**
 * Venue-OS P2 · WS7-A — genset-skim panel. Reconcile a booking's diesel run
 * (tank-dip consumption vs hour-meter run-hours × rated L/hr) → a skim_percent +
 * 3 flags. The calibration banner shows the seed band with a bold "Estimate, not
 * measured" chip until N≥5 clean events, then flips to "Now measured from YOUR
 * logs". Skim is MEASUREMENT — it never posts a journal entry. Gated on
 * isGensetSkimOn(); the backend 404s until ENABLE_GENSET_SKIM. Additive.
 */
import * as React from "react";
import { venueOsApi, type GensetReconResult, type GensetSkimSummary } from "@/lib/api/venueOs";
import { isGensetSkimOn } from "@/lib/genset-skim-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PCT = (n: number): string => (Number(n) * 100).toFixed(1) + "%";

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

function CalibrationChip({ calibrated, label }: { calibrated: boolean; label: string }): React.ReactElement {
  return calibrated ? (
    <Badge className="bg-emerald-500">now measured from YOUR logs</Badge>
  ) : (
    <Badge variant="secondary" className="font-semibold uppercase">Estimate, not measured</Badge>
  );
}

function FlagChips({ flags }: { flags?: Partial<{ skimOverBand: boolean; runHourPadding: boolean; receiptOverClaim: boolean }> }): React.ReactElement | null {
  if (!flags) return null;
  const on: string[] = [];
  if (flags.skimOverBand) on.push("skim over band");
  if (flags.runHourPadding) on.push("run-hour padding");
  if (flags.receiptOverClaim) on.push("receipt over-claim");
  if (!on.length) return <Badge className="bg-emerald-500">clean</Badge>;
  return (
    <span className="flex flex-wrap gap-1">
      {on.map((f) => (
        <Badge key={f} variant="destructive">{f}</Badge>
      ))}
    </span>
  );
}

export function GensetSkimView(): React.ReactElement | null {
  const enabled = isGensetSkimOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [generator, setGenerator] = React.useState<string>("Main");
  const [bookingId, setBookingId] = React.useState<string>("");
  const [kva, setKva] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [recon, setRecon] = React.useState<GensetReconResult | null>(null);
  const [summary, setSummary] = React.useState<GensetSkimSummary | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Genset-skim is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Genset skim (diesel measurement)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <input type="text" placeholder="generator" value={generator} onChange={(e) => setGenerator(e.target.value)} className="w-28 rounded border px-2 py-1" />
          <input type="number" placeholder="booking #" value={bookingId} onChange={(e) => setBookingId(e.target.value)} className="w-28 rounded border px-2 py-1" />
          <input type="number" placeholder="kVA" value={kva} onChange={(e) => setKva(e.target.value)} className="w-20 rounded border px-2 py-1" />
          <Button
            size="sm"
            onClick={() => void guard(async () => setRecon(await venueOsApi.reconcileGenset({ businessId: Number(businessId), generatorIdentifier: generator, bookingId: Number(bookingId), kva: kva ? Number(kva) : undefined })))}
            disabled={!businessId || !bookingId || busy}
          >
            Reconcile event
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void guard(async () => setSummary(await venueOsApi.gensetSkimSummary(Number(businessId), { generatorIdentifier: generator })))}
            disabled={!businessId || busy}
          >
            Summary
          </Button>
        </div>

        {recon && recon.reconciled && recon.skim && (
          <div className="space-y-1 rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{PCT(recon.skim.skimPercent)} skim</span>
              <span className="text-muted-foreground">
                ({recon.skim.skimVarianceL} L of {recon.skim.recorded} L)
              </span>
              <CalibrationChip calibrated={!!recon.isCalibrated} label={recon.baseline?.label || ""} />
            </div>
            <FlagChips flags={recon.flags} />
            <p className="text-xs text-muted-foreground">Measurement only — no journal entry posted.</p>
          </div>
        )}
        {recon && !recon.reconciled && <p className="text-sm text-muted-foreground">{recon.reason}</p>}

        {summary && (
          <div className="space-y-2 rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Venue baseline:</span>
              <span className="font-semibold">{PCT(summary.baseline.skimPercent)}</span>
              <CalibrationChip calibrated={summary.baseline.isCalibrated} label={summary.baseline.label} />
              <span className="text-xs text-muted-foreground">n={summary.baseline.n} · {summary.flaggedCount} flagged</span>
            </div>
            {summary.events.slice(0, 8).map((ev) => (
              <div key={ev.id} className="flex items-center justify-between border-t pt-1 text-xs">
                <span>Booking #{ev.bookingId ?? "—"}</span>
                <span>{PCT(ev.skimPercent)}</span>
                <FlagChips flags={ev.flags} />
              </div>
            ))}
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default GensetSkimView;
