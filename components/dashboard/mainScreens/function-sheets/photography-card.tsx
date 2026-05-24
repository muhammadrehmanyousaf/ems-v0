"use client";

/**
 * Photography shoot-day sheet (§16.10) — the photography pillar.
 * Goes beyond the generic Deliverables card to capture the SHOOT-DAY
 * operations the way PK wedding photographers actually run them.
 *
 * Five sub-sections:
 *   1. Coverage days (mehndi/nikah/baraat/walima) with crew, call/wrap,
 *      contracted hours + overtime rate;
 *   2. Crew roster (main shooter / 2nd shooter / cinematographer /
 *      drone / assistant / album designer / editor) — referenced by day;
 *   3. Categorised shot list (couple / family / ceremony / details /
 *      candid / venue / other) with priority (must/nice/optional) +
 *      status (planned/shot/skipped); live "must-have not shot" warning;
 *   4. Family-group roster (THE thing bride's mother cares about — 20-40
 *      specific groupings; checkbox to mark shot);
 *   5. Day-of policy: drone scope + permission, RAW handover, edited-
 *      photo target, highlight + full-film target minutes, backup
 *      strategy, social media teaser ETA.
 *
 * Saves into FunctionSheet.photographyJson via the existing update
 * endpoint. Read-only on terminal sheets. Same proven pattern.
 */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Camera, Plus, Trash2, Loader2, AlertTriangle, Users, Calendar, ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import {
  FunctionSheetAPI,
  type FunctionSheet,
  type PhotographyData,
  type PhotographyDay,
  type PhotographyCrew,
  type PhotographyCrewRole,
  type PhotographyShot,
  type PhotoShotCategory,
  type PhotoShotPriority,
  type PhotoShotStatus,
  type PhotographyFamilyGroup,
  type RawHandoverPolicy,
} from "@/lib/api/functionSheets";

const CREW_LABEL: Record<PhotographyCrewRole, string> = {
  main_shooter: "Main shooter",
  second_shooter: "2nd shooter",
  cinematographer: "Cinematographer",
  drone: "Drone operator",
  assistant: "Assistant",
  album_designer: "Album designer",
  editor: "Editor",
};
const CAT_LABEL: Record<PhotoShotCategory, string> = {
  couple: "Couple",
  family: "Family",
  ceremony: "Ceremony",
  details: "Details",
  candid: "Candid",
  venue: "Venue",
  other: "Other",
};
const PRIORITY_LABEL: Record<PhotoShotPriority, string> = {
  must: "Must",
  nice: "Nice",
  optional: "Optional",
};
const PRIORITY_TONE: Record<PhotoShotPriority, string> = {
  must: "text-rose-700",
  nice: "text-blue-700",
  optional: "text-neutral-600",
};
const STATUS_LABEL: Record<PhotoShotStatus, string> = {
  planned: "Planned",
  shot: "Shot",
  skipped: "Skipped",
};
const STATUS_TONE: Record<PhotoShotStatus, string> = {
  planned: "text-neutral-600",
  shot: "text-emerald-700",
  skipped: "text-amber-700",
};
const RAW_LABEL: Record<RawHandoverPolicy, string> = {
  no: "No RAW handover",
  after_album_approval: "After album approval",
  yes_with_extra_fee: "Yes — extra fee",
  yes_included: "Yes — included",
};

const fmtPKR = (n: number) =>
  n > 0 ? `Rs ${Math.round(n).toLocaleString("en-PK")}` : "Rs 0";

const newId = () => Math.random().toString(36).slice(2, 10);
const numOrNull = (v: string) =>
  v === "" ? null : Math.max(0, parseFloat(v) || 0);

const emptyDay = (label = ""): PhotographyDay => ({
  id: newId(), label, date: "", venue: "",
  callTime: "", wrapTime: "",
  contractedHours: null, overtimeRatePerHour: null,
  crewIds: [], notes: "",
});
const emptyCrew = (role: PhotographyCrewRole = "main_shooter"): PhotographyCrew => ({
  id: newId(), name: "", role, phone: "", notes: "",
});
const emptyShot = (cat: PhotoShotCategory = "couple"): PhotographyShot => ({
  id: newId(), label: "", category: cat, priority: "must", status: "planned", notes: "",
});
const emptyFamilyGroup = (): PhotographyFamilyGroup => ({
  id: newId(), label: "", people: "", side: "both", shot: false, notes: "",
});

// Common starter shots — PK wedding standard set
const STARTER_SHOTS: Array<Omit<PhotographyShot, "id">> = [
  { label: "Bride solo portrait", category: "couple", priority: "must", status: "planned" },
  { label: "Groom solo portrait", category: "couple", priority: "must", status: "planned" },
  { label: "First look", category: "couple", priority: "must", status: "planned" },
  { label: "Stage wide", category: "ceremony", priority: "must", status: "planned" },
  { label: "Ring exchange", category: "ceremony", priority: "must", status: "planned" },
  { label: "Nikah signing", category: "ceremony", priority: "must", status: "planned" },
  { label: "Rukhsati", category: "ceremony", priority: "must", status: "planned" },
  { label: "Bridal jewellery details", category: "details", priority: "nice", status: "planned" },
  { label: "Mehndi hands close-up", category: "details", priority: "nice", status: "planned" },
];

const STARTER_FAMILY_GROUPS: Array<Omit<PhotographyFamilyGroup, "id">> = [
  { label: "Bride + parents", side: "bride", shot: false },
  { label: "Groom + parents", side: "groom", shot: false },
  { label: "Bride + groom + both parents", side: "both", shot: false },
  { label: "Bride immediate family", side: "bride", shot: false },
  { label: "Groom immediate family", side: "groom", shot: false },
  { label: "Both extended families combined", side: "both", shot: false },
];

