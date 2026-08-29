"use client";

/**
 * WW-SETTLE — the customer's half of a refund settlement.
 *
 * Before this, a refund ended when the venue pressed "apply". The platform holds
 * none of the customer's money (WW-DIRECT-PAY), so that button only recorded
 * what the venue OWED — and the family had no way to see whether the venue had
 * claimed to pay them, no way to say the money had arrived, and no way to say it
 * hadn't. Two people would then argue about it with nothing written down.
 *
 * This card is that record, from the customer's side. It shows what the venue
 * says it has paid, and gives them the only two answers that matter: "it
 * reached me" or "it didn't". Confirming is the ONLY way a direct-pay refund
 * closes — no timer does it, no venue action does it, and no admin can.
 *
 * Self-hides when there is nothing to say: no refund requests, or the refund
 * engine dark for this booking (404).
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, HandCoins, Clock, TriangleAlert, Undo2 } from "lucide-react";
import { SectionCard } from "@/components/user-dashboard";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  listRefundRequests, acknowledgeRefund, disputeRefundSettlement, withdrawRefundRequest,
  outstandingRefund, type RefundRequestRow, type RefundState, type VendorPaymentMethod,
} from "@/lib/api/bookingOrder";

const rs = (n: number) => "Rs " + Math.round(n || 0).toLocaleString("en-PK");

const METHOD_LABEL: Record<VendorPaymentMethod, string> = {
  cash: "cash",
  bank_transfer: "bank transfer",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  cheque: "cheque",
  other: "another way",
};

/** What each state means to the person waiting for their money. */
const STATE_LINE: Record<RefundState, string> = {
  RAISED: "Your venue has been asked to review this refund.",
  APPROVED: "Your venue has approved this refund and is arranging the money.",
  APPLIED: "Your venue owes you this refund. They will pay you directly.",
  PAID_BY_VENDOR: "Your venue says they have paid you.",
  ACKNOWLEDGED: "You confirmed you received this refund. It is settled.",
  DISPUTED: "You told your venue this has not reached you. They have been asked to sort it out.",
  REJECTED: "Your venue declined this refund request.",
  WITHDRAWN: "You withdrew this refund request.",
};

const nice = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "";

export function RefundSettlementCard({ bookingId }: { bookingId: number | string }) {
  const id = Number(bookingId);
  const qc = useQueryClient();
  const [disputingId, setDisputingId] = useState<number | null>(null);
  const [disputeNote, setDisputeNote] = useState("");

  const reqs = useQuery({
    queryKey: ["refund-requests", id],
    queryFn: () => listRefundRequests(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["refund-requests", id] });
  const onFail = (e: unknown) => {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      ?? "Something went wrong — please try again.";
    toast({ title: "Couldn't save that", description: msg, variant: "destructive" });
  };

  const confirm = useMutation({
    mutationFn: (reqId: number) => acknowledgeRefund(id, reqId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Refund confirmed", description: "Thank you — this refund is now settled." });
    },
    onError: onFail,
  });
  const deny = useMutation({
    mutationFn: (v: { reqId: number; note: string }) => disputeRefundSettlement(id, v.reqId, v.note || undefined),
    onSuccess: () => {
      setDisputingId(null); setDisputeNote(""); invalidate();
      toast({ title: "Your venue has been told", description: "They have been asked to sort this out with you." });
    },
    onError: onFail,
  });
  const pull = useMutation({
    mutationFn: (reqId: number) => withdrawRefundRequest(id, reqId),
    onSuccess: () => { invalidate(); toast({ title: "Request withdrawn" }); },
    onError: onFail,
  });
  const busy = confirm.isPending || deny.isPending || pull.isPending;

  const requests: RefundRequestRow[] = reqs.data?.requests ?? [];
  // Nothing raised, or the engine is dark for this booking — say nothing at all
  // rather than showing a family an empty box about their money.
  if (reqs.isLoading || !reqs.data || requests.length === 0) return null;

  return (
    <SectionCard
      title="Your refund"
      description="What your venue owes you, and whether it has reached you."
    >
      <div className="space-y-3">
        {requests.map((r) => {
          const owed = outstandingRefund(r);
          return (
            <div key={r.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[13px] font-medium">{STATE_LINE[r.state] ?? r.state}</span>
                {owed > 0 && r.state !== "REJECTED" && r.state !== "WITHDRAWN" && (
                  <span className="text-[13px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {rs(owed)}
                  </span>
                )}
              </div>

              {r.state === "PAID_BY_VENDOR" && (
                <p className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
                  <HandCoins className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Paid by {r.vendorPaymentMethod ? METHOD_LABEL[r.vendorPaymentMethod] ?? r.vendorPaymentMethod : "the venue"}
                    {r.vendorPaymentRef ? ` — ${r.vendorPaymentRef}` : ""}
                    {r.paidByVendorAt ? ` on ${nice(r.paidByVendorAt)}` : ""}.
                    {" "}Check your account, then tell us whether it arrived. Nothing closes until you do.
                  </span>
                </p>
              )}

              {r.state === "APPLIED" && (
                <p className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Once they pay, you&apos;ll be asked to confirm it here.
                </p>
              )}

              {r.state === "DISPUTED" && r.disputeNote && (
                <p className="text-[12px] text-muted-foreground">You said: &ldquo;{r.disputeNote}&rdquo;</p>
              )}

              {r.state === "ACKNOWLEDGED" && r.acknowledgedAt && (
                <p className="flex items-start gap-1.5 text-[12px] text-emerald-700 dark:text-emerald-400">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Confirmed on {nice(r.acknowledgedAt)}.
                </p>
              )}

              {/* The customer's two answers. Only ever shown on a claim the
                  venue has actually made — there is nothing to confirm before
                  that, and offering it would invite closing an unpaid refund. */}
              {r.state === "PAID_BY_VENDOR" && (
                disputingId === r.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={disputeNote}
                      onChange={(e) => setDisputeNote(e.target.value)}
                      maxLength={300}
                      rows={2}
                      placeholder="What happened? e.g. nothing has reached my account yet."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" disabled={busy}
                        onClick={() => { setDisputingId(null); setDisputeNote(""); }}>
                        Back
                      </Button>
                      <Button size="sm" variant="destructive" disabled={busy}
                        onClick={() => deny.mutate({ reqId: r.id, note: disputeNote })}>
                        {deny.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                        Tell the venue
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={busy} onClick={() => confirm.mutate(r.id)}>
                      {confirm.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
                      Yes, I received it
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setDisputingId(r.id)}>
                      <TriangleAlert className="mr-1 h-3.5 w-3.5" />
                      No, it hasn&apos;t reached me
                    </Button>
                  </div>
                )
              )}

              {/* Only while the venue has not acted: after that a ledger entry
                  exists behind the request and withdrawing would strand it. */}
              {r.state === "RAISED" && (
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => pull.mutate(r.id)}>
                  {pull.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Undo2 className="mr-1 h-3.5 w-3.5" />}
                  Withdraw this request
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

export default RefundSettlementCard;
