/**
 * Phase-3 EPIC 4 · PWA-02 — offline write outbox (IndexedDB queue).
 *
 * When the vendor is offline, a mutation is appended here instead of hitting the
 * network. On reconnect, lib/outbox-sync flushes the queue to the backend, which
 * applies each op idempotently (see outboxSyncService). Every op carries a stable
 * client-generated `key` so a replay can never double-apply.
 *
 * Dark by default: the feature only engages when isOutboxEnabled() is true AND the
 * browser is actually offline, so the online path is byte-identical when the flag
 * is off. No IndexedDB access happens at import time.
 */

export type OutboxOpType = "record_receipt";

export interface OutboxOp {
  key: string; // client-generated UUID — the idempotency key
  opType: OutboxOpType;
  payload: Record<string, unknown>;
  deviceSerial: number;
  createdAt: number;
  label?: string; // human summary for the pending list ("Rs 5,000 · cash")
}

const DB_NAME = "ww-outbox";
const STORE = "ops";
const DEVICE_KEY = "ww_device_serial";

/** Pilot flag — dark unless explicitly enabled for this deployment. */
export function isOutboxEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    process.env.NEXT_PUBLIC_FEAT_OFFLINE_OUTBOX === "true" ||
    window.localStorage?.getItem("FEAT_OFFLINE_OUTBOX") === "true"
  );
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/** A stable per-device serial (survives reloads; used only as a diagnostic tag). */
export function deviceSerial(): number {
  if (typeof window === "undefined") return 0;
  let s = window.localStorage?.getItem(DEVICE_KEY);
  if (!s) {
    s = String(Math.floor(Math.random() * 1_000_000_000));
    try { window.localStorage.setItem(DEVICE_KEY, s); } catch { /* private mode */ }
  }
  return Number(s) || 0;
}

function newKey(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  // Fallback for older browsers.
  return "k-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

/** Append an op to the outbox. Returns the created op (with its idempotency key). */
export async function enqueue(
  opType: OutboxOpType,
  payload: Record<string, unknown>,
  label?: string,
): Promise<OutboxOp> {
  const op: OutboxOp = { key: newKey(), opType, payload, deviceSerial: deviceSerial(), createdAt: Date.now(), label };
  await tx("readwrite", (s) => s.add(op));
  notifyChange();
  return op;
}

/** All queued ops, oldest first (the outbox is an ordered log). */
export async function listOps(): Promise<OutboxOp[]> {
  const all = await tx<OutboxOp[]>("readonly", (s) => s.getAll());
  return (all ?? []).sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeOp(key: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(key));
  notifyChange();
}

export async function countOps(): Promise<number> {
  try {
    return (await tx<number>("readonly", (s) => s.count())) ?? 0;
  } catch {
    return 0;
  }
}

// ── change notifications (so the status indicator can re-render) ─────────────
const CHANGE_EVENT = "ww-outbox-change";
export function notifyChange(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}
export function onOutboxChange(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, fn);
  return () => window.removeEventListener(CHANGE_EVENT, fn);
}
