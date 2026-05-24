"use client";

/**
 * Bookings CSV import — "leave your Excel/register behind" for HISTORICAL
 * bookings. Vendors with years of paper/Excel records can bulk-load them
 * in one shot.
 *
 * Mirror of import-customers-dialog but with:
 *  - business picker (one chosen business for the whole batch)
 *  - column mapping for booking fields (customerName + customerPhone +
 *    bookingDate + totalAmount required; bookingTime + email + downPayment
 *    + paymentStatus + guestCount + eventCity + notes optional)
 *  - dry-run checkbox (validates without writing)
 *  - single bulk POST to /bookings/bulk-import (NOT a per-row loop — the BE
 *    runs the whole batch in one transaction with per-row error capture)
 *
 * Imported bookings get: status="Completed", paymentStatus="Paid" (default),
 * bookingSource="offline" → they're filterable out of live ops if needed.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Upload, CheckCircle2, FileUp, AlertTriangle, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  BookingsAPI,
  BusinessesAPI,
  type BulkImportBookingRow,
  type BulkImportBookingsResponse,
  type ApiBusiness,
} from "@/lib/api/dashboard";

type Field =
  | "customerName" | "customerPhone" | "bookingDate" | "totalAmount"
  | "customerEmail" | "bookingTime" | "downPayment" | "paymentStatus"
  | "guestCount" | "eventCity" | "notes"
  | "ignore";

const FIELD_LABELS: Record<Field, string> = {
  customerName: "Customer name *",
  customerPhone: "Customer phone *",
  bookingDate: "Event date *",
  totalAmount: "Total amount Rs *",
  customerEmail: "Customer email",
  bookingTime: "Event time",
  downPayment: "Down payment Rs",
  paymentStatus: "Payment status",
  guestCount: "Guest count",
  eventCity: "Event city",
  notes: "Notes",
  ignore: "— Ignore —",
};

const REQUIRED_FIELDS: Field[] = [
  "customerName", "customerPhone", "bookingDate", "totalAmount",
];

// CSV parser — handles quoted fields with commas, escaped quotes, CRLF.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", inQ = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i += 1; } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cur); cur = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  if (cur !== "" || row.length) {
    row.push(cur);
    if (row.some((x) => x.trim() !== "")) rows.push(row);
  }
  return rows;
}

function autoDetect(header: string): Field {
  const h = (header || "").toLowerCase();
  if (/^(name|customer|client|bride|groom)/.test(h)) return "customerName";
  if (/phone|mobile|cell|contact|number|no\b/.test(h)) return "customerPhone";
  if (/e-?mail/.test(h)) return "customerEmail";
  if (/date|when|event.*day/.test(h)) return "bookingDate";
  if (/time|slot/.test(h)) return "bookingTime";
  if (/total|amount|price|cost|rs\b/.test(h)) return "totalAmount";
  if (/down|advance|deposit|bayana|booking.*fee/.test(h)) return "downPayment";
  if (/status|paid/.test(h)) return "paymentStatus";
  if (/guest|pax|people/.test(h)) return "guestCount";
  if (/city|location|venue/.test(h)) return "eventCity";
  if (/note|remark|comment|description/.test(h)) return "notes";
  return "ignore";
}

const SAMPLE_CSV = `Customer Name,Phone,Email,Event Date,Time,Total Amount,Down Payment,Status,Guests,City,Notes
Ahmed Khan,03001234567,ahmed@x.com,2025-12-15,18:00,250000,50000,Paid,300,Lahore,Walima
Fatima Ali,03219876543,,2025-11-08,17:00,180000,180000,Paid,200,Karachi,Nikah only
`;

export default function ImportBookingsDialog({
  open, onOpenChange, onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported?: () => void;
}) {
  const [raw, setRaw] = useState("");
  const [mapping, setMapping] = useState<Field[]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [businesses, setBusinesses] = useState<ApiBusiness[]>([]);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [importing, setImporting] = useState(false);
  const [dryRun, setDryRun] = useState(true); // default to dry-run for safety
  const [result, setResult] = useState<BulkImportBookingsResponse | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load vendor's businesses for the picker.
  useEffect(() => {
    if (!open) return;
    setLoadingBiz(true);
    BusinessesAPI.getUserBusinesses()
      .then((list) => {
        setBusinesses(list);
        if (list.length === 1) setBusinessId(list[0].id);
      })
      .catch(() => toast.error("Could not load your businesses"))
      .finally(() => setLoadingBiz(false));
  }, [open]);

  const rows = useMemo(() => (raw.trim() ? parseCsv(raw) : []), [raw]);
  const colCount = rows[0]?.length || 0;

  // Derive default mapping + header guess when input changes.
  useEffect(() => {
    if (colCount === 0) { setMapping([]); return; }
    const header = rows[0] || [];
    const looksLikeHeader = header.some((c) => autoDetect(c) !== "ignore");
    setHasHeader(looksLikeHeader);
    setMapping(
      Array.from({ length: colCount }, (_, i) =>
        looksLikeHeader ? autoDetect(header[i]) : "ignore",
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const idxOf = (f: Field) => mapping.indexOf(f);

  const missingRequired = REQUIRED_FIELDS.filter((f) => idxOf(f) < 0);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result || ""));
    reader.readAsText(file);
  };

  const setColMapping = (colIdx: number, field: Field) => {
    setMapping((prev) => {
      const next = [...prev];
      // If this field is required + already mapped to a different column, swap.
      if (field !== "ignore") {
        const existing = next.indexOf(field);
        if (existing >= 0 && existing !== colIdx) next[existing] = "ignore";
      }
      next[colIdx] = field;
      return next;
    });
  };

  const preview = dataRows.slice(0, 5).map((row) => {
    const out: Partial<BulkImportBookingRow> = {};
    for (let i = 0; i < mapping.length; i += 1) {
      const f = mapping[i];
      if (f === "ignore" || !f) continue;
      const v = (row[i] ?? "").trim();
      if (!v) continue;
      // @ts-expect-error narrowing by string union
      out[f] = v;
    }
    return out;
  });

  const doImport = async () => {
    if (!businessId) {
      toast.error("Pick a business for this import");
      return;
    }
    if (missingRequired.length) {
      toast.error(`Map required: ${missingRequired.map((f) => FIELD_LABELS[f]).join(", ")}`);
      return;
    }
    if (dataRows.length === 0) {
      toast.error("No rows to import");
      return;
    }
    if (dataRows.length > 200) {
      toast.error("Max 200 rows per import. Split into batches.");
      return;
    }

    setImporting(true);
    setResult(null);
    try {
      const payload: BulkImportBookingRow[] = dataRows.map((row) => {
        const r: Partial<BulkImportBookingRow> = {};
        for (let i = 0; i < mapping.length; i += 1) {
          const f = mapping[i];
          if (f === "ignore" || !f) continue;
          const v = (row[i] ?? "").trim();
          if (!v) continue;
          // @ts-expect-error narrowing
          r[f] = v;
        }
        return r as BulkImportBookingRow;
      });
      const res = await BookingsAPI.bulkImport(payload, businessId, dryRun);
      setResult(res);
      if (!dryRun && res.imported > 0) {
        toast.success(`Imported ${res.imported} booking${res.imported === 1 ? "" : "s"}`);
        onImported?.();
      } else if (dryRun) {
        toast.message(
          `Dry-run: ${res.imported} would import, ${res.failed} would fail`,
        );
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Bulk import failed");
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setRaw("");
    setMapping([]);
    setResult(null);
    setDryRun(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import historical bookings</DialogTitle>
          <DialogDescription>
            Bulk-load your Excel/register backlog. Imported bookings come in as
            <strong> Completed</strong>, <strong>Paid</strong>, source = <em>offline</em>
            (you can filter them out of live ops). Bypasses past-date + lead-time checks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1 — Business picker */}
          <section className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              1. Which business?
            </Label>
            {loadingBiz ? (
              <div className="text-xs text-muted-foreground">Loading your businesses…</div>
            ) : businesses.length === 0 ? (
              <div className="text-xs text-rose-700">
                You don&apos;t have any businesses yet. Create one first.
              </div>
            ) : (
              <Select
                value={businessId != null ? String(businessId) : ""}
                onValueChange={(v) => setBusinessId(Number(v))}
                disabled={importing}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Pick a business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}{b.businessType ? ` · ${b.businessType}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </section>

          {/* Step 2 — CSV input */}
          <section className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                2. Paste or upload CSV
              </Label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  className="hidden"
                  onChange={onFile}
                />
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={importing}
                >
                  <FileUp className="mr-1.5 h-3.5 w-3.5" /> Upload .csv
                </Button>
                <Button
                  type="button" variant="ghost" size="sm"
                  onClick={() => setRaw(SAMPLE_CSV)}
                  disabled={importing}
                >
                  Load sample
                </Button>
              </div>
            </div>
            <Textarea
              rows={5}
              placeholder="Customer Name,Phone,Event Date,Total Amount&#10;Ahmed Khan,03001234567,2025-12-15,250000"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              disabled={importing}
              className="font-mono text-xs"
            />
            {colCount > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Detected {colCount} columns · {dataRows.length} data row{dataRows.length === 1 ? "" : "s"}
                {hasHeader && " · first row treated as header"}
              </p>
            )}
          </section>

          {/* Step 3 — Column mapping */}
          {colCount > 0 && (
            <section className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  3. Map your columns
                </Label>
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={hasHeader}
                    onChange={(e) => setHasHeader(e.target.checked)}
                    disabled={importing}
                  />
                  First row is header
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {Array.from({ length: colCount }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-[10px] text-muted-foreground truncate">
                      Col {i + 1}{hasHeader && rows[0]?.[i] ? ` · "${rows[0][i]}"` : ""}
                    </p>
                    <Select
                      value={mapping[i] || "ignore"}
                      onValueChange={(v) => setColMapping(i, v as Field)}
                      disabled={importing}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(FIELD_LABELS) as Field[]).map((f) => (
                          <SelectItem key={f} value={f} className="text-xs">
                            {FIELD_LABELS[f]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              {missingRequired.length > 0 && (
                <div className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Still need to map: <strong>{missingRequired.map((f) => FIELD_LABELS[f]).join(", ")}</strong>
                  </span>
                </div>
              )}
            </section>
          )}

          {/* Step 4 — Preview */}
          {dataRows.length > 0 && missingRequired.length === 0 && (
            <section className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                4. Preview (first {Math.min(5, dataRows.length)} of {dataRows.length})
              </Label>
              <div className="rounded-md border text-xs max-h-48 overflow-auto">
                <div className="grid grid-cols-5 px-2 py-1.5 bg-muted/40 font-semibold text-[10px] uppercase tracking-wide sticky top-0">
                  <div>Name</div>
                  <div>Phone</div>
                  <div>Date</div>
                  <div className="text-right">Amount</div>
                  <div>Status</div>
                </div>
                {preview.map((p, i) => (
                  <div key={i} className="grid grid-cols-5 px-2 py-1.5 border-t">
                    <div className="truncate">{p.customerName || "—"}</div>
                    <div className="truncate">{p.customerPhone || "—"}</div>
                    <div className="truncate">{p.bookingDate || "—"}</div>
                    <div className="text-right tabular-nums">{p.totalAmount || "—"}</div>
                    <div>
                      <Badge variant="outline" className="text-[9px]">
                        {p.paymentStatus || "Paid"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Step 5 — Dry-run + import */}
          {dataRows.length > 0 && missingRequired.length === 0 && (
            <section className="flex items-center justify-between rounded-md border p-2.5">
              <div className="flex items-center gap-2">
                <Switch checked={dryRun} onCheckedChange={setDryRun} disabled={importing} />
                <div>
                  <p className="text-xs font-semibold">Dry-run mode</p>
                  <p className="text-[11px] text-muted-foreground">
                    Validates each row without writing. Toggle off when ready to commit.
                  </p>
                </div>
              </div>
              {!dryRun && (
                <Badge variant="outline" className="bg-rose-50 border-rose-200 text-rose-800 text-[10px]">
                  Will write to database
                </Badge>
              )}
            </section>
          )}

          {/* Result */}
          {result && (
            <section className={`rounded-md border p-3 space-y-1 ${
              result.failed > 0 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
            }`}>
              <div className="flex items-center gap-2">
                {result.failed > 0
                  ? <AlertTriangle className="h-4 w-4 text-amber-700" />
                  : <CheckCircle2 className="h-4 w-4 text-emerald-700" />}
                <p className="text-sm font-semibold">
                  {result.dryRun ? "Dry-run summary" : "Import complete"}
                </p>
              </div>
              <p className="text-xs">
                <span className="font-semibold tabular-nums text-emerald-700">{result.imported}</span> {result.dryRun ? "would import" : "imported"}
                {" · "}
                <span className="font-semibold tabular-nums text-rose-700">{result.failed}</span> failed
              </p>
              {result.errors.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                    First errors:
                  </p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-[11px] text-rose-700 font-mono">{e}</p>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={importing}>
            Close
          </Button>
          <Button
            onClick={doImport}
            disabled={
              importing
              || loadingBiz
              || !businessId
              || dataRows.length === 0
              || missingRequired.length > 0
            }
          >
            {importing && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {dryRun ? (
              <>Dry-run <ArrowRight className="ml-1 h-3.5 w-3.5" /></>
            ) : (
              <>Import {dataRows.length || ""} <Upload className="ml-1 h-3.5 w-3.5" /></>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
