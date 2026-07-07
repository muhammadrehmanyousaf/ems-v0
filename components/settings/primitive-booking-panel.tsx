"use client";

/**
 * Phase-3 — primitive-aware booking panel. Consumes the cutover endpoints
 * (/availability/check + /reserve): the vendor picks a resource + window for their
 * primitive, checks availability, and reserves — all routed through their engine.
 * Venue (P1) is handled by the calendar, so this shows a pointer there instead.
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CalendarCheck, CheckCircle2, XCircle } from "lucide-react";
import { checkAvailability, reserveAvailability, type AvailabilitySetup, type AvailabilityVerdict } from "@/lib/api/availabilitySetup";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputCls = "rounded-md border bg-transparent px-2 py-1.5 text-sm w-full";
const VERDICT_STYLE: Record<string, string> = {
  AVAILABLE: "text-emerald-700 dark:text-emerald-400",
  PARTIAL: "text-amber-700 dark:text-amber-400",
  UNAVAILABLE: "text-rose-700 dark:text-rose-400",
  NEEDS_INPUT: "text-muted-foreground",
  DELEGATE_LEGACY: "text-muted-foreground",
};

export function PrimitiveBookingPanel({ setup }: { setup: AvailabilitySetup }) {
  const p = setup.primitive;
  const [form, setForm] = useState<Record<string, string>>({});
  const [verdict, setVerdict] = useState<AvailabilityVerdict | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const body = () => buildBody(p, form);
  const check = useMutation({ mutationFn: () => checkAvailability(body()), onSuccess: setVerdict });
  const reserve = useMutation({ mutationFn: () => reserveAvailability(body()), onSuccess: () => setVerdict({ primitive: p, status: "AVAILABLE", detail: { reserved: true } }) });
  const busy = check.isPending || reserve.isPending;

  if (p === "P1_VENUE_LOCK") {
    return <Card><CardContent className="p-4 text-sm text-muted-foreground">Venue bookings Calendar se hoti hain.</CardContent></Card>;
  }
  if (!p) return null;

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2"><CalendarCheck className="size-4" /> Availability check &amp; book</h3>

        {p === "P2_PERSON_SLOT" && (
          <div className="grid md:grid-cols-3 gap-2 items-end">
            <Select label="Crew" value={form.crewResourceId} onChange={(v) => set("crewResourceId", v)} options={setup.crewResources.filter((c) => c.active).map((c) => ({ v: String(c.id), l: c.label }))} />
            <Field label="Start" type="datetime-local" value={form.startAt} onChange={(v) => set("startAt", v)} />
            <Field label="End" type="datetime-local" value={form.endAt} onChange={(v) => set("endAt", v)} />
          </div>
        )}
        {p === "P3_UNIT_POOL" && (
          <div className="grid md:grid-cols-4 gap-2 items-end">
            <Select label="Item" value={form.rentalSkuId} onChange={(v) => set("rentalSkuId", v)} options={setup.rentalSkus.filter((s) => s.active).map((s) => ({ v: String(s.id), l: s.name }))} />
            <Field label="Qty" type="number" value={form.qty} onChange={(v) => set("qty", v)} />
            <Field label="Out" type="datetime-local" value={form.outAt} onChange={(v) => set("outAt", v)} />
            <Field label="Back" type="datetime-local" value={form.dueBackAt} onChange={(v) => set("dueBackAt", v)} />
          </div>
        )}
        {p === "P4_CAPACITY" && (
          <div className="grid md:grid-cols-3 gap-2 items-end">
            <Select label="Line" value={form.productionLineId} onChange={(v) => set("productionLineId", v)} options={setup.productionLines.filter((l) => l.active).map((l) => ({ v: String(l.id), l: l.name }))} />
            <Field label="Qty" type="number" value={form.qty} onChange={(v) => set("qty", v)} />
            <Field label="Delivery date" type="date" value={form.deliveryDate} onChange={(v) => set("deliveryDate", v)} />
          </div>
        )}
        {p === "P5_PIPELINE" && (
          <div className="grid md:grid-cols-2 gap-2 items-end">
            <Field label="Title" value={form.title} onChange={(v) => set("title", v)} />
            <Field label="Deadline" type="date" value={form.deadlineAt} onChange={(v) => set("deadlineAt", v)} />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => check.mutate()}>{check.isPending ? <Loader2 className="size-4 animate-spin" /> : "Check"}</Button>
          <Button size="sm" disabled={busy || (verdict?.status !== "AVAILABLE" && verdict?.status !== "PARTIAL")} onClick={() => reserve.mutate()}>{reserve.isPending ? <Loader2 className="size-4 animate-spin" /> : "Reserve"}</Button>
          {verdict && (
            <span className={cn("inline-flex items-center gap-1 text-sm font-medium", VERDICT_STYLE[verdict.status])}>
              {verdict.detail?.reserved ? <><CheckCircle2 className="size-4" /> Reserved</> : verdict.status === "AVAILABLE" || verdict.status === "PARTIAL" ? <><CheckCircle2 className="size-4" /> {verdict.status}</> : <><XCircle className="size-4" /> {verdict.status}</>}
            </span>
          )}
        </div>
        {(check.isError || reserve.isError) && <p className="text-xs text-rose-600">Kuch ghalat hua — dobara dekhein.</p>}
      </CardContent>
    </Card>
  );
}

function buildBody(p: string | null, f: Record<string, string>): Record<string, unknown> {
  const n = (x?: string) => (x ? Number(x) : undefined);
  switch (p) {
    case "P2_PERSON_SLOT": return { crewResourceId: n(f.crewResourceId), startAt: f.startAt, endAt: f.endAt };
    case "P3_UNIT_POOL": return { rentalSkuId: n(f.rentalSkuId), qty: n(f.qty), outAt: f.outAt, dueBackAt: f.dueBackAt };
    case "P4_CAPACITY": return { productionLineId: n(f.productionLineId), qty: n(f.qty), deliveryDate: f.deliveryDate };
    case "P5_PIPELINE": return { title: f.title, deadlineAt: f.deadlineAt, stages: [{ name: "Production", durationDays: 7 }] };
    default: return {};
  }
}

const Field = ({ label, value, onChange, type = "text" }: { label: string; value?: string; onChange: (v: string) => void; type?: string }) => (
  <div><label className="text-xs text-muted-foreground">{label}</label><input type={type} className={inputCls} value={value || ""} onChange={(e) => onChange(e.target.value)} /></div>
);
const Select = ({ label, value, onChange, options }: { label: string; value?: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) => (
  <div>
    <label className="text-xs text-muted-foreground">{label}</label>
    <select className={inputCls} value={value || ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select…</option>
      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>
);

export default PrimitiveBookingPanel;
