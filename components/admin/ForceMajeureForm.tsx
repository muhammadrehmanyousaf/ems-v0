"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Search,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  ForceMajeureAPI,
  type ForceMajeureCommitResult,
  type ForceMajeureDryRunResult,
} from "@/lib/api/forceMajeure";

function formatPKR(n: number | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(n);
  } catch {
    return `Rs. ${Math.round(n).toLocaleString("en-PK")}`;
  }
}

/**
 * BK-037 — Admin force-majeure batch-cancel form.
 *
 * Required UX: ALWAYS show a dry-run preview before allowing commit.
 * Reason is required + ≥5 chars (audit-log trail). On commit the parent
 * page should show a confirmation dialog with the affected count to
 * prevent fat-finger mistakes during a real wedding-ban event.
 */
export function ForceMajeureForm() {
  const [bookingDateFrom, setBookingDateFrom] = useState("");
  const [bookingDateTo, setBookingDateTo] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ForceMajeureDryRunResult | null>(null);
  const [committed, setCommitted] = useState<ForceMajeureCommitResult | null>(
    null,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const validate = (): string | null => {
    if (!bookingDateFrom || !bookingDateTo) return "Pick both From and To dates.";
    if (bookingDateFrom > bookingDateTo) return "From date must be on or before To date.";
    if (reason.trim().length < 5) return "Reason must be at least 5 characters (audit trail).";
    return null;
  };

  const runDryRun = async () => {
    const err = validate();
    if (err) {
      toast({ title: "Cannot preview", description: err, variant: "destructive" });
      return;
    }
    setBusy(true);
    setCommitted(null);
    try {
      const res = await ForceMajeureAPI.run({
        bookingDateFrom,
        bookingDateTo,
        reason: reason.trim(),
        dryRun: true,
      });
      if ("dryRun" in res && res.dryRun) {
        setPreview(res);
      } else {
        // Backend ignored dryRun? Treat as committed to be safe.
        setPreview(null);
        setCommitted(res as ForceMajeureCommitResult);
      }
    } catch (e: any) {
      toast({
        title: "Preview failed",
        description: e?.response?.data?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    const err = validate();
    if (err) {
      toast({ title: "Cannot commit", description: err, variant: "destructive" });
      return;
    }
    setBusy(true);
    setConfirmOpen(false);
    try {
      const res = await ForceMajeureAPI.run({
        bookingDateFrom,
        bookingDateTo,
        reason: reason.trim(),
        dryRun: false,
      });
      if ("dryRun" in res && !res.dryRun) {
        setCommitted(res);
        setPreview(null);
        toast({
          title: "Force-majeure batch executed",
          description: `${res.succeeded} cancelled · ${res.skipped} skipped · ${res.failed} failed · ${formatPKR(res.totalRefunded)} refunded`,
        });
      } else {
        toast({
          title: "Unexpected response",
          description: "Backend returned a dry-run shape on commit.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Batch failed",
        description: e?.response?.data?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setCommitted(null);
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 border-amber-200 bg-amber-50/40">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-[13px] text-amber-900">
            <p className="font-semibold">High-stakes ops action.</p>
            <p className="mt-1">
              This batch-cancels every active booking inside the date range,
              issues a 100% refund (force-majeure overrides the per-vendor
              cancellation policy + retains zero platform fee), claws back
              completed vendor payouts, and audit-logs every action. ALWAYS
              run a dry-run first.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="from" className="text-[12px]">
              Bookings from
            </Label>
            <Input
              id="from"
              type="date"
              value={bookingDateFrom}
              onChange={(e) => {
                setBookingDateFrom(e.target.value);
                reset();
              }}
              disabled={busy}
            />
          </div>
          <div>
            <Label htmlFor="to" className="text-[12px]">
              Bookings to (inclusive)
            </Label>
            <Input
              id="to"
              type="date"
              value={bookingDateTo}
              onChange={(e) => {
                setBookingDateTo(e.target.value);
                reset();
              }}
              disabled={busy}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="reason" className="text-[12px]">
            Reason
            <span className="text-bridal-text-soft ml-1">
              · saved on every cancellation + audit log
            </span>
          </Label>
          <Textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              reset();
            }}
            placeholder="e.g. Govt wedding-ban during 2026 monsoon flood emergency (NDMA notification ref: …)"
            disabled={busy}
            maxLength={500}
          />
          <p className="text-[11px] text-bridal-text-soft mt-1">
            {reason.length} / 500 characters
            {reason.length > 0 && reason.length < 5 ? (
              <span className="text-red-600 ml-2">
                Must be at least 5 chars
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={runDryRun}
            disabled={busy || !!committed}
            className="gap-1.5"
          >
            {busy && !committed ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            Preview affected bookings
          </Button>
          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={busy || !preview || preview.count === 0}
            className="gap-1.5"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Commit batch
          </Button>
        </div>
      </Card>

      {/* Dry-run preview */}
      {preview ? (
        <Card className="p-5 border-amber-300">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Search className="h-4 w-4 text-amber-700" />
                Dry run
              </h3>
              <p className="text-[12px] text-bridal-text-soft mt-0.5">
                No mutations were made. Click <b>Commit batch</b> above to apply.
              </p>
            </div>
            <Badge variant="secondary" className="text-[10.5px]">
              {preview.count} booking{preview.count === 1 ? "" : "s"}
            </Badge>
          </div>
          {preview.count === 0 ? (
            <p className="text-sm text-bridal-text-soft italic">
              No active bookings in this date range. Nothing would be cancelled.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                Would cancel <b>{preview.count}</b> active booking
                {preview.count === 1 ? "" : "s"} between{" "}
                <b>{bookingDateFrom}</b> and <b>{bookingDateTo}</b>.
              </p>
              {preview.sampleIds.length > 0 ? (
                <p className="text-[12px] text-bridal-text-soft">
                  Sample IDs (first 50):{" "}
                  <span className="tabular-nums">
                    {preview.sampleIds.join(", ")}
                  </span>
                </p>
              ) : null}
            </div>
          )}
        </Card>
      ) : null}

      {/* Commit result */}
      {committed ? (
        <Card className="p-5 border-emerald-300">
          <div className="flex items-start gap-3 mb-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">
                Batch executed
              </h3>
              <p className="text-[12px] text-bridal-text-soft mt-0.5">
                Audit log row written. Customer + vendor notifications dispatched
                via the outbox.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-md bg-emerald-50 p-3">
              <p className="text-[10.5px] uppercase tracking-wide text-emerald-700">
                Cancelled
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {committed.succeeded}
              </p>
            </div>
            <div className="rounded-md bg-neutral-50 p-3">
              <p className="text-[10.5px] uppercase tracking-wide text-neutral-700">
                Skipped
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {committed.skipped}
              </p>
            </div>
            <div
              className={
                committed.failed > 0
                  ? "rounded-md bg-red-50 p-3"
                  : "rounded-md bg-neutral-50 p-3"
              }
            >
              <p className="text-[10.5px] uppercase tracking-wide text-neutral-700">
                Failed
              </p>
              <p
                className={`text-lg font-semibold tabular-nums ${committed.failed > 0 ? "text-red-700" : ""}`}
              >
                {committed.failed}
              </p>
            </div>
            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-[10.5px] uppercase tracking-wide text-blue-700">
                Refunded
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {formatPKR(committed.totalRefunded)}
              </p>
            </div>
          </div>
          {committed.failed > 0 ? (
            <details className="mt-4">
              <summary className="text-[12px] font-medium text-red-700 cursor-pointer">
                {committed.failed} failed — see details
              </summary>
              <ul className="mt-2 space-y-1 text-[11px] text-red-700">
                {committed.results
                  .filter((r) => !r.ok)
                  .slice(0, 50)
                  .map((r) => (
                    <li key={r.bookingId} className="tabular-nums">
                      Booking #{r.bookingId}: {r.code || r.error || "unknown"}
                    </li>
                  ))}
              </ul>
            </details>
          ) : null}
        </Card>
      ) : null}

      {/* Confirm-commit dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm force-majeure batch?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel{" "}
              <b className="text-foreground">
                {preview?.count ?? "?"} booking
                {preview?.count === 1 ? "" : "s"}
              </b>{" "}
              between <b>{bookingDateFrom}</b> and <b>{bookingDateTo}</b>,
              issue 100% refunds to every customer, claw back vendor payouts,
              and audit-log the action. This cannot be undone in bulk.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={commit}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : null}
              Yes, cancel {preview?.count ?? 0} booking
              {preview?.count === 1 ? "" : "s"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ForceMajeureForm;
