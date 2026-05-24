"use client";

/**
 * Henna / Mehndi schedule (§16.4) — the henna pillar.
 * PK henna artists don't price flat — they price per-hand × complexity.
 * Each subject (bride / sister / aunty / guest) is its own row:
 *   hands × per-hand rate × complexity tier → live row total.
 * Plus day-of timing (artist arrival, session start/end, per-subject
 * appointment), travel charge, out-of-city, family bulk discount,
 * and aftercare-kit toggle.
 *
 * Saves into FunctionSheet.hennaJson via the existing update endpoint.
 * Read-only on terminal sheets. Same proven pattern as the other pillars.
 */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sparkles, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  FunctionSheetAPI,
  type FunctionSheet,
  type HennaSubject,
  type HennaComplexity,
  type HennaScheduleData,
} from "@/lib/api/functionSheets";

const COMPLEXITY_LABEL: Record<HennaComplexity, string> = {
  simple: "Simple",
  medium: "Medium",
  bridal: "Bridal (full)",
  intricate: "Intricate / Arabic",
};
const COMPLEXITY_TONE: Record<HennaComplexity, string> = {
  simple: "text-neutral-600",
  medium: "text-blue-700",
  bridal: "text-rose-700",
  intricate: "text-purple-700",
};

const fmtPKR = (n: number) =>
  n > 0 ? `Rs ${Math.round(n).toLocaleString("en-PK")}` : "Rs 0";

const newId = () => Math.random().toString(36).slice(2, 10);
const emptySubject = (name = ""): HennaSubject => ({
  id: newId(),
  name,
  hands: 2,
  complexity: "medium",
  perHandRate: null,
  appointmentTime: "",
  startedAt: "",
  finishedAt: "",
  notes: "",
});
const numOrNull = (v: string) =>
  v === "" ? null : Math.max(0, parseFloat(v) || 0);
const rowTotal = (s: HennaSubject) =>
  (Number(s.hands) || 0) * (Number(s.perHandRate) || 0);

