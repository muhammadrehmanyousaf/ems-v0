"use client";

/**
 * Reputation dashboard panel (§M8). Mounted atop /dashboard/reviews.
 * Headline avg vs category benchmark · star distribution · response
 * rate · 6-month rating trend · a shareable "best review" card the
 * vendor can broadcast on WhatsApp.
 *
 * Read-only over existing review data — no flag, no migration.
 */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star, TrendingUp, MessageCircle, Share2, Copy, Award, Quote, Download, Tag,
} from "lucide-react";
import { toast } from "sonner";
import { AnalyticsAPI, type ReputationData } from "@/lib/api/analytics";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const r = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} style={{ width: size, height: size }}
          className={n <= r ? "fill-bridal-gold-dark text-bridal-gold-dark" : "text-muted-foreground/30"} />
      ))}
    </span>
  );
}

export default function ReputationPanel() {
  const [data, setData] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getReputation().then(setData).finally(() => setLoading(false));
  }, []);

  const maxDist = useMemo(
    () => Math.max(1, ...(data?.distribution || []).map((d) => d.count)),
    [data],
  );
  const maxTrend = 5;

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!data || !data.hasData) return null; // no reviews yet → don't clutter

  const vsBenchmark =
    data.categoryBenchmark?.average != null
      ? Math.round((data.average - data.categoryBenchmark.average) * 10) / 10
      : null;

  const shareBestReview = (channel: "whatsapp" | "copy") => {
    const r = data.topReview;
    if (!r) return;
    const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
    const text =
      `${stars} (${r.rating}/5)\n` +
      `"${r.comment}"\n` +
      (r.reviewerName ? `— ${r.reviewerName}\n` : "") +
      (r.businessName ? `\n${r.businessName} · ` : "\n") +
      `reviewed on Wedding Wala`;
    if (channel === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    } else {
      navigator.clipboard?.writeText(text).then(
        () => toast.success("Review copied"),
        () => toast.error("Could not copy"),
      );
    }
  };

  // Render the best review to a square PNG (canvas — no dependency) so
  // the vendor can post it to Instagram / WhatsApp status.
  const downloadCardPng = () => {
    const r = data.topReview;
    if (!r) return;
    const S = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext("2d");
    if (!ctx) { toast.error("Canvas not supported"); return; }

    // Background
    ctx.fillStyle = "#FBF7F1"; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = "#C9956C"; ctx.fillRect(0, 0, S, 12);
    ctx.fillStyle = "#C9956C"; ctx.fillRect(0, S - 12, S, 12);

    // Stars
    ctx.fillStyle = "#C9956C";
    ctx.font = "72px serif";
    ctx.textAlign = "center";
    ctx.fillText("★".repeat(r.rating) + "☆".repeat(5 - r.rating), S / 2, 220);

    // Quote (wrapped)
    ctx.fillStyle = "#2B2B2B";
    ctx.font = "italic 46px Georgia, serif";
    const words = `"${r.comment}"`.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    const maxW = S - 200;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    const shown = lines.slice(0, 9);
    if (lines.length > 9) shown[8] = shown[8].replace(/\.*$/, "…");
    let y = 360;
    for (const ln of shown) { ctx.fillText(ln, S / 2, y); y += 64; }

    // Attribution
    ctx.fillStyle = "#7A7A7A";
    ctx.font = "34px Georgia, serif";
    ctx.fillText(r.reviewerName ? `— ${r.reviewerName}` : "— Verified customer", S / 2, Math.min(y + 60, S - 180));
    if (r.businessName) {
      ctx.font = "bold 38px Georgia, serif";
      ctx.fillStyle = "#2B2B2B";
      ctx.fillText(r.businessName, S / 2, S - 110);
    }
    ctx.fillStyle = "#C9956C";
    ctx.font = "28px Georgia, serif";
    ctx.fillText("reviewed on Wedding Wala", S / 2, S - 60);

    canvas.toBlob((blob) => {
      if (!blob) { toast.error("Could not render image"); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `wedding-wala-review-${r.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Review card downloaded");
    }, "image/png");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4 text-bridal-gold-dark" />
          Reputation
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Your rating, how it trends, how you compare to peers, and your best
          review ready to share.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Headline + benchmark */}
          <div className="rounded-md bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold tabular-nums text-bridal-gold-dark">{data.average.toFixed(1)}</span>
              <div className="flex flex-col">
                <Stars value={data.average} />
                <span className="text-[10px] text-muted-foreground">{data.total} review{data.total === 1 ? "" : "s"}</span>
              </div>
            </div>
            {data.categoryBenchmark?.average != null && (
              <p className="mt-2 text-[11px]">
                Category avg <span className="font-semibold tabular-nums">{data.categoryBenchmark.average.toFixed(1)}</span>
                {vsBenchmark != null && (
                  <Badge variant="outline" className={`ml-1.5 text-[10px] ${
                    vsBenchmark >= 0 ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}>
                    {vsBenchmark >= 0 ? "+" : ""}{vsBenchmark.toFixed(1)} vs peers
                  </Badge>
                )}
              </p>
            )}
            {data.responseRate != null && (
              <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                Replied to <span className="font-semibold text-foreground tabular-nums">{data.responseRate}%</span> ({data.repliedCount}/{data.total})
              </p>
            )}
          </div>

          {/* Star distribution */}
          <div className="rounded-md border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Distribution</p>
            <div className="space-y-1">
              {data.distribution.map((d) => (
                <div key={d.stars} className="flex items-center gap-2 text-[11px]">
                  <span className="w-3 tabular-nums text-muted-foreground">{d.stars}</span>
                  <Star className="h-3 w-3 fill-bridal-gold-dark/50 text-bridal-gold-dark/50" />
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-bridal-gold-dark/70" style={{ width: `${(d.count / maxDist) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right tabular-nums text-muted-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 6-month trend */}
          <div className="rounded-md border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> 6-month trend
            </p>
            <div className="flex items-end justify-between gap-1 h-20">
              {data.trend.map((t) => (
                <div key={t.key} className="flex flex-col items-center gap-1 flex-1" title={t.average != null ? `${t.label}: ${t.average} (${t.count})` : `${t.label}: no reviews`}>
                  <div className="w-full flex items-end justify-center" style={{ height: 56 }}>
                    <div
                      className={`w-full max-w-[16px] rounded-t ${t.average != null ? "bg-bridal-gold-dark/70" : "bg-muted"}`}
                      style={{ height: t.average != null ? `${(t.average / maxTrend) * 100}%` : "4px" }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shareable best review */}
        {data.topReview && data.topReview.rating >= 4 && (
          <div className="rounded-md border border-bridal-gold-dark/30 bg-gradient-to-br from-bridal-gold-dark/[0.05] to-transparent p-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Quote className="h-4 w-4 text-bridal-gold-dark shrink-0" />
                  <Stars value={data.topReview.rating} size={13} />
                </div>
                <p className="mt-1.5 text-sm italic text-foreground line-clamp-3">&ldquo;{data.topReview.comment}&rdquo;</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {data.topReview.reviewerName ? `— ${data.topReview.reviewerName}` : "— Verified customer"}
                  {data.topReview.businessName ? ` · ${data.topReview.businessName}` : ""}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => shareBestReview("whatsapp")}>
                  <Share2 className="h-3.5 w-3.5 text-emerald-600" /> Share
                </Button>
                <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => shareBestReview("copy")}>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
                <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={downloadCardPng}>
                  <Download className="h-3.5 w-3.5" /> PNG
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* What customers mention — keyword tally */}
        {data.keywords && data.keywords.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
              <Tag className="h-3 w-3" /> What customers mention
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.keywords.map((k) => (
                <Badge key={k.word} variant="outline" className="text-[11px] capitalize">
                  {k.word}<span className="ml-1 text-muted-foreground tabular-nums">{k.count}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
