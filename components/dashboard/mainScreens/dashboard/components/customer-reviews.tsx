"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { ReviewDistItem } from "@/lib/api/analytics";

type DistItem = { stars: number; count: number };
interface ReviewSummaryCardProps {
  average?: number;
  outOf?: number;
  verifiedPurchases?: number;
  distribution?: DistItem[];
  loading?: boolean;
  className?: string;
}

/** Colors for bars per star row */
const STAR_COLORS: Record<number, string> = {
  5: "bg-emerald-500",
  4: "bg-lime-500",
  3: "bg-yellow-400",
  2: "bg-orange-400",
  1: "bg-red-400",
};

/** Pretty number with commas */
const n = (x: number) => x.toLocaleString();

/** Stars with partial fill */
function StarRating({ value, outOf = 5 }: { value: number; outOf?: number }) {
  return (
    <div className="inline-flex gap-1">
      {Array.from({ length: outOf }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-6 w-6",
            i < Math.floor(value)
              ? "fill-yellow-400 text-yellow-400"
              : i < value
              ? "fill-yellow-200 text-yellow-400"
              : "fill-gray-200 text-gray-300"
          )}
        />
      ))}
    </div>
  );
}

export default function CustomerReviews({
  average = 0,
  outOf = 5,
  verifiedPurchases = 0,
  distribution = [
    { stars: 5, count: 0 },
    { stars: 4, count: 0 },
    { stars: 3, count: 0 },
    { stars: 2, count: 0 },
    { stars: 1, count: 0 },
  ],
  loading,
  className,
}: ReviewSummaryCardProps) {
  const router = useRouter();
  const total = React.useMemo(
    () => distribution.reduce((acc, d) => acc + d.count, 0),
    [distribution]
  );

  return (
    <Card className={cn("h-full xlarge:h-auto", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Customer Reviews</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/reviews")}
        >
          View All
        </Button>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Average and stars */}
            <div className="flex items-center gap-4">
              <StarRating value={average} outOf={outOf} />
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tabular-nums">{average}</span>
                <span className="text-muted-foreground">out of {outOf}</span>
              </div>
            </div>

            {total === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet</p>
            ) : (
              <>
                {/* Distribution bars */}
                <ul className="space-y-3">
                  {distribution
                    .slice()
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
                              indicatorColor={STAR_COLORS[d.stars] || "bg-gray-400"}
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

                <p className="text-xs text-muted-foreground">
                  Based on {n(total)} {total === 1 ? "review" : "reviews"}
                </p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
