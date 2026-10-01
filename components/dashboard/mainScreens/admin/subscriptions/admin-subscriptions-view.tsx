"use client";

/**
 * Super-admin subscription-upgrade queue (§17.1). Closes the dead-end:
 * a vendor's "Upgrade" intent now appears here for a human to action.
 * Activate (sets tier + notifies vendor) or Decline (clears + notifies).
 * Offline settlement — no card flow here.
 */

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionAPI, type UpgradeRequestRow, type AdminSafepayLedger, type AdminSafepayRow, type AdminSafepayPaymentRow } from "@/lib/api/subscription";

// Same names the vendor sees on the plan cards (PLAN_CATALOG on the server).
const TIER_LABEL: Record<string, string> = { free: "Free", pro: "Basic", premium: "Pro", elite: "Premium" };
const fmtDate = (s: string | null) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return s; }
};
const fmtDay = (s: string | null) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return s; }
};
const pkr = (paisas: number | null | undefined) => (paisas == null ? "—" : `Rs ${Math.round(paisas / 100).toLocaleString("en-PK")}`);

const STATUS_STYLE: Record<AdminSafepayRow["status"], { label: string; cls: string }> = {
  active: { label: "Active", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  payment_failed: { label: "Past due", cls: "border-amber-200 bg-amber-50 text-amber-800" },
  paused: { label: "Paused", cls: "border-sky-200 bg-sky-50 text-sky-800" },
  pending: { label: "Pending", cls: "border-neutral-200 bg-neutral-50 text-neutral-700" },
  abandoned: { label: "Abandoned", cls: "border-neutral-200 bg-white text-neutral-500" },
  cancelled: { label: "Cancelled", cls: "border-rose-200 bg-rose-50 text-rose-800" },
  superseded: { label: "Superseded", cls: "border-neutral-200 bg-white text-neutral-500" },
  lapsed: { label: "Lapsed", cls: "border-neutral-200 bg-white text-neutral-500" },
};

type LedgerAction = "cancel" | "pause" | "resume" | "reconcile";

/** Every Safepay subscription row, with the numbers an owner looks at first, and the actions on each. */
function SafepayLedger({ ledger, loading, busyId, onAction, onReconcileAll, reconcilingAll, onResetSandbox, resettingSandbox }: {
  ledger: AdminSafepayLedger | null; loading: boolean; busyId: number | null;
  onAction: (row: AdminSafepayRow, action: LedgerAction, body?: Record<string, unknown>) => void;
  onReconcileAll: () => void; reconcilingAll: boolean;
  onResetSandbox: () => void; resettingSandbox: boolean;
}) {
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const rows = ledger?.subscriptions ?? [];
  const count = (s: AdminSafepayRow["status"]) => rows.filter((r) => r.status === s).length;
  const mrrPaisas = rows.filter((r) => r.status === "active" || r.status === "payment_failed").reduce((a, r) => a + (r.amountPaisas || 0), 0);
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-bridal-gold-dark" />
              Safepay subscriptions
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Every paid plan, set only by Safepay webhooks. Receipts are on each vendor&apos;s Billing page.
            </p>
          </div>
          {ledger && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className={`text-[10px] ${ledger.environment === "sandbox" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                {ledger.environment === "sandbox" ? "Sandbox" : "Live"}
              </Badge>
              <Badge variant="outline" className="text-[10px]">{ledger.enforced ? "Paywall on" : "Paywall off"}</Badge>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={reconcilingAll} onClick={onReconcileAll} title="Compare every live row with Safepay and repair a missed webhook">
                {reconcilingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Sync with Safepay
              </Button>
              {ledger.environment === "sandbox" && (
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-rose-700 border-rose-200" disabled={resettingSandbox} onClick={() => setConfirmReset((v) => !v)} title="Before live keys go in: cancel sandbox subscriptions at Safepay, delete sandbox rows, return test vendors to free">
                  Clear sandbox data
                </Button>
              )}
            </div>
          )}
        {confirmReset && ledger?.environment === "sandbox" && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-rose-200 bg-rose-50/50 px-3 py-2 text-xs text-rose-900">
            <span>This cancels every sandbox subscription at Safepay, deletes all sandbox subscriptions, receipts and webhook events, and returns the affected vendors to the free tier. Live data is never touched. Do this once, right before the live keys go in.</span>
            <Button size="sm" className="h-7" disabled={resettingSandbox} onClick={() => { onResetSandbox(); setConfirmReset(false); }}>
              {resettingSandbox ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yes, clear sandbox data"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7" onClick={() => setConfirmReset(false)}>Keep</Button>
          </div>
        )}
        </div>
        {!loading && rows.length > 0 && (
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["Monthly revenue", pkr(mrrPaisas)],
              ["Active", String(count("active"))],
              ["Past due", String(count("payment_failed"))],
              ["Pending", String(count("pending"))],
              ["Cancelled", String(count("cancelled"))],
            ].map(([k, v]) => (
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
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No Safepay subscriptions yet — nothing has been charged.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Vendor</th>
                  <th className="py-2 pr-3 font-medium">Plan</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Monthly</th>
                  <th className="py-2 pr-3 font-medium">Paid until</th>
                  <th className="py-2 pr-3 font-medium">Last event</th>
                  <th className="py-2 pr-3 font-medium">Reference</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const st = STATUS_STYLE[r.status] || { label: r.status, cls: "" };
                  const live = r.status === "active" || r.status === "payment_failed";
                  const busy = busyId === r.id;
                  return (
                    <React.Fragment key={r.id}>
                    <tr className="border-b last:border-0 align-top">
                      <td className="py-2.5 pr-3">
                        <div className="font-medium">{r.user?.fullName || r.user?.email || `User #${r.userId}`}</div>
                        <div className="text-[11px] text-muted-foreground">{r.user?.email}{r.user?.phoneNumber ? ` · ${r.user.phoneNumber}` : ""}</div>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">{TIER_LABEL[r.tier] || r.tier}</td>
                      <td className="py-2.5 pr-3"><Badge variant="outline" className={`text-[10px] ${st.cls}`}>{st.label}</Badge></td>
                      <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums">{pkr(r.amountPaisas)}</td>
                      <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums">{fmtDay(r.currentPeriodEndsAt)}</td>
                      <td className="py-2.5 pr-3">
                        <div className="whitespace-nowrap">{r.lastEventType || "—"}</div>
                        <div className="text-[11px] text-muted-foreground whitespace-nowrap">{fmtDate(r.lastEventAt)}</div>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[11px] text-muted-foreground">
                        <div>{r.reference}</div>
                        {r.safepaySubscriptionId && <div>{r.safepaySubscriptionId}</div>}
                        {r.cancelledBy && <div className="font-sans text-[11px]">Cancelled by {r.cancelledBy}{r.cancelReason ? `: ${r.cancelReason}` : ""}</div>}
                        {!!r.creditDays && <div className="font-sans text-[11px]">+{r.creditDays} credit days from the previous plan</div>}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          {live && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy} onClick={() => onAction(r, "pause")}>Pause</Button>
                          )}
                          {r.status === "paused" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy} onClick={() => onAction(r, "resume")}>Resume</Button>
                          )}
                          {(live || r.status === "paused" || r.status === "pending") && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-rose-700 border-rose-200" disabled={busy}
                              onClick={() => { setCancellingId(cancellingId === r.id ? null : r.id); setCancelReason(""); }}>Cancel</Button>
                          )}
                          {r.safepaySubscriptionId && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busy} onClick={() => onAction(r, "reconcile")} title="Re-read this subscription from Safepay">
                              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Sync"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {cancellingId === r.id && (
                      <tr className="border-b bg-rose-50/40">
                        <td colSpan={8} className="px-2 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-rose-800">Cancel at Safepay now; the vendor keeps access until {fmtDay(r.currentPeriodEndsAt)}.</span>
                            <Input className="h-8 max-w-xs text-xs" placeholder="Reason (kept on the row)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                            <Button size="sm" className="h-8" disabled={busy} onClick={() => { onAction(r, "cancel", { reason: cancelReason.trim() }); setCancellingId(null); }}>
                              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm cancel"}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8" onClick={() => setCancellingId(null)}>Keep</Button>
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
  );
}

