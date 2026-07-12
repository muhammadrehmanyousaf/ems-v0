"use client"

import { Badge } from "@/components/ui/badge"
import { quoteStatusLabel, type QuoteStatus } from "@/lib/api/quotes"
import { cn } from "@/lib/utils"

const TONE: Record<QuoteStatus, string> = {
  inquiry: "bg-amber-100 text-amber-800 border-amber-200",
  quoted: "bg-blue-100 text-blue-800 border-blue-200",
  countered: "bg-violet-100 text-violet-800 border-violet-200",
  accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  declined: "bg-gray-100 text-gray-600 border-gray-200",
}

export function QuoteStatusBadge({ status, className }: { status: QuoteStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", TONE[status], className)}>
      {quoteStatusLabel(status)}
    </Badge>
  )
}

export default QuoteStatusBadge
