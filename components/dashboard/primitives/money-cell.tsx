import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * MoneyCell — the universal money atom. PKR, tabular numerals (so columns align
 * to the digit), right-aligned by default. Optional tone tints owed/overdue.
 */
export interface MoneyCellProps {
  /** Amount in rupees (integer/float). null/undefined → em dash. */
  amount?: number | null
  /** Tone tints the value: owed→warning, overdue→error, paid→success. */
  tone?: "default" | "muted" | "success" | "warning" | "error"
  /** Show "Rs" prefix. Default true. */
  prefix?: boolean
  align?: "left" | "right"
  className?: string
}

const TONE: Record<NonNullable<MoneyCellProps["tone"]>, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  error: "text-red-600 dark:text-red-400",
}

export function formatPkr(amount: number, prefix = true): string {
  return (prefix ? "Rs " : "") + amount.toLocaleString("en-PK")
}

export function MoneyCell({
  amount,
  tone = "default",
  prefix = true,
  align = "right",
  className,
}: MoneyCellProps) {
  return (
    <span
      className={cn(
        "tabular-nums",
        align === "right" ? "text-right" : "text-left",
        TONE[tone],
        className,
      )}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {amount === null || amount === undefined ? "—" : formatPkr(amount, prefix)}
    </span>
  )
}

export default MoneyCell
