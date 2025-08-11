"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type DistItem = { stars: 1 | 2 | 3 | 4 | 5; count: number };
interface ReviewSummaryCardProps {
  average?: number;             // e.g., 4.5
  outOf?: number;               // default: 5
  verifiedPurchases?: number;   // e.g., 5500
  distribution?: DistItem[];    // [{stars:5,count:4000}, ...]
  onViewAll?: () => void;
  className?: string;
}

/** Colors for bars per star row */
const STAR_COLORS: Record<DistItem["stars"], string> = {
  5: "bg-emerald-500",
  4: "bg-lime-500",
  3: "bg-yellow-400",
  2: "bg-orange-400",
  1: "bg-rose-400",
};

/** Pretty number with commas */
const n = (x: number) => x.toLocaleString();

/** Stars with partial fill (supports halves) */
function StarRating({ value, outOf = 5 }: { value: number; outOf?: number }) {
  const pct = Math.max(0, Math.min(100, (value / outOf) * 100));
  return (
    <div className="inline-block">
      <div
        className=""
        style={{ width: `${pct}%` }}
        aria-hidden
      >
        <div className="flex gap-1">
          {Array.from({ length: outOf }).map((_, i) => (
            <Star
              key={i}
              className="h-6 w-6 fill-yellow-400 text-yellow-400"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CustomerReviews({
  average = 4.5,
  outOf = 5,
  verifiedPurchases = 5500,
  distribution = [
    { stars: 5, count: 4000 },
    { stars: 4, count: 2100 },
    { stars: 3, count: 800 },
    { stars: 2, count: 631 },
    { stars: 1, count: 344 },
  ],
  onViewAll,
  className,
}: ReviewSummaryCardProps) {
  const total = React.useMemo(
    () => distribution.reduce((acc, d) => acc + d.count, 0),
    [distribution]
  );

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Customer Reviews</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={onViewAll}>
          View All
        </Button>
      </CardHeader>

      <CardContent>
        <div className="space-y-5">
          {/* Left: average and stars */}
          <div className="flex items-center gap-4">
            <div className="">
              <StarRating value={average} outOf={outOf} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tabular-nums">{average}</span>
              <span className="text-muted-foreground">out of {outOf}</span>
            </div>
          </div>

          {/* Right: distribution bars */}
          <div className="">
            <ul className="space-y-3">
              {distribution
                .slice() // copy
                .sort((a, b) => b.stars - a.stars)
                .map((d) => {
                  const pct =
                    total > 0 ? Math.round((d.count / total) * 100) : 0;
                  return (
                    <li key={d.stars} className="flex items-center gap-3">
                      <div className="w-8 shrink-0 text-sm tabular-nums">
                        {d.stars} <span className="text-muted-foreground">★</span>
                      </div>

                      <div className="flex-1">
                        <Progress
                          value={pct}
                          indicatorColor={STAR_COLORS[d.stars]}
                          className="h-3 bg-muted"
                          aria-label={`${d.stars} star percentage`}
                        />
                      </div>

                      <div className="w-16 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                        {n(d.count)}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