/** Every charge, with refunds recorded against receipts. The money itself moves in Safepay's dashboard. */
function SafepayPayments({ payments, loading, busyId, onRefund }: {
  payments: AdminSafepayPaymentRow[]; loading: boolean; busyId: number | null;
  onRefund: (p: AdminSafepayPaymentRow, body: { amountPaisas: number; reason?: string; ref?: string }) => void;
}) {
  const [refundingId, setRefundingId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [ref, setRef] = useState("");
  const totalPaisas = payments.reduce((a, p) => a + (p.amountPaisas || 0), 0);
  const refundedPaisas = payments.reduce((a, p) => a + (p.refundedPaisas || 0), 0);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4 text-bridal-gold-dark" />
          Payments &amp; refunds
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          One row per successful charge, newest first. Recording a refund here updates the receipt and tells the vendor; return the money from the Safepay dashboard (Payments → the transaction).
        </p>
        {!loading && payments.length > 0 && (
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[["Collected", pkr(totalPaisas)], ["Refunded", pkr(refundedPaisas)], ["Charges", String(payments.length)]].map(([k, v]) => (
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
          <Skeleton className="h-32 w-full" />
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No charges yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Paid</th>
                  <th className="py-2 pr-3 font-medium">Vendor</th>
                  <th className="py-2 pr-3 font-medium">Receipt</th>
                  <th className="py-2 pr-3 font-medium">Plan</th>
                  <th className="py-2 pr-3 font-medium">Amount</th>
                  <th className="py-2 pr-3 font-medium">Period</th>
                  <th className="py-2 pr-3 font-medium">Refunded</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const busy = busyId === p.id;
                  const left = (p.amountPaisas || 0) - (p.refundedPaisas || 0);
                  return (
                    <React.Fragment key={p.id}>
                      <tr className="border-b last:border-0 align-top">
                        <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums">{fmtDay(p.paidAt)}</td>
                        <td className="py-2.5 pr-3">
                          <div className="font-medium">{p.user?.fullName || p.user?.email || "—"}</div>
                          <div className="text-[11px] text-muted-foreground">{p.user?.email}</div>
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-[11px] whitespace-nowrap">{p.receiptNo}<div className="text-muted-foreground">{p.transactionId}</div></td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">{TIER_LABEL[p.tier] || p.tier}</td>
                        <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums">{pkr(p.amountPaisas)}</td>
                        <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums">{fmtDay(p.periodStart)} – {fmtDay(p.periodEnd)}</td>
                        <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums">
                          {p.refundedPaisas ? <span className="text-amber-800">{pkr(p.refundedPaisas)}{p.refundedAt ? ` · ${fmtDay(p.refundedAt)}` : ""}</span> : "—"}
                          {p.refundReason && <div className="text-[11px] text-muted-foreground">{p.refundReason}</div>}
                        </td>
                        <td className="py-2.5 text-right">
                          {left > 0 && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy}
                              onClick={() => { setRefundingId(refundingId === p.id ? null : p.id); setAmount(String(Math.round(left / 100))); setReason(""); setRef(""); }}>
                              Record refund
                            </Button>
                          )}
                        </td>
                      </tr>
                      {refundingId === p.id && (
                        <tr className="border-b bg-amber-50/40">
                          <td colSpan={8} className="px-2 py-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-amber-900">Up to {pkr(left)}.</span>
                              <Input className="h-8 w-28 text-xs" type="number" min={1} max={Math.round(left / 100)} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Rs" />
                              <Input className="h-8 max-w-[220px] text-xs" placeholder="Reason (sent to the vendor)" value={reason} onChange={(e) => setReason(e.target.value)} />
                              <Input className="h-8 max-w-[200px] text-xs" placeholder="Safepay refund reference" value={ref} onChange={(e) => setRef(e.target.value)} />
                              <Button size="sm" className="h-8" disabled={busy || !(Number(amount) > 0)}
                                onClick={() => { onRefund(p, { amountPaisas: Math.round(Number(amount) * 100), reason: reason.trim() || undefined, ref: ref.trim() || undefined }); setRefundingId(null); }}>
                                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Record"}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8" onClick={() => setRefundingId(null)}>Keep</Button>
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
  );
}

export default function AdminSubscriptionsView() {
  const [rows, setRows] = useState<UpgradeRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [decliningId, setDecliningId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [ledger, setLedger] = useState<AdminSafepayLedger | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(true);

  const load = () => {
    setLoading(true);
    SubscriptionAPI.listUpgradeRequests()
      .then(setRows)
      .catch(() => toast.error("Could not load upgrade requests"))
      .finally(() => setLoading(false));
  };
  const loadLedger = () => {
    setLedgerLoading(true);
    SubscriptionAPI.adminListSafepaySubscriptions()
      .then(setLedger)
      .catch(() => toast.error("Could not load Safepay subscriptions"))
      .finally(() => setLedgerLoading(false));
  };
  const [payments, setPayments] = useState<AdminSafepayPaymentRow[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const loadPayments = () => {
    setPaymentsLoading(true);
    SubscriptionAPI.adminListPayments()
      .then(setPayments)
      .catch(() => toast.error("Could not load payments"))
      .finally(() => setPaymentsLoading(false));
  };
  useEffect(() => { load(); loadLedger(); loadPayments(); }, []);

  const [ledgerBusyId, setLedgerBusyId] = useState<number | null>(null);
  const [reconcilingAll, setReconcilingAll] = useState(false);
  const ledgerAction = async (row: AdminSafepayRow, action: LedgerAction, body: Record<string, unknown> = {}) => {
    setLedgerBusyId(row.id);
    try {
      const r = await SubscriptionAPI.adminSubscriptionAction(row.id, action, body);
      toast.success(r.message || "Done");
      loadLedger();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || `Could not ${action}`);
    } finally { setLedgerBusyId(null); }
  };
  const reconcileAll = async () => {
    setReconcilingAll(true);
    try {
      const r = await SubscriptionAPI.adminReconcileAll();
      toast.success(`Checked ${r.checked}, changed ${r.changed}, failed ${r.failed}`);
      loadLedger();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Sync failed");
    } finally { setReconcilingAll(false); }
  };
  const [resettingSandbox, setResettingSandbox] = useState(false);
  const resetSandbox = async () => {
    setResettingSandbox(true);
    try {
      const r = await SubscriptionAPI.adminResetSandbox();
      toast.success(r.message || "Sandbox data cleared");
      if (r.result?.cancelFailed?.length) toast.error(`Could not cancel at Safepay: ${r.result.cancelFailed.join("; ")}`);
      loadLedger(); loadPayments(); load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not clear sandbox data");
    } finally { setResettingSandbox(false); }
  };
  const [refundBusyId, setRefundBusyId] = useState<number | null>(null);
  const recordRefund = async (p: AdminSafepayPaymentRow, body: { amountPaisas: number; reason?: string; ref?: string }) => {
    setRefundBusyId(p.id);
    try {
      await SubscriptionAPI.adminRecordRefund(p.id, body);
      toast.success("Refund recorded on the receipt; the vendor has been told. Now return the money from the Safepay dashboard.");
      loadPayments();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not record the refund");
    } finally { setRefundBusyId(null); }
  };

  const activate = async (id: number) => {
    setBusyId(id);
    try {
      await SubscriptionAPI.activate(id);
      toast.success("Plan activated — vendor notified");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not activate");
    } finally { setBusyId(null); }
  };

  const doDecline = async (id: number) => {
    setBusyId(id);
    try {
      await SubscriptionAPI.decline(id, reason.trim());
      toast.success("Declined — vendor notified");
      setDecliningId(null); setReason("");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not decline");
    } finally { setBusyId(null); }
  };

  return (
    <div className="space-y-4">
    <SafepayLedger ledger={ledger} loading={ledgerLoading} busyId={ledgerBusyId} onAction={ledgerAction} onReconcileAll={reconcileAll} reconcilingAll={reconcilingAll} onResetSandbox={resetSandbox} resettingSandbox={resettingSandbox} />
    <SafepayPayments payments={payments} loading={paymentsLoading} busyId={refundBusyId} onRefund={recordRefund} />
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4 text-bridal-gold-dark" />
          Pending plan upgrades (manual)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Vendors who requested a plan upgrade. Confirm payment offline, then activate —
          the vendor is notified automatically.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No pending upgrade requests.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{r.fullName || r.email || `User #${r.id}`}</span>
                      <Badge variant="outline" className="text-[10px]">{TIER_LABEL[r.subscriptionTier] || r.subscriptionTier}</Badge>
                      <span className="text-muted-foreground text-xs">→</span>
                      <Badge variant="outline" className="text-[10px] bg-bridal-gold-dark/5 border-bridal-gold-dark/30 text-bridal-gold-dark">
                        {TIER_LABEL[r.pendingUpgradeTier] || r.pendingUpgradeTier}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {r.vendorType ? `${r.vendorType} · ` : ""}{r.email}{r.phoneNumber ? ` · ${r.phoneNumber}` : ""} · requested {fmtDate(r.upgradeRequestedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" className="h-8 gap-1 text-emerald-700 border-emerald-200"
                      disabled={busyId === r.id} onClick={() => activate(r.id)}>
                      {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Activate
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 gap-1 text-rose-700 border-rose-200"
                      disabled={busyId === r.id} onClick={() => { setDecliningId(decliningId === r.id ? null : r.id); setReason(""); }}>
                      <X className="h-3.5 w-3.5" /> Decline
                    </Button>
                  </div>
                </div>
                {decliningId === r.id && (
                  <div className="flex items-center gap-2 pt-1">
                    <Input className="h-8 text-xs" placeholder="Reason (sent to vendor as a notification)" value={reason}
                      onChange={(e) => setReason(e.target.value)} />
                    <Button size="sm" className="h-8" disabled={busyId === r.id} onClick={() => doDecline(r.id)}>
                      {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm"}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
