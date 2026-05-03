"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  CreditCard,
} from "lucide-react";
import { SectionCard } from "@/components/user-dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { TopUpPaymentModal } from "./topup-payment-modal";

const STATUS_LABEL: Record<ChangeRequestStatus, string> = {
  pending: "Pending vendor",
  approved: "Approved",
  declined: "Declined",
  cancelled: "Cancelled",
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

interface ChangeRequestRowProps {
  cr: BookingChangeRequest;
  bookingId: number;
  onChanged: () => void;
}

function ChangeRequestRow({ cr, bookingId, onChanged }: ChangeRequestRowProps) {
  const [busy, setBusy] = useState(false);
  // BK-054 top-up — modal state. Only relevant when this row needs top-up.
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpData, setTopUpData] = useState<
    { clientSecret: string; amount: number } | null
  >(null);

  const Icon =
    cr.status === "approved"
      ? CheckCircle2
      : cr.status === "declined" || cr.status === "expired"
      ? XCircle
      : cr.status === "pending"
      ? Clock
      : AlertTriangle;

  const cancel = async () => {
    setBusy(true);
    try {
      await BookingAPI.cancelChangeRequest(bookingId, cr.id);
      toast({ title: "Request cancelled" });
      onChanged();
    } catch (e: any) {
      toast({
        title: "Couldn't cancel",
        description: e?.response?.data?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const startTopUp = async () => {
    setBusy(true);
    try {
      const data = await BookingAPI.initiateTopUp(bookingId, cr.id);
      if (!data?.clientSecret) {
        throw new Error("No client secret returned from server");
      }
      setTopUpData({ clientSecret: data.clientSecret, amount: data.amount });
      setTopUpOpen(true);
    } catch (e: any) {
      const code = e?.response?.data?.message;
      const friendly =
        code === "top_up_already_paid"
          ? "This top-up has already been paid."
          : code === "request_not_pending"
          ? "This change is no longer pending."
          : code === "top_up_not_required"
          ? "No top-up is required for this change."
          : e?.response?.data?.message ?? "Couldn't start the payment";
      toast({
        title: "Couldn't start top-up",
        description: friendly,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const requiresTopUp = cr.priceImpactJson?.requiresTopUp;
  const diff = cr.priceImpactJson?.diff;
  const showTopUpCta =
    cr.status === "pending" &&
    cr.proposedByRole === "customer" &&
    requiresTopUp === true &&
    typeof diff === "number" &&
    diff > 0;

  return (
    <div className="py-3 border-b border-border/60 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "mt-0.5 rounded-full p-1.5",
              cr.status === "approved" && "bg-emerald-100 text-emerald-700",
              cr.status === "pending" && "bg-amber-100 text-amber-700",
              (cr.status === "declined" || cr.status === "expired") &&
                "bg-red-100 text-red-700",
              cr.status === "cancelled" && "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm">
                {TYPE_LABEL[cr.changeType] ?? cr.changeType}
              </p>
              <Badge
                variant={STATUS_VARIANT[cr.status]}
                className="text-[10.5px]"
              >
                {STATUS_LABEL[cr.status]}
              </Badge>
            </div>
            {cr.reason ? (
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {cr.reason}
              </p>
            ) : null}
            <p className="text-[11px] text-muted-foreground mt-1">
              Created {formatDate(cr.createdAt)}
              {cr.expiresAt && cr.status === "pending"
                ? ` · expires ${formatDate(cr.expiresAt)}`
                : ""}
            </p>
            {typeof diff === "number" && diff !== 0 ? (
              <p
                className={cn(
                  "text-[12px] mt-1 tabular-nums",
                  diff > 0 ? "text-amber-700" : "text-emerald-700",
                )}
              >
                {diff > 0 ? "Top-up due" : "Refund on approval"}:{" "}
                {formatPKR(Math.abs(diff))}
                {requiresTopUp && !showTopUpCta
                  ? " (vendor will request payment)"
                  : ""}
              </p>
            ) : null}
          </div>
        </div>
        {cr.status === "pending" && cr.proposedByRole === "customer" ? (
          <div className="flex flex-col gap-1.5 shrink-0">
            {showTopUpCta ? (
              <Button
                size="sm"
                disabled={busy}
                onClick={startTopUp}
                className="gap-1.5"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CreditCard className="h-3.5 w-3.5" />
                )}
                Pay top-up
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={cancel}
            >
              {busy && !showTopUpCta ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Cancel"
              )}
            </Button>
          </div>
        ) : null}
      </div>
      {topUpData && topUpOpen ? (
        <TopUpPaymentModal
          open={topUpOpen}
          onClose={() => setTopUpOpen(false)}
          clientSecret={topUpData.clientSecret}
          amount={topUpData.amount}
          bookingId={bookingId}
          requestId={cr.id}
          onSuccess={() => {
            setTopUpOpen(false);
            // Brief delay so the webhook has time to flip the row before
            // we refetch — the API is fast but not synchronous with the
            // Stripe success callback.
            setTimeout(onChanged, 1500);
          }}
        />
      ) : null}
    </div>
  );
}

interface CreateChangeRequestFormProps {
  bookingId: number;
  onCreated: () => void;
  onClose: () => void;
}

function CreateChangeRequestForm({
  bookingId,
  onCreated,
  onClose,
}: CreateChangeRequestFormProps) {
  const [changeType, setChangeType] = useState<ChangeRequestType>("guest_count");
  const [reason, setReason] = useState("");
  const [guestCount, setGuestCount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason.trim() || reason.trim().length < 5) {
      toast({
        title: "Add a short reason",
        description: "Vendors are more likely to approve with context.",
        variant: "destructive",
      });
      return;
    }
    let diff: Record<string, unknown> = {};
    if (changeType === "guest_count") {
      const n = parseInt(guestCount, 10);
      if (!Number.isFinite(n) || n <= 0) {
        toast({
          title: "Enter a valid guest count",
          variant: "destructive",
        });
        return;
      }
      diff = { newGuestCount: n };
    }
    setSubmitting(true);
    try {
      await BookingAPI.createChangeRequest(bookingId, {
        changeType,
        diff,
        reason: reason.trim(),
      });
      toast({ title: "Request sent to vendor" });
      onCreated();
      onClose();
    } catch (e: any) {
      toast({
        title: "Couldn't send request",
        description: e?.response?.data?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-border/60 mt-3">
      <div className="grid gap-2">
        <Label className="text-[12px]">Type of change</Label>
        <select
          value={changeType}
          onChange={(e) => setChangeType(e.target.value as ChangeRequestType)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="guest_count">Change guest count</option>
          <option value="slot_swap">Change slot/time</option>
          <option value="add_extras">Add extras</option>
          <option value="custom">Other</option>
        </select>
      </div>
      {changeType === "guest_count" ? (
        <div className="grid gap-2">
          <Label className="text-[12px]">New guest count</Label>
          <Input
            type="number"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            placeholder="e.g. 350"
            min={1}
          />
        </div>
      ) : null}
      <div className="grid gap-2">
        <Label className="text-[12px]">Reason</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you requesting this change?"
          rows={3}
          maxLength={500}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : null}
          Send to vendor
        </Button>
      </div>
    </div>
  );
}

interface ChangeRequestsCardProps {
  bookingId: number | string;
  /** When false, hides the "Request a change" CTA (e.g. completed/cancelled bookings). */
  canRequest?: boolean;
}

/**
 * BK-054 + BK-055 + BK-056 — list + create change requests for a booking.
 * Vendor-side approve/decline lives in the dashboard surface; here the
 * customer can only propose + cancel their own pending request.
 */
export function ChangeRequestsCard({
  bookingId,
  canRequest = true,
}: ChangeRequestsCardProps) {
  const [requests, setRequests] = useState<BookingChangeRequest[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    BookingAPI.getChangeRequests(Number(bookingId))
      .then((res) => setRequests(res?.requests ?? []))
      .catch((e) => {
        if (e?.response?.status === 403 || e?.response?.status === 404) {
          setRequests([]);
        } else {
          setRequests([]);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  if (loading) {
    return (
      <SectionCard title="Change requests">
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </SectionCard>
    );
  }

  const list = requests ?? [];
  const hasAny = list.length > 0;

  return (
    <SectionCard
      title="Change requests"
      description={
        canRequest
          ? "Need to add guests, swap a slot, or change a package? Send a request to the vendor."
          : "Past change requests for this booking."
      }
      action={
        canRequest && !showForm ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Request change
          </Button>
        ) : null
      }
    >
      {hasAny ? (
        <div className="divide-y divide-border/60">
          {list.map((cr) => (
            <ChangeRequestRow
              key={cr.id}
              cr={cr}
              bookingId={Number(bookingId)}
              onChanged={load}
            />
          ))}
        </div>
      ) : !showForm ? (
        <p className="text-sm text-muted-foreground py-3">
          No change requests yet.
        </p>
      ) : null}

      {showForm ? (
        <CreateChangeRequestForm
          bookingId={Number(bookingId)}
          onCreated={load}
          onClose={() => setShowForm(false)}
        />
      ) : null}
    </SectionCard>
  );
}

export default ChangeRequestsCard;
