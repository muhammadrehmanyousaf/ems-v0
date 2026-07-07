"use client";

/**
 * Phase-3 — vendor Availability setup. Detects the business's availability
 * primitive and shows the right setup form: crew lanes (P2), rental SKUs (P3), or
 * production capacity (P4). Venue (P1) points to the calendar; made-to-order (P5)
 * needs no fixed availability. Self-hides when the engine is dark (404).
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Users, Package, ChefHat } from "lucide-react";
import {
  getAvailabilitySetup, createCrewResource, createRentalSku, createProductionLine, deactivateResource,
} from "@/lib/api/availabilitySetup";
import { PRIMITIVE_LABEL } from "@/lib/availability-primitive";
import { PrimitiveBookingPanel } from "@/components/settings/primitive-booking-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const rs = (n: number) => "Rs " + Math.round(n || 0).toLocaleString("en-PK");
const inputCls = "rounded-md border bg-transparent px-2 py-1.5 text-sm w-full";

export function AvailabilitySetup() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["availability-setup"], queryFn: getAvailabilitySetup });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["availability-setup"] });

  if (isLoading) {
    return <div className="flex items-center justify-center gap-2 text-muted-foreground py-16"><Loader2 className="size-4 animate-spin" /> Loading…</div>;
  }
  if (!data) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Availability engine abhi enabled nahi hai.</div>;
  }

  const p = data.primitive;
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Availability Setup</h1>
        <p className="text-sm text-muted-foreground">{p ? PRIMITIVE_LABEL[p] : "—"} — apni bookable capacity set karein.</p>
      </div>

      {p === "P2_PERSON_SLOT" && <CrewSetup crews={data.crewResources} onChange={invalidate} />}
      {p === "P3_UNIT_POOL" && <SkuSetup skus={data.rentalSkus} onChange={invalidate} />}
      {p === "P4_CAPACITY" && <LineSetup lines={data.productionLines} onChange={invalidate} />}
      {p === "P1_VENUE_LOCK" && <Note text="Venue availability calendar se manage hoti hai — Calendar par jayein." />}
      {p === "P5_PIPELINE" && <Note text="Made-to-order kaam — fixed availability set karne ki zaroorat nahi; deadline par work-order chalta hai." />}
      {!p && <Note text="Aap ke vendor type ke liye availability primitive set nahi hai." />}

      {/* The cutover in action — check + book against the configured availability. */}
      {(p === "P2_PERSON_SLOT" || p === "P3_UNIT_POOL" || p === "P4_CAPACITY" || p === "P5_PIPELINE") && (
        <PrimitiveBookingPanel setup={data} />
      )}
    </div>
  );
}

const Note = ({ text }: { text: string }) => (
  <Card><CardContent className="p-4 text-sm text-muted-foreground">{text}</CardContent></Card>
);

function CrewSetup({ crews, onChange }: { crews: any[]; onChange: () => void }) {
  const [label, setLabel] = useState("");
  const [laneCount, setLaneCount] = useState(1);
  const [buffer, setBuffer] = useState(0);
  const add = useMutation({ mutationFn: () => createCrewResource({ label, laneCount, travelBufferMin: buffer }), onSuccess: () => { setLabel(""); setLaneCount(1); setBuffer(0); onChange(); } });
  const del = useMutation({ mutationFn: (id: number) => deactivateResource("crew-resources", id), onSuccess: onChange });
  return (
    <Card><CardContent className="p-5 space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2"><Users className="size-4" /> Crew lanes</h3>
      <p className="text-xs text-muted-foreground">Ek studio jis ke 3 crew hain wo raat ko 3 shadiyan le sakta hai (lanes = 3). Buffer = ek gig se doosre tak safar ka waqt.</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
        <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Naam</label><input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Ali Studio Crew" /></div>
        <div><label className="text-xs text-muted-foreground">Lanes</label><input type="number" min={1} className={inputCls} value={laneCount} onChange={(e) => setLaneCount(Math.max(1, Number(e.target.value) || 1))} /></div>
        <div><label className="text-xs text-muted-foreground">Buffer (min)</label><input type="number" min={0} className={inputCls} value={buffer} onChange={(e) => setBuffer(Math.max(0, Number(e.target.value) || 0))} /></div>
      </div>
      <Button size="sm" disabled={!label || add.isPending} onClick={() => add.mutate()}>{add.isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : <Plus className="size-4 mr-1" />} Add lane</Button>
      <ResourceList items={crews.filter((c) => c.active)} render={(c) => `${c.label} · ${c.laneCount} lane${c.laneCount > 1 ? "s" : ""}${c.travelBufferMin ? ` · ${c.travelBufferMin}m buffer` : ""}`} onDelete={(id) => del.mutate(id)} busy={del.isPending} />
    </CardContent></Card>
  );
}

