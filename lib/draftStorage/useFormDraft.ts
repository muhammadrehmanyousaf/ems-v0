"use client";

// 03-DRAFT-RESILIENCE — generic auto-save / resume hook usable on any form
// surface in the system.
//
// Distilled from the vendor-registration draft layer (see
// `localDraftStore.ts`). That implementation is form-specific (singletons,
// hardcoded key, FormType-specific "is this meaningful?" check). This hook
// generalises the same safety properties so we can apply them to:
//
//   * dashboard/business settings (basic-info, pricing, policies)
//   * package add/edit dialogs
//   * team-members / bank-details CRUD
//   * couple booking flow (when we wire it in)
//
// Safety properties preserved from the original implementation:
//
//   * SSR-safe (every read/write guards on typeof window).
//   * Debounced commit (default 500 ms) coalesces rapid keystrokes.
//   * Versioned key (`ww-form-draft:<your-key>:v1`). Bump suffix when the
//     consuming form's shape changes incompatibly so stale drafts are
//     ignored, not crashed.
//   * 30-day TTL by default; old drafts auto-purged on read.
//   * `beforeunload` / `pagehide` / `visibilitychange` flushes — closing the
//     tab inside the debounce window doesn't drop edits.
//   * **Meaningfulness guard** — refuses to overwrite a stored draft with
//     an empty mount-snapshot. This is the bug I shipped a fix for in the
//     vendor-reg path; bake it in here so no future caller can re-introduce.
//
// What's intentionally NOT here:
//
//   * Image / file persistence — Files can't be JSON-serialised. Forms with
//     uploads stitch IndexedDB persistence in alongside via
//     `imageBlobStore.ts`. Keep this hook lean.
//   * Server-side draft sync — that's an email-keyed pattern specific to
//     onboarding flows where the user isn't authenticated yet. Authed
//     dashboard forms can write directly to their own resource.
//
// Usage:
//
//   const { storedDraft, hasResumableDraft, lastSavedAt, saving, discard } =
//     useFormDraft({
//       storageKey: `business-basic-info-${business.id}`,
//       state: form.watch(),
//       isMeaningful: (s) => !!s.name || !!s.description,
//     });
//
//   {hasResumableDraft && (
//     <DraftResumeBanner
//       visible={true}
//       onResume={() => { form.reset(storedDraft!.state); discard(); }}
//       onDiscard={() => discard()}
//     />
//   )}
//
//   <AutoSaveIndicator lastSavedAt={lastSavedAt} saving={saving} />

import { useCallback, useEffect, useRef, useState } from "react";

const KEY_PREFIX = "ww-form-draft:";
const SCHEMA_VERSION = 1;

interface StoredDraft<T> {
  v: typeof SCHEMA_VERSION;
  updatedAt: number;
  state: T;
}

export interface UseFormDraftOpts<T> {
  /**
   * Unique key for this form surface. Will be prefixed with `ww-form-draft:`
   * and suffixed with the schema version. Keep it stable across renders.
   * For per-resource forms (e.g. business id), include the id in the key
   * so different resources don't share drafts.
   */
  storageKey: string;
  /**
   * Current form state. Pass the value, not a getter. Whatever shape your
   * form library exposes — react-hook-form's `form.watch()`, useState
   * value, context value — works. The hook JSON-serialises it.
   */
  state: T;
  /**
   * EDIT-MODE pristine snapshot. When provided, the hook automatically
   * treats "current state equals pristine" as not-meaningful (since the
   * user hasn't actually changed anything yet). This is the cleanest way
   * to wire the hook into an EDIT dialog where the initial form state
   * mirrors a server record.
   *
   * Either `pristineState` OR `isMeaningful` must be provided. If both
   * are passed, `isMeaningful` wins and `pristineState` is ignored.
   *
   * For CREATE flows, leave undefined and use `isMeaningful` to gate on
   * "user typed something".
   */
  pristineState?: T;
  /**
   * Custom meaningfulness predicate. Use when pristineState isn't
   * expressive enough — e.g. when only a SUBSET of fields counts as a
   * "real edit", or when the form has no edit-mode counterpart.
   */
  isMeaningful?: (state: T) => boolean;
  /** Override the default 30-day TTL (in ms). */
  ttlMs?: number;
  /** Override the default 500 ms debounce. */
  debounceMs?: number;
  /**
   * Set false to pause saves (e.g. after a successful submit so the
   * post-submit reset doesn't write an empty draft over the just-saved
   * record). Default true.
   */
  enabled?: boolean;
}

