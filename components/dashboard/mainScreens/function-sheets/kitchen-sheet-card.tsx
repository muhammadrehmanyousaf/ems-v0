"use client";

/**
 * Caterer kitchen sheet (§16.2) — the catering equivalent of BEO. Designed to
 * kill the two biggest PK-caterer pains: 15-25% food wastage (caused by
 * unlocked headcounts) and under/over-staffing on the day (caused by no
 * ratio discipline).
 *
 *  • Headcount + a one-tap "Lock" so changes after this don't quietly inflate prep.
 *  • Menu rows with PER-HEAD quantity ("Chicken Karahi · 200g/head").
 *  • Staffing-ratio calculator (1 waiter / 15 guests, 1 cook / 50, 1 labour / 30
 *    — based on Pakistani-caterer field data). Vendor can override.
 *  • Service times (prep / cook / serve), halal confirmation, dietary notes,
 *    and a leftover plan.
 *
 * Saves into FunctionSheet.kitchenSheetJson via the existing update endpoint.
 * Read-only on terminal sheets. Same proven pattern as BEO + Deliverables.
 */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ChefHat, Lock, Unlock, Plus, Trash2, Loader2, Calculator } from "lucide-react";
import { toast } from "sonner";
import {
  FunctionSheetAPI,
  type FunctionSheet,
  type KitchenMenuItem,
  type KitchenSheetData,
} from "@/lib/api/functionSheets";

// PK-caterer field ratios (per-N guests). Easy to override; just nudges.
const RATIO_WAITERS_PER = 15;
const RATIO_COOKS_PER = 50;
const RATIO_LABOUR_PER = 30;

const newId = () => Math.random().toString(36).slice(2, 10);
const emptyItem = (item = ""): KitchenMenuItem => ({ id: newId(), item, perHead: "", notes: "" });

