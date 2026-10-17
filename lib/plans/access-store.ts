import { create } from "zustand"
import { isLockedState, lockFromError, type Access } from "./access"

/**
 * The access store: the ONE place the portal keeps "may this viewer use the console, and if not why".
 *
 * Two things feed it and nothing else does:
 *   - applyStatus(): the `access` object of GET /subscriptions/status (the status query in components/dashboard/plans).
 *   - applyLock():   a 402 SUBSCRIPTION_REQUIRED from ANY request (lib/axiosConfig.js), which is the only signal a staff
 *                    member ever gets (staff have no /status) and the safety net for a stale tab.
 *
 * Everything that gates (the Wall, the banners, the chip, the billing page) reads this store through useAccess().
 * No screen keeps its own lock rule.
 */

/** A status that says "open" right after a request said "locked" is a stale cache, not an unlock: ignore it this long. */
const STALE_OPEN_MS = 15_000

interface AccessStore {
  access: Access | null
  /** When the current lock was learnt from a 402 (ms), 0 if it came from /status. */
  lockedByRequestAt: number
  /** Bumped on every change so a polling hook can tell "new answer". */
  version: number
  applyStatus: (a: Access | null) => void
  applyLock: (a: Access) => void
  /** Forget a 402 lock so the console mounts and asks the server again (staff "check again"). */
  releaseLock: () => void
  reset: () => void
}

export const useAccessStore = create<AccessStore>((set, get) => ({
  access: null,
  lockedByRequestAt: 0,
  version: 0,
  applyStatus: (a) => {
    const cur = get()
    if (a === null) return // an unreadable status never changes what we know
    const openNow = !isLockedState(a.state)
    if (openNow && cur.lockedByRequestAt && Date.now() - cur.lockedByRequestAt < STALE_OPEN_MS && isLockedState(cur.access?.state)) return
    set({ access: a, lockedByRequestAt: 0, version: cur.version + 1 })
  },
  applyLock: (a) => {
    const cur = get().access
    // Keep what /status already told us about the plan (name, dates) when it is the same lock; a 402 is short on detail.
    const merged: Access = cur && isLockedState(cur.state) && !a.staff
      ? { ...cur, ...Object.fromEntries(Object.entries(a).filter(([, v]) => v !== null && v !== undefined)) } as Access
      : a
    set((s) => ({ access: { ...merged, source: "402" }, lockedByRequestAt: Date.now(), version: s.version + 1 }))
  },
  releaseLock: () => set((s) => ({ access: s.access && s.access.source === "402" ? null : s.access, lockedByRequestAt: 0, version: s.version + 1 })),
  reset: () => set((s) => ({ access: null, lockedByRequestAt: 0, version: s.version + 1 })),
}))

/**
 * The ONE place a 402 SUBSCRIPTION_REQUIRED from any HTTP client becomes state. Both axios instances (the vendor one in
 * lib/axiosConfig.js and the staff portal's) call it from their response interceptor. `staff` marks a client that only
 * staff use: it can never pay, whatever the body says. Returns the lock it recorded, or null for any other error.
 */
export function noteLock(error: unknown, opts: { staff?: boolean } = {}): Access | null {
  const lock = lockFromError(error)
  if (!lock) return null
  const a: Access = opts.staff ? { ...lock, staff: true, canPay: false } : lock
  useAccessStore.getState().applyLock(a)
  return a
}

/** Non-React read, for the axios layer and tests. */
export const accessNow = (): Access | null => useAccessStore.getState().access
