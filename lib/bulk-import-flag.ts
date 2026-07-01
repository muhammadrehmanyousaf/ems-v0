// Bulk import (paste/upload CSV or TSV → preview → commit) — feature flag (OFF by
// default). While unset the import panel does not render and /api/v1/imports 404s.
//
//   NEXT_PUBLIC_BULK_IMPORT_ON=true   → render the bulk-import panel
//   (unset / anything else)           → OFF (default)

// GA'd — ON by default. Still killable: set NEXT_PUBLIC_BULK_IMPORT_ON="false".
const ON = process.env.NEXT_PUBLIC_BULK_IMPORT_ON !== "false"

/** Whether the bulk-import surface should render. ON by default. */
export function isBulkImportOn(_businessId?: number | string | null): boolean {
  return ON
}

export const BULK_IMPORT_ON = isBulkImportOn()