export default function PhotographyCard({
  sheet, onSaved, readOnly = false,
}: { sheet: FunctionSheet; onSaved?: () => void; readOnly?: boolean }) {
  const [days, setDays] = useState<PhotographyDay[]>([emptyDay("Baraat")]);
  const [crew, setCrew] = useState<PhotographyCrew[]>([emptyCrew("main_shooter")]);
  const [shots, setShots] = useState<PhotographyShot[]>([]);
  const [familyGroups, setFamilyGroups] = useState<PhotographyFamilyGroup[]>([]);
  const [droneIncluded, setDroneIncluded] = useState(false);
  const [dronePermissionStatus, setDronePermissionStatus] =
    useState<"not_needed" | "pending" | "granted" | "refused">("not_needed");
  const [droneNotes, setDroneNotes] = useState("");
  const [highlightReelTargetMinutes, setHighlightReelTargetMinutes] = useState("");
  const [fullFilmTargetMinutes, setFullFilmTargetMinutes] = useState("");
  const [editedPhotoCountTarget, setEditedPhotoCountTarget] = useState("");
  const [rawHandover, setRawHandover] = useState<RawHandoverPolicy>("no");
  const [rawHandoverFee, setRawHandoverFee] = useState("");
  const [backupStrategy, setBackupStrategy] = useState("");
  const [socialMediaTeaserTargetDate, setSocialMediaTeaserTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = sheet.photographyJson || {};
    setDays(p.days && p.days.length ? p.days : [emptyDay("Baraat")]);
    setCrew(p.crew && p.crew.length ? p.crew : [emptyCrew("main_shooter")]);
    setShots(p.shots || []);
    setFamilyGroups(p.familyGroups || []);
    setDroneIncluded(!!p.droneIncluded);
    setDronePermissionStatus(p.dronePermissionStatus || "not_needed");
    setDroneNotes(p.droneNotes || "");
    setHighlightReelTargetMinutes(
      p.highlightReelTargetMinutes != null ? String(p.highlightReelTargetMinutes) : ""
    );
    setFullFilmTargetMinutes(
      p.fullFilmTargetMinutes != null ? String(p.fullFilmTargetMinutes) : ""
    );
    setEditedPhotoCountTarget(
      p.editedPhotoCountTarget != null ? String(p.editedPhotoCountTarget) : ""
    );
    setRawHandover(p.rawHandover || "no");
    setRawHandoverFee(p.rawHandoverFee != null ? String(p.rawHandoverFee) : "");
    setBackupStrategy(p.backupStrategy || "");
    setSocialMediaTeaserTargetDate(p.socialMediaTeaserTargetDate || "");
    setNotes(p.notes || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.id, sheet.updatedAt]);

  const totals = useMemo(() => {
    const totalContracted = days.reduce((a, d) => a + (Number(d.contractedHours) || 0), 0);
    const mustShots = shots.filter((s) => s.priority === "must");
    const mustNotShot = mustShots.filter((s) => s.status === "planned").length;
    const shotsShot = shots.filter((s) => s.status === "shot").length;
    const familyShot = familyGroups.filter((g) => g.shot).length;
    return {
      totalDays: days.length,
      totalContracted,
      totalCrew: crew.length,
      totalShots: shots.length,
      shotsShot,
      mustNotShot,
      totalFamily: familyGroups.length,
      familyShot,
    };
  }, [days, crew, shots, familyGroups]);

  // Days
  const setDay = (i: number, patch: Partial<PhotographyDay>) =>
    setDays((xs) => xs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addDay = () => setDays((xs) => [...xs, emptyDay()]);
  const removeDay = (i: number) => setDays((xs) => xs.filter((_, idx) => idx !== i));
  const toggleCrewOnDay = (di: number, crewId: string) => {
    const day = days[di];
    const currentIds = day.crewIds || [];
    const has = currentIds.includes(crewId);
    setDay(di, { crewIds: has ? currentIds.filter((x) => x !== crewId) : [...currentIds, crewId] });
  };

  // Crew
  const setCrewRow = (i: number, patch: Partial<PhotographyCrew>) =>
    setCrew((xs) => xs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addCrew = () => setCrew((xs) => [...xs, emptyCrew()]);
  const removeCrew = (i: number) => {
    const removed = crew[i];
    setCrew((xs) => xs.filter((_, idx) => idx !== i));
    // also strip from any day's crewIds
    setDays((ds) =>
      ds.map((d) => ({ ...d, crewIds: (d.crewIds || []).filter((id) => id !== removed.id) }))
    );
  };

  // Shots
  const setShot = (i: number, patch: Partial<PhotographyShot>) =>
    setShots((xs) => xs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addShot = () => setShots((xs) => [...xs, emptyShot()]);
  const removeShot = (i: number) => setShots((xs) => xs.filter((_, idx) => idx !== i));
  const seedStarterShots = () =>
    setShots((xs) => [...xs, ...STARTER_SHOTS.map((s) => ({ ...s, id: newId() }))]);

  // Family groups
  const setGroup = (i: number, patch: Partial<PhotographyFamilyGroup>) =>
    setFamilyGroups((xs) => xs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addGroup = () => setFamilyGroups((xs) => [...xs, emptyFamilyGroup()]);
  const removeGroup = (i: number) => setFamilyGroups((xs) => xs.filter((_, idx) => idx !== i));
  const seedStarterGroups = () =>
    setFamilyGroups((xs) => [...xs, ...STARTER_FAMILY_GROUPS.map((g) => ({ ...g, id: newId() }))]);

  const crewById = useMemo(() => {
    const m: Record<string, PhotographyCrew> = {};
    for (const c of crew) m[c.id] = c;
    return m;
  }, [crew]);

  const onSave = async () => {
    setSaving(true);
    try {
      const payload: PhotographyData = {
        days: days.filter((d) => d.label.trim() || d.date).map((d) => ({
          ...d,
          label: d.label?.trim() || "Day",
          venue: d.venue?.trim() || undefined,
          callTime: d.callTime || undefined,
          wrapTime: d.wrapTime || undefined,
          notes: d.notes?.trim() || undefined,
        })),
        crew: crew.filter((c) => c.name.trim()).map((c) => ({
          ...c,
          name: c.name.trim(),
          phone: c.phone?.trim() || undefined,
          notes: c.notes?.trim() || undefined,
        })),
        shots: shots.filter((s) => s.label.trim()).map((s) => ({
          ...s,
          label: s.label.trim(),
          notes: s.notes?.trim() || undefined,
        })),
        familyGroups: familyGroups.filter((g) => g.label.trim()).map((g) => ({
          ...g,
          label: g.label.trim(),
          people: g.people?.trim() || undefined,
          notes: g.notes?.trim() || undefined,
        })),
        droneIncluded,
        dronePermissionStatus,
        droneNotes: droneNotes.trim() || undefined,
        highlightReelTargetMinutes: highlightReelTargetMinutes.trim() === ""
          ? null : Math.max(0, parseInt(highlightReelTargetMinutes, 10) || 0),
        fullFilmTargetMinutes: fullFilmTargetMinutes.trim() === ""
          ? null : Math.max(0, parseInt(fullFilmTargetMinutes, 10) || 0),
        editedPhotoCountTarget: editedPhotoCountTarget.trim() === ""
          ? null : Math.max(0, parseInt(editedPhotoCountTarget, 10) || 0),
        rawHandover,
        rawHandoverFee: rawHandoverFee.trim() === ""
          ? null : Math.max(0, parseInt(rawHandoverFee, 10) || 0),
        backupStrategy: backupStrategy.trim() || undefined,
        socialMediaTeaserTargetDate: socialMediaTeaserTargetDate || undefined,
        notes: notes.trim() || undefined,
      };
      await FunctionSheetAPI.update(sheet.id, { photographyJson: payload });
      toast.success("Photography sheet saved");
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card data-pillar="photography-shoot">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Camera className="h-4 w-4 text-bridal-gold-dark" />
          Photography shoot sheet
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Days &amp; crew · shot list · family groups · drone + RAW policy + targets.
          The thing that stops &quot;mama&apos;s sister side wasn&apos;t photographed&quot; calls.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live totals strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-md bg-muted/40 p-2 text-xs">
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Days · hrs</p>
            <p className="font-semibold tabular-nums">
              {totals.totalDays} · {totals.totalContracted}h
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Crew</p>
            <p className="font-semibold tabular-nums">{totals.totalCrew}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Shots</p>
            <p className="font-semibold tabular-nums">
              {totals.shotsShot}<span className="text-muted-foreground"> / {totals.totalShots}</span>
              {totals.mustNotShot > 0 && (
                <span className="ml-1 text-amber-700">· {totals.mustNotShot} must</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Family groups</p>
            <p className="font-semibold tabular-nums">
              {totals.familyShot}<span className="text-muted-foreground"> / {totals.totalFamily}</span>
            </p>
          </div>
        </div>

        {/* Must-have warning */}
        {totals.mustNotShot > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs">
            <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">
                {totals.mustNotShot} must-have shot{totals.mustNotShot === 1 ? "" : "s"} still planned
              </p>
              <p className="text-amber-800">
                Mark each as Shot once captured. Wedding-day shots can&apos;t be redone.
              </p>
            </div>
          </div>
        )}

        {/* ── DAYS ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Coverage days
            </div>
          </div>
          {days.map((d, i) => (
            <div key={d.id} className="rounded-md border p-2 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder='Day label (e.g. "Mehndi", "Baraat", "Walima")'
                  value={d.label}
                  disabled={readOnly}
                  onChange={(e) => setDay(i, { label: e.target.value })}
                />
                <Input type="date" className="w-[140px]" value={d.date || ""} disabled={readOnly}
                  onChange={(e) => setDay(i, { date: e.target.value })} />
                {!readOnly && (
                  <Button type="button" variant="ghost" size="icon" className="shrink-0"
                    onClick={() => removeDay(i)} aria-label="Remove day">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <Input placeholder="Venue (hall name / address)" value={d.venue || ""}
                disabled={readOnly}
                onChange={(e) => setDay(i, { venue: e.target.value })} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Call time</Label>
                  <Input type="time" value={d.callTime || ""} disabled={readOnly}
                    onChange={(e) => setDay(i, { callTime: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Wrap time</Label>
                  <Input type="time" value={d.wrapTime || ""} disabled={readOnly}
                    onChange={(e) => setDay(i, { wrapTime: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Contracted hrs</Label>
                  <Input type="number" min={0} value={d.contractedHours ?? ""} disabled={readOnly}
                    onChange={(e) => setDay(i, { contractedHours: numOrNull(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">OT Rs/hr</Label>
                  <Input type="number" min={0} value={d.overtimeRatePerHour ?? ""} disabled={readOnly}
                    onChange={(e) => setDay(i, { overtimeRatePerHour: numOrNull(e.target.value) })} />
                </div>
              </div>
              {crew.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Crew on this day</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {crew.filter((c) => c.name.trim()).map((c) => {
                      const on = (d.crewIds || []).includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={readOnly}
                          onClick={() => toggleCrewOnDay(i, c.id)}
                          className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${
                            on
                              ? "bg-bridal-gold-dark/10 border-bridal-gold-dark text-bridal-gold-dark"
                              : "bg-background border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground"
                          } ${readOnly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {c.name} · {CREW_LABEL[c.role]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <Input placeholder="Day notes (gear list, parking, vendor coordination…)"
                value={d.notes || ""} disabled={readOnly}
                onChange={(e) => setDay(i, { notes: e.target.value })} />
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addDay}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add day
            </Button>
          )}
        </div>

        {/* ── CREW ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Crew roster
            </div>
          </div>
          {crew.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2">
              <Input className="flex-1" placeholder="Crew name" value={c.name}
                disabled={readOnly}
                onChange={(e) => setCrewRow(i, { name: e.target.value })} />
              <Select
                value={c.role}
                onValueChange={(r) => setCrewRow(i, { role: r as PhotographyCrewRole })}
                disabled={readOnly}
              >
                <SelectTrigger className="w-[170px] h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CREW_LABEL) as PhotographyCrewRole[]).map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">{CREW_LABEL[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input className="w-[140px]" placeholder="03xx-xxxxxxx" value={c.phone || ""}
                disabled={readOnly}
                onChange={(e) => setCrewRow(i, { phone: e.target.value })} />
              {!readOnly && (
                <Button type="button" variant="ghost" size="icon" className="shrink-0"
                  onClick={() => removeCrew(i)} aria-label="Remove crew">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addCrew}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add crew member
            </Button>
          )}
        </div>

        {/* ── SHOT LIST ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Shot list
              </div>
            </div>
            {!readOnly && shots.length === 0 && (
              <Button type="button" variant="ghost" size="sm" className="h-7"
                onClick={seedStarterShots}>
                Seed PK standard
              </Button>
            )}
          </div>
          {shots.length === 0 && (
            <p className="text-[11px] text-muted-foreground italic">
              No shots yet. Seed the PK standard set, or add custom shots below.
            </p>
          )}
          {shots.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <Select
                value={s.status}
                onValueChange={(st) => setShot(i, { status: st as PhotoShotStatus })}
                disabled={readOnly}
              >
                <SelectTrigger className={`w-[110px] h-8 text-xs ${STATUS_TONE[s.status]}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as PhotoShotStatus[]).map((st) => (
                    <SelectItem key={st} value={st} className={`text-xs ${STATUS_TONE[st]}`}>
                      {STATUS_LABEL[st]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input className="flex-1 h-8 text-xs" placeholder="Shot label"
                value={s.label} disabled={readOnly}
                onChange={(e) => setShot(i, { label: e.target.value })} />
              <Select
                value={s.category}
                onValueChange={(c) => setShot(i, { category: c as PhotoShotCategory })}
                disabled={readOnly}
              >
                <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CAT_LABEL) as PhotoShotCategory[]).map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">{CAT_LABEL[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={s.priority}
                onValueChange={(p) => setShot(i, { priority: p as PhotoShotPriority })}
                disabled={readOnly}
              >
                <SelectTrigger className={`w-[90px] h-8 text-xs ${PRIORITY_TONE[s.priority]}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABEL) as PhotoShotPriority[]).map((p) => (
                    <SelectItem key={p} value={p} className={`text-xs ${PRIORITY_TONE[p]}`}>
                      {PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!readOnly && (
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => removeShot(i)} aria-label="Remove shot">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addShot}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add shot
            </Button>
          )}
        </div>

        {/* ── FAMILY GROUPS ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Family-group list <span className="text-muted-foreground normal-case font-normal">(mom dictates these)</span>
            </div>
            {!readOnly && familyGroups.length === 0 && (
              <Button type="button" variant="ghost" size="sm" className="h-7"
                onClick={seedStarterGroups}>
                Seed starter
              </Button>
            )}
          </div>
          {familyGroups.length === 0 && (
            <p className="text-[11px] text-muted-foreground italic">
              No family groupings yet. Seed the starter (6 universal groupings) or add custom.
            </p>
          )}
          {familyGroups.map((g, i) => (
            <div key={g.id} className="flex items-center gap-2 rounded-md border p-2">
              <Checkbox checked={g.shot} disabled={readOnly}
                onCheckedChange={(v) => setGroup(i, { shot: !!v })} />
              <div className="flex-1 space-y-1">
                <Input className="h-8 text-xs" placeholder='Grouping (e.g. "Bride + parents")'
                  value={g.label} disabled={readOnly}
                  onChange={(e) => setGroup(i, { label: e.target.value })} />
                <Input className="h-8 text-xs" placeholder="People (Ammi, Abba, Mamoo Tariq…)"
                  value={g.people || ""} disabled={readOnly}
                  onChange={(e) => setGroup(i, { people: e.target.value })} />
              </div>
              <Select
                value={g.side || "both"}
                onValueChange={(s) => setGroup(i, { side: s as "bride" | "groom" | "both" })}
                disabled={readOnly}
              >
                <SelectTrigger className="w-[90px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bride" className="text-xs">Bride</SelectItem>
                  <SelectItem value="groom" className="text-xs">Groom</SelectItem>
                  <SelectItem value="both" className="text-xs">Both</SelectItem>
                </SelectContent>
              </Select>
              {!readOnly && (
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => removeGroup(i)} aria-label="Remove group">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addGroup}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add family group
            </Button>
          )}
        </div>

        {/* ── POLICY / DELIVERABLES TARGETS ── */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Policy &amp; deliverable targets
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Edited photos target</Label>
              <Input type="number" min={0} value={editedPhotoCountTarget} disabled={readOnly}
                placeholder="e.g. 600"
                onChange={(e) => setEditedPhotoCountTarget(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Highlight reel min</Label>
              <Input type="number" min={0} value={highlightReelTargetMinutes} disabled={readOnly}
                placeholder="e.g. 3"
                onChange={(e) => setHighlightReelTargetMinutes(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Full film min</Label>
              <Input type="number" min={0} value={fullFilmTargetMinutes} disabled={readOnly}
                placeholder="e.g. 30"
                onChange={(e) => setFullFilmTargetMinutes(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">RAW handover</Label>
              <Select value={rawHandover}
                onValueChange={(r) => setRawHandover(r as RawHandoverPolicy)}
                disabled={readOnly}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(RAW_LABEL) as RawHandoverPolicy[]).map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">{RAW_LABEL[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">RAW fee Rs</Label>
              <Input type="number" min={0} value={rawHandoverFee}
                disabled={readOnly || rawHandover !== "yes_with_extra_fee"}
                onChange={(e) => setRawHandoverFee(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-2">
            <div>
              <p className="text-xs font-medium">Drone included</p>
              <p className="text-[11px] text-muted-foreground">
                Many PK venues require permission (CAA NOC / venue rules).
              </p>
            </div>
            <Switch checked={droneIncluded} disabled={readOnly}
              onCheckedChange={setDroneIncluded} />
          </div>
          {droneIncluded && (
            <>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Drone permission</Label>
                <Select value={dronePermissionStatus}
                  onValueChange={(v) => setDronePermissionStatus(v as any)}
                  disabled={readOnly}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_needed" className="text-xs">Not needed</SelectItem>
                    <SelectItem value="pending" className="text-xs text-amber-700">Pending</SelectItem>
                    <SelectItem value="granted" className="text-xs text-emerald-700">Granted</SelectItem>
                    <SelectItem value="refused" className="text-xs text-rose-700">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Drone notes (NOC reference, restricted zones, venue rules…)"
                value={droneNotes} disabled={readOnly}
                onChange={(e) => setDroneNotes(e.target.value)} />
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Backup strategy</Label>
              <Input value={backupStrategy} disabled={readOnly}
                placeholder='e.g. "Dual SD + cloud nightly"'
                onChange={(e) => setBackupStrategy(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Social teaser by</Label>
              <Input type="date" value={socialMediaTeaserTargetDate} disabled={readOnly}
                onChange={(e) => setSocialMediaTeaserTargetDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Coordination notes</Label>
          <Textarea rows={2} value={notes} disabled={readOnly}
            placeholder="Gear list, getting-ready location, reception entry timing, decorator handoff for stage shots…"
            onChange={(e) => setNotes(e.target.value)} />
        </div>

        {!readOnly && (
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving} size="sm">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save photography sheet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
