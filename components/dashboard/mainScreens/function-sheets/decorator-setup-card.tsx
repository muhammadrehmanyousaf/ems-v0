"use client";

/**
 * Decorator setup + decor-inventory sheet (§16.6) — the decorator pillar.
 * Kills the two top PK-decorator margin-killers: 15–25% decor spoilage / loss
 * (per-item condition tracking) and under-staffed setup/breakdown logistics.
 *
 *  • Setup + breakdown times with crew counts on each.
 *  • Per-item inventory rows: name, qty, source (own/rented), per-unit cost,
 *    post-event condition (planned / setup / returned / damaged / lost) +
 *    notes. Live "decor cost" sum across rows so the vendor sees margin live.
 *  • Substitution + damage/loss notes — for client conversations and claims.
 *
 * Saves into FunctionSheet.decoratorSetupJson via the existing update
 * endpoint. Read-only on terminal sheets. Same proven pattern as the other
 * vendor-type cards (BEO / Deliverables / Kitchen / Bridal).
 */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Palette, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  FunctionSheetAPI,
  type FunctionSheet,
  type DecorCondition,
  type DecorItem,
  type DecoratorSetupData,
} from "@/lib/api/functionSheets";

const COND_LABEL: Record<DecorCondition, string> = {
  planned: "Planned",
  setup: "Setup",
  returned: "Returned OK",
  damaged: "Damaged",
  lost: "Lost",
};

const COND_TONE: Record<DecorCondition, string> = {
  planned: "text-neutral-600",
  setup: "text-blue-700",
  returned: "text-emerald-700",
  damaged: "text-amber-700",
  lost: "text-red-700",
};

const fmtPKR = (n: number) =>
  n > 0 ? `Rs ${Math.round(n).toLocaleString("en-PK")}` : "Rs 0";

const newId = () => Math.random().toString(36).slice(2, 10);
const emptyItem = (item = ""): DecorItem => ({
  id: newId(), item, qty: 1, source: "own", perUnitCost: null, condition: "planned", notes: "",
});

