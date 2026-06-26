# Shared Bulk Import / Export — Foundation Spec

Status: spec / not yet built
Owner: dashboard platform
Scope: a single, reusable import + export layer that every list screen plugs into, generalizing the three implementations that already exist.

---

## 0. Why this exists (and what we are NOT reinventing)

Bulk IO is already shipped, three times, with three slightly different shapes:

| Existing file | Export | Import | Notes |
|---|---|---|---|
| `lib/utils/csv-export.ts` (`exportTableToCSV`) | CSV from a live TanStack `Table` (visible cols, filtered rows) | — | Quotes correctly, no BOM, current-page only |
| `components/.../customers/.../import-customers-dialog.tsx` | — | CSV paste/upload → map → preview → **per-row loop POST** `/offlineCustomers` | Dedup = backend unique phone. No bulk endpoint. |
| `components/.../bookings/import-bookings-dialog.tsx` + `export-bookings-button.tsx` | CSV by **paginating the GET** (all pages, BOM, hard cap 5000) | CSV map → preview → **single bulk POST** `/bookings/bulk-import` (dry-run, server transaction) | Different commit model than customers |

The two **divergences we must absorb**, not erase:

1. **Commit model.** Customers loops the existing `create` endpoint client-side; bookings calls a dedicated server bulk endpoint with a transaction + dry-run. The shared layer must support **both** behind one `importRow`-style contract.
2. **Export source.** `csv-export.ts` reads a `Table` (current page); `export-bookings-button.tsx` refetches every page. The shared `ExportMenu` must support **both** ("this view" vs "all pages").

Everything below generalizes these. The existing CSV escaping (`/[",\n\r]/`, double-quote doubling) and the Excel BOM trick are **kept verbatim** — they are correct and battle-tested.

---

## 1. Spreadsheet library decision

**No spreadsheet/CSV lib is currently installed** (checked `package.json`: no `xlsx`, `sheetjs`, `papaparse`, `exceljs`). CSV is hand-rolled in three places.

**Recommendation: SheetJS Community Edition — `xlsx`.**

