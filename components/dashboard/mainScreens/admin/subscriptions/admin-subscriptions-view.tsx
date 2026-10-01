"use client";

/**
 * Super-admin subscription-upgrade queue (§17.1). Closes the dead-end:
 * a vendor's "Upgrade" intent now appears here for a human to action.
 * Activate (sets tier + notifies vendor) or Decline (clears + notifies).
 * Offline settlement — no card flow here.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionAPI, type UpgradeRequestRow, type AdminSafepayLedger, type AdminSafepayRow } from "@/lib/api/subscription";

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
  pending: { label: "Pending", cls: "border-neutral-200 bg-neutral-50 text-neutral-700" },
  cancelled: { label: "Cancelled", cls: "border-rose-200 bg-rose-50 text-rose-800" },
  superseded: { label: "Superseded", cls: "border-neutral-200 bg-white text-neutral-500" },
  lapsed: { label: "Lapsed", cls: "border-neutral-200 bg-white text-neutral-500" },
};

/** Every Safepay subscription row, with the numbers an owner looks at first. */
function SafepayLedger({ ledger, loading }: { ledger: AdminSafepayLedger | null; loading: boolean }) {
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
                  <th className="py-2 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const st = STATUS_STYLE[r.status] || { label: r.status, cls: "" };
                  return (
                    <tr key={r.id} className="border-b last:border-0 align-top">
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
                      <td className="py-2.5 font-mono text-[11px] text-muted-foreground">
                        <div>{r.reference}</div>
                        {r.safepaySubscriptionId && <div>{r.safepaySubscriptionId}</div>}
                      </td>
                    </tr>
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
  useEffect(() => { load(); loadLedger(); }, []);

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
    <SafepayLedger ledger={ledger} loading={ledgerLoading} />
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
