import { toast } from "sonner"

/**
 * showUndoToast — every reversible mutation should return one of these. Shows a
 * 5s toast with an Undo action; calls onUndo if the user takes it back. Built on
 * sonner (Toaster is mounted app-wide in app/layout.tsx).
 */
export function showUndoToast({
  message,
  onUndo,
  duration = 5000,
}: {
  message: string
  onUndo: () => void | Promise<void>
  duration?: number
}) {
  toast(message, {
    duration,
    action: {
      label: "Undo",
      onClick: () => {
        void onUndo()
      },
    },
  })
}

/** Optimistic-success toast (no undo) — e.g. after a confirmed save. */
export function showSuccessToast(message: string) {
  toast.success(message, { duration: 2500 })
}
