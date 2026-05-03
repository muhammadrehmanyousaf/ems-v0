import axiosInstance from "../axiosConfig";
import { BACKEND_URL } from "../backend-url";

const v1 = `${BACKEND_URL}api/v1/admin`;

// BK-037 — admin force-majeure batch-cancel.
//
// Backend `runBatch` returns one of two shapes:
//   - dryRun:  { ok: true, dryRun: true, count, sampleIds: number[] }
//   - commit:  { ok: true, dryRun: false, total, succeeded, failed, skipped,
//                totalRefunded, results: Array<{ ok, bookingId, ... }> }

export interface ForceMajeureRequest {
  bookingDateFrom: string; // YYYY-MM-DD
  bookingDateTo: string;   // YYYY-MM-DD
  reason: string;          // ≥ 5 chars (audit trail)
  dryRun?: boolean;
}

export interface ForceMajeureDryRunResult {
  ok: true;
  dryRun: true;
  count: number;
  sampleIds: number[];
}

export interface ForceMajeureCommitResult {
  ok: true;
  dryRun: false;
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  totalRefunded: number;
  results: Array<{
    ok: boolean;
    bookingId: number;
    code?: string;
    error?: string;
    skipped?: boolean;
    totalRefunded?: number;
  }>;
}

export type ForceMajeureResult =
  | ForceMajeureDryRunResult
  | ForceMajeureCommitResult;

export class ForceMajeureAPI {
  static async run(body: ForceMajeureRequest): Promise<ForceMajeureResult> {
    const res = await axiosInstance.post(`${v1}/force-majeure-cancel`, body);
    return res.data?.data;
  }
}