export default function HennaScheduleCard({
  sheet, onSaved, readOnly = false,
}: { sheet: FunctionSheet; onSaved?: () => void; readOnly?: boolean }) {
  const [subjects, setSubjects] = useState<HennaSubject[]>([emptySubject("Bride")]);
  const [artistArrivalTime, setArtistArrivalTime] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState("");
  const [sessionEndTime, setSessionEndTime] = useState("");
  const [travelCharge, setTravelCharge] = useState("");
  const [outOfCity, setOutOfCity] = useState(false);
  const [familyBulkDiscount, setFamilyBulkDiscount] = useState("");
  const [aftercareKitIncluded, setAftercareKitIncluded] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const h = sheet.hennaJson || {};
    setSubjects(h.subjects && h.subjects.length ? h.subjects : [emptySubject("Bride")]);
    setArtistArrivalTime(h.artistArrivalTime || "");
    setSessionStartTime(h.sessionStartTime || "");
    setSessionEndTime(h.sessionEndTime || "");
    setTravelCharge(h.travelCharge != null ? String(h.travelCharge) : "");
    setOutOfCity(!!h.outOfCity);
    setFamilyBulkDiscount(h.familyBulkDiscount != null ? String(h.familyBulkDiscount) : "");
    setAftercareKitIncluded(!!h.aftercareKitIncluded);
    setNotes(h.notes || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.id, sheet.updatedAt]);

  const totals = useMemo(() => {
    const subjectsTotal = subjects.reduce((a, s) => a + rowTotal(s), 0);
    const travel = Number(travelCharge) || 0;
    const discount = Number(familyBulkDiscount) || 0;
    const grand = Math.max(0, subjectsTotal + travel - discount);
    const totalHands = subjects.reduce((a, s) => a + (Number(s.hands) || 0), 0);
    return { subjectsTotal, travel, discount, grand, totalHands };
  }, [subjects, travelCharge, familyBulkDiscount]);

  const setSubj = (i: number, patch: Partial<HennaSubject>) =>
    setSubjects((xs) => xs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addSubj = () => setSubjects((xs) => [...xs, emptySubject()]);
  const removeSubj = (i: number) => setSubjects((xs) => xs.filter((_, idx) => idx !== i));

  const onSave = async () => {
    setSaving(true);
    try {
      const payload: HennaScheduleData = {
        subjects: subjects.filter((s) => s.name.trim()).map((s) => ({
          ...s,
          name: s.name.trim(),
          appointmentTime: s.appointmentTime || undefined,
          startedAt: s.startedAt || undefined,
          finishedAt: s.finishedAt || undefined,
          notes: s.notes?.trim() || undefined,
        })),
        artistArrivalTime: artistArrivalTime || undefined,
        sessionStartTime: sessionStartTime || undefined,
        sessionEndTime: sessionEndTime || undefined,
        travelCharge: travelCharge.trim() === ""
          ? null
          : Math.max(0, parseInt(travelCharge, 10) || 0),
        outOfCity,
        familyBulkDiscount: familyBulkDiscount.trim() === ""
          ? null
          : Math.max(0, parseInt(familyBulkDiscount, 10) || 0),
        aftercareKitIncluded,
        notes: notes.trim() || undefined,
      };
      await FunctionSheetAPI.update(sheet.id, { hennaJson: payload });
      toast.success("Henna schedule saved");
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
          <Sparkles className="h-4 w-4 text-bridal-gold-dark" />
          Mehndi schedule
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Per-hand pricing (the way PK henna artists actually charge), per-subject
          timing, plus travel + bulk discount + aftercare kit.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live totals strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-md bg-muted/40 p-2 text-xs">
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Subjects</p>
            <p className="font-semibold tabular-nums">{subjects.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Total hands</p>
            <p className="font-semibold tabular-nums">{totals.totalHands}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Subtotal</p>
            <p className="font-semibold tabular-nums">{fmtPKR(totals.subjectsTotal)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Grand total</p>
            <p className="font-semibold tabular-nums text-bridal-gold-dark">{fmtPKR(totals.grand)}</p>
          </div>
        </div>

        {/* Day-of timing */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Artist arrival</Label>
            <Input type="time" value={artistArrivalTime} disabled={readOnly}
              onChange={(e) => setArtistArrivalTime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">First hand</Label>
            <Input type="time" value={sessionStartTime} disabled={readOnly}
              onChange={(e) => setSessionStartTime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Last finished</Label>
            <Input type="time" value={sessionEndTime} disabled={readOnly}
              onChange={(e) => setSessionEndTime(e.target.value)} />
          </div>
        </div>

        {/* Subject rows */}
        <div className="space-y-2">
          {subjects.map((s, i) => (
            <div key={s.id} className="rounded-md border p-2 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder='Subject (e.g. "Bride", "Sister Ayesha", "Guest 3")'
                  value={s.name}
                  disabled={readOnly}
                  onChange={(e) => setSubj(i, { name: e.target.value })}
                />
                <Select
                  value={s.complexity}
                  onValueChange={(c) => setSubj(i, { complexity: c as HennaComplexity })}
                  disabled={readOnly}
                >
                  <SelectTrigger className={`w-[170px] h-9 text-xs ${COMPLEXITY_TONE[s.complexity]}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(COMPLEXITY_LABEL) as HennaComplexity[]).map((c) => (
                      <SelectItem key={c} value={c} className={`text-xs ${COMPLEXITY_TONE[c]}`}>
                        {COMPLEXITY_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!readOnly && (
                  <Button type="button" variant="ghost" size="icon" className="shrink-0"
                    onClick={() => removeSubj(i)} aria-label="Remove subject">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Hands</Label>
                  <Input type="number" min={0} max={4} value={s.hands ?? ""} disabled={readOnly}
                    onChange={(e) => setSubj(i, { hands: numOrNull(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Rate / hand</Label>
                  <Input type="number" min={0} value={s.perHandRate ?? ""} disabled={readOnly}
                    placeholder="Rs"
                    onChange={(e) => setSubj(i, { perHandRate: numOrNull(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Row total</Label>
                  <div className="h-9 rounded-md border bg-muted/30 px-2 flex items-center text-xs font-semibold tabular-nums">
                    {fmtPKR(rowTotal(s))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Appt time</Label>
                  <Input type="time" value={s.appointmentTime || ""} disabled={readOnly}
                    onChange={(e) => setSubj(i, { appointmentTime: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Started</Label>
                  <Input type="time" value={s.startedAt || ""} disabled={readOnly}
                    onChange={(e) => setSubj(i, { startedAt: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Finished</Label>
                  <Input type="time" value={s.finishedAt || ""} disabled={readOnly}
                    onChange={(e) => setSubj(i, { finishedAt: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Notes</Label>
                  <Input placeholder="design ref, allergy, peanut-oil ok…"
                    value={s.notes || ""} disabled={readOnly}
                    onChange={(e) => setSubj(i, { notes: e.target.value })} />
                </div>
              </div>
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addSubj}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add subject
            </Button>
          )}
        </div>

        {/* Travel + bulk + aftercare */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Travel charge Rs</Label>
            <Input type="number" min={0} value={travelCharge} disabled={readOnly}
              onChange={(e) => setTravelCharge(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Family bulk discount Rs</Label>
            <Input type="number" min={0} value={familyBulkDiscount} disabled={readOnly}
              onChange={(e) => setFamilyBulkDiscount(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border p-2">
          <div>
            <p className="text-xs font-medium">Out-of-city booking</p>
            <p className="text-[11px] text-muted-foreground">e.g. Lhr artist → Isb venue. Travel charge above.</p>
          </div>
          <Switch checked={outOfCity} disabled={readOnly} onCheckedChange={setOutOfCity} />
        </div>
        <div className="flex items-center justify-between rounded-md border p-2">
          <div>
            <p className="text-xs font-medium">Aftercare kit included</p>
            <p className="text-[11px] text-muted-foreground">Sugar-lemon paste, oil, gloves — for the bride's stay-time.</p>
          </div>
          <Switch checked={aftercareKitIncluded} disabled={readOnly}
            onCheckedChange={setAftercareKitIncluded} />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Coordination notes</Label>
          <Textarea rows={2} value={notes} disabled={readOnly}
            placeholder="Bride's room, AC needed, designs to be approved by mother of bride, photographer slot etc."
            onChange={(e) => setNotes(e.target.value)} />
        </div>

        {!readOnly && (
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving} size="sm">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save henna schedule
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
