"use client";

/**
 * Super-admin promotion review queue (§5). Approve (flips the
 * business sponsored for the window) or reject (with reason). Filter
 * by status. Shows the requesting business + vendor + quality signals
 * (city, rating) so the reviewer can judge eligibility.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Megaphone, Check, X, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import {
  PromotionsAPI,
  PLACEMENT_LABEL,
  type PromotionRequestRow,
  type PromotionStatus,
} from "@/lib/api/promotions";

const fmtPKR = (n: number | string | null | undefined) =>
  n == null ? "—" : `Rs ${Math.round(Number(n)).toLocaleString("en-PK")}`;
const fmtDate = (s: string | null) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return s; }
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-50 border-amber-200 text-amber-800",
  approved: "bg-emerald-50 border-emerald-200 text-emerald-800",
  rejected: "bg-rose-50 border-rose-200 text-rose-800",
  expired: "bg-neutral-100 border-neutral-300 text-neutral-600",
  cancelled: "bg-neutral-100 border-neutral-300 text-neutral-600",
};

export default function AdminPromotionsView() {
  const [requests, setRequests] = useState<PromotionRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PromotionStatus | "all">("pending");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const load = (status: PromotionStatus | "all" = filter) => {
    setLoading(true);
    PromotionsAPI.queue(status)
      .then(setRequests)
      .catch(() => toast.error("Could not load queue"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(filter); /* eslint-disable-next-line */ }, [filter]);

  const approve = async (id: number) => {
    setBusyId(id);
    try {
      await PromotionsAPI.approve(id);
      toast.success("Approved — business is now featured");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not approve");
    } finally {
      setBusyId(null);
    }
  };

  const doReject = async (id: number) => {
    setBusyId(id);
    try {
      await PromotionsAPI.reject(id, reason.trim());
      toast.success("Rejected");
      setRejectingId(null);
      setReason("");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not reject");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="h-4 w-4 text-bridal-gold-dark" />
          Promotion requests
        </CardTitle>
        <Select value={filter} onValueChange={(v) => setFilter(v as PromotionStatus | "all")}>
          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No {filter === "all" ? "" : filter} requests.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{r.business?.name || `Business #${r.businessId}`}</span>
                      <Badge variant="outline" className="text-[10px]">{PLACEMENT_LABEL[r.placement]}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[r.status] || ""}`}>{r.status}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {r.windowDays}d · {fmtPKR(r.priceQuoted)}
                      {r.business?.city && ` · ${r.business.city}`}
                      {r.business?.rating != null && ` · ${Number(r.business.rating).toFixed(1)}★`}
                      {r.requestedBy && ` · ${r.requestedBy.fullName || r.requestedBy.email}`}
                      {` · ${fmtDate(r.createdAt)}`}
                    </p>
                    {r.note && <p className="text-[11px] text-foreground mt-1 italic">&ldquo;{r.note}&rdquo;</p>}
                    {r.status === "approved" && r.endsAt && (
                      <p className="text-[11px] text-emerald-700 mt-0.5">Live until {fmtDate(r.endsAt)}</p>
                    )}
                    {r.status === "rejected" && r.rejectionReason && (
                      <p className="text-[11px] text-rose-700 mt-0.5">Reason: {r.rejectionReason}</p>
                    )}
                  </div>
                  {r.status === "pending" && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-emerald-700 border-emerald-200"
                        disabled={busyId === r.id} onClick={() => approve(r.id)}>
                        {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-rose-700 border-rose-200"
                        disabled={busyId === r.id} onClick={() => { setRejectingId(rejectingId === r.id ? null : r.id); setReason(""); }}>
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
                {rejectingId === r.id && (
                  <div className="flex items-center gap-2 pt-1">
                    <Input className="h-8 text-xs" placeholder="Rejection reason (emailed to vendor)" value={reason}
                      onChange={(e) => setReason(e.target.value)} />
                    <Button size="sm" className="h-8" disabled={busyId === r.id} onClick={() => doReject(r.id)}>
                      {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm reject"}
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
