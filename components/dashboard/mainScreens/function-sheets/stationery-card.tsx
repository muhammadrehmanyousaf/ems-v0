"use client";

/**
 * Stationery / wedding-invitations card (§16.8) — the stationery pillar.
 * PK invitation printers run a 2-stage workflow:
 *   (1) design proofs with 3-5 revision rounds, ending in customer
 *       approval (LOCKED with date + signer — reprints after this are
 *       billable);
 *   (2) bulk print runs (qty / paper / finish / envelope / unit cost).
 *
 * Per-deliverable (invitation / save-the-date / menu card / table number
 * / favor tag / signage…) with language, theme, designer credit, pickup-
 * or-delivery, and a reprint-reason field for billable late changes.
 *
 * Saves into FunctionSheet.stationeryJson via the existing update
 * endpoint. Read-only on terminal sheets. Same proven pattern.
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
import { FileText, Plus, Trash2, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  FunctionSheetAPI,
  type FunctionSheet,
  type StationeryDeliverable,
  type StationeryDeliverableKind,
  type StationeryProofRound,
  type StationeryProofStatus,
  type StationeryPrintRun,
  type StationeryFinish,
  type StationeryData,
} from "@/lib/api/functionSheets";

const KIND_LABEL: Record<StationeryDeliverableKind, string> = {
  save_the_date: "Save the date",
  invitation: "Invitation card",
  rsvp_card: "RSVP card",
  menu_card: "Menu card",
  table_number: "Table number",
  place_card: "Place card",
  favor_tag: "Favor tag",
  thank_you: "Thank-you card",
  envelope_seal: "Envelope seal",
  signage: "Welcome / signage",
  other: "Other",
};
const PROOF_LABEL: Record<StationeryProofStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  revision_requested: "Revision",
  approved: "Approved",
};
const PROOF_TONE: Record<StationeryProofStatus, string> = {
  draft: "text-neutral-600",
  sent: "text-blue-700",
  revision_requested: "text-amber-700",
  approved: "text-emerald-700",
};
const FINISH_LABEL: Record<StationeryFinish, string> = {
  plain: "Plain",
  matte: "Matte",
  gloss: "Gloss",
  foil: "Foil stamp",
  emboss: "Emboss",
  deboss: "Deboss",
  letterpress: "Letterpress",
  uv_spot: "UV spot",
};

const fmtPKR = (n: number) =>
  n > 0 ? `Rs ${Math.round(n).toLocaleString("en-PK")}` : "Rs 0";

const newId = () => Math.random().toString(36).slice(2, 10);
const numOrNull = (v: string) =>
  v === "" ? null : Math.max(0, parseFloat(v) || 0);

const emptyProof = (round: number): StationeryProofRound => ({
  id: newId(), round, sentAt: "", status: "draft",
  fileLink: "", customerNotes: "", resolvedAt: "",
});
const emptyPrintRun = (): StationeryPrintRun => ({
  id: newId(), qty: null, paperStock: "", finish: "matte",
  envelopeIncluded: false, unitCost: null, printedAt: null,
  deliveredAt: null, notes: "",
});
const emptyDeliverable = (kind: StationeryDeliverableKind = "invitation"): StationeryDeliverable => ({
  id: newId(), kind, label: KIND_LABEL[kind], language: "english",
  proofs: [emptyProof(1)],
  approvedAt: null, approvedBy: "",
  printRuns: [emptyPrintRun()],
  notes: "",
});
const runTotal = (r: StationeryPrintRun) =>
  (Number(r.qty) || 0) * (Number(r.unitCost) || 0);

export default function StationeryCard({
  sheet, onSaved, readOnly = false,
}: { sheet: FunctionSheet; onSaved?: () => void; readOnly?: boolean }) {
  const [deliverables, setDeliverables] = useState<StationeryDeliverable[]>([emptyDeliverable()]);
  const [designerName, setDesignerName] = useState("");
  const [themeNotes, setThemeNotes] = useState("");
  const [totalProofRoundsAllowed, setTotalProofRoundsAllowed] = useState("");
  const [pickupOrDelivery, setPickupOrDelivery] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [reprintReason, setReprintReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = sheet.stationeryJson || {};
    setDeliverables(s.deliverables && s.deliverables.length ? s.deliverables : [emptyDeliverable()]);
    setDesignerName(s.designerName || "");
    setThemeNotes(s.themeNotes || "");
    setTotalProofRoundsAllowed(
      s.totalProofRoundsAllowed != null ? String(s.totalProofRoundsAllowed) : ""
    );
    setPickupOrDelivery(s.pickupOrDelivery || "pickup");
    setDeliveryAddress(s.deliveryAddress || "");
    setReprintReason(s.reprintReason || "");
    setNotes(s.notes || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.id, sheet.updatedAt]);

  const totals = useMemo(() => {
    let totalQty = 0, totalCost = 0;
    let totalProofs = 0, approvedCount = 0;
    for (const d of deliverables) {
      for (const r of d.printRuns || []) {
        totalQty += Number(r.qty) || 0;
        totalCost += runTotal(r);
      }
      totalProofs += (d.proofs || []).length;
      if (d.approvedAt) approvedCount += 1;
    }
    return {
      totalQty, totalCost, totalProofs, approvedCount,
      totalDeliverables: deliverables.length,
    };
  }, [deliverables]);

  const setDel = (i: number, patch: Partial<StationeryDeliverable>) =>
    setDeliverables((xs) => xs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addDel = () => setDeliverables((xs) => [...xs, emptyDeliverable()]);
  const removeDel = (i: number) => setDeliverables((xs) => xs.filter((_, idx) => idx !== i));

  const addProof = (di: number) =>
    setDel(di, {
      proofs: [...(deliverables[di].proofs || []),
        emptyProof((deliverables[di].proofs?.length || 0) + 1)],
    });
  const setProof = (di: number, pi: number, patch: Partial<StationeryProofRound>) => {
    const proofs = (deliverables[di].proofs || []).map((p, idx) => (idx === pi ? { ...p, ...patch } : p));
    setDel(di, { proofs });
  };
  const removeProof = (di: number, pi: number) => {
    const proofs = (deliverables[di].proofs || []).filter((_, idx) => idx !== pi);
    setDel(di, { proofs });
  };
  const lockApproval = (di: number) => {
    const today = new Date().toISOString().slice(0, 10);
    setDel(di, { approvedAt: today });
  };
  const unlockApproval = (di: number) => setDel(di, { approvedAt: null });

  const addRun = (di: number) =>
    setDel(di, { printRuns: [...(deliverables[di].printRuns || []), emptyPrintRun()] });
  const setRun = (di: number, ri: number, patch: Partial<StationeryPrintRun>) => {
    const printRuns = (deliverables[di].printRuns || []).map((r, idx) => (idx === ri ? { ...r, ...patch } : r));
    setDel(di, { printRuns });
  };
  const removeRun = (di: number, ri: number) => {
    const printRuns = (deliverables[di].printRuns || []).filter((_, idx) => idx !== ri);
    setDel(di, { printRuns });
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const payload: StationeryData = {
        deliverables: deliverables.filter((d) => d.label.trim() || d.kind).map((d) => ({
          ...d,
          label: d.label?.trim() || KIND_LABEL[d.kind],
          approvedBy: d.approvedBy?.trim() || undefined,
          notes: d.notes?.trim() || undefined,
          proofs: (d.proofs || []).map((p) => ({
            ...p,
            fileLink: p.fileLink?.trim() || undefined,
            customerNotes: p.customerNotes?.trim() || undefined,
            sentAt: p.sentAt || undefined,
            resolvedAt: p.resolvedAt || undefined,
          })),
          printRuns: (d.printRuns || []).map((r) => ({
            ...r,
            paperStock: r.paperStock?.trim() || undefined,
            notes: r.notes?.trim() || undefined,
          })),
        })),
        designerName: designerName.trim() || undefined,
        themeNotes: themeNotes.trim() || undefined,
        totalProofRoundsAllowed: totalProofRoundsAllowed.trim() === ""
          ? null
          : Math.max(0, parseInt(totalProofRoundsAllowed, 10) || 0),
        pickupOrDelivery,
        deliveryAddress: deliveryAddress.trim() || undefined,
        reprintReason: reprintReason.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      await FunctionSheetAPI.update(sheet.id, { stationeryJson: payload });
      toast.success("Stationery sheet saved");
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const cap = Number(totalProofRoundsAllowed) || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-bridal-gold-dark" />
          Invitations &amp; stationery
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Proof rounds → customer approval LOCK → print runs. Reprints after
          approval are billable — log the reason so it sticks.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live totals strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-md bg-muted/40 p-2 text-xs">
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Deliverables</p>
            <p className="font-semibold tabular-nums">
              {totals.totalDeliverables}
              <span className="text-muted-foreground"> · {totals.approvedCount} approved</span>
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Proof rounds</p>
            <p className="font-semibold tabular-nums">{totals.totalProofs}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Total qty</p>
            <p className="font-semibold tabular-nums">{totals.totalQty.toLocaleString("en-PK")}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Print cost</p>
            <p className="font-semibold tabular-nums text-bridal-gold-dark">{fmtPKR(totals.totalCost)}</p>
          </div>
        </div>

        {/* Designer + theme + contract */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Designer / calligrapher</Label>
            <Input value={designerName} disabled={readOnly}
              placeholder="e.g. Calligrapher Ali Raza"
              onChange={(e) => setDesignerName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Proof rounds in contract</Label>
            <Input type="number" min={0} max={20} value={totalProofRoundsAllowed} disabled={readOnly}
              placeholder="e.g. 3"
              onChange={(e) => setTotalProofRoundsAllowed(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Theme &amp; calligraphy notes</Label>
          <Textarea rows={2} value={themeNotes} disabled={readOnly}
            placeholder="Colors, Urdu/English mix, gold foil, family motifs…"
            onChange={(e) => setThemeNotes(e.target.value)} />
        </div>

        {/* Deliverable rows */}
        <div className="space-y-3">
          {deliverables.map((d, di) => {
            const proofCount = (d.proofs || []).length;
            const overCap = cap > 0 && proofCount > cap;
            const isLocked = !!d.approvedAt;
            return (
              <div key={d.id} className="rounded-md border p-2 space-y-2">
                {/* Deliverable header */}
                <div className="flex items-center gap-2">
                  <Select
                    value={d.kind}
                    onValueChange={(k) => setDel(di, {
                      kind: k as StationeryDeliverableKind,
                      label: KIND_LABEL[k as StationeryDeliverableKind],
                    })}
                    disabled={readOnly || isLocked}
                  >
                    <SelectTrigger className="w-[180px] h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(KIND_LABEL) as StationeryDeliverableKind[]).map((k) => (
                        <SelectItem key={k} value={k} className="text-xs">{KIND_LABEL[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="flex-1"
                    placeholder="Label (e.g. Mehndi-card · Walima invitation)"
                    value={d.label}
                    disabled={readOnly || isLocked}
                    onChange={(e) => setDel(di, { label: e.target.value })}
                  />
                  <Select
                    value={d.language || "english"}
                    onValueChange={(v) => setDel(di, { language: v as any })}
                    disabled={readOnly || isLocked}
                  >
                    <SelectTrigger className="w-[110px] h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english" className="text-xs">English</SelectItem>
                      <SelectItem value="urdu" className="text-xs">Urdu</SelectItem>
                      <SelectItem value="both" className="text-xs">Both</SelectItem>
                    </SelectContent>
                  </Select>
                  {!readOnly && (
                    <Button type="button" variant="ghost" size="icon" className="shrink-0"
                      onClick={() => removeDel(di)} aria-label="Remove deliverable">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>

                {/* Proof rounds */}
                <div className="rounded-md bg-muted/30 p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Proof rounds · {proofCount}
                      {cap > 0 && (
                        <span className={overCap ? "text-amber-700" : "text-muted-foreground"}>
                          {" / "}{cap} in contract{overCap && " · OVER cap"}
                        </span>
                      )}
                    </div>
                    {!readOnly && !isLocked && (
                      <Button type="button" variant="ghost" size="sm" className="h-7"
                        onClick={() => addProof(di)}>
                        <Plus className="mr-1 h-3 w-3" /> Round
                      </Button>
                    )}
                  </div>
                  {(d.proofs || []).map((p, pi) => (
                    <div key={p.id} className="rounded-md border bg-background p-2 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold w-14">Round {p.round}</span>
                        <Select
                          value={p.status}
                          onValueChange={(s) => setProof(di, pi, { status: s as StationeryProofStatus })}
                          disabled={readOnly || isLocked}
                        >
                          <SelectTrigger className={`flex-1 h-8 text-xs ${PROOF_TONE[p.status]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(PROOF_LABEL) as StationeryProofStatus[]).map((s) => (
                              <SelectItem key={s} value={s} className={`text-xs ${PROOF_TONE[s]}`}>
                                {PROOF_LABEL[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input type="date" className="w-[140px] h-8 text-xs"
                          value={p.sentAt || ""} disabled={readOnly || isLocked}
                          onChange={(e) => setProof(di, pi, { sentAt: e.target.value })} />
                        {!readOnly && !isLocked && proofCount > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => removeProof(di, pi)} aria-label="Remove proof">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                      <Input
                        className="h-8 text-xs"
                        placeholder="Proof file link (Drive / WhatsApp / WeTransfer)"
                        value={p.fileLink || ""}
                        disabled={readOnly || isLocked}
                        onChange={(e) => setProof(di, pi, { fileLink: e.target.value })}
                      />
                      <Input
                        className="h-8 text-xs"
                        placeholder="Customer change requests for this round"
                        value={p.customerNotes || ""}
                        disabled={readOnly || isLocked}
                        onChange={(e) => setProof(di, pi, { customerNotes: e.target.value })}
                      />
                    </div>
                  ))}
                </div>

                {/* Approval lock */}
                <div className={`flex items-center justify-between rounded-md border p-2 ${
                  isLocked ? "bg-emerald-50 border-emerald-200" : ""
                }`}>
                  <div className="flex items-center gap-2">
                    {isLocked ? (
                      <Lock className="h-4 w-4 text-emerald-700" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-xs font-medium">
                        {isLocked ? `Approved on ${d.approvedAt}` : "Awaiting approval"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {isLocked
                          ? "Print runs are open. Post-approval reprints are billable."
                          : "Lock once the customer signs off on the final proof."}
                      </p>
                    </div>
                  </div>
                  {!readOnly && (
                    isLocked ? (
                      <Button type="button" variant="outline" size="sm" className="h-7"
                        onClick={() => unlockApproval(di)}>
                        Unlock
                      </Button>
                    ) : (
                      <Button type="button" size="sm" className="h-7"
                        onClick={() => lockApproval(di)}>
                        <Lock className="mr-1 h-3 w-3" /> Lock approval
                      </Button>
                    )
                  )}
                </div>
                {isLocked && (
                  <Input
                    className="h-8 text-xs"
                    placeholder={`Approved by (e.g. "Bride's father Ahmed sb")`}
                    value={d.approvedBy || ""}
                    disabled={readOnly}
                    onChange={(e) => setDel(di, { approvedBy: e.target.value })}
                  />
                )}

                {/* Print runs (only after approval) */}
                {isLocked && (
                  <div className="rounded-md bg-muted/30 p-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Print runs · {(d.printRuns || []).length}
                      </div>
                      {!readOnly && (
                        <Button type="button" variant="ghost" size="sm" className="h-7"
                          onClick={() => addRun(di)}>
                          <Plus className="mr-1 h-3 w-3" /> Run
                        </Button>
                      )}
                    </div>
                    {(d.printRuns || []).map((r, ri) => (
                      <div key={r.id} className="rounded-md border bg-background p-2 space-y-1.5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Qty</Label>
                            <Input type="number" min={0} value={r.qty ?? ""} disabled={readOnly}
                              className="h-8 text-xs"
                              onChange={(e) => setRun(di, ri, { qty: numOrNull(e.target.value) })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Unit cost Rs</Label>
                            <Input type="number" min={0} value={r.unitCost ?? ""} disabled={readOnly}
                              className="h-8 text-xs"
                              onChange={(e) => setRun(di, ri, { unitCost: numOrNull(e.target.value) })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Run total</Label>
                            <div className="h-8 rounded-md border bg-muted/30 px-2 flex items-center text-xs font-semibold tabular-nums">
                              {fmtPKR(runTotal(r))}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Finish</Label>
                            <Select
                              value={r.finish || "matte"}
                              onValueChange={(v) => setRun(di, ri, { finish: v as StationeryFinish })}
                              disabled={readOnly}
                            >
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {(Object.keys(FINISH_LABEL) as StationeryFinish[]).map((f) => (
                                  <SelectItem key={f} value={f} className="text-xs">{FINISH_LABEL[f]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Paper stock</Label>
                            <Input className="h-8 text-xs" value={r.paperStock || ""} disabled={readOnly}
                              placeholder='e.g. "300gsm matte" or "Conqueror laid"'
                              onChange={(e) => setRun(di, ri, { paperStock: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Printed</Label>
                            <Input type="date" className="h-8 text-xs" value={r.printedAt || ""}
                              disabled={readOnly}
                              onChange={(e) => setRun(di, ri, { printedAt: e.target.value || null })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Delivered</Label>
                            <Input type="date" className="h-8 text-xs" value={r.deliveredAt || ""}
                              disabled={readOnly}
                              onChange={(e) => setRun(di, ri, { deliveredAt: e.target.value || null })} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-xs">
                            <Switch checked={!!r.envelopeIncluded} disabled={readOnly}
                              onCheckedChange={(v) => setRun(di, ri, { envelopeIncluded: v })} />
                            Envelope included
                          </label>
                          {!readOnly && (d.printRuns || []).length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => removeRun(di, ri)} aria-label="Remove run">
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                        <Input className="h-8 text-xs" placeholder="Notes (reprint? rush? wrong colour batch?)"
                          value={r.notes || ""} disabled={readOnly}
                          onChange={(e) => setRun(di, ri, { notes: e.target.value })} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addDel}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add deliverable
            </Button>
          )}
        </div>

        {/* Delivery + reprint + notes */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Hand-off</Label>
            <Select value={pickupOrDelivery} disabled={readOnly}
              onValueChange={(v) => setPickupOrDelivery(v as "pickup" | "delivery")}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup" className="text-xs">Customer pickup</SelectItem>
                <SelectItem value="delivery" className="text-xs">Home delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Delivery address</Label>
            <Input value={deliveryAddress} disabled={readOnly || pickupOrDelivery !== "delivery"}
              placeholder="Where to drop the bulk box"
              onChange={(e) => setDeliveryAddress(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Reprint reason (only fill if billable)</Label>
          <Textarea rows={2} value={reprintReason} disabled={readOnly}
            placeholder="e.g. Spelling correction after approval · added 50 cards for in-laws · wrong colour batch from vendor"
            onChange={(e) => setReprintReason(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Coordination notes</Label>
          <Textarea rows={2} value={notes} disabled={readOnly}
            placeholder="Bride's family RSVP deadline, hand-delivery list for elders…"
            onChange={(e) => setNotes(e.target.value)} />
        </div>

        {!readOnly && (
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving} size="sm">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save stationery sheet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