- License: **Apache-2.0** (license-clean, permissive, no copyleft).
- Smallest mature option that does **both read and write** of `.xlsx` (and `.xls`, `.csv`) in the browser.
- `exceljs` is heavier (styling engine we don't need) and MIT but ~2x bundle; `papaparse` is CSV-only (no XLSX write). SheetJS wins on "one lib, both formats, both directions."
- Bundle concern: import it **dynamically** (`await import("xlsx")`) only inside the export/import handlers so it never lands in the initial dashboard bundle.

**Install (pin the CE build from the SheetJS CDN, NOT the abandoned npm `xlsx` which is stale):**

```bash
npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

> If the team prefers the npm registry for CI mirroring reasons, `npm i xlsx@0.18.5` is acceptable but is the older registry build; the CDN tarball above is the current maintained CE release. Either exposes the same `read`/`utils.book_new`/`writeFile` API used below.

If XLSX turns out to be unwanted weight, the layer **degrades to CSV-only** with zero code changes to callers (the `ExportMenu` simply hides the XLSX item when `xlsx` fails to import).

---

## 2. Directory layout

```
lib/bulk-io/
  types.ts            # shared TS contracts (BulkField, ExportColumn, BulkImportConfig, ...)
  csv.ts              # parseDelimited(), rowsToCsv(), downloadBlob()  (lifted from the 3 dupes)
  xlsx.ts             # dynamic-import wrappers: parseSheet(), exportXlsx()
  validate.ts         # coerceAndValidate(row, fields) → { values, errors }
  registry.ts         # getBulkConfig(domain) lookup
  leads.ts            # ONE worked per-domain config (export columns + import schema + importRow)
  suppliers.ts        # (additional domains follow the same shape)
  ...

components/dashboard/shared/
  export-menu.tsx     # primitive #1
  bulk-import-dialog.tsx  # primitive #2
```

Per-domain files declare **one object** that drives both export columns and import schema, so a list screen wires bulk IO in ~3 lines.

---

## 3. Shared TypeScript contracts (`lib/bulk-io/types.ts`)

```ts
import type { Table } from "@tanstack/react-table";

/** Primitive cell types we know how to coerce + validate. */
export type FieldType = "string" | "number" | "integer" | "boolean" | "date" | "email" | "phone" | "enum";

/** One importable field for a domain. Drives auto-detect, mapping UI, and validation. */
export interface BulkField<TRow = Record<string, unknown>> {
  /** Stable key sent to importRow (e.g. "customerPhone"). */
  key: string;
  /** Human label shown in the mapping dropdown (e.g. "Phone *"). */
  label: string;
  /** Required → row is invalid (not skipped silently) if empty. */
  required?: boolean;
  type: FieldType;
  /** For type:"enum" — allowed values (case-insensitive match, coerced to canonical). */
  options?: readonly string[];
  /** Header-matching hints for auto-detect, in addition to label/key. Plain substrings or RegExp. */
  aliases?: (string | RegExp)[];
  /**
   * Custom per-cell validator. Return a string = error message, or null/undefined = ok.
   * Runs AFTER type coercion; receives the coerced value + the whole partial row.
   */
  validate?: (value: unknown, row: Partial<TRow>) => string | null | undefined;
  /** Optional transform applied after coercion + validation (e.g. normalize phone to E.164). */
  transform?: (value: unknown) => unknown;
}

/** A single export column. Generalizes the {key,label} arrays already used. */
export interface ExportColumn<TRow = Record<string, unknown>> {
  key: string;
  label: string;
  /** Optional cell formatter (e.g. Rs formatting, date → ISO). Defaults to String(value). */
  accessor?: (row: TRow) => unknown;
}

/** Result of committing one row. importRow resolves this instead of throwing for "expected" outcomes. */
export type ImportOutcome =
  | { status: "imported"; id?: string | number }
  | { status: "skipped"; reason: string }   // e.g. duplicate caught by backend unique constraint
  | { status: "failed"; reason: string };

/**
 * The per-domain commit function. ONE contract that covers BOTH models:
 *  - per-row loop (customers): importRow loops one create call; dialog calls it N times.
 *  - server bulk (bookings):  importRow ignores `index`, posts the whole `allRows` batch
 *                             on the first call and caches the response (see `mode`).
 */
export type ImportRowFn<TRow = Record<string, unknown>> = (args: {
  row: TRow;                 // validated + coerced values for this row
  index: number;             // 0-based row index
  allRows: TRow[];           // full validated batch (for bulk-endpoint domains)
  dryRun: boolean;           // when true, validate-only; importRow must not write
  signal?: AbortSignal;      // honor cancel
}) => Promise<ImportOutcome>;

/** Everything a domain needs to declare to get import + export. */
export interface BulkImportConfig<TRow = Record<string, unknown>> {
  domain: string;                       // "leads", "suppliers", ...
  entityLabel: string;                  // "lead" / "supplier" — used in copy
  fields: BulkField<TRow>[];
  /** "loop" = call importRow once per row; "bulk" = call once, importRow handles the batch. */
  mode: "loop" | "bulk";
  importRow: ImportRowFn<TRow>;
  /** Max rows per import (UI guard; mirror the bookings 200 cap). */
  maxRows?: number;
  /** Optional concurrency for mode:"loop" (default 1 = sequential, rate-limit safe). */
  concurrency?: number;
  /** Sample CSV download for the empty state. */
  sampleCsvUrl?: string;
  /** Optional pre-flight context picker (e.g. bookings "which business?"). */
  contextStep?: {
    label: string;
    load: () => Promise<{ id: string | number; label: string }[]>;
    required?: boolean;
  };
}

/** Export config for a domain (separate so export-only domains skip the import half). */
export interface BulkExportConfig<TRow = Record<string, unknown>> {
  domain: string;
  columns: ExportColumn<TRow>[];
  filenameBase: string;                 // "leads" → leads-2026-06-26.csv
  /** Refetch every page for the "All pages" option. Omit → export current view only. */
  fetchAll?: (signal?: AbortSignal) => Promise<TRow[]>;
}

export interface DomainBulkConfig<TRow = Record<string, unknown>> {
  export?: BulkExportConfig<TRow>;
  import?: BulkImportConfig<TRow>;
}
```

---

## 4. Shared CSV/XLSX utils (`lib/bulk-io/csv.ts`, `xlsx.ts`)

`csv.ts` is the de-duplicated lift of the parser/escaper that exists 3×:

```ts
// parseDelimited(text): string[][] — the exact quoted-field/CRLF parser from the dialogs.
// csvEscape(v), rowsToCsv(headers, rows): string — exact escaping from export-bookings-button.
// downloadBlob(filename, parts, mime) — Blob + BOM ('﻿') + click + revokeObjectURL.
export function parseDelimited(text: string): string[][] { /* lifted verbatim */ }
export function rowsToCsv(headers: string[], rows: string[][]): string { /* BOM-less body */ }
export function downloadBlob(filename: string, parts: BlobPart[], mime: string): void { /* + '﻿' BOM */ }
```

`xlsx.ts` keeps the heavy lib out of the main bundle:

```ts
export async function parseSheet(file: File): Promise<string[][]> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false, defval: "" });
}

