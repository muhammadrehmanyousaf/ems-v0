"use client";

/**
 * Deliverables tracker (§16.1) — the photographer signature feature.
 * Per-booking list of deliverables (Edited Photos · Highlight Reel · Album ·
 * Drone Footage · Reels …) with status (pending / in-progress / delivered /
 * approved / rejected), an ETA, an optional link (gallery / Drive), and notes.
 * Kills the "kab milengi tasveerein?" WhatsApp chasing by giving the client a
 * shareable, client-visible status (when we surface the share later).
 *
 * Saves into FunctionSheet.deliverablesJson via the existing update endpoint.
 * Read-only on terminal sheets. Same pattern as BeoRunSheetCard.
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
import { PackageCheck, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  FunctionSheetAPI,
  type FunctionSheet,
  type Deliverable,
  type DeliverableStatus,
  type DeliverablesData,
} from "@/lib/api/functionSheets";

const STATUS_LABEL: Record<DeliverableStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  delivered: "Delivered",
  approved: "Approved",
  rejected: "Needs rework",
};

const STATUS_TONE: Record<DeliverableStatus, string> = {
  pending: "text-neutral-600",
  in_progress: "text-amber-700",
  delivered: "text-blue-700",
  approved: "text-emerald-700",
  rejected: "text-red-700",
};

const QUICK_PRESETS = [
  "Edited photos",
  "Highlight reel",
  "Cinematic film",
  "Album",
  "Drone footage",
  "Reels",
  "Online gallery",
  "Raw files",
];

const newId = () => Math.random().toString(36).slice(2, 10);

const emptyItem = (label = ""): Deliverable => ({
  id: newId(),
  label,
  status: "pending",
  etaDate: null,
  link: "",
  notes: "",
});

export default function DeliverablesCard({
  sheet, onSaved, readOnly = false,
}: { sheet: FunctionSheet; onSaved?: () => void; readOnly?: boolean }) {
  const [items, setItems] = useState<Deliverable[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = sheet.deliverablesJson?.items;
    setItems(init && init.length ? init : [emptyItem()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.id, sheet.updatedAt]);

  const setRow = (i: number, patch: Partial<Deliverable>) =>
    setItems((xs) => xs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = (label = "") => setItems((xs) => [...xs, emptyItem(label)]);
  const removeRow = (i: number) => setItems((xs) => xs.filter((_, idx) => idx !== i));

  const onSave = async () => {
    setSaving(true);
    try {
      const payload: DeliverablesData = {
        items: items
          .filter((r) => r.label.trim())
          .map((r) => ({
            ...r,
            label: r.label.trim(),
            link: r.link?.trim() || undefined,
            notes: r.notes?.trim() || undefined,
            etaDate: r.etaDate || null,
          })),
      };
      await FunctionSheetAPI.update(sheet.id, { deliverablesJson: payload });
      toast.success("Deliverables saved");
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save deliverables");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PackageCheck className="h-4 w-4 text-bridal-gold-dark" />
          Deliverables
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          What you owe the client (photos, video, album…). Track status + ETA so
          they always know where things stand — no more "kab milengi?" chasing.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {items.map((row, i) => (
            <div key={row.id} className="rounded-md border p-2 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="e.g. Edited photos"
                  value={row.label}
                  disabled={readOnly}
                  onChange={(e) => setRow(i, { label: e.target.value })}
                />
                <Select
                  value={row.status}
                  onValueChange={(v) => setRow(i, { status: v as DeliverableStatus })}
                  disabled={readOnly}
                >
                  <SelectTrigger className={`w-[150px] h-9 text-xs ${STATUS_TONE[row.status]}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as DeliverableStatus[]).map((s) => (
                      <SelectItem key={s} value={s} className={`text-xs ${STATUS_TONE[s]}`}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => removeRow(i)}
                    aria-label="Remove deliverable"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">ETA</Label>
                  <Input
                    type="date"
                    value={row.etaDate || ""}
                    disabled={readOnly}
                    onChange={(e) => setRow(i, { etaDate: e.target.value || null })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Share link (optional)</Label>
                  <Input
                    type="url"
                    placeholder="https://gallery.example.com/…"
                    value={row.link || ""}
                    disabled={readOnly}
                    onChange={(e) => setRow(i, { link: e.target.value })}
                  />
                </div>
              </div>
              <Textarea
                rows={2}
                placeholder="Notes (e.g. 'first cut sent for feedback')"
                value={row.notes || ""}
                disabled={readOnly}
                onChange={(e) => setRow(i, { notes: e.target.value })}
              />
            </div>
          ))}
        </div>

        {!readOnly && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRESETS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => addRow(p)}
                >
                  + {p}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => addRow()}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add custom
              </Button>
              <Button onClick={onSave} disabled={saving} size="sm">
                {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Save deliverables
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
