"use client";

/**
 * Vendor promotion request (§5). Pick a placement + window, see the
 * indicative price, submit → goes to the super-admin review queue.
 * Shows the vendor's own request history + live status.
 *
 * Flag NEXT_PUBLIC_PROMOTIONS (default OFF). No payment integration
 * yet (D7) — price is indicative; approval is manual by super-admin.
 */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Megaphone, Loader2, CheckCircle2, Clock, XCircle, Star } from "lucide-react";
import { toast } from "sonner";
import {
  PromotionsAPI,
  PLACEMENT_LABEL,
  type PromotionPlacement,
  type PromotionRequestRow,
  type PricingPlacement,
} from "@/lib/api/promotions";
import { BusinessesAPI, type ApiBusiness } from "@/lib/api/dashboard";

const fmtPKR = (n: number | string | null | undefined) =>
  n == null ? "—" : `Rs ${Math.round(Number(n)).toLocaleString("en-PK")}`;
const fmtDate = (s: string | null) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return s; }
};

const STATUS_BADGE: Record<string, { tone: string; icon: React.ReactNode; label: string }> = {
  pending: { tone: "bg-amber-50 border-amber-200 text-amber-800", icon: <Clock className="h-3 w-3" />, label: "Pending review" },
  approved: { tone: "bg-emerald-50 border-emerald-200 text-emerald-800", icon: <CheckCircle2 className="h-3 w-3" />, label: "Approved · live" },
  rejected: { tone: "bg-rose-50 border-rose-200 text-rose-800", icon: <XCircle className="h-3 w-3" />, label: "Rejected" },
  expired: { tone: "bg-neutral-100 border-neutral-300 text-neutral-600", icon: <Clock className="h-3 w-3" />, label: "Expired" },
  cancelled: { tone: "bg-neutral-100 border-neutral-300 text-neutral-600", icon: <XCircle className="h-3 w-3" />, label: "Cancelled" },
};

export default function PromoteView() {
  const [businesses, setBusinesses] = useState<ApiBusiness[]>([]);
  const [requests, setRequests] = useState<PromotionRequestRow[]>([]);
  const [pricing, setPricing] = useState<PricingPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [placement, setPlacement] = useState<PromotionPlacement>("homepage");
  const [windowDays, setWindowDays] = useState(7);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([BusinessesAPI.getUserBusinesses(), PromotionsAPI.listMine()])
      .then(([biz, mine]) => {
        setBusinesses(biz);
        if (biz.length === 1) setBusinessId(biz[0].id);
        setRequests(mine.requests);
        setPricing(mine.pricing);
      })
      .catch(() => toast.error("Could not load promotions"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const price = useMemo(() => {
    const p = pricing.find((x) => x.placement === placement);
    return p?.prices.find((pr) => pr.windowDays === windowDays)?.priceQuoted ?? null;
  }, [pricing, placement, windowDays]);

  const submit = async () => {
    if (!businessId) { toast.error("Pick a business"); return; }
    setSubmitting(true);
    try {
      await PromotionsAPI.create({ businessId, placement, windowDays, note: note.trim() || undefined });
      toast.success("Promotion requested — pending review");
      setNote("");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      {/* Request form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-bridal-gold-dark" />
            Promote your business
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Get featured placement on the marketplace. Submit a request → our team
            reviews → your business surfaces with a Featured ribbon for the window.
            Prices are indicative; we&apos;ll confirm before going live.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {businesses.length === 0 ? (
            <p className="text-sm text-rose-700">Create a business first.</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Business</Label>
                  <Select value={businessId != null ? String(businessId) : ""} onValueChange={(v) => setBusinessId(Number(v))}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Pick a business" /></SelectTrigger>
                    <SelectContent>
                      {businesses.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Placement</Label>
                  <Select value={placement} onValueChange={(v) => setPlacement(v as PromotionPlacement)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PLACEMENT_LABEL) as PromotionPlacement[]).map((p) => (
                        <SelectItem key={p} value={p}>{PLACEMENT_LABEL[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Window</Label>
                <div className="flex gap-2">
                  {[7, 15, 30].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWindowDays(w)}
                      className={`flex-1 rounded-md border p-2.5 text-center transition-colors ${
                        windowDays === w
                          ? "border-bridal-gold-dark bg-bridal-gold-dark/5"
                          : "border-muted hover:border-muted-foreground/40"
                      }`}
                    >
                      <div className="text-sm font-semibold">{w} days</div>
                      <div className="text-[11px] text-muted-foreground tabular-nums">
                        {fmtPKR(pricing.find((x) => x.placement === placement)?.prices.find((pr) => pr.windowDays === w)?.priceQuoted)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Note (optional)</Label>
                <Textarea rows={2} value={note} placeholder="Anything our team should know (offer details, preferred dates…)" onChange={(e) => setNote(e.target.value)} />
              </div>

              <div className="flex items-center justify-between rounded-md bg-muted/40 p-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Indicative price:</span>{" "}
                  <span className="font-bold text-bridal-gold-dark tabular-nums">{fmtPKR(price)}</span>
                  <span className="text-muted-foreground"> · {PLACEMENT_LABEL[placement]} · {windowDays}d</span>
                </div>
                <Button onClick={submit} disabled={submitting || !businessId}>
                  {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Request promotion
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* My requests */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">My promotion requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-xs text-muted-foreground">No requests yet.</p>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => {
                const sb = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
                return (
                  <div key={r.id} className="rounded-md border p-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{PLACEMENT_LABEL[r.placement]}</span>
                        <Badge variant="outline" className={`text-[10px] gap-1 ${sb.tone}`}>
                          {sb.icon}{sb.label}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {r.business?.name || `Business #${r.businessId}`} · {r.windowDays}d · {fmtPKR(r.priceQuoted)}
                        {r.status === "approved" && r.endsAt && ` · live until ${fmtDate(r.endsAt)}`}
                        {r.status === "rejected" && r.rejectionReason && ` · ${r.rejectionReason}`}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{fmtDate(r.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