export async function exportXlsx(filename: string, headers: string[], rows: (string | number)[][]): Promise<void> {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Export");
  XLSX.writeFile(wb, filename); // triggers browser download
}
```

A file is routed by extension: `.csv`/`.txt` → `parseDelimited(await file.text())`; `.xlsx`/`.xls` → `parseSheet(file)`. Both produce the same `string[][]`, so the mapping/validation/preview pipeline downstream is format-agnostic.

---

## 5. Validation (`lib/bulk-io/validate.ts`)

```ts
import type { BulkField } from "./types";

export interface RowValidation<TRow> {
  values: Partial<TRow>;
  errors: { field: string; message: string }[];
  status: "valid" | "invalid";
}

export function coerceAndValidate<TRow>(
  raw: Record<string, string>,        // { fieldKey: rawCellString } after mapping
  fields: BulkField<TRow>[],
): RowValidation<TRow> {
  const values: Record<string, unknown> = {};
  const errors: { field: string; message: string }[] = [];

  for (const f of fields) {
    const rawVal = (raw[f.key] ?? "").trim();
    if (!rawVal) {
      if (f.required) errors.push({ field: f.key, message: `${f.label} is required` });
      continue;
    }
    // coerce by f.type (number/integer/boolean/date/email/phone/enum), push error on bad coerce
    let coerced: unknown = coerceByType(rawVal, f, errors);
    if (coerced != null && f.validate) {
      const msg = f.validate(coerced, values as Partial<TRow>);
      if (msg) errors.push({ field: f.key, message: msg });
    }
    if (coerced != null && f.transform) coerced = f.transform(coerced);
    values[f.key] = coerced;
  }
  return { values: values as Partial<TRow>, errors, status: errors.length ? "invalid" : "valid" };
}
```

**Duplicate detection** is two-layered:
- **Client (best-effort):** within the uploaded batch, flag rows whose dedupe key (first `required && type:"phone"|"email"` field, or a domain-declared key) repeats → shown as `duplicate` in preview, still importable.
- **Authoritative:** the backend unique constraint. `importRow` returns `{status:"skipped", reason:"already exists"}` when the create call 409s / message matches `/exist/i` (exactly as customers does today). We **rely on the DB**, not client state, for correctness.

---

## 6. Primitive #1 — `ExportMenu` (`components/dashboard/shared/export-menu.tsx`)

A dropdown replacing the bare "Export CSV" buttons. Generalizes `exportTableToCSV` (keeps the CSV path) and adds XLSX + an "All pages" refetch option.

```tsx
"use client";

import { useState } from "react";
import type { Table } from "@tanstack/react-table";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { rowsToCsv, downloadBlob } from "@/lib/bulk-io/csv";
import { exportXlsx } from "@/lib/bulk-io/xlsx";
import type { ExportColumn } from "@/lib/bulk-io/types";

interface ExportMenuProps<TRow> {
  /** EITHER pass a TanStack table (current view) ... */
  table?: Table<TRow>;
  /** ... OR pass explicit rows. */
  rows?: TRow[];
  /** Column config. If omitted AND a table is given, derive from visible columns (like csv-export.ts). */
  columns?: ExportColumn<TRow>[];
  filenameBase: string;
  /** Enables the "All pages" item — refetches every page server-side. */
  fetchAll?: (signal?: AbortSignal) => Promise<TRow[]>;
  disabled?: boolean;
}

