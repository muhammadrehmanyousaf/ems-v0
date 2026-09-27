"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  // WW-CANCELWINDOW — worded from the customer's side: this is their own ask,
  // sitting with the venue, and "Cancel this booking" would read as a button.
  cancel_request: "Cancellation requested",
  // WW-QIST — the couple's own words for it. "Instalment plan" is what the
  // schedule is called on the rest of the page (Qist schedule).
  installment_plan: "Instalment plan",
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
  const router = useRouter();
  const [busy, setBusy] = useState(false);

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

  /**
   * WW-DIRECT-PAY — the top-up is paid to the venue, like every other rupee.
   *
   * This called `initiateTopUp` for a Stripe PaymentIntent client secret and
   * opened a card modal. There is no gateway now, so that endpoint has nothing
   * to mint and the modal had nothing to confirm against.
   *
   * An approved change request raises the booking's `totalAmount`, which raises
   * its outstanding balance — so the difference is already payable through the
   * one pay surface, with the venue's own accounts and the same BK- reference.
   * Sending them there beats a second collection path that would have to
   * duplicate the account lookup and the claim form.
   */
  const goToPay = () => {
    router.push(`/user/bookings/${bookingId}/pay`);
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
                onClick={goToPay}
                className="gap-1.5"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Pay the difference
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
    </div>
  );
}

interface CreateChangeRequestFormProps {
  bookingId: number;
  onCreated: () => void;
  onClose: () => void;
  /** WW-QIST — what is still owed; the plan must add up to exactly this. */
  outstanding?: number;
  /** WW-QIST — nothing may fall due inside 7 days of this, unless agreed. */
  eventDate?: string | null;
}

/**
 * WW-QIST — a default schedule to start from.
 *
 * Two instalments, on the 1st of the next two months in which they can fall,
 * because the 1st-5th is when salaries land in Pakistan and a plan that lands
 * on the 20th is the difference between a plan kept and a plan chased. The last
 * one is pulled back if it would fall inside the seven days before the event,
 * which is the one date nobody should be paying on.
 */
function suggestPlan(outstanding: number, eventDate?: string | null): { label: string; amount: string; dueAt: string }[] {
  const salaryDay = (monthsAhead: number): string => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthsAhead, 1));
    return d.toISOString().slice(0, 10);
  };
  const cap = (() => {
    if (!eventDate) return null;
    const ms = new Date(String(eventDate).slice(0, 10) + "T00:00:00+05:00").getTime();
    if (!Number.isFinite(ms)) return null;
    return new Date(ms - 8 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  })();
  const clampDate = (iso: string) => (cap && iso > cap ? cap : iso);
  const half = Math.round(outstanding / 2);
  return [
    { label: "Qist 1", amount: String(half), dueAt: clampDate(salaryDay(1)) },
    { label: "Balance", amount: String(Math.max(0, outstanding - half)), dueAt: clampDate(salaryDay(2)) },
  ];
}

