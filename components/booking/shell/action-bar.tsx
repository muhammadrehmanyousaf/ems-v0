"use client"

/**
 * Back · reassurance · Continue. Always on screen.
 *
 * On the desk tiers this is a flex child at the bottom of the desk column —
 * never sticky, never fixed, so no ancestor's overflow can strand it. On a
 * phone the shell's CSS pins it to the bottom of the viewport above the safe
 * area. The label says what the button will do ("Continue to packages",
 * "Send request · Rs 76,000 advance") and, when it cannot, why ("Pick a date
 * to continue"), so a disabled button is never a mystery.
 */

import { ArrowLeft, ArrowRight } from "lucide-react"
import { BridalButton } from "@/components/bridal/bridal-button"
import type { ShellTier } from "./booking-shell-context"

interface ActionBarProps {
  tier: ShellTier
  backVisible: boolean
  onBack: () => void
  continueLabel: string
  continueDisabled: boolean
  /** Spoken to assistive tech when disabled (the label already shows it). */
  disabledReason?: string | null
  onContinue: () => void
  submitting: boolean
  submittingLine?: string
  reassurance?: string
  /** The legal sentence on the review step. */
  legal?: string
}

export default function ActionBar({
  tier,
  backVisible,
  onBack,
  continueLabel,
  continueDisabled,
  disabledReason,
  onContinue,
  submitting,
  submittingLine,
  reassurance,
  legal,
}: ActionBarProps) {
  const phone = tier !== "desk"
  const disabled = continueDisabled && !submitting

  const continueBtn = (
    <BridalButton
      type="button"
      variant={disabled ? "outline" : "primary"}
      size="md"
      onClick={onContinue}
      loading={submitting}
      disabled={disabled}
      aria-describedby={disabled && disabledReason ? "bk-continue-reason" : undefined}
      data-booking-action="continue"
      className={`transition-colors duration-200 ${phone ? "h-12 flex-1" : "h-12 min-w-[220px]"} ${
        disabled ? "!opacity-100 text-bridal-text-soft border-bridal-beige bg-bridal-cream" : ""
      }`}
    >
      {submitting ? "Sending…" : continueLabel}
      {!submitting && !disabled && <ArrowRight className="h-3.5 w-3.5" aria-hidden />}
    </BridalButton>
  )

  if (phone) {
    return (
      <div className="booking-action-bar border-t border-bridal-beige bg-bridal-ivory/95 backdrop-blur-sm">
        {submitting && submittingLine && (
          <p className="px-4 pt-2 text-center font-bridal text-[12px] text-bridal-text-soft" aria-live="polite">
            {submittingLine}
          </p>
        )}
        <div className="flex h-[72px] items-center gap-3 px-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            data-booking-action="back"
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-bridal-beige bg-white text-bridal-charcoal transition-colors hover:border-bridal-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 ${
              backVisible ? "" : "invisible"
            }`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
          {continueBtn}
        </div>
        {disabled && disabledReason && (
          <span id="bk-continue-reason" className="sr-only">
            {disabledReason}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="booking-action-bar shrink-0 border-t border-bridal-beige bg-bridal-ivory/95 backdrop-blur-sm">
      {legal && (
        <p className="px-10 pt-3 font-bridal text-[11.5px] leading-[16px] text-bridal-text-soft large:px-14">{legal}</p>
      )}
      {submitting && submittingLine && (
        <p className="px-10 pt-3 font-bridal text-[12px] text-bridal-text-soft large:px-14" aria-live="polite">
          {submittingLine}
        </p>
      )}
      <div className="flex h-[var(--bk-action-bar)] items-center justify-between gap-6 px-10 large:px-14">
        <BridalButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          data-booking-action="back"
          className={`h-11 ${backVisible ? "" : "invisible"}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back
        </BridalButton>

        {reassurance && (
          <p className="hidden min-w-0 flex-1 text-center font-bridal text-[12px] leading-[16px] text-[#3F6B43] line-clamp-2 xl:block">
            {reassurance}
          </p>
        )}

        {continueBtn}
        {disabled && disabledReason && (
          <span id="bk-continue-reason" className="sr-only">
            {disabledReason}
          </span>
        )}
      </div>
    </div>
  )
}
