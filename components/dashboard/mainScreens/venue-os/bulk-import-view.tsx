"use client";

/**
 * Bulk import panel — paste a CSV/TSV (from Excel "Save as CSV", Google Sheets
 * "Download as CSV", or a copy-paste of a Sheet/Word table), pick the target table,
 * PREVIEW (dry-run: see the detected column mapping + how many rows are OK vs have
 * errors, nothing is written), then COMMIT the valid rows. Gated on isBulkImportOn();
 * the backend 404s until ENABLE_BULK_IMPORT.
 */
import * as React from "react";
import { bulkImportApi, type ImportTarget, type ImportPreview } from "@/lib/api/bulkImport";
import { isBulkImportOn } from "@/lib/bulk-import-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function BulkImportView(): React.ReactElement | null {
  const enabled = isBulkImportOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [targets, setTargets] = React.useState<ImportTarget[]>([]);
  const [target, setTarget] = React.useState<string>("leads");
  const [content, setContent] = React.useState<string>("");
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [committed, setCommitted] = React.useState<number | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);
  const bid = Number(businessId);

  React.useEffect(() => {
    if (!enabled) return;
    bulkImportApi.targets().then((t) => setTargets(t.targets)).catch(() => undefined);
  }, [enabled]);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Bulk import is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk import (leads · expenses · staff)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-end gap-2">
          <label>
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <select value={target} onChange={(e) => { setTarget(e.target.value); setPreview(null); setCommitted(null); }} className="rounded border px-2 py-1">
            {(targets.length ? targets : [{ target: "leads", label: "Leads" }, { target: "expenses", label: "Expenses" }, { target: "staff", label: "Staff" }]).map((t) => (
              <option key={t.target} value={t.target}>{t.label}</option>
            ))}
          </select>
        </div>

        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); setPreview(null); setCommitted(null); }}
          placeholder={"Paste rows from Excel / Google Sheets / Word here.\nFirst line = column headers, e.g.:\nName, Phone, Event, Date\nAli Khan, 0300-1112222, Mehndi, 15/06/2026"}
          className="h-36 w-full rounded border px-2 py-1 font-mono text-xs"
        />

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void guard(async () => { setCommitted(null); setPreview(await bulkImportApi.preview(bid, { target, content })); })} disabled={!businessId || !content.trim() || busy}>
            Preview (dry-run)
          </Button>
          {preview && preview.okRows > 0 && committed === null && (
            <Button size="sm" onClick={() => void guard(async () => { const r = await bulkImportApi.commit(bid, preview.jobId); setCommitted(r.created); })} disabled={busy}>
              Import {preview.okRows} row{preview.okRows === 1 ? "" : "s"}
            </Button>
          )}
        </div>

        {preview && (
          <div className="space-y-2 rounded-md border p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{preview.okRows} OK</Badge>
              {preview.errorRows > 0 && <Badge variant="destructive">{preview.errorRows} with errors</Badge>}
              <span className="text-muted-foreground">of {preview.totalRows} rows</span>
              {committed !== null && <Badge className="bg-green-600">Imported {committed} ✓</Badge>}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {Object.entries(preview.mapping).map(([field, header]) => (
                <span key={field} className="text-muted-foreground"><span className="font-medium text-foreground">{field}</span> ← “{header}”</span>
              ))}
            </div>
            {preview.errors.length > 0 && (
              <div className="space-y-0.5 border-t pt-1">
                {preview.errors.map((e, i) => (
                  <p key={i} className="text-destructive">Row {e.row}: {e.errors.join("; ")}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {err && <p className="text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default BulkImportView;
