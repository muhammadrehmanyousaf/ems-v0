"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import type { BulkImportConfig, BulkField } from "@/lib/bulk-io/types"

/**
 * BulkImportDialog — shared CSV/XLSX importer. Upload → auto-map columns →
 * client-validate → preview (valid/invalid) → commit row-by-row via the
 * domain's importRow → result summary. Generalizes the old per-domain import
 * dialogs. XLSX parsing is dynamically imported (SheetJS).
 */
export interface BulkImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: BulkImportConfig
  /** Called after a completed import so the list can refetch. */
  onDone?: () => void
}

type Parsed = { headers: string[]; rows: string[][] }
type Mapping = Record<string, number> // fieldKey -> column index (-1 = ignore)
type Step = "upload" | "map" | "result"

const IGNORE = -1

function parseCsv(text: string): Parsed {
  const rows: string[][] = []
  let row: string[] = [], cur = "", inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++ } else inQ = false }
      else cur += c
    } else if (c === '"') inQ = true
    else if (c === ",") { row.push(cur); cur = "" }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      row.push(cur); cur = ""
      if (row.some((x) => x.trim() !== "")) rows.push(row)
      row = []
    } else cur += c
  }
  if (cur !== "" || row.length) { row.push(cur); if (row.some((x) => x.trim() !== "")) rows.push(row) }
  const [headers = [], ...body] = rows
  return { headers, rows: body }
}

function autoMap(fields: BulkField[], headers: string[]): Mapping {
  const m: Mapping = {}
  const lower = headers.map((h) => h.toLowerCase().trim())
  for (const f of fields) {
    const cands = [f.key.toLowerCase(), f.label.toLowerCase(), ...(f.aliases ?? []).map((a) => a.toLowerCase())]
    const idx = lower.findIndex((h) => cands.some((c) => h === c || h.includes(c)))
    m[f.key] = idx
  }
  return m
}

