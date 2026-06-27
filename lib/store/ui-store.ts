import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Density = "comfortable" | "compact"

interface UiState {
  /** Command palette open state (ephemeral). */
  commandOpen: boolean
  setCommandOpen: (open: boolean) => void
  toggleCommand: () => void
  /** Table row density (persisted). */
  density: Density
  setDensity: (d: Density) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      commandOpen: false,
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
      density: "comfortable",
      setDensity: (density) => set({ density }),
    }),
    {
      name: "ww-ui-prefs",
      // only persist density; command-open is ephemeral
      partialize: (s) => ({ density: s.density }),
    },
  ),
)
