"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  BookingAPI,
  type BookingChangeRequest,
  type ChangeRequestStatus,
  type ChangeRequestType,
} from "@/lib/api/bookings";

const STATUS_LABEL: Record<ChangeRequestStatus, string> = {
  pending: "Pending your decision",
  approved: "Approved",
  declined: "Declined",
  cancelled: "Cancelled by customer",
  expired: "Expired",
};

const STATUS_VARIANT: Record<
  ChangeRequestStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  approved: "default",
  declined: "destructive",
  cancelled: "outline",
  expired: "outline",
};

const TYPE_LABEL: Record<ChangeRequestType, string> = {
  guest_count: "Change guest count",
  slot_swap: "Change slot",
  package_change: "Change package",
  add_extras: "Add extras",
  custom: "Other change",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

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

function diffSummary(cr: BookingChangeRequest): string | null {
  const d = cr.diffJson as Record<string, unknown>;
  if (!d) return null;
  if (cr.changeType === "guest_count" && typeof d.newGuestCount === "number") {
    return `New guest count: ${d.newGuestCount}`;
  }
  if (cr.changeType === "slot_swap") {
    return `New slot: ${d.newSlotTemplateId ?? "—"}${
      d.newBookingTime ? " @ " + d.newBookingTime : ""
    }`;
  }
  if (cr.changeType === "package_change") {
    return `New package: #${d.newPackageId ?? "—"}`;
  }
  if (cr.changeType === "add_extras" && Array.isArray(d.extraCodes)) {
    return `Add extras: ${(d.extraCodes as string[]).join(", ")}`;
  }
  return null;
}

interface VendorChangeRequestRowProps {
  cr: BookingChangeRequest;
  bookingId: number;
  onChanged: () => void;
}

function VendorChangeRequestRow({
  cr,
  bookingId,
  onChanged,
}: VendorChangeRequestRowProps) {
  const [busy, setBusy] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [notes, setNotes] = useState("");

  const Icon =
    cr.status === "approved"
      ? CheckCircle2
      : cr.status === "declined" || cr.status === "expired"
      ? XCircle
      : cr.status === "pending"
      ? Clock
      : AlertTriangle;

  const approve = async () => {
    setBusy(true);
    try {
      const res = await BookingAPI.approveChangeRequest(bookingId, cr.id);
      const reqTopUp =
        (res as any)?.code === "requires_top_up" ||
        (res as any)?.priceImpact?.requiresTopUp;
      toast({
        title: reqTopUp ? "Approved · top-up required" : "Change approved",
        description: reqTopUp
          ? "Customer will be asked to pay the top-up before the change applies."
          : "Booking updated.",
      });
      onChanged();
    } catch (e: any) {
      const code = e?.response?.data?.data?.code;
      toast({
        title: "Couldn't approve",
        description:
          code === "slot_unavailable"
            ? "The new slot is no longer available."
            : code === "package_business_mismatch"
            ? "Package belongs to another business."
            : e?.response?.data?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    setBusy(true);
    try {
      await BookingAPI.declineChangeRequest(bookingId, cr.id, notes.trim() || undefined);
      toast({ title: "Change declined" });
      setShowDecline(false);
      setNotes("");
      onChanged();
    } catch (e: any) {
      toast({
        title: "Couldn't decline",
        description: e?.response?.data?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const requiresTopUp = cr.priceImpactJson?.requiresTopUp;
  const diff = cr.priceImpactJson?.diff;
  const summary = diffSummary(cr);
  // BK-054-TOPUP follow-up — distinct visual state for vendors when
  // the row is pending an approve-but-funds-not-yet-collected handoff.
  // 3 sub-states from one row:
  //   topUpPaidAt set         → "Top-up paid · finalising" (webhook hasn't
  //                              re-run approveRequest yet, race window)
  //   topUpPaymentIntentId set → "Customer paying" (modal open / 3DS pending)
  //   neither, requiresTopUp   → "Awaiting customer payment"
  const topUpState =
    cr.status === "pending" && requiresTopUp
      ? cr.topUpPaidAt
        ? "paid"
        : cr.topUpPaymentIntentId
        ? "paying"
        : "awaiting"
      : null;

  return (
    <div className="py-3 border-b border-neutral-100 last:border-b-0">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 rounded-full p-1.5",
            cr.status === "approved" && "bg-emerald-100 text-emerald-700",
            cr.status === "pending" && "bg-amber-100 text-amber-700",
            (cr.status === "declined" || cr.status === "expired") &&
              "bg-red-100 text-red-700",
            cr.status === "cancelled" && "bg-neutral-100 text-neutral-500",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">
              {TYPE_LABEL[cr.changeType] ?? cr.changeType}
            </p>
            <Badge variant={STATUS_VARIANT[cr.status]} className="text-[10.5px]">
              {STATUS_LABEL[cr.status]}
            </Badge>
            {/* BK-054-TOPUP — sub-state when row is awaiting / receiving / received customer top-up. */}
            {topUpState === "awaiting" ? (
              <Badge variant="outline" className="text-[10.5px] border-amber-300 text-amber-700">
                Awaiting customer payment
              </Badge>
            ) : null}
            {topUpState === "paying" ? (
              <Badge variant="outline" className="text-[10.5px] border-blue-300 text-blue-700">
                Customer paying…
              </Badge>
            ) : null}
            {topUpState === "paid" ? (
              <Badge variant="outline" className="text-[10.5px] border-emerald-300 text-emerald-700">
                Top-up paid · finalising
              </Badge>
            ) : null}
            <span className="text-[11px] text-neutral-500 capitalize">
              by {cr.proposedByRole}
            </span>
          </div>
          {summary ? (
            <p className="text-[12.5px] text-neutral-700 mt-1">{summary}</p>
          ) : null}
          {cr.reason ? (
            <p className="text-[12px] text-neutral-500 mt-0.5 italic">
              "{cr.reason}"
            </p>
          ) : null}
          {typeof diff === "number" && diff !== 0 ? (
            <p
              className={cn(
                "text-[12px] mt-1 tabular-nums font-medium",
                diff > 0 ? "text-amber-700" : "text-emerald-700",
              )}
            >
              {diff > 0 ? "Customer top-up:" : "Refund to customer:"}{" "}
              {formatPKR(Math.abs(diff))}
              {requiresTopUp ? " (will be billed on approval)" : ""}
            </p>
          ) : null}
          <p className="text-[11px] text-neutral-400 mt-1">
            Created {formatDate(cr.createdAt)}
            {cr.expiresAt && cr.status === "pending"
              ? ` · expires ${formatDate(cr.expiresAt)}`
              : ""}
          </p>

          {cr.status === "pending" && cr.proposedByRole === "customer" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={approve} disabled={busy}>
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : null}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDecline((v) => !v)}
                disabled={busy}
              >
                Decline
              </Button>
            </div>
          ) : null}
          {cr.status === "pending" && showDecline ? (
            <div className="mt-2 space-y-2">
              <Label className="text-[11px]">Notes for the customer</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why are you declining?"
                rows={2}
                maxLength={500}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowDecline(false);
                    setNotes("");
                  }}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={decline}
                  disabled={busy}
                >
                  Confirm decline
                </Button>
              </div>
            </div>
          ) : null}
          {cr.decisionNotes ? (
            <div className="mt-2 pt-2 border-t border-neutral-100">
              <p className="text-[10.5px] uppercase tracking-wide text-neutral-400">
                Notes
              </p>
              <p className="text-[12px] text-neutral-700">{cr.decisionNotes}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface VendorChangeRequestsCardProps {
  bookingId: number | string;
}

/**
 * Vendor-side change-request panel. Lists every BK-054/55/56 request for the
 * booking; lets the vendor approve/decline pending customer-proposed ones.
 */
export function VendorChangeRequestsCard({
  bookingId,
}: VendorChangeRequestsCardProps) {
  const [requests, setRequests] = useState<BookingChangeRequest[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    BookingAPI.getChangeRequests(Number(bookingId))
      .then((res) => setRequests(res?.requests ?? []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const list = requests ?? [];
  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading change requests…
        </div>
      </Card>
    );
  }

  if (list.length === 0) return null;

  const pendingCount = list.filter((r) => r.status === "pending").length;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-neutral-700">
          Change requests
          {pendingCount > 0 ? (
            <Badge variant="secondary" className="ml-2 text-[10.5px]">
              {pendingCount} pending
            </Badge>
          ) : null}
        </h3>
      </div>
      <div className="divide-y divide-neutral-100">
        {list.map((cr) => (
          <VendorChangeRequestRow
            key={cr.id}
            cr={cr}
            bookingId={Number(bookingId)}
            onChanged={load}
          />
        ))}
      </div>
    </Card>
  );
}

export default VendorChangeRequestsCard;
