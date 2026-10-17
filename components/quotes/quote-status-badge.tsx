"use client"

import { Badge } from "@/components/ui/badge"
import { quoteStatusLabel, type QuoteStatus } from "@/lib/api/quotes"
import { cn } from "@/lib/utils"
import { STATUS_CHIP } from "@/components/ui/status-tones"

const TONE: Record<QuoteStatus, string> = {
  // The shared semantic set (components/ui/status-tones.ts): waiting = stone, the vendor's
  // quote = mauve, a counter-offer that needs an answer = gold, accepted = sage, declined = coral.
  inquiry: STATUS_CHIP.neutral,
  quoted: STATUS_CHIP.info,
  countered: STATUS_CHIP.warning,
  accepted: STATUS_CHIP.success,
  declined: STATUS_CHIP.danger,
}

export function QuoteStatusBadge({ status, className }: { status: QuoteStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", TONE[status], className)}>
      {quoteStatusLabel(status)}
    </Badge>
  )
}

export default QuoteStatusBadge
