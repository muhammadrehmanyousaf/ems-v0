// Bulk import — FE API client over the flag-gated /api/v1/imports surface.
// Paste/upload CSV or TSV, preview (dry-run), then commit. Dark until
// ENABLE_BULK_IMPORT — calls 404 until then; gate UI on isBulkImportOn().
import api from "@/lib/axiosConfig";

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export interface ImportTargetField {
  key: string;
  label: string;
  type: string;
  required: boolean;
}
export interface ImportTarget {
  target: string;
  label: string;
  model: string;
  fields: ImportTargetField[];
}
export interface ImportPreview {
  jobId: number;
  target: string;
  label: string;
  headers: string[];
  mapping: Record<string, string>;
  totalRows: number;
  okRows: number;
  errorRows: number;
  sampleOk: Record<string, unknown>[];
  errors: { row: number; errors: string[]; data: Record<string, string> }[];
}
export interface ImportJob {
  id: number;
  targetType: string;
  status: string;
  totalRows: number;
  okRows: number;
  errorRows: number;
  createdAt: string;
}

const BASE = "/api/v1/imports";

export const bulkImportApi = {
  targets: (businessId?: number): Promise<{ targets: ImportTarget[]; maxRows: number }> =>
    unwrap(api.get(`${BASE}/targets`, { params: businessId ? { businessId } : {} })),
  preview: (businessId: number, body: { target: string; content: string; format?: "csv" | "tsv"; mapping?: Record<string, string> }): Promise<ImportPreview> =>
    unwrap<ImportPreview>(api.post(`${BASE}/business/${businessId}/preview`, body)),
  commit: (businessId: number, jobId: number): Promise<{ jobId: number; created: number; ids: number[] }> =>
    unwrap(api.post(`${BASE}/business/${businessId}/commit/${jobId}`, {})),
  jobs: (businessId: number): Promise<ImportJob[]> => unwrap<ImportJob[]>(api.get(`${BASE}/business/${businessId}/jobs`)),
};
