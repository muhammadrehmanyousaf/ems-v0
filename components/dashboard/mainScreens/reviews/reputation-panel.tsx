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
import { useActiveBusinessId } from "@/lib/store/active-business-store";

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

  /**
   * WWL-362 — this loaded once on mount with an empty dependency array, so
   * switching venue changed nothing until a full page reload. The axios
   * interceptor appends the active `businessId` to the request, but nothing
   * re-fired the request, so the vendor sat looking at another venue's
   * reputation under this venue's name.
   */
  const activeBusinessId = useActiveBusinessId();
  /**
   * WWL-376 — a failed fetch called `setData(null)` and the render below then
   * returned null, so the ENTIRE panel vanished: no error, no retry, nothing to
   * say it had ever been there. "Your reputation card failed to load" and "you
   * have no reviews yet" were the same screen — and the second one is a
   * reassuring message to show someone whose data just did not arrive.
   */
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    setLoading(true);
    setFailed(false);
    AnalyticsAPI.getReputation()
      .then(setData)
      .catch(() => {
        setData(null);
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }, [activeBusinessId, reloadKey]);

  const maxDist = useMemo(
    () => Math.max(1, ...(data?.distribution || []).map((d) => d.count)),
    [data],
  );
  const maxTrend = 5;

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (failed) {
    return (
      <div className="rounded-xl border bg-card p-5 text-sm">
        <p className="font-medium">Couldn&apos;t load your reputation summary.</p>
        <p className="mt-1 text-muted-foreground">
          This is a loading problem, not a change to your reviews — nothing has been lost.
        </p>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="mt-3 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Try again
        </button>
      </div>
    );
  }
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

    /**
     * WWL-386 — only the quote was wrapped. The attribution and the business
     * name were drawn with a bare centred `fillText`, so anything past about 36
     * characters ran off both edges of the 1080px board: a 55-character venue
     * name measured 1223px, 143px over. Shrink to fit, then truncate — the
     * vendor is posting this publicly and a clipped name is worse than a small
     * one.
     */
    const fitText = (text: string, maxW: number, basePx: number, weight: string) => {
      let px = basePx;
      ctx.font = `${weight}${px}px Georgia, serif`;
      while (px > 20 && ctx.measureText(text).width > maxW) {
        px -= 2;
        ctx.font = `${weight}${px}px Georgia, serif`;
      }
      let out = text;
      while (out.length > 1 && ctx.measureText(out).width > maxW) {
        out = out.slice(0, -2) + "…";
      }
      return out;
    };
    const boardW = S - 120;

    // Attribution
    ctx.fillStyle = "#7A7A7A";
    const attribution = r.reviewerName ? `— ${r.reviewerName}` : "— Verified customer";
    ctx.fillText(fitText(attribution, boardW, 34, ""), S / 2, Math.min(y + 60, S - 180));
    if (r.businessName) {
      ctx.fillStyle = "#2B2B2B";
      ctx.fillText(fitText(r.businessName, boardW, 38, "bold "), S / 2, S - 110);
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
      // WWL-386 — this revoked the URL on the very next line, racing the
      // browser's read of it. Give the download a turn of the event loop.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      // The browser owns whether a file is actually saved; say what we know.
      toast.success("Review card ready — check your downloads");
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
            {/**
              * WWL-367 — the panel told a vendor they trail their category and
              * showed neither number the claim rests on. The API returns both:
              * live, that was FIFTEEN reviews spread across 728 wedding-venue
              * businesses — one review per forty-nine competitors. A comparison
              * is only worth reading next to its sample, so the sample is now
              * printed, and a sample too thin to mean anything says so instead
              * of dressing itself up as a verdict.
              */}
            {data.categoryBenchmark?.average != null && (() => {
              const bench = data.categoryBenchmark!
              // Below this, the "average" is a handful of reviews across
              // hundreds of businesses and comparing against it is noise.
              const thin = bench.reviewCount < 30
              return (
                <p className="mt-2 text-[11px]">
                  Category avg <span className="font-semibold tabular-nums">{bench.average!.toFixed(1)}</span>
                  {vsBenchmark != null && !thin && (
                    <Badge variant="outline" className={`ml-1.5 text-[10px] ${
                      vsBenchmark >= 0 ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"
                    }`}>
                      {vsBenchmark >= 0 ? "+" : ""}{vsBenchmark.toFixed(1)} vs peers
                    </Badge>
                  )}
                  <span className="ml-1 text-muted-foreground">
                    from {bench.reviewCount} review{bench.reviewCount === 1 ? "" : "s"} across{" "}
                    {bench.businessCount} {bench.vendorType || "business"}
                    {bench.businessCount === 1 ? "" : "es"}
                  </span>
                  {thin && (
                    <span className="ml-1 text-muted-foreground">— too few to compare against yet.</span>
                  )}
                </p>
              )
            })()}
            {data.responseRate != null && (
              <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {/* WWL-387 — the automation card ~400px below says "RESPONSE
                    RATE 73%" and this said 100%. They measure opposite
                    directions: replies the vendor SENT, versus reviews
                    customers LEFT. Nothing on the page said so. */}
                You replied to <span className="font-semibold text-foreground tabular-nums">{data.responseRate}%</span> of reviews ({data.repliedCount}/{data.total})
              </p>
            )}
          </div>

          {/* Star distribution */}
          <div className="rounded-md border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Distribution</p>
            <div className="space-y-1">
              {(data.distribution ?? []).map((d) => (
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
            {/**
              * WWL-385 — six bars scaled `average / 5` with no axis, no
              * gridline and no number on the face: a 4.0 and a 5.0 differed by
              * a fifth of a bar. The month's count lived only in a `title`
              * attribute, which a touch user can never reach, and a month with
              * no reviews rendered as a 4px stub that reads as a broken bar
              * rather than as absence.
              *
              * Bars are now scaled from 3.0, where the readable range actually
              * is, with the value printed on the face and absence stated in
              * words. The axis says what the scale is, because a chart that
              * does not is a picture.
              */}
            <div className="relative flex items-end justify-between gap-1 h-24">
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-border" />
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-border/60" />
              {(data.trend ?? []).map((t) => {
                const TREND_FLOOR = 3
                const pct =
                  t.average != null
                    ? Math.max(6, ((t.average - TREND_FLOOR) / (maxTrend - TREND_FLOOR)) * 100)
                    : 0
                return (
                  <div
                    key={t.key}
                    className="flex flex-1 flex-col items-center gap-1"
                    title={t.average != null ? `${t.label}: ${t.average} stars from ${t.count} review${t.count === 1 ? "" : "s"}` : `${t.label}: no reviews`}
                  >
                    <span className="text-[9px] tabular-nums text-muted-foreground">
                      {t.average != null ? t.average.toFixed(1) : "—"}
                    </span>
                    <div className="flex w-full items-end justify-center" style={{ height: 48 }}>
                      {t.average != null ? (
                        <div
                          className="w-full max-w-[16px] rounded-t bg-bridal-gold-dark/70"
                          style={{ height: `${pct}%` }}
                        />
                      ) : (
                        <span className="w-full max-w-[16px] self-end border-b-2 border-dotted border-muted-foreground/40" />
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground">{t.label}</span>
                  </div>
                )
              })}
            </div>
            <p className="mt-1 text-[9px] text-muted-foreground">
              Scale 3.0–5.0 · a dotted line means no reviews that month
            </p>
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
            {/**
              * WWL-383 — nine identical neutral badges, so "Issue" carried the
              * same weight and the same styling as "Food". Each word now shows
              * the average rating of the reviews it appears in, which is what
              * decides its colour — the vendor's own data, not a dictionary.
              */}
            <div className="flex flex-wrap gap-1.5">
              {data.keywords.map((k) => {
                const tone =
                  k.sentiment === "positive"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                    : k.sentiment === "negative"
                      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                      : ""
                return (
                  <Badge
                    key={k.word}
                    variant="outline"
                    className={`text-[11px] capitalize ${tone}`}
                    title={
                      k.avgRating != null
                        ? `Mentioned in ${k.count} review${k.count === 1 ? "" : "s"}, averaging ${k.avgRating} stars`
                        : `Mentioned in ${k.count} review${k.count === 1 ? "" : "s"}`
                    }
                  >
                    {k.word}
                    <span className="ml-1 tabular-nums opacity-70">{k.count}</span>
                    {k.avgRating != null && (
                      <span className="ml-1 tabular-nums opacity-70">· {k.avgRating}★</span>
                    )}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
