"use client";

/**
 * Phase-2 EPIC 4 · 4.2 — the Urdu report-card home.
 *
 * Big Urdu label · big number · one colour · one arrow — no tables on the front,
 * each card shares to WhatsApp. This is the vendor's glanceable business at a
 * glance.
 *
 * The REPORT_CARDS_ENABLED gate is gone (see bookingOrderController) — it
 * answered 404 to most vendors for a read-only projection of their own
 * bookings. The 404 branch below is kept as a defensive fallback for an older
 * backend, not as a product state.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, MessageCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { getReportCards, type ReportCard } from "@/lib/api/bookingOrder";
import { useBusiness } from "@/context/BusinessContext";
import { useActiveBusinessId } from "@/lib/store/active-business-store";
import { BusinessesAPI } from "@/lib/api/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { shareCard, type ShareRow } from "@/lib/whatsappShare";

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
  const [period, setPeriod] = useState<"month" | "year">("month");

  /**
   * WWL-204 — the byline came from `useBusiness()`, which is not the venue
   * switcher. With the switcher on **All venues** every WhatsApp message and
   * every generated image went out headed "Rehman Grand Marquee" while
   * carrying all three venues' combined numbers. On the one screen designed to
   * be sent to somebody else, the name and the figures disagreed.
   *
   * The byline now follows the same selection the figures do: the active
   * venue's name when one is selected, and an explicit all-venues heading when
   * none is — never one venue's name over the group's totals.
   */
  const activeBusinessId = useActiveBusinessId();
  const { data: businesses } = useQuery({
    queryKey: ["my-businesses"],
    queryFn: () => BusinessesAPI.getUserBusinesses(),
  });
  const activeVenue = businesses?.find((b) => b.id === activeBusinessId);
  const multiVenue = (businesses?.length ?? 0) > 1;
  const vendor =
    activeVenue?.name ??
    (multiVenue ? "Sab venues (all venues)" : business?.name ?? businesses?.[0]?.name ?? "Wedding Wala");

  const { data, isLoading } = useQuery({
    // WWL-204 — the venue belongs in the key, or switching venue re-renders
    // the previous venue's numbers under the new venue's name.
    queryKey: ["report-cards", period, activeBusinessId],
    queryFn: () => getReportCards(period),
  });

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

  // EPIC 8.4 — render all cards as one WhatsApp-shareable image.
  const shareAllAsImage = () => {
    const rows: ShareRow[] = data.cards.map((c) => ({
      label: c.labelUr,
      value: fmt(c) + (c.sub ? ` (${c.sub})` : ""),
      tone: c.tone as ShareRow["tone"],
    }));
    void shareCard({
      title: vendor,
      subtitle: period === "month" ? "Is maheene ka hisaab" : "Is saal ka hisaab",
      rows,
      brand: "Wedding Wala",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Report Cards</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={shareAllAsImage}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-sm hover:bg-muted transition-colors"
            title="Poori report ek image mein WhatsApp par bhejein"
          >
            <ImageIcon className="size-3.5" /> Image
          </button>
          <div className="inline-flex rounded-md border p-0.5 text-sm">
            {(["month", "year"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1 rounded", period === p && "bg-primary text-primary-foreground")}>
                {p === "month" ? "Maheena" : "Saal"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {data.cards.map((c, i) => (
          <Card key={c.key} className={cn(TONE[c.tone], i === 0 && "col-span-2 lg:col-span-1")}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-1">
                <p className="text-xs font-medium text-muted-foreground">{c.labelUr}</p>
                {/**
                  * WWL-205 — the tap target was the 14×14px icon itself, on the
                  * one screen in the portal whose entire purpose is sharing
                  * from a phone. Below WCAG 2.2's 24×24 floor and nowhere near
                  * the 44px touch guidance. The icon stays the same size; the
                  * hit area is grown around it with negative margin so nothing
                  * in the card layout shifts.
                  *
                  * WWL-206 — all eight links fell back to an identical
                  * `title="Share on WhatsApp"`, so a screen-reader user heard
                  * the same name eight times and could not tell which figure
                  * each one shared. The label now names the card.
                  */}
                <a
                  href={share(c)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-emerald-950"
                  aria-label={`Share ${c.labelUr} on WhatsApp`}
                  title={`Share ${c.labelUr} on WhatsApp`}
                >
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