export default function DecoratorSetupCard({
  sheet, onSaved, readOnly = false,
}: { sheet: FunctionSheet; onSaved?: () => void; readOnly?: boolean }) {
  const [setupTime, setSetupTime] = useState("");
  const [breakdownTime, setBreakdownTime] = useState("");
  const [setupCrew, setSetupCrew] = useState("");
  const [breakdownCrew, setBreakdownCrew] = useState("");
  const [transportTrips, setTransportTrips] = useState("");
  const [items, setItems] = useState<DecorItem[]>([emptyItem()]);
  const [substitutionNotes, setSubstitutionNotes] = useState("");
  const [damageLossNotes, setDamageLossNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const d = sheet.decoratorSetupJson || {};
    setSetupTime(d.setupTime || "");
    setBreakdownTime(d.breakdownTime || "");
    setSetupCrew(d.setupCrew != null ? String(d.setupCrew) : "");
    setBreakdownCrew(d.breakdownCrew != null ? String(d.breakdownCrew) : "");
    setTransportTrips(d.transportTrips != null ? String(d.transportTrips) : "");
    setItems(d.items && d.items.length ? d.items : [emptyItem()]);
    setSubstitutionNotes(d.substitutionNotes || "");
    setDamageLossNotes(d.damageLossNotes || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.id, sheet.updatedAt]);

  const totalCost = useMemo(
    () => items.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.perUnitCost) || 0), 0),
    [items],
  );
  const lostOrDamaged = useMemo(
    () => items.filter((r) => r.condition === "damaged" || r.condition === "lost").length,
    [items],
  );

  const setRow = (i: number, patch: Partial<DecorItem>) =>
    setItems((xs) => xs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setItems((xs) => [...xs, emptyItem()]);
  const removeRow = (i: number) => setItems((xs) => xs.filter((_, idx) => idx !== i));

  const onSave = async () => {
    setSaving(true);
    try {
      const payload: DecoratorSetupData = {
        setupTime: setupTime || undefined,
        breakdownTime: breakdownTime || undefined,
        setupCrew: setupCrew.trim() === "" ? null : Math.max(0, parseInt(setupCrew, 10) || 0),
        breakdownCrew: breakdownCrew.trim() === "" ? null : Math.max(0, parseInt(breakdownCrew, 10) || 0),
        transportTrips: transportTrips.trim() === "" ? null : Math.max(0, parseInt(transportTrips, 10) || 0),
        items: items.filter((r) => r.item.trim()).map((r) => ({
          ...r,
          item: r.item.trim(),
          qty: Math.max(0, Number(r.qty) || 0),
          notes: r.notes?.trim() || undefined,
        })),
        substitutionNotes: substitutionNotes.trim() || undefined,
        damageLossNotes: damageLossNotes.trim() || undefined,
      };
      await FunctionSheetAPI.update(sheet.id, { decoratorSetupJson: payload });
      toast.success("Decor sheet saved");
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="h-4 w-4 text-bridal-gold-dark" />
          Decor setup &amp; inventory
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Setup/breakdown logistics + per-item decor inventory with post-event
          condition — so spoilage, damage, and rental losses don&apos;t eat your margin.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logistics */}
        <div className="rounded-md border p-3 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Setup time</Label>
              <Input type="time" value={setupTime} disabled={readOnly}
                onChange={(e) => setSetupTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Setup crew</Label>
              <Input type="number" min={0} value={setupCrew} disabled={readOnly}
                onChange={(e) => setSetupCrew(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Breakdown time</Label>
              <Input type="time" value={breakdownTime} disabled={readOnly}
                onChange={(e) => setBreakdownTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Breakdown crew</Label>
              <Input type="number" min={0} value={breakdownCrew} disabled={readOnly}
                onChange={(e) => setBreakdownCrew(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Transport trips</Label>
              <Input type="number" min={0} value={transportTrips} disabled={readOnly}
                onChange={(e) => setTransportTrips(e.target.value)} />
            </div>
            <div className="sm:col-span-2 rounded-md bg-muted/40 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Decor cost: </span>
              <span className="font-semibold tabular-nums">{fmtPKR(totalCost)}</span>
              {lostOrDamaged > 0 && (
                <span className="ml-2 text-amber-700">
                  · {lostOrDamaged} item{lostOrDamaged > 1 ? "s" : ""} damaged/lost
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2">
          <Label className="text-xs">Decor inventory</Label>
          {items.map((row, i) => (
            <div key={row.id} className="rounded-md border p-2 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="e.g. Stage flower arch"
                  value={row.item}
                  disabled={readOnly}
                  onChange={(e) => setRow(i, { item: e.target.value })}
                />
                <Select
                  value={row.condition}
                  onValueChange={(v) => setRow(i, { condition: v as DecorCondition })}
                  disabled={readOnly}
                >
                  <SelectTrigger className={`w-[130px] h-9 text-xs ${COND_TONE[row.condition]}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(COND_LABEL) as DecorCondition[]).map((c) => (
                      <SelectItem key={c} value={c} className={`text-xs ${COND_TONE[c]}`}>
                        {COND_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!readOnly && (
                  <Button type="button" variant="ghost" size="icon" className="shrink-0"
                    onClick={() => removeRow(i)} aria-label="Remove">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Qty</Label>
                  <Input type="number" min={0} value={row.qty ?? ""} disabled={readOnly}
                    onChange={(e) => setRow(i, {
                      qty: e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0),
                    })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Source</Label>
                  <Select
                    value={row.source || "own"}
                    onValueChange={(v) => setRow(i, { source: v as DecorItem["source"] })}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="own" className="text-xs">Own stock</SelectItem>
                      <SelectItem value="rented" className="text-xs">Rented</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Cost/unit Rs</Label>
                  <Input type="number" min={0} value={row.perUnitCost ?? ""} disabled={readOnly}
                    onChange={(e) => setRow(i, {
                      perUnitCost: e.target.value === "" ? null : Math.max(0, parseInt(e.target.value, 10) || 0),
                    })} />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Notes</Label>
                  <Input placeholder="e.g. red roses → orchids substitute"
                    value={row.notes || ""} disabled={readOnly}
                    onChange={(e) => setRow(i, { notes: e.target.value })} />
                </div>
              </div>
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add item
            </Button>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <Label className="text-xs">Flower / item substitutions</Label>
          <Textarea rows={2} value={substitutionNotes} disabled={readOnly}
            placeholder="Availability changes, premium substitutes, client approval…"
            onChange={(e) => setSubstitutionNotes(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Damage / loss notes (for claims)</Label>
          <Textarea rows={2} value={damageLossNotes} disabled={readOnly}
            placeholder="Itemise damage / who pays / supplier claim status"
            onChange={(e) => setDamageLossNotes(e.target.value)} />
        </div>

        {!readOnly && (
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving} size="sm">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save decor sheet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
