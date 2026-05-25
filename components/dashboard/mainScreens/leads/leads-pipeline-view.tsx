"use client";

/**
 * Lead pipeline Kanban (§M6) — the funnel view of the lead inbox.
 * Columns = stages (New → Contacted → Qualified → Quoted → Booked,
 * plus Lost). Each card moves between stages via a "Move" select that
 * calls the existing LeadAPI.transition (status writes already route
 * through /transition server-side). No drag-drop dependency — a select
 * is reliable on mobile + keyboard.
 */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Phone, CalendarDays, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import {
  LeadAPI, LEAD_STATUS_LABELS,
  type Lead, type LeadStatus,
} from "@/lib/api/leads";

// Funnel order shown as columns (archived excluded — it's the mute bin).
const PIPELINE: LeadStatus[] = ["new", "contacted", "qualified", "quoted", "booked", "lost"];

const COLUMN_TONE: Record<string, string> = {
  new: "border-t-blue-400",
  contacted: "border-t-violet-400",
  qualified: "border-t-amber-400",
  quoted: "border-t-orange-400",
  booked: "border-t-emerald-500",
  lost: "border-t-rose-400",
};

const fmtPKR = (n: number | string | null | undefined) =>
  n == null || n === "" ? null : `Rs ${Math.round(Number(n)).toLocaleString("en-PK")}`;
const fmtDate = (s: string | null) => {
  if (!s) return null;
  try { return new Date(s).toLocaleDateString("en-PK", { day: "numeric", month: "short" }); }
  catch { return s; }
};

export default function LeadsPipelineView() {
  const [byStatus, setByStatus] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all(PIPELINE.map((s) => LeadAPI.list({ status: s }).then((r) => [s, r.leads] as const)))
      .then((pairs) => {
        const next: Record<string, Lead[]> = {};
        for (const [s, leads] of pairs) next[s] = leads;
        setByStatus(next);
      })
      .catch(() => toast.error("Could not load pipeline"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const move = async (lead: Lead, to: LeadStatus) => {
    if (to === lead.status) return;
    setMovingId(lead.id);
    try {
      await LeadAPI.transition(lead.id, { to });
      toast.success(`Moved to ${LEAD_STATUS_LABELS[to]}`);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not move lead");
    } finally {
      setMovingId(null);
    }
  };

  const counts = useMemo(
    () => Object.fromEntries(PIPELINE.map((s) => [s, byStatus[s]?.length ?? 0])),
    [byStatus],
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {PIPELINE.map((s) => <Skeleton key={s} className="h-64 w-full" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {PIPELINE.map((status) => (
        <div key={status} className={`rounded-md border bg-muted/20 border-t-2 ${COLUMN_TONE[status] || ""}`}>
          <div className="flex items-center justify-between px-2.5 py-2 border-b">
            <span className="text-xs font-semibold">{LEAD_STATUS_LABELS[status]}</span>
            <Badge variant="outline" className="text-[10px] tabular-nums">{counts[status]}</Badge>
          </div>
          <div className="p-1.5 space-y-1.5 min-h-[120px]">
            {(byStatus[status] || []).length === 0 ? (
              <p className="text-[11px] text-muted-foreground/60 italic px-1 py-3 text-center">Empty</p>
            ) : (
              byStatus[status].map((lead) => (
                <div key={lead.id} className="rounded-md border bg-background p-2 space-y-1.5">
                  <p className="text-xs font-medium truncate">{lead.contactName || "Unknown"}</p>
                  <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                    {lead.contactPhone && (
                      <span className="inline-flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{lead.contactPhone}</span>
                    )}
                    {lead.eventDate && (
                      <span className="inline-flex items-center gap-0.5"><CalendarDays className="h-2.5 w-2.5" />{fmtDate(lead.eventDate)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge variant="outline" className="text-[9px]">{lead.source.replace(/_/g, " ")}</Badge>
                    {lead.eventType && <Badge variant="outline" className="text-[9px]">{lead.eventType}</Badge>}
                    {fmtPKR((lead as { estimatedValue?: number }).estimatedValue) && (
                      <span className="text-[10px] font-semibold tabular-nums text-bridal-gold-dark">
                        {fmtPKR((lead as { estimatedValue?: number }).estimatedValue)}
                      </span>
                    )}
                  </div>
                  <Select value={lead.status} onValueChange={(v) => move(lead, v as LeadStatus)} disabled={movingId === lead.id}>
                    <SelectTrigger className="h-7 text-[11px] gap-1">
                      <ArrowRightLeft className="h-3 w-3 opacity-60" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE.concat(["archived"]).map((s) => (
                        <SelectItem key={s} value={s} className="text-[11px]">{LEAD_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
