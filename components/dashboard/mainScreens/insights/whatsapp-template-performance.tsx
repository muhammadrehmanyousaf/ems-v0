"use client";

/**
 * WhatsApp template performance (Insights extension).
 *
 * Decision D3 keeps us on free wa.me — we can't observe replies. So
 * we measure the closest thing: every "Send" click is logged
 * (templateKey + targetId), then joined to Lead + Booking outcomes.
 * The vendor sees:
 *   - which templates they actually use (sends per template)
 *   - of templates sent to a LEAD, what % of those leads booked
 *   - of templates sent on a BOOKING, what % reached Completed + Paid
 *   - where each template is used (customer / booking / sheet / lead /
 *     free) so the vendor can spot mis-targeted templates
 *   - a "last 8 sends" sanity strip ("did my last send go through?")
 */

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle, Send, Trophy, Target, Clock,
} from "lucide-react";
import {
  WhatsappAnalyticsAPI,
  type WhatsappTemplatePerformanceData,
  type WaTargetType,
} from "@/lib/api/whatsapp";

const TARGET_LABEL: Record<WaTargetType, string> = {
  lead: "Lead",
  customer: "Customer",
  booking: "Booking",
  sheet: "Quote sheet",
  free: "Custom",
};
const TARGET_TONE: Record<WaTargetType, string> = {
  lead: "bg-purple-50 border-purple-200 text-purple-800",
  customer: "bg-blue-50 border-blue-200 text-blue-800",
  booking: "bg-emerald-50 border-emerald-200 text-emerald-800",
  sheet: "bg-amber-50 border-amber-200 text-amber-800",
  free: "bg-neutral-100 border-neutral-300 text-neutral-700",
};

function fmtDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "numeric", month: "short",
    });
  } catch { return iso; }
}
function fmtDateTimeRel(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
    return fmtDateShort(iso);
  } catch { return iso; }
}

export default function WhatsAppTemplatePerformance() {
  const [data, setData] = useState<WhatsappTemplatePerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    WhatsappAnalyticsAPI.getTemplatePerformance("last_90_days")
      .then((r) => setData(r))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-72 w-full" />;

  if (!data || !data.hasData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            WhatsApp template performance
          </CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Track which templates you actually use + correlate to bookings.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border-dashed border bg-muted/20 p-6 text-center text-xs text-muted-foreground">
            <p>No WhatsApp sends in the last 90 days yet.</p>
            <p className="mt-1">
              Every time you click <strong>Open WhatsApp</strong> on a
              customer or booking, a send is logged. Performance will
              fill in here as you message customers.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const top = data.templates[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <MessageCircle className="h-4 w-4 text-emerald-600" />
          WhatsApp template performance · last 90 days
        </CardTitle>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          One log per &quot;Open WhatsApp&quot; click, joined to Lead → booked /
          Booking → Completed outcomes. Free wa.me means we can&apos;t see
          replies — so this is the closest signal to template effectiveness.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hero */}
        <div className="grid gap-2 md:grid-cols-3">
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              <Send className="inline h-3 w-3 mr-0.5" /> Total sends
            </p>
            <p className="text-2xl font-bold tabular-nums leading-tight">
              {data.totalSends}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              across {data.uniqueTemplates ?? data.templates.length} template{(data.uniqueTemplates ?? data.templates.length) === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
            <p className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold">
              <Trophy className="inline h-3 w-3 mr-0.5" /> Most-used
            </p>
            <p className="text-lg font-bold text-emerald-700 leading-tight truncate">
              {top?.templateLabel || "—"}
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5 tabular-nums">
              {top?.sends || 0} send{top?.sends === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-md bg-bridal-gold-dark/5 border border-bridal-gold-dark/20 p-3">
            <p className="text-[10px] uppercase tracking-wide text-bridal-gold-dark font-semibold">
              <Target className="inline h-3 w-3 mr-0.5" /> Where you message
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {data.byTargetType.map((t) => (
                <Badge key={t.type} variant="outline"
                  className={`text-[10px] ${TARGET_TONE[t.type as WaTargetType] || ""}`}>
                  {TARGET_LABEL[t.type as WaTargetType] || t.type} ·{" "}
                  <span className="ml-0.5 font-bold tabular-nums">{t.count}</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Per-template table */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Per-template effectiveness
          </p>
          <div className="rounded-md border overflow-hidden">
            <div className="grid grid-cols-6 px-3 py-1.5 bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              <div className="col-span-2">Template</div>
              <div className="text-right">Sends</div>
              <div className="text-right">Lead → booked</div>
              <div className="text-right">Booking → paid</div>
              <div className="text-right">Last send</div>
            </div>
            {data.templates.map((t) => {
              const lbTone =
                t.leadBookedRate == null ? "text-muted-foreground" :
                t.leadBookedRate >= 30 ? "text-emerald-700" :
                t.leadBookedRate >= 15 ? "text-blue-700" :
                "text-amber-700";
              const bpTone =
                t.bookingPaidRate == null ? "text-muted-foreground" :
                t.bookingPaidRate >= 75 ? "text-emerald-700" :
                t.bookingPaidRate >= 40 ? "text-blue-700" :
                "text-amber-700";
              return (
                <div key={t.templateKey} className="grid grid-cols-6 px-3 py-2 text-xs border-t items-center">
                  <div className="col-span-2 font-medium truncate" title={t.templateLabel}>
                    {t.templateLabel}
                    <span className="ml-1.5 text-[10px] text-muted-foreground font-mono">
                      {t.templateKey}
                    </span>
                  </div>
                  <div className="text-right tabular-nums font-semibold">
                    {t.sends}
                  </div>
                  <div className={`text-right tabular-nums font-semibold ${lbTone}`}>
                    {t.leadBookedRate == null
                      ? "—"
                      : `${t.leadBookedRate.toFixed(1)}%`}
                    <span className="text-muted-foreground font-normal ml-1 text-[10px]">
                      ({t.leadBooked}/{t.leadLinked})
                    </span>
                  </div>
                  <div className={`text-right tabular-nums font-semibold ${bpTone}`}>
                    {t.bookingPaidRate == null
                      ? "—"
                      : `${t.bookingPaidRate.toFixed(1)}%`}
                    <span className="text-muted-foreground font-normal ml-1 text-[10px]">
                      ({t.bookingPaid}/{t.bookingLinked})
                    </span>
                  </div>
                  <div className="text-right text-muted-foreground">
                    {fmtDateTimeRel(t.lastSentAt)}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            * Rates use only sends linked to a specific lead/booking. Free
            messages (no link) aren&apos;t in the denominator.
          </p>
        </div>

        {/* Recent sends timeline */}
        {data.recentSends.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Recent sends
            </p>
            <div className="rounded-md border divide-y">
              {data.recentSends.map((r) => (
                <div key={r.id} className="px-3 py-1.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline"
                      className={`text-[10px] ${TARGET_TONE[r.targetType] || ""}`}>
                      {TARGET_LABEL[r.targetType] || r.targetType}
                    </Badge>
                    <span className="font-medium truncate">{r.templateLabel}</span>
                  </div>
                  <span className="text-muted-foreground tabular-nums shrink-0">
                    {fmtDateTimeRel(r.sentAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
