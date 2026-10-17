"use client"

/**
 * A "are you sure" for the Settings hub deletes that fired on one click
 * (SETUP-006): removing a menu or a payout account. The sibling screens already
 * protect the same kind of record (Package remove has Undo, the packages
 * artifact has openConfirm); these two were bare `mutate()` calls.
 *
 * Uses the app's existing AlertDialog, no new visual language. The caller owns
 * the pending target in state and renders this once.
 */

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

export function ConfirmRemove({
  open,
  title,
  description,
  confirmLabel = "Remove",
  cancelLabel = "Keep it",
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <AlertDialogContent data-testid="confirm-remove">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmRemove
