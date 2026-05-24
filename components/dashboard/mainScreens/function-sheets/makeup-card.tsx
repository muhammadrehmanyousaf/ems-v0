"use client";

/**
 * Makeup-artist day sheet (§16.9) — the makeup pillar.
 * PK makeup artists work bridal mornings (4-5am arrival is common for
 * morning baraat), cap at 1-2 brides per day (full bridal = 3-4 hours),
 * and price per-subject × package tier. Trial sessions are tracked
 * separately (sometimes included, often billable).
 *
 * Per-subject row: name + role (bride/family/guest) + package tier +
 * rate + appointment + actual start/finish + photo link.
 * Plus trial-sessions table, day-of arrival/start/end, early-start
 * surcharge with reason, travel + out-of-city, family discount,
 * kit-sanitized toggle (post-COVID norm), photo-consent for portfolio.
 *
 * Saves into FunctionSheet.makeupJson via the existing update endpoint.
 * Read-only on terminal sheets. Same proven pattern.
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
import { Brush, Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  FunctionSheetAPI,
  type FunctionSheet,
  type MakeupSubject,
  type MakeupSubjectRole,
  type MakeupPackage,
  type MakeupTrial,
  type MakeupTrialStatus,
  type MakeupData,
} from "@/lib/api/functionSheets";

const PKG_LABEL: Record<MakeupPackage, string> = {
  light: "Light",
  party: "Party",
  engagement: "Engagement",
  bridal_full: "Bridal · full glam",
  hd: "HD",
  airbrush: "Airbrush",
  signature: "Signature / Editorial",
};
const PKG_TONE: Record<MakeupPackage, string> = {
  light: "text-neutral-600",
  party: "text-blue-700",
  engagement: "text-purple-700",
  bridal_full: "text-rose-700",
  hd: "text-emerald-700",
  airbrush: "text-amber-700",
  signature: "text-bridal-gold-dark",
};
const ROLE_LABEL: Record<MakeupSubjectRole, string> = {
  bride: "Bride",
  family: "Family",
  guest: "Guest",
};
const ROLE_TONE: Record<MakeupSubjectRole, string> = {
  bride: "text-rose-700",
  family: "text-blue-700",
  guest: "text-neutral-600",
};
const TRIAL_STATUS_LABEL: Record<MakeupTrialStatus, string> = {
  planned: "Planned",
  done: "Done",
  cancelled: "Cancelled",
  no_show: "No-show",
};
const TRIAL_STATUS_TONE: Record<MakeupTrialStatus, string> = {
  planned: "text-blue-700",
  done: "text-emerald-700",
  cancelled: "text-neutral-600",
  no_show: "text-amber-700",
};

const fmtPKR = (n: number) =>
  n > 0 ? `Rs ${Math.round(n).toLocaleString("en-PK")}` : "Rs 0";

const newId = () => Math.random().toString(36).slice(2, 10);
const numOrNull = (v: string) =>
  v === "" ? null : Math.max(0, parseFloat(v) || 0);

const emptySubject = (role: MakeupSubjectRole = "bride"): MakeupSubject => ({
  id: newId(),
  name: role === "bride" ? "Bride" : "",
  role,
  pkg: role === "bride" ? "bridal_full" : "party",
  rate: null,
  appointmentTime: "",
  startedAt: "",
  finishedAt: "",
  photoLink: "",
  notes: "",
});
const emptyTrial = (): MakeupTrial => ({
  id: newId(), date: "", status: "planned", included: true,
  rate: null, photoLink: "", notes: "",
});

export default function MakeupCard({
  sheet, onSaved, readOnly = false,
}: { sheet: FunctionSheet; onSaved?: () => void; readOnly?: boolean }) {
  const [subjects, setSubjects] = useState<MakeupSubject[]>([emptySubject("bride")]);
  const [trials, setTrials] = useState<MakeupTrial[]>([]);
  const [artistArrivalTime, setArtistArrivalTime] = useState("");
  const [firstSubjectStartTime, setFirstSubjectStartTime] = useState("");
  const [lastSubjectFinishTime, setLastSubjectFinishTime] = useState("");
  const [earlyStartSurcharge, setEarlyStartSurcharge] = useState("");
  const [earlyStartReason, setEarlyStartReason] = useState("");
  const [travelCharge, setTravelCharge] = useState("");
  const [outOfCity, setOutOfCity] = useState(false);
  const [familyPackageDiscount, setFamilyPackageDiscount] = useState("");
  const [kitFreshlySanitized, setKitFreshlySanitized] = useState(false);
  const [photoConsentForPortfolio, setPhotoConsentForPortfolio] = useState(false);
  const [bridalCapPerDay, setBridalCapPerDay] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const m = sheet.makeupJson || {};
    setSubjects(m.subjects && m.subjects.length ? m.subjects : [emptySubject("bride")]);
    setTrials(m.trials || []);
    setArtistArrivalTime(m.artistArrivalTime || "");
    setFirstSubjectStartTime(m.firstSubjectStartTime || "");
    setLastSubjectFinishTime(m.lastSubjectFinishTime || "");
    setEarlyStartSurcharge(m.earlyStartSurcharge != null ? String(m.earlyStartSurcharge) : "");
    setEarlyStartReason(m.earlyStartReason || "");
    setTravelCharge(m.travelCharge != null ? String(m.travelCharge) : "");
    setOutOfCity(!!m.outOfCity);
    setFamilyPackageDiscount(m.familyPackageDiscount != null ? String(m.familyPackageDiscount) : "");
    setKitFreshlySanitized(!!m.kitFreshlySanitized);
    setPhotoConsentForPortfolio(!!m.photoConsentForPortfolio);
    setBridalCapPerDay(m.bridalCapPerDay != null ? String(m.bridalCapPerDay) : "");
    setNotes(m.notes || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.id, sheet.updatedAt]);

  const totals = useMemo(() => {
    const subjectsTotal = subjects.reduce((a, s) => a + (Number(s.rate) || 0), 0);
    const trialsBillable = trials
      .filter((t) => !t.included && t.status !== "cancelled")
      .reduce((a, t) => a + (Number(t.rate) || 0), 0);
    const early = Number(earlyStartSurcharge) || 0;
    const travel = Number(travelCharge) || 0;
    const discount = Number(familyPackageDiscount) || 0;
    const grand = Math.max(0, subjectsTotal + trialsBillable + early + travel - discount);
    const brideCount = subjects.filter((s) => s.role === "bride").length;
    const cap = Number(bridalCapPerDay) || 0;
    const overCap = cap > 0 && brideCount > cap;
    return {
      subjectsTotal, trialsBillable, early, travel, discount, grand,
      brideCount, cap, overCap,
      totalSubjects: subjects.length,
      trialCount: trials.length,
    };
  }, [subjects, trials, earlyStartSurcharge, travelCharge, familyPackageDiscount, bridalCapPerDay]);

  const setSubj = (i: number, patch: Partial<MakeupSubject>) =>
    setSubjects((xs) => xs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addSubj = () => setSubjects((xs) => [...xs, emptySubject("family")]);
  const removeSubj = (i: number) => setSubjects((xs) => xs.filter((_, idx) => idx !== i));

  const setTrial = (i: number, patch: Partial<MakeupTrial>) =>
    setTrials((xs) => xs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addTrial = () => setTrials((xs) => [...xs, emptyTrial()]);
  const removeTrial = (i: number) => setTrials((xs) => xs.filter((_, idx) => idx !== i));

  const onSave = async () => {
    setSaving(true);
    try {
      const payload: MakeupData = {
        subjects: subjects.filter((s) => s.name.trim()).map((s) => ({
          ...s,
          name: s.name.trim(),
          appointmentTime: s.appointmentTime || undefined,
          startedAt: s.startedAt || undefined,
          finishedAt: s.finishedAt || undefined,
          photoLink: s.photoLink?.trim() || undefined,
          notes: s.notes?.trim() || undefined,
        })),
        trials: trials.map((t) => ({
          ...t,
          date: t.date || undefined,
          photoLink: t.photoLink?.trim() || undefined,
          notes: t.notes?.trim() || undefined,
        })),
        artistArrivalTime: artistArrivalTime || undefined,
        firstSubjectStartTime: firstSubjectStartTime || undefined,
        lastSubjectFinishTime: lastSubjectFinishTime || undefined,
        earlyStartSurcharge: earlyStartSurcharge.trim() === ""
          ? null
          : Math.max(0, parseInt(earlyStartSurcharge, 10) || 0),
        earlyStartReason: earlyStartReason.trim() || undefined,
        travelCharge: travelCharge.trim() === ""
          ? null
          : Math.max(0, parseInt(travelCharge, 10) || 0),
        outOfCity,
        familyPackageDiscount: familyPackageDiscount.trim() === ""
          ? null
          : Math.max(0, parseInt(familyPackageDiscount, 10) || 0),
        kitFreshlySanitized,
        photoConsentForPortfolio,
        bridalCapPerDay: bridalCapPerDay.trim() === ""
          ? null
          : Math.max(0, parseInt(bridalCapPerDay, 10) || 0),
        notes: notes.trim() || undefined,
      };
      await FunctionSheetAPI.update(sheet.id, { makeupJson: payload });
      toast.success("Makeup sheet saved");
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
          <Brush className="h-4 w-4 text-bridal-gold-dark" />
          Makeup day sheet
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Per-subject × package pricing, trial sessions, early-start surcharge,
          bridal-cap warning, photo-consent for portfolio.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live totals strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-md bg-muted/40 p-2 text-xs">
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Subjects</p>
            <p className="font-semibold tabular-nums">
              {totals.totalSubjects}
              <span className={`text-[10px] ml-1 ${totals.overCap ? "text-amber-700" : "text-muted-foreground"}`}>
                · {totals.brideCount} bride{totals.brideCount === 1 ? "" : "s"}
                {totals.cap > 0 && ` (cap ${totals.cap})`}
              </span>
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Trials</p>
            <p className="font-semibold tabular-nums">{totals.trialCount}</p>
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

        {/* Bridal-cap warning */}
        {totals.overCap && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs">
            <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Over bridal cap</p>
              <p className="text-amber-800">
                This booking has {totals.brideCount} bride slots but your daily cap is {totals.cap}.
                A full bridal takes 3-4 hours — double-check you can physically deliver.
              </p>
            </div>
          </div>
        )}

        {/* Day-of timing */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Artist arrival</Label>
            <Input type="time" value={artistArrivalTime} disabled={readOnly}
              onChange={(e) => setArtistArrivalTime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">First subject</Label>
            <Input type="time" value={firstSubjectStartTime} disabled={readOnly}
              onChange={(e) => setFirstSubjectStartTime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Last finished</Label>
            <Input type="time" value={lastSubjectFinishTime} disabled={readOnly}
              onChange={(e) => setLastSubjectFinishTime(e.target.value)} />
          </div>
        </div>

        {/* Subject rows */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Subjects
          </div>
          {subjects.map((s, i) => (
            <div key={s.id} className="rounded-md border p-2 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder='Subject (e.g. "Bride", "Sister Ayesha", "Aunty Saima")'
                  value={s.name}
                  disabled={readOnly}
                  onChange={(e) => setSubj(i, { name: e.target.value })}
                />
                <Select
                  value={s.role}
                  onValueChange={(r) => setSubj(i, { role: r as MakeupSubjectRole })}
                  disabled={readOnly}
                >
                  <SelectTrigger className={`w-[100px] h-9 text-xs ${ROLE_TONE[s.role]}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABEL) as MakeupSubjectRole[]).map((r) => (
                      <SelectItem key={r} value={r} className={`text-xs ${ROLE_TONE[r]}`}>
                        {ROLE_LABEL[r]}
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
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Package</Label>
                  <Select
                    value={s.pkg}
                    onValueChange={(p) => setSubj(i, { pkg: p as MakeupPackage })}
                    disabled={readOnly}
                  >
                    <SelectTrigger className={`h-9 text-xs ${PKG_TONE[s.pkg]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PKG_LABEL) as MakeupPackage[]).map((p) => (
                        <SelectItem key={p} value={p} className={`text-xs ${PKG_TONE[p]}`}>
                          {PKG_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Rate Rs</Label>
                  <Input type="number" min={0} value={s.rate ?? ""} disabled={readOnly}
                    onChange={(e) => setSubj(i, { rate: numOrNull(e.target.value) })} />
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
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Photo link</Label>
                  <Input placeholder="Final-look shot URL (Drive / WhatsApp)"
                    value={s.photoLink || ""} disabled={readOnly}
                    onChange={(e) => setSubj(i, { photoLink: e.target.value })} />
                </div>
              </div>
              <Input
                placeholder="Notes (skin type, allergy, jewellery placement, hairstyle ref…)"
                value={s.notes || ""} disabled={readOnly}
                onChange={(e) => setSubj(i, { notes: e.target.value })}
              />
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addSubj}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add subject
            </Button>
          )}
        </div>

        {/* Trial sessions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Trial sessions
              {totals.trialsBillable > 0 && (
                <span className="text-muted-foreground"> · billable {fmtPKR(totals.trialsBillable)}</span>
              )}
            </div>
            {!readOnly && (
              <Button type="button" variant="ghost" size="sm" className="h-7" onClick={addTrial}>
                <Plus className="mr-1 h-3 w-3" /> Trial
              </Button>
            )}
          </div>
          {trials.length === 0 && (
            <p className="text-[11px] text-muted-foreground italic">No trials scheduled.</p>
          )}
          {trials.map((t, i) => (
            <div key={t.id} className="rounded-md border p-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <Input type="date" className="w-[140px] h-8 text-xs"
                  value={t.date || ""} disabled={readOnly}
                  onChange={(e) => setTrial(i, { date: e.target.value })} />
                <Select
                  value={t.status}
                  onValueChange={(s) => setTrial(i, { status: s as MakeupTrialStatus })}
                  disabled={readOnly}
                >
                  <SelectTrigger className={`w-[130px] h-8 text-xs ${TRIAL_STATUS_TONE[t.status]}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TRIAL_STATUS_LABEL) as MakeupTrialStatus[]).map((s) => (
                      <SelectItem key={s} value={s} className={`text-xs ${TRIAL_STATUS_TONE[s]}`}>
                        {TRIAL_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-1.5 text-xs ml-auto">
                  <Switch checked={t.included} disabled={readOnly}
                    onCheckedChange={(v) => setTrial(i, { included: v })} />
                  Included
                </label>
                {!t.included && (
                  <Input type="number" min={0} className="w-[100px] h-8 text-xs"
                    placeholder="Rate Rs" value={t.rate ?? ""} disabled={readOnly}
                    onChange={(e) => setTrial(i, { rate: numOrNull(e.target.value) })} />
                )}
                {!readOnly && (
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => removeTrial(i)} aria-label="Remove trial">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <Input className="h-8 text-xs" placeholder="Photo link"
                value={t.photoLink || ""} disabled={readOnly}
                onChange={(e) => setTrial(i, { photoLink: e.target.value })} />
              <Input className="h-8 text-xs" placeholder="Notes (look approved, what to change, etc.)"
                value={t.notes || ""} disabled={readOnly}
                onChange={(e) => setTrial(i, { notes: e.target.value })} />
            </div>
          ))}
        </div>

        {/* Early start + travel + discount + cap */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Early-start surcharge Rs</Label>
            <Input type="number" min={0} value={earlyStartSurcharge} disabled={readOnly}
              placeholder="Pre-6am arrival"
              onChange={(e) => setEarlyStartSurcharge(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Reason</Label>
            <Input value={earlyStartReason} disabled={readOnly}
              placeholder='e.g. "Morning baraat 7am"'
              onChange={(e) => setEarlyStartReason(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Travel charge Rs</Label>
            <Input type="number" min={0} value={travelCharge} disabled={readOnly}
              onChange={(e) => setTravelCharge(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Family discount Rs</Label>
            <Input type="number" min={0} value={familyPackageDiscount} disabled={readOnly}
              onChange={(e) => setFamilyPackageDiscount(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Bridal cap / day (contract)</Label>
          <Input type="number" min={0} max={5} value={bridalCapPerDay} disabled={readOnly}
            placeholder="Usually 1 or 2"
            onChange={(e) => setBridalCapPerDay(e.target.value)} />
        </div>

        <div className="flex items-center justify-between rounded-md border p-2">
          <div>
            <p className="text-xs font-medium">Out-of-city booking</p>
            <p className="text-[11px] text-muted-foreground">Lhr-artist → Isb-venue etc. Travel charge above.</p>
          </div>
          <Switch checked={outOfCity} disabled={readOnly} onCheckedChange={setOutOfCity} />
        </div>
        <div className="flex items-center justify-between rounded-md border p-2">
          <div>
            <p className="text-xs font-medium">Kit freshly sanitized</p>
            <p className="text-[11px] text-muted-foreground">Post-COVID norm — vendor's hygiene confirmation.</p>
          </div>
          <Switch checked={kitFreshlySanitized} disabled={readOnly}
            onCheckedChange={setKitFreshlySanitized} />
        </div>
        <div className="flex items-center justify-between rounded-md border p-2">
          <div>
            <p className="text-xs font-medium">Photo consent for portfolio</p>
            <p className="text-[11px] text-muted-foreground">Bride allows the vendor to share final shots on Insta / website.</p>
          </div>
          <Switch checked={photoConsentForPortfolio} disabled={readOnly}
            onCheckedChange={setPhotoConsentForPortfolio} />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Coordination notes</Label>
          <Textarea rows={2} value={notes} disabled={readOnly}
            placeholder="Bride's room, AC needed, jewellery handover, mehndi-day vs barat-day looks, etc."
            onChange={(e) => setNotes(e.target.value)} />
        </div>

        {!readOnly && (
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving} size="sm">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save makeup sheet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
