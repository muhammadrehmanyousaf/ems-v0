"use client";

/**
 * Leads surface with a view toggle (§M6): Inbox (the existing list) or
 * Pipeline (the new Kanban funnel). State lives in the URL (?view=
 * pipeline) so a vendor can bookmark their preferred view — same
 * pattern as the bookings Table/Pipeline toggle.
 */

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Inbox, LayoutGrid } from "lucide-react";
import LeadsInboxView from "./leads-inbox-view";
import LeadsPipelineView from "./leads-pipeline-view";

export default function LeadsView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const view = searchParams?.get("view") === "pipeline" ? "pipeline" : "inbox";

  const setView = (next: "inbox" | "pipeline") => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (next === "pipeline") params.set("view", "pipeline");
    else params.delete("view");
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="inline-flex items-center rounded-md border bg-muted p-0.5 text-xs">
          <Button type="button" size="sm" variant={view === "inbox" ? "default" : "ghost"}
            className="h-7 px-2.5 gap-1.5" onClick={() => setView("inbox")}>
            <Inbox className="h-3.5 w-3.5" /> Inbox
          </Button>
          <Button type="button" size="sm" variant={view === "pipeline" ? "default" : "ghost"}
            className="h-7 px-2.5 gap-1.5" onClick={() => setView("pipeline")}>
            <LayoutGrid className="h-3.5 w-3.5" /> Pipeline
          </Button>
        </div>
      </div>
      {view === "pipeline" ? <LeadsPipelineView /> : <LeadsInboxView />}
    </div>
  );
}