function validateCell(field: BulkField, value: string, row: Record<string, string>): string | null {
  const v = value.trim()
  if (!v) return field.required ? `${field.label} is required` : null
  if (field.type === "number" && isNaN(Number(v))) return `${field.label} must be a number`
  if (field.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return `${field.label} is not a valid email`
  if (field.type === "phone" && v.replace(/\D/g, "").length < 7) return `${field.label} looks too short`
  if (field.type === "enum" && field.options && !field.options.includes(v)) return `${field.label} must be one of: ${field.options.join(", ")}`
  return field.validate ? field.validate(v, row) : null
}

export function BulkImportDialog({ open, onOpenChange, config, onDone }: BulkImportDialogProps) {
  const [step, setStep] = React.useState<Step>("upload")
  const [parsed, setParsed] = React.useState<Parsed | null>(null)
  const [mapping, setMapping] = React.useState<Mapping>({})
  const [committing, setCommitting] = React.useState(false)
  const [summary, setSummary] = React.useState({ imported: 0, skipped: 0, failed: 0, errors: [] as string[] })
  const inputRef = React.useRef<HTMLInputElement>(null)
  const maxRows = config.maxRows ?? 1000

  const reset = () => { setStep("upload"); setParsed(null); setMapping({}); setSummary({ imported: 0, skipped: 0, failed: 0, errors: [] }) }

  const handleFile = async (file: File) => {
    let p: Parsed
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      const XLSX = await import("xlsx")
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: "array" })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false, raw: false })
      p = { headers: (aoa[0] ?? []).map(String), rows: aoa.slice(1).map((r) => r.map((c) => (c == null ? "" : String(c)))) }
    } else {
      p = parseCsv(await file.text())
    }
    setParsed(p)
    setMapping(autoMap(config.fields, p.headers))
    setStep("map")
  }

  // Build mapped rows + per-row validation for the preview.
  const mapped = React.useMemo(() => {
    if (!parsed) return [] as { row: Record<string, string>; errors: string[] }[]
    return parsed.rows.slice(0, maxRows).map((cells) => {
      const row: Record<string, string> = {}
      for (const f of config.fields) {
        const idx = mapping[f.key] ?? IGNORE
        row[f.key] = idx >= 0 ? (cells[idx] ?? "").trim() : ""
      }
      const errors = config.fields
        .map((f) => validateCell(f, row[f.key], row))
        .filter((e): e is string => !!e)
      return { row, errors }
    })
  }, [parsed, mapping, config.fields, maxRows])

  const validRows = mapped.filter((m) => m.errors.length === 0)
  const invalidCount = mapped.length - validRows.length

  const commit = async () => {
    setCommitting(true)
    const s = { imported: 0, skipped: 0, failed: 0, errors: [] as string[] }
    for (const { row } of validRows) {
      try {
        const out = await config.importRow(row)
        if (out.result === "imported") s.imported++
        else if (out.result === "skipped") { s.skipped++; if (s.errors.length < 20) s.errors.push(`Skipped: ${out.reason}`) }
        else { s.failed++; if (s.errors.length < 20) s.errors.push(`Failed: ${out.reason}`) }
      } catch (e: any) {
        s.failed++
        if (s.errors.length < 20) s.errors.push(`Failed: ${e?.message ?? "error"}`)
      }
    }
    setSummary(s)
    setStep("result")
    setCommitting(false)
    onDone?.()
  }

  const close = (o: boolean) => { if (!o) reset(); onOpenChange(o) }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import {config.entityLabel}s</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file — map the columns, preview, and import. Duplicates are skipped automatically.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center transition-colors hover:border-primary/50"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Icon name="Upload" size={24} />
            </span>
            <div className="text-sm font-medium text-foreground">Drop a CSV / Excel file, or click to browse</div>
            <div className="text-xs text-muted-foreground">
              Columns we'll look for: {config.fields.map((f) => f.label).join(", ")}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>
        )}

        {step === "map" && parsed && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {config.fields.map((f) => (
                <div key={f.key} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                  <span className="text-sm">
                    {f.label}
                    {f.required && <span className="ml-0.5 text-red-500">*</span>}
                  </span>
                  <Select
                    value={String(mapping[f.key] ?? IGNORE)}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: Number(v) }))}
                  >
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(IGNORE)}>— Ignore —</SelectItem>
                      {parsed.headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>{h || `Column ${i + 1}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 text-sm">
              <StatusPill tone="success">{validRows.length} ready</StatusPill>
              {invalidCount > 0 && <StatusPill tone="error">{invalidCount} with errors</StatusPill>}
              <span className="text-muted-foreground">of {mapped.length} rows{parsed.rows.length > maxRows ? ` (capped at ${maxRows})` : ""}</span>
            </div>

            {invalidCount > 0 && (
              <div className="max-h-32 overflow-auto rounded-md border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
                {mapped.filter((m) => m.errors.length).slice(0, 8).map((m, i) => (
                  <div key={i}>Row {i + 1}: {m.errors.join("; ")}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "result" && (
          <div className="space-y-3 py-2">
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="success">{summary.imported} imported</StatusPill>
              {summary.skipped > 0 && <StatusPill tone="warning">{summary.skipped} skipped</StatusPill>}
              {summary.failed > 0 && <StatusPill tone="error">{summary.failed} failed</StatusPill>}
            </div>
            {summary.errors.length > 0 && (
              <div className="max-h-40 overflow-auto rounded-md border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
                {summary.errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "map" && (
            <button
              type="button"
              onClick={commit}
              disabled={committing || validRows.length === 0}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {committing && <Spinner size={14} />}
              Import {validRows.length} {config.entityLabel}{validRows.length === 1 ? "" : "s"}
            </button>
          )}
          {step === "result" && (
            <button
              type="button"
              onClick={() => close(false)}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Done
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BulkImportDialog
