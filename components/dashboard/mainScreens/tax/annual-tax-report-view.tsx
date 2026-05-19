'use client';

/**
 * Phase 4 #10.6 — Annual tax report.
 *
 * Pakistani fiscal year (1 Jul → 30 Jun) by default, calendar year
 * optional. Shows revenue + expenses + P&L by month, expense
 * breakdown by category, and a single-button PDF export the vendor
 * can hand to their tax accountant.
 */

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  Receipt,
  FileText,
  Banknote,
  ChevronDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { TaxReportAPI, type AnnualTaxReport } from '@/lib/api/tax';

function fmtPKR(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `Rs. ${Math.round(n).toLocaleString('en-PK')}`;
}

function currentFiscalYear(): number {
  // Pakistan fiscal: 1 Jul → 30 Jun. "FY2026" means 1 Jul 2026 - 30 Jun 2027.
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-11
  // Before Jul → previous-year fiscal still running
  return m >= 6 ? y : y - 1;
}

export default function AnnualTaxReportView() {
  const [year, setYear] = useState<number>(currentFiscalYear());
  const [basis, setBasis] = useState<'fiscal' | 'calendar'>('fiscal');
  const [report, setReport] = useState<AnnualTaxReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const years = useMemo(() => {
    const cur = currentFiscalYear();
    return [cur + 1, cur, cur - 1, cur - 2, cur - 3, cur - 4];
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    TaxReportAPI.getAnnualReport(year, basis)
      .then((r) => {
        if (!cancelled) setReport(r);
      })
      .catch((e) => {
        if (cancelled) return;
        toast.error(
          e?.response?.data?.message || 'Failed to load tax report',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year, basis]);

  const downloadPdf = async () => {
    try {
      setDownloading(true);
      const blob = await TaxReportAPI.pdfBlob(year, basis);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `annual-tax-report-${year}-${basis}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'PDF export failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {basis === 'fiscal'
                  ? `FY ${y}-${(y + 1).toString().slice(-2)}`
                  : String(y)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={basis} onValueChange={(v) => setBasis(v as any)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fiscal">Fiscal year (Jul–Jun)</SelectItem>
            <SelectItem value="calendar">Calendar year (Jan–Dec)</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Button
            type="button"
            size="sm"
            onClick={downloadPdf}
            disabled={downloading || loading || !report}
            className="gap-1.5"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !report ? (
        <p className="text-sm text-muted-foreground">No report available.</p>
      ) : (
        <>
          {/* Period header */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold">{report.period.label}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generated{' '}
                    {new Date(report.generatedAt).toLocaleDateString('en-PK')}
                  </p>
                </div>
                {report.summary.fbrSubmittedCount > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    {report.summary.fbrSubmittedCount} FBR-submitted invoices
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary KPIs */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <KpiCard
              icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
              label="Booking revenue"
              value={fmtPKR(report.summary.bookingRevenue)}
              sub={`${report.summary.bookingCount} bookings`}
            />
            <KpiCard
              icon={<FileText className="h-4 w-4 text-violet-600" />}
              label="Sheet revenue (paid)"
              value={fmtPKR(report.summary.sheetRevenue)}
              sub={`${report.summary.sheetCount} sheets`}
            />
            <KpiCard
              icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
              label="Total expenses"
              value={fmtPKR(report.summary.totalExpenses)}
              sub={`${report.summary.expenseCount} entries`}
            />
            <KpiCard
              icon={<Banknote className="h-4 w-4 text-blue-600" />}
              label="Net P&L"
              value={fmtPKR(report.summary.netPnl)}
              sub={
                report.summary.netPnl >= 0 ? 'Profit' : 'Loss'
              }
              tone={report.summary.netPnl >= 0 ? 'good' : 'bad'}
            />
          </div>

          {/* Two-col: Expenses breakdown + Monthly */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-bridal-gold" />
                  <span className="text-sm font-semibold text-neutral-700">
                    Expenses by category
                  </span>
                </div>
                {Object.values(report.expensesByCategory).every(
                  (v) => v === 0,
                ) ? (
                  <p className="text-xs text-neutral-400">
                    No expenses logged in this period.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {Object.entries(report.expensesByCategory)
                      .filter(([, v]) => v > 0)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cat, amt]) => (
                        <li
                          key={cat}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="capitalize text-neutral-700">
                            {cat}
                          </span>
                          <span className="font-medium text-neutral-900">
                            {fmtPKR(amt)}
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-bridal-gold" />
                  <span className="text-sm font-semibold text-neutral-700">
                    Monthly breakdown
                  </span>
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-neutral-500">
                        <th className="text-left font-medium pb-1">Month</th>
                        <th className="text-right font-medium pb-1">Revenue</th>
                        <th className="text-right font-medium pb-1">Bookings</th>
                        <th className="text-right font-medium pb-1">
                          Expenses
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.months.map((m, i) => (
                        <tr key={i} className="border-t border-neutral-100">
                          <td className="py-1">{m.monthLabel}</td>
                          <td className="py-1 text-right tabular-nums">
                            {fmtPKR(m.revenue)}
                          </td>
                          <td className="py-1 text-right tabular-nums">
                            {m.bookingCount}
                          </td>
                          <td className="py-1 text-right tabular-nums">
                            {fmtPKR(m.expenses)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-[11px] text-muted-foreground italic">
            This report aggregates your platform data. Review with your tax
            accountant before submitting to FBR — it is not a substitute for
            a filed return.
          </p>
        </>
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: 'good' | 'bad';
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-neutral-500">
          {icon}
          {label}
        </div>
        <div
          className={[
            'text-lg font-bold',
            tone === 'good'
              ? 'text-emerald-700'
              : tone === 'bad'
                ? 'text-rose-700'
                : 'text-neutral-900',
          ].join(' ')}
        >
          {value}
        </div>
        <div className="text-xs text-neutral-500">{sub}</div>
      </CardContent>
    </Card>
  );
}
