"use client"

/**
 * The phone's ledger: a bottom drawer with the venue's photograph, the same
 * rows the Stage shows on the desk, and the money. It opens from the header
 * pill, and once — automatically — on arrival at the review step, so the
 * breakdown is never hidden on the last screen.
 */

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Star } from "lucide-react"
import type { EventVenue } from "@/lib/types"
import { pickStageImage } from "@/lib/booking/stage-image"
import { useStagePhoto } from "./booking-stage"
import { LedgerRows, MoneyBlock, type LedgerRow, type MoneyState } from "./booking-ledger"

interface LedgerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venue: EventVenue | null
  rows: LedgerRow[]
  money: MoneyState | null
  locked: boolean
  onJump: (stepKey: string) => void
  extraRows?: { label: string; value: string }[]
  legal?: string
}

export default function LedgerSheet({ open, onOpenChange, venue, rows, money, locked, onJump, extraRows = [], legal }: LedgerSheetProps) {
  const v = venue as any
  const photo = useStagePhoto(pickStageImage(v?.images), 780, 280)
  const where = [v?.subArea, v?.city].filter(Boolean).join(", ")
  const rating = Number(v?.rating) > 0 ? Number(v.rating).toFixed(1) : null

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80dvh] border-bridal-charcoal bg-bridal-charcoal text-bridal-ivory">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Your booking</DrawerTitle>
          <DrawerDescription>What you have chosen so far and what it costs</DrawerDescription>
        </DrawerHeader>
        <div className="bridal-scroll min-h-0 flex-1 overflow-y-auto">
          <div className="relative h-[140px] bg-bridal-charcoal">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-full w-full object-cover animate-fade-in" />
            )}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-16" style={{ backgroundImage: "linear-gradient(to bottom, rgba(44,24,16,0), rgba(44,24,16,1))" }} />
          </div>
          <div className="px-5 pb-6">
            <p className="font-display italic text-[22px] leading-[26px] text-bridal-ivory">{venue?.name}</p>
            <p className="mt-1 flex items-center gap-2 font-bridal text-[12px] text-bridal-ivory/75">
              {rating && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-bridal-gold text-bridal-gold" aria-hidden /> {rating}
                </span>
              )}
              {where && <span>{where}</span>}
            </p>
            <div className="mt-4">
              <LedgerRows rows={rows} onJump={(k) => { onOpenChange(false); onJump(k) }} locked={locked} variant="sheet" />
              {extraRows.map((r) => (
                <div key={r.label} className="flex h-12 items-center justify-between gap-4 border-t border-bridal-ivory/10">
                  <span className="font-bridal text-[11px] font-medium uppercase tracking-[0.18em] text-bridal-gold">{r.label}</span>
                  <span className="min-w-0 truncate font-bridal text-[13px] text-bridal-ivory/85">{r.value}</span>
                </div>
              ))}
            </div>
            {money && <MoneyBlock money={money} />}
            {legal && <p className="mt-4 font-bridal text-[11.5px] leading-[16px] text-bridal-ivory/60">{legal}</p>}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mt-5 h-11 w-full rounded-[4px] border border-bridal-ivory/25 font-bridal text-[12px] font-medium uppercase tracking-[0.18em] text-bridal-ivory transition-colors hover:bg-bridal-ivory/10"
            >
              Close
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