function CreateChangeRequestForm({
  bookingId,
  onCreated,
  onClose,
  outstanding = 0,
  eventDate = null,
}: CreateChangeRequestFormProps) {
  const [changeType, setChangeType] = useState<ChangeRequestType>("guest_count");
  const [reason, setReason] = useState("");
  const [guestCount, setGuestCount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  // WW-QIST
  const [rows, setRows] = useState<{ label: string; amount: string; dueAt: string }[]>(() =>
    suggestPlan(outstanding, eventDate),
  );
  const [override, setOverride] = useState(false);
  const planTotal = rows.reduce((sum, r) => sum + (parseInt(r.amount, 10) || 0), 0);
  const addsUp = outstanding > 0 && planTotal === Math.round(outstanding);

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
      // Backend (bookingChangeService) expects a { to: { … } } envelope, not a
      // flat key — a flat `newGuestCount` was rejected as `invalid_diff` (400),
      // which is exactly the "Change Request throws an error" ticket.
      diff = { to: { guestCount: n } };
    } else if (changeType === "installment_plan") {
      if (!addsUp) {
        toast({
          title: "The plan has to add up",
          description: `Your instalments come to Rs ${planTotal.toLocaleString("en-PK")}; Rs ${Math.round(outstanding).toLocaleString("en-PK")} is outstanding.`,
          variant: "destructive",
        });
        return;
      }
      diff = {
        to: {
          installments: rows.map((r, i) => ({
            label: r.label.trim() || `Qist ${i + 1}`,
            amount: parseInt(r.amount, 10) || 0,
            dueAt: r.dueAt,
          })),
          ...(override ? { override: true } : {}),
        },
      };
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
          {/* slot_swap / add_extras rendered no inputs and submitted an empty
              diff → guaranteed 400. Hidden until their inputs exist (slot/date
              change is handled via the Reschedule flow). guest_count + custom
              are the two that work today. */}
          <option value="guest_count">Change guest count</option>
          {/* WW-QIST — only offered when something is actually outstanding;
              there is nothing to schedule on a fully paid booking. */}
          {outstanding > 0 ? (
            <option value="installment_plan">Propose an instalment plan</option>
          ) : null}
          <option value="custom">Other request</option>
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
      {changeType === "installment_plan" ? (
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between">
            <Label className="text-[12px]">Your instalments</Label>
            <span className={`text-[11px] ${addsUp ? "text-muted-foreground" : "text-destructive"}`}>
              Rs {planTotal.toLocaleString("en-PK")} of Rs {Math.round(outstanding).toLocaleString("en-PK")} outstanding
            </span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_7.5rem_2rem] gap-2 items-center">
              <Input
                type="date"
                value={r.dueAt}
                onChange={(e) =>
                  setRows((prev) => prev.map((x, j) => (j === i ? { ...x, dueAt: e.target.value } : x)))
                }
              />
              <Input
                type="number"
                min={1}
                value={r.amount}
                placeholder="Amount"
                onChange={(e) =>
                  setRows((prev) => prev.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))
                }
              />
              {rows.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground"
                  onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Remove instalment ${i + 1}`}
                >
                  ×
                </Button>
              ) : (
                <span />
              )}
            </div>
          ))}
          {/* Three is the cap: past that a wedding payment becomes informal
              credit the vendor cannot chase. */}
          {rows.length < 3 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 justify-self-start text-[12px]"
              onClick={() =>
                setRows((prev) => [...prev, { label: `Qist ${prev.length + 1}`, amount: "", dueAt: "" }])
              }
            >
              + Add an instalment
            </Button>
          ) : (
            <p className="text-[11px] text-muted-foreground">Three instalments is the maximum.</p>
          )}
          <label className="flex items-start gap-2 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={override}
              onChange={(e) => setOverride(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              The last payment falls inside the 7 days before the event, and the vendor has agreed to
              that. Leave this unticked unless you have already discussed it.
            </span>
          </label>
          <p className="text-[11px] text-muted-foreground">
            Dates in the 1st–5th of a month are easiest to keep. The plan has to add up to exactly
            what is outstanding.
          </p>
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
  /**
   * WW-QIST — what is still owed, and the event date. Both optional so the card
   * keeps working where they are not to hand; without the outstanding amount the
   * instalment-plan option is simply not offered, because a plan has to add up
   * to a number and guessing it is worse than not asking.
   */
  outstanding?: number;
  eventDate?: string | null;
}

/**
 * BK-054 + BK-055 + BK-056 — list + create change requests for a booking.
 * Vendor-side approve/decline lives in the dashboard surface; here the
 * customer can only propose + cancel their own pending request.
 */
export function ChangeRequestsCard({
  bookingId,
  canRequest = true,
  outstanding = 0,
  eventDate = null,
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
          outstanding={outstanding}
          eventDate={eventDate}
        />
      ) : null}
    </SectionCard>
  );
}

export default ChangeRequestsCard;
