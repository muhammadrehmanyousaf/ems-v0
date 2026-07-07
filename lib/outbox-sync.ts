/**
 * Phase-3 EPIC 4 · PWA-02 — outbox flush + reconnect sync.
 *
 * Replays the offline queue (lib/outbox) to POST /api/v1/sync/outbox when the
 * browser comes back online. The backend applies each op idempotently, so a
 * flush that is interrupted and retried can never double-apply.
 *
 * Resolution per op:
 *  - applied / duplicate → remove from the queue (done).
 *  - conflict / failed   → remove from the queue AND surface for the PWA-03
 *    conflict UX (retrying a deterministic reject would loop forever).
 * If the POST itself fails (still no network), nothing is removed — we retry on
 * the next `online` event.
 */

import axiosInstance from "@/lib/axiosConfig";
import { isOutboxEnabled, listOps, removeOp, countOps, notifyChange, type OutboxOp } from "@/lib/outbox";

export interface SyncOpResult {
  key: string;
  status: "applied" | "conflict" | "failed";
  result?: unknown;
  error?: string;
  duplicate?: boolean;
}

export interface OutboxConflict {
  op: OutboxOp;
  status: "conflict" | "failed";
  error?: string;
}

const CONFLICT_EVENT = "ww-outbox-conflict";
let flushing = false;

/** Flush the queue once. Safe to call repeatedly (no-op when disabled/empty/offline). */
export async function flushOutbox(): Promise<{ synced: number; conflicts: number } | null> {
  if (!isOutboxEnabled() || flushing) return null;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return null;
  const ops = await listOps();
  if (ops.length === 0) return { synced: 0, conflicts: 0 };

  flushing = true;
  notifyChange();
  try {
    const batch = ops.map((o) => ({ key: o.key, opType: o.opType, payload: o.payload, deviceSerial: o.deviceSerial }));
    const res = await axiosInstance.post("/api/v1/sync/outbox", { ops: batch });
    const results: SyncOpResult[] = res.data?.data?.results ?? [];
    const byKey = new Map(results.map((r) => [r.key, r]));

    let synced = 0;
    const conflicts: OutboxConflict[] = [];
    for (const op of ops) {
      const r = byKey.get(op.key);
      if (!r) continue; // not acknowledged (shouldn't happen) → leave queued for retry
      if (r.status === "applied") {
        await removeOp(op.key);
        synced += 1;
      } else {
        // conflict or deterministic failure — drop it and hand to the conflict UX.
        await removeOp(op.key);
        conflicts.push({ op, status: r.status, error: r.error });
      }
    }
    if (conflicts.length && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(CONFLICT_EVENT, { detail: conflicts }));
    }
    return { synced, conflicts: conflicts.length };
  } catch {
    // Endpoint dark (404) or still no network — keep everything, retry later.
    return null;
  } finally {
    flushing = false;
    notifyChange();
  }
}

export function onOutboxConflict(fn: (conflicts: OutboxConflict[]) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const h = (e: Event) => fn((e as CustomEvent<OutboxConflict[]>).detail);
  window.addEventListener(CONFLICT_EVENT, h);
  return () => window.removeEventListener(CONFLICT_EVENT, h);
}

let initialized = false;
/** Wire the reconnect listener once (called from the OutboxStatus indicator). */
export function initOutboxSync(): void {
  if (initialized || typeof window === "undefined" || !isOutboxEnabled()) return;
  initialized = true;
  window.addEventListener("online", () => { void flushOutbox(); });
  // Attempt a flush on load in case ops were left from a prior session.
  void countOps().then((n) => { if (n > 0) void flushOutbox(); });
}

export function isFlushing(): boolean {
  return flushing;
}
