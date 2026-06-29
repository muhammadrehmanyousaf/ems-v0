"use client";

/**
 * Venue-OS — Booking → GL posting (P1 FE, WS-2). Posts a balanced double-entry
 * for a booking-money event off the seeded LedgerMapping templates, with a
 * management-vs-tax (is_declared) flag and a cash/accrual basis. "Preview" is a
 * dry-run (nothing written) that shows the DR/CR lines; "Post" writes and is
 * idempotent per (event, booking) so a double-click is a safe no-op. Gated on
 * isGlEngineOn(); the backend 404s until GL_ENGINE_ON. Additive.
 */
import * as React from "react";
import { venueOsApi, type IsDeclared, type GlPostResult } from "@/lib/api/venueOs";
import { isGlEngineOn } from "@/lib/gl-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number): string => "Rs " + Math.round(n).toLocaleString("en-PK");

// Curated booking-money events from the seeded LedgerMapping templates.
const EVENT_TYPES: { value: string; label: string }[] = [
  { value: "BOOKING_ADVANCE_RECEIVED", label: "Advance received" },
  { value: "BOOKING_FINAL_PAYMENT", label: "Final payment" },
  { value: "BOOKING_REVENUE_RECOGNISED", label: "Revenue recognised" },
  { value: "SECURITY_DEPOSIT_RECEIVED", label: "Security deposit received" },
  { value: "WHT_236CB_COLLECTED", label: "236CB withholding collected" },
  { value: "PROVINCIAL_TAX_COLLECTED", label: "Provincial tax collected" },
  { value: "ADVANCE_REFUNDED", label: "Advance refunded" },
];

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function BookingGlPost(): React.ReactElement | null {
  const enabled = isGlEngineOn();
  const [bookingId, setBookingId] = React.useState<string>("");
  const [eventType, setEventType] = React.useState<string>(EVENT_TYPES[0].value);
  const [amount, setAmount] = React.useState<string>("");
  const [counterparty, setCounterparty] = React.useState<string>("");
  const [isDeclared, setIsDeclared] = React.useState<IsDeclared>("MANAGEMENT_ONLY");
  const [basis, setBasis] = React.useState<"CASH" | "ACCRUAL">("CASH");
  const [result, setResult] = React.useState<GlPostResult | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function submit(dryRun: boolean): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      setResult(
        await venueOsApi.postBookingToGl(Number(bookingId), {
          eventType,
          amount: Number(amount),
          isDeclared,
          basis,
          counterpartyBusinessId: counterparty ? Number(counterparty) : undefined,
          dryRun,
        }),
      );
    } catch (e: unknown) {
      setErr(readErr(e, "GL posting is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;
  const ready = bookingId && amount && Number(amount) > 0;
  const lines = result?.journalEntry?.lines ?? [];
  const totalDr = lines.reduce((s, l) => s + Number(l.debit || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post booking event to the ledger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Booking #
            <input type="number" value={bookingId} onChange={(e) => setBookingId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <label className="text-sm">
            Event
            <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="ml-2 rounded border px-2 py-1">
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Amount
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="ml-2 w-32 rounded border px-2 py-1" />
          </label>
          <label className="text-sm" title="If this deal is with another business in your group (ghar-ka-maal), enter its id so group consolidation can net it out.">
            Counterparty biz # <span className="text-muted-foreground">(optional)</span>
            <input type="number" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            <Button size="sm" variant={isDeclared === "MANAGEMENT_ONLY" ? "default" : "outline"} onClick={() => setIsDeclared("MANAGEMENT_ONLY")}>
              Management
            </Button>
            <Button size="sm" variant={isDeclared === "DECLARED" ? "default" : "outline"} onClick={() => setIsDeclared("DECLARED")}>
              Declared
            </Button>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant={basis === "CASH" ? "default" : "outline"} onClick={() => setBasis("CASH")}>
              Cash
            </Button>
            <Button size="sm" variant={basis === "ACCRUAL" ? "default" : "outline"} onClick={() => setBasis("ACCRUAL")}>
              Accrual
            </Button>
          </div>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void submit(true)} disabled={!ready || busy}>
              Preview
            </Button>
            <Button size="sm" onClick={() => void submit(false)} disabled={!ready || busy}>
              Post
            </Button>
          </div>
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}

        {result && (
          <div className="rounded-md border p-3 text-sm">
            <div className="mb-2 flex items-center gap-2">
              {result.dryRun ? (
                <Badge variant="secondary">preview (not written)</Badge>
              ) : result.idempotentHit ? (
                <Badge variant="secondary">already posted</Badge>
              ) : (
                <Badge className="bg-emerald-500">posted</Badge>
              )}
              {result.journalEntry?.jeNo && <span className="text-xs text-muted-foreground">{result.journalEntry.jeNo}</span>}
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1 pr-3">Account</th>
                  <th className="py-1 pr-3 text-right">Debit</th>
                  <th className="py-1 pr-3 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1 pr-3">#{l.accountId}</td>
                    <td className="py-1 pr-3 text-right">{Number(l.debit) ? PKR(Number(l.debit)) : "—"}</td>
                    <td className="py-1 pr-3 text-right">{Number(l.credit) ? PKR(Number(l.credit)) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-1 flex justify-between border-t pt-1 text-xs text-muted-foreground">
              <span>{result.journalEntry?.isDeclared} · {result.journalEntry?.basis}</span>
              <span>balanced @ {PKR(totalDr)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BookingGlPost;
