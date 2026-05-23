"use client";

/**
 * BEO / Run-sheet editor — the venue's day-of operations document. Captures the
 * structured detail a crew needs (spaces, guaranteed headcount, setup/teardown,
 * the minute-by-minute timeline, crew notes) into the function sheet's beoJson.
 * Self-contained: saves via FunctionSheetAPI.update so it never touches the big
 * composer form. Read-only on terminal (closed/archived) sheets.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardList, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  FunctionSheetAPI,
  type FunctionSheet,
  type BeoData,
  type BeoTimelineRow,
} from "@/lib/api/functionSheets";

export default function BeoRunSheetCard({
  sheet,
  onSaved,
  readOnly = false,
}: {
  sheet: FunctionSheet;
  onSaved?: () => void;
  readOnly?: boolean;
}) {
  const [spaces, setSpaces] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [setupTime, setSetupTime] = useState("");
  const [teardownTime, setTeardownTime] = useState("");
  const [timeline, setTimeline] = useState<BeoTimelineRow[]>([{ time: "", activity: "" }]);
  const [crewNotes, setCrewNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const b = sheet.beoJson || {};
    setSpaces(b.spaces || "");
    setHeadcount(b.guaranteedHeadcount != null ? String(b.guaranteedHeadcount) : "");
    setSetupTime(b.setupTime || "");
    setTeardownTime(b.teardownTime || "");
    setTimeline(b.timeline?.length ? b.timeline : [{ time: "", activity: "" }]);
    setCrewNotes(b.crewNotes || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.id, sheet.updatedAt]);

  const setRow = (i: number, patch: Partial<BeoTimelineRow>) =>
    setTimeline((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setTimeline((rows) => [...rows, { time: "", activity: "" }]);
  const removeRow = (i: number) => setTimeline((rows) => rows.filter((_, idx) => idx !== i));

  const onSave = async () => {
    setSaving(true);
    try {
      const beoJson: BeoData = {
        spaces: spaces.trim() || undefined,
        guaranteedHeadcount:
          headcount.trim() === "" ? null : Math.max(0, parseInt(headcount, 10) || 0),
        setupTime: setupTime || undefined,
        teardownTime: teardownTime || undefined,
        timeline: timeline.filter((r) => r.time.trim() || r.activity.trim()),
        crewNotes: crewNotes.trim() || undefined,
      };
      await FunctionSheetAPI.update(sheet.id, { beoJson });
      toast.success("BEO / run-sheet saved");
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save BEO");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-bridal-gold-dark" />
          BEO / Run sheet
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          The day-of operations sheet for your crew — spaces, headcount, setup/teardown, and the timeline.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Spaces / halls used</Label>
            <Input
              value={spaces}
              disabled={readOnly}
              placeholder="e.g. Shahi Hall + Garden Lawn"
              onChange={(e) => setSpaces(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Guaranteed headcount</Label>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={headcount}
              disabled={readOnly}
              placeholder="e.g. 350"
              onChange={(e) => setHeadcount(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Setup</Label>
              <Input type="time" value={setupTime} disabled={readOnly} onChange={(e) => setSetupTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Teardown</Label>
              <Input type="time" value={teardownTime} disabled={readOnly} onChange={(e) => setTeardownTime(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Timeline / run-sheet</Label>
          <div className="space-y-2">
            {timeline.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="time"
                  className="w-28 shrink-0"
                  value={row.time}
                  disabled={readOnly}
                  onChange={(e) => setRow(i, { time: e.target.value })}
                />
                <Input
                  className="flex-1"
                  placeholder="e.g. Guests arrive / Dinner / Cake cutting / Rukhsati"
                  value={row.activity}
                  disabled={readOnly}
                  onChange={(e) => setRow(i, { activity: e.target.value })}
                />
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => removeRow(i)}
                    aria-label="Remove row"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add row
            </Button>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Crew notes</Label>
          <Textarea
            rows={2}
            value={crewNotes}
            disabled={readOnly}
            placeholder="Instructions for the on-site team (parking, VIP table, sound cues…)"
            onChange={(e) => setCrewNotes(e.target.value)}
          />
        </div>

        {!readOnly && (
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving} size="sm">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save BEO
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
