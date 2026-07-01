"use client";

/**
 * Venue-OS P2 · WS2-depth — partner Capital/Current/Loan ledgers + profit
 * appropriation (s.92) + the immutable, hash-chained Partner Statement. Load a
 * business's cap-table, pick a partner, see his GL-derived balances (with an
 * over-draw flag), record a capital intro / drawing / loan, run the year's profit
 * appropriation, and generate the tamper-evident statement. Read/posts via the
 * GL; gated on isCapTableOn() — the backend 404s until ENABLE_CAP_TABLE.
 */
import * as React from "react";
import { venueOsApi, type CapTable, type PartnerLedger, type PartnerStatement, type ProfitAppropriationRun } from "@/lib/api/venueOs";
import { isCapTableOn } from "@/lib/cap-table-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string | null | undefined): string => "Rs " + Math.round(Number(n || 0)).toLocaleString("en-PK");
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function PartnerLedgerView(): React.ReactElement | null {
  const enabled = isCapTableOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [table, setTable] = React.useState<CapTable | null>(null);
  const [partnerId, setPartnerId] = React.useState<number | null>(null);
  const [ledger, setLedger] = React.useState<PartnerLedger | null>(null);
  const [run, setRun] = React.useState<ProfitAppropriationRun | null>(null);
  const [stmt, setStmt] = React.useState<PartnerStatement | null>(null);
  const [amount, setAmount] = React.useState<string>("");
  const [drawType, setDrawType] = React.useState<string>("PROFIT");
  const [period, setPeriod] = React.useState<string>(String(new Date().getFullYear()));
  const [netProfit, setNetProfit] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Cap-table is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const bid = Number(businessId);

  async function loadLedger(pid: number): Promise<void> {
    setPartnerId(pid);
    setLedger(await venueOsApi.partnerLedger(pid));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Partner ledgers &amp; profit appropriation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => { setTable(await venueOsApi.getCapTable(bid)); setLedger(null); setPartnerId(null); })} disabled={!businessId || busy}>
            Load partners
          </Button>
        </div>

        {table && (
          <div className="flex flex-wrap gap-1 text-xs">
            {table.partners.map((p) => (
              <Button key={p.id} size="sm" variant={partnerId === p.id ? "default" : "outline"} onClick={() => void guard(async () => loadLedger(p.id))} disabled={busy}>
                {p.partnerName} · {p.sharePercent}%
              </Button>
            ))}
          </div>
        )}

        {ledger && (
          <div className="space-y-2 rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{ledger.partnerName}</span>
              <Badge variant="secondary">{ledger.partnerType}</Badge>
              {ledger.isOverdrawn && <Badge variant="destructive">over-drawn {PKR(ledger.overdrawnByPkr)}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div><div className="text-muted-foreground">Capital</div><div className="font-medium">{PKR(ledger.capitalBalancePkr)}</div></div>
              <div><div className="text-muted-foreground">Current</div><div className="font-medium">{PKR(ledger.currentBalancePkr)}</div></div>
              <div><div className="text-muted-foreground">Loan to firm</div><div className="font-medium">{PKR(ledger.loanBalancePkr)}</div></div>
              <div><div className="text-muted-foreground">Total equity</div><div className="font-medium">{PKR(ledger.totalEquityPkr)}</div></div>
            </div>

            <div className="flex flex-wrap items-end gap-2 border-t pt-2">
              <input type="number" placeholder="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-28 rounded border px-2 py-1" />
              <Button size="sm" variant="outline" onClick={() => void guard(async () => { await venueOsApi.recordCapital(ledger.partnerEquityId, { amountPkr: Number(amount), mode: "INTRO" }); await loadLedger(ledger.partnerEquityId); })} disabled={!amount || busy}>+ Capital</Button>
              <select value={drawType} onChange={(e) => setDrawType(e.target.value)} className="rounded border px-2 py-1">
                {["PROFIT", "SALARY", "OVER_DRAW", "LOAN"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <Button size="sm" variant="outline" onClick={() => void guard(async () => { await venueOsApi.recordDrawing(ledger.partnerEquityId, { amountPkr: Number(amount), drawingType: drawType }); await loadLedger(ledger.partnerEquityId); })} disabled={!amount || busy}>− Drawing</Button>
              <Button size="sm" variant="outline" onClick={() => void guard(async () => { setStmt(await venueOsApi.generateStatement(ledger.partnerEquityId, {})); })} disabled={busy}>Generate statement</Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <span className="font-medium">Appropriate profit</span>
          <input type="text" placeholder="period e.g. 2026" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-28 rounded border px-2 py-1" />
          <input type="number" placeholder="net profit (optional)" value={netProfit} onChange={(e) => setNetProfit(e.target.value)} className="w-40 rounded border px-2 py-1" />
          <Button size="sm" onClick={() => void guard(async () => setRun(await venueOsApi.appropriateProfit(bid, { period, ...(netProfit ? { netProfitPkr: Number(netProfit) } : {}) })))} disabled={!businessId || !period || busy}>
            Run appropriation
          </Button>
        </div>

        {run && (
          <div className="space-y-0.5 rounded-md border p-3 text-xs">
            <p className="text-sm">Net {PKR(run.netProfitPkr)} → appropriated {PKR(run.appropriatedPkr)} · retained {PKR(run.retainedPkr)}</p>
            {run.lines.map((l) => (
              <div key={l.partnerEquityId} className="flex flex-wrap justify-between gap-2 border-t pt-0.5">
                <span>{l.partnerNameSnapshot}</span>
                <span className="text-muted-foreground">sal {PKR(l.salaryPkr)} · int {PKR(l.interestOnCapitalPkr)} · profit {PKR(l.profitSharePkr)}</span>
                <span className="font-medium">share {PKR(l.totalAppropriatedPkr)} · s.92 exempt {PKR(l.s92ExemptPkr)}</span>
              </div>
            ))}
          </div>
        )}

        {stmt && (
          <div className="space-y-0.5 rounded-md border p-3 text-xs">
            <p className="text-sm font-medium">Statement — {stmt.partnerNameSnapshot} (as of {stmt.asOfDate})</p>
            <div className="flex flex-wrap gap-x-4">
              <span>Capital {PKR(stmt.closingCapitalPkr)}</span>
              <span>Current {PKR(stmt.closingCurrentPkr)}</span>
              <span>Drawings {PKR(stmt.drawingsPkr)}</span>
              <span>Loan {PKR(stmt.loanBalancePkr)}</span>
              <span className="font-medium">Total equity {PKR(stmt.totalEquityPkr)}</span>
              {stmt.isOverdrawn && <Badge variant="destructive">over-drawn</Badge>}
            </div>
            <p className="text-muted-foreground">immutable · hash {stmt.integrityHash.slice(0, 16)}…</p>
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default PartnerLedgerView;
