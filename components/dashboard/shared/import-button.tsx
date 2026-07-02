"use client"

/**
 * Shared "Import" button + dialog — surfaces the real bulk-import engine
 * (/api/v1/imports) next to each module's Export menu. Paste CSV/TSV or upload a
 * file → preview (dry-run) → commit. businessId is resolved from the active venue
 * (falls back to the vendor's first business). Gated on isBulkImportOn() (ON by
 * default). Supported targets: leads | expenses | staff.
 */
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Icon } from "@/components/dashboard/shared/icon"
import { bulkImportApi, type ImportPreview } from "@/lib/api/bulkImport"
import { isBulkImportOn } from "@/lib/bulk-import-flag"
import { useActiveBusinessStore } from "@/lib/store/active-business-store"
import { BusinessesAPI } from "@/lib/api/dashboard"

export function ImportButton({
  target,
  label,
  onDone,
}: {
  target: "leads" | "expenses" | "staff" | string
  label?: string
  onDone?: () => void
}) {
  const enabled = isBulkImportOn()
  const [open, setOpen] = React.useState(false)
  const [content, setContent] = React.useState("")
  const [preview, setPreview] = React.useState<ImportPreview | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)
  const activeBusinessId = useActiveBusinessStore((s) => s.activeBusinessId)
  const [bizId, setBizId] = React.useState<number | null>(activeBusinessId)

  React.useEffect(() => {
    if (activeBusinessId != null) { setBizId(activeBusinessId); return }
    BusinessesAPI.getUserBusinesses()
      .then((list) => { if (list?.length) setBizId(list[0].id) })
      .catch(() => {})
  }, [activeBusinessId, open])

  const reset = () => { setContent(""); setPreview(null); setErr(null) }
  const onFile = (f?: File) => {
    if (!f) return
    const r = new FileReader()
    r.onload = () => { setContent(String(r.result || "")); setPreview(null) }
    r.readAsText(f)
  }
  const doPreview = async () => {
    if (!bizId) { setErr("No venue found for your account."); return }
    setBusy(true); setErr(null)
    try { setPreview(await bulkImportApi.preview(bizId, { target, content })) }
    catch (e: any) { setErr(e?.response?.data?.message || "Preview failed.") }
    finally { setBusy(false) }
  }
  const doCommit = async () => {
    if (!bizId || !preview) return
    setBusy(true); setErr(null)
    try {
      await bulkImportApi.commit(bizId, preview.jobId)
      setOpen(false); reset(); onDone ? onDone() : window.location.reload()
    } catch (e: any) { setErr(e?.response?.data?.message || "Import failed.") }
    finally { setBusy(false) }
  }

  if (!enabled) return null
  const title = label || target

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Icon name="Upload" size={15} className="mr-1.5" /> Import
      </Button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="capitalize">Import {title}</DialogTitle>
            <DialogDescription>Upload or paste a CSV/TSV. We preview first — nothing is saved until you confirm.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values"
              onChange={(e) => onFile(e.target.files?.[0])} className="block w-full text-sm" />
            <textarea value={content} onChange={(e) => { setContent(e.target.value); setPreview(null) }}
              rows={6} placeholder="…or paste CSV / TSV rows here (first row = headers)"
              className="w-full rounded-md border border-input bg-background p-2 text-xs font-mono outline-none focus-visible:ring-2 ring-ring" />
            {err && <p className="text-sm text-red-600">{err}</p>}
            {preview && (
              <div className="rounded-md border p-3 text-sm space-y-1">
                <p><span className="font-medium">{preview.totalRows}</span> rows · <span className="text-green-600 font-medium">{preview.okRows} ready</span>{preview.errorRows > 0 && <> · <span className="text-red-600 font-medium">{preview.errorRows} with errors</span></>}</p>
                {preview.errors?.slice(0, 4).map((e, i) => (
                  <p key={i} className="text-xs text-red-500">row {e.row}: {e.errors.join(", ")}</p>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            {!preview ? (
              <Button onClick={doPreview} disabled={busy || !content.trim()}>{busy ? "Checking…" : "Preview"}</Button>
            ) : (
              <Button onClick={doCommit} disabled={busy || preview.okRows === 0}>{busy ? "Importing…" : `Import ${preview.okRows} rows`}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ImportButton
