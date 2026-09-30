"use client"

/**
 * Leaving a booking in progress is a decision, not a misclick.
 *
 * The wordmark, the back-to-venue chip and the close button all route through
 * this: a dialog while there is something to lose, a plain navigation when
 * there is not. `useBeforeUnload` covers the browser's own close/refresh.
 */

import { useEffect } from "react"
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

export function useBeforeUnload(active: boolean) {
  useEffect(() => {
    if (!active) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [active])
}

interface LeaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeave: () => void
  signedIn: boolean
}

export default function LeaveDialog({ open, onOpenChange, onLeave, signedIn }: LeaveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-bridal-beige bg-bridal-ivory">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display italic text-[24px] font-normal leading-tight text-bridal-charcoal">
            Leave your booking?
          </AlertDialogTitle>
          <AlertDialogDescription className="font-bridal text-[14px] leading-[20px] text-bridal-text-soft">
            {signedIn
              ? "Your choices are saved as a draft — you can pick up where you left off."
              : "Your choices will be lost."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 rounded-[4px] border-bridal-beige bg-bridal-cream font-bridal text-[12px] font-medium uppercase tracking-[0.18em] text-bridal-charcoal hover:border-bridal-gold hover:bg-bridal-cream">
            Stay
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onLeave}
            className="h-11 rounded-[4px] bg-bridal-gold font-bridal text-[12px] font-medium uppercase tracking-[0.18em] text-bridal-charcoal hover:bg-bridal-gold-dark hover:text-bridal-ivory"
          >
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
