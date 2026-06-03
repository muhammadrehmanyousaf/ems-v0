"use client";

// 02-VR-RESILIENCE-V1 — IndexedDB blob store for vendor-registration image
// uploads.
//
// Why this exists:
//   * localStorage caps out at ~5 MB total and only holds strings — useless
//     for File objects.
//   * Vendors complain hardest about re-uploading photos. A single shop
//     photo is often 5–10 MB. Losing 10 of them on a refresh is what makes
//     them ragequit. This module persists the binary so refresh, tab close,
//     and even browser restart restore the same Files.
//   * Lives behind a thin wrapper so the rest of the app doesn't touch
//     IDB ergonomics directly.
//
// Design rules:
//   * SSR-safe — every call guards on `typeof window !== "undefined"`. On
//     the server it resolves to no-op promises so React render trees don't
//     blow up.
//   * Best-effort — any IDB failure (private browsing, Safari quirks,
//     quota exceeded) resolves silently so the form keeps working. The
//     localStorage + server layers are the durable ones for non-binary data.
//   * Single store, two object stores: "blobs" keyed by uuid, "meta" for
//     bookkeeping (creation time → for TTL sweep).
//   * 30-day TTL aligned with localDraftStore. A sweep runs on first open.

const DB_NAME = "ww-vendor-blobs";
const DB_VERSION = 1;
const BLOB_STORE = "blobs";
const META_STORE = "meta";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface BlobRecord {
  id: string;
  file: Blob;
  filename: string;
  createdAt: number;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!isBrowser()) return Promise.reject(new Error("idb-unavailable"));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "k" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("idb-blocked"));
  });
  return dbPromise;
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (stores: { blobs: IDBObjectStore; meta: IDBObjectStore }) => Promise<T> | T,
): Promise<T> {
  return openDb().then((db) =>
    new Promise<T>((resolve, reject) => {
      const transaction = db.transaction([BLOB_STORE, META_STORE], mode);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
      const stores = {
        blobs: transaction.objectStore(BLOB_STORE),
        meta: transaction.objectStore(META_STORE),
      };
      Promise.resolve(run(stores))
        .then((r) => resolve(r))
        .catch(reject);
    }),
  );
}

function uuid(): string {
  // Prefer crypto.randomUUID where supported, fallback for older Safari.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = (globalThis as any).crypto;
    if (c?.randomUUID) return c.randomUUID();
  } catch {/* noop */}
  return "blob-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Persist a File / Blob and return its assigned id. Caller stores the id
 * inside the localDraft `imageRefs` so it can be restored on next mount.
 * Resolves to null on any IDB failure — caller should treat that as
 * "image is in memory only" and not block the form.
 */
export async function putBlob(file: File | Blob, filename?: string): Promise<string | null> {
  if (!isBrowser()) return null;
  try {
    const id = uuid();
    await tx("readwrite", ({ blobs }) =>
      new Promise<void>((resolve, reject) => {
        const rec: BlobRecord = {
          id,
          file,
          filename: filename ?? (file instanceof File ? file.name : "blob"),
          createdAt: Date.now(),
        };
        const r = blobs.put(rec);
        r.onsuccess = () => resolve();
        r.onerror = () => reject(r.error);
      }),
    );
    return id;
  } catch {
    return null;
  }
}

/**
 * Read a Blob back as a fresh File. Returns null if missing or the IDB
 * couldn't be opened. Restored Files preserve the original filename so
 * downstream FormData uploads behave identically to a brand-new pick.
 */
export async function getBlob(id: string): Promise<File | null> {
  if (!isBrowser() || !id) return null;
  try {
    return await tx("readonly", ({ blobs }) =>
      new Promise<File | null>((resolve, reject) => {
        const r = blobs.get(id);
        r.onsuccess = () => {
          const rec = r.result as BlobRecord | undefined;
          if (!rec) return resolve(null);
          if (rec.file instanceof File) return resolve(rec.file);
          // Wrap raw Blob as a File so the rest of the form treats it uniformly.
          resolve(new File([rec.file], rec.filename, { type: (rec.file as Blob).type || "application/octet-stream" }));
        };
        r.onerror = () => reject(r.error);
      }),
    );
  } catch {
    return null;
  }
}

/** Delete a single blob by id. Silent on failure. */
export async function deleteBlob(id: string): Promise<void> {
  if (!isBrowser() || !id) return;
  try {
    await tx("readwrite", ({ blobs }) =>
      new Promise<void>((resolve) => {
        const r = blobs.delete(id);
        r.onsuccess = () => resolve();
        r.onerror = () => resolve();
      }),
    );
  } catch {/* noop */}
}

/** Wipe every blob. Called from clearLocalDraft on successful submit. */
export async function clearAllBlobs(): Promise<void> {
  if (!isBrowser()) return;
  try {
    await tx("readwrite", ({ blobs }) =>
      new Promise<void>((resolve) => {
        const r = blobs.clear();
        r.onsuccess = () => resolve();
        r.onerror = () => resolve();
      }),
    );
  } catch {/* noop */}
}

/**
 * Drop blobs older than the TTL. Idempotent. Safe to call on every page
 * mount so stale uploads from abandoned registrations don't sit in the
 * user's quota forever.
 */
export async function sweepExpiredBlobs(): Promise<void> {
  if (!isBrowser()) return;
  const cutoff = Date.now() - TTL_MS;
  try {
    await tx("readwrite", ({ blobs }) =>
      new Promise<void>((resolve) => {
        const req = blobs.openCursor();
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) return resolve();
          const rec = cursor.value as BlobRecord;
          if (rec.createdAt < cutoff) cursor.delete();
          cursor.continue();
        };
        req.onerror = () => resolve();
      }),
    );
  } catch {/* noop */}
}
