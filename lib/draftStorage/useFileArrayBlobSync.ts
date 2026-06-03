"use client";

// 03-DRAFT-RESILIENCE — file-array IndexedDB sync for any form with a
// `File[]` field (packages dialog images, review form photos, etc.).
//
// Distilled from useImageBlobSync which handles the three named image
// fields on the vendor-registration form. This one is intentionally
// shaped for the common case: a single flat File[] like
// `newImageFiles: File[]`.
//
// What it does:
//   * For each File in `files`, ensures a blob is stored in IndexedDB.
//     The File → blobId mapping is held in a WeakMap so we don't
//     re-upload the same File on every parent re-render.
//   * On every diff (file added or removed), calls `onIdsChange` with
//     the fresh id list. The caller stitches that into their
//     `useFormDraft` state so the draft remembers which blobs belong
//     where.
//   * Orphaned blobs (a File the parent removed from the array) are
//     reaped automatically on the next pass.
//
// On resume the caller uses `restoreFilesFromIds` to turn the id list
// back into Files ready to slot into form state. Missing blobs (e.g. an
// IDB clear after the draft was saved) resolve to skipped entries — the
// id list shrinks rather than throwing.

import { useEffect, useRef } from "react";
import { putBlob, deleteBlob, getBlob } from "./imageBlobStore";

interface UseFileArrayBlobSyncArgs {
  files: File[];
  /** Set to false to pause mirroring (e.g. after a successful submit). */
  enabled?: boolean;
  /**
   * Called whenever the id list changes (file added/removed/reordered).
   * Receives the canonical id order matching the current `files` order.
   */
  onIdsChange: (ids: string[]) => void;
}

export function useFileArrayBlobSync({
  files,
  enabled = true,
  onIdsChange,
}: UseFileArrayBlobSyncArgs): void {
  // File reference → blobId. WeakMap so dropped Files can be GC'd.
  const fileToId = useRef<WeakMap<File, string>>(new WeakMap());
  // All ids ever assigned by this hook instance. Used to reap orphans.
  const knownIds = useRef<Set<string>>(new Set());
  // Last id-list we reported — skip onIdsChange if nothing changed.
  const lastSig = useRef<string>("");

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      const ids: string[] = [];
      const refsLive = new Set<string>();

      for (const f of files) {
        let id = fileToId.current.get(f);
        if (!id) {
          const newId = await putBlob(f);
          if (!newId) continue; // IDB failure — skip silently
          fileToId.current.set(f, newId);
          knownIds.current.add(newId);
          id = newId;
        }
        ids.push(id);
        refsLive.add(id);
      }

      if (cancelled) return;

      // Reap ids no longer in the array.
      for (const id of Array.from(knownIds.current)) {
        if (!refsLive.has(id)) {
          deleteBlob(id).catch(() => null);
          knownIds.current.delete(id);
        }
      }

      const sig = ids.join(",");
      if (sig !== lastSig.current) {
        lastSig.current = sig;
        onIdsChange(ids);
      }
    })().catch(() => null);

    return () => { cancelled = true; };
  }, [enabled, files, onIdsChange]);
}

/**
 * Reverse of useFileArrayBlobSync — pulls Files back from IDB given
 * their stored id list. Used on resume.
 *
 * Missing blobs (IDB cleared, blob expired) resolve to null and are
 * filtered out, so a partially-corrupted IDB still hydrates whatever
 * survived. The order of the returned array matches the input order.
 */
export async function restoreFilesFromIds(ids: string[] | undefined): Promise<File[]> {
  if (!ids || ids.length === 0) return [];
  const out: File[] = [];
  for (const id of ids) {
    if (!id) continue;
    const f = await getBlob(id);
    if (f) out.push(f);
  }
  return out;
}
