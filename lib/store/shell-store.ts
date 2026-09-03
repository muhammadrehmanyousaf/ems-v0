import { create } from "zustand"

/**
 * Bridge between an artifact screen (shadow-DOM) and the persistent React
 * champagne shell (Phase 2). Each screen's useArtifactShell pushes its crumb +
 * active-route here on mount; the persistent <PersistentChampagneShell> reads it
 * to render the sidebar highlight + top-bar breadcrumb — WITHOUT the screen code
 * changing. This is what lets the shell stay mounted across route changes (no
 * per-route rebuild flash) while the content swaps underneath.
 */
export interface ShellChrome {
  activeHref: string
  crumbBold: string
  crumbSub: string
}
interface ShellState extends ShellChrome {
  setChrome: (c: Partial<ShellChrome>) => void
}
export const useShellStore = create<ShellState>((set) => ({
  activeHref: "/dashboard",
  crumbBold: "Dashboard",
  crumbSub: "",
  setChrome: (c) => set((s) => ({ ...s, ...c })),
}))
