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
import { Loader2, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getCancellationPolicy, saveCancellationPolicy, type PolicyTemplate, type PolicySlab } from "@/lib/api/bookingOrder";
import { useMyBusinesses } from "@/hooks/use-my-businesses";
import { errorMessage } from "@/lib/utils/api-error";
import { PersonaPreference } from "@/components/dashboard/layout/persona-preference";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/primitives/page-header";

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

/** A slab row while the vendor is editing it — strings, so a half-typed number survives. */
type DraftSlab = { daysToEvent: string; pctForfeit: string };

export function PolicyTemplatePicker() {
  const qc = useQueryClient();

  /**
   * WWL-505 — the page carried no switcher and sent no businessId, so only the
   * vendor's first venue could ever have a policy. This is the same defect
   * Business Settings was repaired for — "every business after the first was
   * UNREACHABLE" — on the setting that decides who keeps the money when a
   * wedding is called off.
   */
  const { data: businesses } = useMyBusinesses();
  const [bizId, setBizId] = useState<number | null>(null);
  const activeBizId = bizId ?? businesses?.[0]?.id ?? null;
  const activeBiz = businesses?.find((b) => b.id === activeBizId) ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["cancellation-policy", activeBizId ?? "default"],
    queryFn: () => getCancellationPolicy(activeBizId),
  });
  const [picked, setPicked] = useState<string | null>(null);
  const [sample, setSample] = useState(800000);
  // WWL-507 — the template key awaiting confirmation.
  const [confirming, setConfirming] = useState<string | null>(null);

  /**
   * WWL-508 — three preset cards and nothing else, though the API accepts
   * arbitrary slabs. A vendor whose real terms differ from all three had one
   * other place to write them: the free-text box in Business Settings, which
   * the refund engine does not read (WWL-514). So their actual policy could not
   * be expressed anywhere the engine would honour.
   */
  const [custom, setCustom] = useState<DraftSlab[] | null>(null);

  const save = useMutation({
    mutationFn: (p: { name: string; slabs: PolicySlab[]; forceMajeureRule?: string }) =>
      saveCancellationPolicy({
        name: p.name,
        slabs: p.slabs,
        forceMajeureRule: p.forceMajeureRule,
        businessId: activeBizId,
      }),
    /**
     * WWL-512 — the module fired no toasts at all: not on selecting a template,
     * not on saving, and not on failing to save. It was the only module in the
     * sweep whose silent path included a WRITE, so a failed save looked exactly
     * like a successful one.
     */
    onSuccess: (_r, p) => {
      toast.success(
        `${p.name} is now your cancellation policy${activeBiz?.name ? ` for ${activeBiz.name}` : ""}.`,
      );
      qc.invalidateQueries({ queryKey: ["cancellation-policy"] });
    },
    onError: (e: unknown) =>
      toast.error(errorMessage(e, "Couldn't save that policy — nothing was changed."), { duration: 8000 }),
  });

  /** The custom draft as the API wants it, or a reason it isn't ready. */
  const customParsed = useMemo(() => {
    if (!custom) return null;
    const rows = custom.filter((r) => r.daysToEvent.trim() !== "" || r.pctForfeit.trim() !== "");
    if (rows.length === 0) return { error: "Add at least one rule." };
    const slabs: PolicySlab[] = [];
    for (const r of rows) {
      const d = Number(r.daysToEvent);
      const p = Number(r.pctForfeit);
      if (!Number.isInteger(d) || d < 0) return { error: "Days before the event must be a whole number, 0 or more." };
      if (!Number.isFinite(p) || p < 0 || p > 100) return { error: "The amount kept must be between 0 and 100%." };
      slabs.push({ daysToEvent: d, pctForfeit: p });
    }
    const days = slabs.map((s) => s.daysToEvent);
    if (new Set(days).size !== days.length) return { error: "Two rules use the same number of days." };
    return { slabs: [...slabs].sort((a, b) => b.daysToEvent - a.daysToEvent) };
  }, [custom]);

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
    return (
      <div className="p-6 text-center text-sm text-muted-foreground" lang="ur-Latn">
        Cancellation engine abhi enabled nahi hai.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      {/* Was a hand-rolled `<h1>`, so this was one of three screens still in
          Inter at 18px while every other title rendered in Playfair at 20px.
          The `lang="ur-Latn"` on the description is load-bearing and survives
          the move — see WWL-513 below. */}
      <PageHeader
        title="Cancellation policy"
        description={
          /* WWL-513 — the page is Roman-Urdu-first and carried no `lang`, so a
             screen reader pronounced Urdu-in-Latin-script with English
             phonology. `ur-Latn` is the tag for exactly this. And unlike
             Business Settings, the page offered no PersonaPreference switch, so
             a vendor who prefers Professional English had no way to get it
             here. */
          <span lang="ur-Latn">Customer cancel kare to kitna wapas — apni policy chunein.</span>
        }
        actions={
          <label className="text-sm text-muted-foreground" htmlFor="policy-sample">
            <span lang="ur-Latn">Sample raqam</span>
            <input id="policy-sample" type="number" min={0} value={sample} onChange={(e) => setSample(Math.max(0, Number(e.target.value) || 0))}
              className="ml-2 w-32 rounded-md border bg-transparent px-2 py-1 text-sm tabular-nums" />
          </label>
        }
      />

      <PersonaPreference />

      {(businesses?.length ?? 0) > 1 && (
        <div className="rounded-lg border bg-card p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            This policy applies to one venue. Choose which.
          </p>
          <div className="flex flex-wrap gap-2">
            {businesses!.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-current={b.id === activeBizId ? "true" : undefined}
                onClick={() => { setBizId(b.id); setPicked(null); setCustom(null) }}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-left text-xs transition-colors",
                  b.id === activeBizId
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "hover:border-primary/40 hover:bg-muted",
                )}
              >
                <span className="block max-w-[220px] truncate">{b.name || `Business #${b.id}`}</span>
                <span className="block text-[10px] text-muted-foreground">{b.city ?? ""}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* WWL-514 — there are two cancellation-policy fields and neither knows
          about the other. A vendor who writes their terms in the Business
          Settings textarea has not set a policy the engine will honour, and a
          vendor who picks Aam here has not populated the text that appears on
          their listing. Say so, on both screens, rather than leaving the two to
          disagree silently. */}
      <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm">
        {activeBiz?.cancelationPolicy ? (
          <>
            <p className="font-medium">Your listing also shows this text to couples:</p>
            <p className="mt-1 whitespace-pre-line text-muted-foreground">{activeBiz.cancelationPolicy}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              That text is for reading. The refund engine does not use it — the schedule you pick
              below is what decides the money. Keep them saying the same thing.{" "}
              <a href="/dashboard/settings?tab=pricing" className="underline underline-offset-2">Edit the text</a>
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            The schedule you pick here decides refunds. Your public listing has a separate
            cancellation-policy note for couples to read, and it is currently empty —{" "}
            <a href="/dashboard/settings?tab=pricing" className="underline underline-offset-2">add it in Business Settings</a>{" "}
            so what they read matches what they get.
          </p>
        )}
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

      {/**
        * WWL-509 — choosing a policy was mouse-only: the cards were bare
        * `<div onClick>`, so they took no focus, answered no key press and
        * announced nothing. This is a set of mutually exclusive choices, which
        * is what a radio group is; giving it those semantics makes it reachable
        * by Tab, selectable with Space or Enter, and readable to a screen
        * reader as "1 of 3 selected".
        */}
      <div className="grid md:grid-cols-3 gap-4" role="radiogroup" aria-label="Cancellation policy template">
        {data.templates.map((t) => {
          const isActive = activeKey === t.key;
          const isPicked = (picked ?? activeKey) === t.key;
          return (
            <Card
              key={t.key}
              role="radio"
              aria-checked={isPicked}
              aria-label={`${t.name} — ${t.labelEn}${isActive ? " (currently active)" : ""}`}
              tabIndex={isPicked ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setPicked(t.key);
                }
              }}
              className={cn(
                "cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isPicked ? "border-primary ring-1 ring-primary" : "hover:border-muted-foreground/40",
              )}
              onClick={() => setPicked(t.key)}
            >
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
                {/* WWL-506 — each preset carries a non-refundable deposit taken
                    BEFORE the tiers apply (Aasaan 10% · Aam 20% · Sakht 30%).
                    The picker neither displayed it nor sent it, so a vendor
                    choosing Sakht from a table showing rupees had no way to know
                    a 30% non-refundable deposit rode along with it. */}
                {t.depositPct != null && t.depositPct > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Plus a <strong>{t.depositPct}% non-refundable deposit</strong>, taken before the
                    table above applies.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* WWL-508 — three cards and nothing else, though the API accepts
          arbitrary slabs. */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Your own schedule</h2>
            <p className="text-xs text-muted-foreground">
              If none of the three match your real terms, write them here.
            </p>
          </div>
          {custom === null ? (
            <Button size="sm" variant="outline" onClick={() => { setPicked(null); setCustom([{ daysToEvent: "30", pctForfeit: "50" }]) }}>
              <Plus className="mr-1.5 size-3.5" /> Write my own
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setCustom(null)}>Cancel</Button>
          )}
        </div>

        {custom !== null && (
          <div className="mt-3 space-y-3">
            <div className="space-y-2">
              {custom.map((row, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <label className="text-xs text-muted-foreground">
                    <span className="block">Cancels this many days before</span>
                    <input
                      type="number" min={0} step={1} value={row.daysToEvent}
                      onChange={(e) => setCustom((c) => c!.map((r, j) => (j === i ? { ...r, daysToEvent: e.target.value } : r)))}
                      className="mt-1 w-40 rounded-md border bg-transparent px-2 py-1 text-sm tabular-nums"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    <span className="block">You keep (%)</span>
                    <input
                      type="number" min={0} max={100} step="0.01" value={row.pctForfeit}
                      onChange={(e) => setCustom((c) => c!.map((r, j) => (j === i ? { ...r, pctForfeit: e.target.value } : r)))}
                      className="mt-1 w-28 rounded-md border bg-transparent px-2 py-1 text-sm tabular-nums"
                    />
                  </label>
                  {(() => {
                    const p = Number(row.pctForfeit);
                    return Number.isFinite(p) && p >= 0 && p <= 100 ? (
                      <span className="pb-1.5 text-xs text-muted-foreground">
                        couple gets {rs((sample * (100 - p)) / 100)}
                      </span>
                    ) : null;
                  })()}
                  <Button
                    size="sm" variant="ghost" className="ml-auto"
                    aria-label={`Remove rule ${i + 1}`}
                    disabled={custom.length === 1}
                    onClick={() => setCustom((c) => c!.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={() => setCustom((c) => [...c!, { daysToEvent: "", pctForfeit: "" }])}>
              <Plus className="mr-1.5 size-3.5" /> Add a rule
            </Button>
            {customParsed && "error" in customParsed && (
              <p className="text-xs font-medium text-destructive">{customParsed.error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              A cancellation is charged by the closest rule at or below the days remaining. Anything
              nearer than your smallest rule uses that rule.
            </p>
            <Button
              size="sm"
              disabled={save.isPending || !customParsed || "error" in customParsed}
              onClick={() => {
                if (!customParsed || "error" in customParsed) return;
                save.mutate({ name: "Custom", slabs: customParsed.slabs, forceMajeureRule: "CARRY_FORWARD" });
              }}
            >
              {save.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Save my own schedule
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          disabled={save.isPending || !picked || picked === activeKey}
          onClick={() => setConfirming(picked)}
        >
          {save.isPending ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
          <span lang="ur-Latn">
            {picked && picked === activeKey ? "Yeh already active hai" : "Yeh policy save karein"}
          </span>
        </Button>
      </div>

      {/**
        * WWL-507 — saving took one click and produced zero dialogs, on a
        * setting that decides how much of a customer's money the vendor keeps
        * when a wedding is called off. Nothing on the page said what happens to
        * bookings that already exist.
        *
        * What it says is checked against the service, not guessed:
        * cancellationPolicyService versions by `effectiveFrom` and never
        * mutates, and policyAcceptanceService freezes a snapshot at the moment
        * a customer accepts. So an accepted booking keeps the terms it was
        * sold under; one without a recorded acceptance follows whatever is
        * active when the refund is worked out.
        */}
      <AlertDialog open={!!confirming} onOpenChange={(v) => !v && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {data.templates.find((t) => t.key === confirming)?.name ?? "this policy"}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="rounded border px-2 py-0.5 text-xs">
                    {data.templates.find((t) => t.key === activeKey)?.name ??
                      inherited?.name ??
                      "No policy chosen"}
                  </span>
                  <span aria-hidden>→</span>
                  <span className="rounded border border-primary px-2 py-0.5 text-xs font-medium">
                    {data.templates.find((t) => t.key === confirming)?.name}
                  </span>
                </div>
                <p>
                  Bookings where the customer has already <strong>accepted</strong> your terms keep the
                  version they accepted — that snapshot is frozen and this does not touch it.
                </p>
                <p>
                  Bookings with no recorded acceptance will be refunded under this new policy from now
                  on. <span lang="ur-Latn">Cancel karne par jo raqam wapas hogi, woh badal jaayegi.</span>
                </p>
                {(() => {
                  const t = data.templates.find((x) => x.key === confirming);
                  return t?.depositPct ? (
                    <p>
                      <strong>{t.depositPct}% of the booking is a non-refundable deposit</strong> under
                      this policy, taken before the table below applies.
                    </p>
                  ) : null;
                })()}
                {confirming && (
                  <div className="rounded-md border p-2">
                    <p className="mb-1 text-xs text-muted-foreground">
                      On {rs(sample)}, a customer cancelling would get back:
                    </p>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs tabular-nums">
                      {WINDOWS.map((d) => {
                        const t = data.templates.find((x) => x.key === confirming)!;
                        const now = data.templates.find((x) => x.key === activeKey);
                        const next = Math.round((sample * (100 - forfeitAt(t.slabs, d))) / 100);
                        const prev = now
                          ? Math.round((sample * (100 - forfeitAt(now.slabs, d))) / 100)
                          : null;
                        return (
                          <li key={d} className="flex justify-between gap-2">
                            <span className="text-muted-foreground">{d} din pehle</span>
                            <span>
                              {prev != null && prev !== next && (
                                <span className="mr-1 text-muted-foreground line-through">{rs(prev)}</span>
                              )}
                              {rs(next)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel><span lang="ur-Latn">Rehne dein</span></AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const t = data.templates.find((x) => x.key === confirming);
                if (t) save.mutate({ name: t.name, slabs: t.slabs, forceMajeureRule: t.forceMajeureRule });
                setConfirming(null);
              }}
            >
              <span lang="ur-Latn">Haan, yeh policy lagayein</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p className="text-[11px] text-muted-foreground" lang="ur-Latn">Force-majeure (govt/aafat) par paisa zabt nahi hota — carry-forward credit banta hai.</p>
      {/* WWL-508 — stated plainly rather than left to be discovered: there is
          still no version history and no way to clear a policy back to nothing,
          though the service does version every save. */}
      <p className="text-[11px] text-muted-foreground">
        Every save is kept as a new version from today onward; earlier versions stay in force for
        bookings already sold under them. There is no way to remove a policy entirely — pick another
        to replace it.
      </p>
    </div>
  );
}

export default PolicyTemplatePicker;
