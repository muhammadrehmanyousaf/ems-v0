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
import { Shield, ShieldAlert, ShieldCheck, Loader2, Check, X, ArrowRight } from "lucide-react";
import {
  getPolicyAcceptance, recordPolicyAcceptance, listRefundRequests, raiseRefundRequest,
  decideRefundRequest, applyRefundRequest, getDisputeEvidence,
  type RefundRequestRow, type RefundState,
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
const STATE_STYLE: Record<RefundState, string> = {
  RAISED: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  APPLIED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  REJECTED: "bg-muted text-muted-foreground",
};

export function CancellationActionsCard({ bookingId }: { bookingId: number }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("customer_cancel");

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
  const busy = accept.isPending || raise.isPending || decide.isPending || applyReq.isPending;

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
            )} title="Legal defensibility: policy accepted + audit chain verified">
              {exposure.flag === "OK" ? <ShieldCheck className="size-3" /> : <ShieldAlert className="size-3" />}
              {exposure.flag === "OK" ? "Defensible" : "Review"}
            </span>
          )}
        </div>

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
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STATE_STYLE[r.state])}>{r.state}</span>
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
