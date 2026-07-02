"use client";

/**
 * Custom Fields Manager — the vendor's no-code field designer for one host entity.
 * List existing fields (reorder / edit / remove) and add new ones through a visual
 * type picker with a live preview. Matches the dashboard system; the type-picker +
 * preview is the one intentional flourish. Per-venue, gated by ENABLE_CUSTOM_FIELDS.
 */
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CustomFieldsAPI, type CustomFieldDef, type CustomFieldOption, type CustomFieldType } from "@/lib/api/customFields";
import { FIELD_TYPE_META, FIELD_TYPE_ORDER } from "@/lib/custom-fields/field-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon, Spinner } from "@/components/dashboard/shared/icon";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2";

type Mode = { kind: "list" } | { kind: "pick" } | { kind: "form"; type: CustomFieldType; edit?: CustomFieldDef };

interface Draft { label: string; required: boolean; showInList: boolean; helpText: string; options: CustomFieldOption[] }
const draftFrom = (d?: CustomFieldDef): Draft => ({
  label: d?.label ?? "",
  required: d?.required ?? false,
  showInList: d?.showInList ?? false,
  helpText: d?.helpText ?? "",
  options: (d?.optionsJson as CustomFieldOption[]) ?? [],
});

export function CustomFieldsManager({
  open, onOpenChange, entityType, entityLabel, businessId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entityType: string;
  entityLabel: string;
  businessId: number;
}) {
  const qc = useQueryClient();
  const [mode, setMode] = React.useState<Mode>({ kind: "list" });
  React.useEffect(() => { if (open) setMode({ kind: "list" }); }, [open, entityType]);

  const defsQ = useQuery({
    // includeInactive=true → distinct key from the active-only readers; the prefix
    // invalidate() below still clears BOTH the true and false variants.
    queryKey: ["customFieldDefs", entityType, businessId, true],
    queryFn: () => CustomFieldsAPI.list(entityType, businessId, true),
    enabled: open,
  });
  const defs = (defsQ.data ?? []).sort((a, b) => a.displayOrder - b.displayOrder);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["customFieldDefs", entityType, businessId] });

  const removeMut = useMutation({
    mutationFn: (id: number) => CustomFieldsAPI.remove(id),
    onSuccess: () => { invalidate(); toast.success("Field removed"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Couldn't remove"),
  });
  const reorderMut = useMutation({
    mutationFn: (ids: number[]) => CustomFieldsAPI.reorder(businessId, ids),
    onSuccess: () => invalidate(),
  });
  const move = (idx: number, dir: -1 | 1) => {
    const ids = defs.map((d) => d.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    reorderMut.mutate(ids);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Custom fields · {entityLabel}</DialogTitle>
          <DialogDescription>Add your own fields to every {entityLabel.toLowerCase().replace(/s$/, "")} — no developer needed.</DialogDescription>
        </DialogHeader>

        {mode.kind === "list" && (
          <div className="space-y-3">
            {defsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {defs.length === 0 && !defsQ.isLoading && (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm font-medium">No custom fields yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Add fields like "Baraat entry time", "Dietary notes" or "Approved by".</p>
              </div>
            )}
            {defs.map((d, i) => (
              <div key={d.id} className={cn("flex items-center gap-3 rounded-lg border p-3", !d.isActive && "opacity-50")}>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon name={FIELD_TYPE_META[d.fieldType]?.icon || "Type"} size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{d.label}</span>
                    {d.required && <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">required</span>}
                    {d.showInList && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">in list</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{FIELD_TYPE_META[d.fieldType]?.label}{d.optionsJson?.length ? ` · ${d.optionsJson.length} options` : ""}</div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><Icon name="ChevronUp" size={15} /></Button>
                  <Button size="icon" variant="ghost" disabled={i === defs.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><Icon name="ChevronDown" size={15} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setMode({ kind: "form", type: d.fieldType, edit: d })} aria-label="Edit"><Icon name="Pencil" size={14} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Remove "${d.label}"?`)) removeMut.mutate(d.id); }} aria-label="Remove"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
                </div>
              </div>
            ))}
            <Button className="w-full" variant="outline" onClick={() => setMode({ kind: "pick" })}>
              <Icon name="Plus" size={16} className="mr-1.5" /> Add a field
            </Button>
          </div>
        )}

        {mode.kind === "pick" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose a field type</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FIELD_TYPE_ORDER.map((t) => (
                <button key={t} type="button" onClick={() => setMode({ kind: "form", type: t })}
                  className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition hover:border-primary/50 hover:bg-primary/[0.03]">
                  <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon name={FIELD_TYPE_META[t].icon} size={15} /></div>
                  <span className="text-sm font-medium">{FIELD_TYPE_META[t].label}</span>
                  <span className="text-[11px] text-muted-foreground">{FIELD_TYPE_META[t].hint}</span>
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setMode({ kind: "list" })}><Icon name="ArrowLeft" size={15} className="mr-1.5" /> Back</Button>
          </div>
        )}

        {mode.kind === "form" && (
          <FieldForm
            entityType={entityType} businessId={businessId} type={mode.type} edit={mode.edit}
            onDone={() => { invalidate(); setMode({ kind: "list" }); }}
            onCancel={() => setMode(mode.edit ? { kind: "list" } : { kind: "pick" })}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FieldForm({ entityType, businessId, type, edit, onDone, onCancel }: {
  entityType: string; businessId: number; type: CustomFieldType; edit?: CustomFieldDef;
  onDone: () => void; onCancel: () => void;
}) {
  const [d, setD] = React.useState<Draft>(draftFrom(edit));
  const meta = FIELD_TYPE_META[type];
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const saveMut = useMutation({
    mutationFn: () => {
      const body = { label: d.label.trim(), required: d.required, showInList: d.showInList, helpText: d.helpText.trim() || null, optionsJson: meta.hasOptions ? d.options : undefined };
      return edit ? CustomFieldsAPI.update(edit.id, body) : CustomFieldsAPI.create({ businessId, entityType, fieldType: type, ...body });
    },
    onSuccess: () => { toast.success(edit ? "Field updated" : "Field added"); onDone(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Couldn't save field"),
  });
  const canSave = d.label.trim().length > 0 && (!meta.hasOptions || d.options.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon name={meta.icon} size={15} /></div>
        <span className="font-medium">{edit ? "Edit" : "New"} {meta.label.toLowerCase()} field</span>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Field label</label>
        <input className={inputCls} value={d.label} autoFocus placeholder='e.g. "Baraat entry time"' onChange={(e) => set("label", e.target.value)} />
      </div>

      {meta.hasOptions && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Options</label>
          {d.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className={inputCls} value={o.label} placeholder={`Option ${i + 1}`} onChange={(e) => { const opts = [...d.options]; opts[i] = { label: e.target.value, value: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") }; set("options", opts); }} />
              <Button size="icon" variant="ghost" onClick={() => set("options", d.options.filter((_, j) => j !== i))} aria-label="Remove option"><Icon name="X" size={14} /></Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => set("options", [...d.options, { label: "", value: "" }])}><Icon name="Plus" size={14} className="mr-1" /> Add option</Button>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Help text (optional)</label>
        <input className={inputCls} value={d.helpText} placeholder="Short hint shown under the field" onChange={(e) => set("helpText", e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={d.required} onChange={(e) => set("required", e.target.checked)} /> Required</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={d.showInList} onChange={(e) => set("showInList", e.target.checked)} /> Show as a table column</label>
      </div>

      {/* Live preview — the signature moment */}
      <div className="rounded-lg border border-dashed bg-muted/30 p-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Preview</div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{d.label || "Field label"}{d.required && <span className="text-destructive"> *</span>}</label>
          <PreviewInput type={type} options={d.options} />
          {d.helpText && <p className="text-[11px] text-muted-foreground">{d.helpText}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
          {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {edit ? "Update field" : "Add field"}</>}
        </Button>
      </div>
    </div>
  );
}

function PreviewInput({ type, options }: { type: CustomFieldType; options: CustomFieldOption[] }): React.ReactElement {
  const cls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";
  if (type === "textarea") return <textarea className={cn(cls, "h-16 py-2")} disabled />;
  if (type === "boolean") return <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" disabled /> Yes</label>;
  if (type === "dropdown") return <select className={cls} disabled><option>{options[0]?.label || "Pick one…"}</option></select>;
  if (type === "multiselect") return <div className="flex flex-wrap gap-1.5">{(options.length ? options : [{ label: "Option", value: "o" }]).map((o, i) => <span key={i} className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">{o.label || "Option"}</span>)}</div>;
  if (type === "date") return <input type="date" className={cls} disabled />;
  if (type === "datetime") return <input type="datetime-local" className={cls} disabled />;
  if (type === "number" || type === "money") return <input type="number" className={cls} placeholder={type === "money" ? "Rs 0" : "0"} disabled />;
  return <input className={cls} placeholder="" disabled />;
}

export default CustomFieldsManager;
