import { create } from "zustand"

/**
 * Unsaved-changes registry for the console shell (SETUP-027).
 *
 * Settings tracked its own `dirty` flag and used it for exactly two things:
 * the browser's beforeunload prompt and the business-tab switch (via a native
 * window.confirm). Clicking any sidebar entry navigated away and the typed
 * values were gone, with no prompt at all.
 *
 * A screen registers "I have unsaved edits" under a source id; navigation doors
 * (the sidebar, in-page links) call `guard(run)`. If anything is dirty the run
 * is parked as `pending` and the shell's LeaveGuardDialog asks first; confirming
 * clears the registry and runs it. A screen MUST unregister on unmount and on
 * save (useDirtyRegistry does both), so the flag cannot trap the vendor.
 */
interface DirtyGuardState {
  sources: Record<string, true>
  pending: { run: () => void } | null
  setDirty: (id: string, dirty: boolean) => void
  /** Run now if nothing is dirty, else park it for the dialog. Returns true when it ran. */
  guard: (run: () => void) => boolean
  confirmPending: () => void
  cancelPending: () => void
}

export const useDirtyGuard = create<DirtyGuardState>((set, get) => ({
  sources: {},
  pending: null,
  setDirty: (id, dirty) =>
    set((s) => {
      const has = !!s.sources[id]
      if (has === dirty) return s
      const next = { ...s.sources }
      if (dirty) next[id] = true
      else delete next[id]
      return { sources: next }
    }),
  guard: (run) => {
    if (Object.keys(get().sources).length === 0) {
      run()
      return true
    }
    set({ pending: { run } })
    return false
  },
  confirmPending: () => {
    const p = get().pending
    set({ pending: null, sources: {} })
    p?.run()
  },
  cancelPending: () => set({ pending: null }),
}))

export const isAnythingDirty = () => Object.keys(useDirtyGuard.getState().sources).length > 0
