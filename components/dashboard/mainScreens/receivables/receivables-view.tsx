"use client";

/**
 * A/R Aging Board — "kis se paise leny hen?" (who owes me money?)
 *
 * The #1 PK vendor question. Pulls every NOT-fully-paid installment
 * on the vendor's bookings, buckets by days-overdue, rolls up per
 * customer, and renders a phone-list-ready collections board:
 *
 *   ┌─ 5 bucket cards (current / 1-30 / 31-60 / 61-90 / 90+) ──┐
 *   ├─ Filter chips (All · per bucket) + search ──────────────┤
 *   ├─ Customer table (sortable: oldest overdue desc) ────────┤
 *   │     • name + phone + email (tel: / mailto:)             │
 *   │     • outstanding total + bucket badge + oldest days    │
 *   │     • # of open installments across # bookings          │
 *   │     • WhatsApp deep-link (wa.me, urdu-friendly template)│
 *   │     • Expand → per-booking breakdown with installments  │
 *   ├─ CSV export ─────────────────────────────────────────────┤
 *   └──────────────────────────────────────────────────────────┘
 *
 * Read-only: data is computed live from BookingInstallment +
 * Booking. No schema changes.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AnalyticsAPI,
  type ReceivablesData,
  type ReceivablesCustomer,
  type ReceivablesBucketKey,
} from "@/lib/api/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle, Phone, Mail, MessageCircle, ChevronDown, ChevronRight,
  Download, Search, Loader2, RefreshCw, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const BUCKET_LABEL: Record<ReceivablesBucketKey, string> = {
  current: "Current",
  days_1_30: "1-30 days",
  days_31_60: "31-60 days",
  days_61_90: "61-90 days",
  days_90_plus: "90+ days",
};
const BUCKET_TONE: Record<ReceivablesBucketKey, { ring: string; text: string; bg: string }> = {
  current:      { ring: "border-emerald-200", text: "text-emerald-800", bg: "bg-emerald-50" },
  days_1_30:    { ring: "border-blue-200",    text: "text-blue-800",    bg: "bg-blue-50" },
  days_31_60:   { ring: "border-amber-200",   text: "text-amber-800",   bg: "bg-amber-50" },
  days_61_90:   { ring: "border-orange-200",  text: "text-orange-800",  bg: "bg-orange-50" },
  days_90_plus: { ring: "border-rose-200",    text: "text-rose-800",    bg: "bg-rose-50" },
};
const BUCKET_ORDER: ReceivablesBucketKey[] = [
  "current", "days_1_30", "days_31_60", "days_61_90", "days_90_plus",
];

const fmtPKR = (n: number) =>
  `Rs ${Math.round(n).toLocaleString("en-PK")}`;

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
};

// PK phone normaliser → wa.me link
const waLink = (phone: string | null | undefined, name: string, outstanding: number) => {
  if (!phone) return null;
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = "92" + p.slice(1);
  if (p.startsWith("3") && p.length === 10) p = "92" + p;
  const greeting = name ? `Assalam-o-Alaikum ${name} sahab,` : "Assalam-o-Alaikum,";
  const text = encodeURIComponent(
    `${greeting}\n\nYeh aap k booking k against Rs ${Math.round(outstanding).toLocaleString("en-PK")} ka outstanding balance hai. Kindly clear karwa dein. Shukriya.`,
  );
  return `https://wa.me/${p}?text=${text}`;
};

function BucketCard({
  k, bucket, active, onClick,
}: {
  k: ReceivablesBucketKey;
  bucket: { count: number; total: number };
  active: boolean;
  onClick: () => void;
}) {
  const tone = BUCKET_TONE[k];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border-2 p-3 transition-all ${
        active
          ? `${tone.ring} ${tone.bg} ring-2 ring-offset-1 ring-bridal-gold-dark/30`
          : `border-neutral-200 hover:${tone.ring} bg-background`
      }`}
    >
      <p className={`text-[10px] uppercase tracking-wide font-semibold ${tone.text}`}>
        {BUCKET_LABEL[k]}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums">{fmtPKR(bucket.total)}</p>
      <p className="text-[11px] text-muted-foreground">
        {bucket.count} installment{bucket.count === 1 ? "" : "s"}
      </p>
    </button>
  );
}

function CustomerRow({
  customer, expanded, onToggle,
}: {
  customer: ReceivablesCustomer;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tone = BUCKET_TONE[customer.bucket];
  const wa = waLink(customer.customerPhone, customer.customerName, customer.totalOutstanding);

  return (
    <div className="border-t first:border-t-0">
      {/* Summary row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-3 hover:bg-muted/30 transition-colors flex items-start gap-2"
      >
        <div className="pt-0.5 shrink-0">
          {expanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-4 min-w-0">
            <p className="font-semibold text-sm truncate">{customer.customerName || "Unnamed"}</p>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
              {customer.customerPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {customer.customerPhone}
                </span>
              )}
              {customer.customerEmail && (
                <span className="flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3" /> {customer.customerEmail}
                </span>
              )}
            </div>
          </div>
          <div className="sm:col-span-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Outstanding</p>
            <p className="text-sm font-bold tabular-nums">{fmtPKR(customer.totalOutstanding)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Oldest</p>
            <p className={`text-sm font-semibold tabular-nums ${tone.text}`}>
              {customer.oldestDaysOverdue}d
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</p>
            <Badge variant="outline" className={`${tone.bg} ${tone.ring} ${tone.text} text-[10px]`}>
              {BUCKET_LABEL[customer.bucket]}
            </Badge>
          </div>
          <div className="sm:col-span-1 flex items-center justify-end gap-1">
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-md hover:bg-emerald-100 text-emerald-700"
                aria-label="WhatsApp"
                title="Send WhatsApp reminder"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            )}
            {customer.customerPhone && (
              <a
                href={`tel:${customer.customerPhone}`}
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-md hover:bg-blue-100 text-blue-700"
                aria-label="Call"
                title="Call"
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </button>

      {/* Expanded — per-booking breakdown */}
      {expanded && (
        <div className="px-3 pb-3 pl-9 space-y-2 bg-muted/10">
          {customer.bookings.map((b) => (
            <div key={b.bookingId} className="rounded-md border bg-background p-2 text-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/bookings/${b.bookingId}`}
                    className="font-semibold text-bridal-gold-dark hover:underline"
                  >
                    Booking #{b.bookingId}
                  </Link>
                  <span className="text-muted-foreground">
                    {fmtDate(b.bookingDate)} · {b.bookingTime}
                  </span>
                  <Badge variant="outline" className="text-[9px]">{b.status}</Badge>
                </div>
                <span className="font-bold tabular-nums text-rose-700">
                  {fmtPKR(b.totalOutstanding)}
                </span>
              </div>
              {/* Installments */}
              <div className="space-y-1">
                {b.installments.map((i) => {
                  const itone = BUCKET_TONE[i.bucket];
                  return (
                    <div
                      key={i.id}
                      className="flex items-center gap-2 text-[11px] rounded border-l-2 pl-2 py-0.5"
                      style={{ borderLeftColor:
                        i.bucket === "current" ? "rgb(16 185 129)" :
                        i.bucket === "days_1_30" ? "rgb(37 99 235)" :
                        i.bucket === "days_31_60" ? "rgb(217 119 6)" :
                        i.bucket === "days_61_90" ? "rgb(234 88 12)" :
                        "rgb(225 29 72)"
                      }}
                    >
                      <span className="font-medium w-[110px] truncate">{i.label}</span>
                      <span className="text-muted-foreground tabular-nums w-[80px]">
                        due {fmtDate(i.dueAt)}
                      </span>
                      <span className={`tabular-nums w-[70px] ${itone.text}`}>
                        {i.daysOverdue > 0 ? `${i.daysOverdue}d late` : "current"}
                      </span>
                      <span className="ml-auto font-semibold tabular-nums">
                        {fmtPKR(i.outstanding)}
                        <span className="text-muted-foreground font-normal">
                          {" / "}{fmtPKR(i.amount)}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReceivablesView() {
  const [data, setData] = useState<ReceivablesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bucketFilter, setBucketFilter] = useState<ReceivablesBucketKey | "all">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AnalyticsAPI.getReceivables();
      if (!res) {
        setError("Could not load receivables");
        setData(null);
      } else {
        setData(res);
      }
    } catch (e: any) {
      setError(e?.message || "Could not load receivables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.customers.filter((c) => {
      if (bucketFilter !== "all" && c.bucket !== bucketFilter) return false;
      if (q) {
        const hay = [
          c.customerName, c.customerEmail, c.customerPhone,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, bucketFilter, search]);

  const toggleRow = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const expandAll = () => {
    if (!filtered.length) return;
    const keys = filtered.map((c) =>
      (c.customerEmail || c.customerPhone || c.customerName || "?").toLowerCase(),
    );
    setExpanded(new Set(keys));
  };
  const collapseAll = () => setExpanded(new Set());

  const downloadCsv = () => {
    if (!data) return;
    const header = [
      "Customer", "Phone", "Email",
      "Outstanding (Rs)", "Oldest days overdue",
      "Open installments", "Bookings", "Bucket",
    ];
    const rows = filtered.map((c) => [
      c.customerName || "",
      c.customerPhone || "",
      c.customerEmail || "",
      String(Math.round(c.totalOutstanding)),
      String(c.oldestDaysOverdue),
      String(c.installmentsOpen),
      String(c.bookingCount),
      BUCKET_LABEL[c.bucket],
    ]);
    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((cell) => {
            const s = String(cell ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receivables-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${rows.length} row${rows.length === 1 ? "" : "s"}`);
  };

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-10" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-rose-700">
          {error || "Could not load receivables"}
          <div className="mt-3">
            <Button onClick={load} variant="outline" size="sm">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { buckets, totals, customers } = data;
  const allClear = totals.grandOutstanding <= 0;

  return (
    <div className="space-y-4">
      {/* Headline */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Grand outstanding</p>
            <p className={`text-2xl font-bold tabular-nums ${
              totals.oldestDaysOverdue > 60 ? "text-rose-700" :
              totals.oldestDaysOverdue > 30 ? "text-amber-700" :
              "text-bridal-gold-dark"
            }`}>
              {fmtPKR(totals.grandOutstanding)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Customers</p>
            <p className="text-lg font-semibold tabular-nums">{totals.customerCount}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Open installments</p>
            <p className="text-lg font-semibold tabular-nums">{totals.installmentsOpen}</p>
          </div>
          {totals.oldestDaysOverdue > 0 && (
            <div className="flex items-start gap-1.5 ml-auto">
              <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                totals.oldestDaysOverdue > 90 ? "text-rose-700" : "text-amber-700"
              }`} />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Oldest overdue</p>
                <p className="text-lg font-semibold tabular-nums">{totals.oldestDaysOverdue}d</p>
              </div>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              {loading
                ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={downloadCsv} disabled={!filtered.length}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {allClear ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
            <p className="text-lg font-semibold">Nothing owed — you&apos;re all clear.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Every installment on your books is fully paid. Keep it up.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Bucket strip */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
            <button
              type="button"
              onClick={() => setBucketFilter("all")}
              className={`text-left rounded-lg border-2 p-3 transition-all ${
                bucketFilter === "all"
                  ? "border-bridal-gold-dark bg-bridal-gold-dark/5 ring-2 ring-offset-1 ring-bridal-gold-dark/30"
                  : "border-neutral-200 hover:border-bridal-gold-dark bg-background"
              }`}
            >
              <p className="text-[10px] uppercase tracking-wide font-semibold text-bridal-gold-dark">
                All
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums">{fmtPKR(totals.grandOutstanding)}</p>
              <p className="text-[11px] text-muted-foreground">
                {totals.installmentsOpen} installment{totals.installmentsOpen === 1 ? "" : "s"}
              </p>
            </button>
            {BUCKET_ORDER.map((k) => (
              <BucketCard
                key={k}
                k={k}
                bucket={buckets[k]}
                active={bucketFilter === k}
                onClick={() => setBucketFilter(bucketFilter === k ? "all" : k)}
              />
            ))}
          </div>

          {/* Filter strip */}
          <Card>
            <CardContent className="p-3 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="pl-7 h-9"
                  placeholder="Search by name, phone, or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-semibold">{filtered.length}</span>
                {" "}of {customers.length}
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <Button variant="ghost" size="sm" onClick={expandAll}>
                  Expand all
                </Button>
                <Button variant="ghost" size="sm" onClick={collapseAll}>
                  Collapse all
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customer rows */}
          <Card>
            <CardContent className="p-0 divide-y divide-transparent">
              {filtered.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground text-center">
                  No customers match the filter.
                </div>
              ) : (
                filtered.map((c) => {
                  const key = (
                    c.customerEmail || c.customerPhone || c.customerName || "?"
                  ).toLowerCase();
                  return (
                    <CustomerRow
                      key={key}
                      customer={c}
                      expanded={expanded.has(key)}
                      onToggle={() => toggleRow(key)}
                    />
                  );
                })
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
