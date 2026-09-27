import { Suspense } from "react";
import { KhataArtifact } from "@/components/dashboard/mainScreens/money/artifact/khata-artifact";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard : Money",
  description:
    "Receivables, payments, receipts, cheques and expenses — every money question in one place.",
};

/**
 * /dashboard/money — the Khata ledger.
 *
 * This once rendered a tabbed hub and the doc here read
 * "?tab=receivables|payments|receipts|cheques|expenses". That is no longer
 * true: the hub (money-hub-view.tsx) is not rendered by anything, and
 * KhataArtifact reads no search params — a `?tab=` on this URL is ignored.
 * The five underlying routes (/dashboard/payments, /receipts, /receivables,
 * /expenses, /pdcs) are each their own artifact screen and are what the Khata
 * panel rows point at. Kept as `Suspense` because the artifact shell suspends.
 */
export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <KhataArtifact />
    </Suspense>
  );
}
