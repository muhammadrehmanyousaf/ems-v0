"use client"

/**
 * SETUP-027 - the shell-level "you have unsaved changes - leave?" prompt, plus
 * the hook a screen uses to report that it has some.
 *
 * `useDirtyRegistry(id, dirty)` registers while `dirty` is true and ALWAYS
 * unregisters on unmount, so a screen that unmounts without saving cannot leave
 * the flag set and trap the vendor. While dirty it also routes same-origin
 * anchor clicks through the guard (capture phase), so in-page and rail links get
 * the prompt without each one being rewritten.
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { useDirtyGuard } from "@/lib/store/dirty-guard"
import { ConfirmRemove } from "@/components/dashboard/shared/confirm-remove"

export function useDirtyRegistry(id: string, dirty: boolean) {
  const router = useRouter()
  const setDirty = useDirtyGuard((s) => s.setDirty)
  const guard = useDirtyGuard((s) => s.guard)

  React.useEffect(() => {
    setDirty(id, dirty)
  }, [id, dirty, setDirty])
  React.useEffect(() => () => setDirty(id, false), [id, setDirty])

  React.useEffect(() => {
    if (!dirty) return
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return
      let url: URL
      try { url = new URL(a.href, window.location.href) } catch { return }
      if (url.origin !== window.location.origin) return
      // Same page (hash or identical path+query) is not leaving.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      e.preventDefault()
      e.stopPropagation()
      guard(() => router.push(url.pathname + url.search + url.hash))
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [dirty, guard, router])
}

/** Mounted once in the shell. Renders nothing unless a navigation is parked. */
export function LeaveGuardDialog() {
  const pending = useDirtyGuard((s) => s.pending)
  const confirm = useDirtyGuard((s) => s.confirmPending)
  const cancel = useDirtyGuard((s) => s.cancelPending)
  return (
    <ConfirmRemove
      open={pending !== null}
      title="You have unsaved changes"
      description="If you leave this page now, what you typed and have not saved will be lost."
      confirmLabel="Leave without saving"
      cancelLabel="Stay here"
      onCancel={cancel}
      onConfirm={confirm}
    />
  )
}
