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
}: ExportMenuProps<T>) {
  const [busy, setBusy] = React.useState(false)

  const resolveRows = async () => (fetchAll ? await fetchAll() : rows)

  const exportCsv = async () => {
    setBusy(true)
    try {
      const data = await resolveRows()
      const matrix = toMatrix(data, columns)
      const csv = matrix.map((row) => row.map((c) => escapeCsv(String(c))).join(",")).join("\n")
      // Prepend BOM so Excel reads UTF-8 correctly.
      downloadBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`)
    } finally {
      setBusy(false)
    }
  }

  const exportXlsx = async () => {
    setBusy(true)
    try {
      const data = await resolveRows()
      const XLSX = await import("xlsx")
      const matrix = toMatrix(data, columns)
      const ws = XLSX.utils.aoa_to_sheet(matrix)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Export")
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      downloadBlob(
        new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `${filename}.xlsx`,
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
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={exportCsv} className="gap-2">
          <Icon name="FileText" size={15} /> CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportXlsx} className="gap-2">
          <Icon name="FileText" size={15} /> Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ExportMenu
