"use client";

/**
 * Super-admin billing tools (plans programme): one vendor's plan state and the actions on it (extend trial, comp, force-unlock,
 * suspend / unsuspend, grant trial), the expiring and locked-with-events lists, plan metrics, the audit log and the shadow-mode
 * report. Every write needs a reason and is audited by the server; this screen only collects and shows.
 * Endpoints: /subscriptions/admin/billing/* (lib/api/billing-admin.ts).
 */

import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Wrench } from "lucide-react";
import { toast } from "sonner";
import { planNameOf } from "@/lib/plan-gate";
import {
  adminErrorMessage, billingAction, findVendors, getMetrics, getShadowReport, getVendorBilling, listAudit, listExpiring, listLockedWithEvents,
  type AuditRow, type BillingAction, type BillingMetrics, type ShadowReport, type VendorBilling, type VendorHit,
  type ExpiringItem, type LockedWithEvents,
} from "@/lib/api/billing-admin";

const fmtDate = (s: string | null | undefined) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" }); }
  catch { return String(s); }
};
const fmtDay = (s: string | null | undefined) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" }); }
  catch { return String(s); }
};
const rsPaisa = (p: number | string | null | undefined) => (p == null ? "—" : `Rs ${Math.round(Number(p) / 100).toLocaleString("en-PK")}`);
const pkDay = (offsetDays: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date(Date.now() + offsetDays * 86400000));

const STATE_STYLE: Record<string, string> = {
  trialing: "border-violet-200 bg-violet-50 text-violet-800",
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  comp: "border-emerald-200 bg-emerald-50 text-emerald-800",
  past_due: "border-amber-200 bg-amber-50 text-amber-800",
  cancelling: "border-sky-200 bg-sky-50 text-sky-800",
  locked: "border-rose-200 bg-rose-50 text-rose-800",
  dormant: "border-rose-200 bg-rose-50 text-rose-800",
  closed: "border-rose-200 bg-rose-50 text-rose-800",
  suspended_admin: "border-rose-300 bg-rose-100 text-rose-900",
  unstarted: "border-neutral-200 bg-neutral-50 text-neutral-700",
};
const stateLabel = (s: string | null | undefined) => (s ? s.replace(/_/g, " ") : "outside plans");
const TIERS: Array<{ key: string; label: string }> = [{ key: "pro", label: "Basic" }, { key: "premium", label: "Pro" }, { key: "elite", label: "Premium" }];

const SELECT_CLS = "h-8 rounded-md border border-input bg-background px-2 text-xs";

function StateBadge({ state }: { state: string | null | undefined }) {
  return <Badge variant="outline" className={`text-[10px] ${STATE_STYLE[state || ""] || ""}`}>{stateLabel(state)}</Badge>;
}

