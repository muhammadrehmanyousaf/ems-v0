"use client";

/**
 * Vendor↔vendor sub-contract ledger (M23, §20) — the tracking MVP.
 * PK weddings are rarely one vendor: a venue brings a caterer, a
 * planner sub-lets photography + decor. This card lets the lead vendor
 * record each sub (name, craft, scope, agreed payout, paid, status) so
 * "who's doing what + who owes whom" stops living in WhatsApp.
 *
 * Saves into FunctionSheet.subcontractsJson via the existing update
 * endpoint. Shown for ALL vendor types (sub-contracting is universal).
 * Read-only on terminal sheets. Same proven pattern as the 10 pillars.
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
import { Users, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  FunctionSheetAPI,
  type FunctionSheet,
  type SubcontractItem,
  type SubcontractStatus,
  type SubcontractData,
} from "@/lib/api/functionSheets";

const STATUS_LABEL: Record<SubcontractStatus, string> = {
  planned: "Planned",
  confirmed: "Confirmed",
  in_progress: "In progress",
  delivered: "Delivered",
  paid: "Paid",
  cancelled: "Cancelled",
};
const STATUS_TONE: Record<SubcontractStatus, string> = {
  planned: "text-neutral-600",
  confirmed: "text-blue-700",
  in_progress: "text-amber-700",
  delivered: "text-violet-700",
  paid: "text-emerald-700",
  cancelled: "text-rose-700",
};

const fmtPKR = (n: number) => (n > 0 ? `Rs ${Math.round(n).toLocaleString("en-PK")}` : "Rs 0");
const newId = () => Math.random().toString(36).slice(2, 10);
const numOrNull = (v: string) => (v === "" ? null : Math.max(0, parseFloat(v) || 0));
const emptyItem = (): SubcontractItem => ({
  id: newId(), subName: "", subType: "", subPhone: "", scope: "",
  agreedAmount: null, amountPaid: null, status: "planned", notes: "",
});

export default function SubcontractCard({
  sheet, onSaved, readOnly = false,
}: { sheet: FunctionSheet; onSaved?: () => void; readOnly?: boolean }) {
  const [items, setItems] = useState<SubcontractItem[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = sheet.subcontractsJson || {};
    setItems(s.items && s.items.length ? s.items : []);
    setNotes(s.notes || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.id, sheet.updatedAt]);

  const totals = useMemo(() => {
    let agreed = 0, paid = 0;
    for (const i of items) {
      if (i.status === "cancelled") continue;
      agreed += Number(i.agreedAmount) || 0;
      paid += Number(i.amountPaid) || 0;
    }
    return { agreed, paid, outstanding: Math.max(0, agreed - paid), count: items.length };
  }, [items]);

  const setItem = (i: number, patch: Partial<SubcontractItem>) =>
    setItems((xs) => xs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addItem = () => setItems((xs) => [...xs, emptyItem()]);
  const removeItem = (i: number) => setItems((xs) => xs.filter((_, idx) => idx !== i));

  const onSave = async () => {
    setSaving(true);
    try {
      const payload: SubcontractData = {
        items: items.filter((i) => i.subName.trim()).map((i) => ({
          ...i,
          subName: i.subName.trim(),
          subType: i.subType?.trim() || undefined,
          subPhone: i.subPhone?.trim() || undefined,
          scope: i.scope?.trim() || undefined,
          notes: i.notes?.trim() || undefined,
        })),
        notes: notes.trim() || undefined,
      };
      await FunctionSheetAPI.update(sheet.id, { subcontractsJson: payload });
      toast.success("Sub-contracts saved");
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
          <Users className="h-4 w-4 text-bridal-gold-dark" />
          Sub-contracts
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Other vendors you&apos;ve brought onto this event — track scope, agreed
          payout, and what you still owe them. No more WhatsApp guesswork.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-md bg-muted/40 p-2 text-xs">
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Subs</p>
            <p className="font-semibold tabular-nums">{totals.count}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Agreed</p>
            <p className="font-semibold tabular-nums">{fmtPKR(totals.agreed)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Paid</p>
            <p className="font-semibold tabular-nums text-emerald-700">{fmtPKR(totals.paid)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">You still owe</p>
            <p className={`font-semibold tabular-nums ${totals.outstanding > 0 ? "text-rose-700" : ""}`}>{fmtPKR(totals.outstanding)}</p>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={it.id} className="rounded-md border p-2 space-y-2">
              <div className="flex items-center gap-2">
                <Input className="flex-1" placeholder="Sub-vendor name (e.g. Lazeez Caterers)"
                  value={it.subName} disabled={readOnly}
                  onChange={(e) => setItem(i, { subName: e.target.value })} />
                <Select value={it.status} onValueChange={(s) => setItem(i, { status: s as SubcontractStatus })} disabled={readOnly}>
                  <SelectTrigger className={`w-[140px] h-9 text-xs ${STATUS_TONE[it.status]}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as SubcontractStatus[]).map((s) => (
                      <SelectItem key={s} value={s} className={`text-xs ${STATUS_TONE[s]}`}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!readOnly && (
                  <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeItem(i)} aria-label="Remove sub">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Craft</Label>
                  <Input value={it.subType || ""} disabled={readOnly} placeholder="Caterer / Decor…"
                    onChange={(e) => setItem(i, { subType: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Phone</Label>
                  <Input value={it.subPhone || ""} disabled={readOnly} placeholder="03xx-xxxxxxx"
                    onChange={(e) => setItem(i, { subPhone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Agreed Rs</Label>
                  <Input type="number" min={0} value={it.agreedAmount ?? ""} disabled={readOnly}
                    onChange={(e) => setItem(i, { agreedAmount: numOrNull(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Paid Rs</Label>
                  <Input type="number" min={0} value={it.amountPaid ?? ""} disabled={readOnly}
                    onChange={(e) => setItem(i, { amountPaid: numOrNull(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Scope</Label>
                <Input value={it.scope || ""} disabled={readOnly} placeholder="What they're handling on this event"
                  onChange={(e) => setItem(i, { scope: e.target.value })} />
              </div>
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add sub-contract
            </Button>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Coordination notes</Label>
          <Textarea rows={2} value={notes} disabled={readOnly}
            placeholder="Arrival order, who reports to whom, split responsibilities…"
            onChange={(e) => setNotes(e.target.value)} />
        </div>

        {!readOnly && (
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving} size="sm">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save sub-contracts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
