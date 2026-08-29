"use client";

/**
 * EPIC 5 · §6 — cancellation / refund actions (the vendor-facing engine surface).
 *
 * Ties the deployed engine together on the booking: record the customer's policy
 * acceptance, raise a refund on cancel, walk it approve → apply (which moves money
 * via a negative receipt / carry-forward credit), and surface the "court-exposure"
 * flag from the tamper-evident evidence pack. Read-only preview lives in
 * RefundPreviewCard; this card is the actions. Self-hides when DISPUTE_ENGINE_ENABLED
 * is dark (404).
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldAlert, ShieldCheck, Loader2, Check, X, ArrowRight, HandCoins, Clock } from "lucide-react";
import {
  getPolicyAcceptance, recordPolicyAcceptance, listRefundRequests, raiseRefundRequest,
  decideRefundRequest, applyRefundRequest, getDisputeEvidence,
  markRefundPaid, outstandingRefund,
  type RefundRequestRow, type RefundState, type VendorPaymentMethod,
} from "@/lib/api/bookingOrder";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const rs = (n: number) => "Rs " + Math.round(n || 0).toLocaleString("en-PK");
const REASONS: { value: string; label: string }[] = [
  { value: "customer_cancel", label: "Customer ne cancel kiya" },
  { value: "vendor_cancel", label: "Humne cancel kiya" },
  { value: "force_majeure", label: "Force majeure (govt / aafat)" },
  { value: "dispute_resolution", label: "Dispute resolution" },
];
/**
 * WW-SETTLE - the colours carry the meaning, so read them as a sequence.
 *
 * APPLIED is no longer the finish line: on direct-pay it means "you owe this",
 * which is why it is warm now rather than the green it used to be. Only
 * ACKNOWLEDGED - the customer confirming they got the money - is green.
 */
const STATE_STYLE: Record<RefundState, string> = {
  RAISED: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  APPLIED: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  PAID_BY_VENDOR: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  ACKNOWLEDGED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  DISPUTED: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  REJECTED: "bg-muted text-muted-foreground",
  WITHDRAWN: "bg-muted text-muted-foreground",
};

/** Plain words for a venue, in place of the wire value. */
const STATE_LABEL: Record<RefundState, string> = {
  RAISED: "Nayi request",
  APPROVED: "Approved",
  APPLIED: "Aap ko dena hai",
  PAID_BY_VENDOR: "Customer ke jawab ka intezar",
  ACKNOWLEDGED: "Customer ne tasdeeq kar di",
  DISPUTED: "Customer kehta hai nahi mila",
  REJECTED: "Reject kiya",
  WITHDRAWN: "Customer ne wapas le li",
};

const PAY_METHODS: { value: VendorPaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "Easypaisa" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Doosra tareeqa" },
];

