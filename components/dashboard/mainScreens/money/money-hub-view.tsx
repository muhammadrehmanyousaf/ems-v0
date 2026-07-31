"use client"

/**
 * Money — one destination, five tabs.
 *
 * The founder's complaint, verbatim: "the modules which sound redundant should
 * be merged in each other" and "user has to go back to other modules to perform
 * a job for same user".
 *
 * The sidebar carried FIVE separate money destinations — Payments, Receivables,
 * Receipts, Cheque ledger, Expenses. They are not five jobs. They are five views
 * of one question: where is my money. A vendor chasing an unpaid balance had to
 * leave Receivables to check whether a receipt was logged, leave again to see if
 * a cheque was banked, and leave a third time to see what the event cost —
 * losing their place each time.
 *
 * One rail entry, five tabs, one URL. Every panel is the EXISTING screen,
 * unchanged and still reachable at its own route — this composes, it does not
 * rewrite. Deep links keep working; bookmarks keep working.
 *
 * Order is deliberate and follows the money, not the alphabet:
 *   Receivables → what I am owed (the only tab that is a to-do list)
 *   Payments    → what came in
 *   Receipts    → proof of what came in
 *   Cheques     → what is promised but not yet cleared
 *   Expenses    → what went out
 */

import * as React from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { ReceivablesRedesignedView } from "@/components/dashboard/mainScreens/receivables/redesigned/receivables-redesigned-view"
import { PaymentsRedesignedView } from "@/components/dashboard/mainScreens/payments/redesigned/payments-redesigned-view"
import { ReceiptsRedesignedView } from "@/components/dashboard/mainScreens/receipts/redesigned/receipts-redesigned-view"
import { PdcsRedesignedView } from "@/components/dashboard/mainScreens/pdcs/redesigned/pdcs-redesigned-view"
import { ExpensesRedesignedView } from "@/components/dashboard/mainScreens/expenses/redesigned/expenses-redesigned-view"
import { useNavPersona } from "@/lib/nav/nav-persona"
import { cn } from "@/lib/utils"

type TabKey = "receivables" | "payments" | "receipts" | "cheques" | "expenses"

/**
 * Labels follow the same two registers as the sidebar: Aasaan (plain
 * Roman-Urdu) for an owner who has never used software like this, Professional
 * for one who has. The hint under each tab is the question it answers, in
 * words a marquee owner uses.
 */
const TABS: Array<{ key: TabKey; simple: string; pro: string; hint: string }> = [
  { key: "receivables", simple: "Baqaya", pro: "Receivables", hint: "Who still owes me?" },
  { key: "payments", simple: "Aya Paisa", pro: "Payments", hint: "What came in?" },
  { key: "receipts", simple: "Raseed", pro: "Receipts", hint: "Proof of what came in" },
  { key: "cheques", simple: "Cheque", pro: "Cheques", hint: "Promised, not yet cleared" },
  { key: "expenses", simple: "Kharcha", pro: "Expenses", hint: "What went out?" },
]

export function MoneyHubView() {
  const search = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { persona } = useNavPersona()

  const raw = search?.get("tab")
  const active: TabKey = TABS.some((t) => t.key === raw) ? (raw as TabKey) : "receivables"

  // Tab lives in the URL so a vendor can bookmark "Money → Cheques", refresh
  // without losing their place, and send the link to their accountant.
  const setTab = (key: TabKey) => {
    const params = new URLSearchParams(search?.toString() ?? "")
    params.set("tab", key)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Money"
        className="flex flex-wrap gap-1 border-b border-border px-4 pt-4 md:px-6"
      >
        {TABS.map((t) => {
          const isActive = t.key === active
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setTab(t.key)}
              className={cn(
                "-mb-px rounded-t-md border-b-2 px-3 py-2 text-left transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="block text-sm font-medium">
                {persona === "professional" ? t.pro : t.simple}
              </span>
              <span className="block text-[11px] text-muted-foreground">{t.hint}</span>
            </button>
          )
        })}
      </div>

      {/* The existing screens, untouched. Only one mounts at a time, so this
          costs no more to render than the single page it replaces. */}
      {active === "receivables" && <ReceivablesRedesignedView />}
      {active === "payments" && <PaymentsRedesignedView />}
      {active === "receipts" && <ReceiptsRedesignedView />}
      {active === "cheques" && <PdcsRedesignedView />}
      {active === "expenses" && <ExpensesRedesignedView />}
    </div>
  )
}

export default MoneyHubView
