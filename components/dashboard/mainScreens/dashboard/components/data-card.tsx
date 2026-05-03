import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  ArrowDownRight,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "flat";

type KpiCardProps = {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
  isCurrency?: boolean;
  delta?: number;
  direction?: Direction;
  loading?: boolean;
};

const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

const formatCurrencyPKR = (n: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Modern CRM KPI card. Header row = icon + title + delta badge (the badge
 * stays in this row, no longer collides with the value). Value row sits
 * below at full width — never clipped, even with long currency strings.
 */
export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  className,
  isCurrency,
  delta,
  direction = "up",
  loading,
}: KpiCardProps) {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader className="pb-2 px-4 pt-4 space-y-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <span
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                  iconColor || "bg-secondary text-secondary-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            )}
            <span className="truncate text-[12.5px] font-medium text-muted-foreground">
              {title}
            </span>
          </div>

          {typeof delta === "number" && (
            <Badge
              variant="outline"
              className={cn(
                "gap-0.5 px-1.5 py-0 text-[10.5px] font-medium tabular-nums shrink-0 h-5",
                direction === "up" && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400",
                direction === "down" && "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400",
                direction === "flat" && "text-muted-foreground",
              )}
            >
              {direction === "up" && <ArrowUpRight className="h-2.5 w-2.5" />}
              {direction === "down" && <ArrowDownRight className="h-2.5 w-2.5" />}
              {direction === "flat" && <span>—</span>}
              {delta}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        <div className="text-[24px] font-semibold tracking-tight tabular-nums text-foreground leading-none">
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : typeof value === "number" ? (
            isCurrency ? formatCurrencyPKR(value) : formatNumber(value)
          ) : (
            value
          )}
        </div>
        {subtitle && !loading && (
          <p className="text-[11.5px] text-muted-foreground line-clamp-1 mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