export function CancellationActionsCard({ bookingId }: { bookingId: number }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("customer_cancel");
  // Which request's "I have paid this" form is open, and what was typed into it.
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState<VendorPaymentMethod>("cash");
  const [payRef, setPayRef] = useState("");

  const acc = useQuery({ queryKey: ["policy-acceptance", bookingId], queryFn: () => getPolicyAcceptance(bookingId) });
  const reqs = useQuery({ queryKey: ["refund-requests", bookingId], queryFn: () => listRefundRequests(bookingId) });
  const evidence = useQuery({ queryKey: ["dispute-evidence", bookingId], queryFn: () => getDisputeEvidence(bookingId) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["policy-acceptance", bookingId] });
    qc.invalidateQueries({ queryKey: ["refund-requests", bookingId] });
    qc.invalidateQueries({ queryKey: ["dispute-evidence", bookingId] });
  };
  const accept = useMutation({ mutationFn: () => recordPolicyAcceptance(bookingId, { channel: "in_app" }), onSuccess: invalidate });
  const raise = useMutation({ mutationFn: () => raiseRefundRequest(bookingId, { reason }), onSuccess: invalidate });
  const decide = useMutation({ mutationFn: (v: { id: number; approve: boolean }) => decideRefundRequest(bookingId, v.id, v.approve), onSuccess: invalidate });
  const applyReq = useMutation({ mutationFn: (id: number) => applyRefundRequest(bookingId, id), onSuccess: invalidate });
  // WW-SETTLE - the venue's half of the handshake. Recording a payment is a
  // CLAIM: it moves the row to PAID_BY_VENDOR and stops there until the customer
  // answers. Nothing on this card can reach ACKNOWLEDGED.
  const markPaid = useMutation({
    mutationFn: (v: { id: number; method: VendorPaymentMethod; reference: string }) =>
      markRefundPaid(bookingId, v.id, { method: v.method, reference: v.reference || undefined }),
    onSuccess: () => { setPayingId(null); setPayRef(""); invalidate(); },
  });
  const busy = accept.isPending || raise.isPending || decide.isPending || applyReq.isPending || markPaid.isPending;

  if (acc.isLoading) {
    return <Card><CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Cancellation…</CardContent></Card>;
  }
  if (!acc.data) return null; // feature dark (404)

  const acceptance = acc.data.acceptance;
  const requests: RefundRequestRow[] = reqs.data?.requests ?? [];
  const exposure = evidence.data?.exposure;

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Cancellation &amp; Refund</h3>
          </div>
          {exposure && (
            <span className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
              exposure.flag === "OK" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
            )} title="Legal defensibility: policy accepted, audit chain verified, and the money evidenced">
              {exposure.flag === "OK" ? <ShieldCheck className="size-3" /> : <ShieldAlert className="size-3" />}
              {exposure.flag === "OK" ? "Defensible" : "Review"}
            </span>
          )}
        </div>

        {/* WWL-511 — the pack listed Rs 1,223,278 collected across two receipts
            with no proof on either, and said nothing: exposure weighed policy
            acceptance and the audit chain, never the money a forfeit is
            computed from. Shown whenever any receipt is unevidenced, not only
            once a forfeit has been applied — by then it is too late to go and
            find the screenshot. */}
        {exposure && (exposure.receiptsWithoutProof ?? 0) > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300/70 bg-amber-50 p-3 text-sm dark:border-amber-900/60 dark:bg-amber-950/30">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-medium">
                {exposure.receiptsWithoutProof} of {exposure.receiptsTotalCount} payments have no proof attached
                {exposure.unproofedAmount ? ` — Rs ${exposure.unproofedAmount.toLocaleString("en-PK")}` : ""}
              </p>
              <p className="mt-0.5 text-muted-foreground">
                If this booking is disputed, that is the money you would have to evidence. Attach the
                screenshot or slip to each receipt while you still have it.
              </p>
            </div>
          </div>
        )}

        {/* Policy acceptance */}
        <div className="rounded-lg border p-3 text-sm">
          {acceptance ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="size-4 text-emerald-600 shrink-0" />
              <span>Policy accepted{acceptance.acceptedName ? ` — ${acceptance.acceptedName}` : ""} ({acceptance.policySnapshot?.name || "policy"})</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Customer ne policy accept nahi ki.</span>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => accept.mutate()}>
                {accept.isPending ? <Loader2 className="size-4 animate-spin" /> : "Policy accept karwayen"}
              </Button>
            </div>
          )}
        </div>

        {/* Raise a refund */}
        <div className="flex items-center gap-2">
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="flex-1 rounded-md border bg-transparent px-2 py-1.5 text-sm">
            {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <Button size="sm" disabled={busy} onClick={() => raise.mutate()}>
            {raise.isPending ? <Loader2 className="size-4 animate-spin" /> : "Refund nikalein"}
          </Button>
        </div>

        {/* Refund requests */}
        {requests.length > 0 && (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STATE_STYLE[r.state])}>{STATE_LABEL[r.state] ?? r.state}</span>
                  <span className="text-muted-foreground">
                    Wapas <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">{rs(r.computed.refund)}</span>
                    {r.computed.carryForward ? <> · Credit <span className="tabular-nums">{rs(r.computed.carryForward)}</span></> : null}
                    {r.computed.forfeit ? <> · Zabt <span className="tabular-nums">{rs(r.computed.forfeit)}</span></> : null}
                  </span>
                </div>
                {r.state === "RAISED" && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-300" disabled={busy} onClick={() => decide.mutate({ id: r.id, approve: true })}>
                      <Check className="size-3.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-rose-700 border-rose-300" disabled={busy} onClick={() => decide.mutate({ id: r.id, approve: false })}>
                      <X className="size-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                )}
                {r.state === "APPROVED" && (
                  <Button size="sm" disabled={busy} onClick={() => applyReq.mutate(r.id)}>
                    <ArrowRight className="size-3.5 mr-1" /> Apply refund ({r.reason === "force_majeure" ? "credit" : "cash"})
                  </Button>
                )}
                {r.state === "APPLIED" && r.resolvedVia && (
                  <p className="text-xs text-muted-foreground">Applied via {r.resolvedVia === "force_majeure_credit" ? "carry-forward credit" : r.resolvedVia === "negative_receipt" ? "cash refund receipt" : r.resolvedVia}.</p>
                )}

                {/* WW-SETTLE - the venue's side of the settlement. A request that
                    still owes money by hand, or one the customer says never
                    arrived, both land here. */}
                {(r.state === "APPLIED" || r.state === "DISPUTED") && outstandingRefund(r) > 0 && (
                  payingId === r.id ? (
                    <div className="space-y-2 rounded-md border bg-muted/40 p-2.5">
                      <p className="text-xs text-muted-foreground">
                        Aap {rs(outstandingRefund(r))} customer ko de rahe hain. Yeh sirf aap ka bayan hai —
                        settle tab hoga jab customer khud tasdeeq karega.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={payMethod}
                          onChange={(e) => setPayMethod(e.target.value as VendorPaymentMethod)}
                          className="rounded-md border bg-transparent px-2 py-1.5 text-sm"
                        >
                          {PAY_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <input
                          value={payRef}
                          onChange={(e) => setPayRef(e.target.value)}
                          maxLength={120}
                          placeholder="Reference (transfer id, cheque no…)"
                          className="min-w-[12rem] flex-1 rounded-md border bg-transparent px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" disabled={busy}
                          onClick={() => markPaid.mutate({ id: r.id, method: payMethod, reference: payRef })}>
                          {markPaid.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <HandCoins className="size-3.5 mr-1" />}
                          Record karein
                        </Button>
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setPayingId(null); setPayRef(""); }}>
                          Rehne dein
                        </Button>
                      </div>
                      {markPaid.isError && (
                        <p className="text-xs text-rose-600 dark:text-rose-400">
                          Record nahi hua — dobara koshish karein.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => { setPayingId(r.id); setPayMethod("cash"); setPayRef(""); }}>
                        <HandCoins className="size-3.5 mr-1" /> Maine {rs(outstandingRefund(r))} de diye
                      </Button>
                      {r.state === "DISPUTED" && r.disputeNote && (
                        <span className="text-xs text-rose-600 dark:text-rose-400">&ldquo;{r.disputeNote}&rdquo;</span>
                      )}
                    </div>
                  )
                )}

                {r.state === "PAID_BY_VENDOR" && (
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Clock className="mt-0.5 size-3.5 shrink-0" />
                    Aap ne {rs(outstandingRefund(r))} dena record kiya
                    {r.vendorPaymentMethod ? ` (${PAY_METHODS.find((m) => m.value === r.vendorPaymentMethod)?.label ?? r.vendorPaymentMethod})` : ""}
                    {r.vendorPaymentRef ? ` — ${r.vendorPaymentRef}` : ""}.
                    Ab customer ki tasdeeq ka intezar hai; unki tasdeeq ke baghair yeh settle nahi hoga.
                  </p>
                )}

                {r.state === "ACKNOWLEDGED" && (
                  <p className="flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                    <Check className="mt-0.5 size-3.5 shrink-0" />
                    Customer ne tasdeeq kar di ke paisay mil gaye. Yeh refund mukammal hai.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Audit trail summary */}
        {evidence.data?.auditChain && evidence.data.auditChain.checked > 0 && (
          <p className="text-[11px] text-muted-foreground">
            {evidence.data.auditChain.verified ? "✓ Audit trail verified" : "⚠ Audit trail broken"} — {evidence.data.auditChain.events.length} events logged.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default CancellationActionsCard;