export interface UseFormDraftResult<T> {
  /** Most recent committed save timestamp; null until first save fires. */
  lastSavedAt: Date | null;
  /** True while the debounce timer is pending. */
  saving: boolean;
  /** The stored draft read on mount, or null if nothing fresh. */
  storedDraft: StoredDraft<T> | null;
  /** True iff a fresh stored draft exists and discard hasn't been called. */
  hasResumableDraft: boolean;
  /**
   * Wipe the stored draft. Call from your onSubmit success path and from
   * the resume banner's Discard handler.
   */
  discard: () => void;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Build the effective meaningfulness predicate from the two opt-in
 * mechanisms (`isMeaningful` vs `pristineState`). Explicit `isMeaningful`
 * wins; pristine comparison is the fallback for edit flows; if neither
 * is provided we always treat the state as meaningful (the caller chose
 * to opt out of safeguards).
 */
function buildIsMeaningful<T>(
  explicit: ((state: T) => boolean) | undefined,
  pristine: T | undefined,
): (state: T) => boolean {
  if (explicit) return explicit;
  if (pristine !== undefined) {
    let pristineSig: string;
    try {
      pristineSig = JSON.stringify(pristine);
    } catch {
      pristineSig = "__unserialisable_pristine__";
    }
    return (s) => {
      let sig: string;
      try {
        sig = JSON.stringify(s);
      } catch {
        return true; // can't compare — trust caller's state
      }
      return sig !== pristineSig;
    };
  }
  return () => true;
}

export function useFormDraft<T>({
  storageKey,
  state,
  pristineState,
  isMeaningful,
  ttlMs = 30 * 24 * 60 * 60 * 1000,
  debounceMs = 500,
  enabled = true,
}: UseFormDraftOpts<T>): UseFormDraftResult<T> {
  // Build the effective meaningfulness predicate once per render. The
  // helper is pure given (isMeaningful, pristineState) so we don't need
  // memoisation — calls are cheap.
  const effectiveIsMeaningful = buildIsMeaningful(isMeaningful, pristineState);
  const fullKey = `${KEY_PREFIX}${storageKey}:v${SCHEMA_VERSION}`;

  // Read the stored draft for the current full key. Pure; called on
  // mount AND on every storageKey change so consumers like the
  // bundled-services + resources cards (which swap between
  // create / edit-<id> keys as the user moves around) get a fresh
  // banner pointed at the new key.
  const readStored = (k: string): StoredDraft<T> | null => {
    if (!isBrowser()) return null;
    try {
      const raw = window.localStorage.getItem(k);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredDraft<T>;
      if (!parsed || parsed.v !== SCHEMA_VERSION || typeof parsed.updatedAt !== "number") return null;
      if (Date.now() - parsed.updatedAt > ttlMs) {
        try { window.localStorage.removeItem(k); } catch {}
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  // One-shot read on mount. useState lazy initialiser keeps it from
  // re-reading on every render.
  const [storedDraft, setStoredDraft] = useState<StoredDraft<T> | null>(() => readStored(fullKey));

  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingState = useRef<T | null>(null);
  const lastSig = useRef<string>("");

  // Re-read when storageKey changes — consumers may swap keys as the
  // user navigates (e.g. clicks Edit on a different record). Skip the
  // very first run because the lazy initialiser already loaded it.
  const firstStoredRunRef = useRef(true);
  useEffect(() => {
    if (firstStoredRunRef.current) {
      firstStoredRunRef.current = false;
      return;
    }
    setStoredDraft(readStored(fullKey));
    // Reset the last-signature cache so the next state change definitely
    // triggers a save under the new key.
    lastSig.current = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  // Stable refs for the meaningfulness check and storage key so the flush
  // callback never goes stale and doesn't force its consumers to rebuild
  // their state every render.
  const isMeaningfulRef = useRef(effectiveIsMeaningful);
  isMeaningfulRef.current = effectiveIsMeaningful;
  const fullKeyRef = useRef(fullKey);
  fullKeyRef.current = fullKey;

  const flush = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    const s = pendingState.current;
    if (s === null || s === undefined) return;
    if (!isMeaningfulRef.current(s)) return; // refuse the empty-overwrite
    if (!isBrowser()) return;
    const record: StoredDraft<T> = {
      v: SCHEMA_VERSION,
      updatedAt: Date.now(),
      state: s,
    };
    try {
      window.localStorage.setItem(fullKeyRef.current, JSON.stringify(record));
      setLastSavedAt(new Date());
    } catch {
      // Quota / private browsing — silent.
    }
  }, []);

  // Queue a debounced commit whenever state actually changes. The JSON
  // signature deduplication means an unchanged state on a re-render
  // doesn't reset the timer.
  useEffect(() => {
    if (!enabled) return;
    let sig: string;
    try {
      sig = JSON.stringify(state);
    } catch {
      // Non-serialisable values — treat as always-changing. Caller should
      // fix their state shape, but don't crash.
      sig = String(Date.now()) + Math.random();
    }
    if (sig === lastSig.current) return;
    lastSig.current = sig;
    pendingState.current = state;
    setSaving(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      flush();
      setSaving(false);
    }, debounceMs);
    return () => {
      // Note: don't clearTimeout in cleanup — we want the queued flush to
      // still happen even after a re-render. The next effect run will
      // clear-and-reschedule if state changed again.
    };
  }, [enabled, state, flush, debounceMs]);

  // beforeunload + pagehide + visibilitychange — best-effort sync flush
  // when the page is about to go away.
  useEffect(() => {
    if (!isBrowser()) return;
    const onLeave = () => flush();
    window.addEventListener("beforeunload", onLeave);
    window.addEventListener("pagehide", onLeave);
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      window.removeEventListener("pagehide", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [flush]);

  const discard = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    pendingState.current = null;
    lastSig.current = "";
    if (isBrowser()) {
      try { window.localStorage.removeItem(fullKeyRef.current); } catch {}
    }
    setStoredDraft(null);
    setLastSavedAt(null);
  }, []);

  return {
    lastSavedAt,
    saving,
    storedDraft,
    hasResumableDraft: !!storedDraft,
    discard,
  };
}
