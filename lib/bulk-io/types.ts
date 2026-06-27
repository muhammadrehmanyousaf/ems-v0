/**
 * Per-domain bulk-import configuration. Each list screen that supports import
 * declares one of these (in lib/bulk-io/<domain>.ts) and passes it to
 * <BulkImportDialog>. Keeps the importer generic while each domain owns its
 * field schema + commit logic.
 */
export type BulkFieldType = "string" | "number" | "email" | "phone" | "date" | "enum"

export interface BulkField {
  /** Internal key passed to importRow. */
  key: string
  /** Human label shown in the column-mapping step. */
  label: string
  required?: boolean
  type?: BulkFieldType
  /** Allowed values for type "enum". */
  options?: string[]
  /** Header aliases auto-detected from the uploaded file (lowercased contains). */
  aliases?: string[]
  /** Extra per-cell validation → error string, or null if ok. */
  validate?: (value: string, row: Record<string, string>) => string | null
}

export type ImportOutcome =
  | { result: "imported" }
  | { result: "skipped"; reason: string }
  | { result: "failed"; reason: string }

export interface BulkImportConfig {
  /** Domain id (for telemetry/filenames). */
  domain: string
  /** Singular entity label, e.g. "lead". */
  entityLabel: string
  fields: BulkField[]
  /** Commit one mapped row. Dedupe is expected to surface as "skipped". */
  importRow: (row: Record<string, string>) => Promise<ImportOutcome>
  /** Cap rows per import (default 1000). */
  maxRows?: number
}
