"use client";

/**
 * Venue-OS P2 · WS5-C — §165 withholding statement + one-tap CA/Tally export.
 * Pick a business + period: the §165 view groups every tax collected by section
 * with a deposited/pending split (nil-still-required note); the CA export shows a
 * balanced daybook and downloads the CSV your accountant imports. "File" records
 * an immutable, hash-stamped log for the raid-defence pack. Gated on
 * isAccountingDepthOn() — the backend 404s until ACCOUNTING_DEPTH_ON.
 */
import * as React from "react";
import { venueOsApi, type Section165, type CaExport } from "@/lib/api/venueOs";
import { isAccountingDepthOn } from "@/lib/accounting-depth-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function ComplianceExportView(): React.ReactElement | null {
  const enabled = isAccountingDepthOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [from, setFrom] = React.useState<string>(`${new Date().getFullYear()}-07-01`);
  const [to, setTo] = React.useState<string>(`${new Date().getFullYear()}-09-30`);
  const [s165, setS165] = React.useState<Section165 | null>(null);
  const [ca, setCa] = React.useState<CaExport | null>(null);
  const [filed, setFiled] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Accounting depth is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const bid = Number(businessId);

  function downloadCsv(): void {
    if (!ca) return;
    const blob = new Blob([ca.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ca-export-${bid}-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>§165 statement &amp; CA / Tally export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>Business #<input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" /></label>
          <label>From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-1 rounded border px-2 py-1" /></label>
          <label>To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ml-1 rounded border px-2 py-1" /></label>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setS165(await venueOsApi.section165(bid, { from, to })))} disabled={!businessId || busy}>§165</Button>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setCa(await venueOsApi.caExport(bid, { from, to })))} disabled={!businessId || busy}>CA export</Button>
        </div>

        {s165 && (
          <div className="space-y-1 rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">§165 — {from} to {to}</span>
              {s165.isNil ? <Badge variant="secondary">nil</Badge> : <Badge>{s165.totals.count} txns</Badge>}
              {s165.totals.pendingPkr > 0 && <Badge variant="destructive">pending {PKR(s165.totals.pendingPkr)}</Badge>}
            </div>
            {s165.sections.map((sec) => (
              <div key={sec.section} className="border-t pt-1 text-xs">
                <div className="flex justify-between font-medium"><span>{sec.section}</span><span>tax {PKR(sec.taxPkr)} · deposited {PKR(sec.depositedPkr)}</span></div>
                {sec.lines.slice(0, 6).map((l, i) => (
                  <div key={i} className="flex justify-between text-muted-foreground">
                    <span>{l.partyName || "—"} {l.cnicMasked ? `(${l.cnicMasked})` : ""} · {l.filerStatus}</span>
                    <span>{PKR(l.taxCollectedPkr)} {l.status === "DEPOSITED" ? `· CPR ${l.cprNumber}` : "· pending"}</span>
                  </div>
                ))}
              </div>
            ))}
            <p className="pt-1 text-xs text-muted-foreground">{s165.note}</p>
            <Button size="sm" onClick={() => void guard(async () => { const f = await venueOsApi.recordFiling(bid, { filingType: "SECTION_165", periodFrom: from, periodTo: to }); setFiled(`§165 filed · hash ${f.exportHash.slice(0, 12)}…`); })} disabled={busy}>File §165</Button>
          </div>
        )}

        {ca && (
          <div className="space-y-1 rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">CA / Tally export</span>
              {ca.balanced ? <Badge>balanced</Badge> : <Badge variant="destructive">out of balance {PKR(ca.variance)}</Badge>}
              <span className="text-muted-foreground">{ca.voucherCount} vouchers · {ca.lineCount} lines</span>
            </div>
            <p className="text-xs text-muted-foreground">DR {PKR(ca.totalDebit)} · CR {PKR(ca.totalCredit)} (DECLARED only)</p>
            <Button size="sm" variant="outline" onClick={downloadCsv} disabled={busy}>Download CSV</Button>
          </div>
        )}

        {filed && <p className="text-sm text-emerald-600">{filed}</p>}
        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default ComplianceExportView;
