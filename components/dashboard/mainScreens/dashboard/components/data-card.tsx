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
  className?: string;
  isCurrency?: boolean;
  delta?: number; // e.g. 12.5 means +12.5%
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
          <CardDescription className="truncate">{title}</CardDescription>

          {typeof delta === "number" && (
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 px-2 py-0.5 text-xs",
                direction === "up" && "border-emerald-500 text-emerald-600",
                direction === "down" && "border-red-500 text-red-600",
                direction === "flat" && "text-muted-foreground"
              )}
            >
              {direction === "up" && <ArrowUpRight className="h-3.5 w-3.5" />}
              {direction === "down" && <ArrowDownRight className="h-3.5 w-3.5" />}
              {direction === "flat" && <span>•</span>}
              {delta}%
            </Badge>
          )}
        </div>

        <CardTitle className="text-3xl font-extrabold tabular-nums @[250px]/card:text-3xl">
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : typeof value === "number" ? (
            isCurrency ? formatCurrencyPKR(value) : formatNumber(value)
          ) : (
            value
          )}
        </CardTitle>
      </CardHeader>

      {(subtitle || Icon) && (
        <CardContent className="pt-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {Icon && (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-muted">
                <Icon className="h-3.5 w-3.5" />
              </span>
            )}
            {subtitle && <span className="line-clamp-1">{subtitle}</span>}
          </div>
        </CardContent>
      )}
    </Card>
  );
}