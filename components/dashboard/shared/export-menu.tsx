"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/dashboard/shared/icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * ExportMenu — shared CSV + XLSX export for any list. Generalizes the old
 * per-domain CSV buttons. CSV is built natively (no dependency); XLSX uses a
 * dynamic import of SheetJS so it stays out of the main bundle.
 */
export interface ExportColumn<T> {
  /** Column header in the exported file. */
  header: string
  /** Cell value for a row (string/number; nullish → ""). */
  value: (row: T) => string | number | null | undefined
}

export interface ExportMenuProps<T> {
  rows: T[]
  columns: ExportColumn<T>[]
  /** Base filename without extension. */
  filename: string
  /** Optional async loader for "all pages" (server-paginated lists). */
  fetchAll?: () => Promise<T[]>
  label?: string
  className?: string
  /** When a selection exists, the menu also offers "export selected". */
  selectedIds?: Set<string>
  /** Row identity — must match the DataTable's getRowId for selection to resolve. */
  getRowId?: (row: T) => string
}

function escapeCsv(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

function toMatrix<T>(rows: T[], columns: ExportColumn<T>[]): (string | number)[][] {
  const header = columns.map((c) => c.header)
  const body = rows.map((r) =>
    columns.map((c) => {
      const v = c.value(r)
      return v === null || v === undefined ? "" : v
    }),
  )
  return [header, ...body]
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportMenu<T>({
  rows,
  columns,
  filename,
  fetchAll,
  label = "Export",
  className,
  selectedIds,
  getRowId,
}: ExportMenuProps<T>) {
  const [busy, setBusy] = React.useState(false)

  const selectedCount = selectedIds && getRowId ? rows.filter((r) => selectedIds.has(getRowId(r))).length : 0

  const resolveRows = async (selectedOnly?: boolean) => {
    const base = fetchAll ? await fetchAll() : rows
    if (selectedOnly && selectedIds && getRowId) return base.filter((r) => selectedIds.has(getRowId(r)))
    return base
  }

  const exportCsv = async (selectedOnly?: boolean) => {
    setBusy(true)
    try {
      const data = await resolveRows(selectedOnly)
      const matrix = toMatrix(data, columns)
      const csv = matrix.map((row) => row.map((c) => escapeCsv(String(c))).join(",")).join("\n")
      // Prepend BOM so Excel reads UTF-8 correctly.
      downloadBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }), `${filename}${selectedOnly ? "-selected" : ""}.csv`)
    } finally {
      setBusy(false)
    }
  }

  const exportXlsx = async (selectedOnly?: boolean) => {
    setBusy(true)
    try {
      const data = await resolveRows(selectedOnly)
      const XLSX = await import("xlsx")
      const matrix = toMatrix(data, columns)
      const ws = XLSX.utils.aoa_to_sheet(matrix)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Export")
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      downloadBlob(
        new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `${filename}${selectedOnly ? "-selected" : ""}.xlsx`,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        disabled={busy}
      >
        <Icon name="Download" size={14} />
        {label}
        <Icon name="ChevronDown" size={13} className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {selectedCount > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{selectedCount} selected</div>
            <DropdownMenuItem onClick={() => exportCsv(true)} className="gap-2">
              <Icon name="FileText" size={15} /> Selected → CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportXlsx(true)} className="gap-2">
              <Icon name="FileText" size={15} /> Selected → Excel
            </DropdownMenuItem>
            <div className="my-1 h-px bg-border" />
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">All rows</div>
          </>
        )}
        <DropdownMenuItem onClick={() => exportCsv(false)} className="gap-2">
          <Icon name="FileText" size={15} /> CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportXlsx(false)} className="gap-2">
          <Icon name="FileText" size={15} /> Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ExportMenu
