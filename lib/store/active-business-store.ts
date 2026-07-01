import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

/**
 * Active-venue scope for the vendor dashboard.
 *
 * A vendor can own several businesses (venues). `activeBusinessId` is the one
 * currently in focus; `null` means "All venues" (the combined roll-up — the
 * historical default). The value is persisted to localStorage so the choice
 * survives reloads, and the TeamSwitcher writes to it. Dashboard data hooks
 * read `activeBusinessId`, put it in their query key, and forward it to the API
 * as `?businessId=` so the whole surface re-scopes when the vendor switches.
 *
 * Additive + safe: when `activeBusinessId` is null, every consumer behaves
 * exactly as before (no businessId param → backend returns the combined view).
 */
interface ActiveBusinessState {
  activeBusinessId: number | null
  setActiveBusinessId: (id: number | null) => void
}

export const useActiveBusinessStore = create<ActiveBusinessState>()(
  persist(
    (set) => ({
      activeBusinessId: null,
      setActiveBusinessId: (id) => set({ activeBusinessId: id }),
    }),
    {
      name: "ww-active-business",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/** Convenience selector hook — returns just the current active venue id. */
export const useActiveBusinessId = (): number | null =>
  useActiveBusinessStore((s) => s.activeBusinessId)
