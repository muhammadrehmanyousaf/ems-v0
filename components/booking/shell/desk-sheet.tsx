"use client"

/**
 * A disclosure surface for a step's secondary fields.
 *
 * On the desk tiers it is a right-hand sheet the width of a comfortable form
 * (480px) that slides over the desk; on a phone it is a bottom drawer. The
 * step renders it inside its own tree — `<DeskSheet open …>{fields}</DeskSheet>`
 * — so the fields re-render with live form state exactly as they would inline.
 * Nothing is stored in the shell; the step owns `open`.
 *
 * Used for the service-location picker (four modes + address + notes) on the
 * date step and for a vendor's package picker on the vendors step: the things
 * that matter but must not sit between the customer and the calendar.
 */

import type { ReactNode } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { BridalButton } from "@/components/bridal/bridal-button"
import { useBookingShell } from "./booking-shell-context"

interface DeskSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** Replaces the default "Done" button. */
  footer?: ReactNode
  /** Label for the default footer button. Default "Done". */
  doneLabel?: string
  children: ReactNode
}

export default function DeskSheet({
  open,
  onOpenChange,
  title,
  description,
  footer,
  doneLabel = "Done",
  children,
}: DeskSheetProps) {
  const { tier } = useBookingShell()

  const defaultFooter = (
    <BridalButton type="button" variant="primary" size="md" block onClick={() => onOpenChange(false)}>
      {doneLabel}
    </BridalButton>
  )

  if (tier === "phone") {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[80dvh] border-bridal-beige bg-bridal-ivory">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-display italic text-[22px] font-normal leading-tight text-bridal-charcoal">
              {title}
            </DrawerTitle>
            {description ? (
              <DrawerDescription className="font-bridal text-[13px] text-bridal-text-soft">{description}</DrawerDescription>
            ) : (
              <DrawerDescription className="sr-only">{title}</DrawerDescription>
            )}
          </DrawerHeader>
          <div className="bridal-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-2">{children}</div>
          <DrawerFooter className="border-t border-bridal-beige pb-[max(16px,env(safe-area-inset-bottom))]">
            {footer ?? defaultFooter}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[480px] max-w-[92vw] flex-col gap-0 border-l border-bridal-beige bg-bridal-ivory p-0 sm:max-w-[480px]"
      >
        <SheetHeader className="space-y-1 border-b border-bridal-beige px-6 py-5 text-left">
          <SheetTitle className="font-display italic text-[24px] font-normal leading-tight text-bridal-charcoal">
            {title}
          </SheetTitle>
          {description ? (
            <SheetDescription className="font-bridal text-[13px] text-bridal-text-soft">{description}</SheetDescription>
          ) : (
            <SheetDescription className="sr-only">{title}</SheetDescription>
          )}
        </SheetHeader>
        <div className="bridal-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        <SheetFooter className="border-t border-bridal-beige px-6 py-4 sm:justify-stretch">
          {footer ?? defaultFooter}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
