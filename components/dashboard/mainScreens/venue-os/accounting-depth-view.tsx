"use client";

/**
 * Venue-OS P2 · WS5 — Accounting depth (auto Annex-B + trial balance + §21
 * add-back). The CA-reconciliation layer read straight off the GL: the FBR
 * Annex-B P&L on real codes with a tax-vs-management toggle (differ only by
 * is_declared), a balanced trial balance, and the §21 cash-disallowance preview
 * (per clause, in rupees, from effective-dated rules — NOT_READY when a rule is
 * unverified, never a guess). Gated on isAccountingDepthOn(); the backend 404s
 * until ACCOUNTING_DEPTH_ON. Additive.
 */
import * as React from "react";
import { venueOsApi, type AnnexBReport, type TrialBalance, type Section21Report } from "@/lib/api/venueOs";
import { isAccountingDepthOn } from "@/lib/accounting-depth-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number): string => "Rs " + Math.round(n).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function AccountingDepthView(): React.ReactElement | null {
  const enabled = isAccountingDepthOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [view, setView] = React.useState<"DECLARED" | "MANAGEMENT">("DECLARED");
  const [annexb, setAnnexb] = React.useState<AnnexBReport | null>(null);
  const [tb, setTb] = React.useState<TrialBalance | null>(null);
  const [s21, setS21] = React.useState<Section21Report | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function load(): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      const b = Number(businessId);
      const [a, t, s] = await Promise.all([
        venueOsApi.annexB(b, from, to, view),
        venueOsApi.trialBalance(b, { from, to }),
        venueOsApi.section21Addbacks(b, from, to),
      ]);
      setAnnexb(a);
      setTb(t);
      setS21(s);
    } catch (e: unknown) {
      setErr(readErr(e, "Accounting depth is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const ready = businessId && from && to;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounting depth (Annex-B · trial balance · §21)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-2 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ml-2 rounded border px-2 py-1" />
          </label>
          <div className="flex gap-1">
            <Button size="sm" variant={view === "DECLARED" ? "default" : "outline"} onClick={() => setView("DECLARED")}>
              Tax view
            </Button>
            <Button size="sm" variant={view === "MANAGEMENT" ? "default" : "outline"} onClick={() => setView("MANAGEMENT")}>
              Management
            </Button>
          </div>
          <Button size="sm" onClick={() => void load()} disabled={!ready || busy}>
            {busy ? "Loading…" : "Reconcile"}
          </Button>
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}

        {annexb && (
          <div className="rounded-md border p-3">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium">
              FBR Annex-B <Badge variant="secondary">{annexb.view}</Badge>
              <span className="ml-auto">Net {PKR(annexb.netProfit)}</span>
            </div>
            <div className="text-sm text-muted-foreground">Revenue {PKR(annexb.revenue.total)} · Expenses {PKR(annexb.expenses.total)}</div>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {annexb.expenses.byAnnexbCode.map((g) => (
                  <tr key={g.annexbCode} className="border-b last:border-0">
                    <td className="py-1 pr-3 font-mono text-xs">{g.annexbCode}</td>
                    <td className="py-1 pr-3 text-muted-foreground">{g.accounts.map((a) => a.name).join(", ")}</td>
                    <td className="py-1 text-right">{PKR(g.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {annexb.expenses.uncodedExpense.length > 0 && (
              <p className="mt-2 text-xs text-amber-600">
                ⚠ Uncoded (review with your CA): {annexb.expenses.uncodedExpense.map((u) => `${u.name} ${PKR(u.amount)}`).join(" · ")}
              </p>
            )}
          </div>
        )}

        {tb && (
          <div className="flex items-center gap-3 rounded-md border p-3 text-sm">
            <span className="font-medium">Trial balance</span>
            {tb.balanced ? <Badge className="bg-emerald-500">balanced</Badge> : <Badge variant="destructive">off by {PKR(tb.variance)}</Badge>}
            <span className="text-muted-foreground">DR {PKR(tb.totalDebit)} · CR {PKR(tb.totalCredit)} · {tb.accounts.length} accounts</span>
          </div>
        )}

        {s21 && (
          <div className="rounded-md border p-3 text-sm">
            <div className="mb-1 font-medium">§21 cash add-back preview · total {PKR(s21.totalDisallowedPkr)}</div>
            <ul className="space-y-1">
              {s21.clauses.map((c) => (
                <li key={c.clause} className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">{c.clause}</span>
                  {c.status === "READY" ? (
                    <span className={c.disallowedPkr ? "text-red-600" : "text-emerald-600"}>{PKR(c.disallowedPkr || 0)} disallowed</span>
                  ) : c.status === "NOT_READY" ? (
                    <Badge variant="secondary">rate not verified — not shown</Badge>
                  ) : (
                    <Badge variant="secondary">no rule</Badge>
                  )}
                  {c.framing && <span className="w-full text-xs text-muted-foreground">{c.framing}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AccountingDepthView;
