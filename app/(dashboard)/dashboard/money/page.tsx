import { Suspense } from "react";
import { MoneyHubView } from "@/components/dashboard/mainScreens/money/money-hub-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard : Money",
  description:
    "Receivables, payments, receipts, cheques and expenses — every money question in one place.",
};

/**
 * /dashboard/money?tab=receivables|payments|receipts|cheques|expenses
 *
 * Replaces five separate sidebar entries with one. The five underlying routes
 * still exist and still work — this composes them, it does not remove them, so
 * no bookmark or deep link breaks.
 */
export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <MoneyHubView />
    </Suspense>
  );
}
