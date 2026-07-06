"use client";

/**
 * Phase-2 EPIC 4 · 4.2 — the Urdu report-card home.
 *
 * Big Urdu label · big number · one colour · one arrow — no tables on the front,
 * each card shares to WhatsApp. This is the vendor's glanceable business at a
 * glance. Behind REPORT_CARDS_ENABLED (self-hides on 404).
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, MessageCircle, Loader2 } from "lucide-react";
import { getReportCards, type ReportCard } from "@/lib/api/bookingOrder";
import { useBusiness } from "@/context/BusinessContext";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const fmt = (c: ReportCard) => {
  if (c.format === "money") return "Rs " + Math.round(c.value).toLocaleString("en-PK");
  if (c.format === "pct") return Math.round(c.value) + "%";
  return String(Math.round(c.value));
};
const TONE: Record<string, string> = {
  good: "border-emerald-200 dark:border-emerald-900/50",
  warn: "border-amber-300 dark:border-amber-900/50",
  neutral: "",
};
const VAL_TONE: Record<string, string> = {
  good: "text-emerald-700 dark:text-emerald-400",
  warn: "text-amber-700 dark:text-amber-400",
  neutral: "",
};

export function ReportCardsView() {
  const { business } = useBusiness();
  const vendor = business?.name ?? "Wedding Wala";
  const [period, setPeriod] = useState<"month" | "year">("month");
  const { data, isLoading } = useQuery({ queryKey: ["report-cards", period], queryFn: () => getReportCards(period) });

  if (isLoading) {
    return <div className="flex items-center justify-center gap-2 text-muted-foreground py-16"><Loader2 className="size-4 animate-spin" /> Loading…</div>;
  }
  if (!data) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">Reports abhi enabled nahi hain.</p>
      </div>
    );
  }

  const share = (c: ReportCard) => {
    const text = `${vendor}\n${c.labelUr}: ${fmt(c)}${c.sub ? ` (${c.sub})` : ""}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };
  const maxSeason = Math.max(1, ...data.seasonality.map((s) => s.n));

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Report Cards</h1>
        <div className="inline-flex rounded-md border p-0.5 text-sm">
          {(["month", "year"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1 rounded", period === p && "bg-primary text-primary-foreground")}>
              {p === "month" ? "Maheena" : "Saal"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {data.cards.map((c, i) => (
          <Card key={c.key} className={cn(TONE[c.tone], i === 0 && "col-span-2 lg:col-span-1")}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-1">
                <p className="text-xs font-medium text-muted-foreground">{c.labelUr}</p>
                <a href={share(c)} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-emerald-600 shrink-0" title="Share on WhatsApp">
                  <MessageCircle className="size-3.5" />
                </a>
              </div>
              <p className={cn("text-2xl font-bold tabular-nums mt-1", VAL_TONE[c.tone])}>{fmt(c)}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                {c.delta != null && (
                  <span className={cn("inline-flex items-center", c.delta >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {c.delta >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                    {Math.abs(c.delta)}%
                  </span>
                )}
                {c.sub && <span>{c.sub}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Seasonality mini-bar (last 6 months) */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Kaunse maheene busy — last 6 months</p>
          <div className="flex items-end gap-2 h-24">
            {data.seasonality.map((s) => (
              <div key={s.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-primary/70 rounded-t" style={{ height: `${(s.n / maxSeason) * 100}%`, minHeight: s.n > 0 ? 4 : 0 }} />
                <span className="text-[10px] text-muted-foreground">{s.month}</span>
                <span className="text-[10px] font-medium tabular-nums">{s.n}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReportCardsView;
