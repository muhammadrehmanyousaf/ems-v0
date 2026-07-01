"use client";

/**
 * Venue-OS P3-A — the cross-venue BI cockpit. Per-venue KPIs off the balanced GL
 * (revenue / cost / margin / events / avg value), a same-store league table, a
 * Hijri-aligned YoY (the wedding season drifts ~11 days/year against the Gregorian),
 * and a drilldown into the GL accounts. Gated on isBiCockpitOn() — the backend 404s
 * until ENABLE_BI_COCKPIT.
 */
import * as React from "react";
import { venueOsApi, type KpiBundle, type HijriYoY } from "@/lib/api/venueOs";
import { isBiCockpitOn } from "@/lib/bi-cockpit-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}
const HIJRI_MONTHS = ["Muharram", "Safar", "Rabi-ul-Awwal", "Rabi-us-Sani", "Jumada-al-Awwal", "Jumada-as-Sani", "Rajab", "Shaban", "Ramadan", "Shawwal", "Zul-Qadah", "Zul-Hijjah"];

export function BiCockpitView(): React.ReactElement | null {
  const enabled = isBiCockpitOn();
  const yr = new Date().getFullYear();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [from, setFrom] = React.useState<string>(`${yr}-01-01`);
  const [to, setTo] = React.useState<string>(`${yr}-12-31`);
  const [k, setK] = React.useState<KpiBundle | null>(null);
  const [yoy, setYoy] = React.useState<HijriYoY | null>(null);
  const [hMonth, setHMonth] = React.useState<string>("3");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "BI cockpit is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const bid = Number(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>CFO cockpit — cross-venue KPIs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>Business #<input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" /></label>
          <label>From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-1 rounded border px-2 py-1" /></label>
          <label>To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ml-1 rounded border px-2 py-1" /></label>
          <Button size="sm" onClick={() => void guard(async () => setK(await venueOsApi.businessKpis(bid, { from, to })))} disabled={!businessId || busy}>KPIs</Button>
        </div>

        {k && (
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-md border p-2"><div className="text-xs text-muted-foreground">Revenue</div><div className="font-medium">{PKR(k.REVENUE)}</div></div>
            <div className="rounded-md border p-2"><div className="text-xs text-muted-foreground">Cost</div><div className="font-medium">{PKR(k.EXPENSE)}</div></div>
            <div className="rounded-md border p-2"><div className="text-xs text-muted-foreground">Gross margin</div><div className="font-medium">{PKR(k.GROSS_MARGIN)} ({k.MARGIN_PCT ?? "—"}%)</div></div>
            <div className="rounded-md border p-2"><div className="text-xs text-muted-foreground">Events</div><div className="font-medium">{k.EVENT_COUNT}</div></div>
            <div className="rounded-md border p-2"><div className="text-xs text-muted-foreground">Avg event value</div><div className="font-medium">{PKR(k.AVG_EVENT_VALUE)}</div></div>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <span className="font-medium">Hijri YoY</span>
          <select value={hMonth} onChange={(e) => setHMonth(e.target.value)} className="rounded border px-2 py-1">
            {HIJRI_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setYoy(await venueOsApi.hijriYoY(bid, { hijriMonth: Number(hMonth), hijriYears: [1445, 1446, 1447], kpi: "REVENUE" })))} disabled={!businessId || busy}>Compare seasons</Button>
        </div>

        {yoy && (
          <div className="rounded-md border p-3 text-xs">
            <p className="text-sm font-medium">{yoy.monthName} — revenue by year</p>
            {yoy.series.map((s) => (
              <div key={s.hijriYear} className="flex justify-between border-t pt-0.5">
                <span>{s.hijriYear} AH ({s.from} → {s.to})</span>
                <span className="font-medium">{PKR(s.value)} {s.yoyPct != null && <span className={s.yoyPct >= 0 ? "text-emerald-600" : "text-destructive"}>({s.yoyPct >= 0 ? "+" : ""}{s.yoyPct}%)</span>}</span>
              </div>
            ))}
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default BiCockpitView;
