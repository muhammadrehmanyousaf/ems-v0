"use client";

// 02-VR-RESILIENCE-V1 — image blob persistence for the registration form.
//
// localStorage can't hold File objects (and even if it could, the 5 MB cap
// would make vendor photo uploads impossible). This hook mirrors the three
// image fields on FormType into IndexedDB on every change:
//
//   profileImageFile : File | null
//   imageFiles       : File[]
//   packageImageFiles: File[][]
//
// For each File we keep a stable blob-id via a WeakMap keyed by the File
// object itself. That avoids re-uploading the same File on every parent
// re-render, and lets us reap dropped files cleanly.
//
// The resulting id-map (`imageRefs`) is handed to the caller via
// `onChangeRefs`. The caller stitches it into `queueLocalDraftSave` so the
// local draft remembers which blob belongs in which slot.
//
// Restoration on resume is in `restoreImageBlobsFromRefs` below — it does
// the reverse: id-map → fresh Files ready to slot back into formData.

import { useEffect, useRef } from "react";
import { putBlob, deleteBlob, getBlob } from "./imageBlobStore";

export interface ImageRefs {
  profileImageFile?: string | null;
  imageFiles?: string[];
  packageImageFiles?: string[][];
}

interface UseImageBlobSyncArgs {
  profileImageFile: File | null | undefined;
  imageFiles: File[] | undefined;
  packageImageFiles: File[][] | undefined;
  /** Set to false to disable mirroring (e.g. after submit). */
  enabled?: boolean;
  /** Called whenever the id-map changes so the caller can persist it. */
  onChangeRefs: (refs: ImageRefs) => void;
}

export function useImageBlobSync({
  profileImageFile,
  imageFiles,
  packageImageFiles,
  enabled = true,
  onChangeRefs,
}: UseImageBlobSyncArgs): void {
  // File → blob-id. Lives across renders without holding the File strongly.
  const fileToId = useRef<WeakMap<File, string>>(new WeakMap());
  // All ids we've ever assigned. Used to reap orphaned blobs on every pass.
  const knownIds = useRef<Set<string>>(new Set());
  // Most recent successful refs payload — so we can skip a no-op
  // onChangeRefs call when nothing actually changed.
  const lastSerialized = useRef<string>("");

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      const refsLive = new Set<string>();

      const idFor = async (f: File | null | undefined): Promise<string | null> => {
        if (!f) return null;
        let id = fileToId.current.get(f);
        if (!id) {
          const newId = await putBlob(f);
          if (!newId) return null;
          fileToId.current.set(f, newId);
          knownIds.current.add(newId);
          id = newId;
        }
        refsLive.add(id);
        return id;
      };

      const profileRef = await idFor(profileImageFile ?? null);

      const imageRefs: string[] = [];
      for (const f of imageFiles ?? []) {
        const id = await idFor(f);
        if (id) imageRefs.push(id);
      }

      const packageRefs: string[][] = [];
      for (const arr of packageImageFiles ?? []) {
        const inner: string[] = [];
        for (const f of arr ?? []) {
          const id = await idFor(f);
          if (id) inner.push(id);
        }
        packageRefs.push(inner);
      }

      if (cancelled) return;

      // Reap ids no longer present in any slot.
      for (const id of Array.from(knownIds.current)) {
        if (!refsLive.has(id)) {
          deleteBlob(id).catch(() => null);
          knownIds.current.delete(id);
        }
      }

      const next: ImageRefs = {
        profileImageFile: profileRef,
        imageFiles: imageRefs,
        packageImageFiles: packageRefs,
      };
      const sig = JSON.stringify(next);
      if (sig !== lastSerialized.current) {
        lastSerialized.current = sig;
        onChangeRefs(next);
      }
    })().catch(() => null);

    return () => { cancelled = true; };
  }, [enabled, profileImageFile, imageFiles, packageImageFiles, onChangeRefs]);
}

/**
 * Reverse of useImageBlobSync — turns an id-map back into Files. Used on
 * resume so the gallery, brand logo, and per-package images come back
 * exactly as they were before refresh.
 *
 * Missing blob ids resolve to nulls and are filtered out, so a partially
 * corrupted IndexedDB still hydrates whatever survived.
 */
export async function restoreImageBlobsFromRefs(refs: ImageRefs | undefined): Promise<{
  profileImageFile: File | null;
  imageFiles: File[];
  packageImageFiles: File[][];
}> {
  if (!refs) {
    return { profileImageFile: null, imageFiles: [], packageImageFiles: [] };
  }
  const profile = refs.profileImageFile ? await getBlob(refs.profileImageFile) : null;

  const gallery: File[] = [];
  for (const id of refs.imageFiles ?? []) {
    if (!id) continue;
    const f = await getBlob(id);
    if (f) gallery.push(f);
  }

  const pkg: File[][] = [];
  for (const arr of refs.packageImageFiles ?? []) {
    const inner: File[] = [];
    for (const id of arr ?? []) {
      if (!id) continue;
      const f = await getBlob(id);
      if (f) inner.push(f);
    }
    pkg.push(inner);
  }

  return {
    profileImageFile: profile,
    imageFiles: gallery,
    packageImageFiles: pkg,
  };
}
