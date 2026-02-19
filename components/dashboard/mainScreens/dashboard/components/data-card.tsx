import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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
    <Card className={cn("@container/card relative overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                iconColor || "bg-primary/10 text-primary"
              )}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
            )}
            <CardDescription className="truncate font-medium">{title}</CardDescription>
          </div>

          {typeof delta === "number" && (
            <Badge
              variant="outline"
              className={cn(
                "gap-1 px-2 py-0.5 text-xs font-medium",
                direction === "up" && "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
                direction === "down" && "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
                direction === "flat" && "text-muted-foreground"
              )}
            >
              {direction === "up" && <ArrowUpRight className="h-3 w-3" />}
              {direction === "down" && <ArrowDownRight className="h-3 w-3" />}
              {direction === "flat" && <span>-</span>}
              {delta}%
            </Badge>
          )}
        </div>

        <CardTitle className={cn(
          "text-2xl font-extrabold tabular-nums @[250px]/card:text-3xl",
          Icon && "pl-12"
        )}>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : typeof value === "number" ? (
            isCurrency ? formatCurrencyPKR(value) : formatNumber(value)
          ) : (
            value
          )}
        </CardTitle>
      </CardHeader>

      {subtitle && (
        <CardContent className="pt-0">
          <p className={cn("text-xs text-muted-foreground line-clamp-1", Icon && "pl-12")}>{subtitle}</p>
        </CardContent>
      )}
    </Card>
  );
}