function SkuSetup({ skus, onChange }: { skus: any[]; onChange: () => void }) {
  const [name, setName] = useState("");
  const [totalUnits, setTotal] = useState(10);
  const [deposit, setDeposit] = useState(0);
  const add = useMutation({ mutationFn: () => createRentalSku({ name, totalUnits, securityDepositPerUnit: deposit }), onSuccess: () => { setName(""); setTotal(10); setDeposit(0); onChange(); } });
  const del = useMutation({ mutationFn: (id: number) => deactivateResource("rental-skus", id), onSuccess: onChange });
  return (
    <Card><CardContent className="p-5 space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2"><Package className="size-4" /> Rental stock</h3>
      <p className="text-xs text-muted-foreground">Har item ka pool + per-unit security deposit. Availability = total − jo diye hue hain overlapping dates par.</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
        <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Item</label><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chiavari chairs" /></div>
        <div><label className="text-xs text-muted-foreground">Total units</label><input type="number" min={0} className={inputCls} value={totalUnits} onChange={(e) => setTotal(Math.max(0, Number(e.target.value) || 0))} /></div>
        <div><label className="text-xs text-muted-foreground">Deposit/unit</label><input type="number" min={0} className={inputCls} value={deposit} onChange={(e) => setDeposit(Math.max(0, Number(e.target.value) || 0))} /></div>
      </div>
      <Button size="sm" disabled={!name || add.isPending} onClick={() => add.mutate()}>{add.isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : <Plus className="size-4 mr-1" />} Add stock</Button>
      <ResourceList items={skus.filter((s) => s.active)} render={(s) => `${s.name} · ${s.totalUnits} ${s.unit}${Number(s.securityDepositPerUnit) ? ` · ${rs(Number(s.securityDepositPerUnit))} deposit/unit` : ""}`} onDelete={(id) => del.mutate(id)} busy={del.isPending} />
    </CardContent></Card>
  );
}

function LineSetup({ lines, onChange }: { lines: any[]; onChange: () => void }) {
  const [name, setName] = useState("");
  const [cap, setCap] = useState(500);
  const add = useMutation({ mutationFn: () => createProductionLine({ name, capacityPerDay: cap }), onSuccess: () => { setName(""); setCap(500); onChange(); } });
  const del = useMutation({ mutationFn: (id: number) => deactivateResource("production-lines", id), onSuccess: onChange });
  return (
    <Card><CardContent className="p-5 space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2"><ChefHat className="size-4" /> Daily capacity</h3>
      <p className="text-xs text-muted-foreground">Ek din mein kitna bana sakte hain (heads/kg/boxes). Us din ke saare orders is capacity mein aane chahiye.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
        <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Line</label><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Degh kitchen" /></div>
        <div><label className="text-xs text-muted-foreground">Per day</label><input type="number" min={0} className={inputCls} value={cap} onChange={(e) => setCap(Math.max(0, Number(e.target.value) || 0))} /></div>
      </div>
      <Button size="sm" disabled={!name || add.isPending} onClick={() => add.mutate()}>{add.isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : <Plus className="size-4 mr-1" />} Add line</Button>
      <ResourceList items={lines.filter((l) => l.active)} render={(l) => `${l.name} · ${l.capacityPerDay} ${l.unit}/day`} onDelete={(id) => del.mutate(id)} busy={del.isPending} />
    </CardContent></Card>
  );
}

function ResourceList({ items, render, onDelete, busy }: { items: any[]; render: (x: any) => string; onDelete: (id: number) => void; busy: boolean }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">Abhi kuch nahi — upar se add karein.</p>;
  return (
    <div className="rounded-lg border divide-y">
      {items.map((it) => (
        <div key={it.id} className="flex items-center justify-between px-3 py-2 text-sm">
          <span>{render(it)}</span>
          <button className="text-muted-foreground hover:text-rose-600 disabled:opacity-50" disabled={busy} onClick={() => onDelete(it.id)} title="Remove"><Trash2 className="size-3.5" /></button>
        </div>
      ))}
    </div>
  );
}

export default AvailabilitySetup;
