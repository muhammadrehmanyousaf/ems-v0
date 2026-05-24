"use client";

/**
 * Command-center "Needs attention" strip — a prioritised, one-tap action hub
 * at the top of the vendor dashboard. Reads the existing
 * /api/v1/dashboard/operations-summary (no new backend) and surfaces only the
 * things that need action NOW as clickable chips that deep-link to the right
 * page. Complements (does not duplicate) the detailed cards below.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import axiosInstance from "@/lib/axiosConfig";
import {
  CalendarCheck, Wallet, FileWarning, Fuel, Boxes, ClipboardList,
  ShieldAlert, Receipt, CheckCircle2, ChevronRight,
} from "lucide-react";

interface Bucket { count: number; total?: number; overdueCount?: number }
interface OpsSummary {
  todaysFloor: {
    todaysBookings: { count: number };
    timelineTasksPending: Bucket;
    lowFuelGenerators: Bucket;
  };
  moneyIn: { pdcsDueWithin7Days: Bucket; invoicedUnpaidSheets: Bucket };
  moneyOut: { unpaidSupplierInvoices: Bucket };
  compliance: {
    expiringHalalCerts: Bucket; expiredHalalCerts: { count: number };
    expiringDroneNocs: Bucket; expiredDroneNocs: { count: number };
    lowStockItems: Bucket; pendingFbrSubmissions: Bucket;
  };
}

type Tone = "red" | "amber" | "neutral";
interface Item { key: string; label: string; count: number; href: string; icon: any; tone: Tone }

const toneClass: Record<Tone, string> = {
  red: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  amber: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100",
};

const fmtPKR = (n?: number) =>
  n != null && Number.isFinite(n) ? `Rs ${Math.round(n).toLocaleString("en-PK")}` : "";

export default function NeedsAttentionStrip() {
  const [data, setData] = useState<OpsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    axiosInstance
      .get("/api/v1/dashboard/operations-summary")
      .then((res) => { if (alive) setData(res.data?.data || null); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="mb-4 h-12 animate-pulse rounded-lg bg-muted/50" />;
  if (!data) return null;

  const cmp = data.compliance;
  const expired = (cmp.expiredHalalCerts?.count || 0) + (cmp.expiredDroneNocs?.count || 0);
  const expiring = (cmp.expiringHalalCerts?.count || 0) + (cmp.expiringDroneNocs?.count || 0);

  const items: Item[] = [];
  const push = (cond: number | undefined, it: Omit<Item, "count"> & { count: number }) => {
    if (cond) items.push(it);
  };

  push(data.moneyOut.unpaidSupplierInvoices?.overdueCount, { key: "ap", label: "supplier invoice(s) overdue", count: data.moneyOut.unpaidSupplierInvoices?.overdueCount || 0, href: "/dashboard/suppliers", icon: Receipt, tone: "red" });
  push(expired, { key: "cexp", label: "certificate(s) EXPIRED", count: expired, href: "/dashboard/halal-certs", icon: ShieldAlert, tone: "red" });
  push(data.moneyIn.pdcsDueWithin7Days?.count, { key: "pdc", label: "cheque(s) to deposit (7d)", count: data.moneyIn.pdcsDueWithin7Days?.count || 0, href: "/dashboard/pdcs", icon: Wallet, tone: "amber" });
  push(data.moneyIn.invoicedUnpaidSheets?.count, { key: "unpaid", label: `to collect${data.moneyIn.invoicedUnpaidSheets?.total ? " · " + fmtPKR(data.moneyIn.invoicedUnpaidSheets.total) : ""}`, count: data.moneyIn.invoicedUnpaidSheets?.count || 0, href: "/dashboard/function-sheets", icon: Receipt, tone: "amber" });
  push(cmp.pendingFbrSubmissions?.count, { key: "fbr", label: "invoice(s) pending FBR", count: cmp.pendingFbrSubmissions?.count || 0, href: "/dashboard/function-sheets", icon: FileWarning, tone: "amber" });
  push(expiring, { key: "cexpiring", label: "certificate(s) expiring soon", count: expiring, href: "/dashboard/halal-certs", icon: ShieldAlert, tone: "amber" });
  push(data.todaysFloor.lowFuelGenerators?.count, { key: "fuel", label: "generator(s) low on fuel", count: data.todaysFloor.lowFuelGenerators?.count || 0, href: "/dashboard/generator-fuel", icon: Fuel, tone: "amber" });
  push(cmp.lowStockItems?.count, { key: "stock", label: "item(s) low in stock", count: cmp.lowStockItems?.count || 0, href: "/dashboard/inventory", icon: Boxes, tone: "amber" });
  push(data.todaysFloor.timelineTasksPending?.count, { key: "tasks", label: "open task(s)", count: data.todaysFloor.timelineTasksPending?.count || 0, href: "/dashboard/function-sheets", icon: ClipboardList, tone: "neutral" });
  push(data.todaysFloor.todaysBookings?.count, { key: "today", label: "event(s) today", count: data.todaysFloor.todaysBookings?.count || 0, href: "/dashboard/bookings", icon: CalendarCheck, tone: "neutral" });

  if (items.length === 0) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        All clear — nothing needs your attention right now.
      </div>
    );
  }

  return (
    <div className="mb-4">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Needs attention
      </p>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 8).map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.key}
              href={it.href}
              className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${toneClass[it.tone]}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="tabular-nums font-semibold">{it.count}</span>
              <span>{it.label}</span>
              <ChevronRight className="h-3 w-3 opacity-50 transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
