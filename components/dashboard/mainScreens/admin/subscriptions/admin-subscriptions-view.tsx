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
import { SubscriptionAPI, type UpgradeRequestRow } from "@/lib/api/subscription";

const TIER_LABEL: Record<string, string> = { free: "Khata Lite", pro: "Business", premium: "Growth" };
const fmtDate = (s: string | null) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return s; }
};

export default function AdminSubscriptionsView() {
  const [rows, setRows] = useState<UpgradeRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [decliningId, setDecliningId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const load = () => {
    setLoading(true);
    SubscriptionAPI.listUpgradeRequests()
      .then(setRows)
      .catch(() => toast.error("Could not load upgrade requests"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4 text-bridal-gold-dark" />
          Pending plan upgrades
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
  );
}
