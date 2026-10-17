"use client";

/**
 * Super-admin queue for the manual renewal route (bank transfer / JazzCash / Easypaisa with proof): the non-card way a
 * vendor pays for a plan. Approve = a 30-day period starts (chained from the previous period end), a receipt is issued
 * and the vendor is unlocked at once; Reject needs a reason, which goes to the vendor.
 * Endpoints: GET /subscriptions/admin/manual-payments?status=, POST .../:id/approve, POST .../:id/reject {reason}.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Banknote, Check, ImageOff, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { planNameOf } from "@/lib/plan-gate";
import { SubscriptionAPI } from "@/lib/api/subscription";
import {
  adminErrorMessage, approveManualPayment, listManualPayments, rejectManualPayment,
  type ManualPaymentRow, type ManualStatus,
} from "@/lib/api/billing-admin";

const fmtDate = (s: string | null) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" }); }
  catch { return s; }
};
const rs = (n: number | null | undefined) => (n == null ? "—" : `Rs ${Math.round(n).toLocaleString("en-PK")}`);
const METHOD_LABEL: Record<string, string> = { bank: "Bank transfer", jazzcash: "JazzCash", easypaisa: "Easypaisa" };

const STATUS_STYLE: Record<ManualStatus, { label: string; cls: string }> = {
  pending: { label: "Waiting", cls: "border-amber-200 bg-amber-50 text-amber-800" },
  approved: { label: "Approved", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  rejected: { label: "Rejected", cls: "border-rose-200 bg-rose-50 text-rose-800" },
};
const TABS: Array<{ key: ManualStatus; label: string }> = [
  { key: "pending", label: "Waiting" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function AdminManualPaymentsView() {
  const [status, setStatus] = useState<ManualStatus>("pending");
  const [rows, setRows] = useState<ManualPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [zoom, setZoom] = useState<string | null>(null);

  const load = useCallback((s: ManualStatus) => {
    setLoading(true);
    setFailed(false);
    listManualPayments(s)
      .then(setRows)
      .catch(() => { setFailed(true); toast.error("Could not load the payment proofs"); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(status); }, [status, load]);

  // The catalogue price of each plan, to set beside what the vendor says they paid.
  useEffect(() => {
    SubscriptionAPI.getMyPlan()
      .then((p) => setPrices(Object.fromEntries((p.plans ?? []).map((x) => [x.tier, x.pricePkrMonthly]))))
      .catch(() => { /* the amount is still shown; only the comparison is missing */ });
  }, []);

  const approve = async (r: ManualPaymentRow) => {
    setBusyId(r.id);
    try {
      const out = await approveManualPayment(r.id);
      toast.success(out.alreadyApproved ? "Already approved" : "Approved: the vendor is unlocked and has a receipt");
      setApprovingId(null);
      load(status);
    } catch (e) {
      toast.error(adminErrorMessage(e, "Could not approve"));
    } finally { setBusyId(null); }
  };
  const reject = async (r: ManualPaymentRow) => {
    setBusyId(r.id);
    try {
      await rejectManualPayment(r.id, reason.trim());
      toast.success("Rejected: the vendor has been told why");
      setRejectingId(null); setReason("");
      load(status);
    } catch (e) {
      toast.error(adminErrorMessage(e, "Could not reject"));
    } finally { setBusyId(null); }
  };

  const total = useMemo(() => rows.reduce((a, r) => a + (r.amountPkr || 0), 0), [rows]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="h-4 w-4 text-bridal-gold-dark" />
                Payment proofs
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Vendors who paid a plan by bank transfer, JazzCash or Easypaisa. Check the proof against your account, then approve; the vendor is unlocked at once with every record intact.
              </p>
            </div>
            <div className="flex items-center gap-1" role="tablist" aria-label="Payment status">
              {TABS.map((t) => (
                <Button key={t.key} size="sm" variant={status === t.key ? "default" : "outline"} className="h-8 text-xs" role="tab" aria-selected={status === t.key}
                  onClick={() => { setStatus(t.key); setApprovingId(null); setRejectingId(null); }}>
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          {!loading && !failed && rows.length > 0 && (
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[["Proofs", String(rows.length)], ["Amount", rs(total)], ["Status", STATUS_STYLE[status].label]].map(([k, v]) => (
                <div key={k} className="rounded-md border px-3 py-2">
                  <dt className="text-[11px] text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : failed ? (
            <div className="py-8 text-center">
              <p className="text-sm text-rose-700">The queue could not be loaded.</p>
              <Button size="sm" variant="outline" className="mt-2 h-8" onClick={() => load(status)}>Try again</Button>
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {status === "pending" ? "Nothing is waiting. New proofs appear here as vendors send them." : `No ${STATUS_STYLE[status].label.toLowerCase()} payments yet.`}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Sent</th>
                    <th className="py-2 pr-3 font-medium">Vendor</th>
                    <th className="py-2 pr-3 font-medium">Plan</th>
                    <th className="py-2 pr-3 font-medium">Paid via</th>
                    <th className="py-2 pr-3 font-medium">Amount</th>
                    <th className="py-2 pr-3 font-medium">Proof</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const st = STATUS_STYLE[r.status] || { label: r.status, cls: "" };
                    const price = prices[r.tier];
                    const matches = price != null && r.amountPkr != null && Math.round(price) === Math.round(r.amountPkr);
                    const busy = busyId === r.id;
                    return (
                      <React.Fragment key={r.id}>
                        <tr className="border-b last:border-0 align-top" data-testid="manual-row" data-status={r.status}>
                          <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums text-xs">{fmtDate(r.submittedAt)}</td>
                          <td className="py-2.5 pr-3">
                            <div className="font-medium">{r.vendor?.fullName || r.vendor?.email || `User #${r.userId}`}</div>
                            <div className="text-[11px] text-muted-foreground">{r.vendor?.email}{r.vendor?.phoneNumber ? ` · ${r.vendor.phoneNumber}` : ""}</div>
                          </td>
                          <td className="py-2.5 pr-3 whitespace-nowrap">{planNameOf(r.tier)}</td>
                          <td className="py-2.5 pr-3">
                            <div className="whitespace-nowrap">{METHOD_LABEL[r.method] || r.method}</div>
                            <div className="font-mono text-[11px] text-muted-foreground break-all">{r.reference}</div>
                          </td>
                          <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums">
                            <div className="font-medium">{rs(r.amountPkr)}</div>
                            {price != null && (
                              <div className={`text-[11px] ${matches ? "text-emerald-700" : "text-amber-800"}`}>
                                {matches ? "Matches the plan price" : `Plan price ${rs(price)}`}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 pr-3">
                            {r.proofUrl ? (
                              <button type="button" className="block" onClick={() => setZoom(r.proofUrl)} title="Open the proof" aria-label={`Open the proof for payment ${r.id}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={r.proofUrl} alt="Payment proof" className="h-14 w-14 rounded-md border object-cover" loading="lazy" />
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><ImageOff className="h-3.5 w-3.5" aria-hidden /> No image, check the reference</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-3">
                            <Badge variant="outline" className={`text-[10px] ${st.cls}`}>{st.label}</Badge>
                            {r.status === "approved" && (
                              <div className="mt-1 text-[11px] text-muted-foreground">{r.receiptNo ? `${r.receiptNo} · ` : ""}{fmtDate(r.decidedAt)}</div>
                            )}
                            {r.status === "rejected" && (
                              <div className="mt-1 max-w-[220px] text-[11px] text-muted-foreground">{r.rejectionReason || "No reason recorded"} · {fmtDate(r.decidedAt)}</div>
                            )}
                          </td>
                          <td className="py-2.5 text-right">
                            {r.status === "pending" && (
                              <div className="flex flex-wrap justify-end gap-1">
                                <Button size="sm" variant="outline" className="h-8 gap-1 text-emerald-700 border-emerald-200" disabled={busy}
                                  onClick={() => { setApprovingId(approvingId === r.id ? null : r.id); setRejectingId(null); }}>
                                  <Check className="h-3.5 w-3.5" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 gap-1 text-rose-700 border-rose-200" disabled={busy}
                                  onClick={() => { setRejectingId(rejectingId === r.id ? null : r.id); setApprovingId(null); setReason(""); }}>
                                  <X className="h-3.5 w-3.5" /> Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {approvingId === r.id && (
                          <tr className="border-b bg-emerald-50/40">
                            <td colSpan={8} className="px-2 py-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-emerald-900">
                                  Approve {rs(r.amountPkr)} for {r.vendor?.fullName || `user #${r.userId}`}: a 30-day {planNameOf(r.tier)} period starts, the vendor gets a receipt and is unlocked at once.
                                </span>
                                <Button size="sm" className="h-8" disabled={busy} onClick={() => approve(r)}>
                                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yes, approve"}
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8" onClick={() => setApprovingId(null)}>Keep waiting</Button>
                              </div>
                            </td>
                          </tr>
                        )}
                        {rejectingId === r.id && (
                          <tr className="border-b bg-rose-50/40">
                            <td colSpan={8} className="px-2 py-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Input className="h-8 min-w-[280px] max-w-xl flex-1 text-xs" placeholder="Reason (the vendor reads this)" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason for rejecting" />
                                <Button size="sm" className="h-8" disabled={busy || reason.trim().length < 3} onClick={() => reject(r)}>
                                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm reject"}
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8" onClick={() => setRejectingId(null)}>Keep waiting</Button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Payment proof" onClick={() => setZoom(null)}>
          <div className="relative max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoom} alt="Payment proof" className="max-h-[85vh] max-w-full rounded-md bg-white object-contain" />
            <Button size="sm" variant="secondary" className="absolute right-2 top-2 h-8" onClick={() => setZoom(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
