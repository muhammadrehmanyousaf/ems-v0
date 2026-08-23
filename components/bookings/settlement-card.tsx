"use client";

/**
 * WW-SETTLEMENT — the final bill, for both sides of a booking.
 *
 * The night of the event is where a Pakistani venue makes or loses money, and
 * where nearly every dispute happens: "why is it more than you said?". Until
 * now the platform had the arithmetic and no screen — `settlementPolicy.js` was
 * called from nowhere — so the bill was struck on WhatsApp at the gate.
 *
 * One component, two roles, for the same reason `RequirementsCard` is: what
 * ends an argument is that both parties saw the same numbers. The customer sees
 * the terms and the arithmetic and cannot edit them; the vendor locks the
 * guarantee and records the count.
 *
 * The `why` on every line is the point of the whole screen. A family that can
 * read "280 attended. The guarantee was agreed when you booked, and the food
 * was prepared for 400." does not have the argument at all.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calculator, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/utils/api-error";
import { SettlementAPI, formatPkr, type FinalCounts } from "@/lib/api/settlement";

const inputCls =
  "h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none ring-ring focus-visible:ring-2";

export function SettlementCard({
  bookingId,
  role,
}: {
  bookingId: number;
  role: "vendor" | "customer";
}) {
  const qc = useQueryClient();
  const [counting, setCounting] = useState(false);
  const [counts, setCounts] = useState<FinalCounts>({ total: 0, kidsUnder5: 0, kids5to12: 0, staff: 0 });
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["settlement", bookingId],
    queryFn: () => SettlementAPI.preview(bookingId),
    retry: false,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["settlement", bookingId] });
    qc.invalidateQueries({ queryKey: ["bookings"] });
  };

  const lockMut = useMutation({
    mutationFn: () => SettlementAPI.lock(bookingId),
    onSuccess: (r) => { toast.success(`Guarantee locked at ${r.guaranteed} guests.`); invalidate(); },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't lock the headcount")),
  });

  const settleMut = useMutation({
    mutationFn: () => SettlementAPI.settle(bookingId, counts, note.trim() || undefined),
    onSuccess: (r) => {
      toast.success(`Settled — ${formatPkr(r.foodTotal)}.`);
      setCounting(false);
      invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't settle this booking")),
  });

  if (isLoading || !data) return null;

  // A flat-priced booking has no per-head rate, so there is nothing to settle
  // on the guest count. Say that rather than inventing a rate.
  if (!data.settleable) {
    if (role === "customer") return null;
    return (
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Final bill</h3>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">{data.reason}</p>
      </div>
    );
  }

  const bill = data.bill;
  const settled = data.settled;

  // Children and staff are counted WITHIN the total, so the form has to refuse
  // a breakdown that exceeds it — the same guard the server applies.
  const sub = (counts.kidsUnder5 ?? 0) + (counts.kids5to12 ?? 0) + (counts.staff ?? 0);
  const countsProblem =
    counts.total <= 0 ? "Enter the total counted on the night."
      : sub > counts.total ? "Children and staff are counted within the total, not on top of it."
        : null;

  return (
    <div className={`rounded-xl border p-4 ${settled ? "border-emerald-300 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20" : "border-border"}`}>
      <div className="flex items-center gap-2">
        {settled ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Calculator className="h-4 w-4 text-muted-foreground" />}
        <h3 className="text-sm font-semibold">{settled ? "Final bill — settled" : "Final bill"}</h3>
        {data.locked && !settled && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" /> Guarantee locked
          </span>
        )}
      </div>

      {/* Stated BEFORE the night, not discovered at settlement. */}
      {!settled && Array.isArray(data.terms) && data.terms.length > 0 && (
        <ul className="mt-2 space-y-1">
          {data.terms.map((t, i) => (
            <li key={i} className="text-xs text-muted-foreground">{t}</li>
          ))}
        </ul>
      )}

      {bill && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {bill.lines.map((l, i) => (
                <tr key={i} className="border-b border-border/60 align-top last:border-0">
                  <td className="py-2 pr-3">
                    <div>{l.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{l.why}</div>
                  </td>
                  <td className="whitespace-nowrap py-2 text-right tabular-nums">{formatPkr(l.amount)}</td>
                </tr>
              ))}
              {data.staffMeals && (
                <tr className="border-b border-border/60 align-top">
                  <td className="py-2 pr-3">
                    <div>{data.staffMeals.count} staff / drivers</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Billed at {formatPkr(data.staffMeals.rate)} each, outside the per-head count.
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-2 text-right tabular-nums">{formatPkr(data.staffMeals.amount)}</td>
                </tr>
              )}
              <tr className="border-t-2 border-border">
                <td className="py-2 font-semibold">Total</td>
                <td className="py-2 text-right font-semibold tabular-nums">{formatPkr(data.foodTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {data.heads && data.heads.notes.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">{data.heads.notes.join(" · ")}</p>
      )}

      {role === "vendor" && !settled && (
        <div className="mt-3 flex flex-wrap gap-2">
          {!data.locked && (
            <Button size="sm" variant="outline" disabled={lockMut.isPending} onClick={() => lockMut.mutate()}>
              {lockMut.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Lock className="mr-1.5 h-3.5 w-3.5" />}
              Lock the guarantee at {data.guaranteed}
            </Button>
          )}
          {!counting && (
            <Button
              size="sm"
              onClick={() => {
                setCounts({ total: data.guaranteed, kidsUnder5: 0, kids5to12: 0, staff: 0 });
                setCounting(true);
              }}
            >
              Enter the count from the night
            </Button>
          )}
        </div>
      )}

      {role === "vendor" && counting && !settled && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([
              ["total", "Counted in the room"],
              ["kidsUnder5", "Under 5"],
              ["kids5to12", "Aged 5–12"],
              ["staff", "Drivers / staff"],
            ] as const).map(([k, label]) => (
              <label key={k} className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={counts[k] ?? 0}
                  onChange={(e) => {
                    const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
                    setCounts((c) => ({ ...c, [k]: v }));
                  }}
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Children and drivers are counted <strong>within</strong> the total, not added to it.
          </p>
          <input
            className={inputCls}
            placeholder="Note (optional) — e.g. 12 extra arrived after dinner service"
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
          />
          {countsProblem && <p className="text-sm text-amber-700 dark:text-amber-400">{countsProblem}</p>}
          <div className="flex gap-2">
            <Button size="sm" disabled={!!countsProblem || settleMut.isPending} onClick={() => settleMut.mutate()}>
              {settleMut.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Settle
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCounting(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettlementCard;
