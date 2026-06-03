"use client";

// 02-VR-RESILIENCE-V1 — local (browser) draft persistence for the multi-step
// vendor registration form.
//
// Sits in front of the existing server-side draft sync (see useDraftSync).
// The server only kicks in once a valid email is typed; this layer covers
// the dangerous window before that — business-type pick + name + phone +
// the first half of step 1 — so a refresh at any moment is recoverable.
//
// Design rules:
//   * SSR-safe — every read/write guards on `typeof window !== "undefined"`.
//   * Versioned key — `ww-vendor-draft-v1`. Bump the suffix when FormType
//     shape changes incompatibly so stale drafts get ignored, not crashed.
//   * Strips the same fields useDraftSync strips (File / Blob / passwords).
//     Image binaries live in IndexedDB (see imageBlobStore.ts); only their
//     blob references are kept here.
//   * 30-day TTL. A draft older than that is treated as not-present.
//   * Debounced 500 ms — local storage is cheap but we still don't want a
//     write on every keystroke.
//   * Exposes `flushPending` for a `beforeunload` listener so the last
//     few hundred ms of typing aren't lost when the tab closes.

const STORAGE_KEY = "ww-vendor-draft-v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DEBOUNCE_MS = 500;

const STRIPPED_KEYS = new Set([
  "imageFiles",
  "packageImageFiles",
  "profileImageFile",
  "password",
  "re_enterPassword",
]);

export interface LocalDraft {
  v: 1;
  updatedAt: number;
  formData: Record<string, unknown>;
  currentStep: number;
  businessType: string;
  // References into imageBlobStore so we know what to restore. Shape mirrors
  // the FormType image fields exactly so restoration is mechanical.
  imageRefs?: {
    profileImageFile?: string | null;
    imageFiles?: string[];
    packageImageFiles?: string[][];
  };
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitise(formData: any): Record<string, unknown> {
  if (!formData || typeof formData !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(formData)) {
    if (STRIPPED_KEYS.has(k)) continue;
    if (v instanceof File || v instanceof Blob) continue;
    if (Array.isArray(v) && v.length > 0 && (v[0] instanceof File || v[0] instanceof Blob)) continue;
    // Nested File arrays (packageImageFiles is File[][]) — skip entirely.
    if (Array.isArray(v) && Array.isArray(v[0]) && v[0][0] instanceof File) continue;
    out[k] = v;
  }
  return out;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSnapshot: Omit<LocalDraft, "v" | "updatedAt"> | null = null;
const listeners = new Set<(d: LocalDraft | null) => void>();

/**
 * A snapshot is "meaningful" if the vendor has actually touched something —
 * picked a business type, typed any contact field, or set a name. The
 * initial all-defaults render IS NOT meaningful, and we MUST refuse to
 * overwrite a stored meaningful draft with one of these.
 *
 * This is the fix for the mount-overwrite race: on every page load, the
 * registration form's local-save effect fires once with the initial empty
 * formData. If that fired commit() blindly, it would destroy the previous
 * session's draft before the resume prompt could read it. So commit()
 * checks here before writing.
 */
function snapshotIsMeaningful(s: Omit<LocalDraft, "v" | "updatedAt">): boolean {
  if (s.businessType) return true;
  if (s.currentStep > 0) return true;
  const f = s.formData as Record<string, unknown>;
  if (!f) return false;
  const textKeys = [
    "fullName", "email", "phoneNumber", "name", "businessType",
    "city", "subArea", "officeAddress", "description",
    "whatsappNumber", "ownerName", "ownerBio",
  ];
  for (const k of textKeys) {
    if (typeof f[k] === "string" && (f[k] as string).trim() !== "") return true;
  }
  // Any non-empty subBusinessType / staff / package / image set counts too.
  if (Array.isArray(f.subBusinessType) && (f.subBusinessType as unknown[]).length > 0) return true;
  if (Array.isArray(f.staff) && (f.staff as unknown[]).length > 0) return true;
  if (s.imageRefs?.profileImageFile) return true;
  if (Array.isArray(s.imageRefs?.imageFiles) && s.imageRefs!.imageFiles!.length > 0) return true;
  return false;
}

function commit(snapshot: Omit<LocalDraft, "v" | "updatedAt">) {
  if (!isBrowser()) return;

  // Refuse to clobber a real draft with an empty one. This guards against
  // the page-load race where the form's local-save effect fires once with
  // initial empty state before the resume prompt's useEffect can read the
  // previous session. Without this, a refresh would silently destroy the
  // vendor's progress every single time.
  if (!snapshotIsMeaningful(snapshot)) {
    const existing = readStoredRaw();
    if (existing && snapshotIsMeaningful({
      formData: existing.formData,
      currentStep: existing.currentStep,
      businessType: existing.businessType,
      imageRefs: existing.imageRefs,
    })) {
      return; // keep the meaningful prior draft
    }
  }

  const record: LocalDraft = {
    v: 1,
    updatedAt: Date.now(),
    ...snapshot,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    for (const l of listeners) l(record);
  } catch {
    // Quota / private-browsing — silent. The server layer is the durable one.
  }
}

/**
 * Raw read without TTL enforcement or side-effect cleanup. Used internally
 * by commit() so the "is the existing draft meaningful?" check can fire
 * cheaply on every save without piggybacking the TTL sweep.
 */
function readStoredRaw(): LocalDraft | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 1) return null;
    return parsed as LocalDraft;
  } catch {
    return null;
  }
}

/**
 * Queue a write. Debounced ~500 ms; coalesces rapid keystrokes into one
 * `setItem` call. Callers should pass the *raw* form state — this function
 * sanitises internally.
 */
export function queueLocalDraftSave(args: {
  formData: any;
  currentStep: number;
  businessType: string;
  imageRefs?: LocalDraft["imageRefs"];
}): void {
  if (!isBrowser()) return;
  pendingSnapshot = {
    formData: sanitise(args.formData),
    currentStep: args.currentStep,
    businessType: args.businessType,
    imageRefs: args.imageRefs,
  };
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (pendingSnapshot) commit(pendingSnapshot);
    debounceTimer = null;
  }, DEBOUNCE_MS);
}

/**
 * Force any pending debounced write to flush synchronously. Wire to
 * `window.addEventListener("beforeunload", flushPendingLocalDraft)` so
 * closing the tab within the debounce window doesn't drop edits.
 */
export function flushPendingLocalDraft(): void {
  if (!isBrowser()) return;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (pendingSnapshot) commit(pendingSnapshot);
}

/**
 * Read the stored draft. Returns null when nothing's stored, the record is
 * malformed, or the TTL has expired (in which case it also clears the slot).
 */
export function readLocalDraft(): LocalDraft | null {
  if (!isBrowser()) return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Corrupt — drop it so we don't trip on it next time.
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
    return null;
  }
  if (!parsed || parsed.v !== 1 || typeof parsed.updatedAt !== "number") return null;
  if (Date.now() - parsed.updatedAt > TTL_MS) {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
    return null;
  }
  return parsed as LocalDraft;
}

/**
 * Wipe the stored draft. Call this on successful submission and when the
 * user explicitly chooses "discard" on the resume prompt.
 */
export function clearLocalDraft(): void {
  if (!isBrowser()) return;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  pendingSnapshot = null;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
  for (const l of listeners) l(null);
}

/**
 * Subscribe to local-draft updates. Fires after every successful commit
 * (and on clear). Useful for the autosave indicator UI.
 */
export function subscribeLocalDraft(cb: (d: LocalDraft | null) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