function Stat({ k, v, sub }: { k: string; v: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <dt className="text-[11px] text-muted-foreground">{k}</dt>
      <dd className="text-sm font-semibold tabular-nums">{v}</dd>
      {sub ? <div className="text-[11px] text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

function ErrorBox({ onRetry, what }: { onRetry: () => void; what: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-rose-700">{what} could not be loaded.</p>
      <Button size="sm" variant="outline" className="mt-2 h-8" onClick={onRetry}>Try again</Button>
    </div>
  );
}

/* ───────────────────────── audit rows (shared) ───────────────────────── */

function AuditTable({ rows, showUser }: { rows: AuditRow[]; showUser?: boolean }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground py-6 text-center">No audit rows yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="audit-table">
        <thead>
          <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-3 font-medium">When</th>
            {showUser && <th className="py-2 pr-3 font-medium">Vendor</th>}
            <th className="py-2 pr-3 font-medium">What</th>
            <th className="py-2 pr-3 font-medium">State</th>
            <th className="py-2 pr-3 font-medium">By</th>
            <th className="py-2 font-medium">Reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-b last:border-0 align-top">
              <td className="py-2 pr-3 whitespace-nowrap text-xs tabular-nums">{fmtDate(a.at)}</td>
              {showUser && <td className="py-2 pr-3 text-xs tabular-nums">#{a.userId}</td>}
              <td className="py-2 pr-3 text-xs">{a.cause ? a.cause.replace(/_/g, " ") : "—"}</td>
              <td className="py-2 pr-3 text-xs whitespace-nowrap">{a.fromState || "—"} → {a.toState || "—"}</td>
              <td className="py-2 pr-3 text-xs whitespace-nowrap">{a.actorType || "system"}{a.actorUserId ? ` #${a.actorUserId}` : ""}</td>
              <td className="py-2 text-xs text-muted-foreground">{a.reason || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────────────────── one vendor ───────────────────────── */

type Form = null | "extend" | "comp" | "unlock" | "suspend" | "unsuspend" | "grant";

function VendorPanel({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [data, setData] = useState<VendorBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [form, setForm] = useState<Form>(null);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("7");
  const [hours, setHours] = useState("72");
  const [tier, setTier] = useState("premium");
  const [endsAt, setEndsAt] = useState(pkDay(30));
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setFailed(false);
    getVendorBilling(userId).then(setData).catch(() => setFailed(true)).finally(() => setLoading(false));
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  const open = (f: Form) => { setForm(form === f ? null : f); setReason(""); };
  const run = async (action: BillingAction, body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const msg = await billingAction(userId, action, { ...body, reason: reason.trim() });
      toast.success(msg);
      setForm(null); setReason("");
      load();
    } catch (e) {
      toast.error(adminErrorMessage(e, "That did not go through"));
    } finally { setBusy(false); }
  };

  if (loading && !data) return <Skeleton className="h-64 w-full" />;
  if (failed || !data) return <ErrorBox onRetry={load} what="The vendor" />;

  const a = data.access;
  const suspended = !!data.flags?.suspendedAt; // the flag row is the source; the badge shows the computed state
  const locked = a.isLocked === true; // the server's word: this screen never lists states itself
  const reasonOk = reason.trim().length >= 3;

  return (
    <div className="space-y-4" data-testid="vendor-panel">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                {data.user.fullName || data.user.email || `User #${data.user.id}`}
                <StateBadge state={a.state} />
              </CardTitle>
              <p className="text-xs text-muted-foreground">#{data.user.id} · {data.user.email}{data.user.phoneNumber ? ` · ${data.user.phoneNumber}` : ""} · joined {fmtDay(data.user.createdAt)}</p>
            </div>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onClose}>Close</Button>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat k="Plan" v={a.planName || (a.plan ? planNameOf(a.plan) : "—")} sub={a.enforced ? "Wall is enforced" : "Wall not enforced (shadow or off)"} />
            <Stat k="Trial ends" v={fmtDate(a.trialEndsAt)} />
            <Stat k={a.state === "past_due" ? "Grace ends" : "Access ends"} v={fmtDate(a.state === "past_due" ? a.graceEndsAt : a.accessEndsAt || a.periodEndsAt)} sub={a.daysLeft != null ? `${a.daysLeft} day(s) left` : undefined} />
            <Stat k="Locked since" v={fmtDate(a.lockedAt)} sub={a.retainUntil ? `kept until ${fmtDay(a.retainUntil)}` : a.lockReason ? a.lockReason.replace(/_/g, " ") : undefined} />
          </dl>
          {suspended && (
            <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
              Suspended{data.flags?.suspendReason ? `: ${data.flags.suspendReason}` : ""}. The vendor sees the Wall with no pay button until you lift it.
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Actions">
            {a.canStartTrial ? <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => open("grant")}>Grant trial</Button> : null}
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => open("extend")} disabled={a.state !== "trialing" && !locked}>Extend trial</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => open("comp")} disabled={suspended}>Comp a plan</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => open("unlock")} disabled={!locked || suspended} title={!locked ? "Only a locked account can be force-unlocked" : undefined}>Force unlock</Button>
            {suspended
              ? <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => open("unsuspend")}>Lift suspension</Button>
              : <Button size="sm" variant="outline" className="h-8 text-xs text-rose-700 border-rose-200" onClick={() => open("suspend")}>Suspend</Button>}
          </div>

          {form && (
            <div className="rounded-md border bg-muted/30 p-3 space-y-2" data-testid={`form-${form}`}>
              <div className="flex flex-wrap items-center gap-2">
                {form === "extend" && (<>
                  <label className="text-xs text-muted-foreground">Days (1 to 30)</label>
                  <Input className="h-8 w-20 text-xs" type="number" min={1} max={30} value={days} onChange={(e) => setDays(e.target.value)} aria-label="Days to add" />
                </>)}
                {form === "grant" && (<>
                  <label className="text-xs text-muted-foreground">Days</label>
                  <Input className="h-8 w-20 text-xs" type="number" min={1} max={90} value={days} onChange={(e) => setDays(e.target.value)} aria-label="Trial days" />
                  <select className={SELECT_CLS} value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Plan">
                    {TIERS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </>)}
                {form === "comp" && (<>
                  <select className={SELECT_CLS} value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Plan">
                    {TIERS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                  <label className="text-xs text-muted-foreground">Ends on (at most 90 days)</label>
                  <Input className="h-8 w-40 text-xs" type="date" min={pkDay(1)} max={pkDay(90)} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} aria-label="Comp end date" />
                </>)}
                {form === "unlock" && (<>
                  <label className="text-xs text-muted-foreground">Open for (hours, up to 168)</label>
                  <Input className="h-8 w-20 text-xs" type="number" min={1} max={168} value={hours} onChange={(e) => setHours(e.target.value)} aria-label="Hours" />
                </>)}
                <Input className="h-8 min-w-[240px] flex-1 text-xs" placeholder="Reason (kept in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason" />
                <Button size="sm" className="h-8" disabled={busy || !reasonOk}
                  onClick={() => {
                    if (form === "extend") return run("extend-trial", { days: Number(days) });
                    if (form === "grant") return run("grant-trial", { days: Number(days), tier });
                    if (form === "comp") return run("comp", { tier, endsAt });
                    if (form === "unlock") return run("force-unlock", { hours: Number(hours) });
                    if (form === "suspend") return run("suspend", {});
                    return run("unsuspend", {});
                  }}>
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : form === "extend" ? "Extend trial" : form === "grant" ? "Grant trial" : form === "comp" ? "Grant comp" : form === "unlock" ? "Unlock now" : form === "suspend" ? "Suspend" : "Lift suspension"}
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setForm(null)}>Cancel</Button>
              </div>
              {form === "comp" && <p className="text-[11px] text-muted-foreground">A complimentary plan always has an end date and lasts 90 days at most. Only a super admin can grant one.</p>}
              {form === "unlock" && <p className="text-[11px] text-muted-foreground">Gives full access for a short time (a bridge while a payment is checked). It does not take a payment.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Plans on this account</CardTitle></CardHeader>
          <CardContent>
            {data.subscriptions.length === 0 && data.grants.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No subscription or grant rows.</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {data.subscriptions.map((s) => (
                  <li key={`s${s.id}`} className="rounded-md border px-2.5 py-1.5">
                    <span className="font-medium">{planNameOf(s.tier)}</span> · {s.status}
                    <span className="text-muted-foreground"> · ends {fmtDay(s.trialEndsAt || s.currentPeriodEndsAt)} · {s.reference}</span>
                  </li>
                ))}
                {data.grants.map((g) => (
                  <li key={`g${g.id}`} className="rounded-md border px-2.5 py-1.5">
                    <span className="font-medium">{planNameOf(g.tier)}</span> · {g.source.replace(/_/g, " ")}{g.revokedAt ? " (revoked)" : g.supersededAt ? " (replaced)" : ""}
                    <span className="text-muted-foreground"> · ends {fmtDay(g.endsAt)}{g.note ? ` · ${g.note}` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
            {data.trialBlocks.length > 0 && <p className="mt-2 text-[11px] text-amber-800">Trial blocked by: {data.trialBlocks.map((b) => b.keyType).join(", ")}. Grant trial overrides it.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Audit log for this vendor</CardTitle></CardHeader>
          <CardContent><AuditTable rows={data.audit} /></CardContent>
        </Card>
      </div>
    </div>
  );
}

function VendorLookup({ selected, onPick }: { selected: number | null; onPick: (id: number) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<VendorHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const search = async () => {
    const term = q.trim();
    if (!term) return;
    if (/^\d{1,9}$/.test(term)) { onPick(Number(term)); return; }
    setSearching(true);
    try { setHits(await findVendors(term)); } catch (e) { toast.error(adminErrorMessage(e, "Search failed")); } finally { setSearching(false); }
  };
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Wrench className="h-4 w-4 text-bridal-gold-dark" /> Find a vendor</CardTitle>
        <p className="text-xs text-muted-foreground">Search by name, e-mail or phone, or type the user id.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); search(); }}>
          <Input className="h-9 max-w-md" placeholder="Name, e-mail, phone or user id" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a vendor" />
          <Button size="sm" className="h-9 gap-1" type="submit" disabled={searching || !q.trim()}>
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Search
          </Button>
        </form>
        {hits && (hits.length === 0
          ? <p className="text-sm text-muted-foreground">No vendor matches that.</p>
          : (
            <ul className="divide-y rounded-md border" data-testid="vendor-hits">
              {hits.map((h) => (
                <li key={h.id}>
                  <button type="button" className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted/50 ${selected === h.id ? "bg-muted/50" : ""}`} onClick={() => onPick(h.id)}>
                    <span><span className="font-medium">{h.fullName || h.email}</span> <span className="text-xs text-muted-foreground">{h.email}{h.phoneNumber ? ` · ${h.phoneNumber}` : ""}</span></span>
                    <span className="text-xs text-muted-foreground">#{h.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          ))}
      </CardContent>
    </Card>
  );
}

/* ───────────────────────── lists ───────────────────────── */

function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    setLoading(true); setFailed(false);
    fn().then(setData).catch(() => setFailed(true)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { data, loading, failed, reload: load };
}

function VendorCell({ v, id }: { v: { fullName: string | null; email: string | null; phoneNumber: string | null } | null; id: number }) {
  return (
    <>
      <div className="font-medium">{v?.fullName || v?.email || `User #${id}`}</div>
      <div className="text-[11px] text-muted-foreground">#{id}{v?.email ? ` · ${v.email}` : ""}{v?.phoneNumber ? ` · ${v.phoneNumber}` : ""}</div>
    </>
  );
}

function ExpiringList({ onOpen }: { onOpen: (id: number) => void }) {
  const [days, setDays] = useState(7);
  const { data, loading, failed, reload } = useLoad(() => listExpiring(days), [days]);
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><CardTitle className="text-base">Expiring soon</CardTitle><p className="text-xs text-muted-foreground">Trials, comps and plans that end inside the window, soonest first.</p></div>
          <select className={SELECT_CLS} value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Window">
            {[3, 7, 14, 30].map((d) => <option key={d} value={d}>Next {d} days</option>)}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-32 w-full" /> : failed || !data ? <ErrorBox onRetry={reload} what="The list" /> : data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nobody loses access in the next {days} days.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="expiring-table">
              <thead><tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground"><th className="py-2 pr-3 font-medium">Vendor</th><th className="py-2 pr-3 font-medium">What ends</th><th className="py-2 pr-3 font-medium">Plan</th><th className="py-2 pr-3 font-medium">Ends</th><th className="py-2" /></tr></thead>
              <tbody>
                {data.items.map((r: ExpiringItem, i) => (
                  <tr key={`${r.userId}-${i}`} className="border-b last:border-0 align-top">
                    <td className="py-2.5 pr-3"><VendorCell v={r.vendor} id={r.userId} /></td>
                    <td className="py-2.5 pr-3 text-xs capitalize">{r.kind.replace(/_/g, " ")}</td>
                    <td className="py-2.5 pr-3 text-xs">{planNameOf(r.tier)}</td>
                    <td className="py-2.5 pr-3 text-xs whitespace-nowrap tabular-nums">{fmtDate(r.endsAt)}</td>
                    <td className="py-2.5 text-right"><Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onOpen(r.userId)}>Open</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LockedList({ onOpen }: { onOpen: (id: number) => void }) {
  const { data, loading, failed, reload } = useLoad(listLockedWithEvents, []);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Locked with upcoming events</CardTitle>
        <p className="text-xs text-muted-foreground">Vendors behind the Wall who still have confirmed or pending events ahead: the ones a customer is waiting on. Reach out, or force-unlock while they pay.</p>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-32 w-full" /> : failed || !data ? <ErrorBox onRetry={reload} what="The list" /> : data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No locked vendor has events ahead ({data.checked} vendors with upcoming events checked).</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="locked-table">
              <thead><tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground"><th className="py-2 pr-3 font-medium">Vendor</th><th className="py-2 pr-3 font-medium">State</th><th className="py-2 pr-3 font-medium">Events ahead</th><th className="py-2 pr-3 font-medium">Next event</th><th className="py-2 pr-3 font-medium">Locked since</th><th className="py-2" /></tr></thead>
              <tbody>
                {data.items.map((r: LockedWithEvents) => (
                  <tr key={r.userId} className="border-b last:border-0 align-top">
                    <td className="py-2.5 pr-3"><VendorCell v={r.vendor} id={r.userId} /></td>
                    <td className="py-2.5 pr-3"><StateBadge state={r.state} /><div className="text-[11px] text-muted-foreground">{r.lockReason?.replace(/_/g, " ")}</div></td>
                    <td className="py-2.5 pr-3 tabular-nums">{r.events}</td>
                    <td className="py-2.5 pr-3 text-xs whitespace-nowrap">{fmtDay(r.nextEvent)}</td>
                    <td className="py-2.5 pr-3 text-xs whitespace-nowrap">{fmtDate(r.lockedAt)}</td>
                    <td className="py-2.5 text-right"><Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onOpen(r.userId)}>Open</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.enforceMode && data.enforceMode !== "on" && <p className="mt-3 text-[11px] text-amber-800">Enforcement is {data.enforceMode}: these vendors are not walled yet.</p>}
      </CardContent>
    </Card>
  );
}

function MetricsPanel() {
  const [days, setDays] = useState(30);
  const { data, loading, failed, reload } = useLoad<BillingMetrics>(() => getMetrics(days), [days]);
  const maxDay = data ? Math.max(1, ...data.trials.byDay.map((d) => d.n)) : 1;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><CardTitle className="text-base">Plan metrics</CardTitle><p className="text-xs text-muted-foreground">Trial starts, how many paid afterwards, and monthly recurring revenue.</p></div>
          <select className={SELECT_CLS} value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Window">
            {[7, 30, 90, 365].map((d) => <option key={d} value={d}>Last {d} days</option>)}
          </select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <Skeleton className="h-40 w-full" /> : failed || !data ? <ErrorBox onRetry={reload} what="The metrics" /> : (
          <>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="metrics-stats">
              <Stat k="Trials started" v={data.trials.started} />
              <Stat k="Paid after a trial" v={data.trials.converted} sub={data.trials.conversionRate != null ? `${data.trials.conversionRate}% conversion` : "no trials yet"} />
              <Stat k="Monthly recurring revenue" v={rsPaisa(data.mrr.totalPaisas)} sub={data.mrr.byTier.length ? data.mrr.byTier.map((t) => `${planNameOf(t.tier)} ${t.subscribers}`).join(" · ") : "no card subscribers"} />
              <Stat k="Manual proofs waiting" v={data.manualPayments.pendingNow} />
            </dl>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 text-xs font-medium text-muted-foreground">Trial starts by day</h3>
                {data.trials.byDay.length === 0 ? <p className="text-sm text-muted-foreground">None in this window.</p> : (
                  <ul className="space-y-1">
                    {data.trials.byDay.map((d) => (
                      <li key={d.day} className="flex items-center gap-2 text-xs">
                        <span className="w-24 tabular-nums text-muted-foreground">{d.day}</span>
                        <span className="h-2 rounded bg-bridal-gold-dark/70" style={{ width: `${Math.max(6, (d.n / maxDay) * 220)}px` }} />
                        <span className="tabular-nums">{d.n}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-xs font-medium text-muted-foreground">Accounts by state (as last observed)</h3>
                {data.accountsByState.length === 0 ? <p className="text-sm text-muted-foreground">No account has been observed yet.</p> : (
                  <ul className="flex flex-wrap gap-1.5">
                    {data.accountsByState.map((s) => <li key={s.state}><Badge variant="outline" className={`text-[11px] ${STATE_STYLE[s.state] || ""}`}>{stateLabel(s.state)} · {s.n}</Badge></li>)}
                  </ul>
                )}
                {data.manualPayments.byStatus.length > 0 && (
                  <>
                    <h3 className="mb-2 mt-4 text-xs font-medium text-muted-foreground">Manual payments in the window</h3>
                    <ul className="flex flex-wrap gap-1.5">
                      {data.manualPayments.byStatus.map((s) => <li key={s.status}><Badge variant="outline" className="text-[11px]">{s.status} · {s.n} · Rs {Math.round(s.amountPkr).toLocaleString("en-PK")}</Badge></li>)}
                    </ul>
                  </>
                )}
                {data.trials.blocked.length > 0 && <p className="mt-3 text-[11px] text-amber-800">Trials refused: {data.trials.blocked.map((b) => `${b.keyType} ${b.n}`).join(", ")}.</p>}
              </div>
            </div>
            {data.note && <p className="text-[11px] text-muted-foreground">{data.note}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AuditPanel() {
  const [userId, setUserId] = useState("");
  const [cause, setCause] = useState("");
  const [applied, setApplied] = useState<{ userId?: number; cause?: string }>({});
  const { data, loading, failed, reload } = useLoad<AuditRow[]>(() => listAudit({ ...applied, limit: 100 }), [applied.userId, applied.cause]);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Billing audit log</CardTitle>
        <p className="text-xs text-muted-foreground">Every state change and admin action, newest first: who did it and why.</p>
        <form className="mt-2 flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); setApplied({ userId: /^\d{1,9}$/.test(userId.trim()) ? Number(userId.trim()) : undefined, cause: cause.trim() || undefined }); }}>
          <Input className="h-8 w-32 text-xs" placeholder="User id" value={userId} onChange={(e) => setUserId(e.target.value)} aria-label="Filter by user id" />
          <Input className="h-8 w-48 text-xs" placeholder="What (e.g. comp_granted)" value={cause} onChange={(e) => setCause(e.target.value)} aria-label="Filter by what happened" />
          <Button size="sm" className="h-8" type="submit">Filter</Button>
          {(applied.userId || applied.cause) && <Button size="sm" variant="ghost" className="h-8" type="button" onClick={() => { setUserId(""); setCause(""); setApplied({}); }}>Clear</Button>}
        </form>
      </CardHeader>
      <CardContent>{loading ? <Skeleton className="h-40 w-full" /> : failed || !data ? <ErrorBox onRetry={reload} what="The audit log" /> : <AuditTable rows={data} showUser />}</CardContent>
    </Card>
  );
}

function ShadowPanel({ onOpen }: { onOpen: (id: number) => void }) {
  const [days, setDays] = useState(14);
  const { data, loading, failed, reload } = useLoad<ShadowReport>(() => getShadowReport(days), [days]);
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><CardTitle className="text-base">Shadow report</CardTitle><p className="text-xs text-muted-foreground">What the Wall would have blocked while enforcement was in shadow mode: the review before switching it on.</p></div>
          <select className={SELECT_CLS} value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Window">
            {[7, 14, 30, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}
          </select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <Skeleton className="h-40 w-full" /> : failed || !data ? <ErrorBox onRetry={reload} what="The report" /> : (
          <>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="shadow-stats">
              <Stat k="Mode" v={data.mode || "—"} />
              <Stat k="Vendors that would lock" v={data.vendorsThatWouldLock} />
              <Stat k="Customer refusals" v={data.venueRefusals} sub="enquiries to locked venues" />
              <Stat k="Unclassified routes" v={data.unclassifiedRoutes.length} sub={data.unclassifiedRoutes.length ? "needs a family" : "all classified"} />
            </dl>
            {data.byRoute.length === 0 && data.byVendor.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Nothing would have been blocked in this window{data.mode !== "shadow" ? ` (the mode is ${data.mode}; shadow mode records what would lock)` : ""}.</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="overflow-x-auto">
                  <h3 className="mb-2 text-xs font-medium text-muted-foreground">Routes that would answer 402</h3>
                  <table className="w-full text-xs"><thead><tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground"><th className="py-1.5 pr-3 font-medium">Route</th><th className="py-1.5 pr-3 font-medium">Vendors</th><th className="py-1.5 font-medium">Hits</th></tr></thead>
                    <tbody>{data.byRoute.slice(0, 25).map((r) => <tr key={r.route} className="border-b last:border-0"><td className="py-1.5 pr-3 font-mono break-all">{r.route}</td><td className="py-1.5 pr-3 tabular-nums">{r.vendors}</td><td className="py-1.5 tabular-nums">{r.samples}</td></tr>)}</tbody></table>
                </div>
                <div className="overflow-x-auto">
                  <h3 className="mb-2 text-xs font-medium text-muted-foreground">Vendors</h3>
                  <table className="w-full text-xs"><thead><tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground"><th className="py-1.5 pr-3 font-medium">Vendor</th><th className="py-1.5 pr-3 font-medium">Routes</th><th className="py-1.5 pr-3 font-medium">Last</th><th /></tr></thead>
                    <tbody>{data.byVendor.slice(0, 25).map((v) => <tr key={v.userId} className="border-b last:border-0"><td className="py-1.5 pr-3 tabular-nums">#{v.userId}</td><td className="py-1.5 pr-3 tabular-nums">{v.routes}</td><td className="py-1.5 pr-3 whitespace-nowrap">{fmtDate(v.last)}</td><td className="py-1.5 text-right"><Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => onOpen(v.userId)}>Open</Button></td></tr>)}</tbody></table>
                </div>
              </div>
            )}
            {data.unclassifiedRoutes.length > 0 && (
              <p className="text-[11px] text-rose-800">Unclassified: {data.unclassifiedRoutes.map((u) => u.route).join(", ")}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ───────────────────────── the screen ───────────────────────── */

export default function AdminBillingToolsView() {
  const [tab, setTab] = useState("vendor");
  const [userId, setUserId] = useState<number | null>(null);
  const openVendor = (id: number) => { setUserId(id); setTab("vendor"); };
  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <TabsList className="h-auto flex-wrap justify-start">
        <TabsTrigger value="vendor">Vendor</TabsTrigger>
        <TabsTrigger value="expiring">Expiring</TabsTrigger>
        <TabsTrigger value="locked">Locked with events</TabsTrigger>
        <TabsTrigger value="metrics">Metrics</TabsTrigger>
        <TabsTrigger value="audit">Audit log</TabsTrigger>
        <TabsTrigger value="shadow">Shadow report</TabsTrigger>
      </TabsList>
      <TabsContent value="vendor" className="space-y-4">
        <VendorLookup selected={userId} onPick={setUserId} />
        {userId != null && <VendorPanel key={userId} userId={userId} onClose={() => setUserId(null)} />}
      </TabsContent>
      <TabsContent value="expiring"><ExpiringList onOpen={openVendor} /></TabsContent>
      <TabsContent value="locked"><LockedList onOpen={openVendor} /></TabsContent>
      <TabsContent value="metrics"><MetricsPanel /></TabsContent>
      <TabsContent value="audit"><AuditPanel /></TabsContent>
      <TabsContent value="shadow"><ShadowPanel onOpen={openVendor} /></TabsContent>
    </Tabs>
  );
}
