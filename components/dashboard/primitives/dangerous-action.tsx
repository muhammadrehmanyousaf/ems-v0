"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button, type ButtonProps } from "@/components/ui/button"

/**
 * F5 / WWL-209, 411, 432, 451, 453, 491, 493, 507, 510, 558, 583, 589, 595,
 * 597, 602, 604, 609 — an irreversible action, one click from a browsing
 * vendor, with no confirmation and often no undo.
 *
 * The list the sweep found includes: post rent to the ledger · post
 * depreciation · open the cash drawer · raise a purchase order · accept a GRN ·
 * **close and lock the month's books** · hold a date on a real calendar ·
 * decline a live customer's quote · mark a business registered with a regulator.
 * Several were the third button in a row of three, styled identically to the two
 * harmless ones beside them.
 *
 * `DangerousAction` wraps the trigger so the click opens a confirm first. It
 * deliberately makes the caller state, in the vendor's own terms:
 *
 *   - `title`       what is about to happen
 *   - `consequence` what it costs and whether it can be undone
 *   - `confirmLabel` a verb, not "OK"
 *
 * For the truly irreversible (period close, journal posting), pass
 * `requireTyped` and the vendor must type the word before the confirm enables.
 */
export interface DangerousActionProps {
  /** The button that would have fired the action directly. */
  children: React.ReactElement
  title: string
  /** What it costs. Say plainly whether it can be undone. */
  consequence: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  /** Word the vendor must type to enable the confirm. Use for the unundoable. */
  requireTyped?: string
  /** Disable opening entirely (e.g. mutation already in flight). */
  disabled?: boolean
  confirmVariant?: ButtonProps["variant"]
}

export function DangerousAction({
  children,
  title,
  consequence,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  requireTyped,
  disabled,
  confirmVariant = "destructive",
}: DangerousActionProps) {
  const [open, setOpen] = React.useState(false)
  const [typed, setTyped] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (!open) setTyped("")
  }, [open])

  const gateOk = !requireTyped || typed.trim().toLowerCase() === requireTyped.trim().toLowerCase()

  const trigger = React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) setOpen(true)
    },
    disabled: disabled ?? children.props.disabled,
  })

  const run = async () => {
    if (!gateOk || busy) return
    setBusy(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {trigger}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <div>{consequence}</div>
                {requireTyped && (
                  <div className="space-y-1.5">
                    <label htmlFor="dangerous-action-confirm" className="block font-medium text-foreground">
                      Type <span className="font-mono">{requireTyped}</span> to confirm
                    </label>
                    <input
                      id="dangerous-action-confirm"
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      autoComplete="off"
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant={confirmVariant} disabled={!gateOk || busy} onClick={run}>
                {busy ? "Working…" : confirmLabel}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default DangerousAction
