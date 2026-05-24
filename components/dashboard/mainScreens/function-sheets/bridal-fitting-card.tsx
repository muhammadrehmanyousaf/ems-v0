"use client";

/**
 * Bridal-wear fitting / alteration schedule (§16.7) — the bridal pillar.
 * Solves PK-bridal's two top pains: notorious delivery delays (via a strict
 * milestone timeline the customer can see) and rental deposit/damage disputes
 * (per-outfit deposit + return tracking + damage notes).
 *
 * Saves into FunctionSheet.bridalWearJson via the existing update endpoint.
 * Read-only on terminal sheets. Same proven pattern as BEO / Deliverables /
 * Kitchen sheet.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Scissors, Plus, Trash2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import {
  FunctionSheetAPI,
  type FunctionSheet,
  type BridalMilestone,
  type BridalMilestoneKey,
  type BridalOutfit,
  type BridalWearData,
} from "@/lib/api/functionSheets";

// Canonical order of bridal milestones; vendor ticks them off in order.
const MILESTONE_ORDER: { key: BridalMilestoneKey; label: string }[] = [
  { key: "measurements", label: "Measurements taken" },
  { key: "cut",          label: "Cut" },
  { key: "stitched",     label: "Stitched" },
  { key: "fitting1",     label: "1st fitting" },
  { key: "fitting2",     label: "2nd fitting" },
  { key: "final",        label: "Final ready" },
  { key: "delivered",    label: "Delivered" },
];

const newId = () => Math.random().toString(36).slice(2, 10);
const emptyOutfit = (name = ""): BridalOutfit => ({
  id: newId(), name, type: "purchase", deposit: null, deliveredAt: null, returnedAt: null, damageNotes: "",
});

const today = () => new Date().toISOString().slice(0, 10);

export default function BridalFittingCard({
  sheet, onSaved, readOnly = false,
}: { sheet: FunctionSheet; onSaved?: () => void; readOnly?: boolean }) {
  const [milestones, setMilestones] = useState<BridalMilestone[]>([]);
  const [outfits, setOutfits] = useState<BridalOutfit[]>([emptyOutfit()]);
  const [alterationNotes, setAlterationNotes] = useState("");
  const [depositHeld, setDepositHeld] = useState("");
  const [depositReturnedAt, setDepositReturnedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const b = sheet.bridalWearJson || {};
    // Hydrate milestones from saved state, in canonical order, defaulting missing ones.
    const saved: Record<string, BridalMilestone> = {};
    (b.milestones || []).forEach((m) => { saved[m.key] = m; });
    setMilestones(MILESTONE_ORDER.map(({ key, label }) =>
      saved[key] || { key, label, status: "pending", doneAt: null }
    ));
    setOutfits(b.outfits && b.outfits.length ? b.outfits : [emptyOutfit()]);
    setAlterationNotes(b.alterationNotes || "");
    setDepositHeld(b.depositHeld != null ? String(b.depositHeld) : "");
    setDepositReturnedAt(b.depositReturnedAt || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.id, sheet.updatedAt]);

  const toggleMilestone = (i: number) => {
    if (readOnly) return;
    setMilestones((xs) => xs.map((m, idx) => idx === i
      ? { ...m, status: m.status === "done" ? "pending" : "done", doneAt: m.status === "done" ? null : today() }
      : m
    ));
  };
  const setMilestoneNote = (i: number, note: string) =>
    setMilestones((xs) => xs.map((m, idx) => (idx === i ? { ...m, note } : m)));

  const setOutfit = (i: number, patch: Partial<BridalOutfit>) =>
    setOutfits((xs) => xs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addOutfit = () => setOutfits((xs) => [...xs, emptyOutfit()]);
  const removeOutfit = (i: number) => setOutfits((xs) => xs.filter((_, idx) => idx !== i));

  const onSave = async () => {
    setSaving(true);
    try {
      const payload: BridalWearData = {
        milestones,
        outfits: outfits.filter((o) => o.name.trim()).map((o) => ({
          ...o,
          name: o.name.trim(),
          damageNotes: o.damageNotes?.trim() || undefined,
        })),
        alterationNotes: alterationNotes.trim() || undefined,
        depositHeld: depositHeld.trim() === "" ? null : Math.max(0, parseInt(depositHeld, 10) || 0),
        depositReturnedAt,
      };
      await FunctionSheetAPI.update(sheet.id, { bridalWearJson: payload });
      toast.success("Bridal schedule saved");
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const doneCount = milestones.filter((m) => m.status === "done").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scissors className="h-4 w-4 text-bridal-gold-dark" />
          Fitting &amp; alteration schedule
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Track every milestone for this order so deliveries don&apos;t slip, and capture rental
          deposits + return condition so deposits never get disputed.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Milestone timeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Milestones</Label>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {doneCount} / {milestones.length} done
            </span>
          </div>
          <div className="space-y-1">
            {milestones.map((m, i) => (
              <div key={m.key} className="flex items-start gap-2 rounded-md border p-2">
                <button
                  type="button"
                  onClick={() => toggleMilestone(i)}
                  disabled={readOnly}
                  aria-pressed={m.status === "done"}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    m.status === "done"
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-neutral-300 bg-white hover:border-emerald-400"
                  }`}
                >
                  {m.status === "done" && <Check className="h-3 w-3" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-sm font-medium ${m.status === "done" ? "text-emerald-700" : "text-neutral-800"}`}>
                      {m.label}
                    </span>
                    {m.doneAt && <span className="text-[11px] text-muted-foreground tabular-nums">{m.doneAt}</span>}
                  </div>
                  <Input
                    className="mt-1 h-7 text-xs"
                    placeholder="Note (optional)"
                    value={m.note || ""}
                    disabled={readOnly}
                    onChange={(e) => setMilestoneNote(i, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outfits */}
        <div className="space-y-2">
          <Label className="text-xs">Outfits</Label>
          {outfits.map((o, i) => (
            <div key={o.id} className="rounded-md border p-2 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="e.g. Bridal Lehenga / Walima Saree"
                  value={o.name}
                  disabled={readOnly}
                  onChange={(e) => setOutfit(i, { name: e.target.value })}
                />
                <Select
                  value={o.type}
                  onValueChange={(v) => setOutfit(i, { type: v as BridalOutfit["type"] })}
                  disabled={readOnly}
                >
                  <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase" className="text-xs">Purchase</SelectItem>
                    <SelectItem value="rental" className="text-xs">Rental</SelectItem>
                    <SelectItem value="custom" className="text-xs">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {!readOnly && (
                  <Button type="button" variant="ghost" size="icon" className="shrink-0"
                    onClick={() => removeOutfit(i)} aria-label="Remove outfit">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Deposit Rs</Label>
                  <Input type="number" min={0} value={o.deposit ?? ""} disabled={readOnly}
                    onChange={(e) => setOutfit(i, {
                      deposit: e.target.value === "" ? null : Math.max(0, parseInt(e.target.value, 10) || 0),
                    })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Delivered</Label>
                  <Input type="date" value={o.deliveredAt || ""} disabled={readOnly}
                    onChange={(e) => setOutfit(i, { deliveredAt: e.target.value || null })} />
                </div>
                {o.type === "rental" && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Returned</Label>
                      <Input type="date" value={o.returnedAt || ""} disabled={readOnly}
                        onChange={(e) => setOutfit(i, { returnedAt: e.target.value || null })} />
                    </div>
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Damage</Label>
                      <Input placeholder="None / details" value={o.damageNotes || ""} disabled={readOnly}
                        onChange={(e) => setOutfit(i, { damageNotes: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addOutfit}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add outfit
            </Button>
          )}
        </div>

        {/* Alterations + deposit */}
        <div className="space-y-1">
          <Label className="text-xs">Alteration notes</Label>
          <Textarea rows={2} value={alterationNotes} disabled={readOnly}
            placeholder="Sleeve length, hem, dupatta finishing, etc."
            onChange={(e) => setAlterationNotes(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Total deposit held Rs</Label>
            <Input type="number" min={0} value={depositHeld} disabled={readOnly}
              onChange={(e) => setDepositHeld(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Deposit returned on</Label>
            <Input type="date" value={depositReturnedAt || ""} disabled={readOnly}
              onChange={(e) => setDepositReturnedAt(e.target.value || null)} />
          </div>
        </div>

        {!readOnly && (
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving} size="sm">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save bridal schedule
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
