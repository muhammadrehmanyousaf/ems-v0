"use client";

/**
 * Customer CSV import — the "leave your Excel/register behind" onboarding step.
 * Paste or upload a CSV, map columns, preview, then import. Loops the existing
 * POST /offlineCustomers (which already enforces unique phone = dedupe), so
 * there's no new backend and no bulk-write risk. Per-row errors are caught and
 * summarised (imported / skipped duplicates / failed).
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, CheckCircle2, FileUp } from "lucide-react";
import axiosInstance from "@/lib/axiosConfig";
import { BACKEND_URL } from "@/lib/backend-url";
import { toast } from "@/components/ui/use-toast";

type Field = "name" | "phoneno" | "email" | "address" | "ignore";
const FIELD_LABELS: Record<Field, string> = {
  name: "Name", phoneno: "Phone", email: "Email", address: "Address", ignore: "— Ignore —",
};

// Minimal CSV parser: handles quoted fields with commas + escaped quotes + CRLF.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); if (row.some((x) => x.trim() !== "")) rows.push(row); }
  return rows;
}

function autoDetect(header: string): Field {
  const h = (header || "").toLowerCase();
  if (/name/.test(h)) return "name";
  if (/phone|mobile|cell|contact|number|no\b/.test(h)) return "phoneno";
  if (/e-?mail/.test(h)) return "email";
  if (/address|city|location|area|adres/.test(h)) return "address";
  return "ignore";
}

interface Result { imported: number; skipped: number; failed: number; errors: string[] }

export default function ImportCustomersDialog({
  open, onOpenChange, onImported,
}: { open: boolean; onOpenChange: (v: boolean) => void; onImported?: () => void }) {
  const [raw, setRaw] = useState("");
  const [mapping, setMapping] = useState<Field[]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => (raw.trim() ? parseCsv(raw) : []), [raw]);
  const colCount = rows[0]?.length || 0;

  // Derive default mapping + header guess whenever the pasted/uploaded text
  // changes (in an effect, not during render). Manual remaps below then persist.
  useEffect(() => {
    if (colCount === 0) { setMapping([]); return; }
    const header = rows[0] || [];
    const looksLikeHeader = header.some((c) => autoDetect(c) !== "ignore");
    setHasHeader(looksLikeHeader);
    const order: Field[] = ["name", "phoneno", "email", "address"];
    setMapping(
      Array.from({ length: colCount }, (_, i) =>
        looksLikeHeader ? autoDetect(header[i]) : (order[i] || "ignore"),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const idxOf = (f: Field) => mapping.indexOf(f);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setRaw(String(reader.result || "")); setResult(null); };
    reader.readAsText(file);
  };

  const reset = () => { setRaw(""); setMapping([]); setResult(null); setProgress(0); };

  const runImport = async () => {
    const nameI = idxOf("name"), phoneI = idxOf("phoneno"), emailI = idxOf("email"), addrI = idxOf("address");
    if (nameI < 0 || phoneI < 0) {
      toast({ title: "Map Name & Phone", description: "At least Name and Phone columns are required.", variant: "destructive" });
      return;
    }
    setImporting(true);
    const res: Result = { imported: 0, skipped: 0, failed: 0, errors: [] };
    for (let r = 0; r < dataRows.length; r++) {
      const row = dataRows[r];
      const name = (row[nameI] || "").trim();
      const phoneno = (row[phoneI] || "").trim();
      if (!name || !phoneno) { res.skipped++; setProgress(Math.round(((r + 1) / dataRows.length) * 100)); continue; }
      const body = {
        name,
        phoneno,
        email: emailI >= 0 ? (row[emailI] || "").trim() || undefined : undefined,
        address: (addrI >= 0 ? (row[addrI] || "").trim() : "") || "—", // backend requires non-empty
      };
      try {
        await axiosInstance.post(`${BACKEND_URL}api/v1/offlineCustomers`, body);
        res.imported++;
      } catch (e: any) {
        const msg = e?.response?.data?.message || "";
        if (/exist/i.test(msg)) res.skipped++;
        else { res.failed++; if (res.errors.length < 5) res.errors.push(`${name}: ${msg || "failed"}`); }
      }
      setProgress(Math.round(((r + 1) / dataRows.length) * 100));
    }
    setResult(res);
    setImporting(false);
    if (res.imported > 0) onImported?.();
    toast({ title: "Import complete", description: `${res.imported} added, ${res.skipped} skipped, ${res.failed} failed.` });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!importing) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="sm:max-w-[640px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import customers from Excel / CSV</DialogTitle>
          <DialogDescription>
            Bring your existing client list in. Export your sheet as CSV, then paste or upload it below.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Done — {result.imported} customers imported.</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {result.skipped} skipped (duplicates / missing name or phone) · {result.failed} failed.
            </p>
            {result.errors.length > 0 && (
              <ul className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 space-y-0.5">
                {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-1">
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <FileUp className="mr-1.5 h-3.5 w-3.5" /> Upload .csv
              </Button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onFile} />
              <span className="text-xs text-muted-foreground">or paste below</span>
            </div>
            <Textarea
              rows={5}
              className="font-mono text-xs"
              placeholder={"Name, Phone, Email, Address\nAli Khan, 03001234567, ali@x.com, Lahore\nSara, 03111234567, , Karachi"}
              value={raw}
              onChange={(e) => { setRaw(e.target.value); setResult(null); }}
            />

            {colCount > 0 && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Map your columns</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Array.from({ length: colCount }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <p className="truncate text-[11px] text-muted-foreground">
                          {hasHeader ? (rows[0][i] || `Col ${i + 1}`) : `Col ${i + 1}`}
                        </p>
                        <Select
                          value={mapping[i] || "ignore"}
                          onValueChange={(v) => setMapping((m) => m.map((x, idx) => (idx === i ? (v as Field) : x)))}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(["name", "phoneno", "email", "address", "ignore"] as Field[]).map((f) => (
                              <SelectItem key={f} value={f} className="text-xs">{FIELD_LABELS[f]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} />
                    First row is a header
                  </label>
                </div>

                <div className="rounded-md border text-xs">
                  <div className="border-b bg-muted/50 px-2 py-1 font-medium">
                    Preview · {dataRows.length} customer{dataRows.length === 1 ? "" : "s"} to import
                  </div>
                  <div className="max-h-40 overflow-auto">
                    {dataRows.slice(0, 5).map((row, r) => (
                      <div key={r} className="flex gap-3 border-b px-2 py-1 last:border-0">
                        <span className="font-medium">{idxOf("name") >= 0 ? row[idxOf("name")] : "—"}</span>
                        <span className="text-muted-foreground">{idxOf("phoneno") >= 0 ? row[idxOf("phoneno")] : "—"}</span>
                      </div>
                    ))}
                    {dataRows.length > 5 && <div className="px-2 py-1 text-muted-foreground">+{dataRows.length - 5} more…</div>}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={() => { onOpenChange(false); reset(); }}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>Cancel</Button>
              <Button onClick={runImport} disabled={importing || dataRows.length === 0}>
                {importing
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing… {progress}%</>
                  : <><Upload className="mr-2 h-4 w-4" /> Import {dataRows.length || ""}</>}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
