"use client";

/**
 * EPIC 5 · 5.4 — PolicyTemplatePicker.
 *
 * The vendor picks one of three layman cancellation templates (Aasaan / Aam /
 * Sakht) and sees a LIVE rupee table — "agar customer itne din pehle cancel kare,
 * itna wapas" — on a sample amount, before saving it as their active policy. The
 * saved policy drives the refund engine everywhere. Self-hides on 404.
 */
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check } from "lucide-react";
import { getCancellationPolicy, saveCancellationPolicy, type PolicyTemplate, type PolicySlab } from "@/lib/api/bookingOrder";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const rs = (n: number) => "Rs " + Math.round(n || 0).toLocaleString("en-PK");
// Resolve the forfeit % for a cancel `days` out: largest slab.daysToEvent <= days,
// else the most-severe (smallest-day) slab — mirrors the backend resolveTier.
function forfeitAt(slabs: PolicySlab[], days: number): number {
  const sorted = [...slabs].sort((a, b) => b.daysToEvent - a.daysToEvent);
  for (const s of sorted) if (days >= s.daysToEvent) return s.pctForfeit;
  return sorted[sorted.length - 1]?.pctForfeit ?? 100;
}
const WINDOWS = [45, 20, 10, 3]; // sample "days before event" rows

function sameSlabs(a: PolicySlab[], b: PolicySlab[]): boolean {
  if (a.length !== b.length) return false;
  const key = (s: PolicySlab[]) => JSON.stringify([...s].sort((x, y) => y.daysToEvent - x.daysToEvent));
  return key(a) === key(b);
}

export function PolicyTemplatePicker() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["cancellation-policy"], queryFn: getCancellationPolicy });
  const [picked, setPicked] = useState<string | null>(null);
  const [sample, setSample] = useState(800000);

  const save = useMutation({
    mutationFn: (t: PolicyTemplate) => saveCancellationPolicy({ name: t.name, slabs: t.slabs, forceMajeureRule: t.forceMajeureRule }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cancellation-policy"] }),
  });

  const activeKey = useMemo(() => {
    if (!data?.active) return null;
    return data.templates.find((t) => sameSlabs(t.slabs, data.active!.slabs))?.key ?? "custom";
  }, [data]);

  /**
   * WWL-502 — when a vendor has picked nothing, `active` is null and every card
   * rendered unselected, which reads as "no policy applies". It does: the
   * refund engine falls back to the platform default, and on a live Rs 1.4m
   * booking that default forfeited the entire Rs 1,223,278. The vendor was
   * looking at a page that said nothing was set while a policy they had never
   * seen governed their money.
   */
  const inherited = !data?.active && data?.effective ? data.effective : null;
  const inheritedKey = useMemo(() => {
    if (!inherited || !data) return null;
    return data.templates.find((t) => sameSlabs(t.slabs, inherited.slabs))?.key ?? null;
  }, [inherited, data]);

  if (isLoading) {
    return <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center"><Loader2 className="size-4 animate-spin" /> Loading…</div>;
  }
  if (!data) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Cancellation engine abhi enabled nahi hai.</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold">Cancellation Policy</h1>
          <p className="text-sm text-muted-foreground">Customer cancel kare to kitna wapas — apni policy chunein.</p>
        </div>
        <label className="text-sm text-muted-foreground">
          Sample raqam
          <input type="number" value={sample} onChange={(e) => setSample(Math.max(0, Number(e.target.value) || 0))}
            className="ml-2 w-32 rounded-md border bg-transparent px-2 py-1 text-sm tabular-nums" />
        </label>
      </div>

      {inherited && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <p className="font-medium">
            You haven&apos;t chosen a policy, so the platform default applies —{" "}
            <strong>{inherited.name}</strong>.
          </p>
          <p className="mt-1 text-[13px]">
            {inheritedKey
              ? "It matches one of the cards below. Pick it (or another) to make the choice yours."
              : "It is not one of the three cards below. Choose one to replace it."}{" "}
            Until you do, this is what governs refunds on your bookings.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {data.templates.map((t) => {
          const isActive = activeKey === t.key;
          const isPicked = (picked ?? activeKey) === t.key;
          return (
            <Card key={t.key} className={cn("cursor-pointer transition-colors", isPicked ? "border-primary ring-1 ring-primary" : "hover:border-muted-foreground/40")} onClick={() => setPicked(t.key)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.labelEn}</p>
                  </div>
                  {isActive && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"><Check className="size-3" /> Active</span>}
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground text-left"><th className="font-medium pb-1">Cancel</th><th className="font-medium pb-1 text-right">Wapas</th></tr>
                  </thead>
                  <tbody>
                    {WINDOWS.map((d) => {
                      const refund = Math.round((sample * (100 - forfeitAt(t.slabs, d))) / 100);
                      return (
                        <tr key={d} className="border-t">
                          <td className="py-1 text-muted-foreground">{d} din pehle</td>
                          <td className="py-1 text-right tabular-nums font-medium">{rs(refund)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button
          disabled={save.isPending || !picked || picked === activeKey}
          onClick={() => { const t = data.templates.find((x) => x.key === picked); if (t) save.mutate(t); }}
        >
          {save.isPending ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
          {picked && picked === activeKey ? "Yeh already active hai" : "Yeh policy save karein"}
        </Button>
        {save.isSuccess && <span className="text-sm text-emerald-700 dark:text-emerald-400">Save ho gaya ✓</span>}
      </div>
      <p className="text-[11px] text-muted-foreground">Force-majeure (govt/aafat) par paisa zabt nahi hota — carry-forward credit banta hai.</p>
    </div>
  );
}

export default PolicyTemplatePicker;