export default function KitchenSheetCard({
  sheet, onSaved, readOnly = false,
}: { sheet: FunctionSheet; onSaved?: () => void; readOnly?: boolean }) {
  const [headcount, setHeadcount] = useState("");
  const [lockedAt, setLockedAt] = useState<string | null>(null);
  const [menu, setMenu] = useState<KitchenMenuItem[]>([emptyItem()]);
  const [waiters, setWaiters] = useState("");
  const [cooks, setCooks] = useState("");
  const [labour, setLabour] = useState("");
  const [prepStart, setPrepStart] = useState("");
  const [cookStart, setCookStart] = useState("");
  const [serveTime, setServeTime] = useState("");
  const [halalConfirmed, setHalalConfirmed] = useState(false);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [leftoverPlan, setLeftoverPlan] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const k = sheet.kitchenSheetJson || {};
    setHeadcount(k.headcount != null ? String(k.headcount) : "");
    setLockedAt(k.headcountLockedAt || null);
    setMenu(k.menu && k.menu.length ? k.menu : [emptyItem()]);
    setWaiters(k.staffing?.waiters != null ? String(k.staffing.waiters) : "");
    setCooks(k.staffing?.cooks != null ? String(k.staffing.cooks) : "");
    setLabour(k.staffing?.labour != null ? String(k.staffing.labour) : "");
    setPrepStart(k.prepStart || "");
    setCookStart(k.cookStart || "");
    setServeTime(k.serveTime || "");
    setHalalConfirmed(!!k.halalConfirmed);
    setDietaryNotes(k.dietaryNotes || "");
    setLeftoverPlan(k.leftoverPlan || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.id, sheet.updatedAt]);

  const hcNum = Math.max(0, parseInt(headcount, 10) || 0);
  const suggested = useMemo(() => ({
    waiters: hcNum ? Math.ceil(hcNum / RATIO_WAITERS_PER) : 0,
    cooks: hcNum ? Math.ceil(hcNum / RATIO_COOKS_PER) : 0,
    labour: hcNum ? Math.ceil(hcNum / RATIO_LABOUR_PER) : 0,
  }), [hcNum]);

  const applySuggested = () => {
    setWaiters(String(suggested.waiters));
    setCooks(String(suggested.cooks));
    setLabour(String(suggested.labour));
  };
  const toggleLock = () =>
    setLockedAt((cur) => (cur ? null : new Date().toISOString().slice(0, 10)));

  const setRow = (i: number, patch: Partial<KitchenMenuItem>) =>
    setMenu((xs) => xs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setMenu((xs) => [...xs, emptyItem()]);
  const removeRow = (i: number) => setMenu((xs) => xs.filter((_, idx) => idx !== i));

  const onSave = async () => {
    setSaving(true);
    try {
      const payload: KitchenSheetData = {
        headcount: headcount.trim() === "" ? null : hcNum,
        headcountLockedAt: lockedAt,
        menu: menu.filter((r) => r.item.trim()).map((r) => ({
          ...r,
          item: r.item.trim(),
          perHead: r.perHead?.trim() || undefined,
          notes: r.notes?.trim() || undefined,
        })),
        staffing: {
          waiters: waiters.trim() === "" ? undefined : Math.max(0, parseInt(waiters, 10) || 0),
          cooks: cooks.trim() === "" ? undefined : Math.max(0, parseInt(cooks, 10) || 0),
          labour: labour.trim() === "" ? undefined : Math.max(0, parseInt(labour, 10) || 0),
        },
        prepStart: prepStart || undefined,
        cookStart: cookStart || undefined,
        serveTime: serveTime || undefined,
        halalConfirmed,
        dietaryNotes: dietaryNotes.trim() || undefined,
        leftoverPlan: leftoverPlan.trim() || undefined,
      };
      await FunctionSheetAPI.update(sheet.id, { kitchenSheetJson: payload });
      toast.success("Kitchen sheet saved");
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save kitchen sheet");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ChefHat className="h-4 w-4 text-bridal-gold-dark" />
          Kitchen sheet
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Lock the headcount, define per-head quantities, sanity-check staffing —
          so you don&apos;t lose money to wastage or under-staffing on the day.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Headcount + lock */}
        <div className="rounded-md border p-3 space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Final headcount</Label>
              <Input
                type="number" min={0} inputMode="numeric"
                placeholder="e.g. 350"
                value={headcount}
                disabled={readOnly || !!lockedAt}
                onChange={(e) => setHeadcount(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant={lockedAt ? "default" : "outline"}
              size="sm"
              disabled={readOnly}
              onClick={toggleLock}
              className="gap-1.5"
            >
              {lockedAt ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              {lockedAt ? `Locked ${lockedAt}` : "Lock"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Lock the headcount once final so last-minute "thoda aur bana lo" doesn&apos;t inflate prep + cost.
          </p>
        </div>

        {/* Menu rows */}
        <div className="space-y-2">
          <Label className="text-xs">Menu — per-head quantity</Label>
          {menu.map((row, i) => (
            <div key={row.id} className="flex items-center gap-2">
              <Input
                className="flex-1"
                placeholder="e.g. Chicken Karahi"
                value={row.item}
                disabled={readOnly}
                onChange={(e) => setRow(i, { item: e.target.value })}
              />
              <Input
                className="w-32 shrink-0"
                placeholder="e.g. 200g/head"
                value={row.perHead || ""}
                disabled={readOnly}
                onChange={(e) => setRow(i, { perHead: e.target.value })}
              />
              {!readOnly && (
                <Button type="button" variant="ghost" size="icon" className="shrink-0"
                  onClick={() => removeRow(i)} aria-label="Remove">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add item
            </Button>
          )}
        </div>

        {/* Staffing */}
        <div className="rounded-md border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Staffing</Label>
            {!readOnly && hcNum > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={applySuggested}
                className="gap-1.5 h-7 text-[11px]">
                <Calculator className="h-3 w-3" />
                Use suggested ({suggested.waiters}/{suggested.cooks}/{suggested.labour})
              </Button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Waiters</Label>
              <Input type="number" min={0} value={waiters} disabled={readOnly}
                onChange={(e) => setWaiters(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Cooks</Label>
              <Input type="number" min={0} value={cooks} disabled={readOnly}
                onChange={(e) => setCooks(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Labour</Label>
              <Input type="number" min={0} value={labour} disabled={readOnly}
                onChange={(e) => setLabour(e.target.value)} />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Field ratios: ~1 waiter / 15 · 1 cook / 50 · 1 labour / 30. Override as needed.
          </p>
        </div>

        {/* Service times */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Prep start</Label>
            <Input type="time" value={prepStart} disabled={readOnly}
              onChange={(e) => setPrepStart(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Cook start</Label>
            <Input type="time" value={cookStart} disabled={readOnly}
              onChange={(e) => setCookStart(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Serve</Label>
            <Input type="time" value={serveTime} disabled={readOnly}
              onChange={(e) => setServeTime(e.target.value)} />
          </div>
        </div>

        {/* Halal + dietary */}
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="space-y-0.5 pr-3">
            <Label className="text-sm">Halal-certified ingredients confirmed</Label>
            <p className="text-[11px] text-muted-foreground">
              Confirm your suppliers&apos; halal certs are current — printed on the BEO for client comfort.
            </p>
          </div>
          <Switch checked={halalConfirmed} onCheckedChange={setHalalConfirmed} disabled={readOnly} />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Dietary notes</Label>
          <Textarea rows={2} value={dietaryNotes} disabled={readOnly}
            placeholder="Allergens, vegetarian portions, jain options, kid meals…"
            onChange={(e) => setDietaryNotes(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Leftover plan</Label>
          <Textarea rows={2} value={leftoverPlan} disabled={readOnly}
            placeholder="e.g. Pack and send to local NGO; staff dinner; family pack to client."
            onChange={(e) => setLeftoverPlan(e.target.value)} />
        </div>

        {!readOnly && (
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving} size="sm">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save kitchen sheet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
