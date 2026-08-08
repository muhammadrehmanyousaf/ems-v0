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
import { useSearchParams } from "next/navigation"
import { ReceivablesRedesignedView } from "@/components/dashboard/mainScreens/receivables/redesigned/receivables-redesigned-view"
import { PaymentsRedesignedView } from "@/components/dashboard/mainScreens/payments/redesigned/payments-redesigned-view"
import { ReceiptsRedesignedView } from "@/components/dashboard/mainScreens/receipts/redesigned/receipts-redesigned-view"
import { PdcsRedesignedView } from "@/components/dashboard/mainScreens/pdcs/redesigned/pdcs-redesigned-view"
import { ExpensesRedesignedView } from "@/components/dashboard/mainScreens/expenses/redesigned/expenses-redesigned-view"
import { useNavPersona } from "@/lib/nav/nav-persona"

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
  const { persona } = useNavPersona()

  const raw = search?.get("tab")
  const active: TabKey = TABS.some((t) => t.key === raw) ? (raw as TabKey) : "receivables"


  return (
    <div className="space-y-4">
      {/* The tab row that used to be here is gone.
          
          Measured on production at 1538x732: it was 70px tall with a 40px gap
          under it, and it listed Receivables / Payments / Receipts / Cheques /
          Expenses — the SAME five destinations, in the same order, that the
          module panel two inches to its left was already showing under MONEY IN
          / MONEY OUT / RECORDS. Two navigations for one set of screens, one of
          them charging 110px of the content area for the privilege.

          The panel wins on every count: it is always on screen, it groups the
          five semantically instead of listing them flat, and it costs the
          content area nothing. NN/g's rule against tabs is about hiding content
          behind a toggle when the grouping is not real; here the grouping is
          real and the panel already expresses it.

          `?tab=` is UNCHANGED and still the source of truth, so every bookmark,
          every link sent to an accountant, and every panel row keeps working.
          Only the duplicate control is gone.

          On this screen that moved the first row of the receivables ledger from
          y=696 (a 36px sliver on a 732px window) up by 110px, before the header
          and aging changes below. */}

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