export function ExportMenu<TRow>({ table, rows, columns, filenameBase, fetchAll, disabled }: ExportMenuProps<TRow>) {
  const [busy, setBusy] = useState<null | string>(null);
  const stamp = new Date().toISOString().slice(0, 10);

  // Resolve {headers, matrix} from columns OR from the table's visible columns
  // (the exact filter from csv-export.ts: drop "select"/"actions", visible only).
  function resolve(data: TRow[]): { headers: string[]; matrix: (string | number)[][] } { /* ... */ }

  async function run(format: "csv" | "xlsx", scope: "view" | "all") {
    setBusy(`${format}-${scope}`);
    const controller = new AbortController();
    try {
      const data = scope === "all" && fetchAll
        ? await fetchAll(controller.signal)
        : rows ?? table!.getFilteredRowModel().rows.map((r) => r.original);
      if (!data.length) { toast.info("Nothing to export."); return; }
      const { headers, matrix } = resolve(data);
      const filename = `${filenameBase}-${scope === "all" ? "all-" : ""}${stamp}.${format}`;
      if (format === "csv") {
        downloadBlob(filename, [rowsToCsv(headers, matrix.map((r) => r.map(String)))], "text/csv;charset=utf-8");
      } else {
        await exportXlsx(filename, headers, matrix);
      }
      toast.success(`Exported ${data.length} ${data.length === 1 ? "row" : "rows"}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Export failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={disabled || !!busy}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-[11px]">This view</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => run("csv", "view")}><FileText className="mr-2 h-4 w-4" /> CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("xlsx", "view")}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel (.xlsx)</DropdownMenuItem>
        {fetchAll && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px]">All pages</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => run("csv", "all")}><FileText className="mr-2 h-4 w-4" /> CSV — all</DropdownMenuItem>
            <DropdownMenuItem onClick={() => run("xlsx", "all")}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel — all</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Backward-compat: `exportTableToCSV` stays exported (re-implemented on top of `ExportMenu.run("csv","view")` internals) so existing call sites don't break during migration.

---

## 7. Primitive #2 — `BulkImportDialog` (`components/dashboard/shared/bulk-import-dialog.tsx`)

Generic CSV/XLSX → auto-detect → map → validate → preview (valid / invalid / duplicate) → commit via injected `importRow` → result summary + downloadable error report. It is the merge of both existing dialogs, parameterized by a `BulkImportConfig`.

```tsx
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// ... Textarea, Select, Switch, Badge, icons ...
import { parseDelimited, downloadBlob, rowsToCsv } from "@/lib/bulk-io/csv";
import { parseSheet } from "@/lib/bulk-io/xlsx";
import { coerceAndValidate } from "@/lib/bulk-io/validate";
import type { BulkImportConfig, ImportOutcome } from "@/lib/bulk-io/types";

interface Props<TRow> {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  config: BulkImportConfig<TRow>;
  onImported?: () => void;
}

export function BulkImportDialog<TRow>({ open, onOpenChange, config, onImported }: Props<TRow>) {
  // state: raw grid (string[][]), hasHeader, mapping (colIdx → fieldKey|"ignore"),
  //        contextId (if config.contextStep), dryRun (default true ONLY if mode==="bulk"),
  //        running, progress, result, errorReportRows
  // pipeline:
  //   1. file/paste → route by extension → parseDelimited | parseSheet → grid
  //   2. autoDetect(headerCell, config.fields) using label/key/aliases → default mapping
  //   3. per data row → build {fieldKey: cell} → coerceAndValidate → tag valid|invalid|duplicate
  //   4. preview table: counts (valid / invalid / duplicate), first N rows colored by status
  //   5. commit:
  //        - mode==="loop": for each VALID row → await config.importRow({row,index,allRows,dryRun:false,signal})
  //              respect config.concurrency (default 1); per-row try/catch → outcome bucket
  //        - mode==="bulk": call config.importRow ONCE with index 0 + full allRows + dryRun flag;
  //              the domain fn posts the batch and maps the server response into outcomes
  //   6. tally imported/skipped/failed; collect failed/invalid rows into errorReportRows
  return (/* dialog JSX — steps gated like import-bookings-dialog */);
}
```

Key generic behaviors:

- **Auto-detect** uses `field.label`, `field.key`, and `field.aliases` (substring + RegExp) — replacing the hand-written `autoDetect` switch in each dialog.
- **Required-field guard** identical to bookings (`missingRequired` banner; commit disabled until mapped).
- **Preview buckets**: valid (green), invalid (amber, shows first error), duplicate (blue, in-batch repeat of dedupe key). Invalid rows are excluded from commit.
- **Dry-run** is shown only for `mode:"bulk"` (server supports it). `mode:"loop"` has no dry-run because committing one row at a time *is* the loop — instead it shows a live `progress %`.
- **Downloadable error report**: after commit, `Download error report` builds a CSV of every failed/invalid/skipped row = original cells + an appended `__error` column, via `rowsToCsv` + `downloadBlob`. This is the artifact a vendor fixes and re-uploads.

Result summary mirrors today's copy: `X imported · Y skipped (duplicate/empty) · Z failed`, plus first 5 inline errors and the report download.

---

## 8. Per-domain registry pattern (`lib/bulk-io/<domain>.ts`)

Each list screen declares export columns + import schema + commit fn in **one file**; `registry.ts` resolves by domain string so screens stay declarative.

```ts
// lib/bulk-io/registry.ts
import { leadsBulkConfig } from "./leads";
import { suppliersBulkConfig } from "./suppliers";
import type { DomainBulkConfig } from "./types";

const REGISTRY: Record<string, DomainBulkConfig<any>> = {
  leads: leadsBulkConfig,
  suppliers: suppliersBulkConfig,
  // bookings, customers, ... migrate here incrementally
};

export function getBulkConfig<T = any>(domain: string): DomainBulkConfig<T> | undefined {
  return REGISTRY[domain] as DomainBulkConfig<T> | undefined;
}
```

### Worked example — Leads (`lib/bulk-io/leads.ts`)

```ts
import axiosInstance from "@/lib/axiosConfig";
import { BACKEND_URL } from "@/lib/backend-url";
import type { DomainBulkConfig, BulkField, ExportColumn, ImportOutcome } from "./types";

interface LeadRow {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  status?: string;
  estimatedValue?: number;
  eventDate?: string;
  notes?: string;
}

const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;

const fields: BulkField<LeadRow>[] = [
  { key: "name", label: "Name *", required: true, type: "string", aliases: [/name|client|contact person/i] },
  {
    key: "phone", label: "Phone *", required: true, type: "phone",
    aliases: [/phone|mobile|cell|contact|number|no\b/i],
    validate: (v) => (PHONE_RE.test(String(v)) ? null : "Not a valid phone number"),
    transform: (v) => String(v).replace(/\s+/g, ""),
  },
  { key: "email", label: "Email", type: "email", aliases: [/e-?mail/i] },
  { key: "source", label: "Source", type: "enum", options: ["website", "referral", "walk-in", "social", "ads"], aliases: [/source|channel|via/i] },
  { key: "status", label: "Status", type: "enum", options: ["new", "contacted", "qualified", "won", "lost"], aliases: [/status|stage/i] },
  { key: "estimatedValue", label: "Estimated Value (Rs)", type: "number", aliases: [/value|budget|amount|worth/i] },
  { key: "eventDate", label: "Event Date", type: "date", aliases: [/date|when|event/i] },
  { key: "notes", label: "Notes", type: "string", aliases: [/note|remark|comment/i] },
];

const exportColumns: ExportColumn<LeadRow>[] = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "source", label: "Source" },
  { key: "status", label: "Status" },
  { key: "estimatedValue", label: "Estimated Value (Rs)" },
  { key: "eventDate", label: "Event Date" },
  { key: "notes", label: "Notes" },
];

export const leadsBulkConfig: DomainBulkConfig<LeadRow> = {
  export: {
    domain: "leads",
    columns: exportColumns,
    filenameBase: "leads",
    // "All pages": paginate the same list GET the table uses (mirrors export-bookings-button).
    fetchAll: async (signal) => {
      const all: LeadRow[] = [];
      let page = 1; const limit = 200; const cap = 5000;
      for (;;) {
        const res = await axiosInstance.get(`${BACKEND_URL}api/v1/leads`, { params: { page, limit }, signal });
        const batch: LeadRow[] = res.data?.data?.data ?? [];
        all.push(...batch);
        if (batch.length < limit || all.length >= cap) break;
        page += 1;
      }
      return all;
    },
  },
  import: {
    domain: "leads",
    entityLabel: "lead",
    fields,
    mode: "loop",          // no bulk endpoint — loop the existing create
    concurrency: 1,        // sequential = rate-limit safe
    maxRows: 500,
    sampleCsvUrl: "/samples/leads-import-template.csv",
    importRow: async ({ row, signal }): Promise<ImportOutcome> => {
      try {
        const res = await axiosInstance.post(`${BACKEND_URL}api/v1/leads`, row, { signal });
        return { status: "imported", id: res.data?.data?.id };
      } catch (e: any) {
        const msg = e?.response?.data?.message || "";
        if (/exist|duplicate/i.test(msg)) return { status: "skipped", reason: "already exists" };
        return { status: "failed", reason: msg || "create failed" };
      }
    },
  },
};
```

A list screen then wires both with no bespoke logic:

```tsx
const cfg = getBulkConfig<LeadRow>("leads")!;
<ExportMenu rows={leads} columns={cfg.export!.columns} filenameBase={cfg.export!.filenameBase} fetchAll={cfg.export!.fetchAll} />
<BulkImportDialog open={open} onOpenChange={setOpen} config={cfg.import!} onImported={refetch} />
```

---

## 9. Safety model

- **Per-row try/catch is mandatory** (`mode:"loop"`): one bad row never aborts the batch; it lands in `failed` with its message. (Exactly the customers pattern.)
- **No new bulk-write endpoint required** for loop domains — we reuse the existing `create` route. Only domains that *already* have a transactional bulk endpoint (bookings) use `mode:"bulk"`.
- **Dedupe relies on backend unique constraints**, never client state. Client in-batch duplicate flagging is advisory UI only. A 409 / "already exists" → `skipped`, not `failed`.
- **Rate-limit awareness**: `mode:"loop"` defaults to `concurrency: 1` (sequential). If a domain raises it, the dialog should add a small inter-batch delay and back off on HTTP 429 (retry-after honored) before marking `failed`. `maxRows` caps batch size (mirror bookings' 200; leads 500) to bound request volume and memory.
- **AbortSignal** threads from a Cancel button through `importRow`/`fetchAll` so a user can stop a long import/export.
- **Dynamic `xlsx` import** keeps the parser off the critical path and lets the feature degrade to CSV-only if the lib is absent.

### Export-only domains (no import half)

Read-only or computed datasets get `export` but **no** `import` in their `DomainBulkConfig`:

- **Payroll / payslips** — derived from shifts; importing would corrupt the ledger.
- **Reports / analytics / dashboards** — aggregates, not records.
- **Invoices & payment ledger / installments** — generated from bookings; export for accountants only.
- **Audit log / activity feed** — append-only system records.
- **Reviews / ratings** — user-generated; no manual insert path.

For these, screens render `<ExportMenu …>` alone; `getBulkConfig(domain)?.import` is `undefined`, so no import button appears.

---

## 10. Migration / rollout

1. Add `xlsx` (Section 1) + create `lib/bulk-io/{types,csv,xlsx,validate,registry}.ts` (utils lifted verbatim from the dupes — pure refactor, no behavior change).
2. Ship `ExportMenu` + `BulkImportDialog`. Keep `exportTableToCSV`, `ImportCustomersDialog`, `ImportBookingsDialog` working (re-implement them on the shared layer internally so call sites are untouched).
3. Author per-domain configs (leads first, then suppliers, then migrate customers→`mode:"loop"` and bookings→`mode:"bulk"`).
4. Swap call sites screen-by-screen; delete the three legacy files once parity is verified.

Every step is additive and backward-compatible — no existing screen breaks mid-migration.
